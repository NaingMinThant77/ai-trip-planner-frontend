import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '../api/client';
import { AuthProvider, useAuth } from '../context/auth';
import { colors } from '../theme';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Retrying a 4xx just burns time — the request was wrong, not unlucky.
        if (error instanceof ApiError && error.status !== null && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/**
 * Single redirect gate for the whole app: onboarding → auth → tabs.
 * Keeping it in one place stops individual screens from each guessing at auth state.
 */
function RootNavigator() {
  const { user, isRestoring, hasOnboarded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    // Waits one tick so the root navigator is mounted before any replace() runs.
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (isRestoring || !isNavigationReady) return;

    const group = segments[0];
    const inOnboarding = group === '(onboarding)';
    const inAuth = group === '(auth)';

    if (!hasOnboarded && !inOnboarding) {
      router.replace('/(onboarding)/welcome');
    } else if (hasOnboarded && !user && !inAuth) {
      router.replace('/(auth)/sign-in');
    } else if (user && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [user, isRestoring, hasOnboarded, segments, router, isNavigationReady]);

  useEffect(() => {
    if (!isRestoring && !hasHiddenSplash.current) {
      hasHiddenSplash.current = true;
      void SplashScreen.hideAsync();
    }
  }, [isRestoring]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="new-trip" options={{ title: 'New trip', presentation: 'modal' }} />
      <Stack.Screen name="edit-trip" options={{ title: 'Edit trip', presentation: 'modal' }} />
      <Stack.Screen name="explore" options={{ title: 'Explore' }} />
      <Stack.Screen name="destination/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="agent" options={{ headerShown: false }} />
      <Stack.Screen name="trip/[id]" options={{ title: 'Trip' }} />
      <Stack.Screen name="chat/[peerId]" options={{ title: 'Chat' }} />
      <Stack.Screen name="travel-profile" options={{ title: 'Travel profile' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
    </Stack>
  );
}
