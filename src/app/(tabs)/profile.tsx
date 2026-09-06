import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError } from "../../api/client";
import {
  GradientHeader,
  initialsOf,
} from "../../components/profile/gradient-header";
import { SettingRow } from "../../components/profile/setting-row";
import { ErrorState, LoadingState } from "../../components/ui/screen-state";
import { useAuth } from "../../context/auth";
import { useProfile } from "../../hooks/use-explore";
import { useFamily } from "../../hooks/use-family";
import { colors, fontSize, layout, radii, spacing } from "../../theme";
import { InviteCodeCard } from "@/components/profile/invite-code-card";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const profile = useProfile();
  // Read-only here: the count is a hint that the Family tab is where the list lives.
  const family = useFamily();

  if (profile.isPending) return <LoadingState label="Loading your profile…" />;

  if (profile.isError) {
    return (
      <ErrorState
        message={
          profile.error instanceof ApiError
            ? profile.error.message
            : "Could not load profile."
        }
        onRetry={() => void profile.refetch()}
      />
    );
  }

  function handleSignOut(): void {
    Alert.alert("Sign out", "You will need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  const name = user?.name ?? profile.data.name;
  const memberCount = family.data?.length ?? 0;

  return (
    <View style={styles.screen}>
      <GradientHeader
        title={name}
        subtitle={profile.data.email}
        badge={initialsOf(name)}
        imageUrl={profile.data.avatarUrl}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <InviteCodeCard code={profile.data.inviteCode} />

        <SettingRow
          icon="people-outline"
          iconBackground={colors.accentSoft}
          iconColor={colors.accent}
          title="Family members"
          subtitle={
            memberCount === 0
              ? "Add family with an invite code"
              : `${memberCount} ${memberCount === 1 ? "person" : "people"} you can share trips with`
          }
          onPress={() => router.push("/(tabs)/family")}
        />

        <SettingRow
          icon="person-outline"
          iconBackground={colors.brandSoft}
          iconColor={colors.brandDark}
          title="Travel profile"
          subtitle="Preferences and saved traveller details"
          onPress={() => router.push("/travel-profile")}
        />

        <SettingRow
          icon="mail-outline"
          iconBackground={colors.infoSoft}
          iconColor={colors.info}
          title="Account details"
          subtitle="Name, email, photo and password"
          onPress={() => router.push('/account')}
        />

        <SettingRow
          icon="shield-checkmark-outline"
          iconBackground={colors.accentSoft}
          iconColor={colors.accent}
          title="Secure session"
          subtitle="Signed in with an encrypted token on this device"
        />

        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
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
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.lg,
    minHeight: 52,
    marginTop: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  signOutLabel: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
