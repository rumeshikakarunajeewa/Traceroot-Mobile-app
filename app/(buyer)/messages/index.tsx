import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { mockBuyerMessages } from '../../../src/constants/buyerMockData';
import { BuyerMessageThread } from '../../../src/types/buyer.types';
import { BuyerMessageCard } from '../../../src/components/buyer/BuyerMessageCard';

type FilterTab = 'All' | 'Requests' | 'Notes' | 'Unread';

export default function BuyerMessagesScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Unread count calculated dynamically
  const unreadCount = useMemo(() => {
    return mockBuyerMessages.filter((m) => m.isUnread).length;
  }, []);

  // Filter messages based on active chip and search query
  const filteredMessages = useMemo(() => {
    return mockBuyerMessages.filter((msg) => {
      // Filter tab check
      if (activeTab === 'Requests' && msg.category !== 'Request') return false;
      if (activeTab === 'Notes' && msg.category !== 'Note') return false;
      if (activeTab === 'Unread' && !msg.isUnread) return false;

      // Search query check
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = msg.senderName.toLowerCase().includes(query);
        const matchesSnippet = msg.messageSnippet.toLowerCase().includes(query);
        return matchesName || matchesSnippet;
      }

      return true;
    });
  }, [activeTab, searchQuery]);

  const handleThreadPress = (thread: BuyerMessageThread) => {
    router.push({
      pathname: '/(buyer)/messages/[userId]',
      params: {
        userId: thread.senderId,
        name: thread.senderName,
        category: thread.category,
        avatar: thread.avatarUrl,
      },
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(buyer)' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4EFE6" />

      {/* Header Container */}
      <View style={styles.headerContainer}>
        {/* Left Side: Back Arrow + Screen Title */}
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#162C1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {/* Right Side: Search Action Button */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setIsSearchVisible((prev) => !prev)}
            style={[
              styles.actionCircleButton,
              isSearchVisible && styles.actionCircleButtonActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search messages"
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={isSearchVisible ? '#FFFFFF' : '#162C1A'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Input Bar */}
      {isSearchVisible && (
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBarInputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#758876" style={styles.searchBarIcon} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search conversations, farmers, requests..."
              placeholderTextColor="#8C9E8D"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close-circle" size={18} color="#758876" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Filter Tabs Bar (All, Requests, Notes, Unread 1) */}
      <View style={styles.filterTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsScrollContent}
        >
          {/* All */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('All')}
            style={[
              styles.filterTabPill,
              activeTab === 'All' && styles.filterTabPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'All' && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Requests */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('Requests')}
            style={[
              styles.filterTabPill,
              activeTab === 'Requests' && styles.filterTabPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'Requests' && styles.filterTabTextActive,
              ]}
            >
              Requests
            </Text>
          </TouchableOpacity>

          {/* Notes */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('Notes')}
            style={[
              styles.filterTabPill,
              activeTab === 'Notes' && styles.filterTabPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'Notes' && styles.filterTabTextActive,
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>

          {/* Unread with Badge */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('Unread')}
            style={[
              styles.filterTabPill,
              activeTab === 'Unread' && styles.filterTabPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'Unread' && styles.filterTabTextActive,
              ]}
            >
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeNumber}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Messages Scroll List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1D3724']}
            tintColor="#1D3724"
          />
        }
      >
        {filteredMessages.length > 0 ? (
          filteredMessages.map((thread) => (
            <BuyerMessageCard
              key={thread.id}
              thread={thread}
              onPress={handleThreadPress}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="chat-outline" size={32} color="#7B8E7D" />
            </View>
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim().length > 0
                ? `No results matching "${searchQuery}".`
                : `There are currently no ${activeTab.toLowerCase()} messages in your inbox.`}
            </Text>
            {(searchQuery.trim().length > 0 || activeTab !== 'All') && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTab('All');
                  setSearchQuery('');
                }}
                style={styles.clearFilterButton}
              >
                <Text style={styles.clearFilterButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4EFE6', // Soft warm cream/beige background matching the design
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#162C1A',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDEAE0', // Soft pill background matching Figma screenshot
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleButtonActive: {
    backgroundColor: '#1D3724',
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBarInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#E3E7DE',
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#162C1A',
  },
  filterTabsContainer: {
    paddingBottom: 16,
  },
  filterTabsScrollContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 10,
  },
  filterTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEEE8', // Soft neutral pill background
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  filterTabPillActive: {
    backgroundColor: '#1D3724', // Deep hunter/forest green matching active Figma pill
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#556957',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#E58B24', // Vibrant orange notification badge matching screenshot
    width: 19,
    height: 19,
    borderRadius: 9.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },
  unreadBadgeNumber: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 125, // Ample clearance above the floating capsule bottom navigation bar
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EAEFE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#162C1A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#6F8071',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  clearFilterButton: {
    backgroundColor: '#1D3724',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
});
