// Today is the campus paper: a nameplate, a news strip, tonight's No. 1 as the lead story,
// and the rest of the day (rankings, deals, crowds, spots, what people said) set in columns.
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { activityToday, campusDeals, campusFeed, topDishes } from '../lib/api';
import { dealIsOn, dealWhen } from '../lib/deals';
import { currentMeal, greeting, todayKey } from '../lib/time';
import { MOODS } from '../lib/tags';
import { priceTag } from '../data/campuses';
import { bestTrip, describeTrip } from '../lib/trip';
import { useLayout } from '../lib/layout';
import { Chip, Loading, Plate, Screen } from '../components/ui';
import { Columns, Nameplate, Story, Ticker } from '../components/paper';
import FoodArt from '../components/foodArt';
import { Sticker } from '../components/art';
import { colors, fonts, lift } from '../theme';

const VERDICT = { love: 'loved', fine: 'was fine with', meh: "wasn't into" };

// a mood forecast, written like the weather
const forecast = (top) => {
  const tags = top.flatMap((d) => d.tags || []);
  const count = (t) => tags.filter((x) => x === t).length;
  const ranked = MOODS.map((m) => m.id).sort((a, b) => count(b) - count(a));
  const label = (id) => MOODS.find((m) => m.id === id).label.toLowerCase();
  return `${label(ranked[0])[0].toUpperCase()}${label(ranked[0]).slice(1)}, with a chance of ${label(ranked[1])}.`;
};

export default function TodayScreen({ navigation }) {
  const { campus, modes, name, demo, logOut } = useSession();
  const { column } = useLayout();
  const [top, setTop] = useState([]);
  const [feed, setFeed] = useState([]);
  const [busy, setBusy] = useState({});
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [dishes, reviews, activity, campusDealList] = await Promise.all([
        topDishes(campus.id, 6),
        campusFeed(campus.id, 6),
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

  const today = todayKey();
  const cols = column >= 840 ? 3 : column >= 600 ? 2 : 1;
  const compact = column < 600;
  const openDish = (id) => navigation.navigate('Dish', { dishId: id });
  const openPlace = (id) => navigation.navigate('Place', { placeId: id });

  const lead = top[0];
  const rest = top.slice(1, 6);
  const spots = campus.places.filter((p) => p.kind === 'spot' && !p.occasion).slice(0, 4);
  const dateNight = campus.places.filter((p) => p.occasion === 'date').slice(0, 3);
  const busiest = campus.places
    .filter((p) => busy[p.id])
    .sort((a, b) => busy[b.id] - busy[a.id])
    .slice(0, 4);
  const most = busiest.length ? busy[busiest[0].id] : 1;
  const totalToday = Object.values(busy).reduce((a, b) => a + b, 0);
  const letters = feed.filter((r) => r.note).slice(0, 3);

  const ticker = [
    lead && `No. 1 tonight: ${lead.name} (${lead.score?.toFixed(1)})`,
    totalToday > 0 && `${totalToday} rating${totalToday === 1 ? '' : 's'} on campus today`,
    ...busiest.slice(0, 2).map((p) => `${p.name}: ${busy[p.id]} today`),
    ...deals.slice(0, 2).map((d) => `Deal: ${d.title} at ${d.placeName}`),
    ...feed.slice(0, 3).map((r) => `Just in: ${r.userName} ${VERDICT[r.verdict] || 'rated'} ${r.dishName}`),
  ].filter(Boolean);

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.deep} />}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <View style={[styles.sheet, !compact && styles.sheetWide]}>
          <Nameplate
            campus={campus}
            compact={compact}
            line={`${greeting()}, ${name}. The ${currentMeal().toLowerCase()} edition, from ${campus.city}.`}
          />
          <Ticker items={ticker} />
          <Pressable
            onPress={() => navigation.navigate('MeTab', { screen: 'Settings' })}
            style={styles.switchSchool}
            hitSlop={6}
          >
            <Text style={styles.switchText}>Not at {campus.short}? Change school →</Text>
          </Pressable>

          {demo && (
            <Pressable onPress={logOut} style={styles.demo}>
              <Text style={styles.demoText}>
                Demo edition with sample data. Nothing is saved. <Text style={styles.demoLink}>Make an account</Text>
              </Text>
            </Pressable>
          )}

          {loading ? (
            <Loading />
          ) : lead ? (
            <Lead
              dish={lead}
              onToday={lead.lastServedDate === today}
              campus={campus}
              twoCol={!compact}
              onPress={() => openDish(lead.id)}
            />
          ) : (
            <View style={styles.leadEmpty}>
              <Text style={styles.leadKicker}>Stop the presses</Text>
              <Text style={styles.leadHead}>Nothing rated at {campus.short} yet</Text>
              <Text style={styles.leadDeck}>
                Be the first. Rate something you ate today and it runs on the front page.
              </Text>
              <Pressable onPress={() => navigation.navigate('ReviewTab')} style={styles.cta}>
                <Text style={styles.ctaText}>Rate a dish</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.sectionRule} />

          <Columns count={cols}>
            {rest.length > 0 && (
              <Story key="rank" kicker="Ranked by students" headline="The rest of the menu">
                {rest.map((d, i) => (
                  <Pressable
                    key={d.id}
                    onPress={() => openDish(d.id)}
                    style={({ hovered }) => [styles.menuLine, hovered && styles.hover]}
                  >
                    <Text style={styles.menuNo}>{i + 2}</Text>
                    <FoodArt dish={d} width={48} rotate={i % 2 ? 6 : -6} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuName} numberOfLines={2}>
                        {d.name}
                      </Text>
                      <Text style={styles.menuPlace} numberOfLines={1}>
                        {d.placeName}
                        {d.lastServedDate === today ? '  ·  on today' : ''}
                      </Text>
                    </View>
                    <Plate score={d.score} size={42} />
                  </Pressable>
                ))}
              </Story>
            )}

            <Story
              key="deals"
              kicker="Classifieds"
              headline={deals.length ? 'Deals running today' : 'No deals posted today'}
              action={deals.length ? 'All deals' : 'Post a deal'}
              onAction={() => navigation.navigate(deals.length ? 'Deals' : 'AddDeal')}
            >
              {deals.length === 0 && (
                <Text style={styles.body}>Know a student discount or a special? Post it and it runs here.</Text>
              )}
              {deals.slice(0, 3).map((d, i) => (
                <Pressable
                  key={d.id}
                  onPress={() => openPlace(d.placeId)}
                  style={[styles.classified, { transform: [{ rotate: `${i % 2 ? 0.7 : -0.7}deg` }] }]}
                >
                  <Text style={styles.classTitle}>{d.title}</Text>
                  <Text style={styles.classMeta}>
                    {d.placeName} · {dealWhen(d)}
                  </Text>
                </Pressable>
              ))}
            </Story>

            <Story
              key="crowd"
              kicker="Where the crowd is"
              headline={busiest.length ? `${busiest[0].name} is busiest` : 'A quiet day so far'}
            >
              {busiest.length === 0 && (
                <Text style={styles.body}>No ratings yet today. Lunch usually changes that.</Text>
              )}
              {busiest.map((p) => (
                <Pressable key={p.id} onPress={() => openPlace(p.id)} style={styles.crowd}>
                  <View style={styles.crowdTop}>
                    <Text style={styles.crowdName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.crowdNum}>{busy[p.id]}</Text>
                  </View>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${Math.max(8, (busy[p.id] / most) * 100)}%` }]} />
                  </View>
                </Pressable>
              ))}
            </Story>

            <Story
              key="forecast"
              kicker="The forecast"
              headline={top.length ? forecast(top) : 'Hungry, with a chance of hungrier.'}
            >
              <Text style={styles.body}>Pick a mood for dishes that match it.</Text>
              <View style={styles.chips}>
                {MOODS.map((m) => (
                  <Chip
                    key={m.id}
                    label={m.label}
                    onPress={() => navigation.navigate('Mood', { mood: m.id })}
                    style={styles.chip}
                  />
                ))}
              </View>
            </Story>

            <Story
              key="out"
              kicker="Off the meal plan"
              headline="Dining out"
              action="All spots"
              onAction={() => navigation.navigate('ExploreTab', { screen: 'Explore', params: { kind: 'spot' } })}
            >
              {spots.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => openPlace(s.id)}
                  style={({ hovered }) => [styles.spot, hovered && styles.hover]}
                >
                  <Text style={styles.spotName}>{s.name}</Text>
                  <Text style={styles.spotMeta}>
                    {s.cuisine} · {priceTag(s.price)} · {describeTrip(bestTrip(s, campus, modes))}
                  </Text>
                </Pressable>
              ))}
            </Story>

            {letters.length > 0 && (
              <Story
                key="letters"
                kicker="Letters"
                headline="What people said"
                action="Read the feed"
                onAction={() => navigation.navigate('Feed')}
              >
                {letters.map((r) => (
                  <Pressable key={r.id} onPress={() => openDish(r.dishId)} style={styles.letter}>
                    <Text style={styles.quote}>“{r.note}”</Text>
                    <Text style={styles.sig}>
                      {r.userName}, on the {r.dishName} at {r.placeName}
                    </Text>
                  </Pressable>
                ))}
              </Story>
            )}

            {dateNight.length > 0 && (
              <Story key="date" kicker="Society pages" headline="Worth dressing up for">
                {dateNight.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => openPlace(s.id)}
                    style={({ hovered }) => [styles.spot, hovered && styles.hover]}
                  >
                    <Text style={styles.spotName}>{s.name}</Text>
                    <Text style={styles.spotMeta}>
                      {s.cuisine} · {priceTag(s.price)}
                    </Text>
                  </Pressable>
                ))}
              </Story>
            )}

            <Story key="index" kicker="Also in this edition" headline="Inside">
              {[
                {
                  id: 'Decider',
                  label: 'Decide together',
                  sub: 'pick who is coming, spin the orange',
                  art: 'matchbox',
                },
                { id: 'Feed', label: 'The feed', sub: 'every review on campus, with photos', art: 'goldfish' },
                { id: 'Deals', label: 'Deals', sub: 'posted by students, voted still good', art: 'burst' },
              ].map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => navigation.navigate(s.id)}
                  style={({ hovered }) => [styles.inside, hovered && styles.hover]}
                >
                  <Sticker name={s.art} width={s.art === 'goldfish' ? 54 : 40} rotate={-6} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spotName}>{s.label}</Text>
                    <Text style={styles.spotMeta}>{s.sub}</Text>
                  </View>
                </Pressable>
              ))}
            </Story>
          </Columns>
        </View>
      </ScrollView>
    </Screen>
  );
}

// the lead story: tonight's No. 1 dish, headline and all, with a framed "photo" of the painted art
function Lead({ dish, onToday, campus, twoCol, onPress }) {
  const n = dish.ratingCount || 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [styles.lead, twoCol && styles.leadRow, hovered && { opacity: 0.92 }]}
    >
      <View style={twoCol ? { flex: 1.15 } : null}>
        <Text style={styles.leadKicker}>Tonight's No. 1</Text>
        <Text style={[styles.leadHead, twoCol && { fontSize: 50, lineHeight: 50 }]}>
          {dish.name} tops the menu at {dish.placeName}
        </Text>
        <Text style={styles.leadDeck}>
          Rated {dish.score?.toFixed(1)} out of 10 by {n} student{n === 1 ? '' : 's'}
          {onToday ? ", and it's on the line today." : '.'} Go before it's gone.
        </Text>
        <Text style={styles.byline}>By the students of {campus.short}</Text>
      </View>
      <View style={[styles.figure, twoCol && { flex: 1, marginTop: 0 }]}>
        <View style={styles.photo}>
          <FoodArt dish={dish} width={230} rotate={-6} />
          <View style={styles.photoPlate}>
            <Plate score={dish.score} size={76} />
          </View>
          {onToday && (
            <View style={styles.onToday}>
              <Text style={styles.onTodayText}>On today</Text>
            </View>
          )}
        </View>
        <Text style={styles.caption}>Fig. 1. {dish.name}, as remembered by the people who ate it.</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // the paper itself, lying on the striped cloth
  sheet: { backgroundColor: colors.paper, paddingBottom: 20 },
  sheetWide: { margin: 14, borderWidth: 1, borderColor: colors.hairline, ...lift },
  demo: {
    marginHorizontal: 22,
    marginTop: 12,
    backgroundColor: colors.lemon,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  demoText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, textAlign: 'center' },
  demoLink: { fontFamily: fonts.bold, color: colors.deep, textDecorationLine: 'underline' },

  lead: { paddingHorizontal: 22, paddingTop: 22 },
  leadRow: { flexDirection: 'row', gap: 28, alignItems: 'center' },
  leadEmpty: { paddingHorizontal: 22, paddingTop: 26, alignItems: 'flex-start' },
  leadKicker: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.blood,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  leadHead: { fontFamily: fonts.title, fontSize: 38, lineHeight: 39, color: colors.deep, letterSpacing: -0.5 },
  leadDeck: { fontFamily: fonts.italic, fontSize: 17, lineHeight: 24, color: colors.ink, marginTop: 12 },
  byline: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  figure: { marginTop: 18 },
  photo: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.lagoon,
    ...lift,
  },
  photoPlate: { position: 'absolute', right: 12, top: 12 },
  onToday: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: colors.persimmon,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: '-4deg' }],
  },
  onTodayText: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.paper,
    textTransform: 'uppercase',
  },
  caption: { fontFamily: fonts.italic, fontSize: 12.5, color: colors.muted, marginTop: 8 },
  cta: {
    marginTop: 16,
    backgroundColor: colors.persimmon,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  ctaText: { fontFamily: fonts.bold, color: colors.paper, fontSize: 15 },

  switchSchool: { alignSelf: 'flex-end', marginHorizontal: 22, marginTop: 8 },
  switchText: { fontFamily: fonts.italic, fontSize: 13, color: colors.persimmon },
  sectionRule: { height: 3, backgroundColor: colors.ink, marginHorizontal: 22, marginTop: 26 },
  hover: { backgroundColor: colors.butter },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.ink },

  menuLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    marginHorizontal: -6,
    paddingHorizontal: 6,
  },
  menuNo: { fontFamily: fonts.title, fontSize: 30, lineHeight: 32, color: colors.persimmon, width: 24 },
  menuName: { fontFamily: fonts.title, fontSize: 17, lineHeight: 18, color: colors.deep },
  menuPlace: { fontFamily: fonts.medium, fontSize: 12, color: colors.teal, marginTop: 2 },

  classified: {
    borderWidth: 1.2,
    borderColor: colors.ink,
    borderStyle: 'dashed',
    padding: 10,
    marginBottom: 8,
    backgroundColor: colors.peach,
  },
  classTitle: {
    fontFamily: fonts.heavy,
    fontSize: 14,
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  classMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ink, marginTop: 2 },

  crowd: { marginBottom: 10 },
  crowdTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  crowdName: { fontFamily: fonts.title, fontSize: 16, color: colors.ink, flex: 1 },
  crowdNum: {
    fontFamily: fonts.title,
    fontSize: 20,
    lineHeight: 24,
    color: colors.persimmon,
    minWidth: 24,
    paddingRight: 4,
    textAlign: 'right',
  },
  bar: { height: 7, borderRadius: 4, backgroundColor: colors.mist, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4, backgroundColor: colors.orange },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { paddingVertical: 5, paddingHorizontal: 11 },

  spot: { paddingVertical: 7, marginHorizontal: -6, paddingHorizontal: 6 },
  spotName: { fontFamily: fonts.title, fontSize: 17, lineHeight: 18, color: colors.deep },
  spotMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },

  letter: { marginBottom: 12 },
  quote: { fontFamily: fonts.italic, fontSize: 18, lineHeight: 24, color: colors.ink },
  sig: { fontFamily: fonts.bold, fontSize: 11, color: colors.teal, marginTop: 4, letterSpacing: 0.4 },

  inside: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    marginHorizontal: -6,
    paddingHorizontal: 6,
  },
});
