import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ScrollView, Alert } from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Heart, Smile, Frown } from 'lucide-react-native';

// --- NEW SCORING LOGIC ---
const SCORE_RANGES = {
    // Starting ELO score range based on the user's initial feeling (1000 is base)
    LOVE: { base: 1000, min: 1050, max: 1200 }, // High initial score
    MID: { base: 1000, min: 900, max: 1049 }, // Near base score
    BAD: { base: 1000, min: 700, max: 899 }, // Low initial score
};

const WHY_TAGS = [
    { key: 'taste', label: 'Amazing Flavor', emoji: '😋' },
    { key: 'value', label: 'Great Value', emoji: '💸' },
    { key: 'portion', label: 'Big Portion', emoji: '🍔' },
    { key: 'texture', label: 'Perfect Texture', emoji: '🤤' },
    { key: 'ambience', label: 'Nice Spot', emoji: '✨' },
    { key: 'fresh', label: 'Super Fresh', emoji: '🌱' },
];

export default function CustomReviewScreen({ route, navigation }) {
    let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

    const { dishId, dishName, diningHallId, collectionName, dishCategory } = route.params;

    const [feeling, setFeeling] = useState(null); // 'LOVE', 'MID', 'BAD'
    const [selectedWhyTags, setSelectedWhyTags] = useState([]);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Function to calculate a random score within the feeling's range
    const generateInitialScore = (feelingKey) => {
        const range = SCORE_RANGES[feelingKey];
        if (!range) return 1000;
        // Generate a random number between min (inclusive) and max (exclusive)
        return Math.floor(Math.random() * (range.max - range.min)) + range.min;
    };

    const toggleTag = (key) => {
        setSelectedWhyTags(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleSubmit = () => {
        if (!feeling) {
            Alert.alert("Hold On!", "Please select how you felt about the dish first.");
            return;
        }

        setIsSubmitting(true);
        
        const initialScore = generateInitialScore(feeling);
        
        // Navigate to Comparison screen, passing the initial score and dish details
        navigation.navigate('Comparison', {
            dishId: dishId,
            dishName: dishName,
            diningHallId: diningHallId,
            collectionName: collectionName,
            dishCategory: dishCategory,
            initialScore: initialScore,
            note: note,
            tags: selectedWhyTags,
        });

        setIsSubmitting(false);
    };

    const MoodButton = ({ mood, icon, label, description }) => (
        <TouchableOpacity
            style={[
                styles.moodButton,
                feeling === mood && styles.moodButtonSelected,
            ]}
            onPress={() => setFeeling(mood)}
            disabled={isSubmitting}
        >
            {React.createElement(icon, { size: 30, color: feeling === mood ? '#FFFFFF' : '#F47121' })}
            <Text style={[styles.moodLabel, feeling === mood && styles.moodLabelSelected]}>{label}</Text>
            <Text style={[styles.moodDescription, feeling === mood && styles.moodDescriptionSelected]}>{description}</Text>
        </TouchableOpacity>
    );

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.dishHeader}>{dishName}</Text>
                
                <Text style={styles.sectionTitle}>1. How did you feel about it?</Text>
                <View style={styles.moodsContainer}>
                    <MoodButton mood="LOVE" icon={Heart} label="Loved It" description="This is going straight to the top." />
                    <MoodButton mood="MID" icon={Smile} label="It was Mid" description="Solid, but not a favorite (yet)." />
                    <MoodButton mood="BAD" icon={Frown} label="Not Good" description="Would avoid it next time." />
                </View>

                <Text style={styles.sectionTitle}>2. Why did you choose that feeling?</Text>
                <View style={styles.tagsContainer}>
                    {WHY_TAGS.map(tag => (
                        <TouchableOpacity
                            key={tag.key}
                            style={[
                                styles.tagButton,
                                selectedWhyTags.includes(tag.key) && styles.tagButtonSelected,
                            ]}
                            onPress={() => toggleTag(tag.key)}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.tagText}>
                                {tag.emoji} {tag.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>3. Add a quick note (Optional)</Text>
                <TextInput
                    style={styles.noteInput}
                    placeholder="E.g., The sauce was perfect, but the noodles were mushy."
                    multiline
                    value={note}
                    onChangeText={setNote}
                    editable={!isSubmitting}
                />

                <TouchableOpacity 
                    style={[styles.submitButton, !feeling && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!feeling || isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? "Generating Rank..." : "Save & Start Comparison"}
                    </Text>
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
    dishHeader: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: '#4E4A40',
        marginBottom: 25,
        textAlign: 'center',
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4E4A40',
        marginTop: 20,
        marginBottom: 10,
    },
    // --- Mood Buttons ---
    moodsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    moodButton: {
        backgroundColor: '#FFFFFF',
        width: '32%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: '#EAEAEA',
    },
    moodButtonSelected: {
        backgroundColor: '#F47121', // Spritz
        borderColor: '#F47121',
    },
    moodLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4E4A40',
        marginTop: 5,
    },
    moodLabelSelected: {
        color: '#FFFFFF',
    },
    moodDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: '#7D7D7D',
        textAlign: 'center',
        marginTop: 2,
    },
    moodDescriptionSelected: {
        color: '#FFFBF8',
    },
    // --- Tags ---
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    tagButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    tagButtonSelected: {
        backgroundColor: '#007A7A', // Canal
        borderColor: '#007A7A',
    },
    tagText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: '#4E4A40',
    },
    // --- Note ---
    noteInput: {
        backgroundColor: '#FFFFFF',
        minHeight: 80,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        textAlignVertical: 'top',
    },
    // --- Submit ---
    submitButton: {
        backgroundColor: '#F47121',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#F47121',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: '#F4a171',
    },
    submitButtonText: {
        fontFamily: 'Inter_600SemiBold',
        color: '#FFFFFF',
        fontSize: 16,
    },
});