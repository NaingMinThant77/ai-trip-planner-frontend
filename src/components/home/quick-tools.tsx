import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type QuickTool = {
  key: string;
  icon: IconName;
  label: string;
  /** Soft tint behind the icon. */
  background: string;
  iconColor: string;
  onPress: () => void;
};

/** The 2×2 shortcut grid: white cards with a tinted icon tile. A fifth tool wraps. */
export function QuickTools({ tools }: { tools: QuickTool[] }) {
  return (
    <View style={styles.grid}>
      {tools.map((tool) => (
        <Pressable
          key={tool.key}
          accessibilityRole="button"
          onPress={tool.onPress}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={[styles.iconWrap, { backgroundColor: tool.background }]}>
            <Ionicons name={tool.icon} size={22} color={tool.iconColor} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {tool.label}
          </Text>
          <View style={[styles.arrow, { backgroundColor: tool.background }]}>
            <Ionicons name="arrow-forward" size={12} color={tool.iconColor} />
          </View>
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
    gap: spacing.sm,
    borderRadius: radii.xl,
    padding: spacing.md,
    backgroundColor: colors.background,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { opacity: 0.75 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  arrow: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
