/** Internal grouping only — nothing in the UI shows a category yet. */
export type CardCategory = 'action' | 'animal' | 'people' | 'sport' | 'armenia' | 'object';

export interface Card {
  /** Stable id, identical across languages so translations stay paired. */
  id: string;
  /** One word, or a two-word concept when no single word exists. Shown huge on screen. */
  text: string;
  category: CardCategory;
}
