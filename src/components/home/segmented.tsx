import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Underlined text tabs, as on Home. Not a pill switch — it sits inside the page, not on it. */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.value)}
            style={styles.item}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
            <View style={[styles.rule, isActive && styles.ruleActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xl },
  item: { alignItems: 'center' },
  label: { fontSize: fontSize.md, fontWeight: '700', color: colors.textMuted },
  labelActive: { color: colors.text },
  rule: { height: 2, alignSelf: 'stretch', marginTop: spacing.xs, backgroundColor: 'transparent' },
  ruleActive: { backgroundColor: colors.text },
});
