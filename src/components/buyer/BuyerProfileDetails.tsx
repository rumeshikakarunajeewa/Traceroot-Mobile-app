import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuyerProfile } from '../../types/buyer.types';

interface BuyerProfileDetailsProps {
  profile: BuyerProfile;
  onPressPhone?: () => void;
  onPressEmail?: () => void;
  onPressLocation?: () => void;
}

export const BuyerProfileDetails: React.FC<BuyerProfileDetailsProps> = ({
  profile,
  onPressPhone,
  onPressEmail,
  onPressLocation,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Contact & Business Details Card */}
      <View style={styles.detailsCard}>
        {/* Row 1: Phone */}
        <TouchableOpacity
          activeOpacity={onPressPhone ? 0.7 : 1}
          onPress={onPressPhone}
          style={styles.rowItem}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="chat-outline" size={17} color="#2A4B2F" />
          </View>
          <Text style={styles.rowLabel}>Phone</Text>
          <Text style={styles.rowValue}>{profile.phone || '+94 71 987 6543'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Row 2: Email */}
        <TouchableOpacity
          activeOpacity={onPressEmail ? 0.7 : 1}
          onPress={onPressEmail}
          style={styles.rowItem}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="email-outline" size={17} color="#2A4B2F" />
          </View>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{profile.email || 'saman.p@freshmart.lk'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Row 3: Business */}
        <View style={styles.rowItem}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="storefront-outline" size={17} color="#2A4B2F" />
          </View>
          <Text style={styles.rowLabel}>Business</Text>
          <Text style={styles.rowValue}>{profile.businessType || 'Retail supermarket'}</Text>
        </View>

        <View style={styles.divider} />

        {/* Row 4: Registration ID */}
        <View style={styles.rowItem}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check-outline" size={17} color="#2A4B2F" />
          </View>
          <Text style={styles.rowLabel}>Reg. ID</Text>
          <Text style={styles.rowValue}>{profile.registrationId || 'BR-99321'}</Text>
        </View>
      </View>

      {/* 2. Deep Forest Green Location Feature Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressLocation}
        style={styles.locationCard}
      >
        {/* Left Column info */}
        <View style={styles.locationContent}>
          <View style={styles.locationTagRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color="#A6C5A8"
              style={styles.locPin}
            />
            <Text style={styles.locationTag}>Location</Text>
          </View>

          <Text style={styles.locationTitle}>{profile.district || 'Colombo District'}</Text>
          <Text style={styles.locationSubtitle}>
            {profile.province || 'Western Province'}, {profile.country || 'Sri Lanka'}
          </Text>
          <Text style={styles.coordinates}>
            {profile.coordinates || '6.9271° N, 79.8612° E'}
          </Text>
        </View>

        {/* Right Graphic: Concentric Radar rings with orange marker dot */}
        <View style={styles.radarGraphicContainer}>
          <View style={styles.radarRingOuter}>
            <View style={styles.radarRingMiddle}>
              <View style={styles.radarRingInner} />
            </View>
          </View>
          {/* Orange location point */}
          <View style={styles.orangePinDot} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#16301A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#ECE8DF',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 13.5,
    color: '#6E8070',
    fontWeight: '500',
    flex: 1,
  },
  rowValue: {
    fontSize: 13.5,
    color: '#16301A',
    fontWeight: '600',
    textAlign: 'right',
  },
  divider: {
    height: 0.6,
    backgroundColor: '#F0ECE4',
    marginLeft: 48,
  },
  locationCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1B3220', // Forest dark from theme
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0E2413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  locationContent: {
    flex: 1,
    zIndex: 2,
  },
  locationTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locPin: {
    marginRight: 3,
  },
  locationTag: {
    fontSize: 12,
    color: '#A6C5A8',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  locationTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  locationSubtitle: {
    fontSize: 13,
    color: '#D0DFD2',
    fontWeight: '400',
    marginBottom: 6,
  },
  coordinates: {
    fontSize: 11.5,
    color: '#9AB89D',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 0.3,
  },
  radarGraphicContainer: {
    position: 'absolute',
    right: -20,
    top: -20,
    bottom: -20,
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  radarRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingMiddle: {
    width: 95,
    height: 95,
    borderRadius: 47.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  orangePinDot: {
    position: 'absolute',
    right: 48,
    top: 50,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});
