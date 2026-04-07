import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
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
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

      const firstSegment = String(segments[0] ?? '');

      const inTabs = firstSegment === '(tabs)';
      const inOnboarding = firstSegment === 'onboarding';
      const inSelectLocation = firstSegment === 'select-location';

      if (!hasSeenOnboarding && !inOnboarding) {
        router.replace('./onboarding');
      } else if (hasSeenOnboarding && !inTabs && !inOnboarding && !inSelectLocation) {
        router.replace('/(tabs)');
      }

      setIsReady(true);
    };

    checkOnboarding();
  }, [segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

 return (
    <Stack>
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