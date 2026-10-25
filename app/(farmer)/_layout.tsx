import React from 'react';
import { Tabs, router } from 'expo-router';
import { FarmerBottomTabBar } from '../../src/components/farmer/FarmerBottomTabBar';

export default function FarmerLayout() {
  const handleOpenAddRecord = () => {
    // Navigate to harvest or cultivation capture
    router.push('/harvests/new');
  };

  return (
    <Tabs
      tabBar={(props) => (
        <FarmerBottomTabBar {...props} onAddPress={handleOpenAddRecord} />
      )}
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="crops"
        options={{
          title: 'Crops',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
        }}
      />
      {/* Subroutes rendered without bottom bar */}
      <Tabs.Screen name="harvests/index" />
      <Tabs.Screen name="harvests/[id]" />
      <Tabs.Screen name="harvests/new" />
      <Tabs.Screen name="contracts" />
      <Tabs.Screen name="suppliers" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}