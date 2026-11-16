import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { SessionProvider } from './context/Session';
import AppNavigator from './navigation/AppNavigator';
import Splash from './components/Splash';
import SchoolLink from './components/SchoolLink';
import { isSchoolLink } from './lib/school';

// opened from the link in a student email: show just the confirmation page
const fromSchoolLink = isSchoolLink();
import { colors } from './theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Medan: require('./assets/fonts/Medan.otf'),
    Gresida: require('./assets/fonts/Gresida.ttf'),
    'Doblegh-Regular': require('./assets/fonts/Doblegh-Regular.ttf'),
    'Doblegh-Medium': require('./assets/fonts/Doblegh-Medium.ttf'),
    'Doblegh-SemiBold': require('./assets/fonts/Doblegh-SemiBold.ttf'),
    'Doblegh-Bold': require('./assets/fonts/Doblegh-Bold.ttf'),
    'Doblegh-RegItalic': require('./assets/fonts/Doblegh-RegItalic.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.page }} />;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: colors.page }}>
          {fromSchoolLink ? <SchoolLink /> : <AppNavigator />}
          {showSplash && !fromSchoolLink && <Splash onDone={() => setShowSplash(false)} />}
        </View>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
