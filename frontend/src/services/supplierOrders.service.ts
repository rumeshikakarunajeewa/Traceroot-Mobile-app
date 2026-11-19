// src/services/supplierOrders.service.ts
// Supabase Service for Supplier Orders (Farmer -> Supplier Supply Purchases)

import { supabase } from '../lib/supabase';
import {
  SupplierOrderRequest,
  SupplierOrderStatus,
  SupplierOrderItem,
} from '../types/supplier.types';
import { INITIAL_ORDERS } from '../store/supplierOrdersStore';

export interface PlaceSupplierOrderParams {
  farmerId: string;
  supplierId: string;
  items: {
    catalogueItemId?: string;
    title: string;
    quantity: number;
    unit?: string;
    price: number;
    imageUrl?: string;
  }[];
  totalAmount: number;
  deliveryMethod?: string;
  notes?: string;
}

class SupplierOrdersService {
  /**
   * Map UI status to DB status
   */
  toDbStatus(status: SupplierOrderStatus): 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' {
    switch (status) {
      case 'New':
        return 'pending';
      case 'Packing':
        return 'confirmed';
      case 'Completed':
        return 'delivered';
      case 'Declined':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Map DB status to UI status & stepper stage
   */
  toUiStatus(dbStatus: string): { status: SupplierOrderStatus; stepperStage: 'Received' | 'Packing' | 'Delivered' } {
    switch (dbStatus?.toLowerCase()) {
      case 'confirmed':
      case 'shipped':
        return { status: 'Packing', stepperStage: 'Packing' };
      case 'delivered':
        return { status: 'Completed', stepperStage: 'Delivered' };
      case 'cancelled':
        return { status: 'Declined', stepperStage: 'Received' };
      case 'pending':
      default:
        return { status: 'New', stepperStage: 'Received' };
    }
  }

  /**
   * Fetch all orders received by a Supplier from Farmers.
   */
  async getSupplierOrders(supplierId: string): Promise<SupplierOrderRequest[]> {
    try {
      if (!supplierId) return INITIAL_ORDERS;

      const { data, error } = await supabase
        .from('supplier_orders')
        .select(`
          id,
          farmer_id,
          supplier_id,
          items,
          total_amount,
          status,
          notes,
          created_at,
          profiles!supplier_orders_farmer_id_fkey (
            id,
            full_name,
            farm_name,
            district,
            province,
            avatar_url
          )
        `)
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[SupplierOrdersService] Error fetching orders:', error.message);
        return INITIAL_ORDERS;
      }

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapDbRowToOrderRequest(row));
    } catch (err) {
      console.warn('[SupplierOrdersService] getSupplierOrders exception:', err);
      return INITIAL_ORDERS;
    }
  }

  /**
   * Fetch all supply orders placed by a specific Farmer.
   */
  async getFarmerOrders(farmerId: string): Promise<SupplierOrderRequest[]> {
    try {
      if (!farmerId) return [];

      const { data, error } = await supabase
        .from('supplier_orders')
        .select(`
          id,
          farmer_id,
          supplier_id,
          items,
          total_amount,
          status,
          notes,
          created_at,
          profiles!supplier_orders_supplier_id_fkey (
            id,
            full_name,
            farm_name,
            district,
            province,
            avatar_url
          )
        `)
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[SupplierOrdersService] Error fetching farmer orders:', error.message);
        return [];
      }

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapDbRowToOrderRequest(row));
    } catch (err) {
      console.warn('[SupplierOrdersService] getFarmerOrders exception:', err);
      return [];
    }
  }

  /**
   * Place an order from Farmer to Supplier.
   * Atomically decrements stock in `catalogue_items` and inserts into `supplier_orders`.
   */
  async placeSupplierOrder(params: PlaceSupplierOrderParams): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const { farmerId, supplierId, items, totalAmount, deliveryMethod, notes } = params;

      if (!farmerId || !supplierId) {
        return { success: false, error: 'Farmer and Supplier IDs required' };
      }
      if (!items || items.length === 0) {
        return { success: false, error: 'Order must contain at least one item' };
      }

      // 1. Verify and decrement inventory for each catalogue item
      for (const it of items) {
        if (it.catalogueItemId) {
          const { data: catItem } = await supabase
            .from('catalogue_items')
            .select('stock_qty, name')
            .eq('id', it.catalogueItemId)
            .single();

          if (catItem) {
            const currentStock = Number(catItem.stock_qty) || 0;
            if (currentStock < it.quantity) {
              return {
                success: false,
                error: `Insufficient stock for ${catItem.name}: only ${currentStock} available`,
              };
            }

            // Deduct stock
            await supabase
              .from('catalogue_items')
              .update({
                stock_qty: Math.max(0, currentStock - it.quantity),
                is_available: currentStock - it.quantity > 0,
              })
              .eq('id', it.catalogueItemId);
          }
        }
      }

      // 2. Format items JSONB array
      const formattedItems = items.map((it) => ({
        title: it.title,
        quantity: `${it.quantity} ${it.unit || 'kg'}`,
        price: it.price,
        imageUrl: it.imageUrl || null,
        catalogueItemId: it.catalogueItemId || null,
      }));

      // 3. Insert order
      const { data: newOrder, error } = await supabase
        .from('supplier_orders')
        .insert({
          farmer_id: farmerId,
          supplier_id: supplierId,
          items: formattedItems,
          total_amount: totalAmount,
          status: 'pending',
          notes: notes ? `${deliveryMethod ? `[${deliveryMethod}] ` : ''}${notes}` : (deliveryMethod || 'Standard Delivery'),
        })
        .select()
        .single();

      if (error || !newOrder) {
        return { success: false, error: error?.message || 'Failed to place order' };
      }

      return { success: true, orderId: newOrder.id };
    } catch (err: any) {
      console.error('[SupplierOrdersService] placeSupplierOrder exception:', err);
      return { success: false, error: err.message || 'Failed to place order' };
    }
  }

  /**
   * Update Supplier order status (Accept & Pack, Mark Delivered, Decline).
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: SupplierOrderStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const dbStatus = this.toDbStatus(newStatus);

      // If declining, restore stock in catalogue_items
      if (newStatus === 'Declined') {
        const { data: existing } = await supabase
          .from('supplier_orders')
          .select('items')
          .eq('id', orderId)
          .single();

        if (existing && Array.isArray(existing.items)) {
          for (const item of existing.items) {
            if (item.catalogueItemId) {
              const qtyNum = parseInt(item.quantity, 10) || 1;
              const { data: catItem } = await supabase
                .from('catalogue_items')
                .select('stock_qty')
                .eq('id', item.catalogueItemId)
                .single();

              if (catItem) {
                await supabase
                  .from('catalogue_items')
                  .update({
                    stock_qty: (Number(catItem.stock_qty) || 0) + qtyNum,
                    is_available: true,
                  })
                  .eq('id', item.catalogueItemId);
              }
            }
          }
        }
      }

      const { error } = await supabase
        .from('supplier_orders')
        .update({ status: dbStatus })
        .eq('id', orderId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update order' };
    }
  }

  /**
   * Subscribe to Realtime order changes on `supplier_orders`.
   */
  subscribeToSupplierOrders(
    filter: { supplierId?: string; farmerId?: string },
    onUpdate: (payload: any) => void
  ) {
    const channel = supabase
      .channel(`supplier-orders-${filter.supplierId || filter.farmerId || 'all'}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supplier_orders' },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ── Helper mapping ──────────────────────────────────────────────

  private mapDbRowToOrderRequest(row: any): SupplierOrderRequest {
    const { status, stepperStage } = this.toUiStatus(row.status);
    const profile = row.profiles as any;

    let parsedItems: SupplierOrderItem[] = [];
    if (Array.isArray(row.items)) {
      parsedItems = row.items.map((it: any) => {
        let img: any = require('../../assets/images/supplier_fertilizer.jpg');
        if (it.imageUrl) {
          img = typeof it.imageUrl === 'string' ? { uri: it.imageUrl } : it.imageUrl;
        } else if (it.title?.toLowerCase().includes('seed')) {
          img = require('../../assets/images/supplier_tomato_seeds.jpg');
        }
        return {
          title: it.title || 'Agri Item',
          quantity: it.quantity || '1 pack',
          price: Number(it.price) || 0,
          imageUrl: img,
          catalogueItemId: it.catalogueItemId,
        };
      });
    }

    const defaultAvatarUri =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
    const avatar: any = { uri: profile?.avatar_url || defaultAvatarUri };

    const shortId = `REQ-${row.id ? row.id.substring(0, 4).toUpperCase() : '0000'}`;

    return {
      id: shortId,
      dbId: row.id,
      farmerName: profile?.full_name || profile?.farm_name || 'Verified Farmer',
      farmerAvatar: avatar,
      supplierName: profile?.farm_name || profile?.full_name || 'Verified Supplier',
      supplierAvatar: avatar,
      district: profile?.district || profile?.province || 'Sri Lanka',
      timeAgo: this.formatTimeAgo(row.created_at),
      status,
      stepperStage,
      items: parsedItems,
      totalAmount: Number(row.total_amount) || 0,
      deliveryMethod: row.notes?.includes('[') ? row.notes.split(']')[0].replace('[', '') : 'Farm delivery',
      notes: row.notes || undefined,
      farmerId: row.farmer_id,
      supplierId: row.supplier_id,
      createdAt: row.created_at,
    };
  }

  private formatTimeAgo(isoString?: string): string {
    if (!isoString) return 'Recent';
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch {
      return 'Recent';
    }
  }
}

export const supplierOrdersService = new SupplierOrdersService();

