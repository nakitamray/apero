// What opens when you tap the link in the student email. It confirms the address belongs to you,
// then sends you back into apero, where the school switch finishes on its own.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MailCheck } from 'lucide-react-native';
import { finishSchoolLink, rememberedSchoolEmail } from '../lib/school';
import { getCampus } from '../data/campuses';
import { Button, Field, Paper, Screen, Sub } from './ui';
import { Sticker } from './art';
import { colors, fonts } from '../theme';

const backToApp = () => {
  const base = window.location.pathname.match(/^(.*?\/app)(?=\/|$)/)?.[1] ?? '';
  window.location.replace(`${base}/`);
};

export default function SchoolLink() {
  const campus = getCampus(new URLSearchParams(window.location.search).get('campus'));
  const [email, setEmail] = useState(rememberedSchoolEmail());
  const [state, setState] = useState('ready'); // ready | working | done | failed
  const [problem, setProblem] = useState('');

  const finish = async (address) => {
    setState('working');
    setProblem('');
    try {
      await finishSchoolLink(address);
      setState('done');
    } catch (e) {
      setState('failed');
      setProblem(
        e.code === 'auth/invalid-email'
          ? "That isn't the address the link was sent to."
          : e.code === 'auth/invalid-action-code' || e.code === 'auth/expired-action-code'
            ? 'This link has expired or was already used. Send a new one from apero.'
            : "Couldn't confirm it. Try the link again, or send a new one from apero.",
      );
    }
  };

  // opened in the same browser that asked for it: no need to type the address again
  useEffect(() => {
    if (email) finish(email);
  }, []);

  return (
    <Screen style={styles.center}>
      <Paper tint={colors.butter} tilt={-0.6} style={styles.card} outer={styles.outer}>
        <Sticker name="spritz" width={64} rotate={-8} style={styles.art} />
        <MailCheck size={28} color={colors.deep} />
        {state === 'done' ? (
          <>
            <Text style={styles.title}>You're confirmed</Text>
            <Sub style={styles.body}>
              Your {campus?.short || 'school'} email checks out. Go back to apero (on this device or wherever you asked
              for the link) and your school switches over.
            </Sub>
            <Button label="Back to apero" onPress={backToApp} />
          </>
        ) : (
          <>
            <Text style={styles.title}>Confirm your school email</Text>
            <Sub style={styles.body}>
              {state === 'working'
                ? 'Checking the link...'
                : `Type the ${campus?.short || 'student'} email the link was sent to.`}
            </Sub>
            {state !== 'working' && (
              <>
                <Field
                  placeholder="you@school.edu"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                <Button label="Confirm" onPress={() => finish(email)} disabled={!email.trim()} />
              </>
            )}
            {problem ? <Text style={styles.problem}>{problem}</Text> : null}
          </>
        )}
      </Paper>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center', padding: 22 },
  outer: { width: '100%', maxWidth: 440 },
  card: { borderWidth: 1.5, borderColor: colors.ink, padding: 22 },
  art: { position: 'absolute', right: -14, top: -30 },
  title: { fontFamily: fonts.title, fontSize: 30, lineHeight: 32, color: colors.deep, marginTop: 10 },
  body: { marginTop: 8, marginBottom: 16 },
  problem: { fontFamily: fonts.medium, fontSize: 14, color: colors.blood, marginTop: 12 },
});
