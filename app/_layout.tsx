import { DarkTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/Colors';

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.accentLight,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.accent,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen
          name="club/[id]"
          options={{
            headerShown: true,
            title: '',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: true,
            title: '',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not found' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
