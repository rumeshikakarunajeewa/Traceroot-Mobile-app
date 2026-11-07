import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDarkMode } from '../../../src/store/uiStore';
import { INITIAL_MOCK_ORDERS } from '../../../src/lib/api/orders';

interface BuyerProfileData {
  id: string;
  fullName: string;
  initials: string;
  isVerified: boolean;
  avatarUrl: string;
  roleTitle: string;
  company: string;
  district: string;
  province: string;
  country: string;
  coordinates: string;
  bio: string;
  ordersCount: number;
  contractsCount: number;
  kgSourced: string;
  trustScore: number;
  trustScoreLabel: string;
  trustScoreDetail: string;
  phone: string;
  email: string;
  businessType: string;
  registrationId: string;
  deliveryAddress: string;
}

const MOCK_BUYERS: Record<string, BuyerProfileData> = {
  'buyer-saman': {
    id: 'buyer-saman',
    fullName: 'Saman Perera',
    initials: 'SP',
    isVerified: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    roleTitle: 'Wholesale Commercial Buyer',
    company: 'FreshMart Ltd',
    district: 'Colombo District',
    province: 'Western Province',
    country: 'Sri Lanka',
    coordinates: '6.9271° N, 79.8612° E',
    bio: 'Lead purchasing manager for FreshMart Supermarkets, building long-term relationships with verified, sustainable farmers.',
    ordersCount: 142,
    contractsCount: 5,
    kgSourced: '12.5k',
    trustScore: 96,
    trustScoreLabel: 'Exemplary',
    trustScoreDetail: 'Payments settled on time • 142 orders',
    phone: '+94 71 987 6543',
    email: 'saman.p@freshmart.lk',
    businessType: 'Retail Supermarket Chain',
    registrationId: 'BR-99321',
    deliveryAddress: 'FreshMart Central Logistics Depot, Colombo 03',
  },
  'buyer-nimal': {
    id: 'buyer-nimal',
    fullName: 'Nimal Silva',
    initials: 'NS',
    isVerified: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    roleTitle: 'Organic Sourcing Manager',
    company: 'Lanka Organic Retailers Ltd',
    district: 'Kandy District',
    province: 'Central Province',
    country: 'Sri Lanka',
    coordinates: '7.2906° N, 80.6337° E',
    bio: 'Sourcing certified Grade-A organic vegetables directly from greenhouse and smallholder farmers with full batch traceability.',
    ordersCount: 88,
    contractsCount: 3,
    kgSourced: '8.2k',
    trustScore: 94,
    trustScoreLabel: 'Highly Trusted',
    trustScoreDetail: 'Prompt inspection & settlement • 88 orders',
    phone: '+94 77 456 7890',
    email: 'nimal.silva@lankaorganic.lk',
    businessType: 'Organic Retail & Distribution',
    registrationId: 'BR-88412',
    deliveryAddress: 'Lanka Organic Regional Hub, Peradeniya Road, Kandy',
  },
  'buyer-kamal': {
    id: 'buyer-kamal',
    fullName: 'Kamal Jayasuriya',
    initials: 'KJ',
    isVerified: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    roleTitle: 'Procurement Director',
    company: 'GreenGrocer Exporters',
    district: 'Gampaha District',
    province: 'Western Province',
    country: 'Sri Lanka',
    coordinates: '7.0917° N, 79.9999° E',
    bio: 'Commercial fresh export operations connecting sustainable Sri Lankan organic producers to international and regional retail chains.',
    ordersCount: 215,
    contractsCount: 8,
    kgSourced: '24.0k',
    trustScore: 98,
    trustScoreLabel: 'Pinnacle Trust',
    trustScoreDetail: '100% Escrow completion • 215 orders',
    phone: '+94 76 332 1199',
    email: 'kamal.j@greengrocer.lk',
    businessType: 'Export & Bulk Wholesale',
    registrationId: 'BR-77109',
    deliveryAddress: 'GreenGrocer Cold Chain Hub, Negombo Road, Peliyagoda',
  },
};

type ProfileTab = 'about' | 'orders' | 'reviews';

export default function BuyerProfileViewScreen() {
  const [isDark] = useDarkMode();
  const params = useLocalSearchParams<{ id?: string; name?: string; company?: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');

  // Lookup buyer or build graceful fallback from params
  const buyer: BuyerProfileData = useMemo(() => {
    const rawId = (params.id || '').toLowerCase();
    const rawName = (params.name || '').toLowerCase();

    if (rawId.includes('saman') || rawName.includes('saman')) {
      return MOCK_BUYERS['buyer-saman'];
    }
    if (rawId.includes('nimal') || rawName.includes('nimal')) {
      return MOCK_BUYERS['buyer-nimal'];
    }
    if (rawId.includes('kamal') || rawName.includes('kamal')) {
      return MOCK_BUYERS['buyer-kamal'];
    }
    if (params.id && MOCK_BUYERS[params.id]) {
      return MOCK_BUYERS[params.id];
    }

    // Dynamic fallback
    const name = params.name || 'Saman Perera';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    return {
      id: params.id || 'buyer-default',
      fullName: name,
      initials: initials || 'BP',
      isVerified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      roleTitle: 'Commercial Produce Buyer',
      company: params.company || 'Organic Market Network',
      district: 'Colombo District',
      province: 'Western Province',
      country: 'Sri Lanka',
      coordinates: '6.9271° N, 79.8612° E',
      bio: 'Verified commercial buyer on TraceRoot procuring sustainable, pesticide-free fresh harvests with transparent traceability.',
      ordersCount: 95,
      contractsCount: 4,
      kgSourced: '10.5k',
      trustScore: 95,
      trustScoreLabel: 'Highly Trusted',
      trustScoreDetail: 'Prompt settlements • 95 orders completed',
      phone: '+94 71 987 6543',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@traceroot.lk`,
      businessType: 'Commercial Wholesale & Retail',
      registrationId: 'BR-99100',
      deliveryAddress: 'Central Cold Chain Depot, Colombo',
    };
  }, [params.id, params.name, params.company]);

  // Buyer orders with current farmer
  const buyerOrders = useMemo(() => {
    return INITIAL_MOCK_ORDERS.filter(
      (o) =>
        o.buyer_name.toLowerCase() === buyer.fullName.toLowerCase() ||
        o.buyer_id === buyer.id
    );
  }, [buyer]);

  const handleCall = () => {
    Linking.openURL(`tel:${buyer.phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Unable to place call', `Please dial ${buyer.phone} manually.`);
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${buyer.email}`).catch(() => {
      Alert.alert('Unable to send email', `Please email ${buyer.email} directly.`);
    });
  };

  const handleMessage = () => {
    router.push('/(farmer)/messages' as any);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(farmer)/orders' as any);
    }
  };

  const bgImageUri =
    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80';

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={[styles.backCircleBtn, isDark && styles.backCircleBtnDark]}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="chevron-left" size={22} color={isDark ? '#E5EFE7' : '#16351E'} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerSub, isDark && styles.headerSubDark]}>Customer Profile</Text>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Buyer Details</Text>
        </View>

        <TouchableOpacity
          style={[styles.messageHeaderBtn, isDark && styles.messageHeaderBtnDark]}
          onPress={handleMessage}
          activeOpacity={0.75}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={isDark ? '#4ADE80' : '#27673A'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO PROFILE CARD */}
        <View style={styles.heroCardWrapper}>
          <ImageBackground
            source={{ uri: bgImageUri }}
            style={styles.heroBg}
            imageStyle={styles.heroBgImage}
          >
            <View style={styles.heroOverlay}>
              {/* Profile Top Row */}
              <View style={styles.heroTopRow}>
                <View style={styles.avatarWrapper}>
                  {buyer.avatarUrl ? (
                    <Image source={{ uri: buyer.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitials}>{buyer.initials}</Text>
                    </View>
                  )}
                  {buyer.isVerified && (
                    <View style={styles.verifiedCheckBadge}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View style={styles.heroIdentityCol}>
                  {buyer.isVerified && (
                    <View style={styles.verifiedBadgePill}>
                      <Ionicons
                        name="shield-checkmark"
                        size={12}
                        color="#2B5A39"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.verifiedBadgeText}>Verified Organic Buyer</Text>
                    </View>
                  )}
                  <Text style={styles.heroNameText} numberOfLines={1}>
                    {buyer.fullName}
                  </Text>
                  <Text style={styles.heroCompanyText} numberOfLines={1}>
                    {buyer.company} • {buyer.roleTitle}
                  </Text>
                  <View style={styles.heroLocationRow}>
                    <Feather name="map-pin" size={12} color="#EAF4EC" style={{ marginRight: 4 }} />
                    <Text style={styles.heroLocationText} numberOfLines={1}>
                      {buyer.district}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bio */}
              <Text style={styles.heroBioText} numberOfLines={3}>
                {buyer.bio}
              </Text>

              {/* Glassmorphism Stats Bar */}
              <View style={styles.glassStatsBar}>
                <View style={styles.glassStatCol}>
                  <Text style={styles.glassStatNum}>{buyer.ordersCount}</Text>
                  <Text style={styles.glassStatLabel}>Orders</Text>
                </View>
                <View style={styles.glassDivider} />
                <View style={styles.glassStatCol}>
                  <Text style={styles.glassStatNum}>{buyer.contractsCount}</Text>
                  <Text style={styles.glassStatLabel}>Contracts</Text>
                </View>
                <View style={styles.glassDivider} />
                <View style={styles.glassStatCol}>
                  <Text style={styles.glassStatNum}>{buyer.kgSourced}</Text>
                  <Text style={styles.glassStatLabel}>Sourced</Text>
                </View>
                <View style={styles.glassDivider} />
                <View style={styles.glassStatCol}>
                  <Text style={styles.glassStatNum}>{buyer.trustScore}</Text>
                  <Text style={styles.glassStatLabel}>Trust Score</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* 2. TRUST SCORE CARD */}
        <View style={[styles.trustCard, isDark && styles.trustCardDark]}>
          <View style={styles.trustLeft}>
            <View style={styles.trustScoreCircle}>
              <Text style={styles.trustScoreNumber}>{buyer.trustScore}</Text>
            </View>
            <View style={styles.trustTextCol}>
              <View style={styles.trustTitleRow}>
                <Text style={[styles.trustTitle, isDark && styles.trustTitleDark]}>
                  {buyer.trustScoreLabel}
                </Text>
                <View style={styles.trustVerifiedBadge}>
                  <Feather name="shield" size={11} color="#27673A" style={{ marginRight: 3 }} />
                  <Text style={styles.trustVerifiedText}>Escrow Guaranteed</Text>
                </View>
              </View>
              <Text style={[styles.trustDetail, isDark && styles.trustDetailDark]}>
                {buyer.trustScoreDetail}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. TAB SELECTION */}
        <View style={styles.tabsRow}>
          {(['about', 'orders', 'reviews'] as ProfileTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'about' ? 'About' : tab === 'orders' ? 'Orders' : 'Reviews';
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabPill,
                  isDark && styles.tabPillDark,
                  isActive && styles.tabPillActive,
                  isActive && isDark && styles.tabPillActiveDark,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isDark && styles.tabPillTextDark,
                    isActive && styles.tabPillTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. TAB CONTENTS */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            {/* Contact & Business Information */}
            <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
              <Text style={[styles.sectionCardTitle, isDark && styles.sectionCardTitleDark]}>
                Contact & Business Details
              </Text>

              {/* Phone */}
              <View style={[styles.infoRow, isDark && styles.infoRowDark]}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIconWrap, isDark && styles.infoIconWrapDark]}>
                    <Feather name="phone" size={16} color={isDark ? '#4ADE80' : '#27673A'} />
                  </View>
                  <View>
                    <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Phone</Text>
                    <Text style={[styles.infoVal, isDark && styles.infoValDark]}>{buyer.phone}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.actionPillBtn} onPress={handleCall} activeOpacity={0.8}>
                  <Feather name="phone-call" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.actionPillBtnText}>Call</Text>
                </TouchableOpacity>
              </View>

              {/* Email */}
              <View style={[styles.infoRow, isDark && styles.infoRowDark]}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIconWrap, isDark && styles.infoIconWrapDark]}>
                    <Feather name="mail" size={16} color={isDark ? '#4ADE80' : '#27673A'} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Email</Text>
                    <Text style={[styles.infoVal, isDark && styles.infoValDark]} numberOfLines={1}>
                      {buyer.email}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.actionPillBtn} onPress={handleEmail} activeOpacity={0.8}>
                  <Feather name="send" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.actionPillBtnText}>Email</Text>
                </TouchableOpacity>
              </View>

              {/* Company */}
              <View style={[styles.infoRow, isDark && styles.infoRowDark]}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIconWrap, isDark && styles.infoIconWrapDark]}>
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={18}
                      color={isDark ? '#4ADE80' : '#27673A'}
                    />
                  </View>
                  <View>
                    <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Company / Organization</Text>
                    <Text style={[styles.infoVal, isDark && styles.infoValDark]}>{buyer.company}</Text>
                  </View>
                </View>
              </View>

              {/* Business Type */}
              <View style={[styles.infoRow, isDark && styles.infoRowDark]}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIconWrap, isDark && styles.infoIconWrapDark]}>
                    <Feather name="briefcase" size={16} color={isDark ? '#4ADE80' : '#27673A'} />
                  </View>
                  <View>
                    <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Business Type</Text>
                    <Text style={[styles.infoVal, isDark && styles.infoValDark]}>{buyer.businessType}</Text>
                  </View>
                </View>
              </View>

              {/* Business Registration */}
              <View style={[styles.infoRow, isDark && styles.infoRowDark, { borderBottomWidth: 0 }]}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIconWrap, isDark && styles.infoIconWrapDark]}>
                    <Feather name="check-circle" size={16} color={isDark ? '#4ADE80' : '#27673A'} />
                  </View>
                  <View>
                    <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Business Registration</Text>
                    <Text style={[styles.infoVal, isDark && styles.infoValDark]}>
                      {buyer.registrationId} • Verified Commercial Buyer
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Delivery & Logistics Location Card */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeaderRow}>
                <View style={styles.locationPinIcon}>
                  <Feather name="map-pin" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.locationHeaderTitle}>Default Delivery Hub</Text>
                  <Text style={styles.locationHeaderSubtitle}>{buyer.deliveryAddress}</Text>
                </View>
              </View>

              <View style={styles.locationDetailsBox}>
                <Text style={styles.locationCoordsText}>
                  Region: {buyer.district}, {buyer.province} • GPS: {buyer.coordinates}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
              <Text style={[styles.sectionCardTitle, isDark && styles.sectionCardTitleDark]}>
                Orders Placed by {buyer.fullName}
              </Text>

              {buyerOrders.length === 0 ? (
                <View style={styles.emptyOrdersBox}>
                  <Feather name="package" size={32} color={isDark ? '#4ADE80' : '#77997E'} />
                  <Text style={[styles.emptyOrdersText, isDark && styles.emptyOrdersTextDark]}>
                    No recent orders found for this buyer.
                  </Text>
                </View>
              ) : (
                buyerOrders.map((ord) => (
                  <TouchableOpacity
                    key={ord.id}
                    style={[styles.buyerOrderItem, isDark && styles.buyerOrderItemDark]}
                    onPress={() => router.push(`/orders/${ord.id}` as any)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.orderItemLeft}>
                      <View style={styles.orderItemBadge}>
                        <Text style={styles.orderItemBadgeText}>{ord.id}</Text>
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.orderItemCrop, isDark && styles.orderItemCropDark]}>
                          {ord.crop_name} • {ord.quantity} {ord.unit}
                        </Text>
                        <Text style={[styles.orderItemSub, isDark && styles.orderItemSubDark]}>
                          Status: {ord.status.toUpperCase()} • LKR {ord.total_price.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={18} color={isDark ? '#4ADE80' : '#77997E'} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
              <Text style={[styles.sectionCardTitle, isDark && styles.sectionCardTitleDark]}>
                Farmer Feedback & Ratings
              </Text>

              <View style={[styles.reviewItem, isDark && styles.reviewItemDark]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewAuthor, isDark && styles.reviewAuthorDark]}>
                    Priya Kumari (Kandy Greenhouse Farm)
                  </Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={13} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewBody, isDark && styles.reviewBodyDark]}>
                  &quot;Always confirms orders promptly and escrow payments are released immediately upon
                  crate delivery inspection. Excellent long-term partner.&quot;
                </Text>
              </View>

              <View style={[styles.reviewItem, isDark && styles.reviewItemDark, { borderBottomWidth: 0 }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewAuthor, isDark && styles.reviewAuthorDark]}>
                    Roshan Silva (Nuwara Eliya Organics)
                  </Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={13} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewBody, isDark && styles.reviewBodyDark]}>
                  &quot;Consistent orders with fair market prices for certified organic produce. Communication
                  via TraceRoot chat is always fast.&quot;
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[styles.primaryActionBtn, isDark && styles.primaryActionBtnDark]}
          onPress={handleMessage}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryActionBtnText}>Message {buyer.fullName}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F3EC',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  backCircleBtnDark: {
    backgroundColor: '#182C1E',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#65816D',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerSubDark: {
    color: '#8EA694',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16351E',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerTitleDark: {
    color: '#F0F5F1',
  },
  messageHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5EDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageHeaderBtnDark: {
    backgroundColor: '#1E3C27',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // 1. Hero Card
  heroCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 14,
    shadowColor: '#173620',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBg: {
    width: '100%',
  },
  heroBgImage: {
    borderRadius: 24,
  },
  heroOverlay: {
    backgroundColor: 'rgba(16, 43, 23, 0.88)',
    padding: 18,
    borderRadius: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#30683F',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E57338',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroIdentityCol: {
    flex: 1,
  },
  verifiedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#215930',
  },
  heroNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  heroCompanyText: {
    fontSize: 12.5,
    color: '#D8E8DC',
    marginTop: 2,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  heroLocationText: {
    fontSize: 11.5,
    color: '#C5DDD0',
  },
  heroBioText: {
    fontSize: 12.5,
    color: '#E5F0E8',
    lineHeight: 17,
    marginBottom: 14,
  },
  glassStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  glassStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  glassStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  glassStatLabel: {
    fontSize: 11,
    color: '#D2E5DA',
    marginTop: 2,
  },
  glassDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // 2. Trust Score Card
  trustCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECEAE2',
  },
  trustCardDark: {
    backgroundColor: '#142519',
    borderColor: '#243F2B',
  },
  trustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustScoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#27673A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#EAF3EC',
  },
  trustScoreNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#27673A',
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 3,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16351E',
  },
  trustTitleDark: {
    color: '#F0F5F1',
  },
  trustVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F3EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trustVerifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#27673A',
  },
  trustDetail: {
    fontSize: 12,
    color: '#65816D',
  },
  trustDetailDark: {
    color: '#9CB3A0',
  },

  // 3. Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFD6',
  },
  tabPillDark: {
    backgroundColor: '#182C1E',
    borderColor: '#26452E',
  },
  tabPillActive: {
    backgroundColor: '#27673A',
    borderColor: '#27673A',
  },
  tabPillActiveDark: {
    backgroundColor: '#27673A',
    borderColor: '#27673A',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34523C',
  },
  tabPillTextDark: {
    color: '#9CB3A0',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 4. Tab Content
  tabContent: {
    marginBottom: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEAE2',
    marginBottom: 12,
  },
  sectionCardDark: {
    backgroundColor: '#142519',
    borderColor: '#243F2B',
  },
  sectionCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#16351E',
    marginBottom: 12,
  },
  sectionCardTitleDark: {
    color: '#F0F5F1',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE6',
  },
  infoRowDark: {
    borderBottomColor: '#203A26',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBF4ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoIconWrapDark: {
    backgroundColor: '#1E3C27',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#768E7C',
  },
  infoLabelDark: {
    color: '#8EA694',
  },
  infoVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16351E',
    marginTop: 1,
  },
  infoValDark: {
    color: '#F0F5F1',
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27673A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Location Card
  locationCard: {
    backgroundColor: '#193A24',
    borderRadius: 20,
    padding: 16,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationPinIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2B5E39',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locationHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locationHeaderSubtitle: {
    fontSize: 12,
    color: '#D0E5D7',
    marginTop: 2,
  },
  locationDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  locationCoordsText: {
    fontSize: 11.5,
    color: '#E5F2EA',
  },

  // Orders Tab
  emptyOrdersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyOrdersText: {
    fontSize: 13,
    color: '#65816D',
    marginTop: 8,
  },
  emptyOrdersTextDark: {
    color: '#9CB3A0',
  },
  buyerOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE6',
  },
  buyerOrderItemDark: {
    borderBottomColor: '#203A26',
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderItemBadge: {
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderItemBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#27673A',
  },
  orderItemCrop: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16351E',
  },
  orderItemCropDark: {
    color: '#F0F5F1',
  },
  orderItemSub: {
    fontSize: 11.5,
    color: '#65816D',
    marginTop: 2,
  },
  orderItemSubDark: {
    color: '#9CB3A0',
  },

  // Reviews Tab
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE6',
  },
  reviewItemDark: {
    borderBottomColor: '#203A26',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16351E',
  },
  reviewAuthorDark: {
    color: '#F0F5F1',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewBody: {
    fontSize: 12.5,
    color: '#496651',
    lineHeight: 18,
  },
  reviewBodyDark: {
    color: '#D0E2D5',
  },

  // Primary Action Button
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3C25',
    borderRadius: 20,
    paddingVertical: 15,
    shadowColor: '#173620',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 4,
  },
  primaryActionBtnDark: {
    backgroundColor: '#266437',
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

