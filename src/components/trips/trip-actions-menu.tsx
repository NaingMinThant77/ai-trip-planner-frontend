import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

/** Where the "⋮" button sits on screen, so the menu can open right under it. */
export type MenuAnchor = { x: number; y: number; width: number; height: number };

type Props = {
  anchor: MenuAnchor | null;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** A small popover with View / Edit / Delete. Tapping outside, or any item, closes it. */
export function TripActionsMenu({ anchor, onClose, onView, onEdit, onDelete }: Props) {
  const { width: windowWidth } = useWindowDimensions();

  // Close first, then act: navigating or showing an Alert with a Modal still open is flaky.
  function choose(action: () => void): void {
    onClose();
    action();
  }

  return (
    <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close menu"
        style={styles.backdrop}
        onPress={onClose}
      >
        {anchor ? (
          <View
            style={[
              styles.menu,
              {
                top: anchor.y + anchor.height + spacing.xs,
                // Right edges line up with the button.
                right: Math.max(spacing.md, windowWidth - (anchor.x + anchor.width)),
              },
            ]}
          >
            <MenuItem icon="eye-outline" label="View" onPress={() => choose(onView)} />
            <MenuItem icon="create-outline" label="Edit" onPress={() => choose(onEdit)} />
            <MenuItem icon="trash-outline" label="Delete" danger onPress={() => choose(onDelete)} />
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  danger = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'transparent' },
  menu: {
    position: 'absolute',
    minWidth: 150,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  itemPressed: { backgroundColor: colors.surface },
  label: { fontSize: fontSize.md, fontWeight: '600' },
});
