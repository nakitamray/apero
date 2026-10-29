import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { priceTag } from '../data/campuses';
import { bestTrip, describeTrip, money, totalCost } from '../lib/trip';
import { Card, Stripes } from './ui';
import { Starburst } from './art';

export function PriceBurst({ price, size = 46 }) {
  return (
    <Starburst size={size} color={colors.lemon}>
      <Text style={[styles.burstText, { fontSize: size * 0.28 }]}>{priceTag(price)}</Text>
    </Starburst>
  );
}

// little matchbox: blue striped lid on top, label underneath
export function SpotCard({ spot, campus, modes, onPress, width = 200 }) {
  const trip = bestTrip(spot, campus, modes);
  return (
    <Card onPress={onPress} outer={{ width, marginRight: 12 }} style={styles.matchbox}>
      <Stripes height={34} light={colors.mist} dark={colors.sky} count={9} />
      <View style={styles.burst}>
        <PriceBurst price={spot.price} />
      </View>
      <View style={styles.matchBody}>
        <Text style={[styles.name, { paddingRight: 44 }]} numberOfLines={2}>
          {spot.name}
        </Text>
        <Text style={styles.meta}>{spot.cuisine}</Text>
        <Text style={styles.trip} numberOfLines={2}>
          {describeTrip(trip)}
        </Text>
      </View>
    </Card>
  );
}

export function PlaceRow({ place, campus, modes, activity, onPress }) {
  const isSpot = place.kind === 'spot';
  const trip = isSpot ? bestTrip(place, campus, modes) : null;
  return (
    <Card onPress={onPress} outer={{ marginHorizontal: 20, marginBottom: 12 }} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.meta}>{isSpot ? `${place.cuisine} · ${place.area}` : place.area}</Text>
        {isSpot && (
          <Text style={styles.trip}>
            {describeTrip(trip)}
            {trip ? ` · about ${money(totalCost(place, trip))} all in` : ''}
          </Text>
        )}
        {activity > 0 && <Text style={styles.busy}>{activity} rated here today</Text>}
      </View>
      {isSpot && <PriceBurst price={place.price} size={50} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  matchbox: { padding: 0, overflow: 'hidden' },
  burst: { position: 'absolute', right: 8, top: 10 },
  matchBody: { padding: 12, paddingTop: 10, minHeight: 112 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, lineHeight: 20, paddingRight: 4 },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 3 },
  trip: { fontFamily: fonts.mono, fontSize: 11, color: colors.cobalt, marginTop: 8, lineHeight: 16 },
  busy: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.blood, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  burstText: { fontFamily: fonts.monoBold, color: colors.ink },
});
