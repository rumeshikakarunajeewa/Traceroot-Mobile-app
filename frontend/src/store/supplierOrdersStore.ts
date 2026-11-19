import { useState, useEffect } from 'react';
import { SupplierOrderRequest, SupplierOrderStatus } from '../types/supplier.types';
import { supplierOrdersService } from '../services/supplierOrders.service';
import { authService } from '../services/auth.service';

export const INITIAL_ORDERS: SupplierOrderRequest[] = [
  {
    id: 'REQ-2041',
    farmerName: 'Priya Kumari',
    farmerAvatar: {
      uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    district: 'Kandy District',
    timeAgo: '2 hours ago',
    status: 'New',
    stepperStage: 'Received',
    deliveryMethod: 'Farm delivery',
    totalAmount: 12000,
    items: [
      {
        title: 'Organic NPK Blend',
        quantity: '10 bags',
        price: 12000,
        imageUrl: require('../../assets/images/supplier_fertilizer.jpg'),
      },
    ],
  },
  {
    id: 'REQ-2038',
    farmerName: 'Roshan Silva',
    farmerAvatar: {
      uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    district: 'Nuwara Eliya',
    timeAgo: 'Yesterday',
    status: 'Packing',
    stepperStage: 'Packing',
    deliveryMethod: 'Farm delivery',
    totalAmount: 5770,
    items: [
      {
        title: 'Tomato F1 Hybrid Seeds',
        quantity: '5 packs',
        price: 4250,
        imageUrl: require('../../assets/images/supplier_tomato_seeds.jpg'),
      },
      {
        title: 'Bio Pesticide Spray',
        quantity: '2 L',
        price: 1520,
        imageUrl: {
          uri: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=200&q=80',
        },
      },
    ],
  },
  {
    id: 'REQ-2030',
    farmerName: 'Amali Fernando',
    farmerAvatar: {
      uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    district: 'Matale District',
    timeAgo: 'Last week',
    status: 'Completed',
    stepperStage: 'Delivered',
    deliveryMethod: 'Pickup',
    totalAmount: 6800,
    items: [
      {
        title: 'Drip Irrigation Kit',
        quantity: '1 set',
        price: 6800,
        imageUrl: {
          uri: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=200&q=80',
        },
      },
    ],
  },
];

let orders: SupplierOrderRequest[] = [...INITIAL_ORDERS];
const listeners = new Set<(ordersList: SupplierOrderRequest[]) => void>();
let isInitialized = false;

function notify() {
  listeners.forEach((listener) => listener([...orders]));
}

export function getSupplierOrders(): SupplierOrderRequest[] {
  return [...orders];
}

export async function loadSupplierOrders(supplierId?: string, force = false): Promise<SupplierOrderRequest[]> {
  if (isInitialized && !force && orders.length > 0) {
    return orders;
  }
  isInitialized = true;

  try {
    let targetSupplierId = supplierId;
    if (!targetSupplierId) {
      const session = await authService.getSession();
      targetSupplierId = session?.user?.id;
    }

    if (targetSupplierId) {
      const liveOrders = await supplierOrdersService.getSupplierOrders(targetSupplierId);
      if (liveOrders && liveOrders.length > 0) {
        orders = liveOrders;
      }
    }
  } catch (err) {
    console.warn('[supplierOrdersStore] Error loading orders from Supabase:', err);
  }

  notify();
  return orders;
}

export function updateOrderStatus(id: string, newStatus: SupplierOrderStatus) {
  orders = orders.map((order) => {
    if (order.id === id) {
      const stepperStage =
        newStatus === 'Packing'
          ? 'Packing'
          : newStatus === 'Completed'
          ? 'Delivered'
          : 'Received';

      return {
        ...order,
        status: newStatus,
        stepperStage,
      };
    }
    return order;
  });
  notify();

  // Async persist to Supabase
  const actualOrderId = id.startsWith('REQ-') ? id.replace('REQ-', '') : id;
  supplierOrdersService.updateOrderStatus(actualOrderId, newStatus).catch((err) => {
    console.warn('Error updating supplier order status in Supabase:', err);
  });
}

export function declineOrder(id: string) {
  updateOrderStatus(id, 'Declined');
}

export function acceptAndPackOrder(id: string) {
  updateOrderStatus(id, 'Packing');
}

export function useSupplierOrders(): [
  SupplierOrderRequest[],
  (id: string, newStatus: SupplierOrderStatus) => void,
  (id: string) => void
] {
  const [currentOrders, setCurrentOrders] = useState<SupplierOrderRequest[]>(orders);

  useEffect(() => {
    const listener = (newOrders: SupplierOrderRequest[]) => setCurrentOrders(newOrders);
    listeners.add(listener);

    if (!isInitialized) {
      loadSupplierOrders();
    }

    // Subscribe to Realtime order updates
    let unsubscribe: (() => void) | undefined;
    authService.getSession().then((session) => {
      const supplierId = session?.user?.id;
      if (supplierId) {
        unsubscribe = supplierOrdersService.subscribeToSupplierOrders({ supplierId }, () => {
          loadSupplierOrders(supplierId, true);
        });
      }
    });

    return () => {
      listeners.delete(listener);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return [currentOrders, updateOrderStatus, declineOrder];
}
