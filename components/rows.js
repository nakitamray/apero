import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Heart, Share2 } from 'lucide-react-native';
import { colors, fonts } from '../theme';
import { timeAgo } from '../lib/time';
import { reasonLabel } from '../lib/tags';
import { setLiked } from '../lib/api';
import { Dotted, MenuCard, Note, Paper, Plate, Rise, Stamp, Tag } from './ui';

// tiny alternating tilt so a list looks pasted down by hand
export const tiltFor = (i) => [-0.6, 0.4, -0.2, 0.7][i % 4];

// one line on a menu: rank, dish, where, and the score on its plate
export function DishRow({ dish, rank, score, subtitle, onPress, badge, index = 0, last }) {
  return (
    <Rise index={index}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.line, pressed && styles.linePressed]}>
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
        <Plate score={score !== undefined ? score : dish.ratingCount ? dish.score : null} size={50} />
      </Pressable>
      {!last && <Dotted />}
    </Rise>
  );
}

// a run of dishes printed on one menu card
export function DishMenu({ dishes, title, rankFrom, scoreFor, subtitleFor, badgeFor, onPress, outer }) {
  return (
    <MenuCard title={title} outer={[styles.menuOuter, outer]}>
      {dishes.map((dish, i) => (
        <DishRow
          key={dish.id || dish.dishId}
          dish={dish}
          index={i}
          last={i === dishes.length - 1}
          rank={rankFrom != null ? rankFrom + i : undefined}
          score={scoreFor ? scoreFor(dish) : undefined}
          subtitle={subtitleFor ? subtitleFor(dish) : undefined}
          badge={badgeFor ? badgeFor(dish) : null}
          onPress={() => onPress(dish)}
        />
      ))}
    </MenuCard>
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

export function ReviewCard({ review, uid, onLike, onPressDish, index = 0 }) {
  const liked = review.likedBy?.includes(uid);
  const likes = review.likedBy?.length || 0;

  const share = () =>
    Share.share({
      message: `${review.dishName} at ${review.placeName}: ${review.score?.toFixed(1)}/10 on apero${review.note ? ` — "${review.note}"` : ''}`,
    });

  return (
    <Paper
      index={index + 1}
      tilt={tiltFor(index + 1)}
      outer={[styles.rowOuter, { marginBottom: 18 }]}
      style={{ padding: 18 }}
    >
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
          <Text style={styles.reviewDish}>{review.dishName}</Text>
          <Text style={styles.sub}>{review.placeName}</Text>
          <Stamp verdict={review.verdict} style={{ marginTop: 10 }} />
        </View>
        <Plate score={review.score} size={62} />
      </Pressable>

      {review.note ? <Note style={{ marginTop: 14 }}>“{review.note}”</Note> : null}

      {review.tags?.length > 0 && (
        <View style={styles.tags}>
          {review.tags.map((t) => (
            <Tag key={t}>{reasonLabel(t)}</Tag>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onLike(review, !liked)} hitSlop={8}>
          <Heart
            size={18}
            color={liked ? colors.orange : colors.cobalt}
            fill={liked ? colors.orange : 'none'}
            strokeWidth={1.6}
          />
          <Text style={styles.actionText}>{likes}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={share} hitSlop={8}>
          <Share2 size={18} color={colors.cobalt} strokeWidth={1.6} />
        </Pressable>
      </View>
    </Paper>
  );
}

const styles = StyleSheet.create({
  rowOuter: { marginHorizontal: 20, marginBottom: 12 },
  menuOuter: { marginHorizontal: 20 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  linePressed: { backgroundColor: 'rgba(255, 212, 59, 0.25)' },
  rank: { fontFamily: fonts.title, fontSize: 26, color: colors.persimmon, minWidth: 26, textAlign: 'center' },
  dishName: { fontFamily: fonts.title, fontSize: 17, color: colors.ink, lineHeight: 20, letterSpacing: 0.3 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.title, fontSize: 18, color: colors.paper },
  who: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  when: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  reviewBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewDish: { fontFamily: fonts.title, fontSize: 28, lineHeight: 30, color: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  actions: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: fonts.body, fontSize: 14, color: colors.cobalt },
});
