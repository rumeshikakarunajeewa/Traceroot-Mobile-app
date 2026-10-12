import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CropSummaryCard } from '../../src/components/farmer/CropSummaryCard';
import { mockFields } from '../../src/constants/farmerMockData';
import { FieldItem } from '../../src/types/farmer.types';

export default function FarmerCropsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [crops, setCrops] = useState<FieldItem[]>(mockFields);

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

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Refetch crops and cultivation cycles from Supabase
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  const handleNavigateToJourney = (crop: FieldItem) => {
    router.push({
      pathname: '/(farmer)/harvests/[id]',
      params: { id: crop.id },
    });
  };

  const handleAddNewCrop = () => {
    router.push('/(farmer)/harvests/new');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4EFE6" />

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
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="arrow-left" size={18} color="#203E26" />
              </TouchableOpacity>
              <Text style={styles.growingSeasonSub}>Your growing season</Text>
            </View>

            {/* Active crops badge */}
            <View style={styles.activeCropsBadge}>
              <Ionicons name="trophy-outline" size={13} color="#2D5C35" style={{ marginRight: 4 }} />
              <Text style={styles.activeCropsBadgeText}>{totalCropsCount} active crops</Text>
            </View>
          </View>

          <Text style={styles.screenTitle}>My Crops</Text>
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
          <View style={styles.summaryStrip}>
            {/* Column 1: Crops */}
            <View style={styles.summaryColumn}>
              <Text style={styles.metricNumber}>{displayCrops}</Text>
              <Text style={styles.metricLabel}>Crops</Text>
            </View>

            <View style={styles.metricDivider} />

            {/* Column 2: Records */}
            <View style={styles.summaryColumn}>
              <Text style={styles.metricNumber}>{displayRecords}</Text>
              <Text style={styles.metricLabel}>Records</Text>
            </View>

            <View style={styles.metricDivider} />

            {/* Column 3: Avg. growth */}
            <View style={styles.summaryColumn}>
              <View style={styles.growthRow}>
                <Text style={styles.metricNumber}>{displayGrowth}</Text>
                <Text style={styles.growthPercentSymbol}>%</Text>
              </View>
              <Text style={styles.metricLabel}>Avg. growth</Text>
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
          {crops.map((crop) => (
            <CropSummaryCard
              key={crop.id}
              crop={crop}
              onPress={() => handleNavigateToJourney(crop)}
              onBookmarkPress={() => {
                // TODO: Save bookmark in user preferences / Supabase
              }}
            />
          ))}

          {/* 4. Add New Crop Dashed Card */}
          <TouchableOpacity
            style={styles.addNewCropCard}
            activeOpacity={0.8}
            onPress={handleAddNewCrop}
          >
            <View style={styles.addIconCircle}>
              <Feather name="plus" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.addTextGroup}>
              <Text style={styles.addNewCropTitle}>Add New Crop</Text>
              <Text style={styles.addNewCropSubtitle}>Start a new farming journey</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Spacer so items are completely visible above floating tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  bottomSpacer: {
    height: 35,
  },
});
