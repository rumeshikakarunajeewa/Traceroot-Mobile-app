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

import { BuyerMessageItem } from '../../../src/types/buyer.types';
import { BuyerMessageCard } from '../../../src/components/buyer/BuyerMessageCard';
import { useDarkMode } from '../../../src/store/uiStore';

type FilterType = 'All' | 'Requests' | 'Notes' | 'Unread';

export default function BuyerMessagesScreen() {
  const [isDark] = useDarkMode();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [messages] = useState<BuyerMessageItem[]>([]);

  // Unread messages count
  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.isUnread).length;
  }, [messages]);

  // Filtered messages list
  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
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
  }, [messages, selectedFilter, searchQuery]);

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
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ========================================================
          1. TOP HEADER CONTAINER WITH ROUNDED BOTTOM
         ======================================================== */}
      <View style={[styles.headerContainer, isDark && styles.headerContainerDark]}>
        {/* Header Top Bar */}
        <View style={styles.headerTopRow}>
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#F0F5F1' : '#1F2937'} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Messages</Text>

          {/* Right Action Buttons */}
          <View style={styles.headerRightButtons}>
            {/* Search Icon Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSearchVisible(!searchVisible)}
              style={[styles.iconCircleButton, isDark && styles.iconCircleButtonDark]}
            >
              <Ionicons name="search-outline" size={18} color={isDark ? '#A6C5A8' : '#374151'} />
            </TouchableOpacity>

            {/* Grid/Options Icon Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedFilter('All')}
              style={[styles.iconCircleButton, isDark && styles.iconCircleButtonDark]}
            >
              <MaterialCommunityIcons
                name="dots-grid"
                size={18}
                color={isDark ? '#A6C5A8' : '#374151'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Search Input Field (when search is toggled) */}
        {searchVisible && (
          <View style={[styles.searchBarWrapper, isDark && styles.searchBarWrapperDark]}>
            <Ionicons
              name="search-outline"
              size={16}
              color={isDark ? '#8EA790' : '#6B7280'}
              style={styles.searchIcon}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              placeholderTextColor={isDark ? '#8EA790' : '#9CA3AF'}
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={isDark ? '#8EA790' : '#9CA3AF'} />
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
              selectedFilter === 'All'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'All'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
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
              selectedFilter === 'Requests'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Requests'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
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
              selectedFilter === 'Notes'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Notes'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>

          {/* Unread */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Unread')}
            style={[
              styles.filterPill,
              selectedFilter === 'Unread'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Unread'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
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
            tintColor={isDark ? '#4ADE80' : '#1E4D2B'}
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
            <MaterialCommunityIcons
              name="chat-outline"
              size={44}
              color={isDark ? '#4ADE80' : '#9CA3AF'}
            />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              {selectedFilter !== 'All' ? 'No messages found' : 'No messages yet'}
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              {selectedFilter !== 'All'
                ? `No conversations under "${selectedFilter}" category`
                : 'Direct inquiries and updates from producers will appear here.'}
            </Text>
            {selectedFilter !== 'All' && (
              <TouchableOpacity
                style={[styles.resetButton, isDark && styles.resetButtonDark]}
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

  /* Dark Mode Overrides */
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  headerContainerDark: {
    backgroundColor: '#18271C',
    borderBottomWidth: 1,
    borderColor: '#263B2B',
  },
  headerTitleDark: {
    color: '#F0F5F1',
  },
  iconCircleButtonDark: {
    backgroundColor: '#203924',
  },
  searchBarWrapperDark: {
    backgroundColor: '#122015',
    borderWidth: 1,
    borderColor: '#263B2B',
  },
  searchInputDark: {
    color: '#F0F5F1',
  },
  filterPillInactiveDark: {
    backgroundColor: '#122015',
    borderWidth: 1,
    borderColor: '#263B2B',
  },
  filterTextInactiveDark: {
    color: '#98B39B',
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitleDark: {
    color: '#98B39B',
  },
  resetButtonDark: {
    backgroundColor: '#2E6930',
  },
});
