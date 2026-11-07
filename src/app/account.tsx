import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { confirmAction } from '../components/ui/confirm-host';

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
  const hasPassword = data.hasPassword;
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
    confirmAction({
      title: 'Remove your photo?',
      message: 'Your initials will be shown instead.',
      confirmLabel: 'Remove',
      icon: 'image',
      onConfirm: () => {
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
    });
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
    if (hasPassword && currentPassword.length === 0) {
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
      { currentPassword: hasPassword ? currentPassword : undefined, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setPasswordNotice({
            tone: 'success',
            message: hasPassword ? 'Password changed.' : 'Password set. You can now sign in with it too.',
          });
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
      <LinearGradient
        colors={['#CFF1E9', '#E8F7F3', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.hero}
      >
        <View pointerEvents="none" style={styles.heroBlobLarge} />
        <View pointerEvents="none" style={styles.heroBlobSmall} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={data.avatarUrl ? 'Replace profile photo' : 'Upload profile photo'}
          onPress={() => void handlePickPhoto()}
          disabled={isBusyWithPhoto}
          style={({ pressed }) => [styles.heroRing, (pressed || isBusyWithPhoto) && styles.pressed]}
        >
          {data.avatarUrl ? (
            <Image
              source={{ uri: data.avatarUrl }}
              style={styles.heroAvatar}
              contentFit="cover"
              transition={150}
              accessibilityLabel="Your profile photo"
            />
          ) : (
            <LinearGradient colors={['#12B5A0', '#0B6A62']} style={styles.heroAvatar}>
              <Text style={styles.heroInitials}>{initialsOf(data.name)}</Text>
            </LinearGradient>
          )}
          <View style={styles.cameraBadge}>
            {isBusyWithPhoto ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons name="camera" size={16} color={colors.textInverse} />
            )}
          </View>
        </Pressable>

        <Text style={styles.heroName} numberOfLines={1}>
          {data.name}
        </Text>
        <Text style={styles.heroEmail} numberOfLines={1}>
          {data.email}
        </Text>

        <View style={styles.heroActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handlePickPhoto()}
            disabled={isBusyWithPhoto}
            style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
          >
            <Ionicons name="image-outline" size={16} color={colors.textInverse} />
            <Text style={styles.heroButtonLabel}>
              {uploadAvatar.isPending ? 'Uploading…' : data.avatarUrl ? 'Change photo' : 'Upload photo'}
            </Text>
          </Pressable>
          {data.avatarUrl ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleRemovePhoto}
              disabled={isBusyWithPhoto}
              style={({ pressed }) => [styles.heroRemove, pressed && styles.pressed]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.heroRemoveLabel}>{removeAvatar.isPending ? 'Removing…' : 'Remove'}</Text>
            </Pressable>
          ) : null}
        </View>
        {photoNotice ? (
          <Text style={[styles.heroNotice, photoNotice.tone === 'error' && styles.heroNoticeError]}>
            {photoNotice.message}
          </Text>
        ) : null}
      </LinearGradient>

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
        subtitle={
          hasPassword
            ? 'Your current password is required to set a new one'
            : 'You signed in with Google. Set a password to also sign in with your email.'
        }
        notice={passwordNotice}
      >
        {hasPassword ? (
          <TextField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="Your current password"
          />
        ) : null}
        <TextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        />
        <Button
          label={hasPassword ? 'Change password' : 'Set password'}
          onPress={handleChangePassword}
          isLoading={changePassword.isPending}
          disabled={(hasPassword && currentPassword.length === 0) || newPassword.length === 0}
        />
      </AccountCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    alignItems: 'center',
    borderRadius: radii.xxl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroBlobLarge: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(14,138,125,0.12)',
  },
  heroBlobSmall: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(224,122,63,0.14)',
  },
  heroRing: {
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    shadowColor: '#0B5F58',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroAvatar: {
    width: 112,
    height: 112,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroInitials: { color: colors.textInverse, fontSize: 36, fontWeight: '800' },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { marginTop: spacing.md, fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  heroEmail: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
  },
  heroButtonLabel: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '700' },
  heroRemove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    minHeight: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
  },
  heroRemoveLabel: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '700' },
  heroNotice: { marginTop: spacing.md, fontSize: fontSize.xs, color: colors.brandDark, fontWeight: '600' },
  heroNoticeError: { color: colors.danger },
  pressed: { opacity: 0.7 },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 17,
  },
});
