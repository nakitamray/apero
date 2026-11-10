// The pin drawn over each place on the map: a colored dot with the place's score (or a fork and knife
// if nobody has rated it yet), and its name beside it once you're zoomed in or it's the one you tapped.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Utensils } from 'lucide-react-native';
import { colors, fonts } from '../theme';

export const PIN_TONES = {
  hall: { dot: colors.teal, text: '#0B6E80' },
  spot: { dot: colors.orange, text: '#C9560A' },
  date: { dot: colors.blood, text: '#B5371A' },
};

export function MapPin({ pin, selected, showName }) {
  const tone = PIN_TONES[pin.tone];
  return (
    <View style={styles.pin} collapsable={false}>
      <View style={[styles.dot, { backgroundColor: tone.dot }, selected && styles.dotOn]}>
        {pin.score != null ? (
          <Text style={styles.score}>{pin.score}</Text>
        ) : (
          <Utensils size={12} color="#fff" strokeWidth={2.4} />
        )}
      </View>
      {(showName || selected) && (
        <Text style={[styles.name, { color: tone.text }]} numberOfLines={1}>
          {pin.name}
        </Text>
      )}
    </View>
  );
}

export function YouDot() {
  return <View style={styles.you} />;
}

const styles = StyleSheet.create({
  pin: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  dotOn: { borderColor: colors.lemon, borderWidth: 3, transform: [{ scale: 1.2 }] },
  score: { fontFamily: fonts.bold, fontSize: 11, color: '#fff' },
  name: {
    marginLeft: 4,
    maxWidth: 150,
    fontFamily: fonts.bold,
    fontSize: 12,
    textShadowColor: '#fff',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  you: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1A73E8',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 3,
  },
});
