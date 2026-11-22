import { useState, useEffect } from 'react';
import { SupplierOrderRequest, SupplierOrderStatus } from '../types/supplier.types';
import { supplierOrdersService } from '../services/supplierOrders.service';
import { authService } from '../services/auth.service';

let orders: SupplierOrderRequest[] = [];
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

    const liveOrders = await supplierOrdersService.getSupplierOrders(targetSupplierId);
    orders = liveOrders || [];
  } catch (err) {
    console.warn('[supplierOrdersStore] Error loading orders from Supabase:', err);
    orders = [];
  }

  notify();
  return orders;
}

export function updateOrderStatus(id: string, newStatus: SupplierOrderStatus) {
  const targetOrder = orders.find((order) => order.id === id || order.dbId === id);
  const actualDbId = targetOrder?.dbId || (id.startsWith('REQ-') ? targetOrder?.dbId || id : id);

  orders = orders.map((order) => {
    if (order.id === id || order.dbId === id) {
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

  // Async persist to Supabase using actual UUID if available
  if (actualDbId) {
    supplierOrdersService.updateOrderStatus(actualDbId, newStatus).catch((err) => {
      console.warn('Error updating supplier order status in Supabase:', err);
    });
  }
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
      unsubscribe = supplierOrdersService.subscribeToSupplierOrders({ supplierId }, () => {
        loadSupplierOrders(supplierId, true);
      });
    });

    return () => {
      listeners.delete(listener);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return [currentOrders, updateOrderStatus, declineOrder];
}
