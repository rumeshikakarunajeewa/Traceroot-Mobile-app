import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupplierProfileData } from '../types/supplier.types';
import { authService } from '../services/auth.service';
import { profilesService } from '../services/profiles.service';

export { SupplierProfileData };

export const DEFAULT_EMPTY_SUPPLIER_PROFILE: SupplierProfileData = {
  id: '',
  name: ' ',
  contactName: ' ',
  avatarUrl: undefined,
  isVerified: false,
  district: ' ',
  province: ' ',
  coordinates: ' ',
  partnerTag: 'Buy-back partner',
  bio: ' ',
  productsCount: 0,
  farmersCount: 0,
  rating: 5.0,
  trustScore: 94,
  trustScoreSubtitle: 'Verified agricultural supplier',
  phone: ' ',
  email: ' ',
  store: ' ',
  licence: ' ',
  notificationsEnabled: true,
  language: 'English',
};

const STORAGE_KEY = '@traceroot_supplier_profile_v1';

let profileState: SupplierProfileData = { ...DEFAULT_EMPTY_SUPPLIER_PROFILE };
const listeners = new Set<(profile: SupplierProfileData) => void>();
let isLoaded = false;

function notify() {
  listeners.forEach((listener) => listener({ ...profileState }));
}

export function getSupplierProfile(): SupplierProfileData {
  return { ...profileState };
}

export async function loadSupplierProfile(forceRefresh = false) {
  if (isLoaded && !forceRefresh) return;
  isLoaded = true;

  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      profileState = { ...profileState, ...JSON.parse(cached) };
      notify();
    }

    const session = await authService.getSession();
    if (session?.user?.id) {
      const realProfile = await profilesService.getSupplierProfile(session.user.id);
      if (realProfile) {
        profileState = { ...profileState, ...realProfile };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profileState));
        notify();
      }
    }
  } catch (err) {
    console.warn('Error loading supplier profile:', err);
  }
}

export async function updateSupplierProfile(
  updates: Partial<SupplierProfileData>,
  localAvatarUri?: string,
  avatarBase64?: string
): Promise<{ success: boolean; avatarUrl?: string; error: string | null }> {
  profileState = { ...profileState, ...updates };
  notify();

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profileState));
    const session = await authService.getSession();
    if (session?.user?.id) {
      const res = await profilesService.updateSupplierProfile(
        session.user.id,
        updates,
        localAvatarUri,
        avatarBase64
      );
      if (res.success && res.avatarUrl) {
        profileState = { ...profileState, avatarUrl: { uri: res.avatarUrl } };
        notify();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profileState));
      }
      return res;
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Error persisting supplier profile:', err);
    return {
      success: false,
      error: err.message || 'Failed to persist supplier profile',
    };
  }
}

export function useSupplierProfile(): [
  SupplierProfileData,
  (updates: Partial<SupplierProfileData>, localAvatarUri?: string, avatarBase64?: string) => Promise<any>
] {
  const [currentProfile, setCurrentProfile] = useState<SupplierProfileData>(profileState);

  useEffect(() => {
    loadSupplierProfile();
    const listener = (newProfile: SupplierProfileData) => setCurrentProfile(newProfile);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [currentProfile, updateSupplierProfile];
}
