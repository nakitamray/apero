import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { Rating } from 'react-native-ratings'; 
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';

// --- NEW: Define your "Why" tags ---
const WHY_TAGS = [
  { key: 'taste', label: 'Taste', emoji: '😋' },
  { key: 'value', label: 'Value', emoji: '💲' },
  { key: 'portion', label: 'Portion', emoji: '🍔' },
  { key: 'speed', label: 'Speed', emoji: '⚡️' },
];

export default function DishScreen({ route }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, BodoniModa_700Bold });
  const { dishId, diningHallId } = route.params;
  const [dish, setDish] = useState(null);
  const [myRating, setMyRating] = useState(3);

  // --- NEW: State for the "Why" tag ---
  const [whyTag, setWhyTag] = useState(null); // e.g., 'taste'

  useEffect(() => {
    const fetchDish = async () => {
      const dishRef = doc(db, 'diningHalls', diningHallId, 'dishes', dishId);
      const docSnap = await getDoc(dishRef);
      if (docSnap.exists()) {
        setDish(docSnap.data());
      }
    };
    fetchDish();
  }, [dishId, diningHallId]);

  const handleSubmitRating = async () => {
    const userId = auth.currentUser.uid;
    if (!userId) {
      Alert.alert("Error", "You must be logged in to rate.");
      return;
    }
    // --- NEW: Check for "Why" Tag ---
    if (!whyTag) {
      Alert.alert("Wait!", "Please select *why* you gave this rating.");
      return;
    }

    try {
      await addDoc(collection(db, 'ratings'), {
        userId: userId,
        dishId: dishId,
        diningHallId: diningHallId,
        dishName: dish.name, // Denormalize data for easier queries
        dishCategory: dish.category, // e.g., 'diningHall'
        rating: myRating,
        whyTag: whyTag, // --- NEW: Save the tag ---
        createdAt: Timestamp.now()
      });
      Alert.alert("Success!", "Your rating has been submitted.");
      // TODO: Implement the Beli-style comparison ranking
    } catch (error) {
      console.error("Error adding rating: ", error);
      Alert.alert("Error", "Could not submit rating.");
    }
  };

  if (!fontsLoaded || !dish) {
    return <SafeAreaView style={styles.safeArea}><Text style={styles.loading}>Loading...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{dish.name}</Text>
        <Text style={styles.avgRating}>
          ({dish.totalRatings} ratings)
        </Text>

        <Text style={styles.myRating}>1. Give it a rating</Text>
        <Rating
          showRating
          onFinishRating={(rating) => setMyRating(rating)}
          style={{ paddingVertical: 10 }}
          tintColor='#FAF6F0'
          ratingColor='#F47121'
          ratingBackgroundColor='#FFFFFF'
          imageSize={40}
        />

        {/* --- NEW: "WHY" TAGS SECTION --- */}
        <Text style={styles.myRating}>2. What's the main reason?</Text>
        <View style={styles.whyTagContainer}>
          {WHY_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag.key}
              // --- NEW: Style the selected button differently ---
              style={[
                styles.whyTagButton,
                whyTag === tag.key && styles.whyTagButtonSelected
              ]}
              onPress={() => setWhyTag(tag.key)}
            >
              <Text style={styles.whyTagEmoji}>{tag.emoji}</Text>
              <Text style={[
                styles.whyTagLabel,
                whyTag === tag.key && styles.whyTagLabelSelected
              ]}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* --- END OF NEW SECTION --- */}

        <TouchableOpacity style={styles.button} onPress={handleSubmitRating}>
          <Text style={styles.buttonText}>Submit Rating</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Styles (with new styles added at the bottom) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  container: { flex: 1, padding: 20 },
  loading: { padding: 20, fontFamily: 'Inter_400Regular', color: '#7D7D7D' },
  title: { fontFamily: 'BodoniModa_700Bold', fontSize: 28, color: '#4E4A40', marginBottom: 5, textAlign: 'center' },
  avgRating: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7D7D7D', marginBottom: 20, textAlign: 'center' },
  myRating: { fontFamily: 'Inter_600SemiBold', fontSize: 18, textAlign: 'center', color: '#4E4A40', marginTop: 15,},
  button: { backgroundColor: '#F47121', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 'auto', // Pushes button to bottom
    shadowColor: '#F47121', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5,
  },
  buttonText: { fontFamily: 'Inter_600SemiBold', color: '#FFFFFF', fontSize: 16 },

  // --- NEW STYLES FOR "WHY" TAGS ---
  whyTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
  },
  whyTagButton: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: 140,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  whyTagButtonSelected: {
    borderColor: '#F47121', // Spritz Orange border
    backgroundColor: '#FFFBF8',
  },
  whyTagEmoji: {
    fontSize: 24,
  },
  whyTagLabel: {
    fontFamily: 'Inter_600SemiBold',
    color: '#4E4A40',
    marginTop: 5,
  },
  whyTagLabelSelected: {
    color: '#F47121',
  }
});