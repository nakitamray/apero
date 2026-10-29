import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../context/Session';
import { myRankings, saveReview } from '../lib/api';
import { MAX_QUESTIONS, eloForPosition, toTen } from '../lib/score';
import { Button, Label, Loading, Note, Plate, Screen, Title } from '../components/ui';
import { Sticker } from '../components/art';
import { colors, fonts, lift } from '../theme';

// Binary search through your own same-verdict list: each answer halves where the new dish can go.
export default function CompareScreen({ navigation, route }) {
  const { dish, verdict, tags, note } = route.params;
  const { user, name } = useSession();
  const [ranked, setRanked] = useState(null);
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(0);
  const [asked, setAsked] = useState(0);
  const [saving, setSaving] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  useEffect(() => {
    myRankings(user.uid).then((all) => {
      const same = all.filter((r) => r.verdict === verdict && r.dishId !== dish.id);
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
    saveReview({ uid: user.uid, userName: name, dish, verdict, elo, tags, note })
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
    return (
      <Screen style={styles.center}>
        <View>
          <Sticker name="lemon" width={96} rotate={-14} style={styles.lemonSticker} />
          <Plate score={finalScore} size={150} />
        </View>
        <Label style={{ marginTop: 22 }}>Saved to your list</Label>
        <Title size={42} style={{ textAlign: 'center', marginTop: 4 }}>
          {dish.name}
        </Title>
        <Button
          label="See my list"
          onPress={() => {
            navigation.popToTop();
            navigation.navigate('ListTab', { screen: 'MyList' });
          }}
          style={{ marginTop: 30, alignSelf: 'stretch' }}
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
  choice: {
    alignSelf: 'stretch',
    borderRadius: 8,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    ...lift,
  },
  choiceArt: { position: 'absolute', top: -18, right: 10 },
  choiceTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 34, color: colors.ink, textAlign: 'center' },
  choicePlace: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6 },
  or: { color: colors.orange, marginVertical: 12 },
  skip: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, textDecorationLine: 'underline' },
});
