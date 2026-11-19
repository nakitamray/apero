// A card on Me (website only) for putting apero on your home screen like a real app.
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Share, X } from 'lucide-react-native';
import { canPrompt, installed, isIPhone, onInstallChange, promptInstall } from '../lib/install';
import { Button } from './ui';
import { Sticker } from './art';
import { colors, fonts } from '../theme';

const KEY = 'apero-install-hidden';
const hiddenBefore = () => {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export default function InstallHint() {
  const [, redraw] = useState(0);
  const [hidden, setHidden] = useState(Platform.OS !== 'web' || installed() || hiddenBefore());
  useEffect(() => onInstallChange(() => redraw((n) => n + 1)), []);

  const iphone = isIPhone();
  if (hidden || (!iphone && !canPrompt())) return null;

  const hide = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      // it'll just show again next time
    }
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={hide} style={styles.close} hitSlop={10} accessibilityLabel="Hide this">
        <X size={18} color={colors.muted} />
      </Pressable>
      <View style={styles.row}>
        <Sticker name="spritz" width={40} rotate={-8} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Put apero on your home screen</Text>
          {iphone ? (
            <Text style={styles.body}>
              Tap <Share size={14} color={colors.deep} /> Share at the bottom of Safari, then{' '}
              <Text style={styles.em}>Add to Home Screen</Text>. It opens full screen, like an app.
            </Text>
          ) : (
            <Text style={styles.body}>It opens full screen with its own icon, like an app. Free, no app store.</Text>
          )}
        </View>
      </View>
      {!iphone && (
        <Button
          label="Install apero"
          onPress={() => promptInstall().then((ok) => ok && hide())}
          style={{ marginTop: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.lagoon,
  },
  close: { position: 'absolute', top: 8, right: 8, zIndex: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 18 },
  title: { fontFamily: fonts.title, fontSize: 19, lineHeight: 21, color: colors.deep },
  body: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink, marginTop: 3 },
  em: { fontFamily: fonts.bold },
});
