import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProduceListing } from '../../types/buyer.types';
import { colors } from '../../lib/theme';

export interface HarvestListingCardProps {
  listing: ProduceListing;
  onPress: (listing: ProduceListing) => void;
}

export const HarvestListingCard: React.FC<HarvestListingCardProps> = ({
  listing,
  onPress,
}) => {
  const isGreenhouse = listing.farmingType === 'greenhouse';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(listing)}
      style={styles.cardContainer}
      accessibilityRole="button"
      accessibilityLabel={`${listing.cropName}, ${listing.quantityKg} kg from ${listing.farmerName}`}
    >
      {/* Crop Image Container with Overlay Badges */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: listing.imageUrl }}
          style={styles.cropImage}
          resizeMode="cover"
        />
        {/* Quantity Overlay Badge */}
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{listing.quantityKg} kg</Text>
        </View>

        {/* Optional Organic Verified Ribbon */}
        {listing.isOrganic && (
          <View style={styles.organicBadge}>
            <MaterialCommunityIcons name="leaf" size={10} color="#FFFFFF" />
            <Text style={styles.organicText}>Bio</Text>
          </View>
        )}
      </View>

      {/* Middle Details Column */}
      <View style={styles.detailsContainer}>
        {/* Title & Farming Type Pill */}
        <View style={styles.titleRow}>
          <Text style={styles.cropName} numberOfLines={1}>
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

        {/* Farmer & Location Metadata */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-outline" size={13} color="#6A7B6B" />
            <Text style={styles.metaText} numberOfLines={1}>
              {listing.farmerName}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color="#6A7B6B" />
            <Text style={styles.metaText} numberOfLines={1}>
              {listing.location}
            </Text>
          </View>
        </View>

        {/* Trust Badges: Immutable Records & Stages */}
        <View style={styles.pillsRow}>
          <View style={styles.recordsPill}>
            <MaterialCommunityIcons name="shield-check" size={11} color="#2E7D32" />
            <Text style={styles.recordsPillText}>{listing.recordsCount} records</Text>
          </View>
          <View style={styles.stagesPill}>
            <Text style={styles.stagesPillText}>
              {listing.completedStages}/{listing.totalStages} stages
            </Text>
          </View>
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>
            {listing.currency} {listing.pricePerKg}
          </Text>
          <Text style={styles.priceUnit}> /kg</Text>
        </View>
      </View>

      {/* Right Circular Action Arrow */}
      <View style={styles.arrowButton}>
        <MaterialCommunityIcons name="arrow-top-right" size={18} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

export default HarvestListingCard;

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#ECE8DF',
  },
  imageContainer: {
    width: 86,
    height: 86,
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
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
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
  organicBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  organicText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 3,
  },
  cropName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.buyer.textDark,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
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
    backgroundColor: '#EDF2FE',
  },
  greenhouseText: {
    color: '#3F61D6',
  },
  openFieldBadge: {
    backgroundColor: '#FFF4E5',
  },
  openFieldText: {
    color: '#D97706',
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: '50%',
  },
  metaText: {
    fontSize: 11.5,
    color: '#6A7B6B',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  recordsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recordsPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2E7D32',
  },
  stagesPill: {
    backgroundColor: '#EFEFE8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stagesPillText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#556A55',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.buyer.textDark,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  priceUnit: {
    fontSize: 11,
    color: '#768776',
    fontWeight: '500',
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.buyer.forestDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
