import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { getUser, myRankings } from '../lib/api';
import { tasteMatch } from '../lib/taste';
import { toTen } from '../lib/score';
import { getCampus } from '../data/campuses';
import { Loading, Note, Platter, Screen, SectionHeader, Sub, Title } from '../components/ui';
import { DishMenu } from '../components/rows';
import { Avatar, FollowButton, MatchBadge } from '../components/people';
import { colors, fonts } from '../theme';

export default function FriendScreen({ navigation, route }) {
  const { uid } = route.params;
  const { user, following, follow } = useSession();
  const [person, setPerson] = useState(null);
  const [theirs, setTheirs] = useState([]);
  const [match, setMatch] = useState(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getUser(uid), myRankings(uid), myRankings(user.uid)]).then(([p, list, mine]) => {
        setPerson(p);
        setTheirs(list);
        setMatch(tasteMatch(mine, list));
      });
    }, [uid, user.uid]),
  );

  useLayoutEffect(() => navigation.setOptions({ title: person?.name || '' }), [navigation, person]);

  if (!person || !match) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const isFriend = following.includes(uid);
  const openDish = (id) => navigation.navigate('Dish', { dishId: id });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.head}>
          <Avatar user={person} size={84} />
          <Title size={44} style={{ marginTop: 8 }}>
            {person.name}
          </Title>
          <Sub>
            @{person.handle} · {getCampus(person.campusId)?.short}
          </Sub>
          {uid !== user.uid && (
            <View style={{ marginTop: 12 }}>
              <FollowButton following={isFriend} onPress={() => follow(uid, !isFriend)} />
            </View>
          )}
        </View>

        <Platter tone="orange" outer={styles.block} style={styles.matchBox}>
          <MatchBadge percent={match.percent} size={84} />
          <View style={{ flex: 1 }}>
            <Text style={styles.matchTitle}>Taste match</Text>
            <Text style={styles.matchLine}>
              {match.percent == null
                ? `You've only got ${match.shared.length} dish in common so far. Rate a few more of the same things to see how you line up.`
                : `${match.shared.length} dishes in common${match.bothLoved.length ? `, ${match.bothLoved.length} you both loved` : ''}.`}
            </Text>
          </View>
        </Platter>

        {match.bothLoved.length > 0 && (
          <>
            <SectionHeader title="You both loved" />
            <DishMenu dishes={match.bothLoved} scoreFor={(r) => toTen(r.elo)} onPress={(r) => openDish(r.dishId)} />
          </>
        )}

        {match.toTry.length > 0 && (
          <>
            <SectionHeader label="They loved it, you haven't had it" title="Try these" />
            <DishMenu
              dishes={match.toTry.slice(0, 4)}
              scoreFor={(r) => toTen(r.elo)}
              onPress={(r) => openDish(r.dishId)}
            />
          </>
        )}

        <SectionHeader title={`${person.name}'s list`} />
        {theirs.length ? (
          <DishMenu
            title={`${person.name}'s list`}
            dishes={theirs.slice(0, 12)}
            rankFrom={1}
            scoreFor={(r) => toTen(r.elo)}
            onPress={(r) => openDish(r.dishId)}
          />
        ) : (
          <Note style={{ paddingHorizontal: 22 }}>Nothing ranked yet.</Note>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', paddingTop: 22 },
  block: { marginHorizontal: 20, marginTop: 24 },
  matchBox: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  matchTitle: { fontFamily: fonts.title, fontSize: 30, color: colors.ink },
  matchLine: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: 2 },
});
