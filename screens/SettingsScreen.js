import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { auth } from '../lib/firebase';
import { useSession } from '../context/Session';
import { CAMPUSES, getCampus } from '../data/campuses';
import { MODES, defaultModes } from '../lib/trip';
import { Button, Chip, Dotted, Label, Masthead, MenuCard, Screen, Sub } from '../components/ui';
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
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {onboarding && (
          <Masthead
            kicker="Welcome to apero"
            title="Where do"
            accent="you eat?"
            note="Pick your campus. You can switch any time from your profile."
            sticker="lemon"
            stickerSize={110}
          />
        )}
        <View style={styles.body}>
          <Label style={styles.label}>Campus</Label>
          <MenuCard title="thirteen campuses" style={{ paddingVertical: 6 }}>
            {CAMPUSES.map((c, i) => {
              const active = c.id === campusId;
              return (
                <View key={c.id}>
                  <Pressable onPress={() => pickCampus(c.id)} style={[styles.campus, active && styles.campusActive]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.campusName}>{c.name}</Text>
                      <Text style={styles.campusCity}>{c.city}</Text>
                    </View>
                    {active ? (
                      <Check color={colors.persimmon} size={22} strokeWidth={2.5} />
                    ) : (
                      <Text style={styles.campusArrow}>→</Text>
                    )}
                  </Pressable>
                  {i < CAMPUSES.length - 1 && <Dotted />}
                </View>
              );
            })}
          </MenuCard>

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
  body: { paddingHorizontal: 22, paddingBottom: 22 },
  label: { marginTop: 22, marginBottom: 10 },
  campus: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 6, borderRadius: 6 },
  campusActive: { backgroundColor: colors.lemon },
  campusName: { fontFamily: fonts.title, fontSize: 17, color: colors.ink },
  campusCity: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  campusArrow: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, opacity: 0.4 },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
});
