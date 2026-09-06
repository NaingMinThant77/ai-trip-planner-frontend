import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { useAuth } from '../../context/auth';
import { colors, fontSize, spacing } from '../../theme';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    setError(null);

    // Mirrors the server's rules so the common mistakes cost no round trip.
    if (name.trim().length < 2) {
      setError('Enter your name.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
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
      setError(caught instanceof ApiError ? caught.message : 'Could not create your account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start planning your next trip.</Text>

          <View style={styles.form}>
            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              placeholder="Your name"
            />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label="Create account"
              onPress={() => void handleSubmit()}
              isLoading={isSubmitting}
            />

            <Link href="/(auth)/sign-in" style={styles.link}>
              <Text style={styles.linkText}>Already have an account? Sign in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  form: { marginTop: spacing.xxl },
  error: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.md },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
});
