import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { messagesService } from '../../../src/services/messages.service';
import { useAuth } from '../../../src/store/authStore';
import { BuyerMessageThread } from '../../../src/types/buyer.types';
import { BuyerMessageCard } from '../../../src/components/buyer/BuyerMessageCard';
import { useDarkMode } from '../../../src/store/uiStore';
import { StatusBar } from 'expo-status-bar';

type FilterTab = 'All' | 'Requests' | 'Notes' | 'Unread';

export default function BuyerMessagesScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [threads, setThreads] = useState<BuyerMessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.id;

  // Load conversations from Supabase
  const loadThreads = useCallback(async () => {
    if (!userId) {
      setThreads([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await messagesService.fetchConversations(userId);
      setThreads(data);
    } catch (err) {
      console.warn('[BuyerMessages] Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      return;
    }

    messagesService.fetchConversations(userId)
      .then((data) => {
        if (isMounted) {
          setThreads(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[BuyerMessages] Error loading conversations:', err);
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = messagesService.subscribeToMessages(userId, () => {
      loadThreads();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId, loadThreads]);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadThreads();
    setRefreshing(false);
  };

  // Unread count calculated dynamically
  const unreadCount = useMemo(() => {
    return threads.filter((m) => m.isUnread).length;
  }, [threads]);

  // Filter messages based on active chip and search query
  const filteredMessages = useMemo(() => {
    return threads.filter((msg) => {
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
  }, [threads, activeTab, searchQuery]);

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
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top']}
    >
      <StatusBar
        style={isDark ? 'light' : 'dark'}

      />

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
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={isDark ? '#F0F5F1' : '#162C1A'}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Messages
          </Text>
        </View>

        {/* Right Side: Search Action Button */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setIsSearchVisible((prev) => !prev)}
            style={[
              styles.actionCircleButton,
              isDark && styles.actionCircleButtonDark,
              isSearchVisible && (isDark ? styles.actionCircleButtonActiveDark : styles.actionCircleButtonActive),
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search messages"
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={isSearchVisible ? '#FFFFFF' : isDark ? '#E5EFE7' : '#162C1A'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Input Bar */}
      {isSearchVisible && (
        <View style={styles.searchBarWrapper}>
          <View
            style={[
              styles.searchBarInputContainer,
              isDark && styles.searchBarInputContainerDark,
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={isDark ? '#7E9B82' : '#758876'}
              style={styles.searchBarIcon}
            />
            <TextInput
              style={[styles.searchTextInput, isDark && styles.searchTextInputDark]}
              placeholder="Search conversations, farmers, requests..."
              placeholderTextColor={isDark ? '#6B826F' : '#8C9E8D'}
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
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={isDark ? '#7E9B82' : '#758876'}
                />
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
              isDark && styles.filterTabPillDark,
              activeTab === 'All' && (isDark ? styles.filterTabPillActiveDark : styles.filterTabPillActive),
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                isDark && styles.filterTabTextDark,
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
              isDark && styles.filterTabPillDark,
              activeTab === 'Requests' && (isDark ? styles.filterTabPillActiveDark : styles.filterTabPillActive),
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                isDark && styles.filterTabTextDark,
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
              isDark && styles.filterTabPillDark,
              activeTab === 'Notes' && (isDark ? styles.filterTabPillActiveDark : styles.filterTabPillActive),
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                isDark && styles.filterTabTextDark,
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
              isDark && styles.filterTabPillDark,
              activeTab === 'Unread' && (isDark ? styles.filterTabPillActiveDark : styles.filterTabPillActive),
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                isDark && styles.filterTabTextDark,
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

      {/* Message List ScrollView */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDark ? '#4ADE80' : '#1D3724']}
            tintColor={isDark ? '#4ADE80' : '#1D3724'}
          />
        }
      >
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#1D3724'} />
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark, { marginTop: 16 }]}>
              Loading conversations...
            </Text>
          </View>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((thread) => (
            <BuyerMessageCard
              key={thread.id}
              thread={thread}
              onPress={handleThreadPress}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, isDark && styles.emptyIconCircleDark]}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={32}
                color={isDark ? '#8CA590' : '#7B8E7D'}
              />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              {threads.length === 0 ? 'No messages yet' : 'No messages found'}
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              {threads.length === 0
                ? 'Connect with farmers and suppliers through the marketplace to start a conversation.'
                : searchQuery.trim().length > 0
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
                style={[styles.clearFilterButton, isDark && styles.clearFilterButtonDark]}
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
  safeAreaDark: {
    backgroundColor: '#0E1710',
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
  headerTitleDark: {
    color: '#F0F5F1',
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
  actionCircleButtonDark: {
    backgroundColor: '#1E2F21',
  },
  actionCircleButtonActive: {
    backgroundColor: '#1D3724',
  },
  actionCircleButtonActiveDark: {
    backgroundColor: '#2E7A43',
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
  searchBarInputContainerDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#162C1A',
  },
  searchTextInputDark: {
    color: '#F0F5F1',
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
  filterTabPillDark: {
    backgroundColor: '#18271C',
    borderWidth: 0.8,
    borderColor: '#283D2C',
  },
  filterTabPillActive: {
    backgroundColor: '#1D3724', // Deep hunter/forest green matching active Figma pill
  },
  filterTabPillActiveDark: {
    backgroundColor: '#2B6B3B',
    borderColor: '#2B6B3B',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#556957',
  },
  filterTabTextDark: {
    color: '#9CB3A0',
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
  emptyIconCircleDark: {
    backgroundColor: '#1E2F22',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#162C1A',
    marginBottom: 6,
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#6F8071',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptySubtitleDark: {
    color: '#8CA590',
  },
  clearFilterButton: {
    backgroundColor: '#1D3724',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFilterButtonDark: {
    backgroundColor: '#276938',
  },
  clearFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
});
