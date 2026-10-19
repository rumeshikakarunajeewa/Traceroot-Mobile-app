import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { FieldItem } from '../../types/farmer.types';

interface ActiveJourneyCardProps {
  crop: FieldItem;
  onPress: () => void;
  cardWidth?: number;
  isSingle?: boolean;
  index?: number;
}

export const ActiveJourneyCard: React.FC<ActiveJourneyCardProps> = ({
  crop,
  onPress,
  cardWidth,
  isSingle = false,
  index = 0,
}) => {
  const cardScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Staggered horizontal slide-in and fade entrance
  const entranceFade = useRef(new Animated.Value(0)).current;
  const entranceSlideX = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Stagger each item by ~200-250ms
    const staggerDelay = Math.min(index * 220, 700);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(entranceFade, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(entranceSlideX, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, staggerDelay);

    return () => clearTimeout(timer);
  }, [index]);

  // Animate progress line on mount
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: crop.growthPercentage ? crop.growthPercentage / 100 : 0.55,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [crop.growthPercentage]);

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

  // Predefined stage titles matching standard progression
  const stageLabels = ['Seedling', 'Growth', 'Flowering', 'Fruit', 'Harvest'];
  const currentStageIdx = (crop.currentStageIndex ?? 3) - 1; // 0-indexed (e.g. 2 for Flowering)

  // Construct subtitle like "Greenhouse · Day 47 · since 15 Aug"
  const envText = crop.environmentType || 'Greenhouse';
  const dayText = crop.daysCount ? `Day ${crop.daysCount}` : 'Day 47';
  const sinceText = crop.startDate ? `since ${crop.startDate}` : 'since 15 Aug';
  const subTitle = `${envText} · ${dayText} · ${sinceText}`;

  // Next stage details
  const nextStageTitle = crop.nextStageName || 'Fruit development';
  const nextStageTime = crop.nextStageEst || 'est. next week';

  // Evidence counts
  const recordCount = crop.recordCount ?? 8;
  const evidenceCount = crop.evidenceCount ?? 6;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { width: cardWidth || '100%' },
        {
          opacity: entranceFade,
          transform: [{ scale: cardScale }, { translateX: entranceSlideX }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.92}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {/* 1. TOP HERO PHOTO SECTION */}
        <View style={styles.heroContainer}>
          {crop.imageUrl ? (
            <Image
              source={{ uri: crop.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>{crop.cropEmoji || '🌱'}</Text>
              <Text style={styles.placeholderText}>{crop.cropName}</Text>
            </View>
          )}

          {/* Dark gradient overlay scrim across the entire photo for strong text contrast */}
          <View style={styles.photoScrim} />

          {/* Badges row at top of photo */}
          <View style={styles.topBadgesRow}>
            {/* Left "ACTIVE" badge */}
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>

            {/* Right "Live captured" badge */}
            <View style={styles.liveCapturedBadge}>
              <Feather name="camera" size={11} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.liveCapturedText}>Live captured</Text>
            </View>
          </View>

          {/* Bottom texts over photo */}
          <View style={styles.heroBottomRow}>
            <View style={styles.heroTextGroup}>
              <Text style={styles.cropTitle} numberOfLines={1}>
                {crop.cropName}
              </Text>
              <Text style={styles.cropSubtitle} numberOfLines={1}>
                {subTitle}
              </Text>
            </View>

            {/* 55% display */}
            <View style={styles.percentageContainer}>
              <Text style={styles.percentageNumber}>
                {crop.growthPercentage ?? 55}
                <Text style={styles.percentageSymbol}>%</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 2. STEPPER PROGRESSION TRACK */}
        <View style={styles.stepperContainer}>
          {/* Stepper nodes and connecting lines */}
          <View style={styles.stepTrackRow}>
            {/* Background track line */}
            <View style={styles.trackBackgroundLine} />

            {/* Animated active green track line (between first and 3rd node) */}
            <Animated.View
              style={[
                styles.trackActiveLine,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />

            {/* 5 Nodes */}
            {stageLabels.map((label, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const isFuture = idx > currentStageIdx;

              return (
                <View key={label} style={styles.nodeColumn}>
                  {isPast && (
                    <View style={styles.completedNode}>
                      <Feather name="check" size={13} color="#FFFFFF" />
                    </View>
                  )}
                  {isCurrent && (
                    <View style={styles.currentNode}>
                      <View style={styles.currentNodeDot} />
                    </View>
                  )}
                  {isFuture && <View style={styles.upcomingNode} />}

                  <Text
                    style={[
                      styles.nodeLabel,
                      isCurrent ? styles.nodeLabelCurrent : styles.nodeLabelNormal,
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 3. "NEXT STAGE" CALLOUT PANEL */}
        <View style={styles.nextStageCard}>
          <View style={styles.nextStageTextGroup}>
            <Text style={styles.nextStageLabel}>Next stage</Text>
            <Text style={styles.nextStageDetails} numberOfLines={1}>
              <Text style={styles.nextStageUnderline}>{nextStageTitle}</Text>
              <Text style={styles.nextStageEstText}> · {nextStageTime}</Text>
            </Text>
          </View>

          {/* Circular arrow button */}
          <View style={styles.nextStageArrowCircle}>
            <Feather name="arrow-up-right" size={18} color="#FFFFFF" />
          </View>
        </View>

        {/* Bottom divider line */}
        <View style={styles.footerDivider} />

        {/* 4. FOOTER METADATA STRIP */}
        <View style={styles.footerRow}>
          {/* Records */}
          <View style={styles.footerItem}>
            <Ionicons name="document-text-outline" size={14} color="#6B7F70" style={{ marginRight: 5 }} />
            <Text style={styles.footerItemText}>{recordCount} records</Text>
          </View>

          {/* Evidence */}
          <View style={styles.footerItem}>
            <Feather name="camera" size={13} color="#6B7F70" style={{ marginRight: 5 }} />
            <Text style={styles.footerItemText}>{evidenceCount} with evidence</Text>
          </View>

          {/* Immutable */}
          <View style={styles.footerItem}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#8F6335" style={{ marginRight: 5 }} />
            <Text style={[styles.footerItemText, styles.immutableText]}>Immutable</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    // Width is dynamically controlled via cardWidth prop or 100% when single
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    shadowColor: '#17301C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ECEAE2',
  },

  /* Hero Section */
  heroContainer: {
    width: '100%',
    height: 196,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#354E3A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2D4C33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 44,
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D2E6D5',
  },
  photoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 30, 20, 0.32)',
  },
  topBadgesRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginRight: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#344E41',
    letterSpacing: 0.8,
  },
  liveCapturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  liveCapturedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroBottomRow: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  cropTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  cropSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#EBEBEB',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  percentageContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  percentageNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  percentageSymbol: {
    fontSize: 16,
    fontWeight: '500',
  },

  /* Stepper progression section */
  stepperContainer: {
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  stepTrackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  trackBackgroundLine: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#E7EAE5',
    borderRadius: 2,
    zIndex: 0,
  },
  trackActiveLine: {
    position: 'absolute',
    top: 14,
    left: 20,
    height: 3,
    backgroundColor: '#436B4D',
    borderRadius: 2,
    zIndex: 1,
    maxWidth: '52%',
  },
  nodeColumn: {
    alignItems: 'center',
    zIndex: 2,
    flex: 1,
  },
  completedNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#46684E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  currentNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#46684E',
    shadowColor: '#46684E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  currentNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  upcomingNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4DDD5',
  },
  nodeLabel: {
    fontSize: 11,
    marginTop: 7,
    textAlign: 'center',
  },
  nodeLabelNormal: {
    fontWeight: '500',
    color: '#8A978E',
  },
  nodeLabelCurrent: {
    fontWeight: '700',
    color: '#26422C',
  },

  /* Next stage callout card */
  nextStageCard: {
    backgroundColor: '#F7F6EE',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  nextStageTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  nextStageLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#7B8F80',
    marginBottom: 3,
  },
  nextStageDetails: {
    fontSize: 13,
  },
  nextStageUnderline: {
    fontWeight: '700',
    color: '#213A26',
    textDecorationLine: 'underline',
  },
  nextStageEstText: {
    fontWeight: '500',
    color: '#4B6252',
  },
  nextStageArrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1C3E2A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  /* Footer */
  footerDivider: {
    height: 1,
    backgroundColor: '#F0EFE8',
    marginTop: 14,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A6150',
  },
  immutableText: {
    color: '#8A6031',
    fontWeight: '600',
  },
});
