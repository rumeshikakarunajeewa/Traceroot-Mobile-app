import React from 'react';
import { Tabs } from 'expo-router';
import { BuyerBottomTabBar } from '../../src/components/buyer/BuyerBottomTabBar';

export default function BuyerTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BuyerBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      {/* 1. Home Screen */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />

      {/* 2. Market Screen (Explore) */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Market',
        }}
      />

      {/* 3. Orders Screen */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />

      {/* 4. Messages Screen */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
        }}
      />

      {/* 5. Profile Screen */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />

      {/* Contracts subflow - hidden from bottom tabs */}
      <Tabs.Screen
        name="contracts"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}