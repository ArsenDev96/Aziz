import { withArmenianArticle } from './armenian';
import { en } from './en';
import { hy } from './hy';
import type { Language, Strings } from './types';

export type { Language, Strings };

export const LANGUAGES: Language[] = ['hy', 'en'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  hy: 'Հայերեն',
  en: 'English',
};

/** First-launch prompt, shown in every language at once because no locale is chosen yet. */
export const LANGUAGE_PROMPTS: Record<Language, string> = {
  hy: 'Ընտրիր լեզուն',
  en: 'Choose language',
};

const dictionaries: Record<Language, Strings> = { en, hy };

export const getStrings = (language: Language): Strings => dictionaries[language];

/**
 * A player's name as the subject of a sentence. Armenian needs its definite article
 * ("Անին գուշակում է"); English uses the bare name.
 */
export const subjectName = (language: Language, name: string): string =>
  language === 'hy' ? withArmenianArticle(name) : name;

/** Replaces {placeholders} in a locale string. */
export const format = (
  template: string,
  values: Record<string, string | number> = {},
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
