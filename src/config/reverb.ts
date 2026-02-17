import type { ReverbConfig, AuthHeaders } from '../types/reverb';

/**
 * Reverb configuration from environment variables
 * Matches the configuration from c:\laragon\.env
 */
export const reverbConfig: ReverbConfig = {
  appKey: import.meta.env.VITE_REVERB_APP_KEY || 'hhqyhg6am5vugdnkodtl',
  host: import.meta.env.VITE_REVERB_HOST || 'api.redstrim.com',
  port: parseInt(import.meta.env.VITE_REVERB_PORT || '443'),
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https' || true,
  enabledTransports: ['ws', 'wss'],
  cluster: import.meta.env.VITE_REVERB_CLUSTER || 'mt1',
  authEndpoint: import.meta.env.VITE_AUTH_ENDPOINT || 'https://api.redstrim.com/api/admin/broadcasting/auth',
  debug: import.meta.env.VITE_DEBUG === 'true' || true,
};

/**
 * Authentication headers - generated after login
 */
export const getAuthHeaders = (jwtToken: string, rAuthToken: string): AuthHeaders => ({
  Authorization: `Bearer ${jwtToken}`,
  'R-Auth': rAuthToken,
  Accept: 'application/json',
});

/**
 * Storage keys for tokens
 */
export const STORAGE_KEYS = {
  JWT_TOKEN: 'scramble_jwt_token',
  R_AUTH_TOKEN: 'r_auth_token',
  DEVICE_TYPE: 'scramble_device_type',
} as const;

/**
 * Predefined users for login form
 */
export const PREDEFINED_USERS = [
  { email: 'super.admin@redline.com', label: 'Super Admin', userType: 'admin' },
  { email: 'editor@redline.com', label: 'Editor (have to assign role to login)', userType: 'admin' },
  { email: 'user@redline.com', label: 'User', userType: 'user' },
  { email: 'support@redline.com', label: 'Support (have to assign role to login)', userType: 'admin' },
] as const;

/**
 * Default password
 */
export const DEFAULT_PASSWORD = 'pass@123';

/**
 * API base URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.redstrim.com';
