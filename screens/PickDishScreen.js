import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/Session';
import { campusDishes } from '../lib/api';
import { todayKey } from '../lib/time';
import { Button, Chip, Field, Kicker, Loading, Stripes, Title } from '../components/ui';
import { DishRow } from '../components/rows';
import { colors, fonts } from '../theme';

export default function PickDishScreen({ navigation }) {
  const { campus } = useSession();
  const insets = useSafeAreaInsets();
  const [dishes, setDishes] = useState(null);
  const [search, setSearch] = useState('');
  const [placeId, setPlaceId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      campusDishes(campus.id)
        .then(setDishes)
        .catch(() => setDishes([]));
    }, [campus.id]),
  );

  const results = useMemo(() => {
    if (!dishes) return [];
    const term = search.trim().toLowerCase();
    const today = todayKey();
    return dishes
      .filter((d) => !placeId || d.placeId === placeId)
      .filter((d) => (term ? d.name.toLowerCase().includes(term) : d.lastServedDate === today || !d.lastServedDate))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 60);
  }, [dishes, search, placeId]);

  const addNew = () => navigation.navigate('AddDish', { name: search.trim(), placeId });

  const header = (
    <View>
      <Stripes height={insets.top + 18} count={9} />
      <View style={styles.head}>
        <Kicker>Rate something</Kicker>
        <Title size={34}>What did you eat?</Title>
        <Field
          placeholder="Search dishes"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          style={{ marginTop: 16, marginBottom: 0 }}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Anywhere" active={!placeId} onPress={() => setPlaceId(null)} />
        {campus.places.map((p) => (
          <Chip key={p.id} label={p.name} active={placeId === p.id} onPress={() => setPlaceId(p.id)} />
        ))}
      </ScrollView>
      {!search && dishes?.length > 0 && <Text style={styles.hint}>Showing what's on today. Search to find anything else.</Text>}
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      data={results}
      keyExtractor={(d) => d.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
      renderItem={({ item }) => (
        <DishRow dish={item} onPress={() => navigation.navigate('WriteReview', { dishId: item.id })} />
      )}
      ListEmptyComponent={dishes === null ? <Loading /> : null}
      ListFooterComponent={
        dishes && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{search ? `No luck finding "${search.trim()}"?` : "Don't see it?"}</Text>
            <Button label="Add it yourself" kind="ink" onPress={addNew} />
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  head: { padding: 20, paddingBottom: 12 },
  chips: { paddingHorizontal: 20, gap: 8, paddingBottom: 14 },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, paddingHorizontal: 20, marginBottom: 12 },
  footer: { paddingHorizontal: 20, marginTop: 10, gap: 12 },
  footerText: { fontFamily: fonts.displayItalic, fontSize: 18, color: colors.ink },
});
