import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/Session';
import { activityToday, campusPlaceStats, topPlacesWorld } from '../lib/api';
import { getPlace } from '../data/campuses';
import { MODES, bestTrip, totalCost } from '../lib/trip';
import { Chip, CollageHeader, Label, Note, Screen, Title } from '../components/ui';
import { PlaceRow } from '../components/places';
import { colors } from '../theme';

const KINDS = [
  { id: 'hall', label: 'Dining halls' },
  { id: 'spot', label: 'Cheap eats' },
  { id: 'world', label: 'Worldwide' },
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
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState(route.params?.kind || 'hall');
  const [sort, setSort] = useState('near');
  const [activity, setActivity] = useState({});
  const [stats, setStats] = useState({});
  const [world, setWorld] = useState([]);

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

  const places = kind === 'world' ? world.map((p) => getPlace(p.id)) : campus.places.filter((p) => p.kind === kind);
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

  const header = (
    <View>
      <CollageHeader
        height={insets.top + 96}
        tone="orange"
        pieces={[
          { name: 'tile', size: 70, rotate: 10, right: 24, top: insets.top + 22 },
          { name: 'lemon', size: 74, rotate: -12, right: 96, top: insets.top + 66 },
        ]}
      />
      <View style={styles.head}>
        <Label>{campus.name}</Label>
        <Title size={48}>Explore</Title>
        <View style={styles.chips}>
          {KINDS.map((k) => (
            <Chip key={k.id} label={k.label} active={kind === k.id} onPress={() => setKind(k.id)} />
          ))}
        </View>
        {kind === 'world' && (
          <Note size={16} style={styles.note}>
            The best rated places on every campus on apero, from everyone who's rated them.
          </Note>
        )}
        {kind === 'spot' && (
          <>
            <View style={[styles.chips, { marginTop: 10 }]}>
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
            <Note size={16} style={styles.note}>
              Trip times assume you {modeList(modes)}. Change that in Me → Campus & getting around.
            </Note>
          </>
        )}
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
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
            onPress={() => navigation.navigate('Place', { placeId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { padding: 22, paddingTop: 28, paddingBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  small: { paddingVertical: 5, paddingHorizontal: 12 },
  note: { color: colors.muted, marginTop: 12 },
});
