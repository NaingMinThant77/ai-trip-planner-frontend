import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError } from "../../api/client";
import { AddByCode } from "../../components/profile/add-by-code";
import { FamilyMemberRow } from "../../components/profile/family-member-row";
import { GradientHeader } from "../../components/profile/gradient-header";
import { InviteCodeCard } from "../../components/profile/invite-code-card";
import { ErrorState, LoadingState } from "../../components/ui/screen-state";
import { useProfile } from "../../hooks/use-explore";
import {
  useAddFamilyMember,
  useFamily,
  useRemoveFamilyMember,
} from "../../hooks/use-family";
import { colors, fontSize, layout, radii, spacing } from "../../theme";

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function FamilyScreen() {
  const profile = useProfile();
  const family = useFamily();
  const addMember = useAddFamilyMember();
  const removeMember = useRemoveFamilyMember();

  // Both queries feed one screen, so they share one loading and one error state.
  if (profile.isPending || family.isPending)
    return <LoadingState label="Loading your family…" />;

  if (profile.isError || family.isError) {
    return (
      <ErrorState
        message={messageOf(
          profile.error ?? family.error,
          "Could not load your family list.",
        )}
        onRetry={() => {
          void profile.refetch();
          void family.refetch();
        }}
      />
    );
  }

  async function handleAdd(code: string): Promise<void> {
    try {
      const member = await addMember.mutateAsync(code);
      Alert.alert("Added", `${member.name} is now in your family.`);
    } catch (error) {
      // Rethrown as nothing: the alert is the whole report, and `AddByCode` keeps the
      // typed code on screen so it can be corrected rather than retyped.
      Alert.alert(
        "Could not add",
        messageOf(error, "Please check the code and try again."),
      );
      throw error;
    }
  }

  function handleRemove(id: string, name: string): void {
    Alert.alert(
      "Remove member",
      `${name} will no longer appear when you share a trip.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeMember.mutate(id, {
              onError: (error) => {
                Alert.alert(
                  "Could not remove",
                  messageOf(error, "Please try again."),
                );
              },
            });
          },
        },
      ],
    );
  }

  const members = family.data;

  return (
    <View style={styles.screen}>
      <GradientHeader
        title="Family"
        subtitle={
          members.length === 0
            ? "Nobody added yet"
            : `${members.length} ${members.length === 1 ? "person" : "people"}`
        }
        badge="👨‍👩‍👧"
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* <InviteCodeCard code={profile.data.inviteCode} /> */}

        <Text style={styles.sectionTitle}>Family members</Text>
        <Text style={styles.sectionBody}>
          Add someone once with their invite code, then share any trip with
          them.
        </Text>

        <AddByCode onAdd={handleAdd} isPending={addMember.isPending} />

        {members.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No family members yet</Text>
          </View>
        ) : (
          members.map((member) => (
            <FamilyMemberRow
              key={member.id}
              member={member}
              onRemove={() => handleRemove(member.id, member.name)}
              isRemoving={
                removeMember.isPending && removeMember.variables === member.id
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: {
    padding: spacing.lg,
    paddingBottom: layout.tabBarClearance,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  sectionBody: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  empty: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted },
});
