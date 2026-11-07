import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadMessages, useUnreadSync } from '../../hooks/use-chat';
import { colors, layout, radii, spacing } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * The bar floats over the content, so every scrolling screen in this group reserves
 * `layout.tabBarClearance` at the bottom. A new tab screen must do the same.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const unread = useUnreadMessages();
  useUnreadSync();
  const unreadTotal = unread.data?.total ?? 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brandDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.bar, { bottom: insets.bottom + spacing.sm }],
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        // Every tab screen paints its own header, so the stock one would double up.
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        sceneStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: renderIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'My trips',
          tabBarIcon: renderIcon('briefcase-outline', 'briefcase'),
        }}
      />
      <Tabs.Screen
        name="shared"
        options={{
          title: 'Shared',
          tabBarIcon: renderIcon('people-circle-outline', 'people-circle'),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Members',
          tabBarBadge: unreadTotal > 0 ? (unreadTotal > 99 ? '99+' : unreadTotal) : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: renderIcon('people-outline', 'people'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: renderIcon('person-outline', 'person'),
        }}
      />
    </Tabs>
  );
}

/**
 * The active tab is a filled teal disc with a white glyph; inactive tabs are a bare outline.
 * `tabBarIcon` is called on every render, so this returns the render function rather than
 * building one inline per screen.
 */
function renderIcon(idle: IconName, active: IconName) {
  return function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? active : idle}
          size={focused ? 19 : 21}
          color={focused ? colors.textInverse : color}
        />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: layout.tabBarHeight,
    borderRadius: radii.xxl,
    backgroundColor: colors.background,
    borderTopWidth: 0,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    // Lifts the pill off the content behind it. `elevation` is the Android half.
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  badge: { backgroundColor: colors.danger, color: colors.textInverse, fontSize: 10, fontWeight: '700' },
  item: { borderRadius: radii.xxl },
  label: { fontSize: 11, fontWeight: '600' },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.brand },
});
