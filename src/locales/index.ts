import { en } from './en';
import { hy } from './hy';
import type { Language, Strings } from './types';

export type { Language, Strings };

export const LANGUAGES: Language[] = ['hy', 'en'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  hy: 'Հայերեն',
  en: 'English',
};

const dictionaries: Record<Language, Strings> = { en, hy };

export const getStrings = (language: Language): Strings => dictionaries[language];

/** Replaces {placeholders} in a locale string. */
export const format = (
  template: string,
  values: Record<string, string | number> = {},
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
