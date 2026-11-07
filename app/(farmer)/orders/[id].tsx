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
import { StatusBar } from 'expo-status-bar';

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
import InvoiceModal from '../../../src/components/farmer/InvoiceModal';
import { useDarkMode } from '../../../src/store/uiStore';

export default function OrderDetailsScreen() {
  const [isDark] = useDarkMode();
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = params.id || 'ORD-0012';

  const [order, setOrder] = useState<Order>(() => {
    return (
      INITIAL_MOCK_ORDERS.find((o) => o.id === orderId) ||
      INITIAL_MOCK_ORDERS[0]
    );
  });

  const [modalAction, setModalAction] = useState<'accept' | 'decline' | null>(null);
  const [invoiceVisible, setInvoiceVisible] = useState<boolean>(false);

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

  const handleNavigateToCrop = () => {
    const targetCropId = (order as any).crop_route_id || 'field-tomato';
    router.push({
      pathname: '/harvests/[id]',
      params: { id: targetCropId },
    } as any);
  };

  const handleNavigateToBuyerProfile = () => {
    const buyerId = order.buyer_id || 'buyer-saman';
    router.push({
      pathname: '/(farmer)/buyers',
      params: {
        id: buyerId,
        name: order.buyer_name,
      },
    } as any);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, isDark && styles.backButtonDark]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color={isDark ? '#E5EFE7' : '#16351E'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Info Card */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.orderTopRow}>
            <View>
              <Text style={[styles.orderIdText, isDark && styles.orderIdTextDark]}>{order.id}</Text>
              <Text style={[styles.orderDateText, isDark && styles.orderDateTextDark]}>Placed on {formattedDate}</Text>
            </View>
            <StatusBadge status={order.status} />
          </View>

          {/* Progress */}
          <ProgressBar status={order.status} />
        </View>

        {/* Crop Information */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardSectionTitle, isDark && styles.cardSectionTitleDark]}>Crop Information</Text>
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
              <Text style={[styles.cropName, isDark && styles.cropNameDark]}>{order.crop_name}</Text>
              <Text style={[styles.cropQuantity, isDark && styles.cropQuantityDark]}>
                Quantity: {order.quantity} {order.unit}
              </Text>
              <Text style={[styles.unitPrice, isDark && styles.unitPriceDark]}>
                Unit Price: LKR {order.unit_price}/{order.unit}
              </Text>
              <Text style={[styles.batchRef, isDark && styles.batchRefDark]}>Batch: TR-2026-LOT-08</Text>
            </View>
          </View>

          <View style={[styles.totalRow, isDark && styles.totalRowDark]}>
            <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Total Price</Text>
            <Text style={[styles.totalValue, isDark && styles.totalValueDark]}>LKR {order.total_price.toLocaleString()}</Text>
          </View>
        </View>

        {/* Buyer Information */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardSectionTitle, isDark && styles.cardSectionTitleDark]}>Buyer Information</Text>
          <View style={styles.buyerRow}>
            <TouchableOpacity
              style={styles.buyerTouchableCol}
              onPress={handleNavigateToBuyerProfile}
              activeOpacity={0.7}
            >
              <View style={[styles.buyerAvatar, isDark && styles.buyerAvatarDark]}>
                <Feather name="user" size={20} color={isDark ? '#4ADE80' : '#26542D'} />
              </View>
              <View style={styles.buyerTextCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.buyerNameText, isDark && styles.buyerNameTextDark]}>{order.buyer_name}</Text>
                  <Feather name="chevron-right" size={15} color={isDark ? '#4ADE80' : '#718475'} style={{ marginLeft: 4 }} />
                </View>
                {order.buyer_verified ? (
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={13} color="#2E6838" style={{ marginRight: 3 }} />
                    <Text style={styles.verifiedTagText}>Verified Organic Buyer</Text>
                  </View>
                ) : (
                  <Text style={styles.unverifiedText}>Community Buyer</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, isDark && styles.contactBtnDark]}
              onPress={() => router.push('/messages')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={18} color={isDark ? '#4ADE80' : '#26542D'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardSectionTitle, isDark && styles.cardSectionTitleDark]}>Delivery Information</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Delivery Method</Text>
            <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>Direct Farm Pickup / Courier</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Delivery Address</Text>
            <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>Colombo 07, Western Province</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Expected Dispatch</Text>
            <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>Within 2-3 business days</Text>
          </View>
        </View>

        {/* Purchase Invoice & Bill (Replaces QR Card) */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardSectionTitle, isDark && styles.cardSectionTitleDark]}>Order Invoice & Purchase Bill</Text>
          <Text style={[styles.traceDesc, isDark && styles.traceDescDark]}>
            Invoice #{order.invoice_number || `INV-${order.id}`} has been automatically generated according to this order's agreed quantity and price.
          </Text>
          <TouchableOpacity
            style={styles.viewInvoiceBtn}
            onPress={() => setInvoiceVisible(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="receipt-text-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.viewInvoiceBtnText}>View Official Invoice & Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Linked Crop Journey */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardSectionTitle, isDark && styles.cardSectionTitleDark]}>Linked Crop Production</Text>
          <Text style={[styles.traceDesc, isDark && styles.traceDescDark]}>
            Linked to {order.linked_crop_batch || `${order.crop_name} Batch #3`}. Tap below to view crop lifecycle and farming journey records.
          </Text>
          <TouchableOpacity
            style={[styles.linkCropBtn, isDark && styles.linkCropBtnDark]}
            onPress={handleNavigateToCrop}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="sprout" size={18} color={isDark ? '#4ADE80' : '#26542D'} style={{ marginRight: 6 }} />
            <Text style={[styles.linkCropBtnText, isDark && styles.linkCropBtnTextDark]}>View Crop Lifecycle Timeline</Text>
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

      {/* Invoice Modal */}
      <InvoiceModal
        visible={invoiceVisible}
        order={order}
        onClose={() => setInvoiceVisible(false)}
      />

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
  buyerTouchableCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  viewInvoiceBtn: {
    flexDirection: 'row',
    backgroundColor: '#204E26',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  viewInvoiceBtnText: {
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
  linkCropBtn: {
    flexDirection: 'row',
    backgroundColor: '#EDF5EE',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4E4D6',
  },
  linkCropBtnDark: {
    backgroundColor: '#1E3324',
    borderColor: '#2D4E35',
  },
  linkCropBtnText: {
    color: '#26542D',
    fontSize: 13,
    fontWeight: '700',
  },
  linkCropBtnTextDark: {
    color: '#4ADE80',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  backButtonDark: {
    backgroundColor: '#18271C',
    borderWidth: 1,
    borderColor: '#283D2C',
  },
  headerTitleDark: {
    color: '#F0F5F1',
  },
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  orderIdTextDark: {
    color: '#F0F5F1',
  },
  orderDateTextDark: {
    color: '#9CB3A0',
  },
  cardSectionTitleDark: {
    color: '#F0F5F1',
  },
  cropNameDark: {
    color: '#F0F5F1',
  },
  cropQuantityDark: {
    color: '#9CB3A0',
  },
  unitPriceDark: {
    color: '#9CB3A0',
  },
  batchRefDark: {
    color: '#4ADE80',
  },
  totalRowDark: {
    borderTopColor: '#283D2C',
  },
  totalLabelDark: {
    color: '#9CB3A0',
  },
  totalValueDark: {
    color: '#4ADE80',
  },
  buyerAvatarDark: {
    backgroundColor: '#223827',
  },
  buyerNameTextDark: {
    color: '#F0F5F1',
  },
  contactBtnDark: {
    backgroundColor: '#223827',
  },
  infoLabelDark: {
    color: '#9CB3A0',
  },
  infoValueDark: {
    color: '#F0F5F1',
  },
  traceDescDark: {
    color: '#9CB3A0',
  },
});

