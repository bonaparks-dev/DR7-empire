
import React, { createContext, useState, useEffect, useMemo } from 'react';
import type { User, PaymentMethod, IDDocument } from '../types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, fullName?: string) => void;
  logout: () => void;
  signup: (email: string, fullName: string) => void;
  updateUser: (updatedData: Partial<User>) => void;
  loginWithGoogle: () => void;
  updateMembership: (tierId: string, billingCycle: 'monthly' | 'annually') => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for an existing session
    try {
      const storedUser = localStorage.getItem('dr7-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('dr7-user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewUser = (email: string, fullName: string, profilePicture?: string): User => ({
    id: crypto.randomUUID(),
    email,
    fullName,
    profilePicture,
    paymentMethods: [
        { id: 'pm_1', brand: 'Visa', last4: '4242', expiryMonth: 12, expiryYear: 2028, isDefault: true },
        { id: 'pm_2', brand: 'Mastercard', last4: '8080', expiryMonth: 8, expiryYear: 2026, isDefault: false },
    ],
    idDocuments: [
        { id: 'doc_1', type: 'license', status: 'verified', fileName: 'license.jpg', uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'doc_2', type: 'passport', status: 'not_uploaded' },
    ],
  });

  const login = (email: string, fullName: string = 'John Doe') => {
    const userData = createNewUser(email, fullName);
    localStorage.setItem('dr7-user', JSON.stringify(userData));
    setUser(userData);
  };

  const signup = (email: string, fullName: string) => {
    const userData = createNewUser(email, fullName);
    localStorage.setItem('dr7-user', JSON.stringify(userData));
    setUser(userData);
  };
  
  const logout = () => {
    localStorage.removeItem('dr7-user');
    setUser(null);
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('dr7-user', JSON.stringify(newUser));
    }
  };

  const updateMembership = (tierId: string, billingCycle: 'monthly' | 'annually') => {
    if (user) {
        const renewalDate = new Date();
        if (billingCycle === 'monthly') {
            renewalDate.setMonth(renewalDate.getMonth() + 1);
        } else {
            renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        }

        const newUser: User = {
            ...user,
            membership: {
                tierId,
                billingCycle,
                renewalDate: renewalDate.toISOString(),
            }
        };
        setUser(newUser);
        localStorage.setItem('dr7-user', JSON.stringify(newUser));
    }
  };

  const loginWithGoogle = () => {
    const googleUser = createNewUser(
        'google.user@example.com',
        'Google User',
        `https://avatar.iran.liara.run/username?username=Google+User`
    );
    localStorage.setItem('dr7-user', JSON.stringify(googleUser));
    setUser(googleUser);
  };

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
    signup,
    updateUser,
    loginWithGoogle,
    updateMembership,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
