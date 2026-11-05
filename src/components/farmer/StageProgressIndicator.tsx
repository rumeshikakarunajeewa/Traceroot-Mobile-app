import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FARMING_STAGES } from '../../constants/stages';

interface StageProgressIndicatorProps {
  currentCropStageIndex: number; // The crop's actual current stage (1..5)
  activeViewingStageNumber: number; // The stage currently being viewed on this screen (1..5)
  onSelectStage?: (stageNumber: number) => void;
}

export const StageProgressIndicator: React.FC<StageProgressIndicatorProps> = ({
  currentCropStageIndex,
  activeViewingStageNumber,
  onSelectStage,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.trackWrapper}>
        {FARMING_STAGES.map((stage, idx) => {
          const stageNum = stage.stageNumber;
          const isCompleted = stageNum < currentCropStageIndex;
          const isActualCurrent = stageNum === currentCropStageIndex;
          const isViewing = stageNum === activeViewingStageNumber;
          const isLast = idx === FARMING_STAGES.length - 1;
          const nextIsCompleted = stageNum < currentCropStageIndex;

          return (
            <React.Fragment key={stage.key}>
              {/* Node Column */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onSelectStage?.(stageNum)}
                style={styles.nodeColumn}
              >
                {/* Circle Container with optional viewing outline */}
                <View
                  style={[
                    styles.circleWrapper,
                    isViewing && styles.circleWrapperViewing,
                  ]}
                >
                  {isCompleted ? (
                    <View style={styles.circleCompleted}>
                      <Feather name="check" size={13} color="#FFFFFF" />
                    </View>
                  ) : isActualCurrent ? (
                    <View style={styles.circleCurrent}>
                      <Text style={styles.circleCurrentText}>{stageNum}</Text>
                    </View>
                  ) : (
                    <View style={styles.circleUpcoming}>
                      <Text style={styles.circleUpcomingText}>{stageNum}</Text>
                    </View>
                  )}
                </View>

                {/* Short Stage Label */}
                <View style={styles.labelContainer}>
                  <Text
                    style={[
                      styles.stageLabelText,
                      isViewing ? styles.stageLabelViewing : styles.stageLabelNormal,
                    ]}
                    numberOfLines={1}
                  >
                    {stage.shortLabel}
                  </Text>
                  {isViewing && <View style={styles.activeLabelBar} />}
                </View>
              </TouchableOpacity>

              {/* Connecting Line to next node */}
              {!isLast && (
                <View
                  style={[
                    styles.connectorLine,
                    nextIsCompleted
                      ? styles.connectorLineCompleted
                      : styles.connectorLineUpcoming,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  trackWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  nodeColumn: {
    alignItems: 'center',
    zIndex: 2,
    flex: 1,
  },
  circleWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  circleWrapperViewing: {
    borderWidth: 2,
    borderColor: '#2D6A4F',
    backgroundColor: 'rgba(45, 106, 79, 0.08)',
  },
  circleCompleted: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1C3A24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCurrent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1C3A24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCurrentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  circleUpcoming: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAEFE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleUpcomingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A9D8E',
  },
  connectorLine: {
    flex: 0.8,
    height: 2,
    marginTop: 17,
    marginHorizontal: -4,
    zIndex: 1,
  },
  connectorLineCompleted: {
    backgroundColor: '#1C3A24',
  },
  connectorLineUpcoming: {
    backgroundColor: '#E0E6E1',
  },
  labelContainer: {
    alignItems: 'center',
    minHeight: 22,
  },
  stageLabelText: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  stageLabelNormal: {
    color: '#7F9383',
    fontWeight: '500',
  },
  stageLabelViewing: {
    color: '#15321B',
    fontWeight: '700',
  },
  activeLabelBar: {
    width: '80%',
    height: 2,
    backgroundColor: '#2D6A4F',
    borderRadius: 1,
    marginTop: 2,
  },
});
