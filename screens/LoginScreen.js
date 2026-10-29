import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Button, CollageHeader, Field, Note, Screen } from '../components/ui';
import { colors, fonts } from '../theme';

const PIECES = [
  { name: 'spritz', size: 104, rotate: 8, right: 26, top: 92 },
  { name: 'sardine', size: 210, rotate: -9, left: -36, top: 236 },
  { name: 'lemon', size: 84, rotate: -14, left: 18, top: 70 },
  { name: 'orangeSlice', size: 64, rotate: 0, right: 118, top: 228 },
];

export function AuthHeader() {
  return (
    <CollageHeader height={300} pieces={PIECES}>
      <View style={styles.center}>
        <View style={styles.label}>
          <Text style={styles.word}>apero</Text>
        </View>
      </View>
    </CollageHeader>
  );
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const logIn = async () => {
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert("Couldn't log in", 'Double check your email and password.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
          <AuthHeader />
          <View style={styles.form}>
            <Note size={24} style={styles.tagline}>
              Rate what you ate, find where to eat next.
            </Note>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <Button
              label="Log in"
              onPress={logIn}
              loading={busy}
              disabled={!email || !password}
              style={{ marginTop: 8 }}
            />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 30 },
  label: {
    backgroundColor: colors.paper,
    paddingHorizontal: 26,
    paddingTop: 4,
    paddingBottom: 8,
    borderRadius: 4,
    transform: [{ rotate: '-3deg' }],
  },
  word: { fontFamily: fonts.display, fontSize: 70, lineHeight: 78, color: colors.cobalt },
  tagline: { marginBottom: 24, color: colors.ink },
  form: { padding: 26, paddingTop: 34 },
  switch: { marginTop: 24, alignItems: 'center' },
  switchText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  switchLink: { fontFamily: fonts.medium, color: colors.orange },
});
