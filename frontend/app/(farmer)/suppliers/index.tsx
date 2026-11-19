import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CATALOGUE_CATEGORIES } from '../../../src/constants/supplierCatalogueData';
import { useAuth } from '../../../src/hooks/useAuth';
import { supabase } from '../../../src/lib/supabase';
import { catalogueService } from '../../../src/services/catalogue.service';
import { supplierOrdersService } from '../../../src/services/supplierOrders.service';
import { useDarkMode } from '../../../src/store/uiStore';
import { CatalogueCategory, CatalogueProduct } from '../../../src/types/supplier.types';

export default function FarmerSupplierMarketplaceScreen() {
  const [isDark] = useDarkMode();
  const { farmerId } = useAuth();

  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CatalogueCategory>('All');

  // Order Placement Modal State
  const [selectedProduct, setSelectedProduct] = useState<CatalogueProduct | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderQty, setOrderQty] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<'Farm Delivery' | 'Supplier Pickup'>('Farm Delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Load products from Supabase
  const loadProducts = useCallback(async () => {
    try {
      const items = await catalogueService.getCatalogueProducts(
        undefined,
        selectedCategory === 'All' ? undefined : selectedCategory
      );
      setProducts(items);
    } catch (err) {
      console.warn('[FarmerSupplierMarketplace] loadProducts error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadProducts();

    const unsubscribe = catalogueService.subscribeToCatalogue(() => {
      loadProducts();
    });

    return () => {
      unsubscribe();
    };
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.supplierName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Open order modal for a product
  const handleOpenOrderModal = (product: CatalogueProduct) => {
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', 'This item is currently out of stock.');
      return;
    }
    setSelectedProduct(product);
    setOrderQty(1);
    setDeliveryMethod('Farm Delivery');
    setOrderNotes('');
    setOrderModalVisible(true);
  };

  // Submit order to Supabase
  const handleConfirmOrder = async () => {
    if (!selectedProduct) return;

    if (orderQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please choose at least 1 unit.');
      return;
    }

    if (orderQty > selectedProduct.stock) {
      Alert.alert('Insufficient Stock', `Only ${selectedProduct.stock} units available.`);
      return;
    }

    setIsSubmittingOrder(true);
    try {
      let resolvedFarmerId = farmerId;
      if (!resolvedFarmerId || resolvedFarmerId === 'farmer-1') {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          resolvedFarmerId = session.user.id;
        }
      }

      if (!resolvedFarmerId) {
        Alert.alert('Authentication Required', 'Please log in to place an order.');
        setIsSubmittingOrder(false);
        return;
      }

      const supplierId = selectedProduct.supplierId || 'supplier-demo';
      const totalAmount = selectedProduct.price * orderQty;

      const result = await supplierOrdersService.placeSupplierOrder({
        farmerId: resolvedFarmerId,
        supplierId,
        items: [
          {
            catalogueItemId: selectedProduct.id,
            title: selectedProduct.title,
            quantity: orderQty,
            unit: selectedProduct.soldPer || 'kg',
            price: selectedProduct.price,
            imageUrl:
              typeof selectedProduct.imageUrl === 'object' && selectedProduct.imageUrl?.uri
                ? selectedProduct.imageUrl.uri
                : undefined,
          },
        ],
        totalAmount,
        deliveryMethod,
        notes: orderNotes.trim() || undefined,
      });

      if (!result.success) {
        Alert.alert('Order Failed', result.error || 'Could not place order. Please try again.');
        setIsSubmittingOrder(false);
        return;
      }

      // Decrement local product stock immediately for responsive UX
      setProducts((prev) =>
        prev.map((item) =>
          item.id === selectedProduct.id
            ? { ...item, stock: Math.max(0, item.stock - orderQty) }
            : item
        )
      );

      setOrderModalVisible(false);
      Alert.alert(
        'Order Placed Successfully!',
        `Your request for ${orderQty} ${selectedProduct.soldPer || 'pack'} of "${selectedProduct.title}" has been sent to the supplier.`,
        [
          {
            text: 'View My Orders',
            onPress: () => router.push('/(farmer)/suppliers/orders'),
          },
          {
            text: 'Done',
            style: 'cancel',
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const renderProductItem = ({ item }: { item: CatalogueProduct }) => {
    const isOutOfStock = item.stock <= 0;

    return (
      <View style={[styles.productCard, isDark && styles.productCardDark]}>
        <View style={styles.imageContainer}>
          <Image
            source={
              typeof item.imageUrl === 'string'
                ? { uri: item.imageUrl }
                : item.imageUrl || require('../../../assets/images/supplier_seed_sack.jpg')
            }
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          {item.isOrganicCertified && (
            <View style={styles.organicBadge}>
              <MaterialCommunityIcons name="leaf" size={12} color="#FFFFFF" />
              <Text style={styles.organicBadgeText}>Organic</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, isDark && styles.productTitleDark]} numberOfLines={2}>
            {item.title}
          </Text>

          {item.supplierName && (
            <TouchableOpacity
              style={styles.supplierRow}
              onPress={() => {
                if (item.supplierId) {
                  router.push({
                    pathname: '/(farmer)/suppliers/[supplierId]',
                    params: { supplierId: item.supplierId },
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="storefront-outline" size={14} color={isDark ? '#4ADE80' : '#255D35'} />
              <Text style={[styles.supplierName, isDark && styles.supplierNameDark]} numberOfLines={1}>
                {item.supplierName}
              </Text>
              <Feather name="chevron-right" size={12} color={isDark ? '#7E9F85' : '#888'} />
            </TouchableOpacity>
          )}

          {item.description ? (
            <Text style={[styles.productDesc, isDark && styles.productDescDark]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.priceStockRow}>
            <View>
              <Text style={[styles.priceAmount, isDark && styles.priceAmountDark]}>
                Rs. {item.price.toLocaleString()}
              </Text>
              <Text style={[styles.priceUnit, isDark && styles.priceUnitDark]}>
                per {item.soldPer || item.packageSize || 'unit'}
              </Text>
            </View>

            <View style={[styles.stockPill, isOutOfStock ? styles.outOfStockPill : styles.inStockPill]}>
              <Text style={[styles.stockText, isOutOfStock ? styles.outOfStockText : styles.inStockText]}>
                {isOutOfStock ? 'Out of Stock' : `${item.stock} available`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.orderButton,
              isDark && styles.orderButtonDark,
              isOutOfStock && styles.orderButtonDisabled,
            ]}
            onPress={() => handleOpenOrderModal(item)}
            disabled={isOutOfStock}
            activeOpacity={0.8}
          >
            <Feather name="shopping-bag" size={16} color="#FFFFFF" />
            <Text style={styles.orderButtonText}>
              {isOutOfStock ? 'Sold Out' : 'Order Supplies'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header Bar */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isDark && styles.backButtonDark]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={20} color={isDark ? '#E8F5E9' : '#1C3723'} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Agri Supplies</Text>
          <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
            Seeds, Fertilizers & Farming Inputs
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(farmer)/suppliers/orders')}
          style={[styles.myOrdersButton, isDark && styles.myOrdersButtonDark]}
          activeOpacity={0.8}
        >
          <Feather name="package" size={18} color={isDark ? '#4ADE80' : '#255D35'} />
          <Text style={[styles.myOrdersText, isDark && styles.myOrdersTextDark]}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
        <Feather name="search" size={18} color={isDark ? '#7E9F85' : '#757575'} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="Search seeds, fertilizer, supplier..."
          placeholderTextColor={isDark ? '#5E7D65' : '#9E9E9E'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && Platform.OS !== 'ios' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={16} color={isDark ? '#7E9F85' : '#757575'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {CATALOGUE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isDark && styles.categoryChipDark,
                  isSelected && styles.categoryChipSelected,
                  isSelected && isDark && styles.categoryChipSelectedDark,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isDark && styles.categoryTextDark,
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#255D35'} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Loading agricultural supplies...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#4ADE80' : '#255D35'}
              colors={['#255D35']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="store-search-outline"
                size={54}
                color={isDark ? '#3D5442' : '#B0BEC5'}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                No supplies found
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                {searchQuery
                  ? `No products match "${searchQuery}". Try a different keyword.`
                  : 'No products in this category at the moment.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Order Placement Modal */}
      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isSubmittingOrder) setOrderModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Place Supply Order</Text>
                <Text style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                  Direct from verified supplier
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setOrderModalVisible(false)}
                disabled={isSubmittingOrder}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color={isDark ? '#E8F5E9' : '#1C3723'} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {/* Product Summary Card */}
                <View style={[styles.modalProductCard, isDark && styles.modalProductCardDark]}>
                  <Image
                    source={
                      typeof selectedProduct.imageUrl === 'string'
                        ? { uri: selectedProduct.imageUrl }
                        : selectedProduct.imageUrl || require('../../../assets/images/supplier_seed_sack.jpg')
                    }
                    style={styles.modalProductImage}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.modalProductTitle, isDark && styles.modalProductTitleDark]} numberOfLines={2}>
                      {selectedProduct.title}
                    </Text>
                    <Text style={[styles.modalProductSupplier, isDark && styles.modalProductSupplierDark]}>
                      {selectedProduct.supplierName || 'Verified Supplier'}
                    </Text>
                    <Text style={[styles.modalProductPrice, isDark && styles.modalProductPriceDark]}>
                      Rs. {selectedProduct.price.toLocaleString()} / {selectedProduct.soldPer || 'unit'}
                    </Text>
                  </View>
                </View>

                {/* Quantity Stepper */}
                <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>Order Quantity</Text>
                <View style={[styles.qtyRow, isDark && styles.qtyRowDark]}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, isDark && styles.qtyBtnDark]}
                    onPress={() => setOrderQty((q) => Math.max(1, q - 1))}
                    disabled={orderQty <= 1 || isSubmittingOrder}
                  >
                    <Feather name="minus" size={18} color={isDark ? '#E8F5E9' : '#1C3723'} />
                  </TouchableOpacity>

                  <View style={styles.qtyDisplay}>
                    <Text style={[styles.qtyText, isDark && styles.qtyTextDark]}>{orderQty}</Text>
                    <Text style={[styles.qtyUnit, isDark && styles.qtyUnitDark]}>
                      {selectedProduct.soldPer || 'units'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.qtyBtn, isDark && styles.qtyBtnDark]}
                    onPress={() => setOrderQty((q) => Math.min(selectedProduct.stock, q + 1))}
                    disabled={orderQty >= selectedProduct.stock || isSubmittingOrder}
                  >
                    <Feather name="plus" size={18} color={isDark ? '#E8F5E9' : '#1C3723'} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.stockNotice, isDark && styles.stockNoticeDark]}>
                  Maximum available: {selectedProduct.stock} {selectedProduct.soldPer || 'units'}
                </Text>

                {/* Delivery Method */}
                <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>Delivery Option</Text>
                <View style={styles.deliveryToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.deliveryOption,
                      isDark && styles.deliveryOptionDark,
                      deliveryMethod === 'Farm Delivery' && styles.deliveryOptionSelected,
                      deliveryMethod === 'Farm Delivery' && isDark && styles.deliveryOptionSelectedDark,
                    ]}
                    onPress={() => setDeliveryMethod('Farm Delivery')}
                  >
                    <MaterialCommunityIcons
                      name="truck-delivery-outline"
                      size={20}
                      color={
                        deliveryMethod === 'Farm Delivery'
                          ? '#FFFFFF'
                          : isDark
                          ? '#9CB3A0'
                          : '#255D35'
                      }
                    />
                    <Text
                      style={[
                        styles.deliveryOptionText,
                        deliveryMethod === 'Farm Delivery' && styles.deliveryOptionTextSelected,
                        isDark && deliveryMethod !== 'Farm Delivery' && styles.deliveryOptionTextDark,
                      ]}
                    >
                      Farm Delivery
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.deliveryOption,
                      isDark && styles.deliveryOptionDark,
                      deliveryMethod === 'Supplier Pickup' && styles.deliveryOptionSelected,
                      deliveryMethod === 'Supplier Pickup' && isDark && styles.deliveryOptionSelectedDark,
                    ]}
                    onPress={() => setDeliveryMethod('Supplier Pickup')}
                  >
                    <MaterialCommunityIcons
                      name="store-outline"
                      size={20}
                      color={
                        deliveryMethod === 'Supplier Pickup'
                          ? '#FFFFFF'
                          : isDark
                          ? '#9CB3A0'
                          : '#255D35'
                      }
                    />
                    <Text
                      style={[
                        styles.deliveryOptionText,
                        deliveryMethod === 'Supplier Pickup' && styles.deliveryOptionTextSelected,
                        isDark && deliveryMethod !== 'Supplier Pickup' && styles.deliveryOptionTextDark,
                      ]}
                    >
                      Supplier Pickup
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Notes Input */}
                <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>Special Notes (Optional)</Text>
                <TextInput
                  style={[styles.notesInput, isDark && styles.notesInputDark]}
                  placeholder="e.g. Please deliver before noon, call upon arrival..."
                  placeholderTextColor={isDark ? '#5E7D65' : '#9E9E9E'}
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  multiline
                  numberOfLines={3}
                />

                {/* Price Calculation Summary */}
                <View style={[styles.summaryBox, isDark && styles.summaryBoxDark]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Item Subtotal</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      Rs. {(selectedProduct.price * orderQty).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Delivery Fee</Text>
                    <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
                      {deliveryMethod === 'Supplier Pickup' ? 'Free' : 'Calculated on dispatch'}
                    </Text>
                  </View>
                  <View style={[styles.summaryDivider, isDark && styles.summaryDividerDark]} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Estimated Total</Text>
                    <Text style={[styles.totalValue, isDark && styles.totalValueDark]}>
                      Rs. {(selectedProduct.price * orderQty).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, isDark && styles.cancelBtnDark]}
                    onPress={() => setOrderModalVisible(false)}
                    disabled={isSubmittingOrder}
                  >
                    <Text style={[styles.cancelBtnText, isDark && styles.cancelBtnTextDark]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confirmBtn, isSubmittingOrder && styles.confirmBtnDisabled]}
                    onPress={handleConfirmOrder}
                    disabled={isSubmittingOrder}
                  >
                    {isSubmittingOrder ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.confirmBtnText}>Confirm Order</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerDark: {
    backgroundColor: '#162219',
    borderBottomColor: '#1E2F23',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonDark: {
    backgroundColor: '#203324',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C3723',
  },
  headerTitleDark: {
    color: '#E8F5E9',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  headerSubtitleDark: {
    color: '#9CB3A0',
  },
  myOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5EA',
  },
  myOrdersButtonDark: {
    backgroundColor: '#1C3322',
  },
  myOrdersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#255D35',
  },
  myOrdersTextDark: {
    color: '#4ADE80',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E5DF',
    height: 44,
  },
  searchContainerDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C3723',
  },
  searchInputDark: {
    color: '#E8F5E9',
  },
  categoriesContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EAE7E0',
  },
  categoryChipDark: {
    backgroundColor: '#1B2C1F',
  },
  categoryChipSelected: {
    backgroundColor: '#255D35',
  },
  categoryChipSelectedDark: {
    backgroundColor: '#4ADE80',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  categoryTextDark: {
    color: '#9CB3A0',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E8E2',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  productCardDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#F0EFEA',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(28, 55, 35, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  organicBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(43, 122, 66, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  organicBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  productInfo: {
    padding: 14,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2D20',
  },
  productTitleDark: {
    color: '#E8F5E9',
  },
  supplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  supplierName: {
    fontSize: 12,
    color: '#255D35',
    fontWeight: '600',
    flex: 1,
  },
  supplierNameDark: {
    color: '#4ADE80',
  },
  productDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    lineHeight: 17,
  },
  productDescDark: {
    color: '#9CB3A0',
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C3723',
  },
  priceAmountDark: {
    color: '#4ADE80',
  },
  priceUnit: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  priceUnitDark: {
    color: '#7E9F85',
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inStockPill: {
    backgroundColor: '#E8F5EA',
  },
  outOfStockPill: {
    backgroundColor: '#FFEBEE',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inStockText: {
    color: '#2B7A42',
  },
  outOfStockText: {
    color: '#D32F2F',
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#255D35',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 12,
  },
  orderButtonDark: {
    backgroundColor: '#2B7A42',
  },
  orderButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#555',
    marginTop: 12,
  },
  loadingTextDark: {
    color: '#9CB3A0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444',
    marginTop: 12,
  },
  emptyTitleDark: {
    color: '#C0D5C5',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  emptySubtitleDark: {
    color: '#7E9F85',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalContentDark: {
    backgroundColor: '#162219',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C3723',
  },
  modalTitleDark: {
    color: '#E8F5E9',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalSubtitleDark: {
    color: '#9CB3A0',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2EB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalProductCardDark: {
    backgroundColor: '#1F3124',
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  modalProductTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2D20',
  },
  modalProductTitleDark: {
    color: '#E8F5E9',
  },
  modalProductSupplier: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalProductSupplierDark: {
    color: '#9CB3A0',
  },
  modalProductPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#255D35',
    marginTop: 4,
  },
  modalProductPriceDark: {
    color: '#4ADE80',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  sectionLabelDark: {
    color: '#C0D5C5',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#F7F9F6',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E5DD',
  },
  qtyRowDark: {
    backgroundColor: '#1F3124',
    borderColor: '#2A4331',
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  qtyBtnDark: {
    backgroundColor: '#263D2D',
    borderColor: '#3D5945',
  },
  qtyDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  qtyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C3723',
  },
  qtyTextDark: {
    color: '#E8F5E9',
  },
  qtyUnit: {
    fontSize: 11,
    color: '#777',
  },
  qtyUnitDark: {
    color: '#9CB3A0',
  },
  stockNotice: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  stockNoticeDark: {
    color: '#7E9F85',
  },
  deliveryToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deliveryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFFFFF',
  },
  deliveryOptionDark: {
    backgroundColor: '#1F3124',
    borderColor: '#2A4331',
  },
  deliveryOptionSelected: {
    backgroundColor: '#255D35',
    borderColor: '#255D35',
  },
  deliveryOptionSelectedDark: {
    backgroundColor: '#2B7A42',
    borderColor: '#2B7A42',
  },
  deliveryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  deliveryOptionTextDark: {
    color: '#C0D5C5',
  },
  deliveryOptionTextSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F7F9F6',
    borderWidth: 1,
    borderColor: '#E0E5DD',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1C3723',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesInputDark: {
    backgroundColor: '#1F3124',
    borderColor: '#2A4331',
    color: '#E8F5E9',
  },
  summaryBox: {
    backgroundColor: '#F5F8F5',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  summaryBoxDark: {
    backgroundColor: '#1A2A1E',
    borderColor: '#263E2D',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryLabelDark: {
    color: '#9CB3A0',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  summaryValueDark: {
    color: '#E8F5E9',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2EBE2',
    marginVertical: 6,
  },
  summaryDividerDark: {
    backgroundColor: '#263E2D',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C3723',
  },
  totalLabelDark: {
    color: '#E8F5E9',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#255D35',
  },
  totalValueDark: {
    color: '#4ADE80',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE7E0',
  },
  cancelBtnDark: {
    backgroundColor: '#26382B',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  cancelBtnTextDark: {
    color: '#C0D5C5',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#255D35',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
