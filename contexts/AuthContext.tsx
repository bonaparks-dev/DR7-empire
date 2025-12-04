import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from '../types';
import { supabase } from '../supabaseClient';
// FIX: Removed OtpVerificationError as it is not an exported member of '@supabase/supabase-js'
import type { AuthError, Session, User as SupabaseUser, OAuthResponse, UserResponse } from '@supabase/supabase-js';

// Define a compatible user type for the rest of the app
interface AppUser extends User {}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  authEvent: string | null;
  isFirstSignIn: boolean | null;
  login: (email: string, password?: string) => Promise<{ user: AppUser | null; error: AuthError | null }>;
  signup: (email: string, password: string, data: { full_name: string, company_name?: string, role: 'personal' | 'business' }) => Promise<{ data: { user: SupabaseUser | null; session: Session | null; }; error: AuthError | null; }>;
  logout: () => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<OAuthResponse>;
  sendPasswordResetEmail: (email: string) => Promise<{ data: {}; error: AuthError | null; }>;
  updateUserPassword: (password: string) => Promise<UserResponse>;
  updateUser: (updates: Partial<AppUser>) => Promise<{ data: AppUser | null; error: Error | null }>;
  isSessionActive: () => Promise<boolean>;
  // FIX: Removed OtpVerificationError from the return type
  verifyEmailOtp: (token: string) => Promise<{ data: { user: SupabaseUser | null; session: Session | null; }; error: AuthError | null; }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): AppUser => {
    const user_metadata = supabaseUser.user_metadata || {};
    const app_metadata = supabaseUser.app_metadata || {};

    return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        fullName: user_metadata.full_name || user_metadata.name || 'No Name',
        provider: app_metadata.provider,
        role: user_metadata.role || 'personal',
        companyName: user_metadata.company_name,
        phone: user_metadata.phone,
        profilePicture: user_metadata.avatar_url,
        membership: user_metadata.membership,
        verification: user_metadata.verification || {
            idStatus: 'unverified', cardStatus: 'none', phoneStatus: 'none',
        },
        businessVerification: user_metadata.businessVerification || {
            status: 'unverified',
        },
        notifications: user_metadata.notifications || {
            bookingConfirmations: true, specialOffers: true, newsletter: false,
        },
        paymentMethods: user_metadata.paymentMethods || [],
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState<string | null>(null);
  const [isFirstSignIn, setIsFirstSignIn] = useState<boolean | null>(null);

  useEffect(() => {
    const setSessionUser = (session: Session | null) => {
        if (session?.user) {
            setUser(mapSupabaseUserToAppUser(session.user));
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
        setSessionUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setAuthEvent(event);
        if (event === 'SIGNED_IN' && session?.user) {
            const user = session.user;
            const createdAt = new Date(user.created_at || 0).getTime();
            const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
            
            // Check if this is the first sign-in by comparing creation and last sign-in times.
            // A small tolerance (e.g., 60 seconds) handles minor delays after confirmation.
            const firstSignIn = !lastSignInAt || Math.abs(lastSignInAt - createdAt) < 60000;
            setIsFirstSignIn(firstSignIn);

            // Custom welcome email logic has been removed to rely on Supabase's built-in email templates
            // for both confirmation and welcome emails, ensuring a consistent experience.
        } else if (event === 'SIGNED_OUT') {
            setIsFirstSignIn(null);
        }
        
        setSessionUser(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: password! });
    if (data.user) {
        // onAuthStateChange will set loading to false
        return { user: mapSupabaseUserToAppUser(data.user), error };
    }
    setLoading(false);
    return { user: null, error };
  }, []);

  const signup = useCallback(async (email: string, password: string, data: { full_name: string, company_name?: string, role: 'personal' | 'business' }) => {
    setLoading(true);
    const result = await supabase.auth.signUp({
        email, 
        password,
        options: { 
            data,
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
    });
    // Stop loading after the attempt. The user is not logged in until email confirmation.
    setLoading(false);
    return result;
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local state
      setUser(null);

      // Clear any local storage
      localStorage.clear();
      sessionStorage.clear();

      // Force hard redirect to home page
      window.location.replace('/');

      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);

      // Even if Supabase fails, clear local data and redirect
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');

      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);
  
  // ✅ SIMPLE GOOGLE SIGN-IN: Let Supabase use your Dashboard "Site URL"
  const signInWithGoogle = useCallback(async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      // no options.redirectTo, no queryParams — simplest flow
    });
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    // Redirect to the app root. The AuthRedirector will handle routing
    // to the reset password page once the user is signed in.
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
    });
  }, []);

  const updateUserPassword = useCallback(async (password: string) => {
      return supabase.auth.updateUser({ password });
  }, []);
  
  const updateUser = useCallback(async (updates: Partial<AppUser>) => {
    const currentMeta = user ? (await supabase.auth.getUser()).data.user?.user_metadata : {};
    const { data, error } = await supabase.auth.updateUser({
        data: { ...currentMeta, ...updates }
    });

    if (error) return { data: null, error };
    if (data.user) {
        setUser(mapSupabaseUserToAppUser(data.user)); // Update local state immediately
        return { data: mapSupabaseUserToAppUser(data.user), error: null };
    }
    return { data: null, error: new Error('User data could not be updated.')};
  }, [user]);

  const verifyEmailOtp = useCallback((token: string) => {
    return supabase.auth.verifyOtp({ token_hash: token, type: 'signup' });
  }, []);

  const isSessionActive = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }, []);

  const value = useMemo(() => ({
    user, loading, authEvent, isFirstSignIn, login, signup, logout, signInWithGoogle,
    sendPasswordResetEmail, updateUserPassword, updateUser, verifyEmailOtp, isSessionActive,
  }), [user, loading, authEvent, isFirstSignIn, login, signup, logout, signInWithGoogle, 
      sendPasswordResetEmail, updateUserPassword, updateUser, verifyEmailOtp, isSessionActive]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
