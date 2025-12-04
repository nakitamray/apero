import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { TrendingUp, Users, Calendar, MapPin, Heart } from 'lucide-react-native';

// --- HELPER: Normalize ELO score to 1-10 range ---
const ASSUMED_MIN_SCORE = 800; 
const ASSUMED_MAX_SCORE = 1400;

const normalizeScoreGlobal = (score) => {
    if (score === undefined || score === null || score === 1000) return '5.0'; 
    
    const normalized = 1 + 9 * ((score - ASSUMED_MIN_SCORE) / (ASSUMED_MAX_SCORE - ASSUMED_MIN_SCORE));
    if (normalized < 1.0) return '1.0';
    if (normalized > 10.0) return '10.0';

    return normalized.toFixed(1);
};

export default function DishScreen({ route, navigation }) { 
  let [fontsLoaded] = useFonts({ 
    Inter_400Regular, 
    Inter_600SemiBold, 
    Inter_700Bold,
    BodoniModa_700Bold 
  });
  
  const { dishId, diningHallId, collectionName } = route.params; 
  const [dish, setDish] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDishData = async () => {
      try {
        // Fetch dish data
        const dishRef = doc(db, collectionName, diningHallId, 'dishes', dishId);
        const docSnap = await getDoc(dishRef);
        
        if (docSnap.exists()) {
          setDish(docSnap.data());
        }

        // Fetch recent reviews (if you have a reviews collection)
        // This is a placeholder - adjust based on your database structure
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('dishId', '==', dishId),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        
        try {
          const reviewsSnap = await getDocs(reviewsQuery);
          const reviewsList = reviewsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRecentReviews(reviewsList);
        } catch (reviewError) {
          console.log("Reviews not available:", reviewError);
        }

      } catch (error) {
        console.error("Error fetching dish:", error);
      }
      setLoading(false);
    };

    fetchDishData();
  }, [dishId, diningHallId, collectionName]);

  if (!fontsLoaded || loading || !dish) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loading}>Loading dish details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate the display score correctly
  const displayScore = normalizeScoreGlobal(dish.score);
  const rawScore = dish.score || 1000;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.dishName}>{dish.name}</Text>
          
          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <View style={styles.mainScoreCard}>
              <Text style={styles.scoreLabel}>Apero Score</Text>
              <Text style={styles.mainScore}>{displayScore}</Text>
              <Text style={styles.scoreMax}>/ 10</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Users size={16} color="#007A7A" />
                <Text style={styles.statValue}>{dish.totalRatings || 0}</Text>
                <Text style={styles.statLabel}>Ratings</Text>
              </View>
              
              {dish.lastServedDate && (
                <View style={styles.statItem}>
                  <Calendar size={16} color="#7D7D7D" />
                  <Text style={styles.statValue}>
                    {new Date(dish.lastServedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.statLabel}>Last Served</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Location Info */}
        {dish.currentStation && (
          <View style={styles.infoCard}>
            <MapPin size={18} color="#F47121" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Currently Serving At</Text>
              <Text style={styles.infoValue}>{dish.currentStation}</Text>
            </View>
          </View>
        )}

        {/* Tags Section */}
        {dish.tags && dish.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {dish.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Reviews Preview */}
        {recentReviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {recentReviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Heart size={14} color="#F47121" fill="#F47121" />
                  <Text style={styles.reviewScore}>{review.initialScore ? normalizeScoreGlobal(review.initialScore) : 'N/A'}</Text>
                </View>
                {review.note && (
                  <Text style={styles.reviewNote} numberOfLines={2}>{review.note}</Text>
                )}
                {review.tags && review.tags.length > 0 && (
                  <View style={styles.reviewTags}>
                    {review.tags.slice(0, 3).map((tag, idx) => (
                      <Text key={idx} style={styles.reviewTag}>{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Review')} 
        >
          <Text style={styles.primaryButtonText}>Write Your Review</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => navigation.navigate('Comparison')} 
        >
          <Text style={styles.secondaryButtonText}>Compare with Other Dishes</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  scrollContainer: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loading: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7D7D7D' },
  
  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  dishName: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 32,
    color: '#4E4A40',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 38,
  },
  
  // Score Display
  scoreContainer: {
    alignItems: 'center',
  },
  mainScoreCard: {
    backgroundColor: '#E0F2F2',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007A7A',
  },
  scoreLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#007A7A',
    marginBottom: 5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mainScore: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 56,
    color: '#007A7A',
    lineHeight: 56,
  },
  scoreMax: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#7D7D7D',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#FFFBF8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#4E4A40',
    marginTop: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#7D7D7D',
    marginTop: 2,
  },
  
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7D7D7D',
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#4E4A40',
    marginTop: 2,
  },
  
  // Tags Section
  tagsSection: {
    marginHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 20,
    color: '#F47121',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#FFFBF8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  tagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#007A7A',
  },
  
  // Reviews Section
  reviewsSection: {
    marginHorizontal: 20,
    marginTop: 25,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewScore: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F47121',
    marginLeft: 6,
  },
  reviewNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4E4A40',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewTag: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#7D7D7D',
    backgroundColor: '#FAF6F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  
  // Action Buttons
  primaryButton: {
    backgroundColor: '#F47121',
    marginHorizontal: 20,
    marginTop: 30,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F47121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonText: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007A7A',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_700Bold',
    color: '#007A7A',
    fontSize: 16,
  },
});