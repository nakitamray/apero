import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../firebaseConfig'; 
import { PlusCircle, Home, List, User } from 'lucide-react-native'; 

// import screens
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

// import New Component
import AnimatedSplash from '../components/AnimatedSplash';

// created navigator "engines"
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = createNativeStackNavigator();
const ListStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ReviewStack = createNativeStackNavigator(); 

const screenOptions = {
  headerStyle: { backgroundColor: '#FAF6F0' },
  headerTintColor: '#4E4A40',
  headerTitleStyle: { fontFamily: 'Inter_600SemiBold' },
  headerShadowVisible: false,
};

// --- Stack for the Review Flow ---
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

// --- Stack for the "Home/Discover" Tab ---
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

// --- Stack for the "My List" Tab ---
function ListStackNavigator() {
  return (
    <ListStack.Navigator screenOptions={screenOptions}>
      <ListStack.Screen name="MyListScreen" component={MyListScreen} options={{ headerShown: false }} />
      <ListStack.Screen name="Comparison" component={ComparisonScreen} options={{ title: 'Apero Ranking' }} /> 
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
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

// --- The 4-Tab Bar ---
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007A7A', 
        tabBarInactiveTintColor: '#7D7D7D', 
        tabBarStyle: { 
          backgroundColor: '#FFFFFF', borderTopWidth: 0,
          elevation: 10, shadowOpacity: 0.05,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_400Regular', fontSize: 11 }, 
        tabBarIcon: ({ color }) => {
            const iconSize = 22; 
            if (route.name === 'Discover') {
                return <Home color={color} size={iconSize} />;
            } else if (route.name === 'My List') {
                return <List color={color} size={iconSize} />;
            } else if (route.name === 'Review') {
                return <PlusCircle color={color} size={30} />; 
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
        name="My List" 
        component={ListStackNavigator} 
        options={{ title: 'My List' }}
      />
      <Tab.Screen 
        name="Review" 
        component={ReviewStackNavigator} 
        options={{
            tabBarLabel: 'Review',
            tabBarActiveTintColor: '#007A7A', 
            tabBarInactiveTintColor: '#007A7A', 
            tabBarIconStyle: { marginTop: 0 },
        }}
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

// --- MAIN NAVIGATOR (Updated for Smooth Transition) ---
export default function AppNavigator() {
  const [user, setUser] = useState(null); 
  
  // Transition States
  const [splashMounted, setSplashMounted] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSplashFinish = () => {
    // Smooth Fade Out (600ms)
    Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 600, 
        useNativeDriver: true,
    }).start(() => {
        setSplashMounted(false); // Unmount after fade completes
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF6F0' }}>
      {/* 1. Main App (Loads behind the splash) */}
      <NavigationContainer>
        {user ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>

      {/* 2. Animated Splash Overlay */}
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