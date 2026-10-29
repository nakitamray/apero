import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/Session';
import { activityToday } from '../lib/api';
import { MODES, bestTrip, totalCost } from '../lib/trip';
import { Chip, Kicker, Stripes, Title } from '../components/ui';
import { PlaceRow } from '../components/places';
import { colors, fonts } from '../theme';

const KINDS = [
  { id: 'hall', label: 'Dining halls' },
  { id: 'spot', label: 'Cheap eats' },
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

  useEffect(() => {
    if (route.params?.kind) setKind(route.params.kind);
  }, [route.params?.kind]);

  useFocusEffect(
    useCallback(() => {
      activityToday(campus.id).then(setActivity).catch(() => setActivity({}));
    }, [campus.id]),
  );

  const places = campus.places.filter((p) => p.kind === kind);
  if (kind === 'spot') {
    const trip = (p) => bestTrip(p, campus, modes);
    const reachable = (p) => (trip(p) ? 0 : 1);
    const sorters = {
      near: (a, b) => reachable(a) - reachable(b) || (trip(a)?.minutes ?? 99) - (trip(b)?.minutes ?? 99),
      cheap: (a, b) => reachable(a) - reachable(b) || totalCost(a, trip(a)) - totalCost(b, trip(b)),
      busy: (a, b) => (activity[b.id] || 0) - (activity[a.id] || 0),
    };
    places.sort(sorters[sort]);
  } else {
    places.sort((a, b) => (activity[b.id] || 0) - (activity[a.id] || 0));
  }

  const header = (
    <View>
      <Stripes height={insets.top + 18} light={colors.mist} dark={colors.sky} count={11} />
      <View style={styles.head}>
        <Kicker>{campus.name}</Kicker>
        <Title size={34}>Explore</Title>
        <View style={styles.chips}>
          {KINDS.map((k) => (
            <Chip key={k.id} label={k.label} active={kind === k.id} onPress={() => setKind(k.id)} />
          ))}
        </View>
        {kind === 'spot' && (
          <>
            <View style={[styles.chips, { marginTop: 10 }]}>
              {SORTS.map((s) => (
                <Chip key={s.id} label={s.label} active={sort === s.id} onPress={() => setSort(s.id)} style={styles.small} />
              ))}
            </View>
            <Text style={styles.note}>
              Trip times assume you {modeList(modes)}. Change that in Me → Campus & getting around.
            </Text>
          </>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      data={places}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 40 }}
      renderItem={({ item }) => (
        <PlaceRow
          place={item}
          campus={campus}
          modes={modes}
          activity={activity[item.id]}
          onPress={() => navigation.navigate('Place', { placeId: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  head: { padding: 20, paddingBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  small: { paddingVertical: 5, paddingHorizontal: 11 },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 12, lineHeight: 17 },
});
