import { useState, useCallback } from 'react';
import { getRAuthToken as getLocalRAuthToken } from '../services/api/auth/utils/getRAuthToken';
import { API_BASE_URL, STORAGE_KEYS, PREDEFINED_USERS } from '../config/reverb';

interface LoginResponse {
  data: {
    access_token: string;
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
  };
}


interface UseLoginReturn {
  isLoading: boolean;
  error: string | null;
  jwtToken: string | null;
  rAuthToken: string | null;
  user: LoginResponse['data']['user'] | null;
  login: (email: string, password: string) => Promise<boolean>;
  generateRAuthToken: () => Promise<string | null>;
  logout: () => void;
  loadStoredTokens: () => { jwtToken: string | null; rAuthToken: string | null };
}

/**
 * Custom hook for handling login and token management
 */
export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [rAuthToken, setRAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<LoginResponse['data']['user'] | null>(null);

  /**
   * Get user type path from email
   */
  const getUserTypePath = (email: string): string => {
    const predefinedUser = PREDEFINED_USERS.find(u => u.email === email);
    if (predefinedUser) {
      return predefinedUser.userType === 'admin' ? '/admin' : '';
    }
    // Default logic: if email contains 'admin', 'editor', or 'support', treat as admin
    if (email.includes('admin') || email === 'editor@redline.com' || email === 'support@redline.com') {
      return '/admin';
    }
    return '';
  };

  /**
   * Generate R-Auth token
   */
  const generateRAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getLocalRAuthToken();
      if (token) {
        localStorage.setItem(STORAGE_KEYS.R_AUTH_TOKEN, token);
        setRAuthToken(token);
        return token;
      }
      return null;
    } catch (err) {
      console.error('Failed to generate R-Auth token:', err);
      return null;
    }
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate R-Auth token first
      const rAuth = await generateRAuthToken();
      
      // Determine user type path
      const userTypePath = getUserTypePath(email);
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (rAuth) {
        headers['R-Auth'] = rAuth;
      }

      // Make login request
      const response = await fetch(`${API_BASE_URL}/api${userTypePath}/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as any).message || 'Login failed');
      }

      if (data.data?.access_token) {
        const token = data.data.access_token;
        
        // Store tokens
        localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
        
        // Update state
        setJwtToken(token);
        setUser(data.data.user);
        
        return true;
      }

      throw new Error('No access token received');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [generateRAuthToken]);

  /**
   * Logout and clear tokens
   */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.R_AUTH_TOKEN);
    setJwtToken(null);
    setRAuthToken(null);
    setUser(null);
    setError(null);
  }, []);

  /**
   * Load stored tokens from localStorage
   */
  const loadStoredTokens = useCallback(() => {
    const storedJwt = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    const storedRAuth = localStorage.getItem(STORAGE_KEYS.R_AUTH_TOKEN);
    
    if (storedJwt) {
      setJwtToken(storedJwt);
    }
    if (storedRAuth) {
      setRAuthToken(storedRAuth);
    }
    
    return { jwtToken: storedJwt, rAuthToken: storedRAuth };
  }, []);

  return {
    isLoading,
    error,
    jwtToken,
    rAuthToken,
    user,
    login,
    generateRAuthToken,
    logout,
    loadStoredTokens,
  };
}
