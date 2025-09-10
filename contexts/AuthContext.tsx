
import React, { createContext, useState, useEffect, useMemo } from 'react';
import type { User } from '../types';

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

const defaultVerificationStatus = {
    idStatus: 'none' as 'none' | 'pending' | 'verified',
    cardStatus: 'none' as 'none' | 'verified',
    phoneStatus: 'none' as 'none' | 'verified',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for an existing session
    try {
      const storedUser = localStorage.getItem('dr7-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Ensure verification object exists for older user data
        if (!parsedUser.verification) {
            parsedUser.verification = defaultVerificationStatus;
        }
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('dr7-user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, fullName: string = 'John Doe') => {
    // This is a mock login. In a real app, you'd call an API.
    const userData: User = { 
        id: crypto.randomUUID(), 
        email, 
        fullName,
        verification: defaultVerificationStatus,
    };
    localStorage.setItem('dr7-user', JSON.stringify(userData));
    setUser(userData);
  };

  const signup = (email: string, fullName: string) => {
    // This is a mock signup. It immediately logs the user in.
    const userData: User = { 
        id: crypto.randomUUID(), 
        email, 
        fullName,
        verification: defaultVerificationStatus,
    };
    localStorage.setItem('dr7-user', JSON.stringify(userData));
    setUser(userData);
  };
  
  const logout = () => {
    localStorage.removeItem('dr7-user');
    setUser(null);
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
        const newUser = { 
            ...user, 
            ...updatedData,
            // Deep merge verification object
            verification: {
                // FIX: Add non-null assertion. The app logic guarantees user.verification exists for logged-in users.
                ...user.verification!,
                ...updatedData.verification,
            }
        };
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
    // In a real app, this would open a Google Sign-In popup and handle the response.
    // For this mock, we'll create a predefined Google user.
    const googleUser: User = {
      id: crypto.randomUUID(),
      fullName: 'Google User',
      email: 'google.user@example.com',
      profilePicture: `https://avatar.iran.liara.run/username?username=Google+User`,
      verification: defaultVerificationStatus,
    };
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