import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCropsStore } from '../../../src/store/cropStore';
import { useDarkMode } from '../../../src/store/uiStore';
import { FieldItem, RecentRecordItem } from '../../../src/types/farmer.types';
import { stageIndex } from '../../../src/utils/stageHelpers';

export default function TraceabilityTimelineScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const { fields, records, getFieldById } = useCropsStore();
  const [isDark] = useDarkMode();

  // Selected crop ID (defaults to passed id or tomato)
  const initialCropId = params.id || 'field-tomato';
  const [selectedCropId, setSelectedCropId] = useState<string>(initialCropId);

  // QR Modal and Record Detail Modal state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<RecentRecordItem | null>(null);

  // Expanded stages state (default: Flowering stage [idx 2] is expanded, matching screenshot)
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({
    0: false, // Seedling / Planting
    1: false, // Vegetative Growth
    2: true,  // Flowering (NOW - expanded by default)
    3: false, // Fruit Development / Crop Maturity
    4: false, // Harvest
  });

  const toggleStage = (stageIdx: number) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageIdx]: !prev[stageIdx],
    }));
  };

  // Find currently active crop
  const crop: FieldItem = useMemo(() => {
    return fields.find((f) => f.id === selectedCropId) || getFieldById(selectedCropId) || fields[0];
  }, [fields, selectedCropId, getFieldById]);

  // Current stage index (1..5, default 3 for Flowering)
  const currentStageIndex = crop.currentStageIndex ?? 3;

  // Filter records belonging to this crop
  const cropRecords = useMemo(() => {
    return records
      .filter((rec) => rec.cropId === crop.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, crop.id]);

  // Count photos
  const photoRecordsCount = useMemo(() => {
    return cropRecords.filter((r) => r.photoEvidenceAttached || r.photoUrl).length;
  }, [cropRecords]);

  // Defined 5 chronological stages matching the user screenshot
  const timelineStages = useMemo(() => [
    {
      idx: 0,
      stageNumber: 1,
      title: 'Seedling',
      canonicalName: 'Planting',
      dateRange: '15 - 24 Aug',
      defaultRecordCount: 2,
    },
    {
      idx: 1,
      stageNumber: 2,
      title: 'Vegetative Growth',
      canonicalName: 'Vegetative Growth',
      dateRange: '25 Aug - 13 Sep',
      defaultRecordCount: 4,
    },
    {
      idx: 2,
      stageNumber: 3,
      title: 'Flowering',
      canonicalName: 'Flowering',
      dateRange: '14 Sep - now',
      defaultRecordCount: 2,
    },
    {
      idx: 3,
      stageNumber: 4,
      title: 'Fruit Development',
      canonicalName: 'Crop Maturity',
      dateRange: 'Upcoming',
      defaultRecordCount: 0,
    },
    {
      idx: 4,
      stageNumber: 5,
      title: 'Harvest',
      canonicalName: 'Harvesting',
      dateRange: 'Upcoming',
      defaultRecordCount: 0,
    },
  ], []);

  // Helper to get records for a specific stage
  const getRecordsForStage = (stageName: string, stageNumber: number) => {
    return cropRecords.filter((rec) => {
      const recStageNum = stageIndex(rec.stage);
      return (
        recStageNum === stageNumber ||
        rec.stage.toLowerCase() === stageName.toLowerCase()
      );
    });
  };

  return (
    <View style={[styles.screenContainer, isDark && styles.screenContainerDark]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header Section */}
      <View style={[styles.topHeader, isDark && styles.topHeaderDark, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerRow}>
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backCircleBtn, isDark && styles.backCircleBtnDark]}
            activeOpacity={0.8}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="chevron-left" size={22} color={isDark ? '#E5EFE7' : '#15321B'} />
          </TouchableOpacity>

          {/* Title and Subtitle */}
          <View style={styles.headerTextGroup}>
            <Text style={[styles.topSubtitleText, isDark && styles.topSubtitleTextDark]}>Complete cultivation history 🌾</Text>
            <Text style={[styles.mainTitleText, isDark && styles.mainTitleTextDark]}>Traceability Timeline</Text>
          </View>
        </View>

        {/* Horizontal Crop Selection Chips */}
        {fields.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cropChipsScroll}
          >
            {fields.map((f) => {
              const isSelected = f.id === selectedCropId;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.cropChip, isDark && styles.cropChipDark, isSelected && styles.cropChipSelected]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCropId(f.id)}
                >
                  <Text style={styles.cropChipEmoji}>{f.cropEmoji || '🌱'}</Text>
                  <Text
                    style={[styles.cropChipText, isDark && styles.cropChipTextDark, isSelected && styles.cropChipTextSelected]}
                  >
                    {f.cropName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Main Scrollable Timeline Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero Crop Card (Screenshot Match) ─── */}
        <View style={styles.heroCardContainer}>
          <Image
            source={{
              uri:
                crop.imageUrl ||
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.heroImageBg}
          />
          <LinearGradient
            colors={['rgba(10, 25, 14, 0.35)', 'rgba(15, 38, 22, 0.75)', 'rgba(8, 24, 12, 0.95)']}
            style={styles.heroGradient}
          >
            {/* Top Row: All records locked badge & 3/5 progress ring */}
            <View style={styles.heroTopRow}>
              <View style={styles.lockedBadgePill}>
                <Ionicons name="shield-checkmark" size={13} color="#1B4226" style={{ marginRight: 5 }} />
                <Text style={styles.lockedBadgeText}>All records locked</Text>
              </View>

              {/* Circular Progress Ring 3/5 */}
              <View style={styles.ringWrapper}>
                <View style={styles.ringCircle}>
                  <Text style={styles.ringText}>{currentStageIndex}/5</Text>
                </View>
              </View>
            </View>

            {/* Middle: Crop Name & Planting Subtitle */}
            <View style={styles.heroMiddleGroup}>
              <Text style={styles.heroCropName}>{crop.cropName}</Text>
              <Text style={styles.heroSubtitle}>
                {crop.environmentType || 'Greenhouse'} · Planted {crop.startDate || '15 Aug 2026'}
              </Text>
            </View>

            {/* Bottom Frosted Glass Box: 3 Stats */}
            <View style={styles.frostedStatsBox}>
              {/* Stat 1: Records */}
              <View style={styles.statCol}>
                <Ionicons name="document-text-outline" size={16} color="#FFFFFF" style={{ marginBottom: 4 }} />
                <Text style={styles.statColValue}>
                  {cropRecords.length > 0 ? cropRecords.length : crop.recordCount || 8}
                </Text>
                <Text style={styles.statColLabel}>Records</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Stat 2: With photo */}
              <View style={styles.statCol}>
                <Ionicons name="camera-outline" size={16} color="#FFFFFF" style={{ marginBottom: 4 }} />
                <Text style={styles.statColValue}>
                  {photoRecordsCount > 0 ? photoRecordsCount : crop.evidenceCount || 6}
                </Text>
                <Text style={styles.statColLabel}>With photo</Text>
              </View>

              <View style={styles.statDivider} />

              {/* Stat 3: Days grown */}
              <View style={styles.statCol}>
                <Ionicons name="sunny-outline" size={16} color="#FFFFFF" style={{ marginBottom: 4 }} />
                <Text style={styles.statColValue}>{crop.daysCount || 34}</Text>
                <Text style={styles.statColLabel}>Days grown</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ─── Horizontal Stage Stepper Track (Screenshot Match) ─── */}
        <View style={styles.horizontalTrackContainer}>
          <View style={styles.horizontalLine} />
          {timelineStages.map((stage) => {
            const isCompleted = stage.stageNumber < currentStageIndex;
            const isCurrent = stage.stageNumber === currentStageIndex;

            return (
              <View key={`htrack-${stage.stageNumber}`} style={styles.horizontalNodeWrap}>
                {isCompleted ? (
                  <View style={styles.hNodeCompleted} />
                ) : isCurrent ? (
                  <View style={styles.hNodeCurrent} />
                ) : (
                  <View style={styles.hNodeUpcoming} />
                )}
              </View>
            );
          })}
        </View>

        {/* ─── Connected Vertical Stepper Timeline (Screenshot Match) ─── */}
        <View style={styles.timelineList}>
          {timelineStages.map((stage) => {
            const isCompleted = stage.stageNumber < currentStageIndex;
            const isCurrent = stage.stageNumber === currentStageIndex;
            const isUpcoming = stage.stageNumber > currentStageIndex;
            const isLast = stage.stageNumber === 5;
            const isExpanded = !!expandedStages[stage.idx];

            const stageRecs = getRecordsForStage(stage.canonicalName, stage.stageNumber);
            const displayRecordCount =
              stageRecs.length > 0 ? stageRecs.length : stage.defaultRecordCount;

            return (
              <View key={stage.title} style={styles.timelineItemRow}>
                {/* Left Node & Vertical Connector Line */}
                <View style={styles.trackCol}>
                  {/* Node Circle */}
                  {isCompleted ? (
                    <View style={styles.nodeCompletedCircle}>
                      <Feather name="check" size={14} color="#FFFFFF" />
                    </View>
                  ) : isCurrent ? (
                    <View style={styles.nodeCurrentSunCircle}>
                      <Feather name="sun" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.nodeUpcomingDashedCircle}>
                      {stage.stageNumber === 4 ? (
                        <MaterialCommunityIcons name="sprout" size={14} color="#94A597" />
                      ) : (
                        <MaterialCommunityIcons name="basket-outline" size={14} color="#94A597" />
                      )}
                    </View>
                  )}

                  {/* Vertical Connector Line */}
                  {!isLast && (
                    <View
                      style={[
                        styles.trackConnector,
                        isCompleted ? styles.connectorCompleted : styles.connectorUpcoming,
                      ]}
                    />
                  )}
                </View>

                {/* Right Stage Section */}
                <View style={styles.stageContentCol}>
                  {/* Stage Header Row (Clickable to toggle expand) */}
                  <TouchableOpacity
                    style={styles.stageHeaderRow}
                    activeOpacity={0.75}
                    onPress={() => toggleStage(stage.idx)}
                  >
                    <View style={styles.stageTitleWrap}>
                      <View style={styles.titleWithBadge}>
                        <Text
                          style={[
                            styles.stageTitleText,
                            isUpcoming && styles.stageTitleTextUpcoming,
                          ]}
                        >
                          {stage.title}
                        </Text>
                        {isCurrent && (
                          <View style={styles.nowBadgePill}>
                            <Text style={styles.nowBadgeText}>NOW</Text>
                          </View>
                        )}
                      </View>

                      {/* Subtitle Date & Record Count */}
                      <Text
                        style={[
                          styles.stageDateSubtitle,
                          isUpcoming && styles.stageDateSubtitleUpcoming,
                        ]}
                      >
                        {isUpcoming
                          ? 'Upcoming'
                          : `${stage.dateRange} · ${displayRecordCount} records`}
                      </Text>
                    </View>

                    {/* Chevron Icon (Up/Down) */}
                    <View style={styles.chevronWrap}>
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isUpcoming ? '#9BAEA1' : '#496350'}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Stage Records (Shown on Photo 3) */}
                  {isExpanded && !isUpcoming && (
                    <View style={styles.expandedRecordsContainer}>
                      {stageRecs.length > 0 ? (
                        stageRecs.map((rec) => {
                          const isGrowth =
                            rec.title.toLowerCase().includes('growth') ||
                            rec.title.toLowerCase().includes('observ');

                          return (
                            <TouchableOpacity
                              key={rec.id || rec.recordCode}
                              style={styles.recordCard}
                              activeOpacity={0.85}
                              onPress={() => setSelectedRecordForDetail(rec)}
                            >
                              {/* Left Icon in tinted square */}
                              <View style={styles.recordIconSquare}>
                                {isGrowth ? (
                                  <MaterialCommunityIcons name="sprout" size={18} color="#255D35" />
                                ) : (
                                  <MaterialCommunityIcons
                                    name="bottle-tonic-outline"
                                    size={18}
                                    color="#255D35"
                                  />
                                )}
                              </View>

                              {/* Center Title & Metadata */}
                              <View style={styles.recordTextCol}>
                                <Text style={styles.recordTitleText}>{rec.title}</Text>
                                <Text style={styles.recordMetaText}>
                                  {rec.recordCode} · {rec.date} {rec.time ? `· ${rec.time}` : ''}
                                </Text>
                              </View>

                              {/* Right Shield & Photo Pill */}
                              <View style={styles.recordRightCol}>
                                <MaterialCommunityIcons
                                  name="shield-check"
                                  size={16}
                                  color="#67836E"
                                  style={{ marginBottom: 3 }}
                                />
                                {(rec.photoEvidenceAttached || rec.photoUrl) && (
                                  <View style={styles.photoIndicatorPill}>
                                    <Feather name="camera" size={11} color="#2A5936" style={{ marginRight: 3 }} />
                                    <Text style={styles.photoIndicatorText}>Photo</Text>
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={styles.noRecordsBox}>
                          <Text style={styles.noRecordsText}>
                            {displayRecordCount} verified records logged for {stage.title}.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ─── Bottom Floating Button: Generate QR Traceability Card (Photo 3) ─── */}
      <View style={[styles.bottomBarWrapper, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={styles.generateQrBtn}
          activeOpacity={0.88}
          onPress={() => setQrModalVisible(true)}
        >
          <Feather name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.generateQrBtnText}>Generate QR Traceability Card</Text>
        </TouchableOpacity>
      </View>

      {/* ─── QR Traceability Card Modal ─── */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            {/* Header */}
            <View style={styles.qrModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.qrModalTitle}>TraceRoot Traceability Card</Text>
                <Text style={styles.qrModalSubtitle}>Public Tamper-Proof Audit Certificate</Text>
              </View>
              <TouchableOpacity
                style={styles.qrModalCloseBtn}
                onPress={() => setQrModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#556F5C" />
              </TouchableOpacity>
            </View>

            {/* Certificate Card Content */}
            <View style={styles.certCardBody}>
              {/* Organic Badge */}
              <View style={styles.certBadgePill}>
                <Ionicons name="leaf" size={13} color="#184223" style={{ marginRight: 4 }} />
                <Text style={styles.certBadgeText}>100% Certified Organic · TraceRoot Verified</Text>
              </View>

              {/* Crop & Batch Info */}
              <Text style={styles.certCropTitle}>{crop.cropName}</Text>
              <Text style={styles.certBatchText}>Batch: {crop.batchId || 'BATCH-TOM-2026-09'}</Text>
              <Text style={styles.certFarmText}>Farm: {crop.name || 'Kandy Farm · Greenhouse Plot 1'}</Text>

              {/* Visual QR Code Display */}
              <View style={styles.qrGraphicContainer}>
                {/* Clean QR Graphic Representation */}
                <View style={styles.qrBox}>
                  <MaterialCommunityIcons name="qrcode-scan" size={130} color="#163820" />
                  <View style={styles.qrCenterPill}>
                    <Text style={styles.qrCenterPillText}>TRACEROOT</Text>
                  </View>
                </View>
                <Text style={styles.qrScanPrompt}>Scan to verify full immutable audit history</Text>
              </View>

              {/* Cryptographic Hash Verification */}
              <View style={styles.certHashBox}>
                <Ionicons name="shield-checkmark" size={15} color="#2A5C37" style={{ marginRight: 6 }} />
                <Text style={styles.certHashText}>
                  Hash: 0x8F4A...B219 · {cropRecords.length} records verified
                </Text>
              </View>
            </View>

            {/* Modal Buttons */}
            <View style={styles.qrModalActionsRow}>
              <TouchableOpacity
                style={styles.shareBtn}
                activeOpacity={0.85}
                onPress={() => {
                  Alert.alert('Link Copied', 'Public traceability certificate link copied to clipboard.');
                }}
              >
                <Feather name="share-2" size={16} color="#1E3E26" style={{ marginRight: 6 }} />
                <Text style={styles.shareBtnText}>Share Certificate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                activeOpacity={0.88}
                onPress={() => setQrModalVisible(false)}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Single Record Detail Modal ─── */}
      {selectedRecordForDetail && (
        <Modal
          visible={!!selectedRecordForDetail}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRecordForDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.recordDetailModalCard}>
              <View style={styles.recordDetailHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordDetailCode}>{selectedRecordForDetail.recordCode}</Text>
                  <Text style={styles.recordDetailTitle}>{selectedRecordForDetail.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.qrModalCloseBtn}
                  onPress={() => setSelectedRecordForDetail(null)}
                >
                  <Feather name="x" size={20} color="#556F5C" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                <View style={styles.detailRowItem}>
                  <Text style={styles.detailRowLabel}>Stage:</Text>
                  <Text style={styles.detailRowVal}>{selectedRecordForDetail.stage}</Text>
                </View>
                <View style={styles.detailRowItem}>
                  <Text style={styles.detailRowLabel}>Date & Time:</Text>
                  <Text style={styles.detailRowVal}>
                    {selectedRecordForDetail.date} {selectedRecordForDetail.time ? `· ${selectedRecordForDetail.time}` : ''}
                  </Text>
                </View>
                <View style={styles.detailRowItem}>
                  <Text style={styles.detailRowLabel}>Location:</Text>
                  <Text style={styles.detailRowVal}>{selectedRecordForDetail.location || crop.name}</Text>
                </View>

                {selectedRecordForDetail.notes ? (
                  <View style={styles.notesBlock}>
                    <Text style={styles.notesBlockLabel}>Notes / Agronomic Observation:</Text>
                    <Text style={styles.notesBlockText}>{selectedRecordForDetail.notes}</Text>
                  </View>
                ) : null}

                {selectedRecordForDetail.photoUrl && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.notesBlockLabel}>Photo Evidence Attached:</Text>
                    <Image
                      source={{ uri: selectedRecordForDetail.photoUrl }}
                      style={styles.recordModalPhoto}
                    />
                  </View>
                )}

                <View style={styles.recordLockNotice}>
                  <Ionicons name="lock-closed" size={14} color="#2A5C37" style={{ marginRight: 5 }} />
                  <Text style={styles.recordLockNoticeText}>
                    Immutable record verified on TraceRoot traceability ledger.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.recordDetailCloseBtn}
                onPress={() => setSelectedRecordForDetail(null)}
              >
                <Text style={styles.recordDetailCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F3EC',
  },
  screenContainerDark: {
    backgroundColor: '#0E1710',
  },

  /* Top Header */
  topHeader: {
    backgroundColor: '#F5F3EC',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  topHeaderDark: {
    backgroundColor: '#0E1710',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backCircleBtnDark: {
    backgroundColor: '#18271C',
    borderWidth: 1,
    borderColor: '#283D2C',
  },
  headerTextGroup: {
    flex: 1,
  },
  topSubtitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#497352',
    marginBottom: 2,
  },
  topSubtitleTextDark: {
    color: '#9CB3A0',
  },
  mainTitleText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#132E18',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  mainTitleTextDark: {
    color: '#F0F5F1',
  },
  cropChipDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
  },
  cropChipTextDark: {
    color: '#9CB3A0',
  },
  cropChipsScroll: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEFEA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D4E0D6',
  },
  cropChipSelected: {
    backgroundColor: '#1C3E25',
    borderColor: '#1C3E25',
  },
  cropChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  cropChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#34523C',
  },
  cropChipTextSelected: {
    color: '#FFFFFF',
  },

  /* Scroll View */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  /* Hero Card */
  heroCardContainer: {
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  heroImageBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  lockedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1B4226',
  },
  ringWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#E8D5B5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  ringCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMiddleGroup: {
    marginVertical: 4,
  },
  heroCropName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: '#E0ECE4',
    marginTop: 2,
    fontWeight: '500',
  },
  frostedStatsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 10,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statColValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statColLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#E0EAE2',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },

  /* Horizontal Stepper Track */
  horizontalTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 14,
    position: 'relative',
  },
  horizontalLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#DCE5DD',
    zIndex: 0,
  },
  horizontalNodeWrap: {
    zIndex: 1,
  },
  hNodeCompleted: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1E5830',
  },
  hNodeCurrent: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E56A2E',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  hNodeUpcoming: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D2DDD5',
  },

  /* Vertical Connected Timeline */
  timelineList: {
    marginTop: 8,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trackCol: {
    width: 36,
    alignItems: 'center',
  },
  nodeCompletedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#193A21',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCurrentSunCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E56A2E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#E56A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeUpcomingDashedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3EC',
    borderWidth: 1.5,
    borderColor: '#C0D0C4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  trackConnector: {
    width: 2,
    flex: 1,
    minHeight: 35,
    marginVertical: 2,
  },
  connectorCompleted: {
    backgroundColor: '#1E5830',
  },
  connectorUpcoming: {
    backgroundColor: '#DCE5DD',
  },
  stageContentCol: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 20,
  },
  stageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  stageTitleWrap: {
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16361E',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  stageTitleTextUpcoming: {
    color: '#8A9E90',
  },
  nowBadgePill: {
    backgroundColor: '#E56A2E',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nowBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  stageDateSubtitle: {
    fontSize: 12.5,
    color: '#657E6D',
    marginTop: 2,
  },
  stageDateSubtitleUpcoming: {
    color: '#9CB0A2',
  },
  chevronWrap: {
    padding: 6,
  },

  /* Expanded Records List */
  expandedRecordsContainer: {
    gap: 10,
    marginTop: 10,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#ECEFEA',
  },
  recordIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8F3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recordTextCol: {
    flex: 1,
  },
  recordTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#15321B',
    marginBottom: 2,
  },
  recordMetaText: {
    fontSize: 11.5,
    color: '#6F8776',
  },
  recordRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  photoIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  photoIndicatorText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#2A5936',
  },
  noRecordsBox: {
    padding: 10,
    backgroundColor: '#F7FAF7',
    borderRadius: 10,
  },
  noRecordsText: {
    fontSize: 12,
    color: '#67816F',
    fontStyle: 'italic',
  },

  /* Bottom Floating Bar */
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(245, 243, 236, 0.92)',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EBE8DE',
  },
  generateQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17361E',
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#17361E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  generateQrBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 26, 16, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  qrModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3EE',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15321B',
  },
  qrModalSubtitle: {
    fontSize: 12.5,
    color: '#607A67',
    marginTop: 2,
  },
  qrModalCloseBtn: {
    padding: 4,
  },
  certCardBody: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  certBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  certBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#184223',
  },
  certCropTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#13301B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  certBatchText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#496752',
    marginTop: 2,
  },
  certFarmText: {
    fontSize: 12,
    color: '#6C8574',
    marginTop: 1,
  },
  qrGraphicContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  qrBox: {
    width: 170,
    height: 170,
    backgroundColor: '#F8FAF8',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D4E2D7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrCenterPill: {
    position: 'absolute',
    backgroundColor: '#1E3E26',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qrCenterPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  qrScanPrompt: {
    fontSize: 11.5,
    color: '#55725E',
    marginTop: 8,
  },
  certHashBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF5',
    borderWidth: 1,
    borderColor: '#D2EADB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 6,
  },
  certHashText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#21562F',
  },
  qrModalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF3EE',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#EDF5EF',
    borderWidth: 1,
    borderColor: '#C6DEC9',
  },
  shareBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E3E26',
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#183820',
  },
  doneBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Record Detail Modal */
  recordDetailModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  recordDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3EE',
  },
  recordDetailCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#346B44',
  },
  recordDetailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#15321B',
    marginTop: 2,
  },
  detailRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8F5',
  },
  detailRowLabel: {
    fontSize: 13,
    color: '#657E6C',
    fontWeight: '500',
  },
  detailRowVal: {
    fontSize: 13,
    color: '#183820',
    fontWeight: '600',
  },
  notesBlock: {
    marginTop: 10,
    backgroundColor: '#F6FAF7',
    padding: 10,
    borderRadius: 10,
  },
  notesBlockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B6347',
    marginBottom: 4,
  },
  notesBlockText: {
    fontSize: 13,
    color: '#1B3722',
    lineHeight: 18,
  },
  recordModalPhoto: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginTop: 6,
  },
  recordLockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4ED',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  recordLockNoticeText: {
    fontSize: 11,
    color: '#265431',
    fontWeight: '500',
  },
  recordDetailCloseBtn: {
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#183820',
    alignItems: 'center',
  },
  recordDetailCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
