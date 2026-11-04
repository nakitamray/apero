import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThumbsUp } from 'lucide-react-native';
import { colors, fonts } from '../theme';
import { dealIsOn, dealWhen } from '../lib/deals';
import { Paper } from './ui';

export function DealCard({ deal, uid, onVote, onPress, index = 0, compact }) {
  const voted = deal.votes?.includes(uid);
  const on = dealIsOn(deal);
  return (
    <Paper
      onPress={onPress}
      index={index}
      tilt={index % 2 ? 0.6 : -0.5}
      outer={compact ? styles.compactOuter : styles.outer}
      style={styles.card}
    >
      <ImageBackground source={require('../assets/art/burst.png')} style={styles.burst}>
        <Text style={styles.burstText}>{on ? 'today' : 'deal'}</Text>
      </ImageBackground>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {deal.title}
        </Text>
        <Text style={styles.place} numberOfLines={1}>
          {deal.placeName}
        </Text>
        <Text style={styles.when}>
          {dealWhen(deal)}
          {deal.details ? ` · ${deal.details}` : ''}
        </Text>
        {onVote && (
          <Pressable style={styles.vote} onPress={() => onVote(deal, !voted)} hitSlop={8}>
            <ThumbsUp
              size={15}
              color={voted ? colors.persimmon : colors.muted}
              fill={voted ? colors.persimmon : 'none'}
              strokeWidth={1.6}
            />
            <Text style={[styles.voteText, voted && { color: colors.persimmon }]}>
              Still good · {deal.votes?.length || 0}
            </Text>
          </Pressable>
        )}
      </View>
    </Paper>
  );
}

// optimistic "still good?" toggle
export const makeDealVote = (setDeals, uid, send) => async (deal, on) => {
  setDeals((rows) =>
    rows.map((d) => {
      if (d.id !== deal.id) return d;
      const others = (d.votes || []).filter((id) => id !== uid);
      return { ...d, votes: on ? [...others, uid] : others };
    }),
  );
  await send(deal.id, uid, on);
};

const styles = StyleSheet.create({
  outer: { marginHorizontal: 20, marginBottom: 12 },
  compactOuter: { width: 270, marginRight: 14, marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  burst: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  burstText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.persimmon,
  },
  title: { fontFamily: fonts.title, fontSize: 24, lineHeight: 26, color: colors.ink },
  place: { fontFamily: fonts.medium, fontSize: 13, color: colors.teal, marginTop: 2 },
  when: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  vote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  voteText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
});
