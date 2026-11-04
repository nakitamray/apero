import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Sticker } from './art';
import { Pinstripes } from './ui';

// cut-outs drop onto the blue like someone's pasting a collage, then it fades away
const PIECES = [
  { name: 'sardine', size: 230, rotate: -14, top: '16%', left: -40, from: { x: -260, y: 0 } },
  { name: 'sardine', size: 200, rotate: 172, top: '68%', right: -40, from: { x: 260, y: 0 } },
  { name: 'lemon', size: 120, rotate: 12, top: '8%', right: 20, from: { x: 0, y: -300 } },
  { name: 'bloodOrange', size: 104, rotate: -8, bottom: '10%', left: 24, from: { x: -200, y: 200 } },
  { name: 'tile', size: 88, rotate: 8, top: '30%', right: 34, from: { x: 220, y: 0 } },
  { name: 'lemonSlice', size: 70, rotate: 0, bottom: '27%', right: 70, from: { x: 0, y: 260 } },
];

export default function Splash({ onDone }) {
  const land = useRef(PIECES.map(() => new Animated.Value(0))).current;
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.stagger(
        90,
        land.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.timing(word, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 10 }]} pointerEvents="none">
      <View style={styles.bg}>
        <Pinstripes />
        {PIECES.map(({ name, size, rotate, from, ...pos }, i) => (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              pos,
              {
                opacity: land[i],
                transform: [
                  { translateX: land[i].interpolate({ inputRange: [0, 1], outputRange: [from.x, 0] }) },
                  { translateY: land[i].interpolate({ inputRange: [0, 1], outputRange: [from.y, 0] }) },
                ],
              },
            ]}
          >
            <Sticker name={name} width={size} rotate={rotate} />
          </Animated.View>
        ))}
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.label,
              {
                opacity: word,
                transform: [{ scale: word.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
              },
            ]}
          >
            <View style={styles.rule} />
            <View style={styles.ruleThin} />
            <Text style={styles.word}>Apero</Text>
            <Text style={styles.sub}>rate what you ate</Text>
            <View style={styles.ruleThin} />
            <View style={styles.rule} />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.page },
  piece: { position: 'absolute' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { alignItems: 'center', paddingHorizontal: 30 },
  rule: { height: 3, alignSelf: 'stretch', backgroundColor: colors.ink },
  ruleThin: { height: 1, alignSelf: 'stretch', backgroundColor: colors.ink, marginTop: 3 },
  word: { fontFamily: fonts.title, fontSize: 88, lineHeight: 96, color: colors.deep, marginTop: 10 },
  sub: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.persimmon,
    marginBottom: 10,
  },
});
