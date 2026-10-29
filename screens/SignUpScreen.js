import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Button, Field, Note, Screen } from '../components/ui';
import { AuthHeader, styles } from './LoginScreen';

const ERRORS = {
  'auth/email-already-in-use': 'That email already has an account.',
  'auth/invalid-email': "That email doesn't look right.",
  'auth/weak-password': 'Password needs at least 6 characters.',
};

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const signUp = async () => {
    setBusy(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      // the navigator sends new accounts to campus setup from here
    } catch (e) {
      Alert.alert("Couldn't sign up", ERRORS[e.code] || e.message);
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
