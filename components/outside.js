// "Elsewhere online": a place's Google Maps and Yelp ratings, plus a few of their reviews.
// Each source links back to its own page, and every review keeps its author and where it came from.
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Star } from 'lucide-react-native';
import { Dotted, Note, Paper } from './ui';
import { colors, fonts } from '../theme';

const SOURCES = [
  { key: 'google', name: 'Google Maps' },
  { key: 'yelp', name: 'Yelp' },
];

function Stars({ rating, size = 13 }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.4}
          color={colors.orange}
          fill={rating >= n - 0.25 ? colors.orange : 'none'}
        />
      ))}
    </View>
  );
}

const open = (url) => url && Linking.openURL(url);

export function OutsideReviews({ data }) {
  const sources = SOURCES.filter((s) => data[s.key]);
  const quotes = sources.flatMap((s) => data[s.key].reviews.slice(0, 2).map((r) => ({ ...r, source: s })));

  return (
    <Paper index={1} tilt={0.3} outer={styles.outer} style={{ padding: 18 }}>
      {sources.map((s, i) => {
        const d = data[s.key];
        return (
          <Pressable key={s.key} onPress={() => open(d.url)} style={[styles.source, i > 0 && styles.sourceNext]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sourceName}>{s.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>{d.rating.toFixed(1)}</Text>
                <Stars rating={d.rating} />
                <Text style={styles.count}>{d.count.toLocaleString()} reviews</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.cobalt} />
          </Pressable>
        );
      })}

      {quotes.map((q, i) => (
        <View key={`${q.source.key}-${i}`}>
          <Dotted style={{ marginVertical: 12 }} />
          <Note numberOfLines={5}>“{q.text.trim()}”</Note>
          <Pressable onPress={() => open(q.url || q.authorUrl || data[q.source.key].url)} style={styles.byline}>
            <Stars rating={q.rating} size={11} />
            <Text style={styles.by} numberOfLines={1}>
              {q.author}
              {q.when ? `, ${q.when}` : ''} on {q.source.name}
            </Text>
          </Pressable>
        </View>
      ))}
    </Paper>
  );
}

const styles = StyleSheet.create({
  outer: { marginHorizontal: 20, marginBottom: 18 },
  source: { flexDirection: 'row', alignItems: 'center' },
  sourceNext: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline },
  sourceName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.teal,
    textTransform: 'uppercase',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rating: { fontFamily: fonts.title, fontSize: 26, color: colors.ink },
  stars: { flexDirection: 'row', gap: 1 },
  count: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  by: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
});
