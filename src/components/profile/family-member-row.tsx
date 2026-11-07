import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radii, spacing } from '../../theme';
import { FamilyMember } from '../../types/api';
import { initialsOf } from './gradient-header';

type Props = {
  member: FamilyMember;
  /** Opens a chat with this member. Omit to render the row without that affordance. */
  onPress?: () => void;
  /** Unread messages from this member; shown as a badge when above zero. */
  unreadCount?: number;
};

export function FamilyMemberRow({ member, onPress, unreadCount = 0 }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Chat with ${member.name}` : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, onPress && pressed && styles.rowPressed]}
    >
      {member.avatarUrl ? (
        <Image
          source={{ uri: member.avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`${member.name}'s profile photo`}
        />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(member.name)}</Text>
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.email} numberOfLines={1}>
          {member.email}
        </Text>
      </View>
      {unreadCount > 0 ? (
        <View style={styles.badge} accessibilityLabel={`${unreadCount} unread`}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      ) : null}
      {onPress ? <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.brand} /> : null}
    </Pressable>
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
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  badgeText: { color: colors.textInverse, fontSize: 11, fontWeight: '800' },
  rowPressed: { opacity: 0.7 },
  avatarText: { color: colors.brandDark, fontWeight: '700', fontSize: fontSize.sm },
  text: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  email: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
