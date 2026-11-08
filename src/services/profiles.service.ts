import { supabase } from '../lib/supabase';
import { BuyerProfile } from '../types/buyer.types';
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
      const coordinates = buyerProfile?.coordinates?.trim() || ' ';
      const brNumber = buyerProfile?.br_number?.trim() || (buyerProfile as any)?.registration_id?.trim() || ' ';
      const bio = buyerProfile?.bio?.trim() || profile?.bio?.trim() || ' ';

      return {
        id: userId,
        fullName,
        initials: getInitials(fullName),
        isVerified: profile?.is_verified ?? false,
        avatarUrl: profile?.avatar_url || undefined,
        roleTitle: 'Wholesale Buyer',
        company,
        district,
        province,
        country,
        coordinates,
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
    localAvatarUri?: string
  ): Promise<{ success: boolean; avatarUrl?: string; error: string | null }> {
    try {
      let finalAvatarUrl = data.avatarUrl;

      // Step A: Upload avatar image if local file URI provided
      if (localAvatarUri) {
        const uploadRes = await uploadAvatar(userId, localAvatarUri);
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
        buyerUpdates.address = data.province
          ? `${data.district.trim()}, ${data.province.trim()}`
          : data.district.trim();
      }
      if (data.province !== undefined) {
        buyerUpdates.province = data.province.trim();
      }
      if (data.registrationId !== undefined) {
        buyerUpdates.br_number = data.registrationId.trim();
      }
      if (data.bio !== undefined) {
        buyerUpdates.bio = data.bio.trim();
      }

      const { error: bErr } = await supabase
        .from('buyer_profiles')
        .upsert(buyerUpdates);

      if (bErr) {
        console.error('Error updating buyer_profiles table:', bErr.message);
        throw bErr;
      }

      return {
        success: true,
        avatarUrl: finalAvatarUrl,
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to update buyer profile',
      };
    }
  }
}

export const profilesService = new ProfilesService();
