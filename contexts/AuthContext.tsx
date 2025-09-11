import React, { createContext, useState, useEffect, useMemo, useContext, ReactNode } from 'react';
import { supabase } from '../supabaseClient'; // Ensure you have this client initialized
import type { Session } from '@supabase/supabase-js';
import type { User as AppUser } from '../types'; // Your custom application user type

// Define the shape of the context value
interface AuthContextType {
  user: AppUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, options: { data: { full_name: string } }) => Promise<any>;
  updateUser: (updatedData: Partial<AppUser>) => Promise<void>;
  loginWithGoogle: (options?: { options?: { redirectTo?: string } }) => Promise<any>;
  updateMembership: (tierId: string, billingCycle: 'monthly' | 'annually') => Promise<void>;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for changes in authentication state (sign-in, sign-out, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        if (session) {
          // If a session exists, fetch the user's profile from your 'profiles' table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          // Merge Supabase auth user with your custom profile data
          setUser(profile ? { ...session.user, ...profile } : null);
        } else {
          // If no session, the user is logged out
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Define the authentication functions that interact with Supabase
  const login = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signup = async (email: string, password: string, options: { data: { full_name: string } }) => {
    // Supabase's signUp function handles user creation
    return supabase.auth.signUp({ email, password, options });
  };

  const loginWithGoogle = async (options?: { options?: { redirectTo?: string } }) => {
    // Triggers the Google OAuth flow
    return supabase.auth.signInWithOAuth({ 
        provider: 'google', 
        ...options
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (updatedData: Partial<AppUser>) => {
    if (!user) throw new Error("No user is logged in.");
    
    // Update the user's data in the 'profiles' table
    const { data, error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id)
        .select()
        .single();
        
    if (error) throw error;

    // Update the local user state to reflect the changes immediately
    setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
  };

  const updateMembership = async (tierId: string, billingCycle: 'monthly' | 'annually') => {
      if (!user) throw new Error("No user is logged in.");

      const renewalDate = new Date();
      if (billingCycle === 'monthly') {
          renewalDate.setMonth(renewalDate.getMonth() + 1);
      } else {
          renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      }

      const membershipData = {
          membership: {
              tierId,
              billingCycle,
              renewalDate: renewalDate.toISOString(),
          }
      };
      
      await updateUser(membershipData);
  };

  // Memoize the context value to prevent unnecessary re-renders
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

  // Provide the context value to all child components
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the auth context in your components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
