import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDish } from '../lib/api';
import { VERDICTS } from '../lib/score';
import { REASONS } from '../lib/tags';
import { Button, Chip, Field, Kicker, Loading, Title } from '../components/ui';
import { colors, fonts } from '../theme';

const VERDICT_STYLE = {
  love: { bg: colors.aperol },
  fine: { bg: colors.sky },
  meh: { bg: colors.sand },
};

export default function WriteReviewScreen({ navigation, route }) {
  const [dish, setDish] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    getDish(route.params.dishId).then(setDish);
  }, [route.params.dishId]);

  if (!dish) return <Loading />;

  const toggle = (id) => setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Kicker>{dish.placeName}</Kicker>
        <Title size={30}>{dish.name}</Title>

        <Kicker style={styles.label}>The verdict</Kicker>
        <View style={styles.verdicts}>
          {Object.entries(VERDICTS).map(([id, v]) => {
            const active = verdict === id;
            return (
              <Pressable
                key={id}
                onPress={() => setVerdict(id)}
                style={[styles.verdict, { backgroundColor: active ? VERDICT_STYLE[id].bg : colors.card }, active && styles.verdictActive]}
              >
                <Text style={styles.verdictText}>{v.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Kicker style={styles.label}>Why? (pick any)</Kicker>
        <View style={styles.chips}>
          {REASONS.map((r) => (
            <Chip key={r.id} label={r.label} active={reasons.includes(r.id)} onPress={() => toggle(r.id)} />
          ))}
        </View>

        <Field
          label="Anything else?"
          value={note}
          onChangeText={setNote}
          placeholder="Ask for extra sauce."
          multiline
          maxLength={280}
          style={{ marginTop: 22 }}
        />

        <Button
          label="Next"
          disabled={!verdict}
          onPress={() =>
            navigation.navigate('Compare', {
              dish: { id: dish.id, name: dish.name, placeId: dish.placeId, placeName: dish.placeName, campusId: dish.campusId },
              verdict,
              tags: reasons,
              note,
            })
          }
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { padding: 20, paddingBottom: 40 },
  label: { marginTop: 26, marginBottom: 10 },
  verdicts: { gap: 10 },
  verdict: { borderWidth: 2, borderColor: colors.ink, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18 },
  verdictActive: { transform: [{ rotate: '-1deg' }] },
  verdictText: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
