import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useDarkMode } from '../src/store/uiStore';
import { initializeAuth } from '../src/store/authStore';

export default function RootLayout() {
  const [isDark] = useDarkMode();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
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
  );
}
