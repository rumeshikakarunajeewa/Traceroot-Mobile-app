import { supabase } from '../lib/supabase';
import { BuyerProfile } from '../types/buyer.types';

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return ' ';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

class ProfilesService {
  /**
   * Fetch real buyer profile from Supabase tables:
   * - public.profiles
   * - public.buyer_profiles
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
      const businessType = buyerProfile?.buyer_type?.trim() || ' ';
      const address = buyerProfile?.address?.trim() || ' ';
      const brNumber = buyerProfile?.br_number?.trim() || ' ';

      return {
        id: userId,
        fullName,
        initials: getInitials(fullName),
        isVerified: profile?.is_verified ?? false,
        avatarUrl: profile?.avatar_url || undefined,
        roleTitle: 'Wholesale Buyer',
        company,
        district: address,
        province: ' ',
        country: 'Sri Lanka',
        coordinates: ' ',
        bio: ' ',
        ordersCount: ordersRes.count || 0,
        contractsCount: contractsRes.count || 0,
        kgSourced: '0 kg',
        trustScore: 85,
        trustScoreLabel: 'Verified Buyer',
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
   * Update real buyer profile in Supabase
   */
  async updateBuyerProfile(
    userId: string,
    data: Partial<BuyerProfile>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1. Update public.profiles
      const profileUpdates: Record<string, any> = {};
      if (data.fullName !== undefined) {
        profileUpdates.full_name = data.fullName.trim();
      }
      if (data.phone !== undefined) {
        profileUpdates.phone = data.phone.trim();
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: pErr } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (pErr) throw pErr;
      }

      // 2. Update or upsert public.buyer_profiles
      const buyerUpdates: Record<string, any> = { id: userId };
      if (data.company !== undefined) {
        buyerUpdates.company_name = data.company.trim();
      }
      if (data.businessType !== undefined) {
        buyerUpdates.buyer_type = data.businessType.trim();
      }
      if (data.district !== undefined) {
        buyerUpdates.address = data.district.trim();
      }
      if (data.registrationId !== undefined) {
        buyerUpdates.br_number = data.registrationId.trim();
      }

      const { error: bErr } = await supabase
        .from('buyer_profiles')
        .upsert(buyerUpdates);

      if (bErr) throw bErr;

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  }
}

export const profilesService = new ProfilesService();

