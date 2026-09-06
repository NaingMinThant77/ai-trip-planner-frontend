import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/button';
import { Chip } from '../components/ui/chip';
import { ErrorState, LoadingState } from '../components/ui/screen-state';
import { TextField } from '../components/ui/text-field';
import { useProfile, useUpdateProfile } from '../hooks/use-explore';
import { colors, fontSize, spacing } from '../theme';

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

/**
 * Split out of the Profile tab in the redesign: that tab is now a settings index, and the
 * fields that actually change suggestion ranking live on their own screen.
 */
export default function TravelProfileScreen() {
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

  if (profile.isPending) return <LoadingState label="Loading your preferences…" />;

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

  return (
    <ScrollView contentContainerStyle={styles.content}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
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
});
