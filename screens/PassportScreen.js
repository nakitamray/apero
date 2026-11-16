// Your food passport: a stamp for every place you've rated something at, a page per campus
// with the places you haven't been to yet left blank, and badges to collect.
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { userReviews } from '../lib/api';
import { badgesFrom, campusesIn, stampsFrom } from '../lib/passport';
import { useLayout } from '../lib/layout';
import { Chip, Hint, Loading, Masthead, Screen, SectionHeader } from '../components/ui';
import { BadgeSeal, PlaceStamp } from '../components/stamp';
import { Sticker } from '../components/art';
import { colors, fonts, lift } from '../theme';

export default function PassportScreen({ navigation }) {
  const { user, name, campus } = useSession();
  const { column } = useLayout();
  const [reviews, setReviews] = useState(null);
  const [page, setPage] = useState(campus.id);

  useFocusEffect(
    useCallback(() => {
      userReviews(user.uid)
        .then(setReviews)
        .catch(() => setReviews([]));
    }, [user.uid]),
  );

  if (!reviews) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const stamps = stampsFrom(reviews);
  const badges = badgesFrom(reviews, stamps, campus);
  const earned = badges.filter((b) => b.earned).length;
  const pages = [campus, ...campusesIn(stamps).filter((c) => c.id !== campus.id)];
  const shown = pages.find((c) => c.id === page) || campus;
  const here = shown.places;
  const stampedHere = here.filter((p) => stamps[p.id]);
  // stamped places first (oldest stamp first, like a real passport fills up), then the blanks
  const order = [
    ...stampedHere.sort((a, b) => (stamps[a.id].first || 0) - (stamps[b.id].first || 0)),
    ...here.filter((p) => !stamps[p.id]),
  ];

  const perRow = Math.max(2, Math.floor((column - 44) / 190));
  const slot = Math.floor((column - 44) / perRow);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Masthead kicker={`${name}'s`} title="Food" accent="Passport" sticker="stamp" stickerSize={96} />

        <View style={styles.cover}>
          <View style={styles.coverInner}>
            <View style={styles.coverTop}>
              <Sticker name="spritz" width={52} rotate={-10} />
              <View style={{ flex: 1 }}>
                <Text style={styles.coverKicker}>Passport · Passeport · Pasaporte</Text>
                <Text style={styles.coverTitle}>apero</Text>
                <Text style={styles.coverName}>
                  Holder: {name} · Issued at {campus.name}
                </Text>
              </View>
            </View>
            <View style={styles.coverStats}>
              <Stat value={Object.keys(stamps).length} label="stamps" />
              <Stat value={`${stampedHere.length}/${here.length}`} label={`at ${shown.short}`} />
              <Stat value={campusesIn(stamps).length} label="campuses" />
              <Stat value={`${earned}/${badges.length}`} label="badges" />
            </View>
          </View>
        </View>

        <SectionHeader label="Stamps" title={`Page ${pages.indexOf(shown) + 1} · ${shown.short}`} />
        {pages.length > 1 && (
          <View style={styles.chips}>
            {pages.map((c) => (
              <Chip key={c.id} label={c.short} active={c.id === shown.id} onPress={() => setPage(c.id)} />
            ))}
          </View>
        )}
        {stampedHere.length === 0 && (
          <Hint style={styles.hint} arrow="↓">
            rate anything at one of these and its stamp goes on the page
          </Hint>
        )}
        <View style={styles.page}>
          {order.map((p) => {
            const s = stamps[p.id];
            return (
              <Pressable
                key={p.id}
                onPress={() => navigation.navigate('Place', { placeId: p.id })}
                style={({ hovered }) => [styles.slot, { width: slot }, hovered && { transform: [{ scale: 1.04 }] }]}
              >
                <PlaceStamp
                  place={p}
                  date={s?.first}
                  visits={s?.visits}
                  empty={!s}
                  size={Math.min(150, slot - 30)}
                  campusShort={shown.short}
                />
              </Pressable>
            );
          })}
        </View>

        <SectionHeader label="Collect them all" title="Badges" />
        <View style={styles.badges}>
          {badges.map((b) => (
            <BadgeSeal key={b.id} badge={b} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { marginHorizontal: 20, marginTop: 14, backgroundColor: colors.deep, borderRadius: 10, padding: 6, ...lift },
  coverInner: { borderWidth: 1.5, borderColor: colors.lemon, borderRadius: 6, padding: 18 },
  coverTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  coverKicker: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.lemon,
    textTransform: 'uppercase',
  },
  coverTitle: { fontFamily: fonts.title, fontSize: 44, lineHeight: 46, color: colors.lemon },
  coverName: { fontFamily: fonts.italic, fontSize: 13, color: colors.paper, opacity: 0.9 },
  coverStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 212, 59, 0.5)',
    paddingTop: 14,
  },
  stat: { minWidth: '25%', flexGrow: 1, paddingVertical: 4 },
  statValue: { fontFamily: fonts.title, fontSize: 30, lineHeight: 34, color: colors.paper },
  statLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.lemon,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, marginBottom: 12 },
  hint: { paddingHorizontal: 22, marginBottom: 8 },
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 6,
    ...lift,
  },
  slot: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: 14 },
});
