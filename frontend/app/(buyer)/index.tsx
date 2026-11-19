import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useDarkMode } from '../../src/store/uiStore';
import { useAuth } from '../../src/store/authStore';
import { authService } from '../../src/services/auth.service';
import { profilesService } from '../../src/services/profiles.service';
import { BuyerHeader } from '../../src/components/buyer/BuyerHeader';
import { BuyerHeroBanner } from '../../src/components/buyer/BuyerHeroBanner';
import { BuyerQuickActions } from '../../src/components/buyer/BuyerQuickActions';
import { BuyerTraceabilityCard } from '../../src/components/buyer/BuyerTraceabilityCard';
import { BuyerListingCard } from '../../src/components/buyer/BuyerListingCard';
import { BuyerContractCard } from '../../src/components/buyer/BuyerContractCard';
import { ordersService } from '../../src/services/orders.service';
import { contractsService } from '../../src/services/contracts.service';

import {
  mockQuickActions,
  BUYER_HERO_IMAGE,
} from '../../src/constants/buyerMockData';
import {
  BuyerProfile,
  ProduceListing,
  ActiveContractItem,
  QuickActionItem,
} from '../../src/types/buyer.types';

export default function BuyerHomeScreen() {
  const [isDark] = useDarkMode();
  const { user, profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [activeContracts, setActiveContracts] = useState<ActiveContractItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actions, setActions] = useState(mockQuickActions);

  // Load all buyer dashboard data
  const loadHomeData = useCallback(async () => {
    try {
      const currentUser = user || (await authService.getSession())?.user;
      const [fetchedListings, realProfile] = await Promise.all([
        ordersService.fetchMarketplaceListings(),
        currentUser?.id ? profilesService.getBuyerProfile(currentUser.id) : null,
      ]);

      if (fetchedListings) {
        setListings(fetchedListings);
      }
      if (realProfile) {
        setProfile(realProfile);
      }

      if (currentUser?.id) {
        const contracts = await contractsService.getBuyerContracts(currentUser.id);
        setActiveContracts(contracts);
      }
    } catch (err) {
      console.warn('Failed to load buyer home data:', err);
    }
  }, [user]);

  // Refresh data whenever buyer navigates to or focuses Home screen tab
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  }, [loadHomeData]);

  // Construct safe display profile for account owner
  const fallbackName = authProfile?.full_name || 'Buyer';
  const displayProfile: BuyerProfile = profile || {
    id: user?.id || '',
    fullName: fallbackName,
    initials: fallbackName
      ? fallbackName
          .split(' ')
          .filter(Boolean)
          .map((part: string) => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'TR',
    isVerified: false,
    avatarUrl: authProfile?.avatar_url || null,
    roleTitle: 'Wholesale Buyer',
    ordersCount: 0,
    contractsCount: 0,
    kgSourced: '0 kg',
  };

  const dynamicStats = {
    activeOrders: profile?.ordersCount ?? 0,
    contractsCount: activeContracts.length || (profile?.contractsCount ?? 0),
    verifiedFarmsCount: listings.length > 0 ? new Set(listings.map((l) => l.farmerId)).size : 0,
  };

  // Filter listings based on search query
  const filteredListings = listings.filter((listing) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.cropName.toLowerCase().includes(query) ||
      listing.farmerName.toLowerCase().includes(query) ||
      listing.location.toLowerCase().includes(query) ||
      listing.farmingType.toLowerCase().includes(query)
    );
  });

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(buyer)/explore',
        params: { search: searchQuery.trim() },
      });
    }
  };

  const handleQuickAction = (selectedAction: QuickActionItem) => {
    setActions((prev) =>
      prev.map((a) => ({
        ...a,
        isActive: a.id === selectedAction.id,
      }))
    );

    if (selectedAction.route === 'scan-qr') {
      handleOpenScanner();
    } else if (selectedAction.route) {
      router.push(selectedAction.route as any);
    }
  };

  const handleOpenScanner = () => {
    Alert.alert(
      'TraceRoot QR Scanner',
      'Point your camera at any TraceRoot produce QR code to verify its immutable cultivation chain.',
      [{ text: 'OK' }]
    );
  };

  const handleListingPress = (listing: ProduceListing) => {
    router.push({
      pathname: '/(buyer)/explore',
      params: { crop: listing.cropName },
    });
  };

  const handleContractPress = (contract: ActiveContractItem) => {
    router.push('/(buyer)/contracts');
  };

  const handleBrowseAllListings = () => {
    router.push('/(buyer)/explore');
  };

  const handleViewAllContracts = () => {
    router.push('/(buyer)/contracts');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#4ADE80' : '#2E6930'}
            colors={['#2E6930', '#4ADE80']}
          />
        }
      >
        {/* Top App Bar / Profile Header with real owner data */}
        <BuyerHeader
          profile={displayProfile}
          onPressProfile={() => router.push('/(buyer)/profile')}
        />

        {/* Hero Banner with Handshake photo, Search & Stats */}
        <BuyerHeroBanner
          heroImageUrl={BUYER_HERO_IMAGE}
          stats={dynamicStats}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        {/* Quick Actions Grid (Market, Contracts, Scan QR, Orders) */}
        <BuyerQuickActions actions={actions} onActionPress={handleQuickAction} />

        {/* Scan QR Traceability Banner */}
        <BuyerTraceabilityCard onOpenScanner={handleOpenScanner} />

        {/* New Listings Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            New Listings
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBrowseAllListings}
            style={[styles.pillButton, isDark && styles.pillButtonDark]}
          >
            <Text style={[styles.pillButtonText, isDark && styles.pillButtonTextDark]}>
              Browse All
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={isDark ? '#4ADE80' : '#16301A'}
            />
          </TouchableOpacity>
        </View>

        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <BuyerListingCard
              key={listing.id}
              listing={listing}
              onPress={handleListingPress}
            />
          ))
        ) : (
          <View style={styles.emptySearchContainer}>
            <Text style={[styles.emptySearchText, isDark && styles.emptySearchTextDark]}>
              No produce matching &quot;{searchQuery}&quot;
            </Text>
          </View>
        )}

        {/* Active Contract Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Active Contract
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleViewAllContracts}
            style={[styles.pillButton, isDark && styles.pillButtonDark]}
          >
            <Text style={[styles.pillButtonText, isDark && styles.pillButtonTextDark]}>
              View All
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={isDark ? '#4ADE80' : '#16301A'}
            />
          </TouchableOpacity>
        </View>

        {activeContracts.length > 0 ? (
          <BuyerContractCard
            contract={activeContracts[0]}
            onPress={handleContractPress}
          />
        ) : (
          <View style={[styles.emptyContractCard, isDark && styles.emptyContractCardDark]}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={32}
              color={isDark ? '#4ADE80' : '#2E6930'}
              style={{ marginBottom: 6 }}
            />
            <Text style={[styles.emptyContractTitle, isDark && styles.emptyContractTitleDark]}>
              No Active Contracts
            </Text>
            <Text style={[styles.emptyContractSubtitle, isDark && styles.emptyContractSubtitleDark]}>
              Contract farming agreements formed with growers will appear here.
            </Text>
          </View>
        )}

        {/* Extra Bottom Spacing for Tab Bar clearance */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Warm cream background
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16301A',
    letterSpacing: -0.2,
  },
  sectionTitleDark: {
    color: '#F0F5F1',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFD9CD',
    backgroundColor: '#F5F2EB',
    gap: 2,
  },
  pillButtonDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  pillButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16301A',
  },
  pillButtonTextDark: {
    color: '#4ADE80',
  },
  emptySearchContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: '#6E826F',
  },
  emptySearchTextDark: {
    color: '#98B39B',
  },
  emptyContractCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContractCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  emptyContractTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16301A',
  },
  emptyContractTitleDark: {
    color: '#F0F5F1',
  },
  emptyContractSubtitle: {
    fontSize: 12,
    color: '#6E826F',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyContractSubtitleDark: {
    color: '#98B39B',
  },
  bottomSpacer: {
    height: 30,
  },
});
