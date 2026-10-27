import React from 'react';
import { Tabs } from 'expo-router';
import { SupplierBottomTabBar } from '../../src/components/supplier/SupplierBottomTabBar';
import { useDarkMode } from '../../src/store/uiStore';

export default function SupplierLayout() {
  const [isDark] = useDarkMode();

  return (
    <Tabs
      tabBar={(props) => <SupplierBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: isDark ? '#0E1710' : '#F5F2EB',
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      {/* 1. Home Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />

      {/* 2. Catalogue Screen */}
      <Tabs.Screen
        name="catalogue/index"
        options={{
          title: 'Catalogue',
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

      {/* Hidden subroutes */}
      <Tabs.Screen
        name="catalogue/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="catalogue/new"
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
        name="buyback/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="buyback/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="farmers/index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}