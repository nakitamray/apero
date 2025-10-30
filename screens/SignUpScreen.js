import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert, // Import Alert
} from 'react-native';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// --- FONT IMPORTS ---
import { useFonts } from 'expo-font';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export default function SignUpScreen({ navigation }) {
  // --- FONT LOADING ---
  let [fontsLoaded] = useFonts({
    BodoniModa_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = () => {
    if (!email || !password) {
        Alert.alert("Missing Fields", "Please enter both email and password.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log('Signed up with:', user.email);
        // The listener in AppNavigator will handle the screen change
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
            Alert.alert("Sign Up Error", "That email address is already in use!");
        } else if (error.code === 'auth/invalid-email') {
            Alert.alert("Sign Up Error", "That email address is invalid!");
        } else if (error.code === 'auth/weak-password') {
            Alert.alert("Sign Up Error", "Password should be at least 6 characters.");
        } else {
            Alert.alert("Sign Up Error", error.message);
        }
      });
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
        {/* We add a back button */}
        <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
        >
            <Text style={styles.backButtonText}>{"<"} Login</Text>
        </TouchableOpacity>

        <Text style={styles.title}>apero</Text>
        <Text style={styles.header}>Create your account</Text>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#7D7D7D"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#7D7D7D"
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles based on LoginScreen.js ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0', // Background (Sunlight)
  },
  container: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#007A7A', // Secondary Accent (Canal)
  },
  title: {
    fontFamily: 'BodoniModa_700Bold', 
    fontSize: 60, 
    color: '#F47121', // Primary Accent (Spritz)
    marginBottom: 10,
    letterSpacing: -1,
  },
  header: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#4E4A40',
    marginBottom: 30,
  },
  input: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 16,
    color: '#4E4A40', 
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#F47121', 
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#F47121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold', 
    color: '#FFFFFF', 
    fontSize: 16,
  },
});