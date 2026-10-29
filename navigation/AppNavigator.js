import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Compass, ListOrdered, Sun, User } from 'lucide-react-native';
import { Sticker } from '../components/art';
import { useSession } from '../context/Session';
import { colors, fonts } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TodayScreen from '../screens/TodayScreen';
import ExploreScreen from '../screens/ExploreScreen';
import PlaceScreen from '../screens/PlaceScreen';
import DishScreen from '../screens/DishScreen';
import MoodScreen from '../screens/MoodScreen';
import FeedScreen from '../screens/FeedScreen';
import PickDishScreen from '../screens/PickDishScreen';
import AddDishScreen from '../screens/AddDishScreen';
import WriteReviewScreen from '../screens/WriteReviewScreen';
import CompareScreen from '../screens/CompareScreen';
import MyListScreen from '../screens/MyListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Root = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TodayStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const ReviewStack = createNativeStackNavigator();
const ListStack = createNativeStackNavigator();
const MeStack = createNativeStackNavigator();

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.page } };

const stackOptions = {
  headerStyle: { backgroundColor: colors.page },
  headerTintColor: colors.cobalt,
  headerTitleStyle: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
};

const noHeader = { headerShown: false };

// every tab can open a place or a dish, so each stack gets these
const detailScreens = (Stack) => [
  <Stack.Screen key="Place" name="Place" component={PlaceScreen} options={{ title: '' }} />,
  <Stack.Screen key="Dish" name="Dish" component={DishScreen} options={{ title: '' }} />,
];

function TodayTab() {
  return (
    <TodayStack.Navigator screenOptions={stackOptions}>
      <TodayStack.Screen name="Today" component={TodayScreen} options={noHeader} />
      {detailScreens(TodayStack)}
      <TodayStack.Screen name="Mood" component={MoodScreen} />
      <TodayStack.Screen name="Feed" component={FeedScreen} options={{ title: 'Campus feed' }} />
    </TodayStack.Navigator>
  );
}

function ExploreTab() {
  return (
    <ExploreStack.Navigator screenOptions={stackOptions}>
      <ExploreStack.Screen name="Explore" component={ExploreScreen} options={noHeader} />
      {detailScreens(ExploreStack)}
    </ExploreStack.Navigator>
  );
}

function ReviewTab() {
  return (
    <ReviewStack.Navigator screenOptions={stackOptions}>
      <ReviewStack.Screen name="PickDish" component={PickDishScreen} options={noHeader} />
      <ReviewStack.Screen name="AddDish" component={AddDishScreen} options={{ title: 'Add a dish' }} />
      <ReviewStack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'How was it?' }} />
      <ReviewStack.Screen
        name="Compare"
        component={CompareScreen}
        options={{ title: 'This or that', gestureEnabled: false }}
      />
    </ReviewStack.Navigator>
  );
}

function ListTab() {
  return (
    <ListStack.Navigator screenOptions={stackOptions}>
      <ListStack.Screen name="MyList" component={MyListScreen} options={noHeader} />
      {detailScreens(ListStack)}
    </ListStack.Navigator>
  );
}

function MeTab() {
  return (
    <MeStack.Navigator screenOptions={stackOptions}>
      <MeStack.Screen name="Profile" component={ProfileScreen} options={noHeader} />
      <MeStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Campus & getting around' }} />
      {detailScreens(MeStack)}
    </MeStack.Navigator>
  );
}

// each tab gets its own color; the active one sits on a soft pill of the same hue
const TABS = {
  TodayTab: { Icon: Sun, color: colors.persimmon, wash: colors.peach },
  ExploreTab: { Icon: Compass, color: colors.teal, wash: colors.lagoon },
  ListTab: { Icon: ListOrdered, color: '#B8860B', wash: colors.butter },
  MeTab: { Icon: User, color: colors.cobalt, wash: colors.mist },
};

function ReviewButton({ onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.reviewWrap} accessibilityLabel="Rate a dish">
      <View style={styles.reviewButton}>
        <Sticker name="orangeSlice" width={62} />
        <Text style={styles.plus}>+</Text>
      </View>
    </Pressable>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: TABS[route.name]?.color,
        tabBarIcon: ({ focused }) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          return (
            <View style={[styles.iconPill, focused ? { backgroundColor: tab.wash } : { opacity: 0.7 }]}>
              <tab.Icon color={tab.color} size={21} strokeWidth={focused ? 2 : 1.6} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="TodayTab" component={TodayTab} options={{ title: 'Today' }} />
      <Tab.Screen name="ExploreTab" component={ExploreTab} options={{ title: 'Explore' }} />
      <Tab.Screen
        name="ReviewTab"
        component={ReviewTab}
        options={{ title: '', tabBarButton: (props) => <ReviewButton onPress={props.onPress} /> }}
      />
      <Tab.Screen name="ListTab" component={ListTab} options={{ title: 'My list' }} />
      <Tab.Screen name="MeTab" component={MeTab} options={{ title: 'Me' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, profile, loading } = useSession();
  if (loading) return null;

  return (
    <NavigationContainer theme={navTheme}>
      <Root.Navigator screenOptions={noHeader}>
        {!user ? (
          <>
            <Root.Screen name="Login" component={LoginScreen} />
            <Root.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : !profile?.campusId ? (
          <Root.Screen name="Onboarding" component={SettingsScreen} initialParams={{ onboarding: true }} />
        ) : (
          <Root.Screen name="Main" component={Tabs} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    height: 86,
    paddingTop: 8,
  },
  tabLabel: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  iconPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999 },
  reviewWrap: { flex: 1, alignItems: 'center' },
  reviewButton: { marginTop: -24, alignItems: 'center', justifyContent: 'center' },
  plus: {
    position: 'absolute',
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 46,
    color: colors.cobalt,
    backgroundColor: colors.paper,
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    overflow: 'hidden',
    textAlignVertical: 'center',
  },
});
