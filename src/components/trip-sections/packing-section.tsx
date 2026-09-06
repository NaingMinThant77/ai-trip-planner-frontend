import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../api/client';
import {
  useAddPackingItem,
  useDeletePackingItem,
  useGeneratePacking,
  usePacking,
  useTogglePackingItem,
} from '../../hooks/use-packing';
import { colors, fontSize, radii, spacing } from '../../theme';
import { PackingCategory, PackingItem } from '../../types/api';
import { Button } from '../ui/button';
import { EmptyState, ErrorState, LoadingState } from '../ui/screen-state';
import { TextField } from '../ui/text-field';

const CATEGORY_LABEL: Record<PackingCategory, string> = {
  clothing: 'Clothing',
  documents: 'Documents',
  electronics: 'Electronics',
  toiletries: 'Toiletries',
  health: 'Health',
  other: 'Other',
};

export function PackingSection({ tripId }: { tripId: string }) {
  const packing = usePacking(tripId);
  const addItem = useAddPackingItem(tripId);
  const toggleItem = useTogglePackingItem(tripId);
  const deleteItem = useDeletePackingItem(tripId);
  const generate = useGeneratePacking(tripId);

  const [label, setLabel] = useState('');

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

  function handleGenerate(): void {
    generate.mutate(undefined, {
      onError: (error) =>
        Alert.alert(
          'Could not build the list',
          error instanceof ApiError ? error.message : 'Please try again.',
        ),
    });
  }

  function handleAdd(): void {
    const trimmed = label.trim();
    if (!trimmed) return;
    setLabel('');
    addItem.mutate({ label: trimmed });
  }

  if (packing.data.length === 0) {
    return (
      <View>
        <EmptyState
          title="Nothing packed yet"
          message="Let the assistant draft a list from your destination and dates, then edit it."
          actionLabel={generate.isPending ? 'Building…' : 'Suggest a packing list'}
          onAction={handleGenerate}
        />
        <AddRow label={label} onChange={setLabel} onAdd={handleAdd} isPending={addItem.isPending} />
      </View>
    );
  }

  const grouped = groupByCategory(packing.data);
  const packed = packing.data.filter((item) => item.isPacked).length;

  return (
    <View>
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {packed} of {packing.data.length} packed
        </Text>
        <Button
          label={generate.isPending ? 'Adding…' : 'Suggest more'}
          variant="secondary"
          onPress={handleGenerate}
          isLoading={generate.isPending}
        />
      </View>

      {grouped.map(([category, items]) => (
        <View key={category} style={styles.group}>
          <Text style={styles.groupTitle}>{CATEGORY_LABEL[category]}</Text>

          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.isPacked }}
                accessibilityLabel={item.label}
                onPress={() => toggleItem.mutate({ itemId: item.id, isPacked: !item.isPacked })}
                style={styles.checkArea}
              >
                <Ionicons
                  name={item.isPacked ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={item.isPacked ? colors.success : colors.textMuted}
                />
                <Text style={[styles.itemLabel, item.isPacked && styles.itemPacked]}>
                  {item.quantity > 1 ? `${item.quantity} × ${item.label}` : item.label}
                </Text>
              </Pressable>

              {item.source === 'ai' ? <Text style={styles.badge}>suggested</Text> : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.label}`}
                onPress={() => deleteItem.mutate(item.id)}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      ))}

      <AddRow label={label} onChange={setLabel} onAdd={handleAdd} isPending={addItem.isPending} />
    </View>
  );
}

function AddRow({
  label,
  onChange,
  onAdd,
  isPending,
}: {
  label: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  isPending: boolean;
}) {
  return (
    <View style={styles.addRow}>
      <TextField
        label="Add an item"
        value={label}
        onChangeText={onChange}
        placeholder="Passport, adapter, walking shoes…"
        onSubmitEditing={onAdd}
        returnKeyType="done"
      />
      <Button label="Add" onPress={onAdd} isLoading={isPending} />
    </View>
  );
}

/** Stable category order so the list does not reshuffle as items are added. */
function groupByCategory(items: PackingItem[]): [PackingCategory, PackingItem[]][] {
  const order: PackingCategory[] = [
    'documents',
    'clothing',
    'toiletries',
    'electronics',
    'health',
    'other',
  ];

  return order
    .map((category): [PackingCategory, PackingItem[]] => [
      category,
      items.filter((item) => item.category === category),
    ])
    .filter(([, group]) => group.length > 0);
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  progressText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  group: { marginBottom: spacing.lg },
  groupTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  checkArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemLabel: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  itemPacked: { textDecorationLine: 'line-through', color: colors.textMuted },
  badge: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  addRow: { marginTop: spacing.md },
});
