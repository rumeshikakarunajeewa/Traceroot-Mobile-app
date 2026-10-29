import { useState, useEffect } from 'react';

export interface SupplierProfileData {
  name: string;
  avatarUrl: any;
  isVerified: boolean;
  district: string;
  province: string;
  coordinates: string;
  partnerTag: string;
  bio: string;
  productsCount: number;
  farmersCount: number;
  rating: number;
  trustScore: number;
  trustScoreSubtitle: string;
  phone: string;
  email: string;
  store: string;
  licence: string;
  notificationsEnabled: boolean;
  language: string;
}

export const INITIAL_SUPPLIER_PROFILE: SupplierProfileData = {
  name: 'AgriSupply Co.',
  avatarUrl: {
    uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  isVerified: true,
  district: 'Kandy District',
  province: 'Central Province, Sri Lanka',
  coordinates: '7.2735° N, 80.5965° E',
  partnerTag: 'Buy-back partner',
  bio: 'Certified seeds, organic fertilizers and irrigation kits for smallholder farms across the Central Province since 2018.',
  productsCount: 36,
  farmersCount: 218,
  rating: 4.7,
  trustScore: 94,
  trustScoreSubtitle: '98% of requests fulfilled within 48 hours',
  phone: '+94 81 222 4410',
  email: 'sales@agrisupply.lk',
  store: 'Peradeniya Rd, Kandy',
  licence: 'SUP-2210',
  notificationsEnabled: true,
  language: 'English',
};

let profileState: SupplierProfileData = { ...INITIAL_SUPPLIER_PROFILE };
const listeners = new Set<(profile: SupplierProfileData) => void>();

function notify() {
  listeners.forEach((listener) => listener({ ...profileState }));
}

export function getSupplierProfile(): SupplierProfileData {
  return { ...profileState };
}

export function updateSupplierProfile(updates: Partial<SupplierProfileData>) {
  profileState = { ...profileState, ...updates };
  notify();
}

export function useSupplierProfile(): [
  SupplierProfileData,
  (updates: Partial<SupplierProfileData>) => void
] {
  const [currentProfile, setCurrentProfile] = useState<SupplierProfileData>(profileState);

  useEffect(() => {
    const listener = (newProfile: SupplierProfileData) => setCurrentProfile(newProfile);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [currentProfile, updateSupplierProfile];
}
