import { useState, useEffect } from 'react';
import { SupplierMessageThread } from '../types/supplier.types';

export const INITIAL_SUPPLIER_THREADS: SupplierMessageThread[] = [];

let threads: SupplierMessageThread[] = [];
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

export function resetSupplierMessagesStore() {
  threads = [];
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
