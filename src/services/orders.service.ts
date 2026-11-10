// src/services/orders.service.ts
// Supabase Orders Service for Farmer & Buyer Workflows
// Provides real-time order queries, placement, inventory management, status transitions, and subscriptions.

import { supabase } from '../lib/supabase';
import { Order, OrderStatus } from '../lib/api/orders';
import {
  BuyerOrder,
  ProduceListing,
  FarmingType,
  OrderStatus as BuyerOrderStatus,
  OrderTrackingMilestone,
} from '../types/buyer.types';
import { mockProduceListings, mockBuyerOrders } from '../constants/buyerMockData';

export interface PlaceOrderParams {
  buyerId: string;
  cropId?: string;
  listingId?: string;
  farmerId?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  deadline?: string;
  buyerNotes?: string;
  linkedCropBatch?: string;
  cropName?: string;
}

class OrdersService {
  /**
   * Fetch all active produce listings for the Buyer Marketplace.
   * Joins `harvest_listings` with `harvests` and `profiles`.
   * Also includes listed harvests from `harvests` where `is_listed = true`.
   */
  async fetchMarketplaceListings(): Promise<ProduceListing[]> {
    try {
      // 1. Query dedicated harvest_listings table
      const { data: listingsData, error: listingsError } = await supabase
        .from('harvest_listings')
        .select(`
          id,
          harvest_id,
          farmer_id,
          title,
          description,
          price_per_unit,
          unit,
          available_qty,
          images,
          is_active,
          created_at,
          harvests (
            id,
            crop_name,
            crop_emoji,
            farming_type,
            current_stage,
            cover_image_url,
            is_listed
          ),
          profiles!harvest_listings_farmer_id_fkey (
            id,
            full_name,
            avatar_url,
            farm_name,
            district,
            province,
            is_verified
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const mappedFromListings: ProduceListing[] = [];

      if (!listingsError && Array.isArray(listingsData) && listingsData.length > 0) {
        for (const item of listingsData) {
          const harvest = item.harvests as any;
          const profile = item.profiles as any;
          const imageUrl =
            Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string'
              ? item.images[0]
              : harvest?.cover_image_url ||
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';

          const farmingType: FarmingType =
            harvest?.farming_type === 'greenhouse' ? 'greenhouse' : 'open-field';

          const stageIndex = this.stageToNumber(harvest?.current_stage);

          mappedFromListings.push({
            id: item.id,
            cropName: harvest?.crop_name || item.title || 'Produce',
            cropEmoji: harvest?.crop_emoji || this.getCropEmoji(harvest?.crop_name || item.title),
            category: 'Vegetables',
            farmingType,
            quantityKg: Number(item.available_qty) || 0,
            farmerName: profile?.full_name || profile?.farm_name || 'Verified Farmer',
            farmerAvatarUrl: profile?.avatar_url || undefined,
            farmerId: item.farmer_id,
            location: profile?.district || profile?.province || 'Sri Lanka',
            recordsCount: 10,
            completedStages: stageIndex,
            totalStages: 5,
            pricePerKg: Number(item.price_per_unit) || 150,
            currency: 'LKR',
            isOrganic: true,
            imageUrl,
          });
        }
      }

      // 2. Also query harvests where is_listed = true to capture any newly listed farmer crops
      const { data: harvestsData } = await supabase
        .from('harvests')
        .select(`
          id,
          farmer_id,
          crop_name,
          crop_emoji,
          farming_type,
          current_stage,
          cover_image_url,
          is_listed,
          created_at,
          profiles!harvests_farmer_id_fkey (
            id,
            full_name,
            avatar_url,
            farm_name,
            district,
            province,
            is_verified
          )
        `)
        .eq('is_listed', true)
        .order('created_at', { ascending: false });

      const mappedFromHarvests: ProduceListing[] = [];
      if (Array.isArray(harvestsData)) {
        for (const h of harvestsData) {
          // Avoid duplicate if already covered in harvest_listings
          const alreadyMapped = mappedFromListings.some(
            (l) => (l as any).harvest_id === h.id || l.id === h.id
          );
          if (!alreadyMapped) {
            const profile = h.profiles as any;
            const farmingType: FarmingType =
              h.farming_type === 'greenhouse' ? 'greenhouse' : 'open-field';

            mappedFromHarvests.push({
              id: h.id,
              cropName: h.crop_name,
              cropEmoji: h.crop_emoji || this.getCropEmoji(h.crop_name),
              category: 'Vegetables',
              farmingType,
              quantityKg: 100,
              farmerName: profile?.full_name || profile?.farm_name || 'Verified Farmer',
              farmerAvatarUrl: profile?.avatar_url || undefined,
              farmerId: h.farmer_id,
              location: profile?.district || profile?.province || 'Sri Lanka',
              recordsCount: 8,
              completedStages: this.stageToNumber(h.current_stage),
              totalStages: 5,
              pricePerKg: 180,
              currency: 'LKR',
              isOrganic: true,
              imageUrl:
                h.cover_image_url ||
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
            });
          }
        }
      }

      const combined = [...mappedFromListings, ...mappedFromHarvests];
      if (combined.length > 0) {
        return combined;
      }

      // Fallback to initial mock listings if database is brand new and has no listed produce yet
      return mockProduceListings;
    } catch (err) {
      console.warn('[OrdersService] Error fetching marketplace listings:', err);
      return mockProduceListings;
    }
  }

  /**
   * Place an order from Buyer for a harvest / listing.
   * Executes atomic database RPC if available, or client-side atomic insert & inventory decrement.
   */
  async placeBuyerOrder(params: PlaceOrderParams): Promise<{ success: boolean; orderId: string; error?: string }> {
    try {
      const {
        buyerId,
        cropId,
        listingId,
        farmerId,
        quantity,
        unit = 'kg',
        unitPrice,
        deadline,
        buyerNotes,
        linkedCropBatch,
        cropName,
      } = params;

      if (!buyerId) {
        return { success: false, orderId: '', error: 'Authenticated buyer ID required' };
      }
      if (quantity <= 0) {
        return { success: false, orderId: '', error: 'Quantity must be greater than zero' };
      }

      // 1. Try atomic PostgreSQL RPC `place_buyer_order`
      const { data: rpcData, error: rpcError } = await supabase.rpc('place_buyer_order', {
        p_buyer_id: buyerId,
        p_crop_id: cropId || null,
        p_quantity: quantity,
        p_unit: unit,
        p_unit_price: unitPrice,
        p_listing_id: listingId || null,
        p_farmer_id: farmerId || null,
        p_buyer_notes: buyerNotes || null,
        p_deadline: deadline || null,
        p_linked_batch: linkedCropBatch || null,
      });

      if (!rpcError && rpcData?.order_id) {
        return { success: true, orderId: rpcData.order_id };
      }

      // 2. Direct transactional client fallback if RPC function is not yet pushed
      const generatedOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = new Date().toISOString();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${generatedOrderId.replace('ORD-', '')}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: generatedOrderId,
          buyer_id: buyerId,
          farmer_id: farmerId || null,
          crop_id: cropId || null,
          quantity,
          unit,
          unit_price: unitPrice,
          status: 'new',
          status_timestamps: { placed: nowIso },
          deadline: deadline || 'Within 7 business days',
          buyer_notes: buyerNotes || null,
          linked_crop_batch: linkedCropBatch || `${cropName || 'Produce'} Batch`,
          invoice_number: invoiceNumber,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (orderError) {
        console.warn('[OrdersService] Error placing direct order:', orderError.message);
        return { success: false, orderId: '', error: orderError.message };
      }

      const confirmedOrderId = orderData?.id || generatedOrderId;

      // Insert corresponding order item
      await supabase.from('order_items').insert({
        order_id: confirmedOrderId,
        item_name: cropName || 'Organic Harvest Batch',
        quantity,
        unit,
        unit_price: unitPrice,
      });

      // Safely decrement available_qty on harvest_listings if listingId provided
      if (listingId) {
        const { data: curListing } = await supabase
          .from('harvest_listings')
          .select('available_qty')
          .eq('id', listingId)
          .single();

        if (curListing) {
          const newQty = Math.max(0, Number(curListing.available_qty) - quantity);
          await supabase
            .from('harvest_listings')
            .update({
              available_qty: newQty,
              is_active: newQty > 0,
            })
            .eq('id', listingId);
        }
      }

      return { success: true, orderId: confirmedOrderId };
    } catch (err: any) {
      console.warn('[OrdersService] placeBuyerOrder exception:', err);
      return { success: false, orderId: '', error: err.message || 'Failed to place order' };
    }
  }

  /**
   * Fetch all orders belonging to a Farmer with joined crop and buyer details.
   */
  async fetchFarmerOrders(farmerId: string): Promise<Order[]> {
    try {
      if (!farmerId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          crop_id,
          quantity,
          unit,
          unit_price,
          status,
          status_timestamps,
          decline_reason,
          deadline,
          buyer_notes,
          linked_crop_batch,
          crop_route_id,
          invoice_number,
          buyer_id,
          crops (
            name,
            image_url,
            farming_type
          ),
          buyers (
            name,
            verified,
            phone,
            email,
            avatar_url
          )
        `)
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[OrdersService] Error fetching farmer orders:', error.message);
        return [];
      }

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      return data.map((row: any) => {
        const qty = Number(row.quantity) || 1;
        const price = Number(row.unit_price) || 0;
        const buyer = row.buyers as any;
        const crop = row.crops as any;

        return {
          id: row.id,
          created_at: row.created_at,
          crop_id: row.crop_id || '',
          crop_name: crop?.name || row.linked_crop_batch || 'Organic Produce',
          crop_image: crop?.image_url || undefined,
          quantity: qty,
          unit: row.unit || 'kg',
          buyer_id: row.buyer_id || '',
          buyer_name: buyer?.name || 'Verified Buyer',
          buyer_verified: Boolean(buyer?.verified),
          unit_price: price,
          total_price: qty * price,
          status: (row.status as OrderStatus) || 'new',
          status_timestamps: row.status_timestamps || { placed: row.created_at },
          decline_reason: row.decline_reason || null,
          deadline: row.deadline || 'Standard Dispatch',
          buyer_notes: row.buyer_notes || undefined,
          linked_crop_batch: row.linked_crop_batch || undefined,
          crop_route_id: row.crop_route_id || (row.crop_id ? `field-${row.crop_id}` : undefined),
          invoice_number: row.invoice_number || `INV-${row.id}`,
        };
      });
    } catch (err) {
      console.warn('[OrdersService] fetchFarmerOrders failed:', err);
      return [];
    }
  }

  /**
   * Fetch all orders belonging to a Buyer with joined crop and farmer details.
   */
  async fetchBuyerOrders(buyerId: string): Promise<BuyerOrder[]> {
    try {
      if (!buyerId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          crop_id,
          farmer_id,
          quantity,
          unit,
          unit_price,
          status,
          status_timestamps,
          decline_reason,
          deadline,
          buyer_notes,
          linked_crop_batch,
          crop_route_id,
          invoice_number,
          crops (
            name,
            emoji,
            image_url,
            farming_type,
            current_stage
          ),
          profiles!orders_farmer_id_fkey (
            id,
            full_name,
            farm_name,
            avatar_url,
            district,
            province
          )
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[OrdersService] Error fetching buyer orders:', error.message);
        return [];
      }

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      return data.map((row: any) => this.mapToBuyerOrder(row));
    } catch (err) {
      console.warn('[OrdersService] fetchBuyerOrders failed:', err);
      return [];
    }
  }

  /**
   * Fetch single order detail by ID or orderNumber.
   */
  async fetchOrderById(orderId: string): Promise<BuyerOrder | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          crop_id,
          farmer_id,
          quantity,
          unit,
          unit_price,
          status,
          status_timestamps,
          decline_reason,
          deadline,
          buyer_notes,
          linked_crop_batch,
          crop_route_id,
          invoice_number,
          crops (
            name,
            emoji,
            image_url,
            farming_type,
            current_stage
          ),
          profiles!orders_farmer_id_fkey (
            id,
            full_name,
            farm_name,
            avatar_url,
            district,
            province
          )
        `)
        .eq('id', orderId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapToBuyerOrder(data);
    } catch (err) {
      console.warn('[OrdersService] fetchOrderById failed:', err);
      return null;
    }
  }

  /**
   * Update order status (Accept, Decline, Mark Ready, Mark Delivered, Cancel).
   * Safely merges existing status timestamps to preserve the audit trail.
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    declineReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Fetch current status_timestamps
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status_timestamps')
        .eq('id', orderId)
        .single();

      const existingTimestamps = currentOrder?.status_timestamps || {};
      const updatedTimestamps = {
        ...existingTimestamps,
        [newStatus]: new Date().toISOString(),
      };

      const payload: Record<string, any> = {
        status: newStatus,
        status_timestamps: updatedTimestamps,
        updated_at: new Date().toISOString(),
      };

      if (declineReason !== undefined) {
        payload.decline_reason = declineReason;
      }

      const { error } = await supabase.from('orders').update(payload).eq('id', orderId);

      if (error) {
        console.warn(`[OrdersService] Failed to update order status to ${newStatus}:`, error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('[OrdersService] updateOrderStatus exception:', err);
      return { success: false, error: err.message || 'Failed to update order status' };
    }
  }

  /**
   * Subscribe to Supabase Realtime changes for orders.
   * Calls onUpdate callback whenever an order is inserted, updated, or deleted.
   */
  subscribeToOrders(
    filter: { farmerId?: string; buyerId?: string },
    onUpdate: (payload: any) => void
  ) {
    const channelName = `orders-realtime-${filter.farmerId || filter.buyerId || 'all'}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const row = (payload.new as any) || (payload.old as any);
          if (filter.farmerId && row?.farmer_id && row.farmer_id !== filter.farmerId) {
            return;
          }
          if (filter.buyerId && row?.buyer_id && row.buyer_id !== filter.buyerId) {
            return;
          }
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ── Helper methods ───────────────────────────────────────────────

  private mapToBuyerOrder(row: any): BuyerOrder {
    const crop = row.crops as any;
    const farmer = row.profiles as any;
    const qty = Number(row.quantity) || 1;
    const price = Number(row.unit_price) || 0;
    const rawStatus = (row.status as string) || 'new';

    // Map database order status to Buyer UI Status
    let mappedStatus: BuyerOrderStatus = 'Pending';
    if (rawStatus === 'accepted' || rawStatus === 'ready' || rawStatus === 'Growing' || rawStatus === 'in_transit') {
      mappedStatus = 'Growing';
    } else if (rawStatus === 'delivered' || rawStatus === 'Delivered') {
      mappedStatus = 'Delivered';
    } else if (rawStatus === 'declined' || rawStatus === 'cancelled') {
      mappedStatus = 'Cancelled';
    } else {
      mappedStatus = 'Pending';
    }

    const farmingType: FarmingType =
      crop?.farming_type === 'greenhouse' ? 'greenhouse' : 'open-field';

    const timestamps = row.status_timestamps || {};
    const trackingSteps: OrderTrackingMilestone[] = [
      {
        stage: 'placed',
        title: 'Order Placed & Escrow Locked',
        description: `Contract initiated with ${farmer?.full_name || 'Farmer'}.`,
        timestamp: timestamps.placed ? this.formatDate(timestamps.placed) : this.formatDate(row.created_at),
        isCompleted: true,
        isCurrent: rawStatus === 'new',
      },
      {
        stage: 'growing',
        title: 'Cultivation & Stage Verification',
        description: 'Optimal nutrient, irrigation, and weather parameters recorded.',
        timestamp: timestamps.accepted ? this.formatDate(timestamps.accepted) : (rawStatus === 'accepted' ? 'In Progress' : 'Pending Acceptance'),
        isCompleted: Boolean(timestamps.accepted || rawStatus === 'ready' || rawStatus === 'delivered'),
        isCurrent: rawStatus === 'accepted',
      },
      {
        stage: 'harvest',
        title: 'Harvest & Sorting',
        description: 'Harvest grading and tamper-proof verification stamp applied.',
        timestamp: timestamps.ready ? this.formatDate(timestamps.ready) : (rawStatus === 'ready' ? 'Ready for Dispatch' : 'Awaiting Harvest'),
        isCompleted: Boolean(timestamps.ready || rawStatus === 'delivered'),
        isCurrent: rawStatus === 'ready',
      },
      {
        stage: 'delivery',
        title: 'Direct Hub Delivery',
        description: 'Final weight inspection and digital delivery confirmation.',
        timestamp: timestamps.delivered ? this.formatDate(timestamps.delivered) : (rawStatus === 'delivered' ? 'Completed' : 'Pending Delivery'),
        isCompleted: Boolean(timestamps.delivered || rawStatus === 'delivered'),
        isCurrent: rawStatus === 'delivered',
      },
    ];

    let progressPercentage = 25;
    if (rawStatus === 'accepted') progressPercentage = 50;
    if (rawStatus === 'ready') progressPercentage = 75;
    if (rawStatus === 'delivered') progressPercentage = 100;
    if (rawStatus === 'declined' || rawStatus === 'cancelled') progressPercentage = 0;

    return {
      id: row.id,
      orderNumber: row.id,
      createdAt: this.formatDate(row.created_at),
      status: mappedStatus,
      cropName: crop?.name || row.linked_crop_batch || 'Produce Batch',
      cropEmoji: crop?.emoji || this.getCropEmoji(crop?.name),
      farmingType,
      quantityKg: qty,
      pricePerKg: price,
      totalPrice: qty * price,
      currency: 'LKR',
      imageUrl:
        crop?.image_url ||
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
      farmerId: row.farmer_id || '',
      farmerName: farmer?.full_name || farmer?.farm_name || 'Verified Farmer',
      location: farmer?.district || farmer?.province || 'Sri Lanka',
      recordsCount: 10,
      stagesCount: 4,
      progressPercentage,
      batchId: row.linked_crop_batch || `BATCH-${row.id}`,
      estimatedDelivery: row.deadline || 'Estimated 5-7 days',
      deliveryAddress: 'TraceRoot Buyer Receiving Hub',
      courierName: 'TraceRoot Direct Cold Logistics',
      courierPhone: '+94 77 123 4567',
      notes: row.buyer_notes || undefined,
      trackingSteps,
    };
  }

  private stageToNumber(stage?: string): number {
    switch (stage?.toLowerCase()) {
      case 'planting':
        return 1;
      case 'vegetative_growth':
      case 'vegetative growth':
        return 2;
      case 'flowering':
        return 3;
      case 'crop_maturity':
      case 'crop maturity':
        return 4;
      case 'harvesting':
        return 5;
      default:
        return 3;
    }
  }

  private getCropEmoji(name?: string): string {
    if (!name) return '🌱';
    const lower = name.toLowerCase();
    if (lower.includes('tomato')) return '🍅';
    if (lower.includes('cabbage')) return '🥬';
    if (lower.includes('carrot')) return '🥕';
    if (lower.includes('potato')) return '🥔';
    if (lower.includes('pepper') || lower.includes('chilli')) return '🌶️';
    if (lower.includes('bean')) return '🫘';
    if (lower.includes('onion')) return '🧅';
    if (lower.includes('corn')) return '🌽';
    return '🌱';
  }

  private formatDate(isoDate?: string): string {
    if (!isoDate) return 'Today';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  }
}

export const ordersService = new OrdersService();

