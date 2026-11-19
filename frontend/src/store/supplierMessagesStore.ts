import { useState, useEffect } from 'react';
import { SupplierMessageThread } from '../types/supplier.types';

export const INITIAL_SUPPLIER_THREADS: SupplierMessageThread[] = [
  {
    id: 'thread-001',
    senderName: 'Saman Perera',
    avatarUrl: {
      uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    type: 'Request',
    statusTag: 'New',
    timestamp: '2h ago',
    isUnread: true,
    lastMessage:
      'Can you confirm the exact harvest date for the upcoming tomato batch? Need to arrange',
    messages: [
      {
        id: 'msg-1',
        sender: 'other',
        text: 'Hello AgriSupply! We are organizing our dispatch schedules for next week.',
        timestamp: '2h ago',
      },
      {
        id: 'msg-2',
        sender: 'other',
        text: 'Can you confirm the exact harvest date for the upcoming tomato batch? Need to arrange',
        timestamp: '2h ago',
      },
    ],
  },
  {
    id: 'thread-002',
    senderName: 'Dr. Silva (Agronomist)',
    avatarUrl: {
      uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
    },
    type: 'Note',
    statusTag: 'Replied',
    timestamp: 'Yesterday',
    isUnread: false,
    lastMessage:
      'Soil moisture levels look great based on your recent records. Keep up the current irrigation',
    messages: [
      {
        id: 'msg-1',
        sender: 'other',
        text: 'Soil moisture levels look great based on your recent records. Keep up the current irrigation',
        timestamp: 'Yesterday',
      },
      {
        id: 'msg-2',
        sender: 'user',
        text: 'Thank you doctor! We adjusted our sprinkler timings as recommended.',
        timestamp: 'Yesterday',
      },
    ],
  },
  {
    id: 'thread-003',
    senderName: 'FreshMart Ltd',
    avatarUrl: {
      uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    },
    type: 'Request',
    statusTag: 'Pending',
    timestamp: 'Mon',
    isUnread: false,
    lastMessage:
      'We would like to increase our order quantity for next week to 500kg. Please let me know if',
    messages: [
      {
        id: 'msg-1',
        sender: 'other',
        text: 'Good morning! Demand for hybrid greenhouse crops has surged.',
        timestamp: 'Mon',
      },
      {
        id: 'msg-2',
        sender: 'other',
        text: 'We would like to increase our order quantity for next week to 500kg. Please let me know if',
        timestamp: 'Mon',
      },
    ],
  },
  {
    id: 'thread-004',
    senderName: 'Green Valley Co-op',
    avatarUrl: {
      uri: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=200&q=80',
    },
    type: 'Note',
    statusTag: 'Replied',
    timestamp: 'Last week',
    isUnread: false,
    lastMessage:
      'Reminder: The organic farming certification renewal deadline is approaching next month.',
    messages: [
      {
        id: 'msg-1',
        sender: 'other',
        text: 'Reminder: The organic farming certification renewal deadline is approaching next month.',
        timestamp: 'Last week',
      },
      {
        id: 'msg-2',
        sender: 'user',
        text: 'Thanks for the alert! All bio-inspect reports have been renewed.',
        timestamp: 'Last week',
      },
    ],
  },
];

let threads: SupplierMessageThread[] = [...INITIAL_SUPPLIER_THREADS];
const listeners = new Set<(threadsList: SupplierMessageThread[]) => void>();

function notify() {
  listeners.forEach((listener) => listener([...threads]));
}

export function getSupplierThreads(): SupplierMessageThread[] {
  return [...threads];
}

export function markThreadAsRead(threadId: string) {
  threads = threads.map((t) => (t.id === threadId ? { ...t, isUnread: false } : t));
  notify();
}

export function sendMessageToThread(threadId: string, text: string) {
  threads = threads.map((t) => {
    if (t.id === threadId) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'user' as const,
        text,
        timestamp: 'Just now',
      };
      return {
        ...t,
        lastMessage: text,
        timestamp: 'Just now',
        statusTag: 'Replied' as const,
        messages: [...t.messages, newMsg],
      };
    }
    return t;
  });
  notify();
}

export function useSupplierMessages(): [
  SupplierMessageThread[],
  (threadId: string) => void,
  (threadId: string, text: string) => void
] {
  const [currentThreads, setCurrentThreads] = useState<SupplierMessageThread[]>(threads);

  useEffect(() => {
    const listener = (newThreads: SupplierMessageThread[]) => setCurrentThreads(newThreads);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [currentThreads, markThreadAsRead, sendMessageToThread];
}
