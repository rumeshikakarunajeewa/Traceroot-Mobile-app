import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { mockBuyerOrders } from '../../../src/constants/buyerMockData';
import { BuyerOrderItem, OrderStatus } from '../../../src/types/buyer.types';
import { BuyerOrderCard } from '../../../src/components/buyer/BuyerOrderCard';

type FilterTab = 'All' | 'Growing' | 'Pending' | 'Delivered';

export default function BuyerOrdersScreen() {
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Counts for each tab badge
  const counts = useMemo(() => {
    const growingCount = mockBuyerOrders.filter((o) => o.status === 'Growing').length;
    const pendingCount = mockBuyerOrders.filter((o) => o.status === 'Pending').length;
    const deliveredCount = mockBuyerOrders.filter((o) => o.status === 'Delivered').length;
    return {
      all: mockBuyerOrders.length,
      growing: growingCount,
      pending: pendingCount,
      delivered: deliveredCount,
    };
  }, []);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'All') return mockBuyerOrders;
    return mockBuyerOrders.filter((o) => o.status === selectedFilter);
  }, [selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const handleCropJourney = (order: BuyerOrderItem) => {
    Alert.alert(
      `${order.cropName} Crop Journey`,
      `Order: ${order.orderNumber}\nFarmer: ${order.farmerName} (${order.location})\nStatus: ${order.status} (${order.completedStages}/${order.totalStages} stages completed)\nAudit Records: ${order.lockedRecordsCount} immutable blockchain-verified log entries.`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'View Farm Profile',
          onPress: () => {
            router.push('/(buyer)/explore');
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3E6142"
          />
        }
      >
        {/* ========================================================
            1. HEADER WITH BASKET ICON & CAMERA BUTTON
           ======================================================== */}
        <View style={styles.headerRow}>
          {/* Left: Basket Icon Button */}
          <View style={styles.headerLeftBtn}>
            <MaterialCommunityIcons name="basket-outline" size={22} color="#FFFFFF" />
          </View>

          {/* Center: Title & Subtitle */}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.subtitleText}>Purchase history</Text>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>My </Text>
              <View style={styles.highlightWrapper}>
                <Text style={styles.titleHighlightText}>Orders</Text>
              </View>
            </View>
          </View>

          {/* Right: Camera / Scanner Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleScanPress()}
            style={styles.headerRightBtn}
          >
            <MaterialCommunityIcons name="camera-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ========================================================
            2. DARK FOREST GREEN STATS SUMMARY CARD
           ======================================================== */}
        <View style={styles.statsCard}>
          {/* Stat 1: Orders */}
          <View style={styles.statColumn}>
            <MaterialCommunityIcons
              name="basket-outline"
              size={16}
              color="#97AFA0"
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>3</Text>
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
            <Text style={styles.statValue}>1</Text>
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
            <Text style={styles.statValue}>9k</Text>
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
              selectedFilter === 'All' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'All'
                  ? styles.filterTextActive
                  : styles.filterTextInactive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Growing 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Growing')}
            style={[
              styles.filterPill,
              selectedFilter === 'Growing' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'Growing'
                  ? styles.filterTextActive
                  : styles.filterTextInactive,
              ]}
            >
              Growing {counts.growing}
            </Text>
          </TouchableOpacity>

          {/* Pending 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Pending')}
            style={[
              styles.filterPill,
              selectedFilter === 'Pending' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'Pending'
                  ? styles.filterTextActive
                  : styles.filterTextInactive,
              ]}
            >
              Pending {counts.pending}
            </Text>
          </TouchableOpacity>

          {/* Delivered 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Delivered')}
            style={[
              styles.filterPill,
              selectedFilter === 'Delivered' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'Delivered'
                  ? styles.filterTextActive
                  : styles.filterTextInactive,
              ]}
            >
              Delivered {counts.delivered}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ========================================================
            4. ORANGE AWAITING CONFIRMATION ALERT BANNER
           ======================================================== */}
        {(selectedFilter === 'All' || selectedFilter === 'Pending') && (
          <View style={styles.alertBanner}>
            <View style={styles.alertIconCircle}>
              <MaterialCommunityIcons name="bell-outline" size={17} color="#FFFFFF" />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertTitle}>1 order awaiting confirmation</Text>
              <Text style={styles.alertSubtitle}>
                Farmers usually confirm within 24 hours
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================
            5. ORDER CARDS LIST
           ======================================================== */}
        <View style={styles.ordersList}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, idx) => (
              <BuyerOrderCard
                key={order.id}
                order={order}
                initiallyExpanded={idx === 0} // First order (Tomato/Growing) expanded by default as in design
                onCropJourneyPress={handleCropJourney}
                onScanPress={handleScanPress}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="basket-off-outline" size={44} color="#9BAAA0" />
              <Text style={styles.emptyTitle}>No orders in this category</Text>
              <TouchableOpacity
                style={styles.resetButton}
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#283D2B',
    marginTop: 10,
    marginBottom: 16,
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
});
