/** Internal grouping only — nothing in the UI shows a category yet. */
export type PromptCategory =
  | 'everyday'
  | 'food'
  | 'armenia'
  | 'animals'
  | 'places'
  | 'objects'
  | 'entertainment'
  | 'technology'
  | 'travel'
  | 'social';

export interface Prompt {
  /** Stable id, identical across languages so translations stay paired. */
  id: string;
  text: string;
  category: PromptCategory;
}
