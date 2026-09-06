import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

/** Shared shell so every structured block reads as part of one system. */
export function BlockCard({
  heading,
  children,
  footnote,
}: {
  heading?: string;
  children: React.ReactNode;
  footnote?: string;
}) {
  return (
    <View style={styles.card}>
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      {children}
      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  heading: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  footnote: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
