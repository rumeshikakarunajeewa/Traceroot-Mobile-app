import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useSupplierMessages,
} from '../../../src/store/supplierMessagesStore';
import { useDarkMode } from '../../../src/store/uiStore';
import { SupplierMessageThread } from '../../../src/types/supplier.types';

type MessageFilterTab = 'All' | 'Requests' | 'Notes' | 'Unread';

export default function SupplierMessagesScreen() {
  const [isDark] = useDarkMode();
  const [threads, markAsRead, sendMessage] = useSupplierMessages();

  // Active Filter Tab & Search State
  const [activeTab, setActiveTab] = useState<MessageFilterTab>('All');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected thread for conversation modal
  const [activeThread, setActiveThread] = useState<SupplierMessageThread | null>(
    null
  );
  const [replyText, setReplyText] = useState('');

  // Count unread threads
  const unreadCount = threads.filter((t) => t.isUnread).length;

  // Filtered threads list
  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      // Filter by tab
      if (activeTab === 'Requests' && thread.type !== 'Request') return false;
      if (activeTab === 'Notes' && thread.type !== 'Note') return false;
      if (activeTab === 'Unread' && !thread.isUnread) return false;

      // Filter by search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = thread.senderName.toLowerCase().includes(q);
        const matchesSnippet = thread.lastMessage.toLowerCase().includes(q);
        return matchesName || matchesSnippet;
      }

      return true;
    });
  }, [threads, activeTab, searchQuery]);

  const handleOpenThread = (thread: SupplierMessageThread) => {
    markAsRead(thread.id);
    setActiveThread(thread);
  };

  const handleSendReply = () => {
    if (!activeThread || !replyText.trim()) return;
    sendMessage(activeThread.id, replyText.trim());
    setReplyText('');

    // Update activeThread messages in modal
    setActiveThread((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lastMessage: replyText.trim(),
        timestamp: 'Just now',
        statusTag: 'Replied',
        messages: [
          ...prev.messages,
          {
            id: `msg-${Date.now()}`,
            sender: 'user',
            text: replyText.trim(),
            timestamp: 'Just now',
          },
        ],
      };
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* TOP HEADER CONTAINER (White/Cream Rounded Card matching Figma) */}
      <View style={[styles.topHeaderCard, isDark && styles.topHeaderCardDark]}>
        {/* Header Bar Row */}
        <View style={styles.headerRow}>
          {/* Left: Back Arrow + Screen Title */}
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
              Messages
            </Text>
          </View>

          {/* Right Action Buttons */}
          <View style={styles.headerRight}>
            {/* Search Toggle Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSearchVisible((prev) => !prev)}
              style={[
                styles.iconCircleButton,
                isDark && styles.iconCircleButtonDark,
                isSearchVisible &&
                  (isDark
                    ? styles.iconCircleButtonActiveDark
                    : styles.iconCircleButtonActive),
              ]}
              accessibilityRole="button"
              accessibilityLabel="Search messages"
            >
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={
                  isSearchVisible
                    ? '#FFFFFF'
                    : isDark
                    ? '#E5EFE7'
                    : '#2C402E'
                }
              />
            </TouchableOpacity>

            {/* Grid / Menu Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                // Toggles between All and Unread filter quickly
                setActiveTab((prev) => (prev === 'All' ? 'Unread' : 'All'));
              }}
              style={[
                styles.iconCircleButton,
                isDark && styles.iconCircleButtonDark,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Toggle view"
            >
              <MaterialCommunityIcons
                name="dots-grid"
                size={20}
                color={isDark ? '#E5EFE7' : '#2C402E'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Expandable Search Input Bar */}
        {isSearchVisible && (
          <View
            style={[styles.searchBar, isDark && styles.searchBarDark]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={isDark ? '#7E9684' : '#8E9F90'}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by sender or message..."
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

        {/* Filter Pills / Chips Row */}
        <View style={styles.filterPillsRow}>
          {/* Tab: All */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('All')}
            style={[
              styles.filterPill,
              activeTab === 'All'
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
                activeTab === 'All'
                  ? styles.filterPillTextActive
                  : isDark
                  ? styles.filterPillTextInactiveDark
                  : styles.filterPillTextInactive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Tab: Requests */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('Requests')}
            style={[
              styles.filterPill,
              activeTab === 'Requests'
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
                activeTab === 'Requests'
                  ? styles.filterPillTextActive
                  : isDark
                  ? styles.filterPillTextInactiveDark
                  : styles.filterPillTextInactive,
              ]}
            >
              Requests
            </Text>
          </TouchableOpacity>

          {/* Tab: Notes */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('Notes')}
            style={[
              styles.filterPill,
              activeTab === 'Notes'
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
                activeTab === 'Notes'
                  ? styles.filterPillTextActive
                  : isDark
                  ? styles.filterPillTextInactiveDark
                  : styles.filterPillTextInactive,
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>

          {/* Tab: Unread */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('Unread')}
            style={[
              styles.filterPill,
              activeTab === 'Unread'
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
                activeTab === 'Unread'
                  ? styles.filterPillTextActive
                  : isDark
                  ? styles.filterPillTextInactiveDark
                  : styles.filterPillTextInactive,
              ]}
            >
              Unread
            </Text>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.unreadBadgePill,
                  activeTab === 'Unread' && styles.unreadBadgePillActive,
                ]}
              >
                <Text style={styles.unreadBadgeNumber}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* CONVERSATION CARDS LIST */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredThreads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={48}
              color={isDark ? '#4A624E' : '#A4B5A5'}
            />
            <Text
              style={[
                styles.emptyTitle,
                isDark && styles.emptyTitleDark,
              ]}
            >
              No messages found
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                isDark && styles.emptySubtitleDark,
              ]}
            >
              {searchQuery
                ? 'Try modifying your search term'
                : `No ${activeTab.toLowerCase()} messages in your inbox.`}
            </Text>
          </View>
        ) : (
          filteredThreads.map((thread) => {
            const isRequest = thread.type === 'Request';
            const isUnread = thread.isUnread;

            return (
              <TouchableOpacity
                key={thread.id}
                activeOpacity={0.88}
                onPress={() => handleOpenThread(thread)}
                style={[
                  styles.threadCard,
                  isDark && styles.threadCardDark,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open message with ${thread.senderName}`}
              >
                {/* Left: Avatar with Unread Badge */}
                <View style={styles.avatarContainer}>
                  <Image
                    source={thread.avatarUrl}
                    style={styles.avatarImage}
                  />
                  {isUnread && (
                    <View
                      style={[
                        styles.unreadDot,
                        isDark && styles.unreadDotDark,
                      ]}
                    />
                  )}
                </View>

                {/* Right: Message Details */}
                <View style={styles.threadContent}>
                  {/* Top Header Row: Sender Name & Timestamp */}
                  <View style={styles.threadHeaderRow}>
                    <Text
                      style={[
                        styles.senderNameText,
                        isDark && styles.senderNameTextDark,
                      ]}
                      numberOfLines={1}
                    >
                      {thread.senderName}
                    </Text>

                    <Text
                      style={[
                        styles.timestampText,
                        isUnread && styles.timestampTextUnread,
                        isDark && styles.timestampTextDark,
                      ]}
                    >
                      {thread.timestamp}
                    </Text>
                  </View>

                  {/* Sub-Row: Type Pill Badge & Status Indicator */}
                  <View style={styles.tagsSubRow}>
                    {/* Type Badge: Request (amber) vs Note (green) */}
                    <View
                      style={[
                        styles.typeBadge,
                        isRequest
                          ? styles.typeBadgeRequest
                          : styles.typeBadgeNote,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {thread.type}
                      </Text>
                    </View>

                    {/* Status Tag */}
                    {thread.statusTag === 'New' && (
                      <View style={styles.statusTagRow}>
                        <MaterialCommunityIcons
                          name="creation"
                          size={13}
                          color="#E59325"
                          style={{ marginRight: 3 }}
                        />
                        <Text style={styles.statusNewText}>New</Text>
                      </View>
                    )}

                    {thread.statusTag === 'Replied' && (
                      <View style={styles.statusTagRow}>
                        <MaterialCommunityIcons
                          name="check"
                          size={14}
                          color="#348B52"
                          style={{ marginRight: 2 }}
                        />
                        <Text style={styles.statusRepliedText}>Replied</Text>
                      </View>
                    )}

                    {thread.statusTag === 'Pending' && (
                      <View style={styles.statusTagRow}>
                        <MaterialCommunityIcons
                          name="timer-sand"
                          size={13}
                          color="#3B82F6"
                          style={{ marginRight: 3 }}
                        />
                        <Text style={styles.statusPendingText}>Pending</Text>
                      </View>
                    )}
                  </View>

                  {/* Message Snippet */}
                  <Text
                    style={[
                      styles.messageSnippetText,
                      isDark && styles.messageSnippetTextDark,
                    ]}
                    numberOfLines={2}
                  >
                    {thread.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* QUICK CHAT CONVERSATION MODAL */}
      <Modal
        visible={!!activeThread}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveThread(null)}
      >
        <SafeAreaView
          style={[
            styles.modalSafeArea,
            isDark && styles.modalSafeAreaDark,
          ]}
        >
          {activeThread && (
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              {/* Modal Header */}
              <View
                style={[
                  styles.modalHeader,
                  isDark && styles.modalHeaderDark,
                ]}
              >
                <View style={styles.modalHeaderLeft}>
                  <Image
                    source={activeThread.avatarUrl}
                    style={styles.modalAvatar}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.modalName,
                        isDark && styles.modalNameDark,
                      ]}
                    >
                      {activeThread.senderName}
                    </Text>
                    <Text
                      style={[
                        styles.modalStatus,
                        isDark && styles.modalStatusDark,
                      ]}
                    >
                      {activeThread.type} • {activeThread.statusTag}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveThread(null)}
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color={isDark ? '#F0F5F1' : '#162C1A'}
                  />
                </TouchableOpacity>
              </View>

              {/* Chat Messages */}
              <ScrollView
                style={styles.chatScroll}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
              >
                {activeThread.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.bubbleRow,
                        isUser ? styles.bubbleRowUser : styles.bubbleRowOther,
                      ]}
                    >
                      <View
                        style={[
                          styles.chatBubble,
                          isUser
                            ? styles.chatBubbleUser
                            : isDark
                            ? styles.chatBubbleOtherDark
                            : styles.chatBubbleOther,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chatBubbleText,
                            isUser
                              ? styles.chatBubbleTextUser
                              : isDark
                              ? styles.chatBubbleTextOtherDark
                              : styles.chatBubbleTextOther,
                          ]}
                        >
                          {msg.text}
                        </Text>
                        <Text
                          style={[
                            styles.chatTimestampText,
                            isUser
                              ? styles.chatTimestampTextUser
                              : isDark
                              ? styles.chatTimestampTextOtherDark
                              : styles.chatTimestampTextOther,
                          ]}
                        >
                          {msg.timestamp}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Bottom Reply Bar */}
              <View
                style={[
                  styles.replyBarContainer,
                  isDark && styles.replyBarContainerDark,
                ]}
              >
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Type a message..."
                  placeholderTextColor={isDark ? '#6E8572' : '#9E9A8E'}
                  style={[
                    styles.replyInput,
                    isDark && styles.replyInputDark,
                  ]}
                  multiline
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSendReply}
                  style={[
                    styles.sendButton,
                    !replyText.trim() && styles.sendButtonDisabled,
                  ]}
                  disabled={!replyText.trim()}
                >
                  <MaterialCommunityIcons
                    name="send"
                    size={18}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB', // Warm natural linen cream matching Figma
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },

  /* TOP HEADER CARD */
  topHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
  },
  topHeaderCardDark: {
    backgroundColor: '#142417',
    borderBottomColor: '#233827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 6,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#162C1A',
    marginLeft: 8,
    letterSpacing: -0.3,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2EFE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleButtonDark: {
    backgroundColor: '#203625',
  },
  iconCircleButtonActive: {
    backgroundColor: '#1C3723',
  },
  iconCircleButtonActiveDark: {
    backgroundColor: '#2F5739',
  },

  /* SEARCH BAR */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DFD8CC',
  },
  searchBarDark: {
    backgroundColor: '#1A2C1F',
    borderColor: '#29432F',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#162C1A',
    padding: 0,
  },
  searchInputDark: {
    color: '#F0F5F1',
  },

  /* FILTER PILLS ROW */
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#1C3723', // Dark forest green matching Figma
    shadowColor: '#1C3723',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillActiveDark: {
    backgroundColor: '#264B30',
  },
  filterPillInactive: {
    backgroundColor: '#F5F2EA',
  },
  filterPillInactiveDark: {
    backgroundColor: '#1D2E21',
  },
  filterPillText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#6A7B6E',
  },
  filterPillTextInactiveDark: {
    color: '#A2B9A5',
  },
  unreadBadgePill: {
    backgroundColor: '#E6821E', // Vibrant orange unread badge
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  unreadBadgePillActive: {
    backgroundColor: '#FFFFFF',
  },
  unreadBadgeNumber: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  /* CONVERSATION LIST */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120, // Clearance for bottom tab bar
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#162C1A',
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

  /* THREAD CARD */
  threadCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  threadCardDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  avatarContainer: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAE5D9',
  },
  unreadDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E6821E', // Orange notification dot
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadDotDark: {
    borderColor: '#16271A',
  },
  threadContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  threadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  senderNameText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#162C1A',
    flex: 1,
    marginRight: 8,
  },
  senderNameTextDark: {
    color: '#F0F5F1',
  },
  timestampText: {
    fontSize: 12,
    color: '#718573',
    fontWeight: '500',
  },
  timestampTextUnread: {
    color: '#3C6E4A',
    fontWeight: '600',
  },
  timestampTextDark: {
    color: '#8EA491',
  },

  /* TAGS SUB ROW */
  tagsSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 6,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 8,
  },
  typeBadgeRequest: {
    backgroundColor: '#E59325', // Warm amber from Figma
  },
  typeBadgeNote: {
    backgroundColor: '#224D30', // Deep forest green from Figma
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusNewText: {
    color: '#D9822B',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRepliedText: {
    color: '#348B52',
    fontSize: 12,
    fontWeight: '600',
  },
  statusPendingText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },

  /* MESSAGE SNIPPET */
  messageSnippetText: {
    fontSize: 13.5,
    color: '#6A7D6C',
    lineHeight: 18.5,
  },
  messageSnippetTextDark: {
    color: '#9EAF9F',
  },

  /* CHAT MODAL */
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  modalSafeAreaDark: {
    backgroundColor: '#0E1710',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DC',
  },
  modalHeaderDark: {
    backgroundColor: '#16271A',
    borderBottomColor: '#263D2B',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAE5D9',
  },
  modalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#162C1A',
  },
  modalNameDark: {
    color: '#F0F5F1',
  },
  modalStatus: {
    fontSize: 11.5,
    color: '#718573',
  },
  modalStatusDark: {
    color: '#8EA491',
  },
  modalCloseButton: {
    padding: 4,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    width: '100%',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  chatBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  chatBubbleUser: {
    backgroundColor: '#1C3723',
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#ECE6DC',
  },
  chatBubbleOtherDark: {
    backgroundColor: '#16271A',
    borderColor: '#263D2B',
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatBubbleTextUser: {
    color: '#FFFFFF',
  },
  chatBubbleTextOther: {
    color: '#162C1A',
  },
  chatBubbleTextOtherDark: {
    color: '#F0F5F1',
  },
  chatTimestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatTimestampTextUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chatTimestampTextOther: {
    color: '#8E9F90',
  },
  chatTimestampTextOtherDark: {
    color: '#718573',
  },
  replyBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE6DC',
  },
  replyBarContainerDark: {
    backgroundColor: '#16271A',
    borderTopColor: '#263D2B',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F5F2EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#162C1A',
    maxHeight: 100,
  },
  replyInputDark: {
    backgroundColor: '#101F14',
    color: '#F0F5F1',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C3723',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#A8BAAC',
  },
});
