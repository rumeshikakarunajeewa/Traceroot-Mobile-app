import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useDarkMode } from '../../../src/store/uiStore';
import { useAuth } from '../../../src/store/authStore';
import { contractsService } from '../../../src/services/contracts.service';
import { ActiveContractItem } from '../../../src/types/buyer.types';
import { BuyerContractCard } from '../../../src/components/buyer/BuyerContractCard';

export default function BuyerContractsScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ActiveContractItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id;

  const loadContracts = useCallback(async () => {
    if (!userId) {
      setContracts([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await contractsService.getBuyerContracts(userId);
      setContracts(data);
    } catch (err) {
      console.warn('[BuyerContractsScreen] Error loading contracts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      return;
    }

    contractsService.getBuyerContracts(userId)
      .then((data) => {
        if (isMounted) {
          setContracts(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[BuyerContractsScreen] Error loading contracts:', err);
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = contractsService.subscribeToBuybacks(userId, () => {
      loadContracts();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId, loadContracts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(buyer)' as any);
    }
  };

  const handleContractPress = (contract: ActiveContractItem) => {
    // Navigate or view agreement details
    router.push({
      pathname: '/(buyer)/explore',
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={isDark ? '#F0F5F1' : '#162C1A'}
            />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.titleDark]}>Contracts</Text>
        </View>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          Active and upcoming cultivation agreements
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDark ? '#4ADE80' : '#1D3724']}
            tintColor={isDark ? '#4ADE80' : '#1D3724'}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#1D3724'} />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              Loading agreements...
            </Text>
          </View>
        ) : contracts.length > 0 ? (
          <View style={styles.contractsList}>
            {contracts.map((c) => (
              <BuyerContractCard
                key={c.id}
                contract={c}
                onPress={handleContractPress}
              />
            ))}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <View style={[styles.emptyIconCircle, isDark && styles.emptyIconCircleDark]}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={34}
                color={isDark ? '#8CA590' : '#7B8E7D'}
              />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No contracts yet
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              Form cultivation and buyback agreements with verified farmers through the marketplace.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(buyer)/explore')}
              style={[styles.exploreBtn, isDark && styles.exploreBtnDark]}
            >
              <MaterialCommunityIcons name="storefront-outline" size={18} color="#FFFFFF" />
              <Text style={styles.exploreBtnText}>Explore Marketplace</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16301A',
  },
  titleDark: {
    color: '#F0F5F1',
  },
  subtitle: {
    fontSize: 13,
    color: '#6A7B6B',
    marginTop: 4,
    paddingLeft: 36,
  },
  subtitleDark: {
    color: '#98B39B',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  contractsList: {
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#6A7B6B',
    marginTop: 12,
  },
  loadingTextDark: {
    color: '#98B39B',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E5E0D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconCircleDark: {
    backgroundColor: '#1E2D22',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#162C1A',
    marginBottom: 8,
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#667968',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptySubtitleDark: {
    color: '#8CA590',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D3724',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  exploreBtnDark: {
    backgroundColor: '#274B32',
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
