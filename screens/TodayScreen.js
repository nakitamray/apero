import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/Session';
import { activityToday, campusFeed, topDishes } from '../lib/api';
import { greeting, todayKey } from '../lib/time';
import { MOODS } from '../lib/tags';
import { Awning, Chip, Empty, Kicker, Loading, SectionHeader, Tag, Title } from '../components/ui';
import { Spritz, Wave } from '../components/art';
import { DishRow, ReviewCard, makeLike } from '../components/rows';
import { SpotCard } from '../components/places';
import { colors, fonts } from '../theme';

export default function TodayScreen({ navigation }) {
  const { campus, modes, name, user } = useSession();
  const insets = useSafeAreaInsets();
  const [top, setTop] = useState([]);
  const [feed, setFeed] = useState([]);
  const [busy, setBusy] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dishes, reviews, activity] = await Promise.all([
        topDishes(campus.id, 5),
        campusFeed(campus.id, 3),
        activityToday(campus.id),
      ]);
      setTop(dishes);
      setFeed(reviews);
      setBusy(activity);
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
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.aperol} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Awning height={insets.top + 96}>
        <Spritz size={64} style={[styles.glass, { top: insets.top + 8 }]} />
      </Awning>

      <View style={styles.hello}>
        <Kicker>
          {campus.short} · {campus.city}
        </Kicker>
        <Title size={34} italic>
          {greeting()}, {name}.
        </Title>
        <Wave width={140} style={{ marginTop: 8 }} />
      </View>

      <SectionHeader kicker="What sounds good" title="Pick a mood" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {MOODS.map((m) => (
          <Chip key={m.id} label={m.label} onPress={() => navigation.navigate('Mood', { mood: m.id })} />
        ))}
      </ScrollView>

      <SectionHeader kicker="Ranked by students" title="Best on campus" />
      {loading ? (
        <Loading />
      ) : top.length ? (
        top.map((dish, i) => (
          <DishRow
            key={dish.id}
            dish={dish}
            rank={i + 1}
            onPress={() => navigation.navigate('Dish', { dishId: dish.id })}
            badge={
              dish.lastServedDate === today ? (
                <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                  <Tag color={colors.blood}>on the menu today</Tag>
                </View>
              ) : null
            }
          />
        ))
      ) : (
        <Empty title="Nothing rated yet" body={`Be the first at ${campus.short}. Tap the orange + to rate something you ate.`} />
      )}

      {busiest.length > 0 && (
        <>
          <SectionHeader kicker="Where people are eating" title="Busy today" />
          <View style={styles.busyRow}>
            {busiest.map((p) => (
              <Text key={p.id} style={styles.busyItem} onPress={() => openPlace(p)}>
                <Text style={styles.busyCount}>{busy[p.id]}</Text> {p.name}
              </Text>
            ))}
          </View>
        </>
      )}

      <SectionHeader
        kicker="Cheap eats near campus"
        title="Off the meal plan"
        action="All spots"
        onAction={() => navigation.navigate('ExploreTab', { screen: 'Explore', params: { kind: 'spot' } })}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {spots.map((s) => (
          <SpotCard key={s.id} spot={s} campus={campus} modes={modes} onPress={() => openPlace(s)} />
        ))}
      </ScrollView>

      <SectionHeader kicker="Fresh off the feed" title="Just rated" action="See all" onAction={() => navigation.navigate('Feed')} />
      {feed.map((r) => (
        <ReviewCard
          key={r.id}
          review={r}
          uid={user.uid}
          onLike={like}
          onPressDish={() => navigation.navigate('Dish', { dishId: r.dishId })}
        />
      ))}
      {!loading && feed.length === 0 && <Text style={styles.quiet}>No reviews yet today. Quiet one.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  glass: { position: 'absolute', right: 22 },
  hello: { paddingHorizontal: 20, marginTop: 14 },
  chips: { paddingHorizontal: 20, gap: 8 },
  busyRow: { paddingHorizontal: 20, gap: 8 },
  busyItem: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  busyCount: { fontFamily: fonts.display, color: colors.blood, fontSize: 18 },
  quiet: { fontFamily: fonts.body, color: colors.muted, paddingHorizontal: 20 },
});
