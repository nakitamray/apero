import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../context/Session';
import { myRankings, saveReview } from '../lib/api';
import { MAX_QUESTIONS, eloForPosition, toTen } from '../lib/score';
import { Button, Kicker, Loading, ScoreBadge, Title } from '../components/ui';
import { OrangeSlice } from '../components/art';
import { colors, fonts } from '../theme';

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
        Alert.alert("Couldn't save", 'Your review didn\'t go through. Try again in a sec.');
        navigation.goBack();
      })
      .finally(() => setSaving(false));
  }, [done]);

  if (!ranked || saving || (done && finalScore == null)) return <Loading />;

  if (finalScore != null) {
    return (
      <View style={[styles.screen, styles.center]}>
        <OrangeSlice size={70} />
        <Kicker style={{ marginTop: 18 }}>Saved to your list</Kicker>
        <Title size={30} style={{ textAlign: 'center', marginVertical: 8 }}>
          {dish.name}
        </Title>
        <ScoreBadge score={finalScore} size={96} />
        <Button
          label="See my list"
          onPress={() => {
            navigation.popToTop();
            navigation.navigate('ListTab', { screen: 'MyList' });
          }}
          style={{ marginTop: 30, alignSelf: 'stretch' }}
        />
        <Button label="Rate another" kind="plain" onPress={() => navigation.popToTop()} style={{ marginTop: 14, alignSelf: 'stretch' }} />
      </View>
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
    <View style={[styles.screen, styles.center]}>
      <Kicker>Question {asked + 1}</Kicker>
      <Title size={28} style={{ marginBottom: 24, textAlign: 'center' }}>
        Which did you like more?
      </Title>

      <Choice title={dish.name} place={dish.placeName} onPress={() => pick(true)} tint={colors.peach} />
      <Text style={styles.or}>or</Text>
      <Choice title={other.dishName} place={other.placeName} onPress={() => pick(false)} tint={colors.mist} />

      <Pressable onPress={tie} style={{ marginTop: 26 }} hitSlop={10}>
        <Text style={styles.skip}>Too close to call</Text>
      </Pressable>
    </View>
  );
}

function Choice({ title, place, onPress, tint }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.choice, { backgroundColor: tint }, pressed && styles.pressed]}>
      <Text style={styles.choiceTitle}>{title}</Text>
      <Text style={styles.choicePlace}>{place}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, padding: 24 },
  center: { justifyContent: 'center', alignItems: 'center' },
  choice: {
    alignSelf: 'stretch',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  pressed: { transform: [{ scale: 0.98 }] },
  choiceTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, textAlign: 'center' },
  choicePlace: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, marginTop: 6 },
  or: { fontFamily: fonts.displayItalic, fontSize: 22, color: colors.aperol, marginVertical: 12 },
  skip: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, textDecorationLine: 'underline' },
});
