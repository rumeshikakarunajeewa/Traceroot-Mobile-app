import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  AdminHeader,
  AdminStatCard,
  AdminVerificationCard,
  AdminUserCard,
  AdminContractCard,
  AdminTraceabilityCard,
  AdminDisputeCard,
  AdminRejectModal,
} from '../../src/components/admin';
import {
  adminService,
  AdminDashboardStats,
  AdminUserItem,
  VerificationRequestItem,
  TraceabilityAuditItem,
  DisputeItem,
  AdminAuditLogItem,
  AdminContractItem,
} from '../../src/services/admin.service';
import { useAuth } from '../../src/store/authStore';
import { useDarkMode } from '../../src/store/uiStore';
import { UserRole } from '../../src/types/auth.types';

type AdminTab = 'overview' | 'verifications' | 'users' | 'contracts' | 'traceability' | 'disputes';

export default function AdminDashboardScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();

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

  // Contracts tab state
  const [contracts, setContracts] = useState<AdminContractItem[]>([]);
  const [contractSearch, setContractSearch] = useState('');

  // Traceability tab state
  const [auditRecords, setAuditRecords] = useState<TraceabilityAuditItem[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Disputes tab state
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [disputeFilter, setDisputeFilter] = useState<'all' | 'open' | 'resolved'>('all');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);

  const adminId = user?.id || 'admin-fixed-id';

  // Load all platform governance data
  const fetchData = useCallback(async () => {
    try {
      const [
        statsData,
        usersData,
        verifData,
        contractsData,
        traceData,
        disputesData,
        logsData,
      ] = await Promise.all([
        adminService.getDashboardOverviewStats(),
        adminService.getUsers(userRoleFilter, userSearch),
        adminService.getVerificationRequests(verifFilter),
        adminService.getContracts(contractSearch),
        adminService.getTraceabilityAuditRecords(auditSearch),
        adminService.getDisputes(disputeFilter),
        adminService.getAdminAuditLogs(15),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setVerifications(verifData);
      setContracts(contractsData);
      setAuditRecords(traceData);
      setDisputes(disputesData);
      setAuditLogs(logsData);
    } catch (err) {
      console.warn('[AdminDashboard] loadDashboardData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRoleFilter, userSearch, verifFilter, contractSearch, auditSearch, disputeFilter]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [
          statsData,
          usersData,
          verifData,
          contractsData,
          traceData,
          disputesData,
          logsData,
        ] = await Promise.all([
          adminService.getDashboardOverviewStats(),
          adminService.getUsers(userRoleFilter, userSearch),
          adminService.getVerificationRequests(verifFilter),
          adminService.getContracts(contractSearch),
          adminService.getTraceabilityAuditRecords(auditSearch),
          adminService.getDisputes(disputeFilter),
          adminService.getAdminAuditLogs(15),
        ]);

        if (isMounted) {
          setStats(statsData);
          setUsers(usersData);
          setVerifications(verifData);
          setContracts(contractsData);
          setAuditRecords(traceData);
          setDisputes(disputesData);
          setAuditLogs(logsData);
        }
      } catch (err) {
        console.warn('[AdminDashboard] load error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userRoleFilter, userSearch, verifFilter, contractSearch, auditSearch, disputeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
              fetchData();
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
      fetchData();
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
    Alert.alert(
      'Confirm Arbitration',
      `Mark dispute #${disp.disputeCode} as ${resolution}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const res = await adminService.resolveDispute(
              disp.id,
              adminId,
              resolution,
              `Arbitrated as ${resolution} by administrator.`
            );
            if (res.success) {
              Alert.alert('Updated', `Dispute #${disp.disputeCode} marked as ${resolution}.`);
              fetchData();
            } else {
              Alert.alert('Error', res.error || 'Failed to update dispute status.');
            }
          },
        },
      ]
    );
  };

  // ── RENDER TAB VIEWS ──────────────────────────────────────────────

  const renderOverviewTab = () => {
    if (!stats) return null;

    return (
      <View style={styles.tabContent}>
        {/* KPI Grid */}
        <Text style={[styles.sectionHeading, isDark && styles.sectionHeadingDark]}>Platform Metrics</Text>
        <View style={styles.kpiGrid}>
          <AdminStatCard
            icon="account-group"
            iconColor="#255D35"
            value={stats.totalUsers}
            label="Total Users"
            isDark={isDark}
          />
          <AdminStatCard
            icon="sprout"
            iconColor="#16A34A"
            value={stats.totalFarmers}
            label="Farmers"
            isDark={isDark}
          />
          <AdminStatCard
            icon="cart"
            iconColor="#0284C7"
            value={stats.totalBuyers}
            label="Buyers"
            isDark={isDark}
          />
          <AdminStatCard
            icon="storefront"
            iconColor="#D97706"
            value={stats.totalSuppliers}
            label="Suppliers"
            isDark={isDark}
          />
          <AdminStatCard
            icon="shield-check"
            iconColor="#059669"
            value={stats.totalRecords}
            label="Ledger Records"
            isDark={isDark}
          />
          <AdminStatCard
            icon="cash-multiple"
            iconColor="#255D35"
            value={`Rs. ${(stats.totalOrderVolumeLkr / 1000).toFixed(0)}k`}
            label="Trade Volume"
            isDark={isDark}
          />
        </View>

        {/* Action Callouts */}
        {stats.pendingVerifications > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => setActiveTab('verifications')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="alert-decagram" size={24} color="#D97706" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.alertBannerTitle}>
                {stats.pendingVerifications} Pending Verification Request
                {stats.pendingVerifications > 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertBannerSubtitle}>
                Review identity documents and business registrations.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Recent Governance Trail */}
        <Text style={[styles.sectionHeading, isDark && styles.sectionHeadingDark, { marginTop: 14 }]}>
          Recent Governance Activity
        </Text>
        <View style={[styles.auditBox, isDark && styles.auditBoxDark]}>
          {auditLogs.length === 0 ? (
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              No administrative actions logged yet.
            </Text>
          ) : (
            auditLogs.slice(0, 6).map((log) => (
              <View key={log.id} style={[styles.auditLogRow, isDark && styles.auditLogRowDark]}>
                <View style={styles.auditDot} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.auditAction, isDark && styles.auditActionDark]}>
                    {log.action.replace(/_/g, ' ')}
                  </Text>
                  <Text style={[styles.auditMeta, isDark && styles.auditMetaDark]}>
                    Entity: {log.targetEntity} • {new Date(log.createdAt).toLocaleDateString()}
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
              activeOpacity={0.7}
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
            <AdminVerificationCard
              key={item.id}
              item={item}
              isDark={isDark}
              onApprove={handleApproveVerification}
              onReject={handleOpenRejectModal}
            />
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPillScroll}>
          {(['all', 'farmer', 'buyer', 'supplier'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.roleChip,
                isDark && styles.roleChipDark,
                userRoleFilter === r && styles.roleChipActive,
              ]}
              onPress={() => setUserRoleFilter(r)}
              activeOpacity={0.7}
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
            <AdminUserCard
              key={u.id}
              user={u}
              isDark={isDark}
              onToggleVerification={handleToggleUserVerification}
              onAdjustTrustScore={handleAdjustTrustScore}
            />
          ))
        )}
      </View>
    );
  };

  const renderContractsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <Feather name="search" size={18} color={isDark ? '#7E9F85' : '#666'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Filter contracts by code, crop, or party..."
            placeholderTextColor={isDark ? '#5E7D65' : '#999'}
            value={contractSearch}
            onChangeText={setContractSearch}
          />
        </View>

        {contracts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={isDark ? '#4ADE80' : '#255D35'} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No contracts found
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              No buyback agreements recorded on the platform yet.
            </Text>
          </View>
        ) : (
          contracts.map((contract) => (
            <AdminContractCard key={contract.id} contract={contract} isDark={isDark} />
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
            <MaterialCommunityIcons name="shield-check-outline" size={48} color={isDark ? '#4ADE80' : '#255D35'} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No cultivation records found
            </Text>
          </View>
        ) : (
          auditRecords.map((rec) => (
            <AdminTraceabilityCard key={rec.id} record={rec} isDark={isDark} />
          ))
        )}
      </View>
    );
  };

  const renderDisputesTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'open', 'resolved'] as const).map((df) => (
            <TouchableOpacity
              key={df}
              style={[
                styles.filterChip,
                isDark && styles.filterChipDark,
                disputeFilter === df && styles.filterChipActive,
              ]}
              onPress={() => setDisputeFilter(df)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isDark && styles.filterChipTextDark,
                  disputeFilter === df && styles.filterChipTextActive,
                ]}
              >
                {df.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
            <AdminDisputeCard
              key={disp.id}
              dispute={disp}
              isDark={isDark}
              onResolve={handleResolveDispute}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Admin Header */}
      <AdminHeader isDark={isDark} onRefresh={onRefresh} />

      {/* Navigation Tab Bar */}
      <View style={[styles.navBar, isDark && styles.navBarDark]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
          {[
            { key: 'overview', label: 'Overview', icon: 'grid' },
            {
              key: 'verifications',
              label: `Verifications${stats?.pendingVerifications ? ` (${stats.pendingVerifications})` : ''}`,
              icon: 'check-circle',
            },
            { key: 'users', label: 'Users', icon: 'users' },
            { key: 'contracts', label: 'Contracts', icon: 'file-text' },
            { key: 'traceability', label: 'Traceability', icon: 'shield' },
            {
              key: 'disputes',
              label: `Disputes${stats?.openDisputes ? ` (${stats.openDisputes})` : ''}`,
              icon: 'alert-triangle',
            },
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
                activeOpacity={0.7}
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
          {activeTab === 'contracts' && renderContractsTab()}
          {activeTab === 'traceability' && renderTraceabilityTab()}
          {activeTab === 'disputes' && renderDisputesTab()}
        </ScrollView>
      )}

      {/* Reject Verification Modal */}
      <AdminRejectModal
        visible={rejectModalVisible}
        request={selectedReq}
        rejectReason={rejectReason}
        isDark={isDark}
        onReasonChange={setRejectReason}
        onClose={() => setRejectModalVisible(false)}
        onConfirm={handleConfirmReject}
      />
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
  navBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  navBarDark: {
    backgroundColor: '#162219',
    borderBottomColor: '#1E2F23',
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
  auditLogRowDark: {
    borderBottomColor: '#24382A',
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
  horizontalPillScroll: {
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
});
