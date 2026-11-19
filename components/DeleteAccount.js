// "Delete my account" at the bottom of Me. Asks for the password first (Firebase wants a fresh
// login before removing one), then takes everything out: reviews and their effect on scores, your list,
// photos, deals, your school email note, your profile, and finally the login itself.
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmailAuthProvider, deleteUser, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { deleteAccountData } from '../lib/api';
import { Button, Field } from './ui';
import { colors, fonts } from '../theme';

export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const remove = async () => {
    const user = auth?.currentUser;
    if (!user) return;
    setBusy(true);
    setProblem('');
    try {
      // check the password before anything is deleted
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    } catch (e) {
      setProblem(
        e.code === 'auth/too-many-requests'
          ? 'Too many tries. Wait a few minutes and try again.'
          : "That password didn't work.",
      );
      setBusy(false);
      return;
    }
    try {
      await deleteAccountData(user.uid);
      // signing out happens on its own once the login is gone; the app goes back to the log in page
      await deleteUser(user);
    } catch {
      setProblem("Something went wrong partway. Try again, and it'll finish removing the rest.");
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={styles.link} hitSlop={8} accessibilityRole="button">
        <Text style={styles.linkText}>Delete my account</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Delete your account?</Text>
      <Text style={styles.body}>
        This removes your reviews (and takes your ratings out of every score), your list, photos, passport, any deals
        you posted, and your login. It can't be undone.
      </Text>
      <Field label="Your password" value={password} onChangeText={setPassword} secureTextEntry />
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}
      <View style={styles.buttons}>
        <Button
          label="Delete everything"
          kind="citrus"
          onPress={remove}
          loading={busy}
          disabled={!password}
          style={{ flex: 1 }}
        />
        <Button label="Keep it" kind="light" onPress={() => setOpen(false)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'center', marginTop: 22 },
  linkText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, textDecorationLine: 'underline' },
  box: {
    marginTop: 22,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.blood,
    backgroundColor: colors.peach,
  },
  title: { fontFamily: fonts.title, fontSize: 24, color: colors.blood },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: 6, marginBottom: 14 },
  problem: { fontFamily: fonts.medium, fontSize: 14, color: colors.blood, marginBottom: 10 },
  buttons: { flexDirection: 'row', gap: 10 },
});
