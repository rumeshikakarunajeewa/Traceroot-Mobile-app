import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { BuyerMessageItem } from '../../../src/types/buyer.types';
import { BuyerMessageCard } from '../../../src/components/buyer/BuyerMessageCard';
import { useDarkMode } from '../../../src/store/uiStore';
import { useAuth } from '../../../src/store/authStore';
import { authService } from '../../../src/services/auth.service';
import { messagesService, MessagingContact } from '../../../src/services/messages.service';

type FilterType = 'All' | 'Farmers' | 'Suppliers' | 'Notes' | 'Unread';

export default function BuyerMessagesScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<BuyerMessageItem[]>([]);

  // New conversation / Contact Farmer modal state
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [contacts, setContacts] = useState<MessagingContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const userId = user?.id;

  const loadConversations = useCallback(async () => {
    try {
      const uid = userId || (await authService.getSession())?.user?.id;
      if (!uid) {
        setMessages([]);
        return;
      }
      const threads = await messagesService.fetchConversations(uid);
      const mapped: BuyerMessageItem[] = threads.map((t) => ({
        id: t.id,
        senderId: t.senderId,
        senderName: t.senderName,
        partnerRole: t.partnerRole,
        avatarUrl: t.avatarUrl || '',
        timestamp: t.timestamp,
        tag: t.category,
        status: t.status,
        snippet: t.messageSnippet,
        isUnread: t.isUnread,
        unreadCount: t.unreadCount,
      }));
      setMessages(mapped);
    } catch (err) {
      console.warn('[BuyerMessages] Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Refresh whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Real-time subscription for continuous two-way feedback
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;

    const unsubscribe = messagesService.subscribeToMessages(uid, () => {
      loadConversations();
    });
    return () => {
      unsubscribe();
    };
  }, [user?.id, loadConversations]);

  // Unread messages count
  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.isUnread).length;
  }, [messages]);

  // Filtered messages list
  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      if (
        selectedFilter === 'Farmers' &&
        item.partnerRole !== 'farmer' &&
        (item.partnerRole === 'supplier' || item.tag !== 'Request')
      ) {
        return false;
      }
      if (selectedFilter === 'Suppliers' && item.partnerRole !== 'supplier') {
        return false;
      }
      if (selectedFilter === 'Notes' && item.tag !== 'Note') {
        return false;
      }
      if (selectedFilter === 'Unread' && !item.isUnread) {
        return false;
      }

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
    loadConversations();
  };

  const handleMessagePress = (message: BuyerMessageItem) => {
    const partnerId = message.senderId;
    if (!partnerId) return;
    router.push({
      pathname: '/(buyer)/messages/[userId]',
      params: {
        userId: partnerId,
        name: message.senderName,
        category: message.tag,
        role: message.partnerRole || '',
        avatar: message.avatarUrl || '',
      },
    } as any);
  };

  const handleOpenContactsPicker = async () => {
    setContactsModalVisible(true);
    setLoadingContacts(true);
    try {
      const uid = user?.id || (await authService.getSession())?.user?.id;
      if (uid) {
        const list = await messagesService.fetchContactsForMessaging(uid, 'buyer');
        setContacts(list);
      }
    } catch (err) {
      console.warn('[BuyerMessages] Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContact = (contact: MessagingContact) => {
    setContactsModalVisible(false);
    setContactSearch('');
    router.push({
      pathname: '/(buyer)/messages/[userId]',
      params: {
        userId: contact.id,
        name: contact.fullName,
        category: 'Request',
        role: contact.role,
        avatar: contact.avatarUrl || '',
      },
    } as any);
  };

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase().trim();
    return contacts.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.contextLabel && c.contextLabel.toLowerCase().includes(q))
    );
  }, [contacts, contactSearch]);

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

            {/* New Message / Contact Farmer Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenContactsPicker}
              style={[styles.iconCircleButton, isDark && styles.iconCircleButtonDark]}
            >
              <MaterialCommunityIcons
                name="square-edit-outline"
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
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

          {/* Farmers */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Farmers')}
            style={[
              styles.filterPill,
              selectedFilter === 'Farmers'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Farmers'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
              ]}
            >
              Farmers
            </Text>
          </TouchableOpacity>

          {/* Suppliers */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Suppliers')}
            style={[
              styles.filterPill,
              selectedFilter === 'Suppliers'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Suppliers'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
              ]}
            >
              Suppliers
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
        </ScrollView>
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
        {isLoading && messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#1E4D2B'} />
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark, { marginTop: 12 }]}>
              Loading conversations...
            </Text>
          </View>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <BuyerMessageCard
              key={message.senderId || message.id}
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
                : 'Start a live feedback chat with a farmer or supplier about harvests, stock, or deliveries.'}
            </Text>
            {selectedFilter !== 'All' ? (
              <TouchableOpacity
                style={[styles.resetButton, isDark && styles.resetButtonDark]}
                onPress={() => {
                  setSelectedFilter('All');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetButtonText}>View All Messages</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.resetButton, isDark && styles.resetButtonDark]}
                onPress={handleOpenContactsPicker}
              >
                <Text style={styles.resetButtonText}>Message Farmer or Supplier</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* ========================================================
          3. CONTACT FARMER OR SUPPLIER MODAL
         ======================================================== */}
      <Modal
        visible={contactsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, isDark && styles.modalSheetDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Message Farmer or Supplier
              </Text>
              <TouchableOpacity
                onPress={() => setContactsModalVisible(false)}
                style={[styles.iconCircleButton, isDark && styles.iconCircleButtonDark]}
              >
                <Ionicons name="close" size={18} color={isDark ? '#F0F5F1' : '#374151'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBarWrapper, isDark && styles.searchBarWrapperDark]}>
              <Ionicons
                name="search-outline"
                size={16}
                color={isDark ? '#8EA790' : '#6B7280'}
                style={styles.searchIcon}
              />
              <TextInput
                value={contactSearch}
                onChangeText={setContactSearch}
                placeholder="Search farmers or suppliers..."
                placeholderTextColor={isDark ? '#8EA790' : '#9CA3AF'}
                style={[styles.searchInput, isDark && styles.searchInputDark]}
              />
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {loadingContacts ? (
                <ActivityIndicator
                  size="large"
                  color={isDark ? '#4ADE80' : '#1E4D2B'}
                  style={{ marginTop: 24 }}
                />
              ) : filteredContacts.length === 0 ? (
                <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark, { marginTop: 24 }]}>
                  No farmers or suppliers found yet.
                </Text>
              ) : (
                filteredContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectContact(contact)}
                    style={[styles.contactRow, isDark && styles.contactRowDark]}
                  >
                    {contact.avatarUrl ? (
                      <Image source={{ uri: contact.avatarUrl }} style={styles.contactAvatar} />
                    ) : (
                      <View style={[styles.contactAvatarFallback, isDark && styles.contactAvatarFallbackDark]}>
                        <Text style={styles.contactAvatarText}>
                          {contact.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, isDark && styles.contactNameDark]}>
                        {contact.fullName}
                      </Text>
                      {!!contact.contextLabel && (
                        <Text style={[styles.contactContext, isDark && styles.contactContextDark]}>
                          {contact.contextLabel}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name="chat-plus-outline"
                      size={20}
                      color={isDark ? '#4ADE80' : '#1E4D2B'}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F3',
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
    backgroundColor: '#1E4D2B',
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
    backgroundColor: '#D97706',
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
    paddingBottom: 115,
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

  /* Contact Picker Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '78%',
  },
  modalSheetDark: {
    backgroundColor: '#142217',
    borderTopWidth: 1,
    borderColor: '#263B2B',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16301A',
  },
  modalTitleDark: {
    color: '#F0F5F1',
  },
  modalList: {
    maxHeight: 380,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F7F5EE',
    marginBottom: 8,
  },
  contactRowDark: {
    backgroundColor: '#18271C',
    borderWidth: 1,
    borderColor: '#263B2B',
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  contactAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2E6930',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarFallbackDark: {
    backgroundColor: '#203924',
  },
  contactAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#16301A',
  },
  contactNameDark: {
    color: '#F0F5F1',
  },
  contactContext: {
    fontSize: 12,
    color: '#6B7E6C',
    marginTop: 2,
  },
  contactContextDark: {
    color: '#98B39B',
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
