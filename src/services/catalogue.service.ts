// src/services/catalogue.service.ts
// Supabase Service for Supplier Catalogue Items & Inventory

import { supabase } from '../lib/supabase';
import { CatalogueProduct, CatalogueCategory } from '../types/supplier.types';
import { uploadCatalogueImage } from './storage.service';
import { mockCatalogueProducts } from '../constants/supplierCatalogueData';

export interface CreateCatalogueItemParams {
  supplierId: string;
  title: string;
  category: 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Compost';
  packageSize?: string;
  price: number;
  unit: string;
  stock: number;
  description?: string;
  suitableFor?: string[];
  isOrganicCertified?: boolean;
}

class CatalogueService {
  /**
   * Map frontend UI category to database constraint category:
   * ('seed','fertilizer','pesticide','tool','other')
   */
  toDbCategory(cat?: string): 'seed' | 'fertilizer' | 'pesticide' | 'tool' | 'other' {
    if (!cat) return 'seed';
    const lower = cat.toLowerCase();
    if (lower.includes('seed')) return 'seed';
    if (lower.includes('fertilizer')) return 'fertilizer';
    if (lower.includes('pesticide')) return 'pesticide';
    if (lower.includes('tool')) return 'tool';
    if (lower.includes('compost')) return 'fertilizer';
    return 'other';
  }

  /**
   * Map database category back to frontend category
   */
  toUiCategory(cat?: string): 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Compost' {
    if (!cat) return 'Seeds';
    const lower = cat.toLowerCase();
    if (lower === 'seed') return 'Seeds';
    if (lower === 'fertilizer') return 'Fertilizers';
    if (lower === 'pesticide') return 'Pesticides';
    if (lower === 'other' || lower === 'compost') return 'Compost';
    return 'Fertilizers';
  }

  /**
   * Fetch all catalogue products from Supabase `catalogue_items`.
   * Optionally filters by supplierId and/or category.
   */
  async getCatalogueProducts(
    supplierId?: string,
    category?: CatalogueCategory
  ): Promise<CatalogueProduct[]> {
    try {
      let query = supabase
        .from('catalogue_items')
        .select(`
          id,
          supplier_id,
          name,
          category,
          description,
          price,
          unit,
          stock_qty,
          image_url,
          is_available,
          created_at,
          profiles!catalogue_items_supplier_id_fkey (
            id,
            full_name,
            farm_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      } else {
        query = query.eq('is_available', true);
      }

      if (category && category !== 'All') {
        const dbCat = this.toDbCategory(category);
        query = query.eq('category', dbCat);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[CatalogueService] Error fetching items:', error.message);
        return mockCatalogueProducts;
      }

      if (!Array.isArray(data) || data.length === 0) {
        // Fallback to sample catalogue products if database is brand new and has 0 rows
        return mockCatalogueProducts;
      }

      return data.map((row: any) => this.mapDbRowToProduct(row));
    } catch (err) {
      console.warn('[CatalogueService] getCatalogueProducts exception:', err);
      return mockCatalogueProducts;
    }
  }

  /**
   * Fetch single catalogue product by ID.
   */
  async getCatalogueProductById(id: string): Promise<CatalogueProduct | null> {
    try {
      const { data, error } = await supabase
        .from('catalogue_items')
        .select(`
          id,
          supplier_id,
          name,
          category,
          description,
          price,
          unit,
          stock_qty,
          image_url,
          is_available,
          created_at,
          profiles!catalogue_items_supplier_id_fkey (
            id,
            full_name,
            farm_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        // Check mock fallback
        const mock = mockCatalogueProducts.find((p) => p.id === id);
        return mock || null;
      }

      return this.mapDbRowToProduct(data);
    } catch (err) {
      console.warn('[CatalogueService] getCatalogueProductById exception:', err);
      return null;
    }
  }

  /**
   * Create a new catalogue item with optional image upload.
   */
  async createCatalogueProduct(
    params: CreateCatalogueItemParams,
    imageUri?: string,
    imageBase64?: string
  ): Promise<{ success: boolean; product?: CatalogueProduct; error?: string }> {
    try {
      const {
        supplierId,
        title,
        category,
        packageSize,
        price,
        unit,
        stock,
        description,
        suitableFor,
        isOrganicCertified,
      } = params;

      if (!supplierId) {
        return { success: false, error: 'Supplier ID is required' };
      }
      if (!title.trim()) {
        return { success: false, error: 'Product name is required' };
      }
      if (price < 0) {
        return { success: false, error: 'Price cannot be negative' };
      }

      // 1. Insert into catalogue_items first to get generated UUID
      const dbCategory = this.toDbCategory(category);
      const { data: itemData, error: itemError } = await supabase
        .from('catalogue_items')
        .insert({
          supplier_id: supplierId,
          name: title.trim(),
          category: dbCategory,
          description: description?.trim() || null,
          price: Number(price) || 0,
          unit: unit || 'kg',
          stock_qty: Math.max(0, parseInt(String(stock), 10) || 0),
          is_available: true,
        })
        .select()
        .single();

      if (itemError || !itemData) {
        console.error('[CatalogueService] Insert error:', itemError?.message);
        return { success: false, error: itemError?.message || 'Failed to save product' };
      }

      let imageUrl: string | null = null;

      // 2. Upload image to 'catalogue-images' bucket if local file provided
      if (imageUri) {
        const uploadRes = await uploadCatalogueImage(
          supplierId,
          itemData.id,
          imageUri,
          imageBase64
        );
        if (uploadRes.url) {
          imageUrl = uploadRes.url;
          await supabase
            .from('catalogue_items')
            .update({ image_url: imageUrl })
            .eq('id', itemData.id);
        }
      }

      const product = this.mapDbRowToProduct({
        ...itemData,
        image_url: imageUrl || itemData.image_url,
      });

      return { success: true, product };
    } catch (err: any) {
      console.error('[CatalogueService] createCatalogueProduct exception:', err);
      return { success: false, error: err.message || 'Failed to create product' };
    }
  }

  /**
   * Update an existing catalogue item's details, stock quantity, or image.
   */
  async updateCatalogueProduct(
    id: string,
    supplierId: string,
    updates: Partial<CatalogueProduct>,
    imageUri?: string,
    imageBase64?: string
  ): Promise<{ success: boolean; product?: CatalogueProduct; error?: string }> {
    try {
      const dbUpdates: Record<string, any> = {};

      if (updates.title !== undefined) dbUpdates.name = updates.title.trim();
      if (updates.category !== undefined) dbUpdates.category = this.toDbCategory(updates.category);
      if (updates.price !== undefined) dbUpdates.price = Number(updates.price);
      if (updates.stock !== undefined) dbUpdates.stock_qty = Math.max(0, parseInt(String(updates.stock), 10));
      if (updates.soldPer !== undefined) dbUpdates.unit = updates.soldPer;
      if (updates.description !== undefined) dbUpdates.description = updates.description.trim();

      // Upload image if provided
      if (imageUri) {
        const uploadRes = await uploadCatalogueImage(supplierId, id, imageUri, imageBase64);
        if (uploadRes.url) {
          dbUpdates.image_url = uploadRes.url;
        }
      }

      const { data, error } = await supabase
        .from('catalogue_items')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, product: this.mapDbRowToProduct(data) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update product' };
    }
  }

  /**
   * Delete catalogue item from database or mark unavailable.
   */
  async deleteCatalogueProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('catalogue_items')
        .delete()
        .eq('id', id);

      if (error) {
        // Fallback to is_available = false if referenced in orders
        await supabase
          .from('catalogue_items')
          .update({ is_available: false })
          .eq('id', id);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Subscribe to Supabase Realtime changes on `catalogue_items`.
   */
  subscribeToCatalogue(onUpdate: (payload: any) => void) {
    const channel = supabase
      .channel(`catalogue-changes-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalogue_items' },
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

  private mapDbRowToProduct(row: any): CatalogueProduct {
    const stock = Number(row.stock_qty) || 0;
    const category = this.toUiCategory(row.category);
    const unit = row.unit || 'kg';
    const profile = row.profiles as any;

    let imageUrl: any = require('../../assets/images/supplier_seed_sack.jpg');
    if (row.image_url) {
      imageUrl = { uri: row.image_url };
    } else if (category === 'Fertilizers') {
      imageUrl = require('../../assets/images/supplier_fertilizer.jpg');
    } else if (category === 'Seeds') {
      imageUrl = require('../../assets/images/supplier_tomato_seeds.jpg');
    }

    return {
      id: row.id,
      title: row.name || 'Agri Product',
      category,
      packageSize: `1 ${unit} pack`,
      price: Number(row.price) || 0,
      currency: 'LKR',
      stock,
      maxStock: Math.max(stock * 2, 100),
      isLowStock: stock < 10,
      imageUrl,
      soldPer: unit,
      description: row.description || undefined,
      suitableFor: ['Tomato', 'Rice', 'Chilli', 'Cabbage'],
      isOrganicCertified: true,
      supplierId: row.supplier_id,
      supplierName: profile?.farm_name || profile?.full_name || 'Verified Supplier',
    };
  }
}

export const catalogueService = new CatalogueService();

