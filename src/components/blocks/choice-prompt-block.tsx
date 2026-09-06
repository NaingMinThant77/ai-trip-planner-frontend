import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';
import { ChoicePromptBlock } from '../../types/blocks';
import { Chip } from '../ui/chip';
import { BlockCard } from './block-card';

export function ChoicePromptBlockView({
  block,
  onChoice,
}: {
  block: ChoicePromptBlock;
  onChoice?: (value: string) => void;
}) {
  return (
    <BlockCard>
      <Text style={styles.question}>{block.question}</Text>
      <View style={styles.choices}>
        {block.choices.map((choice) => (
          <Chip
            key={choice.value}
            label={choice.label}
            // Without a handler the chips render as plain, non-tappable context.
            onPress={onChoice ? () => onChoice(choice.value) : undefined}
          />
        ))}
      </View>
    </BlockCard>
  );
}

const styles = StyleSheet.create({
  question: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap' },
});
