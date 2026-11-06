import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  Order,
  INITIAL_MOCK_ORDERS,
  acceptOrder,
  declineOrder,
  markReady,
  markDelivered,
  OrderStatus,
} from '../../../src/lib/api/orders';
import StatusBadge from '../../../src/components/farmer/StatusBadge';
import ProgressBar from '../../../src/components/farmer/ProgressBar';
import AcceptDeclineModal from '../../../src/components/farmer/AcceptDeclineModal';

export default function OrderDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = params.id || 'ORD-0012';

  const [order, setOrder] = useState<Order>(() => {
    return (
      INITIAL_MOCK_ORDERS.find((o) => o.id === orderId) ||
      INITIAL_MOCK_ORDERS[0]
    );
  });

  const [modalAction, setModalAction] = useState<'accept' | 'decline' | null>(null);

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleConfirmAccept = async () => {
    setModalAction(null);
    setOrder((prev) => ({
      ...prev,
      status: 'accepted' as OrderStatus,
      status_timestamps: { ...prev.status_timestamps, accepted: new Date().toISOString() },
    }));
    await acceptOrder(order.id);
    Alert.alert('Order Accepted', `Order ${order.id} is now accepted.`);
  };

  const handleConfirmDecline = async (reason?: string) => {
    setModalAction(null);
    setOrder((prev) => ({
      ...prev,
      status: 'declined' as OrderStatus,
      decline_reason: reason || null,
      status_timestamps: { ...prev.status_timestamps, declined: new Date().toISOString() },
    }));
    await declineOrder(order.id, reason);
    Alert.alert('Order Declined', `Order ${order.id} has been declined.`);
  };

  const handleMarkReady = async () => {
    setOrder((prev) => ({
      ...prev,
      status: 'ready' as OrderStatus,
      status_timestamps: { ...prev.status_timestamps, ready: new Date().toISOString() },
    }));
    await markReady(order.id);
    Alert.alert('Ready for Delivery', `Order ${order.id} is ready for dispatch.`);
  };

  const handleMarkDelivered = async () => {
    setOrder((prev) => ({
      ...prev,
      status: 'delivered' as OrderStatus,
      status_timestamps: { ...prev.status_timestamps, delivered: new Date().toISOString() },
    }));
    await markDelivered(order.id);
    Alert.alert('Delivered', `Order ${order.id} has been marked as delivered.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#16351E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.orderTopRow}>
            <View>
              <Text style={styles.orderIdText}>{order.id}</Text>
              <Text style={styles.orderDateText}>Placed on {formattedDate}</Text>
            </View>
            <StatusBadge status={order.status} />
          </View>

          {/* Progress */}
          <ProgressBar status={order.status} />
        </View>

        {/* Crop Information */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Crop Information</Text>
          <View style={styles.cropRow}>
            <Image
              source={{
                uri:
                  order.crop_image ||
                  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
              }}
              style={styles.cropImage}
            />
            <View style={styles.cropDetails}>
              <Text style={styles.cropName}>{order.crop_name}</Text>
              <Text style={styles.cropQuantity}>
                Quantity: {order.quantity} {order.unit}
              </Text>
              <Text style={styles.unitPrice}>
                Unit Price: LKR {order.unit_price}/{order.unit}
              </Text>
              <Text style={styles.batchRef}>Batch: TR-2026-LOT-08</Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalValue}>LKR {order.total_price.toLocaleString()}</Text>
          </View>
        </View>

        {/* Buyer Information */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Buyer Information</Text>
          <View style={styles.buyerRow}>
            <View style={styles.buyerAvatar}>
              <Feather name="user" size={20} color="#26542D" />
            </View>
            <View style={styles.buyerTextCol}>
              <Text style={styles.buyerNameText}>{order.buyer_name}</Text>
              {order.buyer_verified ? (
                <View style={styles.verifiedTag}>
                  <Ionicons name="shield-checkmark" size={13} color="#2E6838" style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedTagText}>Verified Organic Buyer</Text>
                </View>
              ) : (
                <Text style={styles.unverifiedText}>Community Buyer</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => router.push('/messages')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#26542D" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Delivery Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Method</Text>
            <Text style={styles.infoValue}>Direct Farm Pickup / Courier</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Address</Text>
            <Text style={styles.infoValue}>Colombo 07, Western Province</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expected Dispatch</Text>
            <Text style={styles.infoValue}>Within 2-3 business days</Text>
          </View>
        </View>

        {/* Traceability Link */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Traceability & Verification</Text>
          <Text style={styles.traceDesc}>
            This order is cryptographically tied to the TraceRoot Farming Journey batch for{' '}
            {order.crop_name}.
          </Text>
          <TouchableOpacity
            style={styles.viewTimelineBtn}
            onPress={() => router.push('/(farmer)/contracts' as any)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="timeline-text-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.viewTimelineBtnText}>View Full Farming Journey</Text>
          </TouchableOpacity>
        </View>

        {/* Actions Bar */}
        {order.status === 'new' && (
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={styles.acceptActionBtn}
              onPress={() => setModalAction('accept')}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptActionBtnText}>Accept Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineActionBtn}
              onPress={() => setModalAction('decline')}
              activeOpacity={0.85}
            >
              <Text style={styles.declineActionBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'accepted' && (
          <TouchableOpacity
            style={styles.singleActionBtn}
            onPress={handleMarkReady}
            activeOpacity={0.85}
          >
            <Text style={styles.singleActionBtnText}>Mark as Ready for Delivery</Text>
          </TouchableOpacity>
        )}

        {order.status === 'ready' && (
          <TouchableOpacity
            style={[styles.singleActionBtn, { backgroundColor: '#2E6838' }]}
            onPress={handleMarkDelivered}
            activeOpacity={0.85}
          >
            <Text style={styles.singleActionBtnText}>Confirm Order Delivered</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      {modalAction && (
        <AcceptDeclineModal
          action={modalAction}
          order={order}
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
    backgroundColor: '#F5F2EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16351E',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16351E',
  },
  orderDateText: {
    fontSize: 12,
    color: '#768B7A',
    marginTop: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#183821',
    marginBottom: 12,
  },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
  },
  cropDetails: {
    marginLeft: 12,
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16351E',
  },
  cropQuantity: {
    fontSize: 13,
    color: '#526956',
    marginTop: 2,
  },
  unitPrice: {
    fontSize: 12,
    color: '#7A8E7E',
    marginTop: 1,
  },
  batchRef: {
    fontSize: 11,
    color: '#8CA090',
    fontWeight: '600',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B6251',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16351E',
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  buyerNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16351E',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedTagText: {
    fontSize: 11,
    color: '#2E6838',
    fontWeight: '600',
  },
  unverifiedText: {
    fontSize: 11,
    color: '#8A9E8F',
  },
  contactBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F7F4',
  },
  infoLabel: {
    fontSize: 13,
    color: '#657E6B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#183821',
  },
  traceDesc: {
    fontSize: 12,
    color: '#556D5A',
    lineHeight: 18,
    marginBottom: 12,
  },
  viewTimelineBtn: {
    flexDirection: 'row',
    backgroundColor: '#26542D',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewTimelineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  acceptActionBtn: {
    flex: 1.5,
    backgroundColor: '#225129',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  declineActionBtn: {
    flex: 1,
    backgroundColor: '#FDECE4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FADCCE',
  },
  declineActionBtnText: {
    color: '#9E3B18',
    fontSize: 14,
    fontWeight: '700',
  },
  singleActionBtn: {
    backgroundColor: '#1E6F9F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  singleActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

