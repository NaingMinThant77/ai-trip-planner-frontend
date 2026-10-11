import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../api/client";
import { BrandHeader } from "../../components/auth/brand-header";
import { GoogleButton } from "../../components/auth/google-button";
import { OrDivider } from "../../components/auth/or-divider";
import { GradientButton } from "../../components/ui/gradient-button";
import { TextField } from "../../components/ui/text-field";
import { useAuth } from "../../context/auth";
import { colors, fontSize, radii, spacing } from "../../theme";
import { KeyboardSafeView } from '../../components/ui/keyboard-safe-view';

const HERO_URI =
  "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1200&q=75&auto=format&fit=crop";

export default function SignInScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);

  async function handleSubmit(): Promise<void> {
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // No navigation here — the gate in _layout.tsx reacts to the user becoming non-null.
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Could not sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle(): Promise<void> {
    setError(null);
    setIsGoogleBusy(true);
    try {
      // Resolves with no session if the user backs out of the browser — nothing to report.
      await signInWithGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in with Google.');
    } finally {
      setIsGoogleBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <Image
        source={{ uri: HERO_URI }}
        style={styles.hero}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.scrim} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardSafeView
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <BrandHeader tone="light" />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>
                Plan your trips with ease and confidence
              </Text>
              <Text style={styles.subtitle}>
                Build your itinerary in minutes, not hours.
              </Text>

              <View style={styles.form}>
                <TextField
                  label="Email address"
                  variant="pill"
                  icon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                />
                <TextField
                  label="Password"
                  variant="pill"
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  placeholder="Your password"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <GradientButton
                  label="Get Started"
                  onPress={() => void handleSubmit()}
                  isLoading={isSubmitting}
                />

                <OrDivider />

                <GoogleButton
                  onPress={() => void handleGoogle()}
                  isLoading={isGoogleBusy}
                />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>New here? </Text>
                  <Link href="/(auth)/sign-up">
                    <Text style={styles.footerLink}>Create account</Text>
                  </Link>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardSafeView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brandDark },
  // RN 0.86 dropped the spreadable `absoluteFillObject` from its types.
  hero: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  header: { paddingVertical: spacing.md },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    lineHeight: 38,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  form: { marginTop: spacing.xl },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: { fontSize: fontSize.sm, color: colors.textMuted },
  footerLink: { fontSize: fontSize.sm, fontWeight: "700", color: colors.brand },
});
