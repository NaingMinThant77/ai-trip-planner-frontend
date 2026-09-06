import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { setAuthToken } from '../api/client';
import { User } from '../types/api';

const TOKEN_KEY = 'atp.accessToken';
const ONBOARDED_KEY = 'atp.hasOnboarded';

type AuthState = {
  user: User | null;
  /** True until the stored token has been read and checked. Gates the redirect. */
  isRestoring: boolean;
  hasOnboarded: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * SecureStore is unavailable on web, and throws rather than returning null.
 * Falling back to null keeps the web build usable (signed out every reload).
 */
async function readSecure(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeSecure(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    // Non-fatal: the session just will not survive a restart.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    async function restore(): Promise<void> {
      const [token, onboarded] = await Promise.all([
        readSecure(TOKEN_KEY),
        readSecure(ONBOARDED_KEY),
      ]);

      if (cancelled) return;
      setHasOnboarded(onboarded === 'true');

      if (token) {
        setAuthToken(token);
        try {
          // Confirms the token is still valid before trusting it.
          const me = await authApi.fetchMe();
          if (!cancelled) setUser(me);
        } catch {
          setAuthToken(null);
          await writeSecure(TOKEN_KEY, null);
        }
      }

      if (!cancelled) setIsRestoring(false);
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback(
    async (accessToken: string, nextUser: User): Promise<void> => {
      setAuthToken(accessToken);
      await writeSecure(TOKEN_KEY, accessToken);
      setUser(nextUser);
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      const result = await authApi.login({ email, password });
      await applySession(result.accessToken, result.user);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<void> => {
      const result = await authApi.register({ name, email, password });
      await applySession(result.accessToken, result.user);
    },
    [applySession],
  );

  const signOut = useCallback(async (): Promise<void> => {
    setAuthToken(null);
    await writeSecure(TOKEN_KEY, null);
    setUser(null);
    // Otherwise the next person to sign in briefly sees the previous user's trips.
    queryClient.clear();
  }, [queryClient]);

  const completeOnboarding = useCallback(async (): Promise<void> => {
    setHasOnboarded(true);
    await writeSecure(ONBOARDED_KEY, 'true');
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, isRestoring, hasOnboarded, signIn, signUp, signOut, completeOnboarding }),
    [user, isRestoring, hasOnboarded, signIn, signUp, signOut, completeOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
