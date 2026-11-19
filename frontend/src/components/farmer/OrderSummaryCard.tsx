import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface OrderSummaryStats {
  earned: number;
  inProgress: number;
  total: number;
  newCount: number;
  delivered: number;
}

export default function OrderSummaryCard({ stats }: { stats: OrderSummaryStats }) {
  const { width } = Dimensions.get('window');
  const cardWidth = width - 32;

  // Agricultural seedling monitoring background image
  const bgImage = require('../../../assets/images/orders_summary_bg.jpg');

  return (
    <ImageBackground
      source={bgImage}
      style={[styles.background, { width: cardWidth }]}
      imageStyle={{ borderRadius: 24 }}
    >
      {/* Semi-transparent dark green overlay for readability */}
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.heading}>Review and manage buyer orders for your crops</Text>

        <View style={styles.financialRow}>
          <View style={styles.financialLeft}>
            <Text style={styles.financialLabel}>Earned (LKR)</Text>
            <Text style={styles.financialValueLarge}>{stats.earned.toLocaleString()}</Text>
          </View>
          <View style={styles.financialRight}>
            <Text style={styles.financialLabel}>In progress</Text>
            <Text style={styles.financialValueSmall}>LKR {stats.inProgress.toLocaleString()}</Text>
          </View>
        </View>

        {/* 3-column statistics panel with rounded blur pill */}
        <View style={styles.statsPanel}>
          <View style={styles.statItem}>
            <Feather name="file-text" size={16} color="#FFFFFF" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.statItem}>
            <Feather name="bell" size={16} color="#FFFFFF" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.newCount}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="basket-check-outline" size={18} color="#FFFFFF" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats.delivered}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    height: 250,
    alignSelf: 'center',
    marginVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16, 42, 22, 0.58)', // subtle green-tint overlay so the seedling & graphic shine through
  },
  content: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  heading: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  financialLeft: {
    justifyContent: 'flex-start',
  },
  financialRight: {
    alignItems: 'flex-end',
  },
  financialLabel: {
    color: '#D2E3D4',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  financialValueLarge: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  financialValueSmall: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statsPanel: {
    flexDirection: 'row',
    backgroundColor: 'rgba(28, 54, 34, 0.70)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: 4,
    opacity: 0.95,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#D2E3D4',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  separator: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
