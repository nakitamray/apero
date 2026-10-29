import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { colors, fonts, outline } from '../theme';
import { formatScore } from '../lib/score';
import { Sardine, Scallops } from './art';

export function Stripes({ height, style, children, light = colors.peach, dark = colors.aperol, count = 7 }) {
  return (
    <View style={[{ height, overflow: 'hidden' }, style]}>
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? light : dark }} />
        ))}
      </View>
      {children}
    </View>
  );
}

// cabana awning: stripes with a scalloped bottom edge
export function Awning({ height = 150, children }) {
  const { width } = useWindowDimensions();
  return (
    <View>
      <Stripes height={height}>{children}</Stripes>
      <View style={{ marginTop: -1 }}>
        <Scallops width={width} />
      </View>
    </View>
  );
}

export function Kicker({ children, color = colors.muted, style }) {
  return <Text style={[styles.kicker, { color }, style]}>{children}</Text>;
}

export function Title({ children, size = 30, style, italic }) {
  return (
    <Text style={[styles.title, { fontSize: size, lineHeight: size * 1.12 }, italic && { fontFamily: fonts.displayItalic }, style]}>
      {children}
    </Text>
  );
}

export function SectionHeader({ kicker, title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        {kicker ? <Kicker>{kicker}</Kicker> : null}
        <Title size={24}>{title}</Title>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// solid offset shadow drawn as a real layer so it looks the same on iOS and Android
const OFFSET = 4;

function Lifted({ radius, shadow = colors.ink, down, outer, children }) {
  return (
    <View style={[{ marginRight: OFFSET, marginBottom: OFFSET }, outer]}>
      <View style={[styles.shadow, { borderRadius: radius, backgroundColor: shadow }]} />
      <View style={down && styles.pressed}>{children}</View>
    </View>
  );
}

export function Card({ children, style, outer, onPress, shadow, tint = colors.card }) {
  const [down, setDown] = useState(false);
  const body = [styles.card, outline, { backgroundColor: tint }, style];
  return (
    <Lifted radius={14} shadow={shadow} down={down} outer={outer}>
      {onPress ? (
        <Pressable style={body} onPress={onPress} onPressIn={() => setDown(true)} onPressOut={() => setDown(false)}>
          {children}
        </Pressable>
      ) : (
        <View style={body}>{children}</View>
      )}
    </Lifted>
  );
}

export function Button({ label, onPress, kind = 'primary', disabled, loading, icon, style }) {
  const [down, setDown] = useState(false);
  const palette = {
    primary: { bg: colors.aperol, fg: colors.ink },
    ink: { bg: colors.ink, fg: colors.paper },
    plain: { bg: colors.card, fg: colors.ink },
  }[kind];
  return (
    <Lifted radius={999} down={down} outer={[disabled && { opacity: 0.45 }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => setDown(true)}
        onPressOut={() => setDown(false)}
        style={[styles.button, outline, { backgroundColor: palette.bg }]}
      >
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : (
          <View style={styles.row}>
            {icon}
            <Text style={[styles.buttonText, { color: palette.fg }]}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Lifted>
  );
}

export function Chip({ label, active, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, style]} hitSlop={4}>
      <Text style={[styles.chipText, active && { color: colors.paper }]}>{label}</Text>
    </Pressable>
  );
}

// score sits inside an orange "rind"
export function ScoreBadge({ score, size = 52 }) {
  const empty = score == null;
  return (
    <View style={[styles.rind, { width: size, height: size, borderRadius: size / 2, borderWidth: size * 0.1 }, empty && { borderColor: colors.sky }]}>
      <Text style={[styles.score, { fontSize: size * (empty ? 0.26 : 0.36) }]}>{empty ? 'new' : formatScore(score)}</Text>
    </View>
  );
}

const STAMP = {
  love: { text: 'LOVED IT', color: colors.blood },
  fine: { text: 'IT WAS FINE', color: colors.cobalt },
  meh: { text: 'NOT FOR ME', color: colors.muted },
};

export function Stamp({ verdict, style }) {
  const s = STAMP[verdict];
  if (!s) return null;
  return (
    <View style={[styles.stamp, { borderColor: s.color }, style]}>
      <Text style={[styles.stampText, { color: s.color }]}>{s.text}</Text>
    </View>
  );
}

export function Tag({ children, color = colors.ink }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{children}</Text>
    </View>
  );
}

export function Field({ label, style, ...props }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Kicker style={{ marginBottom: 6 }}>{label}</Kicker> : null}
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, props.multiline && styles.multiline]} {...props} />
    </View>
  );
}

export function Empty({ title, body, children }) {
  return (
    <View style={styles.empty}>
      <Sardine width={90} />
      <Sardine width={90} flip style={{ marginTop: 6 }} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {children}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <ActivityIndicator color={colors.aperol} />
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, color: colors.ink, letterSpacing: -0.5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 30, marginBottom: 12 },
  link: { fontFamily: fonts.bold, color: colors.cobalt, fontSize: 14, textDecorationLine: 'underline' },
  card: { borderRadius: 14, padding: 14 },
  shadow: { position: 'absolute', top: OFFSET, left: OFFSET, right: -OFFSET, bottom: -OFFSET },
  pressed: { transform: [{ translateX: OFFSET - 1 }, { translateY: OFFSET - 1 }] },
  button: { borderRadius: 999, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: fonts.bold, fontSize: 16 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  rind: { borderColor: colors.aperol, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.display, color: colors.ink },
  stamp: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    transform: [{ rotate: '-3deg' }],
  },
  stampText: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1 },
  tag: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontFamily: fonts.mono, fontSize: 11 },
  input: {
    ...outline,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 30 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginTop: 16, textAlign: 'center' },
  emptyBody: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 },
});
