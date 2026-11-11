import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDarkMode } from '@/store/uiStore';
import { colors, darkColors, spacing, radius } from '@/lib/theme';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

export default function AdminOverviewScreen() {
  const [isDark] = useDarkMode();
  const insets = useSafeAreaInsets();
  const theme = isDark ? darkColors : colors;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0E1710' : '#F8F5F0' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.shieldBadge, { backgroundColor: isDark ? '#1C3122' : '#E8F5E9' }]}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={22}
                color={theme.primary}
              />
            </View>
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.subHeaderSubtitle, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                Admin Panel
              </Text>
              <Text style={[styles.headerTitle, { color: isDark ? '#F0F5F1' : '#114B25' }]}>
                TraceRoot Admin
              </Text>
            </View>
          </View>

          {/* Notification Bell (Decorative) */}
          <TouchableOpacity
            style={[styles.bellButton, { backgroundColor: isDark ? '#18271C' : '#FFFFFF' }]}
            activeOpacity={0.7}
            disabled={true}
            accessibilityLabel="Notifications"
          >
            <Feather
              name="bell"
              size={18}
              color={isDark ? '#F0F5F1' : '#16301A'}
            />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Hero Card with Paddy Field Background & Option B ("—") Stats */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={require('@/assets/images/farm_card_bg.jpg')}
            style={styles.heroCardBackground}
            imageStyle={styles.heroCardImage}
          >
            <LinearGradient
              colors={['rgba(16, 40, 22, 0.55)', 'rgba(10, 25, 14, 0.88)']}
              style={styles.heroGradient}
            >
              {/* Badge & Status pill */}
              <View style={styles.heroTopRow}>
                <View style={styles.heroPillLeft}>
                  <MaterialCommunityIcons name="leaf" size={14} color="#7CD958" />
                  <Text style={styles.heroPillLeftText}>Platform monitoring</Text>
                </View>

                {/* Neutral status pill without unsupported health claim */}
                <View style={styles.heroPillRight}>
                  <View style={styles.neutralDot} />
                  <Text style={styles.heroPillRightText}>Overview</Text>
                </View>
              </View>

              {/* Tagline */}
              <View style={styles.heroTaglineBlock}>
                <Text style={styles.heroTaglineMain}>
                  Every record, rooted in{' '}
                  <Text style={styles.heroTaglineItalic}>trust</Text>
                </Text>
              </View>

              {/* Stats Bar */}
              <View style={styles.heroStatsBar}>
                {/* Farmers */}
                <View style={styles.statColumn}>
                  <MaterialCommunityIcons name="account" size={16} color="#A6C0A1" />
                  <Text style={styles.statNumber}>—</Text>
                  <Text style={styles.statLabel}>Farmers</Text>
                </View>

                {/* Buyers */}
                <View style={styles.statColumn}>
                  <MaterialCommunityIcons name="basket" size={16} color="#A6C0A1" />
                  <Text style={styles.statNumber}>—</Text>
                  <Text style={styles.statLabel}>Buyers</Text>
                </View>

                {/* Suppliers */}
                <View style={styles.statColumn}>
                  <MaterialCommunityIcons name="storefront-outline" size={16} color="#A6C0A1" />
                  <Text style={styles.statNumber}>—</Text>
                  <Text style={styles.statLabel}>Suppliers</Text>
                </View>

                {/* Records */}
                <View style={styles.statColumn}>
                  <MaterialCommunityIcons name="file-document-outline" size={16} color="#A6C0A1" />
                  <Text style={styles.statNumber}>—</Text>
                  <Text style={styles.statLabel}>Records</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Data connection disclaimer */}
        <Text style={[styles.disclaimerText, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
          Live admin data is not connected. Stats will display once administrative access is configured.
        </Text>

        {/* Verification Alert Banner (Option B - Informational / Non-Interactive) */}
        <View
          style={[
            styles.alertBanner,
            { backgroundColor: isDark ? '#233827' : '#1E3523' },
          ]}
        >
          <View style={styles.alertLeft}>
            <View style={styles.alertIconCircle}>
              <MaterialCommunityIcons name="account-group" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.alertTextGroup}>
              <Text style={styles.alertTitle}>Verification Governance</Text>
              <Text style={styles.alertSubtitle}>
                Connect admin backend to review registrations
              </Text>
            </View>
          </View>
          <Feather name="arrow-up-right" size={20} color="#A6C0A1" />
        </View>

        {/* Management Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
            Management
          </Text>

          <View style={styles.managementGrid}>
            {/* Farmers (Active aesthetic, but disabled control) */}
            <TouchableOpacity
              style={[
                styles.managementButton,
                styles.managementButtonSelected,
                styles.controlDisabled,
              ]}
              disabled={true}
              accessibilityRole="button"
              accessibilityLabel="Farmers management (under development)"
            >
              <View style={styles.managementIconWrapSelected}>
                <MaterialCommunityIcons name="account-cowboy-hat" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.managementTextSelected}>Farmers</Text>
            </TouchableOpacity>

            {/* Buyers */}
            <TouchableOpacity
              style={[
                styles.managementButton,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                styles.controlDisabled,
              ]}
              disabled={true}
              accessibilityRole="button"
              accessibilityLabel="Buyers management (under development)"
            >
              <View style={[styles.managementIconWrap, { backgroundColor: isDark ? '#253A2A' : '#F1F4F1' }]}>
                <MaterialCommunityIcons
                  name="basket-outline"
                  size={20}
                  color={isDark ? '#A2BBA6' : '#2C5E3D'}
                />
              </View>
              <Text style={[styles.managementText, { color: isDark ? '#A2BBA6' : '#2C5E3D' }]}>
                Buyers
              </Text>
            </TouchableOpacity>

            {/* Suppliers */}
            <TouchableOpacity
              style={[
                styles.managementButton,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                styles.controlDisabled,
              ]}
              disabled={true}
              accessibilityRole="button"
              accessibilityLabel="Suppliers management (under development)"
            >
              <View style={[styles.managementIconWrap, { backgroundColor: isDark ? '#253A2A' : '#F1F4F1' }]}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={20}
                  color={isDark ? '#A2BBA6' : '#2C5E3D'}
                />
              </View>
              <Text style={[styles.managementText, { color: isDark ? '#A2BBA6' : '#2C5E3D' }]}>
                Suppliers
              </Text>
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity
              style={[
                styles.managementButton,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                styles.controlDisabled,
              ]}
              disabled={true}
              accessibilityRole="button"
              accessibilityLabel="Reports management (under development)"
            >
              <View style={[styles.managementIconWrap, { backgroundColor: isDark ? '#253A2A' : '#F1F4F1' }]}>
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={20}
                  color={isDark ? '#A2BBA6' : '#2C5E3D'}
                />
              </View>
              <Text style={[styles.managementText, { color: isDark ? '#A2BBA6' : '#2C5E3D' }]}>
                Reports
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.subnoteText, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
            Management sections are under development
          </Text>
        </View>

        {/* Pending Verification Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.pendingHeaderRow}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
              Pending Verification
            </Text>
            <TouchableOpacity
              disabled={true}
              style={styles.controlDisabled}
              accessibilityLabel="See all pending verifications (disabled)"
            >
              <View style={styles.seeAllPill}>
                <Text style={styles.seeAllText}>See All</Text>
                <Feather name="chevron-right" size={14} color="#6B7E6C" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Honest placeholder state */}
          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
            ]}
          >
            <MaterialCommunityIcons
              name="account-clock-outline"
              size={36}
              color={isDark ? '#A2BBA6' : '#88A38E'}
            />
            <Text style={[styles.emptyStateTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
              No Live Queue Connected
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
              User verification requests will appear here once administrative privileges and backend queries are enabled.
            </Text>
          </View>
        </View>

        {/* Design Preview Section Banner */}
        <View style={styles.previewNoticeBadge}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#E68A28" />
          <Text style={styles.previewNoticeText}>Design preview — sample data</Text>
        </View>

        {/* 1. Recent Records Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.pendingHeaderRow}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
              Recent Records
            </Text>
            <TouchableOpacity
              disabled={true}
              style={styles.controlDisabled}
              accessibilityLabel="See all recent records (disabled)"
            >
              <View style={styles.seeAllPill}>
                <Text style={styles.seeAllText}>See All</Text>
                <Feather name="chevron-right" size={14} color="#6B7E6C" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Timeline and Record List */}
          <View style={styles.timelineContainer}>
            {/* Connecting Vertical Line */}
            <View
              style={[
                styles.timelineLine,
                { backgroundColor: isDark ? '#283D2C' : '#DDE3DA' },
              ]}
            />

            {/* Record 1: Correction Record */}
            <View style={styles.timelineRow}>
              <View style={[styles.timelineNode, { backgroundColor: '#E66926' }]} />
              <View
                style={[
                  styles.recordCard,
                  { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                ]}
              >
                <Image
                  source={require('@/assets/images/supplier_tomato_seeds.jpg')}
                  style={styles.recordThumbnail}
                />
                <View style={styles.recordInfo}>
                  <Text
                    style={[styles.recordTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}
                    numberOfLines={1}
                  >
                    Correction Record
                  </Text>
                  <Text
                    style={[styles.recordSubtext, { color: isDark ? '#A2BBA6' : '#738275' }]}
                    numberOfLines={1}
                  >
                    Priya Kumari • Tomato • 10:15 AM
                  </Text>
                </View>
                <View style={[styles.traceBadge, styles.traceBadgeOrange]}>
                  <MaterialCommunityIcons name="gas-station-outline" size={11} color="#C45A1A" />
                  <Text style={[styles.traceBadgeText, styles.traceBadgeTextOrange]}>TR-0053</Text>
                </View>
              </View>
            </View>

            {/* Record 2: Fertilizer Applied */}
            <View style={styles.timelineRow}>
              <View style={[styles.timelineNode, { backgroundColor: '#2E7D32' }]} />
              <View
                style={[
                  styles.recordCard,
                  { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                ]}
              >
                <Image
                  source={require('@/assets/images/supplier_tomato_seeds.jpg')}
                  style={styles.recordThumbnail}
                />
                <View style={styles.recordInfo}>
                  <Text
                    style={[styles.recordTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}
                    numberOfLines={1}
                  >
                    Fertilizer Applied
                  </Text>
                  <Text
                    style={[styles.recordSubtext, { color: isDark ? '#A2BBA6' : '#738275' }]}
                    numberOfLines={1}
                  >
                    Priya Kumari • Tomato • 09:20 AM
                  </Text>
                </View>
                <View style={[styles.traceBadge, styles.traceBadgeGreen]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={11} color="#3E6B47" />
                  <Text style={[styles.traceBadgeText, styles.traceBadgeTextGreen]}>TR-0051</Text>
                </View>
              </View>
            </View>

            {/* Record 3: Growth Observation */}
            <View style={styles.timelineRow}>
              <View style={[styles.timelineNode, { backgroundColor: '#2E7D32' }]} />
              <View
                style={[
                  styles.recordCard,
                  { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                ]}
              >
                <Image
                  source={require('@/assets/images/auth_sprouts.jpg')}
                  style={styles.recordThumbnail}
                />
                <View style={styles.recordInfo}>
                  <Text
                    style={[styles.recordTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}
                    numberOfLines={1}
                  >
                    Growth Observation
                  </Text>
                  <Text
                    style={[styles.recordSubtext, { color: isDark ? '#A2BBA6' : '#738275' }]}
                    numberOfLines={1}
                  >
                    Roshan Silva • Cabbage • 08:45 AM
                  </Text>
                </View>
                <View style={[styles.traceBadge, styles.traceBadgeGreen]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={11} color="#3E6B47" />
                  <Text style={[styles.traceBadgeText, styles.traceBadgeTextGreen]}>TR-0049</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Platform Activity Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
            Platform Activity
          </Text>

          <View style={styles.activityGrid}>
            {/* Card 1: Records Today */}
            <View
              style={[
                styles.activityCard,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
              ]}
            >
              <View style={[styles.activityIconCircle, { backgroundColor: isDark ? '#233827' : '#E8F5E9' }]}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#2E7D32" />
              </View>
              <Text style={[styles.activityNumber, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
                14
              </Text>
              <Text style={[styles.activityLabel, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                Records Today
              </Text>
            </View>

            {/* Card 2: Active Journeys */}
            <View
              style={[
                styles.activityCard,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
              ]}
            >
              <View style={[styles.activityIconCircle, { backgroundColor: isDark ? '#233827' : '#EAF2EB' }]}>
                <MaterialCommunityIcons name="sprout-outline" size={18} color="#3A6E46" />
              </View>
              <Text style={[styles.activityNumber, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
                23
              </Text>
              <Text style={[styles.activityLabel, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                Active Journeys
              </Text>
            </View>

            {/* Card 3: Contracts Active */}
            <View
              style={[
                styles.activityCard,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
              ]}
            >
              <View style={[styles.activityIconCircle, { backgroundColor: isDark ? '#3A2710' : '#F6EFE6' }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#9C7752" />
              </View>
              <Text style={[styles.activityNumber, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
                8
              </Text>
              <Text style={[styles.activityLabel, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                Contracts Active
              </Text>
            </View>

            {/* Card 4: Harvests Listed */}
            <View
              style={[
                styles.activityCard,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
              ]}
            >
              <View style={[styles.activityIconCircle, { backgroundColor: isDark ? '#3A251B' : '#FCEFE9' }]}>
                <MaterialCommunityIcons name="basket-outline" size={18} color="#D96F43" />
              </View>
              <Text style={[styles.activityNumber, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
                5
              </Text>
              <Text style={[styles.activityLabel, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                Harvests Listed
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 5-Tab Floating Shell (Decorative with Overview active) */}
      <AdminTabBar activeTab="overview" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shieldBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    justifyContent: 'center',
  },
  subHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E66926',
  },
  heroCardContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: spacing.xs,
  },
  heroCardBackground: {
    width: '100%',
    minHeight: 200,
  },
  heroCardImage: {
    borderRadius: radius.lg,
  },
  heroGradient: {
    padding: spacing.md,
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heroPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  heroPillLeftText: {
    color: '#E8F5E9',
    fontSize: 12,
    fontWeight: '500',
  },
  heroPillRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  neutralDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A6C0A1',
  },
  heroPillRightText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTaglineBlock: {
    marginVertical: spacing.sm,
  },
  heroTaglineMain: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  heroTaglineItalic: {
    fontStyle: 'italic',
    color: '#F4D068',
    fontWeight: '800',
  },
  heroStatsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 30, 18, 0.65)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  statLabel: {
    color: '#A6C0A1',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  disclaimerText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  alertIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E66926',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextGroup: {
    flex: 1,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  alertSubtitle: {
    color: '#A6C0A1',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  managementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  managementButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  managementButtonSelected: {
    backgroundColor: '#1E3523',
  },
  managementIconWrapSelected: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  managementIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  managementTextSelected: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  managementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  controlDisabled: {
    opacity: 0.55,
  },
  subnoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 6,
    marginLeft: 2,
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  seeAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    color: '#6B7E6C',
    fontWeight: '500',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Design Preview Notice Badge
  previewNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(230, 138, 40, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  previewNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },

  // Timeline & Recent Records
  timelineContainer: {
    position: 'relative',
    paddingLeft: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 10,
    top: 24,
    bottom: 24,
    width: 2,
    borderRadius: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  recordCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  recordThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 10,
  },
  recordInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recordTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  recordSubtext: {
    fontSize: 11,
    fontWeight: '400',
  },
  traceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginLeft: 6,
  },
  traceBadgeOrange: {
    backgroundColor: '#FDF1EB',
  },
  traceBadgeGreen: {
    backgroundColor: '#EEF4EF',
  },
  traceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  traceBadgeTextOrange: {
    color: '#C45A1A',
  },
  traceBadgeTextGreen: {
    color: '#3E6B47',
  },

  // Platform Activity Grid
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  activityCard: {
    width: '48%',
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 4,
  },
  activityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  activityNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
