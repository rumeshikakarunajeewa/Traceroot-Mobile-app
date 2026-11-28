// src/services/contracts.service.ts
// Supabase Service for Supplier Buyback Agreements and Farmer Contracts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ActiveContractItem } from '../types/buyer.types';

export type BuybackProgramStatus = 'draft' | 'active' | 'closed';

export interface BuybackProgram {
  id: string;
  programCode: string;
  supplierId: string;
  cropName: string;
  buybackPrice: number;
  unit: string;
  expectedVolumeKg: number;
  maxFarmers: number;
  enrolledFarmers: number;
  includedInputs: string[];
  coverImageKey: string;
  coverImageUrl?: string;
  status: BuybackProgramStatus;
  notes?: string;
  createdAt: string;
}

export interface CreateBuybackProgramParams {
  supplierId: string;
  cropName: string;
  buybackPrice: number;
  unit?: string;
  expectedVolumeKg?: number;
  maxFarmers?: number;
  enrolledFarmers?: number;
  includedInputs?: string[];
  coverImageKey?: string;
  coverImageUrl?: string;
  status?: BuybackProgramStatus;
  notes?: string;
}

export interface UpdateBuybackProgramParams {
  cropName?: string;
  buybackPrice?: number;
  unit?: string;
  expectedVolumeKg?: number;
  maxFarmers?: number;
  enrolledFarmers?: number;
  includedInputs?: string[];
  coverImageKey?: string;
  coverImageUrl?: string;
  status?: BuybackProgramStatus;
  notes?: string;
}

export interface FarmerOption {
  id: string;
  fullName: string;
  district?: string;
}

export interface BuybackAgreement {
  id: string;
  agreementCode: string;
  programId?: string;
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
  programId?: string;
  cropName: string;
  targetQuantity: number;
  unit?: string;
  agreedPrice: number;
  deadline?: string;
  notes?: string;
}

class ContractsService {
  private programsStorageKey(supplierId: string) {
    return `@traceroot/buyback_programs:${supplierId}`;
  }

  private async readLocalPrograms(supplierId: string): Promise<BuybackProgram[]> {
    try {
      const raw = await AsyncStorage.getItem(this.programsStorageKey(supplierId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async writeLocalPrograms(supplierId: string, programs: BuybackProgram[]) {
    try {
      await AsyncStorage.setItem(this.programsStorageKey(supplierId), JSON.stringify(programs));
    } catch {
      // ignore storage quota errors
    }
  }

  private isMissingProgramsTableError(error: any): boolean {
    const code = String(error?.code || '');
    const msg = String(error?.message || '').toLowerCase();
    return (
      code === '42P01' ||
      code === 'PGRST205' ||
      msg.includes('buyback_programs') ||
      msg.includes('schema cache')
    );
  }

  /**
   * Fetch all Buy-Back Programs belonging to a Supplier.
   */
  async getSupplierPrograms(supplierId: string): Promise<BuybackProgram[]> {
    try {
      if (!supplierId) return [];

      const { data, error } = await supabase
        .from('buyback_programs')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) {
        if (this.isMissingProgramsTableError(error)) {
          return this.readLocalPrograms(supplierId);
        }
        console.warn('[ContractsService] Error fetching buyback programs:', error.message);
        return this.readLocalPrograms(supplierId);
      }

      if (!Array.isArray(data)) return [];
      const mapped = data.map((row) => this.mapDbRowToProgram(row));
      await this.writeLocalPrograms(supplierId, mapped);
      return mapped;
    } catch (err) {
      console.warn('[ContractsService] getSupplierPrograms exception:', err);
      return this.readLocalPrograms(supplierId);
    }
  }

  /**
   * Create a new Buy-Back Program for a Supplier.
   */
  async createBuybackProgram(
    params: CreateBuybackProgramParams
  ): Promise<{ success: boolean; program?: BuybackProgram; error?: string }> {
    try {
      const {
        supplierId,
        cropName,
        buybackPrice,
        unit = 'kg',
        expectedVolumeKg = 0,
        maxFarmers = 10,
        enrolledFarmers = 0,
        includedInputs = ['Seeds'],
        coverImageKey = 'tomato',
        coverImageUrl,
        status = 'draft',
        notes,
      } = params;

      if (!supplierId) {
        return { success: false, error: 'Supplier ID is required' };
      }
      if (!cropName.trim()) {
        return { success: false, error: 'Crop name is required' };
      }
      if (buybackPrice <= 0) {
        return { success: false, error: 'Buy-back price must be greater than zero' };
      }

      const safeMaxFarmers = Math.max(1, Math.round(maxFarmers));
      const safeEnrolled = Math.max(0, Math.min(safeMaxFarmers, Math.round(enrolledFarmers)));
      const cleanInputs =
        includedInputs.length > 0 ? includedInputs.map((i) => i.trim()).filter(Boolean) : ['Seeds'];

      const { data, error } = await supabase
        .from('buyback_programs')
        .insert({
          supplier_id: supplierId,
          crop_name: cropName.trim(),
          buyback_price: buybackPrice,
          unit,
          expected_volume_kg: Math.max(0, expectedVolumeKg),
          max_farmers: safeMaxFarmers,
          enrolled_farmers: safeEnrolled,
          included_inputs: cleanInputs,
          cover_image_key: coverImageKey,
          cover_image_url: coverImageUrl || null,
          status,
          notes: notes?.trim() || null,
        })
        .select()
        .single();

      if (error || !data) {
        if (this.isMissingProgramsTableError(error)) {
          const existing = await this.readLocalPrograms(supplierId);
          const nextNum = existing.length + 1;
          const localProgram: BuybackProgram = {
            id: `local-bbp-${Date.now()}`,
            programCode: `BB-${String(nextNum).padStart(3, '0')}`,
            supplierId,
            cropName: cropName.trim(),
            buybackPrice,
            unit,
            expectedVolumeKg: Math.max(0, expectedVolumeKg),
            maxFarmers: safeMaxFarmers,
            enrolledFarmers: safeEnrolled,
            includedInputs: cleanInputs,
            coverImageKey,
            coverImageUrl,
            status,
            notes: notes?.trim() || undefined,
            createdAt: new Date().toISOString(),
          };
          await this.writeLocalPrograms(supplierId, [localProgram, ...existing]);
          return { success: true, program: localProgram };
        }
        return { success: false, error: error?.message || 'Failed to create program' };
      }

      const program = this.mapDbRowToProgram(data);
      return { success: true, program };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create program' };
    }
  }

  /**
   * Update an existing Buy-Back Program (edit terms, publish draft, or close).
   */
  async updateBuybackProgram(
    programId: string,
    supplierId: string,
    updates: UpdateBuybackProgramParams
  ): Promise<{ success: boolean; program?: BuybackProgram; error?: string }> {
    try {
      if (programId.startsWith('local-bbp-')) {
        const existing = await this.readLocalPrograms(supplierId);
        let updatedProgram: BuybackProgram | undefined;
        const nextList = existing.map((p) => {
          if (p.id !== programId) return p;
          updatedProgram = {
            ...p,
            ...updates,
            maxFarmers:
              updates.maxFarmers !== undefined
                ? Math.max(1, Math.round(updates.maxFarmers))
                : p.maxFarmers,
            enrolledFarmers:
              updates.enrolledFarmers !== undefined
                ? Math.max(0, Math.round(updates.enrolledFarmers))
                : p.enrolledFarmers,
          };
          return updatedProgram;
        });
        await this.writeLocalPrograms(supplierId, nextList);
        return updatedProgram
          ? { success: true, program: updatedProgram }
          : { success: false, error: 'Program not found' };
      }

      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.cropName !== undefined) payload.crop_name = updates.cropName.trim();
      if (updates.buybackPrice !== undefined) payload.buyback_price = updates.buybackPrice;
      if (updates.unit !== undefined) payload.unit = updates.unit;
      if (updates.expectedVolumeKg !== undefined) {
        payload.expected_volume_kg = Math.max(0, updates.expectedVolumeKg);
      }
      if (updates.maxFarmers !== undefined) {
        payload.max_farmers = Math.max(1, Math.round(updates.maxFarmers));
      }
      if (updates.enrolledFarmers !== undefined) {
        payload.enrolled_farmers = Math.max(0, Math.round(updates.enrolledFarmers));
      }
      if (updates.includedInputs !== undefined) {
        payload.included_inputs = updates.includedInputs;
      }
      if (updates.coverImageKey !== undefined) payload.cover_image_key = updates.coverImageKey;
      if (updates.coverImageUrl !== undefined) payload.cover_image_url = updates.coverImageUrl || null;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.notes !== undefined) payload.notes = updates.notes.trim() || null;

      const { data, error } = await supabase
        .from('buyback_programs')
        .update(payload)
        .eq('id', programId)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Failed to update program' };
      }

      return { success: true, program: this.mapDbRowToProgram(data) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update program' };
    }
  }

  /**
   * Delete a Buy-Back Program.
   */
  async deleteBuybackProgram(
    programId: string,
    supplierId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (programId.startsWith('local-bbp-')) {
        const existing = await this.readLocalPrograms(supplierId);
        await this.writeLocalPrograms(
          supplierId,
          existing.filter((p) => p.id !== programId)
        );
        return { success: true };
      }

      const { error } = await supabase.from('buyback_programs').delete().eq('id', programId);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete program' };
    }
  }

  /**
   * Subscribe to Realtime changes on `buyback_programs`.
   */
  subscribeToPrograms(userId: string, onUpdate: () => void) {
    const channel = supabase
      .channel(`buyback-programs-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'buyback_programs' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Fetch registered Farmers so a supplier can link real farmers to agreements.
   */
  async getAvailableFarmers(): Promise<FarmerOption[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, farm_name, district, province')
        .eq('role', 'farmer')
        .order('full_name', { ascending: true })
        .limit(50);

      if (error || !Array.isArray(data)) return [];
      return data.map((row: any) => ({
        id: row.id,
        fullName: row.farm_name || row.full_name || 'Registered Farmer',
        district: row.district || row.province || undefined,
      }));
    } catch {
      return [];
    }
  }

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
        programId,
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

      const insertPayload: Record<string, any> = {
        supplier_id: supplierId,
        farmer_id: farmerId,
        crop_name: cropName.trim(),
        target_quantity: targetQuantity,
        unit,
        agreed_price: agreedPrice,
        deadline: deadline || null,
        status: 'pending',
        notes: notes?.trim() || null,
      };
      if (programId && !programId.startsWith('local-bbp-')) {
        insertPayload.program_id = programId;
      }

      const { data, error } = await supabase
        .from('buyback_agreements')
        .insert(insertPayload)
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

  /**
   * Fetch active cultivation / buyback agreements for a Buyer.
   */
  async getBuyerContracts(buyerId: string): Promise<ActiveContractItem[]> {
    try {
      if (!buyerId) return [];

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
          created_at,
          profiles!buyback_agreements_farmer_id_fkey (
            id,
            full_name,
            farm_name
          )
        `)
        .or(`supplier_id.eq.${buyerId},farmer_id.eq.${buyerId}`)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((d: any) => ({
        id: d.id,
        code: d.agreement_code || 'CF-' + d.id.substring(0, 4).toUpperCase(),
        cropName: d.crop_name || 'Produce',
        quantityKg: Number(d.target_quantity) || 0,
        farmerName: d.profiles?.full_name || d.profiles?.farm_name || 'Verified Farmer',
        dueDate: d.deadline ? `Due ${new Date(d.deadline).toLocaleDateString()}` : 'In Progress',
        progressPercentage: d.status === 'fulfilled' ? 100 : d.status === 'active' ? 60 : 20,
        status: d.status === 'fulfilled' ? 'Completed' : d.status === 'active' ? 'In Progress' : 'Pending',
        coverImageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
      }));
    } catch {
      return [];
    }
  }

  // ── Helper mapping ──────────────────────────────────────────────

  private mapDbRowToProgram(row: any): BuybackProgram {
    return {
      id: row.id,
      programCode: row.program_code || `BB-${String(row.id || '').substring(0, 3).toUpperCase()}`,
      supplierId: row.supplier_id,
      cropName: row.crop_name || 'Crop Program',
      buybackPrice: Number(row.buyback_price) || 0,
      unit: row.unit || 'kg',
      expectedVolumeKg: Number(row.expected_volume_kg) || 0,
      maxFarmers: Number(row.max_farmers) || 10,
      enrolledFarmers: Number(row.enrolled_farmers) || 0,
      includedInputs: Array.isArray(row.included_inputs) ? row.included_inputs : ['Seeds'],
      coverImageKey: row.cover_image_key || 'tomato',
      coverImageUrl: row.cover_image_url || undefined,
      status: (row.status as BuybackProgramStatus) || 'draft',
      notes: row.notes || undefined,
      createdAt: row.created_at,
    };
  }

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

