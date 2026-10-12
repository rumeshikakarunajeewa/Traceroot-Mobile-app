import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { BuyerProfile } from '../../types/buyer.types';

interface BuyerHeaderProps {
  profile: BuyerProfile;
}

export const BuyerHeader: React.FC<BuyerHeaderProps> = ({ profile }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {/* Avatar with initials */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.initials}</Text>
        </View>

        {/* Welcome Stack */}
        <View style={styles.greetingContainer}>
          <Text style={styles.welcomeSubtitle}>
            Welcome back <Text style={styles.sproutIcon}>🌿</Text>
          </Text>
          <Text style={styles.userName}>{profile.fullName}</Text>
        </View>
      </View>

      {/* Verified Buyer Badge */}
      {profile.isVerified && (
        <View style={styles.verifiedBadge}>
          <MaterialCommunityIcons 
            name="shield-check" 
            size={14} 
            color="#2E6930" 
            style={styles.shieldIcon}
          />
          <Text style={styles.verifiedText}>Verified Buyer</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2E4730',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#6E826F',
    fontWeight: '500',
    marginBottom: 2,
  },
  sproutIcon: {
    fontSize: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.buyer.textDark,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6E1D6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#DAD4C7',
    gap: 5,
  },
  shieldIcon: {
    marginRight: 1,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2B4A30',
  },
});
