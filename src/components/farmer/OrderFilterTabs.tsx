import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

export type FilterKey = 'all' | 'new' | 'accepted' | 'completed' | 'cancelled';

interface OrderFilterTabsProps {
  active: FilterKey;
  onSelect: (filter: FilterKey) => void;
  counts: Record<string, number>;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrderFilterTabs({
  active,
  onSelect,
  counts,
}: OrderFilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((f) => {
        const isSelected = active === f.key;
        const count = counts[f.key] ?? 0;

        return (
          <TouchableOpacity
            key={f.key}
            style={[styles.pill, isSelected ? styles.pillActive : styles.pillInactive]}
            onPress={() => onSelect(f.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {f.label}{f.key !== 'all' ? ` ${count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#26542D', // dark forest green
  },
  pillInactive: {
    backgroundColor: '#F7F6F2',
    borderWidth: 1,
    borderColor: '#E2E6E2',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  labelInactive: {
    color: '#344E39',
  },
});
