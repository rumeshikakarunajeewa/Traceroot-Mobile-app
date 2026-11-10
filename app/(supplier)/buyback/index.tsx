import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { contractsService, BuybackAgreement } from '../../../src/services/contracts.service';
import { authService } from '../../../src/services/auth.service';
import { useDarkMode } from '../../../src/store/uiStore';

type FilterTab = 'All' | 'Pending' | 'Active' | 'Fulfilled';

export default function SupplierBuybackScreen() {
  const [isDark] = useDarkMode();
  const [agreements, setAgreements] = useState<BuybackAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  // Modal State for New Buyback Agreement
  const [modalVisible, setModalVisible] = useState(false);
  const [cropName, setCropName] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadAgreements = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setIsLoading(true);

      const session = await authService.getSession();
      const supplierId = session?.user?.id || 'supplier-1';

      const data = await contractsService.getSupplierBuybacks(supplierId);
      setAgreements(data);
    } catch (err) {
      console.warn('Error loading buyback agreements:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAgreements();

    // Subscribe to realtime changes
    let unsubscribe: (() => void) | undefined;
    authService.getSession().then((session) => {
      const supplierId = session?.user?.id || 'supplier-1';
      unsubscribe = contractsService.subscribeToBuybacks(supplierId, () => {
        loadAgreements(true);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadAgreements]);

  const onRefresh = () => {
    loadAgreements(true);
  };

  const filteredAgreements = useMemo(() => {
    if (activeTab === 'All') return agreements;
    return agreements.filter((a) => a.status.toLowerCase() === activeTab.toLowerCase());
  }, [agreements, activeTab]);

  const stats = useMemo(() => {
    const totalCommitment = agreements
      .filter((a) => a.status !== 'cancelled')
      .reduce((sum, a) => sum + a.totalCommitment, 0);

    const activeCount = agreements.filter((a) => a.status === 'active').length;
    const pendingCount = agreements.filter((a) => a.status === 'pending').length;

    return { totalCommitment, activeCount, pendingCount };
  }, [agreements]);

  const handleCreateAgreement = async () => {
    if (!cropName.trim()) {
      Alert.alert('Validation Error', 'Please enter a crop name.');
      return;
    }
    const qty = parseFloat(targetQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target quantity.');
      return;
    }
    const price = parseFloat(agreedPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid agreed price per kg.');
      return;
    }

    setIsCreating(true);
    try {
      const session = await authService.getSession();
      const supplierId = session?.user?.id || 'supplier-1';

      const res = await contractsService.createBuybackAgreement({
        supplierId,
        farmerId: farmerId.trim() || 'farmer-1',
        cropName: cropName.trim(),
        targetQuantity: qty,
        unit: 'kg',
        agreedPrice: price,
        deadline: deadline.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.agreement) {
        setAgreements((prev) => [res.agreement!, ...prev]);
        setModalVisible(false);
        setCropName('');
        setTargetQuantity('');
        setAgreedPrice('');
        setFarmerId('');
        setDeadline('');
        setNotes('');
        Alert.alert('Agreement Created', `Forward buyback agreement ${res.agreement.agreementCode} has been registered.`);
      } else {
        Alert.alert('Creation Failed', res.error || 'Could not save buyback agreement.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An unexpected error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Active' };
      case 'fulfilled':
        return { bg: '#DBEAFE', text: '#1E40AF', label: 'Fulfilled' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'Cancelled' };
      case 'pending':
      default:
        return { bg: '#FEF3C7', text: '#B45309', label: 'Pending' };
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4ADE80' : '#187A36'}
            colors={['#187A36']}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={[styles.backPill, isDark && styles.backPillDark]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={18}
              color={isDark ? '#DCE8DE' : '#2D4030'}
            />
            <Text style={[styles.backPillText, isDark && styles.backPillTextDark]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setModalVisible(true)}
            style={styles.createPill}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
            <Text style={styles.createPillText}>New Agreement</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>
          Buyback Agreements
        </Text>
        <Text style={[styles.screenSubtitle, isDark && styles.screenSubtitleDark]}>
          Guaranteed harvest buyback contracts with verified farmers
        </Text>

        {/* Overview Banner Card */}
        <View style={[styles.statsCard, isDark && styles.statsCardDark]}>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Total Commitment</Text>
              <Text style={styles.statValue}>
                LKR {stats.totalCommitment.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Active Contracts</Text>
              <Text style={styles.statValue}>{stats.activeCount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{stats.pendingCount}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {(['All', 'Pending', 'Active', 'Fulfilled'] as FilterTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabChip,
                  isDark && styles.tabChipDark,
                  isSelected && styles.tabChipActive,
                  isSelected && isDark && styles.tabChipActiveDark,
                ]}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isDark && styles.tabChipTextDark,
                    isSelected && styles.tabChipTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Agreements List */}
        {isLoading && !refreshing ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={isDark ? '#4ADE80' : '#187A36'} />
          </View>
        ) : filteredAgreements.length > 0 ? (
          filteredAgreements.map((agreement) => {
            const badge = getStatusBadge(agreement.status);
            return (
              <TouchableOpacity
                key={agreement.id}
                activeOpacity={0.88}
                onPress={() => {
                  router.push({
                    pathname: '/(supplier)/buyback/[id]',
                    params: { id: agreement.id },
                  } as any);
                }}
                style={[styles.agreementCard, isDark && styles.agreementCardDark]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.agreementCode, isDark && styles.agreementCodeDark]}>
                      {agreement.agreementCode}
                    </Text>
                    <Text style={[styles.cropTitle, isDark && styles.cropTitleDark]}>
                      🌾 {agreement.cropName}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.farmerMetaRow}>
                  <MaterialCommunityIcons
                    name="account-check-outline"
                    size={16}
                    color={isDark ? '#98B39B' : '#5A6E5D'}
                  />
                  <Text style={[styles.farmerMetaText, isDark && styles.farmerMetaTextDark]}>
                    Farmer: {agreement.farmerName} {agreement.farmerDistrict ? `(${agreement.farmerDistrict})` : ''}
                  </Text>
                </View>

                <View style={[styles.metricsGrid, isDark && styles.metricsGridDark]}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Target Volume</Text>
                    <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                      {agreement.targetQuantity} {agreement.unit}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Agreed Price</Text>
                    <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                      LKR {agreement.agreedPrice} / {agreement.unit}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Commitment</Text>
                    <Text style={[styles.metricValHighlight, isDark && styles.metricValHighlightDark]}>
                      LKR {agreement.totalCommitment.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {agreement.deadline && (
                  <Text style={[styles.deadlineText, isDark && styles.deadlineTextDark]}>
                    📅 Harvest Target: {agreement.deadline}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="handshake-outline"
              size={48}
              color={isDark ? '#4ADE80' : '#8A9E8D'}
            />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No buyback agreements
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              Create forward buyback agreements to contract harvest supplies with partner farmers.
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.emptyBtn}
            >
              <Text style={styles.emptyBtnText}>Create Buyback Agreement</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Agreement Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isCreating) {
            setModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.modalCardDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                New Buyback Agreement
              </Text>
              <TouchableOpacity
                disabled={isCreating}
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={20} color={isDark ? '#FFF' : '#333'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Crop Required</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="e.g. Greenhouse Tomato, Red Onion"
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={cropName}
                onChangeText={setCropName}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Target Volume (kg)</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="e.g. 500"
                    placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                    keyboardType="numeric"
                    value={targetQuantity}
                    onChangeText={setTargetQuantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Agreed Price (LKR/kg)</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="e.g. 185"
                    placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                    keyboardType="numeric"
                    value={agreedPrice}
                    onChangeText={setAgreedPrice}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Partner Farmer ID / Name</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Farmer user ID or leave blank for open pool"
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={farmerId}
                onChangeText={setFarmerId}
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Target Harvest Deadline</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="e.g. 2026-12-15"
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={deadline}
                onChangeText={setDeadline}
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Commitment Terms / Notes</Text>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }, isDark && styles.inputDark]}
                placeholder="Grading quality specs, packaging guidelines..."
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                disabled={isCreating}
                activeOpacity={0.85}
                onPress={handleCreateAgreement}
                style={[styles.submitBtn, isCreating && { opacity: 0.7 }]}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="handshake" size={18} color="#FFF" />
                    <Text style={styles.submitBtnText}>Create Agreement</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E2DDD2',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backPillDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  backPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#28402D',
    marginLeft: 3,
  },
  backPillTextDark: {
    color: '#DCE8DE',
  },
  createPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#187A36',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 4,
  },
  createPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  screenTitleDark: {
    color: '#F0F5F1',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#6B7E6F',
    marginTop: 2,
    marginBottom: 16,
  },
  screenSubtitleDark: {
    color: '#95A997',
  },
  statsCard: {
    backgroundColor: '#187A36',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  statsCardDark: {
    backgroundColor: '#163E21',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#D1E7D5',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#EBE7DD',
  },
  tabChipDark: {
    backgroundColor: '#1E2E21',
  },
  tabChipActive: {
    backgroundColor: '#1C3723',
  },
  tabChipActiveDark: {
    backgroundColor: '#4ADE80',
  },
  tabChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B624E',
  },
  tabChipTextDark: {
    color: '#98B39B',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  agreementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  agreementCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  agreementCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7E6F',
  },
  agreementCodeDark: {
    color: '#95A997',
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C3723',
    marginTop: 2,
  },
  cropTitleDark: {
    color: '#F0F5F1',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  farmerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  farmerMetaText: {
    fontSize: 13,
    color: '#49604C',
  },
  farmerMetaTextDark: {
    color: '#98B39B',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F7F5EE',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  metricsGridDark: {
    backgroundColor: '#1E2F22',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#6B7E6F',
    marginBottom: 2,
  },
  metricLabelDark: {
    color: '#95A997',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C3723',
  },
  metricValDark: {
    color: '#F0F5F1',
  },
  metricValHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#187A36',
  },
  metricValHighlightDark: {
    color: '#4ADE80',
  },
  deadlineText: {
    fontSize: 11.5,
    color: '#6B7E6F',
    marginTop: 4,
  },
  deadlineTextDark: {
    color: '#95A997',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C3723',
    marginTop: 12,
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7E6F',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  emptySubtitleDark: {
    color: '#95A997',
  },
  emptyBtn: {
    backgroundColor: '#187A36',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FAF8F3',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '85%',
  },
  modalCardDark: {
    backgroundColor: '#162218',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1C3723',
  },
  modalTitleDark: {
    color: '#F0F5F1',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#344E39',
    marginTop: 10,
    marginBottom: 4,
  },
  inputLabelDark: {
    color: '#98B39B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4CFBE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#162E1D',
  },
  inputDark: {
    backgroundColor: '#1E2F22',
    borderColor: '#36533B',
    color: '#F0F5F1',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#187A36',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
