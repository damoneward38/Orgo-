import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface DbUser {
  id: number;
  uid: string;
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  idToken: string | null;
  loading: boolean;
  hasCloudSql: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCloudSql, setHasCloudSql] = useState(true);

  // Sync with Cloud SQL PostgreSQL backend
  const syncWithPostgres = async (token: string) => {
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      }
    } catch (err) {
      console.warn('[CloudSQL] Postgres user synchronization warning:', err);
    }
  };

  useEffect(() => {
    // Check backend health for Cloud SQL status
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.hasCloudSql === 'boolean') {
          setHasCloudSql(data.hasCloudSql);
        }
      })
      .catch(() => {});

    // Listen for auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          await syncWithPostgres(token);
        } catch (e) {
          console.error('Failed to get token:', e);
          setIdToken(null);
        }
      } else {
        setIdToken(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      if (cred.user) {
        const token = await cred.user.getIdToken();
        setIdToken(token);
        await syncWithPostgres(token);
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setDbUser(null);
      setIdToken(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const refreshToken = async () => {
    if (!auth.currentUser) return null;
    try {
      const token = await auth.currentUser.getIdToken(true);
      setIdToken(token);
      return token;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        idToken,
        loading,
        hasCloudSql,
        signInWithGoogle,
        signOut,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
