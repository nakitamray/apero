import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// --- FONT IMPORTS ---
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

// This screen receives the 'diningHallId' from the Home screen
export default function DiningHallScreen({ route, navigation }) {
  // --- FONT LOADING ---
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const { diningHallId } = route.params;
  const [dishes, setDishes] = useState([]);

  useEffect(() => {
    const fetchDishes = async () => {
      // Create a reference to the 'dishes' sub-collection
      const dishesCollectionRef = collection(db, 'diningHalls', diningHallId, 'dishes');
      const querySnapshot = await getDocs(dishesCollectionRef);

      const dishesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDishes(dishesList);
    };

    fetchDishes();
  }, [diningHallId]); // Re-run if the diningHallId changes

  const renderDish = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} // We reuse the card style
      // Navigate to DishScreen, passing the dishId AND the diningHallId
      onPress={() => navigation.navigate('Dish', { 
          dishId: item.id, 
          diningHallId: diningHallId 
        })}
    >
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardLocation}>Avg. Rating: {item.averageRating} / 5</Text>
    </TouchableOpacity>
  );

  if (!fontsLoaded) {
    return null; // Wait for fonts
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={dishes}
        renderItem={renderDish}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }} // Add padding around the list
      />
    </SafeAreaView>
  );
}

// --- "THE VENETIAN SPRITZ" PALETTE ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0', // Background (Sunlight)
  },
  // --- CARD STYLES (reused from HomeScreen) ---
  card: {
    backgroundColor: '#FFFFFF', // Surface (White)
    padding: 20,
    marginVertical: 8, // Space between cards
    borderRadius: 12, // Rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold', // Custom Font
    fontSize: 18,
    color: '#4E4A40', // Primary Text (Dark Wood)
  },
  cardLocation: {
    fontFamily: 'Inter_400Regular', // Custom Font
    fontSize: 14,
    color: '#7D7D7D', // Secondary Text (Stone)
    marginTop: 4,
  },
});