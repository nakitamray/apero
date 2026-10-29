import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces/600SemiBold_Italic';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono/400Regular';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono/700Bold';
import { SessionProvider } from './context/Session';
import AppNavigator from './navigation/AppNavigator';
import Splash from './components/Splash';
import { colors } from './theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Fraunces_600SemiBold_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });
  const [showSplash, setShowSplash] = useState(true);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: colors.paper }}>
          <AppNavigator />
          {showSplash && <Splash onDone={() => setShowSplash(false)} />}
        </View>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
