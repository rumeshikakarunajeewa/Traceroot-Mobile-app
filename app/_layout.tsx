
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />

        <Stack.Screen name="(auth)" />

        <Stack.Screen name="(admin)" />

        <Stack.Screen name="(farmer)" />

        <Stack.Screen name="(buyer)" />

        <Stack.Screen name="(supplier)" />
      </Stack>
    </>
  );
}
