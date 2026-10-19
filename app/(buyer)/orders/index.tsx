import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../../src/lib/theme';
import { mockBuyerOrders } from '../../../src/constants/buyerMockData';
import { BuyerOrder } from '../../../src/types/buyer.types';
import { BuyerOrderCard } from '../../../src/components/orders/BuyerOrderCard';
import { OrderDetailModal } from '../../../src/components/orders/OrderDetailModal';

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

export default function BuyerOrdersScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BuyerOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pull to refresh simulation
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Filter orders according to active tab and search query
  const filteredOrders = useMemo(() => {
    return mockBuyerOrders.filter((order) => {
      // Tab filter
      if (activeTab === 'active') {
        if (order.status !== 'in_transit' && order.status !== 'processing' && order.status !== 'confirmed') {
          return false;
        }
      } else if (activeTab === 'delivered') {
        if (order.status !== 'delivered') {
          return false;
        }
      } else if (activeTab === 'cancelled') {
        if (order.status !== 'cancelled') {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesCrop = order.cropName.toLowerCase().includes(q);
        const matchesFarmer = order.farmerName.toLowerCase().includes(q);
        const matchesLocation = order.location.toLowerCase().includes(q);
        const matchesBatch = order.batchId.toLowerCase().includes(q);

        if (!matchesOrderNumber && !matchesCrop && !matchesFarmer && !matchesLocation && !matchesBatch) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    const activeCount = mockBuyerOrders.filter(
      (o) => o.status === 'in_transit' || o.status === 'processing' || o.status === 'confirmed'
    ).length;
    const deliveredCount = mockBuyerOrders.filter((o) => o.status === 'delivered').length;
    const cancelledCount = mockBuyerOrders.filter((o) => o.status === 'cancelled').length;

    return {
      all: mockBuyerOrders.length,
      active: activeCount,
      delivered: deliveredCount,
      cancelled: cancelledCount,
    };
  }, []);

  const handleOpenDetail = (order: BuyerOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const handleContactFarmer = (order: BuyerOrder) => {
    // Navigate to messages screen or user chat
    router.push('/(buyer)/messages' as any);
  };

  const handleBrowseMarketplace = () => {
    router.push('/(buyer)/explore' as any);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Title & Subtitle */}
      <View style={styles.titleSection}>
        <View>
          <Text style={styles.screenTitle}>My Orders</Text>
          <Text style={styles.screenSubtitle}>
            {counts.active} active {counts.active === 1 ? 'shipment' : 'shipments'} in transit
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleBrowseMarketplace}
          style={styles.newOrderButton}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.newOrderButtonText}>New Order</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Metric Pills */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="truck-fast" size={16} color="#D97706" />
          <Text style={styles.metricNumber}>{counts.active}</Text>
          <Text style={styles.metricLabel}>In Transit</Text>
        </View>

        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#2E7D32" />
          <Text style={styles.metricNumber}>100%</Text>
          <Text style={styles.metricLabel}>Verified Logs</Text>
        </View>

        <View style={styles.metricCard}>
          <MaterialCommunityIcons name="package-variant-closed" size={16} color="#3F61D6" />
          <Text style={styles.metricNumber}>{counts.all}</Text>
          <Text style={styles.metricLabel}>Total Orders</Text>
        </View>
      </View>

      {/* Live Search Bar */}
      <View style={styles.searchBarWrapper}>
        <MaterialCommunityIcons name="magnify" size={18} color="#768776" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order #, crop, or farmer..."
          placeholderTextColor="#8B9C8C"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close-circle" size={16} color="#8B9C8C" />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Status Tabs */}
      <View style={styles.tabsContainer}>
        {(
          [
            { key: 'all', label: 'All', count: counts.all },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'delivered', label: 'Delivered', count: counts.delivered },
            { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
              <View
                style={[
                  styles.tabCountPill,
                  isActive ? styles.tabCountPillActive : styles.tabCountPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    isActive ? styles.tabCountTextActive : styles.tabCountTextInactive,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="basket-outline" size={38} color="#768776" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No matching orders found' : 'No orders in this category'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `We couldn't find any orders matching "${searchQuery}". Try a different keyword.`
          : 'Explore freshly verified crops from local greenhouse and open-field farmers.'}
      </Text>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={searchQuery ? () => setSearchQuery('') : handleBrowseMarketplace}
        style={styles.emptyCTA}
      >
        <Text style={styles.emptyCTAText}>
          {searchQuery ? 'Clear Search' : 'Browse Marketplace'}
        </Text>
        <MaterialCommunityIcons
          name={searchQuery ? 'close' : 'arrow-right'}
          size={16}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F2EB" />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BuyerOrderCard
            order={item}
            onPress={handleOpenDetail}
            onTrackPress={handleOpenDetail}
            onContactFarmer={handleContactFarmer}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Interactive Detail & Tracking Modal */}
      <OrderDetailModal
        order={selectedOrder}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onContactFarmer={handleContactFarmer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  listContent: {
    paddingBottom: 125, // Inset for floating capsule bottom navigation bar
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    marginTop: 3,
  },
  newOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3523',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  newOrderButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
  },
  metricNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16301A',
    marginTop: 4,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#768776',
    marginTop: 2,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#16301A',
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
    gap: 5,
  },
  tabButtonActive: {
    backgroundColor: '#1E3523',
    borderColor: '#1E3523',
  },
  tabButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#556A55',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabCountPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  tabCountPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabCountPillInactive: {
    backgroundColor: '#F0ECE4',
  },
  tabCountText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },
  tabCountTextInactive: {
    color: '#556A55',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 32,
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16301A',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#768776',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  emptyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3523',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  emptyCTAText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
