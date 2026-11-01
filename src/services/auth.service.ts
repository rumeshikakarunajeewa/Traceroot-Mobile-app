import { supabase } from '../lib/supabase';
import {
  UserProfile,
  UserRole,
  FarmerProfileDetails,
  BuyerProfileDetails,
  SupplierProfileDetails,
} from '../types/auth.types';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: any;
  profile: UserProfile | null;
  session: any | null;
  token: string | null;
  error: string | null;
}

class AuthService {
  /**
   * Sign in with email and password, then fetch the user's role profile
   */
  async signIn({ email, password }: SignInParams): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let friendlyMessage = error.message;
        if (error.message.toLowerCase().includes('rate limit')) {
          friendlyMessage =
            'Email rate limit exceeded. Please disable "Confirm email" in Supabase Dashboard (Authentication -> Providers -> Email) to allow instant testing.';
        }
        return { user: null, profile: null, session: null, token: null, error: friendlyMessage };
      }

      if (!data.user) {
        return { user: null, profile: null, session: null, token: null, error: 'User not found' };
      }

      // Fetch user profile to get their role and details
      const profile = await this.getProfile(data.user.id);

      return {
        user: data.user,
        profile,
        session: data.session,
        token: data.session?.access_token || null,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        profile: null,
        session: null,
        token: null,
        error: err.message || 'An unexpected error occurred during sign in',
      };
    }
  }

  /**
   * Sign up a new user with bcrypt password hashing and JWT issuance
   */
  async signUp({
    email,
    password,
    fullName,
    role,
    phone,
  }: SignUpParams): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone: phone || null,
          },
        },
      });

      if (error) {
        let friendlyMessage = error.message;
        if (error.message.toLowerCase().includes('rate limit')) {
          friendlyMessage =
            'Email rate limit exceeded. Please disable "Confirm email" in Supabase Dashboard (Authentication -> Providers -> Email) to allow instant testing.';
        }
        return { user: null, profile: null, session: null, token: null, error: friendlyMessage };
      }

      if (!data.user) {
        return { user: null, profile: null, session: null, token: null, error: 'Failed to create user account' };
      }

      // Fallback manual profile upsert in case trigger is pending
      const newProfile: UserProfile = {
        id: data.user.id,
        email: email.trim(),
        full_name: fullName,
        role,
        phone: phone || null,
        is_verified: false,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(newProfile);

      if (profileError) {
        console.warn('Profile creation error (trigger may handle it):', profileError.message);
      }

      return {
        user: data.user,
        profile: newProfile,
        session: data.session,
        token: data.session?.access_token || null,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        profile: null,
        session: null,
        token: null,
        error: err.message || 'An unexpected error occurred during sign up',
      };
    }
  }

  /**
   * Save extra details for farmer registration
   */
  async saveFarmerProfile(
    userId: string,
    details: FarmerProfileDetails
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('farmer_profiles').upsert({
        id: userId,
        farming_type: details.farming_type,
        farm_name: details.farm_name,
        farm_location: details.farm_location,
        farm_lat: details.farm_lat,
        farm_lng: details.farm_lng,
        nic_number: details.nic_number,
        description: details.description,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save farmer profile' };
    }
  }

  /**
   * Save extra details for buyer registration
   */
  async saveBuyerProfile(
    userId: string,
    details: BuyerProfileDetails
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('buyer_profiles').upsert({
        id: userId,
        buyer_type: details.buyer_type,
        company_name: details.company_name,
        address: details.address,
        br_number: details.br_number,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save buyer profile' };
    }
  }

  /**
   * Save extra details for supplier registration
   */
  async saveSupplierProfile(
    userId: string,
    details: SupplierProfileDetails
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('supplier_profiles').upsert({
        id: userId,
        company_name: details.company_name,
        address: details.address,
        br_number: details.br_number,
        description: details.description,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save supplier profile' };
    }
  }

  /**
   * Get user profile by ID from public.profiles
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as UserProfile;
    } catch {
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to sign out' };
    }
  }

  /**
   * Get current active session
   */
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Get the current user's signed JWT access token
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
  }

  /**
   * Decode the JWT token payload (for inspection of claims, exp, sub, role)
   */
  decodeJwt(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // Base64Url decode payload
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
