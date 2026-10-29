import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Sardine, Spritz } from './art';

const STRIPES = 7;

// stripes drop in like an awning unrolling, the glass + sardines pop up, then it all fades out
export default function Splash({ onDone }) {
  const drop = useRef([...Array(STRIPES)].map(() => new Animated.Value(0))).current;
  const pop = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.stagger(
        70,
        drop.map((v) => Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })),
      ),
      Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  const rise = pop.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, { opacity: fade }]} pointerEvents="none">
      <View style={styles.stripes}>
        {drop.map((v, i) => (
          <Animated.View
            key={i}
            style={[
              styles.stripe,
              { backgroundColor: i % 2 ? colors.peach : colors.aperol },
              { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-900, 0] }) }] },
            ]}
          />
        ))}
      </View>
      <Animated.View style={[styles.center, { opacity: pop, transform: [{ translateY: rise }] }]}>
        <Sardine width={150} />
        <Spritz size={110} style={{ marginVertical: 10 }} />
        <Sardine width={150} flip />
        <Animated.Text style={styles.word}>apero</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.paper, zIndex: 10 },
  stripes: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  stripe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  word: {
    fontFamily: fonts.displayItalic,
    fontSize: 64,
    color: colors.ink,
    marginTop: 18,
    backgroundColor: colors.paper,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    borderRadius: 14,
  },
});
