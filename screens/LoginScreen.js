import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Awning, Button, Field } from '../components/ui';
import { Spritz } from '../components/art';
import { colors, fonts } from '../theme';

export function AuthHeader() {
  return (
    <Awning height={220}>
      <View style={styles.headerInner}>
        <Spritz size={72} />
        <Text style={styles.word}>apero</Text>
      </View>
    </Awning>
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
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
        <AuthHeader />
        <View style={styles.form}>
          <Text style={styles.tagline}>Rate what you ate, find where to eat next.</Text>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Button label="Log in" onPress={logIn} loading={busy} disabled={!email || !password} style={{ marginTop: 8 }} />
          <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.switch}>
            <Text style={styles.switchText}>
              New here? <Text style={styles.switchLink}>Make an account</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  headerInner: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 },
  word: {
    fontFamily: fonts.displayItalic,
    fontSize: 54,
    color: colors.ink,
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  tagline: { fontFamily: fonts.displayItalic, fontSize: 20, color: colors.ink, marginBottom: 22, lineHeight: 26 },
  form: { padding: 24, paddingTop: 26 },
  switch: { marginTop: 22, alignItems: 'center' },
  switchText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  switchLink: { fontFamily: fonts.bold, color: colors.cobalt, textDecorationLine: 'underline' },
});
