/**
 * Mirror of `backend/src/agent/blocks.schema.ts`.
 *
 * Adding a block type is a THREE-file change: the backend tool schema, this union, and a
 * renderer in `src/components/blocks/`. See memory/01-product.md.
 */

export type TextBlock = { type: 'text'; body: string };

export type ItineraryCardBlock = {
  type: 'itinerary_card';
  dayNumber: number;
  title: string;
  summary: string;
  items: { timeOfDay: string; title: string; location: string }[];
};

export type PlaceListBlock = {
  type: 'place_list';
  heading: string;
  places: {
    name: string;
    location: string;
    reason: string;
    latitude: number | null;
    longitude: number | null;
  }[];
};

export type PackingSuggestionBlock = {
  type: 'packing_suggestion';
  heading: string;
  items: { label: string; category: string; quantity: number }[];
};

export type BookingOptionsBlock = {
  type: 'booking_options';
  kind: string;
  heading: string;
  options: { title: string; provider: string; priceText: string | null; detail: string }[];
};

export type WeatherBlock = {
  type: 'weather';
  location: string;
  /** Seasonal expectation, never a forecast. The renderer must label it. */
  summary: string;
  averageHighC: number | null;
  averageLowC: number | null;
};

export type MapPreviewBlock = {
  type: 'map_preview';
  heading: string;
  pins: { label: string; latitude: number; longitude: number }[];
};

export type ChoicePromptBlock = {
  type: 'choice_prompt';
  question: string;
  choices: { label: string; value: string }[];
};

export type UiBlock =
  | TextBlock
  | ItineraryCardBlock
  | PlaceListBlock
  | PackingSuggestionBlock
  | BookingOptionsBlock
  | WeatherBlock
  | MapPreviewBlock
  | ChoicePromptBlock;

export type AgentMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  blocks: UiBlock[];
  createdAt: string;
};

export type AgentReply = {
  conversationId: string;
  message: AgentMessage;
};

export type AgentConversation = {
  id: string;
  title: string;
  tripId: string | null;
  updatedAt: string;
};
