import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../../../src/hooks/useAuth';
import { supabase } from '../../../../src/lib/supabase';
import { supplierOrdersService } from '../../../../src/services/supplierOrders.service';
import { useDarkMode } from '../../../../src/store/uiStore';
import { SupplierOrderRequest, SupplierOrderStatus } from '../../../../src/types/supplier.types';

type OrderFilter = 'All' | 'Pending' | 'Packing' | 'Delivered' | 'Declined';

export default function FarmerSuppliesOrdersScreen() {
  const [isDark] = useDarkMode();
  const { farmerId } = useAuth();

  const [orders, setOrders] = useState<SupplierOrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('All');

  const loadOrders = useCallback(async () => {
    try {
      let resolvedFarmerId = farmerId;
      if (!resolvedFarmerId || resolvedFarmerId === 'farmer-1') {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          resolvedFarmerId = session.user.id;
        }
      }

      if (!resolvedFarmerId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const fetched = await supplierOrdersService.getFarmerOrders(resolvedFarmerId);
      setOrders(fetched);
    } catch (err) {
      console.warn('[FarmerSuppliesOrders] Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [farmerId]);

  useEffect(() => {
    loadOrders();

    const unsubscribe = supplierOrdersService.subscribeToSupplierOrders(
      { farmerId: farmerId || undefined },
      () => {
        loadOrders();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [farmerId, loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => o.status === 'New' || o.status === 'Packing').length;
    const delivered = orders.filter((o) => o.status === 'Completed').length;
    const totalSpent = orders
      .filter((o) => o.status !== 'Declined')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { total, active, delivered, totalSpent };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return orders;
    if (activeFilter === 'Pending') return orders.filter((o) => o.status === 'New');
    if (activeFilter === 'Packing') return orders.filter((o) => o.status === 'Packing');
    if (activeFilter === 'Delivered') return orders.filter((o) => o.status === 'Completed');
    if (activeFilter === 'Declined') return orders.filter((o) => o.status === 'Declined');
    return orders;
  }, [orders, activeFilter]);

  const filterTabs: OrderFilter[] = ['All', 'Pending', 'Packing', 'Delivered', 'Declined'];

  const getStatusBadge = (status: SupplierOrderStatus) => {
    switch (status) {
      case 'New':
        return {
          label: 'Pending',
          bg: isDark ? '#3D3008' : '#FEF3C7',
          text: isDark ? '#FBBF24' : '#B45309',
        };
      case 'Packing':
        return {
          label: 'Packing',
          bg: isDark ? '#0C2A4A' : '#E0F2FE',
          text: isDark ? '#60A5FA' : '#0369A1',
        };
      case 'Completed':
        return {
          label: 'Delivered',
          bg: isDark ? '#0F331E' : '#E8F5EA',
          text: isDark ? '#4ADE80' : '#2B7A42',
        };
      case 'Declined':
        return {
          label: 'Declined',
          bg: isDark ? '#3E1417' : '#FEE2E2',
          text: isDark ? '#F87171' : '#B91C1C',
        };
      default:
        return {
          label: status,
          bg: isDark ? '#26382B' : '#EAE7E0',
          text: isDark ? '#9CB3A0' : '#555',
        };
    }
  };

  const renderOrderItem = ({ item }: { item: SupplierOrderRequest }) => {
    const badge = getStatusBadge(item.status);
    const firstItem = item.items?.[0];

    return (
      <TouchableOpacity
        style={[styles.orderCard, isDark && styles.orderCardDark]}
        onPress={() => {
          router.push({
            pathname: '/(farmer)/suppliers/orders/[id]',
            params: { id: item.dbId || item.id },
          });
        }}
        activeOpacity={0.8}
      >
        {/* Card Header: Order ID & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.orderIdRow}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={18}
              color={isDark ? '#4ADE80' : '#255D35'}
            />
            <Text style={[styles.orderIdText, isDark && styles.orderIdTextDark]}>
              {item.id}
            </Text>
            <Text style={[styles.orderTimeText, isDark && styles.orderTimeTextDark]}>
              • {item.timeAgo}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        {/* Supplier details */}
        <View style={styles.supplierRow}>
          <MaterialCommunityIcons name="storefront-outline" size={14} color={isDark ? '#7E9F85' : '#666'} />
          <Text style={[styles.supplierName, isDark && styles.supplierNameDark]}>
            {item.supplierName || 'Verified Supplier'}
          </Text>
          {item.district && (
            <Text style={[styles.supplierDistrict, isDark && styles.supplierDistrictDark]}>
              ({item.district})
            </Text>
          )}
        </View>

        {/* Items Summary */}
        <View style={[styles.itemsContainer, isDark && styles.itemsContainerDark]}>
          {firstItem && (
            <View style={styles.itemRow}>
              <Image
                source={
                  typeof firstItem.imageUrl === 'string'
                    ? { uri: firstItem.imageUrl }
                    : firstItem.imageUrl || require('../../../../assets/images/supplier_seed_sack.jpg')
                }
                style={styles.itemThumb}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.itemTitle, isDark && styles.itemTitleDark]} numberOfLines={1}>
                  {firstItem.title}
                </Text>
                <Text style={[styles.itemQty, isDark && styles.itemQtyDark]}>
                  Qty: {firstItem.quantity}
                  {item.items.length > 1 && ` (+${item.items.length - 1} more items)`}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Card Footer: Total Price & Chevron */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Order Total</Text>
            <Text style={[styles.totalValue, isDark && styles.totalValueDark]}>
              Rs. {item.totalAmount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.viewDetailsBtn}>
            <Text style={[styles.viewDetailsText, isDark && styles.viewDetailsTextDark]}>
              Track Order
            </Text>
            <Feather name="chevron-right" size={16} color={isDark ? '#4ADE80' : '#255D35'} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isDark && styles.backButtonDark]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={20} color={isDark ? '#E8F5E9' : '#1C3723'} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>My Supply Orders</Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            Track ordered seeds, fertilizers & tools
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(farmer)/suppliers')}
          style={[styles.marketplaceBtn, isDark && styles.marketplaceBtnDark]}
        >
          <Feather name="shopping-bag" size={18} color={isDark ? '#4ADE80' : '#255D35'} />
        </TouchableOpacity>
      </View>

      {/* Overview Stats Bar */}
      <View style={[styles.statsBar, isDark && styles.statsBarDark]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, isDark && styles.statNumberDark]}>{metrics.total}</Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Total Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#0284C7' }]}>{metrics.active}</Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#16A34A' }]}>{metrics.delivered}</Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, isDark && styles.statNumberDark]}>
            Rs. {(metrics.totalSpent / 1000).toFixed(0)}k
          </Text>
          <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Total Spent</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(tab) => tab}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item: tab }) => {
            const isSelected = activeFilter === tab;
            return (
              <TouchableOpacity
                style={[
                  styles.tabChip,
                  isDark && styles.tabChipDark,
                  isSelected && styles.tabChipSelected,
                  isSelected && isDark && styles.tabChipSelectedDark,
                ]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isDark && styles.tabChipTextDark,
                    isSelected && styles.tabChipTextSelected,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#255D35'} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Loading your supply orders...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.dbId || item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#4ADE80' : '#255D35'}
              colors={['#255D35']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="package-variant"
                size={56}
                color={isDark ? '#3D5442' : '#B0BEC5'}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                No orders found
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                {activeFilter === 'All'
                  ? "You haven't placed any supply orders yet. Browse verified agricultural suppliers to get started."
                  : `You don't have any orders with status "${activeFilter}".`}
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/(farmer)/suppliers')}
              >
                <Feather name="shopping-bag" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.browseButtonText}>Browse Marketplace</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerDark: {
    backgroundColor: '#162219',
    borderBottomColor: '#1E2F23',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonDark: {
    backgroundColor: '#203324',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C3723',
  },
  headerTitleDark: {
    color: '#E8F5E9',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  headerSubtitleDark: {
    color: '#9CB3A0',
  },
  marketplaceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketplaceBtnDark: {
    backgroundColor: '#1C3322',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E5DF',
    alignItems: 'center',
  },
  statsBarDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C3723',
  },
  statNumberDark: {
    color: '#E8F5E9',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statLabelDark: {
    color: '#9CB3A0',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EAE7E0',
  },
  tabsContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  tabsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EAE7E0',
  },
  tabChipDark: {
    backgroundColor: '#1B2C1F',
  },
  tabChipSelected: {
    backgroundColor: '#255D35',
  },
  tabChipSelectedDark: {
    backgroundColor: '#4ADE80',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  tabChipTextDark: {
    color: '#9CB3A0',
  },
  tabChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E8E2',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  orderCardDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C3723',
  },
  orderIdTextDark: {
    color: '#E8F5E9',
  },
  orderTimeText: {
    fontSize: 12,
    color: '#777',
  },
  orderTimeTextDark: {
    color: '#9CB3A0',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  supplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  supplierName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#255D35',
  },
  supplierNameDark: {
    color: '#4ADE80',
  },
  supplierDistrict: {
    fontSize: 12,
    color: '#777',
  },
  supplierDistrictDark: {
    color: '#8CA592',
  },
  itemsContainer: {
    backgroundColor: '#F7F9F6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  itemsContainerDark: {
    backgroundColor: '#1A291E',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#EAE7E0',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
  itemTitleDark: {
    color: '#E8F5E9',
  },
  itemQty: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  itemQtyDark: {
    color: '#9CB3A0',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  totalLabel: {
    fontSize: 11,
    color: '#777',
  },
  totalLabelDark: {
    color: '#9CB3A0',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C3723',
  },
  totalValueDark: {
    color: '#4ADE80',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#255D35',
  },
  viewDetailsTextDark: {
    color: '#4ADE80',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#555',
    marginTop: 12,
  },
  loadingTextDark: {
    color: '#9CB3A0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444',
    marginTop: 12,
  },
  emptyTitleDark: {
    color: '#C0D5C5',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptySubtitleDark: {
    color: '#7E9F85',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#255D35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
