import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import { Order } from '../../lib/api/orders';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
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
  const placeholder = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80';

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
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

      {/* Middle Section: Price & Chevron Button */}
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

        <TouchableOpacity style={styles.chevronButton} onPress={onPress}>
          <Feather name="chevron-down" size={18} color="#4A6550" />
        </TouchableOpacity>
      </View>

      {/* Action Buttons for New orders */}
      {order.status === 'new' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAccept}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.acceptBtnText}>Accept Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineBtn}
            onPress={onDecline}
            activeOpacity={0.85}
          >
            <Ionicons name="close-sharp" size={16} color="#9E3B18" style={{ marginRight: 4 }} />
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Button for Accepted orders */}
      {order.status === 'accepted' && onMarkReady && (
        <TouchableOpacity
          style={styles.readyBtn}
          onPress={onMarkReady}
          activeOpacity={0.85}
        >
          <Feather name="package" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.readyBtnText}>Mark as Ready for Delivery</Text>
        </TouchableOpacity>
      )}

      {/* Action Button for Ready orders */}
      {order.status === 'ready' && onMarkDelivered && (
        <TouchableOpacity
          style={styles.deliveredBtn}
          onPress={onMarkDelivered}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.deliveredBtnText}>Confirm Delivered</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Progress Bar */}
      <ProgressBar status={order.status} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
    fontSize: 20,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#225129',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  declineBtn: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    backgroundColor: '#FDECE4',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8D1C0',
  },
  declineBtnText: {
    color: '#9E3B18',
    fontSize: 13,
    fontWeight: '700',
  },
  readyBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E6F9F',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  readyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  deliveredBtn: {
    flexDirection: 'row',
    backgroundColor: '#2F6E1C',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deliveredBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
