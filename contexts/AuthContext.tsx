

import React, { createContext, useState, useEffect, useMemo } from 'react';
import type { User } from '../types';

// Define a compatible user type for the rest of the app
interface AppUser extends User {}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email, password) => Promise<{ error: { message: string } | null }>;
  signup: (email, password, options) => Promise<{ error: { message: string } | null }>;
  logout: () => void;
  signInWithGoogleToken: (token: string) => Promise<{ error: { message: string } | null }>;
  updateUser: (updates: Partial<AppUser>) => Promise<{ data: AppUser | null; error: { message: string } | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createMockUser = (email: string, fullName?: string): AppUser => {
    const name = fullName || email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      id: email,
      email: email,
      fullName: name,
      phone: '+39 123 456 7890',
      verification: {
        idStatus: 'unverified',
        cardStatus: 'none',
        phoneStatus: 'none',
      },
      notifications: {
        bookingConfirmations: true,
        specialOffers: true,
        newsletter: false,
      },
      paymentMethods: [
        { id: 'pm_1', type: 'card', brand: 'Visa', last4: '4242', isDefault: true },
        { id: 'pm_2', type: 'card', brand: 'Mastercard', last4: '5555', isDefault: false },
      ]
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('dr7-mock-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('dr7-mock-user');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    if (email && password) {
      const storedUser = localStorage.getItem('dr7-mock-user');
      const mockUser = storedUser ? JSON.parse(storedUser) : createMockUser(email);
      if (mockUser.email !== email) { // Simple check for a different stored user
          const newUser = createMockUser(email);
          localStorage.setItem('dr7-mock-user', JSON.stringify(newUser));
          setUser(newUser);
      } else {
        localStorage.setItem('dr7-mock-user', JSON.stringify(mockUser));
        setUser(mockUser);
      }
      return { error: null };
    }
    return { error: { message: 'Invalid email or password.' } };
  };

  const signup = async (email, password, options) => {
    const fullName = options?.data?.full_name || email.split('@')[0];
    const mockUser = createMockUser(email, fullName);
    localStorage.setItem('dr7-mock-user', JSON.stringify(mockUser));
    setUser(mockUser);
    return { error: null };
  };

  const logout = () => {
    localStorage.removeItem('dr7-mock-user');
    setUser(null);
  };
  
  const signInWithGoogleToken = async (token: string) => {
    const mockUser = createMockUser('google-user@example.com', 'Google User');
    localStorage.setItem('dr7-mock-user', JSON.stringify(mockUser));
    setUser(mockUser);
    return { error: null };
  };

  const updateUser = async (updates: Partial<AppUser>) => {
    if (user) {
        const updatedUser = { ...user, ...updates, verification: { ...user.verification, ...updates.verification }, notifications: { ...user.notifications, ...updates.notifications } };
        setUser(updatedUser);
        localStorage.setItem('dr7-mock-user', JSON.stringify(updatedUser));
        return { data: updatedUser, error: null };
    }
    return { data: null, error: { message: 'User not found' } };
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    signup,
    logout,
    signInWithGoogleToken,
    updateUser,
  }), [user, loading]);
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    {/* FIX: Corrected typo in closing tag from Auth-Context to AuthContext */}
    </AuthContext.Provider>
  );
};