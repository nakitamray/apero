import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useSession } from '../context/Session';
import { Button, Field, Masthead, Note, Screen } from '../components/ui';
import { colors, fonts } from '../theme';

// came here from the demo (e.g. "Make an account" on the website): one tap goes back to it
export function BackToDemo() {
  const { wasDemo, startDemo } = useSession();
  if (!wasDemo) return null;
  return (
    <Pressable onPress={startDemo} style={styles.backDemo} hitSlop={8} accessibilityRole="button">
      <Text style={styles.backDemoText}>← Back to the demo</Text>
    </Pressable>
  );
}

export function AuthHeader() {
  return (
    <Masthead
      kicker="A food diary for campus"
      title="Apero"
      accent="rate what you ate"
      sticker="spritz"
      stickerSize={130}
      right=""
    />
  );
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [notice, setNotice] = useState('');
  const { startDemo } = useSession();

  // Firebase emails a link to pick a new password (free)
  const forgot = async () => {
    setProblem('');
    setNotice('');
    if (!auth) {
      setProblem('Accounts are off on this build. You can still look around in the demo.');
      return;
    }
    if (!email.trim()) {
      setProblem('Type your email above, then tap "Forgot password?" again.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(
        `If there's an account for ${email.trim()}, a link to reset your password is on its way. Check spam too.`,
      );
    } catch (e) {
      setProblem(
        e.code === 'auth/invalid-email'
          ? "That email doesn't look right."
          : e.code === 'auth/too-many-requests'
            ? 'Too many tries. Wait a few minutes and try again.'
            : "Couldn't send the reset link. Try again in a moment.",
      );
    }
  };

  // shown on the page (pop-up alerts don't appear in a web browser)
  const logIn = async () => {
    setProblem('');
    setNotice('');
    if (!auth) {
      setProblem('Accounts are off on this build. You can still look around in the demo.');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setProblem(
        e.code === 'auth/too-many-requests'
          ? 'Too many tries. Wait a few minutes and try again.'
          : "Couldn't log in. Double check your email and password.",
      );
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
          <BackToDemo />
          <AuthHeader />
          <View style={styles.form}>
            <Note size={16} style={styles.tagline}>
              Find where to eat next, and what to order when you get there.
            </Note>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onSubmitEditing={logIn}
            />
            <Pressable onPress={forgot} style={styles.forgot} hitSlop={8} accessibilityRole="button">
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
            {problem ? <Text style={styles.problem}>{problem}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <Button
              label="Log in"
              onPress={logIn}
              loading={busy}
              disabled={!email || !password}
              style={{ marginTop: 8 }}
            />
            <Button label="Just looking? Try the demo" kind="light" onPress={startDemo} style={{ marginTop: 12 }} />
            <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.switch}>
              <Text style={styles.switchText}>
                New here? <Text style={styles.switchLink}>Make an account</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export const styles = StyleSheet.create({
  tagline: { marginBottom: 24, color: colors.ink },
  form: { padding: 26, paddingTop: 34 },
  switch: { marginTop: 24, alignItems: 'center' },
  problem: { fontFamily: fonts.medium, fontSize: 14, color: colors.blood, marginBottom: 6 },
  notice: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.teal, marginBottom: 6 },
  forgot: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 10 },
  forgotText: { fontFamily: fonts.medium, fontSize: 13, color: colors.orange },
  backDemo: { paddingHorizontal: 22, paddingTop: 14, alignSelf: 'flex-start' },
  backDemoText: { fontFamily: fonts.bold, fontSize: 13, color: colors.persimmon },
  switchText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  switchLink: { fontFamily: fonts.medium, color: colors.orange },
});
