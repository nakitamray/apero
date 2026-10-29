import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Jost_400Regular } from '@expo-google-fonts/jost/400Regular';
import { Jost_500Medium } from '@expo-google-fonts/jost/500Medium';
import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic';
import { SessionProvider } from './context/Session';
import AppNavigator from './navigation/AppNavigator';
import Splash from './components/Splash';
import { colors } from './theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    GrandParadiso: require('./assets/fonts/GrandParadiso-Regular.ttf'),
    Jost_400Regular,
    Jost_500Medium,
    CormorantGaramond_500Medium_Italic,
  });
  const [showSplash, setShowSplash] = useState(true);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.page }} />;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: colors.page }}>
          <AppNavigator />
          {showSplash && <Splash onDone={() => setShowSplash(false)} />}
        </View>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
