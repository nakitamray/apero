import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLayout } from '../lib/layout';
import { Heart, Pencil, Share2, Trash2 } from 'lucide-react-native';
import { colors, fonts } from '../theme';
import { timeAgo } from '../lib/time';
import { REASONS, reasonLabel } from '../lib/tags';
import { deleteReview, setLiked, updateReview } from '../lib/api';
import Photo from './Photo';
import FoodArt from './foodArt';
import { Button, Chip, Dotted, Field, MenuCard, Note, Paper, Plate, Rise, Stamp, Tag } from './ui';

// tiny alternating tilt so a list looks pasted down by hand
export const tiltFor = (i) => [-0.6, 0.4, -0.2, 0.7][i % 4];

// one line on a menu: rank, dish, where, and the score on its plate
export function DishRow({ dish, rank, score, subtitle, onPress, badge, index = 0, last }) {
  return (
    <Rise index={index}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.line, pressed && styles.linePressed]}>
        {rank != null && <Text style={styles.rank}>{rank}</Text>}
        <FoodArt dish={dish} width={46} rotate={index % 2 ? 5 : -5} />
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

// swipeable photos at the top of a review, like a post
function PhotoStrip({ photos, width }) {
  const [page, setPage] = React.useState(0);
  return (
    <View style={{ marginHorizontal: -6, marginTop: -6, marginBottom: 14 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ width, borderRadius: 4 }}
      >
        {photos.map((p, i) => (
          <Photo key={i} photo={p} style={{ width, height: width, borderRadius: 4 }} />
        ))}
      </ScrollView>
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
      )}
    </View>
  );
}

export const withLine = (people) =>
  people.length === 1
    ? people[0].name
    : `${people
        .slice(0, -1)
        .map((p) => p.name)
        .join(', ')} & ${people.at(-1).name}`;

export function ReviewCard({ review: given, uid, onLike, onPressDish, index = 0 }) {
  const { column: width } = useLayout();
  const photoWidth = width - 40 - 36 + 12;
  // your own reviews can be fixed or taken down right here
  const [edits, setEdits] = React.useState(null); // the words after an edit
  const [gone, setGone] = React.useState(false);
  const [mode, setMode] = React.useState(null); // null | 'edit' | 'delete'
  const [draft, setDraft] = React.useState({ note: '', tags: [] });
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState('');
  const review = edits ? { ...given, ...edits } : given;
  const mine = review.userId === uid;
  const liked = review.likedBy?.includes(uid);
  const likes = review.likedBy?.length || 0;

  const share = () =>
    Share.share({
      message: `${review.dishName} at ${review.placeName}: ${review.score?.toFixed(1)}/10 on apero${review.note ? ` — "${review.note}"` : ''}`,
    });

  const startEdit = () => {
    setDraft({ note: review.note || '', tags: review.tags || [] });
    setProblem('');
    setMode('edit');
  };
  const toggleTag = (id) =>
    setDraft((d) => ({ ...d, tags: d.tags.includes(id) ? d.tags.filter((t) => t !== id) : [...d.tags, id] }));
  const saveEdit = async () => {
    setBusy(true);
    try {
      await updateReview(review.id, draft);
      setEdits({ note: draft.note.trim(), tags: draft.tags });
      setMode(null);
    } catch {
      setProblem("Couldn't save that. Try again.");
    }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try {
      await deleteReview(review, uid);
      setGone(true);
    } catch {
      setProblem("Couldn't delete it. Try again.");
      setBusy(false);
    }
  };

  if (gone) return null;

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
          {review.with?.length ? <Text style={styles.withText}> with {withLine(review.with)}</Text> : null}
        </Text>
        <Text style={styles.when}>{timeAgo(review.createdAt)}</Text>
      </View>

      {review.photos?.length > 0 && <PhotoStrip photos={review.photos} width={photoWidth} />}

      <Pressable onPress={onPressDish} style={styles.reviewBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewDish}>{review.dishName}</Text>
          <Text style={styles.sub}>{review.placeName}</Text>
          <Stamp verdict={review.verdict} style={{ marginTop: 10 }} />
        </View>
        <Plate score={review.score} size={62} />
      </Pressable>

      {mode === 'edit' ? (
        <View style={{ marginTop: 14 }}>
          <Field
            label="What you said"
            value={draft.note}
            onChangeText={(note) => setDraft((d) => ({ ...d, note }))}
            multiline
          />
          <View style={[styles.tags, { marginTop: 0, marginBottom: 14 }]}>
            {REASONS.map((r) => (
              <Chip key={r.id} label={r.label} active={draft.tags.includes(r.id)} onPress={() => toggleTag(r.id)} />
            ))}
          </View>
          <Text style={styles.small}>To change the score, rate the dish again.</Text>
          <View style={styles.editButtons}>
            <Button label="Save" onPress={saveEdit} loading={busy} style={{ flex: 1 }} />
            <Button label="Cancel" kind="light" onPress={() => setMode(null)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : review.note ? (
        <Note style={{ marginTop: 14 }}>“{review.note}”</Note>
      ) : null}

      {mode !== 'edit' && review.tags?.length > 0 && (
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
        {mine && !mode && (
          <>
            <View style={{ flex: 1 }} />
            <Pressable style={styles.action} onPress={startEdit} hitSlop={8} accessibilityLabel="Edit review">
              <Pencil size={16} color={colors.cobalt} strokeWidth={1.6} />
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.action}
              onPress={() => setMode('delete')}
              hitSlop={8}
              accessibilityLabel="Delete review"
            >
              <Trash2 size={16} color={colors.blood} strokeWidth={1.6} />
              <Text style={[styles.actionText, { color: colors.blood }]}>Delete</Text>
            </Pressable>
          </>
        )}
      </View>
      {mode === 'delete' && (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>
            Delete this review? If it's your only one for this dish, your rating comes off its score and your list.
          </Text>
          <View style={styles.editButtons}>
            <Button label="Delete" kind="citrus" onPress={remove} loading={busy} style={{ flex: 1 }} />
            <Button label="Keep it" kind="light" onPress={() => setMode(null)} style={{ flex: 1 }} />
          </View>
        </View>
      )}
      {problem ? <Text style={styles.problem}>{problem}</Text> : null}
    </Paper>
  );
}

const styles = StyleSheet.create({
  rowOuter: { marginHorizontal: 20, marginBottom: 12 },
  withText: { fontFamily: fonts.body, color: colors.muted },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.hairline },
  dotOn: { backgroundColor: colors.deep },
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
  small: { fontFamily: fonts.italic, fontSize: 13, color: colors.muted, marginBottom: 10 },
  editButtons: { flexDirection: 'row', gap: 10 },
  confirm: { marginTop: 14, padding: 12, borderRadius: 6, backgroundColor: colors.peach },
  confirmText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.ink, marginBottom: 12 },
  problem: { fontFamily: fonts.medium, fontSize: 13, color: colors.blood, marginTop: 10 },
  actionText: { fontFamily: fonts.body, fontSize: 14, color: colors.cobalt },
});
