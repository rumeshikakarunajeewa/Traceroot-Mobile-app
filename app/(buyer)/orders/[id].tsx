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
import { useDarkMode } from '../../../src/store/uiStore';

export default function OrderDetailScreen() {
  const [isDark] = useDarkMode();
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
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top']}
    >
      {/* Top Navigation Bar */}
      <View style={[styles.navBar, isDark && styles.navBarDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isDark && styles.backButtonDark]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={isDark ? '#F0F5F1' : '#16301A'}
          />
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={[styles.navTitle, isDark && styles.navTitleDark]}>
            Order Details
          </Text>
          <Text style={[styles.navSubtitle, isDark && styles.navSubtitleDark]}>
            {order.orderNumber}
          </Text>
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
        <View style={[styles.produceCard, isDark && styles.produceCardDark]}>
          <Image
            source={{ uri: order.imageUrl }}
            style={styles.produceImage}
            resizeMode="cover"
          />
          <View style={styles.produceInfo}>
            <View style={styles.cropTitleRow}>
              <Text style={[styles.cropName, isDark && styles.cropNameDark]}>
                {order.cropName}
              </Text>
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
              <MaterialCommunityIcons
                name="account-outline"
                size={14}
                color={isDark ? '#98B39B' : '#6A7B6B'}
              />
              <Text
                style={[styles.farmerName, isDark && styles.farmerNameDark]}
              >
                {order.farmerName}
              </Text>
              <Text style={styles.metaBullet}>•</Text>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={isDark ? '#98B39B' : '#6A7B6B'}
              />
              <Text
                style={[styles.locationText, isDark && styles.locationTextDark]}
              >
                {order.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Blockchain Traceability Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleVerifyQR}
          style={[styles.traceCard, isDark && styles.traceCardDark]}
        >
          <View style={styles.traceHeader}>
            <View
              style={[
                styles.traceIconWrapper,
                isDark && styles.traceIconWrapperDark,
              ]}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={20}
                color={isDark ? '#4ADE80' : '#1E3523'}
              />
            </View>
            <View style={styles.traceDetails}>
              <Text style={[styles.traceTitle, isDark && styles.traceTitleDark]}>
                Farm-to-Table Traceability
              </Text>
              <Text
                style={[styles.traceBatchId, isDark && styles.traceBatchIdDark]}
              >
                Batch: {order.batchId}
              </Text>
            </View>
            <View
              style={[
                styles.recordsCountPill,
                isDark && styles.recordsCountPillDark,
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={13}
                color={isDark ? '#4ADE80' : '#2E7D32'}
              />
              <Text
                style={[
                  styles.recordsCountText,
                  isDark && styles.recordsCountTextDark,
                ]}
              >
                {order.recordsCount} Records
              </Text>
            </View>
          </View>
          <View style={[styles.traceHintRow, isDark && styles.traceHintRowDark]}>
            <Text
              style={[styles.traceHintText, isDark && styles.traceHintTextDark]}
            >
              Cryptographically verified farm logbook. Tap to inspect audit seal.
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={isDark ? '#4ADE80' : '#556A55'}
            />
          </View>
        </TouchableOpacity>

        {/* Delivery Timeline */}
        <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="routes"
              size={18}
              color={isDark ? '#4ADE80' : '#16301A'}
            />
            <Text
              style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
            >
              Delivery Timeline
            </Text>
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
                          isDark && styles.milestoneTitleDark,
                          (isDone || isCurrent) && isDark && styles.milestoneTitleActiveDark,
                        ]}
                      >
                        {step.title}
                      </Text>
                      {step.timestamp && (
                        <Text
                          style={[
                            styles.milestoneTimestamp,
                            isDark && styles.milestoneTimestampDark,
                          ]}
                        >
                          {step.timestamp}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.milestoneDescription,
                        isDark && styles.milestoneDescriptionDark,
                      ]}
                    >
                      {step.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Destination & Logistics */}
        <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="truck-outline"
              size={18}
              color={isDark ? '#4ADE80' : '#16301A'}
            />
            <Text
              style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
            >
              Logistics & Destination
            </Text>
          </View>

          <View style={styles.logisticsRow}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={18}
              color={isDark ? '#4ADE80' : '#1E3523'}
            />
            <View style={styles.logisticsTextContainer}>
              <Text
                style={[styles.logisticsLabel, isDark && styles.logisticsLabelDark]}
              >
                Receiving Facility
              </Text>
              <Text
                style={[styles.logisticsValue, isDark && styles.logisticsValueDark]}
              >
                {order.deliveryAddress}
              </Text>
            </View>
          </View>

          {order.courierName && (
            <View style={[styles.logisticsRow, { marginTop: 12 }]}>
              <MaterialCommunityIcons
                name="shield-car"
                size={18}
                color={isDark ? '#4ADE80' : '#1E3523'}
              />
              <View style={styles.logisticsTextContainer}>
                <Text
                  style={[
                    styles.logisticsLabel,
                    isDark && styles.logisticsLabelDark,
                  ]}
                >
                  Assigned Carrier
                </Text>
                <Text
                  style={[
                    styles.logisticsValue,
                    isDark && styles.logisticsValueDark,
                  ]}
                >
                  {order.courierName}
                </Text>
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
        <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={18}
              color={isDark ? '#4ADE80' : '#16301A'}
            />
            <Text
              style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}
            >
              Payment & Escrow Details
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, isDark && styles.billLabelDark]}>
              {order.cropName} ({order.quantityKg} kg @ {order.currency} {order.pricePerKg})
            </Text>
            <Text style={[styles.billValue, isDark && styles.billValueDark]}>
              {order.currency} {subtotal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, isDark && styles.billLabelDark]}>
              Cold-Chain Logistics Fee
            </Text>
            <Text style={[styles.billValue, isDark && styles.billValueDark]}>
              {order.currency} {transportFee.toLocaleString()}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, isDark && styles.billLabelDark]}>
              TraceRoot Escrow Guarantee
            </Text>
            <Text style={[styles.billValue, isDark && styles.billValueDark]}>
              {order.currency} {platformFee.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.billDivider, isDark && styles.billDividerDark]} />

          <View style={styles.totalBillRow}>
            <Text
              style={[styles.totalBillLabel, isDark && styles.totalBillLabelDark]}
            >
              Total Escrow Paid
            </Text>
            <Text
              style={[styles.totalBillValue, isDark && styles.totalBillValueDark]}
            >
              {order.currency} {grandTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/(buyer)/messages' as any)}
            style={[styles.chatFarmerBtn, isDark && styles.chatFarmerBtnDark]}
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={18}
              color={isDark ? '#4ADE80' : '#16301A'}
            />
            <Text
              style={[
                styles.chatFarmerBtnText,
                isDark && styles.chatFarmerBtnTextDark,
              ]}
            >
              Message Farmer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleDownloadInvoice}
            style={[
              styles.downloadInvoiceBtn,
              isDark && styles.downloadInvoiceBtnDark,
            ]}
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
  safeAreaDark: {
    backgroundColor: '#0E1710',
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
  navBarDark: {
    backgroundColor: '#18271C',
    borderBottomColor: '#263B2B',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1EFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonDark: {
    backgroundColor: '#223826',
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
  navTitleDark: {
    color: '#F0F5F1',
  },
  navSubtitle: {
    fontSize: 11.5,
    color: '#768776',
    marginTop: 1,
  },
  navSubtitleDark: {
    color: '#98B39B',
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
  produceCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
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
  cropNameDark: {
    color: '#F0F5F1',
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
  farmerNameDark: {
    color: '#98B39B',
  },
  metaBullet: {
    fontSize: 10,
    color: '#A0ADA1',
  },
  locationText: {
    fontSize: 12,
    color: '#6A7B6B',
  },
  locationTextDark: {
    color: '#98B39B',
  },
  traceCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#C8E6C9',
  },
  traceCardDark: {
    backgroundColor: '#142517',
    borderColor: '#263B2B',
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
  traceIconWrapperDark: {
    backgroundColor: '#223826',
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
  traceTitleDark: {
    color: '#4ADE80',
  },
  traceBatchId: {
    fontSize: 11,
    color: '#388E3C',
    fontWeight: '600',
    marginTop: 1,
  },
  traceBatchIdDark: {
    color: '#A7F3D0',
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
  recordsCountPillDark: {
    backgroundColor: '#1B2E1E',
  },
  recordsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  recordsCountTextDark: {
    color: '#4ADE80',
  },
  traceHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#C8E6C9',
  },
  traceHintRowDark: {
    borderTopColor: '#263B2B',
  },
  traceHintText: {
    fontSize: 11,
    color: '#2E7D32',
    flex: 1,
  },
  traceHintTextDark: {
    color: '#98B39B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
  },
  sectionCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
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
  sectionTitleDark: {
    color: '#F0F5F1',
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
  milestoneTitleDark: {
    color: '#98B39B',
  },
  milestoneTitleActive: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16301A',
  },
  milestoneTitleActiveDark: {
    color: '#4ADE80',
  },
  milestoneTimestamp: {
    fontSize: 11,
    color: '#8B9C8C',
  },
  milestoneTimestampDark: {
    color: '#98B39B',
  },
  milestoneDescription: {
    fontSize: 11.5,
    color: '#556A55',
    lineHeight: 16,
  },
  milestoneDescriptionDark: {
    color: '#C5D6C7',
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
  logisticsLabelDark: {
    color: '#98B39B',
  },
  logisticsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16301A',
    marginTop: 1,
  },
  logisticsValueDark: {
    color: '#F0F5F1',
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
  billLabelDark: {
    color: '#98B39B',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16301A',
  },
  billValueDark: {
    color: '#F0F5F1',
  },
  billDivider: {
    height: 0.5,
    backgroundColor: '#ECE7DD',
    marginVertical: 10,
  },
  billDividerDark: {
    backgroundColor: '#263B2B',
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
  totalBillLabelDark: {
    color: '#F0F5F1',
  },
  totalBillValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  totalBillValueDark: {
    color: '#4ADE80',
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
  chatFarmerBtnDark: {
    backgroundColor: '#18271C',
    borderColor: '#4ADE80',
  },
  chatFarmerBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16301A',
  },
  chatFarmerBtnTextDark: {
    color: '#4ADE80',
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
  downloadInvoiceBtnDark: {
    backgroundColor: '#244D29',
  },
  downloadInvoiceBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});