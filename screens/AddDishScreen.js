import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../context/Session';
import { getPlace } from '../data/campuses';
import { addDish } from '../lib/api';
import { MOODS } from '../lib/tags';
import { Button, Chip, Field, Label, Screen } from '../components/ui';
import { colors, fonts } from '../theme';

export default function AddDishScreen({ navigation, route }) {
  const { campus, user } = useSession();
  const [name, setName] = useState(route.params?.name || '');
  const [placeId, setPlaceId] = useState(route.params?.placeId || null);
  const [tags, setTags] = useState([]);
  const [busy, setBusy] = useState(false);

  const toggle = (id) => setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const save = async () => {
    setBusy(true);
    try {
      const dish = await addDish({ place: getPlace(placeId), name, tags, uid: user.uid });
      navigation.replace('WriteReview', { dishId: dish.id });
    } catch (e) {
      Alert.alert("Couldn't add that", 'Check your connection and try again.');
      setBusy(false);
    }
  };

  const halls = campus.places.filter((p) => p.kind === 'hall');
  const spots = campus.places.filter((p) => p.kind === 'spot');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="What's it called?" value={name} onChangeText={setName} placeholder="Spicy chicken sandwich" />

        <Label style={styles.label}>Where'd you get it?</Label>
        <Text style={styles.group}>Dining halls</Text>
        <View style={styles.chips}>
          {halls.map((p) => (
            <Chip key={p.id} label={p.name} active={placeId === p.id} onPress={() => setPlaceId(p.id)} />
          ))}
        </View>
        <Text style={styles.group}>Near campus</Text>
        <View style={styles.chips}>
          {spots.map((p) => (
            <Chip key={p.id} label={p.name} active={placeId === p.id} onPress={() => setPlaceId(p.id)} />
          ))}
        </View>

        <Label style={styles.label}>Good for (optional)</Label>
        <View style={styles.chips}>
          {MOODS.map((m) => (
            <Chip key={m.id} label={m.label} active={tags.includes(m.id)} onPress={() => toggle(m.id)} />
          ))}
        </View>

        <Button
          label="Next: rate it"
          onPress={save}
          loading={busy}
          disabled={!name.trim() || !placeId}
          style={{ marginTop: 28 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 40 },
  label: { marginTop: 18, marginBottom: 4 },
  group: { fontFamily: fonts.note, fontSize: 18, color: colors.ink, marginTop: 10, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
