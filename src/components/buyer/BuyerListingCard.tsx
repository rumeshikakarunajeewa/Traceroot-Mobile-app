import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProduceListing } from '../../types/buyer.types';
import { useDarkMode } from '../../store/uiStore';

interface BuyerListingCardProps {
  listing: ProduceListing;
  onPress: (listing: ProduceListing) => void;
}

export const BuyerListingCard: React.FC<BuyerListingCardProps> = ({
  listing,
  onPress,
}) => {
  const [isDark] = useDarkMode();
  const isGreenhouse = listing.farmingType === 'greenhouse';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(listing)}
      style={[styles.cardContainer, isDark && styles.cardContainerDark]}
    >
      {/* Crop Image with Quantity Overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: listing.imageUrl }}
          style={styles.cropImage}
          resizeMode="cover"
        />
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{listing.quantityKg} kg</Text>
        </View>
      </View>

      {/* Middle Details Column */}
      <View style={styles.detailsContainer}>
        {/* Title & Farming Type Badge */}
        <View style={styles.titleRow}>
          <Text style={[styles.cropName, isDark && styles.cropNameDark]}>
            {listing.cropName}
          </Text>
          <View
            style={[
              styles.typeBadge,
              isGreenhouse ? styles.greenhouseBadge : styles.openFieldBadge,
            ]}
          >
            <Text style={styles.badgeEmoji}>{isGreenhouse ? '🏡' : '🌾'}</Text>
            <Text
              style={[
                styles.typeBadgeText,
                isGreenhouse ? styles.greenhouseText : styles.openFieldText,
              ]}
            >
              {isGreenhouse ? 'Greenhouse' : 'Open-field'}
            </Text>
          </View>
        </View>

        {/* Farmer & Location Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="account-outline"
              size={14}
              color={isDark ? '#8BA18E' : '#6F8471'}
            />
            <Text style={[styles.metaText, isDark && styles.metaTextDark]} numberOfLines={1}>
              {listing.farmerName}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={isDark ? '#8BA18E' : '#6F8471'}
            />
            <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
              {listing.location}
            </Text>
          </View>
        </View>

        {/* Stage Progress Bar & Badge */}
        <View style={styles.progressRow}>
          <View style={[styles.progressBarTrack, isDark && styles.progressBarTrackDark]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(listing.completedStages / listing.totalStages) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.stagesPill}>
            <Text style={styles.stagesPillText}>
              {listing.completedStages}/{listing.totalStages} stages
            </Text>
          </View>
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={[styles.priceValue, isDark && styles.priceValueDark]}>
            {listing.currency} {listing.pricePerKg}
          </Text>
          <Text style={[styles.priceUnit, isDark && styles.priceUnitDark]}> /kg</Text>
        </View>
      </View>

      {/* Right Circular Action Button */}
      <View style={styles.arrowButton}>
        <MaterialCommunityIcons name="arrow-top-right" size={18} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#ECE8DF',
  },
  cardContainerDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  imageContainer: {
    width: 84,
    height: 84,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EBE7DE',
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  quantityBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#18311B',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    gap: 3,
  },
  badgeEmoji: {
    fontSize: 10,
  },
  greenhouseBadge: {
    backgroundColor: '#E8F5E9',
  },
  openFieldBadge: {
    backgroundColor: '#FFF4E5',
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  greenhouseText: {
    color: '#2E6930',
  },
  openFieldText: {
    color: '#B45309',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11.5,
    color: '#657D68',
    fontWeight: '500',
  },
  metaTextDark: {
    color: '#98B39B',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E8E5DD',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarTrackDark: {
    backgroundColor: '#263B2B',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4B7347',
    borderRadius: 2,
  },
  stagesPill: {
    backgroundColor: '#F3EFE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  stagesPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5C745E',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16301A',
  },
  priceValueDark: {
    color: '#FCD34D',
  },
  priceUnit: {
    fontSize: 11,
    color: '#768B78',
    fontWeight: '500',
  },
  priceUnitDark: {
    color: '#8CA590',
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1B3220',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
