import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { List, Map as MapIcon } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { activityToday, campusPlaceStats, topPlacesWorld } from '../lib/api';
import { getPlace } from '../data/campuses';
import { MODES, bestTrip, totalCost } from '../lib/trip';
import { Chip, Hint, Masthead, Note, Screen } from '../components/ui';
import { PlaceRow } from '../components/places';
import PlacesMap from '../components/PlacesMap';
import { colors, fonts } from '../theme';

const KINDS = [
  { id: 'hall', label: 'Dining halls' },
  { id: 'spot', label: 'Eat out' },
  { id: 'world', label: 'Worldwide' },
];

// what kind of night out
const PRICES = [
  { id: 'any', label: 'Any price' },
  { id: 'cheap', label: '$ only' },
  { id: 'date', label: 'Date night' },
];

const SORTS = [
  { id: 'near', label: 'Closest' },
  { id: 'cheap', label: 'Cheapest all in' },
  { id: 'busy', label: 'Busiest today' },
];

const modeList = (modes) =>
  MODES.filter((m) => modes.includes(m.id))
    .map((m) => ({ walk: 'walk', transit: 'take the bus or train', car: 'drive' })[m.id])
    .join(' or ');

export default function ExploreScreen({ navigation, route }) {
  const { campus, modes } = useSession();
  const [kind, setKind] = useState(route.params?.kind || 'hall');
  const [sort, setSort] = useState('near');
  const [price, setPrice] = useState('any');
  const [activity, setActivity] = useState({});
  const [stats, setStats] = useState({});
  const [world, setWorld] = useState([]);
  const [view, setView] = useState('list');

  useEffect(() => {
    if (route.params?.kind) setKind(route.params.kind);
  }, [route.params?.kind]);

  useFocusEffect(
    useCallback(() => {
      activityToday(campus.id)
        .then(setActivity)
        .catch(() => setActivity({}));
      campusPlaceStats(campus.id)
        .then(setStats)
        .catch(() => setStats({}));
      topPlacesWorld(20)
        .then((rows) => setWorld(rows.filter((p) => getPlace(p.id))))
        .catch(() => setWorld([]));
    }, [campus.id]),
  );

  const places = (
    kind === 'world' ? world.map((p) => getPlace(p.id)) : campus.places.filter((p) => p.kind === kind)
  ).filter((p) => kind !== 'spot' || price === 'any' || (price === 'cheap' ? p.price === 1 : p.occasion === 'date'));
  const statsFor = (id) => (kind === 'world' ? world.find((p) => p.id === id) : stats[id]);
  if (kind === 'spot') {
    const trip = (p) => bestTrip(p, campus, modes);
    const reachable = (p) => (trip(p) ? 0 : 1);
    const sorters = {
      near: (a, b) => reachable(a) - reachable(b) || (trip(a)?.minutes ?? 99) - (trip(b)?.minutes ?? 99),
      cheap: (a, b) => reachable(a) - reachable(b) || totalCost(a, trip(a)) - totalCost(b, trip(b)),
      busy: (a, b) => (activity[b.id] || 0) - (activity[a.id] || 0),
    };
    places.sort(sorters[sort]);
  } else if (kind === 'hall') {
    places.sort(
      (a, b) => (stats[b.id]?.score ?? 0) - (stats[a.id]?.score ?? 0) || (activity[b.id] || 0) - (activity[a.id] || 0),
    );
  }

  const onMap = view === 'map' && kind !== 'world';
  const open = (p) => navigation.navigate('Place', { placeId: p.id });

  if (onMap) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {header()}
          <PlacesMap
            places={places}
            campus={campus}
            modes={modes}
            statsFor={statsFor}
            activityFor={(id) => activity[id]}
            onOpen={open}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={places}
        ListHeaderComponentStyle={{ marginBottom: 6 }}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header()}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <PlaceRow
            place={item}
            index={index}
            campus={campus}
            modes={modes}
            activity={kind === 'world' ? 0 : activity[item.id]}
            stats={statsFor(item.id)}
            worldwide={kind === 'world'}
            onPress={() => open(item)}
          />
        )}
      />
    </Screen>
  );

  function header() {
    return (
      <View>
        <Masthead kicker={campus.name} title="Explore" accent={campus.short} sticker="tile" stickerSize={104} />
        <View style={styles.head}>
          <View style={styles.chips}>
            {KINDS.map((k) => (
              <Chip key={k.id} label={k.label} active={kind === k.id} onPress={() => setKind(k.id)} />
            ))}
          </View>
          {kind !== 'world' && <ViewSwitch view={view} onChange={setView} />}
          {!onMap && (
            <Hint style={{ marginTop: 12 }} arrow="↓">
              tap a place for its menu, map and reviews
            </Hint>
          )}
          {kind === 'world' && (
            <Note size={14} style={styles.note}>
              The best rated places on every campus on apero, from everyone who's rated them.
            </Note>
          )}
          {kind === 'spot' && (
            <>
              <View style={[styles.chips, { marginTop: 10 }]}>
                {PRICES.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.label}
                    active={price === p.id}
                    onPress={() => setPrice(p.id)}
                    style={styles.small}
                  />
                ))}
              </View>
              <View style={[styles.chips, { marginTop: 8 }]}>
                {SORTS.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    active={sort === s.id}
                    onPress={() => setSort(s.id)}
                    style={styles.small}
                  />
                ))}
              </View>
              {!onMap && (
                <Note size={14} style={styles.note}>
                  Everything within a 25 min walk or 20 min drive. Trip times assume you {modeList(modes)}; change that
                  in Me.
                </Note>
              )}
            </>
          )}
        </View>
      </View>
    );
  }
}

// List / Map switch, two halves of one pill
function ViewSwitch({ view, onChange }) {
  return (
    <View style={styles.switch}>
      {[
        { id: 'list', label: 'List', Icon: List },
        { id: 'map', label: 'Map', Icon: MapIcon },
      ].map(({ id, label, Icon }) => {
        const on = view === id;
        return (
          <Pressable key={id} onPress={() => onChange(id)} style={[styles.half, on && styles.halfOn]}>
            <Icon size={15} color={on ? colors.paper : colors.ink} strokeWidth={1.8} />
            <Text style={[styles.halfText, on && { color: colors.paper }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  small: { paddingVertical: 5, paddingHorizontal: 12 },
  note: { marginTop: 12 },
  switch: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 999,
    overflow: 'hidden',
  },
  half: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 16 },
  halfOn: { backgroundColor: colors.deep },
  halfText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
});
