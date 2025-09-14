
import React, { createContext, useState, useEffect, useMemo } from 'react';

// Define a compatible user type for the rest of the app
interface AppUser {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email, password) => Promise<{ error: { message: string } | null }>;
  signup: (email, password, options) => Promise<{ error: { message: string } | null }>;
  logout: () => void;
  signInWithGoogleToken: (token: string) => Promise<{ error: { message: string } | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // This is a mock login. In a real app, you'd validate the password.
    // For this project, we'll accept any password for a given email.
    if (email && password) {
      const mockUser: AppUser = {
        id: email, // Use email as ID for simplicity
        email: email,
        fullName: email.split('@')[0], // Derive a name from the email
      };
      localStorage.setItem('dr7-mock-user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { error: null };
    }
    return { error: { message: 'Invalid email or password.' } };
  };

  const signup = async (email, password, options) => {
    // Mock signup creates and logs in the user immediately.
    const fullName = options?.data?.full_name || email.split('@')[0];
    const mockUser: AppUser = {
      id: email,
      email: email,
      fullName: fullName,
    };
    localStorage.setItem('dr7-mock-user', JSON.stringify(mockUser));
    setUser(mockUser);
    // In a real app, you might return an error if the user exists, but we'll overwrite it.
    return { error: null };
  };

  const logout = () => {
    localStorage.removeItem('dr7-mock-user');
    setUser(null);
  };
  
  const signInWithGoogleToken = async (token: string) => {
    // In a real app, you'd decode/verify the token. Here, we just mock a user.
    const mockUser = { id: 'google-user@example.com', email: 'google-user@example.com', fullName: 'Google User' };
    localStorage.setItem('dr7-mock-user', JSON.stringify(mockUser));
    setUser(mockUser);
    return { error: null };
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
