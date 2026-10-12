import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { FieldItem } from '../../types/farmer.types';

interface CropSummaryCardProps {
  crop: FieldItem;
  onPress: () => void;
  onBookmarkPress?: () => void;
}

export const CropSummaryCard: React.FC<CropSummaryCardProps> = ({
  crop,
  onPress,
  onBookmarkPress,
}) => {
  const cardScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.97,
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

  const totalSegments = crop.totalStages || 5;
  const currentStage = crop.currentStageIndex || 1;

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        style={styles.cardContainer}
        activeOpacity={0.92}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {/* Top Section: Photo with Badges & Overlays */}
        <View style={styles.imageWrapper}>
          {crop.imageUrl ? (
            <Image source={{ uri: crop.imageUrl }} style={styles.cropImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>{crop.cropEmoji}</Text>
            </View>
          )}

          {/* Dark gradient overlay scrim at bottom of image for maximum text contrast */}
          <View style={styles.imageOverlayGradient} />

          {/* Top-Left Environment Pill (e.g. Greenhouse, Open field) */}
          <View style={styles.environmentPill}>
            <Text style={styles.environmentPillText}>
              {crop.environmentType || 'Greenhouse'}
            </Text>
          </View>

          {/* Top-Right Bookmark Button */}
          <TouchableOpacity
            style={styles.bookmarkBtn}
            activeOpacity={0.8}
            onPress={onBookmarkPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="bookmark-o" size={14} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Bottom Photo Overlay Info */}
          <View style={styles.imageBottomRow}>
            <View style={styles.imageTitleGroup}>
              <Text style={styles.cropTitleText}>{crop.cropName}</Text>
              <Text style={styles.startedDateText}>
                Started {crop.startDate || '15 Aug 2026'}
              </Text>
            </View>

            {/* Percentage on bottom right */}
            <View style={styles.percentageGroup}>
              <Text style={styles.percentageText}>{crop.growthPercentage}%</Text>
            </View>
          </View>
        </View>

        {/* 5-Segment Progress Bar */}
        <View style={styles.segmentedProgressBar}>
          {Array.from({ length: totalSegments }).map((_, index) => {
            const isCompleted = index < currentStage;
            return (
              <View
                key={`segment-${index}`}
                style={[
                  styles.segmentBar,
                  isCompleted ? styles.segmentFilled : styles.segmentUnfilled,
                ]}
              />
            );
          })}
        </View>

        {/* Bottom Details & Arrow Action Row */}
        <View style={styles.bottomMetaRow}>
          <View style={styles.metaLeftGroup}>
            {/* Stage Name with soft green underline highlight */}
            <View style={styles.stageNameRow}>
              <Ionicons name="leaf" size={14} color="#457850" style={styles.stageIcon} />
              <View style={styles.stageTextContainer}>
                <Text style={styles.stageNameText}>{crop.stageName}</Text>
                <View style={styles.stageUnderline} />
              </View>
            </View>

            {/* Record count & stage tracker */}
            <View style={styles.recordsCountRow}>
              <Feather name="book-open" size={13} color="#6F8574" style={styles.bookIcon} />
              <Text style={styles.recordsText}>
                {crop.recordCount || 1} records · stage {currentStage} of {totalSegments}
              </Text>
            </View>
          </View>

          {/* Circular Arrow Navigation Button */}
          <View style={styles.actionArrowCircle}>
            <Feather name="arrow-up-right" size={18} color="#DDF0E1" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.2,
    borderColor: '#EAE6DD',
  },
  imageWrapper: {
    width: '100%',
    height: 168,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1C3120',
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE6DD',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  imageOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(8, 22, 12, 0.48)',
  },
  environmentPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(25, 45, 29, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  environmentPillText: {
    color: '#F0F9F2',
    fontSize: 11,
    fontWeight: '600',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(25, 45, 29, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  imageBottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  imageTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  cropTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Georgia',
    letterSpacing: -0.3,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  startedDateText: {
    fontSize: 12,
    color: '#E0EDE3',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  percentageGroup: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Georgia',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  segmentBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  segmentFilled: {
    backgroundColor: '#3E6B46',
  },
  segmentUnfilled: {
    backgroundColor: '#E4DFD5',
  },
  bottomMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  metaLeftGroup: {
    flex: 1,
  },
  stageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stageIcon: {
    marginRight: 6,
  },
  stageTextContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  stageNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#24452B',
  },
  stageUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#BFDEC6',
    borderRadius: 1,
  },
  recordsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookIcon: {
    marginRight: 6,
  },
  recordsText: {
    fontSize: 11.5,
    color: '#657E6B',
    fontWeight: '500',
  },
  actionArrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A3922',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
});
