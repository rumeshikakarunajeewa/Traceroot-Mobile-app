import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDarkMode } from '../../../src/store/uiStore';

export default function SupplierMessagesScreen() {
  const [isDark] = useDarkMode();

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Messages</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          Farmer and buyer inquiries will appear here.
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#162E1D',
    marginBottom: 8,
  },
  titleDark: {
    color: '#F0F5F1',
  },
  subtitle: {
    fontSize: 14,
    color: '#6F8471',
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#8EA491',
  },
});
