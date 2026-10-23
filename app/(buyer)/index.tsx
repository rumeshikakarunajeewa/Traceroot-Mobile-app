import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../src/lib/theme';
import { useDarkMode } from '../../src/store/uiStore';
import { BuyerHeader } from '../../src/components/buyer/BuyerHeader';
import { BuyerHeroBanner } from '../../src/components/buyer/BuyerHeroBanner';
import { BuyerQuickActions } from '../../src/components/buyer/BuyerQuickActions';
import { BuyerTraceabilityCard } from '../../src/components/buyer/BuyerTraceabilityCard';
import { BuyerListingCard } from '../../src/components/buyer/BuyerListingCard';
import { BuyerContractCard } from '../../src/components/buyer/BuyerContractCard';

import {
  mockBuyerProfile,
  mockBuyerStats,
  mockQuickActions,
  mockProduceListings,
  mockActiveContract,
  BUYER_HERO_IMAGE,
} from '../../src/constants/buyerMockData';
import { ProduceListing, ActiveContractItem, QuickActionItem } from '../../src/types/buyer.types';

export default function BuyerHomeScreen() {
  const [isDark] = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [actions, setActions] = useState(mockQuickActions);

  // Filter listings based on search query
  const filteredListings = mockProduceListings.filter((listing) => {
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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0E1710' : '#F5F2EB'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar / Profile Header */}
        <BuyerHeader profile={mockBuyerProfile} />

        {/* Hero Banner with Handshake photo, Search & Stats */}
        <BuyerHeroBanner
          heroImageUrl={BUYER_HERO_IMAGE}
          stats={mockBuyerStats}
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
              No produce matching "{searchQuery}"
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

        <BuyerContractCard
          contract={mockActiveContract}
          onPress={handleContractPress}
        />

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
  bottomSpacer: {
    height: 30,
  },
});
