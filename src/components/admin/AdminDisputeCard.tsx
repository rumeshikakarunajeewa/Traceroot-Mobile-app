import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DisputeItem } from '../../services/admin.service';

interface AdminDisputeCardProps {
  dispute: DisputeItem;
  isDark: boolean;
  onResolve: (dispute: DisputeItem, status: 'resolved' | 'dismissed') => void;
}

export const AdminDisputeCard: React.FC<AdminDisputeCardProps> = ({
  dispute,
  isDark,
  onResolve,
}) => {
  const isResolved = dispute.status === 'resolved';

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
            Case #{dispute.disputeCode}
          </Text>
          <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
            Category: {dispute.category.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            isResolved ? styles.statusApproved : styles.statusPending,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              isResolved ? styles.statusApprovedText : styles.statusPendingText,
            ]}
          >
            {dispute.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.disputeDesc, isDark && styles.disputeDescDark]}>
        {dispute.description}
      </Text>

      <View style={[styles.partiesRow, isDark && styles.partiesRowDark]}>
        <Text style={[styles.partyText, isDark && styles.partyTextDark]} numberOfLines={1}>
          Reporter: <Text style={styles.boldText}>{dispute.reporterName}</Text>
        </Text>
        <Text style={[styles.partyText, isDark && styles.partyTextDark]} numberOfLines={1}>
          Respondent: <Text style={styles.boldText}>{dispute.respondentName}</Text>
        </Text>
      </View>

      {dispute.resolutionNotes ? (
        <View style={[styles.resolutionBox, isDark && styles.resolutionBoxDark]}>
          <Text style={[styles.resolutionLabel, isDark && styles.resolutionLabelDark]}>
            Resolution Notes:
          </Text>
          <Text style={[styles.resolutionText, isDark && styles.resolutionTextDark]}>
            {dispute.resolutionNotes}
          </Text>
        </View>
      ) : null}

      {!isResolved && (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => onResolve(dispute, 'resolved')}
            activeOpacity={0.8}
          >
            <Feather name="check-circle" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.approveBtnText}>Mark Resolved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onResolve(dispute, 'dismissed')}
            activeOpacity={0.8}
          >
            <Text style={styles.rejectBtnText}>Dismiss</Text>
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
  disputeDesc: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
    marginVertical: 6,
  },
  disputeDescDark: {
    color: '#C0D5C5',
  },
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  partiesRowDark: {
    borderTopColor: '#24382A',
  },
  partyText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  partyTextDark: {
    color: '#9CB3A0',
  },
  boldText: {
    fontWeight: '700',
  },
  resolutionBox: {
    backgroundColor: '#F7F9F6',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  resolutionBoxDark: {
    backgroundColor: '#1D2E22',
  },
  resolutionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  resolutionLabelDark: {
    color: '#7E9F85',
  },
  resolutionText: {
    fontSize: 11,
    color: '#333',
    marginTop: 2,
  },
  resolutionTextDark: {
    color: '#E8F5E9',
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
});
