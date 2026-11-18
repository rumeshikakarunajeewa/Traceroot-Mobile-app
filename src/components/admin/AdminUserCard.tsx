import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminUserItem } from '../../services/admin.service';

interface AdminUserCardProps {
  user: AdminUserItem;
  isDark: boolean;
  onToggleVerification: (user: AdminUserItem) => void;
  onAdjustTrustScore: (user: AdminUserItem, delta: number) => void;
}

export const AdminUserCard: React.FC<AdminUserCardProps> = ({
  user,
  isDark,
  onToggleVerification,
  onAdjustTrustScore,
}) => {
  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{user.fullName}</Text>
          <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
            Role: {user.role.toUpperCase()} • {user.district || 'Sri Lanka'}
          </Text>
          {user.email ? (
            <Text style={[styles.cardMeta, isDark && styles.cardMetaDark]}>{user.email}</Text>
          ) : null}
        </View>

        <View
          style={[
            styles.statusPill,
            user.isVerified ? styles.statusApproved : styles.statusUnverified,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              user.isVerified ? styles.statusApprovedText : styles.statusUnverifiedText,
            ]}
          >
            {user.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
          </Text>
        </View>
      </View>

      {/* Role specific metadata */}
      {user.farmName || user.roleDetails?.companyName ? (
        <View style={[styles.detailsBox, isDark && styles.detailsBoxDark]}>
          {user.farmName ? (
            <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
              Farm: <Text style={styles.boldText}>{user.farmName}</Text>
            </Text>
          ) : null}
          {user.roleDetails?.companyName ? (
            <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
              Company: <Text style={styles.boldText}>{user.roleDetails.companyName}</Text>
            </Text>
          ) : null}
          {user.roleDetails?.acreage ? (
            <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
              Acreage: <Text style={styles.boldText}>{user.roleDetails.acreage} Acres</Text>
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.userMetricsRow, isDark && styles.userMetricsRowDark]}>
        <View style={[styles.trustBadge, isDark && styles.trustBadgeDark]}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#255D35" />
          <Text style={styles.trustBadgeText}>{user.trustScore}% Trust</Text>
        </View>

        {/* Trust Score Stepper */}
        <View style={styles.stepperWrap}>
          <TouchableOpacity
            style={[styles.stepperBtn, isDark && styles.stepperBtnDark]}
            onPress={() => onAdjustTrustScore(user, -5)}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepperBtnText, isDark && styles.stepperBtnTextDark]}>-5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stepperBtn, isDark && styles.stepperBtnDark]}
            onPress={() => onAdjustTrustScore(user, 5)}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepperBtnText, isDark && styles.stepperBtnTextDark]}>+5</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Toggle */}
        <TouchableOpacity
          style={[styles.verifyToggleBtn, user.isVerified && styles.verifyToggleBtnRevoke]}
          onPress={() => onToggleVerification(user)}
          activeOpacity={0.8}
        >
          <Text style={styles.verifyToggleBtnText}>
            {user.isVerified ? 'Revoke' : 'Verify'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 6,
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
  cardMeta: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  cardMetaDark: {
    color: '#7E9F85',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusApproved: {
    backgroundColor: '#E8F5EA',
  },
  statusUnverified: {
    backgroundColor: '#F3F4F6',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusApprovedText: {
    color: '#15803D',
  },
  statusUnverifiedText: {
    color: '#6B7280',
  },
  detailsBox: {
    backgroundColor: '#F7F9F6',
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  detailsBoxDark: {
    backgroundColor: '#1D2E22',
  },
  detailText: {
    fontSize: 11,
    color: '#444',
    marginBottom: 2,
  },
  detailTextDark: {
    color: '#C0D5C5',
  },
  boldText: {
    fontWeight: '700',
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
  userMetricsRowDark: {
    borderTopColor: '#24382A',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trustBadgeDark: {
    backgroundColor: '#1F3424',
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
    paddingVertical: 5,
    borderRadius: 6,
  },
  stepperBtnDark: {
    backgroundColor: '#24382A',
  },
  stepperBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  stepperBtnTextDark: {
    color: '#E8F5E9',
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
});
