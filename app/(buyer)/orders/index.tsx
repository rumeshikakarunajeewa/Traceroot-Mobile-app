import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { mockBuyerOrders } from '../../../src/constants/buyerMockData';
import { BuyerOrder } from '../../../src/types/buyer.types';
import { BuyerOrderCard } from '../../../src/components/orders/BuyerOrderCard';
import { OrderDetailModal } from '../../../src/components/orders/OrderDetailModal';

type FilterType = 'All' | 'Growing' | 'Pending' | 'Delivered';

export default function BuyerOrdersScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'ord-001': true, // Tomato card expanded by default as in Figma design
  });
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<BuyerOrder | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Toggle expand / collapse for a card
  const handleToggleExpand = (order: BuyerOrder) => {
    setExpandedIds((prev) => ({
      ...prev,
      [order.id]: !prev[order.id],
    }));
  };

  // Pull to refresh simulation
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  // Filter orders according to active pill
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return mockBuyerOrders;
    return mockBuyerOrders.filter((o) => {
      if (activeFilter === 'Growing') return o.status === 'Growing' || o.status === 'in_transit';
      if (activeFilter === 'Pending') return o.status === 'Pending' || o.status === 'processing';
      if (activeFilter === 'Delivered') return o.status === 'Delivered' || o.status === 'delivered';
      return true;
    });
  }, [activeFilter]);

  // Counts for pills
  const counts = useMemo(() => {
    const growing = mockBuyerOrders.filter(
      (o) => o.status === 'Growing' || o.status === 'in_transit'
    ).length;
    const pending = mockBuyerOrders.filter(
      (o) => o.status === 'Pending' || o.status === 'processing'
    ).length;
    const delivered = mockBuyerOrders.filter(
      (o) => o.status === 'Delivered' || o.status === 'delivered'
    ).length;

    return {
      all: mockBuyerOrders.length,
      growing,
      pending,
      delivered,
    };
  }, []);

  const handleCameraScan = (order?: BuyerOrder) => {
    Alert.alert(
      'TraceRoot QR Scanner',
      'Scan produce batch seal or QR code to verify on-chain records directly with your camera.',
      [{ text: 'Open Camera' }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const handleOpenCropJourney = (order: BuyerOrder) => {
    setSelectedOrderForModal(order);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4EFE6" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1D3524']}
            tintColor="#1D3524"
          />
        }
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          {/* Left Circular Basket Icon Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(buyer)/explore' as any)}
            style={styles.basketCircleBtn}
          >
            <MaterialCommunityIcons name="basket-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Center Title Group */}
          <View style={styles.titleGroup}>
            <Text style={styles.purchaseHistorySubtitle}>Purchase history</Text>
            <View style={styles.headlineRow}>
              <Text style={styles.headlineMy}>My </Text>
              <View style={styles.ordersHighlightBox}>
                <Text style={styles.headlineOrders}>Orders</Text>
              </View>
            </View>
          </View>

          {/* Right Circular Camera Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleCameraScan()}
            style={styles.cameraCircleBtn}
          >
            <MaterialCommunityIcons name="camera-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Metrics Banner Card (Dark Green Pill) */}
        <View style={styles.metricsCard}>
          {/* Lighter Curved Background Accent on Right */}
          <View style={styles.metricsCircleAccent} />

          {/* Column 1: Orders */}
          <View style={styles.metricColumn}>
            <MaterialCommunityIcons name="basket-outline" size={16} color="#9DBA9F" />
            <Text style={styles.metricNumber}>{counts.all}</Text>
            <Text style={styles.metricLabel}>Orders</Text>
          </View>

          {/* Column 2: Growing */}
          <View style={styles.metricColumn}>
            <MaterialCommunityIcons name="sprout-outline" size={16} color="#9DBA9F" />
            <Text style={styles.metricNumber}>{counts.growing}</Text>
            <Text style={styles.metricLabel}>Growing</Text>
          </View>

          {/* Column 3: LKR Spent */}
          <View style={styles.metricColumn}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color="#9DBA9F" />
            <Text style={styles.metricNumber}>9k</Text>
            <Text style={styles.metricLabel}>LKR spent</Text>
          </View>
        </View>

        {/* Status Filter Chips Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContainer}
        >
          {/* All */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveFilter('All')}
            style={[styles.filterChip, activeFilter === 'All' && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'All' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Growing 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveFilter('Growing')}
            style={[styles.filterChip, activeFilter === 'Growing' && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'Growing' && styles.filterChipTextActive,
              ]}
            >
              Growing {counts.growing}
            </Text>
          </TouchableOpacity>

          {/* Pending 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveFilter('Pending')}
            style={[styles.filterChip, activeFilter === 'Pending' && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'Pending' && styles.filterChipTextActive,
              ]}
            >
              Pending {counts.pending}
            </Text>
          </TouchableOpacity>

          {/* Delivered 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveFilter('Delivered')}
            style={[styles.filterChip, activeFilter === 'Delivered' && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'Delivered' && styles.filterChipTextActive,
              ]}
            >
              Delivered {counts.delivered}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Awaiting Confirmation Notice Banner */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconCircle}>
            <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.noticeTextContainer}>
            <Text style={styles.noticeTitle}>1 order awaiting confirmation</Text>
            <Text style={styles.noticeSubtitle}>Farmers usually confirm within 24 hours</Text>
          </View>
        </View>

        {/* Order Cards List */}
        {filteredOrders.map((order) => (
          <BuyerOrderCard
            key={order.id}
            order={order}
            isExpanded={!!expandedIds[order.id]}
            onToggleExpand={handleToggleExpand}
            onCropJourneyPress={handleOpenCropJourney}
            onCameraPress={handleCameraScan}
          />
        ))}
      </ScrollView>

      {/* Interactive Detail Modal for Crop Journey */}
      <OrderDetailModal
        order={selectedOrderForModal}
        visible={!!selectedOrderForModal}
        onClose={() => setSelectedOrderForModal(null)}
        onContactFarmer={() => {
          setSelectedOrderForModal(null);
          router.push('/(buyer)/messages' as any);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4EFE6',
  },
  scrollContent: {
    paddingBottom: 115, // Smooth spacing above floating capsule bottom navigation bar
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  basketCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A6F44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
    marginLeft: 14,
  },
  purchaseHistorySubtitle: {
    fontSize: 13,
    color: '#768B77',
    fontWeight: '400',
    marginBottom: 2,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headlineMy: {
    fontSize: 27,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  ordersHighlightBox: {
    backgroundColor: '#D1E1D0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  headlineOrders: {
    fontSize: 27,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  cameraCircleBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E3523',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsCard: {
    backgroundColor: '#1C3423',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'relative',
    overflow: 'hidden',
  },
  metricsCircleAccent: {
    position: 'absolute',
    right: -10,
    top: -15,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#27442F',
    opacity: 0.9,
  },
  metricColumn: {
    alignItems: 'center',
    zIndex: 2,
    minWidth: 70,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 4,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  metricLabel: {
    fontSize: 11,
    color: '#8EAA90',
    fontWeight: '500',
  },
  filterBarContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: '#FAF7F1',
    borderWidth: 1,
    borderColor: '#E2DDD0',
    paddingHorizontal: 18,
    paddingVertical: 8.5,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#3F653B',
    borderColor: '#3F653B',
  },
  filterChipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3B5838',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBECE3',
    borderWidth: 1,
    borderColor: '#F1D6C4',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
  },
  noticeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DC723A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#242424',
  },
  noticeSubtitle: {
    fontSize: 12,
    color: '#BA6D3E',
    marginTop: 2,
  },
});
