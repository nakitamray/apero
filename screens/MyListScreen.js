import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { db, auth } from '../firebaseConfig';
import { collectionGroup, query, orderBy, getDocs } from 'firebase/firestore';
import { ChefHat, PlusCircle } from 'lucide-react-native'; // <-- NEW ICON

// --- HELPER FUNCTION: Normalize ELO score to 1-10 range ---
const normalizeScore = (score, minScore, maxScore) => {
    if (maxScore === minScore) return 5.0; 
    const normalized = 1 + 9 * ((score - minScore) / (maxScore - minScore));
    if (normalized < 1.0) return 1.0;
    if (normalized > 10.0) return 10.0;
    return normalized.toFixed(1);
};

// --- NEW COMPONENT FOR RANKED ITEM ---
const RankedItem = ({ item, index, minScore, maxScore }) => {
    const displayScore = minScore !== undefined 
        ? normalizeScore(item.score, minScore, maxScore) 
        : (Math.round(item.score / 100)).toFixed(1); 
    
    // Determine the location label
    const locationLabel = item.category === 'diningHall' ? 'Dining Hall' : 'Dining Points';
        
    return (
        <View style={listStyles.card}>
            {/* 1. Rank Number (Left) */}
            <Text style={listStyles.rankText}>#{index + 1}</Text>
            
            {/* 2. Dish Name and Location (Center) */}
            <View style={listStyles.cardContent}>
                <Text style={listStyles.cardTitle}>{item.name}</Text>
                <Text style={listStyles.cardLocation}>{locationLabel}</Text> 
            </View>
            
            {/* 3. Score (Right, Big, Blue Highlight) */}
            <View style={listStyles.scoreChip}>
                <Text style={listStyles.scoreNumber}>{displayScore}</Text>
                <Text style={listStyles.scoreMax}>/ 10</Text>
            </View>
        </View>
    );
};

export default function MyListScreen({ navigation }) {
    let [fontsLoaded] = useFonts({ BodoniModa_700Bold, Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
    const [rankedDishes, setRankedDishes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRankedList = async () => {
        if (!auth.currentUser) return;
        
        setLoading(true);
        try {
            const dishesRef = collectionGroup(db, 'dishes');
            const q = query(
                dishesRef, 
                orderBy('score', 'desc')
            );
            
            const snapshot = await getDocs(q);
            const list = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(dish => dish.score > 0); 

            setRankedDishes(list);

        } catch (error) {
            console.error("Error fetching ranked list: ", error);
        }
        setLoading(false);
    };

    const { minScore, maxScore } = useMemo(() => {
        if (rankedDishes.length === 0) return { minScore: undefined, maxScore: undefined };

        const scores = rankedDishes.map(d => d.score);
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        
        if (min === max) {
            return { minScore: max - 100, maxScore: max + 100 }; 
        }
        
        return { minScore: min, maxScore: max };
    }, [rankedDishes]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRankedList();
        });
        fetchRankedList();
        return unsubscribe;
    }, [navigation]);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomHeader />
            <ScrollView 
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchRankedList} />
                }
            >
                <Text style={styles.headerTitle}>My List</Text>
                <Text style={styles.subHeader}>Your personal ranked dining profile (Pull down to refresh)</Text>

                {/* --- Ranking Button (Leads to Comparison) --- */}
                <TouchableOpacity 
                    style={styles.rankButton} 
                    onPress={() => navigation.navigate('Comparison')}
                >
                    <ChefHat color="#FFFFFF" size={18} />
                    <Text style={styles.rankButtonText}>Start Apero Ranking</Text>
                </TouchableOpacity>
                
                {/* --- NEW: Manual Review/Search Button --- */}
                <TouchableOpacity 
                    style={styles.reviewButton} 
                    onPress={() => navigation.navigate('Review', { screen: 'SearchScreen' })}
                >
                    <PlusCircle color="#007A7A" size={18} />
                    <Text style={styles.reviewButtonText}>Add New Review</Text>
                </TouchableOpacity>

                {rankedDishes.length === 0 && !loading && (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>
                            Your list is currently empty. Tap 'Start Apero Ranking' or 'Add New Review' to build your profile!
                        </Text>
                    </View>
                )}
                
                <FlatList
                    data={rankedDishes}
                    renderItem={({ item, index }) => 
                        <RankedItem 
                            item={item} 
                            index={index} 
                            minScore={minScore} 
                            maxScore={maxScore} 
                        />}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 50 }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

// --- List Item Styles (Card Redesign) ---
const listStyles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF', 
        padding: 20, 
        marginVertical: 8, 
        borderRadius: 12,
        marginHorizontal: 20,
        flexDirection: 'row', 
        alignItems: 'center', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    rankText: { 
        fontFamily: 'BodoniModa_700Bold', 
        fontSize: 24, 
        color: '#F47121', // Orange Spritz
        marginRight: 15,
        width: 45, // Fixed width for alignment
        textAlign: 'right', 
    },
    cardContent: {
        flex: 1, // Takes up remaining space
        justifyContent: 'center',
    },
    cardTitle: { 
        fontFamily: 'Inter_600SemiBold', 
        fontSize: 18, 
        color: '#4E4A40' 
    },
    cardLocation: { 
        fontFamily: 'Inter_400Regular', 
        fontSize: 13, 
        color: '#007A7A', // Blue Accent
        marginTop: 2,
    },
    // --- Score Chip Styles ---
    scoreChip: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginLeft: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#FFFBF8', // Light cream background
    },
    scoreNumber: {
        fontFamily: 'BodoniModa_700Bold', // Final Font Fix
        fontSize: 28, 
        color: '#007A7A', // Blue Accent Highlight
        lineHeight: 28, 
    },
    scoreMax: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#7D7D7D', // Stone Gray
        marginLeft: 2,
        marginBottom: 2, 
    }
});

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
    container: { flex: 1 },
    headerTitle: { fontFamily: 'BodoniModa_700Bold', fontSize: 28, color: '#4E4A40', textAlign: 'center', marginTop: 20 },
    subHeader: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7D7D7D', marginTop: 10, textAlign: 'center', paddingHorizontal: 20, marginBottom: 20 },
    
    // Primary Orange Ranking Button
    rankButton: {
        backgroundColor: '#F47121', 
        marginHorizontal: 20,
        padding: 15, 
        borderRadius: 12, 
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10, // Reduced margin
        shadowColor: '#F47121',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    rankButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 10,
    },
    // Secondary Blue Review Button
    reviewButton: {
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 20,
        padding: 15, 
        borderRadius: 12, 
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20, // Final margin for the group
        borderWidth: 2,
        borderColor: '#EAEAEA',
    },
    reviewButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#007A7A',
        marginLeft: 10,
    },
    placeholderContainer: {
        padding: 40,
        alignItems: 'center',
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    placeholderText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#7D7D7D',
        textAlign: 'center',
    }
});