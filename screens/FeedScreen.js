import React, { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { campusFeed } from '../lib/api';
import { Empty, Loading, Screen } from '../components/ui';
import { ReviewCard, makeLike } from '../components/rows';

export default function FeedScreen({ navigation }) {
  const { campus, user } = useSession();
  const [feed, setFeed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setFeed(await campusFeed(campus.id).catch(() => []));
    setRefreshing(false);
  }, [campus.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const like = makeLike(setFeed, user.uid);

  if (!feed)
    return (
      <Screen>
        <Loading />
      </Screen>
    );

  return (
    <Screen>
      <FlatList
        data={feed}
        keyExtractor={(r) => r.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        contentContainerStyle={{ paddingTop: 22, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <ReviewCard
            index={index}
            review={item}
            uid={user.uid}
            onLike={like}
            onPressDish={() => navigation.navigate('Dish', { dishId: item.dishId })}
          />
        )}
        ListEmptyComponent={
          <Empty title={`Nobody at ${campus.short} has posted yet`} body="Your review could be the first one." />
        }
      />
    </Screen>
  );
}
