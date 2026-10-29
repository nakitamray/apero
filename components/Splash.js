import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts } from '../theme';
import { Sticker, WAVES } from './art';

// cut-outs drop onto the blue like someone's pasting a collage, then it fades away
const PIECES = [
  { name: 'sardine', size: 230, rotate: -14, top: '16%', left: -40, from: { x: -260, y: 0 } },
  { name: 'sardine', size: 200, rotate: 172, top: '68%', right: -40, from: { x: 260, y: 0 } },
  { name: 'lemon', size: 120, rotate: 12, top: '8%', right: 20, from: { x: 0, y: -300 } },
  { name: 'bloodOrange', size: 104, rotate: -8, bottom: '10%', left: 24, from: { x: -200, y: 200 } },
  { name: 'tile', size: 88, rotate: 8, top: '30%', right: 34, from: { x: 220, y: 0 } },
  { name: 'lemonSlice', size: 70, rotate: 0, bottom: '27%', right: 70, from: { x: 0, y: 260 } },
];

export default function Splash({ onDone }) {
  const land = useRef(PIECES.map(() => new Animated.Value(0))).current;
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    Animated.sequence([
      Animated.stagger(
        90,
        land.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.timing(word, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 10 }]} pointerEvents="none">
      <View style={styles.bg}>
        <Image source={WAVES.aqua} style={{ position: 'absolute', width, height }} resizeMode="cover" />
        {PIECES.map(({ name, size, rotate, from, ...pos }, i) => (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              pos,
              {
                opacity: land[i],
                transform: [
                  { translateX: land[i].interpolate({ inputRange: [0, 1], outputRange: [from.x, 0] }) },
                  { translateY: land[i].interpolate({ inputRange: [0, 1], outputRange: [from.y, 0] }) },
                ],
              },
            ]}
          >
            <Sticker name={name} width={size} rotate={rotate} />
          </Animated.View>
        ))}
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.label,
              {
                opacity: word,
                transform: [{ scale: word.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
              },
            ]}
          >
            <Text style={styles.word}>apero</Text>
            <Text style={styles.sub}>rate what you ate</Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.aqua },
  piece: { position: 'absolute' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: {
    backgroundColor: colors.paper,
    paddingHorizontal: 34,
    paddingTop: 10,
    paddingBottom: 14,
    borderRadius: 4,
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  word: { fontFamily: fonts.display, fontSize: 84, lineHeight: 92, color: colors.cobalt },
  sub: { fontFamily: fonts.note, fontSize: 20, color: colors.orange, marginTop: -4 },
});
