// src/lib/api/orders.ts
// Supabase helper functions and types for the Orders feature.

import { supabase } from '../supabase';

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'ready'
  | 'delivered'
  | 'declined'
  | 'cancelled';

export interface Order {
  id: string;
  created_at: string;
  crop_id: string;
  crop_name: string;
  crop_image?: string;
  quantity: number;
  unit: string;
  buyer_id: string;
  buyer_name: string;
  buyer_verified: boolean;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  status_timestamps: Record<string, string | null>;
  decline_reason?: string | null;
}

export const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-0012',
    created_at: '2026-09-10T08:30:00Z',
    crop_id: 'crop-tomato-1',
    crop_name: 'Tomato',
    crop_image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
    quantity: 50,
    unit: 'kg',
    buyer_id: 'buyer-saman',
    buyer_name: 'Saman Perera',
    buyer_verified: true,
    unit_price: 180,
    total_price: 9000,
    status: 'accepted',
    status_timestamps: {
      placed: '2026-09-10T08:30:00Z',
      accepted: '2026-09-10T10:15:00Z',
    },
  },
  {
    id: 'ORD-0015',
    created_at: '2026-09-11T09:00:00Z',
    crop_id: 'crop-carrot-1',
    crop_name: 'Carrots',
    crop_image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80',
    quantity: 20,
    unit: 'kg',
    buyer_id: 'buyer-nimal',
    buyer_name: 'Nimal Silva',
    buyer_verified: true,
    unit_price: 160,
    total_price: 3200,
    status: 'new',
    status_timestamps: {
      placed: '2026-09-11T09:00:00Z',
    },
  },
  {
    id: 'ORD-0008',
    created_at: '2026-09-02T07:45:00Z',
    crop_id: 'crop-beans-1',
    crop_name: 'Green Beans',
    crop_image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=500&auto=format&fit=crop&q=80',
    quantity: 14,
    unit: 'kg',
    buyer_id: 'buyer-kamal',
    buyer_name: 'Kamal Jayasuriya',
    buyer_verified: true,
    unit_price: 200,
    total_price: 2800,
    status: 'delivered',
    status_timestamps: {
      placed: '2026-09-02T07:45:00Z',
      accepted: '2026-09-02T09:00:00Z',
      ready: '2026-09-03T11:00:00Z',
      delivered: '2026-09-04T15:30:00Z',
    },
  },
  {
    id: 'ORD-0004',
    created_at: '2026-08-28T14:10:00Z',
    crop_id: 'crop-potato-1',
    crop_name: 'Potatoes',
    crop_image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
    quantity: 35,
    unit: 'kg',
    buyer_id: 'buyer-sunil',
    buyer_name: 'Sunil Fernando',
    buyer_verified: false,
    unit_price: 150,
    total_price: 5250,
    status: 'cancelled',
    status_timestamps: {
      placed: '2026-08-28T14:10:00Z',
      cancelled: '2026-08-29T10:00:00Z',
    },
  },
];

/** Fetch all orders belonging to the current farmer with fallback sample data */
export const fetchOrders = async (farmerId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `id, created_at, crop_id, quantity, unit, unit_price, status, status_timestamps, decline_reason,
         crops(name, image_url),
         buyers(name, verified)`
      )
      .eq('farmer_id', farmerId);

    if (error || !data || data.length === 0) {
      return INITIAL_MOCK_ORDERS;
    }

    return (data as any[]).map(row => ({
      id: row.id,
      created_at: row.created_at,
      crop_id: row.crop_id,
      crop_name: row.crops?.name || 'Organic Crop',
      crop_image: row.crops?.image_url || undefined,
      quantity: Number(row.quantity) || 1,
      unit: row.unit || 'kg',
      buyer_id: row.buyer_id,
      buyer_name: row.buyers?.name || 'Buyer',
      buyer_verified: Boolean(row.buyers?.verified),
      unit_price: Number(row.unit_price) || 0,
      total_price: (Number(row.quantity) || 1) * (Number(row.unit_price) || 0),
      status: (row.status as OrderStatus) || 'new',
      status_timestamps: row.status_timestamps || {},
      decline_reason: row.decline_reason || null,
    }));
  } catch {
    return INITIAL_MOCK_ORDERS;
  }
};

/** Accept a pending order */
export const acceptOrder = async (orderId: string) => {
  try {
    return await supabase
      .from('orders')
      .update({
        status: 'accepted',
        status_timestamps: { accepted: new Date().toISOString() },
      })
      .eq('id', orderId);
  } catch {
    return null;
  }
};

/** Decline a pending order (optional reason) */
export const declineOrder = async (orderId: string, reason?: string) => {
  try {
    return await supabase
      .from('orders')
      .update({
        status: 'declined',
        decline_reason: reason ?? null,
        status_timestamps: { declined: new Date().toISOString() },
      })
      .eq('id', orderId);
  } catch {
    return null;
  }
};

/** Mark an accepted order as ready for delivery */
export const markReady = async (orderId: string) => {
  try {
    return await supabase
      .from('orders')
      .update({
        status: 'ready',
        status_timestamps: { ready: new Date().toISOString() },
      })
      .eq('id', orderId);
  } catch {
    return null;
  }
};

/** Mark a ready order as delivered */
export const markDelivered = async (orderId: string) => {
  try {
    return await supabase
      .from('orders')
      .update({
        status: 'delivered',
        status_timestamps: { delivered: new Date().toISOString() },
      })
      .eq('id', orderId);
  } catch {
    return null;
  }
};
