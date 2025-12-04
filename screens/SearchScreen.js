import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Search, ChevronLeft, MapPin, Plus } from 'lucide-react-native';

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
    const [loading, setLoading] = useState(false);

    // --- SEARCH LOGIC (GLOBAL) ---
    const handleSearch = async (text) => {
        setSearchTerm(text);
        if (text.length < 2) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        const lowerText = text.toLowerCase();
        
        try {
            // We now search the 'globalDishes' collection (The History Master List)
            let q;
            
            // Strategy: Search generic global dishes first
            // We use a simple prefix search here. 
            // Note: Firestore is case-sensitive. For a real app, you'd store a 'lowercaseName' field.
            // For this prototype, we assume the input matches the casing or we rely on the client-side filter 
            // if we pull a broader list. 
            // To fix case-sensitivity simply, we will just pull dishes and filter in JS for this demo 
            // (since our dataset is < 5000 items, it's okay for a prototype, but 'where' is better).
            
            q = query(
                collection(db, 'globalDishes'),
                where('name', '>=', text),
                where('name', '<=', text + '\uf8ff'),
                limit(20)
            );
            
            const snapshot = await getDocs(q);
            let results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side location filter (if specific hall selected)
            if (selectedHall !== 'all') {
                results = results.filter(dish => 
                    dish.locations && dish.locations.includes(selectedHall)
                );
            }
            
            setSearchResults(results);
            
        } catch (error) {
            console.error("Search Error:", error);
        }
        setLoading(false);
    };

    const navigateToReview = (dish) => {
        // We pass the GLOBAL dish ID so reviews count toward the master score
        navigation.navigate('CustomReview', {
            dishId: dish.id,
            dishName: dish.name,
            collectionName: 'globalDishes', 
            diningHallId: 'global', // Placeholder since it's a global dish
            dishCategory: dish.category || 'diningHall',
            locationName: selectedHall === 'all' ? (dish.locations ? dish.locations[0] : 'Campus') : selectedHall
        });
    };

    const renderHallItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.hallChip,
                selectedHall === item.id && styles.hallChipActive
            ]}
            onPress={() => {
                setSelectedHall(item.id);
                if (searchTerm.length >= 2) handleSearch(searchTerm);
            }}
        >
            <Text style={[
                styles.hallChipText,
                selectedHall === item.id && styles.hallChipTextActive
            ]}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderDishItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigateToReview(item)}>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardLocation}>
                    {/* Show where it's usually found */}
                    {item.locations ? item.locations.join(', ') : "Various Locations"}
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
                            onChangeText={handleSearch}
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
                        keyExtractor={(item, index) => item.id + index}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                {searchTerm.length > 1 ? (
                                    <>
                                        <Text style={styles.emptyText}>Dish not found in history?</Text>
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
        backgroundColor: '#F47121', // Orange
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