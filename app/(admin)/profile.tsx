import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDarkMode } from '@/store/uiStore';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

/**
 * Admin Profile Screen (Upper Section)
 * UI-only design preview featuring Dilani Fernando (sample persona).
 * Adheres strictly to the design reference:
 * - Circular back button with safe fallback to Admin Overview
 * - "Your account" label with leaf icon & "My Profile" serif heading
 * - Dark green "Edit" pill button triggering local design preview alert
 * - Prominent "Design preview — sample data" badge
 * - Profile summary card with farm produce background, dark green gradient
 * - Initials "DF" squircle avatar with white border and orange check badge
 * - "Platform Admin" pill, "Dilani Fernando", "Colombo HQ · Super admin"
 * - Mission quote and translucent frosted 3-column statistics panel
 * - Bottom navigation clearance with active Profile tab
 */
export default function AdminProfileScreen() {
  const [isDark] = useDarkMode();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(admin)' as any);
    }
  };

  const handleEdit = () => {
    Alert.alert(
      'Design preview',
      'Design preview: profile editing is not connected yet.'
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          {/* Circular Back Button */}
          <TouchableOpacity
            style={[styles.backButton, isDark && styles.backButtonDark]}
            activeOpacity={0.7}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous screen or Admin Overview"
          >
            <Feather
              name="chevron-left"
              size={24}
              color={isDark ? '#E2EFE5' : '#183821'}
            />
          </TouchableOpacity>

          {/* Title Block */}
          <View style={styles.titleBlock}>
            <View style={styles.eyebrowRow}>
              <Text style={[styles.eyebrowText, isDark && styles.eyebrowTextDark]}>
                Your account
              </Text>
              <MaterialCommunityIcons
                name="leaf"
                size={14}
                color={isDark ? '#78B285' : '#4C7A53'}
                style={styles.leafIcon}
              />
            </View>
            <Text style={[styles.headingText, isDark && styles.headingTextDark]}>
              My Profile
            </Text>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.8}
            onPress={handleEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit profile (design preview)"
          >
            <MaterialCommunityIcons
              name="file-document-edit-outline"
              size={15}
              color="#FFFFFF"
              style={styles.editIcon}
            />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Design Preview Notice Banner */}
        <View style={[styles.previewBadge, isDark && styles.previewBadgeDark]}>
          <Feather
            name="info"
            size={12}
            color={isDark ? '#A3C6AB' : '#3E6646'}
            style={styles.previewIcon}
          />
          <Text style={[styles.previewBadgeText, isDark && styles.previewBadgeTextDark]}>
            Design preview — sample data
          </Text>
        </View>

        {/* Profile Summary Hero Card */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={require('@/assets/images/farm_card_bg.jpg')}
            style={styles.heroCardBackground}
            imageStyle={styles.heroCardImage}
          >
            <LinearGradient
              colors={['rgba(15, 38, 20, 0.45)', 'rgba(12, 30, 16, 0.88)']}
              style={styles.heroGradient}
            >
              {/* Top Persona Row: Avatar + Details */}
              <View style={styles.personaRow}>
                {/* Squircle Avatar with Initials & Check Badge */}
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarSquircle}>
                    <Text style={styles.avatarInitials}>DF</Text>
                  </View>
                  {/* Small Orange Check Badge */}
                  <View style={styles.checkBadge}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                </View>

                {/* Identity & Role Information */}
                <View style={styles.identityContainer}>
                  {/* "Platform Admin" Pill Badge */}
                  <View style={styles.platformBadge}>
                    <Feather name="shield" size={11} color="#2D5339" />
                    <Text style={styles.platformBadgeText}>Platform Admin</Text>
                  </View>

                  {/* Name */}
                  <Text
                    style={styles.personaName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Dilani Fernando
                  </Text>

                  {/* Location & Role */}
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={12} color="#D1E3D3" />
                    <Text
                      style={styles.locationText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Colombo HQ · Super admin
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description / Mission Quote */}
              <Text style={styles.missionQuote}>
                Keeping TraceRoot honest — verifying farmers, auditing locked
                records and resolving disputes across the network.
              </Text>

              {/* Translucent Statistics Panel */}
              <View style={styles.statsPanel}>
                {/* Stat 1: Users */}
                <View style={styles.statColumn}>
                  <Feather name="users" size={14} color="#A3C6AB" />
                  <Text style={styles.statValue}>1.2k</Text>
                  <Text style={styles.statLabel}>Users</Text>
                </View>

                {/* Divider */}
                <View style={styles.statDivider} />

                {/* Stat 2: Verified */}
                <View style={styles.statColumn}>
                  <Feather name="shield" size={14} color="#A3C6AB" />
                  <Text style={styles.statValue}>318</Text>
                  <Text style={styles.statLabel}>Verified</Text>
                </View>

                {/* Divider */}
                <View style={styles.statDivider} />

                {/* Stat 3: Open Flags */}
                <View style={styles.statColumn}>
                  <Feather name="bell" size={14} color="#A3C6AB" />
                  <Text style={styles.statValue}>7</Text>
                  <Text style={styles.statLabel}>Open flags</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Tab Bar */}
      <AdminTabBar activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  containerDark: {
    backgroundColor: '#0D1A10',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonDark: {
    backgroundColor: '#1A2E20',
    borderColor: '#2D4834',
    borderWidth: 1,
    shadowOpacity: 0.25,
  },
  titleBlock: {
    flex: 1,
    marginHorizontal: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4C7A53',
    letterSpacing: 0.2,
  },
  eyebrowTextDark: {
    color: '#78B285',
  },
  leafIcon: {
    marginLeft: 4,
  },
  headingText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#183821',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  headingTextDark: {
    color: '#EAF3EC',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3E2B',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  editIcon: {
    marginRight: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Preview Notice Banner */
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E7EFE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CFDEC0',
  },
  previewBadgeDark: {
    backgroundColor: '#193320',
    borderColor: '#284E33',
  },
  previewIcon: {
    marginRight: 5,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3E6646',
  },
  previewBadgeTextDark: {
    color: '#A3C6AB',
  },

  /* Profile Summary Hero Card */
  heroCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: '#183821',
  },
  heroCardBackground: {
    width: '100%',
  },
  heroCardImage: {
    borderRadius: 24,
    resizeMode: 'cover',
  },
  heroGradient: {
    padding: 18,
    borderRadius: 24,
  },

  /* Top Persona Row */
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarSquircle: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: '#284E33',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E57338',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Identity Info */
  identityContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D5339',
  },
  personaName: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D1E3D3',
    flexShrink: 1,
  },

  /* Mission Quote */
  missionQuote: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#D9E8DC',
    marginBottom: 16,
    fontWeight: '400',
  },

  /* Frosted Statistics Panel */
  statsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A3C6AB',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
});
