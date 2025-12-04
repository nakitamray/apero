import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { MapPin, TrendingUp, Users, Clock, Flame } from 'lucide-react-native';
import CustomHeader from '../components/CustomHeader';
const { width } = Dimensions.get('window');

// Mock coordinates for Purdue dining locations (you'd replace with real coordinates)
const LOCATION_COORDS = {
  'ford-dining-court': { x: 0.2, y: 0.3, name: 'Ford' },
  'wiley-dining-court': { x: 0.7, y: 0.4, name: 'Wiley' },
  'earhart-dining-court': { x: 0.5, y: 0.6, name: 'Earhart' },
  'hillenbrand-dining-court': { x: 0.3, y: 0.7, name: 'Hillenbrand' },
  'windsor-dining-court': { x: 0.8, y: 0.3, name: 'Windsor' },
};

export default function HotspotMapScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ 
    Inter_400Regular, 
    Inter_600SemiBold, 
    Inter_700Bold,
    BodoniModa_700Bold 
  });

  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('1h'); // '1h', '3h', 'today'

  useEffect(() => {
    fetchHotspotData();
  }, [timeFilter]);

  const fetchHotspotData = async () => {
    setLoading(true);
    try {
      // Calculate time threshold based on filter
      const now = new Date();
      let timeThreshold = new Date();
      
      if (timeFilter === '1h') {
        timeThreshold.setHours(now.getHours() - 1);
      } else if (timeFilter === '3h') {
        timeThreshold.setHours(now.getHours() - 3);
      } else {
        timeThreshold.setHours(0, 0, 0, 0);
      }

      // Fetch recent reviews/comparisons to determine activity
      // This is a mock implementation - you'd query your reviews collection
      const reviewsRef = collection(db, 'reviews');
      const recentQuery = query(
        reviewsRef,
        where('createdAt', '>=', Timestamp.fromDate(timeThreshold))
      );

      const reviewsSnapshot = await getDocs(recentQuery);
      
      // Count activity by location
      const locationActivity = {};
      
      reviewsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // You'd need to track location in reviews - this is a mock
        const locationId = data.locationId || 'unknown';
        
        if (!locationActivity[locationId]) {
          locationActivity[locationId] = {
            count: 0,
            recentDishes: []
          };
        }
        
        locationActivity[locationId].count++;
        if (locationActivity[locationId].recentDishes.length < 3) {
          locationActivity[locationId].recentDishes.push(data.dishName);
        }
      });

      // Transform to hotspot data
      const hotspotData = Object.keys(LOCATION_COORDS).map(locationId => {
        const activity = locationActivity[locationId] || { count: Math.floor(Math.random() * 50), recentDishes: [] };
        const coords = LOCATION_COORDS[locationId];
        
        return {
          id: locationId,
          name: coords.name,
          x: coords.x,
          y: coords.y,
          activityCount: activity.count,
          recentDishes: activity.recentDishes,
          intensity: Math.min(activity.count / 50, 1) // Normalize to 0-1
        };
      });

      setHotspots(hotspotData.sort((a, b) => b.activityCount - a.activityCount));
    } catch (error) {
      console.error("Error fetching hotspot data:", error);
      // Fallback to mock data
      setHotspots(Object.keys(LOCATION_COORDS).map(id => ({
        id,
        ...LOCATION_COORDS[id],
        activityCount: Math.floor(Math.random() * 50),
        recentDishes: [],
        intensity: Math.random()
      })));
    }
    setLoading(false);
  };

  const getHeatColor = (intensity) => {
    if (intensity > 0.7) return '#FF4136'; // Hot red
    if (intensity > 0.4) return '#FF851B'; // Orange
    if (intensity > 0.2) return '#FFDC00'; // Yellow
    return '#007A7A'; // Cool blue
  };

  const getHeatSize = (intensity) => {
    const baseSize = 40;
    return baseSize + (intensity * 40);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
        <CustomHeader />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Flame size={32} color="#F47121" />
          <Text style={styles.title}>Campus Hotspots</Text>
          <Text style={styles.subtitle}>See where everyone's eating right now</Text>
        </View>

        {/* Time Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, timeFilter === '1h' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('1h')}
          >
            <Clock size={14} color={timeFilter === '1h' ? '#FFFFFF' : '#7D7D7D'} />
            <Text style={[styles.filterText, timeFilter === '1h' && styles.filterTextActive]}>Last Hour</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, timeFilter === '3h' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('3h')}
          >
            <Text style={[styles.filterText, timeFilter === '3h' && styles.filterTextActive]}>Last 3 Hours</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, timeFilter === 'today' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('today')}
          >
            <Text style={[styles.filterText, timeFilter === 'today' && styles.filterTextActive]}>Today</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#F47121" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Heatmap Visualization */}
            <View style={styles.mapContainer}>
              <View style={styles.mapCanvas}>
                {hotspots.map(spot => (
                  <TouchableOpacity
                    key={spot.id}
                    style={[
                      styles.hotspotMarker,
                      {
                        left: `${spot.x * 100}%`,
                        top: `${spot.y * 100}%`,
                        width: getHeatSize(spot.intensity),
                        height: getHeatSize(spot.intensity),
                        backgroundColor: getHeatColor(spot.intensity),
                      }
                    ]}
                    onPress={() => navigation.navigate('DiningHall', {
                      diningHallId: spot.id,
                      name: spot.name + ' Dining Court',
                      collectionName: 'diningHalls'
                    })}
                  >
                    <View style={styles.markerCenter}>
                      <Text style={styles.markerCount}>{spot.activityCount}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {/* Location Labels */}
                {hotspots.map(spot => (
                  <View
                    key={`label-${spot.id}`}
                    style={[
                      styles.locationLabel,
                      {
                        left: `${spot.x * 100}%`,
                        top: `${(spot.y * 100) - 8}%`,
                      }
                    ]}
                  >
                    <Text style={styles.locationName}>{spot.name}</Text>
                  </View>
                ))}
              </View>
              
              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF4136' }]} />
                  <Text style={styles.legendText}>Very Busy</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF851B' }]} />
                  <Text style={styles.legendText}>Busy</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FFDC00' }]} />
                  <Text style={styles.legendText}>Moderate</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#007A7A' }]} />
                  <Text style={styles.legendText}>Quiet</Text>
                </View>
              </View>
            </View>

            {/* Top Locations List */}
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Top Locations Right Now</Text>
              
              {hotspots.slice(0, 5).map((spot, index) => (
                <TouchableOpacity
                  key={spot.id}
                  style={styles.locationCard}
                  onPress={() => navigation.navigate('DiningHall', {
                    diningHallId: spot.id,
                    name: spot.name + ' Dining Court',
                    collectionName: 'diningHalls'
                  })}
                >
                  {/* Rank Badge */}
                  <View style={[
                    styles.locationRank,
                    index === 0 && styles.locationRankFirst
                  ]}>
                    {index === 0 ? (
                      <Flame size={20} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.rankNumber}>#{index + 1}</Text>
                    )}
                  </View>

                  {/* Location Info */}
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationCardName}>{spot.name} Dining Court</Text>
                    <View style={styles.activityRow}>
                      <Users size={14} color="#007A7A" />
                      <Text style={styles.activityText}>{spot.activityCount} people eating here</Text>
                    </View>
                    
                    <View style={styles.dishesRow}>
                      <TrendingUp size={12} color="#F47121" />
                      <Text style={styles.dishesText} numberOfLines={1}>
                        {spot.recentDishes.length > 0 
                          ? spot.recentDishes.join(', ')
                          : 'Popcorn Chicken, Mac & Cheese, Salad Bar'}
                      </Text>
                    </View>
                  </View>

                  {/* Intensity Indicator */}
                  <View style={[styles.intensityBar, { backgroundColor: getHeatColor(spot.intensity) }]}>
                    <Text style={styles.intensityText}>
                      {spot.intensity > 0.7 ? '🔥' : spot.intensity > 0.4 ? '⚡' : '✨'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  container: { paddingBottom: 40 },
  
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
    fontSize: 16,
    color: '#7D7D7D',
    marginTop: 5,
    textAlign: 'center',
  },
  
  // Time Filter
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#F47121',
    borderColor: '#F47121',
  },
  filterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#7D7D7D',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  
  // Map Container
  mapContainer: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapCanvas: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Hotspot Markers
  hotspotMarker: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.7,
    transform: [{ translateX: -20 }, { translateY: -20 }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerCenter: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#4E4A40',
  },
  
  // Location Labels
  locationLabel: {
    position: 'absolute',
    transform: [{ translateX: -30 }],
  },
  locationName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#4E4A40',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#7D7D7D',
  },
  
  // List Container
  listContainer: {
    paddingHorizontal: 20,
  },
  listTitle: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 24,
    color: '#F47121',
    marginBottom: 15,
  },
  
  // Location Cards
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationRank: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationRankFirst: {
    backgroundColor: '#F47121',
  },
  rankNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#007A7A',
  },
  locationInfo: {
    flex: 1,
  },
  locationCardName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#4E4A40',
    marginBottom: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activityText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#007A7A',
  },
  dishesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dishesText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7D7D7D',
    flex: 1,
  },
  intensityBar: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 24,
  },
});