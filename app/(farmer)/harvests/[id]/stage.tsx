import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useCropsStore } from '../../../../src/store/cropStore';
import { FarmingStageDefinition, StageActivityTemplate } from '../../../../src/constants/stages';
import { stageIndex, getStageByNumber } from '../../../../src/utils/stageHelpers';
import { StageProgressIndicator } from '../../../../src/components/farmer/StageProgressIndicator';
import { StageActivitiesCard } from '../../../../src/components/farmer/StageActivitiesCard';
import { RecentRecordCard } from '../../../../src/components/farmer/RecentRecordCard';
import { AddRecordModal } from '../../../../src/components/farmer/AddRecordModal';
import { AddCorrectionModal } from '../../../../src/components/farmer/AddCorrectionModal';
import { ActivityNotesModal } from '../../../../src/components/farmer/ActivityNotesModal';
import { RecentRecordItem } from '../../../../src/types/farmer.types';

export default function StageDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    stageId?: string;
    stageNumber?: string;
    batchId?: string;
  }>();

  const {
    fields,
    getFieldById,
    records,
    addRecordToCrop,
    saveActivityNotes,
    addCorrectionToRecord,
  } = useCropsStore();

  const crop = params.id ? fields.find((f) => f.id === params.id) : getFieldById('field-tomato');

  // Determine initial active viewing stage number (1..5)
  const initialStageNum = useMemo(() => {
    if (params.stageNumber) {
      const parsed = parseInt(params.stageNumber, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) return parsed;
    }
    if (params.stageId) {
      return stageIndex(params.stageId);
    }
    return crop?.currentStageIndex ?? 3;
  }, [params.stageNumber, params.stageId, crop?.currentStageIndex]);

  const [activeStageNumber, setActiveStageNumber] = useState<number>(initialStageNum);

  // Modal states
  const [addRecordModalVisible, setAddRecordModalVisible] = useState(false);
  const [correctionTargetRecord, setCorrectionTargetRecord] = useState<RecentRecordItem | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<StageActivityTemplate | null>(null);

  // Active stage definition
  const activeStageDef: FarmingStageDefinition = getStageByNumber(activeStageNumber);

  // Filter records belonging to this crop and active stage
  const stageRecords = useMemo(() => {
    if (!crop) return [];
    return records
      .filter((rec) => {
        const matchesCrop = rec.cropId === crop.id;
        if (!matchesCrop) return false;
        const recStageNum = stageIndex(rec.stage);
        return recStageNum === activeStageNumber;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [crop, records, activeStageNumber]);

  // Stage date string formatted for subtitle
  const stageDateText = useMemo(() => {
    if (!crop) return '';
    const cropCurrent = crop.currentStageIndex ?? 3;
    if (activeStageNumber === cropCurrent) {
      const currentStageItem = crop.stages?.[activeStageNumber - 1];
      const start = currentStageItem?.date || '14 Sep';
      return `${start} – Present`;
    } else if (activeStageNumber < cropCurrent) {
      const stageItem = crop.stages?.[activeStageNumber - 1];
      const nextStageItem = crop.stages?.[activeStageNumber];
      const start = stageItem?.date || '15 Aug';
      const end = nextStageItem?.date || '1 Sep';
      return `${start} – ${end}`;
    } else {
      const stageItem = crop.stages?.[activeStageNumber - 1];
      return stageItem?.date || 'Est. Upcoming';
    }
  }, [crop, activeStageNumber]);

  if (!crop) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <Feather name="alert-circle" size={36} color="#436B4D" />
        <Text style={styles.errorTitle}>Crop Not Found</Text>
        <TouchableOpacity style={styles.backButtonPill} onPress={() => router.back()}>
          <Text style={styles.backButtonPillText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSaveNewRecord = (recordData: {
    recordType: string;
    date: string;
    notes?: string;
    photoUri?: string;
    stage?: string;
  }) => {
    addRecordToCrop(crop.id, {
      recordType: recordData.recordType,
      date: recordData.date,
      notes: recordData.notes,
      photoUri: recordData.photoUri,
      stage: activeStageDef.title,
    });
    Alert.alert('Record Added', `Logged "${recordData.recordType}" for ${activeStageDef.title} stage.`);
  };

  const handleSaveCorrection = (correction: {
    reason: string;
    correctedNotes?: string;
    correctedInputs?: string[];
    photoUri?: string;
  }) => {
    if (!correctionTargetRecord) return;
    const result = addCorrectionToRecord(correctionTargetRecord.recordCode, correction);
    if (result) {
      Alert.alert(
        'Correction Submitted',
        `Linked correction ${result.recordCode} recorded for ${correctionTargetRecord.recordCode}.`
      );
    }
    setCorrectionTargetRecord(null);
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" />

      {/* Top Header Section */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Back navigation button: < Crop Details */}
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={18} color="#48634F" style={{ marginRight: 2 }} />
          <Text style={styles.backButtonText}>Crop Details</Text>
        </TouchableOpacity>

        {/* Stage Title with icon/emoji */}
        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>{activeStageDef.stageEmoji}</Text>
          <Text style={styles.stageTitleText}>
            {activeStageDef.key === 'vegetative_growth'
              ? 'Vegetative Growth'
              : `${activeStageDef.title} Stage`}
          </Text>
        </View>

        {/* Subtitle: Crop Name • Date Range */}
        <Text style={styles.stageSubtitleText}>
          {crop.cropName} • {stageDateText}
        </Text>
      </View>

      {/* Horizontal Progress Indicator */}
      <View style={styles.progressSection}>
        <StageProgressIndicator
          currentCropStageIndex={crop.currentStageIndex ?? 3}
          activeViewingStageNumber={activeStageNumber}
          onSelectStage={(num) => setActiveStageNumber(num)}
        />
      </View>

      {/* Scrollable Stage Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stage Activities Card */}
        <StageActivitiesCard
          stageKey={activeStageDef.key}
          records={stageRecords}
          onActivityPress={(act) => setSelectedActivity(act)}
        />

        {/* Stage Records Header */}
        <View style={styles.recordsSectionHeader}>
          <Text style={styles.recordsSectionTitle}>STAGE RECORDS</Text>
          <Text style={styles.recordsSectionCount}>
            {stageRecords.length} {stageRecords.length === 1 ? 'record' : 'records'}
          </Text>
        </View>

        {/* Records List or Clean Empty State */}
        {stageRecords.length > 0 ? (
          stageRecords.map((record) => (
            <RecentRecordCard
              key={record.id || record.recordCode}
              record={record}
              forceExpanded
              onPress={() => {
                Alert.alert(
                  `${record.recordCode}: ${record.title}`,
                  `Logged on ${record.date} at ${record.time || 'N/A'}\nLocation: ${record.location || crop.name}\n${
                    record.notes ? `\nNotes: ${record.notes}` : ''
                  }`
                );
              }}
              onAddCorrectionPress={() => setCorrectionTargetRecord(record)}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={24} color="#608069" />
            </View>
            <Text style={styles.emptyTitle}>No records logged for this stage</Text>
            <Text style={styles.emptySub}>
              Tap the &quot;+ Add Record&quot; button below to log the first verified activity for {activeStageDef.title}.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              activeOpacity={0.85}
              onPress={() => setAddRecordModalVisible(true)}
            >
              <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddBtnText}>Add First Record</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Floating/Fixed Add Record Action Bar */}
        <View style={styles.addRecordBar}>
          <TouchableOpacity
            style={styles.addRecordButton}
            activeOpacity={0.88}
            onPress={() => setAddRecordModalVisible(true)}
          >
            <Feather name="plus" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addRecordButtonText}>Add Record for {activeStageDef.title}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Record Modal */}
      <AddRecordModal
        visible={addRecordModalVisible}
        cropName={crop.cropName}
        initialStage={activeStageDef.title}
        onClose={() => setAddRecordModalVisible(false)}
        onSave={handleSaveNewRecord}
      />

      {/* Add Correction Modal */}
      <AddCorrectionModal
        visible={!!correctionTargetRecord}
        record={correctionTargetRecord}
        onClose={() => setCorrectionTargetRecord(null)}
        onSave={handleSaveCorrection}
      />

      {/* Activity Notes Modal (Interactive Stage Checklist) */}
      <ActivityNotesModal
        visible={!!selectedActivity}
        activity={selectedActivity}
        cropName={crop.cropName}
        stageName={activeStageDef.title}
        batchId={crop.batchId}
        existingRecords={
          selectedActivity
            ? stageRecords.filter(
                (r) =>
                  (r.activityId === selectedActivity.id ||
                    r.title.toLowerCase().trim() === selectedActivity.name.toLowerCase().trim()) &&
                  Boolean(r.notes && r.notes.trim().length > 0)
              )
            : []
        }
        onClose={() => setSelectedActivity(null)}
        onSave={(notes, photoUri, details, inputs) => {
          if (!selectedActivity) return;
          saveActivityNotes({
            cropId: crop.id,
            batchId: crop.batchId,
            stage: activeStageDef.title,
            activityId: selectedActivity.id,
            activityName: selectedActivity.name,
            notes,
            photoUri,
            details,
            inputs,
          });
          setSelectedActivity(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F3EC',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F3EC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3822',
    marginTop: 12,
    marginBottom: 16,
  },
  backButtonPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1E3C25',
    borderRadius: 20,
  },
  backButtonPillText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /* Header */
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#55725D',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  stageTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#142E19',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  stageSubtitleText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#67816E',
  },

  /* Progress Section */
  progressSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE9E2',
    paddingHorizontal: 12,
  },

  /* Scroll Content */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  /* Section Header */
  recordsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  recordsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#718776',
    letterSpacing: 0.8,
  },
  recordsSectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718776',
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6EAE6',
    marginVertical: 10,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF4EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3721',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#68836E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3C25',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
  },
  emptyAddBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Add Record Button */
  addRecordBar: {
    marginTop: 16,
    marginBottom: 8,
  },
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3C25',
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#1E3C25',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addRecordButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
