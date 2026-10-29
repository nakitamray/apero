import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useSession } from '../context/Session';
import { getPlace } from '../data/campuses';
import { myRankings, topDishes, userReviews } from '../lib/api';
import { reasonLabel } from '../lib/tags';
import { dayStreak, timeAgo } from '../lib/time';
import { Button, CollageHeader, Label, Loading, Plate, Platter, Screen, Title } from '../components/ui';
import { DishRow } from '../components/rows';
import { colors, fonts, lift } from '../theme';

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Bar({ label, share, color }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barPct}>{Math.round(share * 100)}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(share * 100, 3)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function tasteFrom(reviews, campus) {
  const reasons = {};
  const places = {};
  const verdicts = { love: 0, fine: 0, meh: 0 };
  reviews.forEach((r) => {
    r.tags?.forEach((t) => (reasons[t] = (reasons[t] || 0) + 1));
    places[r.placeId] = (places[r.placeId] || 0) + 1;
    verdicts[r.verdict] = (verdicts[r.verdict] || 0) + 1;
  });
  const topReasons = Object.entries(reasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const favoriteId = Object.keys(places).sort((a, b) => places[b] - places[a])[0];
  const triedHere = Object.keys(places).filter((id) => getPlace(id)?.campusId === campus.id).length;
  return { topReasons, favorite: getPlace(favoriteId), places, verdicts, triedHere };
}

export default function ProfileScreen({ navigation }) {
  const { user, name, campus, demo, logOut } = useSession();
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState(null);
  const [tryNext, setTryNext] = useState([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([userReviews(user.uid), myRankings(user.uid), topDishes(campus.id, 15)])
        .then(([mine, ranked, top]) => {
          setReviews(mine);
          const rated = new Set(ranked.map((r) => r.dishId));
          setTryNext(top.filter((d) => !rated.has(d.id)).slice(0, 3));
        })
        .catch(() => setReviews([]));
    }, [user.uid, campus.id]),
  );

  const total = reviews?.length || 0;
  const taste = reviews ? tasteFrom(reviews, campus) : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <CollageHeader
          height={insets.top + 90}
          tone="orange"
          pieces={[
            { name: 'sardine', size: 150, rotate: -10, left: -20, top: insets.top + 20 },
            { name: 'lemon', size: 70, rotate: 14, right: 26, top: insets.top + 30 },
          ]}
        />
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
          </View>
          <Title size={46} style={{ marginTop: 10 }}>
            {name}
          </Title>
          <Pressable onPress={() => navigation.navigate('Settings')} style={styles.campusRow} hitSlop={8}>
            <Text style={styles.campusText}>{campus.name}</Text>
            <ChevronRight size={16} color={colors.teal} strokeWidth={1.6} />
          </Pressable>
        </View>

        {!reviews ? (
          <Loading />
        ) : (
          <>
            <View style={styles.stats}>
              <Stat value={total} label="reviews" />
              <Stat value={Object.keys(taste.places).length} label="places" />
              <Stat value={dayStreak(reviews.map((r) => r.createdAt).filter(Boolean))} label="day streak" />
            </View>

            {total > 0 && (
              <Platter tone="blue" outer={styles.block}>
                <Label style={{ marginBottom: 14 }}>Your taste</Label>
                <Bar label="Loved it" share={taste.verdicts.love / total} color={colors.orange} />
                <Bar label="It was fine" share={taste.verdicts.fine / total} color={colors.lemon} />
                <Bar label="Not for me" share={taste.verdicts.meh / total} color={colors.aqua} />

                {taste.topReasons.length > 0 && (
                  <Text style={styles.line}>
                    You care most about{' '}
                    <Text style={styles.em}>
                      {taste.topReasons.map(([id]) => reasonLabel(id).toLowerCase()).join(', ')}
                    </Text>
                    .
                  </Text>
                )}
                {taste.favorite && (
                  <Text style={styles.line}>
                    Your spot: <Text style={styles.em}>{taste.favorite.name}</Text>.
                  </Text>
                )}
                <Text style={styles.line}>
                  You've tried <Text style={styles.em}>{taste.triedHere}</Text> of {campus.places.length} places at{' '}
                  {campus.short}.
                </Text>
              </Platter>
            )}

            {tryNext.length > 0 && (
              <>
                <Text style={styles.section}>Try next</Text>
                {tryNext.map((d, i) => (
                  <DishRow
                    key={d.id}
                    dish={d}
                    index={i}
                    onPress={() => navigation.navigate('Dish', { dishId: d.id })}
                  />
                ))}
              </>
            )}

            {total > 0 && (
              <>
                <Text style={styles.section}>Lately</Text>
                {reviews.slice(0, 5).map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.recent}
                    onPress={() => navigation.navigate('Dish', { dishId: r.dishId })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentDish}>{r.dishName}</Text>
                      <Text style={styles.recentMeta}>
                        {r.placeName} · {timeAgo(r.createdAt)}
                      </Text>
                    </View>
                    <Plate score={r.score} size={44} />
                  </Pressable>
                ))}
              </>
            )}
          </>
        )}

        <View style={styles.block}>
          <Button label="Campus & getting around" kind="light" onPress={() => navigation.navigate('Settings')} />
          <Button label={demo ? 'Leave the demo' : 'Log out'} kind="light" onPress={logOut} style={{ marginTop: 12 }} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', marginTop: -46, zIndex: 3 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.aqua,
    borderWidth: 4,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    ...lift,
  },
  avatarText: { fontFamily: fonts.display, fontSize: 52, lineHeight: 58, color: colors.paper },
  campusRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  campusText: { fontFamily: fonts.medium, fontSize: 14, color: colors.teal },
  stats: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 26,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { fontFamily: fonts.display, fontSize: 42, lineHeight: 46, color: colors.cobalt },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  block: { marginHorizontal: 22, marginTop: 30 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  barLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  barPct: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.mist },
  barFill: { height: '100%', borderRadius: 4 },
  line: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 10, lineHeight: 22 },
  em: { fontFamily: fonts.note, fontSize: 18, color: colors.orange },
  section: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
    marginHorizontal: 22,
    marginTop: 34,
    marginBottom: 12,
  },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 22,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  recentDish: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  recentMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
});
