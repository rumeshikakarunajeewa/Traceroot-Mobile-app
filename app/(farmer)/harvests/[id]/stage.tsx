import React, { useState, useMemo, useRef } from 'react';
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
import { StageActivitiesCard, ActivityItemStatus } from '../../../../src/components/farmer/StageActivitiesCard';
import { RecentRecordCard } from '../../../../src/components/farmer/RecentRecordCard';
import { AddRecordModal } from '../../../../src/components/farmer/AddRecordModal';
import { AddCorrectionModal } from '../../../../src/components/farmer/AddCorrectionModal';
import { ActivityNotesModal } from '../../../../src/components/farmer/ActivityNotesModal';
import { AddCustomActivityModal } from '../../../../src/components/farmer/AddCustomActivityModal';
import { ActivityActionModal } from '../../../../src/components/farmer/ActivityActionModal';
import { StageActionModal } from '../../../../src/components/farmer/StageActionModal';
import { RecentRecordItem } from '../../../../src/types/farmer.types';

export default function StageDetailsScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);
  const recordsSectionY = useRef<number>(320);

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
    customActivities,
    activityApplicabilities,
    stageApplicabilities,
    addRecordToCrop,
    saveActivityNotes,
    addCorrectionToRecord,
    addCustomActivity,
    setActivityApplicability,
    setStageApplicability,
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
  const [addCustomActivityModalVisible, setAddCustomActivityModalVisible] = useState(false);
  const [stageActionModalVisible, setStageActionModalVisible] = useState(false);
  const [activityActionModalVisible, setActivityActionModalVisible] = useState(false);
  const [selectedActivityForAction, setSelectedActivityForAction] = useState<StageActivityTemplate | null>(null);

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

  // Check if current stage is marked Not Applicable
  const currentStageApplicability = useMemo(() => {
    if (!crop) return undefined;
    return stageApplicabilities.find(
      (s) => s.cropId === crop.id && s.stageNumber === activeStageNumber && s.isNotApplicable
    );
  }, [crop, stageApplicabilities, activeStageNumber]);

  // List of all stage numbers marked Not Applicable for this crop
  const notApplicableStageNumbers = useMemo(() => {
    if (!crop) return [];
    return stageApplicabilities
      .filter((s) => s.cropId === crop.id && s.isNotApplicable)
      .map((s) => s.stageNumber);
  }, [crop, stageApplicabilities]);

  // Stage date string formatted for subtitle
  const stageDateText = useMemo(() => {
    if (!crop) return '';
    const cropCurrent = crop.currentStageIndex ?? 3;
    const stageItem = crop.stages?.[activeStageNumber - 1];

    if (
      stageItem?.date &&
      (stageItem.date.includes('–') || stageItem.date.includes('-')) &&
      !stageItem.date.startsWith('Est')
    ) {
      return stageItem.date;
    }

    if (activeStageNumber === cropCurrent) {
      const start = stageItem?.date || '14 Sep';
      return `${start} – Present`;
    } else if (activeStageNumber < cropCurrent) {
      const nextStageItem = crop.stages?.[activeStageNumber];
      const start = stageItem?.date || '15 Aug';
      const end = nextStageItem?.date || '1 Sep';
      return `${start} – ${end}`;
    } else {
      const start = stageItem?.date || '25 Sep';
      return start.includes('Est') ? start : `${start} – Present`;
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

  // Activity click handler: if completed, directly view history; if pending or NA, show options
  const handleActivityPress = (activity: StageActivityTemplate, status: ActivityItemStatus) => {
    if (status === 'completed') {
      setSelectedActivity(activity);
    } else {
      setSelectedActivityForAction(activity);
      setActivityActionModalVisible(true);
    }
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

        {/* Stage Title and Action Menu */}
        <View style={styles.titleAndActionRow}>
          <View style={styles.titleRow}>
            <Text style={styles.titleEmoji}>{activeStageDef.stageEmoji}</Text>
            <Text style={styles.stageTitleText}>
              {activeStageDef.key === 'vegetative_growth'
                ? 'Vegetative Growth'
                : activeStageDef.key === 'harvesting'
                ? 'Harvest Stage'
                : `${activeStageDef.title} Stage`}
            </Text>
            {currentStageApplicability && (
              <View style={styles.headerNaBadge}>
                <Feather name="minus-circle" size={11} color="#6C8373" style={{ marginRight: 3 }} />
                <Text style={styles.headerNaBadgeText}>Not Applicable</Text>
              </View>
            )}
          </View>

          {/* Action Menu (3-dots button) */}
          <TouchableOpacity
            style={styles.actionMenuBtn}
            activeOpacity={0.75}
            onPress={() => setStageActionModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Stage Options"
          >
            <Feather name="more-horizontal" size={20} color="#2D5837" />
          </TouchableOpacity>
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
          notApplicableStageNumbers={notApplicableStageNumbers}
          onSelectStage={(num) => setActiveStageNumber(num)}
        />
      </View>

      {/* Scrollable Stage Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stage Not Applicable Notice Banner (if applicable) */}
        {currentStageApplicability && (
          <View style={styles.stageNABanner}>
            <View style={styles.stageNABannerHeader}>
              <Feather name="minus-circle" size={16} color="#556F5C" style={{ marginRight: 6 }} />
              <Text style={styles.stageNABannerTitle}>Stage Marked as Not Applicable</Text>
            </View>
            <Text style={styles.stageNABannerReason}>
              &quot;{currentStageApplicability.reason}&quot;
            </Text>
            <TouchableOpacity
              style={styles.stageNAReactivateBtn}
              activeOpacity={0.8}
              onPress={() => {
                setStageApplicability({
                  cropId: crop.id,
                  batchId: crop.batchId,
                  stageKey: activeStageDef.key,
                  stageNumber: activeStageNumber,
                  isNotApplicable: false,
                  reason: 'Reactivated by farmer',
                });
                Alert.alert('Stage Reactivated', `${activeStageDef.title} is now active.`);
              }}
            >
              <Ionicons name="refresh" size={13} color="#215930" style={{ marginRight: 4 }} />
              <Text style={styles.stageNAReactivateBtnText}>Reactivate This Stage</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stage Activities Card (with Custom Activities & Not Applicable support) */}
        <StageActivitiesCard
          stageKey={activeStageDef.key}
          records={stageRecords}
          customActivities={customActivities.filter(
            (ca) => ca.cropId === crop.id && ca.stageKey === activeStageDef.key
          )}
          activityApplicabilities={activityApplicabilities.filter(
            (aa) => aa.cropId === crop.id && aa.stageKey === activeStageDef.key
          )}
          onActivityPress={handleActivityPress}
          onAddCustomActivityPress={() => setAddCustomActivityModalVisible(true)}
        />

        {/* Stage Records Header */}
        <View
          style={styles.recordsSectionHeader}
          onLayout={(e) => {
            recordsSectionY.current = e.nativeEvent.layout.y;
          }}
        >
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

      {/* Add Custom Activity Modal */}
      <AddCustomActivityModal
        visible={addCustomActivityModalVisible}
        stageTitle={activeStageDef.title}
        onClose={() => setAddCustomActivityModalVisible(false)}
        onAdd={(data) => {
          return addCustomActivity({
            cropId: crop.id,
            batchId: crop.batchId,
            stageKey: activeStageDef.key,
            name: data.name,
            description: data.description,
            date: data.date,
            notes: data.notes,
          });
        }}
      />

      {/* Activity Action Modal (Add Record / Mark Not Applicable / Reactivate) */}
      <ActivityActionModal
        visible={activityActionModalVisible}
        activity={selectedActivityForAction}
        applicabilityRecord={
          selectedActivityForAction
            ? activityApplicabilities.find(
                (a) =>
                  a.cropId === crop.id &&
                  a.stageKey === activeStageDef.key &&
                  a.activityId === selectedActivityForAction.id
              )
            : undefined
        }
        onClose={() => {
          setActivityActionModalVisible(false);
          setSelectedActivityForAction(null);
        }}
        onAddRecord={() => {
          const act = selectedActivityForAction;
          setActivityActionModalVisible(false);
          setSelectedActivityForAction(null);
          setSelectedActivity(act);
        }}
        onConfirmNotApplicable={(reason, notes) => {
          if (!selectedActivityForAction) return;
          setActivityApplicability({
            cropId: crop.id,
            batchId: crop.batchId,
            stageKey: activeStageDef.key,
            activityId: selectedActivityForAction.id,
            isNotApplicable: true,
            reason,
            additionalNotes: notes,
          });
          setActivityActionModalVisible(false);
          setSelectedActivityForAction(null);
        }}
        onReactivateActivity={() => {
          if (!selectedActivityForAction) return;
          setActivityApplicability({
            cropId: crop.id,
            batchId: crop.batchId,
            stageKey: activeStageDef.key,
            activityId: selectedActivityForAction.id,
            isNotApplicable: false,
            reason: 'Reactivated by farmer',
          });
          setActivityActionModalVisible(false);
          setSelectedActivityForAction(null);
        }}
      />

      {/* Stage Action Modal (View Records / Mark Stage NA / Reactivate) */}
      <StageActionModal
        visible={stageActionModalVisible}
        stageTitle={activeStageDef.title}
        stageNumber={activeStageNumber}
        recordCount={stageRecords.length}
        stageApplicability={currentStageApplicability}
        onClose={() => setStageActionModalVisible(false)}
        onViewRecords={() => {
          setStageActionModalVisible(false);
          scrollViewRef.current?.scrollTo({ y: recordsSectionY.current || 300, animated: true });
        }}
        onConfirmNotApplicable={(reason) => {
          setStageApplicability({
            cropId: crop.id,
            batchId: crop.batchId,
            stageKey: activeStageDef.key,
            stageNumber: activeStageNumber,
            isNotApplicable: true,
            reason,
          });
          setStageActionModalVisible(false);
        }}
        onReactivateStage={() => {
          setStageApplicability({
            cropId: crop.id,
            batchId: crop.batchId,
            stageKey: activeStageDef.key,
            stageNumber: activeStageNumber,
            isNotApplicable: false,
            reason: 'Reactivated by farmer',
          });
          setStageActionModalVisible(false);
        }}
      />

      {/* Activity Notes Modal (Interactive Stage Checklist & Crop-Specific Form) */}
      <ActivityNotesModal
        visible={!!selectedActivity}
        activity={selectedActivity}
        cropName={crop.cropName}
        stageName={activeStageDef.title}
        stageKey={activeStageDef.key}
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
  titleAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  titleEmoji: {
    fontSize: 22,
  },
  stageTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#142E19',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  headerNaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEFE9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  headerNaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#496350',
  },
  actionMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageSubtitleText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#67816E',
  },

  /* Stage NA Banner */
  stageNABanner: {
    backgroundColor: '#EDF3EE',
    borderWidth: 1,
    borderColor: '#D4E2D7',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 6,
  },
  stageNABannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stageNABannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#24492C',
  },
  stageNABannerReason: {
    fontSize: 13,
    color: '#4B6752',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  stageNAReactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BDDEC5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stageNAReactivateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#215930',
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
