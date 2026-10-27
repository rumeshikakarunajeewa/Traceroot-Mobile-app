import React, { useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useDarkMode } from '../../src/store/uiStore';
import { SupplierHeader } from '../../src/components/supplier/SupplierHeader';
import { SupplierHeroBanner } from '../../src/components/supplier/SupplierHeroBanner';
import { SupplierQuickActions } from '../../src/components/supplier/SupplierQuickActions';
import { SupplierWaitingAlert } from '../../src/components/supplier/SupplierWaitingAlert';
import { SupplierFarmerRequests } from '../../src/components/supplier/SupplierFarmerRequests';
import { SupplierTopProducts } from '../../src/components/supplier/SupplierTopProducts';

import {
  mockSupplierProfile,
  mockSupplierStats,
  mockSupplierQuickActions,
  mockWaitingAlert,
  mockFarmerRequests,
  mockTopProducts,
} from '../../src/constants/supplierMockData';
import {
  FarmerRequestItem,
  SupplierQuickActionItem,
  TopProductItem,
} from '../../src/types/supplier.types';

export default function SupplierDashboardScreen() {
  const [isDark] = useDarkMode();
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<FarmerRequestItem[]>(mockFarmerRequests);
  const [stats, setStats] = useState(mockSupplierStats);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  const waitingAlertData = {
    ...mockWaitingAlert,
    waitingCount: pendingCount,
    title: `${pendingCount} farmer${pendingCount === 1 ? ' is' : 's are'} waiting`,
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const handleQuickAction = (action: SupplierQuickActionItem) => {
    if (action.route) {
      router.push(action.route as any);
    }
  };

  const handleFulfilRequest = (request: FarmerRequestItem) => {
    Alert.alert(
      'Fulfil Order Request',
      `Confirm dispatch and fulfillment of ${request.title} for ${request.farmerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Fulfil',
          style: 'default',
          onPress: () => {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === request.id ? { ...r, status: 'Fulfilled' } : r
              )
            );
            setStats((prev) => ({
              ...prev,
              pendingOrdersCount: Math.max(0, prev.pendingOrdersCount - 1),
            }));
          },
        },
      ]
    );
  };

  const handleViewAllRequests = () => {
    router.push('/(supplier)/orders');
  };

  const handleManageProducts = () => {
    router.push('/(supplier)/catalogue');
  };

  const handleProductPress = (product: TopProductItem) => {
    router.push(`/(supplier)/catalogue` as any);
  };

  const handleStorePress = () => {
    Alert.alert(
      'AgriSupply Co.',
      'Verified wholesale supplier of high-grade agrochemicals, certified hybrid seeds, and biological crop protection.',
      [{ text: 'OK' }]
    );
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Notifications',
      `You have ${pendingCount} pending farmer orders awaiting verification.`,
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#4ADE80' : '#187A36'}
            colors={['#187A36']}
          />
        }
      >
        {/* 1. Header with Storefront Icon, Title, and Bell */}
        <SupplierHeader
          profile={mockSupplierProfile}
          onStorePress={handleStorePress}
          onNotificationPress={handleNotificationPress}
        />

        {/* 2. Hero Banner: Sprouts background, Italic Gold Headline, Glassmorphic Stats */}
        <SupplierHeroBanner stats={stats} />

        {/* 3. Quick Actions Row: Catalogue, Add Product, Requests, Buy-back */}
        <SupplierQuickActions
          actions={mockSupplierQuickActions}
          onActionPress={handleQuickAction}
        />

        {/* 4. Alert Callout: "2 farmers are waiting" with Orange Basket */}
        <SupplierWaitingAlert
          alert={waitingAlertData}
          onPress={handleViewAllRequests}
        />

        {/* 5. Farmer Requests Section */}
        <SupplierFarmerRequests
          requests={requests}
          onFulfilPress={handleFulfilRequest}
          onViewAllPress={handleViewAllRequests}
        />

        {/* 6. Top Products Horizontal Carousel */}
        <SupplierTopProducts
          products={mockTopProducts}
          onProductPress={handleProductPress}
          onManagePress={handleManageProducts}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Warm natural linen cream matching Figma
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
});
