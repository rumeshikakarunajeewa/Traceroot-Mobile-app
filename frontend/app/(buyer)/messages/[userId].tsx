import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDarkMode } from '../../../src/store/uiStore';
import { useAuth } from '../../../src/store/authStore';
import { messagesService } from '../../../src/services/messages.service';
import { StatusBar } from 'expo-status-bar';

interface ChatMessage {
  id: string;
  sender: 'other' | 'me';
  text: string;
  time: string;
}

export default function BuyerMessageDetailScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    userId?: string;
    name?: string;
    category?: string;
    role?: string;
    avatar?: string;
  }>();

  const [fetchedPartner, setFetchedPartner] = useState<{
    id: string;
    name: string;
    avatar: string;
    role?: string;
  } | null>(null);
  const partnerRole =
    params.role ||
    (fetchedPartner && fetchedPartner.id === params.userId ? fetchedPartner.role : '');
  const recipientName =
    params.name ||
    (fetchedPartner && fetchedPartner.id === params.userId ? fetchedPartner.name : '') ||
    (partnerRole === 'supplier' ? 'TraceRoot Supplier' : 'TraceRoot Farmer');
  const recipientAvatar =
    params.avatar ||
    (fetchedPartner && fetchedPartner.id === params.userId ? fetchedPartner.avatar : '') ||
    '';
  const isRequest = (params.category || 'Request') === 'Request';

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<any>(null);

  const userId = user?.id;
  const otherUserId = params.userId;
  const showLoading = isLoading && Boolean(userId && otherUserId);

  useEffect(() => {
    if (!otherUserId || (params.name && params.avatar && params.role)) return;
    let active = true;
    messagesService.fetchPartnerProfile(otherUserId).then((partner) => {
      if (active && partner) {
        setFetchedPartner({
          id: partner.id,
          name: partner.fullName,
          avatar: partner.avatarUrl || '',
          role: partner.role,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [otherUserId, params.name, params.avatar, params.role]);

  // Load chat history from Supabase and mark incoming messages read
  const loadHistory = useCallback(async () => {
    if (!userId || !otherUserId) {
      setIsLoading(false);
      return;
    }
    try {
      const items = await messagesService.fetchMessagesBetween(userId, otherUserId);
      const mapped: ChatMessage[] = items.map((m) => {
        const isMe = m.senderId === userId;
        const d = new Date(m.createdAt);
        const time = !isNaN(d.getTime())
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now';
        return {
          id: m.id,
          sender: isMe ? 'me' : 'other',
          text: m.content,
          time,
        };
      });
      setMessages(mapped);
      await messagesService.markConversationAsRead(userId, otherUserId);
    } catch (err) {
      console.warn('[BuyerMessageDetail] Error loading chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, otherUserId]);

  useEffect(() => {
    let isMounted = true;
    if (!userId || !otherUserId) {
      return;
    }

    messagesService
      .fetchMessagesBetween(userId, otherUserId)
      .then((items) => {
        if (!isMounted) return;
        const mapped: ChatMessage[] = items.map((m) => {
          const isMe = m.senderId === userId;
          const d = new Date(m.createdAt);
          const time = !isNaN(d.getTime())
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now';
          return {
            id: m.id,
            sender: isMe ? 'me' : 'other',
            text: m.content,
            time,
          };
        });
        setMessages(mapped);
        setIsLoading(false);
        messagesService.markConversationAsRead(userId, otherUserId);
      })
      .catch((err) => {
        console.warn('[BuyerMessageDetail] Error loading chat:', err);
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = messagesService.subscribeToMessages(userId, (newMsg: any) => {
      if (newMsg.sender_id === otherUserId || newMsg.receiver_id === otherUserId) {
        loadHistory();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId, otherUserId, loadHistory]);

  useEffect(() => {
    // Scroll to end when messages load
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || !user?.id || !params.userId || isSending) return;

    setInputMessage('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender: 'me',
      text: trimmed,
      time: 'Just now',
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const res = await messagesService.sendMessage(user.id, params.userId, trimmed);
    setIsSending(false);

    if (!res.success) {
      console.warn('[BuyerMessageDetail] Failed to send message:', res.error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else {
      loadHistory();
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'bottom']}
    >
      <StatusBar
        style={isDark ? 'light' : 'dark'}

      />

      {/* Header Bar */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={isDark ? '#F0F5F1' : '#162C1A'}
          />
        </TouchableOpacity>

        {recipientAvatar ? (
          <Image source={{ uri: recipientAvatar }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={[styles.avatarFallback, isDark && styles.avatarFallbackDark]}>
            <Text style={styles.avatarFallbackText}>
              {recipientName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.headerTextGroup}>
          <Text
            style={[styles.headerName, isDark && styles.headerNameDark]}
            numberOfLines={1}
          >
            {recipientName}
          </Text>
          <View style={styles.statusBadgeRow}>
            <View
              style={[
                styles.categoryTag,
                isRequest ? styles.categoryTagRequest : styles.categoryTagNote,
              ]}
            >
              <Text style={styles.categoryTagText}>
                {partnerRole === 'supplier' ? 'Supplier' : params.category || 'Request'}
              </Text>
            </View>
            <Text
              style={[
                styles.onlineStatusText,
                isDark && styles.onlineStatusTextDark,
              ]}
            >
              • Active now
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.headerActionBtn, isDark && styles.headerActionBtnDark]}
          onPress={() => {}}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="phone-outline"
            size={22}
            color={isDark ? '#4ADE80' : '#162C1A'}
          />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesList, isDark && styles.messagesListDark]}
          contentContainerStyle={[
            styles.messagesContent,
            (showLoading || messages.length === 0) && { flex: 1, justifyContent: 'center', alignItems: 'center' },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {showLoading ? (
            <ActivityIndicator size="large" color={isDark ? '#4ADE80' : '#1D3724'} />
          ) : messages.length === 0 ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={40}
                color={isDark ? '#7E9B82' : '#8C9E8D'}
              />
              <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#F0F5F1' : '#162C1A', marginTop: 12 }}>
                Start a conversation
              </Text>
              <Text style={{ fontSize: 13, color: isDark ? '#7E9B82' : '#758876', textAlign: 'center', marginTop: 4 }}>
                Send your message to {recipientName}.
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.dateStamp, isDark && styles.dateStampDark]}>
                <Text
                  style={[styles.dateStampText, isDark && styles.dateStampTextDark]}
                >
                  Messages
                </Text>
              </View>

              {messages.map((item) => {
                const isMe = item.sender === 'me';
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.messageBubbleContainer,
                      isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isMe
                          ? [styles.bubbleMeBg, isDark && styles.bubbleMeBgDark]
                          : [styles.bubbleOtherBg, isDark && styles.bubbleOtherBgDark],
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isMe
                            ? styles.messageTextMe
                            : [
                                styles.messageTextOther,
                                isDark && styles.messageTextOtherDark,
                              ],
                        ]}
                      >
                        {item.text}
                      </Text>
                      <Text
                        style={[
                          styles.timestampText,
                          isMe
                            ? styles.timestampMe
                            : [
                                styles.timestampOther,
                                isDark && styles.timestampOtherDark,
                              ],
                        ]}
                      >
                        {item.time}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Quick Feedback Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.quickChipsBar, isDark && styles.quickChipsBarDark]}
          contentContainerStyle={styles.quickChipsContent}
        >
          {['Any harvest update?', 'Confirming delivery', 'Great produce quality!'].map((chip) => (
            <TouchableOpacity
              key={chip}
              activeOpacity={0.8}
              onPress={() => setInputMessage(chip)}
              style={[styles.quickChip, isDark && styles.quickChipDark]}
            >
              <Text style={[styles.quickChipText, isDark && styles.quickChipTextDark]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          <TextInput
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder="Type your message..."
            placeholderTextColor={isDark ? '#768B78' : '#8C9E8D'}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              isDark && styles.sendButtonDark,
              inputMessage.trim().length > 0 && styles.sendButtonActive,
              inputMessage.trim().length > 0 && isDark && styles.sendButtonActiveDark,
            ]}
            onPress={handleSend}
            disabled={!inputMessage.trim()}
          >
            <MaterialCommunityIcons
              name="send"
              size={18}
              color={inputMessage.trim().length > 0 ? '#FFFFFF' : isDark ? '#4B634E' : '#8C9E8D'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4EFE6',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EAE2',
    backgroundColor: '#F4EFE6',
  },
  headerDark: {
    backgroundColor: '#0E1710',
    borderBottomColor: '#263B2B',
  },
  backButton: {
    paddingRight: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5EAE3',
    marginRight: 12,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2E6930',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarFallbackDark: {
    backgroundColor: '#203924',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#162C1A',
  },
  headerNameDark: {
    color: '#F0F5F1',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  categoryTagRequest: {
    backgroundColor: '#D9822B',
  },
  categoryTagNote: {
    backgroundColor: '#1E382B',
  },
  categoryTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  onlineStatusText: {
    fontSize: 11,
    color: '#4B7A50',
    fontWeight: '500',
  },
  onlineStatusTextDark: {
    color: '#4ADE80',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDEAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtnDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
    borderWidth: 1,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#F7F5EE',
  },
  messagesListDark: {
    backgroundColor: '#0E1710',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateStamp: {
    alignSelf: 'center',
    backgroundColor: '#E7ECE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateStampDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
    borderWidth: 0.5,
  },
  dateStampText: {
    fontSize: 11.5,
    color: '#657866',
    fontWeight: '500',
  },
  dateStampTextDark: {
    color: '#98B39B',
  },
  messageBubbleContainer: {
    marginBottom: 14,
    maxWidth: '82%',
  },
  messageBubbleMe: {
    alignSelf: 'flex-end',
  },
  messageBubbleOther: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMeBg: {
    backgroundColor: '#1D3724',
    borderBottomRightRadius: 4,
  },
  bubbleMeBgDark: {
    backgroundColor: '#204727',
  },
  bubbleOtherBg: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E6EAE3',
  },
  bubbleOtherBgDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: '#162C1A',
  },
  messageTextOtherDark: {
    color: '#F0F5F1',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampMe: {
    color: '#9EBAA2',
  },
  timestampOther: {
    color: '#8A9A8C',
  },
  timestampOtherDark: {
    color: '#98B39B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EAE3',
  },
  inputContainerDark: {
    backgroundColor: '#142217',
    borderTopColor: '#263B2B',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F6F2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#162C1A',
    maxHeight: 90,
  },
  textInputDark: {
    backgroundColor: '#1B2E1F',
    color: '#F0F5F1',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5EAE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDark: {
    backgroundColor: '#243B28',
  },
  sendButtonActive: {
    backgroundColor: '#1D3724',
  },
  sendButtonActiveDark: {
    backgroundColor: '#2EB854',
  },
  quickChipsBar: {
    flexGrow: 0,
    backgroundColor: '#F7F5EE',
    borderTopWidth: 1,
    borderTopColor: '#ECE9E2',
  },
  quickChipsBarDark: {
    backgroundColor: '#0E1710',
    borderTopColor: '#1E3323',
  },
  quickChipsContent: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#EAF3E9',
    borderWidth: 1,
    borderColor: '#D4E6D3',
  },
  quickChipDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E4D2B',
  },
  quickChipTextDark: {
    color: '#98B39B',
  },
});