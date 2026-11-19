import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

export interface FarmerCardProps {
  id: string;
  fullName: string;
  location: string;
  farmerType: string;
  avatarUrl?: string;
  activeListingsCount?: number;
  verifiedBadgesCount?: number;
  onPress: (id: string) => void;
}

export const FarmerCard: React.FC<FarmerCardProps> = ({
  id,
  fullName,
  location,
  farmerType,
  avatarUrl,
  activeListingsCount = 3,
  verifiedBadgesCount = 5,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(id)}
      style={styles.cardContainer}
      accessibilityRole="button"
      accessibilityLabel={`Farmer ${fullName}, located in ${location}`}
    >
      {/* Farmer Avatar */}
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initialsText}>
              {fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.verifiedDot}>
          <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
        </View>
      </View>

      {/* Farmer Details */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.farmerName}>{fullName}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{farmerType}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color="#6A7B6B" />
          <Text style={styles.locationText}>{location}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <MaterialCommunityIcons name="sprout" size={13} color="#2E7D32" />
            <Text style={styles.metricText}>{activeListingsCount} crops active</Text>
          </View>
          <View style={styles.metricItem}>
            <MaterialCommunityIcons name="shield-check" size={13} color="#2E7D32" />
            <Text style={styles.metricText}>{verifiedBadgesCount} audits passed</Text>
          </View>
        </View>
      </View>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#1E3523" />
      </View>
    </TouchableOpacity>
  );
};

export default FarmerCard;

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#ECE8DF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EBE7DE',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.buyer.forestDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2E7D32',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.buyer.textDark,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  badge: {
    backgroundColor: '#EBF4ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#284E34',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#6A7B6B',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricText: {
    fontSize: 11,
    color: '#556A55',
    fontWeight: '500',
  },
  arrowContainer: {
    paddingLeft: 8,
  },
});
