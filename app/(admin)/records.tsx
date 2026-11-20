import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDarkMode } from '@/store/uiStore';
import { colors, darkColors, spacing, radius } from '@/lib/theme';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

interface LedgerRecordPreview {
  id: string;
  traceId: string;
  type: 'Original' | 'Correction';
  isFlagged?: boolean;
  title: string;
  crop: string;
  farmer: string;
  time: string;
  dateGroup: 'TODAY' | 'YESTERDAY';
  image: any;
  nodeColor: 'orange' | 'green';
}

type RecordFilterOption = 'All' | 'Original' | 'Correction' | 'Flagged';

const PREVIEW_RECORDS: LedgerRecordPreview[] = [
  {
    id: 'record-preview-1',
    traceId: 'TR-0053',
    type: 'Correction',
    title: 'Correction Record',
    crop: 'Tomato',
    farmer: 'Priya Kumari',
    time: '10:15 AM',
    dateGroup: 'TODAY',
    image: require('@/assets/images/supplier_tomato_seeds.jpg'),
    nodeColor: 'orange',
  },
  {
    id: 'record-preview-2',
    traceId: 'TR-0051',
    type: 'Original',
    title: 'Fertilizer Applied',
    crop: 'Tomato',
    farmer: 'Priya Kumari',
    time: '09:20 AM',
    dateGroup: 'TODAY',
    image: require('@/assets/images/supplier_tomato_seeds.jpg'),
    nodeColor: 'green',
  },
  {
    id: 'record-preview-3',
    traceId: 'TR-0049',
    type: 'Original',
    isFlagged: true,
    title: 'Watering',
    crop: 'Cabbage',
    farmer: 'Roshan Silva',
    time: '07:45 AM',
    dateGroup: 'TODAY',
    image: require('@/assets/images/auth_sprouts.jpg'),
    nodeColor: 'orange',
  },
  {
    id: 'record-preview-4',
    traceId: 'TR-0046',
    type: 'Original',
    title: 'Harvest Logged',
    crop: 'Broccoli',
    farmer: 'Amali Fernando',
    time: '05:30 PM',
    dateGroup: 'YESTERDAY',
    image: require('@/assets/images/farm_card_bg.jpg'),
    nodeColor: 'green',
  },
  {
    id: 'record-preview-5',
    traceId: 'TR-0044',
    type: 'Original',
    title: 'Pest Inspection',
    crop: 'Cabbage',
    farmer: 'Roshan Silva',
    time: '11:10 AM',
    dateGroup: 'YESTERDAY',
    image: require('@/assets/images/auth_sprouts.jpg'),
    nodeColor: 'green',
  },
];

const RECORD_FILTERS: { label: RecordFilterOption; count?: number }[] = [
  { label: 'All' },
  { label: 'Original' },
  { label: 'Correction' },
  { label: 'Flagged', count: 1 },
];

export default function AdminRecordsScreen() {
  const [isDark] = useDarkMode();
  const insets = useSafeAreaInsets();
  const theme = isDark ? darkColors : colors;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<RecordFilterOption>('All');

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedFilter('All');
  };

  // Filter records matching both search (traceId, farmer, crop, title) and category chip
  const filteredRecords = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();

    return PREVIEW_RECORDS.filter((rec) => {
      // Filter tab check
      if (selectedFilter === 'Original' && rec.type !== 'Original') return false;
      if (selectedFilter === 'Correction' && rec.type !== 'Correction') return false;
      if (selectedFilter === 'Flagged' && !rec.isFlagged) return false;

      // Text query check
      if (!trimmed) return true;
      const matchesTraceId = rec.traceId.toLowerCase().includes(trimmed);
      const matchesFarmer = rec.farmer.toLowerCase().includes(trimmed);
      const matchesCrop = rec.crop.toLowerCase().includes(trimmed);
      const matchesTitle = rec.title.toLowerCase().includes(trimmed);

      return matchesTraceId || matchesFarmer || matchesCrop || matchesTitle;
    });
  }, [searchQuery, selectedFilter]);

  // Group filtered records into Today and Yesterday sections
  const todayRecords = useMemo(
    () => filteredRecords.filter((r) => r.dateGroup === 'TODAY'),
    [filteredRecords]
  );
  const yesterdayRecords = useMemo(
    () => filteredRecords.filter((r) => r.dateGroup === 'YESTERDAY'),
    [filteredRecords]
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0E1710' : '#F8F5F0' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.subHeaderRow}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={14}
                color={isDark ? '#A2BBA6' : '#6B7E6C'}
              />
              <Text style={[styles.subHeaderSubtitle, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                Immutable cultivation audit
              </Text>
            </View>
            <Text style={[styles.headerTitle, { color: isDark ? '#F0F5F1' : '#114B25' }]}>
              Records
            </Text>
          </View>

          {/* Decorative Action Button */}
          <TouchableOpacity
            style={[styles.leafCircleButton, { backgroundColor: isDark ? '#18271C' : '#FFFFFF' }]}
            activeOpacity={0.7}
            disabled={true}
            accessibilityLabel="Cultivation reports"
          >
            <MaterialCommunityIcons
              name="chart-timeline-variant"
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Design Preview Notice Banner */}
        <View style={styles.previewNoticeBadge}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#E68A28" />
          <Text style={styles.previewNoticeText}>Design preview — sample data</Text>
        </View>

        {/* Hero Card: Cultivation Records Summary */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={require('@/assets/images/orders_summary_bg.jpg')}
            style={styles.heroCardBackground}
            imageStyle={styles.heroCardImage}
          >
            <LinearGradient
              colors={['rgba(16, 40, 22, 0.45)', 'rgba(10, 25, 14, 0.88)']}
              style={styles.heroGradient}
            >
              {/* Top Row: Metric & Chain Status Pill */}
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.recordsMetricLabel}>Records this season</Text>
                  <View style={styles.recordsMetricRow}>
                    <Text style={styles.recordsCountNumber}>1,284</Text>
                    <Text style={styles.recordsCountSubtext}>+5 today</Text>
                  </View>
                </View>

                {/* Chain intact pill badge */}
                <View style={styles.chainStatusPill}>
                  <View style={styles.chainDot} />
                  <Text style={styles.chainStatusText}>Chain intact</Text>
                </View>
              </View>

              {/* Stats Shelf */}
              <View style={styles.recordsShelf}>
                {/* Verified */}
                <View style={styles.recordStatCol}>
                  <MaterialCommunityIcons name="shield-check" size={15} color="#A6C0A1" />
                  <Text style={styles.recordStatNumber}>99.6%</Text>
                  <Text style={styles.recordStatLabel}>Verified</Text>
                </View>

                {/* Corrections */}
                <View style={styles.recordStatCol}>
                  <MaterialCommunityIcons name="file-document-edit-outline" size={15} color="#A6C0A1" />
                  <Text style={styles.recordStatNumber}>1</Text>
                  <Text style={styles.recordStatLabel}>Corrections</Text>
                </View>

                {/* Flagged */}
                <View style={styles.recordStatCol}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={15} color="#A6C0A1" />
                  <Text style={styles.recordStatNumber}>1</Text>
                  <Text style={styles.recordStatLabel}>Flagged</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Immutability Banner (Records cannot be edited or deleted) */}
        <View style={[styles.immutabilityBanner, { backgroundColor: isDark ? '#1C3122' : '#1E3523' }]}>
          <View style={styles.immutabilityIconCircle}>
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.immutabilityBannerText}>
            Records can&apos;t be edited or deleted. Mistakes are fixed with{' '}
            <Text style={styles.immutabilityHighlight}>linked correction records</Text>.
          </Text>
        </View>

        {/* Activity Ledger Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
            Activity ledger
          </Text>

          {/* Search Input Bar */}
          <View
            style={[
              styles.searchBarWrapper,
              { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
            ]}
          >
            <Feather
              name="search"
              size={18}
              color={isDark ? '#A2BBA6' : '#88A38E'}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? '#F0F5F1' : '#16301A' },
              ]}
              placeholder="Search ID, farmer, crop..."
              placeholderTextColor={isDark ? '#738C77' : '#94A396'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear search input"
              >
                <Feather
                  name="x"
                  size={16}
                  color={isDark ? '#A2BBA6' : '#88A38E'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRowContainer}
          >
            {RECORD_FILTERS.map((filter) => {
              const isSelected = selectedFilter === filter.label;
              return (
                <TouchableOpacity
                  key={filter.label}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFilter(filter.label)}
                  style={[
                    styles.filterChip,
                    isSelected
                      ? styles.filterChipSelected
                      : [styles.filterChipUnselected, { backgroundColor: isDark ? '#18271C' : '#FFFFFF' }],
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Filter by ${filter.label}`}
                >
                  <View style={styles.filterChipContent}>
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected
                          ? styles.filterChipTextSelected
                          : [styles.filterChipTextUnselected, { color: isDark ? '#A2BBA6' : '#5C6E60' }],
                      ]}
                    >
                      {filter.label}
                    </Text>
                    {filter.count !== undefined && (
                      <View style={styles.filterCountBadge}>
                        <Text style={styles.filterCountBadgeText}>{filter.count}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Timeline Ledger Content */}
          {filteredRecords.length > 0 ? (
            <View style={styles.timelineWrapper}>
              {/* Group 1: TODAY */}
              {todayRecords.length > 0 && (
                <View style={styles.dateGroupBlock}>
                  <View style={styles.dateGroupHeaderRow}>
                    <MaterialCommunityIcons name="white-balance-sunny" size={13} color="#E68A28" />
                    <Text style={[styles.dateGroupHeaderText, { color: isDark ? '#A2BBA6' : '#8B9B8E' }]}>
                      TODAY
                    </Text>
                    <View style={[styles.dateGroupRule, { backgroundColor: isDark ? '#283D2C' : '#E2E7E0' }]} />
                  </View>

                  <View style={styles.timelineList}>
                    {/* Vertical connecting line */}
                    <View
                      style={[
                        styles.timelineConnectingLine,
                        { backgroundColor: isDark ? '#283D2C' : '#DDE3DA' },
                      ]}
                    />

                    {todayRecords.map((item) => (
                      <View key={item.id} style={styles.recordTimelineRow}>
                        {/* Node circle */}
                        <View
                          style={[
                            styles.timelineNode,
                            {
                              backgroundColor:
                                item.nodeColor === 'orange' ? '#E66926' : '#2E7D32',
                            },
                          ]}
                        />

                        {/* Card */}
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={true}
                          style={[
                            styles.recordCard,
                            { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                          ]}
                          accessibilityLabel={`${item.title}, ${item.crop}, ${item.farmer}. Details under development`}
                        >
                          <View style={styles.thumbnailWrapper}>
                            <Image source={item.image} style={styles.recordThumbnail} />
                            <View style={styles.thumbnailCameraPill}>
                              <Feather name="camera" size={10} color="#FFFFFF" />
                            </View>
                          </View>

                          <View style={styles.recordInfoCol}>
                            {/* Meta Top: Trace ID & Badge */}
                            <View style={styles.recordMetaTopRow}>
                              <Text style={[styles.traceIdText, { color: isDark ? '#A2BBA6' : '#738275' }]}>
                                {item.traceId}
                              </Text>
                              <View
                                style={[
                                  styles.typeBadge,
                                  item.type === 'Correction'
                                    ? styles.typeBadgeCorrection
                                    : styles.typeBadgeOriginal,
                                ]}
                              >
                                {item.type === 'Correction' ? (
                                  <MaterialCommunityIcons
                                    name="gas-station-outline"
                                    size={10}
                                    color="#C45A1A"
                                  />
                                ) : (
                                  <MaterialCommunityIcons
                                    name="check-circle-outline"
                                    size={10}
                                    color="#3E6B47"
                                  />
                                )}
                                <Text
                                  style={[
                                    styles.typeBadgeText,
                                    item.type === 'Correction'
                                      ? styles.typeBadgeTextCorrection
                                      : styles.typeBadgeTextOriginal,
                                  ]}
                                >
                                  {item.type}
                                </Text>
                              </View>
                            </View>

                            {/* Title */}
                            <Text
                              style={[styles.recordTitleText, { color: isDark ? '#F0F5F1' : '#16301A' }]}
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>

                            {/* Subtitle */}
                            <Text
                              style={[styles.recordSubtext, { color: isDark ? '#A2BBA6' : '#738275' }]}
                              numberOfLines={1}
                            >
                              {item.crop} • {item.farmer} • {item.time}
                            </Text>
                          </View>

                          {/* Right Alert or Chevron Icon */}
                          <View style={styles.recordRightCol}>
                            {item.isFlagged && (
                              <View style={styles.flaggedIconCircle}>
                                <Feather name="bell" size={12} color="#E66926" />
                              </View>
                            )}
                            <Feather
                              name="chevron-right"
                              size={16}
                              color={isDark ? '#738C77' : '#94A396'}
                            />
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Group 2: YESTERDAY */}
              {yesterdayRecords.length > 0 && (
                <View style={styles.dateGroupBlock}>
                  <View style={styles.dateGroupHeaderRow}>
                    <MaterialCommunityIcons name="weather-sunset" size={13} color="#8B9B8E" />
                    <Text style={[styles.dateGroupHeaderText, { color: isDark ? '#A2BBA6' : '#8B9B8E' }]}>
                      YESTERDAY
                    </Text>
                    <View style={[styles.dateGroupRule, { backgroundColor: isDark ? '#283D2C' : '#E2E7E0' }]} />
                  </View>

                  <View style={styles.timelineList}>
                    {/* Vertical connecting line */}
                    <View
                      style={[
                        styles.timelineConnectingLine,
                        { backgroundColor: isDark ? '#283D2C' : '#DDE3DA' },
                      ]}
                    />

                    {yesterdayRecords.map((item) => (
                      <View key={item.id} style={styles.recordTimelineRow}>
                        {/* Node circle */}
                        <View
                          style={[
                            styles.timelineNode,
                            {
                              backgroundColor:
                                item.nodeColor === 'orange' ? '#E66926' : '#2E7D32',
                            },
                          ]}
                        />

                        {/* Card */}
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={true}
                          style={[
                            styles.recordCard,
                            { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
                          ]}
                          accessibilityLabel={`${item.title}, ${item.crop}, ${item.farmer}. Details under development`}
                        >
                          <View style={styles.thumbnailWrapper}>
                            <Image source={item.image} style={styles.recordThumbnail} />
                            <View style={styles.thumbnailCameraPill}>
                              <Feather name="camera" size={10} color="#FFFFFF" />
                            </View>
                          </View>

                          <View style={styles.recordInfoCol}>
                            {/* Meta Top: Trace ID & Badge */}
                            <View style={styles.recordMetaTopRow}>
                              <Text style={[styles.traceIdText, { color: isDark ? '#A2BBA6' : '#738275' }]}>
                                {item.traceId}
                              </Text>
                              <View
                                style={[
                                  styles.typeBadge,
                                  item.type === 'Correction'
                                    ? styles.typeBadgeCorrection
                                    : styles.typeBadgeOriginal,
                                ]}
                              >
                                {item.type === 'Correction' ? (
                                  <MaterialCommunityIcons
                                    name="gas-station-outline"
                                    size={10}
                                    color="#C45A1A"
                                  />
                                ) : (
                                  <MaterialCommunityIcons
                                    name="check-circle-outline"
                                    size={10}
                                    color="#3E6B47"
                                  />
                                )}
                                <Text
                                  style={[
                                    styles.typeBadgeText,
                                    item.type === 'Correction'
                                      ? styles.typeBadgeTextCorrection
                                      : styles.typeBadgeTextOriginal,
                                  ]}
                                >
                                  {item.type}
                                </Text>
                              </View>
                            </View>

                            {/* Title */}
                            <Text
                              style={[styles.recordTitleText, { color: isDark ? '#F0F5F1' : '#16301A' }]}
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>

                            {/* Subtitle */}
                            <Text
                              style={[styles.recordSubtext, { color: isDark ? '#A2BBA6' : '#738275' }]}
                              numberOfLines={1}
                            >
                              {item.crop} • {item.farmer} • {item.time}
                            </Text>
                          </View>

                          {/* Right Chevron Icon */}
                          <View style={styles.recordRightCol}>
                            <Feather
                              name="chevron-right"
                              size={16}
                              color={isDark ? '#738C77' : '#94A396'}
                            />
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.emptyStateCard,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
              ]}
            >
              <MaterialCommunityIcons
                name="file-search-outline"
                size={38}
                color={isDark ? '#A2BBA6' : '#88A38E'}
              />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: isDark ? '#F0F5F1' : '#16301A' },
                ]}
              >
                No Records Found
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: isDark ? '#A2BBA6' : '#6B7E6C' },
                ]}
              >
                No cultivation entries matched &quot;{searchQuery}&quot;
                {selectedFilter !== 'All' ? ` in ${selectedFilter}` : ''}.
              </Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleClearFilters}
                accessibilityLabel="Clear search and filter"
              >
                <Text style={styles.resetButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 5-Tab Floating Shell with Records Active */}
      <AdminTabBar activeTab="records" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    justifyContent: 'center',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  subHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  leafCircleButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  previewNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(230, 138, 40, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    marginVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  previewNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  heroCardContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: spacing.sm,
  },
  heroCardBackground: {
    width: '100%',
    minHeight: 185,
  },
  heroCardImage: {
    borderRadius: 22,
  },
  heroGradient: {
    padding: spacing.md,
    borderRadius: 22,
    flex: 1,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recordsMetricLabel: {
    color: '#E8F5E9',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordsMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  recordsCountNumber: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  recordsCountSubtext: {
    color: '#F4D068',
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  chainStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  chainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7CD958',
  },
  chainStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  recordsShelf: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 38, 22, 0.65)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  recordStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  recordStatNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  recordStatLabel: {
    color: '#A6C0A1',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  immutabilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  immutabilityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  immutabilityBannerText: {
    flex: 1,
    color: '#E8F5E9',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  immutabilityHighlight: {
    fontWeight: '700',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },
  filterRowContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: '#2E5E3A',
  },
  filterChipUnselected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterChipText: {
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipTextUnselected: {
    fontWeight: '600',
  },
  filterCountBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E66926',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  timelineWrapper: {
    position: 'relative',
  },
  dateGroupBlock: {
    marginBottom: spacing.md,
  },
  dateGroupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  dateGroupHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateGroupRule: {
    flex: 1,
    height: 1,
  },
  timelineList: {
    position: 'relative',
    paddingLeft: 4,
    gap: spacing.sm,
  },
  timelineConnectingLine: {
    position: 'absolute',
    left: 10,
    top: 14,
    bottom: 14,
    width: 2,
    borderRadius: 1,
  },
  recordTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  recordCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  recordThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  thumbnailCameraPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInfoCol: {
    flex: 1,
  },
  recordMetaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  traceIdText: {
    fontSize: 10,
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  typeBadgeCorrection: {
    backgroundColor: '#FDF1EB',
  },
  typeBadgeOriginal: {
    backgroundColor: '#EEF5EF',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  typeBadgeTextCorrection: {
    color: '#C45A1A',
  },
  typeBadgeTextOriginal: {
    color: '#3E6B47',
  },
  recordTitleText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  recordSubtext: {
    fontSize: 11,
    fontWeight: '400',
  },
  recordRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  flaggedIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FDF1EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C5E3D',
  },
});
