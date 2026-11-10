import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../../src/lib/theme';
import { useDarkMode } from '../../../src/store/uiStore';
import { mockProduceListings } from '../../../src/constants/buyerMockData';
import { ProduceListing } from '../../../src/types/buyer.types';
import { ordersService } from '../../../src/services/orders.service';
import { useAuth } from '../../../src/store/authStore';
import {
  FilterBar,
  FarmingFilterOption,
  CategoryFilterOption,
} from '../../../src/components/marketplace/FilterBar';
import { HarvestListingCard } from '../../../src/components/marketplace/HarvestListingCard';

type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'records' | 'stages';

export default function BuyerExploreScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ search?: string; crop?: string }>();

  const paramSearch = params.search || params.crop || '';
  const [searchQuery, setSearchQuery] = useState(paramSearch);
  const [prevParam, setPrevParam] = useState(paramSearch);

  const [farmingType, setFarmingType] = useState<FarmingFilterOption>('all');
  const [category, setCategory] = useState<CategoryFilterOption>('All');
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<ProduceListing[]>(mockProduceListings);
  const [selectedListing, setSelectedListing] = useState<ProduceListing | null>(null);

  // Direct Order Placement state
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState('10');
  const [orderNotes, setOrderNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const loadListings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const data = await ordersService.fetchMarketplaceListings();
      if (data && data.length > 0) {
        setListings(data);
      }
    } catch (e) {
      console.warn('Error loading marketplace listings:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  if (paramSearch !== prevParam) {
    setPrevParam(paramSearch);
    setSearchQuery(paramSearch);
  }

  // Pull-to-refresh
  const onRefresh = () => {
    loadListings(true);
  };

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    return listings
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

  const handleConfirmOrder = async () => {
    if (!selectedListing) return;
    const qty = parseFloat(orderQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity in kg.');
      return;
    }
    if (selectedListing.quantityKg > 0 && qty > selectedListing.quantityKg) {
      Alert.alert('Insufficient Stock', `Only ${selectedListing.quantityKg} kg is available.`);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const buyerId = user?.id || 'buyer-1';
      const res = await ordersService.placeBuyerOrder({
        buyerId,
        cropId: (selectedListing as any).harvest_id || (selectedListing as any).harvestId || selectedListing.id,
        listingId: selectedListing.id,
        farmerId: selectedListing.farmerId,
        quantity: qty,
        unit: 'kg',
        unitPrice: selectedListing.pricePerKg,
        deadline: 'Within 5-7 business days',
        buyerNotes: orderNotes.trim() || undefined,
        linkedCropBatch: `${selectedListing.cropName} — Batch #${Math.floor(1 + Math.random() * 9)}`,
        cropName: selectedListing.cropName,
      });

      if (res.success) {
        // Decrement local quantity
        setListings((prev) =>
          prev.map((l) =>
            l.id === selectedListing.id
              ? { ...l, quantityKg: Math.max(0, l.quantityKg - qty) }
              : l
          )
        );
        setOrderModalVisible(false);
        setSelectedListing(null);

        Alert.alert(
          'Order Placed Successfully! 🎉',
          `Order ${res.orderId} for ${qty} kg of ${selectedListing.cropName} has been submitted to ${selectedListing.farmerName}.`,
          [
            {
              text: 'View My Orders',
              onPress: () => router.push('/(buyer)/orders' as any),
            },
            { text: 'Done', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Order Failed', res.error || 'Could not place order. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Order Failed', e.message || 'An unexpected error occurred.');
    } finally {
      setIsPlacingOrder(false);
    }
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
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Marketplace
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            Verified produce directly from traced farms
          </Text>
        </View>

        {/* Origin Badge */}
        <View
          style={[
            styles.verifiedOriginBadge,
            isDark && styles.verifiedOriginBadgeDark,
          ]}
        >
          <MaterialCommunityIcons
            name="shield-check"
            size={14}
            color={isDark ? '#4ADE80' : '#204A27'}
          />
          <Text
            style={[
              styles.verifiedOriginText,
              isDark && styles.verifiedOriginTextDark,
            ]}
          >
            Verified
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={isDark ? '#8EA790' : '#687A69'}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search crops, farmers, locations..."
            placeholderTextColor={isDark ? '#768B78' : '#8C9B8E'}
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
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={isDark ? '#8EA790' : '#8A9E8D'}
              />
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
        <Text style={[styles.resultsCount, isDark && styles.resultsCountDark]}>
          Showing{' '}
          <Text style={[styles.countNumber, isDark && styles.countNumberDark]}>
            {filteredListings.length}
          </Text>{' '}
          {filteredListings.length === 1 ? 'crop listing' : 'crop listings'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowSortMenu(true)}
          style={[styles.sortButton, isDark && styles.sortButtonDark]}
        >
          <MaterialCommunityIcons
            name="sort"
            size={14}
            color={isDark ? '#4ADE80' : '#1E3523'}
          />
          <Text
            style={[styles.sortButtonText, isDark && styles.sortButtonTextDark]}
          >
            {getSortLabel(sortOption)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={14}
            color={isDark ? '#4ADE80' : '#1E3523'}
          />
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
            tintColor={isDark ? '#4ADE80' : colors.buyer.forestDark}
            colors={[isDark ? '#4ADE80' : colors.buyer.forestDark]}
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
            <View
              style={[
                styles.emptyIconCircle,
                isDark && styles.emptyIconCircleDark,
              ]}
            >
              <MaterialCommunityIcons
                name="sprout-outline"
                size={42}
                color={isDark ? '#4ADE80' : '#7A917B'}
              />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No verified crops found
            </Text>
            <Text
              style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}
            >
              We couldn&apos;t find any listings matching your search or filters.
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
          <View style={[styles.sortModalCard, isDark && styles.sortModalCardDark]}>
            <Text
              style={[styles.sortModalTitle, isDark && styles.sortModalTitleDark]}
            >
              Sort Listings By
            </Text>
            <View style={[styles.sortDivider, isDark && styles.sortDividerDark]} />

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
                  style={[
                    styles.sortOptionRow,
                    isSelected && styles.sortOptionSelected,
                    isSelected && isDark && styles.sortOptionSelectedDark,
                  ]}
                  onPress={() => {
                    setSortOption(opt.id);
                    setShowSortMenu(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      isDark && styles.sortOptionTextDark,
                      isSelected && styles.sortOptionTextSelected,
                      isSelected && isDark && styles.sortOptionTextSelectedDark,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={isDark ? '#4ADE80' : colors.buyer.forestDark}
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
            <View style={[styles.detailCard, isDark && styles.detailCardDark]}>
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setSelectedListing(null)}
                style={[
                  styles.detailCloseBtn,
                  isDark && styles.detailCloseBtnDark,
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={isDark ? '#F0F5F1' : '#16301A'}
                />
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
                  <Text
                    style={[
                      styles.detailCropName,
                      isDark && styles.detailCropNameDark,
                    ]}
                  >
                    {selectedListing.cropName}
                  </Text>
                  <Text
                    style={[
                      styles.detailCategoryText,
                      isDark && styles.detailCategoryTextDark,
                    ]}
                  >
                    {selectedListing.category || 'Produce'} • {selectedListing.location}
                  </Text>
                </View>
                <View style={styles.detailPriceGroup}>
                  <Text
                    style={[
                      styles.detailPrice,
                      isDark && styles.detailPriceDark,
                    ]}
                  >
                    {selectedListing.currency} {selectedListing.pricePerKg}
                  </Text>
                  <Text
                    style={[
                      styles.detailPriceUnit,
                      isDark && styles.detailPriceUnitDark,
                    ]}
                  >
                    per kg
                  </Text>
                </View>
              </View>

              {/* Farmer Info Box */}
              <View
                style={[
                  styles.detailFarmerCard,
                  isDark && styles.detailFarmerCardDark,
                ]}
              >
                <View style={styles.detailFarmerAvatar}>
                  <Text style={styles.detailFarmerInitials}>
                    {selectedListing.farmerName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailFarmerMeta}>
                  <Text
                    style={[
                      styles.detailFarmerName,
                      isDark && styles.detailFarmerNameDark,
                    ]}
                  >
                    {selectedListing.farmerName}
                  </Text>
                  <Text
                    style={[
                      styles.detailFarmerType,
                      isDark && styles.detailFarmerTypeDark,
                    ]}
                  >
                    {selectedListing.farmingType === 'greenhouse'
                      ? '🏡 Greenhouse Certified Farmer'
                      : '🌾 Open-Field Certified Farmer'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.messageFarmerBtn,
                    isDark && styles.messageFarmerBtnDark,
                  ]}
                  onPress={() => {
                    setSelectedListing(null);
                    router.push('/(buyer)/messages');
                  }}
                >
                  <MaterialCommunityIcons
                    name="chat-outline"
                    size={18}
                    color={isDark ? '#4ADE80' : '#1E3523'}
                  />
                </TouchableOpacity>
              </View>

              {/* Verification & Traceability Highlights */}
              <View
                style={[
                  styles.detailTraceBox,
                  isDark && styles.detailTraceBoxDark,
                ]}
              >
                <View style={styles.detailTraceHeader}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={16}
                    color={isDark ? '#4ADE80' : '#2E7D32'}
                  />
                  <Text
                    style={[
                      styles.detailTraceTitle,
                      isDark && styles.detailTraceTitleDark,
                    ]}
                  >
                    TraceRoot Audit Journey
                  </Text>
                </View>
                <View style={styles.detailTraceGrid}>
                  <View style={styles.detailTraceCol}>
                    <Text
                      style={[
                        styles.detailTraceStat,
                        isDark && styles.detailTraceStatDark,
                      ]}
                    >
                      {selectedListing.recordsCount}
                    </Text>
                    <Text
                      style={[
                        styles.detailTraceLabel,
                        isDark && styles.detailTraceLabelDark,
                      ]}
                    >
                      Evidence Logs
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.detailTraceDivider,
                      isDark && styles.detailTraceDividerDark,
                    ]}
                  />
                  <View style={styles.detailTraceCol}>
                    <Text
                      style={[
                        styles.detailTraceStat,
                        isDark && styles.detailTraceStatDark,
                      ]}
                    >
                      {selectedListing.completedStages}/{selectedListing.totalStages}
                    </Text>
                    <Text
                      style={[
                        styles.detailTraceLabel,
                        isDark && styles.detailTraceLabelDark,
                      ]}
                    >
                      Growth Stages
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.detailTraceDivider,
                      isDark && styles.detailTraceDividerDark,
                    ]}
                  />
                  <View style={styles.detailTraceCol}>
                    <Text
                      style={[
                        styles.detailTraceStat,
                        isDark && styles.detailTraceStatDark,
                      ]}
                    >
                      {selectedListing.isOrganic ? '100%' : 'Standard'}
                    </Text>
                    <Text
                      style={[
                        styles.detailTraceLabel,
                        isDark && styles.detailTraceLabelDark,
                      ]}
                    >
                      Organic Audit
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom Actions */}
              <View style={styles.detailActionButtons}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setOrderQuantity('10');
                    setOrderNotes('');
                    setOrderModalVisible(true);
                  }}
                  style={styles.primaryOrderBtn}
                >
                  <MaterialCommunityIcons
                    name="basket-plus-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryOrderBtnText}>Place Direct Order</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedListing(null);
                    router.push('/(buyer)/contracts/new');
                  }}
                  style={[styles.secondaryContractBtn, isDark && styles.secondaryContractBtnDark]}
                >
                  <MaterialCommunityIcons
                    name="file-document-edit-outline"
                    size={17}
                    color={isDark ? '#4ADE80' : colors.buyer.forestDark}
                  />
                  <Text style={[styles.secondaryContractBtnText, isDark && styles.secondaryContractBtnTextDark]}>
                    Request Contract Farming
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* Order Placement Modal */}
      <Modal
        visible={orderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isPlacingOrder) {
            setOrderModalVisible(false);
          }
        }}
      >
        <View style={styles.orderOverlay}>
          <View style={[styles.orderCard, isDark && styles.orderCardDark]}>
            <View style={styles.orderHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.orderTitle, isDark && styles.orderTitleDark]}>
                  Place Direct Order
                </Text>
                <Text style={[styles.orderSubtitle, isDark && styles.orderSubtitleDark]}>
                  {selectedListing?.cropName} • {selectedListing?.farmerName}
                </Text>
              </View>
              <TouchableOpacity
                disabled={isPlacingOrder}
                onPress={() => setOrderModalVisible(false)}
                style={[styles.orderCloseBtn, isDark && styles.orderCloseBtnDark]}
              >
                <MaterialCommunityIcons name="close" size={18} color={isDark ? '#FFF' : '#333'} />
              </TouchableOpacity>
            </View>

            {/* Quantity Selector */}
            <View style={[styles.orderSection, isDark && styles.orderSectionDark]}>
              <Text style={[styles.orderSectionLabel, isDark && styles.orderSectionLabelDark]}>
                Order Quantity (kg)
              </Text>
              <View style={styles.qtyControlRow}>
                <TouchableOpacity
                  style={[styles.qtyStepBtn, isDark && styles.qtyStepBtnDark]}
                  onPress={() => {
                    const cur = parseFloat(orderQuantity) || 10;
                    setOrderQuantity(String(Math.max(1, cur - 5)));
                  }}
                >
                  <MaterialCommunityIcons name="minus" size={20} color={isDark ? '#4ADE80' : '#1E3523'} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.qtyInput, isDark && styles.qtyInputDark]}
                  keyboardType="numeric"
                  value={orderQuantity}
                  onChangeText={setOrderQuantity}
                />
                <TouchableOpacity
                  style={[styles.qtyStepBtn, isDark && styles.qtyStepBtnDark]}
                  onPress={() => {
                    const cur = parseFloat(orderQuantity) || 10;
                    const max = selectedListing?.quantityKg || 9999;
                    setOrderQuantity(String(Math.min(max, cur + 5)));
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={isDark ? '#4ADE80' : '#1E3523'} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.availableStockText, isDark && styles.availableStockTextDark]}>
                Max available: {selectedListing?.quantityKg} kg
              </Text>
            </View>

            {/* Price Breakdown */}
            <View style={[styles.calcBox, isDark && styles.calcBoxDark]}>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, isDark && styles.calcLabelDark]}>Unit Price</Text>
                <Text style={[styles.calcValue, isDark && styles.calcValueDark]}>
                  LKR {selectedListing?.pricePerKg || 0} / kg
                </Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, isDark && styles.calcLabelDark]}>Subtotal</Text>
                <Text style={[styles.calcValue, isDark && styles.calcValueDark]}>
                  LKR {Math.round((parseFloat(orderQuantity) || 0) * (selectedListing?.pricePerKg || 0)).toLocaleString()}
                </Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, isDark && styles.calcLabelDark]}>Logistics & Quality Escrow</Text>
                <Text style={[styles.calcValue, isDark && styles.calcValueDark]}>
                  LKR {Math.round((parseFloat(orderQuantity) || 0) * (selectedListing?.pricePerKg || 0) * 0.08).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.calcDivider, isDark && styles.calcDividerDark]} />
              <View style={styles.calcRow}>
                <Text style={[styles.calcTotalLabel, isDark && styles.calcTotalLabelDark]}>Estimated Total</Text>
                <Text style={[styles.calcTotalValue, isDark && styles.calcTotalValueDark]}>
                  LKR {Math.round((parseFloat(orderQuantity) || 0) * (selectedListing?.pricePerKg || 0) * 1.08).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Notes */}
            <TextInput
              style={[styles.notesInput, isDark && styles.notesInputDark]}
              placeholder="Delivery notes or packing preferences (optional)"
              placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
              numberOfLines={2}
            />

            {/* Confirm Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              disabled={isPlacingOrder}
              onPress={handleConfirmOrder}
              style={[styles.confirmOrderBtn, isPlacingOrder && { opacity: 0.7 }]}
            >
              {isPlacingOrder ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.confirmOrderBtnText}>Confirm & Place Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitleDark: {
    color: '#F0F5F1',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    marginTop: 2,
  },
  headerSubtitleDark: {
    color: '#98B39B',
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
  verifiedOriginBadgeDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  verifiedOriginText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#204A27',
  },
  verifiedOriginTextDark: {
    color: '#4ADE80',
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
  searchBarDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#16301A',
  },
  searchInputDark: {
    color: '#F0F5F1',
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
  resultsCountDark: {
    color: '#98B39B',
  },
  countNumber: {
    fontWeight: '700',
    color: '#16301A',
  },
  countNumberDark: {
    color: '#F0F5F1',
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
  sortButtonDark: {
    backgroundColor: '#18271C',
  },
  sortButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E3523',
  },
  sortButtonTextDark: {
    color: '#4ADE80',
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
  emptyIconCircleDark: {
    backgroundColor: '#18271C',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 6,
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptySubtitleDark: {
    color: '#98B39B',
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
  sortModalCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
    borderWidth: 1,
  },
  sortModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16301A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 12,
  },
  sortModalTitleDark: {
    color: '#F0F5F1',
  },
  sortDivider: {
    height: 1,
    backgroundColor: '#EBE7DE',
    marginBottom: 8,
  },
  sortDividerDark: {
    backgroundColor: '#263B2B',
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
  sortOptionSelectedDark: {
    backgroundColor: '#223826',
  },
  sortOptionText: {
    fontSize: 13.5,
    color: '#3C4D3E',
    fontWeight: '500',
  },
  sortOptionTextDark: {
    color: '#B0C5B2',
  },
  sortOptionTextSelected: {
    color: colors.buyer.forestDark,
    fontWeight: '700',
  },
  sortOptionTextSelectedDark: {
    color: '#4ADE80',
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
  detailCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
    borderTopWidth: 1,
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
  detailCloseBtnDark: {
    backgroundColor: '#223826',
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
  detailCropNameDark: {
    color: '#F0F5F1',
  },
  detailCategoryText: {
    fontSize: 12.5,
    color: '#6A7B6B',
    marginTop: 2,
  },
  detailCategoryTextDark: {
    color: '#98B39B',
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
  detailPriceDark: {
    color: '#F0F5F1',
  },
  detailPriceUnit: {
    fontSize: 11,
    color: '#768776',
  },
  detailPriceUnitDark: {
    color: '#98B39B',
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
  detailFarmerCardDark: {
    backgroundColor: '#132116',
    borderColor: '#263B2B',
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
  detailFarmerNameDark: {
    color: '#F0F5F1',
  },
  detailFarmerType: {
    fontSize: 11.5,
    color: '#6A7B6B',
    marginTop: 2,
  },
  detailFarmerTypeDark: {
    color: '#98B39B',
  },
  messageFarmerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBE6DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageFarmerBtnDark: {
    backgroundColor: '#223826',
  },
  detailTraceBox: {
    backgroundColor: '#EBF4ED',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 0.5,
    borderColor: '#D2E6D6',
  },
  detailTraceBoxDark: {
    backgroundColor: '#142517',
    borderColor: '#263B2B',
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
  detailTraceTitleDark: {
    color: '#4ADE80',
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
  detailTraceStatDark: {
    color: '#F0F5F1',
  },
  detailTraceLabel: {
    fontSize: 10.5,
    color: '#556E58',
    marginTop: 2,
  },
  detailTraceLabelDark: {
    color: '#98B39B',
  },
  detailTraceDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#C5DCC9',
  },
  detailTraceDividerDark: {
    backgroundColor: '#263B2B',
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
  primaryOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3523',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 10,
  },
  primaryOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE6DB',
    borderRadius: 22,
    paddingVertical: 12,
    gap: 8,
  },
  secondaryContractBtnDark: {
    backgroundColor: '#1C2E20',
  },
  secondaryContractBtnText: {
    color: '#1E3523',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryContractBtnTextDark: {
    color: '#4ADE80',
  },
  orderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  orderCard: {
    width: '100%',
    backgroundColor: '#FAF8F3',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  orderCardDark: {
    backgroundColor: '#162218',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301A',
  },
  orderTitleDark: {
    color: '#F0F5F1',
  },
  orderSubtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    marginTop: 2,
  },
  orderSubtitleDark: {
    color: '#98B39B',
  },
  orderCloseBtn: {
    padding: 4,
  },
  orderCloseBtnDark: {},
  orderSection: {
    marginBottom: 14,
  },
  orderSectionDark: {},
  orderSectionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#344E39',
    marginBottom: 8,
  },
  orderSectionLabelDark: {
    color: '#98B39B',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  qtyStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2DFD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyStepBtnDark: {
    backgroundColor: '#263B2B',
  },
  qtyInput: {
    width: 90,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#16301A',
    borderWidth: 1,
    borderColor: '#D4CFBE',
  },
  qtyInputDark: {
    backgroundColor: '#1E2F22',
    color: '#F0F5F1',
    borderColor: '#36533B',
  },
  availableStockText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#6A7B6B',
    marginTop: 6,
  },
  availableStockTextDark: {
    color: '#98B39B',
  },
  calcBox: {
    backgroundColor: '#EFECE2',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  calcBoxDark: {
    backgroundColor: '#1C2E20',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calcLabel: {
    fontSize: 12,
    color: '#556E58',
  },
  calcLabelDark: {
    color: '#98B39B',
  },
  calcValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16301A',
  },
  calcValueDark: {
    color: '#F0F5F1',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#D4CFBE',
    marginVertical: 6,
  },
  calcDividerDark: {
    backgroundColor: '#2D4433',
  },
  calcTotalLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16301A',
  },
  calcTotalLabelDark: {
    color: '#F0F5F1',
  },
  calcTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3523',
  },
  calcTotalValueDark: {
    color: '#4ADE80',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4CFBE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#16301A',
    marginBottom: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  notesInputDark: {
    backgroundColor: '#1E2F22',
    borderColor: '#36533B',
    color: '#F0F5F1',
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3523',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
  },
  confirmOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
