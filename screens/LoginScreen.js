import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView, // Makes sure keyboard doesn't cover inputs
  Platform, // For OS-specific behavior
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

// --- FONT IMPORTS ---
import { useFonts } from 'expo-font';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export default function LoginScreen({ navigation }) {
  // --- FONT LOADING ---
  let [fontsLoaded] = useFonts({
    BodoniModa_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log('Logged in with:', user.email);
        // The navigator will automatically handle switching screens
      })
      .catch((error) => alert(error.message));
  };

  if (!fontsLoaded) {
    return null; // Wait for fonts
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.title}>apero</Text>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#7D7D7D" // Secondary Text
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#7D7D7D" // Secondary Text
          secureTextEntry // Hides password
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.linkButtonText}>
            Don't have an account?{' '}
            <Text style={styles.signUpText}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- "THE VENETIAN SPRITZ" PALETTE ---
// Background (Sunlight): #FAF6F0
// Surface (White): #FFFFFF
// Primary Text (Dark Wood): #4E4A40
// Secondary Text (Stone): #7D7D7D
// Secondary Accent (Canal): #007A7A
// Primary Accent (Spritz): #F47121
// ------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0', // Background (Sunlight)
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Center everything vertically
    alignItems: 'center', // Center everything horizontally
    padding: 20,
  },
  title: {
    fontFamily: 'BodoniModa_700Bold', // Custom Font
    fontSize: 60, // Make it big and bold
    color: '#F47121', // Primary Accent (Spritz)
    marginBottom: 40,
    letterSpacing: -1,
  },
  input: {
    fontFamily: 'Inter_400Regular', // Custom Font
    fontSize: 16,
    color: '#4E4A40', // Primary Text (Dark Wood)
    backgroundColor: '#FFFFFF', // Surface (White)
    width: '100%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    // --- Matching card shadow ---
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#F47121', // Primary Accent (Spritz)
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    // --- Shadow for the button ---
    shadowColor: '#F47121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold', // Custom Font
    color: '#FFFFFF', // White text
    fontSize: 16,
  },
  linkButton: {
    marginTop: 20,
  },
  linkButtonText: {
    fontFamily: 'Inter_400Regular', // Custom Font
    fontSize: 14,
    color: '#7D7D7D', // Secondary Text (Stone)
  },
  signUpText: {
    fontFamily: 'Inter_600SemiBold', // Custom Font
    color: '#007A7A', // Secondary Accent (Canal)
  },
});