import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { campusPeople, findUserByHandle, myRankings, usersByIds } from '../lib/api';
import { tasteMatch } from '../lib/taste';
import { Button, Field, Loading, Note, Screen, SectionHeader, Sub } from '../components/ui';
import { FollowButton, MatchBadge, PersonRow } from '../components/people';

export default function FriendsScreen({ navigation }) {
  const { user, profile, campus, following, follow } = useSession();
  const [friends, setFriends] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [search, setSearch] = useState('');
  const [found, setFound] = useState(undefined);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        const [mine, people, others] = await Promise.all([
          myRankings(user.uid),
          usersByIds(following),
          campusPeople(campus.id),
        ]);
        const withMatch = await Promise.all(
          people.map(async (p) => ({ ...p, match: tasteMatch(mine, await myRankings(p.id)).percent })),
        );
        if (!live) return;
        setFriends(withMatch.sort((a, b) => (b.match ?? -1) - (a.match ?? -1)));
        setNearby(others.filter((p) => p.id !== user.uid && !following.includes(p.id)).slice(0, 8));
      })().catch(() => setFriends([]));
      return () => {
        live = false;
      };
    }, [user.uid, campus.id, following.join(',')]),
  );

  const lookUp = async () => setFound(await findUserByHandle(search.trim()));
  const open = (p) => navigation.navigate('Friend', { uid: p.id });

  return (
    <Screen tone="orange">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.search}>
          <Note size={18} style={{ marginBottom: 10 }}>
            Your handle is @{profile?.handle}. Send it to friends so they can add you.
          </Note>
          <View style={styles.searchRow}>
            <Field
              placeholder="@handle"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={lookUp}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Button label="Find" onPress={lookUp} disabled={!search.trim()} style={{ paddingHorizontal: 20 }} />
          </View>
          {found === null && <Sub style={{ marginTop: 8 }}>Nobody with that handle yet.</Sub>}
        </View>
        {found && (
          <PersonRow
            user={found}
            onPress={() => open(found)}
            right={
              <FollowButton
                following={following.includes(found.id)}
                onPress={() => follow(found.id, !following.includes(found.id))}
              />
            }
          />
        )}

        <SectionHeader label="Sorted by taste match" title="Your friends" />
        {friends === null ? (
          <Loading />
        ) : friends.length ? (
          friends.map((p, i) => (
            <PersonRow key={p.id} user={p} index={i} onPress={() => open(p)} right={<MatchBadge percent={p.match} />} />
          ))
        ) : (
          <Sub style={styles.empty}>No friends yet. Add a few people below.</Sub>
        )}

        {nearby.length > 0 && (
          <>
            <SectionHeader label={`Eating at ${campus.short}`} title="People you might know" />
            {nearby.map((p, i) => (
              <PersonRow
                key={p.id}
                user={p}
                index={i + 2}
                onPress={() => open(p)}
                right={<FollowButton following={false} onPress={() => follow(p.id, true)} />}
              />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: 22, paddingTop: 18, marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  empty: { paddingHorizontal: 22 },
});
