import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    limit, 
    doc, 
    setDoc, 
    Timestamp,
    runTransaction,
    updateDoc,
    collectionGroup, 
    getDoc as firestoreGetDoc
} from 'firebase/firestore';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';

const SCORE_INCREMENT = 50; 

// Utility function to get user's preferences
const fetchUserComparisons = async (userId) => {
    if (!userId) return {};
    try {
        const comparisonsRef = collection(db, 'users', userId, 'comparisons');
        const snapshot = await getDocs(comparisonsRef);
        const comparedPairs = {};
        snapshot.docs.forEach(doc => {
            comparedPairs[doc.id] = true;
        });
        return comparedPairs;
    } catch (error) {
        console.error("Error fetching user comparisons:", error);
        return {};
    }
};

// Utility function to get all available dishes
const fetchAllDishes = async () => {
    try {
        const dishesRef = collectionGroup(db, 'dishes');
        // Query dishes that have been initialized with a score (score >= 0)
        const q = query(dishesRef, where('score', '>=', 0)); 
        const snapshot = await getDocs(q);

        const dishes = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            score: doc.data().score || 1000, 
            dishPath: doc.ref.path,
            parentId: doc.ref.parent.parent.id, 
            parentCollection: doc.ref.parent.parent.parent.id, 
        }));
        
        return dishes;
    } catch (error) {
        console.error("Error fetching all dishes:", error);
        return [];
    }
};

export default function ComparisonScreen({ navigation, route }) {
    let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, BodoniModa_700Bold });
    
    // Check for params from CustomReviewScreen
    const { 
        dishId, 
        dishName, 
        diningHallId, 
        collectionName, 
        dishCategory, 
        initialScore,
        note,
        tags
    } = route.params || {};

    const [dishes, setDishes] = useState([]);
    const [dishA, setDishA] = useState(null);
    const [dishB, setDishB] = useState(null);
    const [loading, setLoading] = useState(true);
    const userId = auth.currentUser?.uid;

    const loadNewPair = async (allDishes, excludedPairs, isInitialLoad = false) => {
        if (allDishes.length < 2) {
            setLoading(false);
            Alert.alert("Needs More Data", "Please compare dishes from at least two different dishes to start ranking.");
            return;
        }

        const hasBeenCompared = (idA, idB) => {
            const pairKey1 = [idA, idB].sort().join('_');
            return excludedPairs[pairKey1];
        };

        let pairFound = false;
        let attempts = 0;
        
        while (!pairFound && attempts < 50) {
            const indexA = Math.floor(Math.random() * allDishes.length);
            let indexB = Math.floor(Math.random() * allDishes.length);
            
            // Ensure A and B are different
            while (indexB === indexA) {
                indexB = Math.floor(Math.random() * allDishes.length);
            }

            const potentialA = allDishes[indexA];
            const potentialB = allDishes[indexB];

            if (!hasBeenCompared(potentialA.id, potentialB.id)) {
                // If it's the initial load from a review, ensure one of the dishes is the one just reviewed
                if (isInitialLoad) {
                    if (potentialA.id === dishId) {
                         setDishA(potentialA);
                         setDishB(potentialB);
                         pairFound = true;
                    } else if (potentialB.id === dishId) {
                         setDishA(potentialB); // Ensure the new dish is A
                         setDishB(potentialA);
                         pairFound = true;
                    }
                } else {
                    setDishA(potentialA);
                    setDishB(potentialB);
                    pairFound = true;
                }
            }
            attempts++;
        }

        if (!pairFound) {
            setDishA(null);
            setDishB(null);
        }
        setLoading(false);
    };

    // --- NEW: Function to save initial review data ---
    const saveInitialReviewAndStart = async () => {
        if (!dishId || !initialScore || !userId) {
            Alert.alert("Error", "Missing initial review data.");
            setLoading(false);
            return;
        }

        try {
            const dishRef = doc(db, collectionName, diningHallId, 'dishes', dishId);
            
            await runTransaction(db, async (transaction) => {
                const dishDoc = await transaction.get(dishRef);

                if (dishDoc.exists() && dishDoc.data().score) {
                    // Score already exists, treat this as a standard load
                    return; 
                }
                
                // 1. Initialize the score for the dish being reviewed
                transaction.set(dishRef, { 
                    score: initialScore,
                    lastReviewed: Timestamp.now(),
                    // Ensure core fields are present if this is the very first entry
                    name: dishName,
                    category: dishCategory,
                    averageRating: initialScore/250, // Arbitrary conversion for compatibility
                    totalRatings: 1,
                }, { merge: true });

                // 2. Log the detailed review
                await addDoc(collection(db, 'reviews'), {
                    userId: userId,
                    dishId: dishId,
                    dishName: dishName,
                    initialScore: initialScore,
                    note: note,
                    tags: tags,
                    createdAt: Timestamp.now()
                });
            });

            // Re-fetch everything after the transaction
            const [allDishes, excludedPairs] = await Promise.all([
                fetchAllDishes(),
                fetchUserComparisons(userId)
            ]);
            setDishes(allDishes);
            loadNewPair(allDishes, excludedPairs, true); // True marks this as initial load

        } catch (error) {
            console.error("Error saving initial review:", error);
            Alert.alert("Error", "Failed to save initial review and load comparisons.");
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) return;

        // Check if this is the first load from a review submission (via route.params)
        if (initialScore && dishId) {
            saveInitialReviewAndStart();
        } else {
            // Standard loading path (e.g., user clicked My List tab)
            const initializeComparison = async () => {
                setLoading(true);
                const [allDishes, excludedPairs] = await Promise.all([
                    fetchAllDishes(),
                    fetchUserComparisons(userId)
                ]);
                setDishes(allDishes);
                loadNewPair(allDishes, excludedPairs, false);
            };
            initializeComparison();
        }
    }, [userId]);

    // --- CORE ELO LOGIC (Comparison click) ---
    const recordPreference = async (winner, loser) => {
        const dishRefA = doc(db, dishes.find(d => d.id === dishA.id).dishPath);
        const dishRefB = doc(db, dishes.find(d => d.id === dishB.id).dishPath);
        
        // 1. Record the preference for this user (so they don't see it again)
        const comparisonKey = [dishA.id, dishB.id].sort().join('_');
        await setDoc(doc(db, 'users', userId, 'comparisons', comparisonKey), {
            winnerId: winner.id,
            loserId: loser.id,
            timestamp: Timestamp.now()
        });

        // 2. Update the public ELO scores using a transaction
        try {
            await runTransaction(db, async (transaction) => {
                const winnerDoc = await transaction.get(winner.dishPath.includes(dishA.id) ? dishRefA : dishRefB);
                const loserDoc = await transaction.get(loser.dishPath.includes(dishB.id) ? dishRefB : dishRefA);

                if (!winnerDoc.exists() || !loserDoc.exists()) {
                    throw new Error("Dish document not found during transaction.");
                }

                // ELO Calculation (Simplified)
                const scoreWinner = winnerDoc.data().score || 1000;
                const scoreLoser = loserDoc.data().score || 1000;
                
                const expectedScoreWinner = 1 / (1 + Math.pow(10, (scoreLoser - scoreWinner) / 400));
                const expectedScoreLoser = 1 / (1 + Math.pow(10, (scoreWinner - scoreLoser) / 400));

                const newScoreWinner = scoreWinner + SCORE_INCREMENT * (1 - expectedScoreWinner);
                const newScoreLoser = scoreLoser + SCORE_INCREMENT * (0 - expectedScoreLoser);

                // Update the public dish documents
                transaction.update(winnerDoc.ref, { score: newScoreWinner });
                transaction.update(loserDoc.ref, { score: newScoreLoser });
            });

            // Update local dish scores for the next comparison
            const updatedDishes = dishes.map(d => {
                if (d.id === winner.id) return { ...d, score: newScoreWinner };
                if (d.id === loser.id) return { ...d, score: newScoreLoser };
                return d;
            });
            setDishes(updatedDishes);
            
            const newExcludedPairs = await fetchUserComparisons(userId);
            loadNewPair(updatedDishes, newExcludedPairs, false); // Not initial load

        } catch (error) {
            console.error("Transaction failed: ", error);
            Alert.alert("Error", "Could not record preference.");
        }
    };
    // --- END CORE ELO LOGIC ---


    if (!fontsLoaded || loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color="#F47121" />
                    <Text style={styles.loading}>Finding dishes to compare...</Text>
                    {/* Add Debugging Information for you */}
                    {!loading && dishes.length < 2 && (
                        <Text style={styles.debugText}>Found {dishes.length} dishes. Need at least 2 to start.</Text>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    if (!dishA || !dishB) {
        return <SafeAreaView style={styles.safeArea}><Text style={styles.loading}>You've compared everything, or we couldn't find a pair!</Text></SafeAreaView>;
    }

    // Determine the source location for display
    const locationA = dishA.parentCollection === 'diningHalls' ? 'Dining Hall' : 'Dining Points';
    const locationB = dishB.parentCollection === 'diningHalls' ? 'Dining Hall' : 'Dining Points';


    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>Apero: Which is better?</Text>

                <View style={styles.cardContainer}>
                    {/* Dish A */}
                    <TouchableOpacity
                        style={styles.dishButton}
                        onPress={() => recordPreference(dishA, dishB)}
                    >
                        <Text style={styles.dishName}>{dishA.name}</Text>
                        <Text style={styles.dishSource}>{locationA}</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>OR</Text>

                    {/* Dish B */}
                    <TouchableOpacity
                        style={styles.dishButton}
                        onPress={() => recordPreference(dishB, dishA)}
                    >
                        <Text style={styles.dishName}>{dishB.name}</Text>
                        <Text style={styles.dishSource}>{locationB}</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Skip Button */}
                <TouchableOpacity 
                    style={styles.skipButton} 
                    onPress={() => loadNewPair(dishes, {[dishA.id + '_' + dishB.id]: true})}
                >
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>

                {/* Score Display (for debugging/development) */}
                <View style={styles.scoreDebug}>
                    <Text style={styles.scoreText}>A Score: {Math.round(dishA.score)}</Text>
                    <Text style={styles.scoreText}>B Score: {Math.round(dishB.score)}</Text>
                    <Text style={styles.debugText}>Total Dishes: {dishes.length}</Text>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
    container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
    loading: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: '#4E4A40', textAlign: 'center', marginTop: 15 },
    debugText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#F47121', textAlign: 'center', marginTop: 5 },
    header: {
        fontFamily: 'BodoniModa_700Bold', 
        fontSize: 32, 
        color: '#F47121', 
        marginBottom: 40,
        textAlign: 'center',
    },
    cardContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
    },
    dishButton: {
        backgroundColor: '#FFFFFF',
        width: '45%',
        height: 180,
        padding: 15,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#EAEAEA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    dishName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        color: '#4E4A40',
        textAlign: 'center',
        marginBottom: 5,
    },
    dishSource: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#7D7D7D',
        textAlign: 'center',
    },
    orText: {
        fontFamily: 'BodoniModa_700Bold',
        fontSize: 28,
        color: '#007A7A', 
    },
    skipButton: {
        marginTop: 20,
        padding: 10,
    },
    skipText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#7D7D7D',
        textDecorationLine: 'underline',
    },
    scoreDebug: {
        marginTop: 'auto', 
        padding: 10,
        backgroundColor: '#FFFBF8',
        borderRadius: 8,
        alignItems: 'center',
    },
    scoreText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#4E4A40',
    }
});