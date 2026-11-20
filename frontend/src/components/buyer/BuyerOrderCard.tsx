import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuyerOrderItem } from '../../types/buyer.types';

interface BuyerOrderCardProps {
  order: BuyerOrderItem;
  initiallyExpanded?: boolean;
  onCropJourneyPress: (order: BuyerOrderItem) => void;
  onScanPress: (order: BuyerOrderItem) => void;
}

export const BuyerOrderCard: React.FC<BuyerOrderCardProps> = ({
  order,
  initiallyExpanded = false,
  onCropJourneyPress,
  onScanPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  // Status badge styling
  const isGrowing = order.status === 'Growing';
  const isDelivered = order.status === 'Delivered';
  const isPending = order.status === 'Pending';

  return (
    <View style={styles.card}>
      {/* 1. Header Crop Image Banner */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: order.imageUrl }}
          style={styles.cropImage}
          resizeMode="cover"
        />

        {/* Bottom dark scrim for text readability */}
        <View style={styles.bottomScrim} />

        {/* Top-Left: Status Badge */}
        <View
          style={[
            styles.statusBadge,
            isPending ? styles.pendingBadge : styles.defaultStatusBadge,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isGrowing
                ? styles.growingDot
                : isDelivered
                ? styles.deliveredDot
                : styles.pendingDot,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              isPending ? styles.pendingText : styles.defaultStatusText,
            ]}
          >
            {order.status}
          </Text>
        </View>

        {/* Top-Right: Order Code */}
        <Text style={styles.orderCode}>{order.orderNumber}</Text>

        {/* Bottom-Left: Crop name & Quantity / Rate */}
        <View style={styles.bottomLeftInfo}>
          <Text style={styles.cropTitle} numberOfLines={1}>
            {order.cropName}
          </Text>
          <Text style={styles.cropSubtitle}>
            {order.quantityKg} kg · {order.currency} {order.pricePerKg}/kg
          </Text>
        </View>

        {/* Bottom-Right: Total Price */}
        <View style={styles.bottomRightPrice}>
          <Text style={styles.priceText}>
            {order.currency} {order.totalPrice.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* 2. Card Details Body */}
      <View style={styles.cardBody}>
        {/* Farmer, Location & Expand Toggle Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.farmerRow}
        >
          <View style={styles.farmerInfo}>
            <MaterialCommunityIcons
              name="account-cowboy-hat-outline"
              size={15}
              color="#647666"
            />
            <Text style={styles.farmerText}>
              {order.farmerName} · {order.location}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7C6E"
          />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(Math.max(order.progressPercentage, 5), 100)}%` },
            ]}
          />
        </View>

        {/* 3. Expanded Detail Sections */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* Delivery & Farming Info Tiles */}
            <View style={styles.tilesRow}>
              {/* Delivery Tile */}
              <View style={styles.infoTile}>
                <View style={styles.tileHeader}>
                  <MaterialCommunityIcons
                    name="truck-delivery-outline"
                    size={13}
                    color="#7A8B7D"
                  />
                  <Text style={styles.tileLabel}>Delivery</Text>
                </View>
                <Text style={styles.tileValue} numberOfLines={1}>
                  {order.deliveryDateEst}
                </Text>
              </View>

              {/* Farming Tile */}
              <View style={styles.infoTile}>
                <View style={styles.tileHeader}>
                  <MaterialCommunityIcons
                    name="weather-sunny"
                    size={13}
                    color="#7A8B7D"
                  />
                  <Text style={styles.tileLabel}>Farming</Text>
                </View>
                <Text style={styles.tileValue} numberOfLines={1}>
                  {order.farmingType === 'greenhouse' ? 'Greenhouse' : 'Open-field'}
                </Text>
              </View>
            </View>

            {/* Traceability Verified Box */}
            <View style={styles.traceBox}>
              <View style={styles.shieldIconWrapper}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={15}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.traceText}>
                Traceability verified — {order.lockedRecordsCount} locked records across{' '}
                {order.completedStages} stages
              </Text>
            </View>

            {/* Action Buttons: Crop Journey & Scanner */}
            <View style={styles.actionsRow}>
              {/* Crop Journey Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onCropJourneyPress(order)}
                style={styles.cropJourneyBtn}
              >
                <MaterialCommunityIcons name="leaf" size={16} color="#FFFFFF" />
                <Text style={styles.cropJourneyBtnText}>Crop Journey</Text>
              </TouchableOpacity>

              {/* Camera / QR Scan Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onScanPress(order)}
                style={styles.scanBtn}
              >
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={19}
                  color="#263E2B"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#EAE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 148,
    position: 'relative',
    backgroundColor: '#E4DFD5',
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  defaultStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  pendingBadge: {
    backgroundColor: '#E66F26',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  growingDot: {
    backgroundColor: '#43804F',
  },
  deliveredDot: {
    backgroundColor: '#586A5A',
  },
  pendingDot: {
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  defaultStatusText: {
    color: '#223825',
  },
  pendingText: {
    color: '#FFFFFF',
  },
  orderCode: {
    position: 'absolute',
    top: 13,
    right: 14,
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  bottomLeftInfo: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    right: 130,
  },
  cropTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cropSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomRightPrice: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4E2BD',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  farmerText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#283E2C',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E6E1D7',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#577C55',
    borderRadius: 2.5,
  },
  expandedSection: {
    marginTop: 12,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoTile: {
    flex: 1,
    backgroundColor: '#FAF7F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ECE7DD',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  tileLabel: {
    fontSize: 11,
    color: '#768779',
    fontWeight: '500',
  },
  tileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C3420',
  },
  traceBox: {
    backgroundColor: '#F3EFE7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 10,
  },
  shieldIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#436B46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traceText: {
    flex: 1,
    fontSize: 11.5,
    color: '#344937',
    fontWeight: '500',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  cropJourneyBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#1E3725',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#1E3725',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cropJourneyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3EFE7',
    borderWidth: 1,
    borderColor: '#E2DBD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
