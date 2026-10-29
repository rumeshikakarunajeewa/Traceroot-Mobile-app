import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useSupplierProfile,
} from '../../../src/store/supplierProfileStore';
import { toggleDarkMode, useDarkMode } from '../../../src/store/uiStore';

type ProfileTab = 'About' | 'Products' | 'Reviews' | 'Documents';

const GREENHOUSE_BG = require('../../../assets/images/supplier_profile_greenhouse.jpg');

export default function SupplierProfileScreen() {
  const [isDark] = useDarkMode();
  const [profile, updateProfile] = useSupplierProfile();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ProfileTab>('About');

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editStore, setEditStore] = useState(profile.store);
  const [editBio, setEditBio] = useState(profile.bio);

  const handleOpenEdit = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditEmail(profile.email);
    setEditStore(profile.store);
    setEditBio(profile.bio);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    updateProfile({
      name: editName.trim() || profile.name,
      phone: editPhone.trim() || profile.phone,
      email: editEmail.trim() || profile.email,
      store: editStore.trim() || profile.store,
      bio: editBio.trim() || profile.bio,
    });
    setIsEditModalVisible(false);
  };

  const handleLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your supplier account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          router.replace('/');
        },
      },
    ]);
  };

  const handleLanguageToggle = () => {
    Alert.alert('Language Settings', 'Select preferred display language:', [
      {
        text: 'English (Current)',
        onPress: () => updateProfile({ language: 'English' }),
      },
      {
        text: 'Sinhala (සිංහල)',
        onPress: () => updateProfile({ language: 'Sinhala' }),
      },
      {
        text: 'Tamil (தமிழ்)',
        onPress: () => updateProfile({ language: 'Tamil' }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HEADER ROW */}
        <View style={styles.headerRow}>
          {/* Circular Back Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={[styles.backCircle, isDark && styles.backCircleDark]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={isDark ? '#E5EFE7' : '#2C402E'}
            />
          </TouchableOpacity>

          {/* Center Title Block */}
          <View style={styles.titleBlock}>
            <Text
              style={[
                styles.headerTagline,
                isDark && styles.headerTaglineDark,
              ]}
            >
              Your account 🌿
            </Text>

            <View style={styles.headingRow}>
              <Text
                style={[
                  styles.headingMyText,
                  isDark && styles.headingMyTextDark,
                ]}
              >
                My{' '}
              </Text>
              <View
                style={[
                  styles.headingHighlight,
                  isDark && styles.headingHighlightDark,
                ]}
              >
                <Text
                  style={[
                    styles.headingProfileText,
                    isDark && styles.headingProfileTextDark,
                  ]}
                >
                  Profile
                </Text>
              </View>
            </View>
          </View>

          {/* Right Action: Edit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenEdit}
            style={[styles.editButton, isDark && styles.editButtonDark]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <MaterialCommunityIcons
              name="book-open-outline"
              size={15}
              color="#FFFFFF"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* 2. HERO PROFILE CARD ("AgriSupply Co.") */}
        <View style={styles.heroProfileCard}>
          <Image
            source={GREENHOUSE_BG}
            style={styles.heroCardImage}
            resizeMode="cover"
          />

          {/* Dark Atmospheric Gradient Overlay */}
          <LinearGradient
            colors={['rgba(15,35,20,0.45)', 'rgba(10,25,12,0.92)']}
            style={styles.gradientOverlay}
          />

          <View style={styles.heroCardContent}>
            {/* Top Row: Avatar & Company Info */}
            <View style={styles.executiveRow}>
              {/* Avatar with Verified Check Badge */}
              <View style={styles.avatarWrapper}>
                <Image
                  source={profile.avatarUrl}
                  style={styles.avatarImage}
                />
                {profile.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <MaterialCommunityIcons
                      name="check"
                      size={13}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </View>

              {/* Company Info */}
              <View style={styles.companyInfoColumn}>
                {/* Verified Supplier Pill Tag */}
                <View style={styles.verifiedPill}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={13}
                    color="#395E3F"
                    style={{ marginRight: 3 }}
                  />
                  <Text style={styles.verifiedPillText}>Verified Supplier</Text>
                </View>

                {/* Company Name */}
                <Text style={styles.companyNameText} numberOfLines={1}>
                  {profile.name}
                </Text>

                {/* District & Partnership */}
                <View style={styles.locationTagRow}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={13}
                    color="rgba(255,255,255,0.75)"
                    style={{ marginRight: 2 }}
                  />
                  <Text style={styles.districtText}>
                    {profile.district} ·{' '}
                  </Text>
                  <Text style={styles.partnerTagText}>
                    {profile.partnerTag}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bio Description Snippet */}
            <Text style={styles.bioText} numberOfLines={3}>
              {profile.bio}
            </Text>

            {/* Glassmorphic Stats Bar */}
            <View style={styles.glassStatsBar}>
              {/* Stat 1: Products */}
              <View style={styles.statColumn}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={16}
                  color="#A7CFA9"
                  style={styles.statIcon}
                />
                <Text style={styles.statNumber}>{profile.productsCount}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Stat 2: Farmers */}
              <View style={styles.statColumn}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={16}
                  color="#A7CFA9"
                  style={styles.statIcon}
                />
                <Text style={styles.statNumber}>{profile.farmersCount}</Text>
                <Text style={styles.statLabel}>Farmers</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Stat 3: Rating */}
              <View style={styles.statColumn}>
                <MaterialCommunityIcons
                  name="white-balance-sunny"
                  size={16}
                  color="#A7CFA9"
                  style={styles.statIcon}
                />
                <Text style={styles.statNumber}>{profile.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. TRUST SCORE CARD ("Highly trusted") */}
        <View style={[styles.trustCard, isDark && styles.trustCardDark]}>
          {/* Circular Ring Score */}
          <View style={styles.scoreRing}>
            <Text
              style={[
                styles.scoreNumber,
                isDark && styles.scoreNumberDark,
              ]}
            >
              {profile.trustScore}
            </Text>
          </View>

          {/* Details Column */}
          <View style={styles.trustDetailsColumn}>
            <Text style={styles.trustTagText}>Trust score</Text>
            <Text
              style={[
                styles.trustTitleText,
                isDark && styles.trustTitleTextDark,
              ]}
            >
              Highly trusted
            </Text>
            <Text
              style={[
                styles.trustSubtitleText,
                isDark && styles.trustSubtitleTextDark,
              ]}
            >
              {profile.trustScoreSubtitle}
            </Text>
          </View>
        </View>

        {/* 4. NAVIGATION TAB PILLS */}
        <View style={styles.tabsRow}>
          {(['About', 'Products', 'Reviews', 'Documents'] as ProfileTab[]).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabPill,
                    isActive
                      ? isDark
                        ? styles.tabPillActiveDark
                        : styles.tabPillActive
                      : isDark
                      ? styles.tabPillInactiveDark
                      : styles.tabPillInactive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Tab ${tab}`}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      isActive
                        ? styles.tabPillTextActive
                        : isDark
                        ? styles.tabPillTextInactiveDark
                        : styles.tabPillTextInactive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* 5. CONTACT & BUSINESS DETAILS CARD */}
        <View style={[styles.detailsCard, isDark && styles.detailsCardDark]}>
          {/* Phone */}
          <View style={styles.detailsRow}>
            <View
              style={[
                styles.detailsIconCircle,
                isDark && styles.detailsIconCircleDark,
              ]}
            >
              <MaterialCommunityIcons
                name="phone-outline"
                size={18}
                color={isDark ? '#8ED697' : '#395E3F'}
              />
            </View>
            <Text
              style={[
                styles.detailsLabel,
                isDark && styles.detailsLabelDark,
              ]}
            >
              Phone
            </Text>
            <Text
              style={[
                styles.detailsValue,
                isDark && styles.detailsValueDark,
              ]}
            >
              {profile.phone}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={[styles.detailsDivider, isDark && styles.detailsDividerDark]}
          />

          {/* Email */}
          <View style={styles.detailsRow}>
            <View
              style={[
                styles.detailsIconCircle,
                isDark && styles.detailsIconCircleDark,
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={isDark ? '#8ED697' : '#395E3F'}
              />
            </View>
            <Text
              style={[
                styles.detailsLabel,
                isDark && styles.detailsLabelDark,
              ]}
            >
              Email
            </Text>
            <Text
              style={[
                styles.detailsValue,
                isDark && styles.detailsValueDark,
              ]}
            >
              {profile.email}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={[styles.detailsDivider, isDark && styles.detailsDividerDark]}
          />

          {/* Store */}
          <View style={styles.detailsRow}>
            <View
              style={[
                styles.detailsIconCircle,
                isDark && styles.detailsIconCircleDark,
              ]}
            >
              <MaterialCommunityIcons
                name="storefront-outline"
                size={18}
                color={isDark ? '#8ED697' : '#395E3F'}
              />
            </View>
            <Text
              style={[
                styles.detailsLabel,
                isDark && styles.detailsLabelDark,
              ]}
            >
              Store
            </Text>
            <Text
              style={[
                styles.detailsValue,
                isDark && styles.detailsValueDark,
              ]}
            >
              {profile.store}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={[styles.detailsDivider, isDark && styles.detailsDividerDark]}
          />

          {/* Licence */}
          <View style={styles.detailsRow}>
            <View
              style={[
                styles.detailsIconCircle,
                isDark && styles.detailsIconCircleDark,
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={18}
                color={isDark ? '#8ED697' : '#395E3F'}
              />
            </View>
            <Text
              style={[
                styles.detailsLabel,
                isDark && styles.detailsLabelDark,
              ]}
            >
              Licence
            </Text>
            <Text
              style={[
                styles.detailsValue,
                isDark && styles.detailsValueDark,
              ]}
            >
              {profile.licence}
            </Text>
          </View>
        </View>

        {/* 6. LOCATION RADAR CARD */}
        <View style={styles.locationRadarCard}>
          {/* Concentric Decorative Radar Rings */}
          <View style={styles.radarOuterRing} />
          <View style={styles.radarInnerRing} />
          <View style={styles.radarBeaconDot} />

          {/* Left Location Info */}
          <View style={styles.radarContentColumn}>
            <View style={styles.radarTagRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={13}
                color="rgba(255,255,255,0.72)"
                style={{ marginRight: 3 }}
              />
              <Text style={styles.radarTagText}>Location</Text>
            </View>

            <Text style={styles.radarDistrictText}>{profile.district}</Text>
            <Text style={styles.radarProvinceText}>{profile.province}</Text>
            <Text style={styles.radarCoordinatesText}>
              {profile.coordinates}
            </Text>
          </View>
        </View>

        {/* 7. SETTINGS SECTION */}
        <View style={styles.settingsSection}>
          <Text
            style={[
              styles.settingsSectionTitle,
              isDark && styles.settingsSectionTitleDark,
            ]}
          >
            Settings
          </Text>

          <View
            style={[
              styles.settingsCard,
              isDark && styles.settingsCardDark,
            ]}
          >
            {/* Setting 1: Dark Mode */}
            <View style={styles.settingItemRow}>
              <View
                style={[
                  styles.settingIconCircle,
                  isDark && styles.settingIconCircleDark,
                ]}
              >
                <MaterialCommunityIcons
                  name={isDark ? 'weather-night' : 'white-balance-sunny'}
                  size={18}
                  color={isDark ? '#8ED697' : '#395E3F'}
                />
              </View>

              <View style={styles.settingTextColumn}>
                <Text
                  style={[
                    styles.settingTitle,
                    isDark && styles.settingTitleDark,
                  ]}
                >
                  Dark mode
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    isDark && styles.settingSubtitleDark,
                  ]}
                >
                  {isDark ? 'On' : 'Off'}
                </Text>
              </View>

              <Switch
                value={isDark}
                onValueChange={() => toggleDarkMode()}
                trackColor={{
                  false: isDark ? '#2E4032' : '#D4CDC0',
                  true: isDark ? '#467A4D' : '#426340',
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.detailsDivider,
                isDark && styles.detailsDividerDark,
              ]}
            />

            {/* Setting 2: Notifications */}
            <View style={styles.settingItemRow}>
              <View
                style={[
                  styles.settingIconCircle,
                  isDark && styles.settingIconCircleDark,
                ]}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={18}
                  color={isDark ? '#8ED697' : '#395E3F'}
                />
              </View>

              <View style={styles.settingTextColumn}>
                <Text
                  style={[
                    styles.settingTitle,
                    isDark && styles.settingTitleDark,
                  ]}
                >
                  Notifications
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    isDark && styles.settingSubtitleDark,
                  ]}
                >
                  Orders, contracts & alerts
                </Text>
              </View>

              <Switch
                value={profile.notificationsEnabled}
                onValueChange={(val) =>
                  updateProfile({ notificationsEnabled: val })
                }
                trackColor={{
                  false: isDark ? '#2E4032' : '#D4CDC0',
                  true: isDark ? '#467A4D' : '#426340',
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={[
                styles.detailsDivider,
                isDark && styles.detailsDividerDark,
              ]}
            />

            {/* Setting 3: Language */}
            <View style={styles.settingItemRow}>
              <View
                style={[
                  styles.settingIconCircle,
                  isDark && styles.settingIconCircleDark,
                ]}
              >
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={18}
                  color={isDark ? '#8ED697' : '#395E3F'}
                />
              </View>

              <View style={styles.settingTextColumn}>
                <Text
                  style={[
                    styles.settingTitle,
                    isDark && styles.settingTitleDark,
                  ]}
                >
                  Language
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    isDark && styles.settingSubtitleDark,
                  ]}
                >
                  {profile.language}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLanguageToggle}
                style={[
                  styles.languagePill,
                  isDark && styles.languagePillDark,
                ]}
              >
                <Text
                  style={[
                    styles.languagePillText,
                    isDark && styles.languagePillTextDark,
                  ]}
                >
                  {profile.language}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={16}
                  color={isDark ? '#A2B9A5' : '#4D6250'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 8. LOG OUT BUTTON */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogOut}
          style={[styles.logOutButton, isDark && styles.logOutButtonDark]}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color="#C25E28"
            style={{ marginRight: 2 }}
          />
          <Text style={styles.logOutButtonText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalSafeArea,
            isDark && styles.modalSafeAreaDark,
          ]}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                isDark && styles.modalHeaderDark,
              ]}
            >
              <Text
                style={[
                  styles.modalHeaderTitle,
                  isDark && styles.modalHeaderTitleDark,
                ]}
              >
                Edit Supplier Profile
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsEditModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={isDark ? '#F0F5F1' : '#162C1A'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Field: Company Name */}
              <View style={styles.modalFieldGroup}>
                <Text
                  style={[
                    styles.modalLabel,
                    isDark && styles.modalLabelDark,
                  ]}
                >
                  Company Name
                </Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. AgriSupply Co."
                  placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                  style={[
                    styles.modalInput,
                    isDark && styles.modalInputDark,
                  ]}
                />
              </View>

              {/* Field: Phone */}
              <View style={styles.modalFieldGroup}>
                <Text
                  style={[
                    styles.modalLabel,
                    isDark && styles.modalLabelDark,
                  ]}
                >
                  Phone Number
                </Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+94 81 222 4410"
                  placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                  keyboardType="phone-pad"
                  style={[
                    styles.modalInput,
                    isDark && styles.modalInputDark,
                  ]}
                />
              </View>

              {/* Field: Email */}
              <View style={styles.modalFieldGroup}>
                <Text
                  style={[
                    styles.modalLabel,
                    isDark && styles.modalLabelDark,
                  ]}
                >
                  Email Address
                </Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="sales@agrisupply.lk"
                  placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                  keyboardType="email-address"
                  style={[
                    styles.modalInput,
                    isDark && styles.modalInputDark,
                  ]}
                />
              </View>

              {/* Field: Store Address */}
              <View style={styles.modalFieldGroup}>
                <Text
                  style={[
                    styles.modalLabel,
                    isDark && styles.modalLabelDark,
                  ]}
                >
                  Store Location
                </Text>
                <TextInput
                  value={editStore}
                  onChangeText={setEditStore}
                  placeholder="Peradeniya Rd, Kandy"
                  placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                  style={[
                    styles.modalInput,
                    isDark && styles.modalInputDark,
                  ]}
                />
              </View>

              {/* Field: Bio */}
              <View style={styles.modalFieldGroup}>
                <Text
                  style={[
                    styles.modalLabel,
                    isDark && styles.modalLabelDark,
                  ]}
                >
                  About & Description
                </Text>
                <TextInput
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Describe your agricultural supply business..."
                  placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    isDark && styles.modalInputDark,
                  ]}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleSaveProfile}
                style={[
                  styles.modalSaveButton,
                  isDark && styles.modalSaveButtonDark,
                ]}
              >
                <Text style={styles.modalSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Warm natural linen cream matching Figma
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 130, // Clearance for bottom navigation tab bar
  },

  /* HEADER */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E4DA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  backCircleDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTagline: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#556E58',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  headerTaglineDark: {
    color: '#9CB39F',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingMyText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    letterSpacing: -0.3,
  },
  headingMyTextDark: {
    color: '#F0F5F1',
  },
  headingHighlight: {
    backgroundColor: '#D7E5D4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  headingHighlightDark: {
    backgroundColor: '#26442C',
  },
  headingProfileText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    letterSpacing: -0.3,
  },
  headingProfileTextDark: {
    color: '#D4E8D7',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3723',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonDark: {
    backgroundColor: '#264B30',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* HERO PROFILE CARD */
  heroProfileCard: {
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    backgroundColor: '#1C3723',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  heroCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  heroCardContent: {
    padding: 16,
    zIndex: 2,
  },
  executiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#EAE5D9',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6821E', // Orange verified badge from Figma
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfoColumn: {
    flex: 1,
    marginLeft: 14,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#395E3F',
  },
  companyNameText: {
    fontSize: 23,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  locationTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  districtText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  partnerTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3E3B6', // Warm golden cream
  },
  bioText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 14,
  },
  glassStatsBar: {
    backgroundColor: 'rgba(20, 38, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: serifFont,
  },
  statLabel: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.78)',
    fontWeight: '500',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  /* TRUST SCORE CARD */
  trustCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  trustCardDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  scoreRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3.5,
    borderColor: '#436340', // Deep olive green ring
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
  },
  scoreNumberDark: {
    color: '#E5EFE7',
  },
  trustDetailsColumn: {
    flex: 1,
  },
  trustTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9C7752', // Amber brown from Figma
    letterSpacing: 0.2,
  },
  trustTitleText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    marginTop: 1,
  },
  trustTitleTextDark: {
    color: '#F0F5F1',
  },
  trustSubtitleText: {
    fontSize: 12,
    color: '#718573',
    marginTop: 2,
  },
  trustSubtitleTextDark: {
    color: '#8EA491',
  },

  /* TABS ROW */
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#426340', // Rich moss green
    shadowColor: '#426340',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPillActiveDark: {
    backgroundColor: '#4D754B',
  },
  tabPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFD8CC',
  },
  tabPillInactiveDark: {
    backgroundColor: '#16271A',
    borderWidth: 1,
    borderColor: '#263D2B',
  },
  tabPillText: {
    fontSize: 13.5,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabPillTextInactive: {
    color: '#344C36',
    fontWeight: '500',
  },
  tabPillTextInactiveDark: {
    color: '#A2B9A5',
    fontWeight: '500',
  },

  /* DETAILS CARD */
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  detailsCardDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6EFE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsIconCircleDark: {
    backgroundColor: '#203925',
  },
  detailsLabel: {
    fontSize: 13,
    color: '#718573',
    flex: 1,
  },
  detailsLabelDark: {
    color: '#8EA491',
  },
  detailsValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C3723',
  },
  detailsValueDark: {
    color: '#F0F5F1',
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#EFEAE0',
    marginVertical: 4,
  },
  detailsDividerDark: {
    backgroundColor: '#223826',
  },

  /* LOCATION RADAR CARD */
  locationRadarCard: {
    backgroundColor: '#1C3723',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  radarOuterRing: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  radarInnerRing: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  radarBeaconDot: {
    position: 'absolute',
    right: 42,
    top: 42,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C06E35', // Warm terracotta orange dot
    shadowColor: '#C06E35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  radarContentColumn: {
    zIndex: 2,
  },
  radarTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radarTagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  radarDistrictText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  radarProvinceText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 8,
  },
  radarCoordinatesText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.3,
  },

  /* SETTINGS SECTION */
  settingsSection: {
    marginBottom: 20,
  },
  settingsSectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#718573',
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  settingsSectionTitleDark: {
    color: '#95AB98',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  settingsCardDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6EFE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconCircleDark: {
    backgroundColor: '#203925',
  },
  settingTextColumn: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C3723',
    marginBottom: 1,
  },
  settingTitleDark: {
    color: '#F0F5F1',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#718573',
  },
  settingSubtitleDark: {
    color: '#8EA491',
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  languagePillDark: {
    backgroundColor: '#1D2E21',
  },
  languagePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1C3723',
  },
  languagePillTextDark: {
    color: '#E5EFE7',
  },

  /* LOG OUT BUTTON */
  logOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8C5A8',
    marginBottom: 120, // Clearance for tab bar
  },
  logOutButtonDark: {
    backgroundColor: '#221815',
    borderColor: '#59352A',
  },
  logOutButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#C25E28',
  },

  /* MODAL */
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  modalSafeAreaDark: {
    backgroundColor: '#0E1710',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  modalHeaderDark: {
    backgroundColor: '#16271A',
    borderBottomColor: '#263D2B',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
  },
  modalHeaderTitleDark: {
    color: '#F0F5F1',
  },
  modalContent: {
    padding: 16,
  },
  modalFieldGroup: {
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B614E',
    marginBottom: 6,
  },
  modalLabelDark: {
    color: '#95AB98',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14.5,
    color: '#1C3723',
    borderWidth: 1,
    borderColor: '#DFD8CC',
  },
  modalInputDark: {
    backgroundColor: '#101F14',
    borderColor: '#29432F',
    color: '#F0F5F1',
  },
  modalTextArea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalSaveButton: {
    backgroundColor: '#1C3723',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  modalSaveButtonDark: {
    backgroundColor: '#264B30',
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
