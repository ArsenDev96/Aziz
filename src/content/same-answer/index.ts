import type { Language } from '@/locales';
import { sameAnswerEn } from './en';
import { sameAnswerHy } from './hy';
import type { Prompt } from './types';

export type { Prompt, PromptCategory } from './types';

const decks: Record<Language, Prompt[]> = {
  en: sameAnswerEn,
  hy: sameAnswerHy,
};

export const getSameAnswerPrompts = (language: Language): Prompt[] => decks[language];

export const getSameAnswerPromptMap = (language: Language): Record<string, Prompt> =>
  Object.fromEntries(decks[language].map((prompt) => [prompt.id, prompt]));
