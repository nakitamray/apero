import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSession } from '../context/Session';
import { moodDishes } from '../lib/api';
import { moodLabel } from '../lib/tags';
import { Empty, Loading, Screen } from '../components/ui';
import { DishRow } from '../components/rows';

export default function MoodScreen({ navigation, route }) {
  const { mood } = route.params;
  const { campus } = useSession();
  const [dishes, setDishes] = useState(null);

  useLayoutEffect(() => navigation.setOptions({ title: moodLabel(mood) }), [navigation, mood]);

  useEffect(() => {
    moodDishes(campus.id, mood)
      .then(setDishes)
      .catch(() => setDishes([]));
  }, [campus.id, mood]);

  if (!dishes)
    return (
      <Screen>
        <Loading />
      </Screen>
    );

  return (
    <Screen>
      <FlatList
        data={dishes}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <DishRow dish={item} index={index} onPress={() => navigation.navigate('Dish', { dishId: item.id })} />
        )}
        ListEmptyComponent={
          <Empty title="Nothing tagged like that yet" body="When people add dishes they can tag the mood." />
        }
      />
    </Screen>
  );
}
