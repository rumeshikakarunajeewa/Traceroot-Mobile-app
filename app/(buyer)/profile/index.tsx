import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { mockBuyerProfile } from '../../../src/constants/buyerMockData';
import { BuyerProfile } from '../../../src/types/buyer.types';
import { BuyerProfileHero } from '../../../src/components/buyer/BuyerProfileHero';
import { BuyerTrustScoreCard } from '../../../src/components/buyer/BuyerTrustScoreCard';
import { BuyerProfileDetails } from '../../../src/components/buyer/BuyerProfileDetails';
import { BuyerEditProfileModal } from '../../../src/components/buyer/BuyerEditProfileModal';
import { useDarkMode } from '../../../src/store/uiStore';

type ProfileTab = 'About' | 'Orders' | 'Saved' | 'Documents';

export default function BuyerProfileScreen() {
  const [profile, setProfile] = useState<BuyerProfile>(mockBuyerProfile);
  const [activeTab, setActiveTab] = useState<ProfileTab>('About');
  const [darkMode, setDarkMode] = useDarkMode();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(buyer)' as any);
    }
  };

  const handleEditPress = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = (updatedFields: Partial<BuyerProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updatedFields,
    }));
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
            router.replace('/(auth)' as any);
          },
        },
      ]
    );
  };

  const handleLanguagePress = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred display language',
      [
        { text: 'English (Current)', style: 'default' },
        { text: 'Sinhala (සිංහල)', style: 'default' },
        { text: 'Tamil (தமிழ்)', style: 'default' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, darkMode && styles.safeAreaDark]}
      edges={['top']}
    >
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? '#0E1710' : '#F5F2EB'}
      />

      {/* 1. Header Bar */}
      <View style={styles.headerContainer}>
        {/* Left: Circular back button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={[styles.backButton, darkMode && styles.backButtonDark]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={darkMode ? '#E5EFE7' : '#16301A'}
          />
        </TouchableOpacity>

        {/* Center: Account Title Stack */}
        <View style={styles.headerTitleCenter}>
          <Text style={[styles.headerSubtitle, darkMode && styles.headerSubtitleDark]}>
            Your account <Text style={styles.sproutEmoji}>🌿</Text>
          </Text>
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>My </Text>
            <View style={styles.profileTextWrapper}>
              <View
                style={[styles.profileHighlightBg, darkMode && styles.profileHighlightBgDark]}
              />
              <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>
                Profile
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Dark green Edit pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleEditPress}
          style={[styles.editButton, darkMode && styles.editButtonDark]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <MaterialCommunityIcons
            name="note-edit-outline"
            size={16}
            color="#FFFFFF"
            style={styles.editIcon}
          />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkMode ? '#4ADE80' : '#1B3220'}
            colors={[darkMode ? '#4ADE80' : '#1B3220']}
          />
        }
      >
        {/* 2. Hero Profile Card with Vegetable BG & Stats */}
        <BuyerProfileHero
          profile={profile}
          onPressStatsOrders={() => router.push('/(buyer)/orders' as any)}
          onPressStatsContracts={() => router.push('/(buyer)/contracts' as any)}
          onPressStatsSourced={() => router.push('/(buyer)/orders' as any)}
        />

        {/* 3. Trust Score Card */}
        <BuyerTrustScoreCard
          score={profile.trustScore}
          label={profile.trustScoreLabel}
          detail={profile.trustScoreDetail}
          isDark={darkMode}
          onPress={() =>
            Alert.alert(
              'TraceRoot Trust Score: 96 / 100',
              'Saman Perera holds an Exemplary commercial buyer rating based on prompt escrow settlements, 142 completed harvests, and zero payment disputes.',
              [{ text: 'OK' }]
            )
          }
        />

        {/* 4. Tab Navigation Pills */}
        <View style={styles.tabsRow}>
          {(['About', 'Orders', 'Saved', 'Documents'] as ProfileTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.75}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabPill,
                  isActive
                    ? [styles.tabPillActive, darkMode && styles.tabPillActiveDark]
                    : [styles.tabPillInactive, darkMode && styles.tabPillInactiveDark],
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isActive
                      ? styles.tabPillTextActive
                      : [styles.tabPillTextInactive, darkMode && styles.tabPillTextInactiveDark],
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. Dynamic Tab Content */}
        {activeTab === 'About' && (
          <BuyerProfileDetails
            profile={profile}
            isDark={darkMode}
            onPressPhone={() =>
              Alert.alert('Phone Contact', profile.phone || '+94 71 987 6543')
            }
            onPressEmail={() =>
              Alert.alert('Email Contact', profile.email || 'saman.p@freshmart.lk')
            }
            onPressLocation={() =>
              Alert.alert(
                'Warehouse & Logistics Hub',
                'Colombo Central Distribution Warehouse, Western Province\nCoordinates: 6.9271° N, 79.8612° E'
              )
            }
          />
        )}

        {activeTab === 'Orders' && (
          <View style={[styles.tabContentCard, darkMode && styles.tabContentCardDark]}>
            <View style={styles.tabContentHeader}>
              <MaterialCommunityIcons
                name="basket-check-outline"
                size={20}
                color={darkMode ? '#4ADE80' : '#2A4B2F'}
              />
              <Text
                style={[styles.tabContentTitle, darkMode && styles.tabContentTitleDark]}
              >
                Recent Orders (142 Total)
              </Text>
            </View>
            <Text style={[styles.tabContentDesc, darkMode && styles.tabContentDescDark]}>
              142 settled orders across Badulla, Kandy, and Nuwara Eliya farming clusters.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(buyer)/orders' as any)}
              style={[styles.tabActionBtn, darkMode && styles.tabActionBtnDark]}
            >
              <Text
                style={[styles.tabActionBtnText, darkMode && styles.tabActionBtnTextDark]}
              >
                View All Orders ›
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Saved' && (
          <View style={[styles.tabContentCard, darkMode && styles.tabContentCardDark]}>
            <View style={styles.tabContentHeader}>
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={20}
                color={darkMode ? '#4ADE80' : '#2A4B2F'}
              />
              <Text
                style={[styles.tabContentTitle, darkMode && styles.tabContentTitleDark]}
              >
                Saved Farm Suppliers (18)
              </Text>
            </View>
            <Text style={[styles.tabContentDesc, darkMode && styles.tabContentDescDark]}>
              You have 18 verified partner farms bookmarked for seasonal harvest notifications.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(buyer)/explore' as any)}
              style={[styles.tabActionBtn, darkMode && styles.tabActionBtnDark]}
            >
              <Text
                style={[styles.tabActionBtnText, darkMode && styles.tabActionBtnTextDark]}
              >
                Explore Farmers Market ›
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Documents' && (
          <View style={[styles.tabContentCard, darkMode && styles.tabContentCardDark]}>
            <View style={styles.tabContentHeader}>
              <MaterialCommunityIcons
                name="file-certificate-outline"
                size={20}
                color={darkMode ? '#4ADE80' : '#2A4B2F'}
              />
              <Text
                style={[styles.tabContentTitle, darkMode && styles.tabContentTitleDark]}
              >
                Verification & Certificates
              </Text>
            </View>
            <Text style={[styles.tabContentDesc, darkMode && styles.tabContentDescDark]}>
              Business Reg: {profile.registrationId || 'BR-99321'} • Validated Tax Invoicing
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'TraceRoot KYC Verified',
                  'FreshMart Ltd commercial documentation is verified with the Department of Agriculture and TraceRoot Smart Contracts.'
                )
              }
              style={[styles.tabActionBtn, darkMode && styles.tabActionBtnDark]}
            >
              <Text
                style={[styles.tabActionBtnText, darkMode && styles.tabActionBtnTextDark]}
              >
                View Verification Certificate ›
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 6. Settings Section */}
        <Text style={[styles.sectionHeaderTitle, darkMode && styles.sectionHeaderTitleDark]}>
          Settings
        </Text>

        <View style={[styles.settingsCard, darkMode && styles.settingsCardDark]}>
          {/* Row 1: Dark mode Toggle */}
          <View style={styles.settingRow}>
            <View
              style={[styles.settingIconCircle, darkMode && styles.settingIconCircleDark]}
            >
              <MaterialCommunityIcons
                name={darkMode ? 'weather-night' : 'weather-sunny'}
                size={18}
                color={darkMode ? '#FBBF24' : '#2A4B2F'}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, darkMode && styles.settingTitleDark]}>
                Dark mode
              </Text>
              <Text style={[styles.settingSubtitle, darkMode && styles.settingSubtitleDark]}>
                {darkMode ? 'On' : 'Off'}
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#DFD9CB', true: '#2E7D42' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#DFD9CB"
            />
          </View>

          <View style={[styles.settingDivider, darkMode && styles.settingDividerDark]} />

          {/* Row 2: Notifications */}
          <View style={styles.settingRow}>
            <View
              style={[styles.settingIconCircle, darkMode && styles.settingIconCircleDark]}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={18}
                color={darkMode ? '#9FD9A7' : '#2A4B2F'}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, darkMode && styles.settingTitleDark]}>
                Notifications
              </Text>
              <Text style={[styles.settingSubtitle, darkMode && styles.settingSubtitleDark]}>
                Orders, contracts & alerts
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#DFD9CB', true: '#2E7D42' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#DFD9CB"
            />
          </View>

          <View style={[styles.settingDivider, darkMode && styles.settingDividerDark]} />

          {/* Row 3: Language */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLanguagePress}
            style={styles.settingRow}
          >
            <View
              style={[styles.settingIconCircle, darkMode && styles.settingIconCircleDark]}
            >
              <MaterialCommunityIcons
                name="message-text-outline"
                size={18}
                color={darkMode ? '#9FD9A7' : '#2A4B2F'}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, darkMode && styles.settingTitleDark]}>
                Language
              </Text>
              <Text style={[styles.settingSubtitle, darkMode && styles.settingSubtitleDark]}>
                English
              </Text>
            </View>
            <View
              style={[styles.languagePill, darkMode && styles.languagePillDark]}
            >
              <Text
                style={[styles.languagePillText, darkMode && styles.languagePillTextDark]}
              >
                English
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={darkMode ? '#C4DAC7' : '#4A584B'}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* 7. Terracotta Outlined Log Out Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleLogout}
          style={[styles.logoutButton, darkMode && styles.logoutButtonDark]}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={darkMode ? '#F97316' : '#C86432'}
            style={styles.logoutIcon}
          />
          <Text style={[styles.logoutText, darkMode && styles.logoutTextDark]}>
            Log out
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <BuyerEditProfileModal
        visible={isEditModalVisible}
        profile={profile}
        isDark={darkMode}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Theme warm linen background
  },
  safeAreaDark: {
    backgroundColor: '#0E1710', // Rich dark forest charcoal
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#ECE7DD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  backButtonDark: {
    backgroundColor: '#19281C',
    borderColor: '#293D2C',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#657E6B',
    fontWeight: '500',
    marginBottom: 1,
  },
  headerSubtitleDark: {
    color: '#9CB3A0',
  },
  sproutEmoji: {
    fontSize: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.3,
  },
  headerTitleDark: {
    color: '#F0F5F1',
  },
  profileTextWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  profileHighlightBg: {
    position: 'absolute',
    bottom: 2,
    left: -2,
    right: -2,
    height: 10,
    backgroundColor: '#D9E6DA', // Soft mint highlight behind "Profile"
    borderRadius: 3,
    zIndex: -1,
  },
  profileHighlightBgDark: {
    backgroundColor: '#1F4628',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B3220', // Forest dark pill
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
    shadowColor: '#1B3220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonDark: {
    backgroundColor: '#235A33',
  },
  editIcon: {
    marginRight: 1,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 115, // Clear floating bottom bar
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    gap: 8,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#3D593F', // Dark forest sage active pill
    shadowColor: '#3D593F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPillActiveDark: {
    backgroundColor: '#2B693A',
  },
  tabPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#ECE7DD',
  },
  tabPillInactiveDark: {
    backgroundColor: '#18271C',
    borderColor: '#293D2C',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabPillTextInactive: {
    color: '#495B4C',
  },
  tabPillTextInactiveDark: {
    color: '#A0B6A3',
  },
  tabContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 18,
    borderWidth: 0.5,
    borderColor: '#ECE8DF',
    marginVertical: 4,
  },
  tabContentCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
  },
  tabContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tabContentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  tabContentTitleDark: {
    color: '#F0F5F1',
  },
  tabContentDesc: {
    fontSize: 13,
    color: '#6E8070',
    lineHeight: 18,
    marginBottom: 12,
  },
  tabContentDescDark: {
    color: '#A0B6A3',
  },
  tabActionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF3EE',
    borderRadius: 12,
  },
  tabActionBtnDark: {
    backgroundColor: '#243A2A',
  },
  tabActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A4B2F',
  },
  tabActionBtnTextDark: {
    color: '#A5DCAD',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E8070',
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sectionHeaderTitleDark: {
    color: '#9CB3A0',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: '#ECE8DF',
    shadowColor: '#16301A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconCircleDark: {
    backgroundColor: '#263B2B',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16301A',
    marginBottom: 1,
  },
  settingTitleDark: {
    color: '#F0F5F1',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6E8070',
  },
  settingSubtitleDark: {
    color: '#A0B6A3',
  },
  settingDivider: {
    height: 0.6,
    backgroundColor: '#F0ECE4',
    marginLeft: 48,
  },
  settingDividerDark: {
    backgroundColor: '#293D2C',
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F3EC',
    borderWidth: 0.8,
    borderColor: '#DFD9CB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 3,
  },
  languagePillDark: {
    backgroundColor: '#243A2A',
    borderColor: '#34503B',
  },
  languagePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4A584B',
  },
  languagePillTextDark: {
    color: '#CBE0CE',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 13,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8A580', // Terracotta border from Figma
    backgroundColor: '#F5F2EB',
  },
  logoutButtonDark: {
    backgroundColor: '#18271C',
    borderColor: '#F97316',
  },
  logoutIcon: {
    marginRight: 2,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C86432', // Terracotta text
  },
  logoutTextDark: {
    color: '#F97316',
  },
});
