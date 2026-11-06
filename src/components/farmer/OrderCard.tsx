import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import InvoiceModal from './InvoiceModal';
import { Order } from '../../lib/api/orders';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onMarkReady?: () => void;
  onMarkDelivered?: () => void;
}

export default function OrderCard({
  order,
  onPress,
  onAccept,
  onDecline,
  onMarkReady,
  onMarkDelivered,
}: OrderCardProps) {
  // Expansion state controlled by the circular chevron scroll button
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [invoiceVisible, setInvoiceVisible] = useState<boolean>(false);

  const placeholder = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80';

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  // Map to the crop detail route
  const handleNavigateToCrop = () => {
    let targetCropId = order.crop_route_id;
    if (!targetCropId) {
      const lower = order.crop_name.toLowerCase();
      if (lower.includes('tomato')) targetCropId = 'field-tomato';
      else if (lower.includes('carrot')) targetCropId = 'field-carrots';
      else if (lower.includes('bean')) targetCropId = 'field-beans';
      else if (lower.includes('potato')) targetCropId = 'field-potato';
      else targetCropId = 'field-tomato';
    }

    router.push({
      pathname: '/harvests/[id]',
      params: { id: targetCropId },
    } as any);
  };

  // Navigate to messages
  const handleNavigateToMessages = () => {
    router.push('/(farmer)/messages' as any);
  };

  const deadline = order.deadline || '25 Sep 2026';
  const buyerNotes = order.buyer_notes || 'Greenhouse-grown preferred. No pesticides after 7 Sep.';
  const linkedCropText = order.linked_crop_batch || `${order.crop_name} — Batch #3 (Kandy Farm)`;

  return (
    <View style={styles.card}>
      {/* Top Section: Image, Crop & Buyer info, Status Badge */}
      <View style={styles.topRow}>
        <Image
          source={{ uri: order.crop_image || placeholder }}
          style={styles.cropImage}
        />

        <View style={styles.headerInfo}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.cropTitle} numberOfLines={1}>
            {order.crop_name} • {order.quantity} {order.unit}
          </Text>

          <View style={styles.buyerRow}>
            <Feather name="user" size={13} color="#556E5A" style={{ marginRight: 4 }} />
            <Text style={styles.buyerName} numberOfLines={1}>{order.buyer_name}</Text>
          </View>

          {order.buyer_verified && (
            <Text style={styles.verifiedText}>Verified Buyer</Text>
          )}
        </View>

        <View style={styles.badgeWrapper}>
          <StatusBadge status={order.status} />
        </View>
      </View>

      {/* Price & Chevron Scroll/Expand Button */}
      <View style={styles.priceRow}>
        <View style={styles.priceContainer}>
          <View style={styles.priceTextRow}>
            <Text style={styles.currencyPrefix}>LKR </Text>
            <Text style={styles.priceValue}>{order.total_price.toLocaleString()}</Text>
          </View>
          <Text style={styles.unitSubtext}>
            @ LKR {order.unit_price}/{order.unit} • Ordered {formattedDate}
          </Text>
        </View>

        {/* Circular Chevron Expand/Scroll Button matching screenshot */}
        <TouchableOpacity
          style={styles.chevronButton}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <Feather
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#395A3E"
          />
        </TouchableOpacity>
      </View>

      {/* Progress Bar (Placed -> Accepted -> Ready -> Delivered) */}
      <ProgressBar status={order.status} />

      {/* Collapsed actions if not expanded */}
      {!isExpanded && order.status === 'new' && (
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.acceptQuickBtn} onPress={onAccept}>
            <Text style={styles.quickBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineQuickBtn} onPress={onDecline}>
            <Text style={styles.declineQuickText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* EXPANDED SECTION matching uploaded screenshot */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          {/* 1. DEADLINE CARD */}
          <View style={styles.detailCard}>
            <View style={styles.deadlineIconWrapper}>
              <Ionicons name="sunny-outline" size={20} color="#859987" />
            </View>
            <View style={styles.deadlineTextCol}>
              <Text style={styles.cardHeaderLabel}>DEADLINE</Text>
              <Text style={styles.deadlineValue}>{deadline}</Text>
            </View>
          </View>

          {/* 2. BUYER NOTES CARD */}
          <View style={styles.detailCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.notesHeaderLabel}>BUYER NOTES</Text>
              <Text style={styles.buyerNotesText}>{buyerNotes}</Text>
            </View>
          </View>

          {/* 3. LINKED TO YOUR CROP CARD */}
          <TouchableOpacity
            style={styles.cropLinkedCard}
            onPress={handleNavigateToCrop}
            activeOpacity={0.8}
          >
            <View style={styles.cropLinkedLeft}>
              <View style={styles.cropIconCircle}>
                <MaterialCommunityIcons name="sprout" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.cropLinkedTextWrapper}>
                <Text style={styles.cropLinkedLabel}>LINKED TO YOUR CROP</Text>
                <Text style={styles.cropLinkedTitle} numberOfLines={1}>
                  {linkedCropText}
                </Text>
              </View>
            </View>

            <View style={styles.viewCropBtn}>
              <Text style={styles.viewCropBtnText}>View</Text>
            </View>
          </TouchableOpacity>

          {/* 4. INVOICE / BILL GENERATION CARD (Replaces the QR card) */}
          <TouchableOpacity
            style={styles.invoiceCard}
            onPress={() => setInvoiceVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.invoiceLeft}>
              <View style={styles.invoiceIconCircle}>
                <MaterialCommunityIcons name="receipt-text-outline" size={18} color="#204F26" />
              </View>
              <View style={styles.invoiceTextCol}>
                <Text style={styles.invoiceCardLabel}>PURCHASE INVOICE & BILL</Text>
                <Text style={styles.invoiceCardTitle} numberOfLines={1}>
                  {order.invoice_number || `INV-${order.id}`} • Ready for View/Print
                </Text>
              </View>
            </View>

            <View style={styles.viewInvoiceBtn}>
              <Text style={styles.viewInvoiceBtnText}>View Bill</Text>
            </View>
          </TouchableOpacity>

          {/* 5. ACTION BUTTONS IN EXPANDED VIEW */}
          {order.status === 'accepted' && (
            <TouchableOpacity
              style={styles.markReadyBtn}
              onPress={onMarkReady}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="basket"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.markReadyBtnText}>Mark as Ready to Deliver</Text>
            </TouchableOpacity>
          )}

          {order.status === 'new' && (
            <View style={styles.newActionsExpandedRow}>
              <TouchableOpacity
                style={styles.acceptExpandedBtn}
                onPress={onAccept}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.acceptExpandedBtnText}>Accept Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineExpandedBtn}
                onPress={onDecline}
                activeOpacity={0.85}
              >
                <Text style={styles.declineExpandedBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {order.status === 'ready' && (
            <TouchableOpacity
              style={styles.deliveredExpandedBtn}
              onPress={onMarkDelivered}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-done"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.deliveredExpandedBtnText}>Confirm Order Delivered</Text>
            </TouchableOpacity>
          )}

          {/* 6. MESSAGE BUYER LINK */}
          <TouchableOpacity
            style={styles.messageBuyerRow}
            onPress={handleNavigateToMessages}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={17}
              color="#24542B"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.messageBuyerText}>Message {order.buyer_name}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Invoice / Bill Modal Popup */}
      <InvoiceModal
        visible={invoiceVisible}
        order={order}
        onClose={() => setInvoiceVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cropImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  orderId: {
    fontSize: 11,
    color: '#8A9E8F',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16351E',
    marginBottom: 3,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  buyerName: {
    fontSize: 13,
    color: '#465D4B',
    fontWeight: '600',
  },
  verifiedText: {
    fontSize: 11,
    color: '#8A9E8F',
    fontWeight: '500',
  },
  badgeWrapper: {
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F5F2',
  },
  priceContainer: {
    flex: 1,
  },
  priceTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencyPrefix: {
    fontSize: 13,
    color: '#16351E',
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 22,
    color: '#16351E',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unitSubtext: {
    fontSize: 11,
    color: '#768B7A',
    fontWeight: '500',
    marginTop: 2,
  },
  chevronButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F6F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  acceptQuickBtn: {
    flex: 1,
    backgroundColor: '#225129',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  declineQuickBtn: {
    paddingHorizontal: 16,
    backgroundColor: '#FDECE4',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  declineQuickText: {
    color: '#9E3B18',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedSection: {
    marginTop: 16,
    gap: 10,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFA',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAEFEA',
  },
  deadlineIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deadlineTextCol: {
    flex: 1,
  },
  cardHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A9E8F',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  deadlineValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16351E',
  },
  notesHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9E8062',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  buyerNotesText: {
    fontSize: 13,
    color: '#344E39',
    fontWeight: '500',
    lineHeight: 18,
  },
  cropLinkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDF4EE',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBE7DD',
  },
  cropLinkedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cropIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#24522C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cropLinkedTextWrapper: {
    flex: 1,
  },
  cropLinkedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#55755C',
    letterSpacing: 0.4,
  },
  cropLinkedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16351E',
    marginTop: 2,
  },
  viewCropBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D4E2D6',
  },
  viewCropBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#24522C',
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F8F4',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D0E3D3',
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  invoiceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCECE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  invoiceTextCol: {
    flex: 1,
  },
  invoiceCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B6E53',
    letterSpacing: 0.4,
  },
  invoiceCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16351E',
    marginTop: 2,
  },
  viewInvoiceBtn: {
    backgroundColor: '#24522C',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markReadyBtn: {
    flexDirection: 'row',
    backgroundColor: '#DC6826', // vibrant orange pill button matching screenshot
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#DC6826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  markReadyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  newActionsExpandedRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  acceptExpandedBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#225129',
    borderRadius: 20,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptExpandedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  declineExpandedBtn: {
    flex: 1,
    backgroundColor: '#FDECE4',
    borderRadius: 20,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8D1C0',
  },
  declineExpandedBtnText: {
    color: '#9E3B18',
    fontSize: 14,
    fontWeight: '700',
  },
  deliveredExpandedBtn: {
    flexDirection: 'row',
    backgroundColor: '#26542D',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  deliveredExpandedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  messageBuyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 2,
  },
  messageBuyerText: {
    color: '#24542B',
    fontSize: 14,
    fontWeight: '700',
  },
});
