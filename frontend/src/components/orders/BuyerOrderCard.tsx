import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuyerOrder, OrderStatus } from '../../types/buyer.types';
import { useDarkMode } from '../../store/uiStore';

export const getOrderStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'Growing':
    case 'in_transit':
      return {
        label: 'Growing',
        bg: '#EEF5ED',
        text: '#365331',
        dotColor: '#5C7A4E',
        icon: 'sprout-outline' as const,
      };
    case 'Delivered':
    case 'delivered':
      return {
        label: 'Delivered',
        bg: '#F5F2EB',
        text: '#554C37',
        dotColor: '#8C7B5D',
        icon: 'check-circle-outline' as const,
      };
    case 'Pending':
    case 'processing':
    case 'confirmed':
    default:
      return {
        label: 'Pending',
        bg: '#FBECE3',
        text: '#C25F28',
        dotColor: '#E07238',
        icon: 'clock-outline' as const,
      };
  }
};

interface BuyerOrderCardProps {
  order: BuyerOrder;
  isExpanded: boolean;
  onToggleExpand: (order: BuyerOrder) => void;
  onCropJourneyPress: (order: BuyerOrder) => void;
  onCameraPress?: (order: BuyerOrder) => void;
}

export const BuyerOrderCard: React.FC<BuyerOrderCardProps> = ({
  order,
  isExpanded,
  onToggleExpand,
  onCropJourneyPress,
  onCameraPress,
}) => {
  const [isDark] = useDarkMode();
  const isGreenhouse = order.farmingType === 'greenhouse';

  // Status badge styling helper matching Figma screenshot
  const renderStatusBadge = () => {
    switch (order.status) {
      case 'Growing':
      case 'in_transit':
        return (
          <View style={styles.growingBadge}>
            <View style={styles.growingDot} />
            <Text style={styles.growingText}>Growing</Text>
          </View>
        );
      case 'Delivered':
      case 'delivered':
        return (
          <View style={styles.deliveredBadge}>
            <View style={styles.deliveredDot} />
            <Text style={styles.deliveredText}>Delivered</Text>
          </View>
        );
      case 'Pending':
      case 'processing':
      case 'confirmed':
      default:
        return (
          <View style={styles.pendingBadge}>
            <View style={styles.pendingDot} />
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.cardContainer, isDark && styles.cardContainerDark]}>
      {/* Upper Hero Image Container with Overlays */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onToggleExpand(order)}
      >
        <ImageBackground
          source={{ uri: order.imageUrl }}
          style={styles.heroImage}
          imageStyle={styles.heroImageRadius}
        >
          {/* Subtle gradient overlay */}
          <View style={styles.imageDarkOverlay} />

          {/* Top Status & Code Row */}
          <View style={styles.topOverlayRow}>
            {renderStatusBadge()}
            <Text style={styles.orderCode}>{order.orderNumber}</Text>
          </View>

          {/* Bottom Crop Name, Subtitle & Price Row */}
          <View style={styles.bottomOverlayRow}>
            <View style={styles.cropTitleGroup}>
              <Text style={styles.cropTitle}>{order.cropName}</Text>
              <Text style={styles.cropSubtitle}>
                {order.quantityKg} kg · {order.currency} {order.pricePerKg}/kg
              </Text>
            </View>

            <Text style={styles.priceText}>
              {order.currency} {order.totalPrice.toLocaleString()}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {/* Card Body */}
      <View style={[styles.cardBody, isDark && styles.cardBodyDark]}>
        {/* Farmer Row & Expand / Collapse Chevron */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onToggleExpand(order)}
          style={styles.farmerRow}
        >
          <View style={styles.farmerLeftCol}>
            <MaterialCommunityIcons
              name="home-variant-outline"
              size={15}
              color={isDark ? '#8BA18E' : '#5C7456'}
            />
            <Text
              style={[styles.farmerText, isDark && styles.farmerTextDark]}
              numberOfLines={1}
            >
              {order.farmerName} · {order.location}
            </Text>
          </View>

          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={isDark ? '#8BA18E' : '#6B8268'}
          />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={[styles.progressBarTrack, isDark && styles.progressBarTrackDark]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(Math.max(order.progressPercentage, 5), 100)}%` },
            ]}
          />
        </View>

        {/* Expanded Content Section */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* 2-Column Info Tiles Grid */}
            <View style={styles.infoGridRow}>
              {/* Delivery Tile */}
              <View style={[styles.infoTile, isDark && styles.infoTileDark]}>
                <View style={styles.tileHeader}>
                  <MaterialCommunityIcons
                    name="sprout-outline"
                    size={13}
                    color={isDark ? '#8BA18E' : '#7E917A'}
                  />
                  <Text style={[styles.tileHeaderLabel, isDark && styles.tileHeaderLabelDark]}>Delivery</Text>
                </View>
                <Text
                  style={[styles.tileValue, isDark && styles.tileValueDark]}
                  numberOfLines={1}
                >
                  {order.estimatedDelivery}
                </Text>
              </View>

              {/* Farming Tile */}
              <View style={[styles.infoTile, isDark && styles.infoTileDark]}>
                <View style={styles.tileHeader}>
                  <MaterialCommunityIcons
                    name="white-balance-sunny"
                    size={13}
                    color={isDark ? '#8BA18E' : '#7E917A'}
                  />
                  <Text style={[styles.tileHeaderLabel, isDark && styles.tileHeaderLabelDark]}>Farming</Text>
                </View>
                <Text
                  style={[styles.tileValue, isDark && styles.tileValueDark]}
                  numberOfLines={1}
                >
                  {isGreenhouse ? 'Greenhouse' : 'Open-field'}
                </Text>
              </View>
            </View>

            {/* Traceability Verification Banner */}
            <View style={[styles.traceBanner, isDark && styles.traceBannerDark]}>
              <View style={styles.traceShieldCircle}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={16}
                  color="#FFFFFF"
                />
              </View>
              <Text style={[styles.traceBannerText, isDark && styles.traceBannerTextDark]}>
                Traceability verified — {order.recordsCount} locked records across{' '}
                {order.stagesCount || 3} stages
              </Text>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionRow}>
              {/* Crop Journey Main Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => onCropJourneyPress(order)}
                style={styles.cropJourneyBtn}
              >
                <MaterialCommunityIcons
                  name="leaf"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.cropJourneyBtnText}>Crop Journey</Text>
              </TouchableOpacity>

              {/* Camera Action Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onCameraPress && onCameraPress(order)}
                style={[styles.cameraBtn, isDark && styles.cameraBtnDark]}
              >
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={19}
                  color={isDark ? '#4ADE80' : '#253B2A'}
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
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
  },
  heroImage: {
    width: '100%',
    height: 165,
    justifyContent: 'space-between',
    padding: 14,
  },
  heroImageRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  imageDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  topOverlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  orderCode: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 0.4,
  },
  bottomOverlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  cropTitleGroup: {
    flex: 1,
  },
  cropTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  cropSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
    fontWeight: '400',
  },
  priceText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F4DEA8',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginLeft: 8,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  farmerText: {
    fontSize: 13,
    color: '#556E52',
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#EBE7DE',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5C7A4E',
    borderRadius: 3,
  },
  expandedSection: {
    marginTop: 14,
  },
  infoGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  infoTile: {
    flex: 1,
    backgroundColor: '#F5F2EB',
    borderRadius: 14,
    padding: 10,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tileHeaderLabel: {
    fontSize: 11,
    color: '#7E917A',
    fontWeight: '500',
  },
  tileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16301A',
  },
  traceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF5EE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  traceShieldCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#507B48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traceBannerText: {
    fontSize: 12,
    color: '#274426',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropJourneyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D3524',
    borderRadius: 22,
    paddingVertical: 12,
  },
  cropJourneyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cameraBtn: {
    width: 48,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#ECEEE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  // Status Badges
  growingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 5,
  },
  growingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5C7A4E',
  },
  growingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#365331',
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 5,
  },
  deliveredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8C7B5D',
  },
  deliveredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#554C37',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E07238',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 5,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardContainerDark: {
    borderColor: '#263B2B',
  },
  cardBodyDark: {
    backgroundColor: '#18271C',
  },
  farmerTextDark: {
    color: '#98B39B',
  },
  progressBarTrackDark: {
    backgroundColor: '#263B2B',
  },
  infoTileDark: {
    backgroundColor: '#1E3224',
  },
  tileHeaderLabelDark: {
    color: '#8BA18E',
  },
  tileValueDark: {
    color: '#F0F5F1',
  },
  traceBannerDark: {
    backgroundColor: '#1C3122',
  },
  traceBannerTextDark: {
    color: '#C6DFC7',
  },
  cameraBtnDark: {
    backgroundColor: '#233827',
  },
});
