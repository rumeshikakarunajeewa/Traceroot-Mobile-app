import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { BuyerMessageItem } from '../../../src/types/buyer.types';
import { BuyerMessageCard } from '../../../src/components/buyer/BuyerMessageCard';
import { useDarkMode } from '../../../src/store/uiStore';
import { useAuth } from '../../../src/store/authStore';
import { authService } from '../../../src/services/auth.service';
import { messagesService, MessagingContact } from '../../../src/services/messages.service';

type FilterType = 'All' | 'Buyers' | 'Unread';

export default function FarmerMessagesScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<BuyerMessageItem[]>([]);

  // New conversation / Contact Buyer modal state
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
        tag: t.partnerRole === 'buyer' ? 'Request' : t.category,
        status: t.status,
        snippet: t.messageSnippet,
        isUnread: t.isUnread,
        unreadCount: t.unreadCount,
      }));
      setMessages(mapped);
    } catch (err) {
      console.warn('[FarmerMessages] Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Real-time subscription for continuous feedback from Buyers
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

  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.isUnread).length;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      if (selectedFilter === 'Buyers' && item.partnerRole !== 'buyer' && item.tag !== 'Request') {
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
      pathname: '/(farmer)/messages/[userId]',
      params: {
        userId: partnerId,
        name: message.senderName,
        category: message.tag,
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
        const list = await messagesService.fetchContactsForMessaging(uid, 'farmer');
        setContacts(list);
      }
    } catch (err) {
      console.warn('[FarmerMessages] Failed to load buyer contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContact = (contact: MessagingContact) => {
    setContactsModalVisible(false);
    setContactSearch('');
    router.push({
      pathname: '/(farmer)/messages/[userId]',
      params: {
        userId: contact.id,
        name: contact.fullName,
        category: 'Request',
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
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header Container */}
      <View style={[styles.headerContainer, isDark && styles.headerContainerDark]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#F0F5F1' : '#1F2937'} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Messages</Text>

          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSearchVisible(!searchVisible)}
              style={[styles.iconCircleButton, isDark && styles.iconCircleButtonDark]}
            >
              <Ionicons name="search-outline" size={18} color={isDark ? '#A6C5A8' : '#374151'} />
            </TouchableOpacity>

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
              placeholder="Search buyer messages..."
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

        {/* Filter Pills */}
        <View style={styles.filterRow}>
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

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedFilter('Buyers')}
            style={[
              styles.filterPill,
              selectedFilter === 'Buyers'
                ? styles.filterPillActive
                : [styles.filterPillInactive, isDark && styles.filterPillInactiveDark],
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'Buyers'
                  ? styles.filterTextActive
                  : [styles.filterTextInactive, isDark && styles.filterTextInactiveDark],
              ]}
            >
              Buyers
            </Text>
          </TouchableOpacity>

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

      {/* Conversations Scroll */}
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
                ? `No conversations under "${selectedFilter}" filter.`
                : 'Connect with buyers for continuous harvest updates, order questions, and feedback.'}
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
                <Text style={styles.resetButtonText}>Message a Buyer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Contact Buyer Modal */}
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
                Message a Buyer
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
                placeholder="Search buyers..."
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
                  No buyers found yet.
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
    backgroundColor: '#F5F2EB',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
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
  headerContainerDark: {
    backgroundColor: '#18271C',
    borderBottomWidth: 1,
    borderColor: '#263B2B',
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
    color: '#16351E',
  },
  headerTitleDark: {
    color: '#F0F5F1',
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
  iconCircleButtonDark: {
    backgroundColor: '#203924',
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
  searchBarWrapperDark: {
    backgroundColor: '#122015',
    borderWidth: 1,
    borderColor: '#263B2B',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2937',
  },
  searchInputDark: {
    color: '#F0F5F1',
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
  },
  filterPillInactive: {
    backgroundColor: '#F3F4F6',
  },
  filterPillInactiveDark: {
    backgroundColor: '#122015',
    borderWidth: 1,
    borderColor: '#263B2B',
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
  filterTextInactiveDark: {
    color: '#98B39B',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 115,
  },
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
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySubtitleDark: {
    color: '#98B39B',
  },
  resetButton: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
  },
  resetButtonDark: {
    backgroundColor: '#2E6930',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
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
});
