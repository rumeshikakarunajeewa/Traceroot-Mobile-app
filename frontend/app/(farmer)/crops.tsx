import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CropSummaryCard } from '../../src/components/farmer/CropSummaryCard';
import { AddNewCropModal } from '../../src/components/farmer/AddNewCropModal';
import { FieldItem } from '../../src/types/farmer.types';
import { useCropsStore, CreateCropPayload } from '../../src/store/cropStore';
import { useDarkMode } from '../../src/store/uiStore';

export default function FarmerCropsScreen() {
  const [isDark] = useDarkMode();
  const [refreshing, setRefreshing] = useState(false);
  const [addCropModalVisible, setAddCropModalVisible] = useState(false);
  const { fields: crops, syncCrops, createNewCrop } = useCropsStore();

  // Staggered Entrance Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-15)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(18)).current;
  const listFade = useRef(new Animated.Value(0)).current;
  const listSlide = useRef(new Animated.Value(24)).current;

  // Metric Count-Up Animated Values
  const countCropsAnim = useRef(new Animated.Value(0)).current;
  const countRecordsAnim = useRef(new Animated.Value(0)).current;
  const countGrowthAnim = useRef(new Animated.Value(0)).current;

  const [displayCrops, setDisplayCrops] = useState(0);
  const [displayRecords, setDisplayRecords] = useState(0);
  const [displayGrowth, setDisplayGrowth] = useState(0);

  // Calculate summary values dynamically from crops data
  const totalCropsCount = crops.length;
  const totalRecordsCount = crops.reduce((acc, c) => acc + (c.recordCount || 0), 0);
  const avgGrowthPercent = Math.round(
    crops.length > 0
      ? crops.reduce((acc, c) => acc + (c.growthPercentage || 0), 0) / crops.length
      : 0
  );

  useEffect(() => {
    // 1. Staggered Entrance
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(statsFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(statsSlide, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(listFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(listSlide, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    // 2. Count-Up Animation
    countCropsAnim.addListener(({ value }) => setDisplayCrops(Math.round(value)));
    countRecordsAnim.addListener(({ value }) => setDisplayRecords(Math.round(value)));
    countGrowthAnim.addListener(({ value }) => setDisplayGrowth(Math.round(value)));

    Animated.parallel([
      Animated.timing(countCropsAnim, {
        toValue: totalCropsCount,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(countRecordsAnim, {
        toValue: totalRecordsCount,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(countGrowthAnim, {
        toValue: avgGrowthPercent,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    return () => {
      countCropsAnim.removeAllListeners();
      countRecordsAnim.removeAllListeners();
      countGrowthAnim.removeAllListeners();
    };
  }, [totalCropsCount, totalRecordsCount, avgGrowthPercent]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncCrops();
    } catch (err) {
      console.warn('[MyCrops] Error refreshing crops from Supabase:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigateToJourney = (crop: FieldItem) => {
    if (!crop?.id) return;
    router.push({
      pathname: '/harvests/[id]',
      params: { id: crop.id },
    });
  };

  const handleAddNewCrop = () => {
    setAddCropModalVisible(true);
  };

  const handleCreateCrop = async (payload: CreateCropPayload) => {
    return await createNewCrop(payload);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E3C25" />
        }
      >
        {/* 1. Header Section */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={[styles.backButton, isDark && styles.backButtonDark]}
                activeOpacity={0.7}
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="arrow-left" size={18} color={isDark ? '#E5EFE7' : '#203E26'} />
              </TouchableOpacity>
              <Text style={[styles.growingSeasonSub, isDark && styles.growingSeasonSubDark]}>Your growing season</Text>
            </View>

            {/* Active crops badge */}
            <View style={[styles.activeCropsBadge, isDark && styles.activeCropsBadgeDark]}>
              <Ionicons name="trophy-outline" size={13} color={isDark ? '#4ADE80' : '#2D5C35'} style={{ marginRight: 4 }} />
              <Text style={[styles.activeCropsBadgeText, isDark && styles.activeCropsBadgeTextDark]}>{totalCropsCount} active crops</Text>
            </View>
          </View>

          <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>My Crops</Text>
        </Animated.View>

        {/* 2. 3-Column Summary Strip */}
        <Animated.View
          style={[
            styles.summaryStripWrapper,
            {
              opacity: statsFade,
              transform: [{ translateY: statsSlide }],
            },
          ]}
        >
          <View style={[styles.summaryStrip, isDark && styles.summaryStripDark]}>
            {/* Column 1: Crops */}
            <View style={styles.summaryColumn}>
              <Text style={[styles.metricNumber, isDark && styles.metricNumberDark]}>{displayCrops}</Text>
              <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Crops</Text>
            </View>

            <View style={[styles.metricDivider, isDark && styles.metricDividerDark]} />

            {/* Column 2: Records */}
            <View style={styles.summaryColumn}>
              <Text style={[styles.metricNumber, isDark && styles.metricNumberDark]}>{displayRecords}</Text>
              <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Records</Text>
            </View>

            <View style={[styles.metricDivider, isDark && styles.metricDividerDark]} />

            {/* Column 3: Avg. growth */}
            <View style={styles.summaryColumn}>
              <View style={styles.growthRow}>
                <Text style={[styles.metricNumber, isDark && styles.metricNumberDark]}>{displayGrowth}</Text>
                <Text style={[styles.growthPercentSymbol, isDark && styles.growthPercentSymbolDark]}>%</Text>
              </View>
              <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Avg. growth</Text>
            </View>
          </View>
        </Animated.View>

        {/* 3. Crop Cards Vertical List */}
        <Animated.View
          style={[
            styles.cropsListContainer,
            {
              opacity: listFade,
              transform: [{ translateY: listSlide }],
            },
          ]}
        >
          {crops.length === 0 ? (
            <View style={[styles.emptyContainer, isDark && styles.emptyContainerDark]}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>No crops registered yet</Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                Start your growing season by creating your first field plot or greenhouse crop cycle.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.85}
                onPress={handleAddNewCrop}
              >
                <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Register Crop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            crops.map((crop) => (
              <CropSummaryCard
                key={crop.id}
                crop={crop}
                onPress={() => handleNavigateToJourney(crop)}
                onBookmarkPress={() => {
                  // Saved in preferences
                }}
              />
            ))
          )}

          {/* 4. Add New Crop Dashed Card */}
          <TouchableOpacity
            style={[styles.addNewCropCard, isDark && styles.addNewCropCardDark]}
            activeOpacity={0.8}
            onPress={handleAddNewCrop}
          >
            <View style={styles.addIconCircle}>
              <Feather name="plus" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.addTextGroup}>
              <Text style={[styles.addNewCropTitle, isDark && styles.addNewCropTitleDark]}>Add New Crop</Text>
              <Text style={[styles.addNewCropSubtitle, isDark && styles.addNewCropSubtitleDark]}>Start a new farming journey</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Spacer so items are completely visible above floating tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add New Crop Modal */}
      <AddNewCropModal
        visible={addCropModalVisible}
        onClose={() => setAddCropModalVisible(false)}
        onCreateCrop={handleCreateCrop}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4EFE6', // Warm parchment background matching screenshot
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 95,
  },
  headerContainer: {
    marginBottom: 16,
    paddingTop: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAE2',
  },
  growingSeasonSub: {
    fontSize: 13,
    color: '#657E6B',
    fontWeight: '500',
  },
  activeCropsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4EFE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  activeCropsBadgeText: {
    fontSize: 11,
    color: '#285832',
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#16351E',
    fontFamily: 'Georgia',
    letterSpacing: -0.5,
  },
  summaryStripWrapper: {
    marginBottom: 20,
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.2,
    borderColor: '#EAE6DD',
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: '#15321B',
    fontFamily: 'Georgia',
    marginBottom: 3,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  growthPercentSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15321B',
    fontFamily: 'Georgia',
  },
  metricLabel: {
    fontSize: 11.5,
    color: '#657E6B',
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#EAE6DD',
  },
  cropsListContainer: {
    marginBottom: 10,
  },
  addNewCropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 244, 237, 0.45)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#C6DACB',
    borderStyle: 'dashed',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  addIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#4E7753',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  addTextGroup: {
    flex: 1,
  },
  addNewCropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15321B',
    marginBottom: 2,
  },
  addNewCropSubtitle: {
    fontSize: 12,
    color: '#657E6B',
    fontWeight: '500',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  backButtonDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  growingSeasonSubDark: {
    color: '#9CB3A0',
  },
  activeCropsBadgeDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    borderWidth: 1,
  },
  activeCropsBadgeTextDark: {
    color: '#4ADE80',
  },
  screenTitleDark: {
    color: '#F0F5F1',
  },
  summaryStripDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  metricNumberDark: {
    color: '#F0F5F1',
  },
  growthPercentSymbolDark: {
    color: '#F0F5F1',
  },
  metricLabelDark: {
    color: '#9CB3A0',
  },
  metricDividerDark: {
    backgroundColor: '#283D2C',
  },
  addNewCropCardDark: {
    backgroundColor: 'rgba(24, 39, 28, 0.45)',
    borderColor: '#283D2C',
  },
  addNewCropTitleDark: {
    color: '#F0F5F1',
  },
  addNewCropSubtitleDark: {
    color: '#9CB3A0',
  },
  bottomSpacer: {
    height: 35,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    marginBottom: 16,
  },
  emptyContainerDark: {
    backgroundColor: '#18271C',
    borderColor: '#283D2C',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#15321B',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#657E6B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptySubtitleDark: {
    color: '#9CB3A0',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3C25',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
