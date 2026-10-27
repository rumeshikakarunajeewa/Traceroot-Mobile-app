import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SupplierStats } from '../../types/supplier.types';

interface SupplierHeroBannerProps {
  stats: SupplierStats;
}

export const SupplierHeroBanner: React.FC<SupplierHeroBannerProps> = ({ stats }) => {
  return (
    <View style={styles.bannerWrapper}>
      <ImageBackground
        source={require('../../../assets/images/supplier_hero_banner.jpg')}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        {/* Cinematic rich green gradient overlay for text readability */}
        <LinearGradient
          colors={[
            'rgba(14, 38, 22, 0.45)',
            'rgba(11, 30, 18, 0.72)',
            'rgba(8, 24, 14, 0.88)',
          ]}
          style={styles.gradientOverlay}
        >
          {/* Top Tag: Agricultural Raw Materials */}
          <View style={styles.tagRow}>
            <MaterialCommunityIcons name="leaf" size={14} color="#C4DFC6" />
            <Text style={styles.tagText}>Agricultural Raw Materials</Text>
          </View>

          {/* Elegant Headline with Italic Gold Accent */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>
              Every good harvest starts{'\n'}with{' '}
              <Text style={styles.headlineGoldItalic}>good seed</Text>
            </Text>
          </View>

          {/* Translucent Glassmorphic Stats Bar */}
          <View style={styles.glassStatsCard}>
            {/* 1. Products */}
            <View style={styles.statColumn}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={18}
                color="rgba(255, 255, 255, 0.85)"
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{stats.productsCount}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>

            <View style={styles.statDivider} />

            {/* 2. Pending Orders */}
            <View style={styles.statColumn}>
              <MaterialCommunityIcons
                name="basket-outline"
                size={18}
                color="rgba(255, 255, 255, 0.85)"
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{stats.pendingOrdersCount}</Text>
              <Text style={styles.statLabel}>Pending Orders</Text>
            </View>

            <View style={styles.statDivider} />

            {/* 3. Active Farmers */}
            <View style={styles.statColumn}>
              <MaterialCommunityIcons
                name="account-cowboy-hat-outline"
                size={18}
                color="rgba(255, 255, 255, 0.85)"
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{stats.activeFarmersCount}</Text>
              <Text style={styles.statLabel}>Active Farmers</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0E2413',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 22,
  },
  imageBackground: {
    width: '100%',
    minHeight: 275,
  },
  imageStyle: {
    borderRadius: 28,
  },
  gradientOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    minHeight: 275,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  tagText: {
    color: '#D2E8D5',
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headlineContainer: {
    marginVertical: 12,
  },
  headline: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  headlineGoldItalic: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#DEC98B', // Warm soft golden wheat tone matching Figma
  },
  glassStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 8,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: 3,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  statLabel: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.82)',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
