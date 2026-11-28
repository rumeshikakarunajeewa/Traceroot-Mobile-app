import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BuyerMessageItem } from '../../../src/types/buyer.types';
import { BuyerMessageCard } from '../../../src/components/buyer/BuyerMessageCard';
import { useDarkMode } from '../../../src/store/uiStore';
import { useAuth } from '../../../src/store/authStore';
import { useLanguage } from '../../../src/i18n/languageStore';
import { authService } from '../../../src/services/auth.service';
import { messagesService, MessagingContact } from '../../../src/services/messages.service';

type MessageFilterTab = 'All' | 'Farmers' | 'Buyers' | 'Unread';

export default function SupplierMessagesScreen() {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<MessageFilterTab>('All');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [threads, setThreads] = useState<BuyerMessageItem[]>([]);

  // Contact Picker Modal state (Farmers & Buyers)
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [contacts, setContacts] = useState<MessagingContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const uid = userId || (await authService.getSession())?.user?.id;
      if (!uid) {
        setThreads([]);
        return;
      }
      const data = await messagesService.fetchConversations(uid);
      const mapped: BuyerMessageItem[] = data.map((thread) => ({
        id: thread.id,
        senderId: thread.senderId,
        senderName: thread.senderName,
        partnerRole: thread.partnerRole,
        avatarUrl: thread.avatarUrl || '',
        timestamp: thread.timestamp,
        tag: thread.category,
        status: thread.status,
        snippet: thread.messageSnippet,
        isUnread: thread.isUnread,
        unreadCount: thread.unreadCount,
      }));
      setThreads(mapped);
    } catch (err) {
      console.warn('[SupplierMessages] Failed to load conversations:', err);
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

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = messagesService.subscribeToMessages(userId, () => {
      loadConversations();
    });
    return () => {
      unsubscribe();
    };
  }, [userId, loadConversations]);

  const unreadCount = useMemo(() => {
    return threads.filter((item) => item.isUnread).length;
  }, [threads]);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      if (activeTab === 'Farmers' && thread.partnerRole !== 'farmer') return false;
      if (activeTab === 'Buyers' && thread.partnerRole !== 'buyer') return false;
      if (activeTab === 'Unread' && !thread.isUnread) return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return (
          thread.senderName.toLowerCase().includes(q) ||
          thread.snippet.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [threads, activeTab, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleOpenThread = (thread: BuyerMessageItem) => {
    if (!thread.senderId) return;
    router.push({
      pathname: '/(supplier)/messages/[userId]',
      params: {
        userId: thread.senderId,
        name: thread.senderName,
        category: thread.partnerRole === 'buyer' ? 'Buyer' : thread.partnerRole === 'farmer' ? 'Farmer' : thread.tag,
        role: thread.partnerRole || '',
        avatar: thread.avatarUrl || '',
      },
    } as any);
  };

  const handleOpenContactsPicker = async () => {
    setContactsModalVisible(true);
    setLoadingContacts(true);
    try {
      const uid = userId || (await authService.getSession())?.user?.id;
      if (uid) {
        const list = await messagesService.fetchContactsForMessaging(uid, 'supplier');
        setContacts(list);
      }
    } catch (err) {
      console.warn('[SupplierMessages] Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContact = (contact: MessagingContact) => {
    setContactsModalVisible(false);
    setContactSearch('');
    router.push({
      pathname: '/(supplier)/messages/[userId]',
      params: {
        userId: contact.id,
        name: contact.fullName,
        category: contact.role === 'buyer' ? 'Buyer' : 'Farmer',
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
        c.role.toLowerCase().includes(q) ||
        (c.contextLabel && c.contextLabel.toLowerCase().includes(q))
    );
  }, [contacts, contactSearch]);

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* TOP HEADER CARD */}
      <View style={[styles.topHeaderCard, isDark && styles.topHeaderCardDark]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={isDark ? '#F0F5F1' : '#162C1A'}
              />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
              {t('messagesTitle')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSearchVisible((prev) => !prev)}
              style={[
                styles.iconCircleButton,
                isDark && styles.iconCircleButtonDark,
                isSearchVisible &&
                  (isDark ? styles.iconCircleButtonActiveDark : styles.iconCircleButtonActive),
              ]}
              accessibilityRole="button"
              accessibilityLabel="Search messages"
            >
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={isSearchVisible ? '#FFFFFF' : isDark ? '#E5EFE7' : '#2C402E'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenContactsPicker}
              style={[styles.iconCircleButton, isDark && styles.iconCircleButtonDark]}
              accessibilityRole="button"
              accessibilityLabel="New message"
            >
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={20}
                color={isDark ? '#E5EFE7' : '#2C402E'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {isSearchVisible && (
          <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={isDark ? '#7E9684' : '#8E9F90'}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchMessagesPlaceholder')}
              placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={16}
                  color={isDark ? '#7E9684' : '#8E9F90'}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {(['All', 'Farmers', 'Buyers', 'Unread'] as MessageFilterTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const label =
              tab === 'All'
                ? t('filterAll')
                : tab === 'Unread'
                ? t('tabUnread')
                : tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.filterPill,
                  isActive
                    ? isDark
                      ? styles.filterPillActiveDark
                      : styles.filterPillActive
                    : isDark
                    ? styles.filterPillInactiveDark
                    : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive
                      ? styles.filterPillTextActive
                      : isDark
                      ? styles.filterPillTextInactiveDark
                      : styles.filterPillTextInactive,
                  ]}
                >
                  {label}
                </Text>
                {tab === 'Unread' && unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* THREADS LIST */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4ADE80' : '#1E4D2B'}
          />
        }
      >
        {isLoading && threads.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#1E4D2B'} />
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark, { marginTop: 12 }]}>
              Loading conversations...
            </Text>
          </View>
        ) : filteredThreads.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={46}
              color={isDark ? '#4ADE80' : '#A0ADA2'}
            />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              {activeTab !== 'All' ? t('noMessagesFound') : 'No messages yet'}
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
              {searchQuery.trim()
                ? 'No messages match your search.'
                : 'Connect with farmers and buyers for real-time supply updates and continuous feedback.'}
            </Text>
            {activeTab !== 'All' ? (
              <TouchableOpacity
                style={[styles.composeBtn, isDark && styles.composeBtnDark]}
                onPress={() => {
                  setActiveTab('All');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.composeBtnText}>View All Messages</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.composeBtn, isDark && styles.composeBtnDark]}
                onPress={handleOpenContactsPicker}
              >
                <Text style={styles.composeBtnText}>Message Farmer or Buyer</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredThreads.map((thread) => (
            <BuyerMessageCard
              key={thread.senderId || thread.id}
              message={thread}
              onPress={handleOpenThread}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CONTACT FARMER OR BUYER MODAL */}
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
                Message Farmer or Buyer
              </Text>
              <TouchableOpacity
                onPress={() => setContactsModalVisible(false)}
                style={[styles.iconCircleButton, isDark && styles.iconCircleButtonDark]}
              >
                <Ionicons name="close" size={18} color={isDark ? '#F0F5F1' : '#374151'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color={isDark ? '#7E9684' : '#8E9F90'}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={contactSearch}
                onChangeText={setContactSearch}
                placeholder="Search farmers or buyers..."
                placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
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
                  No contacts found yet.
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
                      <View
                        style={[
                          styles.contactAvatarFallback,
                          isDark && styles.contactAvatarFallbackDark,
                        ]}
                      >
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
  topHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  topHeaderCardDark: {
    backgroundColor: '#18271C',
    borderBottomWidth: 1,
    borderColor: '#253B2A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#162C1A',
  },
  headerTitleDark: {
    color: '#F0F5F1',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleButtonDark: {
    backgroundColor: '#203924',
  },
  iconCircleButtonActive: {
    backgroundColor: '#224528',
  },
  iconCircleButtonActiveDark: {
    backgroundColor: '#2D6036',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E0D5',
  },
  searchBarDark: {
    backgroundColor: '#122015',
    borderColor: '#253B2A',
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#162C1A',
    paddingVertical: 4,
  },
  searchInputDark: {
    color: '#F0F5F1',
  },
  filterPillsRow: {
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
  filterPillActiveDark: {
    backgroundColor: '#2E6930',
  },
  filterPillInactive: {
    backgroundColor: '#F3F4F6',
  },
  filterPillInactiveDark: {
    backgroundColor: '#122015',
    borderWidth: 1,
    borderColor: '#253B2A',
  },
  filterPillText: {
    fontSize: 13,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#4B5563',
    fontWeight: '500',
  },
  filterPillTextInactiveDark: {
    color: '#98B39B',
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E66826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
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
  composeBtn: {
    backgroundColor: '#1E4D2B',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
  },
  composeBtnDark: {
    backgroundColor: '#2E6930',
  },
  composeBtnText: {
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
