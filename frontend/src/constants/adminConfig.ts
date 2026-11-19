import { UserProfile } from '../types/auth.types';

export const ADMIN_CONFIG = {
  username: 'admin',
  email: 'admin@traceroot.com',
  password: 'Admin@123',
};

/**
 * Checks whether the given identifier (username or email) and password
 * match the fixed admin credentials.
 */
export function isAdminCredentials(identifier: string, pass: string): boolean {
  if (!identifier || !pass) return false;
  const cleanId = identifier.trim().toLowerCase();
  const isUserMatch =
    cleanId === ADMIN_CONFIG.username.toLowerCase() ||
    cleanId === ADMIN_CONFIG.email.toLowerCase();

  return isUserMatch && pass === ADMIN_CONFIG.password;
}

/**
 * Checks whether the identifier is specifically an admin identifier
 */
export function isAdminIdentifier(identifier: string): boolean {
  if (!identifier) return false;
  const cleanId = identifier.trim().toLowerCase();
  return (
    cleanId === ADMIN_CONFIG.username.toLowerCase() ||
    cleanId === ADMIN_CONFIG.email.toLowerCase()
  );
}

/**
 * Generates the mock UserProfile object for the fixed administrator
 */
export function getAdminProfile(): UserProfile {
  return {
    id: 'admin-fixed-id',
    role: 'admin',
    full_name: 'Administrator',
    email: ADMIN_CONFIG.email,
    phone: null,
    avatar_url: null,
    is_verified: true,
    created_at: new Date().toISOString(),
  };
}

