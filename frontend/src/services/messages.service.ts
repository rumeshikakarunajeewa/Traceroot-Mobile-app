// src/services/messages.service.ts
// Supabase Real-Time Messaging Service for TraceRoot Participants

import { supabase } from '../lib/supabase';
import { BuyerMessageThread } from '../types/buyer.types';

export interface ChatMessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

class MessagesService {
  /**
   * Fetch all active conversation threads for a given user.
   */
  async fetchConversations(userId: string): Promise<BuyerMessageThread[]> {
    try {
      if (!userId) return [];

      // Query all messages sent to or received by the user
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          is_read,
          created_at,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[MessagesService] fetchConversations error:', error);
        return [];
      }

      // Group by the other participant
      const threadsMap = new Map<string, BuyerMessageThread>();

      for (const row of data) {
        const isSentByMe = row.sender_id === userId;
        const otherParty = isSentByMe ? (row.receiver as any) : (row.sender as any);
        const partnerId = isSentByMe ? row.receiver_id : row.sender_id;

        if (!partnerId || threadsMap.has(partnerId)) {
          continue;
        }

        const partnerName = otherParty?.full_name || 'TraceRoot User';
        const partnerAvatar = otherParty?.avatar_url || undefined;
        const isUnread = !isSentByMe && !row.is_read;

        threadsMap.set(partnerId, {
          id: row.id,
          senderId: partnerId,
          senderName: partnerName,
          avatarUrl: partnerAvatar,
          category: 'Note',
          status: isUnread ? 'New' : 'Replied',
          timestamp: this.formatMessageTimestamp(row.created_at),
          messageSnippet: row.content || '',
          isOnline: false,
          isUnread,
        });
      }

      return Array.from(threadsMap.values());
    } catch (err) {
      console.warn('[MessagesService] fetchConversations exception:', err);
      return [];
    }
  }

  /**
   * Fetch chat history between two users ordered chronologically.
   */
  async fetchMessagesBetween(userId: string, otherUserId: string): Promise<ChatMessageItem[]> {
    try {
      if (!userId || !otherUserId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, is_read, created_at')
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
        )
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.warn('[MessagesService] fetchMessagesBetween error:', error);
        return [];
      }

      return data.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        isRead: m.is_read ?? false,
        createdAt: m.created_at,
      }));
    } catch (err) {
      console.warn('[MessagesService] fetchMessagesBetween exception:', err);
      return [];
    }
  }

  /**
   * Send a new message.
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!senderId || !receiverId || !content.trim()) {
        return { success: false, error: 'Sender, receiver, and message content are required.' };
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send message.' };
    }
  }

  /**
   * Subscribe to real-time incoming messages for a user.
   */
  subscribeToMessages(userId: string, onMessageReceived: (message: any) => void) {
    if (!userId) return () => {};

    const channel = supabase
      .channel(`user-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          onMessageReceived(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private formatMessageTimestamp(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) {
        const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
        return `${mins}m ago`;
      }
      if (diffHours < 24) {
        return `${Math.round(diffHours)}h ago`;
      }
      if (diffHours < 48) {
        return 'Yesterday';
      }
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  }
}

export const messagesService = new MessagesService();
