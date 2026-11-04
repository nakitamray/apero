import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSession } from '../context/Session';
import { moodDishes } from '../lib/api';
import { moodLabel } from '../lib/tags';
import { Empty, Loading, Screen } from '../components/ui';
import { DishMenu } from '../components/rows';

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
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>
        {dishes.length ? (
          <DishMenu
            title={moodLabel(mood)}
            dishes={dishes}
            onPress={(d) => navigation.navigate('Dish', { dishId: d.id })}
          />
        ) : (
          <Empty title="Nothing tagged like that yet" body="When people add dishes they can tag the mood." />
        )}
      </ScrollView>
    </Screen>
  );
}
