import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { getPlace } from '../data/campuses';
import { dishReviews, getDish, myRanking } from '../lib/api';
import { toTen } from '../lib/score';
import { moodLabel } from '../lib/tags';
import { todayKey } from '../lib/time';
import { Button, Empty, Label, Loading, Paper, Plate, Screen, Stamp, Tag, Title } from '../components/ui';
import { ReviewCard, makeLike } from '../components/rows';
import { Sticker } from '../components/art';
import { colors, fonts } from '../theme';

export default function DishScreen({ navigation, route }) {
  const { dishId } = route.params;
  const { user } = useSession();
  const [dish, setDish] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [mine, setMine] = useState(null);
  const [missing, setMissing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getDish(dishId), dishReviews(dishId), myRanking(user.uid, dishId)])
        .then(([d, r, m]) => {
          if (!d) setMissing(true);
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <Pressable onPress={() => place && navigation.navigate('Place', { placeId: place.id })}>
          <Label color={colors.teal}>{dish.placeName} →</Label>
        </Pressable>
        <Title size={50} style={{ marginTop: 4 }}>
          {dish.name}
        </Title>
        <Sticker name="swash" width={150} style={{ marginTop: 4 }} />

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

        <Text style={styles.section}>What people said</Text>
        <View style={{ marginHorizontal: -20 }}>
          {reviews.map((r, i) => (
            <ReviewCard key={r.id} index={i} review={r} uid={user.uid} onLike={like} />
          ))}
        </View>
        {reviews.length === 0 && <Text style={styles.quiet}>No reviews yet.</Text>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  section: { fontFamily: fonts.display, fontSize: 32, color: colors.ink, marginTop: 36, marginBottom: 14 },
  quiet: { fontFamily: fonts.note, fontSize: 17, color: colors.muted },
});
