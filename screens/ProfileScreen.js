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
import { Awning, Button, Card, Kicker, Loading, ScoreBadge, Title } from '../components/ui';
import { DishRow } from '../components/rows';
import { colors, fonts } from '../theme';

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
  const { user, name, campus, logOut } = useSession();
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
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Awning height={insets.top + 70} />
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
        </View>
        <Title size={30} style={{ marginTop: 10 }}>
          {name}
        </Title>
        <Pressable onPress={() => navigation.navigate('Settings')} style={styles.campusRow} hitSlop={8}>
          <Text style={styles.campusText}>{campus.name}</Text>
          <ChevronRight size={16} color={colors.cobalt} />
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
            <Card outer={styles.block}>
              <Kicker style={{ marginBottom: 12 }}>Your taste</Kicker>
              <Bar label="Loved it" share={taste.verdicts.love / total} color={colors.aperol} />
              <Bar label="It was fine" share={taste.verdicts.fine / total} color={colors.sky} />
              <Bar label="Not for me" share={taste.verdicts.meh / total} color={colors.sand} />

              {taste.topReasons.length > 0 && (
                <Text style={styles.line}>
                  You care most about{' '}
                  <Text style={styles.em}>{taste.topReasons.map(([id]) => reasonLabel(id).toLowerCase()).join(', ')}</Text>.
                </Text>
              )}
              {taste.favorite && (
                <Text style={styles.line}>
                  Your spot: <Text style={styles.em}>{taste.favorite.name}</Text>.
                </Text>
              )}
              <Text style={styles.line}>
                You've tried <Text style={styles.em}>{taste.triedHere}</Text> of {campus.places.length} places at {campus.short}.
              </Text>
            </Card>
          )}

          {tryNext.length > 0 && (
            <>
              <Text style={styles.section}>Try next</Text>
              {tryNext.map((d) => (
                <DishRow key={d.id} dish={d} onPress={() => navigation.navigate('Dish', { dishId: d.id })} />
              ))}
            </>
          )}

          {total > 0 && (
            <>
              <Text style={styles.section}>Lately</Text>
              {reviews.slice(0, 5).map((r) => (
                <Pressable key={r.id} style={styles.recent} onPress={() => navigation.navigate('Dish', { dishId: r.dishId })}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentDish}>{r.dishName}</Text>
                    <Text style={styles.recentMeta}>
                      {r.placeName} · {timeAgo(r.createdAt)}
                    </Text>
                  </View>
                  <ScoreBadge score={r.score} size={40} />
                </Pressable>
              ))}
            </>
          )}
        </>
      )}

      <View style={styles.block}>
        <Button label="Campus & getting around" kind="plain" onPress={() => navigation.navigate('Settings')} />
        <Button label="Log out" kind="ink" onPress={logOut} style={{ marginTop: 14 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  head: { alignItems: 'center', marginTop: -40 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.cobalt,
    borderWidth: 3,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayItalic, fontSize: 40, color: colors.paper },
  campusRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  campusText: { fontFamily: fonts.medium, fontSize: 14, color: colors.cobalt },
  stats: { flexDirection: 'row', marginHorizontal: 20, marginTop: 24, borderTopWidth: 2, borderBottomWidth: 2, borderColor: colors.ink },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  block: { marginHorizontal: 20, marginTop: 24 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  barPct: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  barTrack: { height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: colors.ink, overflow: 'hidden', backgroundColor: colors.paper },
  barFill: { height: '100%' },
  line: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 10, lineHeight: 21 },
  em: { fontFamily: fonts.displayItalic, color: colors.blood },
  section: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginHorizontal: 20, marginTop: 30, marginBottom: 12 },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.sand,
  },
  recentDish: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  recentMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 2 },
});
