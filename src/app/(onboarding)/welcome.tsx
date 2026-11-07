import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ComponentProps, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '../../components/auth/brand-header';
import { GradientButton } from '../../components/ui/gradient-button';
import { useAuth } from '../../context/auth';
import { colors, fontSize, radii, spacing } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Slide = {
  key: string;
  icon: IconName;
  /** Two-stop gradient for the hero tile and the soft wash behind the slide. */
  gradient: readonly [string, string];
  wash: string;
  /** Small floating chips around the hero tile. */
  chips: { icon: IconName; color: string; top: number; left?: number; right?: number }[];
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    key: 'plan',
    icon: 'map',
    gradient: ['#12B5A0', '#0B7F73'],
    wash: '#DDF4EE',
    chips: [
      { icon: 'airplane', color: '#3D9EF0', top: 6, left: 4 },
      { icon: 'sparkles', color: '#E07A3F', top: 120, right: 0 },
    ],
    title: 'Plan in minutes, not evenings',
    body: 'Tell the assistant where and when. It builds a day-by-day itinerary you can actually follow.',
  },
  {
    key: 'organise',
    icon: 'bag-handle',
    gradient: ['#F59A5B', '#E0662A'],
    wash: '#FDEEE2',
    chips: [
      { icon: 'camera', color: '#12B5A0', top: 10, right: 6 },
      { icon: 'ticket', color: '#3D9EF0', top: 126, left: 0 },
    ],
    title: 'Everything in one place',
    body: 'Packing list, booking notes, photos and maps all live alongside the plan for each trip.',
  },
  {
    key: 'share',
    icon: 'people',
    gradient: ['#5B9CF5', '#3B6FE0'],
    wash: '#E4EDFB',
    chips: [
      { icon: 'chatbubble-ellipses', color: '#12B5A0', top: 4, left: 8 },
      { icon: 'heart', color: '#E0662A', top: 124, right: 4 },
    ],
    title: 'Bring your people along',
    body: 'Add members with an invite code, share any trip with them and plan it together in real time.',
  },
];

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { completeOnboarding } = useAuth();
  const router = useRouter();
  const width = Dimensions.get('window').width;

  const isLast = index === SLIDES.length - 1;
  const current = SLIDES[index];

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  }

  async function finish(): Promise<void> {
    await completeOnboarding();
    router.replace('/(auth)/sign-in');
  }

  function advance(): void {
    if (isLast) {
      void finish();
      return;
    }
    const next = index + 1;
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  }

  return (
    <LinearGradient colors={[current.wash, colors.background]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BrandHeader />
          {!isLast ? (
            <Pressable accessibilityRole="button" onPress={() => void finish()} hitSlop={8}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scroll}
        >
          {SLIDES.map((slide) => (
            <View key={slide.key} style={[styles.slide, { width }]}>
              <View style={styles.hero}>
                <View style={[styles.blob, { backgroundColor: slide.gradient[0] }]} />
                <LinearGradient
                  colors={slide.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroTile}
                >
                  <Ionicons name={slide.icon} size={84} color={colors.textInverse} />
                </LinearGradient>
                {slide.chips.map((chip) => (
                  <View
                    key={chip.icon}
                    style={[styles.chip, { top: chip.top, left: chip.left, right: chip.right }]}
                  >
                    <Ionicons name={chip.icon} size={20} color={chip.color} />
                  </View>
                ))}
              </View>

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((slide, dotIndex) => (
              <View
                key={slide.key}
                style={[styles.dot, dotIndex === index && styles.dotActive]}
              />
            ))}
          </View>

          <GradientButton label={isLast ? 'Get started' : 'Next'} onPress={advance} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skip: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  scroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  hero: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  blob: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    opacity: 0.16,
  },
  heroTile: {
    width: 156,
    height: 156,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  chip: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontSize: fontSize.xxl,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: { padding: spacing.xl, gap: spacing.md },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.brand, width: 28 },
});
