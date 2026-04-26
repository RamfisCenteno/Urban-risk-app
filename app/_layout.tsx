import { DarkTheme, ThemeProvider } from '@react-navigation/native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ReportDraftProvider } from '../context/report-draft-context';


export default function RootLayout() {
  return (
    <ReportDraftProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="select-location"
            options={{ headerShown: true, title: 'Elegir ubicacion' }}
          />
          <Stack.Screen
            name="modal"
            options={{ headerShown: true, presentation: 'modal', title: 'Modal' }}
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </ReportDraftProvider>
  );
}