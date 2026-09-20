import type { Language } from '@/locales';
import { actItEn } from './en';
import { actItHy } from './hy';
import type { Card } from './types';

export type { Card, CardCategory } from './types';

const decks: Record<Language, Card[]> = {
  en: actItEn,
  hy: actItHy,
};

export const getActItCards = (language: Language): Card[] => decks[language];

export const getActItCardMap = (language: Language): Record<string, Card> =>
  Object.fromEntries(decks[language].map((card) => [card.id, card]));
