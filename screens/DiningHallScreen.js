import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 

import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

export default function DiningHallScreen({ route, navigation }) {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Get the diningHallId, name, AND the collectionName (diningHalls or diningPoints)
  const { diningHallId, name, collectionName } = route.params; 
  const [dishes, setDishes] = useState([]);

  // --- SET NAVIGATION TITLE ---
  useEffect(() => {
    if (name) {
      navigation.setOptions({ title: name });
    }
  }, [name, navigation]);

  // --- UPDATED to use collectionName for query path ---
  useEffect(() => {
    // Dynamically build the collection reference using the passed collectionName
    const dishesCollectionRef = collection(db, collectionName, diningHallId, 'dishes');
    
    // Create a query to order dishes by rating
    const q = query(dishesCollectionRef, orderBy('averageRating', 'desc'));

    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dishesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDishes(dishesList);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe(); 
  }, [diningHallId, collectionName]); // Depend on collectionName too

  const renderDish = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      // Pass both IDs and the collectionName to the DishScreen
      onPress={() => navigation.navigate('Dish', { 
          dishId: item.id, 
          diningHallId: diningHallId, // Still use this name for the ID
          collectionName: collectionName // <-- PASS THIS NEW PARAMETER
        })}
    >
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardLocation}>
        Avg. Rating: {item.averageRating ? item.averageRating.toFixed(1) : 'N/A'} / 5
      </Text>
    </TouchableOpacity>
  );

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={dishes}
        renderItem={renderDish}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0', 
  },
  card: {
    backgroundColor: '#FFFFFF', 
    padding: 20,
    marginVertical: 8, 
    borderRadius: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#4E4A40', 
  },
  cardLocation: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 14,
    color: '#7D7D7D', 
    marginTop: 4,
  },
});