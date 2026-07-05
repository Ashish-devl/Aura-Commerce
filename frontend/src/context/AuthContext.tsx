import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../lib/api';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signUpWithEmail: (name: string, email: string, pass: string, role: 'admin' | 'customer') => Promise<void>;
  loginWithEmail: (email: string, pass: string, expectedRole?: 'admin' | 'customer') => Promise<void>;
  loginAsDemo: (role: 'admin' | 'customer') => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUpWithEmail: async () => {},
  loginWithEmail: async () => {},
  loginAsDemo: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and load profile from token if available
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('aura_jwt_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userProfile = await api.getProfile();
        setProfile(userProfile);
        setUser({
          uid: userProfile.id,
          email: userProfile.email,
          displayName: userProfile.name,
        });
      } catch (err) {
        console.error("Token verification failed, clearing session:", err);
        localStorage.removeItem('aura_jwt_token');
        setProfile(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signUpWithEmail = async (name: string, email: string, pass: string, role: 'admin' | 'customer') => {
    try {
      const data = await api.signup(name, email, pass, role);
      localStorage.setItem('aura_jwt_token', data.token);
      setProfile(data.user);
      setUser({
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.name,
      });
    } catch (error: any) {
      console.error("Sign up failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string, expectedRole?: 'admin' | 'customer') => {
    try {
      const data = await api.login(email, pass);
      
      // Verify role requirements
      if (expectedRole === 'admin' && data.user.role !== 'admin') {
        throw new Error(`Access Denied: This account is registered as a ${data.user.role}, not an admin.`);
      }
      
      localStorage.setItem('aura_jwt_token', data.token);
      setProfile(data.user);
      setUser({
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.name,
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginAsDemo = async (role: 'admin' | 'customer') => {
    try {
      const email = role === 'admin' ? 'admin@aura.demo' : 'customer@aura.demo';
      const password = role === 'admin' ? 'admin123' : 'customer123';
      await loginWithEmail(email, password, role);
    } catch (error: any) {
      console.error("Demo login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('aura_jwt_token');
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!localStorage.getItem('aura_jwt_token')) return;
    try {
      const userProfile = await api.getProfile();
      setProfile(userProfile);
      setUser({
        uid: userProfile.id,
        email: userProfile.email,
        displayName: userProfile.name,
      });
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signUpWithEmail,
      loginWithEmail,
      loginAsDemo,
      logout, 
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

