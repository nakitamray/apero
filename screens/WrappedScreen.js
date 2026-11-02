import React, { useEffect, useState } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useSession } from '../context/Session';
import { myRankings, userReviews, usersByIds } from '../lib/api';
import { buildWrapped } from '../lib/wrapped';
import { toTen } from '../lib/score';
import { BACKGROUNDS, Sticker, WAVES } from '../components/art';
import { Button, Loading, Plate } from '../components/ui';
import { MatchBadge } from '../components/people';
import { colors, fonts } from '../theme';

const LOOKS = [
  { bg: BACKGROUNDS.orange, art: 'goldfish' },
  { bg: BACKGROUNDS.cobalt, art: 'lemon' },
  { bg: WAVES.aqua, art: 'sardine' },
  { bg: BACKGROUNDS.orange, art: 'shell' },
  { bg: BACKGROUNDS.cobalt, art: 'bloodOrange' },
  { bg: WAVES.orange, art: 'stamp' },
];

function cardsFor(w, campus) {
  if (!w.total) {
    return [
      {
        label: 'Campus Wrapped',
        big: 'Not yet',
        sub: `Rate a few dishes at ${campus.short} this semester and your Wrapped fills in.`,
      },
    ];
  }
  const cards = [
    { label: 'Campus Wrapped', big: w.semester, sub: `Your semester in food at ${campus.short}` },
    {
      label: 'This semester you rated',
      big: `${w.total} dishes`,
      sub: `at ${w.places} different place${w.places === 1 ? '' : 's'}`,
    },
  ];
  if (w.topDish)
    cards.push({
      label: 'Your number one',
      big: w.topDish.dishName,
      sub: w.topDish.placeName,
      plate: toTen(w.topDish.elo),
    });
  if (w.topPlace)
    cards.push({
      label: 'Your spot',
      big: w.topPlace.place.name,
      sub: `${w.topPlace.count} review${w.topPlace.count === 1 ? '' : 's'} there`,
    });
  cards.push({ label: "You're", big: w.persona[0], sub: w.persona[1] });
  if (w.topReason)
    cards.push({ label: "You're in it for", big: w.topReason.toLowerCase(), sub: 'Your most picked reason' });
  if (w.twin)
    cards.push({
      label: 'Your taste twin',
      big: w.twin.friend.name,
      sub: 'You two agree on almost everything',
      match: w.twin.match,
    });
  if (w.streak > 1) cards.push({ label: 'Longest streak', big: `${w.streak} days`, sub: 'in a row with a review' });
  cards.push({
    label: 'That’s a wrap',
    big: 'See you next semester',
    sub: 'Keep rating and it keeps growing',
    outro: true,
  });
  return cards;
}

export default function WrappedScreen({ navigation }) {
  const { user, campus, following } = useSession();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [wrapped, setWrapped] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      const [reviews, rankings, people] = await Promise.all([
        userReviews(user.uid),
        myRankings(user.uid),
        usersByIds(following),
      ]);
      const friends = await Promise.all(people.map(async (p) => ({ ...p, rankings: await myRankings(p.id) })));
      setWrapped(buildWrapped({ reviews, rankings, friends }));
    })();
  }, [user.uid]);

  if (!wrapped) return <Loading />;

  const cards = cardsFor(wrapped, campus);
  const card = cards[page];
  const look = LOOKS[page % LOOKS.length];
  const go = (dir) => setPage((p) => Math.max(0, Math.min(cards.length - 1, p + dir)));

  const share = () =>
    Share.share({
      message: `My ${wrapped.semester} on apero: ${wrapped.total} dishes, ${wrapped.places} places. I'm ${wrapped.persona[0]}${
        wrapped.topDish ? ` and my #1 was ${wrapped.topDish.dishName}` : ''
      }.`,
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.deep }}>
      <Image source={look.bg} style={{ position: 'absolute', width, height }} resizeMode="cover" />

      <View style={[styles.bars, { top: insets.top + 10 }]}>
        {cards.map((_, i) => (
          <View key={i} style={[styles.bar, i <= page && styles.barOn]} />
        ))}
      </View>
      <Pressable style={[styles.close, { top: insets.top + 24 }]} onPress={() => navigation.goBack()} hitSlop={12}>
        <X color={colors.paper} size={26} />
      </Pressable>

      <View style={styles.center}>
        <Sticker
          name={look.art}
          width={look.art === 'sardine' ? 220 : 130}
          rotate={page % 2 ? 10 : -8}
          style={{ marginBottom: 18 }}
        />
        <View style={[styles.label, { transform: [{ rotate: page % 2 ? '2deg' : '-2deg' }] }]}>
          <Text style={styles.kicker}>{card.label}</Text>
          <Text style={styles.big}>{card.big}</Text>
          {card.plate != null && (
            <View style={{ marginTop: 10 }}>
              <Plate score={card.plate} size={86} />
            </View>
          )}
          {card.match != null && (
            <View style={{ marginTop: 10 }}>
              <MatchBadge percent={card.match} size={84} />
            </View>
          )}
          <Text style={styles.sub}>{card.sub}</Text>
        </View>
        {card.outro && (
          <View style={styles.outroButtons}>
            <Button label="Share my Wrapped" kind="citrus" onPress={share} />
            <Button label="Done" kind="light" onPress={() => navigation.goBack()} />
          </View>
        )}
      </View>

      {/* tap the left or right side to move, like stories */}
      {!card.outro && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={[styles.taps, { top: insets.top + 60 }]}>
            <Pressable style={{ flex: 1 }} onPress={() => go(-1)} />
            <Pressable style={{ flex: 2 }} onPress={() => go(1)} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 4, zIndex: 3 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  barOn: { backgroundColor: colors.paper },
  close: { position: 'absolute', right: 18, zIndex: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  label: {
    backgroundColor: colors.paper,
    borderRadius: 6,
    paddingHorizontal: 26,
    paddingVertical: 22,
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.teal,
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 52,
    lineHeight: 56,
    color: colors.deep,
    textAlign: 'center',
    marginTop: 6,
  },
  sub: { fontFamily: fonts.note, fontSize: 21, color: colors.ink, textAlign: 'center', marginTop: 10, lineHeight: 26 },
  outroButtons: { alignSelf: 'stretch', gap: 12, marginTop: 24 },
  taps: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row' },
});
