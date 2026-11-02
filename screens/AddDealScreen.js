import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSession } from '../context/Session';
import { addDeal } from '../lib/api';
import { DAYS } from '../lib/deals';
import { todayKey } from '../lib/time';
import { Button, Chip, Field, Label, Screen, Sub } from '../components/ui';

const ENDS = [
  { id: 'none', label: 'No end date', days: null },
  { id: 'week', label: 'This week', days: 7 },
  { id: 'month', label: 'This month', days: 30 },
];

export default function AddDealScreen({ navigation }) {
  const { campus, user, name } = useSession();
  const [placeId, setPlaceId] = useState(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [days, setDays] = useState([]);
  const [ends, setEnds] = useState('none');
  const [busy, setBusy] = useState(false);

  const toggleDay = (d) => setDays((list) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d]));

  const save = async () => {
    const place = campus.places.find((p) => p.id === placeId);
    const span = ENDS.find((e) => e.id === ends).days;
    const end = span ? new Date(Date.now() + span * 86400000) : null;
    setBusy(true);
    try {
      await addDeal({
        campusId: campus.id,
        placeId,
        placeName: place.name,
        title: title.trim(),
        details: details.trim(),
        days: DAYS.filter((d) => days.includes(d)),
        ends: end ? todayKey(end) : null,
        postedBy: user.uid,
        postedByName: name,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Couldn't post that", 'Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Label style={styles.label}>Where</Label>
        <View style={styles.chips}>
          {campus.places.map((p) => (
            <Chip key={p.id} label={p.name} active={placeId === p.id} onPress={() => setPlaceId(p.id)} />
          ))}
        </View>

        <Field
          label="The deal"
          value={title}
          onChangeText={setTitle}
          placeholder="$2 tacos"
          maxLength={60}
          style={{ marginTop: 22 }}
        />
        <Field
          label="Fine print (optional)"
          value={details}
          onChangeText={setDetails}
          placeholder="With student ID, after 9pm"
          maxLength={90}
        />

        <Label style={styles.label}>Which days</Label>
        <Sub style={{ marginBottom: 8 }}>Leave them all off if it's every day.</Sub>
        <View style={styles.chips}>
          {DAYS.map((d) => (
            <Chip key={d} label={d} active={days.includes(d)} onPress={() => toggleDay(d)} />
          ))}
        </View>

        <Label style={styles.label}>Ends</Label>
        <View style={styles.chips}>
          {ENDS.map((e) => (
            <Chip key={e.id} label={e.label} active={ends === e.id} onPress={() => setEnds(e.id)} />
          ))}
        </View>

        <Button
          label="Post deal"
          kind="citrus"
          onPress={save}
          loading={busy}
          disabled={!placeId || !title.trim()}
          style={{ marginTop: 28 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 40 },
  label: { marginTop: 22, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
