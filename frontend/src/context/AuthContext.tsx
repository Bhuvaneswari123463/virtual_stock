import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiRequest,
  setAccessToken,
  setOnSessionExpired,
} from '@/lib/apiClient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'trader' | 'admin';
}

export interface PortfolioSummary {
  cashBalancePaise: number;
  cashBalanceFormatted: string;
}

interface AuthResponseData {
  user: User;
  accessToken: string;
  portfolio: PortfolioSummary;
}

interface ProfileResponseData {
  id: string;
  email: string;
  fullName: string;
  role: 'trader' | 'admin';
  portfolio?: PortfolioSummary;
}

interface ResetResponseData {
  message: string;
  devResetToken?: string;
}

interface AuthContextType {
  user: User | null;
  portfolio: PortfolioSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; devResetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Handle session expiration callback from apiClient
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setPortfolio(null);
      setAccessToken(null);
      setSessionExpired(true);
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await apiRequest<ProfileResponseData>('/auth/me');
      if (res.success && res.data) {
        setUser({
          id: res.data.id,
          email: res.data.email,
          fullName: res.data.fullName,
          role: res.data.role,
        });
        if (res.data.portfolio) {
          setPortfolio(res.data.portfolio);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Silent refresh on boot using HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const refreshRes = await apiRequest<AuthResponseData>('/auth/refresh', {
          method: 'POST',
          skipAuth: true,
          skipRefreshRetry: true,
        });

        if (refreshRes.success && refreshRes.data && isMounted) {
          setAccessToken(refreshRes.data.accessToken);
          setUser(refreshRes.data.user);
          // Fetch full profile and portfolio
          const profileRes = await apiRequest<ProfileResponseData>('/auth/me');
          if (profileRes.success && profileRes.data?.portfolio && isMounted) {
            setPortfolio(profileRes.data.portfolio);
          }
        }
      } catch {
        // No active session or cookie expired
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setSessionExpired(false);
    try {
      const res = await apiRequest<AuthResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      if (res.success && res.data) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        setPortfolio(res.data.portfolio);
        return { success: true };
      }

      return {
        success: false,
        error: res.error?.message || 'Login failed. Please check your credentials.',
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error occurred. Please try again.',
      };
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setSessionExpired(false);
    try {
      const res = await apiRequest<AuthResponseData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password }),
        skipAuth: true,
      });

      if (res.success && res.data) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        setPortfolio(res.data.portfolio);
        return { success: true };
      }

      return {
        success: false,
        error: res.error?.message || 'Registration failed.',
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error occurred. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue cleanup
    } finally {
      setAccessToken(null);
      setUser(null);
      setPortfolio(null);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const res = await apiRequest<ResetResponseData>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        skipAuth: true,
      });

      return {
        success: res.success,
        message: res.data?.message || 'Password reset request submitted.',
        devResetToken: res.data?.devResetToken,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to submit password reset request.',
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await apiRequest<ResetResponseData>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
        skipAuth: true,
      });

      if (res.success) {
        return {
          success: true,
          message: res.data?.message || 'Password reset successfully.',
        };
      }

      return {
        success: false,
        error: res.error?.message || 'Failed to reset password.',
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error occurred.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        portfolio,
        isAuthenticated: !!user,
        isLoading,
        sessionExpired,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
