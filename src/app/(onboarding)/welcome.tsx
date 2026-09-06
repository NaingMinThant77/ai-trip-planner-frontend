import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/auth';
import { colors, fontSize, radii, spacing } from '../../theme';

const SLIDES = [
  {
    key: 'plan',
    emoji: '🗺️',
    title: 'Plan in minutes, not evenings',
    body: 'Tell the assistant where and when. It builds a day-by-day itinerary you can actually follow.',
  },
  {
    key: 'organise',
    emoji: '🎒',
    title: 'Everything in one place',
    body: 'Packing list, booking notes, photos and maps all live alongside the plan for each trip.',
  },
  {
    key: 'share',
    emoji: '👨‍👩‍👧',
    title: 'Bring the family along',
    body: 'Share a read-only link so everyone knows the plan — no accounts needed on their side.',
  },
];

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { completeOnboarding } = useAuth();
  const router = useRouter();
  const width = Dimensions.get('window').width;

  const isLast = index === SLIDES.length - 1;

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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
            <Text style={styles.emoji}>{slide.emoji}</Text>
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

        <Button label={isLast ? 'Get started' : 'Next'} onPress={advance} />
        {!isLast ? (
          <Button label="Skip" variant="secondary" onPress={() => void finish()} style={styles.skip} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emoji: { fontSize: 72, marginBottom: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' },
  body: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: { padding: spacing.xl, gap: spacing.sm },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  skip: { marginTop: spacing.xs },
});
