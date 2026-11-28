import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { BuyerMessageItem } from '../../types/buyer.types';
import { useDarkMode } from '../../store/uiStore';

interface BuyerMessageCardProps {
  message: BuyerMessageItem;
  onPress: (message: BuyerMessageItem) => void;
}

export const BuyerMessageCard: React.FC<BuyerMessageCardProps> = ({
  message,
  onPress,
}) => {
  const [isDark] = useDarkMode();
  const isRequest = message.tag === 'Request';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(message)}
      style={[styles.card, isDark && styles.cardDark]}
    >
      {/* Left: Avatar with Unread Dot Indicator */}
      <View style={styles.avatarWrapper}>
        {message.avatarUrl && message.avatarUrl.trim() !== '' ? (
          <Image
            source={{ uri: message.avatarUrl }}
            style={[styles.avatarImage, isDark && styles.avatarImageDark]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatarFallback, isDark && styles.avatarFallbackDark]}>
            <Text style={styles.avatarFallbackText}>
              {(message.senderName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {message.isUnread && <View style={[styles.unreadDot, isDark && styles.unreadDotDark]} />}
      </View>

      {/* Right: Message Details */}
      <View style={styles.contentContainer}>
        {/* Row 1: Sender Name & Timestamp */}
        <View style={styles.topRow}>
          <Text style={[styles.senderName, isDark && styles.senderNameDark]} numberOfLines={1}>
            {message.senderName}
          </Text>
          <Text style={[styles.timestampText, isDark && styles.timestampTextDark]}>
            {message.timestamp}
          </Text>
        </View>

        {/* Row 2: Tag & Status Pill Badges */}
        <View style={styles.tagsRow}>
          {/* Tag Pill (Request vs Note) */}
          <View
            style={[
              styles.tagPill,
              isRequest ? styles.requestTag : [styles.noteTag, isDark && styles.noteTagDark],
            ]}
          >
            <Text style={styles.tagText}>{message.tag}</Text>
          </View>

          {/* Status Indicator (✨ New, ✓ Replied, ⏳ Pending) */}
          <View style={styles.statusWrapper}>
            {message.status === 'New' && (
              <Text style={styles.newStatusText}>✨ New</Text>
            )}
            {message.status === 'Replied' && (
              <Text style={[styles.repliedStatusText, isDark && styles.repliedStatusTextDark]}>
                ✓ Replied
              </Text>
            )}
            {message.status === 'Pending' && (
              <Text style={[styles.pendingStatusText, isDark && styles.pendingStatusTextDark]}>
                ⏳ Pending
              </Text>
            )}
          </View>
        </View>

        {/* Row 3: Message Snippet */}
        <Text style={[styles.snippetText, isDark && styles.snippetTextDark]} numberOfLines={2}>
          {message.snippet}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ECE9E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'relative',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E6930',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackDark: {
    backgroundColor: '#203924',
    borderWidth: 1,
    borderColor: '#35543A',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  senderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  timestampText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  requestTag: {
    backgroundColor: '#D97706', // Warm amber / orange
  },
  noteTag: {
    backgroundColor: '#1E4D2B', // Deep forest green
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  repliedStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  pendingStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  snippetText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },

  /* Dark Mode Overrides */
  cardDark: {
    backgroundColor: '#18271C',
    borderColor: '#263B2B',
  },
  avatarImageDark: {
    backgroundColor: '#203924',
  },
  unreadDotDark: {
    borderColor: '#18271C',
  },
  senderNameDark: {
    color: '#F0F5F1',
  },
  timestampTextDark: {
    color: '#98B39B',
  },
  noteTagDark: {
    backgroundColor: '#2E6930',
  },
  repliedStatusTextDark: {
    color: '#4ADE80',
  },
  pendingStatusTextDark: {
    color: '#93C5FD',
  },
  snippetTextDark: {
    color: '#98B39B',
  },
});
