import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import CustomHeader from '../components/CustomHeader'; // <-- 1. IMPORT
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';

// (Mock Data and Moods are the same)
const MOCK_PULSE = [
  { id: '1', name: 'Popcorn Chicken', score: 1450, whyTag: 'taste', type: 'diningHall' },
  { id: '2', name: 'Pappy\'s Burger', score: 1420, whyTag: 'value', type: 'diningPoints' },
  { id: '3', name: 'Windsor\'s Tacos', score: 1390, whyTag: 'taste', type: 'diningHall' },
];
const MOODS = [
  { key: 'cozy', label: 'Cozy', emoji: '🍲' },
  { key: 'sick', label: 'Sick', emoji: '🤒' },
  { key: 'celebration', label: 'Celebration', emoji: '🎉' },
  { key: 'stressed', label: 'Stressed', emoji: '😫' },
];

export default function HomeScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, BodoniModa_700Bold });
  const onMoodPress = (mood) => alert(`Tapped ${mood.label}`);
  const onHotspotPress = () => alert('Opening Hotspot Map...');

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader /> {/* <-- 2. USE THE COMPONENT */}
      <ScrollView style={styles.container}>
        {/* --- FOOD MOODS --- */}
        <Text style={styles.headerTitle}>What's your mood?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
          {MOODS.map((mood) => (
            <TouchableOpacity key={mood.key} style={styles.moodButton} onPress={() => onMoodPress(mood)}>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodText}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- HOTSPOT MAP BUTTON --- */}
        <TouchableOpacity style={styles.mapButton} onPress={onHotspotPress}>
          <Text style={styles.mapButtonText}>📍 View Campus Hotspot Map</Text>
        </TouchableOpacity>

        {/* --- THE PULSE (Leaderboard) --- */}
        <Text style={styles.headerTitle}>The Pulse</Text>
        <Text style={styles.subHeader}>Live campus leaderboard</Text>

        {MOCK_PULSE.map((item, index) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <Text style={styles.rankText}>#{index + 1}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardLocation}>
                {item.type === 'diningHall' ? 'Dining Hall' : 'Dining Points'}
              </Text>
            </View>
            <View style={styles.whyTagChip}>
              <Text style={styles.whyTagText}>Top: {item.whyTag}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles (with better spacing) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' }, // Background (Sunlight)
  container: { flex: 1 },
  headerTitle: {
    fontFamily: 'BodoniModa_700Bold', fontSize: 28, color: '#4E4A40',
    marginTop: 25, // <-- ADDED SPACING
    marginBottom: 15, paddingHorizontal: 20,
  },
  subHeader: {
    fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7D7D7D',
    marginTop: -15, marginBottom: 15, // <-- ADDED SPACING
    paddingHorizontal: 20,
  },
  // --- Mood Styles ---
  moodScroll: { paddingLeft: 20, paddingBottom: 10 }, // <-- ADDED SPACING
  moodButton: {
    backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, alignItems: 'center',
    width: 100, marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
  },
  moodEmoji: { fontSize: 24 },
  moodText: { fontFamily: 'Inter_600SemiBold', color: '#4E4A40', marginTop: 5 },
  // --- Map Button ---
  mapButton: {
    backgroundColor: '#F47121', // Spritz
    marginHorizontal: 20, // <-- Standardized margin
    marginTop: 15, // <-- ADDED SPACING
    padding: 15, borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  mapButtonText: { fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 16 },
  // --- Card Styles ---
  card: {
    backgroundColor: '#FFFFFF', padding: 20, marginVertical: 8, borderRadius: 12,
    marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
    flexDirection: 'row', alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: 15 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#4E4A40' },
  cardLocation: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7D7D7D', marginTop: 4 },
  rankText: { fontFamily: 'BodoniModa_700Bold', fontSize: 22, color: '#7D7D7D' },
  whyTagChip: {
    backgroundColor: '#FAF6F0', // Light cream
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
  },
  whyTagText: { fontFamily: 'Inter_600SemiBold', color: '#4E4A40', fontSize: 12 },
});