import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuyerOrder, OrderStatus } from '../../types/buyer.types';

interface BuyerOrderCardProps {
  order: BuyerOrder;
  onPress: (order: BuyerOrder) => void;
  onTrackPress: (order: BuyerOrder) => void;
  onContactFarmer?: (order: BuyerOrder) => void;
}

export const getOrderStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'in_transit':
      return {
        label: 'In Transit',
        bg: '#FFF4E5',
        text: '#D97706',
        dotColor: '#F59E0B',
        icon: 'truck-fast-outline' as const,
      };
    case 'processing':
      return {
        label: 'Processing',
        bg: '#EDF2FE',
        text: '#3F61D6',
        dotColor: '#3B82F6',
        icon: 'clock-outline' as const,
      };
    case 'delivered':
      return {
        label: 'Delivered',
        bg: '#E8F5E9',
        text: '#2E7D32',
        dotColor: '#22C55E',
        icon: 'check-circle-outline' as const,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: '#FEE2E2',
        text: '#DC2626',
        dotColor: '#EF4444',
        icon: 'close-circle-outline' as const,
      };
    case 'confirmed':
    default:
      return {
        label: 'Confirmed',
        bg: '#F3E8FF',
        text: '#7E22CE',
        dotColor: '#A855F7',
        icon: 'check-outline' as const,
      };
  }
};

export const BuyerOrderCard: React.FC<BuyerOrderCardProps> = ({
  order,
  onPress,
  onTrackPress,
  onContactFarmer,
}) => {
  const statusConfig = getOrderStatusConfig(order.status);
  const isGreenhouse = order.farmingType === 'greenhouse';

  // Determine active step index for the mini progress line
  const activeStepIndex = order.trackingSteps.findIndex((s) => s.isCurrent);
  const allCompleted = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress(order)}
      style={styles.cardContainer}
    >
      {/* Top Header: Order ID, Date & Status Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.orderIdGroup}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{order.createdAt}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Produce Overview Row */}
      <View style={styles.produceRow}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: order.imageUrl }}
            style={styles.produceImage}
            resizeMode="cover"
          />
          <View style={styles.emojiOverlay}>
            <Text style={styles.cropEmoji}>{order.cropEmoji}</Text>
          </View>
        </View>

        <View style={styles.produceDetails}>
          <View style={styles.cropTitleRow}>
            <Text style={styles.cropName}>{order.cropName}</Text>
            <View
              style={[
                styles.typePill,
                isGreenhouse ? styles.greenhousePill : styles.openFieldPill,
              ]}
            >
              <Text style={styles.typeEmoji}>{isGreenhouse ? '🏡' : '🌾'}</Text>
              <Text
                style={[
                  styles.typePillText,
                  isGreenhouse ? styles.greenhouseText : styles.openFieldText,
                ]}
              >
                {isGreenhouse ? 'Greenhouse' : 'Open-field'}
              </Text>
            </View>
          </View>

          {/* Farmer & Location */}
          <View style={styles.farmerMetaRow}>
            <MaterialCommunityIcons name="account-outline" size={13} color="#6A7B6B" />
            <Text style={styles.farmerName} numberOfLines={1}>
              {order.farmerName}
            </Text>
            <Text style={styles.metaBullet}>•</Text>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color="#6A7B6B" />
            <Text style={styles.locationText} numberOfLines={1}>
              {order.location}
            </Text>
          </View>

          {/* Quantity & Unit Price */}
          <View style={styles.priceMetaRow}>
            <Text style={styles.quantityLabel}>
              {order.quantityKg} kg @ {order.currency} {order.pricePerKg}/kg
            </Text>
            <Text style={styles.totalPriceValue}>
              {order.currency} {order.totalPrice.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Mini Progress Stepper (Hidden if Cancelled) */}
      {!isCancelled && order.trackingSteps && order.trackingSteps.length > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.stepperTrack}>
            {order.trackingSteps.map((step, idx) => {
              const isDone = step.isCompleted || allCompleted;
              const isCurrent = step.isCurrent && !allCompleted;

              return (
                <React.Fragment key={step.stage + idx}>
                  <View style={styles.stepNodeContainer}>
                    <View
                      style={[
                        styles.stepDot,
                        isDone && styles.stepDotDone,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    >
                      {isDone ? (
                        <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                      ) : isCurrent ? (
                        <View style={styles.innerCurrentDot} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.stepTitle,
                        (isDone || isCurrent) && styles.stepTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {step.stage === 'placed'
                        ? 'Placed'
                        : step.stage === 'harvested'
                        ? 'Packed'
                        : step.stage === 'in_transit'
                        ? 'Transit'
                        : 'Delivered'}
                    </Text>
                  </View>

                  {idx < order.trackingSteps.length - 1 && (
                    <View
                      style={[
                        styles.stepConnector,
                        (isDone || (isCurrent && idx < (activeStepIndex || 0))) &&
                          styles.stepConnectorDone,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Delivery Estimate / Status Line */}
          <View style={styles.estimateRow}>
            <MaterialCommunityIcons
              name={statusConfig.icon}
              size={14}
              color={statusConfig.text}
            />
            <Text style={[styles.estimateText, { color: statusConfig.text }]}>
              {order.status === 'delivered'
                ? order.estimatedDelivery
                : `Est. Delivery: ${order.estimatedDelivery}`}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Footer: Verification Badge & Actions */}
      <View style={styles.cardFooter}>
        <View style={styles.recordsPill}>
          <MaterialCommunityIcons name="shield-check" size={12} color="#2E7D32" />
          <Text style={styles.recordsPillText}>
            {order.recordsCount} verified records
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          {onContactFarmer && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onContactFarmer(order)}
              style={styles.contactBtn}
            >
              <MaterialCommunityIcons
                name="chat-outline"
                size={15}
                color="#2C4E32"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => onTrackPress(order)}
            style={styles.trackBtn}
          >
            <Text style={styles.trackBtnText}>
              {order.status === 'in_transit'
                ? 'Track Order'
                : order.status === 'delivered'
                ? 'View Trace'
                : 'View Details'}
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={14}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdGroup: {
    flexDirection: 'column',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16301A',
    letterSpacing: 0.2,
  },
  orderDate: {
    fontSize: 11.5,
    color: '#768776',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#F0ECE4',
    marginBottom: 12,
  },
  produceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EBE7DE',
  },
  produceImage: {
    width: '100%',
    height: '100%',
  },
  emojiOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cropEmoji: {
    fontSize: 12,
  },
  produceDetails: {
    flex: 1,
    marginLeft: 12,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  typeEmoji: {
    fontSize: 9,
  },
  greenhousePill: {
    backgroundColor: '#EDF2FE',
  },
  greenhouseText: {
    color: '#3F61D6',
  },
  openFieldPill: {
    backgroundColor: '#FFF4E5',
  },
  openFieldText: {
    color: '#D97706',
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  farmerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  farmerName: {
    fontSize: 12,
    color: '#6A7B6B',
    maxWidth: 100,
  },
  metaBullet: {
    fontSize: 10,
    color: '#A0ADA1',
  },
  locationText: {
    fontSize: 12,
    color: '#6A7B6B',
    flex: 1,
  },
  priceMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#556A55',
    fontWeight: '500',
  },
  totalPriceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  progressSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#F2EFE8',
  },
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  stepNodeContainer: {
    alignItems: 'center',
    width: 48,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E1D7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: '#2E7D32',
  },
  stepDotCurrent: {
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  innerCurrentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 9.5,
    color: '#8B9C8C',
    fontWeight: '500',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#16301A',
    fontWeight: '700',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E1D7',
    marginBottom: 16,
  },
  stepConnectorDone: {
    backgroundColor: '#2E7D32',
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  estimateText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#F0ECE4',
  },
  recordsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  recordsPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#2E7D32',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1EFE8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDD8CE',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3523',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 5,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
