import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { campusFeed } from '../lib/api';
import { Empty, Loading } from '../components/ui';
import { ReviewCard, makeLike } from '../components/rows';
import { colors } from '../theme';

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

  if (!feed) return <Loading />;

  return (
    <FlatList
      style={styles.screen}
      data={feed}
      keyExtractor={(r) => r.id}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
      renderItem={({ item }) => (
        <ReviewCard
          review={item}
          uid={user.uid}
          onLike={like}
          onPressDish={() => navigation.navigate('Dish', { dishId: item.dishId })}
        />
      )}
      ListEmptyComponent={<Empty title={`Nobody at ${campus.short} has posted yet`} body="Your review could be the first one." />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
});
