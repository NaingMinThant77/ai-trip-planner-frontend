import { StyleSheet, Text } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';
import { TextBlock } from '../../types/blocks';

export function TextBlockView({ block }: { block: TextBlock }) {
  return <Text style={styles.body}>{block.body}</Text>;
}

const styles = StyleSheet.create({
  body: {
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.text,
    marginBottom: spacing.xs,
  },
});
