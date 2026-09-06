import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';

export function OrDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.rule} />
      <Text style={styles.label}>OR</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  label: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
});
