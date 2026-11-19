import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { getPlace } from '../data/campuses';
import { dishReviews, getDish, myRanking, userReviews } from '../lib/api';
import { toTen } from '../lib/score';
import { moodLabel } from '../lib/tags';
import { todayKey } from '../lib/time';
import { Button, Empty, Label, Loading, Paper, Plate, Screen, Stamp, Tag, Title } from '../components/ui';
import { ReviewCard, makeLike } from '../components/rows';
import { Avatar } from '../components/people';
import { Sticker } from '../components/art';
import FoodArt from '../components/foodArt';
import { colors, fonts } from '../theme';

export default function DishScreen({ navigation, route }) {
  const { dishId } = route.params;
  const { user, following } = useSession();
  const [dish, setDish] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [mine, setMine] = useState(null);
  const [missing, setMissing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getDish(dishId), dishReviews(dishId, 20), myRanking(user.uid, dishId)])
        .then(async ([d, r, m]) => {
          if (!d) setMissing(true);
          // your own review always shows here (with edit / delete), even on a busy dish
          if (m && !r.some((x) => x.userId === user.uid)) {
            const own = (await userReviews(user.uid).catch(() => [])).find((x) => x.dishId === dishId);
            if (own) r = [own, ...r];
          }
          setDish(d);
          setReviews(r);
          setMine(m);
        })
        .catch(() => setMissing(true));
    }, [dishId, user.uid]),
  );

  if (missing)
    return (
      <Screen>
        <Empty title="Couldn't find that dish" />
      </Screen>
    );
  if (!dish)
    return (
      <Screen>
        <Loading />
      </Screen>
    );

  const place = getPlace(dish.placeId);
  const rate = () =>
    navigation.navigate('ReviewTab', { screen: 'WriteReview', params: { dishId: dish.id }, initial: false });

  const like = makeLike(setReviews, user.uid);
  const friendsHere = reviews.filter((r) => following.includes(r.userId));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <Pressable onPress={() => place && navigation.navigate('Place', { placeId: place.id })}>
          <Label color={colors.teal}>{dish.placeName} →</Label>
        </Pressable>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Title size={50} style={{ marginTop: 4 }}>
              {dish.name}
            </Title>
            <Sticker name="swash" width={150} style={{ marginTop: 4 }} />
          </View>
          <FoodArt dish={dish} width={150} rotate={6} />
        </View>

        <View style={styles.scores}>
          <View style={styles.scoreBlock}>
            <Plate score={dish.ratingCount ? dish.score : null} size={112} />
            <Text style={styles.scoreLabel}>
              {dish.ratingCount ? `${dish.ratingCount} rating${dish.ratingCount === 1 ? '' : 's'}` : 'not rated yet'}
            </Text>
          </View>
          {mine && (
            <View style={styles.scoreBlock}>
              <Plate score={toTen(mine.elo)} size={78} />
              <Text style={styles.scoreLabel}>yours</Text>
              <Stamp verdict={mine.verdict} style={{ marginTop: 6, alignSelf: 'center' }} />
            </View>
          )}
        </View>

        {(dish.station || dish.lastServedDate) && (
          <Paper tilt={0.5} tint={colors.lagoon} outer={{ marginTop: 24 }}>
            {dish.station ? <Text style={styles.fact}>Station: {dish.station}</Text> : null}
            {dish.lastServedDate ? (
              <Text style={styles.fact}>
                {dish.lastServedDate === todayKey() ? 'On the menu today' : `Last served ${dish.lastServedDate}`}
              </Text>
            ) : null}
          </Paper>
        )}

        {dish.tags?.length > 0 && (
          <View style={styles.tags}>
            {dish.tags.map((t) => (
              <Tag key={t}>{moodLabel(t)}</Tag>
            ))}
          </View>
        )}

        <Button
          label={mine ? 'Rate it again' : 'Rate this dish'}
          kind="citrus"
          onPress={rate}
          style={{ marginTop: 26 }}
        />

        {friendsHere.length > 0 && (
          <View style={styles.friends}>
            <Label>Friends who've had it</Label>
            {friendsHere.map((r) => (
              <Pressable
                key={r.id}
                style={styles.friendRow}
                onPress={() => navigation.navigate('Friend', { uid: r.userId })}
              >
                <Avatar user={{ name: r.userName }} size={30} />
                <Text style={styles.friendName}>{r.userName}</Text>
                <Stamp verdict={r.verdict} />
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.section}>What people said</Text>
        <View style={{ marginHorizontal: -20 }}>
          {reviews.slice(0, 6).map((r, i) => (
            <ReviewCard key={r.id} index={i} review={r} uid={user.uid} onLike={like} />
          ))}
        </View>
        {reviews.length === 0 && <Text style={styles.quiet}>No reviews yet.</Text>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  body: { padding: 22, paddingBottom: 40 },
  scores: { flexDirection: 'row', alignItems: 'flex-start', gap: 26, marginTop: 24 },
  scoreBlock: { alignItems: 'center' },
  scoreLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 8,
  },
  fact: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink, marginVertical: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 18 },
  friends: { marginTop: 26, gap: 10 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  friendName: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  section: { fontFamily: fonts.title, fontSize: 32, color: colors.ink, marginTop: 36, marginBottom: 14 },
  quiet: { fontFamily: fonts.italic, fontSize: 17, color: colors.muted },
});
