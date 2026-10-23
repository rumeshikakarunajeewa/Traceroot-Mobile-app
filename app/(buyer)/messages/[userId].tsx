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

interface ChatMessage {
  id: string;
  sender: 'other' | 'me';
  text: string;
  time: string;
}

export default function BuyerMessageDetailScreen() {
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4EFE6" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#162C1A" />
        </TouchableOpacity>

        <Image source={{ uri: recipientAvatar }} style={styles.avatar} resizeMode="cover" />

        <View style={styles.headerTextGroup}>
          <Text style={styles.headerName} numberOfLines={1}>
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
            <Text style={styles.onlineStatusText}>• Active now</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => {}}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="phone-outline" size={22} color="#162C1A" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateStamp}>
            <Text style={styles.dateStampText}>Today</Text>
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
                    isMe ? styles.bubbleMeBg : styles.bubbleOtherBg,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isMe ? styles.messageTextMe : styles.messageTextOther,
                    ]}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestampText,
                      isMe ? styles.timestampMe : styles.timestampOther,
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor="#8C9E8D"
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputMessage.trim().length > 0 && styles.sendButtonActive,
            ]}
            onPress={handleSend}
            disabled={!inputMessage.trim()}
          >
            <MaterialCommunityIcons
              name="send"
              size={18}
              color={inputMessage.trim().length > 0 ? '#FFFFFF' : '#8C9E8D'}
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
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDEAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#F7F5EE',
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
  dateStampText: {
    fontSize: 11.5,
    color: '#657866',
    fontWeight: '500',
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
  bubbleOtherBg: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E6EAE3',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EAE3',
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
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5EAE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonActive: {
    backgroundColor: '#1D3724',
  },
});