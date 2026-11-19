import React from 'react';
import { View, Text, StyleSheet, Platform, Image, TouchableOpacity } from 'react-native';
import { colors } from '../../lib/theme';
import { BuyerProfile } from '../../types/buyer.types';
import { useDarkMode } from '../../store/uiStore';

interface BuyerHeaderProps {
  profile: BuyerProfile;
  onPressProfile?: () => void;
}

export const BuyerHeader: React.FC<BuyerHeaderProps> = ({ profile, onPressProfile }) => {
  const [isDark] = useDarkMode();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={onPressProfile ? 0.75 : 1}
        onPress={onPressProfile}
        style={styles.leftContainer}
        disabled={!onPressProfile}
      >
        {/* Avatar with photo or initials fallback */}
        <View style={[styles.avatar, isDark && styles.avatarDark]}>
          {profile.avatarUrl && profile.avatarUrl.trim() !== '' ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>{profile.initials || 'TR'}</Text>
          )}
        </View>

        {/* Welcome Stack */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.welcomeSubtitle, isDark && styles.welcomeSubtitleDark]}>
            Welcome back <Text style={styles.sproutIcon}>🌿</Text>
          </Text>
          <Text style={[styles.userName, isDark && styles.userNameDark]}>
            {profile.fullName}
          </Text>
        </View>
      </TouchableOpacity>
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
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2E4730',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarDark: {
    backgroundColor: '#243C28',
    borderWidth: 1,
    borderColor: '#35543A',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  greetingContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#6E826F',
    fontWeight: '500',
    marginBottom: 2,
  },
  welcomeSubtitleDark: {
    color: '#98B39B',
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
  userNameDark: {
    color: '#F0F5F1',
  },
});
