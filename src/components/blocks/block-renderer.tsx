import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';
import { SaveableBlock, SaveResult, UiBlock } from '../../types/blocks';
import { BookingOptionsBlockView } from './booking-options-block';
import { ChoicePromptBlockView } from './choice-prompt-block';
import { ItineraryCardBlockView } from './itinerary-card-block';
import { MapPreviewBlockView } from './map-preview-block';
import { PackingSuggestionBlockView } from './packing-suggestion-block';
import { PlaceListBlockView } from './place-list-block';
import { SuggestionsBlockView } from './suggestions-block';
import { TextBlockView } from './text-block';
import { TripSummaryBlockView } from './trip-summary-block';
import { WeatherBlockView } from './weather-block';

/**
 * Renders one agent reply. The `default` arm is the degradation path described in
 * memory/01-product.md: a block type the backend knows but this build does not falls back
 * to its text, rather than crashing the thread.
 */
export type BlockActions = {
  /** Tapping a choice or suggestion chip. Omit and the chips are not shown / not tappable. */
  onChoice?: (value: string) => void;
  /** "Save to trip". Omit and cards render without the button. */
  onSave?: (block: SaveableBlock) => Promise<SaveResult>;
  onOpenTrip?: (tripId: string) => void;
};

export function BlockRenderer({ blocks, ...actions }: { blocks: UiBlock[] } & BlockActions) {
  return (
    <View style={styles.stack}>
      {blocks.map((block, index) => (
        <BlockView key={`${block.type}-${index}`} block={block} {...actions} />
      ))}
    </View>
  );
}

function BlockView({ block, onChoice, onSave, onOpenTrip }: { block: UiBlock } & BlockActions) {
  switch (block.type) {
    case 'text':
      return <TextBlockView block={block} />;
    case 'itinerary_card':
      return <ItineraryCardBlockView block={block} onSave={onSave && (() => onSave(block))} />;
    case 'place_list':
      return <PlaceListBlockView block={block} />;
    case 'packing_suggestion':
      return <PackingSuggestionBlockView block={block} onSave={onSave && (() => onSave(block))} />;
    case 'booking_options':
      return (
        <BookingOptionsBlockView
          block={block}
          onSaveOption={onSave && ((option) => onSave({ ...block, options: [option] }))}
        />
      );
    case 'weather':
      return <WeatherBlockView block={block} />;
    case 'map_preview':
      return <MapPreviewBlockView block={block} />;
    case 'choice_prompt':
      return <ChoicePromptBlockView block={block} onChoice={onChoice} />;
    case 'trip_summary':
      return (
        <TripSummaryBlockView
          block={block}
          onSave={onSave && (() => onSave(block))}
          onOpenTrip={onOpenTrip}
        />
      );
    case 'suggestions':
      return <SuggestionsBlockView block={block} onChoice={onChoice} />;
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
