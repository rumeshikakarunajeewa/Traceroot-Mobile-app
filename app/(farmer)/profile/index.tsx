import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FarmerProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Farmer Profile</Text>
      <Text style={styles.subtitle}>Farm information, certifications and account settings</Text>
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
