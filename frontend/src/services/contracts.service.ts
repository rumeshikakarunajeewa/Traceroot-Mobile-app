// src/services/contracts.service.ts
// Supabase Service for Supplier Buyback Agreements and Farmer Contracts

import { supabase } from '../lib/supabase';

export interface BuybackAgreement {
  id: string;
  agreementCode: string;
  supplierId: string;
  supplierName: string;
  supplierAvatar?: string;
  farmerId: string;
  farmerName: string;
  farmerAvatar?: string;
  farmerDistrict?: string;
  cropName: string;
  targetQuantity: number;
  unit: string;
  agreedPrice: number;
  totalCommitment: number;
  deadline?: string;
  status: 'pending' | 'active' | 'fulfilled' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface CreateBuybackAgreementParams {
  supplierId: string;
  farmerId: string;
  cropName: string;
  targetQuantity: number;
  unit?: string;
  agreedPrice: number;
  deadline?: string;
  notes?: string;
}

class ContractsService {
  /**
   * Fetch all buyback agreements belonging to a Supplier.
   */
  async getSupplierBuybacks(supplierId: string): Promise<BuybackAgreement[]> {
    try {
      if (!supplierId) return [];

      const { data, error } = await supabase
        .from('buyback_agreements')
        .select(`
          id,
          agreement_code,
          supplier_id,
          farmer_id,
          crop_name,
          target_quantity,
          unit,
          agreed_price,
          total_commitment,
          deadline,
          status,
          notes,
          created_at,
          profiles!buyback_agreements_farmer_id_fkey (
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
        console.warn('[ContractsService] Error fetching buyback agreements:', error.message);
        return [];
      }

      if (!Array.isArray(data)) return [];

      return data.map((row) => this.mapDbRowToBuyback(row, 'farmer'));
    } catch (err) {
      console.warn('[ContractsService] getSupplierBuybacks exception:', err);
      return [];
    }
  }

  /**
   * Fetch all buyback agreements belonging to a Farmer.
   */
  async getFarmerBuybacks(farmerId: string): Promise<BuybackAgreement[]> {
    try {
      if (!farmerId) return [];

      const { data, error } = await supabase
        .from('buyback_agreements')
        .select(`
          id,
          agreement_code,
          supplier_id,
          farmer_id,
          crop_name,
          target_quantity,
          unit,
          agreed_price,
          total_commitment,
          deadline,
          status,
          notes,
          created_at,
          profiles!buyback_agreements_supplier_id_fkey (
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
        console.warn('[ContractsService] Error fetching farmer buybacks:', error.message);
        return [];
      }

      if (!Array.isArray(data)) return [];

      return data.map((row) => this.mapDbRowToBuyback(row, 'supplier'));
    } catch (err) {
      console.warn('[ContractsService] getFarmerBuybacks exception:', err);
      return [];
    }
  }

  /**
   * Create a new buyback agreement from Supplier to Farmer.
   */
  async createBuybackAgreement(
    params: CreateBuybackAgreementParams
  ): Promise<{ success: boolean; agreement?: BuybackAgreement; error?: string }> {
    try {
      const {
        supplierId,
        farmerId,
        cropName,
        targetQuantity,
        unit = 'kg',
        agreedPrice,
        deadline,
        notes,
      } = params;

      if (!supplierId || !farmerId) {
        return { success: false, error: 'Supplier ID and Farmer ID required' };
      }
      if (!cropName.trim()) {
        return { success: false, error: 'Crop name is required' };
      }
      if (targetQuantity <= 0 || agreedPrice <= 0) {
        return { success: false, error: 'Quantity and price must be greater than zero' };
      }

      const { data, error } = await supabase
        .from('buyback_agreements')
        .insert({
          supplier_id: supplierId,
          farmer_id: farmerId,
          crop_name: cropName.trim(),
          target_quantity: targetQuantity,
          unit,
          agreed_price: agreedPrice,
          deadline: deadline || null,
          status: 'pending',
          notes: notes?.trim() || null,
        })
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Failed to create agreement' };
      }

      return {
        success: true,
        agreement: this.mapDbRowToBuyback(data, 'farmer'),
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create agreement' };
    }
  }

  /**
   * Update buyback agreement status (Activate, Mark Fulfilled, Cancel).
   */
  async updateBuybackStatus(
    agreementId: string,
    status: 'pending' | 'active' | 'fulfilled' | 'cancelled'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('buyback_agreements')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agreementId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update agreement' };
    }
  }

  /**
   * Subscribe to Realtime changes on `buyback_agreements`.
   */
  subscribeToBuybacks(userId: string, onUpdate: () => void) {
    const channel = supabase
      .channel(`buybacks-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'buyback_agreements' },
        (payload) => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ── Helper mapping ──────────────────────────────────────────────

  private mapDbRowToBuyback(row: any, counterparty: 'farmer' | 'supplier'): BuybackAgreement {
    const profile = row.profiles as any;
    const qty = Number(row.target_quantity) || 0;
    const price = Number(row.agreed_price) || 0;

    return {
      id: row.id,
      agreementCode: row.agreement_code || `BB-${row.id.substring(0, 4).toUpperCase()}`,
      supplierId: row.supplier_id,
      supplierName: counterparty === 'supplier' ? (profile?.full_name || 'Verified Supplier') : 'AgriSupply Co.',
      supplierAvatar: counterparty === 'supplier' ? profile?.avatar_url : undefined,
      farmerId: row.farmer_id,
      farmerName: counterparty === 'farmer' ? (profile?.full_name || profile?.farm_name || 'Registered Farmer') : 'Farmer',
      farmerAvatar: counterparty === 'farmer' ? profile?.avatar_url : undefined,
      farmerDistrict: counterparty === 'farmer' ? (profile?.district || profile?.province || 'Sri Lanka') : undefined,
      cropName: row.crop_name,
      targetQuantity: qty,
      unit: row.unit || 'kg',
      agreedPrice: price,
      totalCommitment: Number(row.total_commitment) || qty * price,
      deadline: row.deadline || undefined,
      status: (row.status as any) || 'pending',
      notes: row.notes || undefined,
      createdAt: row.created_at,
    };
  }
}

export const contractsService = new ContractsService();

