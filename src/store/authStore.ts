import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthStoreState {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isInitialized: boolean;
}

let currentState: AuthStoreState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isInitialized: false,
};

const listeners = new Set<(state: AuthStoreState) => void>();

function notify() {
  listeners.forEach((listener) => listener({ ...currentState }));
}

export function setAuthState(updates: Partial<AuthStoreState>) {
  currentState = { ...currentState, ...updates };
  notify();
}

/**
 * Initialize auth listener on app startup
 */
export async function initializeAuth() {
  if (currentState.isInitialized) return;

  try {
    const session = await authService.getSession();
    if (session?.user) {
      const profile = await authService.getProfile(session.user.id);
      currentState = {
        user: session.user,
        profile,
        session,
        isLoading: false,
        isInitialized: true,
      };
    } else {
      currentState = {
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isInitialized: true,
      };
    }
  } catch (err) {
    console.warn('Failed to initialize auth:', err);
    currentState = {
      ...currentState,
      isLoading: false,
      isInitialized: true,
    };
  }

  notify();

  // Listen to auth state transitions
  authService.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await authService.getProfile(session.user.id);
      setAuthState({
        user: session.user,
        profile,
        session,
        isLoading: false,
      });
    } else {
      setAuthState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
      });
    }
  });
}

/**
 * React hook to access authentication state
 */
export function useAuth() {
  const [state, setState] = useState<AuthStoreState>(currentState);

  useEffect(() => {
    const listener = (newState: AuthStoreState) => setState(newState);
    listeners.add(listener);

    if (!currentState.isInitialized) {
      initializeAuth();
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    ...state,
    isAuthenticated: !!state.user,
    role: state.profile?.role as UserRole | undefined,
    signOut: authService.signOut.bind(authService),
  };
}
