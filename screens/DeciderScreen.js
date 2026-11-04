import React, { useCallback, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { campusDeals, campusPlaceStats, myRankings, usersByIds } from '../lib/api';
import { rankForGroup } from '../lib/decider';
import { describeTrip } from '../lib/trip';
import { priceTag } from '../data/campuses';
import { Button, Chip, Label, Note, Paper, Platter, Screen, SectionHeader, Title } from '../components/ui';
import { Sticker } from '../components/art';
import { colors, fonts } from '../theme';

export default function DeciderScreen({ navigation }) {
  const { user, campus, modes, following } = useSession();
  const [friends, setFriends] = useState([]);
  const [coming, setComing] = useState([]);
  const [budget, setBudget] = useState(2);
  const [shortlist, setShortlist] = useState(null);
  const [winner, setWinner] = useState(null);
  const [busy, setBusy] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      usersByIds(following)
        .then(setFriends)
        .catch(() => setFriends([]));
    }, [following.join(',')]),
  );

  const toggle = (id) => {
    setShortlist(null);
    setWinner(null);
    setComing((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };

  const find = async () => {
    setBusy(true);
    setWinner(null);
    const people = [{ id: user.uid, name: 'You', you: true }, ...friends.filter((f) => coming.includes(f.id))];
    const [stats, deals, ...lists] = await Promise.all([
      campusPlaceStats(campus.id),
      campusDeals(campus.id),
      ...people.map((p) => myRankings(p.id)),
    ]);
    const members = people.map((p, i) => ({ ...p, rankings: lists[i] }));
    setShortlist(rankForGroup({ campus, stats, members, modes, budget, deals }).slice(0, 4));
    setBusy(false);
  };

  // spin the orange, then pick from the top three (better spots get a bigger slice of the wheel)
  const spinIt = () => {
    setWinner(null);
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const top = shortlist.slice(0, 3);
      const weights = [0.5, 0.3, 0.2].slice(0, top.length);
      let r = Math.random() * weights.reduce((a, b) => a + b, 0);
      setWinner(top.find((_, i) => (r -= weights[i]) <= 0) || top[0]);
    });
  };

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1440deg'] });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.head}>
          <Title size={46}>Where are we eating?</Title>
          <Note>Pick who's coming and how much you want to spend. We'll sort out the rest.</Note>
        </View>

        <SectionHeader title="Who's coming" />
        <View style={styles.chips}>
          <Chip label="You" active onPress={() => {}} />
          {friends.map((f) => (
            <Chip key={f.id} label={f.name} active={coming.includes(f.id)} onPress={() => toggle(f.id)} />
          ))}
        </View>
        {!friends.length && <Note style={styles.pad}>Add friends from your profile to decide together.</Note>}

        <SectionHeader title="Budget" />
        <View style={styles.chips}>
          {[1, 2, 3].map((b) => (
            <Chip
              key={b}
              label={`up to ${priceTag(b)}`}
              active={budget === b}
              onPress={() => {
                setBudget(b);
                setShortlist(null);
              }}
            />
          ))}
        </View>

        <Button label="Find our spot" kind="citrus" onPress={find} loading={busy} style={styles.cta} />

        {shortlist && (
          <>
            <SectionHeader label="Best fits for the group" title="Shortlist" />
            {shortlist.map((s, i) => (
              <Paper
                key={s.place.id}
                index={i}
                tilt={i % 2 ? 0.5 : -0.5}
                outer={styles.cardOuter}
                onPress={() => navigation.navigate('Place', { placeId: s.place.id })}
                tint={winner?.place.id === s.place.id ? colors.lemon : undefined}
              >
                <Text style={styles.cardName}>{s.place.name}</Text>
                <Text style={styles.cardTrip}>
                  {s.place.kind === 'spot' ? `${priceTag(s.place.price)} · ${describeTrip(s.trip)}` : 'Dining hall'}
                </Text>
                {s.reasons.slice(0, 3).map((r) => (
                  <Text key={r} style={styles.reason}>
                    · {r}
                  </Text>
                ))}
              </Paper>
            ))}

            <View style={styles.spinRow}>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Sticker name="orangeSlice" width={110} />
              </Animated.View>
              <Button label="Can't decide? Spin for it" onPress={spinIt} style={{ flex: 1 }} />
            </View>

            {winner && (
              <Platter tone="lemon" outer={styles.cardOuter}>
                <Label>Tonight you're going to</Label>
                <Text style={styles.winner}>{winner.place.name}</Text>
                <Button
                  label="Let's go"
                  kind="citrus"
                  onPress={() => navigation.navigate('Place', { placeId: winner.place.id })}
                  style={{ marginTop: 10 }}
                />
              </Platter>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22, paddingTop: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22 },
  pad: { paddingHorizontal: 22, marginTop: 8 },
  cta: { marginHorizontal: 22, marginTop: 28 },
  cardOuter: { marginHorizontal: 20, marginBottom: 12 },
  cardName: { fontFamily: fonts.title, fontSize: 28, lineHeight: 30, color: colors.ink },
  cardTrip: { fontFamily: fonts.medium, fontSize: 12, color: colors.teal, marginTop: 2, marginBottom: 6 },
  reason: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 20 },
  spinRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 22, marginVertical: 18 },
  winner: { fontFamily: fonts.title, fontSize: 38, lineHeight: 40, color: colors.ink, marginTop: 4 },
});
