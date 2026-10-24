import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BuyerStats } from '../../types/buyer.types';

interface BuyerHeroBannerProps {
  heroImageUrl: string;
  stats: BuyerStats;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: () => void;
}

export const BuyerHeroBanner: React.FC<BuyerHeroBannerProps> = ({
  heroImageUrl,
  stats,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  return (
    <View style={styles.cardWrapper}>
      <ImageBackground
        source={{ uri: heroImageUrl }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        {/* Subtle Dark Gradient Overlay for optimal contrast */}
        <View style={styles.overlay} />

        <View style={styles.contentContainer}>
          {/* Top Tag */}
          <View style={styles.topTagRow}>
            <MaterialCommunityIcons name="leaf" size={14} color="#C8E6C9" />
            <Text style={styles.topTagText}>Fresh from traced farms</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>
            Buy produce you can{'\n'}
            <Text style={styles.headlineItalic}>trust</Text>
          </Text>

          {/* Pill Search Bar */}
          <View style={styles.searchBarContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color="#6E7E6E"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search verified crops..."
              placeholderTextColor="#869686"
              value={searchQuery}
              onChangeText={onSearchChange}
              onSubmitEditing={onSearchSubmit}
              returnKeyType="search"
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onSearchSubmit}
              style={styles.searchButton}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {/* Glassmorphic Stats Container */}
          <View style={styles.statsContainer}>
            {/* Stat 1: Active Orders */}
            <View style={styles.statCol}>
              <MaterialCommunityIcons
                name="basket-outline"
                size={16}
                color="#E0EBE1"
                style={styles.statIcon}
              />
              <Text style={styles.statNumber}>{stats.activeOrders}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>

            <View style={styles.statDivider} />

            {/* Stat 2: Contracts */}
            <View style={styles.statCol}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={16}
                color="#E0EBE1"
                style={styles.statIcon}
              />
              <Text style={styles.statNumber}>{stats.contractsCount}</Text>
              <Text style={styles.statLabel}>Contracts</Text>
            </View>

            <View style={styles.statDivider} />

            {/* Stat 3: Verified Farms */}
            <View style={styles.statCol}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={16}
                color="#E0EBE1"
                style={styles.statIcon}
              />
              <Text style={styles.statNumber}>{stats.verifiedFarmsCount}</Text>
              <Text style={styles.statLabel}>Verified Farms</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  imageBackground: {
    width: '100%',
    minHeight: 350,
  },
  imageStyle: {
    borderRadius: 28,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 34, 16, 0.45)', // Rich dark forest tint
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  topTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  topTagText: {
    color: '#E8F5E9',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headline: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginBottom: 16,
  },
  headlineItalic: {
    fontStyle: 'italic',
    fontWeight: '400',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#16281A',
    paddingVertical: Platform.OS === 'ios' ? 7 : 4,
  },
  searchButton: {
    backgroundColor: '#203924',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.82)',
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
