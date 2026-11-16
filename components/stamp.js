// Rubber stamps for the food passport. Dining halls get a round stamp, spots a rectangular one,
// date night spots a double-ruled ticket. Each sits at its own slight angle, like it was stamped by hand.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

const hash = (s) => [...String(s)].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 9973, 7);
export const tiltOf = (id) => (hash(id) % 25) - 12;

const stampDate = (d) =>
  d ? d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '';

const look = (place) =>
  place.kind === 'hall'
    ? { shape: 'round', ink: colors.teal, top: 'Dining hall' }
    : place.occasion === 'date'
      ? { shape: 'ticket', ink: colors.blood, top: 'Date night' }
      : { shape: 'square', ink: colors.persimmon, top: place.cuisine || 'Eat out' };

export function PlaceStamp({ place, date, visits, size = 150, empty, campusShort }) {
  const l = look(place);
  const ink = empty ? colors.muted : l.ink;
  const round = l.shape === 'round';
  const w = round ? size : size * 1.12;
  const h = round ? size : size * 0.84;
  return (
    <View
      style={[
        { width: w, height: h, transform: [{ rotate: `${empty ? 0 : tiltOf(place.id)}deg` }] },
        empty ? { opacity: 0.5 } : { opacity: 0.9 },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.outer,
          { borderColor: ink, borderRadius: round ? size / 2 : 6 },
          empty && { borderStyle: 'dashed', borderWidth: 1.5 },
        ]}
      />
      {!empty && (
        <View
          style={[
            styles.inner,
            { borderColor: ink, borderRadius: round ? size / 2 : 3 },
            l.shape === 'ticket' && { borderStyle: 'dashed' },
          ]}
        />
      )}
      <View style={styles.body}>
        <Text style={[styles.top, { color: ink }]} numberOfLines={1}>
          {empty ? 'not yet' : l.top}
        </Text>
        <Text
          style={[styles.name, { color: ink, fontSize: size * 0.13, lineHeight: size * 0.135 }]}
          numberOfLines={3}
          adjustsFontSizeToFit
        >
          {place.name}
        </Text>
        {!empty && (
          <>
            <Text style={[styles.stars, { color: ink }]}>{'✶'.repeat(Math.min(5, Math.max(1, visits || 1)))}</Text>
            <Text style={[styles.date, { color: ink }]} numberOfLines={1}>
              {stampDate(date)}
            </Text>
            {campusShort ? (
              <Text style={[styles.date, { color: ink, opacity: 0.8 }]} numberOfLines={1}>
                {campusShort}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

// a badge: a wax-seal circle when earned, a pencilled outline with progress until then
export function BadgeSeal({ badge, size = 112 }) {
  const on = badge.earned;
  return (
    <View style={{ width: size + 24, alignItems: 'center' }}>
      <View
        style={[
          styles.seal,
          { width: size, height: size, borderRadius: size / 2 },
          on
            ? {
                backgroundColor: badge.color,
                borderColor: badge.color,
                transform: [{ rotate: `${tiltOf(badge.id) / 2}deg` }],
              }
            : { borderColor: colors.muted, borderStyle: 'dashed' },
        ]}
      >
        <View style={[styles.sealRing, { borderRadius: size / 2, borderColor: on ? colors.paper : colors.hairline }]} />
        <Text style={[styles.sealName, { color: on ? colors.paper : colors.muted }]} numberOfLines={2}>
          {badge.name}
        </Text>
        <Text style={[styles.sealCount, { color: on ? colors.lemon : colors.muted }]}>
          {on ? '✶ earned ✶' : `${badge.have} / ${badge.need}`}
        </Text>
      </View>
      <Text style={styles.sealAbout}>{badge.about}</Text>
    </View>
  );
}

// the moment after you rate: the stamp comes down hard on the page and the card jolts
export function StampSlam({ place, date, visits, campusShort, delay = 350 }) {
  const drop = useRef(new Animated.Value(0)).current;
  const jolt = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(drop, { toValue: 1, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(jolt, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(jolt, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(jolt, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={{ transform: [{ translateX: jolt.interpolate({ inputRange: [-1, 1], outputRange: [-5, 5] }) }] }}
    >
      <Animated.View
        style={{
          opacity: drop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.7, 1] }),
          transform: [
            { scale: drop.interpolate({ inputRange: [0, 1], outputRange: [2.6, 1] }) },
            { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ['-24deg', '0deg'] }) },
          ],
        }}
      >
        <PlaceStamp place={place} date={date} visits={visits} size={170} campusShort={campusShort} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { borderWidth: 3 },
  inner: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 1.2 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  top: { fontFamily: fonts.heavy, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 3 },
  name: { fontFamily: fonts.title, textAlign: 'center' },
  stars: { fontSize: 10, letterSpacing: 2, marginTop: 4 },
  date: { fontFamily: fonts.heavy, fontSize: 8.5, letterSpacing: 1.4, marginTop: 2 },
  seal: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, padding: 12 },
  sealRing: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 1.2, borderStyle: 'dashed' },
  sealName: { fontFamily: fonts.title, fontSize: 15, lineHeight: 16, textAlign: 'center' },
  sealCount: { fontFamily: fonts.heavy, fontSize: 9, letterSpacing: 1.2, marginTop: 4, textTransform: 'uppercase' },
  sealAbout: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
