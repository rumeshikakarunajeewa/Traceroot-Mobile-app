import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
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

interface SupplierInfo {
  id: string;
  name: string;
  farmName?: string;
  district?: string;
  province?: string;
  avatarUrl?: string;
  bio?: string;
  trustScore?: number;
  rating?: number;
  phone?: string;
  isVerified?: boolean;
}

export default function SupplierStorefrontScreen() {
  const [isDark] = useDarkMode();
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();
  const { farmerId } = useAuth();

  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CatalogueCategory>('All');

  // Order Placement Modal State
  const [selectedProduct, setSelectedProduct] = useState<CatalogueProduct | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderQty, setOrderQty] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<'Farm Delivery' | 'Supplier Pickup'>('Farm Delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Load Supplier details & catalogue
  const loadSupplierData = useCallback(async () => {
    if (!supplierId) return;

    try {
      // 1. Fetch supplier profile from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          farm_name,
          district,
          province,
          avatar_url,
          bio,
          trust_score,
          phone
        `)
        .eq('id', supplierId)
        .single();

      if (profileData) {
        setSupplier({
          id: profileData.id,
          name: profileData.full_name || 'Verified Supplier',
          farmName: profileData.farm_name,
          district: profileData.district || 'Colombo',
          province: profileData.province || 'Western Province',
          avatarUrl: profileData.avatar_url,
          bio: profileData.bio || 'Authorized distributor of certified seeds, organic fertilizers, and crop nutrients.',
          trustScore: profileData.trust_score || 98,
          rating: 4.9,
          phone: profileData.phone,
          isVerified: true,
        });
      } else {
        // Fallback placeholder profile
        setSupplier({
          id: supplierId,
          name: 'GreenAgro Supplies Ltd',
          farmName: 'GreenAgro Supplies',
          district: 'Kandy',
          province: 'Central Province',
          bio: 'Specializing in certified hybrid vegetable seeds, organic fertilizers, and biological crop care.',
          trustScore: 99,
          rating: 4.9,
          phone: '+94 77 123 4567',
          isVerified: true,
        });
      }

      // 2. Fetch catalogue products for this supplier
      const items = await catalogueService.getCatalogueProducts(
        supplierId,
        selectedCategory === 'All' ? undefined : selectedCategory
      );
      setProducts(items);
    } catch (err) {
      console.warn('[SupplierStorefront] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supplierId, selectedCategory]);

  useEffect(() => {
    loadSupplierData();

    const unsubscribe = catalogueService.subscribeToCatalogue(() => {
      loadSupplierData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadSupplierData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSupplierData();
  };

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

      const totalAmount = selectedProduct.price * orderQty;

      const result = await supplierOrdersService.placeSupplierOrder({
        farmerId: resolvedFarmerId,
        supplierId: supplierId || 'supplier-demo',
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

      // Decrement local product stock
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
        `Your request for ${orderQty} ${selectedProduct.soldPer || 'pack'} of "${selectedProduct.title}" has been sent to ${supplier?.farmName || supplier?.name || 'the supplier'}.`,
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

  const handleCallSupplier = () => {
    if (supplier?.phone) {
      Linking.openURL(`tel:${supplier.phone}`);
    } else {
      Alert.alert('Contact Supplier', 'Contact number not publicly listed. You can place an order directly with notes.');
    }
  };

  const renderHeader = () => {
    if (!supplier) return null;

    return (
      <View style={styles.headerComponent}>
        {/* Supplier Profile Banner Card */}
        <View style={[styles.profileCard, isDark && styles.profileCardDark]}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri:
                  supplier.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.businessName, isDark && styles.businessNameDark]}>
                  {supplier.farmName || supplier.name}
                </Text>
                {supplier.isVerified && (
                  <MaterialCommunityIcons name="check-decagram" size={18} color="#2B7A42" />
                )}
              </View>

              <Text style={[styles.locationText, isDark && styles.locationTextDark]}>
                <Ionicons name="location-outline" size={13} color={isDark ? '#7E9F85' : '#666'} />{' '}
                {supplier.district}, {supplier.province}
              </Text>

              {/* Trust & Rating Badges */}
              <View style={styles.badgesRow}>
                <View style={styles.trustBadge}>
                  <MaterialCommunityIcons name="shield-check" size={13} color="#255D35" />
                  <Text style={styles.trustBadgeText}>{supplier.trustScore}% Trust Score</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingBadgeText}>{supplier.rating}</Text>
                </View>
              </View>
            </View>
          </View>

          {supplier.bio ? (
            <Text style={[styles.bioText, isDark && styles.bioTextDark]}>{supplier.bio}</Text>
          ) : null}

          {/* Quick Contact & Info Actions */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.contactButton, isDark && styles.contactButtonDark]}
              onPress={handleCallSupplier}
            >
              <Feather name="phone" size={14} color={isDark ? '#4ADE80' : '#255D35'} />
              <Text style={[styles.contactButtonText, isDark && styles.contactButtonTextDark]}>
                Call Supplier
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactButton, isDark && styles.contactButtonDark]}
              onPress={() => router.push('/(farmer)/suppliers/orders')}
            >
              <Feather name="package" size={14} color={isDark ? '#4ADE80' : '#255D35'} />
              <Text style={[styles.contactButtonText, isDark && styles.contactButtonTextDark]}>
                Past Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Heading & Category Filters */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, isDark && styles.sectionHeadingDark]}>
            Products Catalogue ({products.length})
          </Text>
        </View>

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
    );
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
                {isOutOfStock ? 'Out of Stock' : `${item.stock} in stock`}
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

      {/* Top Nav */}
      <View style={[styles.topBar, isDark && styles.topBarDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isDark && styles.backButtonDark]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={20} color={isDark ? '#E8F5E9' : '#1C3723'} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, isDark && styles.topBarTitleDark]} numberOfLines={1}>
          {supplier?.farmName || supplier?.name || 'Supplier Storefront'}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(farmer)/suppliers/orders')}
          style={[styles.myOrdersIconBtn, isDark && styles.myOrdersIconBtnDark]}
        >
          <Feather name="package" size={18} color={isDark ? '#4ADE80' : '#255D35'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#255D35'} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Loading supplier storefront...
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
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
                size={50}
                color={isDark ? '#3D5442' : '#B0BEC5'}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                No products found
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                This supplier has no available products in the selected category.
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
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Order From Supplier</Text>
                <Text style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
                  {supplier?.farmName || supplier?.name || 'Verified Supplier'}
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
                  Available in stock: {selectedProduct.stock} {selectedProduct.soldPer || 'units'}
                </Text>

                {/* Delivery Option */}
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
                  placeholder="e.g. Call before delivery, preferred delivery time..."
                  placeholderTextColor={isDark ? '#5E7D65' : '#9E9E9E'}
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  multiline
                  numberOfLines={3}
                />

                {/* Price Calculation Summary */}
                <View style={[styles.summaryBox, isDark && styles.summaryBoxDark]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Subtotal</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  topBarDark: {
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
  topBarTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1C3723',
    marginLeft: 12,
  },
  topBarTitleDark: {
    color: '#E8F5E9',
  },
  myOrdersIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myOrdersIconBtnDark: {
    backgroundColor: '#1C3322',
  },
  headerComponent: {
    paddingBottom: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5DF',
  },
  profileCardDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAE7E0',
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2D20',
  },
  businessNameDark: {
    color: '#E8F5E9',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  locationTextDark: {
    color: '#9CB3A0',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#255D35',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  bioText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  bioTextDark: {
    color: '#9CB3A0',
    borderTopColor: '#24382A',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#E8F5EA',
  },
  contactButtonDark: {
    backgroundColor: '#1C3322',
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#255D35',
  },
  contactButtonTextDark: {
    color: '#4ADE80',
  },
  sectionHeaderRow: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C3723',
  },
  sectionHeadingDark: {
    color: '#E8F5E9',
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
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
    fontSize: 12,
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
    paddingBottom: 40,
    gap: 12,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
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
    height: 140,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2D20',
  },
  productTitleDark: {
    color: '#E8F5E9',
  },
  productDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
  productDescDark: {
    color: '#9CB3A0',
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  priceAmount: {
    fontSize: 17,
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
    paddingVertical: 3,
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
    paddingVertical: 10,
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
    fontSize: 13,
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
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
    marginTop: 10,
  },
  emptyTitleDark: {
    color: '#C0D5C5',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
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
