import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: 'New', bg: '#FDE9DE', text: '#BF4E1A' },
  accepted: { label: 'Accepted', bg: '#E1EFE3', text: '#2A5C33' },
  ready: { label: 'Ready', bg: '#E1EFF8', text: '#1E6F9F' },
  delivered: { label: 'Delivered', bg: '#E4F3D6', text: '#39701E' },
  declined: { label: 'Declined', bg: '#FDE8E8', text: '#9B1C1C' },
  cancelled: { label: 'Cancelled', bg: '#EDEDED', text: '#6B6B6B' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status.toLowerCase()] || {
    label: status.toUpperCase(),
    bg: '#E1EFE3',
    text: '#2A5C33',
  };

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
