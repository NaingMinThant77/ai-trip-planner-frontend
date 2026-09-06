import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../api/client';
import { AccountCard } from '../components/profile/account-card';
import { initialsOf } from '../components/profile/gradient-header';
import { Button } from '../components/ui/button';
import { ErrorState, LoadingState } from '../components/ui/screen-state';
import { TextField } from '../components/ui/text-field';
import {
  useChangePassword,
  useRemoveAvatar,
  useUpdateEmail,
  useUpdateName,
  useUploadAvatar,
} from '../hooks/use-account';
import { useProfile } from '../hooks/use-explore';
import { colors, fontSize, radii, spacing } from '../theme';

type Notice = { tone: 'success' | 'error'; message: string } | null;

const MIN_PASSWORD_LENGTH = 8;

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * Four independent cards, each with its own save. Not one form: a failed email change must not
 * discard a name edit, and the server validates each field separately anyway.
 */
export default function AccountScreen() {
  const profile = useProfile();

  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const updateName = useUpdateName();
  const updateEmail = useUpdateEmail();
  const changePassword = useChangePassword();

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [photoNotice, setPhotoNotice] = useState<Notice>(null);
  const [nameNotice, setNameNotice] = useState<Notice>(null);
  const [emailNotice, setEmailNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);

  if (profile.isPending) return <LoadingState label="Loading your account…" />;

  if (profile.isError) {
    return (
      <ErrorState
        message={messageOf(profile.error, 'Could not load your account.')}
        onRetry={() => void profile.refetch()}
      />
    );
  }

  const data = profile.data;
  // `null` means untouched, so the server value shows until the user actually edits.
  const nameValue = name ?? data.name;
  const emailValue = email ?? data.email;

  async function handlePickPhoto(): Promise<void> {
    setPhotoNotice(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoNotice({ tone: 'error', message: 'Photo access is needed to pick an image.' });
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Square, because every place it renders is a circle.
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (picked.canceled) return;

    const asset = picked.assets[0];
    try {
      await uploadAvatar.mutateAsync({
        uri: asset.uri,
        fileName: asset.fileName ?? 'avatar.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      setPhotoNotice({ tone: 'success', message: 'Photo updated.' });
    } catch (error) {
      setPhotoNotice({ tone: 'error', message: messageOf(error, 'Could not upload that image.') });
    }
  }

  function handleRemovePhoto(): void {
    Alert.alert('Remove photo', 'Your initials will be shown instead.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setPhotoNotice(null);
          removeAvatar.mutate(undefined, {
            onSuccess: () => setPhotoNotice({ tone: 'success', message: 'Photo removed.' }),
            onError: (error) =>
              setPhotoNotice({
                tone: 'error',
                message: messageOf(error, 'Could not remove the photo.'),
              }),
          });
        },
      },
    ]);
  }

  function handleSaveName(): void {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2) {
      setNameNotice({ tone: 'error', message: 'Your name needs at least 2 characters.' });
      return;
    }
    if (trimmed === data.name) {
      setNameNotice({ tone: 'success', message: 'That is already your name.' });
      return;
    }

    updateName.mutate(trimmed, {
      onSuccess: () => {
        setName(null);
        setNameNotice({ tone: 'success', message: 'Name updated.' });
      },
      onError: (error) =>
        setNameNotice({ tone: 'error', message: messageOf(error, 'Could not save your name.') }),
    });
  }

  function handleSaveEmail(): void {
    const trimmed = emailValue.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setEmailNotice({ tone: 'error', message: 'Enter a valid email address.' });
      return;
    }
    if (trimmed === data.email) {
      setEmailNotice({ tone: 'success', message: 'That is already your email.' });
      return;
    }

    updateEmail.mutate(trimmed, {
      onSuccess: () => {
        setEmail(null);
        setEmailNotice({ tone: 'success', message: 'Email updated. Use it next time you sign in.' });
      },
      onError: (error) =>
        // A 409 from the server is the "already taken" case, and its message says so.
        setEmailNotice({ tone: 'error', message: messageOf(error, 'Could not save your email.') }),
    });
  }

  function handleChangePassword(): void {
    if (currentPassword.length === 0) {
      setPasswordNotice({ tone: 'error', message: 'Enter your current password.' });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordNotice({
        tone: 'error',
        message: `Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setPasswordNotice({ tone: 'success', message: 'Password changed.' });
        },
        onError: (error) =>
          setPasswordNotice({
            tone: 'error',
            message: messageOf(error, 'Could not change your password.'),
          }),
      },
    );
  }

  const isBusyWithPhoto = uploadAvatar.isPending || removeAvatar.isPending;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AccountCard
        icon="camera-outline"
        iconBackground={colors.brandSoft}
        iconColor={colors.brandDark}
        title="Profile photo"
        subtitle="Shown on your profile and to family"
        notice={photoNotice}
      >
        <View style={styles.photoRow}>
          {data.avatarUrl ? (
            <Image
              source={{ uri: data.avatarUrl }}
              style={styles.preview}
              contentFit="cover"
              transition={150}
              accessibilityLabel="Your profile photo"
            />
          ) : (
            <View style={[styles.preview, styles.previewEmpty]}>
              <Text style={styles.previewText}>{initialsOf(data.name)}</Text>
            </View>
          )}

          <View style={styles.photoActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handlePickPhoto()}
              disabled={isBusyWithPhoto}
              style={({ pressed }) => [
                styles.photoButton,
                (pressed || isBusyWithPhoto) && styles.pressed,
              ]}
            >
              <Ionicons name="image-outline" size={16} color={colors.textInverse} />
              <Text style={styles.photoButtonLabel}>
                {uploadAvatar.isPending
                  ? 'Uploading…'
                  : data.avatarUrl
                    ? 'Replace photo'
                    : 'Upload photo'}
              </Text>
            </Pressable>

            {data.avatarUrl ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleRemovePhoto}
                disabled={isBusyWithPhoto}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <Text style={styles.removeLabel}>
                  {removeAvatar.isPending ? 'Removing…' : 'Remove'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </AccountCard>

      <AccountCard
        icon="person-outline"
        iconBackground={colors.infoSoft}
        iconColor={colors.info}
        title="Name"
        subtitle="How you appear to family members"
        notice={nameNotice}
      >
        <TextField
          label="Full name"
          value={nameValue}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
        />
        <Button
          label="Save name"
          onPress={handleSaveName}
          isLoading={updateName.isPending}
          disabled={nameValue.trim() === data.name}
        />
      </AccountCard>

      <AccountCard
        icon="mail-outline"
        iconBackground={colors.accentSoft}
        iconColor={colors.accent}
        title="Email"
        subtitle="What you sign in with. Must not be used by another account."
        notice={emailNotice}
      >
        <TextField
          label="Email address"
          value={emailValue}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Button
          label="Save email"
          onPress={handleSaveEmail}
          isLoading={updateEmail.isPending}
          disabled={emailValue.trim().toLowerCase() === data.email}
        />
      </AccountCard>

      <AccountCard
        icon="lock-closed-outline"
        iconBackground={colors.dangerSoft}
        iconColor={colors.danger}
        title="Password"
        subtitle="Your current password is required to set a new one"
        notice={passwordNotice}
      >
        <TextField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoComplete="current-password"
          placeholder="Your current password"
        />
        <TextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        />
        <Button
          label="Change password"
          onPress={handleChangePassword}
          isLoading={changePassword.isPending}
          disabled={currentPassword.length === 0 || newPassword.length === 0}
        />
        <Text style={styles.hint}>
          An account created with Google has no password to change — use the Google button to
          sign in instead.
        </Text>
      </AccountCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  photoRow: { flexDirection: 'row', alignItems: 'center' },
  preview: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    marginRight: spacing.lg,
    backgroundColor: colors.surfaceAlt,
  },
  previewEmpty: { alignItems: 'center', justifyContent: 'center' },
  previewText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textMuted },
  photoActions: { flex: 1, gap: spacing.sm },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
  },
  photoButtonLabel: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '700' },
  removeButton: {
    minHeight: 40,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 17,
  },
});
