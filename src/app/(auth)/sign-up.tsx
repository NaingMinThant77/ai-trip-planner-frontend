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
import { DestinationCollage } from "../../components/auth/destination-collage";
import { GoogleButton } from "../../components/auth/google-button";
import { OrDivider } from "../../components/auth/or-divider";
import { GradientButton } from "../../components/ui/gradient-button";
import { TextField } from "../../components/ui/text-field";
import { useAuth } from "../../context/auth";
import { colors, fontSize, spacing } from "../../theme";
import { KeyboardSafeView } from '../../components/ui/keyboard-safe-view';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);

  async function handleSubmit(): Promise<void> {
    setError(null);

    // Mirrors the server's rules so the common mistakes cost no round trip.
    if (name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(name.trim(), email.trim(), password);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not create your account.",
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
      setError(caught instanceof Error ? caught.message : "Could not continue with Google.");
    } finally {
      setIsGoogleBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardSafeView
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandHeader />

          <View style={styles.collage}>
            <DestinationCollage />
          </View>

          <Text style={styles.title}>Find the perfect destination</Text>
          <Text style={styles.subtitle}>
            Explore places you&apos;ve never seen — discovered just for you.
          </Text>

          <View style={styles.form}>
            <TextField
              label="Full name"
              variant="pill"
              icon="person-outline"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              placeholder="Alex Explorer"
            />
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
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/sign-in">
                <Text style={styles.footerLink}>Sign in</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardSafeView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  collage: { marginTop: spacing.lg },
  title: {
    fontSize: fontSize.xxl,
    lineHeight: 32,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.xl,
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
