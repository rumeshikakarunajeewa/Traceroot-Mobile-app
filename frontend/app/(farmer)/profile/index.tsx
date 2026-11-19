import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Switch,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useFarmerProfile } from '../../../src/store/farmerProfileStore';
import { useCropsStore } from '../../../src/store/cropStore';
import { authService } from '../../../src/services/auth.service';
import { setAuthState } from '../../../src/store/authStore';
import { useDarkMode } from '../../../src/store/uiStore';

type ProfileTab = 'about' | 'products' | 'reviews' | 'documents';

export default function FarmerProfileScreen() {
  const { profile, settings, isRefreshing, refresh, updateSettings } = useFarmerProfile();
  const { fields: crops } = useCropsStore();
  const [darkMode, setDarkMode] = useDarkMode();

  const [activeTab, setActiveTab] = useState<ProfileTab>('about');

  // Toggle handlers for Settings
  const handleToggleDarkMode = (val: boolean) => {
    setDarkMode(val);
    updateSettings({ darkMode: val });
  };

  const handleToggleNotifications = (val: boolean) => {
    updateSettings({ notifications: val });
  };

  const handleLanguageSelect = () => {
    Alert.alert('Select Language', 'Choose your preferred language', [
      { text: 'English', onPress: () => updateSettings({ language: 'English' }) },
      { text: 'සිංහල (Sinhala)', onPress: () => updateSettings({ language: 'Sinhala' }) },
      { text: 'தமிழ் (Tamil)', onPress: () => updateSettings({ language: 'Tamil' }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await authService.signOut();
      } catch (err) {
        console.warn('Error during signOut:', err);
      } finally {
        setAuthState({
          user: null,
          profile: null,
          session: null,
          token: null,
          isLoading: false,
        });
        router.replace('/(auth)/login' as any);
      }
    };

    if (Platform.OS === 'web') {
      const confirmText = 'Log Out\n\nAre you sure you want to log out of your TraceRoot account?';
      if (typeof window !== 'undefined' && window.confirm && window.confirm(confirmText)) {
        performLogout();
      }
      return;
    }

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your TraceRoot account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const bgImageUri = 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80';

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />

      {/* 1. Header Navigation Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={[styles.backCircleBtn, darkMode && styles.backCircleBtnDark]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={darkMode ? '#E5EFE7' : '#16351E'} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={[styles.headerSubtitle, darkMode && styles.headerSubtitleDark]}>Your account</Text>
          <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>My Profile</Text>
        </View>

        {/* Edit Profile Pill Button matching screenshot */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/(farmer)/profile/edit' as any)}
          activeOpacity={0.85}
        >
          <Feather name="edit-3" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={darkMode ? '#84C98E' : '#24542B'}
            colors={['#24542B']}
          />
        }
      >
        {/* 2. Hero Profile Card with Lush Farm Background */}
        <ImageBackground
          source={{ uri: bgImageUri }}
          style={styles.heroBackground}
          imageStyle={{ borderRadius: 24 }}
        >
          {/* Semi-transparent rich dark overlay */}
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            {/* Top row: Avatar + Verified Farmer badge + Name + Location */}
            <View style={styles.heroTopRow}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.heroAvatar}
                />
                {/* Orange verified checkmark badge */}
                <View style={styles.verifiedCheckBadge}>
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.heroInfoCol}>
                <View style={styles.verifiedPill}>
                  <MaterialCommunityIcons name="shield-check" size={12} color="#24542B" style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedPillText}>Verified Farmer</Text>
                </View>

                <Text style={styles.farmerNameText} numberOfLines={1}>
                  {profile.fullName}
                </Text>

                <View style={styles.locationDeliveryRow}>
                  <Ionicons name="location-sharp" size={12} color="#E8AF30" style={{ marginRight: 2 }} />
                  <Text style={styles.locationText}>{profile.location}</Text>
                  <Text style={styles.deliveryDot}> • </Text>
                  <Text style={styles.deliveryText}>Delivery available</Text>
                </View>
              </View>
            </View>

            {/* Bio text */}
            <Text style={styles.bioText}>
              {profile.bio}
            </Text>

            {/* Bottom 3-Column Stats Panel */}
            <View style={styles.heroStatsPanel}>
              <View style={styles.heroStatItem}>
                <MaterialCommunityIcons name="sprout" size={16} color="#DCEEE0" style={styles.statIcon} />
                <Text style={styles.heroStatValue}>{crops.length || profile.cropsCount}</Text>
                <Text style={styles.heroStatLabel}>Crops</Text>
              </View>

              <View style={styles.heroStatDivider} />

              <View style={styles.heroStatItem}>
                <MaterialCommunityIcons name="basket" size={16} color="#DCEEE0" style={styles.statIcon} />
                <Text style={styles.heroStatValue}>{profile.ordersCount}</Text>
                <Text style={styles.heroStatLabel}>Orders</Text>
              </View>

              <View style={styles.heroStatDivider} />

              <View style={styles.heroStatItem}>
                <Ionicons name="sunny-outline" size={16} color="#DCEEE0" style={styles.statIcon} />
                <Text style={styles.heroStatValue}>{profile.rating}</Text>
                <Text style={styles.heroStatLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* 3. Trust Score Card */}
        <View style={[styles.trustCard, darkMode && styles.trustCardDark]}>
          <View style={[styles.trustCircleRing, darkMode && styles.trustCircleRingDark]}>
            <Text style={[styles.trustScoreNumber, darkMode && styles.trustScoreNumberDark]}>{profile.trustScore}</Text>
          </View>

          <View style={styles.trustTextCol}>
            <Text style={[styles.trustLabel, darkMode && styles.trustLabelDark]}>Trust score</Text>
            <Text style={[styles.trustHeadline, darkMode && styles.trustHeadlineDark]}>Highly trusted</Text>
            <Text style={[styles.trustSubtext, darkMode && styles.trustSubtextDark]}>
              Every crop record locked with photo evidence
            </Text>
          </View>
        </View>

        {/* 4. Horizontal Navigation Pill Tabs matching screenshot */}
        <View style={styles.tabsRow}>
          {(['about', 'products', 'reviews', 'documents'] as ProfileTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            const labels: Record<ProfileTab, string> = {
              about: 'About',
              products: 'Products',
              reviews: 'Reviews',
              documents: 'Documents',
            };

            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabPill,
                  isSelected
                    ? (darkMode ? styles.tabPillActiveDark : styles.tabPillActive)
                    : (darkMode ? styles.tabPillInactiveDark : styles.tabPillInactive),
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isSelected
                      ? styles.tabPillTextActive
                      : (darkMode ? styles.tabPillTextInactiveDark : styles.tabPillTextInactive),
                  ]}
                >
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. TAB CONTENT */}
        {activeTab === 'about' && (
          <View style={styles.tabContentContainer}>
            {/* Card 1: Contact, Farm & Registration Details */}
            <View style={[styles.infoCard, darkMode && styles.infoCardDark]}>
              {/* Phone */}
              <View style={styles.infoItemRow}>
                <View style={[styles.infoIconCircle, darkMode && styles.infoIconCircleDark]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={17} color={darkMode ? '#4ADE80' : '#26542D'} />
                </View>
                <Text style={[styles.infoItemLabel, darkMode && styles.infoItemLabelDark]}>Phone</Text>
                <Text style={[styles.infoItemValue, darkMode && styles.infoItemValueDark]}>{profile.phone}</Text>
              </View>

              <View style={[styles.infoRowDivider, darkMode && styles.infoRowDividerDark]} />

              {/* Email */}
              <View style={styles.infoItemRow}>
                <View style={[styles.infoIconCircle, darkMode && styles.infoIconCircleDark]}>
                  <Ionicons name="mail-outline" size={17} color={darkMode ? '#4ADE80' : '#26542D'} />
                </View>
                <Text style={[styles.infoItemLabel, darkMode && styles.infoItemLabelDark]}>Email</Text>
                <Text style={[styles.infoItemValue, darkMode && styles.infoItemValueDark]} numberOfLines={1}>{profile.email}</Text>
              </View>

              <View style={[styles.infoRowDivider, darkMode && styles.infoRowDividerDark]} />

              {/* Farm */}
              <View style={styles.infoItemRow}>
                <View style={[styles.infoIconCircle, darkMode && styles.infoIconCircleDark]}>
                  <MaterialCommunityIcons name="chart-bar" size={17} color={darkMode ? '#4ADE80' : '#26542D'} />
                </View>
                <Text style={[styles.infoItemLabel, darkMode && styles.infoItemLabelDark]}>Farm</Text>
                <Text style={[styles.infoItemValue, darkMode && styles.infoItemValueDark]}>{profile.farmName ? `${profile.farmName} • ${profile.farmSize}` : `Greenhouse • ${profile.farmSize}`}</Text>
              </View>

              <View style={[styles.infoRowDivider, darkMode && styles.infoRowDividerDark]} />

              {/* Registration */}
              <View style={styles.infoItemRow}>
                <View style={[styles.infoIconCircle, darkMode && styles.infoIconCircleDark]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={17} color={darkMode ? '#4ADE80' : '#26542D'} />
                </View>
                <Text style={[styles.infoItemLabel, darkMode && styles.infoItemLabelDark]}>Registration</Text>
                <Text style={[styles.infoItemValue, darkMode && styles.infoItemValueDark]}>{profile.registrationNo}</Text>
              </View>
            </View>

            {/* Card 2: Location Card (Dark Forest Green) */}
            <View style={[styles.locationCard, darkMode && styles.locationCardDark]}>
              <View style={styles.locationLeft}>
                <View style={styles.locationHeaderRow}>
                  <Ionicons name="location-outline" size={14} color="#A7CCA9" style={{ marginRight: 4 }} />
                  <Text style={styles.locationHeaderLabel}>Location</Text>
                </View>
                <Text style={styles.locationDistrictTitle}>{profile.district}</Text>
                <Text style={styles.locationProvinceTitle}>{profile.province}, {profile.country}</Text>
                <Text style={styles.locationCoordsText}>{profile.coordinates}</Text>
              </View>

              {/* Graphic Radar Circle with Orange Pin dot */}
              <View style={styles.radarWrapper}>
                <View style={styles.radarOuterRing}>
                  <View style={styles.radarInnerRing}>
                    <View style={styles.radarCenterDot} />
                  </View>
                </View>
              </View>
            </View>

            {/* Card 3: Settings Section */}
            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, darkMode && styles.settingsSectionTitleDark]}>Settings</Text>

              <View style={[styles.settingsCard, darkMode && styles.settingsCardDark]}>
                {/* Dark Mode */}
                <View style={styles.settingsItemRow}>
                  <View style={[styles.settingsIconCircle, darkMode && styles.settingsIconCircleDark]}>
                    <Ionicons name="sunny-outline" size={18} color={darkMode ? '#4ADE80' : '#26542D'} />
                  </View>
                  <View style={styles.settingsTextCol}>
                    <Text style={[styles.settingsItemTitle, darkMode && styles.settingsItemTitleDark]}>Dark mode</Text>
                    <Text style={[styles.settingsItemSub, darkMode && styles.settingsItemSubDark]}>{darkMode ? 'On' : 'Off'}</Text>
                  </View>
                  <Switch
                    value={darkMode}
                    onValueChange={handleToggleDarkMode}
                    trackColor={{ false: darkMode ? '#283D2C' : '#E2E6E2', true: '#2E7D32' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.infoRowDivider, darkMode && styles.infoRowDividerDark]} />

                {/* Notifications */}
                <View style={styles.settingsItemRow}>
                  <View style={[styles.settingsIconCircle, darkMode && styles.settingsIconCircleDark]}>
                    <Ionicons name="notifications-outline" size={18} color={darkMode ? '#4ADE80' : '#26542D'} />
                  </View>
                  <View style={styles.settingsTextCol}>
                    <Text style={[styles.settingsItemTitle, darkMode && styles.settingsItemTitleDark]}>Notifications</Text>
                    <Text style={[styles.settingsItemSub, darkMode && styles.settingsItemSubDark]}>Orders, contracts & alerts</Text>
                  </View>
                  <Switch
                    value={settings.notifications}
                    onValueChange={handleToggleNotifications}
                    trackColor={{ false: darkMode ? '#283D2C' : '#E2E6E2', true: '#2E7D32' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.infoRowDivider, darkMode && styles.infoRowDividerDark]} />

                {/* Language */}
                <View style={styles.settingsItemRow}>
                  <View style={[styles.settingsIconCircle, darkMode && styles.settingsIconCircleDark]}>
                    <Ionicons name="chatbox-ellipses-outline" size={18} color={darkMode ? '#4ADE80' : '#26542D'} />
                  </View>
                  <View style={styles.settingsTextCol}>
                    <Text style={[styles.settingsItemTitle, darkMode && styles.settingsItemTitleDark]}>Language</Text>
                    <Text style={[styles.settingsItemSub, darkMode && styles.settingsItemSubDark]}>{settings.language}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.languageDropdownPill, darkMode && styles.languageDropdownPillDark]}
                    onPress={handleLanguageSelect}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.languagePillText, darkMode && styles.languagePillTextDark]}>{settings.language}</Text>
                    <Feather name="chevron-down" size={14} color={darkMode ? '#A0B6A3' : '#455F4A'} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Card 4: Log Out Pill Button */}
            <TouchableOpacity
              style={[styles.logoutBtn, darkMode && styles.logoutBtnDark]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Feather name="chevron-left" size={16} color="#DC6826" style={{ marginRight: 4 }} />
              <Text style={styles.logoutBtnText}>Log out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Content: Products */}
        {activeTab === 'products' && (
          <View style={styles.tabContentContainer}>
            <View style={[styles.infoCard, darkMode && styles.infoCardDark]}>
              <Text style={[styles.tabSectionTitle, darkMode && styles.tabSectionTitleDark]}>Registered Organic Crops</Text>
              {crops.length === 0 ? (
                <Text style={[styles.emptyTabText, darkMode && styles.emptyTabTextDark]}>No registered crops yet.</Text>
              ) : (
                crops.map((crop) => (
                  <TouchableOpacity
                    key={crop.id}
                    style={[styles.productCropRow, darkMode && styles.productCropRowDark]}
                    onPress={() => router.push({ pathname: '/harvests/[id]', params: { id: crop.id } } as any)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: crop.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80' }} style={styles.cropThumb} />
                    <View style={styles.cropTextCol}>
                      <Text style={[styles.cropTitleText, darkMode && styles.cropTitleTextDark]}>{crop.cropName}</Text>
                      <Text style={[styles.cropSubText, darkMode && styles.cropSubTextDark]}>{crop.name} • {crop.areaAcres} acres</Text>
                      <Text style={[styles.cropStageText, darkMode && styles.cropStageTextDark]}>Stage: {crop.stageName}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={darkMode ? '#7E9E84' : '#7E9382'} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* Tab Content: Reviews */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContentContainer}>
            <View style={[styles.infoCard, darkMode && styles.infoCardDark]}>
              <Text style={[styles.tabSectionTitle, darkMode && styles.tabSectionTitleDark]}>Buyer Ratings & Reviews</Text>
              <View style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewerName, darkMode && styles.reviewerNameDark]}>Saman Perera (Buyer)</Text>
                  <Text style={styles.reviewRating}>⭐ 5.0</Text>
                </View>
                <Text style={[styles.reviewBody, darkMode && styles.reviewBodyDark]}>
                  Exceptional quality organic tomatoes. Every batch included verifiable photo evidence on the TraceRoot timeline.
                </Text>
                <Text style={[styles.reviewDate, darkMode && styles.reviewDateDark]}>12 Sep 2026</Text>
              </View>

              <View style={[styles.infoRowDivider, darkMode && styles.infoRowDividerDark]} />

              <View style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewerName, darkMode && styles.reviewerNameDark]}>Nimal Silva (Retailer)</Text>
                  <Text style={styles.reviewRating}>⭐ 4.8</Text>
                </View>
                <Text style={[styles.reviewBody, darkMode && styles.reviewBodyDark]}>
                  Fresh greenhouse carrots delivered exactly on schedule. Highly reliable producer.
                </Text>
                <Text style={[styles.reviewDate, darkMode && styles.reviewDateDark]}>28 Aug 2026</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab Content: Documents */}
        {activeTab === 'documents' && (
          <View style={styles.tabContentContainer}>
            <View style={[styles.infoCard, darkMode && styles.infoCardDark]}>
              <Text style={[styles.tabSectionTitle, darkMode && styles.tabSectionTitleDark]}>Certifications & Verified Credentials</Text>
              <View style={styles.docRow}>
                <MaterialCommunityIcons name="certificate-outline" size={24} color={darkMode ? '#4ADE80' : '#26542D'} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docTitle, darkMode && styles.docTitleDark]}>Organic Crop Production Certificate</Text>
                  <Text style={[styles.docSub, darkMode && styles.docSubDark]}>Ref: SL-ORG-2026-904 • Verified</Text>
                </View>
                <View style={[styles.verifiedTag, darkMode && styles.verifiedTagDark]}>
                  <Text style={[styles.verifiedTagText, darkMode && styles.verifiedTagTextDark]}>Active</Text>
                </View>
              </View>

              <View style={[styles.infoRowDivider, darkMode && styles.infoRowDividerDark]} />

              <View style={styles.docRow}>
                <MaterialCommunityIcons name="file-check-outline" size={24} color={darkMode ? '#4ADE80' : '#26542D'} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docTitle, darkMode && styles.docTitleDark]}>TraceRoot Farmer Registration</Text>
                  <Text style={[styles.docSub, darkMode && styles.docSubDark]}>No: {profile.registrationNo} • Central Province</Text>
                </View>
                <View style={[styles.verifiedTag, darkMode && styles.verifiedTagDark]}>
                  <Text style={[styles.verifiedTagText, darkMode && styles.verifiedTagTextDark]}>Verified</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // cream background
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitles: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#718676',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16351E',
    letterSpacing: -0.3,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3A24', // dark forest green
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110, // room for floating bottom tab bar
  },
  heroBackground: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16, 42, 22, 0.74)', // deep green overlay
  },
  heroContent: {
    padding: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#EAEAEA',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC6826', // orange verified badge
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#24542B',
  },
  farmerNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  locationDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#DCE8DF',
    fontWeight: '500',
  },
  deliveryDot: {
    color: '#E8AF30',
    fontSize: 12,
    fontWeight: '700',
  },
  deliveryText: {
    fontSize: 11,
    color: '#E8AF30',
    fontWeight: '600',
  },
  bioText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 12,
    fontWeight: '400',
  },
  heroStatsPanel: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 2,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: '#D2E3D4',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  trustCircleRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#396A41',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  trustScoreNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16351E',
  },
  trustTextCol: {
    flex: 1,
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E724A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  trustHeadline: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16351E',
    marginTop: 1,
  },
  trustSubtext: {
    fontSize: 11,
    color: '#657E6B',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#26542D',
  },
  tabPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabPillTextInactive: {
    color: '#46624C',
  },
  tabContentContainer: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoItemLabel: {
    fontSize: 13,
    color: '#657E6B',
    fontWeight: '500',
    width: 90,
  },
  infoItemValue: {
    flex: 1,
    fontSize: 14,
    color: '#16351E',
    fontWeight: '600',
    textAlign: 'right',
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: '#F0F4F0',
    marginVertical: 4,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#183821', // Dark forest green matching screenshot
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  locationLeft: {
    flex: 1,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationHeaderLabel: {
    fontSize: 12,
    color: '#B2CFB6',
    fontWeight: '600',
  },
  locationDistrictTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  locationProvinceTitle: {
    fontSize: 13,
    color: '#D4E4D7',
    marginTop: 2,
  },
  locationCoordsText: {
    fontSize: 11,
    color: '#90AF95',
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  radarWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInnerRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DC6826', // orange radar pin
  },
  settingsSection: {
    marginTop: 8,
  },
  settingsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#556D5B',
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsTextCol: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16351E',
  },
  settingsItemSub: {
    fontSize: 11,
    color: '#768B7A',
    marginTop: 1,
  },
  languageDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  languagePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#24542B',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5ED',
    borderWidth: 1,
    borderColor: '#F3D2BA',
    borderRadius: 24,
    height: 48,
    marginTop: 6,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: '#DC6826',
    fontSize: 14,
    fontWeight: '700',
  },
  tabSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16351E',
    marginBottom: 12,
  },
  emptyTabText: {
    fontSize: 13,
    color: '#7A8F7E',
    textAlign: 'center',
    paddingVertical: 16,
  },
  productCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F5F2',
  },
  cropThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
    marginRight: 12,
  },
  cropTextCol: {
    flex: 1,
  },
  cropTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16351E',
  },
  cropSubText: {
    fontSize: 12,
    color: '#5B7360',
    marginTop: 2,
  },
  cropStageText: {
    fontSize: 11,
    color: '#2E6838',
    fontWeight: '600',
    marginTop: 1,
  },
  reviewItem: {
    paddingVertical: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16351E',
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C67912',
  },
  reviewBody: {
    fontSize: 12,
    color: '#4B6251',
    lineHeight: 18,
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 10,
    color: '#8A9E8F',
    marginTop: 4,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16351E',
  },
  docSub: {
    fontSize: 11,
    color: '#68806D',
    marginTop: 2,
  },
  verifiedTag: {
    backgroundColor: '#E2EFE4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedTagText: {
    fontSize: 11,
    color: '#24542B',
    fontWeight: '700',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  backCircleBtnDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  headerSubtitleDark: {
    color: '#9CB3A0',
  },
  headerTitleDark: {
    color: '#F0F5F1',
  },
  trustCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  trustCircleRingDark: {
    borderColor: '#4ADE80',
  },
  trustScoreNumberDark: {
    color: '#F0F5F1',
  },
  trustLabelDark: {
    color: '#FBBF24',
  },
  trustHeadlineDark: {
    color: '#F0F5F1',
  },
  trustSubtextDark: {
    color: '#9CB3A0',
  },
  tabPillActiveDark: {
    backgroundColor: '#26542D',
  },
  tabPillInactiveDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  tabPillTextInactiveDark: {
    color: '#A0B6A3',
  },
  infoCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  infoIconCircleDark: {
    backgroundColor: '#233827',
  },
  infoItemLabelDark: {
    color: '#9CB3A0',
  },
  infoItemValueDark: {
    color: '#F0F5F1',
  },
  infoRowDividerDark: {
    backgroundColor: '#263B2B',
  },
  locationCardDark: {
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  settingsSectionTitleDark: {
    color: '#9CB3A0',
  },
  settingsCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  settingsIconCircleDark: {
    backgroundColor: '#233827',
  },
  settingsItemTitleDark: {
    color: '#F0F5F1',
  },
  settingsItemSubDark: {
    color: '#9CB3A0',
  },
  languageDropdownPillDark: {
    backgroundColor: '#233827',
  },
  languagePillTextDark: {
    color: '#A5DCAD',
  },
  logoutBtnDark: {
    backgroundColor: '#2A1810',
    borderColor: '#59321E',
  },
  tabSectionTitleDark: {
    color: '#F0F5F1',
  },
  emptyTabTextDark: {
    color: '#9CB3A0',
  },
  productCropRowDark: {
    borderBottomColor: '#263B2B',
  },
  cropTitleTextDark: {
    color: '#F0F5F1',
  },
  cropSubTextDark: {
    color: '#9CB3A0',
  },
  cropStageTextDark: {
    color: '#4ADE80',
  },
  reviewerNameDark: {
    color: '#F0F5F1',
  },
  reviewBodyDark: {
    color: '#CBD5E1',
  },
  reviewDateDark: {
    color: '#9CB3A0',
  },
  docTitleDark: {
    color: '#F0F5F1',
  },
  docSubDark: {
    color: '#9CB3A0',
  },
  verifiedTagDark: {
    backgroundColor: '#233827',
  },
  verifiedTagTextDark: {
    color: '#4ADE80',
  },
});
