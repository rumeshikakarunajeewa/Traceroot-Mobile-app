import { supabase } from '../lib/supabase';
import { BuyerProfile } from '../types/buyer.types';
import { SupplierProfileData } from '../types/supplier.types';
import { uploadAvatar } from './storage.service';

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return ' ';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Normalizes input string to one of the canonical buyer types allowed by database constraint:
 * 'supermarket' | 'retailer' | 'restaurant'
 */
export function normalizeBuyerType(type?: string): 'supermarket' | 'retailer' | 'restaurant' {
  if (!type) return 'supermarket';
  const lower = type.trim().toLowerCase();
  if (lower.includes('retail')) return 'retailer';
  if (lower.includes('rest')) return 'restaurant';
  return 'supermarket';
}

class ProfilesService {
  /**
   * Fetch real buyer profile from Supabase tables:
   * - public.profiles (shared base)
   * - public.buyer_profiles (role-specific)
   * - counts from buyer_orders and contracts
   */
  async getBuyerProfile(userId: string): Promise<BuyerProfile | null> {
    try {
      // 1. Fetch base profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Error fetching profiles:', profileError.message);
      }

      // 2. Fetch buyer-specific profile
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (buyerError) {
        console.warn('Error fetching buyer_profiles:', buyerError.message);
      }

      // 3. Fetch real live order and contract counts
      const [ordersRes, contractsRes] = await Promise.all([
        supabase
          .from('buyer_orders')
          .select('id', { count: 'exact', head: true })
          .eq('buyer_id', userId),
        supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('buyer_id', userId),
      ]);

      const fullName = profile?.full_name?.trim() || ' ';
      const email = profile?.email?.trim() || ' ';
      const phone = profile?.phone?.trim() || ' ';
      const company = buyerProfile?.company_name?.trim() || ' ';
      const businessType = buyerProfile?.buyer_type?.trim() || 'supermarket';
      const district = buyerProfile?.district?.trim() || buyerProfile?.address?.trim() || ' ';
      const province = buyerProfile?.province?.trim() || ' ';
      const country = buyerProfile?.country?.trim() || 'Sri Lanka';
      const address = buyerProfile?.address?.trim() || '';
      const coordinates = buyerProfile?.coordinates?.trim() || ' ';
      const latitude =
        buyerProfile?.latitude !== undefined && buyerProfile?.latitude !== null
          ? Number(buyerProfile.latitude)
          : undefined;
      const longitude =
        buyerProfile?.longitude !== undefined && buyerProfile?.longitude !== null
          ? Number(buyerProfile.longitude)
          : undefined;
      const brNumber = buyerProfile?.br_number?.trim() || (buyerProfile as any)?.registration_id?.trim() || ' ';
      const bio = buyerProfile?.bio?.trim() || profile?.bio?.trim() || ' ';

      return {
        id: userId,
        fullName,
        initials: getInitials(fullName),
        isVerified: profile?.is_verified ?? false,
        avatarUrl: profile?.avatar_url || buyerProfile?.avatar_url || undefined,
        roleTitle: 'Wholesale Buyer',
        company,
        district,
        province,
        country,
        address,
        coordinates,
        latitude,
        longitude,
        bio,
        ordersCount: ordersRes.count || 0,
        contractsCount: contractsRes.count || 0,
        kgSourced: '0 kg',
        trustScore: buyerProfile?.trust_score ?? 85,
        trustScoreLabel: buyerProfile?.trust_score_label || 'Verified Buyer',
        trustScoreDetail: 'Standard rating for verified accounts',
        phone,
        email,
        businessType,
        registrationId: brNumber,
      };
    } catch (err: any) {
      console.warn('Error in getBuyerProfile:', err.message);
      return null;
    }
  }

  /**
   * Update real buyer profile in Supabase across both:
   * 1. public.profiles (full_name, phone, bio, avatar_url, updated_at)
   * 2. public.buyer_profiles (buyer_name, company_name, buyer_type, address, district, province, br_number, bio, updated_at)
   */
  async updateBuyerProfile(
    userId: string,
    data: Partial<BuyerProfile>,
    localAvatarUri?: string,
    avatarBase64?: string
  ): Promise<{ success: boolean; avatarUrl?: string; error: string | null }> {
    try {
      let finalAvatarUrl: string | undefined | null = data.avatarUrl;

      // Step A: Upload avatar image if local file URI provided
      if (localAvatarUri) {
        const uploadRes = await uploadAvatar(userId, localAvatarUri, avatarBase64);
        if (uploadRes.error) {
          console.error('Avatar upload failed:', uploadRes.error);
          return {
            success: false,
            error: `Failed to upload profile photo: ${uploadRes.error}`,
          };
        }
        if (uploadRes.url) {
          finalAvatarUrl = uploadRes.url;
        }
      } else if (data.avatarUrl === null) {
        finalAvatarUrl = null;
      }

      const nowIso = new Date().toISOString();

      // Step B: Update public.profiles
      const profileUpdates: Record<string, any> = {
        updated_at: nowIso,
      };

      if (data.fullName !== undefined) {
        profileUpdates.full_name = data.fullName.trim();
      }
      if (data.phone !== undefined) {
        profileUpdates.phone = data.phone.trim();
      }
      if (data.bio !== undefined) {
        profileUpdates.bio = data.bio.trim();
      }
      if (finalAvatarUrl !== undefined) {
        profileUpdates.avatar_url = finalAvatarUrl;
      }

      const { error: pErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (pErr) {
        console.error('Error updating profiles table:', pErr.message);
        throw pErr;
      }

      // Step C: Update or upsert public.buyer_profiles
      const buyerUpdates: Record<string, any> = {
        id: userId,
        updated_at: nowIso,
      };

      if (data.fullName !== undefined) {
        buyerUpdates.buyer_name = data.fullName.trim();
      }
      if (data.company !== undefined) {
        buyerUpdates.company_name = data.company.trim();
      }
      if (data.businessType !== undefined) {
        buyerUpdates.buyer_type = normalizeBuyerType(data.businessType);
      }
      if (data.district !== undefined) {
        buyerUpdates.district = data.district.trim();
        profileUpdates.district = data.district.trim();
        if (data.address === undefined) {
          buyerUpdates.address = data.province
            ? `${data.district.trim()}, ${data.province.trim()}`
            : data.district.trim();
        }
      }
      if (data.province !== undefined) {
        buyerUpdates.province = data.province.trim();
        profileUpdates.province = data.province.trim();
      }
      if (data.address !== undefined) {
        buyerUpdates.address = data.address.trim();
      }
      if (data.coordinates !== undefined) {
        buyerUpdates.coordinates = data.coordinates.trim();
      }
      if (data.latitude !== undefined) {
        buyerUpdates.latitude = data.latitude;
      }
      if (data.longitude !== undefined) {
        buyerUpdates.longitude = data.longitude;
      }
      if (data.registrationId !== undefined) {
        buyerUpdates.br_number = data.registrationId.trim();
      }
      if (data.bio !== undefined) {
        buyerUpdates.bio = data.bio.trim();
      }
      if (finalAvatarUrl !== undefined) {
        buyerUpdates.avatar_url = finalAvatarUrl;
      }

      let { error: bErr } = await supabase
        .from('buyer_profiles')
        .upsert(buyerUpdates);

      // Schema cache safeguard: if migration 016 hasn't been run yet, retry without latitude/longitude
      if (bErr && (bErr.message.includes('latitude') || bErr.message.includes('longitude'))) {
        console.warn(
          'buyer_profiles missing latitude/longitude columns in schema cache; retrying update with coordinates string:',
          bErr.message
        );
        delete buyerUpdates.latitude;
        delete buyerUpdates.longitude;
        const retry = await supabase
          .from('buyer_profiles')
          .upsert(buyerUpdates);
        bErr = retry.error;
      }

      if (bErr) {
        console.error('Error updating buyer_profiles table:', bErr.message);
        throw bErr;
      }

      return {
        success: true,
        avatarUrl: finalAvatarUrl || undefined,
        error: null,
      };
    } catch (err: any) {
      const msg = err.message || '';
      let friendlyError = msg;
      if (msg.includes('infinite recursion')) {
        friendlyError =
          'Database RLS error: Please run the policy fix script in Supabase SQL Editor to remove recursive policies on profiles.';
      }
      return {
        success: false,
        error: friendlyError || 'Failed to update buyer profile',
      };
    }
  }

  /**
   * Fetch real supplier profile from Supabase tables:
   * - public.profiles (shared base)
   * - public.supplier_profiles (role-specific)
   * - live counts from catalogue_items and supplier_orders
   */
  async getSupplierProfile(userId: string): Promise<SupplierProfileData | null> {
    try {
      // 1. Fetch base profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Error fetching profiles for supplier:', profileError.message);
      }

      // 2. Fetch supplier-specific profile
      const { data: supplierProfile, error: supplierError } = await supabase
        .from('supplier_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (supplierError) {
        console.warn('Error fetching supplier_profiles:', supplierError.message);
      }

      // 3. Fetch real live counts from catalogue_items and supplier_orders
      const [productsRes, ordersRes] = await Promise.all([
        supabase
          .from('catalogue_items')
          .select('id', { count: 'exact', head: true })
          .eq('supplier_id', userId),
        supabase
          .from('supplier_orders')
          .select('farmer_id')
          .eq('supplier_id', userId),
      ]);

      const distinctFarmers = new Set(
        ordersRes.data?.map((o: any) => o.farmer_id).filter(Boolean) || []
      ).size;

      const companyName = supplierProfile?.company_name?.trim() || ' ';
      const contactName = profile?.full_name?.trim() || supplierProfile?.supplier_name?.trim() || ' ';
      const email = profile?.email?.trim() || ' ';
      const phone = profile?.phone?.trim() || ' ';
      const store = supplierProfile?.address?.trim() || ' ';
      const licence = supplierProfile?.br_number?.trim() || ' ';
      const bio = supplierProfile?.description?.trim() || profile?.bio?.trim() || ' ';
      const district = supplierProfile?.district?.trim() || store;
      const province = supplierProfile?.province?.trim() || ' ';
      const category = supplierProfile?.category || 'Buy-back partner';
      const rating = supplierProfile?.rating ? Number(supplierProfile.rating) : 5.0;

      const avatarUrl = profile?.avatar_url
        ? { uri: profile.avatar_url }
        : undefined;

      return {
        id: userId,
        name: companyName !== ' ' ? companyName : contactName,
        contactName,
        avatarUrl,
        isVerified: profile?.is_verified ?? false,
        district,
        province,
        coordinates: ' ',
        partnerTag: category,
        bio,
        productsCount: productsRes.count || 0,
        farmersCount: distinctFarmers,
        rating,
        trustScore: 94,
        trustScoreSubtitle: 'Verified agricultural supplier',
        phone,
        email,
        store,
        licence,
        notificationsEnabled: true,
        language: 'English',
      };
    } catch (err: any) {
      console.warn('Error in getSupplierProfile:', err.message);
      return null;
    }
  }

  /**
   * Update real supplier profile in Supabase across both:
   * 1. public.profiles (full_name, phone, bio, avatar_url, updated_at)
   * 2. public.supplier_profiles (supplier_name, company_name, address, br_number, description, updated_at)
   */
  async updateSupplierProfile(
    userId: string,
    data: Partial<SupplierProfileData>,
    localAvatarUri?: string,
    avatarBase64?: string
  ): Promise<{ success: boolean; avatarUrl?: string; error: string | null }> {
    try {
      let finalAvatarUrl: string | undefined = undefined;

      if (typeof data.avatarUrl === 'string') {
        finalAvatarUrl = data.avatarUrl;
      } else if (data.avatarUrl && typeof data.avatarUrl === 'object' && data.avatarUrl.uri) {
        finalAvatarUrl = data.avatarUrl.uri;
      }

      // Step A: Upload avatar image if local file URI provided
      if (localAvatarUri) {
        const uploadRes = await uploadAvatar(userId, localAvatarUri, avatarBase64);
        if (uploadRes.error) {
          console.warn('Avatar upload failed, proceeding with other profile fields:', uploadRes.error);
        } else if (uploadRes.url) {
          finalAvatarUrl = uploadRes.url;
        }
      }

      const nowIso = new Date().toISOString();

      // Step B: Update public.profiles
      const profileUpdates: Record<string, any> = {
        updated_at: nowIso,
      };

      if (data.contactName !== undefined && data.contactName.trim() !== '') {
        profileUpdates.full_name = data.contactName.trim();
      } else if (data.name !== undefined && data.name.trim() !== '') {
        profileUpdates.full_name = data.name.trim();
      }

      if (data.phone !== undefined) {
        profileUpdates.phone = data.phone.trim();
      }
      if (data.bio !== undefined) {
        profileUpdates.bio = data.bio.trim();
      }
      if (finalAvatarUrl !== undefined) {
        profileUpdates.avatar_url = finalAvatarUrl;
      }

      const { error: pErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (pErr) {
        console.error('Error updating profiles table for supplier:', pErr.message);
        throw pErr;
      }

      // Step C: Update or upsert public.supplier_profiles
      const supplierUpdates: Record<string, any> = {
        id: userId,
        updated_at: nowIso,
      };

      if (data.contactName !== undefined && data.contactName.trim() !== '') {
        supplierUpdates.supplier_name = data.contactName.trim();
      } else if (data.name !== undefined && data.name.trim() !== '') {
        supplierUpdates.supplier_name = data.name.trim();
      }

      if (data.name !== undefined) {
        supplierUpdates.company_name = data.name.trim();
      }
      if (data.store !== undefined) {
        supplierUpdates.address = data.store.trim();
      }
      if (data.licence !== undefined) {
        supplierUpdates.br_number = data.licence.trim();
      }
      if (data.bio !== undefined) {
        supplierUpdates.description = data.bio.trim();
      }
      if (data.district !== undefined) {
        supplierUpdates.district = data.district.trim();
      }

      const { error: sErr } = await supabase
        .from('supplier_profiles')
        .upsert(supplierUpdates);

      if (sErr) {
        console.error('Error updating supplier_profiles table:', sErr.message);
        throw sErr;
      }

      return {
        success: true,
        avatarUrl: finalAvatarUrl,
        error: null,
      };
    } catch (err: any) {
      const msg = err.message || '';
      let friendlyError = msg;
      if (msg.includes('infinite recursion')) {
        friendlyError =
          'Database RLS error: Please run the policy fix script in Supabase SQL Editor to remove recursive policies on profiles.';
      }
      return {
        success: false,
        error: friendlyError || 'Failed to update supplier profile',
      };
    }
  }
}

export const profilesService = new ProfilesService();
