import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const STEPS = ['new', 'accepted', 'ready', 'delivered'] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<Step, string> = {
  new: 'Placed',
  accepted: 'Accepted',
  ready: 'Ready',
  delivered: 'Delivered',
};

export default function ProgressBar({ status }: { status: string }) {
  // If cancelled or declined, show grayed progress
  const isDeclinedOrCancelled = status === 'declined' || status === 'cancelled';
  let completedIdx = STEPS.indexOf(status as Step);
  if (completedIdx === -1) {
    completedIdx = 0;
  }

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {STEPS.map((step, idx) => {
          const isPassed = !isDeclinedOrCancelled && idx <= completedIdx;
          return (
            <View
              key={step}
              style={[
                styles.barSegment,
                { backgroundColor: isPassed ? '#24522C' : '#E0E7E1' },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {STEPS.map((step) => (
          <Text key={step} style={styles.label}>
            {STEP_LABELS[step]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 12,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  barSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: '#7A9180',
    fontWeight: '500',
  },
});
