import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../firebaseConfig'; 
import { PlusCircle, Home, List, User, MapPin } from 'lucide-react-native'; 

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DiningHallScreen from '../screens/DiningHallScreen';
import DishScreen from '../screens/DishScreen';
import MyListScreen from '../screens/MyListScreen';
import MoodResultsScreen from '../screens/MoodResultsScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import SearchScreen from '../screens/SearchScreen'; 
import CustomReviewScreen from '../screens/CustomReviewScreen'; 
import ManualCreateScreen from '../screens/ManualCreateScreen';
import HotspotMapScreen from '../screens/HotspotMapScreen';

// NEW FEATURE SCREENS
import TasteDNAScreen from '../screens/TasteDNAScreen';
import SocialFeedScreen from '../screens/SocialFeedScreen';

import AnimatedSplash from '../components/AnimatedSplash';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = createNativeStackNavigator();
const ListStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ReviewStack = createNativeStackNavigator(); 
const MapStack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#FAF6F0' },
  headerTintColor: '#4E4A40',
  headerTitleStyle: { fontFamily: 'Inter_600SemiBold' },
  headerShadowVisible: false,
};

// --- Review Stack ---
function ReviewStackNavigator() {
    return (
        <ReviewStack.Navigator screenOptions={screenOptions}>
            <ReviewStack.Screen 
                name="SearchScreen" 
                component={SearchScreen} 
                options={{ headerShown: false }} 
            />
            <ReviewStack.Screen 
                name="ManualCreate" 
                component={ManualCreateScreen} 
                options={{ title: 'Add New Dish' }} 
            />
            <ReviewStack.Screen 
                name="CustomReview" 
                component={CustomReviewScreen} 
                options={{ title: 'Write Your Review' }}
            />
        </ReviewStack.Navigator>
    );
}

// --- Home/Discover Stack ---
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="DiningHall" component={DiningHallScreen} options={{ title: 'Dishes' }} />
      <HomeStack.Screen name="Dish" component={DishScreen} options={{ title: 'Dish Info' }} />
      <HomeStack.Screen name="MoodResults" component={MoodResultsScreen} /> 
    </HomeStack.Navigator>
  );
}

// --- Hotspot Map Stack ---
function MapStackNavigator() {
  return (
    <MapStack.Navigator screenOptions={screenOptions}>
      <MapStack.Screen 
        name="HotspotMap" 
        component={HotspotMapScreen} 
        options={{ headerShown: false }} 
      />
      <MapStack.Screen 
        name="DiningHall" 
        component={DiningHallScreen} 
        options={{ title: 'Dishes' }} 
      />
      <MapStack.Screen 
        name="Dish" 
        component={DishScreen} 
        options={{ title: 'Dish Info' }} 
      />
    </MapStack.Navigator>
  );
}

// --- My List Stack ---
function ListStackNavigator() {
  return (
    <ListStack.Navigator screenOptions={screenOptions}>
      <ListStack.Screen name="MyListScreen" component={MyListScreen} options={{ headerShown: false }} />
      <ListStack.Screen name="Comparison" component={ComparisonScreen} options={{ title: 'Apero Ranking' }} /> 
    </ListStack.Navigator>
  );
}

// --- Enhanced Profile Stack (NEW: Includes TasteDNA and SocialFeed) ---
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen 
        name="TasteDNA" 
        component={TasteDNAScreen} 
        options={{ title: 'Your Taste DNA' }}
      />
      <ProfileStack.Screen 
        name="SocialFeed" 
        component={SocialFeedScreen} 
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

// --- The 5-Tab Bar ---
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007A7A', 
        tabBarInactiveTintColor: '#7D7D7D', 
        tabBarStyle: { 
          backgroundColor: '#FFFFFF', 
          borderTopWidth: 0,
          elevation: 10, 
          shadowOpacity: 0.05,
          height: 85, // Increased for Samsung/Android devices
          paddingBottom: 25, // Extra padding for gesture navigation
          paddingTop: 8,
        },
        tabBarLabelStyle: { 
          fontFamily: 'Inter_400Regular', 
          fontSize: 11,
          marginTop: -4,
        }, 
        tabBarIcon: ({ color, focused }) => {
            const iconSize = focused ? 24 : 22;
            
            if (route.name === 'Discover') {
                return <Home color={color} size={iconSize} />;
            } else if (route.name === 'Map') {
                return <MapPin color={color} size={iconSize} />;
            } else if (route.name === 'Review') {
                return <PlusCircle color={color} size={focused ? 32 : 30} />;
            } else if (route.name === 'My List') {
                return <List color={color} size={iconSize} />;
            } else if (route.name === 'Profile') {
                return <User color={color} size={iconSize} />;
            }
        },
        tabBarItemStyle: route.name === 'Review' ? {
            backgroundColor: 'transparent',
            margin: 0, 
            padding: 0,
        } : {},
        tabBarShowLabel: route.name !== 'Review',
      })}
    >
      <Tab.Screen 
        name="Discover" 
        component={HomeStackNavigator} 
        options={{ title: 'Discover' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapStackNavigator} 
        options={{ title: 'Hotspots' }}
      />
      <Tab.Screen 
        name="Review" 
        component={ReviewStackNavigator} 
        options={{
            tabBarLabel: 'Review',
            tabBarActiveTintColor: '#F47121',
            tabBarInactiveTintColor: '#F47121', 
            tabBarIconStyle: { marginTop: 0 },
        }}
      />
      <Tab.Screen 
        name="My List" 
        component={ListStackNavigator} 
        options={{ title: 'My List' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// STACK for LOGGED OUT
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// --- MAIN NAVIGATOR ---
export default function AppNavigator() {
  const [user, setUser] = useState(null); 
  
  const [splashMounted, setSplashMounted] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSplashFinish = () => {
    Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 600, 
        useNativeDriver: true,
    }).start(() => {
        setSplashMounted(false);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF6F0' }}>
      <NavigationContainer>
        {user ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>

      {splashMounted && (
        <Animated.View 
            style={[
                StyleSheet.absoluteFill, 
                { opacity: splashOpacity, zIndex: 9999 }
            ]}
        >
            <AnimatedSplash onAnimationFinish={handleSplashFinish} />
        </Animated.View>
      )}
    </View>
  );
}