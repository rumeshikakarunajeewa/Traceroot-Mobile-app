import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BuyerOrderItem, BuyerOrder } from '../../../src/types/buyer.types';
import { BuyerOrderCard } from '../../../src/components/buyer/BuyerOrderCard';
import { ordersService } from '../../../src/services/orders.service';
import { useAuth } from '../../../src/store/authStore';
import { authService } from '../../../src/services/auth.service';
import { useDarkMode } from '../../../src/store/uiStore';

type FilterTab = 'All' | 'Growing' | 'Pending' | 'Delivered';

function toBuyerOrderItem(order: BuyerOrder): BuyerOrderItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id,
    cropName: order.cropName,
    quantityKg: order.quantityKg,
    pricePerKg: order.pricePerKg,
    totalPrice: order.totalPrice,
    currency: order.currency || 'LKR',
    farmerName: order.farmerName,
    location: order.location,
    status: order.status,
    farmingType: order.farmingType,
    deliveryDateEst: order.estimatedDelivery || 'In Progress',
    progressPercentage: order.progressPercentage || 25,
    completedStages: order.stagesCount ?? (order.status === 'Delivered' ? 5 : order.status === 'Growing' ? 3 : 1),
    totalStages: 5,
    lockedRecordsCount: order.recordsCount ?? 8,
    imageUrl: order.imageUrl,
  };
}

export default function BuyerOrdersScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();
  const [orders, setOrders] = useState<BuyerOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Load live orders from Supabase
  const loadOrders = useCallback(async () => {
    try {
      const buyerId = user?.id || (await authService.getSession())?.user?.id;
      if (!buyerId) {
        setOrders([]);
        return;
      }
      const liveOrders = await ordersService.fetchBuyerOrders(buyerId);
      if (Array.isArray(liveOrders)) {
        setOrders(liveOrders.map(toBuyerOrderItem));
      }
    } catch (err) {
      console.warn('Failed to load live buyer orders from Supabase:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const buyerId = user?.id || (await authService.getSession())?.user?.id;
      if (!buyerId) {
        if (isMounted) {
          setOrders([]);
          setIsLoading(false);
        }
        return;
      }
      try {
        const liveOrders = await ordersService.fetchBuyerOrders(buyerId);
        if (isMounted && Array.isArray(liveOrders)) {
          setOrders(liveOrders.map(toBuyerOrderItem));
        }
      } catch (err) {
        console.warn('Failed to load live buyer orders from Supabase:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    // Real-time subscription to order updates made by farmers
    const unsubscribe = ordersService.subscribeToOrders({ buyerId: user?.id }, () => {
      loadOrders();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user, loadOrders]);

  // Counts for each tab badge
  const counts = useMemo(() => {
    const growingCount = orders.filter((o) => o.status === 'Growing').length;
    const pendingCount = orders.filter((o) => o.status === 'Pending').length;
    const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
    return {
      all: orders.length,
      growing: growingCount,
      pending: pendingCount,
      delivered: deliveredCount,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'All') return orders;
    return orders.filter((o) => o.status === selectedFilter);
  }, [orders, selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleCropJourney = (order: BuyerOrderItem) => {
    Alert.alert(
      `${order.cropName} Crop Journey`,
      `Order: ${order.orderNumber}\nFarmer: ${order.farmerName} (${order.location})\nStatus: ${order.status} (${order.completedStages}/${order.totalStages} stages completed)\nAudit Records: ${order.lockedRecordsCount} immutable blockchain-verified log entries.`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'View Full Timeline',
          onPress: () => {
            router.push(`/(buyer)/orders/${order.id}` as any);
          },
        },
      ]
    );
  };

  const handleScanPress = (order?: BuyerOrderItem) => {
    Alert.alert(
      'Scan Produce QR Code',
      `Scan the TraceRoot QR code on ${order ? order.cropName : 'your package'} to trace origin, soil health records, and cold-chain compliance.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4ADE80' : '#3E6142'}
          />
        }
      >
        {/* ========================================================
            1. HEADER WITH BASKET ICON & CAMERA BUTTON
           ======================================================== */}
        <View style={styles.headerRow}>
          {/* Left: Basket Icon Button */}
          <View style={[styles.headerLeftBtn, isDark && styles.headerLeftBtnDark]}>
            <MaterialCommunityIcons name="basket-outline" size={22} color="#FFFFFF" />
          </View>

          {/* Center: Title & Subtitle */}
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.subtitleText, isDark && styles.subtitleTextDark]}>Purchase history</Text>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, isDark && styles.titleTextDark]}>My </Text>
              <View style={[styles.highlightWrapper, isDark && styles.highlightWrapperDark]}>
                <Text style={[styles.titleHighlightText, isDark && styles.titleHighlightTextDark]}>Orders</Text>
              </View>
            </View>
          </View>

          {/* Right: Camera / Scanner Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleScanPress()}
            style={[styles.headerRightBtn, isDark && styles.headerRightBtnDark]}
          >
            <MaterialCommunityIcons name="camera-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ========================================================
            2. DARK FOREST GREEN STATS SUMMARY CARD
           ======================================================== */}
        <View style={[styles.statsCard, isDark && styles.statsCardDark]}>
          {/* Stat 1: Orders */}
          <View style={styles.statColumn}>
            <MaterialCommunityIcons
              name="basket-outline"
              size={16}
              color="#97AFA0"
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{counts.all}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>

          {/* Stat 2: Growing */}
          <View style={styles.statColumn}>
            <MaterialCommunityIcons
              name="sprout-outline"
              size={16}
              color="#97AFA0"
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{counts.growing}</Text>
            <Text style={styles.statLabel}>Growing</Text>
          </View>

          {/* Stat 3: LKR spent (with circular soft tint backdrop) */}
          <View style={styles.statColumnHighlight}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={16}
              color="#C0D7C9"
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>
              {(() => {
                const total = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
                return total >= 1000 ? `${Math.round(total / 1000)}k` : `${total}`;
              })()}
            </Text>
            <Text style={styles.statLabel}>LKR spent</Text>
          </View>
        </View>

        {/* ========================================================
            3. HORIZONTAL FILTER TABS
           ======================================================== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContainer}
        >
          {/* All */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('All')}
            style={[
              styles.filterPill,
              selectedFilter === 'All'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'All'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Growing */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Growing')}
            style={[
              styles.filterPill,
              selectedFilter === 'Growing'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'Growing'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
              ]}
            >
              Growing {counts.growing}
            </Text>
          </TouchableOpacity>

          {/* Pending */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Pending')}
            style={[
              styles.filterPill,
              selectedFilter === 'Pending'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'Pending'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
              ]}
            >
              Pending {counts.pending}
            </Text>
          </TouchableOpacity>

          {/* Delivered */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Delivered')}
            style={[
              styles.filterPill,
              selectedFilter === 'Delivered'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'Delivered'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
              ]}
            >
              Delivered {counts.delivered}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ========================================================
            4. ORANGE AWAITING CONFIRMATION ALERT BANNER
           ======================================================== */}
        {(selectedFilter === 'All' || selectedFilter === 'Pending') && counts.pending > 0 && (
          <View style={[styles.alertBanner, isDark && styles.alertBannerDark]}>
            <View style={styles.alertIconCircle}>
              <MaterialCommunityIcons name="bell-outline" size={17} color="#FFFFFF" />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={[styles.alertTitle, isDark && styles.alertTitleDark]}>
                {counts.pending} {counts.pending === 1 ? 'order' : 'orders'} awaiting confirmation
              </Text>
              <Text style={[styles.alertSubtitle, isDark && styles.alertSubtitleDark]}>
                Farmers usually confirm within 24 hours
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================
            5. ORDER CARDS LIST
           ======================================================== */}
        <View style={styles.ordersList}>
          {isLoading && orders.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#436647'} />
              <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
                Loading your orders...
              </Text>
            </View>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order, idx) => (
              <BuyerOrderCard
                key={order.id}
                order={order}
                initiallyExpanded={idx === 0}
                onCropJourneyPress={handleCropJourney}
                onScanPress={handleScanPress}
              />
            ))
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={52}
                color={isDark ? '#4ADE80' : '#8A9E8E'}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>No Orders Yet</Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                You haven&apos;t placed any produce orders with farmers yet. Explore our verified marketplace to source fresh harvest!
              </Text>
              <TouchableOpacity
                style={[styles.browseButton, isDark && styles.browseButtonDark]}
                activeOpacity={0.85}
                onPress={() => router.push('/(buyer)/explore')}
              >
                <MaterialCommunityIcons name="basket-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.browseButtonText}>Browse Marketplace</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="basket-off-outline"
                size={44}
                color={isDark ? '#4ADE80' : '#9BAAA0'}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                No orders in this category
              </Text>
              <TouchableOpacity
                style={[styles.resetButton, isDark && styles.resetButtonDark]}
                onPress={() => setSelectedFilter('All')}
              >
                <Text style={styles.resetButtonText}>View All Orders</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA', // Warm organic ivory/cream matching design screenshot
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 115, // Space for the floating bottom navigation bar
  },

  /* 1. Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  headerLeftBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#406045',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  subtitleText: {
    fontSize: 12,
    color: '#657867',
    fontWeight: '500',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#152E1B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  highlightWrapper: {
    backgroundColor: '#DEE8DF',
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  titleHighlightText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#152E1B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  headerRightBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C3523',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  /* 2. Forest Green Stats Card */
  statsCard: {
    backgroundColor: '#1C3725',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#1C3725',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statColumnHighlight: {
    flex: 1.1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 8,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#9BB2A4',
    fontWeight: '500',
  },

  /* 3. Filter Tabs */
  filterTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#436647',
    shadowColor: '#436647',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillInactive: {
    backgroundColor: '#FAF7F1',
    borderWidth: 1,
    borderColor: '#D8D1C3',
  },
  filterPillText: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterTextInactive: {
    color: '#283C2A',
    fontWeight: '500',
  },

  /* 4. Orange Awaiting Confirmation Banner */
  alertBanner: {
    backgroundColor: '#FCEFE4',
    borderWidth: 1,
    borderColor: '#F3DEC9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E66C22',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E66C22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#382315',
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#B35920',
    fontWeight: '500',
    marginTop: 2,
  },

  /* 5. Orders List */
  ordersList: {
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B6350',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#283D2B',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#657D6A',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 300,
  },
  browseButton: {
    backgroundColor: '#3E6142',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3E6142',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: '#436647',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Dark Mode Overrides */
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  headerLeftBtnDark: {
    backgroundColor: '#2E6930',
  },
  subtitleTextDark: {
    color: '#98B39B',
  },
  titleTextDark: {
    color: '#F0F5F1',
  },
  highlightWrapperDark: {
    backgroundColor: '#203924',
  },
  titleHighlightTextDark: {
    color: '#4ADE80',
  },
  headerRightBtnDark: {
    backgroundColor: '#18271C',
    borderWidth: 1,
    borderColor: '#263B2B',
  },
  statsCardDark: {
    backgroundColor: '#142517',
    borderWidth: 1,
    borderColor: '#263B2B',
  },
  filterPillInactiveDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  filterTextInactiveDark: {
    color: '#98B39B',
  },
  alertBannerDark: {
    backgroundColor: '#2B1F16',
    borderColor: '#4A311D',
  },
  alertTitleDark: {
    color: '#FDE8D7',
  },
  alertSubtitleDark: {
    color: '#FDBA74',
  },
  loadingTextDark: {
    color: '#98B39B',
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitleDark: {
    color: '#98B39B',
  },
  browseButtonDark: {
    backgroundColor: '#2E6930',
  },
  resetButtonDark: {
    backgroundColor: '#2E6930',
  },
});
