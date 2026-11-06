import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  fetchOrders,
  acceptOrder,
  declineOrder,
  markReady,
  markDelivered,
  Order,
  OrderStatus,
} from '../../src/lib/api/orders';
import OrderSummaryCard from '../../src/components/farmer/OrderSummaryCard';
import NewOrderBanner from '../../src/components/farmer/NewOrderBanner';
import OrderFilterTabs, { FilterKey } from '../../src/components/farmer/OrderFilterTabs';
import OrderCard from '../../src/components/farmer/OrderCard';
import AcceptDeclineModal from '../../src/components/farmer/AcceptDeclineModal';
import { useAuth } from '../../src/hooks/useAuth';

export default function FarmerOrdersScreen() {
  const { farmerId } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalAction, setModalAction] = useState<'accept' | 'decline' | null>(null);

  // Load orders from Supabase (with fallback sample data)
  const loadOrders = useCallback(async () => {
    try {
      setIsError(false);
      const data = await fetchOrders(farmerId || 'farmer-1');
      setOrders(data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [farmerId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  // Derived financial & count statistics
  const stats = useMemo(() => {
    const earned = orders
      .filter((o: Order) => o.status === 'delivered')
      .reduce((sum: number, o: Order) => sum + o.total_price, 0);

    const inProgress = orders
      .filter((o: Order) => o.status === 'accepted' || o.status === 'ready')
      .reduce((sum: number, o: Order) => sum + o.total_price, 0);

    const total = orders.length;
    const newCount = orders.filter((o: Order) => o.status === 'new').length;
    const delivered = orders.filter((o: Order) => o.status === 'delivered').length;

    return { earned, inProgress, total, newCount, delivered };
  }, [orders]);

  // Tab count numbers
  const filterCounts = useMemo<Record<string, number>>(() => {
    return {
      all: orders.length,
      new: orders.filter((o: Order) => o.status === 'new').length,
      accepted: orders.filter((o: Order) => o.status === 'accepted' || o.status === 'ready').length,
      completed: orders.filter((o: Order) => o.status === 'delivered').length,
      cancelled: orders.filter((o: Order) => o.status === 'cancelled' || o.status === 'declined').length,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo<Order[]>(() => {
    if (activeFilter === 'all') return orders;
    if (activeFilter === 'new') return orders.filter((o: Order) => o.status === 'new');
    if (activeFilter === 'accepted') return orders.filter((o: Order) => o.status === 'accepted' || o.status === 'ready');
    if (activeFilter === 'completed') return orders.filter((o: Order) => o.status === 'delivered');
    if (activeFilter === 'cancelled') return orders.filter((o: Order) => o.status === 'cancelled' || o.status === 'declined');
    return orders;
  }, [orders, activeFilter]);

  // Actions
  const handleOpenAccept = (order: Order) => {
    setSelectedOrder(order);
    setModalAction('accept');
  };

  const handleOpenDecline = (order: Order) => {
    setSelectedOrder(order);
    setModalAction('decline');
  };

  const handleConfirmAccept = async () => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.id;
    setModalAction(null);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'accepted' as OrderStatus,
              status_timestamps: { ...o.status_timestamps, accepted: new Date().toISOString() },
            }
          : o
      )
    );

    await acceptOrder(orderId);
    Alert.alert('Order Accepted', `Order ${orderId} has been accepted and moved to in-progress.`);
  };

  const handleConfirmDecline = async (reason?: string) => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.id;
    setModalAction(null);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'declined' as OrderStatus,
              decline_reason: reason || null,
              status_timestamps: { ...o.status_timestamps, declined: new Date().toISOString() },
            }
          : o
      )
    );

    await declineOrder(orderId, reason);
    Alert.alert('Order Declined', `Order ${orderId} has been declined.`);
  };

  const handleMarkReady = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'ready' as OrderStatus,
              status_timestamps: { ...o.status_timestamps, ready: new Date().toISOString() },
            }
          : o
      )
    );
    await markReady(orderId);
    Alert.alert('Status Updated', `Order ${orderId} is now marked as Ready for Delivery.`);
  };

  const handleMarkDelivered = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'delivered' as OrderStatus,
              status_timestamps: { ...o.status_timestamps, delivered: new Date().toISOString() },
            }
          : o
      )
    );
    await markDelivered(orderId);
    Alert.alert('Order Delivered', `Order ${orderId} marked as Delivered. Earnings updated!`);
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1B4D24" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </SafeAreaView>
    );
  }

  if (isError && orders.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Feather name="alert-triangle" size={36} color="#A63A24" />
        <Text style={styles.errorText}>Unable to load orders.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#1B4D24']}
            tintColor="#1B4D24"
          />
        }
      >
        {/* Header matching screenshot */}
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Incoming Purchase Orders</Text>
            <Text style={styles.title}>Orders</Text>
          </View>

          <TouchableOpacity
            style={styles.messagesIconButton}
            onPress={() => router.push('/messages')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#2A4832" />
          </TouchableOpacity>
        </View>

        {/* Agricultural Summary Card */}
        <OrderSummaryCard stats={stats} />

        {/* New Order Notification Banner */}
        {stats.newCount > 0 && (
          <NewOrderBanner
            count={stats.newCount}
            onPress={() => setActiveFilter('new')}
          />
        )}

        {/* Section Heading & Filter Tabs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your orders</Text>
        </View>

        <OrderFilterTabs
          active={activeFilter}
          onSelect={(filter: FilterKey) => setActiveFilter(filter)}
          counts={filterCounts}
        />

        {/* Order Cards List */}
        <View style={styles.ordersList}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={38} color="#9EB0A1" />
              <Text style={styles.emptyTitle}>
                {activeFilter === 'new' ? 'No new orders at the moment.' : 'No orders in this category.'}
              </Text>
              <Text style={styles.emptySubtitle}>
                New buyer purchase orders will appear here automatically.
              </Text>
            </View>
          ) : (
            filteredOrders.map((order: Order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => {
                  // If order details screen is opened
                  router.push(`/orders/${order.id}` as any);
                }}
                onAccept={order.status === 'new' ? () => handleOpenAccept(order) : undefined}
                onDecline={order.status === 'new' ? () => handleOpenDecline(order) : undefined}
                onMarkReady={order.status === 'accepted' ? () => handleMarkReady(order.id) : undefined}
                onMarkDelivered={order.status === 'ready' ? () => handleMarkDelivered(order.id) : undefined}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal for Accept & Decline */}
      {modalAction && selectedOrder && (
        <AcceptDeclineModal
          action={modalAction}
          order={selectedOrder}
          onCancel={() => setModalAction(null)}
          onConfirm={(reason?: string) => {
            if (modalAction === 'accept') {
              handleConfirmAccept();
            } else {
              handleConfirmDecline(reason);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // cream background
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110, // leave ample room above floating bottom nav
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F2EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B6251',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 10,
    fontSize: 15,
    color: '#8A2E19',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#225129',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#657E6B',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16351E', // deep forest green
    letterSpacing: -0.5,
  },
  messagesIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#183821',
  },
  ordersList: {
    marginTop: 4,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#26422D',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#7B8F80',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
