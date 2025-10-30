import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';

// --- FIREBASE IMPORTS ---
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// (Moods are the same)
const MOODS = [
  { key: 'cozy', label: 'Cozy', emoji: '🍲' },
  { key: 'sick', label: 'Sick', emoji: '🤒' },
  { key: 'celebration', label: 'Celebration', emoji: '🎉' },
  { key: 'stressed', label: 'Stressed', emoji: '😫' },
];

export default function HomeScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, BodoniModa_700Bold });

  // --- NEW STATE for Dining Halls ---
  const [diningHalls, setDiningHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: Fetch Dining Halls from Firestore ---
  useEffect(() => {
    const fetchDiningHalls = async () => {
      setLoading(true);
      const hallsCollectionRef = collection(db, 'diningHalls');
      try {
        const querySnapshot = await getDocs(hallsCollectionRef);
        const hallsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDiningHalls(hallsList);
      } catch (error) {
        console.error("Error fetching dining halls: ", error);
      }
      setLoading(false);
    };

    fetchDiningHalls();
  }, []); // Empty array means this runs once on mount


  const onMoodPress = (mood) => alert(`Tapped ${mood.label}`);
  const onHotspotPress = () => alert('Opening Hotspot Map...');

  // --- NEW: Render Function for Dining Hall Cards ---
  const renderDiningHall = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      // This is the navigation you set up in AppNavigator.js!
      onPress={() => navigation.navigate('DiningHall', {
        diningHallId: item.id,
        // We pass the name to set the title in the next screen
        name: item.name
      })}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardLocation}>{item.location}</Text>
      </View>
      <Text style={styles.arrowText}>{">"}</Text>
    </TouchableOpacity>
  );

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader />
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

        {/* --- NEW: DINING HALLS LIST --- */}
        <Text style={styles.headerTitle}>Dining Halls</Text>
        {loading ? (
          <Text style={styles.subHeader}>Loading...</Text>
        ) : (
          <FlatList
            data={diningHalls}
            renderItem={renderDiningHall}
            keyExtractor={item => item.id}
            scrollEnabled={false} // Disable scrolling within the ScrollView
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  container: { flex: 1 },
  headerTitle: {
    fontFamily: 'BodoniModa_700Bold', fontSize: 28, color: '#4E4A40',
    marginTop: 25, marginBottom: 15, paddingHorizontal: 20,
  },
  subHeader: {
    fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7D7D7D',
    marginTop: -15, marginBottom: 15, paddingHorizontal: 20,
  },
  // --- Mood Styles ---
  moodScroll: { paddingLeft: 20, paddingBottom: 10 },
  moodButton: {
    backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, alignItems: 'center',
    width: 100, marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
  },
  moodEmoji: { fontSize: 24 },
  moodText: { fontFamily: 'Inter_600SemiBold', color: '#4E4A40', marginTop: 5 },
  // --- Map Button ---
  mapButton: {
    backgroundColor: '#F47121', marginHorizontal: 20, marginTop: 15,
    padding: 15, borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  mapButtonText: { fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 16 },
  // --- CARD STYLES (Re-using from your DiningHallScreen) ---
  card: {
    backgroundColor: '#FFFFFF', padding: 20, marginVertical: 8, borderRadius: 12,
    marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#4E4A40' },
  cardLocation: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7D7D7D', marginTop: 4 },
  arrowText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#7D7D7D'
  },
});
