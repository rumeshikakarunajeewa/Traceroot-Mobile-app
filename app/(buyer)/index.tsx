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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F2EB" />

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
          <Text style={styles.sectionTitle}>New Listings</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBrowseAllListings}
            style={styles.pillButton}
          >
            <Text style={styles.pillButtonText}>Browse All</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#16301A" />
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
            <Text style={styles.emptySearchText}>
              No produce matching "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Active Contract Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Contract</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleViewAllContracts}
            style={styles.pillButton}
          >
            <Text style={styles.pillButtonText}>View All</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#16301A" />
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
  pillButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16301A',
  },
  emptySearchContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: '#6E826F',
  },
  bottomSpacer: {
    height: 30,
  },
});
