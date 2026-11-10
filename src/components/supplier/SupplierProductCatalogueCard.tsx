import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CatalogueProduct } from '../../types/supplier.types';
import { useDarkMode } from '../../store/uiStore';

interface SupplierProductCatalogueCardProps {
  product: CatalogueProduct;
  onPress?: (product: CatalogueProduct) => void;
  onEditPress?: (product: CatalogueProduct) => void;
}

export const SupplierProductCatalogueCard: React.FC<
  SupplierProductCatalogueCardProps
> = ({ product, onPress, onEditPress }) => {
  const [isDark] = useDarkMode();

  const progressPercentage = Math.min(
    100,
    Math.max(8, Math.round((product.stock / product.maxStock) * 100))
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(product)}
      style={[styles.card, isDark && styles.cardDark]}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${product.packageSize}, ${product.currency} ${product.price}, Stock ${product.stock} units`}
    >
      {/* Product Image with Overlays */}
      <View style={styles.imageContainer}>
        <Image
          source={product.imageUrl}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Top-Left Category Badge */}
        <View style={[styles.categoryBadge, isDark && styles.categoryBadgeDark]}>
          <Text
            style={[
              styles.categoryBadgeText,
              isDark && styles.categoryBadgeTextDark,
            ]}
          >
            {product.category}
          </Text>
        </View>

        {/* Low Stock Badge Overlay */}
        {product.isLowStock && (
          <View style={styles.lowStockBadge}>
            <View style={styles.lowStockDot} />
            <Text style={styles.lowStockText}>Low stock</Text>
          </View>
        )}
      </View>

      {/* Product Details Section */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <View style={styles.titleWrapper}>
          <Text
            style={[styles.title, isDark && styles.titleDark]}
            numberOfLines={2}
          >
            {product.title}
          </Text>
        </View>

        {/* Unit / Packaging */}
        <Text style={[styles.packageSize, isDark && styles.packageSizeDark]}>
          {product.packageSize}
        </Text>

        {/* Visual Stock Progress Bar */}
        <View
          style={[
            styles.progressTrack,
            isDark && styles.progressTrackDark,
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` },
              product.isLowStock && styles.progressFillLowStock,
            ]}
          />
        </View>

        {/* Stock Count */}
        <Text style={[styles.stockText, isDark && styles.stockTextDark]}>
          Stock: {product.stock} units
        </Text>

        {/* Price & Edit Button Row */}
        <View style={styles.footerRow}>
          <Text style={[styles.priceText, isDark && styles.priceTextDark]}>
            {product.currency} {product.price}
          </Text>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onEditPress?.(product)}
            style={[styles.editButton, isDark && styles.editButtonDark]}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${product.title}`}
          >
            <Text style={[styles.editText, isDark && styles.editTextDark]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE7DC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  imageContainer: {
    width: '100%',
    height: 128,
    position: 'relative',
    backgroundColor: '#EAE6DC',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryBadgeDark: {
    backgroundColor: 'rgba(24, 39, 28, 0.94)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#284630',
  },
  categoryBadgeTextDark: {
    color: '#C6E3CB',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 9,
    backgroundColor: '#E66826',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  lowStockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  lowStockText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  titleWrapper: {
    minHeight: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#162E1D',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    lineHeight: 19,
  },
  titleDark: {
    color: '#F0F5F1',
  },
  packageSize: {
    fontSize: 12,
    color: '#768778',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 6,
  },
  packageSizeDark: {
    color: '#95A997',
  },
  progressTrack: {
    height: 4.5,
    backgroundColor: '#E6E1D7',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressTrackDark: {
    backgroundColor: '#263B2B',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4B7045',
    borderRadius: 3,
  },
  progressFillLowStock: {
    backgroundColor: '#E66826',
  },
  stockText: {
    fontSize: 11,
    color: '#768778',
    fontWeight: '500',
    marginBottom: 10,
  },
  stockTextDark: {
    color: '#95A997',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#162E1D',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  priceTextDark: {
    color: '#F0F5F1',
  },
  editButton: {
    paddingHorizontal: 13,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6C8',
    backgroundColor: '#FAF8F4',
  },
  editButtonDark: {
    backgroundColor: '#1E3223',
    borderColor: '#2D4B34',
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#284630',
  },
  editTextDark: {
    color: '#C6E3CB',
  },
});
