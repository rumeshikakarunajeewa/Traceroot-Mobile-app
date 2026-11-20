import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { mockBuyerMessages } from '../../../src/constants/buyerMockData';
import { BuyerMessageItem } from '../../../src/types/buyer.types';
import { BuyerMessageCard } from '../../../src/components/buyer/BuyerMessageCard';

type FilterType = 'All' | 'Requests' | 'Notes' | 'Unread';

export default function BuyerMessagesScreen() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Unread messages count
  const unreadCount = useMemo(() => {
    return mockBuyerMessages.filter((m) => m.isUnread).length;
  }, []);

  // Filtered messages list
  const filteredMessages = useMemo(() => {
    return mockBuyerMessages.filter((item) => {
      // 1. Category tab filter
      if (selectedFilter === 'Requests' && item.tag !== 'Request') {
        return false;
      }
      if (selectedFilter === 'Notes' && item.tag !== 'Note') {
        return false;
      }
      if (selectedFilter === 'Unread' && !item.isUnread) {
        return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.senderName.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q)
      );
    });
  }, [selectedFilter, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const handleMessagePress = (message: BuyerMessageItem) => {
    Alert.alert(
      message.senderName,
      `"${message.snippet}"\n\nTag: ${message.tag}\nStatus: ${message.status}\nReceived: ${message.timestamp}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Reply Message',
          onPress: () => {
            Alert.alert('Reply Sent', `Your message to ${message.senderName} has been queued.`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ========================================================
          1. TOP WHITE HEADER CONTAINER WITH ROUNDED BOTTOM
         ======================================================== */}
      <View style={styles.headerContainer}>
        {/* Header Top Bar */}
        <View style={styles.headerTopRow}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.headerTitle}>Messages</Text>

          {/* Right Action Buttons */}
          <View style={styles.headerRightButtons}>
            {/* Search Icon Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSearchVisible(!searchVisible)}
              style={styles.iconCircleButton}
            >
              <Ionicons name="search-outline" size={18} color="#374151" />
            </TouchableOpacity>

            {/* Grid/Options Icon Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedFilter('All')}
              style={styles.iconCircleButton}
            >
              <MaterialCommunityIcons name="dots-grid" size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Search Input Field (when search is toggled) */}
        {searchVisible && (
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search-outline" size={16} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Filter Pills Row */}
        <View style={styles.filterRow}>
          {/* All */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('All')}
            style={[
              styles.filterPill,
              selectedFilter === 'All' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'All' ? styles.filterTextActive : styles.filterTextInactive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Requests */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Requests')}
            style={[
              styles.filterPill,
              selectedFilter === 'Requests' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Requests' ? styles.filterTextActive : styles.filterTextInactive,
              ]}
            >
              Requests
            </Text>
          </TouchableOpacity>

          {/* Notes */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Notes')}
            style={[
              styles.filterPill,
              selectedFilter === 'Notes' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Notes' ? styles.filterTextActive : styles.filterTextInactive,
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>

          {/* Unread 1 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Unread')}
            style={[
              styles.filterPill,
              selectedFilter === 'Unread' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Unread' ? styles.filterTextActive : styles.filterTextInactive,
              ]}
            >
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================
          2. MESSAGES LIST SCROLL AREA
         ======================================================== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E4D2B"
          />
        }
      >
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <BuyerMessageCard
              key={message.id}
              message={message}
              onPress={handleMessagePress}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chat-outline" size={44} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter !== 'All'
                ? `No conversations under "${selectedFilter}" category`
                : 'Your message inbox is currently clear.'}
            </Text>
            {selectedFilter !== 'All' && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSelectedFilter('All');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetButtonText}>View All Messages</Text>
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
    backgroundColor: '#F5F6F3', // Soft organic off-white
  },

  /* 1. White Header Container */
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2937',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#1E4D2B', // Dark forest green
    shadowColor: '#1E4D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  filterPillInactive: {
    backgroundColor: '#F3F4F6',
  },
  filterText: {
    fontSize: 13,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterTextInactive: {
    color: '#4B5563',
    fontWeight: '500',
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D97706', // Orange badge
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  /* 2. Messages List Scroll Area */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 115, // Space for the floating bottom navigation bar
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
