// src/hooks/useOrders.ts
// Custom React hooks for Farmer & Buyer Orders with Supabase Realtime subscriptions.

import { useState, useEffect, useCallback } from 'react';
import { ordersService, PlaceOrderParams } from '../services/orders.service';
import { Order, OrderStatus } from '../lib/api/orders';
import { BuyerOrder, ProduceListing } from '../types/buyer.types';
import { useAuth } from '../store/authStore';

/**
 * Hook for Farmer to load and manage orders in real-time.
 */
export function useFarmerOrders(customFarmerId?: string) {
  const { user } = useAuth();
  const farmerId = customFarmerId || user?.id || 'farmer-1';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await ordersService.fetchFarmerOrders(farmerId);
      setOrders(data);
    } catch (err: any) {
      console.warn('[useFarmerOrders] Error loading orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [farmerId]);

  useEffect(() => {
    loadOrders();

    // Subscribe to Realtime order changes for this farmer
    const unsubscribe = ordersService.subscribeToOrders({ farmerId }, () => {
      loadOrders(true);
    });

    return () => {
      unsubscribe();
    };
  }, [farmerId, loadOrders]);

  const handleAcceptOrder = async (orderId: string) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'accepted' as OrderStatus,
              status_timestamps: { ...o.status_timestamps, accepted: new Date().toISOString() },
            }
          : o
      )
    );
    const res = await ordersService.updateOrderStatus(orderId, 'accepted');
    if (!res.success) {
      loadOrders(true);
    }
    return res;
  };

  const handleDeclineOrder = async (orderId: string, reason?: string) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'declined' as OrderStatus,
              decline_reason: reason || null,
              status_timestamps: { ...o.status_timestamps, declined: new Date().toISOString() },
            }
          : o
      )
    );
    const res = await ordersService.updateOrderStatus(orderId, 'declined', reason);
    if (!res.success) {
      loadOrders(true);
    }
    return res;
  };

  const handleMarkReady = async (orderId: string) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'ready' as OrderStatus,
              status_timestamps: { ...o.status_timestamps, ready: new Date().toISOString() },
            }
          : o
      )
    );
    const res = await ordersService.updateOrderStatus(orderId, 'ready');
    if (!res.success) {
      loadOrders(true);
    }
    return res;
  };

  const handleMarkDelivered = async (orderId: string) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'delivered' as OrderStatus,
              status_timestamps: { ...o.status_timestamps, delivered: new Date().toISOString() },
            }
          : o
      )
    );
    const res = await ordersService.updateOrderStatus(orderId, 'delivered');
    if (!res.success) {
      loadOrders(true);
    }
    return res;
  };

  return {
    orders,
    isLoading,
    isRefreshing,
    error,
    refresh: () => loadOrders(true),
    acceptOrder: handleAcceptOrder,
    declineOrder: handleDeclineOrder,
    markReady: handleMarkReady,
    markDelivered: handleMarkDelivered,
  };
}

/**
 * Hook for Buyer to load and track orders in real-time.
 */
export function useBuyerOrders(customBuyerId?: string) {
  const { user } = useAuth();
  const buyerId = customBuyerId || user?.id || 'buyer-1';

  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await ordersService.fetchBuyerOrders(buyerId);
      setOrders(data);
    } catch (err: any) {
      console.warn('[useBuyerOrders] Error loading orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [buyerId]);

  useEffect(() => {
    loadOrders();

    // Subscribe to Realtime order changes for this buyer
    const unsubscribe = ordersService.subscribeToOrders({ buyerId }, () => {
      loadOrders(true);
    });

    return () => {
      unsubscribe();
    };
  }, [buyerId, loadOrders]);

  const placeOrder = async (params: Omit<PlaceOrderParams, 'buyerId'>) => {
    const res = await ordersService.placeBuyerOrder({
      ...params,
      buyerId,
    });
    if (res.success) {
      loadOrders(true);
    }
    return res;
  };

  return {
    orders,
    isLoading,
    isRefreshing,
    error,
    refresh: () => loadOrders(true),
    placeOrder,
  };
}

/**
 * Hook for Buyer Marketplace Produce Listings.
 */
export function useMarketplaceListings() {
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadListings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await ordersService.fetchMarketplaceListings();
      setListings(data);
    } catch (err: any) {
      console.warn('[useMarketplaceListings] Error:', err);
      setError(err.message || 'Failed to load listings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return {
    listings,
    isLoading,
    isRefreshing,
    error,
    refresh: () => loadListings(true),
  };
}

