import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDish } from '../lib/api';
import { VERDICTS } from '../lib/score';
import { REASONS } from '../lib/tags';
import { Button, Chip, Field, Label, Loading, Screen, Title } from '../components/ui';
import { Sticker } from '../components/art';
import { colors, fonts, lift } from '../theme';

const VERDICT_ART = {
  love: { art: 'bloodOrange', tint: '#FFE3CF' },
  fine: { art: 'lemonSlice', tint: colors.butter },
  meh: { art: 'starfish', tint: colors.lagoon },
};

export default function WriteReviewScreen({ navigation, route }) {
  const [dish, setDish] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    getDish(route.params.dishId).then(setDish);
  }, [route.params.dishId]);

  if (!dish) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const toggle = (id) => setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Label color={colors.teal}>{dish.placeName}</Label>
          <Title size={44}>{dish.name}</Title>

          <Label style={styles.label}>The verdict</Label>
          <View style={styles.verdicts}>
            {Object.entries(VERDICTS).map(([id, v], i) => {
              const active = verdict === id;
              const look = VERDICT_ART[id];
              return (
                <Pressable
                  key={id}
                  onPress={() => setVerdict(id)}
                  style={[
                    styles.verdict,
                    {
                      backgroundColor: active ? look.tint : colors.paper,
                      transform: [{ rotate: `${[-0.8, 0.5, -0.3][i]}deg` }],
                    },
                    active && styles.verdictActive,
                  ]}
                >
                  <Sticker name={look.art} width={46} rotate={active ? 12 : 0} />
                  <Text style={styles.verdictText}>{v.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Label style={styles.label}>Why? (pick any)</Label>
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
            style={{ marginTop: 24 }}
          />

          <Button
            label="Next"
            kind="citrus"
            disabled={!verdict}
            onPress={() =>
              navigation.navigate('Compare', {
                dish: {
                  id: dish.id,
                  name: dish.name,
                  placeId: dish.placeId,
                  placeName: dish.placeName,
                  campusId: dish.campusId,
                },
                verdict,
                tags: reasons,
                note,
              })
            }
            style={{ marginTop: 10 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 40 },
  label: { marginTop: 28, marginBottom: 12 },
  verdicts: { gap: 12 },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  verdictActive: { borderColor: colors.orange, ...lift },
  verdictText: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
