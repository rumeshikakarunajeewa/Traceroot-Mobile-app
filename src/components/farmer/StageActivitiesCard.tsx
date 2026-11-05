import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { FarmingStageKeyType, STAGE_ACTIVITIES, StageActivityTemplate } from '../../constants/stages';
import {
  RecentRecordItem,
  CustomStageActivity,
  ActivityApplicabilityRecord,
} from '../../types/farmer.types';

export type ActivityItemStatus = 'pending' | 'completed' | 'not_applicable';

export interface ProcessedActivityItem extends StageActivityTemplate {
  status: ActivityItemStatus;
  isCompleted: boolean;
  isNotApplicable: boolean;
  notApplicableReason?: string;
}

interface StageActivitiesCardProps {
  stageKey: FarmingStageKeyType;
  records: RecentRecordItem[];
  customActivities?: CustomStageActivity[];
  activityApplicabilities?: ActivityApplicabilityRecord[];
  onActivityPress?: (
    activity: StageActivityTemplate,
    status: ActivityItemStatus
  ) => void;
  onAddCustomActivityPress?: () => void;
}

export const StageActivitiesCard: React.FC<StageActivitiesCardProps> = ({
  stageKey,
  records,
  customActivities = [],
  activityApplicabilities = [],
  onActivityPress,
  onAddCustomActivityPress,
}) => {
  const defaultTemplates = STAGE_ACTIVITIES[stageKey] || [];

  // Merge default templates with farmer-created custom activities for this crop and stage
  const customTemplates: StageActivityTemplate[] = customActivities.map((ca) => ({
    id: ca.id,
    name: ca.name,
    matchKeywords: [ca.name.toLowerCase()],
    isCustom: true,
    description: ca.description,
    date: ca.date,
  }));

  const allTemplates = [...defaultTemplates, ...customTemplates];

  // Process status for each activity
  const activitiesWithStatus: ProcessedActivityItem[] = allTemplates.map((template) => {
    // Check if explicitly marked Not Applicable
    const naRecord = activityApplicabilities.find(
      (a) => a.activityId === template.id && a.isNotApplicable
    );
    const isNotApplicable = Boolean(naRecord);

    // Check if qualifying record exists with non-empty notes
    const hasQualifyingRecord = records.some((record) => {
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

    let status: ActivityItemStatus = 'pending';
    if (isNotApplicable) {
      status = 'not_applicable';
    } else if (hasQualifyingRecord) {
      status = 'completed';
    }

    return {
      ...template,
      status,
      isCompleted: status === 'completed',
      isNotApplicable,
      notApplicableReason: naRecord?.reason,
    };
  });

  // Calculate dynamic progress
  const totalCount = activitiesWithStatus.length;
  const notApplicableCount = activitiesWithStatus.filter((a) => a.status === 'not_applicable').length;
  const applicableCount = totalCount - notApplicableCount;
  const completedCount = activitiesWithStatus.filter((a) => a.status === 'completed').length;

  return (
    <View style={styles.cardContainer}>
      {/* Title Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Feather name="check" size={17} color="#215930" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Stage Activities</Text>
        </View>
        <View style={styles.counterRow}>
          {applicableCount === 0 ? (
            <Text style={styles.counterText}>No applicable activities</Text>
          ) : (
            <Text style={styles.counterText}>
              {completedCount}/{applicableCount} completed
            </Text>
          )}
          {notApplicableCount > 0 && (
            <View style={styles.naCounterPill}>
              <Text style={styles.naCounterPillText}>
                {notApplicableCount} Not Applicable
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Checklist items */}
      <View style={styles.listContainer}>
        {activitiesWithStatus.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.activityRow}
            activeOpacity={0.7}
            onPress={() => onActivityPress?.(item, item.status)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.status === 'completed' }}
            accessibilityLabel={`${item.name}, ${item.status}`}
          >
            {item.status === 'completed' ? (
              <View style={styles.checkIconCol}>
                <Feather name="check" size={15} color="#216A36" />
              </View>
            ) : item.status === 'not_applicable' ? (
              <View style={styles.naIconCol}>
                <Feather name="minus-circle" size={15} color="#859C8B" />
              </View>
            ) : (
              <View style={styles.pendingIconCol}>
                <Ionicons name="ellipse-outline" size={15} color="#7A9A80" />
              </View>
            )}

            <View style={styles.activityTextRow}>
              <Text
                style={[
                  styles.activityName,
                  item.status === 'completed'
                    ? styles.activityCompleted
                    : item.status === 'not_applicable'
                    ? styles.activityNotApplicable
                    : styles.activityPending,
                ]}
              >
                {item.status === 'not_applicable'
                  ? `${item.name} – Not Applicable`
                  : item.name}
              </Text>

              {item.isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* + Add Custom Activity Button */}
      {onAddCustomActivityPress && (
        <TouchableOpacity
          style={styles.addCustomBtn}
          activeOpacity={0.8}
          onPress={onAddCustomActivityPress}
        >
          <Feather name="plus" size={15} color="#215930" style={{ marginRight: 6 }} />
          <Text style={styles.addCustomBtnText}>Add Custom Activity</Text>
        </TouchableOpacity>
      )}

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
    flexWrap: 'wrap',
    gap: 6,
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
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#497352',
  },
  naCounterPill: {
    backgroundColor: '#D7E7DC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  naCounterPillText: {
    fontSize: 11,
    color: '#45684E',
    fontWeight: '600',
  },
  listContainer: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
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
  naIconCol: {
    width: 22,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  activityTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  activityNotApplicable: {
    color: '#7D9585',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  customBadge: {
    backgroundColor: '#D1E6D6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1C4A26',
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C3DDC9',
    borderStyle: 'dashed',
  },
  addCustomBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#215930',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#55765F',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
