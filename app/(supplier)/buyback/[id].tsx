import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { contractsService, BuybackAgreement } from '../../../src/services/contracts.service';
import { authService } from '../../../src/services/auth.service';
import { useDarkMode } from '../../../src/store/uiStore';

export default function SupplierBuybackDetailScreen() {
  const [isDark] = useDarkMode();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [agreement, setAgreement] = useState<BuybackAgreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const session = await authService.getSession();
        const supplierId = session?.user?.id || 'supplier-1';
        const list = await contractsService.getSupplierBuybacks(supplierId);
        const found = list.find((a) => a.id === id);
        if (found) {
          setAgreement(found);
        }
      } catch (e) {
        console.warn('Error loading agreement detail:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUpdateStatus = (newStatus: 'active' | 'fulfilled' | 'cancelled') => {
    if (!agreement) return;
    const label = newStatus === 'active' ? 'Activate' : newStatus === 'fulfilled' ? 'Mark Fulfilled' : 'Cancel';

    Alert.alert(
      `${label} Agreement`,
      `Are you sure you want to ${label.toLowerCase()} agreement ${agreement.agreementCode}?`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: label,
          style: newStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            const res = await contractsService.updateBuybackStatus(agreement.id, newStatus);
            if (res.success) {
              setAgreement((prev) => (prev ? { ...prev, status: newStatus } : null));
              Alert.alert('Status Updated', `Agreement is now ${newStatus}.`);
            } else {
              Alert.alert('Error', res.error || 'Failed to update agreement.');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !agreement) {
    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={isDark ? '#4ADE80' : '#187A36'} />
        </View>
      </SafeAreaView>
    );
  }

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

  const badge = getStatusBadge(agreement.status);

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
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
          <Text style={[styles.backPillText, isDark && styles.backPillTextDark]}>
            Agreements
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.agreementCode, isDark && styles.agreementCodeDark]}>
              {agreement.agreementCode}
            </Text>
            <Text style={[styles.cropTitle, isDark && styles.cropTitleDark]}>
              🌾 {agreement.cropName}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Commitment Breakdown Card */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Commitment Breakdown</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Target Volume</Text>
            <Text style={[styles.detailVal, isDark && styles.detailValDark]}>
              {agreement.targetQuantity} {agreement.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Agreed Price per Unit</Text>
            <Text style={[styles.detailVal, isDark && styles.detailValDark]}>
              LKR {agreement.agreedPrice} / {agreement.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>Estimated Delivery Deadline</Text>
            <Text style={[styles.detailVal, isDark && styles.detailValDark]}>
              {agreement.deadline || 'Flexible target'}
            </Text>
          </View>

          <View style={[styles.divider, isDark && styles.dividerDark]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Total Buyback Value</Text>
            <Text style={[styles.totalAmount, isDark && styles.totalAmountDark]}>
              LKR {agreement.totalCommitment.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Farmer Information Card */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Contracted Partner</Text>
          <View style={styles.farmerRow}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.farmerName, isDark && styles.farmerNameDark]}>
                {agreement.farmerName}
              </Text>
              <Text style={[styles.farmerMeta, isDark && styles.farmerMetaDark]}>
                📍 {agreement.farmerDistrict || 'Registered Farm'} • TraceRoot Certified
              </Text>
            </View>
          </View>
          {agreement.notes && (
            <View style={[styles.notesBox, isDark && styles.notesBoxDark]}>
              <Text style={[styles.notesLabel, isDark && styles.notesLabelDark]}>Quality & Delivery Notes:</Text>
              <Text style={[styles.notesText, isDark && styles.notesTextDark]}>{agreement.notes}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {agreement.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleUpdateStatus('active')}
              style={styles.primaryBtn}
            >
              <MaterialCommunityIcons name="check-decagram" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Activate Agreement</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleUpdateStatus('cancelled')}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Cancel Agreement</Text>
            </TouchableOpacity>
          </View>
        )}

        {agreement.status === 'active' && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleUpdateStatus('fulfilled')}
            style={styles.primaryBtn}
          >
            <MaterialCommunityIcons name="trophy-outline" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Mark Agreement Fulfilled</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E2DDD2',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backPillDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  backPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#28402D',
    marginLeft: 3,
  },
  backPillTextDark: {
    color: '#DCE8DE',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  agreementCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7E6F',
  },
  agreementCodeDark: {
    color: '#95A997',
  },
  cropTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginTop: 2,
  },
  cropTitleDark: {
    color: '#F0F5F1',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C3723',
    marginBottom: 12,
  },
  cardTitleDark: {
    color: '#F0F5F1',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13.5,
    color: '#6B7E6F',
  },
  detailLabelDark: {
    color: '#95A997',
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C3723',
  },
  detailValDark: {
    color: '#F0F5F1',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECE7DC',
    marginVertical: 12,
  },
  dividerDark: {
    backgroundColor: '#253B2A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1C3723',
  },
  totalLabelDark: {
    color: '#F0F5F1',
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: '800',
    color: '#187A36',
  },
  totalAmountDark: {
    color: '#4ADE80',
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#187A36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C3723',
  },
  farmerNameDark: {
    color: '#F0F5F1',
  },
  farmerMeta: {
    fontSize: 12.5,
    color: '#6B7E6F',
    marginTop: 2,
  },
  farmerMetaDark: {
    color: '#95A997',
  },
  notesBox: {
    backgroundColor: '#F7F5EE',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  notesBoxDark: {
    backgroundColor: '#1E2F22',
  },
  notesLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#344E39',
  },
  notesLabelDark: {
    color: '#98B39B',
  },
  notesText: {
    fontSize: 13,
    color: '#1C3723',
    marginTop: 2,
  },
  notesTextDark: {
    color: '#F0F5F1',
  },
  actionRow: {
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#187A36',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 22,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
});
