import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDarkMode } from '../../../src/store/uiStore';

export default function BuyerContractsScreen() {
  const [isDark] = useDarkMode();

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Contracts</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          Active and upcoming cultivation agreements
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.placeholder, isDark && styles.placeholderDark]}>
          CF-001 Cabbage — 500 kg (In Progress)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  containerDark: {
    backgroundColor: '#0E1710',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16301A',
  },
  titleDark: {
    color: '#F0F5F1',
  },
  subtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    marginTop: 4,
  },
  subtitleDark: {
    color: '#98B39B',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholder: {
    fontSize: 14,
    color: '#768776',
  },
  placeholderDark: {
    color: '#98B39B',
  },
});
