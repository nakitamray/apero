import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { campusFeed, friendsFeed } from '../lib/api';
import { Button, Chip, Empty, Hint, Loading, Screen } from '../components/ui';
import { ReviewCard, makeLike } from '../components/rows';
import { PhotoGrid } from '../components/grid';

export default function FeedScreen({ navigation, route }) {
  const { campus, user, following } = useSession();
  const [scope, setScope] = useState(route.params?.scope || 'campus');
  const [view, setView] = useState('posts');
  const [feed, setFeed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = scope === 'friends' ? friendsFeed(following, 40, user.uid) : campusFeed(campus.id, 40);
    setFeed(await rows.catch(() => []));
    setRefreshing(false);
  }, [campus.id, scope, following.join(','), user.uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const like = makeLike(setFeed, user.uid);
  const openDish = (r) => navigation.navigate('Dish', { dishId: r.dishId });
  const empty = feed && !feed.length;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View style={styles.toggles}>
          <View style={styles.row}>
            <Chip
              label={`Everyone at ${campus.short}`}
              active={scope === 'campus'}
              onPress={() => setScope('campus')}
            />
            <Chip label="Friends" active={scope === 'friends'} onPress={() => setScope('friends')} />
          </View>
          <View style={styles.row}>
            <Chip label="Posts" active={view === 'posts'} onPress={() => setView('posts')} />
            <Chip label="Photos" active={view === 'photos'} onPress={() => setView('photos')} />
          </View>
          <Hint arrow="">
            {view === 'photos' ? 'tap a photo to open the dish' : 'swipe a post’s photos, tap the dish to open it'}
          </Hint>
        </View>

        {feed === null ? (
          <Loading />
        ) : empty && scope === 'friends' ? (
          <Empty title="Quiet in here" body="Add some friends and their reviews show up here.">
            <Button
              label="Find friends"
              kind="citrus"
              onPress={() => navigation.navigate('MeTab', { screen: 'Friends', initial: false })}
              style={{ marginTop: 16 }}
            />
          </Empty>
        ) : empty ? (
          <Empty title={`Nobody at ${campus.short} has posted yet`} body="Your review could be the first one." />
        ) : view === 'photos' && !feed.some((r) => r.photos?.length) ? (
          <Empty title="No photos yet" body="Add a photo when you rate something and it shows up here." />
        ) : view === 'photos' ? (
          <PhotoGrid key={scope} reviews={feed} onPress={openDish} />
        ) : (
          feed.map((r, i) => (
            <ReviewCard key={r.id} index={i} review={r} uid={user.uid} onLike={like} onPressDish={() => openDish(r)} />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggles: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, gap: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
