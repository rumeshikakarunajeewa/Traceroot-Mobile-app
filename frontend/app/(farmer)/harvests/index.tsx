import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDarkMode } from '../../../src/store/uiStore';

export default function FarmerHarvestsScreen() {
  const [isDark] = useDarkMode();
  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>Harvests & Crops</Text>
      <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Active crop cycles, batch logs and harvest records</Text>
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
  containerDark: {
    backgroundColor: '#0E1710',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16351E',
    marginBottom: 6,
  },
  titleDark: {
    color: '#F0F5F1',
  },
  subtitle: {
    fontSize: 14,
    color: '#657E6B',
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#9CB3A0',
  },
});
