import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
// --- FIX: IMPORT AUTH and DB ---
import { db, auth } from '../firebaseConfig'; 
// --- END FIX ---
import { collectionGroup, query, where, getDocs, limit, collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { PlusCircle, Search, ChevronLeft, ChefHat, MapPin } from 'lucide-react-native';

// --- IMPORT MOCK JSON DATA (Using the working relative path) ---
const scrapedData = require('../menu_data.json'); 

// Constants
const LOCATION_TYPES = {
    HALL: 'diningHall',
    POINTS: 'diningPoints',
};
const getCollectionName = (category) => (category === 'diningHall' ? 'diningHalls' : 'diningPoints');

export default function SearchScreen({ navigation }) {
    let [fontsLoaded] = useFonts({ 
        Inter_400Regular, 
        Inter_600SemiBold, 
        Inter_700Bold, 
        BodoniModa_700Bold 
    });
    // This now correctly references the imported 'auth' object
    const userId = auth.currentUser?.uid; 

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // --- Manual Create States ---
    const [manualDishName, setManualDishName] = useState('');
    const [manualLocationName, setManualLocationName] = useState('');
    const [manualLocationType, setManualLocationType] = useState(LOCATION_TYPES.HALL);
    const [isManualSubmitting, setIsManualSubmitting] = useState(false);
    // ---------------------------

    // NEW: Setting up custom header options
    useEffect(() => {
        navigation.setOptions({
            title: 'Apero Review',
            // Custom Back Button with Subtitle Text
            headerLeft: () => (
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.headerLeftContainer}
                >
                    <ChevronLeft size={24} color="#4E4A40" />
                    {/* The text next to the arrow is the name of the screen you are leaving */}
                    <Text style={styles.headerBackText}>Review</Text>
                </TouchableOpacity>
            ),
        }); 
    }, [navigation]);

    const handleSearch = async (text) => {
        setSearchTerm(text);
        if (text.length < 2) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        const lowerText = text.toLowerCase();
        
        let firestoreResults = [];
        try {
            const dishesRef = collectionGroup(db, 'dishes');
            const q = query(
                dishesRef, 
                where('name', '>=', text), 
                where('name', '<=', text + '\uf8ff'),
                limit(5) 
            );
            
            const snapshot = await getDocs(q);
            firestoreResults = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                category: doc.data().category,
                diningHallId: doc.ref.parent.parent.id,
                collectionName: doc.ref.parent.parent.parent.id,
                locationName: doc.data().locationName || 'Unknown Location',
                source: 'firestore',
            }));
            
        } catch (error) {
            console.error("Error during Firestore search:", error);
        }
        
        const firestoreIds = new Set(firestoreResults.map(d => d.id));
        
        const scrapedResults = scrapedData
            .filter(dish => 
                dish.name.toLowerCase().includes(lowerText) && 
                !firestoreIds.has(dish.id) 
            )
            .slice(0, 5)
            .map(dish => ({
                ...dish,
                collectionName: getCollectionName(dish.category),
                source: 'scraped',
            }));
        
        setSearchResults([...firestoreResults, ...scrapedResults]);
        setLoading(false);
    };

    const navigateToReview = (dish) => {
        navigation.navigate('CustomReview', {
            dishId: dish.id,
            dishName: dish.name,
            diningHallId: dish.diningHallId,
            collectionName: dish.collectionName,
            dishCategory: dish.category,
            source: dish.source, 
            tags: dish.tags || [],
            locationName: dish.locationName
        });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigateToReview(item)}>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardLocation}>
                    {item.locationName} ({item.category === 'diningHall' ? 'Dining Hall' : 'Dining Points'})
                </Text>
            </View>
            <View style={styles.chip}>
                <Text style={styles.chipText}>
                    {item.source === 'firestore' ? 'Ranked' : 'New'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    
    // --- MANUAL SUBMISSION LOGIC ---
    const handleManualSubmit = async () => {
        if (!manualDishName.trim() || !manualLocationName.trim() || !manualLocationType) {
            Alert.alert("Missing Info", "Please fill in all fields.");
            return;
        }
        if (!userId) {
            Alert.alert("Error", "User not logged in.");
            return;
        }

        setIsManualSubmitting(true);
        const collectionName = manualLocationType === LOCATION_TYPES.HALL ? 'diningHalls' : 'diningPoints';
        const locationRef = collection(db, collectionName);
        const locationIdKey = manualLocationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const dishIdKey = `${locationIdKey}-${manualDishName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        try {
            let locationDocRef = doc(locationRef, locationIdKey);
            const locationSnap = await getDoc(locationDocRef);

            if (!locationSnap.exists()) {
                await setDoc(locationDocRef, {
                    name: manualLocationName,
                    location: 'User-Added Location', 
                    createdAt: Timestamp.now(),
                }, { merge: true });
            }

            const dishDocRef = doc(locationRef, locationIdKey, 'dishes', dishIdKey);
            const dishSnap = await getDoc(dishDocRef);

            if (dishSnap.exists()) {
                 Alert.alert("Oops!", "This dish already exists in our system. Review the existing entry instead!");
                 setIsManualSubmitting(false);
                 return;
            }

            await setDoc(dishDocRef, {
                name: manualDishName,
                category: manualLocationType,
                score: 1000, 
                averageRating: 5, 
                totalRatings: 0, 
                locationName: manualLocationName,
                createdAt: Timestamp.now(),
            }, { merge: true });

            navigation.navigate('CustomReview', {
                dishId: dishIdKey,
                dishName: manualDishName,
                diningHallId: locationIdKey,
                collectionName: collectionName,
                dishCategory: manualLocationType,
                source: 'manual',
                tags: [],
                locationName: manualLocationName,
            });

        } catch (error) {
            console.error("Error submitting manual dish:", error);
            Alert.alert("Error", "Failed to create dish. Please check the console.");
        } finally {
            setIsManualSubmitting(false);
        }
    };
    // --- END MANUAL SUBMISSION LOGIC ---

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}> 
                <View style={styles.contentWrapper}>
                    {/* --- TITLE/SUBHEADING --- */}
                    <Text style={styles.headerTitle}>Find a Dish to Rank</Text>
                    
                    
                    {/* --- SEARCH INPUT WITH ICON --- */}
                    <View style={styles.inputContainer}>
                        <Search size={20} color="#7D7D7D" style={styles.searchIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="E.g., Popcorn Chicken"
                            value={searchTerm}
                            onChangeText={handleSearch}
                            placeholderTextColor="#7D7D7D"
                        />
                    </View>
                </View>
                
                {/* --- SEARCH RESULTS --- */}
                {loading ? (
                    <ActivityIndicator size="small" color="#F47121" style={styles.loadingIndicator}/>
                ) : (
                    <FlatList
                        data={searchResults}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item.id + index}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={() => searchTerm.length > 1 ? <Text style={styles.listEmptyText}>No search results found.</Text> : null}
                        scrollEnabled={false}
                    />
                )}
                
                {/* --- MANUAL ADD FORM --- */}
                <View style={styles.manualFormContainer}>
                    <Text style={styles.formTitle}>— Quick Add New Dish —</Text>

                    <View style={styles.section}>
                        <Text style={styles.label}>Dish Name</Text>
                        <TextInput
                            style={styles.manualInput}
                            placeholder="E.g., Special Taco Night Burrito"
                            value={manualDishName}
                            onChangeText={setManualDishName}
                            editable={!isManualSubmitting}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Location Name</Text>
                        <TextInput
                            style={styles.manualInput}
                            placeholder="E.g., Windsor Dining Court"
                            value={manualLocationName}
                            onChangeText={setManualLocationName}
                            editable={!isManualSubmitting}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Location Type</Text>
                        <View style={styles.typeContainer}>
                            {/* DINING HALL BUTTON (Active: Blue Accent) */}
                            <TouchableOpacity
                                style={[
                                    styles.typeButton, 
                                    manualLocationType === LOCATION_TYPES.HALL && styles.typeButtonActive
                                ]}
                                onPress={() => setManualLocationType(LOCATION_TYPES.HALL)}
                                disabled={isManualSubmitting}
                            >
                                <ChefHat size={18} color={manualLocationType === LOCATION_TYPES.HALL ? '#FFFFFF' : '#4E4A40'} />
                                <Text style={[styles.typeText, manualLocationType === LOCATION_TYPES.HALL && styles.typeTextActive]}>
                                    Dining Hall
                                </Text>
                            </TouchableOpacity>
                            {/* DINING POINTS BUTTON (Active: Blue Accent) */}
                            <TouchableOpacity
                                style={[
                                    styles.typeButton, 
                                    manualLocationType === LOCATION_TYPES.POINTS && styles.typeButtonActive
                                ]}
                                onPress={() => setManualLocationType(LOCATION_TYPES.POINTS)}
                                disabled={isManualSubmitting}
                            >
                                <MapPin size={18} color={manualLocationType === LOCATION_TYPES.POINTS ? '#FFFFFF' : '#4E4A40'} />
                                <Text style={[styles.typeText, manualLocationType === LOCATION_TYPES.POINTS && styles.typeTextActive]}>
                                    Dining Points
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.createButton, isManualSubmitting && styles.createButtonDisabled]}
                        onPress={handleManualSubmit}
                        disabled={isManualSubmitting}
                    >
                        {isManualSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.createButtonText}>Create Dish & Start Review</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
    
    // --- Header Back Button Styles (For AppNavigator) ---
    headerLeftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    headerBackText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4E4A40',
        marginLeft: 4,
    },
    
    // --- CONTENT WRAPPER / PADDING UNIFICATION ---
    scrollContainer: {
        flexGrow: 1,
        paddingVertical: 10,
    },
    contentWrapper: {
        paddingHorizontal: 20,
    },
    
    // --- TITLES (Unified Style) ---
    headerTitle: {
        fontFamily: 'BodoniModa_700Bold', 
        fontSize: 32, 
        color: '#4E4A40', // Dark Text (NOT ORANGE)
        marginBottom: 5,
        textAlign: 'center',
        marginTop: 30, 
    },
    subHeader: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#7D7D7D',
        marginBottom: 30, 
        textAlign: 'center',
    },
    // --- SEARCH INPUT STYLES ---
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    searchIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#4E4A40',
        paddingVertical: 10,
    },
    // --- SEARCH RESULTS STYLES ---
    loadingIndicator: {
        marginVertical: 20,
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginVertical: 4,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 5,
        borderLeftColor: '#F47121',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4E4A40',
    },
    cardLocation: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#7D7D7D',
        marginTop: 2,
    },
    chip: {
        backgroundColor: '#FAF6F0',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
    },
    chipText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: '#007A7A',
    },
    listEmptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#7D7D7D',
        textAlign: 'center',
        marginTop: 10,
    },
    // --- MANUAL FORM STYLES (COMPACTED & STYLED) ---
    manualFormContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        padding: 20, 
        borderRadius: 15,
        marginTop: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 5,
    },
    formTitle: {
        fontFamily: 'BondoniModa_700Bold',
        fontSize: 20,
        color: '#F47121',
        textAlign: 'center',
        marginBottom: 20, 
        marginTop: 5,
    },
    section: {
        marginBottom: 15, 
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4E4A40',
        marginBottom: 8,
    },
    manualInput: {
        backgroundColor: '#FAF6F0',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#007A7A',
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48%',
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#EAEAEA',
    },
    typeButtonActive: {
        backgroundColor: '#007A7A', // Blue Accent
        borderColor: '#007A7A',
    },
    typeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        marginLeft: 10,
        color: '#4E4A40',
    },
    typeTextActive: {
        color: '#FFFFFF',
    },
    createButton: {
        backgroundColor: '#F47121', // Orange Accent
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20, 
        shadowColor: '#F47121',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 6,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#F4a171',
    },
    createButtonText: {
        fontFamily: 'Inter_700Bold',
        color: '#FFFFFF',
        fontSize: 16,
    },
});