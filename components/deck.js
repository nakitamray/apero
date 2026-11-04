import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts, lift, tints } from '../theme';
import { Plate, Tag } from './ui';
import { Sticker } from './art';

const ART = {
  sweet: 'lemonSlice',
  spicy: 'bloodOrange',
  protein: 'sardine',
  healthy: 'lemon',
  cozy: 'vase',
  value: 'orangeSlice',
};
export const artForDish = (dish) => ART[dish.tags?.find((t) => ART[t])] || 'goldfish';

// A swipeable deck of menu cards. The card in the middle sits up straight;
// the ones either side tip back and shrink a little as they slide away.
export function MenuDeck({ dishes, onPress, badgeFor }) {
  const { width } = useWindowDimensions();
  const card = Math.min(320, width * 0.74);
  const gap = 14;
  const step = card + gap;
  const x = useRef(new Animated.Value(0)).current;

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={step}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: (width - card) / 2, paddingVertical: 18 }}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })}
      scrollEventThrottle={16}
    >
      {dishes.map((dish, i) => {
        const input = [(i - 1) * step, i * step, (i + 1) * step];
        const motion = {
          transform: [
            { scale: x.interpolate({ inputRange: input, outputRange: [0.88, 1, 0.88], extrapolate: 'clamp' }) },
            {
              rotate: x.interpolate({
                inputRange: input,
                outputRange: ['-5deg', '0deg', '5deg'],
                extrapolate: 'clamp',
              }),
            },
            { translateY: x.interpolate({ inputRange: input, outputRange: [14, 0, 14], extrapolate: 'clamp' }) },
          ],
        };
        const art = artForDish(dish);
        return (
          <Animated.View
            key={dish.id}
            style={[{ width: card, marginRight: i === dishes.length - 1 ? 0 : gap }, motion]}
          >
            <Pressable
              onPress={() => onPress(dish)}
              style={[styles.card, { backgroundColor: tints[i % tints.length] }]}
            >
              <View style={styles.inner}>
                <View style={styles.top}>
                  <Text style={styles.no}>no.</Text>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={{ flex: 1 }} />
                  <Plate score={dish.score} size={70} />
                </View>
                <View style={styles.art}>
                  <Sticker name={art} width={art === 'sardine' ? 230 : 130} rotate={i % 2 ? 8 : -8} />
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {dish.name}
                </Text>
                <Text style={styles.place} numberOfLines={1}>
                  {dish.placeName}
                  {dish.ratingCount ? `  /  ${dish.ratingCount} rating${dish.ratingCount === 1 ? '' : 's'}` : ''}
                </Text>
                {badgeFor?.(dish) && (
                  <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                    <Tag color={colors.persimmon}>{badgeFor(dish)}</Tag>
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 6, padding: 6, borderWidth: 1.5, borderColor: colors.ink, ...lift },
  inner: { borderWidth: 1, borderColor: colors.ink, borderRadius: 3, padding: 16, minHeight: 330 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  no: { fontFamily: fonts.italic, fontSize: 16, color: colors.ink, marginTop: 12 },
  rank: { fontFamily: fonts.title, fontSize: 56, lineHeight: 58, color: colors.persimmon },
  art: { height: 120, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  name: { fontFamily: fonts.title, fontSize: 28, lineHeight: 29, color: colors.deep, marginTop: 4 },
  place: { fontFamily: fonts.medium, fontSize: 13, color: colors.teal, marginTop: 6 },
});
