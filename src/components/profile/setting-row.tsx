import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  /** Background of the icon tile. Pass a `colors.*Soft` token. */
  iconBackground: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  /** Omit to render an inert informational row — no chevron, no press feedback. */
  onPress?: () => void;
};

/** One white card in the settings stack: tinted icon tile, title, subtitle. */
export function SettingRow({
  icon,
  iconBackground,
  iconColor,
  title,
  subtitle,
  onPress,
}: Props) {
  const isInteractive = typeof onPress === 'function';

  return (
    <Pressable
      accessibilityRole={isInteractive ? 'button' : undefined}
      onPress={onPress}
      disabled={!isInteractive}
      style={({ pressed }) => [styles.row, pressed && isInteractive && styles.pressed]}
    >
      <View style={[styles.tile, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {isInteractive ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.7 },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  text: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
