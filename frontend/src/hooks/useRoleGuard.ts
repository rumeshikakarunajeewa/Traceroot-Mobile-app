import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../store/authStore';
import { UserRole } from '../types/auth.types';

/**
 * Enforces fixed-role route isolation: if an authenticated user's fixed
 * profile role does not match the current role section, redirects them
 * immediately to their registered role's dashboard.
 */
export function useRoleGuard(expectedRole: UserRole) {
  const { isInitialized, isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !role) return;
    if (role !== expectedRole) {
      if (role === 'farmer') router.replace('/(farmer)' as any);
      else if (role === 'buyer') router.replace('/(buyer)' as any);
      else if (role === 'supplier') router.replace('/(supplier)' as any);
      else if (role === 'admin') router.replace('/(admin)' as any);
    }
  }, [isInitialized, isAuthenticated, role, expectedRole]);
}
