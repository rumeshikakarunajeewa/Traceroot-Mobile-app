import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  adminService,
  AdminDashboardStats,
  AdminUserItem,
  VerificationRequestItem,
  TraceabilityAuditItem,
  DisputeItem,
  AdminAuditLogItem,
} from '../../src/services/admin.service';
import { authService } from '../../src/services/auth.service';
import { useAuth } from '../../src/store/authStore';
import { useDarkMode } from '../../src/store/uiStore';
import { UserRole } from '../../src/types/auth.types';

type AdminTab = 'overview' | 'verifications' | 'users' | 'traceability' | 'disputes';

export default function AdminDashboardScreen() {
  const [isDark] = useDarkMode();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Users tab state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'all'>('all');
  const [userSearch, setUserSearch] = useState('');

  // Verifications tab state
  const [verifications, setVerifications] = useState<VerificationRequestItem[]>([]);
  const [verifFilter, setVerifFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReq, setSelectedReq] = useState<VerificationRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Traceability tab state
  const [auditRecords, setAuditRecords] = useState<TraceabilityAuditItem[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Disputes tab state
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [disputeFilter, setDisputeFilter] = useState<'all' | 'open' | 'resolved'>('all');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);

  const adminId = user?.id || 'admin-fixed-id';

  // Load all platform data
  const loadDashboardData = useCallback(async () => {
    try {
      const [
        statsData,
        usersData,
        verifData,
        traceData,
        disputesData,
        logsData,
      ] = await Promise.all([
        adminService.getDashboardOverviewStats(),
        adminService.getUsers(userRoleFilter, userSearch),
        adminService.getVerificationRequests(verifFilter),
        adminService.getTraceabilityAuditRecords(auditSearch),
        adminService.getDisputes(disputeFilter),
        adminService.getAdminAuditLogs(15),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setVerifications(verifData);
      setAuditRecords(traceData);
      setDisputes(disputesData);
      setAuditLogs(logsData);
    } catch (err) {
      console.warn('[AdminDashboard] loadDashboardData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRoleFilter, userSearch, verifFilter, auditSearch, disputeFilter]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Admin Console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  // ── Verification Actions ──────────────────────────────────────────

  const handleApproveVerification = (req: VerificationRequestItem) => {
    Alert.alert(
      'Approve Verification',
      `Approve ${req.userName}'s ${req.documentType.replace('_', ' ')} and verify their account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            const res = await adminService.reviewVerificationRequest(
              req.id,
              adminId,
              'approved',
              'Approved by administrator after document verification.'
            );
            if (res.success) {
              Alert.alert('Approved', `${req.userName} has been verified successfully.`);
              loadDashboardData();
            } else {
              Alert.alert('Error', res.error || 'Failed to approve request.');
            }
          },
        },
      ]
    );
  };

  const handleOpenRejectModal = (req: VerificationRequestItem) => {
    setSelectedReq(req);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedReq) return;
    const res = await adminService.reviewVerificationRequest(
      selectedReq.id,
      adminId,
      'rejected',
      rejectReason.trim() || 'Document could not be verified.'
    );
    setRejectModalVisible(false);
    if (res.success) {
      Alert.alert('Rejected', 'Verification request has been rejected.');
      loadDashboardData();
    } else {
      Alert.alert('Error', res.error || 'Failed to reject request.');
    }
  };

  // ── User Management Actions ───────────────────────────────────────

  const handleToggleUserVerification = (u: AdminUserItem) => {
    const nextState = !u.isVerified;
    Alert.alert(
      nextState ? 'Verify User' : 'Revoke Verification',
      `Are you sure you want to ${nextState ? 'verify' : 'revoke verification for'} ${u.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const res = await adminService.updateUserVerification(u.id, nextState, adminId);
            if (res.success) {
              setUsers((prev) =>
                prev.map((item) => (item.id === u.id ? { ...item, isVerified: nextState } : item))
              );
            } else {
              Alert.alert('Error', res.error || 'Failed to update user.');
            }
          },
        },
      ]
    );
  };

  const handleAdjustTrustScore = async (u: AdminUserItem, delta: number) => {
    const res = await adminService.updateUserTrustScore(u.id, delta, adminId, 'Admin manual adjustment');
    if (res.success && typeof res.newScore === 'number') {
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, trustScore: res.newScore! } : item))
      );
    }
  };

  // ── Dispute Actions ───────────────────────────────────────────────

  const handleResolveDispute = (disp: DisputeItem, resolution: 'resolved' | 'dismissed') => {
    Alert.prompt
      ? Alert.prompt(
          'Dispute Resolution',
          `Enter resolution notes to mark dispute ${disp.disputeCode} as ${resolution}:`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              onPress: async (notes) => {
                const res = await adminService.resolveDispute(
                  disp.id,
                  adminId,
                  resolution,
                  notes || 'Resolved by administrator'
                );
                if (res.success) {
                  Alert.alert('Updated', `Dispute marked as ${resolution}.`);
                  loadDashboardData();
                }
              },
            },
          ]
        )
      : Alert.alert(
          'Confirm Resolution',
          `Mark dispute ${disp.disputeCode} as ${resolution}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              onPress: async () => {
                const res = await adminService.resolveDispute(
                  disp.id,
                  adminId,
                  resolution,
                  'Resolved by administrator'
                );
                if (res.success) loadDashboardData();
              },
            },
          ]
        );
  };

  // ── RENDER TABS ───────────────────────────────────────────────────

  const renderOverviewTab = () => {
    if (!stats) return null;

    return (
      <View style={styles.tabContent}>
        {/* KPI Grid */}
        <Text style={[styles.sectionHeading, isDark && styles.sectionHeadingDark]}>Platform Metrics</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, isDark && styles.kpiCardDark]}>
            <MaterialCommunityIcons name="account-group" size={24} color="#255D35" />
            <Text style={[styles.kpiNumber, isDark && styles.kpiNumberDark]}>{stats.totalUsers}</Text>
            <Text style={[styles.kpiLabel, isDark && styles.kpiLabelDark]}>Total Users</Text>
          </View>

          <View style={[styles.kpiCard, isDark && styles.kpiCardDark]}>
            <MaterialCommunityIcons name="sprout" size={24} color="#16A34A" />
            <Text style={[styles.kpiNumber, isDark && styles.kpiNumberDark]}>{stats.totalFarmers}</Text>
            <Text style={[styles.kpiLabel, isDark && styles.kpiLabelDark]}>Farmers</Text>
          </View>

          <View style={[styles.kpiCard, isDark && styles.kpiCardDark]}>
            <MaterialCommunityIcons name="cart" size={24} color="#0284C7" />
            <Text style={[styles.kpiNumber, isDark && styles.kpiNumberDark]}>{stats.totalBuyers}</Text>
            <Text style={[styles.kpiLabel, isDark && styles.kpiLabelDark]}>Buyers</Text>
          </View>

          <View style={[styles.kpiCard, isDark && styles.kpiCardDark]}>
            <MaterialCommunityIcons name="storefront" size={24} color="#D97706" />
            <Text style={[styles.kpiNumber, isDark && styles.kpiNumberDark]}>{stats.totalSuppliers}</Text>
            <Text style={[styles.kpiLabel, isDark && styles.kpiLabelDark]}>Suppliers</Text>
          </View>

          <View style={[styles.kpiCard, isDark && styles.kpiCardDark]}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#059669" />
            <Text style={[styles.kpiNumber, isDark && styles.kpiNumberDark]}>{stats.totalRecords}</Text>
            <Text style={[styles.kpiLabel, isDark && styles.kpiLabelDark]}>Ledger Records</Text>
          </View>

          <View style={[styles.kpiCard, isDark && styles.kpiCardDark]}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#255D35" />
            <Text style={[styles.kpiNumber, isDark && styles.kpiNumberDark]}>
              Rs. {(stats.totalOrderVolumeLkr / 1000).toFixed(0)}k
            </Text>
            <Text style={[styles.kpiLabel, isDark && styles.kpiLabelDark]}>Trade Volume</Text>
          </View>
        </View>

        {/* Action Callouts */}
        {stats.pendingVerifications > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => setActiveTab('verifications')}
          >
            <MaterialCommunityIcons name="alert-decagram" size={22} color="#D97706" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.alertBannerTitle}>
                {stats.pendingVerifications} Pending Verification Request
                {stats.pendingVerifications > 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertBannerSubtitle}>
                Review identity documents to grant verified status.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Recent Audit Trail */}
        <Text style={[styles.sectionHeading, isDark && styles.sectionHeadingDark, { marginTop: 18 }]}>
          Recent Governance Activity
        </Text>
        <View style={[styles.auditBox, isDark && styles.auditBoxDark]}>
          {auditLogs.length === 0 ? (
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              No administrative actions logged yet.
            </Text>
          ) : (
            auditLogs.slice(0, 5).map((log) => (
              <View key={log.id} style={styles.auditLogRow}>
                <View style={styles.auditDot} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.auditAction, isDark && styles.auditActionDark]}>
                    {log.action.replace(/_/g, ' ')}
                  </Text>
                  <Text style={[styles.auditMeta, isDark && styles.auditMetaDark]}>
                    By {log.adminName} on {log.targetEntity} •{' '}
                    {new Date(log.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderVerificationsTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                isDark && styles.filterChipDark,
                verifFilter === f && styles.filterChipActive,
              ]}
              onPress={() => setVerifFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isDark && styles.filterChipTextDark,
                  verifFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {verifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-all" size={48} color={isDark ? '#4ADE80' : '#255D35'} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No {verifFilter} verification requests
            </Text>
          </View>
        ) : (
          verifications.map((item) => (
            <View key={item.id} style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{item.userName}</Text>
                  <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
                    Role: {item.userRole.toUpperCase()} • {item.userDistrict || 'Sri Lanka'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'approved'
                      ? styles.statusApproved
                      : item.status === 'rejected'
                      ? styles.statusRejected
                      : styles.statusPending,
                  ]}
                >
                  <Text style={styles.statusPillText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.verifDetailsBox}>
                <Text style={[styles.verifDetailText, isDark && styles.verifDetailTextDark]}>
                  Document Type: <Text style={{ fontWeight: '700' }}>{item.documentType.replace('_', ' ')}</Text>
                </Text>
                {item.documentNumber && (
                  <Text style={[styles.verifDetailText, isDark && styles.verifDetailTextDark]}>
                    Doc ID / Reg No: <Text style={{ fontWeight: '700' }}>{item.documentNumber}</Text>
                  </Text>
                )}
                <Text style={[styles.verifDetailText, isDark && styles.verifDetailTextDark]}>
                  Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                </Text>
              </View>

              {item.status === 'pending' && (
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApproveVerification(item)}
                  >
                    <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.approveBtnText}>Approve & Verify</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleOpenRejectModal(item)}
                  >
                    <Feather name="x" size={16} color="#DC2626" style={{ marginRight: 4 }} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderUsersTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Search Input */}
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <Feather name="search" size={18} color={isDark ? '#7E9F85' : '#666'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search by name, district, phone..."
            placeholderTextColor={isDark ? '#5E7D65' : '#999'}
            value={userSearch}
            onChangeText={setUserSearch}
          />
        </View>

        {/* Role Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterScroll}>
          {(['all', 'farmer', 'buyer', 'supplier'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.roleChip,
                isDark && styles.roleChipDark,
                userRoleFilter === r && styles.roleChipActive,
              ]}
              onPress={() => setUserRoleFilter(r)}
            >
              <Text
                style={[
                  styles.roleChipText,
                  isDark && styles.roleChipTextDark,
                  userRoleFilter === r && styles.roleChipTextActive,
                ]}
              >
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>No users found</Text>
          </View>
        ) : (
          users.map((u) => (
            <View key={u.id} style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{u.fullName}</Text>
                  <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
                    Role: {u.role.toUpperCase()} • {u.district || 'Sri Lanka'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    u.isVerified ? styles.statusApproved : styles.statusUnverified,
                  ]}
                >
                  <Text style={styles.statusPillText}>
                    {u.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                  </Text>
                </View>
              </View>

              <View style={styles.userMetricsRow}>
                <View style={styles.trustBadge}>
                  <MaterialCommunityIcons name="shield-check" size={14} color="#255D35" />
                  <Text style={styles.trustBadgeText}>{u.trustScore}% Trust</Text>
                </View>

                {/* Trust Score Stepper */}
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleAdjustTrustScore(u, -5)}
                  >
                    <Text style={styles.stepperBtnText}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleAdjustTrustScore(u, 5)}
                  >
                    <Text style={styles.stepperBtnText}>+5</Text>
                  </TouchableOpacity>
                </View>

                {/* Verification Toggle */}
                <TouchableOpacity
                  style={[styles.verifyToggleBtn, u.isVerified && styles.verifyToggleBtnRevoke]}
                  onPress={() => handleToggleUserVerification(u)}
                >
                  <Text style={styles.verifyToggleBtnText}>
                    {u.isVerified ? 'Revoke' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderTraceabilityTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <Feather name="search" size={18} color={isDark ? '#7E9F85' : '#666'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search records by title, stage, location..."
            placeholderTextColor={isDark ? '#5E7D65' : '#999'}
            value={auditSearch}
            onChangeText={setAuditSearch}
          />
        </View>

        {auditRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No cultivation records found
            </Text>
          </View>
        ) : (
          auditRecords.map((rec) => (
            <View key={rec.id} style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{rec.title}</Text>
                  <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
                    Crop: {rec.cropName} • Farmer: {rec.farmerName}
                  </Text>
                </View>
                <View style={styles.hashStatusPill}>
                  <MaterialCommunityIcons name="shield-lock" size={13} color="#255D35" />
                  <Text style={styles.hashStatusText}>Immutable</Text>
                </View>
              </View>

              <View style={styles.traceMetadataBox}>
                <Text style={[styles.metaRow, isDark && styles.metaRowDark]}>
                  Stage: <Text style={{ fontWeight: '700' }}>{rec.stage.replace('_', ' ')}</Text>
                </Text>
                <Text style={[styles.metaRow, isDark && styles.metaRowDark]}>
                  Activity: {rec.activityType}
                </Text>
                <Text style={[styles.metaRow, isDark && styles.metaRowDark]}>
                  Location: {rec.locationName}
                  {rec.latitude && rec.longitude
                    ? ` (${rec.latitude.toFixed(4)}, ${rec.longitude.toFixed(4)})`
                    : ''}
                </Text>
                <Text style={[styles.metaRow, isDark && styles.metaRowDark]}>
                  Recorded: {new Date(rec.recordedAt).toLocaleString()}
                </Text>

                {/* SHA-256 Hash Preview */}
                <View style={styles.hashBox}>
                  <Text style={styles.hashLabel}>SHA-256 INTEGRITY HASH:</Text>
                  <Text style={styles.hashValue} numberOfLines={1}>
                    {rec.integrityHash}
                  </Text>
                </View>

                {rec.isCorrection && (
                  <View style={styles.correctionNotice}>
                    <Feather name="info" size={13} color="#D97706" />
                    <Text style={styles.correctionNoticeText}>
                      Correction Record (Linked to original #{rec.correctsId?.substring(0, 8)})
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderDisputesTab = () => {
    return (
      <View style={styles.tabContent}>
        {disputes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-check-outline" size={48} color="#255D35" />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No Active Disputes
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              Platform transactions and contract commitments are running cleanly.
            </Text>
          </View>
        ) : (
          disputes.map((disp) => (
            <View key={disp.id} style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                    Case #{disp.disputeCode}
                  </Text>
                  <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
                    Category: {disp.category.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    disp.status === 'resolved' ? styles.statusApproved : styles.statusPending,
                  ]}
                >
                  <Text style={styles.statusPillText}>{disp.status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={[styles.disputeDesc, isDark && styles.disputeDescDark]}>
                {disp.description}
              </Text>

              <View style={styles.partiesRow}>
                <Text style={[styles.partyText, isDark && styles.partyTextDark]}>
                  Reporter: <Text style={{ fontWeight: '700' }}>{disp.reporterName}</Text>
                </Text>
                <Text style={[styles.partyText, isDark && styles.partyTextDark]}>
                  Respondent: <Text style={{ fontWeight: '700' }}>{disp.respondentName}</Text>
                </Text>
              </View>

              {disp.status !== 'resolved' && (
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleResolveDispute(disp, 'resolved')}
                  >
                    <Feather name="check-circle" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.approveBtnText}>Mark Resolved</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleResolveDispute(disp, 'dismissed')}
                  >
                    <Text style={styles.rejectBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Admin Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <MaterialCommunityIcons name="shield-crown" size={14} color="#FFFFFF" />
            <Text style={styles.adminBadgeText}>ADMIN CONSOLE</Text>
          </View>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            TraceRoot Governance
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Feather name="log-out" size={18} color={isDark ? '#E8F5E9' : '#1C3723'} />
        </TouchableOpacity>
      </View>

      {/* Navigation Tab Bar */}
      <View style={styles.navBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
          {[
            { key: 'overview', label: 'Overview', icon: 'grid' },
            { key: 'verifications', label: `Verifications (${stats?.pendingVerifications || 0})`, icon: 'check-circle' },
            { key: 'users', label: 'Users', icon: 'users' },
            { key: 'traceability', label: 'Traceability', icon: 'shield' },
            { key: 'disputes', label: 'Disputes', icon: 'alert-triangle' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.navTab,
                  isDark && styles.navTabDark,
                  isActive && styles.navTabActive,
                  isActive && isDark && styles.navTabActiveDark,
                ]}
                onPress={() => setActiveTab(tab.key as AdminTab)}
              >
                <Feather
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? '#FFFFFF' : isDark ? '#9CB3A0' : '#444'}
                />
                <Text
                  style={[
                    styles.navTabText,
                    isDark && styles.navTabTextDark,
                    isActive && styles.navTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#255D35'} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Loading platform governance data...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#4ADE80' : '#255D35'}
              colors={['#255D35']}
            />
          }
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'verifications' && renderVerificationsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'traceability' && renderTraceabilityTab()}
          {activeTab === 'disputes' && renderDisputesTab()}
        </ScrollView>
      )}

      {/* Reject Verification Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, isDark && styles.modalBoxDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Reject Request</Text>
            <Text style={[styles.modalDesc, isDark && styles.modalDescDark]}>
              Please provide a reason for rejecting {selectedReq?.userName}&apos;s verification:
            </Text>
            <TextInput
              style={[styles.modalInput, isDark && styles.modalInputDark]}
              placeholder="e.g. Document image is unreadable, invalid registration..."
              placeholderTextColor={isDark ? '#5E7D65' : '#999'}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmRejectBtn}
                onPress={handleConfirmReject}
              >
                <Text style={styles.modalConfirmRejectText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerDark: {
    backgroundColor: '#162219',
    borderBottomColor: '#1E2F23',
  },
  headerLeft: {
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#255D35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C3723',
  },
  headerTitleDark: {
    color: '#E8F5E9',
  },
  signOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  navScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EAE7E0',
  },
  navTabDark: {
    backgroundColor: '#1B2C1F',
  },
  navTabActive: {
    backgroundColor: '#255D35',
  },
  navTabActiveDark: {
    backgroundColor: '#2B7A42',
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  navTabTextDark: {
    color: '#9CB3A0',
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C3723',
    marginBottom: 10,
  },
  sectionHeadingDark: {
    color: '#E8F5E9',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E5DF',
  },
  kpiCardDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C3723',
    marginTop: 6,
  },
  kpiNumberDark: {
    color: '#E8F5E9',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  kpiLabelDark: {
    color: '#9CB3A0',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  alertBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  alertBannerSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  auditBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E5DF',
  },
  auditBoxDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  auditLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  auditDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#255D35',
  },
  auditAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
  },
  auditActionDark: {
    color: '#E8F5E9',
  },
  auditMeta: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  auditMetaDark: {
    color: '#9CB3A0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EAE7E0',
  },
  filterChipDark: {
    backgroundColor: '#1B2C1F',
  },
  filterChipActive: {
    backgroundColor: '#255D35',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
  },
  filterChipTextDark: {
    color: '#9CB3A0',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E5DF',
  },
  cardDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C3723',
  },
  cardTitleDark: {
    color: '#E8F5E9',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  cardSubtitleDark: {
    color: '#9CB3A0',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusApproved: {
    backgroundColor: '#E8F5EA',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusUnverified: {
    backgroundColor: '#F3F4F6',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
  },
  verifDetailsBox: {
    backgroundColor: '#F7F9F6',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  verifDetailText: {
    fontSize: 12,
    color: '#444',
    marginBottom: 3,
  },
  verifDetailTextDark: {
    color: '#C0D5C5',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#255D35',
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E5DF',
    marginBottom: 10,
  },
  searchBarDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1C3723',
    marginLeft: 8,
  },
  searchInputDark: {
    color: '#E8F5E9',
  },
  roleFilterScroll: {
    marginBottom: 12,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EAE7E0',
    marginRight: 6,
  },
  roleChipDark: {
    backgroundColor: '#1B2C1F',
  },
  roleChipActive: {
    backgroundColor: '#255D35',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
  },
  roleChipTextDark: {
    color: '#9CB3A0',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  userMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#255D35',
  },
  stepperWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  stepperBtn: {
    backgroundColor: '#EAE7E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepperBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  verifyToggleBtn: {
    backgroundColor: '#255D35',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  verifyToggleBtnRevoke: {
    backgroundColor: '#DC2626',
  },
  verifyToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hashStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5EA',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hashStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#255D35',
  },
  traceMetadataBox: {
    backgroundColor: '#F7F9F6',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  metaRow: {
    fontSize: 12,
    color: '#444',
    marginBottom: 3,
  },
  metaRowDark: {
    color: '#C0D5C5',
  },
  hashBox: {
    backgroundColor: '#EEEFEA',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  hashLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#666',
  },
  hashValue: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#255D35',
    marginTop: 2,
  },
  correctionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  correctionNoticeText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  disputeDesc: {
    fontSize: 12,
    color: '#444',
    lineHeight: 17,
    marginVertical: 6,
  },
  disputeDescDark: {
    color: '#C0D5C5',
  },
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  partyText: {
    fontSize: 11,
    color: '#666',
  },
  partyTextDark: {
    color: '#9CB3A0',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#555',
    marginTop: 12,
  },
  loadingTextDark: {
    color: '#9CB3A0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
    marginTop: 10,
  },
  emptyTitleDark: {
    color: '#C0D5C5',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  emptySubtitleDark: {
    color: '#7E9F85',
  },
  emptyText: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 10,
  },
  emptyTextDark: {
    color: '#9CB3A0',
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalBoxDark: {
    backgroundColor: '#162219',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C3723',
  },
  modalTitleDark: {
    color: '#E8F5E9',
  },
  modalDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginBottom: 10,
  },
  modalDescDark: {
    color: '#9CB3A0',
  },
  modalInput: {
    backgroundColor: '#F7F9F6',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E2E5DF',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalInputDark: {
    backgroundColor: '#1F3124',
    borderColor: '#2A4331',
    color: '#E8F5E9',
  },
  modalBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmRejectBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalConfirmRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
