import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';
import { useSession } from '../context/Session';
import { getPlace } from '../data/campuses';
import { myRankings, topDishes, userReviews } from '../lib/api';
import { reasonLabel } from '../lib/tags';
import { dayStreak, timeAgo } from '../lib/time';
import { Button, Label, Loading, Masthead, MenuCard, Paper, Plate, Platter, Screen } from '../components/ui';
import { Sticker } from '../components/art';
import { DishMenu } from '../components/rows';
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
  const { user, name, campus, demo, logOut, profile, following } = useSession();
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
        <Masthead
          kicker={`@${profile?.handle || 'you'} / ${campus.short}`}
          title={name}
          accent="at the table"
          sticker="goldfish"
          stickerSize={150}
          right="Me"
        />
        <Pressable onPress={() => navigation.navigate('Settings')} style={styles.campusRow} hitSlop={8}>
          <Text style={styles.campusText}>{campus.name} / how you get around</Text>
          <ChevronRight size={16} color={colors.persimmon} strokeWidth={2} />
        </Pressable>

        <View style={styles.tiles}>
          <Paper
            tint={colors.paper}
            tilt={-1}
            outer={{ flex: 1 }}
            onPress={() => navigation.navigate('Friends')}
            style={styles.tile}
          >
            <Sticker name="goldfish" width={78} rotate={-6} />
            <Text style={styles.tileTitle}>Friends</Text>
            <Text style={styles.tileSub}>{following.length} · taste match</Text>
          </Paper>
          <Paper
            tint={colors.lemon}
            tilt={1.2}
            outer={{ flex: 1 }}
            onPress={() => navigation.navigate('Wrapped')}
            style={styles.tile}
          >
            <Sticker name="stamp" width={50} rotate={8} />
            <Text style={styles.tileTitle}>Wrapped</Text>
            <Text style={styles.tileSub}>your semester in food</Text>
          </Paper>
        </View>

        {!reviews ? (
          <Loading />
        ) : (
          <>
            <MenuCard outer={styles.statsOuter} style={styles.stats}>
              <Stat value={total} label="reviews" />
              <Stat value={Object.keys(taste.places).length} label="places" />
              <Stat value={dayStreak(reviews.map((r) => r.createdAt).filter(Boolean))} label="day streak" />
            </MenuCard>

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
                <DishMenu dishes={tryNext} onPress={(d) => navigation.navigate('Dish', { dishId: d.id })} />
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
                        {r.placeName} / {timeAgo(r.createdAt)}
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
  tiles: { flexDirection: 'row', gap: 14, marginHorizontal: 22, marginTop: 22 },
  tile: { alignItems: 'center', paddingVertical: 14, minHeight: 140, justifyContent: 'center' },
  tileTitle: { fontFamily: fonts.title, fontSize: 28, color: colors.ink, marginTop: 4 },
  tileSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  campusRow: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 22, marginTop: 4 },
  campusText: { fontFamily: fonts.bold, fontSize: 13, color: colors.persimmon },
  statsOuter: { marginHorizontal: 22, marginTop: 22 },
  stats: { flexDirection: 'row', paddingVertical: 4 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { fontFamily: fonts.title, fontSize: 42, lineHeight: 46, color: colors.cobalt },
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
  em: { fontFamily: fonts.italic, fontSize: 18, color: colors.orange },
  section: {
    fontFamily: fonts.title,
    fontSize: 26,
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
  recentDish: { fontFamily: fonts.title, fontSize: 16, color: colors.ink },
  recentMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
});
