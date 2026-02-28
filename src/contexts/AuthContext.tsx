import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import cognitoIntegrationService from '@/services/cognitoIntegrationService';

interface User {
  email: string;
  name: string;
  sub: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (tokens: { accessToken: string; idToken: string; refreshToken: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Quick check for tokens without async Cognito call
const hasTokens = (): boolean => {
  return !!(
    localStorage.getItem('accessToken') &&
    localStorage.getItem('idToken') &&
    localStorage.getItem('refreshToken')
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with quick token check to avoid loading state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(hasTokens());

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
    
    // Fallback: Force loading to false after 10 seconds
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
      if (!hasTokens()) {
        setAuthenticated(false);
      }
    }, 10000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // Quick check first
      if (!hasTokens()) {
        setAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 5000);
      });

      // Verify authentication with timeout
      const authStatus = await Promise.race([
        cognitoIntegrationService.isAuthenticated(),
        timeoutPromise
      ]) as boolean;
      
      if (!authStatus) {
        // Clear invalid tokens
        console.log('❌ Authentication failed, clearing tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        setAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      setAuthenticated(true);

      // Try to get user data
      try {
        const userData = await cognitoIntegrationService.getCurrentUser();
        setUser({
          email: userData.email,
          name: userData.name,
          sub: userData.userId,
          phone_number: userData.phoneNumber,
        });
      } catch (userError) {
        console.error('❌ Failed to get user data:', userError);
        // Clear tokens if we can't get user data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        setAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      // Clear tokens if auth check fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      setAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (tokens: { accessToken: string; idToken: string; refreshToken: string }) => {
    // Store tokens in localStorage
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('idToken', tokens.idToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    // Get user data
    try {
      const userData = await cognitoIntegrationService.getCurrentUser();
      setUser({
        email: userData.email,
        name: userData.name,
        sub: userData.userId,
        phone_number: userData.phoneNumber,
      });
      setAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    cognitoIntegrationService.signOut();
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
