import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
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
            paddingBottom: insets.bottom + 90,
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
});
