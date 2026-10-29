export type UserRole = 'farmer' | 'buyer' | 'supplier' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
  created_at?: string;
}

export interface FarmerProfileDetails {
  farming_type: 'greenhouse' | 'open_field';
  farm_name?: string;
  farm_location?: string;
  farm_lat?: number;
  farm_lng?: number;
  nic_number?: string;
  description?: string;
}

export interface BuyerProfileDetails {
  buyer_type: 'supermarket' | 'retailer' | 'restaurant';
  company_name: string;
  address?: string;
  br_number?: string;
}

export interface SupplierProfileDetails {
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
