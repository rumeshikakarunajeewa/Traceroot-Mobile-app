// src/lib/api/orders.ts
// Supabase helper functions and types for the Orders feature.

import { ordersService } from '../../services/orders.service';

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
  deadline?: string;
  buyer_notes?: string;
  linked_crop_batch?: string;
  crop_route_id?: string;
  invoice_number?: string;
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
    deadline: '25 Sep 2026',
    buyer_notes: 'Greenhouse-grown preferred. No pesticides after 7 Sep.',
    linked_crop_batch: 'Tomato — Batch #3 (Kandy Farm)',
    crop_route_id: 'field-tomato',
    invoice_number: 'INV-2026-0012',
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
    deadline: '28 Sep 2026',
    buyer_notes: 'Freshly harvested carrots, grade-A organic certification.',
    linked_crop_batch: 'Carrots — Batch #1 (Kandy Farm)',
    crop_route_id: 'field-carrots',
    invoice_number: 'INV-2026-0015',
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
    deadline: '05 Sep 2026',
    buyer_notes: 'Eco-friendly cardboard packing preferred.',
    linked_crop_batch: 'Green Beans — Batch #2 (Kandy Farm)',
    crop_route_id: 'field-beans',
    invoice_number: 'INV-2026-0008',
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
    deadline: '01 Sep 2026',
    buyer_notes: 'Storage in aerated sacks.',
    linked_crop_batch: 'Potatoes — Batch #1 (Kandy Farm)',
    crop_route_id: 'field-potato',
    invoice_number: 'INV-2026-0004',
  },
];

/** Fetch all orders belonging to the current farmer */
export const fetchOrders = async (farmerId: string): Promise<Order[]> => {
  try {
    const realOrders = await ordersService.fetchFarmerOrders(farmerId);
    if (realOrders.length > 0) {
      return realOrders;
    }
    // Return empty array if farmer has no orders yet (or mock during development testing)
    return realOrders;
  } catch {
    return INITIAL_MOCK_ORDERS;
  }
};

/** Accept a pending order */
export const acceptOrder = async (orderId: string) => {
  return await ordersService.updateOrderStatus(orderId, 'accepted');
};

/** Decline a pending order (optional reason) */
export const declineOrder = async (orderId: string, reason?: string) => {
  return await ordersService.updateOrderStatus(orderId, 'declined', reason);
};

/** Mark an accepted order as ready for delivery */
export const markReady = async (orderId: string) => {
  return await ordersService.updateOrderStatus(orderId, 'ready');
};

/** Mark a ready order as delivered */
export const markDelivered = async (orderId: string) => {
  return await ordersService.updateOrderStatus(orderId, 'delivered');
};
