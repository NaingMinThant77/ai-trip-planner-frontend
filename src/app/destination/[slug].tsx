import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../api/client';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { useDestination } from '../../hooks/use-explore';
import {
  colors,
  fontSize,
  gradients,
  jellyShadowSmall,
  layout,
  radii,
  spacing,
  tripCoverGradient,
} from '../../theme';
import { GuideItem } from '../../types/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A blog-style guide to one destination: photo hero, then what to see, eat, know, book and pack. */
export default function DestinationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const destination = useDestination(slug);

  if (destination.isPending) return <LoadingState label="Loading the guide…" />;

  if (destination.isError) {
    return (
      <ErrorState
        message={
          destination.error instanceof ApiError
            ? destination.error.message
            : 'Could not load this destination.'
        }
        onRetry={() => void destination.refetch()}
      />
    );
  }

  const { guide, ...place } = destination.data;
  const bestTime = place.bestMonths.map((month) => MONTHS[month - 1]).join(' · ');

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={tripCoverGradient(place.slug)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {place.heroImageUrl ? (
            <Image
              source={{ uri: place.heroImageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : null}
          <LinearGradient
            colors={gradients.photoScrim}
            style={[StyleSheet.absoluteFill, styles.heroScrim]}
            pointerEvents="none"
          />
          <View style={styles.heroText}>
            <Text style={styles.country}>{place.country}</Text>
            <Text style={styles.title}>{place.name}</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.intro}>{guide.intro || place.summary}</Text>

          <View style={styles.facts}>
            {bestTime ? <Fact icon="sunny-outline" label="Best time" value={bestTime} /> : null}
            {place.dailyBudgetText ? (
              <Fact
                icon="wallet-outline"
                label="Typical daily spend"
                value={place.dailyBudgetText}
              />
            ) : null}
          </View>

          <Section title="Popular places" icon="location-outline" items={guide.places} />
          <Section title="Where to eat" icon="restaurant-outline" items={guide.restaurants} />
          <Section title="Culture" icon="color-palette-outline" items={guide.culture} />
          <Section title="Food to try" icon="fast-food-outline" items={guide.food} />
          <Section title="Booking tips" icon="bed-outline" items={guide.stay} />

          {guide.packing.length > 0 ? (
            <View>
              <SectionTitle title="What to pack" icon="bag-handle-outline" />
              <View style={styles.packing}>
                {guide.packing.map((item) => (
                  <View key={item} style={styles.packRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
                    <Text style={styles.packText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <Text style={styles.disclaimer}>
            Suggestions only. Prices, opening times and availability change, so check them before
            you book.
            {guide.photoCredit ? ` ${guide.photoCredit}.` : ''}
          </Text>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.back,
          { top: insets.top + spacing.sm },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/new-trip', params: { destination: place.name } })
          }
          style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
        >
          <Ionicons name="airplane-outline" size={18} color={colors.textInverse} />
          <Text style={styles.ctaLabel}>Plan a trip to {place.name}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color={colors.brand} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Section({
  title,
  icon,
  items,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: GuideItem[];
}) {
  if (items.length === 0) return null;

  return (
    <View>
      <SectionTitle title={title} icon={icon} />
      {items.map((item) => (
        <View key={item.title} style={styles.card}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
              accessibilityLabel={item.title}
            />
          ) : null}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBlurb}>{item.blurb}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={18} color={colors.brandDark} />
      <View style={styles.factText}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: layout.tabBarClearance },
  hero: { height: 320, justifyContent: 'flex-end', overflow: 'hidden' },
  heroScrim: { top: '30%' },
  heroText: { padding: spacing.lg },
  country: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textInverse, opacity: 0.9 },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textInverse },
  body: { padding: spacing.lg },
  intro: { fontSize: fontSize.md, lineHeight: 24, color: colors.text },
  facts: { gap: spacing.sm, marginTop: spacing.lg },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brandSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  factText: { flex: 1 },
  factLabel: { fontSize: fontSize.xs, color: colors.brandDark, fontWeight: '600' },
  factValue: { fontSize: fontSize.sm, color: colors.text },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...jellyShadowSmall,
  },
  cardImage: { width: '100%', height: 170, backgroundColor: colors.surfaceAlt },
  cardBody: { padding: spacing.lg },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardBlurb: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  packing: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  packRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  packText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20, color: colors.text },
  disclaimer: {
    fontSize: fontSize.xs,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  back: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...jellyShadowSmall,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
  },
  ctaLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.textInverse },
  pressed: { opacity: 0.8 },
});
