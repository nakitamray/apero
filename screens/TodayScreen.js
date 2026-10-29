import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/Session';
import { activityToday, campusFeed, topDishes } from '../lib/api';
import { greeting, todayKey } from '../lib/time';
import { MOODS } from '../lib/tags';
import {
  Chip,
  CollageHeader,
  Empty,
  Label,
  Loading,
  Note,
  Paper,
  Screen,
  SectionHeader,
  Tag,
  Title,
} from '../components/ui';
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
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.cobalt} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <CollageHeader
          height={insets.top + 120}
          pieces={[
            { name: 'spritz', size: 78, rotate: 6, right: 24, top: insets.top + 20 },
            { name: 'lemonSlice', size: 54, rotate: 0, right: 98, top: insets.top + 86 },
            { name: 'sardine', size: 150, rotate: -8, left: -30, top: insets.top + 96 },
          ]}
        />

        <View style={styles.hello}>
          <Label>
            {campus.short} · {campus.city}
          </Label>
          <Title size={48}>
            {greeting()}, {name}
          </Title>
          <Note style={{ color: colors.muted }}>Here's what's good today.</Note>
        </View>

        <SectionHeader label="What sounds good" title="Pick a mood" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {MOODS.map((m) => (
            <Chip key={m.id} label={m.label} onPress={() => navigation.navigate('Mood', { mood: m.id })} />
          ))}
        </ScrollView>

        <SectionHeader label="Ranked by students" title="Best on campus" />
        {loading ? (
          <Loading />
        ) : top.length ? (
          top.map((dish, i) => (
            <DishRow
              key={dish.id}
              dish={dish}
              rank={i + 1}
              index={i}
              onPress={() => navigation.navigate('Dish', { dishId: dish.id })}
              badge={
                dish.lastServedDate === today ? (
                  <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                    <Tag color={colors.teal}>On the menu today</Tag>
                  </View>
                ) : null
              }
            />
          ))
        ) : (
          <Empty
            title="Nothing rated yet"
            body={`Be the first at ${campus.short}. Tap the orange to rate something you ate.`}
          />
        )}

        {busiest.length > 0 && (
          <>
            <SectionHeader label="Where people are eating" title="Busy today" />
            <Paper tilt={-0.5} tint={colors.butter} outer={{ marginHorizontal: 20 }} style={{ gap: 10 }}>
              {busiest.map((p) => (
                <Text key={p.id} style={styles.busyItem} onPress={() => openPlace(p)}>
                  <Text style={styles.busyCount}>{busy[p.id]} </Text>
                  {p.name}
                </Text>
              ))}
            </Paper>
          </>
        )}

        <SectionHeader
          label="Cheap eats near campus"
          title="Off the meal plan"
          action="All spots"
          onAction={() => navigation.navigate('ExploreTab', { screen: 'Explore', params: { kind: 'spot' } })}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spots}>
          {spots.map((s, i) => (
            <SpotCard key={s.id} spot={s} campus={campus} modes={modes} index={i} onPress={() => openPlace(s)} />
          ))}
        </ScrollView>

        <SectionHeader
          label="Fresh off the feed"
          title="Just rated"
          action="See all"
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
        {!loading && feed.length === 0 && <Note style={styles.quiet}>No reviews yet today. Quiet one.</Note>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { paddingHorizontal: 22, marginTop: 30 },
  chips: { paddingHorizontal: 22, gap: 8 },
  spots: { paddingHorizontal: 22, paddingBottom: 10 },
  busyItem: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  busyCount: { fontFamily: fonts.display, color: colors.orange, fontSize: 26 },
  quiet: { color: colors.muted, paddingHorizontal: 22 },
});
