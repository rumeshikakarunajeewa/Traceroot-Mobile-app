import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TopProductItem } from '../../types/supplier.types';
import { useDarkMode } from '../../store/uiStore';
import { useLanguage } from '../../i18n/languageStore';

interface SupplierTopProductsProps {
  products: TopProductItem[];
  onProductPress?: (product: TopProductItem) => void;
  onManagePress?: () => void;
}

export const SupplierTopProducts: React.FC<SupplierTopProductsProps> = ({
  products,
  onProductPress,
  onManagePress,
}) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          {t('topProductsTitle')}
        </Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onManagePress}
          style={[styles.managePill, isDark && styles.managePillDark]}
          accessibilityRole="button"
          accessibilityLabel={t('manage')}
        >
          <Text style={[styles.manageText, isDark && styles.manageTextDark]}>
            {t('manage')}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={isDark ? '#A2B9A5' : '#334E37'}
          />
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel / Empty State */}
      {products.length === 0 ? (
        <View style={[styles.emptyContainer, isDark && styles.emptyContainerDark]}>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={36}
            color={isDark ? '#4ADE80' : '#2D6B3C'}
            style={{ marginBottom: 8 }}
          />
          <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
            No products in catalogue yet
          </Text>
          <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
            List seeds, fertilizers, compost, or equipment to supply farmers.
          </Text>
          {onManagePress && (
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.85}
              onPress={onManagePress}
            >
              <Text style={styles.emptyButtonText}>Add Products</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {products.map((product) => {
          const capacity =
            product.maxStock > 0 && product.maxStock !== product.stock * 2
              ? product.maxStock
              : product.stock > 100
              ? Math.ceil(product.stock / 50) * 50
              : 100;

          const progressPercentage =
            product.stock <= 0
              ? 0
              : Math.min(100, Math.round((product.stock / capacity) * 100));

          const isOutOfStock = product.stock <= 0;
          const isLowStock = isOutOfStock || progressPercentage <= 15;
          const progressFillWidth = isOutOfStock
            ? '0%'
            : `${Math.min(100, Math.max(2, progressPercentage))}%`;

          return (
            <TouchableOpacity
              key={product.id}
              activeOpacity={0.88}
              onPress={() => onProductPress?.(product)}
              style={[styles.productCard, isDark && styles.productCardDark]}
              accessibilityRole="button"
              accessibilityLabel={`${product.title}, ${product.currency} ${product.price}, ${t('stockLabel')} ${product.stock}`}
            >
              {/* Image Container with Badge */}
              <View style={styles.imageContainer}>
                <Image
                  source={product.imageUrl}
                  style={styles.image}
                  resizeMode="cover"
                />

                {/* Category Pill Tag Overlay */}
                <View
                  style={[styles.categoryBadge, isDark && styles.categoryBadgeDark]}
                >
                  <Text
                    style={[
                      styles.categoryBadgeText,
                      isDark && styles.categoryBadgeTextDark,
                    ]}
                  >
                    {product.category}
                  </Text>
                </View>
              </View>

              {/* Details & Pricing */}
              <View style={styles.infoContainer}>
                <Text
                  style={[styles.productTitle, isDark && styles.productTitleDark]}
                  numberOfLines={1}
                >
                  {product.title}
                </Text>

                <Text
                  style={[styles.productPrice, isDark && styles.productPriceDark]}
                >
                  {product.currency} {product.price}
                </Text>

                {/* Stock Progress Bar */}
                <View
                  style={[
                    styles.progressBarTrack,
                    isDark && styles.progressBarTrackDark,
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: progressFillWidth as any },
                      isLowStock && { backgroundColor: '#E66826' },
                    ]}
                  />
                </View>

                {/* Stock Label & Percentage */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.stockText, isDark && styles.stockTextDark]}>
                    {t('stockLabel')}: {product.stock}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isLowStock ? '#E66826' : (isDark ? '#4ADE80' : '#4B7045') }}>
                    {progressPercentage}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 100, // Ample space for floating bottom tab bar
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#162E1D',
    letterSpacing: 0.2,
  },
  titleDark: {
    color: '#F0F5F1',
  },
  managePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFD8CC',
    backgroundColor: 'transparent',
  },
  managePillDark: {
    borderColor: '#263D2B',
  },
  manageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#314E36',
    marginRight: 2,
  },
  manageTextDark: {
    color: '#A2B9A5',
  },
  scrollList: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 12,
  },
  productCard: {
    width: 175,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE7DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  productCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  imageContainer: {
    width: '100%',
    height: 118,
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
    backgroundColor: 'rgba(24, 39, 28, 0.92)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#284630',
  },
  categoryBadgeTextDark: {
    color: '#C6E3CB',
  },
  infoContainer: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#162E1D',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 2,
  },
  productTitleDark: {
    color: '#F0F5F1',
  },
  productPrice: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#162E1D',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 8,
  },
  productPriceDark: {
    color: '#F0F5F1',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E4DFD5',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarTrackDark: {
    backgroundColor: '#263B2B',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#52774C', // Olive green progress fill
    borderRadius: 2,
  },
  stockText: {
    fontSize: 11,
    color: '#768778',
    fontWeight: '500',
  },
  stockTextDark: {
    color: '#95A997',
  },
  emptyContainer: {
    marginHorizontal: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E3D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainerDark: {
    backgroundColor: '#152419',
    borderColor: '#243A29',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#162E1D',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#657868',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptySubtitleDark: {
    color: '#95A997',
  },
  emptyButton: {
    backgroundColor: '#2D6B3C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
