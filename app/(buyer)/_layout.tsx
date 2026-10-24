import React from 'react';
import { Tabs } from 'expo-router';
import { BuyerBottomTabBar } from '@/components/buyer/BuyerBottomTabBar';

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
        name="explore/index"
        options={{
          title: 'Market',
        }}
      />

      {/* 3. Orders Screen */}
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Orders',
        }}
      />

      {/* 4. Messages Screen */}
      <Tabs.Screen
        name="messages/index"
        options={{
          title: 'Messages',
        }}
      />

      {/* 5. Profile Screen */}
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
        }}
      />

      {/* Contracts subflow - hidden from bottom tabs */}
      <Tabs.Screen
        name="contracts/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="contracts/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="contracts/new"
        options={{
          href: null,
        }}
      />

      {/* Nested details - hidden from bottom tabs */}
      <Tabs.Screen
        name="explore/farmer/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore/farmer/[id]/harvest/[harvestId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="messages/[userId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}