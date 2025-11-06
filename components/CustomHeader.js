import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useFonts } from 'expo-font';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter'; // Use Inter_600SemiBold for a slightly lighter look

export default function CustomHeader() {
  let [fontsLoaded] = useFonts({
    BodoniModa_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const handleLogout = () => {
    signOut(auth).catch((error) => console.log('Error logging out: ', error));
  };

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>apero</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- "THE VENETIAN SPRITZ" PALETTE ---
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FAF6F0', // Background (Sunlight)
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1, // Add a subtle separator
    borderBottomColor: '#EAEAEA', // Light border
  },
  title: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 32,
    color: '#F47121', // Primary Accent (Spritz)
    letterSpacing: 0.5,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold', // Slightly less weight than 700
    fontSize: 15, // Slightly smaller
    color: '#007A7A', // Secondary Accent (Canal)
  },
});