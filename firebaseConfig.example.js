// Copy this to firebaseConfig.js and fill in the values from
// Firebase console -> Project settings -> Your apps. firebaseConfig.js is gitignored.
// Left blank, the app still runs: accounts are off and "Try the demo" works.
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
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
