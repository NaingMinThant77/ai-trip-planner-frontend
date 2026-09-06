import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { FamilyMember } from '../../types/api';
import { initialsOf } from './gradient-header';

type Props = {
  member: FamilyMember;
  onRemove: () => void;
  isRemoving?: boolean;
};

export function FamilyMemberRow({ member, onRemove, isRemoving = false }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsOf(member.name)}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.email} numberOfLines={1}>
          {member.email}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${member.name}`}
        onPress={onRemove}
        disabled={isRemoving}
        style={({ pressed }) => [styles.remove, (pressed || isRemoving) && styles.pressed]}
      >
        <Ionicons name="close" size={18} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.brandDark, fontWeight: '700', fontSize: fontSize.sm },
  text: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  email: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  remove: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
