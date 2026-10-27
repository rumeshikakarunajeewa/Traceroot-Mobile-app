import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SupplierProfile } from '../../types/supplier.types';
import { useDarkMode } from '../../store/uiStore';

interface SupplierHeaderProps {
  profile: SupplierProfile;
  onStorePress?: () => void;
  onNotificationPress?: () => void;
}

export const SupplierHeader: React.FC<SupplierHeaderProps> = ({
  profile,
  onStorePress,
  onNotificationPress,
}) => {
  const [isDark] = useDarkMode();

  return (
    <View style={styles.container}>
      {/* Left: Earthy Brown Circular Storefront Icon */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onStorePress}
        style={styles.storeIconContainer}
        accessibilityRole="button"
        accessibilityLabel="Supplier Store"
      >
        <MaterialCommunityIcons name="storefront" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Center: Title & Business Name with Soft Green Marker Underline/Tint */}
      <View style={styles.centerInfo}>
        <View style={styles.subtitleRow}>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Supplier Dashboard
          </Text>
          <Text style={styles.emojiWheat}>🌾</Text>
        </View>

        <View style={styles.highlightWrapper}>
          <View
            style={[
              styles.highlightBar,
              isDark && styles.highlightBarDark,
            ]}
          />
          <Text style={[styles.companyName, isDark && styles.companyNameDark]}>
            {profile.name}
          </Text>
        </View>
      </View>

      {/* Right: Circular Notification Bell with Alert Dot */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onNotificationPress}
        style={[
          styles.bellContainer,
          isDark && styles.bellContainerDark,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <MaterialCommunityIcons
          name="bell-outline"
          size={21}
          color={isDark ? '#E2ECE4' : '#2A3C2E'}
        />
        {Boolean(profile.unreadNotificationsCount) && (
          <View style={styles.notificationDot} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  storeIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#845E38', // Rich earthy warm tone matching Figma
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  centerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#6F8471',
    letterSpacing: 0.2,
  },
  subtitleDark: {
    color: '#9BB29D',
  },
  emojiWheat: {
    fontSize: 12,
  },
  highlightWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBar: {
    position: 'absolute',
    bottom: 2,
    left: -4,
    right: -4,
    height: 10,
    backgroundColor: 'rgba(164, 203, 172, 0.38)', // Soft green highlighter effect
    borderRadius: 3,
    zIndex: -1,
  },
  highlightBarDark: {
    backgroundColor: 'rgba(64, 115, 75, 0.45)',
  },
  companyName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#162E1D',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.3,
  },
  companyNameDark: {
    color: '#F0F5F1',
  },
  bellContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7DC',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  bellContainerDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E66826', // Vibrant orange alert dot matching design
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
