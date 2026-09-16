import type { Language } from '@/locales';
import { wrongAnswerEn } from './en';
import { wrongAnswerHy } from './hy';
import type { Question } from './types';

export type { Question, QuestionCategory } from './types';

const sets: Record<Language, Question[]> = {
  en: wrongAnswerEn,
  hy: wrongAnswerHy,
};

export const getWrongAnswerQuestions = (language: Language): Question[] => sets[language];

export const getQuestionMap = (language: Language): Record<string, Question> =>
  Object.fromEntries(sets[language].map((question) => [question.id, question]));
