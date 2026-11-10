export type UserRole = 'farmer' | 'buyer' | 'supplier' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
  bio?: string | null;
  farm_name?: string | null;
  district?: string | null;
  province?: string | null;
  country?: string | null;
  trust_score?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface FarmerProfileDetails {
  farming_type: 'greenhouse' | 'open_field';
  farmer_name?: string;
  farm_name?: string;
  farm_location?: string;
  farm_lat?: number;
  farm_lng?: number;
  nic_number?: string;
  total_acreage?: number;
  primary_crops?: string[];
  description?: string;
  phone?: string;
}

export interface BuyerProfileDetails {
  buyer_type: 'supermarket' | 'retailer' | 'restaurant';
  buyer_name?: string;
  company_name: string;
  address?: string;
  br_number?: string;
}

export interface SupplierProfileDetails {
  supplier_name?: string;
  company_name: string;
  address?: string;
  br_number?: string;
  description?: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  error: string | null;
}
