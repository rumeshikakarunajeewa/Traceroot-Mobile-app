import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDarkMode } from '../../../src/store/uiStore';

export default function PlaceholderScreen() {
  const [isDark] = useDarkMode();
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.text, isDark && styles.textDark]}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9F6',
  },
  containerDark: {
    backgroundColor: '#0E1710',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  textDark: {
    color: '#F0F5F1',
  },
});

