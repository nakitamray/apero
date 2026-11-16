// Desktop navigation: the tabs set as the "carte" of a printed menu, down the left side.
// Gets the same props as a tab bar (state, descriptors, navigation).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Compass, ListOrdered, Stamp, Sun, User } from 'lucide-react-native';
import { useSession } from '../context/Session';
import { SIDEBAR } from '../lib/layout';
import { Sticker } from './art';
import { colors, fonts, lift } from '../theme';

const ENTRIES = [
  { route: 'TodayTab', numeral: 'I', label: 'Today', sub: 'the daily plate', Icon: Sun, color: colors.persimmon },
  { route: 'ExploreTab', numeral: 'II', label: 'Explore', sub: 'halls, spots, map', Icon: Compass, color: colors.teal },
  { route: 'ListTab', numeral: 'III', label: 'My list', sub: 'your ranking', Icon: ListOrdered, color: '#B8860B' },
  {
    route: 'MeTab',
    screen: 'Passport',
    numeral: 'IV',
    label: 'Passport',
    sub: 'every stamp you earned',
    Icon: Stamp,
    color: colors.blood,
  },
  {
    route: 'MeTab',
    screen: 'Profile',
    numeral: 'V',
    label: 'Me',
    sub: 'stats, friends',
    Icon: User,
    color: colors.cobalt,
  },
];

const edition = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function Sidebar({ state, navigation }) {
  const { campus, demo, logOut } = useSession();
  const current = state.routes[state.index];
  // which screen inside the Me tab is showing, so Passport and Me light up separately
  // (before that tab has drawn, the screen it's opening is still only in its params)
  const inner = current.state ? current.state.routes[current.state.index ?? 0]?.name : current.params?.screen;

  const isOn = (e) => {
    if (e.route !== current.name) return false;
    if (e.route !== 'MeTab') return true;
    return e.screen === 'Passport' ? inner === 'Passport' : inner !== 'Passport';
  };

  const go = (e) => (e.screen ? navigation.navigate(e.route, { screen: e.screen }) : navigation.navigate(e.route));

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.inner}>
          <View style={styles.brand}>
            <Sticker name="spritz" width={46} rotate={-8} />
            <View>
              <Text style={styles.logo}>apero</Text>
              <Text style={styles.est}>est. on campus</Text>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('MeTab', { screen: 'Settings' })} style={styles.schoolRow}>
            {({ hovered }) => (
              <>
                <Text style={styles.kicker} numberOfLines={1}>
                  {campus.short} / {campus.city}
                </Text>
                <Text style={[styles.change, hovered && { textDecorationLine: 'underline' }]}>change school</Text>
              </>
            )}
          </Pressable>
          <View style={styles.ruleThick} />
          <View style={styles.ruleThin} />

          <Text style={styles.carte}>La carte</Text>

          {ENTRIES.map((e) => {
            const on = isOn(e);
            return (
              <Pressable
                key={e.label}
                onPress={() => go(e)}
                style={({ hovered }) => [styles.entry, hovered && !on && styles.hover]}
              >
                <Text style={[styles.numeral, on && { color: e.color }]}>{e.numeral}.</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.entryTop}>
                    <Text style={[styles.entryLabel, on && { color: e.color }]}>{e.label}</Text>
                    <View style={styles.leader} />
                    <e.Icon size={17} color={on ? e.color : colors.muted} strokeWidth={on ? 2.2 : 1.6} />
                  </View>
                  <Text style={styles.entrySub}>{e.sub}</Text>
                </View>
                {on && <View style={[styles.marker, { backgroundColor: e.color }]} />}
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => navigation.navigate('ReviewTab')}
            style={({ hovered, pressed }) => [styles.rate, (hovered || pressed) && styles.rateHover]}
          >
            <Sticker name="orangeSlice" width={34} rotate={-12} />
            <Text style={styles.rateText}>Rate a dish</Text>
          </Pressable>

          <View style={{ flex: 1 }} />
          <View style={styles.ruleThin} />
          <Text style={styles.foot}>{edition()}</Text>
          {demo && (
            <Pressable onPress={logOut}>
              <Text style={styles.demo}>
                Demo edition. <Text style={styles.demoLink}>Make an account</Text>
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIDEBAR, padding: 14, paddingRight: 0, backgroundColor: colors.page },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.ink,
    padding: 4,
    backgroundColor: colors.paper,
    ...lift,
  },
  inner: { flex: 1, borderWidth: 1, borderColor: colors.ink, paddingHorizontal: 16, paddingVertical: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { fontFamily: fonts.title, fontSize: 40, lineHeight: 40, color: colors.deep, letterSpacing: -0.5 },
  est: { fontFamily: fonts.italic, fontSize: 12, color: colors.persimmon, marginTop: 2 },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.ink,
    textTransform: 'uppercase',
  },
  schoolRow: { marginTop: 16, marginBottom: 6 },
  change: { fontFamily: fonts.italic, fontSize: 12, color: colors.persimmon, marginTop: 2 },
  ruleThick: { height: 3, backgroundColor: colors.ink },
  ruleThin: { height: 1, backgroundColor: colors.ink, marginTop: 3 },
  carte: {
    fontFamily: fonts.title,
    fontSize: 14,
    letterSpacing: 4,
    color: colors.persimmon,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  entry: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginHorizontal: -6,
    borderRadius: 4,
  },
  hover: { backgroundColor: colors.butter },
  numeral: { fontFamily: fonts.italic, fontSize: 13, color: colors.muted, width: 26, marginTop: 3 },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryLabel: { fontFamily: fonts.title, fontSize: 20, lineHeight: 22, color: colors.ink },
  leader: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dotted',
    borderColor: colors.muted,
    opacity: 0.5,
    marginTop: 8,
  },
  entrySub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 1 },
  marker: { position: 'absolute', left: -17, top: 12, bottom: 12, width: 4 },
  rate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.persimmon,
    ...lift,
  },
  rateHover: { backgroundColor: colors.blood, transform: [{ rotate: '-1.5deg' }, { scale: 1.02 }] },
  rateText: { fontFamily: fonts.bold, fontSize: 15, color: colors.paper, letterSpacing: 0.6 },
  foot: { fontFamily: fonts.italic, fontSize: 12, color: colors.muted, marginTop: 10 },
  demo: { fontFamily: fonts.body, fontSize: 12, color: colors.ink, marginTop: 8, lineHeight: 17 },
  demoLink: { fontFamily: fonts.bold, color: colors.deep, textDecorationLine: 'underline' },
});
