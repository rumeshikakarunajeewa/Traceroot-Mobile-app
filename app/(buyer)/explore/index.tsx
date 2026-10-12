import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/lib/theme';

export default function BuyerExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Explore verified crops and traced farms</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Browse all farm listings here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EB',
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
  subtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    marginTop: 4,
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
});
