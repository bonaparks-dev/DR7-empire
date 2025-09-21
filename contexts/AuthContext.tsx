import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from '../types';
import { supabase } from '../supabaseClient';
import type { AuthError, Session, User as SupabaseUser, OAuthResponse, UserResponse } from '@supabase/supabase-js';

// EIP-6963 Provider Discovery Types
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any; // EIP-1193 provider
}

// Define a compatible user type for the rest of the app
interface AppUser extends User {}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ user: AppUser | null; error: AuthError | null }>;
  signup: (email: string, password: string, data: { full_name: string, company_name?: string, role: 'personal' | 'business' }) => Promise<{ data: { user: SupabaseUser | null; session: Session | null; }; error: AuthError | null; }>;
  logout: () => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<OAuthResponse>;
  signInWithMetaMask: () => Promise<{ error: Error | null }>;
  signInWithCoinbase: () => Promise<{ error: Error | null }>;
  signInWithPhantom: () => Promise<{ error: Error | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ data: {}; error: AuthError | null; }>;
  updateUserPassword: (password: string) => Promise<UserResponse>;
  updateUser: (updates: Partial<AppUser>) => Promise<{ data: AppUser | null; error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): AppUser => {
    const { user_metadata } = supabaseUser;
    return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        fullName: user_metadata.full_name || user_metadata.name || 'No Name',
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
  const [eip6963Providers, setEip6963Providers] = useState<EIP6963ProviderDetail[]>([]);
  
  // EIP-6963 Provider Discovery Effect
  useEffect(() => {
    const providers: EIP6963ProviderDetail[] = [];
    const onAnnounceProvider = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (detail?.info && detail?.provider) {
        if (!providers.some(p => p.info.uuid === detail.info.uuid)) {
          providers.push(detail);
          setEip6963Providers([...providers]);
        }
      }
    };

    window.addEventListener('eip6963:announceProvider', onAnnounceProvider);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounceProvider);
    };
  }, []);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSessionUser(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: password! });
    if (data.user) {
        return { user: mapSupabaseUserToAppUser(data.user), error };
    }
    return { user: null, error };
  }, []);

  const signup = useCallback(async (email: string, password: string, data: { full_name: string, company_name?: string, role: 'personal' | 'business' }) => {
    return supabase.auth.signUp({ 
        email, 
        password,
        options: { 
            data,
            emailRedirectTo: `${window.location.origin}/#/signin`
        }
    });
  }, []);

  const logout = useCallback(() => supabase.auth.signOut(), []);
  
  const signInWithGoogle = useCallback(() => {
    sessionStorage.setItem('oauth_in_progress', 'true');
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        }
    });
  }, []);

  const _signInWithWeb3Provider = async (provider: any, providerName: string) => {
      if (!provider) {
          throw new Error(`${providerName} not found. Please install the extension.`);
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts found in ${providerName}. Please connect an account.`);
      }
      const address = accounts[0];

      const { data: nonceData, error: nonceError } = await supabase.auth.signInWithOtp({
          email: address, 
          options: { shouldCreateUser: true, channel: 'wallet' as any },
      });

      if (nonceError) throw nonceError;
      const messageToSign = (nonceData as any)?.message;
      if (!messageToSign) throw new Error('Could not get a message to sign from the server.');

      const signature = await provider.request({
          method: 'personal_sign',
          params: [messageToSign, address],
      });

      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token: signature,
          type: 'wallet' as any,
          email: address,
      });
      
      if (verifyError) throw verifyError;
      if (!verifyData.user || !verifyData.session) throw new Error('Verification failed.');

      // Set default name for new wallet users
      if (verifyData.user.user_metadata?.full_name === undefined) {
         await supabase.auth.updateUser({
             data: { full_name: `User ${address.slice(0, 6)}...${address.slice(-4)}`, role: 'personal' }
         })
      }

      return { error: null };
  };

  const findProvider = (rdns: string) => {
    // 1. EIP-6963 provider discovery (preferred). This is the modern standard for multiple wallets.
    const announcedProvider = eip6963Providers.find(p => p.info.rdns === rdns);
    if (announcedProvider) {
      return announcedProvider.provider;
    }

    // 2. Fallback for environments with `window.ethereum`
    const winEth = (window as any).ethereum;
    if (!winEth) {
      return undefined;
    }

    // 2a. If `window.ethereum.providers` array exists, search for the specific provider there.
    // This handles cases where multiple wallets inject their providers into this array.
    if (Array.isArray(winEth.providers)) {
      const provider = winEth.providers.find((p: any) => {
        // EIP-6963 providers might also be in this array, so we check for rdns first.
        if (p.info?.rdns === rdns) return true;
        // Legacy flags check
        if (rdns === 'io.metamask' && p.isMetaMask) return true;
        if (rdns === 'com.coinbase.wallet' && p.isCoinbaseWallet) return true;
        if (rdns === 'app.phantom' && p.isPhantom) return true;
        return false;
      });
      if (provider) return provider;
    }

    // 2b. Legacy fallback for a single provider injected as `window.ethereum`.
    // This is for older wallets or when only one wallet is installed.
    const isRequestedProvider = 
        (rdns === 'io.metamask' && winEth.isMetaMask) ||
        (rdns === 'com.coinbase.wallet' && winEth.isCoinbaseWallet) ||
        (rdns === 'app.phantom' && winEth.isPhantom);
        
    // Check if it's a single provider environment (`!winEth.providers`) and if it matches.
    if (!winEth.providers && isRequestedProvider) {
      return winEth;
    }
    
    // If we're here, no matching provider was found.
    return undefined;
  };

  const signInWithMetaMask = useCallback(async () => {
    try {
        const provider = findProvider('io.metamask');
        return await _signInWithWeb3Provider(provider, 'MetaMask');
    } catch (error: any) {
        console.error("MetaMask sign-in error:", error);
        return { error };
    }
  }, [eip6963Providers]);

  const signInWithCoinbase = useCallback(async () => {
      try {
          const provider = findProvider('com.coinbase.wallet');
          return await _signInWithWeb3Provider(provider, 'Coinbase Wallet');
      } catch (error: any) {
          console.error("Coinbase sign-in error:", error);
          return { error };
      }
  }, [eip6963Providers]);

  const signInWithPhantom = useCallback(async () => {
      try {
          const provider = findProvider('app.phantom');
          return await _signInWithWeb3Provider(provider, 'Phantom Wallet');
      } catch (error: any) {
          console.error("Phantom sign-in error:", error);
          return { error };
      }
  }, [eip6963Providers]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`
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

  const value = useMemo(() => ({
    user, loading, login, signup, logout, signInWithGoogle,
    signInWithMetaMask, signInWithCoinbase, signInWithPhantom,
    sendPasswordResetEmail, updateUserPassword, updateUser,
  }), [user, loading, login, signup, logout, signInWithGoogle, 
      signInWithMetaMask, signInWithCoinbase, signInWithPhantom, 
      sendPasswordResetEmail, updateUserPassword, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};