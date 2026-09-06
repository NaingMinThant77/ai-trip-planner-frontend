import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { setAuthToken } from '../api/client';
import { User } from '../types/api';

// Closes the popup the web build leaves behind after Google redirects back.
WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'atp.accessToken';
const ONBOARDED_KEY = 'atp.hasOnboarded';

/** Where the backend hands the session back to. Expo Go resolves this to an `exp://` URL. */
const GOOGLE_REDIRECT_PATH = 'auth/google';

/** Reasons the user chose to stop — these end the attempt without showing an error. */
const SILENT_GOOGLE_ERRORS = ['access_denied', 'user_cancelled'];

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: 'Google sign-in is not set up on the server yet.',
  missing_code: 'Google sign-in did not complete. Please try again.',
};

/** `queryParams` values can be arrays when a key repeats; only a single value is meaningful. */
function readParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  return null;
}

type AuthState = {
  user: User | null;
  /** True until the stored token has been read and checked. Gates the redirect. */
  isRestoring: boolean;
  hasOnboarded: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  /** Opens Google in a system browser. Resolves without a session if the user backs out. */
  signInWithGoogle: () => Promise<void>;
  /**
   * Re-reads `/auth/me` into the session. Call after changing the name, email or avatar —
   * without it the header keeps showing what was true when the app started.
   */
  refreshUser: () => Promise<void>;
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

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const redirectUri = Linking.createURL(GOOGLE_REDIRECT_PATH);
    const result = await WebBrowser.openAuthSessionAsync(
      authApi.googleStartUrl(redirectUri),
      redirectUri,
    );

    // The user swiped the browser away or hit cancel — not an error worth reporting.
    if (result.type !== 'success') return;

    const { queryParams } = Linking.parse(result.url);
    const failure = readParam(queryParams?.error);

    if (failure) {
      if (SILENT_GOOGLE_ERRORS.includes(failure)) return;
      throw new Error(GOOGLE_ERROR_MESSAGES[failure] ?? 'Google sign-in failed. Please try again.');
    }

    const accessToken = readParam(queryParams?.token);
    if (!accessToken) {
      throw new Error('Google sign-in did not return a session. Please try again.');
    }

    // The deep link carries only the token, so the profile is fetched with it before the
    // session is committed — that also proves the token works.
    setAuthToken(accessToken);
    try {
      const me = await authApi.fetchMe();
      await writeSecure(TOKEN_KEY, accessToken);
      setUser(me);
    } catch (caught) {
      setAuthToken(null);
      throw caught;
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    // Swallowed on purpose: this only refreshes what is displayed. A failure here must not
    // turn a successful save into an error, and the next cold start re-reads it anyway.
    try {
      setUser(await authApi.fetchMe());
    } catch {
      // Left as-is.
    }
  }, []);

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
    () => ({
      user,
      isRestoring,
      hasOnboarded,
      signIn,
      signUp,
      signInWithGoogle,
      refreshUser,
      signOut,
      completeOnboarding,
    }),
    [
      user,
      isRestoring,
      hasOnboarded,
      signIn,
      signUp,
      signInWithGoogle,
      refreshUser,
      signOut,
      completeOnboarding,
    ],
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
