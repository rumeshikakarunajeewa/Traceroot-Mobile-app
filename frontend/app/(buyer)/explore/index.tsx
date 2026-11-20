import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

import { mockProduceListings } from '../../../src/constants/buyerMockData';
import { ProduceListing, FarmingType } from '../../../src/types/buyer.types';
import { BuyerMarketCard } from '../../../src/components/buyer/BuyerMarketCard';

type FilterType = 'all' | FarmingType;

export default function BuyerExploreScreen() {
  const params = useLocalSearchParams<{ search?: string; crop?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.search || params.crop || '');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Filter listings based on search input & farming type filter
  const filteredListings = useMemo(() => {
    return mockProduceListings.filter((item) => {
      // 1. Farming type filter
      if (selectedFilter !== 'all' && item.farmingType !== selectedFilter) {
        return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.cropName.toLowerCase().includes(q) ||
        item.farmerName.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const handleCardPress = (listing: ProduceListing) => {
    Alert.alert(
      listing.cropName,
      `Farmer: ${listing.farmerName}\nLocation: ${listing.location}\nAvailable: ${listing.quantityKg} kg\nPrice: ${listing.currency} ${listing.pricePerKg}/kg\nCompleted Stages: ${listing.completedStages}/${listing.totalStages}\n\nWould you like to initiate a Forward Contract with this farmer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Initiate Contract',
          onPress: () => {
            router.push({
              pathname: '/(buyer)/contracts/new',
              params: {
                crop: listing.cropName,
                farmer: listing.farmerName,
                price: listing.pricePerKg.toString(),
                quantity: listing.quantityKg.toString(),
              },
            });
          },
        },
      ]
    );
  };

  const handleBookmarkToggle = (id: string, isBookmarked: boolean) => {
    setBookmarkedIds((prev) =>
      isBookmarked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3E6142"
          />
        }
      >
        {/* ========================================================
            1. HEADER SECTION
           ======================================================== */}
        <View style={styles.header}>
          {/* Subtitle with leaf icon */}
          <View style={styles.subtitleRow}>
            <Ionicons name="leaf-outline" size={14} color="#4A654F" />
            <Text style={styles.subtitleText}>Verified produce from traced farms</Text>
          </View>

          {/* Main Title */}
          <Text style={styles.titleText}>Marketplace</Text>
        </View>

        {/* ========================================================
            2. SEARCH BAR
           ======================================================== */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#859787" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search crops, farmers..."
            placeholderTextColor="#859787"
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#859787" />
            </TouchableOpacity>
          )}
        </View>

        {/* ========================================================
            3. FILTER TABS (All Types, Greenhouse, Open-field)
           ======================================================== */}
        <View style={styles.filterBar}>
          {/* All Types */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('all')}
            style={[
              styles.filterPill,
              selectedFilter === 'all' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'all' ? styles.filterTextActive : styles.filterTextInactive,
              ]}
            >
              All Types
            </Text>
          </TouchableOpacity>

          {/* Greenhouse */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('greenhouse')}
            style={[
              styles.filterPill,
              selectedFilter === 'greenhouse' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'greenhouse' ? styles.filterTextActive : styles.filterTextInactive,
              ]}
            >
              🏡 Greenhouse
            </Text>
          </TouchableOpacity>

          {/* Open-field */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('open-field')}
            style={[
              styles.filterPill,
              selectedFilter === 'open-field' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'open-field' ? styles.filterTextActive : styles.filterTextInactive,
              ]}
            >
              🌽 Open-field
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================
            4. LISTINGS COUNT & TRACE STATUS
           ======================================================== */}
        <View style={styles.countRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setSelectedFilter('all');
              setSearchQuery('');
            }}
          >
            <Text style={styles.countText}>
              {filteredListings.length}{' '}
              {filteredListings.length === 1 ? 'verified listing' : 'verified listings'}
            </Text>
          </TouchableOpacity>

          <View style={styles.tracedBadge}>
            <MaterialCommunityIcons name="shield-check-outline" size={15} color="#5D7060" />
            <Text style={styles.tracedText}>All traced</Text>
          </View>
        </View>

        {/* ========================================================
            5. PRODUCE LISTINGS CARDS
           ======================================================== */}
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <BuyerMarketCard
              key={listing.id}
              listing={listing}
              onPress={handleCardPress}
              onBookmarkToggle={handleBookmarkToggle}
              initialBookmarked={bookmarkedIds.includes(listing.id)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="sprout-outline" size={48} color="#9BAAA0" />
            <Text style={styles.emptyTitle}>No matching listings found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query or selecting &quot;All Types&quot;
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA', // Warm organic ivory/cream matching design screenshot
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 115, // Space for the floating bottom navigation bar
  },

  /* 1. Header */
  header: {
    marginTop: 6,
    marginBottom: 16,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 12.5,
    color: '#4B6350',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#162F1B',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.2,
  },

  /* 2. Search Bar */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EAE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#1A3320',
    fontWeight: '400',
  },

  /* 3. Category Filter Tabs */
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  filterPill: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#3E6142', // Rich forest green matching the screenshot's active pill
    shadowColor: '#3E6142',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillInactive: {
    backgroundColor: '#FAF7F1',
    borderWidth: 1,
    borderColor: '#D8D1C3',
  },
  filterText: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterTextInactive: {
    color: '#283C2A',
    fontWeight: '500',
  },

  /* 4. Count and Traced Status Row */
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#223825',
    textDecorationLine: 'underline',
  },
  tracedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tracedText: {
    fontSize: 12.5,
    color: '#5B6F5E',
    fontWeight: '500',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#263B29',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6E8071',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#3E6142',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
