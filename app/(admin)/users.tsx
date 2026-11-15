import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDarkMode } from '@/store/uiStore';
import { colors, darkColors, spacing, radius } from '@/lib/theme';
import { AdminTabBar } from '@/components/admin/AdminTabBar';
import { UserRole } from '@/types/auth.types';

interface PendingPreviewUser {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  location: string;
  date: string;
}

const INITIAL_PREVIEW_USERS: PendingPreviewUser[] = [
  {
    id: 'user-preview-1',
    name: 'Kamal Bandara',
    role: 'farmer',
    initials: 'KB',
    location: 'Polonnaruwa',
    date: '17 Sep',
  },
  {
    id: 'user-preview-2',
    name: 'Nimal Supplies',
    role: 'supplier',
    initials: 'NS',
    location: 'Colombo',
    date: '16 Sep',
  },
];

export default function AdminUsersScreen() {
  const [isDark] = useDarkMode();
  const insets = useSafeAreaInsets();
  const theme = isDark ? darkColors : colors;

  const [pendingList, setPendingList] = useState<PendingPreviewUser[]>(INITIAL_PREVIEW_USERS);

  const handleApprove = (user: PendingPreviewUser) => {
    Alert.alert(
      'Simulate Approval',
      `Approve ${user.name} (${user.role})?\n\nNotice: This action only modifies the local design preview data and does not update real database records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setPendingList((prev) => prev.filter((item) => item.id !== user.id));
          },
        },
      ]
    );
  };

  const handleReject = (user: PendingPreviewUser) => {
    Alert.alert(
      'Simulate Rejection',
      `Reject ${user.name} (${user.role})?\n\nNotice: This action only modifies the local design preview data and does not update real database records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setPendingList((prev) => prev.filter((item) => item.id !== user.id));
          },
        },
      ]
    );
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'farmer':
        return <MaterialCommunityIcons name="sprout" size={13} color="#2E7D32" />;
      case 'buyer':
        return <MaterialCommunityIcons name="crown-outline" size={13} color="#D97706" />;
      case 'supplier':
        return <MaterialCommunityIcons name="storefront-outline" size={13} color="#854D0E" />;
      default:
        return <MaterialCommunityIcons name="account-outline" size={13} color="#6B7E6C" />;
    }
  };

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
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.subHeaderRow}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={14}
                color={isDark ? '#A2BBA6' : '#6B7E6C'}
              />
              <Text style={[styles.subHeaderSubtitle, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                TraceRoot community
              </Text>
            </View>
            <Text style={[styles.headerTitle, { color: isDark ? '#F0F5F1' : '#114B25' }]}>
              Users
            </Text>
          </View>

          {/* Decorative Action Button */}
          <TouchableOpacity
            style={[styles.leafCircleButton, { backgroundColor: isDark ? '#18271C' : '#FFFFFF' }]}
            activeOpacity={0.7}
            disabled={true}
            accessibilityLabel="Community actions"
          >
            <MaterialCommunityIcons
              name="grass"
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Design Preview Notice Banner */}
        <View style={styles.previewNoticeBadge}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#E68A28" />
          <Text style={styles.previewNoticeText}>Design preview — sample data</Text>
        </View>

        {/* Farm-Image Summary Hero Card */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={require('@/assets/images/farm_card_bg.jpg')}
            style={styles.heroCardBackground}
            imageStyle={styles.heroCardImage}
          >
            <LinearGradient
              colors={['rgba(16, 40, 22, 0.45)', 'rgba(10, 25, 14, 0.85)']}
              style={styles.heroGradient}
            >
              {/* Member Metric */}
              <View style={styles.heroTopRow}>
                <Text style={styles.memberMetricLabel}>Registered members</Text>
                <View style={styles.memberMetricRow}>
                  <Text style={styles.memberCountNumber}>8</Text>
                  <Text style={styles.memberCountSubtext}>+2 this week</Text>
                </View>
              </View>

              {/* Roles Breakdown Shelf */}
              <View style={styles.rolesShelf}>
                {/* Farmers */}
                <View style={styles.roleStatCol}>
                  <MaterialCommunityIcons name="sprout" size={15} color="#A6C0A1" />
                  <Text style={styles.roleStatNumber}>3</Text>
                  <Text style={styles.roleStatLabel}>Farmers</Text>
                </View>

                {/* Buyers */}
                <View style={styles.roleStatCol}>
                  <MaterialCommunityIcons name="crown-outline" size={15} color="#A6C0A1" />
                  <Text style={styles.roleStatNumber}>2</Text>
                  <Text style={styles.roleStatLabel}>Buyers</Text>
                </View>

                {/* Suppliers */}
                <View style={styles.roleStatCol}>
                  <MaterialCommunityIcons name="storefront-outline" size={15} color="#A6C0A1" />
                  <Text style={styles.roleStatNumber}>1</Text>
                  <Text style={styles.roleStatLabel}>Suppliers</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Note on design numbers */}
        <Text style={[styles.disclaimerText, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
          Sample data breakdown: The design shows 8 total registered members with 3 Farmers, 2 Buyers, and 1 Supplier listed on the shelf (6 categorized). Live counts will reflect actual database totals once connected.
        </Text>

        {/* "Awaiting approval" Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
            Awaiting approval
          </Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#A2BBA6' : '#738275' }]}>
            <Text style={styles.highlightCount}>{pendingList.length} new registrations</Text> need verification
          </Text>

          {/* User Cards List or Empty State */}
          {pendingList.length > 0 ? (
            <View style={styles.cardsList}>
              {pendingList.map((user) => (
                <View
                  key={user.id}
                  style={[
                    styles.userCard,
                    { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                  ]}
                >
                  {/* Left Orange Accent Line */}
                  <View style={styles.leftAccentBar} />

                  {/* Card Content */}
                  <View style={styles.cardInner}>
                    {/* Top User Info Row */}
                    <View style={styles.userInfoRow}>
                      {/* Avatar with Role Badge */}
                      <View style={styles.avatarWrapper}>
                        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#283D2C' : '#E6EAE5' }]}>
                          <Text style={[styles.avatarText, { color: isDark ? '#F0F5F1' : '#2D4432' }]}>
                            {user.initials}
                          </Text>
                        </View>
                        <View style={[styles.roleBadgePill, { backgroundColor: isDark ? '#18271C' : '#FFFFFF' }]}>
                          {getRoleIcon(user.role)}
                        </View>
                      </View>

                      {/* Name & Details */}
                      <View style={styles.userDetailsGroup}>
                        <Text style={[styles.userNameText, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
                          {user.name}
                        </Text>
                        <View style={styles.metaRow}>
                          <Text style={[styles.metaRole, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Text>
                          <MaterialCommunityIcons name="map-marker-outline" size={12} color="#88A38E" />
                          <Text style={[styles.metaText, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                            {user.location} • {user.date}
                          </Text>
                        </View>
                      </View>

                      {/* Pending Badge */}
                      <View style={styles.pendingBadge}>
                        <View style={styles.pendingDot} />
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                      </View>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.rejectButton, { backgroundColor: isDark ? '#283D2C' : '#F1EFE9' }]}
                        activeOpacity={0.7}
                        onPress={() => handleReject(user)}
                        accessibilityRole="button"
                        accessibilityLabel={`Reject ${user.name}`}
                      >
                        <Text style={[styles.rejectButtonText, { color: isDark ? '#F0F5F1' : '#49524A' }]}>
                          Reject
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.approveButton, { backgroundColor: '#1E3523' }]}
                        activeOpacity={0.8}
                        onPress={() => handleApprove(user)}
                        accessibilityRole="button"
                        accessibilityLabel={`Approve ${user.name}`}
                      >
                        <Feather name="check" size={14} color="#FFFFFF" />
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyStateCard,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={40}
                color={theme.primary}
              />
              <Text style={[styles.emptyStateTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
                Queue Cleared
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                All pending preview registrations have been reviewed. Real pending verifications will populate here once administrative queries are configured.
              </Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setPendingList(INITIAL_PREVIEW_USERS)}
                accessibilityLabel="Reset preview queue"
              >
                <Text style={styles.resetButtonText}>Reset Preview List</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 5-Tab Floating Shell with Users Active */}
      <AdminTabBar activeTab="users" />
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
    marginBottom: spacing.xs,
  },
  headerLeft: {
    justifyContent: 'center',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  subHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  leafCircleButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  previewNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(230, 138, 40, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    marginVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  previewNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  heroCardContainer: {
    borderRadius: 22,
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
    minHeight: 185,
  },
  heroCardImage: {
    borderRadius: 22,
  },
  heroGradient: {
    padding: spacing.md,
    borderRadius: 22,
    flex: 1,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    marginBottom: spacing.sm,
  },
  memberMetricLabel: {
    color: '#E8F5E9',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  memberCountNumber: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  memberCountSubtext: {
    color: '#F4D068',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  rolesShelf: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 38, 22, 0.65)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  roleStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  roleStatNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  roleStatLabel: {
    color: '#A6C0A1',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  disclaimerText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    lineHeight: 15,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  highlightCount: {
    color: '#D97706',
    fontWeight: '700',
  },
  cardsList: {
    gap: spacing.md,
  },
  userCard: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  leftAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#E66926',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardInner: {
    padding: 14,
    paddingLeft: 18,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleBadgePill: {
    position: 'absolute',
    bottom: -2,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userDetailsGroup: {
    flex: 1,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaRole: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 11,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDF1EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E66926',
  },
  pendingBadgeText: {
    color: '#C45A1A',
    fontSize: 11,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectButton: {
    flex: 1,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    height: 42,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C5E3D',
  },
});
