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

export interface MessagingContact {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  contextLabel?: string;
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

      // Group by the other participant and count unread incoming messages
      const threadsMap = new Map<string, BuyerMessageThread>();

      for (const row of data) {
        const isSentByMe = row.sender_id === userId;
        const otherParty = isSentByMe ? (row.receiver as any) : (row.sender as any);
        const partnerId = isSentByMe ? row.receiver_id : row.sender_id;

        if (!partnerId) continue;

        const rowIsUnread = !isSentByMe && !row.is_read;
        const existing = threadsMap.get(partnerId);

        if (existing) {
          if (rowIsUnread) {
            existing.isUnread = true;
            existing.unreadCount = (existing.unreadCount || 0) + 1;
            existing.status = 'New';
          }
          continue;
        }

        const partnerName = otherParty?.full_name || 'TraceRoot User';
        const partnerAvatar = otherParty?.avatar_url || '';
        const partnerRole = otherParty?.role || undefined;

        threadsMap.set(partnerId, {
          id: row.id,
          senderId: partnerId,
          senderName: partnerName,
          partnerRole,
          avatarUrl: partnerAvatar,
          category: partnerRole === 'buyer' || partnerRole === 'farmer' ? 'Request' : 'Note',
          status: rowIsUnread ? 'New' : isSentByMe ? 'Pending' : 'Replied',
          timestamp: this.formatMessageTimestamp(row.created_at),
          messageSnippet: row.content || '',
          isOnline: false,
          isUnread: rowIsUnread,
          unreadCount: rowIsUnread ? 1 : 0,
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
   * Mark all incoming messages from a specific partner as read.
   */
  async markConversationAsRead(userId: string, partnerId: string): Promise<void> {
    try {
      if (!userId || !partnerId) return;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('sender_id', partnerId)
        .eq('is_read', false);

      if (error) {
        console.warn('[MessagesService] markConversationAsRead error:', error.message);
      }
    } catch (err) {
      console.warn('[MessagesService] markConversationAsRead exception:', err);
    }
  }

  /**
   * Count total unread incoming messages for tab bar / dashboard badges.
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) {
        console.warn('[MessagesService] getUnreadCount error:', error.message);
        return 0;
      }

      return count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Fetch a single partner's public profile info when entering chat directly by userId.
   */
  async fetchPartnerProfile(partnerId: string): Promise<MessagingContact | null> {
    try {
      if (!partnerId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('id', partnerId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        fullName: data.full_name || 'TraceRoot User',
        avatarUrl: data.avatar_url || undefined,
        role: data.role || 'farmer',
      };
    } catch {
      return null;
    }
  }

  private getRoleDisplayLabel(role: string): string {
    if (role === 'farmer') return 'Farmer · Verified Producer';
    if (role === 'supplier') return 'Supplier · Inputs & Tools';
    if (role === 'buyer') return 'Buyer · Wholesale';
    return 'TraceRoot User';
  }

  /**
   * Fetch contacts relevant for starting a new conversation across Farmer, Buyer, and Supplier roles.
   */
  async fetchContactsForMessaging(
    userId: string,
    myRole: 'buyer' | 'farmer' | 'supplier'
  ): Promise<MessagingContact[]> {
    try {
      if (!userId) return [];
      const contactsMap = new Map<string, MessagingContact>();

      // 1. Prioritize active order partners (produce orders + agricultural supply orders)
      if (myRole === 'buyer' || myRole === 'farmer') {
        const orderColumn = myRole === 'buyer' ? 'buyer_id' : 'farmer_id';
        const partnerColumn = myRole === 'buyer' ? 'farmer_id' : 'buyer_id';
        const fallbackPartnerRole = myRole === 'buyer' ? 'farmer' : 'buyer';

        const { data: orderRows } = await supabase
          .from('orders')
          .select(`
            ${partnerColumn},
            linked_crop_batch,
            partner:profiles!orders_${partnerColumn}_fkey(id, full_name, avatar_url, role)
          `)
          .eq(orderColumn, userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (Array.isArray(orderRows)) {
          for (const row of orderRows as any[]) {
            const p = row.partner;
            if (p?.id && p.id !== userId && !contactsMap.has(p.id)) {
              const pRole = p.role || fallbackPartnerRole;
              contactsMap.set(p.id, {
                id: p.id,
                fullName: p.full_name || 'TraceRoot Partner',
                avatarUrl: p.avatar_url || undefined,
                role: pRole,
                contextLabel: row.linked_crop_batch
                  ? `${pRole === 'farmer' ? 'Farmer' : 'Buyer'} · Order: ${row.linked_crop_batch}`
                  : `${pRole === 'farmer' ? 'Farmer' : 'Buyer'} · Active Order Partner`,
              });
            }
          }
        }
      }

      if (myRole === 'supplier' || myRole === 'farmer') {
        const supplyFilterCol = myRole === 'supplier' ? 'supplier_id' : 'farmer_id';
        const supplyPartnerCol = myRole === 'supplier' ? 'farmer_id' : 'supplier_id';
        const fallbackSupplyRole = myRole === 'supplier' ? 'farmer' : 'supplier';

        const { data: supplyRows } = await supabase
          .from('supplier_orders')
          .select(`
            ${supplyPartnerCol},
            partner:profiles!supplier_orders_${supplyPartnerCol}_fkey(id, full_name, avatar_url, role)
          `)
          .eq(supplyFilterCol, userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (Array.isArray(supplyRows)) {
          for (const row of supplyRows as any[]) {
            const p = row.partner;
            if (p?.id && p.id !== userId && !contactsMap.has(p.id)) {
              const pRole = p.role || fallbackSupplyRole;
              contactsMap.set(p.id, {
                id: p.id,
                fullName: p.full_name || 'TraceRoot Partner',
                avatarUrl: p.avatar_url || undefined,
                role: pRole,
                contextLabel: `${pRole === 'farmer' ? 'Farmer' : 'Supplier'} · Supply Order Partner`,
              });
            }
          }
        }
      }

      // 2. Also include active profiles for the counterpart roles so new feedback threads can start anytime
      const targetRoles =
        myRole === 'supplier'
          ? ['farmer', 'buyer']
          : myRole === 'farmer'
          ? ['buyer', 'supplier']
          : ['farmer', 'supplier'];

      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('role', targetRoles)
        .neq('id', userId)
        .limit(40);

      if (Array.isArray(profileRows)) {
        for (const p of profileRows) {
          if (p.id && !contactsMap.has(p.id)) {
            const pRole = p.role || targetRoles[0];
            contactsMap.set(p.id, {
              id: p.id,
              fullName: p.full_name || 'TraceRoot User',
              avatarUrl: p.avatar_url || undefined,
              role: pRole,
              contextLabel: this.getRoleDisplayLabel(pRole),
            });
          }
        }
      }

      return Array.from(contactsMap.values());
    } catch (err) {
      console.warn('[MessagesService] fetchContactsForMessaging error:', err);
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
   * Subscribe to real-time incoming, outgoing, and read-receipt message events for a user.
   */
  subscribeToMessages(userId: string, onMessageEvent: (message: any) => void) {
    if (!userId) return () => {};

    const channelName = `user-messages-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          onMessageEvent(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId}`,
        },
        (payload) => {
          onMessageEvent(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          onMessageEvent(payload.new);
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
