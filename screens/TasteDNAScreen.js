import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { Sparkles, TrendingUp, Clock, ThumbsUp, Brain, Compass, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// NEW ADVANCED TAGS - Beyond just vibes
const FLAVOR_PROFILES = [
  { id: 'savory', label: 'Savory', emoji: '🧂' },
  { id: 'umami', label: 'Umami Rich', emoji: '🍄' },
  { id: 'tangy', label: 'Tangy/Citrus', emoji: '🍋' },
  { id: 'creamy', label: 'Creamy', emoji: '🥛' },
  { id: 'crunchy', label: 'Crispy/Crunchy', emoji: '🥖' },
  { id: 'smoky', label: 'Smoky', emoji: '🔥' },
];

const CUISINE_TYPES = [
  { id: 'american', label: 'American Comfort', emoji: '🍔' },
  { id: 'italian', label: 'Italian', emoji: '🍝' },
  { id: 'asian-fusion', label: 'Asian Fusion', emoji: '🍜' },
  { id: 'mexican', label: 'Mexican', emoji: '🌮' },
  { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
];

const DIETARY_ATTRIBUTES = [
  { id: 'high-protein', label: 'High Protein', emoji: '💪' },
  { id: 'low-carb', label: 'Low Carb', emoji: '🥗' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'gluten-free', label: 'Gluten Free', emoji: '🌾' },
  { id: 'filling', label: 'Very Filling', emoji: '🍽️' },
];

export default function TasteDNAScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ 
    Inter_400Regular, 
    Inter_600SemiBold, 
    Inter_700Bold,
    BodoniModa_700Bold 
  });

  const [loading, setLoading] = useState(true);
  const [tasteDNA, setTasteDNA] = useState({
    topFlavors: [],
    topCuisines: [],
    dietaryPrefs: [],
    averageRating: 0,
    adventurousness: 0, // 0-100 score
  });
  const [recommendations, setRecommendations] = useState([]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      analyzeTasteDNA();
      generateRecommendations();
    }
  }, [userId]);

  const analyzeTasteDNA = async () => {
    setLoading(true);
    try {
      // Fetch user's reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      
      // Analyze tags from reviews
      const flavorCount = {};
      const cuisineCount = {};
      const dietaryCount = {};
      let totalRating = 0;
      const uniqueDishes = new Set();

      reviewsSnap.docs.forEach(doc => {
        const data = doc.data();
        totalRating += data.initialScore || 0;
        uniqueDishes.add(data.dishId);

        // Count tags (you'd need to add these to your reviews)
        if (data.tags) {
          data.tags.forEach(tag => {
            flavorCount[tag] = (flavorCount[tag] || 0) + 1;
          });
        }
      });

      // Calculate adventurousness (how many unique dishes tried)
      const adventurousness = Math.min(100, (uniqueDishes.size / 50) * 100);

      // Get top 3 of each category
      const topFlavors = Object.entries(flavorCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key]) => FLAVOR_PROFILES.find(f => f.id === key))
        .filter(Boolean);

      setTasteDNA({
        topFlavors,
        topCuisines: [CUISINE_TYPES[0], CUISINE_TYPES[2]], // Mock data
        dietaryPrefs: [DIETARY_ATTRIBUTES[0]], // Mock data
        averageRating: reviewsSnap.size > 0 ? totalRating / reviewsSnap.size : 0,
        adventurousness,
      });

    } catch (error) {
      console.error("Error analyzing Taste DNA:", error);
    }
    setLoading(false);
  };

  const generateRecommendations = async () => {
    try {
      // Smart recommendation algorithm based on:
      // 1. Dishes user hasn't tried yet
      // 2. Similar flavor profiles to what they like
      // 3. Popular dishes they're missing out on
      
      const allDishesQuery = collectionGroup(db, 'dishes');
      const allDishesSnap = await getDocs(allDishesQuery);
      
      // Get user's reviewed dishes
      const reviewedQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId)
      );
      const reviewedSnap = await getDocs(reviewedQuery);
      const reviewedDishIds = new Set(reviewedSnap.docs.map(doc => doc.data().dishId));

      // Filter and score dishes
      const scoredDishes = [];
      allDishesSnap.docs.forEach(doc => {
        const dish = { id: doc.id, ...doc.data() };
        
        // Skip if already reviewed
        if (reviewedDishIds.has(doc.id)) return;
        
        // Skip if unrated
        if (!dish.score || dish.score === 1000) return;

        // Calculate recommendation score
        let recScore = dish.score || 0;
        
        // Boost if matches user's top tags
        if (dish.tags) {
          const matchingTags = dish.tags.filter(tag => 
            tasteDNA.topFlavors.some(f => f?.id === tag)
          ).length;
          recScore += matchingTags * 50;
        }

        scoredDishes.push({
          ...dish,
          recScore,
          parentId: doc.ref.parent.parent.id,
          parentCollection: doc.ref.parent.parent.parent.id,
        });
      });

      // Sort by recommendation score and take top 10
      const topRecs = scoredDishes
        .sort((a, b) => b.recScore - a.recScore)
        .slice(0, 10);

      setRecommendations(topRecs);

    } catch (error) {
      console.error("Error generating recommendations:", error);
    }
  };

  const navigateToDish = (dish) => {
    navigation.navigate('Dish', {
      dishId: dish.id,
      diningHallId: dish.parentId,
      collectionName: dish.parentCollection
    });
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F47121" />
          <Text style={styles.loadingText}>Analyzing your Taste DNA...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Brain size={32} color="#F47121" />
          <Text style={styles.title}>Your Taste DNA</Text>
          <Text style={styles.subtitle}>AI-powered insights into your food preferences</Text>
        </View>

        {/* DNA Profile Card */}
        <View style={styles.dnaCard}>
          <View style={styles.dnaHeader}>
            <Sparkles size={24} color="#007A7A" />
            <Text style={styles.dnaTitle}>Your Unique Food Profile</Text>
          </View>

          {/* Adventurousness Meter */}
          <View style={styles.meterSection}>
            <View style={styles.meterHeader}>
              <Compass size={18} color="#F47121" />
              <Text style={styles.meterLabel}>Food Adventurousness</Text>
            </View>
            <View style={styles.meterBar}>
              <View style={[styles.meterFill, { width: `${tasteDNA.adventurousness}%` }]} />
            </View>
            <Text style={styles.meterValue}>{Math.round(tasteDNA.adventurousness)}%</Text>
          </View>

          {/* Top Flavors */}
          {tasteDNA.topFlavors.length > 0 && (
            <View style={styles.dnaSection}>
              <Text style={styles.dnaSectionTitle}>You Love These Flavors</Text>
              <View style={styles.tagsRow}>
                {tasteDNA.topFlavors.map((flavor, idx) => (
                  <View key={idx} style={styles.dnaTag}>
                    <Text style={styles.dnaTagEmoji}>{flavor.emoji}</Text>
                    <Text style={styles.dnaTagText}>{flavor.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Top Cuisines */}
          {tasteDNA.topCuisines.length > 0 && (
            <View style={styles.dnaSection}>
              <Text style={styles.dnaSectionTitle}>Favorite Cuisines</Text>
              <View style={styles.tagsRow}>
                {tasteDNA.topCuisines.map((cuisine, idx) => (
                  <View key={idx} style={styles.dnaTag}>
                    <Text style={styles.dnaTagEmoji}>{cuisine.emoji}</Text>
                    <Text style={styles.dnaTagText}>{cuisine.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Smart Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color="#F47121" />
            <Text style={styles.sectionTitle}>You'll Probably Love These</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Based on your taste profile and what's trending
          </Text>

          {recommendations.length > 0 ? (
            recommendations.map((dish, index) => (
              <TouchableOpacity
                key={`${dish.id}-${index}`}
                style={styles.recCard}
                onPress={() => navigateToDish(dish)}
              >
                <View style={styles.recBadge}>
                  <Text style={styles.recBadgeText}>#{index + 1}</Text>
                </View>
                
                <View style={styles.recContent}>
                  <Text style={styles.recTitle} numberOfLines={1}>{dish.name}</Text>
                  <View style={styles.recMeta}>
                    <View style={styles.recMetaItem}>
                      <ThumbsUp size={12} color="#007A7A" />
                      <Text style={styles.recMetaText}>
                        {dish.score ? ((dish.score - 800) / 60).toFixed(1) : 'N/A'}/10
                      </Text>
                    </View>
                    {dish.tags && dish.tags.length > 0 && (
                      <Text style={styles.recTags} numberOfLines={1}>
                        {dish.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                      </Text>
                    )}
                  </View>
                </View>

                <ChevronRight size={20} color="#7D7D7D" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Review more dishes to get personalized recommendations!
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Review')}
              >
                <Text style={styles.emptyButtonText}>Start Reviewing</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  container: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#4E4A40',
    marginTop: 15,
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 32,
    color: '#4E4A40',
    marginTop: 10,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7D7D7D',
    marginTop: 5,
    textAlign: 'center',
  },
  
  // DNA Card
  dnaCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  dnaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  dnaTitle: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 22,
    color: '#4E4A40',
  },
  
  // Adventurousness Meter
  meterSection: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  meterLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#4E4A40',
  },
  meterBar: {
    height: 12,
    backgroundColor: '#EAEAEA',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#F47121',
    borderRadius: 6,
  },
  meterValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F47121',
    textAlign: 'right',
  },
  
  // DNA Sections
  dnaSection: {
    marginBottom: 20,
  },
  dnaSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#7D7D7D',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dnaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 6,
  },
  dnaTagEmoji: {
    fontSize: 16,
  },
  dnaTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#007A7A',
  },
  
  // Section
  section: {
    marginHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  sectionTitle: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 22,
    color: '#4E4A40',
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7D7D7D',
    marginBottom: 15,
  },
  
  // Recommendation Cards
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#F47121',
  },
  recContent: {
    flex: 1,
    marginRight: 10,
  },
  recTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#4E4A40',
    marginBottom: 4,
  },
  recMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recMetaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#007A7A',
  },
  recTags: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#7D7D7D',
    flex: 1,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 10,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#7D7D7D',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#F47121',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});