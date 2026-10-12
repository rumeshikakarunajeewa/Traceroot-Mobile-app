import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FarmerHarvestsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Harvests & Crops</Text>
      <Text style={styles.subtitle}>Active crop cycles, batch logs and harvest records</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16351E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#657E6B',
    textAlign: 'center',
  },
});
