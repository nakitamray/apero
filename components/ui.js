import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, lift, tints } from '../theme';
import { formatScore } from '../lib/score';
import { PLATTERS, StampFrame, Sticker } from './art';

// ticking-fabric pinstripes on white, cycling turquoise / orange / lemon
const PINS = ['rgba(31, 179, 204, 0.22)', 'rgba(255, 123, 28, 0.18)', 'rgba(255, 212, 59, 0.38)'];

export function Pinstripes() {
  const { width } = useWindowDimensions();
  const count = Math.ceil(width / 26);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.pin, { left: i * 26 + 10 }]}>
          <View style={[styles.pinLine, { backgroundColor: PINS[i % 3] }]} />
          <View style={[styles.pinLine, { backgroundColor: PINS[i % 3] }]} />
        </View>
      ))}
    </View>
  );
}

export function Screen({ children, style }) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.page }, style]}>
      <Pinstripes />
      {children}
    </View>
  );
}

// long words step down a size so they never run into the cut-out
const fit = (text = '') => {
  const longest = Math.max(
    ...String(text)
      .split(' ')
      .map((w) => w.length),
  );
  const size = longest > 10 ? 34 : longest > 7 ? 40 : 46;
  return { fontSize: size, lineHeight: size };
};

const today = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();

// The top of every main screen, set like the head of a printed menu: a small line of
// context, a double rule, a big title, and one painted cut-out that drifts as you scroll.
export function Masthead({ kicker, title, accent, note, sticker, stickerSize = 120, scrollY, right }) {
  const insets = useSafeAreaInsets();
  const drift = scrollY
    ? {
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [-100, 0, 300],
              outputRange: [-20, 0, 90],
              extrapolate: 'clamp',
            }),
          },
          {
            rotate: scrollY.interpolate({
              inputRange: [0, 300],
              outputRange: ['-6deg', '14deg'],
              extrapolate: 'clamp',
            }),
          },
        ],
      }
    : { transform: [{ rotate: '-6deg' }] };

  return (
    <View style={[styles.mast, { paddingTop: insets.top + 12 }]}>
      <View style={styles.mastTop}>
        <Text style={styles.mastKicker} numberOfLines={1}>
          {kicker}
        </Text>
        <Text style={styles.mastKicker}>{right ?? today()}</Text>
      </View>
      <View style={styles.ruleThick} />
      <View style={styles.ruleThin} />

      <View style={styles.mastBody}>
        <View style={{ flex: 1, paddingRight: sticker ? stickerSize * 0.8 : 0 }}>
          <Text style={[styles.mastTitle, fit(title)]}>{title}</Text>
          {accent ? <Text style={[styles.mastTitle, styles.mastAccent, fit(accent)]}>{accent}</Text> : null}
        </View>
        {sticker ? (
          <Animated.View style={[styles.mastSticker, drift]} pointerEvents="none">
            <Sticker name={sticker} width={stickerSize} />
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.ruleThin} />
      {note ? <Text style={styles.mastNote}>{note}</Text> : null}
    </View>
  );
}

export function Label({ children, color = colors.teal, style }) {
  return <Text style={[styles.label, { color }, style]}>{children}</Text>;
}

export function Title({ children, size = 40, color = colors.ink, style, numberOfLines }) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.title, { fontSize: size, lineHeight: size * 1.02, color }, style]}
    >
      {children}
    </Text>
  );
}

// big numbers (counts, stats); the wavy Gresida digits are kept for scores on plates
export function Num({ children, size = 32, color = colors.deep, style }) {
  return <Text style={[styles.num, { fontSize: size, lineHeight: size * 1.15, color }, style]}>{children}</Text>;
}

export function Note({ children, style, size = 15 }) {
  return <Text style={[styles.note, { fontSize: size, lineHeight: size * 1.45 }, style]}>{children}</Text>;
}

export function Sub({ children, style }) {
  return <Text style={[styles.sub, style]}>{children}</Text>;
}

// section heads read like menu headings: TITLE ———— see all
export function SectionHeader({ label, title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      {label ? <Label style={{ marginBottom: 4 }}>{label}</Label> : null}
      <View style={styles.sectionRow}>
        <Title size={26}>{title}</Title>
        <View style={styles.sectionRule} />
        {action ? (
          <Pressable onPress={onAction} hitSlop={10} style={styles.sectionAction}>
            <Text style={styles.link}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// fades + rises into place, staggered by index, so lists feel like they're being dealt out
export function Rise({ index = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, 8) * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// springy press for anything tappable
function usePress(scaleTo = 0.97) {
  const v = useRef(new Animated.Value(1)).current;
  const to = (value) => Animated.spring(v, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  return { scale: v, onPressIn: () => to(scaleTo), onPressOut: () => to(1) };
}

// a scrap of tinted paper. the tilt makes it feel pasted in by hand
export function Paper({ children, style, outer, onPress, tilt = 0, tint, index = 0 }) {
  const press = usePress();
  const body = [styles.paper, { backgroundColor: tint || tints[index % tints.length] }, style];
  return (
    <Animated.View style={[{ transform: [{ rotate: `${tilt}deg` }, { scale: press.scale }] }, outer]}>
      {onPress ? (
        <Pressable style={body} onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
          {children}
        </Pressable>
      ) : (
        <View style={body}>{children}</View>
      )}
    </Animated.View>
  );
}

// a printed menu: double ink border, lines inside separated by dotted rules
export function MenuCard({ children, style, outer, title }) {
  return (
    <View style={[styles.menuOuter, outer]}>
      <View style={[styles.menuInner, style]}>
        {title ? (
          <Text style={styles.menuTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

export function Dotted({ style }) {
  return <View style={[styles.dotted, style]} />;
}

// painted majolica platter for the bigger info blocks
export function Platter({ children, tone = 'blue', style, outer }) {
  return (
    <View style={[lift, outer]}>
      <Image source={PLATTERS[tone]} resizeMode="stretch" style={styles.platterArt} />
      <View style={[styles.platter, style]}>{children}</View>
    </View>
  );
}

export function Button({ label, onPress, kind = 'primary', disabled, loading, icon, style }) {
  const press = usePress(0.96);
  const look = {
    primary: { bg: colors.deep, fg: colors.paper, border: colors.deep },
    citrus: { bg: colors.persimmon, fg: colors.paper, border: colors.persimmon },
    light: { bg: colors.page, fg: colors.deep, border: colors.deep },
  }[kind];
  return (
    <Animated.View style={[{ transform: [{ scale: press.scale }] }, disabled && { opacity: 0.45 }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.button, { backgroundColor: look.bg, borderColor: look.border }, kind !== 'light' && lift]}
      >
        {loading ? (
          <ActivityIndicator color={look.fg} />
        ) : (
          <View style={styles.row}>
            {icon}
            <Text style={[styles.buttonText, { color: look.fg }]}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Chip({ label, active, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, style]} hitSlop={4}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// the score sits on a little majolica plate
export function Plate({ score, size = 54 }) {
  const empty = score == null;
  return (
    <ImageBackground source={require('../assets/art/plate.png')} style={[styles.plate, { width: size, height: size }]}>
      <Text
        style={
          empty
            ? [styles.plateNew, { fontSize: size * 0.17 }]
            : [styles.plateScore, { fontSize: size * 0.36, lineHeight: size * 0.46 }]
        }
      >
        {empty ? 'NEW' : formatScore(score)}
      </Text>
    </ImageBackground>
  );
}

const STAMP = {
  love: { text: 'Loved it', color: colors.blood },
  fine: { text: 'It was fine', color: colors.cobalt },
  meh: { text: 'Not for me', color: colors.muted },
};

export function Stamp({ verdict, style }) {
  const s = STAMP[verdict];
  if (!s) return null;
  return (
    <StampFrame width={104} height={32} style={[{ transform: [{ rotate: '-2deg' }] }, lift, style]}>
      <View style={[styles.stampInner, { borderColor: s.color }]}>
        <Text style={[styles.stampText, { color: s.color }]}>{s.text}</Text>
      </View>
    </StampFrame>
  );
}

export function Tag({ children, color = colors.deep }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{children}</Text>
    </View>
  );
}

export function Field({ label, style, ...props }) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Label style={{ marginBottom: 6 }}>{label}</Label> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, props.multiline && styles.multiline]}
        {...props}
      />
    </View>
  );
}

export function Empty({ title, body, children, art = 'vase' }) {
  return (
    <View style={styles.empty}>
      <Sticker name={art} width={art === 'vase' ? 110 : 170} rotate={-4} />
      <Title size={24} style={{ marginTop: 14, textAlign: 'center' }}>
        {title}
      </Title>
      {body ? <Sub style={styles.emptyBody}>{body}</Sub> : null}
      {children}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <ActivityIndicator color={colors.deep} />
    </View>
  );
}

export const styles = StyleSheet.create({
  pin: { position: 'absolute', top: 0, bottom: 0, flexDirection: 'row', gap: 3 },
  pinLine: { width: 1, height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  mast: { paddingHorizontal: 22, paddingBottom: 6 },
  mastTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  mastKicker: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.ink,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  ruleThick: { height: 3, backgroundColor: colors.ink },
  ruleThin: { height: 1, backgroundColor: colors.ink, marginTop: 3 },
  mastBody: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, minHeight: 120 },
  mastTitle: { fontFamily: fonts.title, fontSize: 46, lineHeight: 46, color: colors.deep, letterSpacing: -0.5 },
  mastAccent: { color: colors.persimmon },
  mastSticker: { position: 'absolute', right: -10, top: 6 },
  mastNote: { fontFamily: fonts.italic, fontSize: 14, color: colors.muted, marginTop: 10 },

  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase' },
  title: { fontFamily: fonts.title },
  num: { fontFamily: fonts.title },
  note: { fontFamily: fonts.italic, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },

  sectionHeader: { paddingHorizontal: 22, marginTop: 34, marginBottom: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionRule: { flex: 1, height: 1.5, backgroundColor: colors.ink, opacity: 0.8 },
  sectionAction: { borderBottomWidth: 1.5, borderBottomColor: colors.persimmon },
  link: { fontFamily: fonts.bold, color: colors.persimmon, fontSize: 13 },

  paper: { borderRadius: 6, padding: 16, ...lift },
  menuOuter: { borderWidth: 1.5, borderColor: colors.ink, padding: 4, backgroundColor: colors.paper, ...lift },
  menuInner: { borderWidth: 1, borderColor: colors.ink, paddingHorizontal: 16, paddingVertical: 14 },
  menuTitle: {
    fontFamily: fonts.title,
    fontSize: 15,
    letterSpacing: 3,
    textAlign: 'center',
    color: colors.persimmon,
    marginBottom: 6,
  },
  dotted: { borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: colors.muted, opacity: 0.6 },

  platter: { paddingHorizontal: '11%', paddingVertical: 40, minHeight: 150, justifyContent: 'center' },
  platterArt: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  button: {
    borderRadius: 999,
    borderWidth: 2,
    height: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 15, letterSpacing: 0.6 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 15,
    backgroundColor: colors.page,
  },
  chipActive: { backgroundColor: colors.deep, borderColor: colors.deep },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  chipTextActive: { color: colors.paper, fontFamily: fonts.bold },
  plate: { alignItems: 'center', justifyContent: 'center' },
  plateScore: { fontFamily: fonts.number, color: colors.deep },
  plateNew: { fontFamily: fonts.bold, color: colors.deep, letterSpacing: 1.5 },
  stampInner: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  tag: { borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: colors.page },
  tagText: { fontFamily: fonts.medium, fontSize: 12 },
  input: {
    backgroundColor: colors.page,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  empty: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 34 },
  emptyBody: { fontSize: 15, marginTop: 6, textAlign: 'center', lineHeight: 21 },
});
