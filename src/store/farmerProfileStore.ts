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

    // Optionally sync with Supabase profiles table if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (dbProfile) {
        currentProfile = {
          ...currentProfile,
          id: dbProfile.id || currentProfile.id,
          fullName: dbProfile.full_name || currentProfile.fullName,
          phone: dbProfile.phone || currentProfile.phone,
          avatarUrl: dbProfile.avatar_url || currentProfile.avatarUrl,
          bio: dbProfile.bio || currentProfile.bio,
          farmName: dbProfile.farm_name || currentProfile.farmName,
          district: dbProfile.district || currentProfile.district,
          province: dbProfile.province || currentProfile.province,
          location: dbProfile.district ? `${dbProfile.district}` : currentProfile.location,
        };
        await persist();
        notify();
      }
    }
  } catch (err) {
    console.warn('Error loading farmer profile:', err);
  }
}

export async function updateFarmerProfile(updates: Partial<FarmerProfileData>): Promise<void> {
  currentProfile = { ...currentProfile, ...updates };
  await persist();
  notify();

  // Also update Supabase in background
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({
          full_name: currentProfile.fullName,
          phone: currentProfile.phone,
          avatar_url: currentProfile.avatarUrl,
          bio: currentProfile.bio,
          farm_name: currentProfile.farmName,
          district: currentProfile.district,
          province: currentProfile.province,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);
    }
  } catch (e) {
    console.warn('Supabase profile update sync skipped/failed:', e);
  }
}

export async function updateFarmerSettings(updates: Partial<FarmerSettingsData>): Promise<void> {
  currentSettings = { ...currentSettings, ...updates };
  await persist();
  notify();
}

export function useFarmerProfile() {
  const [, setTick] = useState(0);

  useEffect(() => {
    loadFarmerProfileFromStorage();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    profile: currentProfile,
    settings: currentSettings,
    updateProfile: updateFarmerProfile,
    updateSettings: updateFarmerSettings,
  };
}

