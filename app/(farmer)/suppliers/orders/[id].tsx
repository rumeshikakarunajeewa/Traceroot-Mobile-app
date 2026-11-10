import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../../../src/lib/supabase';
import { supplierOrdersService } from '../../../../src/services/supplierOrders.service';
import { useDarkMode } from '../../../../src/store/uiStore';
import { SupplierOrderRequest, SupplierOrderStatus } from '../../../../src/types/supplier.types';

export default function FarmerSupplyOrderDetailScreen() {
  const [isDark] = useDarkMode();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<SupplierOrderRequest | null>(null);
  const [supplierPhone, setSupplierPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrderDetail = useCallback(async () => {
    if (!id) return;

    try {
      // Query supplier_orders with supplier profile
      let query = supabase
        .from('supplier_orders')
        .select(`
          id,
          farmer_id,
          supplier_id,
          items,
          total_amount,
          status,
          notes,
          created_at,
          profiles!supplier_orders_supplier_id_fkey (
            id,
            full_name,
            farm_name,
            district,
            province,
            avatar_url,
            phone
          )
        `);

      if (id.startsWith('REQ-')) {
        // Query by substring if needed, or query recent orders
        const { data: allRecent } = await supabase
          .from('supplier_orders')
          .select(`
            id,
            farmer_id,
            supplier_id,
            items,
            total_amount,
            status,
            notes,
            created_at,
            profiles!supplier_orders_supplier_id_fkey (
              id,
              full_name,
              farm_name,
              district,
              province,
              avatar_url,
              phone
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        const match = allRecent?.find(
          (r: any) => `REQ-${r.id.substring(0, 4).toUpperCase()}` === id
        );
        if (match) {
          processOrderData(match);
          return;
        }
      } else {
        query = query.eq('id', id);
      }

      const { data, error } = await query.single();
      if (error || !data) {
        console.warn('[FarmerSupplyOrderDetail] Order not found or query error:', error?.message);
      } else {
        processOrderData(data);
      }
    } catch (err) {
      console.warn('[FarmerSupplyOrderDetail] loadOrderDetail exception:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const processOrderData = (row: any) => {
    const profile = row.profiles as any;
    if (profile?.phone) {
      setSupplierPhone(profile.phone);
    }

    const { status, stepperStage } = supplierOrdersService.toUiStatus(row.status);

    let parsedItems = [];
    if (Array.isArray(row.items)) {
      parsedItems = row.items.map((it: any) => {
        let img: any = require('../../../../assets/images/supplier_fertilizer.jpg');
        if (it.imageUrl) {
          img = typeof it.imageUrl === 'string' ? { uri: it.imageUrl } : it.imageUrl;
        } else if (it.title?.toLowerCase().includes('seed')) {
          img = require('../../../../assets/images/supplier_tomato_seeds.jpg');
        }
        return {
          title: it.title || 'Agri Input',
          quantity: it.quantity || '1 pack',
          price: Number(it.price) || 0,
          imageUrl: img,
          catalogueItemId: it.catalogueItemId,
        };
      });
    }

    const avatar = {
      uri:
        profile?.avatar_url ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };

    const shortId = `REQ-${row.id ? row.id.substring(0, 4).toUpperCase() : '0000'}`;

    setOrder({
      id: shortId,
      dbId: row.id,
      farmerName: 'You',
      farmerAvatar: null,
      supplierName: profile?.farm_name || profile?.full_name || 'Verified Supplier',
      supplierAvatar: avatar,
      district: profile?.district || profile?.province || 'Sri Lanka',
      timeAgo: formatDate(row.created_at),
      status,
      stepperStage,
      items: parsedItems,
      totalAmount: Number(row.total_amount) || 0,
      deliveryMethod: row.notes?.includes('[')
        ? row.notes.split(']')[0].replace('[', '')
        : 'Farm delivery',
      notes: row.notes ? row.notes.replace(/\[.*?\]\s*/, '') : undefined,
      farmerId: row.farmer_id,
      supplierId: row.supplier_id,
      createdAt: row.created_at,
    });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  useEffect(() => {
    loadOrderDetail();

    const channel = supabase
      .channel(`supplier-order-detail-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'supplier_orders' },
        (payload) => {
          if (payload.new && (payload.new.id === id || order?.dbId === payload.new.id)) {
            loadOrderDetail();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadOrderDetail, order?.dbId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrderDetail();
  };

  const handleCallSupplier = () => {
    if (supplierPhone) {
      Linking.openURL(`tel:${supplierPhone}`);
    } else {
      Alert.alert('Contact Supplier', 'Phone number not available. You can leave notes on your order.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#255D35'} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Loading order tracking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={isDark ? '#E8F5E9' : '#1C3723'} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, isDark && styles.topBarTitleDark]}>Order Not Found</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#D32F2F" />
          <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>Order Record Not Found</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.push('/(farmer)/suppliers/orders')}>
            <Text style={styles.backHomeBtnText}>Back to My Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Stepper logic
  const isDeclined = order.status === 'Declined';
  const isStep1Done = true;
  const isStep2Done = order.status === 'Packing' || order.status === 'Completed';
  const isStep3Done = order.status === 'Completed';

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header */}
      <View style={[styles.topBar, isDark && styles.topBarDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isDark && styles.backButtonDark]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={20} color={isDark ? '#E8F5E9' : '#1C3723'} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.topBarTitle, isDark && styles.topBarTitleDark]}>Order #{order.id}</Text>
          <Text style={[styles.orderDateSubtitle, isDark && styles.orderDateSubtitleDark]}>
            Placed on {order.timeAgo}
          </Text>
        </View>

        {order.supplierId && (
          <TouchableOpacity
            style={[styles.storeIconBtn, isDark && styles.storeIconBtnDark]}
            onPress={() => {
              router.push({
                pathname: '/(farmer)/suppliers/[supplierId]',
                params: { supplierId: order.supplierId! },
              });
            }}
          >
            <MaterialCommunityIcons name="storefront-outline" size={18} color={isDark ? '#4ADE80' : '#255D35'} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4ADE80' : '#255D35'}
            colors={['#255D35']}
          />
        }
      >
        {/* Status Callout / Stepper Tracker */}
        {isDeclined ? (
          <View style={styles.declinedBanner}>
            <MaterialCommunityIcons name="close-circle-outline" size={24} color="#B91C1C" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.declinedTitle}>Order Declined</Text>
              <Text style={styles.declinedSubtitle}>
                The supplier was unable to fulfill this order. All item stock has been released back into inventory.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.trackerCard, isDark && styles.trackerCardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Order Status</Text>

            <View style={styles.stepperContainer}>
              {/* Step 1: Received */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isStep1Done ? styles.stepCircleDone : styles.stepCirclePending,
                  ]}
                >
                  <Feather name="check" size={14} color="#FFFFFF" />
                </View>
                <Text style={[styles.stepLabel, isDark && styles.stepLabelDark]}>Placed</Text>
                <Text style={styles.stepSublabel}>Received</Text>
              </View>

              <View style={[styles.stepLine, isStep2Done ? styles.stepLineDone : styles.stepLinePending]} />

              {/* Step 2: Packing */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isStep2Done
                      ? styles.stepCircleDone
                      : order.status === 'New'
                      ? styles.stepCircleActive
                      : styles.stepCirclePending,
                  ]}
                >
                  {isStep2Done ? (
                    <Feather name="check" size={14} color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons
                      name="package-variant"
                      size={14}
                      color={order.status === 'New' ? '#D97706' : '#999'}
                    />
                  )}
                </View>
                <Text style={[styles.stepLabel, isDark && styles.stepLabelDark]}>Packing</Text>
                <Text style={styles.stepSublabel}>In Progress</Text>
              </View>

              <View style={[styles.stepLine, isStep3Done ? styles.stepLineDone : styles.stepLinePending]} />

              {/* Step 3: Delivered */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isStep3Done ? styles.stepCircleDone : styles.stepCirclePending,
                  ]}
                >
                  {isStep3Done ? (
                    <Feather name="check" size={14} color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="truck-check-outline" size={14} color="#999" />
                  )}
                </View>
                <Text style={[styles.stepLabel, isDark && styles.stepLabelDark]}>Delivered</Text>
                <Text style={styles.stepSublabel}>Completed</Text>
              </View>
            </View>
          </View>
        )}

        {/* Supplier Profile Card */}
        <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Supplier Information</Text>

          <View style={styles.supplierDetailRow}>
            <Image
              source={
                order.supplierAvatar || {
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                }
              }
              style={styles.supplierAvatar}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.supplierBusinessName, isDark && styles.supplierBusinessNameDark]}>
                {order.supplierName}
              </Text>
              <Text style={[styles.supplierLocation, isDark && styles.supplierLocationDark]}>
                <Ionicons name="location-outline" size={12} color={isDark ? '#7E9F85' : '#666'} />{' '}
                {order.district}
              </Text>
            </View>

            <TouchableOpacity style={styles.callSupplierBtn} onPress={handleCallSupplier}>
              <Feather name="phone" size={14} color="#FFFFFF" />
              <Text style={styles.callSupplierBtnText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Itemized Order Items */}
        <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
            Ordered Items ({order.items.length})
          </Text>

          {order.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemDetailRow,
                index < order.items.length - 1 && styles.itemDetailRowBorder,
                index < order.items.length - 1 && isDark && styles.itemDetailRowBorderDark,
              ]}
            >
              <Image
                source={
                  typeof item.imageUrl === 'string'
                    ? { uri: item.imageUrl }
                    : item.imageUrl || require('../../../../assets/images/supplier_seed_sack.jpg')
                }
                style={styles.itemImage}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.itemTitleText, isDark && styles.itemTitleTextDark]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.itemQuantityText, isDark && styles.itemQuantityTextDark]}>
                  Quantity: {item.quantity}
                </Text>
              </View>

              <Text style={[styles.itemPriceText, isDark && styles.itemPriceTextDark]}>
                Rs. {item.price.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery & Notes Card */}
        <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Fulfillment Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={18} color="#255D35" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.detailKey, isDark && styles.detailKeyDark]}>Delivery Method</Text>
              <Text style={[styles.detailVal, isDark && styles.detailValDark]}>
                {order.deliveryMethod || 'Farm Delivery'}
              </Text>
            </View>
          </View>

          {order.notes && (
            <View style={[styles.detailRow, { marginTop: 12 }]}>
              <View style={styles.detailIconWrap}>
                <Feather name="file-text" size={16} color="#255D35" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.detailKey, isDark && styles.detailKeyDark]}>Special Instructions</Text>
                <Text style={[styles.detailVal, isDark && styles.detailValDark]}>{order.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Cost Summary Card */}
        <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Payment Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Supplies Subtotal</Text>
            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
              Rs. {order.totalAmount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>Delivery Charges</Text>
            <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
              {order.deliveryMethod === 'Supplier Pickup' ? 'Free (Pickup)' : 'Included'}
            </Text>
          </View>

          <View style={[styles.summaryDivider, isDark && styles.summaryDividerDark]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.grandTotalLabel, isDark && styles.grandTotalLabelDark]}>Total Payable</Text>
            <Text style={[styles.grandTotalValue, isDark && styles.grandTotalValueDark]}>
              Rs. {order.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Back to Marketplace Action */}
        <TouchableOpacity
          style={styles.browseMoreBtn}
          onPress={() => router.push('/(farmer)/suppliers')}
        >
          <Feather name="arrow-left" size={16} color="#255D35" style={{ marginRight: 6 }} />
          <Text style={styles.browseMoreBtnText}>Browse More Agricultural Supplies</Text>
        </TouchableOpacity>
      </ScrollView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
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
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C3723',
  },
  topBarTitleDark: {
    color: '#E8F5E9',
  },
  orderDateSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  orderDateSubtitleDark: {
    color: '#9CB3A0',
  },
  storeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeIconBtnDark: {
    backgroundColor: '#1C3322',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  trackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5DF',
  },
  trackerCardDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C3723',
    marginBottom: 14,
  },
  cardTitleDark: {
    color: '#E8F5E9',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  stepItem: {
    alignItems: 'center',
    width: 65,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleDone: {
    backgroundColor: '#255D35',
  },
  stepCircleActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
  },
  stepCirclePending: {
    backgroundColor: '#EAE7E0',
  },
  stepLine: {
    flex: 1,
    height: 3,
    marginBottom: 24,
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: '#255D35',
  },
  stepLinePending: {
    backgroundColor: '#EAE7E0',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
  },
  stepLabelDark: {
    color: '#E8F5E9',
  },
  stepSublabel: {
    fontSize: 10,
    color: '#777',
    marginTop: 2,
  },
  declinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  declinedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  declinedSubtitle: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E5DF',
  },
  sectionCardDark: {
    backgroundColor: '#162219',
    borderColor: '#24382A',
  },
  supplierDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplierAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAE7E0',
  },
  supplierBusinessName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2D20',
  },
  supplierBusinessNameDark: {
    color: '#E8F5E9',
  },
  supplierLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  supplierLocationDark: {
    color: '#9CB3A0',
  },
  callSupplierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#255D35',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  callSupplierBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemDetailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  itemDetailRowBorderDark: {
    borderBottomColor: '#24382A',
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EAE7E0',
  },
  itemTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
  itemTitleTextDark: {
    color: '#E8F5E9',
  },
  itemQuantityText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  itemQuantityTextDark: {
    color: '#9CB3A0',
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C3723',
  },
  itemPriceTextDark: {
    color: '#4ADE80',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailKey: {
    fontSize: 11,
    color: '#777',
  },
  detailKeyDark: {
    color: '#9CB3A0',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    marginTop: 1,
  },
  detailValDark: {
    color: '#E8F5E9',
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
    backgroundColor: '#EAE7E0',
    marginVertical: 8,
  },
  summaryDividerDark: {
    backgroundColor: '#24382A',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C3723',
  },
  grandTotalLabelDark: {
    color: '#E8F5E9',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#255D35',
  },
  grandTotalValueDark: {
    color: '#4ADE80',
  },
  browseMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#255D35',
    backgroundColor: '#E8F5EA',
    marginTop: 6,
  },
  browseMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#255D35',
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
    paddingVertical: 80,
    paddingHorizontal: 24,
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
  backHomeBtn: {
    backgroundColor: '#255D35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
