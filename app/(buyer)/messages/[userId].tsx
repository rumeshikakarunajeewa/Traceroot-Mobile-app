import React, { useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDarkMode } from '../../../src/store/uiStore';

interface ChatMessage {
  id: string;
  sender: 'other' | 'me';
  text: string;
  time: string;
}

export default function BuyerMessageDetailScreen() {
  const [isDark] = useDarkMode();
  const params = useLocalSearchParams<{
    userId?: string;
    name?: string;
    category?: string;
    avatar?: string;
  }>();

  const recipientName = params.name || 'Saman Perera';
  const recipientAvatar =
    params.avatar ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
  const isRequest = params.category === 'Request';

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'other',
      text:
        params.name === 'Dr. Silva (Agronomist)'
          ? 'Soil moisture levels look great based on your recent records. Keep up the current irrigation schedule for optimal yields.'
          : params.name === 'FreshMart Ltd'
          ? 'We would like to increase our order quantity for next week to 500kg. Please let me know if your current batch capacity supports this.'
          : params.name === 'Green Valley Co-op'
          ? 'Reminder: The organic farming certification renewal deadline is approaching next month.'
          : 'Can you confirm the exact harvest date for the upcoming tomato batch? Need to arrange cold storage transport.',
      time: '10:15 AM',
    },
    {
      id: 'm2',
      sender: 'me',
      text: 'Thanks for reaching out! We are finalizing the quality metrics and schedule today.',
      time: '10:20 AM',
    },
  ]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: inputMessage.trim(),
      time: 'Just now',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'bottom']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0E1710' : '#F4EFE6'}
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

        <Image source={{ uri: recipientAvatar }} style={styles.avatar} resizeMode="cover" />

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
              <Text style={styles.categoryTagText}>{params.category || 'Request'}</Text>
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
          style={[styles.messagesList, isDark && styles.messagesListDark]}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.dateStamp, isDark && styles.dateStampDark]}>
            <Text
              style={[styles.dateStampText, isDark && styles.dateStampTextDark]}
            >
              Today
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
});