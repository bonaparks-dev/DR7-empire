import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';

// Define a compatible user type for the rest of the app
interface AppUser {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email, password) => Promise<{ data: { user: SupabaseUser; session: Session; } | { user: null; session: null; }; error: AuthError | null; }>;
  signup: (email, password, options) => Promise<any>;
  logout: () => Promise<{ error: AuthError | null }>;
  signInWithGoogleToken: (token: string) => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const user: AppUser | null = useMemo(() => {
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email || '',
        fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
      };
    }
    return null;
  }, [session]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signup: (email, password, options) => supabase.auth.signUp({ email, password, options }),
    logout: () => supabase.auth.signOut(),
    signInWithGoogleToken: (token: string) => supabase.auth.signInWithIdToken({ provider: 'google', token }),
  }), [user, session, loading]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};