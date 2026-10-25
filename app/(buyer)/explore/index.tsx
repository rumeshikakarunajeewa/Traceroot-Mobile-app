import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../../src/lib/theme';
import { mockProduceListings } from '../../../src/constants/buyerMockData';
import { ProduceListing } from '../../../src/types/buyer.types';
import {
  FilterBar,
  FarmingFilterOption,
  CategoryFilterOption,
} from '../../../src/components/marketplace/FilterBar';
import { HarvestListingCard } from '../../../src/components/marketplace/HarvestListingCard';

type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'records' | 'stages';

export default function BuyerExploreScreen() {
  const params = useLocalSearchParams<{ search?: string; crop?: string }>();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [farmingType, setFarmingType] = useState<FarmingFilterOption>('all');
  const [category, setCategory] = useState<CategoryFilterOption>('All');
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Selected listing for detailed view modal
  const [selectedListing, setSelectedListing] = useState<ProduceListing | null>(null);

  // Initialize search query from route parameters if present
  useEffect(() => {
    if (params.search) {
      setSearchQuery(params.search);
    } else if (params.crop) {
      setSearchQuery(params.crop);
    }
  }, [params.search, params.crop]);

  // Pull-to-refresh simulation
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    return mockProduceListings
      .filter((item) => {
        // Farming type filter
        if (farmingType !== 'all' && item.farmingType !== farmingType) {
          return false;
        }

        // Category filter
        if (category !== 'All' && item.category !== category) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCrop = item.cropName.toLowerCase().includes(q);
          const matchFarmer = item.farmerName.toLowerCase().includes(q);
          const matchLocation = item.location.toLowerCase().includes(q);
          const matchCategory = item.category?.toLowerCase().includes(q);
          if (!matchCrop && !matchFarmer && !matchLocation && !matchCategory) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'price_asc') {
          return a.pricePerKg - b.pricePerKg;
        }
        if (sortOption === 'price_desc') {
          return b.pricePerKg - a.pricePerKg;
        }
        if (sortOption === 'records') {
          return b.recordsCount - a.recordsCount;
        }
        if (sortOption === 'stages') {
          return b.completedStages / b.totalStages - a.completedStages / a.totalStages;
        }
        return 0; // recommended order
      });
  }, [searchQuery, farmingType, category, sortOption]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFarmingType('all');
    setCategory('All');
    setSortOption('recommended');
  };

  const handleListingPress = (listing: ProduceListing) => {
    setSelectedListing(listing);
  };

  const getSortLabel = (opt: SortOption) => {
    switch (opt) {
      case 'price_asc':
        return 'Price: Low to High';
      case 'price_desc':
        return 'Price: High to Low';
      case 'records':
        return 'Most Records';
      case 'stages':
        return 'Stage Completion';
      default:
        return 'Recommended';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <Text style={styles.headerSubtitle}>
            Verified produce directly from traced farms
          </Text>
        </View>

        {/* Origin Badge */}
        <View style={styles.verifiedOriginBadge}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#204A27" />
          <Text style={styles.verifiedOriginText}>Verified</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#687A69"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crops, farmers, locations..."
            placeholderTextColor="#8C9B8E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearButton}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color="#8A9E8D" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Bar (Farming Type + Category Chips) */}
      <FilterBar
        selectedFarmingType={farmingType}
        onSelectFarmingType={setFarmingType}
        selectedCategory={category}
        onSelectCategory={setCategory}
      />

      {/* Results Header: Count & Sort Toggle */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>
          Showing <Text style={styles.countNumber}>{filteredListings.length}</Text>{' '}
          {filteredListings.length === 1 ? 'crop listing' : 'crop listings'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowSortMenu(true)}
          style={styles.sortButton}
        >
          <MaterialCommunityIcons name="sort" size={14} color="#1E3523" />
          <Text style={styles.sortButtonText}>{getSortLabel(sortOption)}</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color="#1E3523" />
        </TouchableOpacity>
      </View>

      {/* Listings List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.buyer.forestDark}
            colors={[colors.buyer.forestDark]}
          />
        }
      >
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <HarvestListingCard
              key={listing.id}
              listing={listing}
              onPress={handleListingPress}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="sprout-outline" size={42} color="#7A917B" />
            </View>
            <Text style={styles.emptyTitle}>No verified crops found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any listings matching your search or filters.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleResetFilters}
              style={styles.resetButton}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.resetButtonText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sort Options Modal */}
      <Modal
        visible={showSortMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.sortModalCard}>
            <Text style={styles.sortModalTitle}>Sort Listings By</Text>
            <View style={styles.sortDivider} />

            {(
              [
                { id: 'recommended', label: 'Recommended' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
                { id: 'records', label: 'Most Immutable Records' },
                { id: 'stages', label: 'Highest Cultivation Progress' },
              ] as const
            ).map((opt) => {
              const isSelected = sortOption === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.sortOptionRow, isSelected && styles.sortOptionSelected]}
                  onPress={() => {
                    setSortOption(opt.id);
                    setShowSortMenu(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={colors.buyer.forestDark}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Crop Detail Preview Modal */}
      <Modal
        visible={!!selectedListing}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedListing(null)}
      >
        {selectedListing && (
          <View style={styles.detailOverlay}>
            <View style={styles.detailCard}>
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setSelectedListing(null)}
                style={styles.detailCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={20} color="#16301A" />
              </TouchableOpacity>

              {/* Crop Hero Image */}
              <View style={styles.detailImageWrapper}>
                <Image
                  source={{ uri: selectedListing.imageUrl }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
                <View style={styles.detailQtyBadge}>
                  <Text style={styles.detailQtyText}>
                    {selectedListing.quantityKg} kg Available
                  </Text>
                </View>
              </View>

              {/* Title & Type */}
              <View style={styles.detailHeaderRow}>
                <View style={styles.detailTitleGroup}>
                  <Text style={styles.detailCropName}>{selectedListing.cropName}</Text>
                  <Text style={styles.detailCategoryText}>
                    {selectedListing.category || 'Produce'} • {selectedListing.location}
                  </Text>
                </View>
                <View style={styles.detailPriceGroup}>
                  <Text style={styles.detailPrice}>
                    {selectedListing.currency} {selectedListing.pricePerKg}
                  </Text>
                  <Text style={styles.detailPriceUnit}>per kg</Text>
                </View>
              </View>

              {/* Farmer Info Box */}
              <View style={styles.detailFarmerCard}>
                <View style={styles.detailFarmerAvatar}>
                  <Text style={styles.detailFarmerInitials}>
                    {selectedListing.farmerName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailFarmerMeta}>
                  <Text style={styles.detailFarmerName}>{selectedListing.farmerName}</Text>
                  <Text style={styles.detailFarmerType}>
                    {selectedListing.farmingType === 'greenhouse'
                      ? '🏡 Greenhouse Certified Farmer'
                      : '🌾 Open-Field Certified Farmer'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.messageFarmerBtn}
                  onPress={() => {
                    setSelectedListing(null);
                    router.push('/(buyer)/messages');
                  }}
                >
                  <MaterialCommunityIcons name="chat-outline" size={18} color="#1E3523" />
                </TouchableOpacity>
              </View>

              {/* Verification & Traceability Highlights */}
              <View style={styles.detailTraceBox}>
                <View style={styles.detailTraceHeader}>
                  <MaterialCommunityIcons name="shield-check" size={16} color="#2E7D32" />
                  <Text style={styles.detailTraceTitle}>TraceRoot Audit Journey</Text>
                </View>
                <View style={styles.detailTraceGrid}>
                  <View style={styles.detailTraceCol}>
                    <Text style={styles.detailTraceStat}>
                      {selectedListing.recordsCount}
                    </Text>
                    <Text style={styles.detailTraceLabel}>Evidence Logs</Text>
                  </View>
                  <View style={styles.detailTraceDivider} />
                  <View style={styles.detailTraceCol}>
                    <Text style={styles.detailTraceStat}>
                      {selectedListing.completedStages}/{selectedListing.totalStages}
                    </Text>
                    <Text style={styles.detailTraceLabel}>Growth Stages</Text>
                  </View>
                  <View style={styles.detailTraceDivider} />
                  <View style={styles.detailTraceCol}>
                    <Text style={styles.detailTraceStat}>
                      {selectedListing.isOrganic ? '100%' : 'Standard'}
                    </Text>
                    <Text style={styles.detailTraceLabel}>Organic Audit</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Actions */}
              <View style={styles.detailActionButtons}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedListing(null);
                    router.push('/(buyer)/contracts/new');
                  }}
                  style={styles.primaryContractBtn}
                >
                  <MaterialCommunityIcons
                    name="file-document-edit-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryContractBtnText}>Request Contract</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    marginTop: 2,
  },
  verifiedOriginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2DFD4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 0.5,
    borderColor: '#D4CFBE',
  },
  verifiedOriginText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#204A27',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#E6E1D7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#16301A',
  },
  clearButton: {
    padding: 2,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 12.5,
    color: '#6A7B6B',
  },
  countNumber: {
    fontWeight: '700',
    color: '#16301A',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBE6DC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E3523',
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 130, // Clearance for BuyerBottomTabBar floating capsule
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E3D7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.buyer.forestDark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sortModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  sortModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 12,
  },
  sortDivider: {
    height: 1,
    backgroundColor: '#EBE7DE',
    marginBottom: 8,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sortOptionSelected: {
    backgroundColor: '#F3EFE7',
  },
  sortOptionText: {
    fontSize: 13.5,
    color: '#3C4D3E',
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: colors.buyer.forestDark,
    fontWeight: '700',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '88%',
    position: 'relative',
  },
  detailCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0ECE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailImageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EBE7DE',
    marginBottom: 14,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailQtyBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(22, 48, 26, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailQtyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailTitleGroup: {
    flex: 1,
  },
  detailCropName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  detailCategoryText: {
    fontSize: 12.5,
    color: '#6A7B6B',
    marginTop: 2,
  },
  detailPriceGroup: {
    alignItems: 'flex-end',
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  detailPriceUnit: {
    fontSize: 11,
    color: '#768776',
  },
  detailFarmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5EE',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: '#E7E2D6',
  },
  detailFarmerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.buyer.forestDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailFarmerInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  detailFarmerMeta: {
    flex: 1,
  },
  detailFarmerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16301A',
  },
  detailFarmerType: {
    fontSize: 11.5,
    color: '#6A7B6B',
    marginTop: 2,
  },
  messageFarmerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBE6DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTraceBox: {
    backgroundColor: '#EBF4ED',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 0.5,
    borderColor: '#D2E6D6',
  },
  detailTraceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  detailTraceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#214D28',
  },
  detailTraceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailTraceCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailTraceStat: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3523',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  detailTraceLabel: {
    fontSize: 10.5,
    color: '#556E58',
    marginTop: 2,
  },
  detailTraceDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#C5DCC9',
  },
  detailActionButtons: {
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
  },
  primaryContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buyer.forestDark,
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryContractBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
