/** Categories reserved for the Phase 9 content expansion. V1 ships `general` only. */
export type QuestionCategory =
  | 'general'
  | 'armenia'
  | 'food'
  | 'yerevan'
  | 'funny'
  | 'hard';

export interface Question {
  /** Stable id, identical across languages so translations stay paired. */
  id: string;
  text: string;
  category: QuestionCategory;
}
