import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuyerProfile } from '../../types/buyer.types';
import {
  parseCoordinates,
  getStaticMapUrl,
  openInNativeMaps,
  formatCoordinates,
} from '../../services/location.service';

interface BuyerProfileDetailsProps {
  profile: BuyerProfile;
  isDark?: boolean;
  onPressPhone?: () => void;
  onPressEmail?: () => void;
  onPressLocation?: () => void;
}

export const BuyerProfileDetails: React.FC<BuyerProfileDetailsProps> = ({
  profile,
  isDark = false,
  onPressPhone,
  onPressEmail,
  onPressLocation,
}) => {
  const coords = parseCoordinates(profile.coordinates, profile.district);
  const effectiveLat = profile.latitude ?? coords.latitude;
  const effectiveLng = profile.longitude ?? coords.longitude;
  const staticMapUrl = getStaticMapUrl(effectiveLat, effectiveLng, 13, 260, 220);
  const locationLabel =
    [profile.district, profile.province].filter((s) => s && s.trim()).join(', ') || 'Sri Lanka';
  const displayCoords =
    profile.coordinates && profile.coordinates.trim()
      ? profile.coordinates.trim()
      : formatCoordinates(effectiveLat, effectiveLng);

  const handleOpenMap = () => {
    openInNativeMaps(
      effectiveLat,
      effectiveLng,
      profile.company || profile.fullName || 'Buyer Location'
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Contact & Business Details Card */}
      <View style={[styles.detailsCard, isDark && styles.detailsCardDark]}>
        {/* Row 1: Phone */}
        <TouchableOpacity
          activeOpacity={onPressPhone ? 0.7 : 1}
          onPress={onPressPhone}
          style={styles.rowItem}
        >
          <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={17}
              color={isDark ? '#A6C5A8' : '#2A4B2F'}
            />
          </View>
          <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Phone</Text>
          <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>
            {profile.phone || ' '}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, isDark && styles.dividerDark]} />

        {/* Row 2: Email */}
        <TouchableOpacity
          activeOpacity={onPressEmail ? 0.7 : 1}
          onPress={onPressEmail}
          style={styles.rowItem}
        >
          <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
            <MaterialCommunityIcons
              name="email-outline"
              size={17}
              color={isDark ? '#A6C5A8' : '#2A4B2F'}
            />
          </View>
          <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Email</Text>
          <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>
            {profile.email || ' '}
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, isDark && styles.dividerDark]} />

        {/* Row 3: Business */}
        <View style={styles.rowItem}>
          <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={17}
              color={isDark ? '#A6C5A8' : '#2A4B2F'}
            />
          </View>
          <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Business</Text>
          <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>
            {profile.businessType && profile.businessType.trim()
              ? profile.businessType.trim().charAt(0).toUpperCase() + profile.businessType.trim().slice(1)
              : ' '}
          </Text>
        </View>

        <View style={[styles.divider, isDark && styles.dividerDark]} />

        {/* Row 4: Registration ID */}
        <View style={styles.rowItem}>
          <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={17}
              color={isDark ? '#A6C5A8' : '#2A4B2F'}
            />
          </View>
          <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Reg. ID</Text>
          <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>
            {profile.registrationId || ' '}
          </Text>
        </View>
      </View>

      {/* 2. Deep Forest Green Location Feature Card with Real Small Map */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPressLocation || handleOpenMap}
        style={[styles.locationCard, isDark && styles.locationCardDark]}
      >
        {/* Left Column info */}
        <View style={styles.locationContent}>
          <View style={styles.locationTagRow}>
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              size={15}
              color="#A6C5A8"
              style={styles.locPin}
            />
            <Text style={styles.locationTag}>Real Location</Text>
          </View>

          <Text style={styles.locationTitle}>{locationLabel}</Text>
          <Text style={styles.locationSubtitle}>
            {profile.address && profile.address.trim() ? profile.address : profile.country || 'Sri Lanka'}
          </Text>
          <Text style={styles.coordinates}>{displayCoords}</Text>

          <View style={styles.openMapActionRow}>
            <Text style={styles.openMapActionText}>Open in Maps</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color="#A6C5A8" />
          </View>
        </View>

        {/* Right Column: Small Map Preview of Real Location */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenMap}
          style={styles.miniMapContainer}
          accessibilityLabel="Open small map in native maps"
        >
          <Image
            source={{ uri: staticMapUrl }}
            style={styles.miniMapImage}
            resizeMode="cover"
          />
          <View style={styles.miniMapOverlay} />
          {/* Centered Location Pin Marker */}
          <View style={styles.miniMapPinWrapper}>
            <View style={styles.miniMapPinPulse} />
            <MaterialCommunityIcons name="map-marker" size={24} color="#F97316" />
          </View>
          {/* Small Map Tag Badge */}
          <View style={styles.miniMapBadge}>
            <MaterialCommunityIcons name="open-in-new" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
            <Text style={styles.miniMapBadgeText}>MAP</Text>
          </View>
        </TouchableOpacity>
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
  detailsCardDark: {
    backgroundColor: '#1B2A1F',
    borderColor: '#293E2E',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
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
  iconCircleDark: {
    backgroundColor: '#26382A',
  },
  rowLabel: {
    fontSize: 13.5,
    color: '#6E8070',
    fontWeight: '500',
    flex: 1,
  },
  rowLabelDark: {
    color: '#A0B7A4',
  },
  rowValue: {
    fontSize: 13.5,
    color: '#16301A',
    fontWeight: '600',
    textAlign: 'right',
  },
  rowValueDark: {
    color: '#F0F4F1',
  },
  divider: {
    height: 0.6,
    backgroundColor: '#F0ECE4',
    marginLeft: 48,
  },
  dividerDark: {
    backgroundColor: '#293D2E',
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
  locationCardDark: {
    backgroundColor: '#152518',
    borderColor: '#243C28',
    borderWidth: 0.5,
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
  openMapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  openMapActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A6C5A8',
    marginRight: 2,
  },
  miniMapContainer: {
    width: 110,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F2314',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  miniMapImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  miniMapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 35, 20, 0.08)',
  },
  miniMapPinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapPinPulse: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(249, 115, 22, 0.35)',
  },
  miniMapBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(15, 35, 20, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  miniMapBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
