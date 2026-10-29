import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/Session';
import { campusDishes } from '../lib/api';
import { todayKey } from '../lib/time';
import { Button, Chip, CollageHeader, Field, Label, Loading, Note, Screen, Title } from '../components/ui';
import { DishRow } from '../components/rows';
import { colors } from '../theme';

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
      <CollageHeader
        height={insets.top + 96}
        tone="cobalt"
        pieces={[
          { name: 'bloodOrange', size: 72, rotate: -10, right: 26, top: insets.top + 20 },
          { name: 'sardine', size: 160, rotate: 6, right: 70, top: insets.top + 78 },
        ]}
      />
      <View style={styles.head}>
        <Label>Rate something</Label>
        <Title size={48}>What did you eat?</Title>
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
      {!search && dishes?.length > 0 && (
        <Note size={16} style={styles.hint}>
          Showing what's on today. Search to find anything else.
        </Note>
      )}
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={results}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <DishRow dish={item} index={index} onPress={() => navigation.navigate('WriteReview', { dishId: item.id })} />
        )}
        ListEmptyComponent={dishes === null ? <Loading /> : null}
        ListFooterComponent={
          dishes && (
            <View style={styles.footer}>
              <Note style={styles.footerText}>{search ? `No luck finding "${search.trim()}"?` : "Don't see it?"}</Note>
              <Button label="Add it yourself" kind="citrus" onPress={addNew} />
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { padding: 22, paddingTop: 28, paddingBottom: 12 },
  chips: { paddingHorizontal: 22, gap: 8, paddingBottom: 14 },
  hint: { color: colors.muted, paddingHorizontal: 22, marginBottom: 12 },
  footer: { paddingHorizontal: 22, marginTop: 14, gap: 12 },
  footerText: { color: colors.ink },
});
