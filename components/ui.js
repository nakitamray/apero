import React, { createContext, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { colors, fonts, lift, tints } from '../theme';
import { formatScore } from '../lib/score';
import { BACKGROUNDS, PLATTERS, StampFrame, Sticker, TornEdge, WAVES } from './art';

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

// What text looks like on each kind of background. Screens painted orange or tiled cobalt
// flip headings to cream; anything inside a Paper or Platter goes back to ink.
const INKS = {
  paper: {
    text: colors.ink,
    sub: colors.muted,
    label: colors.cobalt,
    link: colors.cobalt,
    mark: colors.lemon,
    shadow: null,
  },
  orange: {
    text: colors.paper,
    sub: '#FFE7D2',
    label: '#FFF1C4',
    link: colors.paper,
    mark: colors.deep,
    shadow: 'rgba(120, 30, 0, 0.35)',
  },
  cobalt: {
    text: colors.paper,
    sub: '#D6E4F7',
    label: colors.lemon,
    link: colors.lemon,
    mark: colors.persimmon,
    shadow: 'rgba(5, 20, 60, 0.45)',
  },
};

const ToneContext = createContext('paper');
export const useInk = () => INKS[useContext(ToneContext)];
const textShadow = (ink) => (ink.shadow ? { textShadowColor: ink.shadow, textShadowRadius: 6 } : null);

export function Screen({ children, style, tone = 'paper' }) {
  const { width, height } = useWindowDimensions();
  return (
    <ToneContext.Provider value={tone}>
      <View
        style={[
          {
            flex: 1,
            backgroundColor: tone === 'cobalt' ? colors.cobalt : tone === 'orange' ? colors.orange : colors.page,
          },
          style,
        ]}
      >
        {tone === 'paper' ? (
          <Pinstripes />
        ) : (
          <Image source={BACKGROUNDS[tone]} style={{ position: 'absolute', width, height }} resizeMode="cover" />
        )}
        {children}
      </View>
    </ToneContext.Provider>
  );
}

// anything drawn on paper reads in ink again
const OnPaper = ({ children }) => <ToneContext.Provider value="paper">{children}</ToneContext.Provider>;

// blue lino-cut band with painted cut-outs pinned over it, torn along the bottom
export function CollageHeader({ height, pieces = [], tone = 'aqua', children }) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ zIndex: 2 }}>
      <ImageBackground source={WAVES[tone]} style={{ height, width }} resizeMode="cover">
        {children}
      </ImageBackground>
      <TornEdge width={width} />
      {pieces.map(({ name, size, rotate, flip, ...pos }, i) => (
        <View key={i} style={[styles.piece, pos]} pointerEvents="none">
          <Sticker name={name} width={size} rotate={rotate} flip={flip} />
        </View>
      ))}
    </View>
  );
}

export function Label({ children, color, style }) {
  const ink = useInk();
  return <Text style={[styles.label, { color: color || ink.label }, style]}>{children}</Text>;
}

export function Title({ children, size = 40, color, style }) {
  const ink = useInk();
  return (
    <Text
      style={[
        styles.title,
        { fontSize: size, lineHeight: size * 1.08, color: color || ink.text },
        textShadow(ink),
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Note({ children, style, size = 19 }) {
  const ink = useInk();
  return (
    <Text style={[styles.note, { fontSize: size, lineHeight: size * 1.25, color: ink.text }, textShadow(ink), style]}>
      {children}
    </Text>
  );
}

// muted helper text that still reads on painted backgrounds
export function Sub({ children, style }) {
  const ink = useInk();
  return <Text style={[styles.sub, { color: ink.sub }, style]}>{children}</Text>;
}

export function SectionHeader({ label, title, action, onAction }) {
  const ink = useInk();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        {label ? <Label>{label}</Label> : null}
        <View style={{ alignSelf: 'flex-start' }}>
          <View style={[styles.highlight, { backgroundColor: ink.mark, opacity: ink.shadow ? 0.8 : 0.55 }]} />
          <Title size={32}>{title}</Title>
        </View>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[styles.link, { color: ink.link }]}>{action} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// a scrap of tinted paper. the tilt makes lists feel pasted in by hand
export function Paper({ children, style, outer, onPress, tilt = 0, tint, index = 0 }) {
  const [down, setDown] = useState(false);
  const body = [styles.paper, { backgroundColor: tint || tints[index % tints.length] }, style];
  const wrap = [{ transform: [{ rotate: `${tilt}deg` }, { scale: down ? 0.985 : 1 }] }, outer];
  return (
    <View style={wrap}>
      {onPress ? (
        <Pressable style={body} onPress={onPress} onPressIn={() => setDown(true)} onPressOut={() => setDown(false)}>
          <OnPaper>{children}</OnPaper>
        </Pressable>
      ) : (
        <View style={body}>
          <OnPaper>{children}</OnPaper>
        </View>
      )}
    </View>
  );
}

// painted majolica platter for the bigger info blocks
export function Platter({ children, tone = 'blue', style, outer }) {
  return (
    <View style={[lift, outer]}>
      <Image source={PLATTERS[tone]} resizeMode="stretch" style={styles.platterArt} />
      <View style={[styles.platter, style]}>
        <OnPaper>{children}</OnPaper>
      </View>
    </View>
  );
}

export function Button({ label, onPress, kind = 'primary', disabled, loading, icon, style }) {
  const look = {
    primary: { bg: colors.deep, fg: colors.paper, border: colors.deep },
    citrus: { bg: colors.persimmon, fg: colors.paper, border: colors.persimmon },
    light: { bg: colors.lagoon, fg: colors.deep, border: colors.lagoon },
  }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: look.bg, borderColor: look.border },
        kind !== 'light' && lift,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
        style,
      ]}
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
            : [styles.plateScore, { fontSize: size * 0.4, lineHeight: size * 0.46 }]
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

export function Tag({ children, color = colors.cobalt }) {
  return (
    <View style={styles.tag}>
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
      <Title size={26} style={{ marginTop: 14, textAlign: 'center' }}>
        {title}
      </Title>
      {body ? <Sub style={styles.emptyBody}>{body}</Sub> : null}
      {children}
    </View>
  );
}

export function Loading() {
  const ink = useInk();
  return (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <ActivityIndicator color={ink.text} />
    </View>
  );
}

export const styles = StyleSheet.create({
  pin: { position: 'absolute', top: 0, bottom: 0, flexDirection: 'row', gap: 3 },
  pinLine: { width: 1, height: '100%' },
  piece: { position: 'absolute', zIndex: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display },
  note: { fontFamily: fonts.note },
  highlight: {
    position: 'absolute',
    left: -6,
    right: -10,
    bottom: 4,
    height: 13,
    backgroundColor: colors.lemon,
    opacity: 0.55,
    borderRadius: 3,
    transform: [{ rotate: '-1deg' }],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    marginTop: 34,
    marginBottom: 14,
  },
  link: { fontFamily: fonts.medium, color: colors.cobalt, fontSize: 13, letterSpacing: 0.5, marginBottom: 6 },
  paper: { borderRadius: 6, padding: 16, ...lift },
  platter: { paddingHorizontal: '11%', paddingVertical: 40, minHeight: 150, justifyContent: 'center' },
  platterArt: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  button: {
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontFamily: fonts.medium, fontSize: 16, letterSpacing: 0.4 },
  chip: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 15,
    backgroundColor: '#F6FBFC',
  },
  chipActive: { backgroundColor: colors.lemon, borderColor: colors.lemon },
  chipText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  chipTextActive: { fontFamily: fonts.medium },
  plate: { alignItems: 'center', justifyContent: 'center' },
  plateScore: { fontFamily: fonts.display, color: colors.cobalt },
  plateNew: { fontFamily: fonts.medium, color: colors.cobalt, letterSpacing: 1.5 },
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
  stampText: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase' },
  tag: { backgroundColor: colors.lagoon, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontFamily: fonts.body, fontSize: 12 },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
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
  sub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
});
