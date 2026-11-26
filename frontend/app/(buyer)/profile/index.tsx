import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  ImageBackground,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BuyerProfile } from '../../../src/types/buyer.types';
import { BuyerEditProfileModal } from '../../../src/components/buyer/BuyerEditProfileModal';
import { profilesService } from '../../../src/services/profiles.service';
import { useAuth } from '../../../src/store/authStore';
import { useDarkMode } from '../../../src/store/uiStore';
import {
  parseCoordinates,
  getStaticMapUrl,
  openInNativeMaps,
  formatCoordinates,
} from '../../../src/services/location.service';

type ProfileTab = 'About' | 'Orders' | 'Saved' | 'Documents';

export default function BuyerProfileScreen() {
  const { user, profile: authProfile } = useAuth();
  const userName = authProfile?.full_name || user?.user_metadata?.full_name || 'Buyer';
  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .map((p: string) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'B';

  const [profile, setProfile] = useState<BuyerProfile>({
    id: user?.id || '',
    fullName: userName,
    initials: userInitials,
    isVerified: false,
    roleTitle: 'Wholesale Buyer',
    company: '',
    district: '',
    province: '',
    country: 'Sri Lanka',
    address: '',
    bio: '',
    ordersCount: 0,
    contractsCount: 0,
    kgSourced: '0 kg',
    trustScore: 85,
    trustScoreLabel: 'Verified Buyer',
    trustRating: '4.8',
    trustScoreDetail: 'Active account on TraceRoot',
    trustDescription: 'New active buyer account',
    phone: authProfile?.phone || user?.phone || '',
    email: user?.email || '',
    businessType: 'Retailer / Wholesaler',
    registrationId: '',
  });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('About');
  const [darkMode, setDarkMode] = useDarkMode();
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      profilesService
        .getBuyerProfile(user.id)
        .then((remote) => {
          if (isMounted && remote) {
            setProfile((prev) => ({
              ...prev,
              ...remote,
            }));
          }
        })
        .catch((err) => {
          console.warn('Failed to load buyer profile from Supabase:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const remote = await profilesService.getBuyerProfile(user.id);
      if (remote) {
        setProfile((prev) => ({
          ...prev,
          ...remote,
        }));
      }
    } catch (err) {
      console.warn('Failed to refresh buyer profile from Supabase:', err);
    } finally {
      setRefreshing(false);
    }
  };

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

  const handleEditPress = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async (
    updatedProfile: Partial<BuyerProfile>,
    localAvatarUri?: string,
    avatarBase64?: string
  ) => {
    setIsSaving(true);
    try {
      if (user?.id) {
        const result = await profilesService.updateBuyerProfile(
          user.id,
          updatedProfile,
          localAvatarUri,
          avatarBase64
        );
        if (!result.success) {
          Alert.alert('Update Failed', result.error || 'Failed to update buyer profile.');
          setIsSaving(false);
          return;
        }
        if (result.avatarUrl) {
          updatedProfile.avatarUrl = result.avatarUrl;
        }
      }

      setProfile((prev) => ({
        ...prev,
        ...updatedProfile,
      }));
      setIsEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your TraceRoot account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    if (tab === 'Orders') {
      router.push('/(buyer)/orders');
    } else if (tab === 'Saved') {
      router.push('/(buyer)/explore');
    } else if (tab === 'Documents') {
      Alert.alert('Documents', '4 verified trade certifications & trade licenses on file.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.safeAreaDark]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={darkMode ? '#4ADE80' : '#436647'}
            colors={['#436647']}
          />
        }
      >
        {/* ========================================================
            1. TOP HEADER WITH BACK BUTTON, TITLE & EDIT BUTTON
           ======================================================== */}
        <View style={styles.headerRow}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={[styles.backButton, darkMode && styles.backButtonDark]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={darkMode ? '#F0F5F1' : '#1F2937'} />
          </TouchableOpacity>

          {/* Title & Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={[styles.subtitleText, darkMode && styles.subtitleTextDark]}>Your account 🌿</Text>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, darkMode && styles.titleTextDark]}>My </Text>
              <View style={[styles.highlightWrapper, darkMode && styles.highlightWrapperDark]}>
                <Text style={[styles.titleHighlightText, darkMode && styles.titleHighlightTextDark]}>Profile</Text>
              </View>
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEditPress}
            style={styles.editButton}
          >
            <MaterialCommunityIcons name="square-edit-outline" size={15} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================
            2. HERO PROFILE CARD WITH HARVEST PHOTO BACKGROUND
           ======================================================== */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={{ uri: profile.heroBackgroundUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80' }}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImage}
            resizeMode="cover"
          >
            {/* Dark green gradient scrim for contrast */}
            <View style={styles.heroOverlay}>
              {/* Top Row: Avatar & Bio Info */}
              <View style={styles.heroTopRow}>
                {/* Avatar with Verified Checkmark Badge */}
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  <View style={styles.verifiedCheckBadge}>
                    <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
                  </View>
                </View>

                {/* Name, Role & Location */}
                <View style={styles.heroInfoColumn}>
                  {/* Wholesale Buyer Pill */}
                  <View style={styles.roleBadge}>
                    <MaterialCommunityIcons name="basket-outline" size={12} color="#1D3524" />
                    <Text style={styles.roleBadgeText}>{profile.role || 'Wholesale Buyer'}</Text>
                  </View>

                  {/* Name */}
                  <Text style={styles.heroName} numberOfLines={1}>
                    {profile.fullName}
                  </Text>

                  {/* Location & Organization */}
                  <View style={styles.heroLocRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={13} color="#D4E3D8" />
                    <Text style={styles.heroLocText} numberOfLines={1}>
                      {profile.district} · {profile.company}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bio Paragraph */}
              <Text style={styles.bioText}>
                {profile.bio}
              </Text>

              {/* Frosted Glass / Translucent Stats Row */}
              <View style={styles.frostedStatsCard}>
                {/* Orders */}
                <View style={styles.statColumn}>
                  <MaterialCommunityIcons name="basket-outline" size={15} color="#D4E2D8" />
                  <Text style={styles.statNumber}>{profile.ordersCount}</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>

                {/* Contracts */}
                <View style={styles.statColumn}>
                  <MaterialCommunityIcons name="file-document-outline" size={15} color="#D4E2D8" />
                  <Text style={styles.statNumber}>{profile.contractsCount}</Text>
                  <Text style={styles.statLabel}>Contracts</Text>
                </View>

                {/* kg sourced */}
                <View style={styles.statColumn}>
                  <MaterialCommunityIcons name="scale-balance" size={15} color="#D4E2D8" />
                  <Text style={styles.statNumber}>{profile.kgSourced}</Text>
                  <Text style={styles.statLabel}>kg sourced</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ========================================================
            3. DEEP FOREST GREEN LOCATION CARD WITH REAL SMALL MAP
           ======================================================== */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleOpenMap}
          style={[styles.locationCard, darkMode && styles.locationCardDark]}
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
            <Text style={styles.locationSubtitle} numberOfLines={2}>
              {profile.company || profile.province || 'Sri Lanka'}
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

        {/* ========================================================
            4. HORIZONTAL FILTER TABS (About, Orders, Saved, Documents)
           ======================================================== */}
        <View style={styles.tabsRow}>
          {(['About', 'Orders', 'Saved', 'Documents'] as ProfileTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => handleTabChange(tab)}
                style={[
                  styles.tabPill,
                  isActive
                    ? styles.tabPillActive
                    : [styles.tabPillInactive, darkMode && styles.tabPillInactiveDark],
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isActive
                      ? styles.tabTextActive
                      : [styles.tabTextInactive, darkMode && styles.tabTextInactiveDark],
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================
            5. CONTACT & BUSINESS DETAILS CARD
           ======================================================== */}
        <View style={[styles.detailsCard, darkMode && styles.detailsCardDark]}>
          {/* Phone */}
          <View style={[styles.detailRow, darkMode && styles.detailRowDark]}>
            <View style={styles.detailLeft}>
              <View style={[styles.detailIconCircle, darkMode && styles.detailIconCircleDark]}>
                <MaterialCommunityIcons name="chat-outline" size={16} color={darkMode ? '#A6C5A8' : '#556D5B'} />
              </View>
              <Text style={[styles.detailLabel, darkMode && styles.detailLabelDark]}>Phone</Text>
            </View>
            <Text style={[styles.detailValue, darkMode && styles.detailValueDark]}>{profile.phone}</Text>
          </View>

          {/* Email */}
          <View style={[styles.detailRow, darkMode && styles.detailRowDark]}>
            <View style={styles.detailLeft}>
              <View style={[styles.detailIconCircle, darkMode && styles.detailIconCircleDark]}>
                <MaterialCommunityIcons name="email-outline" size={16} color={darkMode ? '#A6C5A8' : '#556D5B'} />
              </View>
              <Text style={[styles.detailLabel, darkMode && styles.detailLabelDark]}>Email</Text>
            </View>
            <Text style={[styles.detailValue, darkMode && styles.detailValueDark]}>{profile.email}</Text>
          </View>

          {/* Business */}
          <View style={[styles.detailRow, darkMode && styles.detailRowDark]}>
            <View style={styles.detailLeft}>
              <View style={[styles.detailIconCircle, darkMode && styles.detailIconCircleDark]}>
                <MaterialCommunityIcons name="storefront-outline" size={16} color={darkMode ? '#A6C5A8' : '#556D5B'} />
              </View>
              <Text style={[styles.detailLabel, darkMode && styles.detailLabelDark]}>Business</Text>
            </View>
            <Text style={[styles.detailValue, darkMode && styles.detailValueDark]}>{profile.businessType}</Text>
          </View>

          {/* Reg. ID */}
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailLeft}>
              <View style={[styles.detailIconCircle, darkMode && styles.detailIconCircleDark]}>
                <MaterialCommunityIcons name="shield-check-outline" size={16} color={darkMode ? '#A6C5A8' : '#556D5B'} />
              </View>
              <Text style={[styles.detailLabel, darkMode && styles.detailLabelDark]}>Reg. ID</Text>
            </View>
            <Text style={[styles.detailValue, darkMode && styles.detailValueDark]}>{profile.registrationId || profile.regId || ' '}</Text>
          </View>
        </View>

        {/* ========================================================
            6. SETTINGS SECTION
           ======================================================== */}
        <Text style={[styles.sectionHeader, darkMode && styles.sectionHeaderDark]}>Settings</Text>
        <View style={[styles.settingsCard, darkMode && styles.settingsCardDark]}>
          {/* Dark Mode */}
          <View style={[styles.settingRow, darkMode && styles.settingRowDark]}>
            <View style={styles.settingLeft}>
              <View style={[styles.detailIconCircle, darkMode && styles.detailIconCircleDark]}>
                <MaterialCommunityIcons name="weather-sunny" size={16} color={darkMode ? '#A6C5A8' : '#556D5B'} />
              </View>
              <View>
                <Text style={[styles.settingTitle, darkMode && styles.settingTitleDark]}>Dark mode</Text>
                <Text style={[styles.settingSubtitle, darkMode && styles.settingSubtitleDark]}>{darkMode ? 'On' : 'Off'}</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: darkMode ? '#2E4032' : '#E5E7EB', true: '#436647' }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          {/* Notifications */}
          <View style={[styles.settingRow, darkMode && styles.settingRowDark]}>
            <View style={styles.settingLeft}>
              <View style={[styles.detailIconCircle, darkMode && styles.detailIconCircleDark]}>
                <MaterialCommunityIcons name="bell-outline" size={16} color={darkMode ? '#A6C5A8' : '#556D5B'} />
              </View>
              <View>
                <Text style={[styles.settingTitle, darkMode && styles.settingTitleDark]}>Notifications</Text>
                <Text style={[styles.settingSubtitle, darkMode && styles.settingSubtitleDark]}>Orders, contracts & alerts</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: darkMode ? '#2E4032' : '#E5E7EB', true: '#436647' }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          {/* Language */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.detailIconCircle, darkMode && styles.detailIconCircleDark]}>
                <MaterialCommunityIcons name="chat-processing-outline" size={16} color={darkMode ? '#A6C5A8' : '#556D5B'} />
              </View>
              <View>
                <Text style={[styles.settingTitle, darkMode && styles.settingTitleDark]}>Language</Text>
                <Text style={[styles.settingSubtitle, darkMode && styles.settingSubtitleDark]}>English</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.languagePill, darkMode && styles.languagePillDark]} activeOpacity={0.8}>
              <Text style={[styles.languagePillText, darkMode && styles.languagePillTextDark]}>English</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={darkMode ? '#A6C5A8' : '#556D5B'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================
            7. LOG OUT BUTTON
           ======================================================== */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[styles.logoutButton, darkMode && styles.logoutButtonDark]}
        >
          <MaterialCommunityIcons name="chevron-left" size={17} color={darkMode ? '#F87171' : '#C06637'} />
          <Text style={[styles.logoutButtonText, darkMode && styles.logoutButtonTextDark]}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <BuyerEditProfileModal
        visible={isEditModalVisible}
        profile={profile}
        isDark={darkMode}
        isSaving={isSaving}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA', // Warm organic ivory/cream matching design screenshot
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 115, // Space for the floating bottom navigation bar
  },

  /* 1. Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE6DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  subtitleText: {
    fontSize: 12,
    color: '#586E5B',
    fontWeight: '500',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#152E1B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  highlightWrapper: {
    backgroundColor: '#DEE8DF',
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  titleHighlightText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#152E1B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  editButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: '#1D3524',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* 2. Hero Profile Card */
  heroCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAE5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBackground: {
    width: '100%',
  },
  heroBackgroundImage: {
    borderRadius: 24,
  },
  heroOverlay: {
    backgroundColor: 'rgba(18, 42, 23, 0.72)', // Rich forest green overlay
    padding: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 22,
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroInfoColumn: {
    flex: 1,
  },
  roleBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D3524',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.2,
  },
  heroLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  heroLocText: {
    fontSize: 12,
    color: '#DEE8E2',
    fontWeight: '500',
  },
  bioText: {
    fontSize: 12.5,
    color: '#EFF5F1',
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 14,
    fontWeight: '400',
  },
  frostedStatsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#D4E2D8',
    fontWeight: '500',
  },

  /* 3. Deep Forest Green Location Card */
  locationCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1B3220', // Forest dark matching Supplier & Buyer theme
    borderRadius: 24,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1B3220',
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
    fontSize: 10.5,
    fontWeight: '700',
    color: '#A6C5A8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#D4E2D8',
    fontWeight: '400',
    marginBottom: 6,
    lineHeight: 16,
  },
  coordinates: {
    fontSize: 11,
    color: '#A6C5A8',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  openMapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  openMapActionText: {
    fontSize: 11.5,
    color: '#A6C5A8',
    fontWeight: '600',
  },

  /* Small Map Preview */
  miniMapContainer: {
    width: 104,
    height: 104,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginLeft: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: '#0F1E13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapImage: {
    width: '100%',
    height: '100%',
  },
  miniMapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  miniMapPinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapPinPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.28)',
  },
  miniMapBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniMapBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* 4. Filter Tabs */
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  tabPill: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#3E6142',
    shadowColor: '#3E6142',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPillInactive: {
    backgroundColor: '#FAF7F1',
    borderWidth: 1,
    borderColor: '#D8D1C3',
  },
  tabPillText: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#283C2A',
    fontWeight: '500',
  },

  /* 5. Contact & Business Details Card */
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE9E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F2EFEB',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#526756',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C3120',
  },

  /* 6. Settings Section */
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#687A6C',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE9E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F2EFEB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F3122',
  },
  settingSubtitle: {
    fontSize: 11.5,
    color: '#768779',
    marginTop: 1,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF7F1',
    borderWidth: 1,
    borderColor: '#D8D1C3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  languagePillText: {
    fontSize: 12,
    color: '#283C2A',
    fontWeight: '600',
  },

  /* 8. Log out Button */
  logoutButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0D5C3',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C06637',
  },

  /* Dark Mode Overrides */
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  backButtonDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  subtitleTextDark: {
    color: '#98B39B',
  },
  titleTextDark: {
    color: '#F0F5F1',
  },
  highlightWrapperDark: {
    backgroundColor: '#203924',
  },
  titleHighlightTextDark: {
    color: '#4ADE80',
  },
  tabPillInactiveDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  tabTextInactiveDark: {
    color: '#98B39B',
  },
  detailsCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  detailRowDark: {
    borderColor: '#243928',
  },
  detailIconCircleDark: {
    backgroundColor: '#203924',
  },
  detailLabelDark: {
    color: '#98B39B',
  },
  detailValueDark: {
    color: '#F0F5F1',
  },
  sectionHeaderDark: {
    color: '#98B39B',
  },
  settingsCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  settingRowDark: {
    borderColor: '#243928',
  },
  settingTitleDark: {
    color: '#F0F5F1',
  },
  settingSubtitleDark: {
    color: '#98B39B',
  },
  languagePillDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  languagePillTextDark: {
    color: '#98B39B',
  },
  logoutButtonDark: {
    borderColor: '#4A2B20',
    backgroundColor: '#1F1714',
  },
  logoutButtonTextDark: {
    color: '#F87171',
  },
});
