import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockCatalogueProducts } from '../../../src/constants/supplierCatalogueData';
import { useDarkMode } from '../../../src/store/uiStore';

export default function SupplierEditProductScreen() {
  const [isDark] = useDarkMode();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = mockCatalogueProducts.find((p) => p.id === id) || mockCatalogueProducts[0];

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={[styles.backPill, isDark && styles.backPillDark]}
          accessibilityRole="button"
          accessibilityLabel="Back to Catalogue"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={isDark ? '#DCE8DE' : '#2D4030'}
          />
          <Text style={[styles.backPillText, isDark && styles.backPillTextDark]}>
            Catalogue
          </Text>
        </TouchableOpacity>

        {/* Screen Title */}
        <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>
          Edit Product
        </Text>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.productName, isDark && styles.productNameDark]}>
            {product.title.replace('\n', ' ')}
          </Text>
          <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
            Category: {product.category} • {product.packageSize}
          </Text>
          <Text style={[styles.priceText, isDark && styles.priceTextDark]}>
            {product.currency} {product.price}
          </Text>
          <Text style={[styles.stockText, isDark && styles.stockTextDark]}>
            Current Stock: {product.stock} units
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
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
    marginBottom: 20,
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
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 16,
  },
  screenTitleDark: {
    color: '#F0F5F1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#162E1D',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 6,
  },
  productNameDark: {
    color: '#F0F5F1',
  },
  metaText: {
    fontSize: 14,
    color: '#6B7E6F',
    marginBottom: 12,
  },
  metaTextDark: {
    color: '#95A997',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 6,
  },
  priceTextDark: {
    color: '#E9F0EA',
  },
  stockText: {
    fontSize: 14,
    color: '#4B7045',
    fontWeight: '600',
  },
  stockTextDark: {
    color: '#64A75E',
  },
});