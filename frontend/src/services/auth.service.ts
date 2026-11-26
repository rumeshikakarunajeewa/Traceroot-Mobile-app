import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  UserProfile,
  UserRole,
  FarmerProfileDetails,
  BuyerProfileDetails,
  SupplierProfileDetails,
} from '../types/auth.types';
import {
  isAdminCredentials,
  isAdminIdentifier,
  getAdminProfile,
} from '../constants/adminConfig';

// Complete any pending browser auth sessions on startup
WebBrowser.maybeCompleteAuthSession();

let authStateUpdater: ((updates: any) => void) | null = null;
let activeCallbackPromise: Promise<AuthResponse> | null = null;
let lastProcessedCallback: {
  userId: string;
  timestamp: number;
  result: AuthResponse;
} | null = null;

export function registerAuthStateUpdater(updater: (updates: any) => void) {
  authStateUpdater = updater;
}

export function getAuthRedirectUri(): string {
  // 1. Web browser environment
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/auth/callback`;
    }
    return 'http://localhost:8081/auth/callback';
  }

  // 2. Mobile Expo Go environment (runs inside Expo Go client app)
  // In Expo Go, custom schemes like traceroot:// do not work because Expo Go
  // only registers intent filters for exp://.
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Boolean(
      Constants.expoConfig?.hostUri &&
      Constants.executionEnvironment !== ExecutionEnvironment.Standalone
    );

  if (isExpoGo && Constants.expoConfig?.hostUri) {
    return `exp://${Constants.expoConfig.hostUri}/--/auth/callback`;
  }

  if (isExpoGo) {
    return Linking.createURL('auth/callback', { scheme: 'exp' });
  }

  // 3. Standalone / Development Build (native Android/iOS)
  return 'traceroot://auth/callback';
}

export function parseAuthUrl(url: string): {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  errorDescription?: string;
} {
  try {
    const params: Record<string, string> = {};
    const queryIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');

    let queryString = '';
    let hashString = '';

    if (queryIndex !== -1) {
      queryString =
        hashIndex !== -1 && hashIndex > queryIndex
          ? url.substring(queryIndex + 1, hashIndex)
          : url.substring(queryIndex + 1);
    }

    if (hashIndex !== -1) {
      hashString = url.substring(hashIndex + 1);
    }

    if (queryString) {
      const qParams = new URLSearchParams(queryString);
      for (const [key, val] of qParams.entries()) {
        params[key] = val;
      }
    }

    if (hashString) {
      const hParams = new URLSearchParams(hashString);
      for (const [key, val] of hParams.entries()) {
        params[key] = val;
      }
    }

    return {
      code: params.code,
      accessToken: params.access_token,
      refreshToken: params.refresh_token,
      error: params.error,
      errorDescription: params.error_description || params.error,
    };
  } catch (err) {
    console.warn('[parseAuthUrl] Error parsing URL:', err);
    return {};
  }
}

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
  selectedRole?: UserRole;
}

export interface AuthResponse {
  user: any;
  profile: UserProfile | null;
  session: any | null;
  token: string | null;
  roleMismatch?: boolean;
  actualRole?: UserRole;
  error: string | null;
}

class AuthService {
  /**
   * Sign in with email and password, verify credentials with Bcrypt,
   * extract the user's role, and return signed JWT access token.
   */
  async signIn({ email, password, selectedRole }: SignInParams): Promise<AuthResponse> {
    try {
      // 1. Check fixed administrator authentication
      if (isAdminCredentials(email, password)) {
        const adminProfile = getAdminProfile();
        const adminUser = {
          id: adminProfile.id,
          email: adminProfile.email,
          user_metadata: {
            full_name: adminProfile.full_name,
            role: 'admin',
          },
        };

        const adminSession = {
          access_token: 'fixed-admin-access-token',
          user: adminUser,
        };

        await AsyncStorage.setItem(
          '@traceroot_admin_session',
          JSON.stringify({
            user: adminUser,
            profile: adminProfile,
            session: adminSession,
            token: adminSession.access_token,
          })
        );

        return {
          user: adminUser,
          profile: adminProfile,
          session: adminSession,
          token: adminSession.access_token,
          roleMismatch: false,
          actualRole: 'admin',
          error: null,
        };
      }

      // If the admin username/email was entered but password did not match
      if (isAdminIdentifier(email)) {
        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          error: 'Incorrect admin password. Please verify your credentials.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let friendlyMessage = error.message;
        const lower = error.message.toLowerCase();

        if (lower.includes('invalid login credentials')) {
          friendlyMessage = 'Incorrect email or password. Please verify your credentials.';
        } else if (lower.includes('email not confirmed')) {
          friendlyMessage =
            'Email not confirmed. Please confirm your email or disable "Confirm email" in Supabase settings.';
        } else if (lower.includes('rate limit')) {
          friendlyMessage =
            'Email rate limit exceeded. Please disable "Confirm email" in Supabase Dashboard (Authentication -> Providers -> Email).';
        } else if (lower.includes('network') || lower.includes('fetch')) {
          friendlyMessage = 'Unable to connect to Supabase. Please check your network connection.';
        }

        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          error: friendlyMessage,
        };
      }

      if (!data.user) {
        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          error: 'User account not found.',
        };
      }

      // Fetch user profile from public.profiles
      let profile = await this.getProfile(data.user.id);

      // Self-healing fallback: If trigger hasn't fired or profile row was missing,
      // recover the profile from the user's metadata
      if (!profile) {
        const metaRole = (data.user.user_metadata?.role as UserRole) || selectedRole || 'farmer';
        const metaName = data.user.user_metadata?.full_name || 'TraceRoot User';
        profile = {
          id: data.user.id,
          email: data.user.email || email.trim(),
          full_name: metaName,
          role: metaRole,
          phone: data.user.user_metadata?.phone || null,
          is_verified: false,
        };

        // Write the recovered profile back to public.profiles
        await supabase.from('profiles').upsert(profile);
      }

      const actualRole = profile.role;

      // Enforce strict role matching: block login if selected tab doesn't match registered role
      if (selectedRole && actualRole !== selectedRole) {
        await supabase.auth.signOut();

        const readableActual = actualRole.charAt(0).toUpperCase() + actualRole.slice(1);
        const readableSelected = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);

        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          roleMismatch: true,
          actualRole,
          error: `This account is registered as a ${readableActual}, not a ${readableSelected}. Please select "${readableActual}" above to sign in.`,
        };
      }

      return {
        user: data.user,
        profile,
        session: data.session,
        token: data.session?.access_token || null,
        roleMismatch: false,
        actualRole,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        profile: null,
        session: null,
        token: null,
        error: err.message || 'An unexpected error occurred during sign in.',
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

      // Also ensure connected role-based profile row is initialized
      try {
        if (role === 'farmer') {
          await supabase.from('farmer_profiles').upsert({
            id: data.user.id,
            farming_type: 'open_field',
            farmer_name: fullName,
          });
        } else if (role === 'buyer') {
          await supabase.from('buyer_profiles').upsert({
            id: data.user.id,
            buyer_type: 'supermarket',
            buyer_name: fullName,
            company_name: '',
          });
        } else if (role === 'supplier') {
          await supabase.from('supplier_profiles').upsert({
            id: data.user.id,
            supplier_name: fullName,
            company_name: '',
          });
        }
      } catch (roleErr) {
        console.warn('Role profile initialization error:', roleErr);
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
      // 1. Upsert into farmer_profiles
      const { error: farmerErr } = await supabase.from('farmer_profiles').upsert({
        id: userId,
        farming_type: details.farming_type,
        farm_name: details.farm_name,
        farm_location: details.farm_location,
        farm_lat: details.farm_lat,
        farm_lng: details.farm_lng,
        nic_number: details.nic_number,
        total_acreage: details.total_acreage || 1.0,
        primary_crops: details.primary_crops || [],
        description: details.description,
        updated_at: new Date().toISOString(),
      });

      if (farmerErr) {
        console.error('[AuthService] Error saving farmer_profiles:', farmerErr.message);
        return { success: false, error: farmerErr.message };
      }

      // 2. Sync farm_name and phone to base profiles table
      const profileUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (details.farm_name) profileUpdates.farm_name = details.farm_name;
      if (details.phone) profileUpdates.phone = details.phone;

      await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      return { success: true, error: null };
    } catch (err: any) {
      console.error('[AuthService] Exception in saveFarmerProfile:', err);
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
      const payload: Record<string, any> = {
        id: userId,
        buyer_type: details.buyer_type,
        company_name: details.company_name,
        address: details.address,
        br_number: details.br_number,
      };

      if (details.buyer_name !== undefined && details.buyer_name.trim() !== '') {
        payload.buyer_name = details.buyer_name.trim();
      }

      const { error } = await supabase.from('buyer_profiles').upsert(payload);

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
      const payload: Record<string, any> = {
        id: userId,
        company_name: details.company_name,
        address: details.address,
        br_number: details.br_number,
        description: details.description,
      };

      if (details.supplier_name !== undefined && details.supplier_name.trim() !== '') {
        payload.supplier_name = details.supplier_name.trim();
      }

      const { error } = await supabase.from('supplier_profiles').upsert(payload);

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
      if (userId === 'admin-fixed-id') {
        return getAdminProfile();
      }

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
   * Intelligently inspect the database to determine an existing user account's authentic role.
   * Checks public.profiles, farmer_profiles, supplier_profiles, and buyer_profiles.
   */
  async detectUserAccountRole(userId: string): Promise<UserRole | null> {
    try {
      if (userId === 'admin-fixed-id') return 'admin';

      // 1. Query public.profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role === 'admin') return 'admin';

      // 2. Check if user has an established farmer profile
      const { data: farmer } = await supabase
        .from('farmer_profiles')
        .select('id, farm_name, farming_type')
        .eq('id', userId)
        .maybeSingle();

      if (farmer && (farmer.farm_name || farmer.farming_type)) {
        return 'farmer';
      }

      // 3. Check if user has an established supplier profile
      const { data: supplier } = await supabase
        .from('supplier_profiles')
        .select('id, supplier_name, company_name')
        .eq('id', userId)
        .maybeSingle();

      if (supplier && (supplier.company_name || supplier.supplier_name)) {
        return 'supplier';
      }

      // 4. If profile.role in public.profiles is explicitly farmer or supplier, trust it
      if (profile?.role === 'farmer' || profile?.role === 'supplier') {
        return profile.role as UserRole;
      }

      // 5. Check if user has an established buyer profile
      const { data: buyer } = await supabase
        .from('buyer_profiles')
        .select('id, company_name, buyer_name')
        .eq('id', userId)
        .maybeSingle();

      if (buyer && (buyer.company_name || buyer.buyer_name)) {
        return 'buyer';
      }

      // 6. If profile exists in public.profiles, return its role
      if (profile?.role === 'buyer') {
        return 'buyer';
      }

      return null;
    } catch (err) {
      console.warn('[detectUserAccountRole] error:', err);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      await AsyncStorage.removeItem('@traceroot_admin_session');
      await AsyncStorage.removeItem('@traceroot_pending_google_role').catch(() => {});
      lastProcessedCallback = null;
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
    try {
      const adminSessionStr = await AsyncStorage.getItem('@traceroot_admin_session');
      if (adminSessionStr) {
        const parsed = JSON.parse(adminSessionStr);
        if (parsed.session) return parsed.session;
      }
    } catch {}

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
   * Sign in / Sign up with Google OAuth via Supabase and Expo WebBrowser with PKCE
   */
  async signInWithGoogle(params?: { selectedRole?: UserRole }): Promise<AuthResponse> {
    try {
      // Clear previous callback cache so new login starts clean
      lastProcessedCallback = null;

      const selectedRole = params?.selectedRole || 'buyer';
      // Persist the confirmed role to storage so it survives external browser redirect
      await AsyncStorage.setItem('@traceroot_pending_google_role', selectedRole).catch(() => {});

      const redirectTo = getAuthRedirectUri();
      console.log('🔗 [AuthService] Google OAuth redirectTo:', redirectTo, '| confirmedRole:', selectedRole);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          error: error.message || 'Failed to initiate Google sign in.',
        };
      }

      if (Platform.OS === 'web') {
        // On web, browser redirect is handled automatically
        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          error: null,
        };
      }

      const authUrl = data?.url;
      if (!authUrl) {
        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          error: 'No authorization URL received from Google auth provider.',
        };
      }

      const res = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);

      if (res.type !== 'success' || !res.url) {
        // Fallback: Check if session was already established (e.g. Android Custom Tabs dismissed on deep link)
        const activeSession = await this.getSession();
        if (activeSession?.user) {
          return await this.handleAuthCallbackUrl('', selectedRole);
        }

        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          error:
            res.type === 'cancel' || res.type === 'dismiss'
              ? 'Sign in was cancelled.'
              : 'Authentication did not complete.',
        };
      }

      // Handle the deep link callback
      return await this.handleAuthCallbackUrl(res.url, selectedRole);
    } catch (err: any) {
      console.error('[AuthService] signInWithGoogle error:', err);
      return {
        user: null,
        profile: null,
        session: null,
        token: null,
        error: err.message || 'An unexpected error occurred during Google sign in.',
      };
    }
  }

  /**
   * Handle the redirect callback URL containing the auth code or tokens
   */
  async handleAuthCallbackUrl(
    callbackUrl: string,
    selectedRole?: UserRole
  ): Promise<AuthResponse> {
    // 1. Mutex lock: if a callback handler is already running, await it to prevent duplicate execution
    if (activeCallbackPromise) {
      return await activeCallbackPromise;
    }

    // 2. Cache check: if callback was processed within the last 4 seconds, return the cached result
    if (
      lastProcessedCallback &&
      Date.now() - lastProcessedCallback.timestamp < 4000 &&
      lastProcessedCallback.result.session
    ) {
      console.log('🔗 [AuthService] Returning recently processed callback result');
      return lastProcessedCallback.result;
    }

    activeCallbackPromise = (async (): Promise<AuthResponse> => {
      try {
        // Read pending role from parameter or storage
        let confirmedRole: UserRole | null = selectedRole || null;
        if (!confirmedRole) {
          try {
            const storedRole = await AsyncStorage.getItem('@traceroot_pending_google_role');
            if (storedRole === 'farmer' || storedRole === 'buyer' || storedRole === 'supplier') {
              confirmedRole = storedRole as UserRole;
            }
          } catch (storageErr) {
            console.warn('[AuthService] Could not read pending role from storage:', storageErr);
          }
        }

        console.log('🔗 [AuthService] handleAuthCallbackUrl confirmedRole:', confirmedRole);

        const parsed = parseAuthUrl(callbackUrl);

        if (parsed.errorDescription || parsed.error) {
          return {
            user: null,
            profile: null,
            session: null,
            token: null,
            error: parsed.errorDescription || parsed.error || 'Authentication error from provider.',
          };
        }

        let session = null;
        let user = null;

        // 1. Try PKCE code exchange if code is present
        if (parsed.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(parsed.code);
          if (!error && data?.session) {
            session = data.session;
            user = data.user;
          } else if (error) {
            console.warn('[AuthService] exchangeCodeForSession failed, checking fallback:', error.message);
          }
        }

        // 2. Try Implicit flow (access_token & refresh_token from hash fragment)
        if (!session && parsed.accessToken && parsed.refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
          });
          if (!error && data?.session) {
            session = data.session;
            user = data.user;
          } else if (error) {
            console.warn('[AuthService] setSession failed, checking fallback:', error.message);
          }
        }

        // 3. Fallback: check if session is already active in Supabase client
        if (!session) {
          const currentSession = await this.getSession();
          if (currentSession?.user) {
            session = currentSession;
            user = currentSession.user;
          }
        }

        if (!session || !user) {
          return {
            user: null,
            profile: null,
            session: null,
            token: null,
            error: 'No valid authentication session or tokens found in callback.',
          };
        }

        // 4. Determine user's authentic effective role:
        // Priority 1: User explicitly confirmed their role in the modal (e.g. 'supplier' or 'farmer').
        // That explicit user choice is the primary source of truth and must never be overridden by an old database default.
        // Priority 2: If no role was confirmed or passed, detect existing account role in the database.
        // Priority 3: Default to 'buyer'.
        let effectiveRole: UserRole;
        if (confirmedRole) {
          effectiveRole = confirmedRole;
        } else {
          const existingAccountRole = await this.detectUserAccountRole(user.id);
          effectiveRole = existingAccountRole || 'buyer';
        }
        console.log(
          `🔗 [AuthService] User ${user.id} -> confirmedRole: ${confirmedRole} | effectiveRole: ${effectiveRole}`
        );

        let profile = await this.getProfile(user.id);

        const googleName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'TraceRoot User';

        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        if (!profile) {
          // Brand new user: Create initial profile with the effective role
          profile = {
            id: user.id,
            email: user.email || '',
            full_name: googleName,
            role: effectiveRole,
            avatar_url: avatarUrl,
            is_verified: true,
          };

          const { error: insertErr } = await supabase.from('profiles').upsert(profile);
          if (insertErr) {
            console.warn('[AuthService] Profile upsert error in Google callback:', insertErr.message);
          }
        } else if (profile.role !== effectiveRole) {
          // Sync profile.role in public.profiles with the user's authentic account role
          await supabase
            .from('profiles')
            .update({
              role: effectiveRole,
              updated_at: new Date().toISOString(),
              ...(avatarUrl && !profile.avatar_url ? { avatar_url: avatarUrl } : {}),
            })
            .eq('id', user.id);

          profile.role = effectiveRole;
        }

        // Ensure the corresponding role-specific profile row exists for this effective role
        try {
          if (effectiveRole === 'farmer') {
            await supabase.from('farmer_profiles').upsert({
              id: user.id,
              farming_type: 'open_field',
              farmer_name: profile?.full_name || googleName,
            });
          } else if (effectiveRole === 'buyer') {
            await supabase.from('buyer_profiles').upsert({
              id: user.id,
              buyer_type: 'supermarket',
              buyer_name: profile?.full_name || googleName,
              company_name: '',
            });
          } else if (effectiveRole === 'supplier') {
            await supabase.from('supplier_profiles').upsert({
              id: user.id,
              supplier_name: profile?.full_name || googleName,
              company_name: '',
            });
          }
        } catch (roleErr) {
          console.warn('[AuthService] Role profile sync error:', roleErr);
        }

        // Sync Supabase Auth User metadata with the effective role
        try {
          await supabase.auth.updateUser({
            data: {
              role: effectiveRole,
              full_name: profile?.full_name || googleName,
            },
          });
        } catch (metaErr) {
          console.warn('[AuthService] updateUser metadata sync error:', metaErr);
        }

        // Note: Keep @traceroot_pending_google_role in storage to guard against parallel deep-link re-renders;
        // it gets refreshed on next signInWithGoogle or cleared on signOut.

        const authResponse: AuthResponse = {
          user,
          profile: { ...profile, role: effectiveRole },
          session,
          token: session?.access_token || null,
          actualRole: effectiveRole,
          roleMismatch: false,
          error: null,
        };

        // Cache this result to prevent duplicate execution across app components
        lastProcessedCallback = {
          userId: user.id,
          timestamp: Date.now(),
          result: authResponse,
        };

        // 5. Update global authStore state immediately!
        authStateUpdater?.({
          user,
          profile: { ...profile, role: effectiveRole },
          session,
          token: session?.access_token || null,
          isLoading: false,
        });

        return authResponse;
      } catch (err: any) {
        console.error('[AuthService] handleAuthCallbackUrl error:', err);
        return {
          user: null,
          profile: null,
          session: null,
          token: null,
          error: err.message || 'Failed to complete Google authentication callback.',
        };
      } finally {
        activeCallbackPromise = null;
      }
    })();

    return await activeCallbackPromise;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
