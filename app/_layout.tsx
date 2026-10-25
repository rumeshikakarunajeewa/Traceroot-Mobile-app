import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useDarkMode } from '../src/store/uiStore';

const appDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0E1710',
    card: '#18271C',
    text: '#F0F5F1',
    border: '#263B2B',
    primary: '#4ADE80',
  },
};

const appLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F2EB',
    card: '#FFFFFF',
    text: '#16301A',
    border: '#E5E1D7',
    primary: '#187A36',
  },
};

export default function RootLayout() {
  const [isDark] = useDarkMode();

  return (
    <ThemeProvider value={isDark ? appDarkTheme : appLightTheme}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#0E1710' : '#F5F2EB' }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: isDark ? '#0E1710' : '#F5F2EB',
            },
          }}
        />
      </View>
    </ThemeProvider>
  );
}
