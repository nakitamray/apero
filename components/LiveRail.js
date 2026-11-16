// Desktop only: a live column down the right, like the wire on a newsroom wall.
// Reviews as they come in, deals running today, and where people are eating. Refreshes every minute.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../context/Session';
import { activityToday, campusDeals, campusFeed } from '../lib/api';
import { dealIsOn, dealWhen } from '../lib/deals';
import { RAIL } from '../lib/layout';
import { timeAgo } from '../lib/time';
import { Plate } from './ui';
import { Sticker } from './art';
import { colors, fonts, lift } from '../theme';

const VERDICT = { love: 'loved', fine: 'was fine with', meh: "wasn't into" };

function LiveDot() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.dotRing,
          {
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
          },
        ]}
      />
      <View style={styles.dot} />
    </View>
  );
}

export default function LiveRail({ openDish, openPlace }) {
  const { campus } = useSession();
  const [feed, setFeed] = useState([]);
  const [deals, setDeals] = useState([]);
  const [busy, setBusy] = useState({});

  const load = useCallback(() => {
    campusFeed(campus.id, 8)
      .then(setFeed)
      .catch(() => {});
    campusDeals(campus.id)
      .then((list) => setDeals(list.filter((d) => dealIsOn(d)).slice(0, 3)))
      .catch(() => {});
    activityToday(campus.id)
      .then(setBusy)
      .catch(() => {});
  }, [campus.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const busiest = campus.places
    .filter((p) => busy[p.id])
    .sort((a, b) => busy[b.id] - busy[a.id])
    .slice(0, 4);
  const most = busiest.length ? busy[busiest[0].id] : 1;

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <LiveDot />
          <Text style={styles.headText}>On the wire</Text>
          <Text style={styles.headSub}>{campus.short}</Text>
        </View>
        <View style={styles.ruleThick} />
        <View style={styles.ruleThin} />

        {feed.length === 0 && (
          <Text style={styles.quiet}>Quiet so far. The first rating of the day shows up here.</Text>
        )}
        {feed.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => openDish(r.dishId)}
            style={({ hovered }) => [styles.item, hovered && styles.hover]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.when}>{timeAgo(r.createdAt)}</Text>
              <Text style={styles.line} numberOfLines={2}>
                <Text style={styles.who}>{r.userName}</Text> {VERDICT[r.verdict] || 'rated'}{' '}
                <Text style={styles.dish}>{r.dishName}</Text>
              </Text>
              <Text style={styles.place} numberOfLines={1}>
                {r.placeName}
              </Text>
              {r.note ? (
                <Text style={styles.quote} numberOfLines={2}>
                  “{r.note}”
                </Text>
              ) : null}
            </View>
            <Plate score={r.score} size={44} />
          </Pressable>
        ))}

        {deals.length > 0 && (
          <>
            <Text style={styles.section}>Deals running</Text>
            {deals.map((d, i) => (
              <Pressable
                key={d.id}
                onPress={() => openPlace(d.placeId)}
                style={({ hovered }) => [
                  styles.deal,
                  { transform: [{ rotate: `${i % 2 ? 0.8 : -0.8}deg` }] },
                  hovered && { backgroundColor: colors.butter },
                ]}
              >
                <Sticker name="burst" width={34} rotate={i * 20} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dealTitle} numberOfLines={2}>
                    {d.title}
                  </Text>
                  <Text style={styles.dealMeta} numberOfLines={1}>
                    {d.placeName} · {dealWhen(d)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {busiest.length > 0 && (
          <>
            <Text style={styles.section}>Busy right now</Text>
            {busiest.map((p) => (
              <Pressable key={p.id} onPress={() => openPlace(p.id)} style={styles.busy}>
                <View style={styles.busyTop}>
                  <Text style={styles.busyName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.busyCount}>{busy[p.id]}</Text>
                </View>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.max(8, (busy[p.id] / most) * 100)}%` }]} />
                </View>
              </Pressable>
            ))}
            <Text style={styles.small}>ratings today</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: RAIL, backgroundColor: colors.paper, borderLeftWidth: 1.5, borderLeftColor: colors.ink },
  inner: { padding: 20, paddingBottom: 40 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  headText: { fontFamily: fonts.title, fontSize: 24, color: colors.deep, flex: 1 },
  headSub: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.6, color: colors.ink, textTransform: 'uppercase' },
  dotWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.blood },
  dotRing: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: colors.blood },
  ruleThick: { height: 3, backgroundColor: colors.ink },
  ruleThin: { height: 1, backgroundColor: colors.ink, marginTop: 3, marginBottom: 6 },
  quiet: { fontFamily: fonts.italic, fontSize: 14, color: colors.muted, marginTop: 14 },
  item: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderBottomWidth: 1.5,
    borderStyle: 'dotted',
    borderBottomColor: colors.hairline,
  },
  hover: { backgroundColor: colors.butter },
  when: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.persimmon,
    textTransform: 'uppercase',
  },
  line: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.ink, marginTop: 2 },
  who: { fontFamily: fonts.bold },
  dish: { fontFamily: fonts.title, fontSize: 15, color: colors.deep },
  place: { fontFamily: fonts.medium, fontSize: 12, color: colors.teal, marginTop: 1 },
  quote: { fontFamily: fonts.italic, fontSize: 13, color: colors.muted, marginTop: 3 },
  section: {
    fontFamily: fonts.title,
    fontSize: 14,
    letterSpacing: 3,
    color: colors.persimmon,
    textTransform: 'uppercase',
    marginTop: 26,
    marginBottom: 10,
  },
  deal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: colors.peach,
    borderWidth: 1.2,
    borderColor: colors.ink,
    borderRadius: 4,
    ...lift,
  },
  dealTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  dealMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 },
  busy: { marginBottom: 10 },
  busyTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  busyName: { fontFamily: fonts.title, fontSize: 15, color: colors.ink, flex: 1 },
  busyCount: { fontFamily: fonts.title, fontSize: 18, color: colors.persimmon },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.mist, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.orange },
  small: { fontFamily: fonts.italic, fontSize: 12, color: colors.muted },
});
