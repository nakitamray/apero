import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { activityToday, campusDeals, campusFeed, setDealVote, topDishes } from '../lib/api';
import { dealIsOn } from '../lib/deals';
import { greeting, todayKey } from '../lib/time';
import { MOODS } from '../lib/tags';
import { Chip, Empty, Loading, Masthead, Num, Paper, Platter, Screen, SectionHeader } from '../components/ui';
import { ReviewCard, makeLike } from '../components/rows';
import { SpotCard } from '../components/places';
import { DealCard, makeDealVote } from '../components/deals';
import { MenuDeck } from '../components/deck';
import { Sticker } from '../components/art';
import { colors, fonts, lift } from '../theme';

const SHORTCUTS = [
  { id: 'Decider', label: 'Decide together', sub: 'spin the orange', art: 'matchbox', tint: colors.lemon },
  { id: 'Deals', label: 'Deals', sub: 'posted by students', art: 'burst', tint: colors.peach },
  { id: 'Feed', label: 'The feed', sub: 'who ate what', art: 'goldfish', tint: '#D6F1F5' },
];

export default function TodayScreen({ navigation }) {
  const { campus, modes, name, user, demo, logOut } = useSession();
  const [top, setTop] = useState([]);
  const [feed, setFeed] = useState([]);
  const [busy, setBusy] = useState({});
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const [dishes, reviews, activity, campusDealList] = await Promise.all([
        topDishes(campus.id, 6),
        campusFeed(campus.id, 3),
        activityToday(campus.id),
        campusDeals(campus.id),
      ]);
      setTop(dishes);
      setFeed(reviews);
      setBusy(activity);
      setDeals(campusDealList.filter((d) => dealIsOn(d)));
    } catch (e) {
      console.warn('today: load failed', e);
    }
    setLoading(false);
  }, [campus.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const like = makeLike(setFeed, user.uid);
  const openPlace = (place) => navigation.navigate('Place', { placeId: place.id });
  const spots = campus.places.filter((p) => p.kind === 'spot');
  const busiest = campus.places
    .filter((p) => busy[p.id])
    .sort((a, b) => busy[b.id] - busy[a.id])
    .slice(0, 3);
  const today = todayKey();

  return (
    <Screen>
      <Animated.ScrollView
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.deep} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <Masthead
          kicker={`${campus.short} / ${campus.city}`}
          title={`${greeting()},`}
          accent={name}
          note="Here's what's good today."
          sticker="spritz"
          stickerSize={112}
          scrollY={scrollY}
        />

        {demo && (
          <Pressable onPress={logOut} style={styles.demo}>
            <Text style={styles.demoText}>
              Demo with sample data. Nothing is saved. <Text style={styles.demoLink}>Make an account</Text>
            </Text>
          </Pressable>
        )}

        <SectionHeader label="Ranked by students" title="Tonight's menu" />
        {loading ? (
          <Loading />
        ) : top.length ? (
          <MenuDeck
            dishes={top}
            onPress={(dish) => navigation.navigate('Dish', { dishId: dish.id })}
            badgeFor={(dish) => (dish.lastServedDate === today ? 'on today' : null)}
          />
        ) : (
          <Empty
            title="Nothing rated yet"
            body={`Be the first at ${campus.short}. Tap the orange to rate something you ate.`}
          />
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcuts}>
          {SHORTCUTS.map((s, i) => (
            <Paper
              key={s.id}
              tint={s.tint}
              tilt={[-1.5, 1, -0.6][i]}
              outer={styles.shortcut}
              style={styles.shortcutBody}
              onPress={() => navigation.navigate(s.id)}
            >
              <Sticker name={s.art} width={s.art === 'goldfish' ? 96 : 70} rotate={i % 2 ? 8 : -8} />
              <Text style={styles.shortcutTitle}>{s.label}</Text>
              <Text style={styles.shortcutSub}>{s.sub}</Text>
            </Paper>
          ))}
        </ScrollView>

        <SectionHeader label="What sounds good" title="By mood" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {MOODS.map((m) => (
            <Chip key={m.id} label={m.label} onPress={() => navigation.navigate('Mood', { mood: m.id })} />
          ))}
        </ScrollView>

        {deals.length > 0 && (
          <>
            <SectionHeader
              label="Posted by students"
              title="Deals today"
              action="All"
              onAction={() => navigation.navigate('Deals')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {deals.map((d, i) => (
                <DealCard
                  key={d.id}
                  deal={d}
                  index={i}
                  compact
                  uid={user.uid}
                  onVote={makeDealVote(setDeals, user.uid, setDealVote)}
                  onPress={() => navigation.navigate('Place', { placeId: d.placeId })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {busiest.length > 0 && (
          <>
            <SectionHeader label="Where people are eating" title="Busy today" />
            <Platter tone="lemon" outer={{ marginHorizontal: 20 }} style={{ gap: 10 }}>
              {busiest.map((p) => (
                <Pressable key={p.id} style={styles.busyRow} onPress={() => openPlace(p)}>
                  <Num size={30} color={colors.persimmon}>
                    {busy[p.id]}
                  </Num>
                  <Text style={styles.busyItem}>{p.name}</Text>
                </Pressable>
              ))}
            </Platter>
          </>
        )}

        <SectionHeader
          label="Cheap eats near campus"
          title="Off the meal plan"
          action="All"
          onAction={() => navigation.navigate('ExploreTab', { screen: 'Explore', params: { kind: 'spot' } })}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {spots.map((s, i) => (
            <SpotCard key={s.id} spot={s} campus={campus} modes={modes} index={i} onPress={() => openPlace(s)} />
          ))}
        </ScrollView>

        <SectionHeader
          label="Fresh off the feed"
          title="Just rated"
          action="All"
          onAction={() => navigation.navigate('Feed')}
        />
        {feed.map((r, i) => (
          <ReviewCard
            key={r.id}
            index={i}
            review={r}
            uid={user.uid}
            onLike={like}
            onPressDish={() => navigation.navigate('Dish', { dishId: r.dishId })}
          />
        ))}
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  demo: {
    marginHorizontal: 22,
    marginTop: 14,
    backgroundColor: colors.lemon,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  demoText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, textAlign: 'center' },
  demoLink: { fontFamily: fonts.bold, color: colors.deep, textDecorationLine: 'underline' },
  shortcuts: { paddingHorizontal: 22, paddingTop: 10, gap: 12 },
  shortcut: { width: 150 },
  shortcutBody: { minHeight: 150, justifyContent: 'flex-end', borderWidth: 1.5, borderColor: colors.ink, ...lift },
  shortcutTitle: { fontFamily: fonts.title, fontSize: 19, lineHeight: 20, color: colors.ink, marginTop: 10 },
  shortcutSub: { fontFamily: fonts.body, fontSize: 12, color: colors.ink, opacity: 0.75, marginTop: 2 },
  chips: { paddingHorizontal: 22, gap: 8 },
  row: { paddingHorizontal: 22, paddingBottom: 10 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  busyItem: { fontFamily: fonts.title, fontSize: 17, color: colors.ink, flex: 1 },
});
