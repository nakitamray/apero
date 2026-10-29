import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { getCampus, priceTag } from '../data/campuses';
import { bestTrip, describeTrip, money, totalCost } from '../lib/trip';
import { Paper, Plate } from './ui';
import { Sticker } from './art';
import { tiltFor } from './rows';

// each spot gets one of the painted cut-outs so the row reads like a collage
const STICKERS = ['lemon', 'orangeSlice', 'sardine', 'bloodOrange', 'lemonSlice', 'tile', 'starfish'];
const stickerFor = (id) => STICKERS[[...id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % STICKERS.length];

export function PriceTag({ price }) {
  return (
    <View style={styles.price}>
      <Text style={styles.priceText}>{priceTag(price)}</Text>
    </View>
  );
}

export function SpotCard({ spot, campus, modes, onPress, index = 0, width = 196 }) {
  const trip = bestTrip(spot, campus, modes);
  const art = stickerFor(spot.id);
  return (
    <Paper
      onPress={onPress}
      index={index}
      tilt={tiltFor(index)}
      outer={{ width, marginRight: 14, marginTop: 14 }}
      style={styles.card}
    >
      <View style={styles.cardArt}>
        <Sticker name={art} width={art === 'sardine' ? 130 : 66} rotate={index % 2 ? 10 : -8} />
      </View>
      <Text style={styles.cardName} numberOfLines={2}>
        {spot.name}
      </Text>
      <Text style={styles.meta}>
        {spot.cuisine} · {priceTag(spot.price)}
      </Text>
      <Text style={styles.trip} numberOfLines={2}>
        {describeTrip(trip)}
      </Text>
    </Paper>
  );
}

export function PlaceRow({ place, campus, modes, activity, stats, worldwide, onPress, index = 0 }) {
  const isSpot = place.kind === 'spot';
  const trip = isSpot && !worldwide ? bestTrip(place, campus, modes) : null;
  return (
    <Paper
      onPress={onPress}
      index={index}
      tilt={tiltFor(index)}
      outer={{ marginHorizontal: 20, marginBottom: 12 }}
      style={styles.row}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{place.name}</Text>
        <Text style={styles.meta}>
          {worldwide ? getCampus(place.campusId).name : isSpot ? `${place.cuisine} · ${place.area}` : place.area}
        </Text>
        {isSpot && !worldwide && (
          <Text style={styles.trip}>
            {describeTrip(trip)}
            {trip ? ` · about ${money(totalCost(place, trip))} all in` : ''}
          </Text>
        )}
        {activity > 0 && <Text style={styles.busy}>{activity} rated here today</Text>}
        {stats?.ratingCount > 0 && (
          <Text style={styles.ratings}>
            {stats.ratingCount} rating{stats.ratingCount === 1 ? '' : 's'}
            {isSpot ? ` · ${priceTag(place.price)}` : ''}
          </Text>
        )}
      </View>
      {stats?.ratingCount > 0 ? (
        <Plate score={stats.score} />
      ) : isSpot ? (
        <PriceTag price={place.price} />
      ) : (
        <Sticker name={stickerFor(place.id)} width={44} rotate={8} />
      )}
    </Paper>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 168, paddingTop: 12 },
  cardArt: { height: 66, justifyContent: 'center', marginBottom: 6 },
  cardName: { fontFamily: fonts.display, fontSize: 24, lineHeight: 26, color: colors.ink },
  rowName: { fontFamily: fonts.display, fontSize: 26, lineHeight: 28, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 3 },
  trip: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.teal,
    marginTop: 8,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  ratings: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  busy: { fontFamily: fonts.medium, fontSize: 12, color: colors.orange, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  price: {
    backgroundColor: colors.lemon,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '6deg' }],
  },
  priceText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink, letterSpacing: 1 },
});
