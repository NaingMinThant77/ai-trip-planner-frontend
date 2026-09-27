import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { API_ORIGIN, ApiError } from '../../api/client';
import {
  useAddCollaboratorByCode,
  useCollaborators,
  useRemoveCollaborator,
  useShareState,
  useToggleShare,
  useUpdateCollaboratorRole,
} from '../../hooks/use-sharing';
import { colors, fontSize, jellyColors, jellyShadow, radii, spacing } from '../../theme';
import { CollaboratorRole } from '../../types/api';
import { AddByCode } from '../profile/add-by-code';
import { GradientButton } from '../ui/gradient-button';
import { ErrorState, LoadingState } from '../ui/screen-state';

const ROLE_LABEL: Record<CollaboratorRole, string> = { viewer: 'View', editor: 'Edit' };

type Props = {
  visible: boolean;
  tripId: string;
  tripTitle: string;
  onClose: () => void;
};

/**
 * "Share with family" popup — replaces the old Share tab. Family/invite-code sharing is the
 * primary flow (top); the previously-existing read-only public link lives on underneath a
 * divider so that feature isn't lost, just de-emphasised to match the mockup.
 */
export function ShareWithFamilyModal({ visible, tripId, tripTitle, onClose }: Props) {
  const collaborators = useCollaborators(tripId);
  const addByCode = useAddCollaboratorByCode(tripId);
  const removeCollaborator = useRemoveCollaborator(tripId);
  const updateRole = useUpdateCollaboratorRole(tripId);
  const shareState = useShareState(tripId);
  const toggleShare = useToggleShare(tripId);

  const [codeError, setCodeError] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<CollaboratorRole>('viewer');

  async function handleAddByCode(code: string): Promise<void> {
    setCodeError(null);
    try {
      await addByCode.mutateAsync({ code, role: newRole });
    } catch (error) {
      setCodeError(error instanceof ApiError ? error.message : 'Could not add that person.');
      throw error;
    }
  }

  function handleChangeRole(collaboratorId: string, currentRole: CollaboratorRole): void {
    updateRole.mutate({
      collaboratorId,
      role: currentRole === 'viewer' ? 'editor' : 'viewer',
    });
  }

  const shareUrl = shareState.data?.sharePath ? `${API_ORIGIN}/api${shareState.data.sharePath}` : null;

  async function handleShareLink(): Promise<void> {
    if (!shareUrl) return;
    // The OS sheet is the only thing that actually sends anything — nothing is emailed by us.
    await Share.share({ message: `${tripTitle} — our itinerary:\n${shareUrl}` });
  }

  async function handleCopyLink(): Promise<void> {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    Alert.alert('Link copied', 'Paste it wherever you like.');
  }

  function handleToggleLink(next: boolean): void {
    if (!next) {
      Alert.alert('Stop sharing?', 'The existing link will stop working immediately.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop sharing', style: 'destructive', onPress: () => toggleShare.mutate(false) },
      ]);
      return;
    }
    toggleShare.mutate(true);
  }

  const people = collaborators.data ?? [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, jellyShadow]}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={22} color={jellyColors.mint} />
            </View>
            <Text style={styles.title}>Share with family</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Shared members can view and edit itinerary, bookings, and packing.
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>New member gets</Text>
            <View style={styles.roleRow}>
              {(['viewer', 'editor'] as const).map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: newRole === option }}
                  onPress={() => setNewRole(option)}
                  style={[styles.roleChip, newRole === option && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipLabel, newRole === option && styles.roleChipLabelActive]}>
                    {ROLE_LABEL[option]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AddByCode onAdd={handleAddByCode} isPending={addByCode.isPending} />
            {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

            {collaborators.isPending ? (
              <LoadingState label="Loading family members…" />
            ) : collaborators.isError ? (
              <ErrorState
                message={
                  collaborators.error instanceof ApiError
                    ? collaborators.error.message
                    : 'Could not load family members.'
                }
                onRetry={() => void collaborators.refetch()}
              />
            ) : people.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No family members yet. Add someone with their invite code.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {people.map((person) => (
                  <View key={person.id} style={styles.person}>
                    <View style={styles.personAvatar}>
                      <Text style={styles.personInitial}>
                        {(person.name ?? person.email).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.personText}>
                      <Text style={styles.personName}>{person.name ?? person.email}</Text>
                      {person.name ? <Text style={styles.personEmail}>{person.email}</Text> : null}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${person.name ?? person.email} has ${ROLE_LABEL[person.role]} access — tap to change`}
                      onPress={() => handleChangeRole(person.id, person.role)}
                      disabled={updateRole.isPending}
                      style={[styles.roleBadge, person.role === 'editor' && styles.roleBadgeEditor]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeLabel,
                          person.role === 'editor' && styles.roleBadgeLabelEditor,
                        ]}
                      >
                        {ROLE_LABEL[person.role]}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${person.email}`}
                      onPress={() => removeCollaborator.mutate(person.id)}
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or share a public link</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.linkCard}>
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.linkCardTitle}>Read-only link</Text>
                  <Text style={styles.linkCardBody}>
                    Anyone with the link can see the plan — no account needed.
                  </Text>
                </View>
                <Switch
                  value={shareState.data?.isShared ?? false}
                  onValueChange={handleToggleLink}
                  disabled={toggleShare.isPending || shareState.isPending}
                  trackColor={{ true: jellyColors.mint }}
                />
              </View>

              {shareState.data?.isShared && shareUrl ? (
                <View style={styles.linkBlock}>
                  <Text style={styles.link} numberOfLines={1}>
                    {shareUrl}
                  </Text>
                  <View style={styles.linkActions}>
                    <Pressable style={styles.linkAction} onPress={() => void handleShareLink()}>
                      <Ionicons name="share-social-outline" size={16} color={jellyColors.sky} />
                      <Text style={styles.linkActionLabel}>Share</Text>
                    </Pressable>
                    <Pressable style={styles.linkAction} onPress={() => void handleCopyLink()}>
                      <Ionicons name="copy-outline" size={16} color={jellyColors.sky} />
                      <Text style={styles.linkActionLabel}>Copy</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Every add/remove/toggle above already persists immediately via its own mutation —
              there is no separate server-side "save" step. This button is purely a confirmatory
              "done" affordance that dismisses the sheet, not a submit for unsaved local state. */}
          <GradientButton label="Save sharing" onPress={onClose} style={styles.saveButton} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: jellyColors.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: spacing.md },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: jellyColors.mint, borderColor: jellyColors.mint },
  roleChipLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  roleChipLabelActive: { color: colors.textInverse },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: jellyColors.skySoft,
  },
  roleBadgeEditor: { backgroundColor: jellyColors.mintSoft },
  roleBadgeLabel: { fontSize: fontSize.xs, fontWeight: '700', color: jellyColors.sky },
  roleBadgeLabelEditor: { color: jellyColors.mint },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
  emptyState: {
    backgroundColor: jellyColors.skySoft,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  list: { gap: spacing.sm, marginBottom: spacing.md },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: jellyColors.grapeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: { fontSize: fontSize.sm, fontWeight: '800', color: jellyColors.grape },
  personText: { flex: 1 },
  personName: { fontSize: fontSize.sm, color: colors.text, fontWeight: '700' },
  personEmail: { fontSize: fontSize.xs, color: colors.textMuted },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  linkCard: {
    backgroundColor: jellyColors.skySoft,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1 },
  linkCardTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  linkCardBody: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  linkBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  link: {
    fontSize: fontSize.xs,
    color: colors.text,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  linkActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  linkAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  linkActionLabel: { fontSize: fontSize.xs, fontWeight: '700', color: jellyColors.sky },
  saveButton: { marginTop: spacing.lg },
});
