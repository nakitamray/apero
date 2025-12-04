import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    SectionList, 
    TouchableOpacity, 
    StyleSheet, 
    SafeAreaView, 
    ActivityIndicator, 
    Platform,
    Linking 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore'; 
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { Clock, MapPin, ExternalLink } from 'lucide-react-native';

// --- TIME CONSTANTS ---
const MEALS = ["Breakfast", "Lunch", "Dinner"];
const MEAL_DEFAULT_TIMES = { "Breakfast": 9, "Lunch": 13, "Dinner": 18 };

const getMealForTime = (dateObj) => {
    const hour = dateObj.getHours(); 
    if (hour < 11) return "Breakfast";
    if (hour < 16) return "Lunch";
    return "Dinner";
};

export default function DiningHallScreen({ route, navigation }) {
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, BodoniModa_700Bold });

  const { diningHallId, name, collectionName } = route.params; 
  const isRetail = collectionName === 'diningPoints';

  const [rawDishes, setRawDishes] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState({ address: '', hours: '', menuUrl: '' });

  // Time State
  const [viewingTime, setViewingTime] = useState(new Date()); 
  const [selectedMeal, setSelectedMeal] = useState(getMealForTime(new Date()));
  const [showPicker, setShowPicker] = useState(false);
  const [isManualTime, setIsManualTime] = useState(true); 

  useEffect(() => {
    if (name) navigation.setOptions({ title: name });
  }, [name, navigation]);

  // Fetch Location Info
  useEffect(() => {
      const fetchLocationInfo = async () => {
          try {
              const docRef = doc(db, collectionName, diningHallId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                  setLocationInfo(docSnap.data());
              }
          } catch (e) { console.error(e); }
      };
      if (isRetail) fetchLocationInfo();
  }, [diningHallId, collectionName, isRetail]);

  // Fetch Dishes (For Dining Halls)
  useEffect(() => {
    const dishesCollectionRef = collection(db, collectionName, diningHallId, 'dishes');
    const q = query(dishesCollectionRef, orderBy('averageRating', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRawDishes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe(); 
  }, [diningHallId, collectionName]);

  // Filter & Group
  useEffect(() => {
      if (rawDishes.length === 0) {
          setSections([]);
          setLoading(false);
          return;
      }

      let filteredDishes = rawDishes;

      if (!isRetail) {
          const currentMinutes = viewingTime.getHours() * 60 + viewingTime.getMinutes();
          filteredDishes = rawDishes.filter(dish => {
              if (!dish.mealsServed || dish.mealsServed.length === 0) return true; 
              return dish.mealsServed.some(m => {
                  const nameMatch = (m.name === selectedMeal) || (selectedMeal === "Lunch" && m.name === "Late Lunch");
                  if (!nameMatch) return false;
                  if (m.startTime && m.endTime) {
                      const [startH, startM] = m.startTime.split(':').map(Number);
                      const [endH, endM] = m.endTime.split(':').map(Number);
                      const startMin = startH * 60 + startM;
                      const endMin = endH * 60 + endM;
                      return currentMinutes >= startMin && currentMinutes <= endMin;
                  }
                  return true; 
              });
          });
      }

      const grouped = {};
      filteredDishes.forEach(dish => {
        const station = dish.currentStation || "Menu";
        if (!grouped[station]) grouped[station] = [];
        grouped[station].push(dish);
      });

      const sectionData = Object.keys(grouped).sort().map(station => ({
          title: station,
          data: grouped[station]
      }));

      setSections(sectionData);
      setLoading(false);
  }, [rawDishes, viewingTime, selectedMeal, isRetail]);

  // Handlers
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

  const handleOpenMenu = () => {
      // Opens the specific URL scraped from the site
      const url = locationInfo.menuUrl || 'https://dining.purdue.edu/menus/';
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  // Renderers
  const renderDish = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Dish', { dishId: item.id, diningHallId, collectionName })}
    >
      <View style={styles.row}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>
                {item.score ? (item.score > 1000 ? ((item.score - 800) / 60).toFixed(1) : '5.0') : '5.0'}
            </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderHeader = () => {
      if (isRetail) {
          return (
              <View style={styles.retailHeaderContainer}>
                  <View style={styles.retailInfoRow}>
                      <MapPin size={18} color="#F47121" />
                      <Text style={styles.retailInfoText}>
                          {locationInfo.address || "Campus Location"}
                      </Text>
                  </View>
                  <View style={styles.retailInfoRow}>
                      <Clock size={18} color="#007A7A" />
                      <Text style={styles.retailInfoText}>
                          {locationInfo.hours || "Open Today"}
                      </Text>
                  </View>

                  <TouchableOpacity style={styles.menuButton} onPress={handleOpenMenu}>
                      <Text style={styles.menuButtonText}>View Menu Online</Text>
                      <ExternalLink size={16} color="#FFFFFF" style={{marginLeft: 6}} />
                  </TouchableOpacity>
              </View>
          );
      }

      const formattedTime = viewingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return (
          <View style={styles.headerContainer}>
                <View style={styles.timeControlRow}>
                    <Text style={styles.menuLabel}>Menu For:</Text>
                    <View style={styles.utilityButtons}>
                        <TouchableOpacity 
                            style={[styles.timeButton, !isManualTime && styles.timeButtonDisabled]} 
                            onPress={() => { setIsManualTime(true); setShowPicker(true); }}
                        >
                            <Clock size={14} color={isManualTime ? "#007A7A" : "#7D7D7D"} />
                            <Text style={[styles.timeButtonText, !isManualTime && styles.timeTextDisabled]}>{formattedTime}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {showPicker && <DateTimePicker value={viewingTime} mode="time" display="default" onChange={onTimeChange} />}
                <View style={[styles.mealTabContainer, isManualTime && styles.mealTabContainerDisabled]}>
                    {MEALS.map(meal => (
                        <TouchableOpacity 
                            key={meal} 
                            style={[styles.mealTab, (selectedMeal === meal && !isManualTime) && styles.mealTabActive]}
                            onPress={() => handleMealPress(meal)}
                        >
                            <Text style={[styles.mealTabText, (selectedMeal === meal && !isManualTime) && styles.mealTabTextActive]}>{meal}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
          </View>
      );
  };

  if (!fontsLoaded) return null;
  if (loading) return <SafeAreaView style={styles.safeArea}><ActivityIndicator size="large" color="#F47121" style={{marginTop:20}} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        sections={sections}
        ListHeaderComponent={renderHeader}
        renderItem={renderDish}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    {isRetail ? "No reviews yet. Check the menu online!" : "No dishes found for this time."}
                </Text>
            </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  headerContainer: { marginBottom: 10, paddingTop: 5 },
  
  // Retail Header
  retailHeaderContainer: { marginBottom: 15, paddingTop: 5, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  retailInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  retailInfoText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#4E4A40', marginLeft: 10, flex: 1 },
  menuButton: { flexDirection: 'row', backgroundColor: '#F47121', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#F47121', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  menuButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' },

  // Dining Hall Controls
  timeControlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  menuLabel: { fontFamily: 'BodoniModa_700Bold', fontSize: 20, color: '#4E4A40' },
  utilityButtons: { flexDirection: 'row', alignItems: 'center' },
  timeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  timeButtonDisabled: { backgroundColor: '#EAEAEA' }, 
  timeButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#007A7A', marginLeft: 6 },
  timeTextDisabled: { color: '#7D7D7D' },
  mealTabContainer: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  mealTabContainerDisabled: { opacity: 0.4 },
  mealTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEAEA' },
  mealTabActive: { backgroundColor: '#007A7A', borderColor: '#007A7A' },
  mealTabText: { fontFamily: 'Inter_600SemiBold', color: '#7D7D7D', fontSize: 13 },
  mealTabTextActive: { color: '#FFFFFF', fontFamily: 'Inter_700Bold' },
  sectionHeader: { marginTop: 15, marginBottom: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#E0F2F2' },
  sectionHeaderText: { fontFamily: 'BodoniModa_700Bold', fontSize: 20, color: '#F47121' },
  card: { backgroundColor: '#FFFFFF', padding: 15, marginBottom: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#4E4A40', flex: 1, marginRight: 10 },
  ratingBadge: { backgroundColor: '#E0F2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#007A7A' },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter_400Regular', color: '#7D7D7D' }
});