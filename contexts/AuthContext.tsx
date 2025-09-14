import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../src/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Define a compatible user type for the rest of the app
interface AppUser {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email, password) => Promise<{ error: { message: string } | null }>;
  signup: (email, password, options) => Promise<{ error: { message: string } | null }>;
  logout: () => void;
  signInWithGoogleToken: (token: string) => Promise<{ error: { message: string } | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signup = async (email, password, options) => {
    const { error } = await supabase.auth.signUp({ email, password, options });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogleToken = async (token: string) => {
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
    return { error };
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    signup,
    logout,
    signInWithGoogleToken,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
