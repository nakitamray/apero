import React, { useCallback, useState } from 'react';
import { Linking, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bus, Car, Footprints, MapPin, Plus } from 'lucide-react-native';
import { useSession } from '../context/Session';
import { getPlace, priceTag } from '../data/campuses';
import { placeDishes } from '../lib/api';
import { currentMeal, todayKey } from '../lib/time';
import { mealCost, money, tripOptions } from '../lib/trip';
import { Button, Chip, Empty, Label, Loading, Paper, Screen, Title } from '../components/ui';
import { DishRow } from '../components/rows';
import { Sticker } from '../components/art';
import { colors, fonts } from '../theme';

const MEALS = ['Breakfast', 'Lunch', 'Dinner'];
const MODE_ICONS = { walk: Footprints, transit: Bus, car: Car };

const servedAt = (dish, meal) =>
  dish.mealsServed?.some(
    (m) => m.name === meal || (meal === 'Lunch' && m.name === 'Late Lunch') || m.name === 'Brunch',
  );

const byScore = (a, b) => (b.score ?? -1) - (a.score ?? -1) || a.name.localeCompare(b.name);

function TripTable({ place, campus, modes }) {
  return (
    <Paper tilt={-0.6} tape tint={colors.butter} outer={{ marginTop: 22 }} style={{ gap: 10, paddingTop: 20 }}>
      <Label>Getting there · meal about {money(mealCost(place))}</Label>
      {tripOptions(place, campus).map((o) => {
        const Icon = MODE_ICONS[o.mode];
        const yours = modes.includes(o.mode);
        return (
          <View key={o.mode} style={[styles.tripRow, !yours && { opacity: 0.4 }]}>
            <Icon size={18} color={colors.cobalt} strokeWidth={1.6} />
            <Text style={styles.tripMode}>
              {o.mode === 'transit' ? o.label : o.label[0].toUpperCase() + o.label.slice(1)}
            </Text>
            <Text style={styles.tripMin}>{o.minutes} min</Text>
            <Text style={styles.tripCost}>{o.mode === 'car' ? `~${money(o.cost)} gas` : money(o.cost)}</Text>
          </View>
        );
      })}
      <Text style={styles.tripNote}>Rough numbers, round trip. Faded rows are ways you said you don't get around.</Text>
    </Paper>
  );
}

export default function PlaceScreen({ navigation, route }) {
  const place = getPlace(route.params.placeId);
  const { campus, modes } = useSession();
  const [dishes, setDishes] = useState(null);
  const [picked, setPicked] = useState(null);

  useFocusEffect(
    useCallback(() => {
      placeDishes(place.id)
        .then(setDishes)
        .catch(() => setDishes([]));
    }, [place.id]),
  );

  const today = todayKey();
  const servedToday = (dishes || []).filter((d) => d.lastServedDate === today);
  const hasMenu = servedToday.length > 0;
  // default to whatever meal it is now, unless that meal has nothing on it
  const now = currentMeal();
  const meal =
    picked ||
    (servedToday.some((d) => servedAt(d, now))
      ? now
      : MEALS.find((m) => servedToday.some((d) => servedAt(d, m))) || now);

  let sections = [];
  if (dishes && hasMenu && meal !== 'All') {
    const byStation = {};
    servedToday
      .filter((d) => servedAt(d, meal))
      .forEach((d) => {
        const station = d.station || 'Menu';
        (byStation[station] = byStation[station] || []).push(d);
      });
    sections = Object.keys(byStation)
      .sort()
      .map((title) => ({ title, data: byStation[title].sort(byScore) }));
  } else if (dishes) {
    sections = dishes.length
      ? [{ title: hasMenu ? 'Everything we know about' : 'Dishes', data: [...dishes].sort(byScore) }]
      : [];
  }

  const addDish = () =>
    navigation.navigate('ReviewTab', { screen: 'AddDish', params: { placeId: place.id }, initial: false });

  const directions = () =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${campus.city}`)}`,
    );

  const header = (
    <View style={styles.head}>
      <Sticker name={place.kind === 'spot' ? 'bloodOrange' : 'tile'} width={76} rotate={10} style={styles.corner} />
      <Label color={place.kind === 'spot' ? colors.orange : colors.teal}>
        {place.kind === 'spot' ? `Cheap eats · ${priceTag(place.price)} · ${place.cuisine}` : 'Dining hall'}
      </Label>
      <Title size={46} style={{ paddingRight: 70 }}>
        {place.name}
      </Title>
      <View style={styles.area}>
        <MapPin size={14} color={colors.muted} strokeWidth={1.6} />
        <Text style={styles.areaText}>{place.area}</Text>
      </View>

      {place.kind === 'spot' && <TripTable place={place} campus={campus} modes={modes} />}

      <View style={styles.buttons}>
        <Button label="Directions" kind="light" onPress={directions} style={{ flex: 1 }} />
        <Button
          label="Add a dish"
          kind="citrus"
          onPress={addDish}
          icon={<Plus size={18} color={colors.paper} />}
          style={{ flex: 1 }}
        />
      </View>

      {hasMenu && (
        <View style={styles.meals}>
          {[...MEALS, 'All'].map((m) => (
            <Chip key={m} label={m === 'All' ? 'Everything' : m} active={meal === m} onPress={() => setPicked(m)} />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderSectionHeader={({ section }) => <Text style={styles.station}>{section.title}</Text>}
        renderItem={({ item, index }) => (
          <DishRow
            dish={item}
            index={index}
            subtitle={item.station || place.name}
            onPress={() => navigation.navigate('Dish', { dishId: item.id })}
          />
        )}
        ListEmptyComponent={
          dishes === null ? (
            <Loading />
          ) : (
            <Empty
              title={hasMenu ? `Nothing listed for ${meal.toLowerCase()}` : 'No dishes here yet'}
              body={hasMenu ? 'Try another meal.' : 'Had something good here? Add it so other people can find it.'}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { padding: 22, paddingBottom: 6 },
  corner: { position: 'absolute', right: 18, top: 6 },
  area: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  areaText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tripMode: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  tripMin: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, width: 60 },
  tripCost: { fontFamily: fonts.medium, fontSize: 14, color: colors.teal, width: 84, textAlign: 'right' },
  tripNote: { fontFamily: fonts.note, fontSize: 15, color: colors.muted, lineHeight: 19 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 22 },
  meals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  station: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.orange,
    paddingHorizontal: 22,
    marginTop: 20,
    marginBottom: 10,
  },
});
