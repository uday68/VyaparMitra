import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  language: string;
  location: string;
  type: 'vendor' | 'customer';
  qrCode?: string;
  voiceProfile?: any;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  userType: 'vendor' | 'customer';
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  language: string;
  location: string;
  userType: 'vendor' | 'customer';
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = '/api';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokens;

  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('vyapar-mitra-tokens');
        const storedUser = localStorage.getItem('vyapar-mitra-user');

        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);

          // Verify token is still valid by fetching profile
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${parsedTokens.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const { data } = await response.json();
            setUser(data);
            setTokens(parsedTokens);
          } else {
            // Token expired or invalid, try refresh
            await refreshTokenInternal(parsedTokens.refreshToken);
          }
        }
      } catch (error) {
        console.error('Failed to load stored auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const clearAuthData = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('vyapar-mitra-tokens');
    localStorage.removeItem('vyapar-mitra-user');
  };

  const storeAuthData = (userData: User, tokenData: AuthTokens) => {
    setUser(userData);
    setTokens(tokenData);
    localStorage.setItem('vyapar-mitra-user', JSON.stringify(userData));
    localStorage.setItem('vyapar-mitra-tokens', JSON.stringify(tokenData));
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: credentials.email,
          password: credentials.password,
          userType: credentials.userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      storeAuthData(data.data.user, data.data.tokens);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      storeAuthData(data.data.user, data.data.tokens);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokenInternal = async (refreshTokenValue: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      const newTokens = {
        ...tokens!,
        accessToken: data.data.accessToken,
      };

      setTokens(newTokens);
      localStorage.setItem('vyapar-mitra-tokens', JSON.stringify(newTokens));
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      throw error;
    }
  };

  const refreshToken = async () => {
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    await refreshTokenInternal(tokens.refreshToken);
  };

  const logout = async () => {
    try {
      if (tokens?.accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }

      const updatedUser = data.data;
      setUser(updatedUser);
      localStorage.setItem('vyapar-mitra-user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}