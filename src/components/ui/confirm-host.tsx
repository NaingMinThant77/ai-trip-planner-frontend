import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type ConfirmOptions = {
  title: string;
  message: string;
  /** Label of the red button. Defaults to "Delete". */
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: IconName;
  /** `brand` turns the popup teal for non-destructive questions. Defaults to `danger`. */
  tone?: 'danger' | 'brand';
  onConfirm: () => void;
};

let show: ((options: ConfirmOptions) => void) | null = null;

/**
 * A styled replacement for the native two-button `Alert.alert` used on destructive actions.
 * Call it from anywhere; `<ConfirmHost />` (mounted once in the root layout) renders it.
 */
export function confirmAction(options: ConfirmOptions): void {
  show?.(options);
}

export function ConfirmHost() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    show = setOptions;
    return () => {
      show = null;
    };
  }, []);

  function close(): void {
    setOptions(null);
  }

  function confirm(): void {
    const action = options?.onConfirm;
    close();
    action?.();
  }

  return (
    <Modal visible={options !== null} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss" />
        {options ? (
          <View style={styles.card}>
            <View style={[styles.iconRing, options.tone === 'brand' && styles.iconRingBrand]}>
              <View style={styles.icon}>
                <Ionicons
                  name={options.icon ?? 'trash'}
                  size={26}
                  color={options.tone === 'brand' ? colors.brand : colors.danger}
                />
              </View>
            </View>
            <Text style={styles.title}>{options.title}</Text>
            <Text style={styles.message}>{options.message}</Text>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={close}
                style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
              >
                <Text style={styles.cancelLabel}>{options.cancelLabel ?? 'Cancel'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirm}
                style={({ pressed }) => [
                  styles.confirm,
                  options.tone === 'brand' && styles.confirmBrand,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmLabel}>{options.confirmLabel ?? 'Delete'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconRingBrand: { backgroundColor: colors.brandSoft },
  confirmBrand: { backgroundColor: colors.brand, shadowColor: colors.brand },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, textAlign: 'center' },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, alignSelf: 'stretch' },
  cancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.textMuted },
  confirm: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  confirmLabel: { fontSize: fontSize.md, fontWeight: '800', color: colors.textInverse },
  pressed: { opacity: 0.8 },
});
