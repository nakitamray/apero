// Firebase setup. Values come from EXPO_PUBLIC_FIREBASE_* environment variables
// (a local .env file, or the Vercel project settings). Copy .env.example to .env to start.
// With no values set the app still runs: accounts are off and "Try the demo" works.
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = config.apiKey ? initializeApp(config) : null;

function makeAuth() {
  if (!app) return null;
  // the browser keeps its own session; phones need AsyncStorage
  if (Platform.OS === 'web') return getAuth(app);
  const { getReactNativePersistence } = require('firebase/auth');
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export const auth = makeAuth();
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
