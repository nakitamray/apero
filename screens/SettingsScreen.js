import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { auth } from '../firebaseConfig';
import { useSession } from '../context/Session';
import { CAMPUSES, getCampus } from '../data/campuses';
import { MODES, defaultModes } from '../lib/trip';
import { Button, Chip, Kicker, Title } from '../components/ui';
import { colors, fonts } from '../theme';

// used twice: first-run setup after sign up, and later from the profile tab
export default function SettingsScreen({ navigation, route }) {
  const onboarding = route.params?.onboarding;
  const { profile, updateProfile, modes: savedModes } = useSession();
  const [campusId, setCampusId] = useState(profile?.campusId || null);
  const [modes, setModes] = useState(profile?.getAround || savedModes);
  const [touchedModes, setTouchedModes] = useState(!!profile?.getAround);
  const [busy, setBusy] = useState(false);

  const pickCampus = (id) => {
    setCampusId(id);
    // until they choose for themselves, assume a free bus pass gets used
    if (!touchedModes) setModes(defaultModes(getCampus(id)));
  };

  const toggleMode = (id) => {
    setTouchedModes(true);
    setModes((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };

  const save = async () => {
    setBusy(true);
    await updateProfile({
      campusId,
      getAround: modes,
      name: profile?.name || auth.currentUser?.displayName || '',
    });
    setBusy(false);
    if (!onboarding) navigation.goBack();
  };

  const transit = getCampus(campusId)?.transit;

  return (
    <SafeAreaView style={styles.screen} edges={onboarding ? ['top', 'bottom'] : ['bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        {onboarding && (
          <>
            <Kicker>Step 1 of 1</Kicker>
            <Title size={34} style={{ marginBottom: 6 }}>
              Where do you eat?
            </Title>
            <Text style={styles.lede}>Pick your campus. You can switch any time from your profile.</Text>
          </>
        )}

        <Kicker style={styles.label}>Campus</Kicker>
        {CAMPUSES.map((c) => {
          const active = c.id === campusId;
          return (
            <Pressable key={c.id} onPress={() => pickCampus(c.id)} style={[styles.campus, active && styles.campusActive]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.campusName, active && { color: colors.paper }]}>{c.name}</Text>
                <Text style={[styles.campusCity, active && { color: colors.sky }]}>{c.city}</Text>
              </View>
              {active && <Check color={colors.lemon} size={20} strokeWidth={3} />}
            </Pressable>
          );
        })}

        <Kicker style={styles.label}>How do you get around?</Kicker>
        <Text style={styles.hint}>We use this to show how far each spot really is and what the trip costs you.</Text>
        <View style={styles.modes}>
          {MODES.map((m) => (
            <Chip key={m.id} label={m.label} active={modes.includes(m.id)} onPress={() => toggleMode(m.id)} />
          ))}
        </View>
        {transit && (
          <Text style={styles.hint}>
            {transit.name} {transit.free ? 'is free with your student ID here.' : `runs about $${transit.fare.toFixed(2)} a ride.`}
          </Text>
        )}

        <Button
          label={onboarding ? "Let's eat" : 'Save'}
          onPress={save}
          loading={busy}
          disabled={!campusId || modes.length === 0}
          style={{ marginTop: 28 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { padding: 20, paddingBottom: 40 },
  lede: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, lineHeight: 21 },
  label: { marginTop: 26, marginBottom: 10 },
  campus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  campusActive: { backgroundColor: colors.ink },
  campusName: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  campusCity: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 2 },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 10 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
});
