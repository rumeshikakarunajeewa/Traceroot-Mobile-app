import React from 'react';
import { Stack } from 'expo-router';
import { useDarkMode } from '../../src/store/uiStore';

export default function AdminLayout() {
  const [isDark] = useDarkMode();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#0E1710' : '#F5F2EB',
        },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
