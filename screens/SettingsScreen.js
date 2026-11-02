import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { auth } from '../lib/firebase';
import { useSession } from '../context/Session';
import { CAMPUSES, getCampus } from '../data/campuses';
import { MODES, defaultModes } from '../lib/trip';
import { Button, Chip, CollageHeader, Label, Note, Screen, Sub, Title } from '../components/ui';
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
    const name = profile?.name || auth?.currentUser?.displayName || 'Guest';
    await updateProfile({
      campusId,
      getAround: modes,
      name,
      // friends find you by this, e.g. @maya42
      handle:
        profile?.handle || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 90 + 10)}`,
      following: profile?.following || [],
    });
    setBusy(false);
    if (!onboarding) navigation.goBack();
  };

  const transit = getCampus(campusId)?.transit;
  const insets = useSafeAreaInsets();

  return (
    <Screen tone={onboarding ? 'cobalt' : 'paper'}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {onboarding && (
          <CollageHeader
            height={insets.top + 150}
            tone="orange"
            pieces={[
              { name: 'lemon', size: 90, rotate: 12, right: 22, top: insets.top + 40 },
              { name: 'sardine', size: 170, rotate: -6, right: 90, top: insets.top + 118 },
            ]}
          />
        )}
        <View style={styles.body}>
          {onboarding && (
            <>
              <Title size={46}>Where do you eat?</Title>
              <Note style={styles.lede}>Pick your campus. You can switch any time from your profile.</Note>
            </>
          )}

          <Label style={styles.label}>Campus</Label>
          {CAMPUSES.map((c) => {
            const active = c.id === campusId;
            return (
              <Pressable
                key={c.id}
                onPress={() => pickCampus(c.id)}
                style={[styles.campus, active && styles.campusActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.campusName}>{c.name}</Text>
                  <Text style={styles.campusCity}>{c.city}</Text>
                </View>
                {active && <Check color={colors.orange} size={20} strokeWidth={2.5} />}
              </Pressable>
            );
          })}

          <Label style={styles.label}>How do you get around?</Label>
          <Sub style={styles.hint}>We use this to show how far each spot really is and what the trip costs you.</Sub>
          <View style={styles.modes}>
            {MODES.map((m) => (
              <Chip key={m.id} label={m.label} active={modes.includes(m.id)} onPress={() => toggleMode(m.id)} />
            ))}
          </View>
          {transit && (
            <Sub style={styles.hint}>
              {transit.name}{' '}
              {transit.free ? 'is free with your student ID here.' : `runs about $${transit.fare.toFixed(2)} a ride.`}
            </Sub>
          )}

          <Button
            label={onboarding ? "Let's eat" : 'Save'}
            onPress={save}
            loading={busy}
            disabled={!campusId || modes.length === 0}
            style={{ marginTop: 28 }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22 },
  lede: { marginTop: 6 },
  label: { marginTop: 28, marginBottom: 10 },
  campus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.paper,
  },
  campusActive: { backgroundColor: colors.butter, borderColor: colors.lemon },
  campusName: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  campusCity: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
});
