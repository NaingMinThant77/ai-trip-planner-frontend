import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type Props = {
  code: string;
};

/** Long enough to read the confirmation, short enough not to look stuck. */
const COPIED_FEEDBACK_MS = 1600;

export function InviteCodeCard({ code }: Props) {
  const [hasCopied, setHasCopied] = useState(false);

  async function handleShare(): Promise<void> {
    // The clipboard copy happens either way: on Android the share sheet can be dismissed
    // without picking anything, and the code should still be in hand after that.
    await Clipboard.setStringAsync(code);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), COPIED_FEEDBACK_MS);

    try {
      await Share.share({
        message: `Add me on AI Trip Planner with my invite code: ${code}`,
      });
    } catch {
      // Dismissing the sheet is not a failure worth surfacing — the code is copied.
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.tile}>
          <Ionicons name="people" size={16} color={colors.accent} />
        </View>
        <View style={styles.headingText}>
          <Text style={styles.title}>My invite code</Text>
          <Text style={styles.subtitle}>Share this code so family can add you</Text>
        </View>
      </View>

      <View style={styles.codeRow}>
        <Text accessibilityLabel={`Your invite code is ${code.split('').join(' ')}`} style={styles.code}>
          {code}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleShare()}
          style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
        >
          <Ionicons
            name={hasCopied ? 'checkmark' : 'copy-outline'}
            size={15}
            color={colors.textInverse}
          />
          <Text style={styles.shareLabel}>{hasCopied ? 'Copied' : 'Share'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  heading: { flexDirection: 'row', alignItems: 'center' },
  tile: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headingText: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  code: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    // Wide tracking so a code read aloud off the screen is hard to mis-transcribe.
    letterSpacing: 3,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  shareLabel: { color: colors.textInverse, fontSize: fontSize.sm, fontWeight: '700' },
});
