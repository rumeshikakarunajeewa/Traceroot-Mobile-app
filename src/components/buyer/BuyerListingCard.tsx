import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProduceListing } from '../../types/buyer.types';

interface BuyerListingCardProps {
  listing: ProduceListing;
  onPress: (listing: ProduceListing) => void;
}

export const BuyerListingCard: React.FC<BuyerListingCardProps> = ({
  listing,
  onPress,
}) => {
  const isGreenhouse = listing.farmingType === 'greenhouse';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(listing)}
      style={styles.cardContainer}
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
          <Text style={styles.cropName}>{listing.cropName}</Text>
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

        {/* Status Pills Row */}
        <View style={styles.pillsRow}>
          <View style={styles.recordsPill}>
            <Text style={styles.recordsPillText}>✓ {listing.recordsCount} records</Text>
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
    color: '#6A7B6B',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recordsPill: {
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
    color: '#16301A',
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
    backgroundColor: '#1E3523',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
