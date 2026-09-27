import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type QuickTool = {
  key: string;
  icon: IconName;
  label: string;
  background: string;
  iconColor: string;
  onPress: () => void;
};

/** The 2×2 shortcut grid. Two per row, so a fifth tool wraps rather than shrinking. */
export function QuickTools({ tools }: { tools: QuickTool[] }) {
  return (
    <View style={styles.grid}>
      {tools.map((tool) => (
        <Pressable
          key={tool.key}
          accessibilityRole="button"
          onPress={tool.onPress}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: tool.background },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={tool.icon} size={19} color={tool.iconColor} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {tool.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    // Half the row minus the gap. Written as a percentage so it holds on any screen width.
    width: '47.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 68,
  },
  pressed: { opacity: 0.75 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
});
