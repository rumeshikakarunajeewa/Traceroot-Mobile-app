import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface NewOrderBannerProps {
  count: number;
  onPress: () => void;
}

export default function NewOrderBanner({ count, onPress }: NewOrderBannerProps) {
  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconCircle}>
        <Feather name="bell" size={16} color="#FFFFFF" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {count} new order{count > 1 ? 's' : ''} waiting for your response
        </Text>
        <Text style={styles.subtitle}>Accept or decline within 24 hours</Text>
      </View>

      <Feather name="chevron-right" size={18} color="#D16328" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEEE6', // soft peach/orange tint matching screenshot
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FADCCE',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E57338',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#2B1E16',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#9E5B37',
    fontSize: 11,
    fontWeight: '500',
  },
});
