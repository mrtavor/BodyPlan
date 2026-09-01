import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  initFirebase,
  loginWithGoogle,
  logoutGoogle,
  saveFirebaseConfig,
  getSavedFirebaseConfig,
} from '../lib/firebase';
import { FirebaseCustomConfig } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  firebaseConfig: FirebaseCustomConfig | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateFirebaseConfig: (config: FirebaseCustomConfig | null) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [firebaseConfig, setFirebaseConfigState] = useState<FirebaseCustomConfig | null>(getSavedFirebaseConfig());
  const [error, setError] = useState<string | null>(null);

  const isFirebaseConfigured = Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId);

  useEffect(() => {
    let unsubscribe = () => {};
    const { auth } = initFirebase(firebaseConfig);

    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
    } else {
      setUser(null);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [firebaseConfig]);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Помилка авторизації через Google');
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await logoutGoogle();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Помилка виходу');
    }
  };

  const updateFirebaseConfig = (config: FirebaseCustomConfig | null) => {
    saveFirebaseConfig(config);
    setFirebaseConfigState(config);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        firebaseConfig,
        signInWithGoogle,
        signOutUser,
        updateFirebaseConfig,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
