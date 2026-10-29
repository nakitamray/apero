import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { getPlace } from '../data/campuses';
import { dishReviews, getDish, myRanking } from '../lib/api';
import { toTen } from '../lib/score';
import { moodLabel } from '../lib/tags';
import { todayKey } from '../lib/time';
import { Button, Card, Empty, Kicker, Loading, ScoreBadge, Stamp, Tag, Title } from '../components/ui';
import { ReviewCard, makeLike } from '../components/rows';
import { Wave } from '../components/art';
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

  if (missing) return <Empty title="Couldn't find that dish" />;
  if (!dish) return <Loading />;

  const place = getPlace(dish.placeId);
  const rate = () =>
    navigation.navigate('ReviewTab', { screen: 'WriteReview', params: { dishId: dish.id }, initial: false });

  const like = makeLike(setReviews, user.uid);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      <Pressable onPress={() => place && navigation.navigate('Place', { placeId: place.id })}>
        <Kicker color={colors.cobalt}>{dish.placeName} →</Kicker>
      </Pressable>
      <Title size={34} style={{ marginTop: 4 }}>
        {dish.name}
      </Title>
      <Wave width={120} color={colors.aperol} style={{ marginTop: 10 }} />

      <View style={styles.scores}>
        <View style={styles.scoreBlock}>
          <ScoreBadge score={dish.ratingCount ? dish.score : null} size={92} />
          <Text style={styles.scoreLabel}>
            {dish.ratingCount ? `${dish.ratingCount} rating${dish.ratingCount === 1 ? '' : 's'}` : 'not rated yet'}
          </Text>
        </View>
        {mine && (
          <View style={styles.scoreBlock}>
            <ScoreBadge score={toTen(mine.elo)} size={64} />
            <Text style={styles.scoreLabel}>yours</Text>
            <Stamp verdict={mine.verdict} style={{ marginTop: 6, alignSelf: 'center' }} />
          </View>
        )}
      </View>

      {(dish.station || dish.lastServedDate) && (
        <Card outer={{ marginTop: 20 }} tint={colors.mist}>
          {dish.station ? <Text style={styles.fact}>Station: {dish.station}</Text> : null}
          {dish.lastServedDate ? (
            <Text style={styles.fact}>
              {dish.lastServedDate === todayKey() ? 'On the menu today' : `Last served ${dish.lastServedDate}`}
            </Text>
          ) : null}
        </Card>
      )}

      {dish.tags?.length > 0 && (
        <View style={styles.tags}>
          {dish.tags.map((t) => (
            <Tag key={t}>{moodLabel(t)}</Tag>
          ))}
        </View>
      )}

      <Button label={mine ? 'Rate it again' : 'Rate this dish'} onPress={rate} style={{ marginTop: 24 }} />

      <Text style={styles.section}>What people said</Text>
      <View style={{ marginHorizontal: -20 }}>
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} uid={user.uid} onLike={like} />
        ))}
      </View>
      {reviews.length === 0 && <Text style={styles.quiet}>No reviews yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { padding: 20, paddingBottom: 40 },
  scores: { flexDirection: 'row', alignItems: 'flex-start', gap: 28, marginTop: 22 },
  scoreBlock: { alignItems: 'center' },
  scoreLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 6 },
  fact: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink, marginVertical: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  section: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginTop: 32, marginBottom: 12 },
  quiet: { fontFamily: fonts.body, color: colors.muted },
});
