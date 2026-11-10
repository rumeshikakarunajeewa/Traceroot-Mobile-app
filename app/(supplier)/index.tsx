import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  mockSupplierQuickActions,
  mockWaitingAlert,
} from '../../src/constants/supplierMockData';
import {
  FarmerRequestItem,
  SupplierQuickActionItem,
  TopProductItem,
  SupplierStats,
  SupplierProfile,
} from '../../src/types/supplier.types';
import { useSupplierCatalogue, loadCatalogueProducts } from '../../src/store/supplierCatalogueStore';
import { useSupplierOrders, loadSupplierOrders } from '../../src/store/supplierOrdersStore';
import { useSupplierProfile, loadSupplierProfile } from '../../src/store/supplierProfileStore';

export default function SupplierDashboardScreen() {
  const [isDark] = useDarkMode();
  const [refreshing, setRefreshing] = useState(false);

  const [products] = useSupplierCatalogue();
  const [orders, updateOrderStatus] = useSupplierOrders();
  const [profile] = useSupplierProfile();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadCatalogueProducts(undefined, true),
        loadSupplierOrders(undefined, true),
        loadSupplierProfile(true),
      ]);
    } catch (e) {
      console.warn('Error refreshing supplier dashboard:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Map orders to FarmerRequestItem format for the dashboard
  const requests: FarmerRequestItem[] = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.map((o) => {
      let requestStatus: 'Pending' | 'Fulfilled' | 'Cancelled' = 'Pending';
      if (o.status === 'Completed') requestStatus = 'Fulfilled';
      else if (o.status === 'Declined') requestStatus = 'Cancelled';

      return {
        id: o.id,
        title: o.items?.[0]?.title || 'Agricultural Supplies',
        farmerName: o.farmerName,
        date: o.timeAgo,
        status: requestStatus,
        imageUrl: o.items?.[0]?.imageUrl || require('../../assets/images/supplier_fertilizer.jpg'),
        quantity: o.items?.[0]?.quantity,
      };
    });
  }, [orders]);

  // Map catalogue products to TopProductItem format
  const topProducts: TopProductItem[] = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.slice(0, 6).map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      price: p.price,
      currency: p.currency,
      stock: p.stock,
      maxStock: p.maxStock,
      imageUrl: p.imageUrl,
    }));
  }, [products]);

  // Dynamic statistics
  const pendingCount = useMemo(() => {
    return orders.filter((o) => o.status === 'New').length;
  }, [orders]);

  const stats: SupplierStats = useMemo(() => {
    const uniqueFarmers = new Set(orders.map((o) => o.farmerName)).size;
    return {
      productsCount: products.length,
      pendingOrdersCount: pendingCount,
      activeFarmersCount: Math.max(uniqueFarmers, profile.farmersCount || 0),
    };
  }, [products.length, pendingCount, orders, profile.farmersCount]);

  const waitingAlertData = useMemo(() => ({
    ...mockWaitingAlert,
    waitingCount: pendingCount,
    title: `${pendingCount} farmer${pendingCount === 1 ? ' is' : 's are'} waiting`,
  }), [pendingCount]);

  const supplierHeaderProfile: SupplierProfile = useMemo(() => ({
    id: profile.id || 'supplier-1',
    name: profile.name?.trim() || profile.contactName?.trim() || 'AgriSupply Co.',
    category: profile.store?.trim() || profile.district?.trim() || 'Agricultural Supplier',
    role: 'Verified Wholesale Supplier',
    avatarUrl: profile.avatarUrl?.uri || undefined,
    unreadNotificationsCount: pendingCount,
  }), [profile, pendingCount]);

  const handleQuickAction = (action: SupplierQuickActionItem) => {
    if (action.route) {
      router.navigate(action.route as any);
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
            updateOrderStatus(request.id, 'Completed');
          },
        },
      ]
    );
  };

  const handleViewAllRequests = () => {
    router.navigate('/orders' as any);
  };

  const handleManageProducts = () => {
    router.navigate('/catalogue' as any);
  };

  const handleProductPress = (product: TopProductItem) => {
    router.navigate('/catalogue' as any);
  };

  const handleStorePress = () => {
    Alert.alert(
      profile.name?.trim() || 'AgriSupply Co.',
      profile.bio?.trim() ||
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
          profile={supplierHeaderProfile}
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

        {/* 4. Alert Callout: "X farmers are waiting" with Orange Basket */}
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
          products={topProducts}
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
