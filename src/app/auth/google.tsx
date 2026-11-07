import { Redirect } from 'expo-router';

/**
 * Landing route for the `wayfarer://auth/google?token=...` deep link.
 *
 * The token is consumed by `signInWithGoogle` (WebBrowser.openAuthSessionAsync), but Expo
 * Router also sees the same URL and tries to navigate to it. Without a matching route that
 * shows "Unmatched Route", so this just hands control back to the root auth gate.
 */
export default function GoogleAuthCallback() {
  return <Redirect href="/" />;
}
