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
import { ProduceListing } from '../../types/buyer.types';
import { useDarkMode } from '../../store/uiStore';

interface BuyerMarketCardProps {
  listing: ProduceListing;
  onPress: (listing: ProduceListing) => void;
  onBookmarkToggle?: (id: string, isBookmarked: boolean) => void;
  initialBookmarked?: boolean;
}

export const BuyerMarketCard: React.FC<BuyerMarketCardProps> = ({
  listing,
  onPress,
  onBookmarkToggle,
  initialBookmarked = false,
}) => {
  const [isDark] = useDarkMode();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const isGreenhouse = listing.farmingType === 'greenhouse';

  const handleBookmarkPress = () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    if (onBookmarkToggle) {
      onBookmarkToggle(listing.id, newState);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress(listing)}
      style={[styles.card, isDark && styles.cardDark]}
    >
      {/* 1. Crop Image Hero Header with Overlays */}
      <View style={[styles.imageContainer, isDark && styles.imageContainerDark]}>
        <Image
          source={{ uri: listing.imageUrl }}
          style={styles.cropImage}
          resizeMode="cover"
        />

        {/* Subtle Dark Gradient Scrim for crisp text readability */}
        <View style={styles.bottomScrim} />

        {/* Top-Left: Verified Badge */}
        <View style={styles.verifiedBadge}>
          <MaterialCommunityIcons name="shield-check" size={13} color="#3E6342" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>

        {/* Top-Right: Bookmark Icon Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleBookmarkPress}
          style={styles.bookmarkButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isBookmarked ? '#3E6342' : '#223624'}
          />
        </TouchableOpacity>

        {/* Bottom of Image: Crop Name and Price */}
        <View style={styles.imageBottomRow}>
          <Text style={styles.cropName} numberOfLines={1}>
            {listing.cropName}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceNumber}>
              {listing.currency} {listing.pricePerKg}
            </Text>
            <Text style={styles.pricePerKg}> /kg</Text>
          </View>
        </View>
      </View>

      {/* 2. White / Dark Card Details Body */}
      <View style={styles.cardBody}>
        {/* Row 1: Farmer & Location on Left, Type Badge on Right */}
        <View style={styles.metaRow}>
          <View style={styles.farmerAndLoc}>
            {/* Farmer */}
            <View style={styles.farmerItem}>
              <MaterialCommunityIcons
                name="account-cowboy-hat-outline"
                size={14}
                color={isDark ? '#98B39B' : '#647666'}
              />
              <Text style={[styles.farmerName, isDark && styles.farmerNameDark]}>
                {listing.farmerName}
              </Text>
            </View>

            {/* Location */}
            <View style={styles.locationItem}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={isDark ? '#98B39B' : '#647666'}
              />
              <Text style={[styles.locationText, isDark && styles.locationTextDark]}>
                {listing.location}
              </Text>
            </View>
          </View>

          {/* Farming Type Pill Badge */}
          <View
            style={[
              styles.typeBadge,
              isGreenhouse
                ? [styles.greenhouseBadge, isDark && styles.greenhouseBadgeDark]
                : [styles.openFieldBadge, isDark && styles.openFieldBadgeDark],
            ]}
          >
            <Text style={styles.typeEmoji}>{isGreenhouse ? '🏡' : '🌽'}</Text>
            <Text
              style={[
                styles.typeText,
                isGreenhouse
                  ? [styles.greenhouseText, isDark && styles.greenhouseTextDark]
                  : [styles.openFieldText, isDark && styles.openFieldTextDark],
              ]}
            >
              {isGreenhouse ? 'Greenhouse' : 'Open-field'}
            </Text>
          </View>
        </View>

        {/* Row 2: 5 Segmented Stage Progress Bars */}
        <View style={styles.segmentContainer}>
          {[1, 2, 3, 4, 5].map((stageNum) => (
            <View
              key={stageNum}
              style={[
                styles.segmentBar,
                stageNum <= listing.completedStages
                  ? [styles.segmentFilled, isDark && styles.segmentFilledDark]
                  : [styles.segmentEmpty, isDark && styles.segmentEmptyDark],
              ]}
            />
          ))}
        </View>

        {/* Row 3: Records Pill, Stages Pill, and Available Quantity */}
        <View style={styles.bottomStatsRow}>
          <View style={styles.pillsGroup}>
            {/* Records Pill */}
            <View style={[styles.statPill, isDark && styles.statPillDark]}>
              <Text style={[styles.statPillText, isDark && styles.statPillTextDark]}>
                ✓ {listing.recordsCount} records
              </Text>
            </View>

            {/* Stages Pill */}
            <View style={[styles.statPill, isDark && styles.statPillDark]}>
              <Text style={[styles.statPillText, isDark && styles.statPillTextDark]}>
                ✓ {listing.completedStages}/{listing.totalStages} stages
              </Text>
            </View>
          </View>

          {/* Available Quantity on Right */}
          <View style={styles.availQuantity}>
            <MaterialCommunityIcons
              name="basket-outline"
              size={15}
              color={isDark ? '#98B39B' : '#647666'}
            />
            <Text style={[styles.availText, isDark && styles.availTextDark]}>
              {listing.quantityKg} kg avail.
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 195,
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
    height: 75,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C311F',
    letterSpacing: 0.2,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  imageBottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cropName: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceNumber: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pricePerKg: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerAndLoc: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  farmerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#263C2A',
    textDecorationLine: 'underline',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12.5,
    color: '#5E7060',
    fontWeight: '500',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  typeEmoji: {
    fontSize: 11,
  },
  typeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  greenhouseBadge: {
    backgroundColor: '#EDF3FE',
  },
  greenhouseText: {
    color: '#3B60D4',
  },
  openFieldBadge: {
    backgroundColor: '#FFF7ED',
  },
  openFieldText: {
    color: '#D97706',
  },
  segmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 5,
  },
  segmentBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  segmentFilled: {
    backgroundColor: '#608660',
  },
  segmentEmpty: {
    backgroundColor: '#E6E1D7',
  },
  bottomStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statPill: {
    backgroundColor: '#EAF3E9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#306336',
  },
  availQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C6E5E',
  },

  /* Dark Mode Overrides */
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  imageContainerDark: {
    backgroundColor: '#112215',
  },
  farmerNameDark: {
    color: '#F0F5F1',
  },
  locationTextDark: {
    color: '#98B39B',
  },
  greenhouseBadgeDark: {
    backgroundColor: '#1A2D4A',
  },
  greenhouseTextDark: {
    color: '#93C5FD',
  },
  openFieldBadgeDark: {
    backgroundColor: '#3B2511',
  },
  openFieldTextDark: {
    color: '#FDBA74',
  },
  segmentFilledDark: {
    backgroundColor: '#4ADE80',
  },
  segmentEmptyDark: {
    backgroundColor: '#263B2B',
  },
  statPillDark: {
    backgroundColor: '#203924',
  },
  statPillTextDark: {
    color: '#A6E3B0',
  },
  availTextDark: {
    color: '#98B39B',
  },
});
