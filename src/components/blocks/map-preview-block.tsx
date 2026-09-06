import { MapPreviewBlock } from '../../types/blocks';
import { TripMap } from '../trip-map';
import { BlockCard } from './block-card';

export function MapPreviewBlockView({ block }: { block: MapPreviewBlock }) {
  return (
    <BlockCard heading={block.heading}>
      <TripMap pins={block.pins} height={180} />
    </BlockCard>
  );
}
