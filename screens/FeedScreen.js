import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { campusFeed, friendsFeed } from '../lib/api';
import { Button, Chip, Empty, Loading, Screen } from '../components/ui';
import { ReviewCard, makeLike } from '../components/rows';

export default function FeedScreen({ navigation, route }) {
  const { campus, user, following } = useSession();
  const [scope, setScope] = useState(route.params?.scope || 'campus');
  const [feed, setFeed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = scope === 'friends' ? friendsFeed(following) : campusFeed(campus.id);
    setFeed(await rows.catch(() => []));
    setRefreshing(false);
  }, [campus.id, scope, following.join(',')]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const like = makeLike(setFeed, user.uid);

  const header = (
    <View style={styles.toggle}>
      <Chip label={`Everyone at ${campus.short}`} active={scope === 'campus'} onPress={() => setScope('campus')} />
      <Chip label="Friends" active={scope === 'friends'} onPress={() => setScope('friends')} />
    </View>
  );

  return (
    <Screen tone="cobalt">
      <FlatList
        data={feed || []}
        keyExtractor={(r) => r.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 40 }}
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
          feed === null ? (
            <Loading />
          ) : scope === 'friends' ? (
            <Empty title="Quiet in here" body="Add some friends and their reviews show up here.">
              <Button
                label="Find friends"
                kind="citrus"
                onPress={() => navigation.navigate('MeTab', { screen: 'Friends', initial: false })}
                style={{ marginTop: 16 }}
              />
            </Empty>
          ) : (
            <Empty title={`Nobody at ${campus.short} has posted yet`} body="Your review could be the first one." />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
});
