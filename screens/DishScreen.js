import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { 
    doc, 
    getDoc, 
    collection, 
    addDoc, 
    Timestamp, 
    runTransaction 
} from 'firebase/firestore';
import { Rating } from 'react-native-ratings'; 
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';

const WHY_TAGS = [
  { key: 'taste', label: 'Taste', emoji: '😋' },
  { key: 'value', label: 'Value', emoji: '💲' },
  { key: 'portion', label: 'Portion', emoji: '🍔' },
  { key: 'speed', label: 'Speed', emoji: '⚡️' },
];

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


export default function DishScreen({ route, navigation }) { 
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, BodoniModa_700Bold });
  const { dishId, diningHallId, collectionName } = route.params; 
  const [dish, setDish] = useState(null);
  const [myRating, setMyRating] = useState(3);
  const [whyTag, setWhyTag] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  useEffect(() => {
    const fetchDish = async () => {
      const dishRef = doc(db, collectionName, diningHallId, 'dishes', dishId);
      const docSnap = await getDoc(dishRef);
      if (docSnap.exists()) {
        setDish(docSnap.data());
      }
    };
    fetchDish();
  }, [dishId, diningHallId, collectionName]);

  const handleSubmitRating = async () => {
    Alert.alert(
        "Feature Retired",
        "Star rating has been replaced by the Apero Ranking system. Please use the '+' tab to start your review!",
        [
            { text: "OK", onPress: () => navigation.navigate('Review') }
        ]
    );
  };

  if (!fontsLoaded || !dish) {
    return <SafeAreaView style={styles.safeArea}><Text style={styles.loading}>Loading...</Text></SafeAreaView>;
  }

  const scoreDisplay = dish.score ? normalizeScoreGlobal(dish.score) : 'Unranked';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{dish.name}</Text>
        <Text style={styles.avgRating}>
          {dish.averageRating ? dish.averageRating.toFixed(1) : 'N/A'} / 5 (Old Rating)
        </Text>

        <Text style={styles.infoText}>
            This dish is currently ranked with a score of: {scoreDisplay} / 10
        </Text>

        <TouchableOpacity 
          style={styles.reviewButton} 
          onPress={() => navigation.navigate('Review')} 
        >
          <Text style={styles.reviewButtonText}>Start Apero Ranking for this Dish</Text>
        </TouchableOpacity>
        
        {/* Old rating UI is kept but disabled/hidden */}
        <View style={{ opacity: 0.3, pointerEvents: 'none' }}>
            <Text style={styles.myRating}>1. Give it a rating (DISABLED)</Text>
            <Rating showRating tintColor='#FAF6F0' ratingColor='#F47121' imageSize={40} />

            <Text style={styles.myRating}>2. What's the main reason? (DISABLED)</Text>
            <View style={styles.whyTagContainer}>
                {WHY_TAGS.map((tag) => (
                    <View key={tag.key} style={styles.whyTagButton}>
                        <Text style={styles.whyTagEmoji}>{tag.emoji}</Text>
                    </View>
                ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmitRating} disabled>
                <Text style={styles.buttonText}>Submit Rating</Text>
            </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  container: { flex: 1, padding: 20 },
  loading: { padding: 20, fontFamily: 'Inter_400Regular', color: '#7D7D7D' },
  title: { fontFamily: 'BodoniModa_700Bold', fontSize: 28, color: '#4E4A40', marginBottom: 5, textAlign: 'center' },
  avgRating: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7D7D7D', marginBottom: 20, textAlign: 'center' },
  infoText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#007A7A', textAlign: 'center', marginBottom: 30 },
  myRating: { fontFamily: 'Inter_600SemiBold', fontSize: 18, textAlign: 'center', color: '#4E4A40', marginTop: 15,},
  
  reviewButton: {
    backgroundColor: '#007A7A', // Secondary Accent
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#007A7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  reviewButtonText: { 
    fontFamily: 'Inter_600SemiBold', 
    color: '#FFFFFF', 
    fontSize: 16 
  },

  button: { backgroundColor: '#F47121', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30, },
  buttonText: { fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 16 },

  whyTagContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 15, },
  whyTagButton: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, alignItems: 'center', width: 140, margin: 8, },
  whyTagEmoji: { fontSize: 24, },
});