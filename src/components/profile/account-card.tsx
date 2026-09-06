import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  iconBackground: string;
  iconColor: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Shown under the fields in green after a save, or in red after a failure. */
  notice?: { tone: 'success' | 'error'; message: string } | null;
};

/**
 * One self-contained card on the Account screen. Each card saves on its own — the screen is
 * deliberately not a single form, so changing a name never risks re-submitting an email.
 */
export function AccountCard({
  icon,
  iconBackground,
  iconColor,
  title,
  subtitle,
  children,
  notice,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={[styles.tile, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.headingText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.body}>{children}</View>

      {notice ? (
        <Text style={[styles.notice, notice.tone === 'error' ? styles.error : styles.success]}>
          {notice.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heading: { flexDirection: 'row', alignItems: 'center' },
  tile: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headingText: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  body: { marginTop: spacing.lg },
  notice: { fontSize: fontSize.xs, marginTop: spacing.sm },
  success: { color: colors.success },
  error: { color: colors.danger },
});
