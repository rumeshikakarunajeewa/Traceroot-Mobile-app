import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AdminContractItem } from '../../services/admin.service';

interface AdminContractCardProps {
  contract: AdminContractItem;
  isDark: boolean;
}

export const AdminContractCard: React.FC<AdminContractCardProps> = ({ contract, isDark }) => {
  const isFulfilled = contract.status === 'fulfilled';
  const isActive = contract.status === 'active';

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.cardHeader}>
        <View style={styles.codeWrap}>
          <Feather name="file-text" size={15} color="#255D35" />
          <Text style={[styles.codeText, isDark && styles.codeTextDark]}>
            {contract.agreementCode}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            (isFulfilled || isActive) && styles.statusActive,
            !isFulfilled && !isActive && styles.statusPending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              (isFulfilled || isActive) && styles.statusActiveText,
              !isFulfilled && !isActive && styles.statusPendingText,
            ]}
          >
            {contract.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cropRow}>
        <Text style={[styles.cropTitle, isDark && styles.cropTitleDark]}>
          {contract.cropName}
        </Text>
        <Text style={[styles.cropVolume, isDark && styles.cropVolumeDark]}>
          {contract.targetQuantity} {contract.unit} @ Rs. {contract.agreedPrice}
        </Text>
      </View>

      <View style={[styles.partiesBox, isDark && styles.partiesBoxDark]}>
        <View style={styles.partyItem}>
          <Text style={[styles.partyLabel, isDark && styles.partyLabelDark]}>Supplier:</Text>
          <Text style={[styles.partyValue, isDark && styles.partyValueDark]} numberOfLines={1}>
            {contract.supplierFarmName || contract.supplierName}
          </Text>
        </View>

        <View style={styles.partyItem}>
          <Text style={[styles.partyLabel, isDark && styles.partyLabelDark]}>Farmer:</Text>
          <Text style={[styles.partyValue, isDark && styles.partyValueDark]} numberOfLines={1}>
            {contract.farmerFarmName || contract.farmerName}
          </Text>
        </View>
      </View>

      <View style={[styles.footerRow, isDark && styles.footerRowDark]}>
        <Text style={[styles.valueLabel, isDark && styles.valueLabelDark]}>Total Commitment:</Text>
        <Text style={styles.commitmentValue}>
          Rs. {contract.totalCommitment.toLocaleString()}
        </Text>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C3723',
  },
  codeTextDark: {
    color: '#E8F5E9',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#E8F5EA',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusActiveText: {
    color: '#15803D',
  },
  statusPendingText: {
    color: '#B45309',
  },
  cropRow: {
    marginBottom: 8,
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#255D35',
  },
  cropTitleDark: {
    color: '#4ADE80',
  },
  cropVolume: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  cropVolumeDark: {
    color: '#9CB3A0',
  },
  partiesBox: {
    backgroundColor: '#F7F9F6',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  partiesBoxDark: {
    backgroundColor: '#1D2E22',
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyLabel: {
    fontSize: 11,
    color: '#888',
    width: 65,
  },
  partyLabelDark: {
    color: '#7E9F85',
  },
  partyValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  partyValueDark: {
    color: '#E8F5E9',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  footerRowDark: {
    borderTopColor: '#24382A',
  },
  valueLabel: {
    fontSize: 11,
    color: '#666',
  },
  valueLabelDark: {
    color: '#9CB3A0',
  },
  commitmentValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#255D35',
  },
});
