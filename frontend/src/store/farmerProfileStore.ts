import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { mockFarmerProfile } from '../constants/farmerMockData';

export interface FarmerProfileData {
  id: string;
  fullName: string;
  farmerType: string;
  farmName: string;
  farmSize: string;
  location: string;
  district: string;
  province: string;
  country: string;
  coordinates: string;
  avatarUrl: string;
  bio: string;
  phone: string;
  email: string;
  registrationNo: string;
  isVerified: boolean;
  trustScore: number;
  deliveryAvailable: boolean;
  farmingExperience: string;
  farmingMethod: string;
  rating: number;
  cropsCount: number;
  ordersCount: number;
}

export interface FarmerSettingsData {
  darkMode: boolean;
  notifications: boolean;
  language: string;
}

const STORAGE_KEY_PROFILE = '@traceroot_farmer_profile_v1';
const STORAGE_KEY_SETTINGS = '@traceroot_farmer_settings_v1';

export const INITIAL_FARMER_PROFILE: FarmerProfileData = {
  id: 'farmer-001',
  fullName: 'Priya Kumari',
  farmerType: 'Greenhouse farmer',
  farmName: 'Green Valley Greenhouse',
  farmSize: '2 acres',
  location: 'Kandy District',
  district: 'Kandy District',
  province: 'Central Province',
  country: 'Sri Lanka',
  coordinates: '7.2906° N, 80.6337° E',
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  bio: 'Family-owned greenhouse since 2021. Tomatoes, cucumbers and bell peppers grown with smart-drip irrigation to save water.',
  phone: '+94 77 123 4567',
  email: 'priya.greenhouse@email.com',
  registrationNo: 'TR-4092',
  isVerified: true,
  trustScore: 92,
  deliveryAvailable: true,
  farmingExperience: '4 years',
  farmingMethod: 'Organic',
  rating: 4.8,
  cropsCount: 12,
  ordersCount: 47,
};

export const INITIAL_FARMER_SETTINGS: FarmerSettingsData = {
  darkMode: false,
  notifications: true,
  language: 'English',
};

// In-memory reactive state
let currentProfile: FarmerProfileData = { ...INITIAL_FARMER_PROFILE };
let currentSettings: FarmerSettingsData = { ...INITIAL_FARMER_SETTINGS };
let isLoaded = false;
let isSyncing = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(currentProfile));
    await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(currentSettings));
  } catch (err) {
    console.warn('Failed to persist farmer profile to AsyncStorage:', err);
  }
}

/**
 * Fetch fresh profile and related stats from Supabase
 */
export async function refreshFarmerProfile(): Promise<FarmerProfileData> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return currentProfile;
    }

    const userId = session.user.id;

    // 1. Fetch profiles and farmer_profiles
    const { data: dbProfile, error: profileErr } = await supabase
      .from('profiles')
      .select(`
        *,
        farmer_profiles (*)
      `)
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) {
      console.warn('[ProfileStore] Error fetching profile:', profileErr.message);
    }

    // 2. Fetch live crops count from harvests table
    const { count: liveCropsCount } = await supabase
      .from('harvests')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', userId);

    // 3. Fetch live orders count from orders table
    const { count: liveOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', userId);

    if (dbProfile) {
      const fp = Array.isArray(dbProfile.farmer_profiles)
        ? dbProfile.farmer_profiles[0]
        : dbProfile.farmer_profiles;

      const farmLocation = fp?.farm_location || dbProfile.district || currentProfile.location;
      const farmSizeStr = fp?.total_acreage ? `${fp.total_acreage} acres` : currentProfile.farmSize;
      const farmerTypeStr = fp?.farming_type === 'open_field' ? 'Open field farmer' : 'Greenhouse farmer';

      currentProfile = {
        id: dbProfile.id,
        fullName: dbProfile.full_name || currentProfile.fullName,
        farmerType: farmerTypeStr,
        farmName: fp?.farm_name || dbProfile.farm_name || currentProfile.farmName,
        farmSize: farmSizeStr,
        location: farmLocation,
        district: dbProfile.district || currentProfile.district,
        province: dbProfile.province || currentProfile.province,
        country: dbProfile.country || currentProfile.country || 'Sri Lanka',
        coordinates: fp?.farm_lat && fp?.farm_lng
          ? `${Number(fp.farm_lat).toFixed(4)}° N, ${Number(fp.farm_lng).toFixed(4)}° E`
          : currentProfile.coordinates,
        avatarUrl: dbProfile.avatar_url || currentProfile.avatarUrl,
        bio: dbProfile.bio ?? currentProfile.bio,
        phone: dbProfile.phone || currentProfile.phone,
        email: dbProfile.email || session.user.email || currentProfile.email,
        registrationNo: fp?.nic_number || `TR-${dbProfile.id.slice(0, 4).toUpperCase()}`,
        isVerified: Boolean(dbProfile.is_verified),
        trustScore: dbProfile.trust_score ?? currentProfile.trustScore,
        deliveryAvailable: currentProfile.deliveryAvailable ?? true,
        farmingExperience: fp?.description?.match(/Experience:\s*([^,]+)/)?.[1] || currentProfile.farmingExperience,
        farmingMethod: currentProfile.farmingMethod || 'Organic',
        rating: currentProfile.rating || 4.9,
        cropsCount: typeof liveCropsCount === 'number' ? liveCropsCount : currentProfile.cropsCount,
        ordersCount: typeof liveOrdersCount === 'number' ? liveOrdersCount : currentProfile.ordersCount,
      };

      await persist();
      notify();
    }
  } catch (err) {
    console.warn('[ProfileStore] Error refreshing farmer profile:', err);
  }

  return currentProfile;
}

export async function loadFarmerProfileFromStorage() {
  if (isLoaded) return;
  isLoaded = true;
  try {
    const savedProfile = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
    const savedSettings = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);

    if (savedProfile) {
      currentProfile = { ...currentProfile, ...JSON.parse(savedProfile) };
    }
    if (savedSettings) {
      currentSettings = { ...currentSettings, ...JSON.parse(savedSettings) };
    }
    notify();

    // Now sync with live database if online
    await refreshFarmerProfile();
  } catch (err) {
    console.warn('Error loading farmer profile:', err);
  }
}

export async function updateFarmerProfile(
  updates: Partial<FarmerProfileData>
): Promise<{ success: boolean; error: string | null }> {
  currentProfile = { ...currentProfile, ...updates };
  await persist();
  notify();

  // Sync with Supabase profiles and farmer_profiles
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: true, error: null };
    }

    const userId = session.user.id;

    // 1. Update public.profiles
    const profileUpdates: Record<string, any> = {
      full_name: currentProfile.fullName,
      phone: currentProfile.phone,
      avatar_url: currentProfile.avatarUrl,
      bio: currentProfile.bio,
      farm_name: currentProfile.farmName,
      district: currentProfile.district,
      province: currentProfile.province,
      country: currentProfile.country,
      updated_at: new Date().toISOString(),
    };

    const { error: profileErr } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (profileErr) {
      console.error('[ProfileStore] Error updating profiles:', profileErr.message);
      return { success: false, error: profileErr.message };
    }

    // 2. Upsert into public.farmer_profiles
    const acreageNum = parseFloat(currentProfile.farmSize) || 1.0;
    const farmingTypeVal = currentProfile.farmerType.toLowerCase().includes('open') ? 'open_field' : 'greenhouse';

    const { error: farmerErr } = await supabase
      .from('farmer_profiles')
      .upsert({
        id: userId,
        farm_name: currentProfile.farmName,
        farm_location: currentProfile.location,
        farming_type: farmingTypeVal,
        total_acreage: acreageNum,
        updated_at: new Date().toISOString(),
      });

    if (farmerErr) {
      console.error('[ProfileStore] Error updating farmer_profiles:', farmerErr.message);
      return { success: false, error: farmerErr.message };
    }

    return { success: true, error: null };
  } catch (e: any) {
    console.warn('[ProfileStore] Supabase profile update failed:', e);
    return { success: false, error: e.message || 'Failed to sync profile update' };
  }
}

export async function updateFarmerSettings(updates: Partial<FarmerSettingsData>): Promise<void> {
  currentSettings = { ...currentSettings, ...updates };
  await persist();
  notify();
}

export function useFarmerProfile() {
  const [, setTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadFarmerProfileFromStorage();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const refresh = async () => {
    setIsRefreshing(true);
    await refreshFarmerProfile();
    setIsRefreshing(false);
  };

  return {
    profile: currentProfile,
    settings: currentSettings,
    isRefreshing,
    refresh,
    updateProfile: updateFarmerProfile,
    updateSettings: updateFarmerSettings,
  };
}
