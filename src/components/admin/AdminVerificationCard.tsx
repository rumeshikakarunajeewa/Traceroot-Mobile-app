import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { VerificationRequestItem } from '../../services/admin.service';

interface AdminVerificationCardProps {
  item: VerificationRequestItem;
  isDark: boolean;
  onApprove: (item: VerificationRequestItem) => void;
  onReject: (item: VerificationRequestItem) => void;
}

export const AdminVerificationCard: React.FC<AdminVerificationCardProps> = ({
  item,
  isDark,
  onApprove,
  onReject,
}) => {
  const isPending = item.status === 'pending';
  const isApproved = item.status === 'approved';
  const isRejected = item.status === 'rejected';

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{item.userName}</Text>
          <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
            Role: {item.userRole.toUpperCase()} • {item.userDistrict || 'Sri Lanka'}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            isApproved && styles.statusApproved,
            isRejected && styles.statusRejected,
            isPending && styles.statusPending,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              isApproved && styles.statusApprovedText,
              isRejected && styles.statusRejectedText,
              isPending && styles.statusPendingText,
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.detailsBox, isDark && styles.detailsBoxDark]}>
        <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
          Document: <Text style={styles.boldText}>{item.documentType.replace(/_/g, ' ').toUpperCase()}</Text>
        </Text>
        {item.documentNumber ? (
          <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
            Doc ID / Reg No: <Text style={styles.boldText}>{item.documentNumber}</Text>
          </Text>
        ) : null}
        <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
          Submitted: {new Date(item.submittedAt).toLocaleDateString()}
        </Text>
        {item.reviewerNotes ? (
          <Text style={[styles.detailText, isDark && styles.detailTextDark, { fontStyle: 'italic', marginTop: 2 }]}>
            Notes: {item.reviewerNotes}
          </Text>
        ) : null}
      </View>

      {isPending && (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => onApprove(item)}
            activeOpacity={0.8}
          >
            <Feather name="check" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.approveBtnText}>Approve & Verify</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onReject(item)}
            activeOpacity={0.8}
          >
            <Feather name="x" size={15} color="#DC2626" style={{ marginRight: 4 }} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
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
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusApprovedText: {
    color: '#15803D',
  },
  statusPendingText: {
    color: '#B45309',
  },
  statusRejectedText: {
    color: '#DC2626',
  },
  detailsBox: {
    backgroundColor: '#F7F9F6',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  detailsBoxDark: {
    backgroundColor: '#1D2E22',
  },
  detailText: {
    fontSize: 12,
    color: '#444',
    marginBottom: 3,
  },
  detailTextDark: {
    color: '#C0D5C5',
  },
  boldText: {
    fontWeight: '700',
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
    paddingVertical: 9,
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
});
