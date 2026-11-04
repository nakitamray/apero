import React from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../theme';
import { Plate, Rise } from './ui';
import { photoSource } from './rows';

// three-across photo grid, each tile with its score on a little plate
export function PhotoGrid({ reviews, onPress, gutter = 20, columns = 3 }) {
  const { width } = useWindowDimensions();
  const gap = 6;
  const tile = Math.floor((width - gutter * 2 - gap * (columns - 1)) / columns);
  const posts = reviews.filter((r) => r.photos?.length);
  return (
    <View style={[styles.grid, { paddingHorizontal: gutter, gap }]}>
      {posts.map((r, i) => (
        <Rise key={r.id} index={i}>
          <Pressable onPress={() => onPress(r)} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
            <Image source={photoSource(r.photos[0])} style={[styles.tile, { width: tile, height: tile }]} />
            <View style={styles.badge}>
              <Plate score={r.score} size={34} />
            </View>
          </Pressable>
        </Rise>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { borderRadius: 4, borderWidth: 1, borderColor: colors.hairline },
  badge: { position: 'absolute', right: 4, bottom: 4 },
});
