import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SupplierProductCatalogueCard } from '../../../src/components/supplier/SupplierProductCatalogueCard';
import {
  CATALOGUE_CATEGORIES,
} from '../../../src/constants/supplierCatalogueData';
import { useSupplierCatalogue } from '../../../src/store/supplierCatalogueStore';
import { useDarkMode } from '../../../src/store/uiStore';
import { useLanguage } from '../../../src/i18n/languageStore';
import { CatalogueCategory, CatalogueProduct } from '../../../src/types/supplier.types';

export default function SupplierCatalogueScreen() {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<CatalogueCategory>('All');
  const [products] = useSupplierCatalogue();
  const [refreshing, setRefreshing] = useState(false);

  const getCategoryLabel = (cat: CatalogueCategory) => {
    switch (cat) {
      case 'All':
        return t('catAll');
      case 'Seeds':
        return t('catSeeds');
      case 'Fertilizers':
        return t('catFertilizers');
      case 'Pesticides':
        return t('catPesticides');
      case 'Compost':
        return t('catCompost');
      default:
        return cat;
    }
  };

  // Filter products based on selected tab
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const handleBackToDashboard = () => {
    router.push('/(supplier)');
  };

  const handleAddNewProduct = () => {
    router.push('/(supplier)/catalogue/new');
  };

  const handleEditProduct = (product: CatalogueProduct) => {
    router.push({
      pathname: '/(supplier)/catalogue/[id]',
      params: { id: product.id },
    });
  };

  const handleProductPress = (product: CatalogueProduct) => {
    handleEditProduct(product);
  };

  // Group products into rows of 2 for grid layout
  const rows: CatalogueProduct[][] = [];
  for (let i = 0; i < filteredProducts.length; i += 2) {
    rows.push(filteredProducts.slice(i, i + 2));
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#4ADE80' : '#187A36'}
            colors={['#187A36']}
          />
        }
      >
        {/* 1. Header Back Pill Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBackToDashboard}
            style={[styles.backPill, isDark && styles.backPillDark]}
            accessibilityRole="button"
            accessibilityLabel={t('dashboardTitle')}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={18}
              color={isDark ? '#DCE8DE' : '#2D4030'}
            />
            <Text style={[styles.backPillText, isDark && styles.backPillTextDark]}>
              {t('dashboardTitle')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Subtitle Tagline */}
        <View style={styles.taglineRow}>
          <MaterialCommunityIcons
            name="notebook-outline"
            size={14}
            color={isDark ? '#8FA392' : '#5E7461'}
            style={styles.taglineIcon}
          />
          <Text style={[styles.taglineText, isDark && styles.taglineTextDark]}>
            {t('agriRawMaterials')}
          </Text>
        </View>

        {/* 3. Screen Title */}
        <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>
          {t('productCatalogue')}
        </Text>

        {/* 4. Category Filter Chips (Horizontal) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterWrapper}
        >
          {CATALOGUE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.filterChip,
                  isSelected
                    ? isDark
                      ? styles.filterChipActiveDark
                      : styles.filterChipActive
                    : isDark
                    ? styles.filterChipInactiveDark
                    : styles.filterChipInactive,
                ]}
                accessibilityRole="button"
                accessibilityState={isSelected ? { selected: true } : {}}
                accessibilityLabel={`${getCategoryLabel(cat)} filter`}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected
                      ? styles.filterChipTextActive
                      : isDark
                      ? styles.filterChipTextInactiveDark
                      : styles.filterChipTextInactive,
                  ]}
                >
                  {getCategoryLabel(cat)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Count Summary Row */}
        <View style={styles.countRow}>
          <View style={styles.countUnderlineWrapper}>
            <Text style={[styles.countTextBold, isDark && styles.countTextBoldDark]}>
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1
                ? t('productUnitSingle')
                : t('productUnitPlural')}
            </Text>
            <View
              style={[
                styles.countUnderline,
                isDark && styles.countUnderlineDark,
              ]}
            />
          </View>
          <Text style={[styles.countTextMuted, isDark && styles.countTextMutedDark]}>
            {' '}{t('listedText')}
          </Text>
        </View>

        {/* 6. Product 2-Column Grid */}
        <View style={styles.gridContainer}>
          {rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.gridRow}>
              {row.map((product) => (
                <View key={product.id} style={styles.gridColumn}>
                  <SupplierProductCatalogueCard
                    product={product}
                    onPress={handleProductPress}
                    onEditPress={handleEditProduct}
                  />
                </View>
              ))}
              {/* If odd number of products in row, insert an invisible spacer */}
              {row.length === 1 && <View style={styles.gridColumn} />}
            </View>
          ))}
        </View>

        {/* 7. "Add New Product" Action Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAddNewProduct}
          style={[styles.addCard, isDark && styles.addCardDark]}
          accessibilityRole="button"
          accessibilityLabel={`${t('addNewProductCardTitle')} - ${t('addToYourCatalogue')}`}
        >
          {/* Left Circular Plus Button */}
          <View style={[styles.plusCircle, isDark && styles.plusCircleDark]}>
            <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
          </View>

          {/* Right Text Content */}
          <View style={styles.addCardContent}>
            <Text style={[styles.addCardTitle, isDark && styles.addCardTitleDark]}>
              {t('addNewProductCardTitle')}
            </Text>
            <Text
              style={[
                styles.addCardSubtitle,
                isDark && styles.addCardSubtitleDark,
              ]}
            >
              {t('addToYourCatalogue')}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Warm natural linen cream matching Figma
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 130, // Space for floating bottom tab bar
  },
  backButtonContainer: {
    marginBottom: 16,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E2DDD2',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  backPillDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  backPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#28402D',
    marginLeft: 3,
  },
  backPillTextDark: {
    color: '#DCE8DE',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taglineIcon: {
    marginRight: 6,
  },
  taglineText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#5E7461',
    letterSpacing: 0.1,
  },
  taglineTextDark: {
    color: '#8FA392',
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  screenTitleDark: {
    color: '#F0F5F1',
  },
  filterWrapper: {
    marginBottom: 18,
    marginHorizontal: -16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#40583E', // Forest green active pill
  },
  filterChipActiveDark: {
    backgroundColor: '#496A47',
  },
  filterChipInactive: {
    backgroundColor: '#EFEAE0',
    borderWidth: 1,
    borderColor: '#DDD6C8',
  },
  filterChipInactiveDark: {
    backgroundColor: '#16261A',
    borderWidth: 1,
    borderColor: '#263B2B',
  },
  filterChipText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipTextInactive: {
    color: '#344937',
  },
  filterChipTextInactiveDark: {
    color: '#A2B9A5',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
    paddingLeft: 2,
  },
  countUnderlineWrapper: {
    position: 'relative',
  },
  countTextBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28402D',
  },
  countTextBoldDark: {
    color: '#DCE8DE',
  },
  countUnderline: {
    height: 1.5,
    backgroundColor: '#40583E',
    marginTop: 1,
    borderRadius: 1,
  },
  countUnderlineDark: {
    backgroundColor: '#5C8A59',
  },
  countTextMuted: {
    fontSize: 14,
    color: '#6B7E6F',
    fontWeight: '500',
  },
  countTextMutedDark: {
    color: '#8FA392',
  },
  gridContainer: {
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridColumn: {
    flex: 1,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8F3',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#BDC7B8',
    borderStyle: 'dashed',
    padding: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  addCardDark: {
    backgroundColor: '#142217',
    borderColor: '#2E4C35',
  },
  plusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1C3723',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  plusCircleDark: {
    backgroundColor: '#26422C',
  },
  addCardContent: {
    flex: 1,
  },
  addCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 2,
  },
  addCardTitleDark: {
    color: '#F0F5F1',
  },
  addCardSubtitle: {
    fontSize: 13,
    color: '#6E8272',
    fontWeight: '500',
  },
  addCardSubtitleDark: {
    color: '#95A997',
  },
});
