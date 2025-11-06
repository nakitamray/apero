import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { db } from '../firebaseConfig';
import { collectionGroup, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

// This is the re-usable card component style from DiningHallScreen
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#7D7D7D',
    textAlign: 'center',
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
    color: '#007A7A', // Blue Accent for consistency
    marginTop: 4,
  },
});

export default function MoodResultsScreen({ route, navigation }) {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const { moodTag, moodLabel } = route.params;
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set the screen title to the mood label
  useEffect(() => {
    if (moodLabel) {
      navigation.setOptions({ title: `${moodLabel} Dishes` });
    }
  }, [moodLabel, navigation]);

  // Fetch dishes that match the mood tag
  useEffect(() => {
    const fetchDishes = async () => {
      setLoading(true);
      try {
        const dishesRef = collectionGroup(db, 'dishes');
        const q = query(
          dishesRef, 
          where('tags', 'array-contains', moodTag),
          orderBy('averageRating', 'desc') 
        );
        
        const querySnapshot = await getDocs(q);
        const dishesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // We need to get the parent diningHallId to navigate
          diningHallId: doc.ref.parent.parent.id,
          parentCollection: doc.ref.parent.parent.parent.id, // Collection name
        }));
        setDishes(dishesList);

      } catch (error) {
        console.error("Error fetching mood results: ", error);
        // Ensure the error alerts the user to the need for the index
        Alert.alert("Data Error", "Could not fetch mood data. Check if your Firebase index for tags/averageRating is built.");
      }
      setLoading(false);
    };

    if (moodTag) {
      fetchDishes();
    }
  }, [moodTag]);

  const renderDish = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Dish', { 
          dishId: item.id, 
          diningHallId: item.diningHallId,
          collectionName: item.parentCollection, // Pass the parent collection name
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Finding dishes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={dishes}
        renderItem={renderDish}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }} 
        ListEmptyComponent={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No dishes found for this mood.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}