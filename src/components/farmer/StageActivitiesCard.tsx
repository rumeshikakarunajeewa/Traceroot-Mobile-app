import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { FarmingStageKeyType, STAGE_ACTIVITIES, StageActivityTemplate } from '../../constants/stages';
import { RecentRecordItem } from '../../types/farmer.types';

interface StageActivitiesCardProps {
  stageKey: FarmingStageKeyType;
  records: RecentRecordItem[];
  onActivityPress?: (activity: StageActivityTemplate) => void;
}

export const StageActivitiesCard: React.FC<StageActivitiesCardProps> = ({
  stageKey,
  records,
  onActivityPress,
}) => {
  const templates = STAGE_ACTIVITIES[stageKey] || [];

  // Check which activities have matching records logged
  const activitiesWithStatus = templates.map((template) => {
    let isCompleted = false;

    if (stageKey === 'planting') {
      // For Planting stage, an activity is completed if a record exists with non-empty notes
      isCompleted = records.some((record) => {
        const matchesActivity =
          record.activityId === template.id ||
          record.title.toLowerCase().trim() === template.name.toLowerCase().trim() ||
          template.matchKeywords.some(
            (kw) =>
              record.title.toLowerCase().includes(kw.toLowerCase()) ||
              (record.inputs || []).some((inp) => inp.toLowerCase().includes(kw.toLowerCase()))
          );
        const hasNotes = Boolean(record.notes && record.notes.trim().length > 0);
        return matchesActivity && hasNotes;
      });
    } else {
      // For other stages, preserve existing matching logic
      isCompleted = records.some((record) => {
        const targetText = `${record.title} ${record.notes || ''} ${(record.inputs || []).join(' ')}`.toLowerCase();
        return template.matchKeywords.some((kw) => targetText.includes(kw.toLowerCase()));
      });
    }

    return {
      ...template,
      isCompleted,
    };
  });

  const completedCount = activitiesWithStatus.filter((a) => a.isCompleted).length;

  return (
    <View style={styles.cardContainer}>
      {/* Title Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Feather name="check" size={17} color="#215930" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Stage Activities</Text>
        </View>
        <Text style={styles.counterText}>
          {completedCount}/{templates.length} completed
        </Text>
      </View>

      {/* Checklist items */}
      <View style={styles.listContainer}>
        {activitiesWithStatus.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.activityRow}
            activeOpacity={0.7}
            onPress={() => onActivityPress?.(item)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.isCompleted }}
            accessibilityLabel={`${item.name}, ${item.isCompleted ? 'completed' : 'not completed'}`}
          >
            {item.isCompleted ? (
              <View style={styles.checkIconCol}>
                <Feather name="check" size={15} color="#216A36" />
              </View>
            ) : (
              <View style={styles.pendingIconCol}>
                <Ionicons name="ellipse-outline" size={15} color="#7A9A80" />
              </View>
            )}
            <Text
              style={[
                styles.activityName,
                item.isCompleted ? styles.activityCompleted : styles.activityPending,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Card footer note */}
      <Text style={styles.footerNoteText}>
        Activities will automatically check off after you save notes for each activity.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#EAF4ED',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#D8EADB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#183820',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#497352',
  },
  listContainer: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkIconCol: {
    width: 22,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pendingIconCol: {
    width: 22,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  activityName: {
    fontSize: 14,
    lineHeight: 18,
  },
  activityCompleted: {
    color: '#1E3E26',
    fontWeight: '600',
  },
  activityPending: {
    color: '#52725A',
    fontWeight: '400',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#55765F',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
