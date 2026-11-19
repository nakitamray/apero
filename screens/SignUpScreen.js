import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button, Field, Note, Screen } from '../components/ui';
import { AuthHeader, BackToDemo, styles } from './LoginScreen';

const ERRORS = {
  'auth/email-already-in-use': 'That email already has an account.',
  'auth/invalid-email': "That email doesn't look right.",
  'auth/weak-password': 'Password needs at least 6 characters.',
  'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
};

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const signUp = async () => {
    setProblem('');
    if (!auth) {
      setProblem('Accounts are off on this build. You can still look around in the demo.');
      return;
    }
    setBusy(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      // the navigator sends new accounts to campus setup from here
    } catch (e) {
      setProblem(ERRORS[e.code] || "Couldn't make the account. Try again in a moment.");
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
            <Note size={24} style={styles.tagline}>
              Make an account. Takes a minute.
            </Note>
            <Field label="First name" value={name} onChangeText={setName} autoCapitalize="words" />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            {problem ? <Text style={styles.problem}>{problem}</Text> : null}
            <Button
              label="Create account"
              onPress={signUp}
              loading={busy}
              disabled={!name.trim() || !email || !password}
              style={{ marginTop: 8 }}
            />
            <Pressable onPress={() => navigation.goBack()} style={styles.switch}>
              <Text style={styles.switchText}>
                Have an account? <Text style={styles.switchLink}>Log in</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
