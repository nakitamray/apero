import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import CustomHeader from '../components/CustomHeader'; // <-- 1. IMPORT
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';

export default function ProfileScreen() {
  let [fontsLoaded] = useFonts({ BodoniModa_700Bold, Inter_400Regular });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader /> {/* <-- 2. USE THE COMPONENT */}
      <View style={styles.container}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.subHeader}>Friends & "Dining Wrapped" coming soon!</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'BodoniModa_700Bold', fontSize: 28, color: '#4E4A40', textAlign: 'center' },
  subHeader: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#7D7D7D', marginTop: 10, textAlign: 'center' }
});