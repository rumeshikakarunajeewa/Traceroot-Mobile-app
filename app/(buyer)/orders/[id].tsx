import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { mockBuyerOrders } from '../../../src/constants/buyerMockData';
import { getOrderStatusConfig } from '../../../src/components/orders/BuyerOrderCard';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find order by ID or orderNumber
  const order = mockBuyerOrders.find((o) => o.id === id || o.orderNumber === id) || mockBuyerOrders[0];

  const statusConfig = getOrderStatusConfig(order.status);
  const isGreenhouse = order.farmingType === 'greenhouse';
  const subtotal = order.totalPrice;
  const transportFee = Math.round(subtotal * 0.08);
  const platformFee = 250;
  const grandTotal = subtotal + transportFee + platformFee;

  const handleVerifyQR = () => {
    Alert.alert(
      'Immutable Batch Verification',
      `Batch ${order.batchId} has ${order.recordsCount} tamper-proof verification blocks recorded on-chain with zero discrepancies.`,
      [{ text: 'Great' }]
    );
  };

  const handleCallCourier = () => {
    if (order.courierPhone) {
      Alert.alert(
        'Call Driver',
        `Connecting to ${order.courierName || 'Assigned Driver'} at ${order.courierPhone}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', style: 'default' },
        ]
      );
    }
  };

  const handleDownloadInvoice = () => {
    Alert.alert(
      'Tax Invoice & Trace Certificate',
      `Digital invoice for order ${order.orderNumber} and traceability report have been prepared for export.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#16301A" />
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle}>Order Details</Text>
          <Text style={styles.navSubtitle}>{order.orderNumber}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Produce Summary Card */}
        <View style={styles.produceCard}>
          <Image
            source={{ uri: order.imageUrl }}
            style={styles.produceImage}
            resizeMode="cover"
          />
          <View style={styles.produceInfo}>
            <View style={styles.cropTitleRow}>
              <Text style={styles.cropName}>{order.cropName}</Text>
              <Text style={styles.cropEmoji}>{order.cropEmoji}</Text>
            </View>

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
                {isGreenhouse ? 'Greenhouse Farming' : 'Open-field Cultivation'}
              </Text>
            </View>

            <View style={styles.farmerMeta}>
              <MaterialCommunityIcons name="account-outline" size={14} color="#6A7B6B" />
              <Text style={styles.farmerName}>{order.farmerName}</Text>
              <Text style={styles.metaBullet}>•</Text>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6A7B6B" />
              <Text style={styles.locationText}>{order.location}</Text>
            </View>
          </View>
        </View>

        {/* Blockchain Traceability Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleVerifyQR}
          style={styles.traceCard}
        >
          <View style={styles.traceHeader}>
            <View style={styles.traceIconWrapper}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#1E3523" />
            </View>
            <View style={styles.traceDetails}>
              <Text style={styles.traceTitle}>Farm-to-Table Traceability</Text>
              <Text style={styles.traceBatchId}>Batch: {order.batchId}</Text>
            </View>
            <View style={styles.recordsCountPill}>
              <MaterialCommunityIcons name="shield-check" size={13} color="#2E7D32" />
              <Text style={styles.recordsCountText}>{order.recordsCount} Records</Text>
            </View>
          </View>
          <View style={styles.traceHintRow}>
            <Text style={styles.traceHintText}>
              Cryptographically verified farm logbook. Tap to inspect audit seal.
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#556A55" />
          </View>
        </TouchableOpacity>

        {/* Delivery Timeline */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="routes" size={18} color="#16301A" />
            <Text style={styles.sectionTitle}>Delivery Timeline</Text>
          </View>

          <View style={styles.timelineContainer}>
            {order.trackingSteps.map((step, idx) => {
              const isDone = step.isCompleted;
              const isCurrent = step.isCurrent;
              const isLast = idx === order.trackingSteps.length - 1;

              return (
                <View key={step.stage + idx} style={styles.timelineItem}>
                  <View style={styles.timelineLeftColumn}>
                    <View
                      style={[
                        styles.timelineDot,
                        isDone && styles.timelineDotDone,
                        isCurrent && styles.timelineDotCurrent,
                      ]}
                    >
                      {isDone ? (
                        <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                      ) : isCurrent ? (
                        <View style={styles.currentInnerCircle} />
                      ) : null}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineConnector,
                          isDone && styles.timelineConnectorDone,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.timelineRightColumn}>
                    <View style={styles.milestoneTitleRow}>
                      <Text
                        style={[
                          styles.milestoneTitle,
                          (isDone || isCurrent) && styles.milestoneTitleActive,
                        ]}
                      >
                        {step.title}
                      </Text>
                      {step.timestamp && (
                        <Text style={styles.milestoneTimestamp}>{step.timestamp}</Text>
                      )}
                    </View>
                    <Text style={styles.milestoneDescription}>{step.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Destination & Logistics */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="truck-outline" size={18} color="#16301A" />
            <Text style={styles.sectionTitle}>Logistics & Destination</Text>
          </View>

          <View style={styles.logisticsRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color="#1E3523" />
            <View style={styles.logisticsTextContainer}>
              <Text style={styles.logisticsLabel}>Receiving Facility</Text>
              <Text style={styles.logisticsValue}>{order.deliveryAddress}</Text>
            </View>
          </View>

          {order.courierName && (
            <View style={[styles.logisticsRow, { marginTop: 12 }]}>
              <MaterialCommunityIcons name="shield-car" size={18} color="#1E3523" />
              <View style={styles.logisticsTextContainer}>
                <Text style={styles.logisticsLabel}>Assigned Carrier</Text>
                <Text style={styles.logisticsValue}>{order.courierName}</Text>
              </View>
              {order.courierPhone && (
                <TouchableOpacity
                  onPress={handleCallCourier}
                  style={styles.callCourierBtn}
                >
                  <MaterialCommunityIcons name="phone" size={14} color="#FFFFFF" />
                  <Text style={styles.callCourierBtnText}>Call</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Cost Breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="receipt-text-outline" size={18} color="#16301A" />
            <Text style={styles.sectionTitle}>Payment & Escrow Details</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              {order.cropName} ({order.quantityKg} kg @ {order.currency} {order.pricePerKg})
            </Text>
            <Text style={styles.billValue}>
              {order.currency} {subtotal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Cold-Chain Logistics Fee</Text>
            <Text style={styles.billValue}>
              {order.currency} {transportFee.toLocaleString()}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>TraceRoot Escrow Guarantee</Text>
            <Text style={styles.billValue}>
              {order.currency} {platformFee.toLocaleString()}
            </Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.totalBillRow}>
            <Text style={styles.totalBillLabel}>Total Escrow Paid</Text>
            <Text style={styles.totalBillValue}>
              {order.currency} {grandTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/(buyer)/messages' as any)}
            style={styles.chatFarmerBtn}
          >
            <MaterialCommunityIcons name="chat-outline" size={18} color="#16301A" />
            <Text style={styles.chatFarmerBtnText}>Message Farmer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleDownloadInvoice}
            style={styles.downloadInvoiceBtn}
          >
            <MaterialCommunityIcons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.downloadInvoiceBtnText}>Get Invoice & Seal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E1D7',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1EFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleContainer: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  navSubtitle: {
    fontSize: 11.5,
    color: '#768776',
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  produceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
  },
  produceImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#EBE7DE',
  },
  produceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cropName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  cropEmoji: {
    fontSize: 16,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
    marginBottom: 6,
  },
  typeEmoji: {
    fontSize: 10,
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
    fontSize: 10.5,
    fontWeight: '600',
  },
  farmerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmerName: {
    fontSize: 12,
    color: '#6A7B6B',
  },
  metaBullet: {
    fontSize: 10,
    color: '#A0ADA1',
  },
  locationText: {
    fontSize: 12,
    color: '#6A7B6B',
  },
  traceCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#C8E6C9',
  },
  traceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  traceIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traceDetails: {
    flex: 1,
    marginLeft: 10,
  },
  traceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B4D24',
  },
  traceBatchId: {
    fontSize: 11,
    color: '#388E3C',
    fontWeight: '600',
    marginTop: 1,
  },
  recordsCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  recordsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  traceHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#C8E6C9',
  },
  traceHintText: {
    fontSize: 11,
    color: '#2E7D32',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16301A',
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E1D7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotDone: {
    backgroundColor: '#2E7D32',
  },
  timelineDotCurrent: {
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  currentInnerCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E1D7',
    marginTop: -2,
    marginBottom: -2,
  },
  timelineConnectorDone: {
    backgroundColor: '#2E7D32',
  },
  timelineRightColumn: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  milestoneTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#768776',
  },
  milestoneTitleActive: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16301A',
  },
  milestoneTimestamp: {
    fontSize: 11,
    color: '#8B9C8C',
  },
  milestoneDescription: {
    fontSize: 11.5,
    color: '#556A55',
    lineHeight: 16,
  },
  logisticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logisticsTextContainer: {
    flex: 1,
  },
  logisticsLabel: {
    fontSize: 11,
    color: '#768776',
  },
  logisticsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16301A',
    marginTop: 1,
  },
  callCourierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3523',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  callCourierBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 12.5,
    color: '#6A7B6B',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16301A',
  },
  billDivider: {
    height: 0.5,
    backgroundColor: '#ECE7DD',
    marginVertical: 10,
  },
  totalBillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBillLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16301A',
  },
  totalBillValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  chatFarmerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16301A',
    borderRadius: 16,
    paddingVertical: 13,
    gap: 6,
  },
  chatFarmerBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16301A',
  },
  downloadInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3523',
    borderRadius: 16,
    paddingVertical: 13,
    gap: 6,
  },
  downloadInvoiceBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});