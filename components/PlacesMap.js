// Explore's map view: every place on the current list as a pin around you (or around campus),
// and the place you tap slides up as a card underneath.
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';
import MapFrame from './MapFrame';
import { PlaceRow } from './places';
import { Hint } from './ui';
import { mapHtml } from '../lib/mapHtml';
import { placeLocations } from '../lib/outside';
import { CAMPUS_COORDS, PLACE_COORDS } from '../data/coords';
import { colors, fonts } from '../theme';

const milesBetween = (a, b) => {
  const dLat = (a[0] - b[0]) * 69;
  const dLng = (a[1] - b[1]) * 69 * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
};

// ask once per app session; the answer is the same every time you open the map
let askedFor = null;

async function whereAmI() {
  if (askedFor) return askedFor;
  askedFor = (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return [pos.coords.latitude, pos.coords.longitude];
    } catch {
      return null;
    }
  })();
  return askedFor;
}

const toneFor = (p) => (p.kind === 'hall' ? 'hall' : p.occasion === 'date' ? 'date' : 'spot');

export default function PlacesMap({ places, campus, modes, statsFor, activityFor, onOpen }) {
  const [you, setYou] = useState(undefined); // undefined = still asking
  const [picked, setPicked] = useState(null);
  const [google, setGoogle] = useState({});
  const center = CAMPUS_COORDS[campus.id];
  const { height } = useWindowDimensions();

  useEffect(() => {
    let live = true;
    whereAmI().then((spot) => live && setYou(spot));
    placeLocations(campus, center).then((found) => live && setGoogle(found));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus.id]);

  // only use your location when you're actually around campus
  const near = you && center && milesBetween(you, center) < 15 ? you : null;

  // Google Maps' spot when the site has a key, otherwise the backup list
  const spotOf = (id) => google[id] || PLACE_COORDS[id];
  const pins = places
    .filter((p) => spotOf(p.id))
    .map((p) => {
      const s = statsFor(p.id);
      return {
        id: p.id,
        lat: spotOf(p.id)[0],
        lng: spotOf(p.id)[1],
        tone: toneFor(p),
        score: s?.ratingCount > 0 ? s.score.toFixed(1) : null,
      };
    });
  const key = pins.map((p) => `${p.id}${p.score}${p.lat}`).join() + String(near);

  const html = useMemo(
    () => (center ? mapHtml({ pins, center, you: near, campusLabel: campus.short }) : null),
    // rebuild only when the pins or your spot change, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, campus.id],
  );

  const place = picked && places.find((p) => p.id === picked);
  const unmapped = places.length - pins.length;

  return (
    <View>
      <View>
        <View style={[styles.frame, { height: Math.max(320, height * 0.5) }]}>
          {html && <MapFrame html={html} onMessage={(m) => setPicked(m.id || null)} />}
        </View>
        {/* the place you tapped floats over the bottom of the map */}
        {place && (
          <View style={styles.cardOver}>
            <PlaceRow
              place={place}
              campus={campus}
              modes={modes}
              stats={statsFor(place.id)}
              activity={activityFor(place.id)}
              onPress={() => onOpen(place)}
            />
          </View>
        )}
      </View>
      <View style={styles.legend}>
        <Dot color={colors.teal} label="Dining hall" />
        <Dot color={colors.orange} label="Eat out" />
        <Dot color={colors.blood} label="Date night" />
        {near && <Dot color={colors.cobalt} label="You" />}
      </View>
      <Hint style={styles.hint} arrow="↑">
        {place
          ? 'tap the card to open it, or tap the map to close it'
          : you === null || (you && !near)
            ? `showing ${campus.short}. tap a pin to see the place`
            : 'tap a pin to see the place, pinch to zoom'}
      </Hint>
      {unmapped > 0 && (
        <Text style={styles.small}>
          {unmapped} place{unmapped === 1 ? '' : 's'} on the list {unmapped === 1 ? "isn't" : "aren't"} on the map yet.
        </Text>
      )}
    </View>
  );
}

function Dot({ color, label }) {
  return (
    <View style={styles.dotRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.dotLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.mist,
  },
  cardOver: { position: 'absolute', left: 6, right: 6, bottom: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginHorizontal: 22, marginTop: 10, marginBottom: 12 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink },
  hint: { marginHorizontal: 22, marginBottom: 14 },
  small: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginHorizontal: 22, marginBottom: 12 },
});
