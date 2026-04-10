import { DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ReportDraftProvider } from '../context/report-draft-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [destination, setDestination] = useState<'/(tabs)' | '/onboarding' | null>(null);

  // Paso 1: leer AsyncStorage una sola vez
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        console.log('hasSeenOnboarding:', value);
        setDestination(value ? '/(tabs)' : '/onboarding');
      } catch (e) {
        console.error('AsyncStorage error:', e);
        setDestination('/onboarding');
      }
    };

    checkOnboarding();
  }, []);

  // Paso 2: navegar solo cuando el Stack esté montado y tengamos destino
  useEffect(() => {
    if (!isReady || !destination) return;
    router.replace({ pathname: destination });
  }, [isReady, destination]);

  return (
    <Stack onLayout={() => setIsReady(true)}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="select-location"
        options={{ title: 'Elegir ubicación' }}
      />
      <Stack.Screen
        name="modal"
        options={{ presentation: 'modal', title: 'Modal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ReportDraftProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </ReportDraftProvider>
  );
}