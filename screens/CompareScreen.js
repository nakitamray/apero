import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../context/Session';
import { myRankings, saveReview, uploadReviewPhoto } from '../lib/api';
import { MAX_QUESTIONS, eloForPosition, toTen } from '../lib/score';
import { Button, Hint, Label, Loading, Note, Plate, Screen, Title } from '../components/ui';
import { Sticker } from '../components/art';
import { StampSlam } from '../components/stamp';
import { getPlace } from '../data/campuses';
import { colors, fonts, lift } from '../theme';

// Binary search through your own same-verdict list: each answer halves where the new dish can go.
export default function CompareScreen({ navigation, route }) {
  const { dish, verdict, tags, note, photos = [], withPeople = [] } = route.params;
  const { user, name, campus } = useSession();
  // how many dishes you'd already rated at this place, so the stamp knows if it's new
  const [visits, setVisits] = useState(0);
  const [ranked, setRanked] = useState(null);
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(0);
  const [asked, setAsked] = useState(0);
  const [saving, setSaving] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  useEffect(() => {
    myRankings(user.uid).then((all) => {
      const same = all.filter((r) => r.verdict === verdict && r.dishId !== dish.id);
      setVisits(all.filter((r) => r.placeId === dish.placeId && r.dishId !== dish.id).length);
      setRanked(same);
      setHi(same.length);
    });
  }, [user.uid, verdict, dish.id]);

  useEffect(() => {
    // once it's saved, going back would just resubmit the review
    if (finalScore != null) navigation.setOptions({ headerBackVisible: false, gestureEnabled: false, title: 'Ranked' });
  }, [finalScore, navigation]);

  const done = ranked && (lo >= hi || asked >= MAX_QUESTIONS);

  useEffect(() => {
    if (!done || saving || finalScore != null) return;
    const pos = Math.floor((lo + hi) / 2);
    const elo = eloForPosition(ranked, pos, verdict);
    setSaving(true);
    Promise.all(photos.map((uri) => uploadReviewPhoto(user.uid, uri)))
      .then((urls) =>
        saveReview({ uid: user.uid, userName: name, dish, verdict, elo, tags, note, photos: urls, withPeople }),
      )
      .then(() => setFinalScore(toTen(elo)))
      .catch(() => {
        Alert.alert("Couldn't save", "Your review didn't go through. Try again in a sec.");
        navigation.goBack();
      })
      .finally(() => setSaving(false));
  }, [done]);

  if (!ranked || saving || (done && finalScore == null)) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (finalScore != null) {
    const place = getPlace(dish.placeId);
    return (
      <Screen style={styles.center}>
        {place ? (
          <View style={styles.result}>
            <View>
              <Sticker name="lemon" width={70} rotate={-14} style={styles.lemonSticker} />
              <Plate score={finalScore} size={124} />
            </View>
            <StampSlam place={place} date={new Date()} visits={visits + 1} campusShort={campus.short} />
          </View>
        ) : (
          <View>
            <Sticker name="lemon" width={96} rotate={-14} style={styles.lemonSticker} />
            <Plate score={finalScore} size={150} />
          </View>
        )}
        <Label style={{ marginTop: 22 }}>Saved to your list</Label>
        <Title size={42} style={{ textAlign: 'center', marginTop: 4 }}>
          {dish.name}
        </Title>
        {place && (
          <Text style={styles.stampNote}>
            {visits === 0
              ? `New stamp! ${place.name} goes in your passport.`
              : `Visit ${visits + 1} at ${place.name}. Another star on its stamp.`}
          </Text>
        )}
        {place && (
          <Button
            label="See my passport"
            kind="citrus"
            onPress={() => {
              navigation.popToTop();
              navigation.navigate('MeTab', { screen: 'Passport' });
            }}
            style={{ marginTop: 24, alignSelf: 'stretch' }}
          />
        )}
        <Button
          label="See my list"
          onPress={() => {
            navigation.popToTop();
            navigation.navigate('ListTab', { screen: 'MyList' });
          }}
          style={{ marginTop: 14, alignSelf: 'stretch' }}
        />
        <Button
          label="Rate another"
          kind="light"
          onPress={() => navigation.popToTop()}
          style={{ marginTop: 14, alignSelf: 'stretch' }}
        />
      </Screen>
    );
  }

  const mid = Math.floor((lo + hi) / 2);
  const other = ranked[mid];
  const pick = (newIsBetter) => {
    if (newIsBetter) setHi(mid);
    else setLo(mid + 1);
    setAsked((n) => n + 1);
  };
  // a tie just parks it right next to the other dish
  const tie = () => {
    setLo(mid);
    setHi(mid);
    setAsked((n) => n + 1);
  };

  return (
    <Screen style={styles.center}>
      <Label>Question {asked + 1}</Label>
      <Title size={42} style={{ marginBottom: 26, textAlign: 'center' }}>
        Which did you like more?
      </Title>
      <Hint arrow="↓" style={{ marginTop: -16, marginBottom: 18 }}>
        tap one. a few of these and your list sorts itself
      </Hint>

      <Choice
        title={dish.name}
        place={dish.placeName}
        onPress={() => pick(true)}
        tint="#FFE3CF"
        art="bloodOrange"
        tilt={-1}
      />
      <Note size={26} style={styles.or}>
        or
      </Note>
      <Choice
        title={other.dishName}
        place={other.placeName}
        onPress={() => pick(false)}
        tint={colors.lagoon}
        art="sardine"
        tilt={0.8}
      />

      <Pressable onPress={tie} style={{ marginTop: 26 }} hitSlop={10}>
        <Text style={styles.skip}>Too close to call</Text>
      </Pressable>
    </Screen>
  );
}

function Choice({ title, place, onPress, tint, art, tilt }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: tint, transform: [{ rotate: `${tilt}deg` }, { scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Sticker name={art} width={art === 'sardine' ? 120 : 56} rotate={tilt * 8} style={styles.choiceArt} />
      <Text style={styles.choiceTitle}>{title}</Text>
      <Text style={styles.choicePlace}>{place}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  lemonSticker: { position: 'absolute', right: -50, top: -30, zIndex: 2 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 26, flexWrap: 'wrap', justifyContent: 'center' },
  stampNote: { fontFamily: fonts.italic, fontSize: 16, color: colors.persimmon, textAlign: 'center', marginTop: 10 },
  choice: {
    alignSelf: 'stretch',
    borderRadius: 8,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    ...lift,
  },
  choiceArt: { position: 'absolute', top: -18, right: 10 },
  choiceTitle: { fontFamily: fonts.title, fontSize: 32, lineHeight: 34, color: colors.ink, textAlign: 'center' },
  choicePlace: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6 },
  or: { color: colors.orange, marginVertical: 12 },
  skip: { fontFamily: fonts.medium, fontSize: 14, color: colors.paper, textDecorationLine: 'underline' },
});
