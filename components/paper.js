// Newspaper pieces for the Today page: the nameplate, the news strip that runs along the top,
// and the column story boxes the front page is built from.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sticker } from './art';
import { colors, fonts } from '../theme';

const dayOfYear = (d = new Date()) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
const longDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// THE PURDUE DAILY PLATE, set big between rules like the top of a broadsheet
export function Nameplate({ campus, line, compact }) {
  const insets = useSafeAreaInsets();
  const size = compact ? 40 : 66;
  return (
    <View style={[styles.plate, { paddingTop: insets.top + 12 }]}>
      <View style={styles.ears}>
        <Text style={styles.ear}>Vol. II · No. {dayOfYear()}</Text>
        {!compact && <Text style={styles.ear}>{longDate()}</Text>}
        <Text style={styles.ear}>Free for students</Text>
      </View>
      <View style={styles.thick} />
      <View style={styles.nameRow}>
        <Sticker name="lemon" width={compact ? 40 : 74} rotate={-14} style={styles.side} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.the, { fontSize: size * 0.3 }]}>The {campus.short}</Text>
          <Text
            style={[styles.name, { fontSize: size, lineHeight: size * 1.02 }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            Daily Plate
          </Text>
        </View>
        <Sticker name="spritz" width={compact ? 38 : 64} rotate={10} style={styles.side} />
      </View>
      <View style={styles.thin} />
      <Text style={styles.line}>{compact ? `${longDate()} · ${line}` : line}</Text>
      <View style={styles.thick} />
      <View style={styles.thin} />
    </View>
  );
}

// the news strip: one line of headlines sliding past, on repeat
export function Ticker({ items }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!w) return undefined;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, { toValue: -w, duration: w * 22, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [w]);
  if (!items.length) return null;
  const run = (key) => (
    <View key={key} style={styles.run} onLayout={key === 'a' ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
      {items.map((t, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.star}>✶</Text>
          <Text style={styles.itemText}>{t}</Text>
        </View>
      ))}
    </View>
  );
  return (
    <View style={styles.ticker}>
      <View style={styles.flag}>
        <Text style={styles.flagText}>Live</Text>
      </View>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: x }] }}>
          {run('a')}
          {run('b')}
        </Animated.View>
      </View>
    </View>
  );
}

// a boxed story in a column: kicker, headline, rule, then whatever's inside
export function Story({ kicker, headline, children, action, onAction, last }) {
  return (
    <View style={[styles.story, last && { borderBottomWidth: 0 }]}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.headline}>{headline}</Text>
      <View style={styles.storyRule} />
      {children}
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} style={({ hovered }) => [styles.more, hovered && { opacity: 0.6 }]}>
          <Text style={styles.moreText}>{action} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// spreads stories into side-by-side columns with hairlines between, or stacks them on a phone
export function Columns({ count, children }) {
  const list = React.Children.toArray(children).filter(Boolean);
  if (count < 2) return <View style={styles.cols}>{list}</View>;
  const cols = Array.from({ length: count }, () => []);
  list.forEach((c, i) => cols[i % count].push(c));
  return (
    <View style={[styles.cols, { flexDirection: 'row' }]}>
      {cols.map((c, i) => (
        <View key={i} style={[styles.col, i > 0 && styles.colRule]}>
          {c}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: { paddingHorizontal: 22 },
  ears: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  ear: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.6, color: colors.ink, textTransform: 'uppercase' },
  thick: { height: 3, backgroundColor: colors.ink },
  thin: { height: 1, backgroundColor: colors.ink, marginTop: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  side: { marginHorizontal: 4 },
  the: {
    fontFamily: fonts.italic,
    color: colors.persimmon,
    textAlign: 'center',
    letterSpacing: 1,
  },
  name: { fontFamily: fonts.title, color: colors.deep, textAlign: 'center', letterSpacing: -1 },
  line: { fontFamily: fonts.italic, fontSize: 14, color: colors.ink, textAlign: 'center', paddingVertical: 7 },

  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 22,
    backgroundColor: colors.deep,
    borderRadius: 3,
    overflow: 'hidden',
  },
  flag: { backgroundColor: colors.blood, paddingHorizontal: 10, paddingVertical: 9 },
  flagText: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.paper,
    textTransform: 'uppercase',
  },
  run: { flexDirection: 'row' },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  star: { color: colors.lemon, fontSize: 12, marginRight: 10 },
  itemText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.paper,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  cols: { paddingHorizontal: 22 },
  col: { flex: 1, paddingHorizontal: 0 },
  colRule: { borderLeftWidth: 1, borderLeftColor: colors.ink, paddingLeft: 20, marginLeft: 20 },
  story: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.ink },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.teal,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headline: { fontFamily: fonts.title, fontSize: 26, lineHeight: 27, color: colors.ink },
  storyRule: { height: 1, backgroundColor: colors.ink, opacity: 0.35, marginTop: 10, marginBottom: 10 },
  more: { marginTop: 12, alignSelf: 'flex-start', borderBottomWidth: 1.5, borderBottomColor: colors.persimmon },
  moreText: { fontFamily: fonts.bold, fontSize: 13, color: colors.persimmon },
});
