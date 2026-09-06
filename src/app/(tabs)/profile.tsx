import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Chip } from '../../components/ui/chip';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { TextField } from '../../components/ui/text-field';
import { useAuth } from '../../context/auth';
import { useProfile, useUpdateProfile } from '../../hooks/use-explore';
import { colors, fontSize, radii, spacing } from '../../theme';

/** The vocabulary suggestions are ranked against — keep in step with seed tags. */
const INTEREST_OPTIONS = [
  'food',
  'history',
  'nature',
  'hiking',
  'art',
  'architecture',
  'nightlife',
  'markets',
  'coast',
  'photography',
  'wine',
  'skiing',
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();

  const [homeCity, setHomeCity] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  // Seeds local edit state once the server value arrives, without clobbering later edits.
  useEffect(() => {
    if (profile.data) {
      setHomeCity(profile.data.homeCity ?? '');
      setInterests(profile.data.interests);
    }
  }, [profile.data]);

  if (profile.isPending) return <LoadingState label="Loading your profile…" />;

  if (profile.isError) {
    return (
      <ErrorState
        message={
          profile.error instanceof ApiError ? profile.error.message : 'Could not load profile.'
        }
        onRetry={() => void profile.refetch()}
      />
    );
  }

  function toggleInterest(interest: string): void {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  function handleSave(): void {
    updateProfile.mutate(
      { homeCity: homeCity.trim(), interests },
      {
        onError: (error) => {
          Alert.alert(
            'Could not save',
            error instanceof ApiError ? error.message : 'Please try again.',
          );
        },
      },
    );
  }

  function handleSignOut(): void {
    Alert.alert('Sign out', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name ?? profile.data.name}</Text>
        <Text style={styles.email}>{profile.data.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Personalisation</Text>
      <Text style={styles.sectionBody}>
        These shape the suggestions you see. Nothing here is shared with anyone.
      </Text>

      <TextField
        label="Home city"
        value={homeCity}
        onChangeText={setHomeCity}
        placeholder="Where do you travel from?"
      />

      <Text style={styles.label}>Interests</Text>
      <View style={styles.chips}>
        {INTEREST_OPTIONS.map((interest) => (
          <Chip
            key={interest}
            label={interest}
            isSelected={interests.includes(interest)}
            onPress={() => toggleInterest(interest)}
          />
        ))}
      </View>

      <Button
        label={updateProfile.isSuccess && !updateProfile.isPending ? 'Saved' : 'Save changes'}
        onPress={handleSave}
        isLoading={updateProfile.isPending}
      />

      <Button
        label="Sign out"
        variant="secondary"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  sectionBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  signOut: { marginTop: spacing.md },
});
