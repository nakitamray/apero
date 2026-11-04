import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { campusDishes } from '../lib/api';
import { todayKey } from '../lib/time';
import { Button, Chip, Field, Loading, Masthead, Note, Screen } from '../components/ui';
import { DishMenu } from '../components/rows';

export default function PickDishScreen({ navigation }) {
  const { campus } = useSession();
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
      <Masthead kicker="Rate something" title="What did" accent="you eat?" sticker="bloodOrange" stickerSize={100} />
      <View style={styles.head}>
        <Field
          placeholder="Search dishes"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          style={{ marginTop: 8, marginBottom: 0 }}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Anywhere" active={!placeId} onPress={() => setPlaceId(null)} />
        {campus.places.map((p) => (
          <Chip key={p.id} label={p.name} active={placeId === p.id} onPress={() => setPlaceId(p.id)} />
        ))}
      </ScrollView>
      {!search && dishes?.length > 0 && (
        <Note size={13} style={styles.hint}>
          Tap what you ate. Showing what's on today; search for anything else.
        </Note>
      )}
    </View>
  );

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        {header}
        {dishes === null ? (
          <Loading />
        ) : results.length > 0 ? (
          <DishMenu
            key={`${placeId}-${search}`}
            title={search ? 'found' : 'on today'}
            dishes={results}
            onPress={(d) => navigation.navigate('WriteReview', { dishId: d.id })}
          />
        ) : null}
        {dishes && (
          <View style={styles.footer}>
            <Note style={styles.footerText}>{search ? `No luck finding "${search.trim()}"?` : "Don't see it?"}</Note>
            <Button label="Add it yourself" kind="citrus" onPress={addNew} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  chips: { paddingHorizontal: 22, gap: 8, paddingBottom: 14 },
  hint: { paddingHorizontal: 22, marginBottom: 12 },
  footer: { paddingHorizontal: 22, marginTop: 22, gap: 12 },
  footerText: { textAlign: 'center' },
});
