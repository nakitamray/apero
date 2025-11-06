import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { db, auth } from '../firebaseConfig';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { MapPin, ChefHat } from 'lucide-react-native';

const LOCATION_TYPES = {
    HALL: 'diningHall',
    POINTS: 'diningPoints',
};

export default function ManualCreateScreen({ navigation }) {
    let [fontsLoaded] = useFonts({ 
        Inter_400Regular, 
        Inter_600SemiBold, 
        Inter_700Bold,
        BodoniModa_700Bold
    });
    
    const [dishName, setDishName] = useState('');
    const [locationName, setLocationName] = useState('');
    const [locationType, setLocationType] = useState(LOCATION_TYPES.HALL);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const userId = auth.currentUser?.uid;

    const handleSubmit = async () => {
        if (!dishName.trim() || !locationName.trim() || !locationType) {
            Alert.alert("Missing Info", "Please fill in all fields.");
            return;
        }
        if (!userId) {
            Alert.alert("Error", "User not logged in.");
            return;
        }

        setIsSubmitting(true);
        const collectionName = locationType === LOCATION_TYPES.HALL ? 'diningHalls' : 'diningPoints';
        const locationRef = collection(db, collectionName);
        const locationIdKey = locationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const dishIdKey = `${locationIdKey}-${dishName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        try {
            // 1. Check if Location (Hall/Points) exists, create if not
            let locationDocRef = doc(locationRef, locationIdKey);
            const locationSnap = await getDoc(locationDocRef);

            if (!locationSnap.exists()) {
                await setDoc(locationDocRef, {
                    name: locationName,
                    location: 'User-Added Location', 
                    createdAt: Timestamp.now(),
                }, { merge: true });
                console.log(`Created new location: ${locationName}`);
            }

            // 2. Check if Dish exists to prevent duplicates
            const dishDocRef = doc(locationRef, locationIdKey, 'dishes', dishIdKey);
            const dishSnap = await getDoc(dishDocRef);

            if (dishSnap.exists()) {
                 Alert.alert("Oops!", "This dish name already exists in our system. Please try searching for it instead!");
                 setIsSubmitting(false);
                 return;
            }

            // 3. Create the Dish document with initial ELO score
            await setDoc(dishDocRef, {
                name: dishName,
                category: locationType,
                score: 1000, 
                averageRating: 5, // Default for display
                totalRatings: 0, 
                createdAt: Timestamp.now(),
            }, { merge: true });

            // 4. Redirect to CustomReviewScreen with the newly created dish ID
            navigation.navigate('CustomReview', {
                dishId: dishIdKey,
                dishName: dishName,
                diningHallId: locationIdKey,
                collectionName: collectionName,
                dishCategory: locationType,
                source: 'manual',
                tags: [],
                locationName: locationName,
            });

        } catch (error) {
            console.error("Error submitting manual dish:", error);
            Alert.alert("Error", "Failed to create dish. Please check the console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.headerTitle}>Add a New Dish</Text>
                <Text style={styles.subHeader}>
                    Create the entry to start your first Apero review and ranking.
                </Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Dish Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="E.g., Special Taco Night Burrito"
                        value={dishName}
                        onChangeText={setDishName}
                        editable={!isSubmitting}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Location Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="E.g., Windsor Dining Court"
                        value={locationName}
                        onChangeText={setLocationName}
                        editable={!isSubmitting}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Location Type</Text>
                    <View style={styles.typeContainer}>
                        {/* DINING HALL BUTTON (Active: Blue Accent) */}
                        <TouchableOpacity
                            style={[
                                styles.typeButton, 
                                locationType === LOCATION_TYPES.HALL && styles.typeButtonActive
                            ]}
                            onPress={() => setLocationType(LOCATION_TYPES.HALL)}
                            disabled={isSubmitting}
                        >
                            <ChefHat size={18} color={locationType === LOCATION_TYPES.HALL ? '#FFFFFF' : '#4E4A40'} />
                            <Text style={[styles.typeText, locationType === LOCATION_TYPES.HALL && styles.typeTextActive]}>
                                Dining Hall
                            </Text>
                        </TouchableOpacity>
                        {/* DINING POINTS BUTTON (Active: Blue Accent) */}
                        <TouchableOpacity
                            style={[
                                styles.typeButton, 
                                locationType === LOCATION_TYPES.POINTS && styles.typeButtonActive
                            ]}
                            onPress={() => setLocationType(LOCATION_TYPES.POINTS)}
                            disabled={isSubmitting}
                        >
                            <MapPin size={18} color={locationType === LOCATION_TYPES.POINTS ? '#FFFFFF' : '#4E4A40'} />
                            <Text style={[styles.typeText, locationType === LOCATION_TYPES.POINTS && styles.typeTextActive]}>
                                Dining Points
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Create Dish & Start Review</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
    scrollContainer: { 
        padding: 20,
        paddingBottom: 40,
    },
    headerTitle: {
        fontFamily: 'BodoniModa_700Bold', // Elegant Title Font
        fontSize: 32,
        color: '#F47121',
        marginBottom: 5,
        textAlign: 'center',
    },
    subHeader: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#7D7D7D',
        marginBottom: 30,
        textAlign: 'center',
    },
    section: {
        marginBottom: 25,
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4E4A40',
        marginBottom: 10,
    },
    // Standard input style for consistency
    input: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#007A7A', // <-- INPUT TEXT IS NOW BLUE ACCENT
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    // --- Type Toggle Styles ---
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    typeButtonActive: {
        backgroundColor: '#007A7A', // <-- BOTH ACTIVE BUTTONS ARE BLUE ACCENT
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
    // --- Submit Button Style (Using Primary Orange) ---
    submitButton: {
        backgroundColor: '#F47121', // Primary Orange (Spritz)
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#F47121',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5, // Stronger shadow for main action
        shadowRadius: 6,
        elevation: 6,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#F4a171',
    },
    submitButtonText: {
        fontFamily: 'Inter_700Bold',
        color: '#FFFFFF',
        fontSize: 16,
    },
});