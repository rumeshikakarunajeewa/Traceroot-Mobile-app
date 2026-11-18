import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { TraceabilityAuditItem } from '../../services/admin.service';

interface AdminTraceabilityCardProps {
  record: TraceabilityAuditItem;
  isDark: boolean;
}

export const AdminTraceabilityCard: React.FC<AdminTraceabilityCardProps> = ({
  record,
  isDark,
}) => {
  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{record.title}</Text>
          <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
            Crop: {record.cropName} • Farmer: {record.farmerName}
          </Text>
        </View>

        <View style={styles.hashStatusPill}>
          <MaterialCommunityIcons name="shield-lock" size={13} color="#255D35" />
          <Text style={styles.hashStatusText}>Immutable</Text>
        </View>
      </View>

      <View style={[styles.traceMetadataBox, isDark && styles.traceMetadataBoxDark]}>
        <Text style={[styles.metaRow, isDark && styles.metaRowDark]}>
          Stage: <Text style={styles.boldText}>{record.stage.replace(/_/g, ' ')}</Text>
        </Text>
        <Text style={[styles.metaRow, isDark && styles.metaRowDark]}>
          Activity: {record.activityType}
        </Text>
        {record.locationName ? (
          <Text style={[styles.metaRow, isDark && styles.metaRowDark]}>
            Location: {record.locationName}
            {record.latitude && record.longitude
              ? ` (${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)})`
              : ''}
          </Text>
        ) : null}
        <Text style={[styles.metaRow, isDark && styles.metaRowDark]}>
          Recorded: {new Date(record.recordedAt).toLocaleString()}
        </Text>

        {/* SHA-256 Hash Preview */}
        <View style={[styles.hashBox, isDark && styles.hashBoxDark]}>
          <Text style={[styles.hashLabel, isDark && styles.hashLabelDark]}>
            SHA-256 INTEGRITY HASH:
          </Text>
          <Text style={styles.hashValue} numberOfLines={1}>
            {record.integrityHash}
          </Text>
        </View>

        {record.isCorrection && (
          <View style={styles.correctionNotice}>
            <Feather name="info" size={13} color="#D97706" />
            <Text style={styles.correctionNoticeText}>
              Correction Record {record.correctsId ? `(Linked to #${record.correctsId.substring(0, 8)})` : ''}
            </Text>
          </View>
        )}
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
  traceMetadataBoxDark: {
    backgroundColor: '#1D2E22',
  },
  metaRow: {
    fontSize: 12,
    color: '#444',
    marginBottom: 3,
  },
  metaRowDark: {
    color: '#C0D5C5',
  },
  boldText: {
    fontWeight: '700',
  },
  hashBox: {
    backgroundColor: '#EEEFEA',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  hashBoxDark: {
    backgroundColor: '#16241A',
  },
  hashLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#666',
  },
  hashLabelDark: {
    color: '#7E9F85',
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
});
