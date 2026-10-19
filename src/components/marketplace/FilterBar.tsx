import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';
import { FarmingType } from '../../types/buyer.types';

export type FarmingFilterOption = 'all' | FarmingType;
export type CategoryFilterOption = 'All' | 'Vegetables' | 'Fruits' | 'Spices' | 'Tubers';

interface FilterBarProps {
  selectedFarmingType: FarmingFilterOption;
  onSelectFarmingType: (type: FarmingFilterOption) => void;
  selectedCategory: CategoryFilterOption;
  onSelectCategory: (category: CategoryFilterOption) => void;
  activeCount?: number;
}

const FARMING_OPTIONS: Array<{ label: string; value: FarmingFilterOption; emoji?: string }> = [
  { label: 'All Types', value: 'all' },
  { label: 'Greenhouse', value: 'greenhouse', emoji: '🏡' },
  { label: 'Open-field', value: 'open-field', emoji: '🌾' },
];

const CATEGORIES: Array<{ label: CategoryFilterOption; emoji: string }> = [
  { label: 'All', emoji: '🥗' },
  { label: 'Vegetables', emoji: '🥬' },
  { label: 'Fruits', emoji: '🍓' },
  { label: 'Spices', emoji: '🌶️' },
  { label: 'Tubers', emoji: '🥔' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedFarmingType,
  onSelectFarmingType,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Farming Type Segmented Buttons */}
      <View style={styles.segmentedWrapper}>
        {FARMING_OPTIONS.map((option) => {
          const isActive = selectedFarmingType === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.8}
              onPress={() => onSelectFarmingType(option.value)}
              style={[
                styles.segmentButton,
                isActive && styles.segmentButtonActive,
              ]}
              accessibilityRole="button"
              accessibilityState={isActive ? { selected: true } : {}}
            >
              {option.emoji && (
                <Text style={styles.segmentEmoji}>{option.emoji}</Text>
              )}
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.segmentTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Horizontal Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isCatActive = selectedCategory === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              activeOpacity={0.8}
              onPress={() => onSelectCategory(cat.label)}
              style={[
                styles.categoryChip,
                isCatActive && styles.categoryChipActive,
              ]}
              accessibilityRole="button"
              accessibilityState={isCatActive ? { selected: true } : {}}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryText,
                  isCatActive && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default FilterBar;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  segmentedWrapper: {
    flexDirection: 'row',
    backgroundColor: '#EBE6DC',
    borderRadius: 24,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  segmentButtonActive: {
    backgroundColor: colors.buyer.forestDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentEmoji: {
    fontSize: 12,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#556956',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E5E1D7',
    gap: 5,
  },
  categoryChipActive: {
    backgroundColor: '#26442A',
    borderColor: '#26442A',
  },
  categoryEmoji: {
    fontSize: 12,
  },
  categoryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.buyer.textDark,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
});
