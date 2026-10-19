import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCropsStore } from '../../../src/store/cropStore';
import { PhotoOptionsModal } from '../../../src/components/farmer/PhotoOptionsModal';
import { AddRecordModal } from '../../../src/components/farmer/AddRecordModal';
import { JourneyStage } from '../../../src/types/farmer.types';

const HERO_HEIGHT = 280;

export default function CropFarmingJourneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Reactive shared crop store so photo changes and new records sync across all dashboard views and crops list
  const { getFieldById, updateFieldPhoto, addRecordToCrop } = useCropsStore();
  const field = getFieldById(id) || getFieldById('field-tomato');

  // Photo change modal state
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string | undefined>(field?.imageUrl);

  // Add Record Modal & Toast State
  const [addRecordModalVisible, setAddRecordModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastFadeAnim = useRef(new Animated.Value(0)).current;

  // Add Record Bar entrance animation
  const addBarTranslateY = useRef(new Animated.Value(60)).current;
  const addBarFadeAnim = useRef(new Animated.Value(0)).current;
  const addBarScale = useRef(new Animated.Value(1)).current;

  // Cross-fade animation on photo change
  const photoFadeAnim = useRef(new Animated.Value(1)).current;

  // Sync image if external store changes
  useEffect(() => {
    if (field?.imageUrl !== currentImageUri) {
      setCurrentImageUri(field?.imageUrl);
    }
  }, [field?.imageUrl]);

  // Animated scroll tracking for parallax hero & collapsing header
  const scrollY = useRef(new Animated.Value(0)).current;

  // Hero parallax and scale interpolation
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [HERO_HEIGHT / 2, 0, -HERO_HEIGHT * 0.45],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.75],
    outputRange: [1, 0.25],
    extrapolate: 'clamp',
  });

  // Collapsing compact header bar opacity
  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT * 0.6, HERO_HEIGHT * 0.9],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Entrance animations for content sections
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(addBarFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(addBarTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const handleSaveRecord = (record: {
    recordType: string;
    date: string;
    notes?: string;
    photoUri?: string;
  }) => {
    if (field) {
      addRecordToCrop(field.id, record);
      showToast(`Record "${record.recordType}" logged successfully!`);
    }
  };

  // Photo handlers with smooth cross-fade
  const applyNewPhoto = (uri?: string) => {
    Animated.sequence([
      Animated.timing(photoFadeAnim, { toValue: 0.2, duration: 150, useNativeDriver: true }),
      Animated.timing(photoFadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    setCurrentImageUri(uri);
    if (field) {
      updateFieldPhoto(field.id, uri);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Access Required',
          'Please grant camera permissions in settings to take photos of your crop.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        // TODO: Upload to Supabase Storage bucket ('crop-photos') and persist in database
        applyNewPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access Required',
          'Please grant photo library access in settings to pick a crop image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        // TODO: Upload to Supabase Storage bucket ('crop-photos') and persist in database
        applyNewPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Could not select photo.');
    }
  };

  const handleRemovePhoto = () => {
    applyNewPhoto(undefined);
  };

  const stages: JourneyStage[] = field?.stages || [];
  const currentStageIndex = field?.currentStageIndex ?? 3;
  const totalStages = field?.totalStages ?? stages.length ?? 5;
  const recordCount = field?.recordCount ?? 8;
  const growthPercentage = field?.growthPercentage ?? 60;
  const evidenceCount = field?.evidenceCount ?? 6;

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. PARALLAX HERO BACKGROUND LAYER */}
      <Animated.View
        style={[
          styles.heroBackgroundContainer,
          {
            height: HERO_HEIGHT,
            transform: [{ translateY: heroTranslateY }, { scale: heroScale }],
            opacity: heroOpacity,
          },
        ]}
      >
        <Animated.View style={{ flex: 1, opacity: photoFadeAnim }}>
          {currentImageUri ? (
            <Image
              source={{ uri: currentImageUri }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>{field?.cropEmoji || '🌱'}</Text>
              <Text style={styles.placeholderText}>Tap camera to add photo</Text>
            </View>
          )}
        </Animated.View>

        {/* Gradient Scrim Overlay */}
        <View style={styles.heroDarkScrim} />

        {/* Camera / Edit button floating on top-right of photo */}
        <TouchableOpacity
          style={[styles.cameraEditButton, { top: insets.top + 60 }]}
          activeOpacity={0.8}
          onPress={() => setPhotoModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="camera" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* 2. TOP FLOATING NAVIGATION BAR */}
      <View style={[styles.topNavBar, { paddingTop: insets.top + 6 }]}>
        {/* Left "< My Crops" Pill Button */}
        <TouchableOpacity
          style={styles.backPillButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={16} color="#FFFFFF" style={{ marginRight: 2 }} />
          <Text style={styles.backPillText}>My Crops</Text>
        </TouchableOpacity>

        {/* Right Bookmark Pill Button */}
        <TouchableOpacity
          style={styles.bookmarkButton}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Saved', `${field?.cropName || 'Crop'} bookmarked!`)}
        >
          <Ionicons name="bookmark-outline" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 3. STICKY COLLAPSED HEADER (Fades in on scroll down) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.compactStickyHeader,
          {
            paddingTop: insets.top + 8,
            opacity: compactHeaderOpacity,
          },
        ]}
      >
        <Text style={styles.compactHeaderTitle} numberOfLines={1}>
          {field?.cropName || 'Crop Journey'}
        </Text>
      </Animated.View>

      {/* 4. MAIN VERTICAL SCROLL CONTENT */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HERO_HEIGHT - 60, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Animated.View
          style={{
            opacity: contentFade,
            transform: [{ translateY: contentSlide }],
          }}
        >
          {/* Header Title & Tag Overlap Group */}
          <View style={styles.titleInfoGroup}>
            <View style={styles.environmentRow}>
              {/* Home icon Greenhouse Pill */}
              <View style={styles.environmentPill}>
                <Ionicons name="home-outline" size={12} color="#2D5C35" style={{ marginRight: 4 }} />
                <Text style={styles.environmentText}>
                  {field?.environmentType || 'Greenhouse'}
                </Text>
              </View>

              <Text style={styles.startedDateText}>
                Started {field?.startDate || '15 Aug 2026'}
              </Text>
            </View>

            {/* Serif Crop Title (e.g. Tomato) */}
            <Text style={styles.mainCropTitle}>
              {field?.cropName || 'Tomato'}
            </Text>
          </View>

          {/* 4 Summary Stats White Cards Strip */}
          <View style={styles.statsCardsRow}>
            {/* 1. Stage */}
            <View style={styles.statCard}>
              <Ionicons name="leaf-outline" size={16} color="#436B4D" style={styles.statIcon} />
              <Text style={styles.statValue}>
                {currentStageIndex}/{totalStages}
              </Text>
              <Text style={styles.statLabel}>Stage</Text>
            </View>

            {/* 2. Records */}
            <View style={styles.statCard}>
              <Ionicons name="document-text-outline" size={16} color="#436B4D" style={styles.statIcon} />
              <Text style={styles.statValue}>{recordCount}</Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>

            {/* 3. Progress */}
            <View style={styles.statCard}>
              <Feather name="bar-chart-2" size={16} color="#436B4D" style={styles.statIcon} />
              <Text style={styles.statValue}>{growthPercentage}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>

            {/* 4. Evidence */}
            <View style={styles.statCard}>
              <Feather name="camera" size={15} color="#436B4D" style={styles.statIcon} />
              <Text style={styles.statValue}>{evidenceCount}</Text>
              <Text style={styles.statLabel}>Evidence</Text>
            </View>
          </View>

          {/* Informational Subtitle Paragraph */}
          <Text style={styles.infoParagraph}>
            Greenhouse tomatoes now in flowering. Every stage below is backed by immutable, live-captured records.
          </Text>

          {/* Section: Farming Journey */}
          <Text style={styles.sectionHeading}>Farming Journey</Text>

          {/* Connected Stepper Timeline */}
          <View style={styles.timelineList}>
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex - 1;
              const isCurrent = idx === currentStageIndex - 1;
              const isUpcoming = idx > currentStageIndex - 1;
              const isLast = idx === stages.length - 1;

              return (
                <View key={stage.id} style={styles.timelineItemRow}>
                  {/* Left Node & Vertical Connector Line */}
                  <View style={styles.timelineTrackCol}>
                    {/* Node Icon */}
                    {isPast && (
                      <View style={styles.nodeDone}>
                        <Feather name="check" size={14} color="#FFFFFF" />
                      </View>
                    )}
                    {isCurrent && (
                      <View style={styles.nodeCurrent}>
                        <Text style={styles.nodeCurrentEmoji}>{stage.stageEmoji || '🌸'}</Text>
                      </View>
                    )}
                    {isUpcoming && (
                      <View style={styles.nodeUpcoming}>
                        <Text style={styles.nodeUpcomingEmoji}>{stage.stageEmoji || '🌱'}</Text>
                      </View>
                    )}

                    {/* Vertical Connector Line */}
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineConnector,
                          isPast ? styles.connectorDone : styles.connectorUpcoming,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Stage Card */}
                  <View
                    style={[
                      styles.stageCard,
                      isCurrent && styles.stageCardCurrent,
                      isUpcoming && styles.stageCardUpcoming,
                    ]}
                  >
                    {/* Top Row: Title, Date, View / Status */}
                    <View style={styles.stageCardHeader}>
                      <Text
                        style={[
                          styles.stageCardTitle,
                          isUpcoming && styles.stageCardTitleUpcoming,
                        ]}
                        numberOfLines={1}
                      >
                        {stage.title}
                      </Text>

                      <View style={styles.stageCardRightHeader}>
                        {stage.date && !isUpcoming && (
                          <Text style={styles.stageDateText}>{stage.date}</Text>
                        )}

                        {isCurrent && (
                          <View style={styles.currentBadgePill}>
                            <Text style={styles.currentBadgeText}>CURRENT</Text>
                          </View>
                        )}

                        {/* View -> Link */}
                        {!isUpcoming && (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              Alert.alert('Stage Records', `Viewing ${stage.title} records`);
                            }}
                          >
                            <Text style={styles.viewLinkText}>View →</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Bottom Row: Record count & Tag pills */}
                    <View style={styles.stageCardFooter}>
                      <Text style={styles.stageRecordCountText}>
                        {stage.recordCount ?? 0} records
                      </Text>

                      {/* Tag Chips e.g. Planting, Fertilizer, Watering */}
                      {stage.tags && stage.tags.length > 0 && (
                        <View style={styles.stageTagsRow}>
                          {stage.tags.map((tag, tIdx) => (
                            <View key={`tag-${tIdx}`} style={styles.tagPill}>
                              <Text style={styles.tagPillText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Outline Action Button: View Full Traceability Timeline */}
          <TouchableOpacity
            style={styles.traceabilityBtn}
            activeOpacity={0.8}
            onPress={() => {
              // TODO: Navigate to complete public tamper-proof audit trail / batch cert
              router.push('/(farmer)/contracts');
            }}
          >
            <Ionicons name="git-network-outline" size={17} color="#2D5C35" style={{ marginRight: 8 }} />
            <Text style={styles.traceabilityBtnText}>View Full Traceability Timeline</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>

      {/* 5. FLOATING PRIMARY "Add Record" BAR */}
      <Animated.View
        style={[
          styles.floatingBarWrapper,
          {
            bottom: Math.max(insets.bottom, 12) + 72, // Clears bottom tab bar nicely
            opacity: addBarFadeAnim,
            transform: [{ translateY: addBarTranslateY }, { scale: addBarScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.addRecordBar}
          activeOpacity={0.92}
          onPressIn={() => {
            Animated.spring(addBarScale, { toValue: 0.97, useNativeDriver: true }).start();
          }}
          onPressOut={() => {
            Animated.spring(addBarScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
          }}
          onPress={() => setAddRecordModalVisible(true)}
        >
          <Feather name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addRecordBarText}>Add Record</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Success Notification Toast */}
      {toastMessage && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            {
              top: insets.top + 70,
              opacity: toastFadeAnim,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#2E7D32" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Add Record Modal Form */}
      <AddRecordModal
        visible={addRecordModalVisible}
        cropName={field?.cropName || 'Crop'}
        onClose={() => setAddRecordModalVisible(false)}
        onSave={handleSaveRecord}
      />

      {/* Photo Change Modal */}
      <PhotoOptionsModal
        visible={photoModalVisible}
        fieldName={field?.cropName || 'Crop'}
        hasPhoto={!!currentImageUri}
        onClose={() => setPhotoModalVisible(false)}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
        onRemovePhoto={handleRemovePhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5EFE6', // Parchment tone matching screenshot
  },

  /* Parallax Hero Background */
  heroBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#27442F',
    overflow: 'hidden',
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#27442F',
  },
  placeholderEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#DCE7DD',
    fontWeight: '600',
  },
  heroDarkScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 15, 0.35)',
  },
  cameraEditButton: {
    position: 'absolute',
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },

  /* Top Nav Bar */
  topNavBar: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backPillText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  /* Sticky Compact Header */
  compactStickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 88,
    backgroundColor: '#1E3C25',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  compactHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },

  /* Scroll Content */
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },

  /* Title & Tag Section */
  titleInfoGroup: {
    marginBottom: 16,
  },
  environmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  environmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: '#ECEAE2',
  },
  environmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#265934',
  },
  startedDateText: {
    fontSize: 12.5,
    color: '#556D59',
    fontWeight: '600',
  },
  mainCropTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#15321B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.5,
  },

  /* 4 Stats Cards Strip */
  statsCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE4',
    shadowColor: '#17301C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16351E',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#768B7C',
  },

  /* Info Paragraph */
  infoParagraph: {
    fontSize: 13.5,
    color: '#657E6B',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: '400',
  },

  /* Farming Journey Section */
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D3E53', // Deep blue-teal tone matching screenshot
    letterSpacing: -0.2,
    marginBottom: 16,
  },

  /* Stepper Timeline List */
  timelineList: {
    marginBottom: 18,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineTrackCol: {
    alignItems: 'center',
    width: 38,
    marginRight: 10,
    position: 'relative',
  },
  nodeDone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E5830',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeCurrent: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E5830',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeCurrentEmoji: {
    fontSize: 16,
  },
  nodeUpcoming: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B8C6BA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeUpcomingEmoji: {
    fontSize: 14,
    opacity: 0.7,
  },
  timelineConnector: {
    position: 'absolute',
    top: 32,
    bottom: -22,
    width: 2,
    zIndex: 0,
  },
  connectorDone: {
    backgroundColor: '#1E5830',
  },
  connectorUpcoming: {
    backgroundColor: '#D7DFD8',
  },

  /* Stage Cards */
  stageCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  stageCardCurrent: {
    backgroundColor: '#EAF5ED',
    borderColor: '#98D4A8',
    borderWidth: 1.2,
  },
  stageCardUpcoming: {
    backgroundColor: '#F9F8F4',
    borderStyle: 'dashed',
    borderColor: '#DDD9CF',
  },
  stageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stageCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#15321B',
    flex: 1,
  },
  stageCardTitleUpcoming: {
    color: '#8C9B90',
  },
  stageCardRightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageDateText: {
    fontSize: 11,
    color: '#768B7C',
    fontWeight: '500',
  },
  currentBadgePill: {
    backgroundColor: '#1D5A32',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  viewLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#3B7A4E',
  },
  stageCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageRecordCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#748A7A',
  },
  stageTagsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  tagPill: {
    backgroundColor: '#F3F2EA',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  tagPillText: {
    fontSize: 10.5,
    color: '#556D59',
    fontWeight: '600',
  },

  /* View Full Traceability Timeline Button */
  traceabilityBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#C6D6C9',
    borderRadius: 24,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#17301C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  traceabilityBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#265934',
  },

  /* Floating Bottom "Add Record" Bar */
  floatingBarWrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    zIndex: 99,
  },
  addRecordBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E4127', // Deep forest green matching screenshot
    paddingVertical: 15,
    borderRadius: 28,
    shadowColor: '#07180B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  addRecordBarText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Success Toast Notification */
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#EAF6EC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B0DFB9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 999,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E6330',
    flex: 1,
  },
});
