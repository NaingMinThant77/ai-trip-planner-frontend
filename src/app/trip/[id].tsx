import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ComponentProps, ReactNode, useState } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../api/client';
import { BookingsSection } from '../../components/trip-sections/bookings-section';
import { ItinerarySection } from '../../components/trip-sections/itinerary-section';
import { PackingSection } from '../../components/trip-sections/packing-section';
import { PhotosSection } from '../../components/trip-sections/photos-section';
import { ShareWithFamilyModal } from '../../components/trip-sections/share-popup-modal';
import { ErrorState, LoadingState } from '../../components/ui/screen-state';
import { useDestinationImage } from '../../hooks/use-destination-image';
import { useDeleteTrip, useTrip } from '../../hooks/use-trips';
import { TripDetail } from '../../types/api';
import { colors, fontSize, radii, spacing, tripCoverGradient } from '../../theme';
import { confirmAction } from '../../components/ui/confirm-host';

type IconName = ComponentProps<typeof Ionicons>['name'];

const SECTIONS = [
  { key: 'itinerary', label: 'Plan', icon: 'map', iconOutline: 'map-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'ticket', iconOutline: 'ticket-outline' },
  { key: 'packing', label: 'Packing', icon: 'bag-handle', iconOutline: 'bag-handle-outline' },
  { key: 'photos', label: 'Photos', icon: 'images', iconOutline: 'images-outline' },
] as const satisfies readonly { key: string; label: string; icon: IconName; iconOutline: IconName }[];

type SectionKey = (typeof SECTIONS)[number]['key'];

const HERO_SCRIM = ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)'] as const;

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = id ?? '';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const trip = useTrip(tripId);
  const deleteTrip = useDeleteTrip();
  // The uploaded cover wins; the Wikipedia lookup only covers older trips created without one.
  const destinationImage = useDestinationImage(
    trip.data && !trip.data.coverImageUrl ? trip.data.destination : '',
  );
  const [section, setSection] = useState<SectionKey>('itinerary');
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (trip.isPending) return <LoadingState label="Loading trip…" />;

  if (trip.isError) {
    return (
      <ErrorState
        message={trip.error instanceof ApiError ? trip.error.message : 'Could not load this trip.'}
        onRetry={() => void trip.refetch()}
      />
    );
  }

  function confirmDelete(): void {
    confirmAction({
      title: 'Delete this trip?',
      message: 'This removes the itinerary, packing list, bookings and photos for good.',
      confirmLabel: 'Delete trip',
      onConfirm: () =>
        deleteTrip.mutate(tripId, {
          onSuccess: () => router.replace('/(tabs)/trips'),
          onError: (error) =>
            Alert.alert(
              'Could not delete',
              error instanceof ApiError ? error.message : 'Please try again.',
            ),
        }),
    });
  }

  function goBack(): void {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/trips');
  }

  const data = trip.data;
  const heroImage = data.coverImageUrl ?? destinationImage.data ?? null;
  const isOwner = data.viewerRole === 'owner';

  const heroContent = (
    <LinearGradient colors={HERO_SCRIM} style={[styles.heroInner, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.heroActions}>
        <HeroButton icon="arrow-back" label="Go back" onPress={goBack} />
        <View style={styles.heroActionsRight}>
          {isOwner ? (
            <HeroButton
              icon="share-social-outline"
              label="Share with family"
              onPress={() => setIsShareOpen(true)}
            />
          ) : null}
          {isOwner ? (
            <HeroButton icon="trash-outline" label="Delete this trip" onPress={confirmDelete} />
          ) : null}
        </View>
      </View>

      <HeroText data={data} />
    </LinearGradient>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        {heroImage ? (
          <ImageBackground source={{ uri: heroImage }} style={styles.hero}>
            {heroContent}
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={tripCoverGradient(tripId)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {heroContent}
          </LinearGradient>
        )}

        <View style={styles.tabsBar}>
          <View style={styles.tabsRow}>
            {SECTIONS.map((item) => {
              const isActive = section === item.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setSection(item.key)}
                  style={[styles.tab, isActive && styles.tabActive]}
                >
                  <Ionicons
                    name={isActive ? item.icon : item.iconOutline}
                    size={16}
                    color={isActive ? colors.textInverse : colors.textMuted}
                  />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          {!isOwner ? (
            <View style={styles.accessBanner}>
              <Ionicons
                name={data.viewerRole === 'editor' ? 'create-outline' : 'eye-outline'}
                size={16}
                color={colors.info}
              />
              <Text style={styles.accessBannerText}>
                Shared with you · {data.viewerRole === 'editor' ? 'you can edit' : 'view only'}
              </Text>
            </View>
          ) : null}

          {section === 'itinerary' ? <ItinerarySection trip={data} /> : null}
          {section === 'packing' ? (
            <PackingSection tripId={tripId} viewerRole={data.viewerRole} />
          ) : null}
          {section === 'photos' ? (
            <PhotosSection tripId={tripId} viewerRole={data.viewerRole} />
          ) : null}
          {section === 'bookings' ? (
            <BookingsSection tripId={tripId} viewerRole={data.viewerRole} />
          ) : null}
        </View>
      </ScrollView>

      <ShareWithFamilyModal
        visible={isShareOpen}
        tripId={tripId}
        tripTitle={data.title}
        onClose={() => setIsShareOpen(false)}
      />
    </>
  );
}

function HeroButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.heroButton, pressed && styles.heroButtonPressed]}
    >
      <Ionicons name={icon} size={20} color={colors.textInverse} />
    </Pressable>
  );
}

function HeroText({ data }: { data: TripDetail }) {
  return (
    <View>
      <Text style={styles.title}>{data.title}</Text>
      <HeroMeta icon="location">
        {data.source ? `${data.source}  →  ${data.destination}` : data.destination}
      </HeroMeta>
      <HeroMeta icon="calendar">
        {formatRange(data.startDate, data.endDate)} · {data.travelers}{' '}
        {data.travelers === 1 ? 'traveller' : 'travellers'}
      </HeroMeta>
      {data.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {data.notes}
        </Text>
      ) : null}
    </View>
  );
}

function HeroMeta({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={colors.textInverse} />
      <Text style={styles.metaText} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

function formatRange(start: string, end: string): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const from = new Date(start).toLocaleDateString(undefined, options);
  const to = new Date(end).toLocaleDateString(undefined, { ...options, year: 'numeric' });
  return `${from} – ${to}`;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.surface },
  content: { paddingBottom: spacing.xxl },
  hero: {
    minHeight: 300,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  heroInner: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroActionsRight: { flexDirection: 'row', gap: spacing.sm },
  heroButton: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonPressed: { opacity: 0.7 },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textInverse,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  metaText: { flexShrink: 1, fontSize: fontSize.xs, fontWeight: '700', color: colors.textInverse },
  notes: {
    fontSize: fontSize.xs,
    color: colors.textInverse,
    opacity: 0.85,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  tabsBar: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.xxl,
    shadowColor: '#0B5F58',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tabsRow: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.sm },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  tabActive: { backgroundColor: colors.brand },
  tabLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  tabLabelActive: { color: colors.textInverse },
  section: { padding: spacing.lg },
  accessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    backgroundColor: colors.infoSoft,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  accessBannerText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.info },
});
