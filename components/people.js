import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Paper } from './ui';

const AVATAR_COLORS = [colors.aqua, colors.persimmon, colors.cobalt, '#C9A227', colors.teal];

export function Avatar({ user, size = 40 }) {
  const name = user?.name || '?';
  const color = AVATAR_COLORS[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.56, lineHeight: size * 0.66 }]}>
        {name[0].toUpperCase()}
      </Text>
    </View>
  );
}

// match % on a little lemon circle; dashes until there's enough overlap to say
export function MatchBadge({ percent, size = 52 }) {
  return (
    <View style={[styles.match, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.matchNumber, { fontSize: size * 0.36 }]}>{percent == null ? '–' : percent}</Text>
      <Text style={styles.matchLabel}>{percent == null ? 'match' : '% match'}</Text>
    </View>
  );
}

export function PersonRow({ user, subtitle, right, onPress, index = 0 }) {
  return (
    <Paper onPress={onPress} index={index} outer={styles.outer} style={styles.row}>
      <Avatar user={user} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.sub}>{subtitle ?? `@${user.handle}`}</Text>
      </View>
      {right}
    </Paper>
  );
}

export function FollowButton({ following, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.follow, following && styles.following]} hitSlop={6}>
      <Text style={[styles.followText, following && { color: colors.deep }]}>{following ? 'Friends' : 'Add'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.paper },
  avatarText: { fontFamily: fonts.display, color: colors.paper },
  match: { backgroundColor: colors.lemon, alignItems: 'center', justifyContent: 'center' },
  matchNumber: { fontFamily: fonts.display, color: colors.deep, lineHeight: 26 },
  matchLabel: {
    fontFamily: fonts.medium,
    fontSize: 7,
    letterSpacing: 0.8,
    color: colors.deep,
    textTransform: 'uppercase',
  },
  outer: { marginHorizontal: 20, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  name: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 1 },
  follow: { backgroundColor: colors.persimmon, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  following: { backgroundColor: colors.lagoon },
  followText: { fontFamily: fonts.medium, fontSize: 13, color: colors.paper },
});
