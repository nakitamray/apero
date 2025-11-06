import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'; // Added Inter_700Bold
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { PlusCircle } from 'lucide-react-native'; // For the new button

// --- FIREBASE IMPORTS ---
import { db } from '../firebaseConfig';
import { 
    collection, 
    getDocs, 
    collectionGroup, 
    query, 
    orderBy, 
    limit,
    where 
} from 'firebase/firestore';

const MOODS = [
  { key: 'cozy', label: 'Cozy', emoji: '🍲' },
  { key: 'sick', label: 'Sick', emoji: '🤒' },
  { key: 'celebration', label: 'Celebration', emoji: '🎉' },
  { key: 'stressed', label: 'Stressed', emoji: '😫' },
];

const PULSE_FILTERS = {
    ALL: 'all',
    DINING_HALL: 'diningHall',
    DINING_POINTS: 'diningPoints'
};

// --- HELPER FUNCTION: Normalize ELO score to 1-10 range (Assumed Global Range) ---
const ASSUMED_MIN_SCORE = 800; 
const ASSUMED_MAX_SCORE = 1400;

const normalizeScoreGlobal = (score) => {
    if (score === undefined || score === 1000) return '5.0'; 
    
    const normalized = 1 + 9 * ((score - ASSUMED_MIN_SCORE) / (ASSUMED_MAX_SCORE - ASSUMED_MIN_SCORE));
    if (normalized < 1.0) return '1.0';
    if (normalized > 10.0) return '10.0';

    return normalized.toFixed(1);
};


export default function HomeScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, BodoniModa_700Bold });

  const [diningHalls, setDiningHalls] = useState([]);
  const [diningPoints, setDiningPoints] = useState([]); 
  const [pulse, setPulse] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [pulseFilter, setPulseFilter] = useState(PULSE_FILTERS.ALL); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Dining Halls
        const hallsRef = collection(db, 'diningHalls');
        const hallsSnapshot = await getDocs(hallsRef);
        const hallsList = hallsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: PULSE_FILTERS.DINING_HALL
        }));
        setDiningHalls(hallsList);

        // 2. Fetch Dining Points
        const pointsRef = collection(db, 'diningPoints');
        const pointsSnapshot = await getDocs(pointsRef);
        const pointsList = pointsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: PULSE_FILTERS.DINING_POINTS
        }));
        setDiningPoints(pointsList);


        // 3. Setup The Pulse Query (order by ELO score)
        const dishesRef = collectionGroup(db, 'dishes');
        let pulseQuery;

        if (pulseFilter === PULSE_FILTERS.ALL) {
            pulseQuery = query(
                dishesRef, 
                orderBy('score', 'desc'), 
                limit(10)
            );
        } else {
            pulseQuery = query(
                dishesRef,
                where('category', '==', pulseFilter), 
                orderBy('score', 'desc'),
                limit(10)
            );
        }

        const pulseSnapshot = await getDocs(pulseQuery);
        const pulseList = pulseSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            parentId: doc.ref.parent.parent.id, 
            parentCollection: doc.ref.parent.parent.parent.id, 
        })).filter(d => d.score > 0); 
        
        setPulse(pulseList);

      } catch (error) {
        console.error("Error fetching data: ", error);
        Alert.alert("Data Error", "Could not fetch data. Check your Firebase indexes and console for errors.");
      }
      setLoading(false);
    };

    fetchData();
  }, [pulseFilter]);

  const onMoodPress = (mood) => {
    navigation.navigate('MoodResults', { 
      moodTag: mood.key, 
      moodLabel: mood.label 
    });
  };

  const onHotspotPress = () => Alert.alert('Opening Hotspot Map... (Coming Soon!)');

  const renderLocation = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DiningHall', {
        diningHallId: item.id,
        name: item.name,
        collectionName: item.type === PULSE_FILTERS.DINING_HALL ? 'diningHalls' : 'diningPoints' 
      })}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardLocation}>{item.location}</Text>
      </View>
      <Text style={styles.arrowText}>{">"}</Text>
    </TouchableOpacity>
  );

  const renderPulseItem = (item, index) => {
    const typeLabel = item.category === PULSE_FILTERS.DINING_HALL ? 'Dining Hall' : 'Dining Points';
    
    return (
        <TouchableOpacity 
            key={item.id} 
            style={styles.card}
            onPress={() => Alert.alert("Coming Soon!", "Tapping Pulse items will be enabled soon.")}
        >
          <Text style={styles.rankText}>#{index + 1}</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardLocation}>
              Score: {normalizeScoreGlobal(item.score)} / 10
            </Text>
          </View>
          <View style={styles.whyTagChip}>
            <Text style={styles.whyTagText}>
              {typeLabel}
            </Text>
          </View>
        </TouchableOpacity>
    );
  };
  
  // --- NEW: Render Review button ---
  const renderReviewButton = () => (
    <TouchableOpacity 
        style={styles.reviewButton} 
        onPress={() => navigation.navigate('Review')}
    >
        <PlusCircle color="#007A7A" size={18} />
        <Text style={styles.reviewButtonText}>Review a New Dish</Text>
    </TouchableOpacity>
  );


  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader />
      <ScrollView style={styles.container}>
        
        {/* --- MANUAL REVIEW BUTTON (Top Center) --- */}
        <View style={{ paddingHorizontal: 20, marginTop: 15, marginBottom: 10 }}>
            {renderReviewButton()}
        </View>

        {/* --- FOOD MOODS --- */}
        <Text style={styles.headerTitle}>What's your mood?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
          {MOODS.map((mood) => (
            <TouchableOpacity 
              key={mood.key} 
              style={styles.moodButton} 
              onPress={() => onMoodPress(mood)}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodText}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- HOTSPOT MAP BUTTON --- */}
        <TouchableOpacity style={styles.mapButton} onPress={onHotspotPress}>
          <Text style={styles.mapButtonText}>📍 View Campus Hotspot Map</Text>
        </TouchableOpacity>

        {/* --- THE PULSE LEADERBOARD --- */}
        <Text style={styles.headerTitle}>The Pulse</Text>
        <Text style={styles.subHeader}>Live campus leaderboard</Text>

        {/* --- PULSE FILTER BUTTONS --- */}
        <View style={styles.filterContainer}>
            {Object.entries(PULSE_FILTERS).map(([key, value]) => (
                <TouchableOpacity
                    key={key}
                    style={[
                        styles.filterButton,
                        pulseFilter === value && styles.filterButtonActive,
                    ]}
                    onPress={() => setPulseFilter(value)}
                >
                    <Text style={[
                        styles.filterText,
                        pulseFilter === value && styles.filterTextActive,
                    ]}>
                        {key.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        {loading ? (
            <Text style={styles.subHeader}>Loading Pulse...</Text>
        ) : (
          pulse.map(renderPulseItem)
        )}

        {/* --- DINING LOCATIONS LIST (Combined Halls and Points) --- */}
        <Text style={styles.headerTitle}>Dining Locations</Text>
        {loading ? (
          <Text style={styles.subHeader}>Loading locations...</Text>
        ) : (
          <FlatList
            data={[...diningHalls, ...diningPoints]}
            renderItem={renderLocation}
            keyExtractor={item => item.id}
            scrollEnabled={false} 
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles (Refined) ---
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
  // --- NEW REVIEW BUTTON STYLES ---
  reviewButton: {
    backgroundColor: '#FFFFFF', 
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#007A7A',
    marginLeft: 10,
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
  // --- CARD STYLES (Used for Dining Locations) ---
  card: {
    backgroundColor: '#FFFFFF', padding: 20, marginVertical: 8, borderRadius: 12,
    marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
    flexDirection: 'row', alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: 15 }, 
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#4E4A40' },
  cardLocation: { 
    fontFamily: 'Inter_400Regular', 
    fontSize: 14, 
    color: '#007A7A',
    marginTop: 4 
  },
  arrowText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#7D7D7D',
    marginLeft: 'auto', 
  },
  // --- PULSE-SPECIFIC STYLES ---
  rankText: { 
    fontFamily: 'BodoniModa_700Bold', 
    fontSize: 22, 
    color: '#7D7D7D',
    width: 35, 
    textAlign: 'right', 
  },
  whyTagChip: {
    backgroundColor: '#FAF6F0', 
    paddingVertical: 5, 
    paddingHorizontal: 10, 
    borderRadius: 20,
    marginLeft: 'auto', 
  },
  whyTagText: { 
    fontFamily: 'Inter_600SemiBold', 
    color: '#007A7A', 
    fontSize: 12 
  },
  // --- FILTER STYLES ---
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  filterButtonActive: {
    backgroundColor: '#F47121', 
    borderColor: '#F47121',
  },
  filterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#4E4A40',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
});