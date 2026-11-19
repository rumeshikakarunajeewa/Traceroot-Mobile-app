import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSupplierOrders, updateOrderStatus, declineOrder } from '../../../src/store/supplierOrdersStore';
import { useDarkMode } from '../../../src/store/uiStore';
import { SupplierOrderRequest } from '../../../src/types/supplier.types';

export default function SupplierOrderDetailScreen() {
  const [isDark] = useDarkMode();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [orders] = useSupplierOrders();

  const [order, setOrder] = useState<SupplierOrderRequest | null>(() => {
    return orders.find((o) => o.id === id) || null;
  });

  useEffect(() => {
    const found = orders.find((o) => o.id === id);
    if (found) {
      setOrder(found);
    }
  }, [id, orders]);

  if (!order) {
    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={isDark ? '#4ADE80' : '#1C3723'} />
        </View>
      </SafeAreaView>
    );
  }

  const handleAcceptAndPack = () => {
    Alert.alert(
      'Accept & Pack',
      `Move order ${order.id} for ${order.farmerName} to Packing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Pack',
          onPress: () => {
            updateOrderStatus(order.id, 'Packing');
            setOrder((prev) => (prev ? { ...prev, status: 'Packing', stepperStage: 'Packing' } : null));
          },
        },
      ]
    );
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      'Confirm Delivery',
      `Mark order ${order.id} as Delivered?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivered',
          onPress: () => {
            updateOrderStatus(order.id, 'Completed');
            setOrder((prev) => (prev ? { ...prev, status: 'Completed', stepperStage: 'Delivered' } : null));
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Order',
      `Are you sure you want to decline order ${order.id}? Any reserved inventory will be returned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            declineOrder(order.id);
            setOrder((prev) => (prev ? { ...prev, status: 'Declined' } : null));
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (order.status) {
      case 'New':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'Packing':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'Completed':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'Declined':
        return { bg: '#FEE2E2', text: '#B91C1C' };
      default:
        return { bg: '#E2E8F0', text: '#475569' };
    }
  };

  const statusStyle = getStatusColor();

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={[styles.backPill, isDark && styles.backPillDark]}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={isDark ? '#DCE8DE' : '#2D4030'}
          />
          <Text style={[styles.backPillText, isDark && styles.backPillTextDark]}>
            Orders
          </Text>
        </TouchableOpacity>

        {/* Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.orderId, isDark && styles.orderIdDark]}>{order.id}</Text>
            <Text style={[styles.orderTime, isDark && styles.orderTimeDark]}>{order.timeAgo}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {order.status}
            </Text>
          </View>
        </View>

        {/* Stepper Progress */}
        <View style={[styles.stepperCard, isDark && styles.stepperCardDark]}>
          <View style={styles.stepperRow}>
            {/* Step 1: Received */}
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, styles.stepDotDone]}>
                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
              </View>
              <Text style={[styles.stepLabel, isDark && styles.stepLabelDark]}>Received</Text>
            </View>

            <View style={[styles.stepLine, order.stepperStage !== 'Received' && styles.stepLineDone]} />

            {/* Step 2: Packing */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  (order.stepperStage === 'Packing' || order.stepperStage === 'Delivered') &&
                    styles.stepDotDone,
                ]}
              >
                <MaterialCommunityIcons
                  name={order.stepperStage === 'Delivered' ? 'check' : 'package-variant'}
                  size={14}
                  color="#FFF"
                />
              </View>
              <Text style={[styles.stepLabel, isDark && styles.stepLabelDark]}>Packing</Text>
            </View>

            <View style={[styles.stepLine, order.stepperStage === 'Delivered' && styles.stepLineDone]} />

            {/* Step 3: Delivered */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  order.stepperStage === 'Delivered' && styles.stepDotDone,
                ]}
              >
                <MaterialCommunityIcons name="truck-delivery" size={14} color="#FFF" />
              </View>
              <Text style={[styles.stepLabel, isDark && styles.stepLabelDark]}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Farmer Info Card */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Farmer Information</Text>
          <View style={styles.farmerRow}>
            <Image source={order.farmerAvatar} style={styles.farmerAvatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.farmerName, isDark && styles.farmerNameDark]}>
                {order.farmerName}
              </Text>
              <Text style={[styles.farmerMeta, isDark && styles.farmerMetaDark]}>
                📍 {order.district} • {order.deliveryMethod}
              </Text>
            </View>
          </View>
          {order.notes && (
            <View style={[styles.notesBox, isDark && styles.notesBoxDark]}>
              <Text style={[styles.notesLabel, isDark && styles.notesLabelDark]}>Notes:</Text>
              <Text style={[styles.notesText, isDark && styles.notesTextDark]}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Order Items List */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Order Items</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Image source={item.imageUrl} style={styles.itemImage} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.itemTitle, isDark && styles.itemTitleDark]}>{item.title}</Text>
                <Text style={[styles.itemQty, isDark && styles.itemQtyDark]}>{item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, isDark && styles.itemPriceDark]}>
                LKR {item.price.toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={[styles.divider, isDark && styles.dividerDark]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Total Order Value</Text>
            <Text style={[styles.totalAmount, isDark && styles.totalAmountDark]}>
              LKR {order.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {order.status === 'New' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAcceptAndPack}
              style={styles.primaryBtn}
            >
              <MaterialCommunityIcons name="package-variant-closed" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Accept & Start Packing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDecline}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Decline Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'Packing' && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleMarkDelivered}
            style={styles.primaryBtn}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Mark Delivered to Farmer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E2DDD2',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backPillDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  backPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#28402D',
    marginLeft: 3,
  },
  backPillTextDark: {
    color: '#DCE8DE',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  orderIdDark: {
    color: '#F0F5F1',
  },
  orderTime: {
    fontSize: 13,
    color: '#6B7E6F',
    marginTop: 2,
  },
  orderTimeDark: {
    color: '#95A997',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  stepperCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: '#187A36',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepLineDone: {
    backgroundColor: '#187A36',
  },
  stepLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  stepLabelDark: {
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C3723',
    marginBottom: 12,
  },
  cardTitleDark: {
    color: '#F0F5F1',
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C3723',
  },
  farmerNameDark: {
    color: '#F0F5F1',
  },
  farmerMeta: {
    fontSize: 12.5,
    color: '#6B7E6F',
    marginTop: 2,
  },
  farmerMetaDark: {
    color: '#95A997',
  },
  notesBox: {
    backgroundColor: '#F7F5EE',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  notesBoxDark: {
    backgroundColor: '#1E2F22',
  },
  notesLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#344E39',
  },
  notesLabelDark: {
    color: '#98B39B',
  },
  notesText: {
    fontSize: 12.5,
    color: '#1C3723',
    marginTop: 2,
  },
  notesTextDark: {
    color: '#F0F5F1',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemImage: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C3723',
  },
  itemTitleDark: {
    color: '#F0F5F1',
  },
  itemQty: {
    fontSize: 12,
    color: '#6B7E6F',
    marginTop: 2,
  },
  itemQtyDark: {
    color: '#95A997',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#187A36',
  },
  itemPriceDark: {
    color: '#4ADE80',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECE7DC',
    marginVertical: 12,
  },
  dividerDark: {
    backgroundColor: '#253B2A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C3723',
  },
  totalLabelDark: {
    color: '#F0F5F1',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#187A36',
  },
  totalAmountDark: {
    color: '#4ADE80',
  },
  actionRow: {
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#187A36',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 22,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
});