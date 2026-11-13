import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CitizenUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  avatar?: string;
  joinedAt: string;
  isVerified: boolean;
  reportsCount: number;
}

interface AuthContextType {
  user: CitizenUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; mobile: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginAsDemoUser: () => void;
}

const STORAGE_KEY = 'roadguard_citizen_auth';
const REMEMBER_KEY = 'roadguard_remember_me';

const DEFAULT_DEMO_USER: CitizenUser = {
  id: 'CIT-2026-9041',
  name: 'Marcus Vance',
  email: 'citizen@roadguard.ai',
  mobile: '+1 (555) 392-8172',
  joinedAt: 'January 2026',
  isVerified: true,
  reportsCount: 4,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CitizenUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read auth state from localStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600)); // realistic network latency

    if (!email || !email.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Check existing stored user or construct a session user
    const existing = localStorage.getItem(STORAGE_KEY);
    let sessionUser: CitizenUser;

    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.email.toLowerCase() === email.toLowerCase()) {
        sessionUser = parsed;
      } else {
        sessionUser = {
          id: `CIT-${Math.floor(1000 + Math.random() * 9000)}`,
          name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          email,
          mobile: '+1 (555) 481-9023',
          joinedAt: 'November 2026',
          isVerified: true,
          reportsCount: 0,
        };
      }
    } else {
      sessionUser = {
        id: `CIT-${Math.floor(1000 + Math.random() * 9000)}`,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        mobile: '+1 (555) 481-9023',
        joinedAt: 'November 2026',
        isVerified: true,
        reportsCount: 0,
      };
    }

    setUser(sessionUser);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      localStorage.removeItem(REMEMBER_KEY);
    }

    setIsLoading(false);
    return { success: true };
  };

  const signup = async (data: {
    name: string;
    email: string;
    mobile: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 750));

    if (!data.name || data.name.trim().length < 2) {
      setIsLoading(false);
      return { success: false, error: 'Full name is required (min 2 characters).' };
    }

    if (!data.email || !data.email.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'A valid email address is required.' };
    }

    if (!data.mobile || data.mobile.trim().length < 8) {
      setIsLoading(false);
      return { success: false, error: 'Please enter a valid mobile number.' };
    }

    if (!data.password || data.password.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newUser: CitizenUser = {
      id: `CIT-${Math.floor(2000 + Math.random() * 8000)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      mobile: data.mobile.trim(),
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      isVerified: true,
      reportsCount: 0,
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const loginAsDemoUser = () => {
    setUser(DEFAULT_DEMO_USER);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_USER));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

