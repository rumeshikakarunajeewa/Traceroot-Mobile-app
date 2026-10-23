import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BuyerMessageThread } from '../../types/buyer.types';

interface BuyerMessageCardProps {
  thread: BuyerMessageThread;
  onPress: (thread: BuyerMessageThread) => void;
}

export const BuyerMessageCard: React.FC<BuyerMessageCardProps> = ({ thread, onPress }) => {
  const isRequest = thread.category === 'Request';

  // Render the category tag (Request or Note)
  const renderCategoryTag = () => {
    return (
      <View
        style={[
          styles.categoryTag,
          isRequest ? styles.categoryTagRequest : styles.categoryTagNote,
        ]}
      >
        <Text style={styles.categoryTagText}>{thread.category}</Text>
      </View>
    );
  };

  // Render the status indicator (✨ New, ✓ Replied, ⏳ Pending)
  const renderStatus = () => {
    switch (thread.status) {
      case 'New':
        return (
          <View style={styles.statusRow}>
            <Text style={styles.statusNewText}>✨ New</Text>
          </View>
        );
      case 'Replied':
        return (
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name="check" size={14} color="#2A7337" style={styles.statusIcon} />
            <Text style={styles.statusRepliedText}>Replied</Text>
          </View>
        );
      case 'Pending':
        return (
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name="timer-sand" size={13} color="#3B82F6" style={styles.statusIcon} />
            <Text style={styles.statusPendingText}>Pending</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(thread)}
      style={styles.cardContainer}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${thread.senderName}`}
    >
      {/* Left Avatar Column with Online Status Dot */}
      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: thread.avatarUrl }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
        {thread.isOnline && <View style={styles.onlineDot} />}
      </View>

      {/* Right Column: Name, Time, Badges, and Preview Snippet */}
      <View style={styles.contentColumn}>
        {/* Top Row: Sender Name and Timestamp */}
        <View style={styles.topRow}>
          <Text style={styles.senderName} numberOfLines={1}>
            {thread.senderName}
          </Text>
          <Text style={styles.timestamp}>{thread.timestamp}</Text>
        </View>

        {/* Badges Row: Category (Request / Note) + Status Indicator */}
        <View style={styles.badgeRow}>
          {renderCategoryTag()}
          {renderStatus()}
        </View>

        {/* Message Snippet Preview */}
        <Text style={styles.messageSnippet} numberOfLines={2}>
          {thread.messageSnippet}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECE6',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1.5,
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
    }),
  },
  avatarWrapper: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5EAE3',
  },
  onlineDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E58B24', // Warm amber / orange status dot matching the Figma design
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentColumn: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#162C1A',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  timestamp: {
    fontSize: 12,
    color: '#8A9A8C',
    fontWeight: '400',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTagRequest: {
    backgroundColor: '#D9822B', // Pumpkin warm orange from design
  },
  categoryTagNote: {
    backgroundColor: '#1E382B', // Deep forest green from design
  },
  categoryTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 3,
  },
  statusNewText: {
    color: '#D9822B',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRepliedText: {
    color: '#2A7337',
    fontSize: 12,
    fontWeight: '600',
  },
  statusPendingText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  messageSnippet: {
    fontSize: 13.5,
    lineHeight: 19.5,
    color: '#4A5B4C',
    fontWeight: '400',
  },
});
