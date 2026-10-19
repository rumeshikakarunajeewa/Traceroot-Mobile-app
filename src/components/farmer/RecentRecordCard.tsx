import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RecentRecordItem } from '../../types/farmer.types';

interface RecentRecordCardProps {
  record: RecentRecordItem;
  onPress: () => void;
  onAddCorrectionPress?: () => void;
}

export const RecentRecordCard: React.FC<RecentRecordCardProps> = ({
  record,
  onPress,
  onAddCorrectionPress,
}) => {
  const cardScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  // If it's a compact record (e.g. TR-0047 Growth Observation row)
  if (record.isCompact) {
    return (
      <Animated.View style={[styles.compactWrapper, { transform: [{ scale: cardScale }] }]}>
        <TouchableOpacity
          style={styles.compactContainer}
          activeOpacity={0.88}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          {/* Left shield icon badge */}
          <View style={styles.compactShieldCircle}>
            <Ionicons name="shield-outline" size={16} color="#9C7752" />
          </View>

          {/* Center texts */}
          <View style={styles.compactTextGroup}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {record.title}
            </Text>
            <Text style={styles.compactSubtitle} numberOfLines={1}>
              {record.recordCode} · {record.stage} · {record.date}
            </Text>
          </View>

          {/* Right Chevron */}
          <Feather name="chevron-right" size={18} color="#C4CEC5" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Primary Expanded Record Card (e.g. TR-0051 Fertilizer Applied)
  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.92}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {/* Top Header Row: Record Code and Badges */}
        <View style={styles.headerRow}>
          <Text style={styles.recordCodeText}>{record.recordCode}</Text>

          <View style={styles.badgesGroup}>
            {/* Locked Badge with lock icon */}
            {record.isLocked && (
              <View style={styles.lockedPill}>
                <Ionicons
                  name="lock-closed"
                  size={10.5}
                  color="#635BFF"
                  style={{ marginRight: 3.5 }}
                />
                <Text style={styles.lockedPillText}>Locked</Text>
              </View>
            )}

            {/* Original Badge with doc icon */}
            {record.isOriginal && (
              <View style={styles.originalPill}>
                <Ionicons
                  name="document-text-outline"
                  size={10.5}
                  color="#3B7D54"
                  style={{ marginRight: 3.5 }}
                />
                <Text style={styles.originalPillText}>Original</Text>
              </View>
            )}
          </View>
        </View>

        {/* Title and Stage */}
        <View style={styles.titleSection}>
          <Text style={styles.recordTitle}>{record.title}</Text>
          <Text style={styles.stageText}>{record.stage}</Text>
        </View>

        {/* Metadata chips row: Date, Time, Location */}
        <View style={styles.chipsRow}>
          {/* Date chip */}
          <View style={styles.metaChip}>
            <Feather name="calendar" size={12} color="#8A9E8F" style={{ marginRight: 4.5 }} />
            <Text style={styles.metaChipText}>{record.date}</Text>
          </View>

          {/* Time chip */}
          {record.time && (
            <View style={styles.metaChip}>
              <Feather name="clock" size={12} color="#8A9E8F" style={{ marginRight: 4.5 }} />
              <Text style={styles.metaChipText}>{record.time}</Text>
            </View>
          )}

          {/* Location chip */}
          {record.location && (
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={12} color="#B54A34" style={{ marginRight: 3 }} />
              <Text style={styles.metaChipText}>{record.location}</Text>
            </View>
          )}
        </View>

        {/* Inputs Pills: e.g. NPK 2kg, Water 5L */}
        {record.inputs && record.inputs.length > 0 && (
          <View style={styles.inputsRow}>
            {record.inputs.map((item, idx) => (
              <View key={`input-${idx}`} style={styles.inputPill}>
                <Text style={styles.inputPillText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Photo evidence indicator */}
        {record.photoEvidenceAttached && (
          <View style={styles.evidenceRow}>
            <View style={styles.evidenceDot} />
            <Text style={styles.evidenceText}>Photo evidence attached</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Actions Row: Permanently locked note & + Add Correction button */}
        <View style={styles.bottomActionsRow}>
          <View style={styles.lockedNoteGroup}>
            <Ionicons name="lock-closed" size={12} color="#635BFF" style={{ marginRight: 5 }} />
            <Text style={styles.lockedNoteText}>Record permanently locked</Text>
          </View>

          <TouchableOpacity
            style={styles.addCorrectionBtn}
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation();
              onAddCorrectionPress?.();
            }}
          >
            <Text style={styles.addCorrectionText}>+ Add Correction</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    shadowColor: '#1A3320',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#909F94',
    letterSpacing: 0.3,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEDFF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  lockedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#635BFF',
  },
  originalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F4EB',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  originalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B7045',
  },
  titleSection: {
    marginBottom: 12,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15321B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 2,
  },
  stageText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#768B7C',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5ED',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  metaChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#495D4F',
  },
  inputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 10,
  },
  inputPill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  inputPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#25633C',
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  evidenceDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    backgroundColor: '#2E7D32',
    marginRight: 6.5,
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#657B6C',
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEA',
    marginBottom: 12,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedNoteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  lockedNoteText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7572E8',
  },
  addCorrectionBtn: {
    borderWidth: 1.2,
    borderColor: '#265934',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  addCorrectionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#265934',
  },

  /* Compact Row styles */
  compactWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAE2',
    shadowColor: '#1A3320',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1.5,
  },
  compactShieldCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7F0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#183820',
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#748A7A',
  },
});
