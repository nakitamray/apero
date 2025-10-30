import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth'; // Firebase auth listener
import { auth } from '../firebaseConfig'; // auth object

// import screens
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DiningHallScreen from '../screens/DiningHallScreen';
import DishScreen from '../screens/DishScreen';
import MyListScreen from '../screens/MyListScreen';

// created navigator "engines"
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Create a new Stack navigator just for the "Home" flow
const HomeStack = createNativeStackNavigator();
const ListStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#FAF6F0' },
  headerTintColor: '#4E4A40',
  headerTitleStyle: { fontFamily: 'Inter_600SemiBold' },
  headerShadowVisible: false,
};

// --- Stack for the "Home/Discover" Tab ---
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="DiningHall" component={DiningHallScreen} options={{ title: 'Dishes' }} />
      <HomeStack.Screen name="Dish" component={DishScreen} options={{ title: 'Rate Dish' }} />
      {/* TODO: Add HotspotMapScreen here */}
    </HomeStack.Navigator>
  );
}

// --- Stack for the "My List" Tab ---
function ListStackNavigator() {
  return (
    <ListStack.Navigator screenOptions={screenOptions}>
      <ListStack.Screen name="MyListScreen" component={MyListScreen} options={{ headerShown: false }} />
      {/* TODO: Add DishScreen here too so you can tap a ranked item */}
    </ListStack.Navigator>
  );
}

// --- Stack for the "Profile" Tab ---
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen} 
        options={{ headerShown: false }} // <-- ADD THIS
      />
      {/* TODO: Add FriendsListScreen here */}
    </ProfileStack.Navigator>
  );
}

// --- This is the NEW 3-Tab Bar ---
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Each stack handles its own header
        tabBarActiveTintColor: '#F47121', // Spritz Orange
        tabBarInactiveTintColor: '#7D7D7D', // Stone Gray
        tabBarStyle: { 
          backgroundColor: '#FFFFFF', borderTopWidth: 0,
          elevation: 10, shadowOpacity: 0.05,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 10 }
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="My List" component={ListStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

// STACK for LOGGED OUT
// stack with Login and Sign Up
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// MAIN NAVIGATOR 
// decides which stack to show based on if a user is logged in
export default function AppNavigator() {
  const [user, setUser] = useState(null); // this variable golds the user's login state

  // firebase listener
  // runs on mount and whenever the auth state changes (login, logout, sign up).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set the user state
    });

    // when the component unmounts, cleans listener
    return () => unsubscribe();
  }, []);

  // wrap everything in NavigationContainer
  return (
    <NavigationContainer>
      {user ? <AppTabs /> : <AuthStack />}
      {/* core logic:
          IF the 'user' state is not null, show the AppTabs
          ELSE (if user is null), show the AuthStack
      */}
    </NavigationContainer>
  );
}