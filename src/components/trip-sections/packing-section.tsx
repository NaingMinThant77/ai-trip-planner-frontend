import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError } from '../../api/client';
import {
  useAddPackingItem,
  useDeletePackingItem,
  useEditPackingItem,
  usePacking,
  useTogglePackingItem,
} from '../../hooks/use-packing';
import { colors, fontSize, jellyShadow, jellyShadowSmall, radii, spacing } from '../../theme';
import { PACKING_CATEGORIES, PackingCategory, PackingItem, ViewerRole } from '../../types/api';
import { Button } from '../ui/button';
import { Chip } from '../ui/chip';
import { ErrorState, LoadingState } from '../ui/screen-state';
import { TextField } from '../ui/text-field';

type IconName = ComponentProps<typeof Ionicons>['name'];

const CATEGORY_META: Record<PackingCategory, { label: string; icon: IconName }> = {
  documents: { label: 'Documents', icon: 'document-text-outline' },
  clothing: { label: 'Clothing', icon: 'shirt-outline' },
  toiletries: { label: 'Toiletries', icon: 'water-outline' },
  electronics: { label: 'Electronics', icon: 'flash-outline' },
  health: { label: 'Health', icon: 'medkit-outline' },
  other: { label: 'Other', icon: 'briefcase-outline' },
};

export function PackingSection({
  tripId,
  viewerRole,
}: {
  tripId: string;
  viewerRole: ViewerRole;
}) {
  const canEdit = viewerRole !== 'viewer';
  const packing = usePacking(tripId);
  const addItem = useAddPackingItem(tripId);
  const toggleItem = useTogglePackingItem(tripId);
  const editItem = useEditPackingItem(tripId);
  const deleteItem = useDeletePackingItem(tripId);

  const [label, setLabel] = useState('');
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);

  if (packing.isPending) return <LoadingState label="Loading your packing list…" />;

  if (packing.isError) {
    return (
      <ErrorState
        message={
          packing.error instanceof ApiError ? packing.error.message : 'Could not load the list.'
        }
        onRetry={() => void packing.refetch()}
      />
    );
  }

  function handleAdd(): void {
    const trimmed = label.trim();
    if (!trimmed) return;
    addItem.mutate(
      { label: trimmed },
      {
        onSuccess: () => setLabel(''),
        onError: (error) =>
          Alert.alert(
            'Could not add that item',
            error instanceof ApiError ? error.message : 'Please try again.',
          ),
      },
    );
  }

  function handleEditSubmit(values: { label: string; category: PackingCategory; quantity: number }): void {
    if (!editingItem) return;
    editItem.mutate(
      { itemId: editingItem.id, ...values },
      {
        onSuccess: () => setEditingItem(null),
        onError: (error) =>
          Alert.alert(
            'Could not save changes',
            error instanceof ApiError ? error.message : 'Please try again.',
          ),
      },
    );
  }

  function confirmDelete(item: PackingItem): void {
    Alert.alert('Remove this item?', `"${item.label}" will be removed from your list.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteItem.mutate(item.id) },
    ]);
  }

  const items = packing.data;
  const packed = items.filter((item) => item.isPacked).length;

  return (
    <View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Packing list</Text>
        {items.length > 0 ? (
          <Text style={styles.count}>
            {packed} of {items.length} packed
          </Text>
        ) : null}
      </View>

      {canEdit ? (
        <View style={styles.addRow}>
          <TextInput
            accessibilityLabel="Add packing item"
            placeholder="Add packing item"
            placeholderTextColor={colors.textMuted}
            value={label}
            onChangeText={setLabel}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            style={styles.addInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add item"
            onPress={handleAdd}
            disabled={addItem.isPending || label.trim().length === 0}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
              (addItem.isPending || label.trim().length === 0) && styles.addButtonDisabled,
            ]}
          >
            {addItem.isPending ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Ionicons name="add" size={26} color={colors.textInverse} />
            )}
          </Pressable>
        </View>
      ) : null}

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={28} color={colors.brand} />
          <Text style={styles.emptyTitle}>Nothing on the list yet</Text>
          <Text style={styles.emptyBody}>
            {canEdit
              ? 'Add passport, chargers, clothes — anything you need to bring.'
              : 'The trip owner has not added any items yet.'}
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.isPacked, disabled: !canEdit }}
              accessibilityLabel={item.label}
              onPress={
                canEdit
                  ? () => toggleItem.mutate({ itemId: item.id, isPacked: !item.isPacked })
                  : undefined
              }
              disabled={!canEdit}
              hitSlop={6}
              style={[styles.checkbox, item.isPacked && styles.checkboxChecked]}
            >
              {item.isPacked ? <Ionicons name="checkmark" size={18} color={colors.textInverse} /> : null}
            </Pressable>

            <View style={styles.iconTile}>
              <Ionicons name={CATEGORY_META[item.category].icon} size={18} color={colors.brand} />
            </View>

            <Text style={[styles.itemLabel, item.isPacked && styles.itemPacked]} numberOfLines={2}>
              {item.quantity > 1 ? `${item.quantity} × ${item.label}` : item.label}
            </Text>

            {canEdit ? (
              <View style={styles.rowActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.label}`}
                  onPress={() => setEditingItem(item)}
                  hitSlop={8}
                >
                  <Ionicons name="pencil" size={18} color={colors.brand} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.label}`}
                  onPress={() => confirmDelete(item)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ))
      )}

      {editingItem ? (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={handleEditSubmit}
          isPending={editItem.isPending}
        />
      ) : null}
    </View>
  );
}

function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        hitSlop={8}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.stepperButton}
      >
        <Ionicons name="remove" size={16} color={colors.brand} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        hitSlop={8}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={styles.stepperButton}
      >
        <Ionicons name="add" size={16} color={colors.brand} />
      </Pressable>
    </View>
  );
}

function EditItemModal({
  item,
  onClose,
  onSubmit,
  isPending,
}: {
  item: PackingItem;
  onClose: () => void;
  onSubmit: (values: { label: string; category: PackingCategory; quantity: number }) => void;
  isPending: boolean;
}) {
  const [label, setLabel] = useState(item.label);
  const [category, setCategory] = useState<PackingCategory>(item.category);
  const [quantity, setQuantity] = useState(item.quantity);

  function handleSave(): void {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSubmit({ label: trimmed, category, quantity });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit item</Text>

          <TextField
            label="Item name"
            value={label}
            onChangeText={setLabel}
            placeholder="Item name"
            returnKeyType="done"
          />

          <Text style={styles.modalLabel}>Category</Text>
          <View style={styles.chipRow}>
            {PACKING_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={CATEGORY_META[cat].label}
                isSelected={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </View>

          <Text style={styles.modalLabel}>Quantity</Text>
          <QuantityStepper value={quantity} onChange={setQuantity} />

          <View style={styles.modalActions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.modalButton} />
            <Button
              label="Save"
              onPress={handleSave}
              isLoading={isPending}
              disabled={label.trim().length === 0}
              style={styles.modalSaveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heading: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  count: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  pressed: { opacity: 0.8 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  addInput: {
    flex: 1,
    minHeight: 54,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...jellyShadowSmall,
  },
  addButtonDisabled: { opacity: 0.5 },
  empty: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...jellyShadowSmall,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.brand, borderColor: colors.brand },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  itemPacked: { textDecorationLine: 'line-through', color: colors.textMuted },
  rowActions: { flexDirection: 'row', gap: spacing.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...jellyShadowSmall,
  },
  stepperValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.background,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    ...jellyShadow,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  modalLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalButton: { flex: 1 },
  modalSaveButton: { flex: 1, backgroundColor: colors.brand },
});
