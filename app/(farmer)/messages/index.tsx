import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FarmerMessagesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>Direct messaging with buyers, suppliers, and agricultural advisors</Text>
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
