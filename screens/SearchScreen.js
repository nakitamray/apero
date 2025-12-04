import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { db } from '../firebaseConfig';
import { collectionGroup, getDocs } from 'firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import { Search, Plus } from 'lucide-react-native';

// Maps ID to the Display Name stored in the 'locations' array in Firestore
const DINING_HALLS = [
    { id: 'all', name: 'All Locations' },
    { id: 'Ford', name: 'Ford' },
    { id: 'Wiley', name: 'Wiley' },
    { id: 'Earhart', name: 'Earhart' },
    { id: 'Hillenbrand', name: 'Hillenbrand' },
    { id: 'Windsor', name: 'Windsor' },
];

export default function SearchScreen({ navigation }) {
    let [fontsLoaded] = useFonts({ 
        Inter_400Regular, 
        Inter_600SemiBold, 
        Inter_700Bold, 
        BodoniModa_700Bold 
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHall, setSelectedHall] = useState('all');
    const [searchResults, setSearchResults] = useState([]);
    const [allDishes, setAllDishes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch all dishes once on mount
    useEffect(() => {
        fetchAllDishes();
    }, []);

    // Perform search when searchTerm or selectedHall changes
    useEffect(() => {
        handleSearch();
    }, [searchTerm, selectedHall, allDishes]);

    const fetchAllDishes = async () => {
        setLoading(true);
        try {
            const dishesRef = collectionGroup(db, 'dishes');
            const snapshot = await getDocs(dishesRef);
            
            const dishes = snapshot.docs.map(doc => {
                const data = doc.data();
                const parentRef = doc.ref.parent.parent;
                
                return {
                    id: doc.id,
                    name: data.name,
                    category: data.category || 'diningHall',
                    locations: data.locations || [parentRef?.id || 'Unknown'],
                    parentId: parentRef?.id,
                    parentCollection: parentRef?.parent?.id,
                };
            });
            
            setAllDishes(dishes);
        } catch (error) {
            console.error("Error fetching dishes:", error);
        }
        setLoading(false);
    };

    const handleSearch = () => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        
        let filtered = allDishes.filter(dish => 
            dish.name.toLowerCase().includes(lowerSearchTerm)
        );

        // Filter by selected hall if not "all"
        if (selectedHall !== 'all') {
            filtered = filtered.filter(dish => {
                // Check if the dish's locations array includes the selected hall
                if (Array.isArray(dish.locations)) {
                    return dish.locations.some(loc => 
                        loc.toLowerCase().includes(selectedHall.toLowerCase())
                    );
                }
                // Fallback: check if parentId matches
                return dish.parentId?.toLowerCase().includes(selectedHall.toLowerCase());
            });
        }

        setSearchResults(filtered);
    };

    const navigateToReview = (dish) => {
        // Determine the correct collection and parent ID
        const collectionName = dish.parentCollection || 
                               (dish.category === 'diningHall' ? 'diningHalls' : 'diningPoints');
        
        const diningHallId = dish.parentId || 'global';
        
        navigation.navigate('CustomReview', {
            dishId: dish.id,
            dishName: dish.name,
            collectionName: collectionName,
            diningHallId: diningHallId,
            dishCategory: dish.category || 'diningHall',
            locationName: selectedHall === 'all' 
                ? (dish.locations && dish.locations[0] ? dish.locations[0] : 'Campus') 
                : selectedHall
        });
    };

    const renderHallItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.hallChip,
                selectedHall === item.id && styles.hallChipActive
            ]}
            onPress={() => setSelectedHall(item.id)}
        >
            <Text style={[
                styles.hallChipText,
                selectedHall === item.id && styles.hallChipTextActive
            ]}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderDishItem = ({ item, index }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigateToReview(item)}
            key={`${item.id}-${index}`}
        >
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardLocation}>
                    {Array.isArray(item.locations) 
                        ? item.locations.join(', ') 
                        : "Various Locations"}
                </Text>
            </View>
            <View style={styles.actionIcon}>
                <Plus size={20} color="#007A7A" />
            </View>
        </TouchableOpacity>
    );

    if (!fontsLoaded) return null;

    return (
        
        <SafeAreaView style={styles.safeArea}>
            <CustomHeader />
            <View style={styles.container}>
                {/* --- HEADER --- */}
                <Text style={styles.headerTitle}>Find a Dish</Text>
                
                {/* --- HALL SELECTOR --- */}
                <View style={styles.hallSelectorContainer}>
                    <FlatList
                        data={DINING_HALLS}
                        renderItem={renderHallItem}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                    />
                </View>

                {/* --- SEARCH INPUT --- */}
                <View style={styles.searchWrapper}>
                    <View style={styles.inputContainer}>
                        <Search size={20} color="#7D7D7D" style={styles.searchIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={selectedHall === 'all' ? "Type a dish name..." : `Search ${DINING_HALLS.find(h=>h.id===selectedHall)?.name}...`}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            placeholderTextColor="#7D7D7D"
                            autoCorrect={false}
                        />
                    </View>
                </View>

                {/* --- RESULTS LIST --- */}
                {loading ? (
                    <ActivityIndicator size="small" color="#F47121" style={{marginTop: 20}} />
                ) : (
                    <FlatList
                        data={searchResults}
                        renderItem={renderDishItem}
                        keyExtractor={(item, index) => `${item.id}-${item.parentId}-${index}`}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                {searchTerm.length > 1 ? (
                                    <>
                                        <Text style={styles.emptyText}>Dish not found?</Text>
                                        <TouchableOpacity 
                                            style={styles.manualButton}
                                            onPress={() => navigation.navigate('ManualCreate')}
                                        >
                                            <Text style={styles.manualButtonText}>Add "{searchTerm}" Manually</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <Text style={styles.placeholderText}>
                                        Select a location and start typing to find what you ate!
                                    </Text>
                                )}
                            </View>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
    container: { flex: 1 },
    
    headerTitle: {
        fontFamily: 'BodoniModa_700Bold', 
        fontSize: 28, 
        color: '#4E4A40', 
        textAlign: 'center',
        marginTop: 20, 
        marginBottom: 15,
    },

    // Hall Selector
    hallSelectorContainer: {
        height: 50,
        marginBottom: 10,
    },
    hallChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        justifyContent: 'center',
        height: 36,
    },
    hallChipActive: {
        backgroundColor: '#F47121',
        borderColor: '#F47121',
    },
    hallChipText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: '#7D7D7D',
    },
    hallChipTextActive: {
        color: '#FFFFFF',
    },

    // Search Input
    searchWrapper: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
        borderRadius: 12,
        height: 50,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#4E4A40',
    },

    // Results
    listContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
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
        fontSize: 13,
        color: '#7D7D7D',
        marginTop: 2,
    },
    actionIcon: {
        marginLeft: 10,
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4E4A40',
        marginBottom: 10,
    },
    placeholderText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#7D7D7D',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    manualButton: {
        backgroundColor: '#007A7A',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    manualButtonText: {
        fontFamily: 'Inter_700Bold',
        color: '#FFFFFF',
        fontSize: 14,
    }
});