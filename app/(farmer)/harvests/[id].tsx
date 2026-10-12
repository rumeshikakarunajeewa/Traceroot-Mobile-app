import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { mockFields } from '../../../src/constants/farmerMockData';
import { JourneyStage } from '../../../src/types/farmer.types';

export default function CropFarmingJourneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find matching field or fallback to default
  const field = mockFields.find((f) => f.id === id) || mockFields[0];
  const [stages, setStages] = useState<JourneyStage[]>(field.stages || []);

  const completedStagesCount = stages.filter((s) => s.status === 'done').length;
  const progressPercent = Math.round((completedStagesCount / stages.length) * 100);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4EFE6" />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#15321B" />
        </TouchableOpacity>

        <Text style={styles.navTitle}>Crop Journey</Text>

        <TouchableOpacity
          style={styles.menuCircleBtn}
          activeOpacity={0.7}
          onPress={() => {}}
        >
          <Feather name="more-horizontal" size={20} color="#15321B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Field Hero Banner Card */}
        <View style={styles.heroCard}>
          <Image
            source={{ uri: field.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={styles.badgeRow}>
              <View style={styles.cropCategoryBadge}>
                <Text style={styles.cropCategoryText}>
                  {field.cropEmoji} {field.cropName}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{field.statusBadge}</Text>
              </View>
            </View>

            <Text style={styles.heroFieldName}>{field.name}</Text>
            <Text style={styles.heroSubtext}>
              {field.plotName} · {field.areaAcres} acres · {field.daysToHarvest} days left
            </Text>

            {/* Overall Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Overall Cultivation Progress</Text>
                <Text style={styles.progressPercentText}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Section Header: Journey Stages Timeline */}
        <View style={styles.timelineHeaderRow}>
          <Text style={styles.timelineTitle}>Cultivation Timeline</Text>
          <Text style={styles.timelineSubtitle}>
            {completedStagesCount} of {stages.length} stages complete
          </Text>
        </View>

        {/* Vertical Timeline Steps */}
        <View style={styles.timelineContainer}>
          {stages.map((stage, index) => {
            const isDone = stage.status === 'done';
            const isInProgress = stage.status === 'in_progress';
            const isLast = index === stages.length - 1;

            return (
              <View key={stage.id} style={styles.stageItemRow}>
                {/* Left Timeline Indicator Column */}
                <View style={styles.indicatorColumn}>
                  <View
                    style={[
                      styles.stageNode,
                      isDone
                        ? styles.nodeDone
                        : isInProgress
                        ? styles.nodeInProgress
                        : styles.nodeUpcoming,
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.stageNumberText,
                          isInProgress ? styles.numberInProgress : styles.numberUpcoming,
                        ]}
                      >
                        {stage.stageNumber}
                      </Text>
                    )}
                  </View>

                  {!isLast && (
                    <View
                      style={[
                        styles.timelineConnector,
                        isDone ? styles.connectorDone : styles.connectorUpcoming,
                      ]}
                    />
                  )}
                </View>

                {/* Right Stage Card Details */}
                <View
                  style={[
                    styles.stageCard,
                    isInProgress && styles.stageCardActive,
                  ]}
                >
                  <View style={styles.stageCardHeader}>
                    <View style={styles.stageTitleGroup}>
                      <Text style={styles.stageTitle}>{stage.title}</Text>
                      <Text style={styles.stageDate}>{stage.date}</Text>
                    </View>

                    <View
                      style={[
                        styles.stageStatusBadge,
                        isDone
                          ? styles.statusBadgeDone
                          : isInProgress
                          ? styles.statusBadgeInProgress
                          : styles.statusBadgeUpcoming,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stageStatusBadgeText,
                          isDone
                            ? styles.statusTextDone
                            : isInProgress
                            ? styles.statusTextInProgress
                            : styles.statusTextUpcoming,
                        ]}
                      >
                        {isDone ? 'Completed' : isInProgress ? 'In Progress' : 'Upcoming'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>

                  {/* Notes / Description */}
                  {stage.notes ? (
                    <View style={styles.notesBox}>
                      <Feather name="info" size={13} color="#2E5C38" style={{ marginTop: 2 }} />
                      <Text style={styles.notesText}>{stage.notes}</Text>
                    </View>
                  ) : null}

                  {/* Inputs Used Chips */}
                  {stage.inputsUsed && stage.inputsUsed.length > 0 ? (
                    <View style={styles.inputsRow}>
                      {stage.inputsUsed.map((input, i) => (
                        <View key={i} style={styles.inputChip}>
                          <MaterialCommunityIcons name="tag-outline" size={11} color="#456149" />
                          <Text style={styles.inputChipText}>{input}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* If in-progress, show quick record evidence button */}
                  {isInProgress && (
                    <TouchableOpacity
                      style={styles.recordEvidenceBtn}
                      activeOpacity={0.85}
                      onPress={() => router.push('/(farmer)/harvests/new')}
                    >
                      <Feather name="camera" size={14} color="#FFFFFF" />
                      <Text style={styles.recordEvidenceBtnText}>Log Photo Evidence</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4EFE6',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EAE6DD',
  },
  menuCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EAE6DD',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15321B',
    fontFamily: 'Georgia',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  heroCard: {
    borderRadius: 26,
    overflow: 'hidden',
    height: 220,
    position: 'relative',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 32, 16, 0.65)',
  },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropCategoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cropCategoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 213, 79, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.4)',
  },
  statusBadgeText: {
    color: '#FFE082',
    fontSize: 11,
    fontWeight: '700',
  },
  heroFieldName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Georgia',
    marginBottom: 2,
  },
  heroSubtext: {
    fontSize: 12,
    color: '#D4EAD7',
    fontWeight: '500',
    marginBottom: 10,
  },
  progressSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#D6EED9',
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercentText: {
    color: '#65D446',
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#65D446',
  },
  timelineHeaderRow: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15321B',
    fontFamily: 'Georgia',
  },
  timelineSubtitle: {
    fontSize: 12,
    color: '#657E6B',
    marginTop: 2,
    fontWeight: '500',
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  stageItemRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  indicatorColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  stageNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeDone: {
    backgroundColor: '#1E6330',
  },
  nodeInProgress: {
    backgroundColor: '#E86629',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#E86629',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeUpcoming: {
    backgroundColor: '#DCD8CE',
  },
  stageNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  numberInProgress: {
    color: '#FFFFFF',
  },
  numberUpcoming: {
    color: '#7E8B81',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  connectorDone: {
    backgroundColor: '#1E6330',
  },
  connectorUpcoming: {
    backgroundColor: '#DCD8CE',
  },
  stageCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: '#ECEAE2',
  },
  stageCardActive: {
    borderColor: '#E86629',
    backgroundColor: '#FFFAF5',
  },
  stageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stageTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15321B',
    marginBottom: 2,
  },
  stageDate: {
    fontSize: 11,
    color: '#7A8F7F',
    fontWeight: '500',
  },
  stageSubtitle: {
    fontSize: 12,
    color: '#4C6351',
    fontWeight: '500',
    marginBottom: 8,
  },
  stageStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  stageStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeDone: {
    backgroundColor: '#E8F5E9',
  },
  statusTextDone: {
    color: '#1E6330',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeInProgress: {
    backgroundColor: '#FFF2E8',
  },
  statusTextInProgress: {
    color: '#E86629',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeUpcoming: {
    backgroundColor: '#F5F5F0',
  },
  statusTextUpcoming: {
    color: '#88988C',
    fontSize: 10,
    fontWeight: '600',
  },
  notesBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F4F9F5',
    padding: 9,
    borderRadius: 12,
    marginBottom: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 11,
    color: '#2E5C38',
    lineHeight: 15,
    fontWeight: '500',
  },
  inputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  inputChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEAE2',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  inputChipText: {
    fontSize: 10,
    color: '#456149',
    fontWeight: '600',
  },
  recordEvidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E6330',
    paddingVertical: 9,
    borderRadius: 14,
    gap: 6,
    marginTop: 4,
  },
  recordEvidenceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
