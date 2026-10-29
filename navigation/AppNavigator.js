import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Compass, ListOrdered, Plus, Sun, User } from 'lucide-react-native';
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

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.paper } };

const stackOptions = {
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
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
      <ReviewStack.Screen name="Compare" component={CompareScreen} options={{ title: 'This or that', gestureEnabled: false }} />
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

const TAB_ICONS = { TodayTab: Sun, ExploreTab: Compass, ListTab: ListOrdered, MeTab: User };

function ReviewButton({ onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.reviewWrap} accessibilityLabel="Rate a dish">
      <View style={styles.reviewButton}>
        <Plus color={colors.ink} size={28} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          const Icon = TAB_ICONS[route.name];
          return Icon ? <Icon color={color} size={22} strokeWidth={focused ? 2.5 : 2} /> : null;
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
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    height: 86,
    paddingTop: 8,
  },
  tabLabel: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  reviewWrap: { flex: 1, alignItems: 'center' },
  reviewButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -20,
    backgroundColor: colors.aperol,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
