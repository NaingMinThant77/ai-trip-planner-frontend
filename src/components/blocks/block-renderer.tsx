import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';
import { UiBlock } from '../../types/blocks';
import { BookingOptionsBlockView } from './booking-options-block';
import { ChoicePromptBlockView } from './choice-prompt-block';
import { ItineraryCardBlockView } from './itinerary-card-block';
import { MapPreviewBlockView } from './map-preview-block';
import { PackingSuggestionBlockView } from './packing-suggestion-block';
import { PlaceListBlockView } from './place-list-block';
import { TextBlockView } from './text-block';
import { WeatherBlockView } from './weather-block';

/**
 * Renders one agent reply. The `default` arm is the degradation path described in
 * memory/01-product.md: a block type the backend knows but this build does not falls back
 * to its text, rather than crashing the thread.
 */
export function BlockRenderer({
  blocks,
  onChoice,
}: {
  blocks: UiBlock[];
  onChoice?: (value: string) => void;
}) {
  return (
    <View style={styles.stack}>
      {blocks.map((block, index) => (
        <BlockView key={`${block.type}-${index}`} block={block} onChoice={onChoice} />
      ))}
    </View>
  );
}

function BlockView({
  block,
  onChoice,
}: {
  block: UiBlock;
  onChoice?: (value: string) => void;
}) {
  switch (block.type) {
    case 'text':
      return <TextBlockView block={block} />;
    case 'itinerary_card':
      return <ItineraryCardBlockView block={block} />;
    case 'place_list':
      return <PlaceListBlockView block={block} />;
    case 'packing_suggestion':
      return <PackingSuggestionBlockView block={block} />;
    case 'booking_options':
      return <BookingOptionsBlockView block={block} />;
    case 'weather':
      return <WeatherBlockView block={block} />;
    case 'map_preview':
      return <MapPreviewBlockView block={block} />;
    case 'choice_prompt':
      return <ChoicePromptBlockView block={block} onChoice={onChoice} />;
    default:
      return <UnknownBlockView block={block} />;
  }
}

/** `block` is `never` here when the union is fully handled — that is the point. */
function UnknownBlockView({ block }: { block: never }) {
  const fallback = (block as { body?: string; heading?: string }).body ?? '';
  if (!fallback) return null;
  return <Text style={styles.fallback}>{fallback}</Text>;
}

const styles = StyleSheet.create({
  stack: { gap: spacing.xs },
  fallback: { fontSize: fontSize.sm, color: colors.textMuted },
});
