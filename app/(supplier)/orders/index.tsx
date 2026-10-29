import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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

import {
  acceptAndPackOrder,
  declineOrder,
  useSupplierOrders,
} from '../../../src/store/supplierOrdersStore';
import { useDarkMode } from '../../../src/store/uiStore';
import { SupplierOrderRequest } from '../../../src/types/supplier.types';

type FilterTab = 'All' | 'New' | 'Packing' | 'Completed';

const SHELF_BANNER_IMAGE = require('../../../assets/images/supplier_shelf_banner.jpg');

export default function SupplierOrdersScreen() {
  const [isDark] = useDarkMode();
  const [orders, updateOrderStatus] = useSupplierOrders();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Expanded cards set (default expanding REQ-2041 or the first order)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(
    new Set(['REQ-2041'])
  );

  const toggleExpand = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Counts calculation
  const newCount = orders.filter((o) => o.status === 'New').length;
  const packingCount = orders.filter((o) => o.status === 'Packing').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter by tab
      if (activeTab === 'New' && order.status !== 'New') return false;
      if (activeTab === 'Packing' && order.status !== 'Packing') return false;
      if (activeTab === 'Completed' && order.status !== 'Completed') return false;
      if (activeTab === 'All' && order.status === 'Declined') return false;

      // Filter by search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesFarmer = order.farmerName.toLowerCase().includes(q);
        const matchesDistrict = order.district.toLowerCase().includes(q);
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesItem = order.items.some((item) =>
          item.title.toLowerCase().includes(q)
        );
        return matchesFarmer || matchesDistrict || matchesId || matchesItem;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handleAcceptAndPack = (order: SupplierOrderRequest) => {
    Alert.alert(
      'Accept & Pack Request',
      `Move ${order.id} for ${order.farmerName} to Packing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Pack',
          onPress: () => {
            acceptAndPackOrder(order.id);
            // Keep card expanded to show progress
            setExpandedCardIds((prev) => new Set(prev).add(order.id));
          },
        },
      ]
    );
  };

  const handleDecline = (order: SupplierOrderRequest) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline request ${order.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => declineOrder(order.id),
        },
      ]
    );
  };

  const handleMarkDelivered = (order: SupplierOrderRequest) => {
    Alert.alert(
      'Complete Delivery',
      `Confirm delivery for ${order.id} (${order.farmerName})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivered',
          onPress: () => updateOrderStatus(order.id, 'Completed'),
        },
      ]
    );
  };

  const handleMessageFarmer = (order: SupplierOrderRequest) => {
    router.push({
      pathname: '/(supplier)/messages',
      params: { farmerName: order.farmerName, requestId: order.id },
    } as any);
  };

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
        {/* 1. Header Bar: Brown Basket Icon, Title with Highlight, Chat Button */}
        <View style={styles.headerRow}>
          {/* Earthy Warm Brown Basket Badge */}
          <View style={styles.basketIconBadge}>
            <MaterialCommunityIcons name="basket" size={22} color="#FFFFFF" />
          </View>

          {/* Center Title Block */}
          <View style={styles.titleBlock}>
            <Text
              style={[
                styles.headerTagline,
                isDark && styles.headerTaglineDark,
              ]}
            >
              From the fields 🌾
            </Text>

            <View style={styles.headingRow}>
              <Text
                style={[
                  styles.headingFarmerText,
                  isDark && styles.headingFarmerTextDark,
                ]}
              >
                Farmer{' '}
              </Text>
              <View
                style={[
                  styles.headingHighlight,
                  isDark && styles.headingHighlightDark,
                ]}
              >
                <Text
                  style={[
                    styles.headingRequestsText,
                    isDark && styles.headingRequestsTextDark,
                  ]}
                >
                  Requests
                </Text>
              </View>
            </View>
          </View>

          {/* Right Chat Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(supplier)/messages')}
            style={[styles.chatButton, isDark && styles.chatButtonDark]}
            accessibilityRole="button"
            accessibilityLabel="Open messages"
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={20}
              color={isDark ? '#E5EFE7' : '#2C402E'}
            />
          </TouchableOpacity>
        </View>

        {/* 2. Hero Banner Card ("Supply the season") */}
        <View style={styles.heroBannerContainer}>
          <Image
            source={SHELF_BANNER_IMAGE}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />

          {/* Atmospheric Dark Gradient Overlay */}
          <LinearGradient
            colors={['rgba(15,35,20,0.55)', 'rgba(10,25,12,0.88)']}
            style={styles.gradientOverlay}
          />

          {/* Hero Content */}
          <View style={styles.heroContent}>
            {/* Top Tagline */}
            <View style={styles.seasonTagRow}>
              <MaterialCommunityIcons
                name="sprout-outline"
                size={14}
                color="rgba(255,255,255,0.85)"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.seasonTagText}>Supply the season</Text>
            </View>

            {/* Headline */}
            <Text style={styles.heroHeadline}>
              {newCount} farmer{newCount === 1 ? ' is' : 's are'}{' '}
              <Text style={styles.heroHeadlineItalic}>waiting on you</Text>
            </Text>

            {/* Glassmorphism Metrics Bar */}
            <View style={styles.glassMetricsBar}>
              {/* Metric 1: New */}
              <View style={styles.metricColumn}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={16}
                  color="#A7CFA9"
                  style={styles.metricIcon}
                />
                <Text style={styles.metricValue}>{newCount}</Text>
                <Text style={styles.metricLabel}>New</Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Metric 2: Packing */}
              <View style={styles.metricColumn}>
                <MaterialCommunityIcons
                  name="basket-outline"
                  size={16}
                  color="#A7CFA9"
                  style={styles.metricIcon}
                />
                <Text style={styles.metricValue}>{packingCount}</Text>
                <Text style={styles.metricLabel}>Packing</Text>
              </View>

              <View style={styles.metricDivider} />

              {/* Metric 3: LKR earned */}
              <View style={styles.metricColumn}>
                <MaterialCommunityIcons
                  name="shield-outline"
                  size={16}
                  color="#A7CFA9"
                  style={styles.metricIcon}
                />
                <Text style={styles.metricValue}>6.8k</Text>
                <Text style={styles.metricLabel}>LKR earned</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Search Bar */}
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={isDark ? '#7E9684' : '#8E9F90'}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search farmer or request ID"
            placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
            style={[styles.searchInput, isDark && styles.searchInputDark]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={isDark ? '#7E9684' : '#8E9F90'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Filter Chips Row */}
        <View style={styles.filterTabsRow}>
          {/* Tab: All */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('All')}
            style={[
              styles.filterTab,
              activeTab === 'All'
                ? isDark
                  ? styles.filterTabActiveDark
                  : styles.filterTabActive
                : isDark
                ? styles.filterTabInactiveDark
                : styles.filterTabInactive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'All'
                  ? styles.filterTabTextActive
                  : isDark
                  ? styles.filterTabTextInactiveDark
                  : styles.filterTabTextInactive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Tab: New */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('New')}
            style={[
              styles.filterTab,
              activeTab === 'New'
                ? isDark
                  ? styles.filterTabActiveDark
                  : styles.filterTabActive
                : isDark
                ? styles.filterTabInactiveDark
                : styles.filterTabInactive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'New'
                  ? styles.filterTabTextActive
                  : isDark
                  ? styles.filterTabTextInactiveDark
                  : styles.filterTabTextInactive,
              ]}
            >
              New{' '}
              <Text
                style={
                  activeTab === 'New'
                    ? styles.filterTabBadgeActive
                    : styles.filterTabBadgeInactive
                }
              >
                {newCount}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Tab: Packing */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('Packing')}
            style={[
              styles.filterTab,
              activeTab === 'Packing'
                ? isDark
                  ? styles.filterTabActiveDark
                  : styles.filterTabActive
                : isDark
                ? styles.filterTabInactiveDark
                : styles.filterTabInactive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'Packing'
                  ? styles.filterTabTextActive
                  : isDark
                  ? styles.filterTabTextInactiveDark
                  : styles.filterTabTextInactive,
              ]}
            >
              Packing{' '}
              <Text
                style={
                  activeTab === 'Packing'
                    ? styles.filterTabBadgeActive
                    : styles.filterTabBadgeInactive
                }
              >
                {packingCount}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Tab: Completed */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('Completed')}
            style={[
              styles.filterTab,
              activeTab === 'Completed'
                ? isDark
                  ? styles.filterTabActiveDark
                  : styles.filterTabActive
                : isDark
                ? styles.filterTabInactiveDark
                : styles.filterTabInactive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'Completed'
                  ? styles.filterTabTextActive
                  : isDark
                  ? styles.filterTabTextInactiveDark
                  : styles.filterTabTextInactive,
              ]}
            >
              Completed{' '}
              <Text
                style={
                  activeTab === 'Completed'
                    ? styles.filterTabBadgeActive
                    : styles.filterTabBadgeInactive
                }
              >
                {completedCount}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Farmer Request Cards List */}
        <View style={styles.cardsContainer}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="inbox-outline"
                size={48}
                color={isDark ? '#4B6350' : '#A4B5A5'}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  isDark && styles.emptyTitleDark,
                ]}
              >
                No requests found
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  isDark && styles.emptySubtitleDark,
                ]}
              >
                {searchQuery
                  ? 'Try modifying your search query'
                  : 'Requests from farmers will appear here'}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedCardIds.has(order.id);
              const isNew = order.status === 'New';
              const isPacking = order.status === 'Packing';
              const isCompleted = order.status === 'Completed';

              return (
                <View
                  key={order.id}
                  style={[
                    styles.orderCard,
                    isDark && styles.orderCardDark,
                  ]}
                >
                  {/* Card Header: Avatar, Name & Location, Status Badge */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleExpand(order.id)}
                    style={styles.cardHeader}
                  >
                    {/* Farmer Avatar */}
                    <Image
                      source={order.farmerAvatar}
                      style={styles.farmerAvatar}
                    />

                    {/* Farmer Info Column */}
                    <View style={styles.farmerInfoColumn}>
                      <Text
                        style={[
                          styles.farmerNameText,
                          isDark && styles.farmerNameTextDark,
                        ]}
                      >
                        {order.farmerName}
                      </Text>
                      <View style={styles.locationRow}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={13}
                          color={isDark ? '#8EA491' : '#718573'}
                          style={{ marginRight: 2 }}
                        />
                        <Text
                          style={[
                            styles.locationText,
                            isDark && styles.locationTextDark,
                          ]}
                        >
                          {order.district} · {order.timeAgo}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge Pill */}
                    <View
                      style={[
                        styles.statusPill,
                        isNew
                          ? styles.statusPillNew
                          : isPacking
                          ? styles.statusPillPacking
                          : styles.statusPillCompleted,
                        isDark &&
                          (isNew
                            ? styles.statusPillNewDark
                            : isPacking
                            ? styles.statusPillPackingDark
                            : styles.statusPillCompletedDark),
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          isNew
                            ? styles.statusDotNew
                            : isPacking
                            ? styles.statusDotPacking
                            : styles.statusDotCompleted,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          isNew
                            ? styles.statusTextNew
                            : isPacking
                            ? styles.statusTextPacking
                            : styles.statusTextCompleted,
                        ]}
                      >
                        {isCompleted ? 'Fulfilled' : order.status}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Order Items Box */}
                  <View
                    style={[
                      styles.orderItemsBox,
                      isDark && styles.orderItemsBoxDark,
                    ]}
                  >
                    {order.items.map((item, idx) => (
                      <View
                        key={`item-${idx}`}
                        style={[
                          styles.orderItemRow,
                          idx > 0 && styles.orderItemDivider,
                          idx > 0 &&
                            isDark &&
                            styles.orderItemDividerDark,
                        ]}
                      >
                        <Image
                          source={item.imageUrl}
                          style={styles.itemThumbnail}
                        />
                        <View style={styles.itemInfo}>
                          <Text
                            style={[
                              styles.itemTitleText,
                              isDark && styles.itemTitleTextDark,
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              styles.itemQuantityText,
                              isDark && styles.itemQuantityTextDark,
                            ]}
                          >
                            {item.quantity}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.itemPriceText,
                            isDark && styles.itemPriceTextDark,
                          ]}
                        >
                          {item.price.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Summary Row: Request ID & Total Amount & Chevron */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(order.id)}
                    style={styles.summaryRow}
                  >
                    <Text
                      style={[
                        styles.requestIdText,
                        isDark && styles.requestIdTextDark,
                      ]}
                    >
                      {order.id}
                    </Text>

                    <View style={styles.summaryRight}>
                      <Text
                        style={[
                          styles.totalCurrencyText,
                          isDark && styles.totalCurrencyTextDark,
                        ]}
                      >
                        LKR{' '}
                      </Text>
                      <Text
                        style={[
                          styles.totalAmountText,
                          isDark && styles.totalAmountTextDark,
                        ]}
                      >
                        {order.totalAmount.toLocaleString()}
                      </Text>
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={isDark ? '#8EA491' : '#718573'}
                        style={{ marginLeft: 6 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* EXPANDED ACCORDION CONTENT */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Order Progress Stepper */}
                      <View style={styles.stepperContainer}>
                        {/* Step 1: Received */}
                        <View style={styles.stepNode}>
                          <View
                            style={[
                              styles.stepCircle,
                              styles.stepCircleActive,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="bell"
                              size={12}
                              color="#FFFFFF"
                            />
                          </View>
                          <Text
                            style={[
                              styles.stepLabel,
                              styles.stepLabelActive,
                              isDark && styles.stepLabelActiveDark,
                            ]}
                          >
                            Received
                          </Text>
                        </View>

                        {/* Connector 1 */}
                        <View
                          style={[
                            styles.stepConnector,
                            (isPacking || isCompleted) &&
                              styles.stepConnectorActive,
                          ]}
                        />

                        {/* Step 2: Packing */}
                        <View style={styles.stepNode}>
                          <View
                            style={[
                              styles.stepCircle,
                              isPacking || isCompleted
                                ? styles.stepCircleActive
                                : styles.stepCircleInactive,
                              isDark &&
                                !isPacking &&
                                !isCompleted &&
                                styles.stepCircleInactiveDark,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="basket-outline"
                              size={12}
                              color={
                                isPacking || isCompleted
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#7E9582'
                                  : '#8E9F90'
                              }
                            />
                          </View>
                          <Text
                            style={[
                              styles.stepLabel,
                              (isPacking || isCompleted) &&
                                styles.stepLabelActive,
                              isDark &&
                                (isPacking || isCompleted) &&
                                styles.stepLabelActiveDark,
                            ]}
                          >
                            Packing
                          </Text>
                        </View>

                        {/* Connector 2 */}
                        <View
                          style={[
                            styles.stepConnector,
                            isCompleted && styles.stepConnectorActive,
                          ]}
                        />

                        {/* Step 3: Delivered */}
                        <View style={styles.stepNode}>
                          <View
                            style={[
                              styles.stepCircle,
                              isCompleted
                                ? styles.stepCircleActive
                                : styles.stepCircleInactive,
                              isDark &&
                                !isCompleted &&
                                styles.stepCircleInactiveDark,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="check"
                              size={12}
                              color={
                                isCompleted
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#7E9582'
                                  : '#8E9F90'
                              }
                            />
                          </View>
                          <Text
                            style={[
                              styles.stepLabel,
                              isCompleted && styles.stepLabelActive,
                              isDark &&
                                isCompleted &&
                                styles.stepLabelActiveDark,
                            ]}
                          >
                            Delivered
                          </Text>
                        </View>
                      </View>

                      {/* Details Row: Delivery & Questions/Chat Tiles */}
                      <View style={styles.detailsTileRow}>
                        {/* Delivery Tile */}
                        <View
                          style={[
                            styles.infoTile,
                            isDark && styles.infoTileDark,
                          ]}
                        >
                          <View style={styles.infoTileIconRow}>
                            <MaterialCommunityIcons
                              name="truck-delivery-outline"
                              size={15}
                              color={isDark ? '#8EA491' : '#6A806D'}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.infoTileCaption,
                                isDark && styles.infoTileCaptionDark,
                              ]}
                            >
                              Delivery
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.infoTileValue,
                              isDark && styles.infoTileValueDark,
                            ]}
                          >
                            {order.deliveryMethod}
                          </Text>
                        </View>

                        {/* Message Farmer Tile */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleMessageFarmer(order)}
                          style={[
                            styles.infoTile,
                            styles.infoTileChat,
                            isDark && styles.infoTileChatDark,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Message ${order.farmerName}`}
                        >
                          <View style={styles.infoTileIconRow}>
                            <MaterialCommunityIcons
                              name="chat-question-outline"
                              size={15}
                              color={isDark ? '#8ED697' : '#395E3F'}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.infoTileCaption,
                                { color: isDark ? '#8ED697' : '#395E3F' },
                              ]}
                            >
                              Questions?
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.infoTileValue,
                              { color: isDark ? '#BCEBC2' : '#284E2F' },
                            ]}
                          >
                            Message farmer
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Action Buttons */}
                      {isNew && (
                        <View style={styles.actionButtonsRow}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleDecline(order)}
                            style={[
                              styles.declineButton,
                              isDark && styles.declineButtonDark,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Decline request ${order.id}`}
                          >
                            <Text
                              style={[
                                styles.declineButtonText,
                                isDark && styles.declineButtonTextDark,
                              ]}
                            >
                              Decline
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={() => handleAcceptAndPack(order)}
                            style={[
                              styles.acceptButton,
                              isDark && styles.acceptButtonDark,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Accept & Pack request ${order.id}`}
                          >
                            <MaterialCommunityIcons
                              name="check"
                              size={18}
                              color="#FFFFFF"
                              style={{ marginRight: 6 }}
                            />
                            <Text style={styles.acceptButtonText}>
                              Accept & Pack
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {isPacking && (
                        <TouchableOpacity
                          activeOpacity={0.88}
                          onPress={() => handleMarkDelivered(order)}
                          style={[
                            styles.fullWidthActionButton,
                            isDark && styles.fullWidthActionButtonDark,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Mark request ${order.id} as delivered`}
                        >
                          <MaterialCommunityIcons
                            name="check-circle-outline"
                            size={18}
                            color="#FFFFFF"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.acceptButtonText}>
                            Mark as Delivered
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

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
    paddingBottom: 130, // Clearance for bottom navigation tab bar
  },

  /* HEADER */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  basketIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5A4230', // Warm earthy brown from Figma
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTagline: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#556E58',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  headerTaglineDark: {
    color: '#9CB39F',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingFarmerText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    letterSpacing: -0.3,
  },
  headingFarmerTextDark: {
    color: '#F0F5F1',
  },
  headingHighlight: {
    backgroundColor: '#D7E5D4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  headingHighlightDark: {
    backgroundColor: '#26442C',
  },
  headingRequestsText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    letterSpacing: -0.3,
  },
  headingRequestsTextDark: {
    color: '#D4E8D7',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E4DA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chatButtonDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },

  /* HERO BANNER CARD */
  heroBannerContainer: {
    height: 200,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    backgroundColor: '#1C3723',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  seasonTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonTagText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  heroHeadline: {
    fontSize: 23,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroHeadlineItalic: {
    fontStyle: 'italic',
    color: '#F3E4B8', // Warm golden cream italic
  },
  glassMetricsBar: {
    backgroundColor: 'rgba(20, 38, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricColumn: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: serifFont,
  },
  metricLabel: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.78)',
    fontWeight: '500',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  /* SEARCH BAR */
  searchBar: {
    backgroundColor: '#FAF8F3',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchBarDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#1C3723',
    padding: 0,
  },
  searchInputDark: {
    color: '#F0F5F1',
  },

  /* FILTER TABS ROW */
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#1C3723', // Dark forest green
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabActiveDark: {
    backgroundColor: '#264B30',
  },
  filterTabInactive: {
    backgroundColor: '#FAF8F3',
    borderWidth: 1,
    borderColor: '#DFD8CC',
  },
  filterTabInactiveDark: {
    backgroundColor: '#16271A',
    borderWidth: 1,
    borderColor: '#263D2B',
  },
  filterTabText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabTextInactive: {
    color: '#344C36',
  },
  filterTabTextInactiveDark: {
    color: '#A2B9A5',
  },
  filterTabBadgeActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterTabBadgeInactive: {
    color: '#718573',
    fontWeight: '500',
  },

  /* CARDS LIST */
  cardsContainer: {
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    marginTop: 12,
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#718573',
    marginTop: 4,
    textAlign: 'center',
  },
  emptySubtitleDark: {
    color: '#8EA491',
  },

  /* ORDER CARD */
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE6DB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAE5D9',
  },
  farmerInfoColumn: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  farmerNameText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
    marginBottom: 3,
  },
  farmerNameTextDark: {
    color: '#F0F5F1',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#718573',
  },
  locationTextDark: {
    color: '#95A997',
  },

  /* STATUS PILLS */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
  },
  statusPillNew: {
    backgroundColor: '#FDF2E9',
  },
  statusPillNewDark: {
    backgroundColor: '#352115',
  },
  statusPillPacking: {
    backgroundColor: '#F7F1E7',
  },
  statusPillPackingDark: {
    backgroundColor: '#2F271B',
  },
  statusPillCompleted: {
    backgroundColor: '#EAF5EC',
  },
  statusPillCompletedDark: {
    backgroundColor: '#16311D',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotNew: {
    backgroundColor: '#D97706',
  },
  statusDotPacking: {
    backgroundColor: '#8B5E3C',
  },
  statusDotCompleted: {
    backgroundColor: '#2E7D32',
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusTextNew: {
    color: '#B45309',
  },
  statusTextPacking: {
    color: '#8B5E3C',
  },
  statusTextCompleted: {
    color: '#2E7D32',
  },

  /* ORDER ITEMS BOX */
  orderItemsBox: {
    backgroundColor: '#F6F3EB',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  orderItemsBoxDark: {
    backgroundColor: '#101F14',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  orderItemDivider: {
    borderTopWidth: 1,
    borderTopColor: '#EBE5D8',
    marginTop: 8,
    paddingTop: 8,
  },
  orderItemDividerDark: {
    borderTopColor: '#1E3523',
  },
  itemThumbnail: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E5DFD1',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C3723',
    marginBottom: 2,
  },
  itemTitleTextDark: {
    color: '#F0F5F1',
  },
  itemQuantityText: {
    fontSize: 12,
    color: '#718573',
  },
  itemQuantityTextDark: {
    color: '#8EA491',
  },
  itemPriceText: {
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
  },
  itemPriceTextDark: {
    color: '#E0EDE2',
  },

  /* SUMMARY ROW */
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  requestIdText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8E9F90',
    letterSpacing: 0.3,
  },
  requestIdTextDark: {
    color: '#6E8572',
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCurrencyText: {
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
  },
  totalCurrencyTextDark: {
    color: '#F0F5F1',
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: serifFont,
    color: '#1C3723',
  },
  totalAmountTextDark: {
    color: '#F0F5F1',
  },

  /* EXPANDED CONTENT */
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDE7DC',
    paddingTop: 14,
  },

  /* STEPPER */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  stepNode: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#426340', // Rich moss green
  },
  stepCircleInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4CDBD',
  },
  stepCircleInactiveDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  stepLabel: {
    fontSize: 10.5,
    color: '#8E9F90',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#1C3723',
    fontWeight: '700',
  },
  stepLabelActiveDark: {
    color: '#E5EFE7',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2DCCE',
    marginHorizontal: 8,
    marginBottom: 18,
  },
  stepConnectorActive: {
    backgroundColor: '#426340',
  },

  /* DETAILS TILES */
  detailsTileRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  infoTile: {
    flex: 1,
    backgroundColor: '#F6F3EB',
    borderRadius: 16,
    padding: 12,
  },
  infoTileDark: {
    backgroundColor: '#101F14',
  },
  infoTileChat: {
    backgroundColor: '#EAF1EB',
  },
  infoTileChatDark: {
    backgroundColor: '#15291A',
  },
  infoTileIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoTileCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718573',
  },
  infoTileCaptionDark: {
    color: '#8EA491',
  },
  infoTileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C3723',
  },
  infoTileValueDark: {
    color: '#F0F5F1',
  },

  /* ACTION BUTTONS */
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F2EA',
    borderWidth: 1.5,
    borderColor: '#DFD8CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#344C36',
  },
  declineButtonTextDark: {
    color: '#C6D8C8',
  },
  acceptButton: {
    flex: 1.6,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C3723',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  acceptButtonDark: {
    backgroundColor: '#264B30',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullWidthActionButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C3723',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  fullWidthActionButtonDark: {
    backgroundColor: '#264B30',
  },
});
