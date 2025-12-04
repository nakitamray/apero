import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomHeader from '../components/CustomHeader';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { PlusCircle, Clock, ChevronRight } from 'lucide-react-native';

import { db } from '../firebaseConfig';
import { 
    collection, 
    getDocs, 
    collectionGroup, 
    query, 
    orderBy, 
    limit,
    doc,
    getDoc
} from 'firebase/firestore';

const MEALS = ["Breakfast", "Lunch", "Dinner"];

// Default "Safe" times for each meal
const MEAL_DEFAULT_TIMES = {
    "Breakfast": 9,
    "Lunch": 13,
    "Dinner": 18
};

const getMealForTime = (dateObj) => {
    const hour = dateObj.getHours(); 
    if (hour < 11) return "Breakfast";
    if (hour < 16) return "Lunch";
    return "Dinner";
};

const normalizeScoreGlobal = (score) => {
    if (!score || score === 1000) return '5.0'; 
    const normalized = 1 + 9 * ((score - 800) / (1400 - 800));
    return Math.max(1, Math.min(10, normalized)).toFixed(1);
};

export default function HomeScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, BodoniModa_700Bold });

  const [diningHalls, setDiningHalls] = useState([]);
  const [diningPoints, setDiningPoints] = useState([]); 
  const [pulse, setPulse] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // --- TIME STATE ---
  const [viewingTime, setViewingTime] = useState(new Date()); 
  const [selectedMeal, setSelectedMeal] = useState(getMealForTime(new Date()));
  const [showPicker, setShowPicker] = useState(false);
  const [isManualTime, setIsManualTime] = useState(true); 

  // Helper to fetch location name for Pulse items
  const enrichPulseData = async (pulseSnapshot) => {
      const enriched = await Promise.all(pulseSnapshot.docs.map(async (dishDoc) => {
          const dishData = dishDoc.data();
          const parentId = dishDoc.ref.parent.parent?.id;
          const parentCollection = dishDoc.ref.parent.parent?.parent.id;
          
          let locationName = "Unknown Location";
          
          // Try to get location name from parent doc
          if (parentId && parentCollection) {
              if (dishData.locationName) {
                  locationName = dishData.locationName;
              } else {
                  const parentDoc = await getDoc(doc(db, parentCollection, parentId));
                  if (parentDoc.exists()) {
                      locationName = parentDoc.data().name;
                  }
              }
          }

          return {
              id: dishDoc.id,
              ...dishData,
              parentId,
              parentCollection,
              locationName 
          };
      }));
      return enriched;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const hallsSnapshot = await getDocs(collection(db, 'diningHalls'));
      setDiningHalls(hallsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const pointsSnapshot = await getDocs(collection(db, 'diningPoints'));
      setDiningPoints(pointsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const pulseQuery = query(collectionGroup(db, 'dishes'), orderBy('score', 'desc'), limit(150));
      const pulseSnapshot = await getDocs(pulseQuery);
      
      const pulseList = await enrichPulseData(pulseSnapshot);
      setPulse(pulseList);

    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onTimeChange = (event, selectedDate) => {
      setShowPicker(Platform.OS === 'ios'); 
      if (selectedDate) {
          setViewingTime(selectedDate);
          setSelectedMeal(getMealForTime(selectedDate));
          setIsManualTime(true); 
      }
  };

  const handleMealPress = (meal) => {
      setSelectedMeal(meal);
      const newTime = new Date();
      newTime.setHours(MEAL_DEFAULT_TIMES[meal], 0, 0, 0);
      setViewingTime(newTime);
      setIsManualTime(false); 
  };

  const filterDishes = (dishes) => {
      const currentMinutes = viewingTime.getHours() * 60 + viewingTime.getMinutes();

      return dishes.filter(dish => {
          if (!dish.mealsServed) return true; 

          return dish.mealsServed.some(m => {
              const nameMatch = (m.name === selectedMeal) || 
                                (selectedMeal === "Lunch" && m.name === "Late Lunch");
              if (!nameMatch) return false;

              if (m.startTime && m.endTime) {
                  const [startH, startM] = m.startTime.split(':').map(Number);
                  const [endH, endM] = m.endTime.split(':').map(Number);
                  const startMinutes = startH * 60 + startM;
                  const endMinutes = endH * 60 + endM;
                  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
              }
              return true; 
          });
      });
  };

  const currentPulseList = filterDishes(pulse).slice(0, 5); 

  const openHoursWebsite = () => {
      Linking.openURL('https://dining.purdue.edu/menus/index.html');
  };

  if (!fontsLoaded) return null;

  const renderPulseItem = (item, index) => {
    const isHall = item.category === 'diningHall';
    const locationType = isHall ? "Dining Hall" : "Retail";
    
    return (
        <TouchableOpacity 
            key={item.id} 
            style={styles.card}
            onPress={() => navigation.navigate('Dish', {
                dishId: item.id,
                diningHallId: item.parentId,
                collectionName: item.parentCollection
            })}
        >
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            {/* Explicit Location Name + Type */}
            <Text style={styles.cardLocation}>
               at <Text style={{fontFamily: 'Inter_600SemiBold'}}>{item.locationName || "Unknown"}</Text> • {locationType}
            </Text>
          </View>
          
          <View style={styles.scoreChip}>
             <Text style={styles.scoreText}>{normalizeScoreGlobal(item.score)}</Text>
          </View>
        </TouchableOpacity>
    );
  };

  const renderLocation = ({ item }) => (
    <TouchableOpacity
      style={styles.locationCard}
      onPress={() => navigation.navigate('DiningHall', {
        diningHallId: item.id,
        name: item.name,
        collectionName: item.type === 'diningHall' ? 'diningHalls' : 'diningPoints' 
      })}
    >
      <View style={styles.locationInfo}>
        <Text style={styles.locationTitle}>{item.name}</Text>
        <Text style={styles.locationSubtitle}>{item.location || "Purdue Campus"}</Text>
      </View>
      <ChevronRight size={20} color="#EAEAEA" />
    </TouchableOpacity>
  );

  const formattedTime = viewingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        <View style={styles.topControls}>
            <TouchableOpacity style={styles.reviewButton} onPress={() => navigation.navigate('Review')}>
                <PlusCircle color="#FFFFFF" size={20} />
                <Text style={styles.reviewButtonText}>Review a New Dish</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.menuHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Current Menu</Text>
            
            <View style={styles.utilityButtons}>
                <TouchableOpacity 
                    style={[styles.timeButton, !isManualTime && styles.timeButtonDisabled]} 
                    onPress={() => {
                        setIsManualTime(true);
                        setShowPicker(true);
                    }}
                >
                    <Clock size={14} color={isManualTime ? "#007A7A" : "#7D7D7D"} />
                    <Text style={[styles.timeButtonText, !isManualTime && styles.timeTextDisabled]}>
                        Time: <Text style={{fontWeight: 'bold'}}>{formattedTime}</Text>
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.hoursButton} onPress={openHoursWebsite}>
                    <Text style={styles.hoursText}>View Hours</Text>
                </TouchableOpacity>
            </View>
        </View>

        {showPicker && (
            <DateTimePicker
                value={viewingTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={onTimeChange}
            />
        )}

        <View style={styles.mealTabContainer}>
            {MEALS.map(meal => (
                <TouchableOpacity 
                    key={meal} 
                    style={[styles.mealTab, selectedMeal === meal && styles.mealTabActive]}
                    onPress={() => handleMealPress(meal)}
                >
                    <Text style={[styles.mealTabText, selectedMeal === meal && styles.mealTabTextActive]}>
                        {meal}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        <Text style={styles.pulseHeader}>Top Rated for {selectedMeal}</Text>
        
        {loading ? (
            <ActivityIndicator size="small" color="#F47121" style={{marginTop: 20}} />
        ) : currentPulseList.length > 0 ? (
            currentPulseList.map((item, index) => renderPulseItem(item, index))
        ) : (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nothing currently open/rated.</Text>
                <Text style={styles.emptySubText}>Try changing the time or meal tab!</Text>
            </View>
        )}

        {/* --- DINING HALLS SECTION (With Margins) --- */}
        <View style={styles.locationSection}>
            <Text style={styles.sectionHeaderTitle}>Dining Halls</Text>
            <FlatList
                data={diningHalls}
                renderItem={renderLocation}
                keyExtractor={item => item.id}
                scrollEnabled={false} 
            />
        </View>

        {/* --- DINING POINTS SECTION (With Margins) --- */}
        <View style={styles.locationSection}>
            <Text style={styles.sectionHeaderTitle}>Dining Points</Text>
            <FlatList
                data={diningPoints}
                renderItem={renderLocation}
                keyExtractor={item => item.id}
                scrollEnabled={false} 
            />
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  container: { flex: 1 },
  topControls: { paddingHorizontal: 20, marginTop: 10, marginBottom: 5 },
  
  reviewButton: {
    backgroundColor: '#F47121', 
    paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    shadowColor: '#F47121', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
  },
  reviewButtonText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF', marginLeft: 8 },

  menuHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
  sectionHeaderTitle: { fontFamily: 'BodoniModa_700Bold', fontSize: 24, color: '#4E4A40' },
  utilityButtons: { flexDirection: 'column', alignItems: 'flex-end', gap: 5 },
  
  timeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  timeButtonDisabled: { backgroundColor: '#EAEAEA' }, 
  timeButtonText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#007A7A', marginLeft: 6 },
  timeTextDisabled: { color: '#7D7D7D' },

  hoursButton: { paddingVertical: 4 },
  hoursText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#7D7D7D', textDecorationLine: 'underline' },

  mealTabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 8 },
  mealTab: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEAEA' },
  mealTabActive: { backgroundColor: '#007A7A', borderColor: '#007A7A' },
  mealTabText: { fontFamily: 'Inter_600SemiBold', color: '#7D7D7D', fontSize: 13 },
  mealTabTextActive: { color: '#FFFFFF', fontFamily: 'Inter_700Bold' },

  pulseHeader: { fontFamily: 'BodoniModa_700Bold', fontSize: 20, color: '#F47121', paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },

  card: { backgroundColor: '#FFFFFF', padding: 16, marginVertical: 6, borderRadius: 16, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFBF8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankText: { fontFamily: 'BodoniModa_700Bold', fontSize: 18, color: '#F47121' },
  cardContent: { flex: 1 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#4E4A40', marginBottom: 4 },
  cardLocation: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#7D7D7D' },
  scoreChip: { backgroundColor: '#E0F2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  scoreText: { fontFamily: 'BodoniModa_700Bold', fontSize: 16, color: '#007A7A' },

  // --- LOCATION SECTIONS with Spacing ---
  locationSection: { marginTop: 15, marginBottom: 10 },
  
  locationCard: { backgroundColor: '#FFFFFF', padding: 20, marginVertical: 6, borderRadius: 16, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  locationInfo: { flex: 1 },
  locationTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#4E4A40' },
  locationSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#7D7D7D', marginTop: 2 },

  emptyContainer: { alignItems: 'center', marginTop: 20, marginBottom: 30, padding: 20, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', borderStyle: 'dashed' },
  emptyText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#7D7D7D' },
  emptySubText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#007A7A', marginTop: 4 },
});