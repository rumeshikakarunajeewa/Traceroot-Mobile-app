import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { mockBuyerProfile } from '../../../src/constants/buyerMockData';

type ProfileTab = 'About' | 'Orders' | 'Saved' | 'Documents';

export default function BuyerProfileScreen() {
  const profile = mockBuyerProfile;
  const [activeTab, setActiveTab] = useState<ProfileTab>('About');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleEditPress = () => {
    Alert.alert(
      'Edit Profile',
      'Update your company info, contact phone, or delivery district.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save Changes', onPress: () => Alert.alert('Profile Updated', 'Your profile details have been saved.') },
      ]
    );
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================
            1. TOP HEADER WITH BACK BUTTON, TITLE & EDIT BUTTON
           ======================================================== */}
        <View style={styles.headerRow}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color="#1F2937" />
          </TouchableOpacity>

          {/* Title & Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={styles.subtitleText}>Your account 🌿</Text>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>My </Text>
              <View style={styles.highlightWrapper}>
                <Text style={styles.titleHighlightText}>Profile</Text>
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
            3. TRUST SCORE CARD
           ======================================================== */}
        <View style={styles.trustScoreCard}>
          {/* Circular Gauge Ring */}
          <View style={styles.gaugeCircle}>
            <Text style={styles.gaugeNumber}>{profile.trustScore || 96}</Text>
          </View>

          {/* Right Trust Details */}
          <View style={styles.trustDetailsColumn}>
            <Text style={styles.trustKicker}>Trust score</Text>
            <Text style={styles.trustRatingTitle}>{profile.trustRating || 'Exemplary'}</Text>
            <Text style={styles.trustSubtitle}>{profile.trustDescription}</Text>
          </View>
        </View>

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
                  isActive ? styles.tabPillActive : styles.tabPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isActive ? styles.tabTextActive : styles.tabTextInactive,
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
        <View style={styles.detailsCard}>
          {/* Phone */}
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconCircle}>
                <MaterialCommunityIcons name="chat-outline" size={16} color="#556D5B" />
              </View>
              <Text style={styles.detailLabel}>Phone</Text>
            </View>
            <Text style={styles.detailValue}>{profile.phone}</Text>
          </View>

          {/* Email */}
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconCircle}>
                <MaterialCommunityIcons name="email-outline" size={16} color="#556D5B" />
              </View>
              <Text style={styles.detailLabel}>Email</Text>
            </View>
            <Text style={styles.detailValue}>{profile.email}</Text>
          </View>

          {/* Business */}
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconCircle}>
                <MaterialCommunityIcons name="storefront-outline" size={16} color="#556D5B" />
              </View>
              <Text style={styles.detailLabel}>Business</Text>
            </View>
            <Text style={styles.detailValue}>{profile.businessType}</Text>
          </View>

          {/* Reg. ID */}
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconCircle}>
                <MaterialCommunityIcons name="shield-check-outline" size={16} color="#556D5B" />
              </View>
              <Text style={styles.detailLabel}>Reg. ID</Text>
            </View>
            <Text style={styles.detailValue}>{profile.regId}</Text>
          </View>
        </View>

        {/* ========================================================
            6. DARK GREEN LOCATION CARD WITH RADAR PIN
           ======================================================== */}
        <View style={styles.locationCard}>
          {/* Decorative Radar Circles on the right */}
          <View style={styles.radarRingOuter} />
          <View style={styles.radarRingInner} />
          <View style={styles.radarPin} />

          {/* Content */}
          <View style={styles.locationContent}>
            <View style={styles.locationHeaderRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color="#A0B6A7" />
              <Text style={styles.locationKicker}>Location</Text>
            </View>
            <Text style={styles.locationTitle}>{profile.district}</Text>
            <Text style={styles.locationSubtitle}>{profile.province}</Text>
            <Text style={styles.coordinatesText}>{profile.coordinates}</Text>
          </View>
        </View>

        {/* ========================================================
            7. SETTINGS SECTION
           ======================================================== */}
        <Text style={styles.sectionHeader}>Settings</Text>
        <View style={styles.settingsCard}>
          {/* Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.detailIconCircle}>
                <MaterialCommunityIcons name="weather-sunny" size={16} color="#556D5B" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Dark mode</Text>
                <Text style={styles.settingSubtitle}>{darkMode ? 'On' : 'Off'}</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#436647' }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.detailIconCircle}>
                <MaterialCommunityIcons name="bell-outline" size={16} color="#556D5B" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Orders, contracts & alerts</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E5E7EB', true: '#436647' }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          {/* Language */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={styles.detailIconCircle}>
                <MaterialCommunityIcons name="chat-processing-outline" size={16} color="#556D5B" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Language</Text>
                <Text style={styles.settingSubtitle}>English</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.languagePill} activeOpacity={0.8}>
              <Text style={styles.languagePillText}>English</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#556D5B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================
            8. LOG OUT BUTTON
           ======================================================== */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={17} color="#C06637" />
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
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

  /* 3. Trust Score Card */
  trustScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE9E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gaugeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3.5,
    borderColor: '#34553B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNumber: {
    fontSize: 19,
    fontWeight: '700',
    color: '#162F1B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  trustDetailsColumn: {
    marginLeft: 16,
    flex: 1,
  },
  trustKicker: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  trustRatingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#152E1B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginVertical: 1,
  },
  trustSubtitle: {
    fontSize: 12,
    color: '#6B7E70',
    fontWeight: '500',
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

  /* 6. Dark Green Location Card */
  locationCard: {
    backgroundColor: '#1C3725',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1C3725',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  radarRingOuter: {
    position: 'absolute',
    right: -25,
    top: -15,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  radarRingInner: {
    position: 'absolute',
    right: -5,
    top: 5,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  radarPin: {
    position: 'absolute',
    right: 40,
    top: 48,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D97706',
  },
  locationContent: {
    zIndex: 2,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationKicker: {
    fontSize: 11.5,
    color: '#A0B6A7',
    fontWeight: '500',
  },
  locationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginVertical: 1,
  },
  locationSubtitle: {
    fontSize: 12.5,
    color: '#C8D8CE',
    marginBottom: 8,
  },
  coordinatesText: {
    fontSize: 11.5,
    color: '#97AEA0',
    fontWeight: '500',
  },

  /* 7. Settings Section */
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
});
