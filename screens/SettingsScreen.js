import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, MailCheck } from 'lucide-react-native';
import { auth } from '../lib/firebase';
import { useSession } from '../context/Session';
import { CAMPUSES, getCampus } from '../data/campuses';
import { MODES, defaultModes } from '../lib/trip';
import { checkSchool, confirmPassword, domainFor, emailFits, sendSchoolLink, verifiedFor } from '../lib/school';
import { Button, Chip, Dotted, Field, Label, Masthead, MenuCard, Paper, Screen, Sub } from '../components/ui';
import { colors, fonts } from '../theme';

// used twice: first-run setup after sign up, and later from the profile tab.
// Real accounts prove a school with a verified student email; the demo can hop between schools freely.
export default function SettingsScreen({ navigation, route }) {
  const onboarding = route.params?.onboarding;
  const { profile, updateProfile, modes: savedModes, demo, logOut } = useSession();
  const [campusId, setCampusId] = useState(profile?.campusId || null);
  const [modes, setModes] = useState(profile?.getAround || savedModes);
  const [touchedModes, setTouchedModes] = useState(!!profile?.getAround);
  const [busy, setBusy] = useState(false);
  // school email check: null, 'email' (asking for it), 'sent' (waiting for the link to be clicked)
  const [step, setStep] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [problem, setProblem] = useState('');

  const user = auth?.currentUser;
  const campus = getCampus(campusId);
  const switching = campusId && campusId !== profile?.campusId;
  const mustVerify = !demo && switching && !verifiedFor(user, campusId);

  const pickCampus = (id) => {
    setCampusId(id);
    setStep(null);
    setProblem('');
    if (emailFits(user?.email, id)) setEmail(user.email);
    else setEmail('');
    // until they choose for themselves, assume a free bus pass gets used
    if (!touchedModes) setModes(defaultModes(getCampus(id)));
  };

  const toggleMode = (id) => {
    setTouchedModes(true);
    setModes((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };

  const save = async () => {
    setBusy(true);
    const name = profile?.name || user?.displayName || 'Guest';
    try {
      // a token minted before the email was verified wouldn't pass the database's school check
      if (!demo && switching) await user.getIdToken(true);
      await updateProfile({
        campusId,
        pendingCampusId: null,
        getAround: modes,
        name,
        // friends find you by this, e.g. @maya42
        handle:
          profile?.handle || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 90 + 10)}`,
        following: profile?.following || [],
      });
      if (onboarding) return;
      if (!switching) {
        navigation.goBack();
        return;
      }
      // a new school starts every tab over, on the new school's front page
      let root = navigation;
      while (root.getParent()) root = root.getParent();
      root.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setProblem("Couldn't save that. Check your connection and try again.");
    }
    setBusy(false);
  };

  const sendLink = async () => {
    setProblem('');
    if (!emailFits(email, campusId)) {
      setProblem(`That needs to be your ${campus.short} email, ending in @${domainFor(campusId)}.`);
      return;
    }
    setBusy(true);
    try {
      if (needPassword) await confirmPassword(user, password);
      // remembered on your profile, so the switch finishes even if you have to log back in after clicking the link
      await updateProfile({ pendingCampusId: campusId });
      await sendSchoolLink(user, email);
      setNeedPassword(false);
      setPassword('');
      setStep('sent');
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        setNeedPassword(true);
        setProblem('For your security, enter your apero password first.');
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setProblem("That password didn't work.");
      } else if (e.code === 'auth/email-already-in-use') {
        setProblem('That email already belongs to another apero account.');
      } else if (e.code === 'auth/too-many-requests') {
        setProblem('Too many tries. Wait a few minutes and send it again.');
      } else {
        setProblem("Couldn't send the link. Check the address and try again.");
      }
    }
    setBusy(false);
  };

  const confirmClicked = async () => {
    setProblem('');
    setBusy(true);
    try {
      if (await checkSchool(user, campusId)) {
        setStep(null);
        await save();
        return;
      }
      setProblem("It's not confirmed yet. Open the link in the email (check spam too), then try again.");
    } catch (e) {
      // changing an account's email signs it out everywhere; logging back in finishes the switch
      if (e.code === 'auth/user-token-expired' || e.code === 'auth/user-not-found') {
        setProblem(`Your school email is confirmed. Log in again with ${email} to finish switching.`);
        setTimeout(logOut, 2500);
      } else {
        setProblem("Couldn't check just now. Try again in a moment.");
      }
    }
    setBusy(false);
  };

  const transit = campus?.transit;
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {onboarding ? (
          <>
            <Masthead
              kicker="Welcome to apero"
              title="Where do"
              accent="you eat?"
              note={
                demo
                  ? 'Pick any campus. In the demo you can switch whenever you like.'
                  : 'Pick your campus. You confirm it with your student email.'
              }
              sticker="lemon"
              stickerSize={110}
            />
            <Pressable onPress={logOut} style={styles.back} hitSlop={8}>
              <Text style={styles.backText}>← {demo ? 'Leave the demo' : 'Log out'}</Text>
            </Pressable>
          </>
        ) : (
          <Masthead
            kicker="Your school"
            title="Change"
            accent="school"
            note={
              demo
                ? 'In the demo you can switch to any campus.'
                : 'Switching schools needs your student email at the new one.'
            }
            sticker="tile"
            stickerSize={96}
          />
        )}
        <View style={styles.body}>
          <Label style={styles.label}>Campus</Label>
          <MenuCard title="thirteen campuses" style={{ paddingVertical: 6 }}>
            {CAMPUSES.map((c, i) => {
              const active = c.id === campusId;
              return (
                <View key={c.id}>
                  <Pressable
                    onPress={() => pickCampus(c.id)}
                    style={({ hovered }) => [
                      styles.campus,
                      hovered && !active && styles.campusHover,
                      active && styles.campusActive,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.campusName}>{c.name}</Text>
                      <Text style={styles.campusCity}>
                        {c.city}
                        {c.id === profile?.campusId ? '  ·  your school now' : ''}
                      </Text>
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

          {mustVerify && step && (
            <Paper tint={colors.butter} tilt={-0.4} outer={{ marginTop: 22 }} style={styles.verify}>
              <MailCheck size={26} color={colors.deep} />
              <Text style={styles.verifyTitle}>
                {step === 'sent' ? 'Check your inbox' : `Are you at ${campus.short}?`}
              </Text>
              {step === 'email' ? (
                <>
                  <Sub style={styles.verifyBody}>
                    Enter your {campus.short} student email. We'll send a link to it; open it and come back here. It
                    also becomes the email you log in with.
                  </Sub>
                  <Field
                    placeholder={`you@${domainFor(campusId)}`}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    inputMode="email"
                  />
                  {needPassword && (
                    <Field
                      placeholder="Your apero password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  )}
                  <Button label="Send the link" onPress={sendLink} loading={busy} disabled={!email.trim()} />
                </>
              ) : (
                <>
                  <Sub style={styles.verifyBody}>
                    We sent a link to <Text style={styles.em}>{email}</Text>. Open it, then tap below.
                  </Sub>
                  <Button label="I opened the link" onPress={confirmClicked} loading={busy} />
                  <Pressable onPress={() => setStep('email')} style={{ marginTop: 12 }} hitSlop={8}>
                    <Text style={styles.link}>Use a different email or send it again</Text>
                  </Pressable>
                </>
              )}
            </Paper>
          )}
          {problem ? <Text style={styles.problem}>{problem}</Text> : null}

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

          {!(mustVerify && step) && (
            <Button
              label={mustVerify ? `Confirm I'm at ${campus.short}` : onboarding ? "Let's eat" : 'Save'}
              onPress={mustVerify ? () => setStep('email') : save}
              loading={busy}
              disabled={!campusId || modes.length === 0}
              style={{ marginTop: 28 }}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingBottom: 22 },
  back: { paddingHorizontal: 22, marginTop: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.bold, fontSize: 14, color: colors.persimmon },
  label: { marginTop: 22, marginBottom: 10 },
  campus: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 6, borderRadius: 6 },
  campusHover: { backgroundColor: colors.butter },
  campusActive: { backgroundColor: colors.lemon },
  campusName: { fontFamily: fonts.title, fontSize: 17, color: colors.ink },
  campusCity: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  campusArrow: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, opacity: 0.4 },
  verify: { borderWidth: 1.5, borderColor: colors.ink },
  verifyTitle: { fontFamily: fonts.title, fontSize: 26, color: colors.deep, marginTop: 8 },
  verifyBody: { marginTop: 6, marginBottom: 14 },
  em: { fontFamily: fonts.bold, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.persimmon, textDecorationLine: 'underline' },
  problem: { fontFamily: fonts.medium, fontSize: 14, color: colors.blood, marginTop: 12 },
  hint: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
});
