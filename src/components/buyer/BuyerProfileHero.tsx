import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuyerProfile } from '../../types/buyer.types';
import { BUYER_PROFILE_HERO_BG } from '../../constants/buyerMockData';

interface BuyerProfileHeroProps {
  profile: BuyerProfile;
  onPressStatsOrders?: () => void;
  onPressStatsContracts?: () => void;
  onPressStatsSourced?: () => void;
}

export const BuyerProfileHero: React.FC<BuyerProfileHeroProps> = ({
  profile,
  onPressStatsOrders,
  onPressStatsContracts,
  onPressStatsSourced,
}) => {
  return (
    <View style={styles.cardWrapper}>
      <ImageBackground
        source={{ uri: BUYER_PROFILE_HERO_BG }}
        style={styles.imageBackground}
        imageStyle={styles.imageBackgroundStyle}
      >
        {/* Soft dark gradient tint for visual readability */}
        <View style={styles.tintOverlay}>
          {/* Header row: Avatar + Identity */}
          <View style={styles.topRow}>
            {/* Squircle Avatar with orange checkmark */}
            <View style={styles.avatarContainer}>
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{profile.initials}</Text>
                </View>
              )}

              {/* Orange verified checkmark badge */}
              <View style={styles.verifiedCheckBadge}>
                <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
              </View>
            </View>

            {/* User credentials */}
            <View style={styles.credentialsColumn}>
              {/* Wholesale Buyer Pill */}
              <View style={styles.rolePill}>
                <MaterialCommunityIcons
                  name="barley"
                  size={14}
                  color="#26482B"
                  style={styles.roleIcon}
                />
                <Text style={styles.roleText}>{profile.roleTitle || 'Wholesale Buyer'}</Text>
              </View>

              {/* Name */}
              <Text style={styles.fullName}>{profile.fullName}</Text>

              {/* Location & Organization */}
              <View style={styles.locationRow}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={13}
                  color="rgba(255, 255, 255, 0.9)"
                  style={styles.pinIcon}
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {profile.district || 'Colombo District'} • {profile.company || 'FreshMart Ltd'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bio statement */}
          <Text style={styles.bioText}>
            {profile.bio ||
              'Lead purchasing manager for FreshMart Supermarkets, building long-term relationships with verified, sustainable farmers.'}
          </Text>

          {/* Frosted Glass 3-Column Stats Container */}
          <View style={styles.glassStatsBar}>
            {/* Orders Metric */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onPressStatsOrders}
              style={styles.statColumn}
            >
              <MaterialCommunityIcons
                name="basket-outline"
                size={18}
                color="rgba(255, 255, 255, 0.85)"
              />
              <Text style={styles.statValue}>{profile.ordersCount ?? 142}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            {/* Contracts Metric */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onPressStatsContracts}
              style={styles.statColumn}
            >
              <MaterialCommunityIcons
                name="file-document-outline"
                size={18}
                color="rgba(255, 255, 255, 0.85)"
              />
              <Text style={styles.statValue}>{profile.contractsCount ?? 5}</Text>
              <Text style={styles.statLabel}>Contracts</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            {/* Sourced Volume Metric */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onPressStatsSourced}
              style={styles.statColumn}
            >
              <MaterialCommunityIcons
                name="chart-line"
                size={18}
                color="rgba(255, 255, 255, 0.85)"
              />
              <Text style={styles.statValue}>{profile.kgSourced ?? '12.5k'}</Text>
              <Text style={styles.statLabel}>kg sourced</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F2615',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  imageBackground: {
    width: '100%',
  },
  imageBackgroundStyle: {
    borderRadius: 24,
  },
  tintOverlay: {
    backgroundColor: 'rgba(16, 36, 20, 0.48)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E3523',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#26482B',
    borderRadius: 20,
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D97706', // Warm amber-orange from design
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  rolePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 14,
    marginBottom: 5,
    gap: 4,
  },
  roleIcon: {
    marginRight: 1,
  },
  roleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#26482B',
    letterSpacing: 0.1,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: 2,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
  },
  bioText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.94)',
    marginTop: 12,
    marginBottom: 14,
    fontWeight: '400',
  },
  glassStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginTop: 2,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.82)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
