import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDarkMode } from '@/store/uiStore';
import { colors, darkColors, spacing, radius } from '@/lib/theme';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

type PeriodFilterOption = 'This week' | 'This month' | 'This season';

const PERIOD_OPTIONS: PeriodFilterOption[] = ['This week', 'This month', 'This season'];

// Maximum value in shared scale for bar heights
const MAX_BAR_VALUE = 234;
const CHART_MAX_HEIGHT = 105;

const WEEKLY_DATA = [
  { label: 'W1', value: 190, isHighlight: false },
  { label: 'W2', value: 224, isHighlight: false },
  { label: 'W3', value: 214, isHighlight: false },
  { label: 'W4', value: 234, isHighlight: true },
];

export default function AdminReportsScreen() {
  const [isDark] = useDarkMode();
  const insets = useSafeAreaInsets();
  const theme = isDark ? darkColors : colors;

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterOption>('This month');

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
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.subHeaderRow}>
              <MaterialCommunityIcons
                name="leaf"
                size={14}
                color={isDark ? '#A2BBA6' : '#6B7E6C'}
              />
              <Text style={[styles.subHeaderSubtitle, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
                Platform insights
              </Text>
            </View>
            <Text style={[styles.headerTitle, { color: isDark ? '#F0F5F1' : '#114B25' }]}>
              Reports
            </Text>
          </View>

          {/* Top-Right Circular Chart Icon Button (Disabled preview) */}
          <TouchableOpacity
            style={[styles.chartCircleButton, { backgroundColor: isDark ? '#18271C' : '#FFFFFF' }]}
            activeOpacity={0.7}
            disabled={true}
            accessibilityLabel="Reports analytics chart"
          >
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Period Buttons Row */}
        <View style={styles.periodRowContainer}>
          {PERIOD_OPTIONS.map((period) => {
            const isSelected = selectedPeriod === period;
            return (
              <TouchableOpacity
                key={period}
                activeOpacity={0.8}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodChip,
                  isSelected
                    ? styles.periodChipSelected
                    : [styles.periodChipUnselected, { backgroundColor: isDark ? '#18271C' : '#FFFFFF' }],
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Select period: ${period}`}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    isSelected
                      ? styles.periodChipTextSelected
                      : [styles.periodChipTextUnselected, { color: isDark ? '#A2BBA6' : '#5C6E60' }],
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Design Preview Notice Banner */}
        <View style={styles.previewNoticeBadge}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#E68A28" />
          <Text style={styles.previewNoticeText}>Design preview — sample data</Text>
        </View>

        {/* If 'This month' is selected: show sample statistics & bar chart */}
        {selectedPeriod === 'This month' ? (
          <>
            {/* Farm-Image Summary Hero Card */}
            <View style={styles.heroCardContainer}>
              <ImageBackground
                source={require('@/assets/images/auth_sprouts.jpg')}
                style={styles.heroCardBackground}
                imageStyle={styles.heroCardImage}
              >
                <LinearGradient
                  colors={['rgba(16, 40, 22, 0.45)', 'rgba(10, 25, 14, 0.88)']}
                  style={styles.heroGradient}
                >
                  {/* Metric Row */}
                  <View style={styles.heroTopRow}>
                    <Text style={styles.summaryMetricLabel}>Records captured</Text>
                    <View style={styles.summaryMetricRow}>
                      <Text style={styles.summaryCountNumber}>862</Text>
                      <Text style={styles.summaryCountSubtext}>+8% vs last month</Text>
                    </View>
                  </View>

                  {/* Stats Shelf */}
                  <View style={styles.summaryShelf}>
                    {/* Trade value */}
                    <View style={styles.shelfStatCol}>
                      <MaterialCommunityIcons name="basket-outline" size={15} color="#A6C0A1" />
                      <Text style={styles.shelfStatNumber}>LKR 3.4M</Text>
                      <Text style={styles.shelfStatLabel}>Trade value</Text>
                    </View>

                    {/* Active farms */}
                    <View style={styles.shelfStatCol}>
                      <MaterialCommunityIcons name="sprout" size={15} color="#A6C0A1" />
                      <Text style={styles.shelfStatNumber}>48</Text>
                      <Text style={styles.shelfStatLabel}>Active farms</Text>
                    </View>

                    {/* Compliance */}
                    <View style={styles.shelfStatCol}>
                      <MaterialCommunityIcons name="shield-check-outline" size={15} color="#A6C0A1" />
                      <Text style={styles.shelfStatNumber}>96%</Text>
                      <Text style={styles.shelfStatLabel}>Compliance</Text>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>

            {/* "Record activity" Bar Chart Card */}
            <View
              style={[
                styles.activityCard,
                { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
              ]}
            >
              {/* Card Top Row */}
              <View style={styles.activityTopRow}>
                <Text style={[styles.activityTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
                  Record activity
                </Text>
                <View style={styles.growthBadgePill}>
                  <MaterialCommunityIcons name="leaf" size={12} color="#2E7D32" />
                  <Text style={styles.growthBadgeText}>+8%</Text>
                </View>
              </View>

              {/* Subtitle with dotted underline on highlight */}
              <View style={styles.busiestRow}>
                <Text style={[styles.busiestPrefix, { color: isDark ? '#A2BBA6' : '#738275' }]}>
                  Busiest:{' '}
                </Text>
                <View style={styles.busiestUnderlineWrap}>
                  <Text style={[styles.busiestHighlight, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
                    W4 · 234 records
                  </Text>
                </View>
              </View>

              {/* Bar Chart View */}
              <View style={styles.chartContainer}>
                {WEEKLY_DATA.map((item) => {
                  // Draw bar heights proportionally to shared scale: (value / MAX_BAR_VALUE) * CHART_MAX_HEIGHT
                  const barHeight = Math.round((item.value / MAX_BAR_VALUE) * CHART_MAX_HEIGHT);

                  return (
                    <View key={item.label} style={styles.barColumn}>
                      {/* Value on top of bar */}
                      <Text
                        style={[
                          styles.barValueText,
                          item.isHighlight ? styles.barValueHighlight : { color: isDark ? '#A2BBA6' : '#738275' },
                        ]}
                      >
                        {item.value}
                      </Text>

                      {/* Bar Graphic */}
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: barHeight },
                            item.isHighlight ? styles.barFillHighlight : styles.barFillNormal,
                          ]}
                        />
                      </View>

                      {/* Week Label */}
                      <Text style={[styles.barWeekLabel, { color: isDark ? '#A2BBA6' : '#738275' }]}>
                        {item.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          /* Honest Unavailable Preview State when another period is selected */
          <View
            style={[
              styles.unavailablePeriodCard,
              { backgroundColor: isDark ? '#18271C' : '#FFFFFF' },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={36}
              color={isDark ? '#A2BBA6' : '#88A38E'}
            />
            <Text style={[styles.unavailableTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
              {selectedPeriod} Preview Unavailable
            </Text>
            <Text style={[styles.unavailableSubtitle, { color: isDark ? '#A2BBA6' : '#6B7E6C' }]}>
              Sample report metrics are currently configured only for &quot;This month&quot;. Live data aggregation for &quot;{selectedPeriod}&quot; will be available once backend reporting services are connected.
            </Text>
          </View>
        )}

        {/* "Crop mix" Heading Only (Content cut off in screenshot) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F0F5F1' : '#16301A' }]}>
            Crop mix
          </Text>
        </View>
      </ScrollView>

      {/* 5-Tab Floating Shell with Reports Active */}
      <AdminTabBar activeTab="reports" />
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
  chartCircleButton: {
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
  periodRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: spacing.sm,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipSelected: {
    backgroundColor: '#2E5E3A',
  },
  periodChipUnselected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  periodChipText: {
    fontSize: 12,
  },
  periodChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  periodChipTextUnselected: {
    fontWeight: '600',
  },
  previewNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(230, 138, 40, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    marginVertical: spacing.xs,
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
    marginVertical: spacing.sm,
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
    marginBottom: spacing.sm,
  },
  summaryMetricLabel: {
    color: '#E8F5E9',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  summaryCountNumber: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  summaryCountSubtext: {
    color: '#F4D068',
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  summaryShelf: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 38, 22, 0.65)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  shelfStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  shelfStatNumber: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  shelfStatLabel: {
    color: '#A6C0A1',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  activityCard: {
    borderRadius: 22,
    padding: 16,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  growthBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  growthBadgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  busiestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  busiestPrefix: {
    fontSize: 12,
    fontWeight: '500',
  },
  busiestUnderlineWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#A6C0A1',
    borderStyle: 'dashed',
  },
  busiestHighlight: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    paddingHorizontal: 8,
    height: 160,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 5,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  barValueHighlight: {
    color: '#E66926',
    fontWeight: '800',
  },
  barTrack: {
    width: '100%',
    height: 110,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  barFillNormal: {
    backgroundColor: '#6B9071',
  },
  barFillHighlight: {
    backgroundColor: '#E68A28',
  },
  barWeekLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  unavailablePeriodCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 22,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  unavailableTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  unavailableSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
