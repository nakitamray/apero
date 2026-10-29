import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Heart, Share2 } from 'lucide-react-native';
import { colors, fonts } from '../theme';
import { timeAgo } from '../lib/time';
import { reasonLabel } from '../lib/tags';
import { setLiked } from '../lib/api';
import { Card, ScoreBadge, Stamp, Tag } from './ui';

export function DishRow({ dish, rank, score, subtitle, onPress, badge }) {
  return (
    <Card onPress={onPress} outer={{ marginHorizontal: 20, marginBottom: 12 }} style={styles.dishRow}>
      {rank != null && <Text style={styles.rank}>{rank}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={styles.dishName} numberOfLines={2}>
          {dish.name || dish.dishName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {subtitle ?? dish.placeName}
        </Text>
        {badge}
      </View>
      <ScoreBadge score={score !== undefined ? score : dish.ratingCount ? dish.score : null} size={48} />
    </Card>
  );
}

// optimistic like toggle for any screen holding a list of reviews in state
export const makeLike = (setRows, uid) => async (review, liked) => {
  setRows((rows) =>
    rows.map((r) => {
      if (r.id !== review.id) return r;
      const others = (r.likedBy || []).filter((id) => id !== uid);
      return { ...r, likedBy: liked ? [...others, uid] : others };
    }),
  );
  await setLiked(review.id, uid, liked);
};

export function ReviewCard({ review, uid, onLike, onPressDish }) {
  const liked = review.likedBy?.includes(uid);
  const likes = review.likedBy?.length || 0;

  const share = () =>
    Share.share({
      message: `${review.dishName} at ${review.placeName}: ${review.score?.toFixed(1)}/10 on apero${review.note ? ` — "${review.note}"` : ''}`,
    });

  return (
    <Card outer={{ marginHorizontal: 20, marginBottom: 14 }}>
      <View style={styles.reviewTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(review.userName || '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.who} numberOfLines={1}>
          {review.userName || 'someone'}
        </Text>
        <Text style={styles.when}>{timeAgo(review.createdAt)}</Text>
      </View>

      <Pressable onPress={onPressDish} style={styles.reviewBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dishName}>{review.dishName}</Text>
          <Text style={styles.sub}>{review.placeName}</Text>
          <Stamp verdict={review.verdict} style={{ marginTop: 8 }} />
        </View>
        <ScoreBadge score={review.score} size={50} />
      </Pressable>

      {review.note ? <Text style={styles.note}>“{review.note}”</Text> : null}

      {review.tags?.length > 0 && (
        <View style={styles.tags}>
          {review.tags.map((t) => (
            <Tag key={t} color={colors.cobalt}>
              {reasonLabel(t)}
            </Tag>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onLike(review, !liked)} hitSlop={8}>
          <Heart size={18} color={liked ? colors.blood : colors.ink} fill={liked ? colors.blood : 'none'} />
          <Text style={styles.actionText}>{likes}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={share} hitSlop={8}>
          <Share2 size={18} color={colors.ink} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  dishRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { fontFamily: fonts.displayItalic, fontSize: 26, color: colors.aperol, minWidth: 30, textAlign: 'center' },
  dishName: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, lineHeight: 21 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sky,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  who: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  when: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  reviewBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  note: { fontFamily: fonts.displayItalic, fontSize: 16, color: colors.ink, marginTop: 12, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: colors.sand,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink },
});
