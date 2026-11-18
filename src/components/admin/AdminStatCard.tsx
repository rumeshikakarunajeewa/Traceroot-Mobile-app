import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AdminStatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  value: string | number;
  label: string;
  isDark: boolean;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  icon,
  iconColor,
  value,
  label,
  isDark,
}) => {
  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.value, isDark && styles.valueDark]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E5DF',
    justifyContent: 'space-between',
  },
  cardDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C3723',
    marginTop: 10,
  },
  valueDark: {
    color: '#E8F5E9',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    flex: 1,
    marginRight: 4,
  },
  labelDark: {
    color: '#9CB3A0',
  },
});
