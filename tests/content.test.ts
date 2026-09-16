import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getQuestionMap, getWrongAnswerQuestions, type Question } from '../src/content/wrong-answer';
import { wrongAnswerEn } from '../src/content/wrong-answer/en';
import { wrongAnswerHy } from '../src/content/wrong-answer/hy';

const DECK_SIZE = 200;

/** A question has to be readable inside the shortest (2.5 second) clock. */
const MAX_TEXT_LENGTH = 60;

const CATEGORIES = new Set(['general', 'armenia', 'food', 'yerevan', 'funny', 'hard']);

const decks: { name: string; questions: Question[] }[] = [
  { name: 'Armenian', questions: wrongAnswerHy },
  { name: 'English', questions: wrongAnswerEn },
];

/** Collapses whitespace and case so "What color is snow?" and "what  color is snow?" collide. */
const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const duplicates = (values: string[]): string[] => {
  const seen = new Set<string>();
  const found = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) found.add(value);
    seen.add(value);
  }
  return [...found];
};

describe('question deck size', () => {
  for (const { name, questions } of decks) {
    it(`has exactly ${DECK_SIZE} ${name} questions`, () => {
      assert.equal(questions.length, DECK_SIZE);
    });
  }
});

describe('question ids', () => {
  for (const { name, questions } of decks) {
    it(`${name} ids are unique`, () => {
      assert.deepEqual(duplicates(questions.map((question) => question.id)), []);
    });

    it(`${name} ids follow the wa-NNN convention in order`, () => {
      questions.forEach((question, index) => {
        assert.equal(question.id, `wa-${String(index + 1).padStart(3, '0')}`);
      });
    });
  }

  it('every Armenian question has an English twin with the same id', () => {
    const en = getQuestionMap('en');
    for (const question of wrongAnswerHy) {
      assert.ok(en[question.id], `no English question for ${question.id}`);
    }
  });

  it('every English question has an Armenian twin with the same id', () => {
    const hy = getQuestionMap('hy');
    for (const question of wrongAnswerEn) {
      assert.ok(hy[question.id], `no Armenian question for ${question.id}`);
    }
  });

  it('paired questions share a category', () => {
    const en = getQuestionMap('en');
    for (const question of wrongAnswerHy) {
      assert.equal(question.category, en[question.id].category, question.id);
    }
  });
});

describe('question text', () => {
  for (const { name, questions } of decks) {
    it(`no ${name} question is empty`, () => {
      for (const question of questions) {
        assert.ok(question.text.trim().length > 0, `${question.id} is empty`);
      }
    });

    it(`no ${name} question text is repeated`, () => {
      assert.deepEqual(duplicates(questions.map((question) => normalize(question.text))), []);
    });

    it(`every ${name} question is short enough for the fastest clock`, () => {
      for (const question of questions) {
        assert.ok(
          question.text.length <= MAX_TEXT_LENGTH,
          `${question.id} is ${question.text.length} characters: "${question.text}"`,
        );
      }
    });

    it(`every ${name} question has a known category`, () => {
      for (const question of questions) {
        assert.ok(CATEGORIES.has(question.category), `${question.id}: ${question.category}`);
      }
    });
  }

  it('Armenian questions carry the question mark and end with a full stop', () => {
    for (const question of wrongAnswerHy) {
      assert.ok(question.text.includes('՞'), `${question.id} has no ՞`);
      assert.ok(question.text.endsWith('։'), `${question.id} does not end with ։`);
    }
  });

  it('English questions end with a question mark', () => {
    for (const question of wrongAnswerEn) {
      assert.ok(question.text.endsWith('?'), `${question.id} does not end with ?`);
    }
  });
});

describe('deck access', () => {
  it('serves the full deck for both languages', () => {
    assert.equal(getWrongAnswerQuestions('hy').length, DECK_SIZE);
    assert.equal(getWrongAnswerQuestions('en').length, DECK_SIZE);
  });

  it('builds a lookup map that covers every id', () => {
    assert.equal(Object.keys(getQuestionMap('hy')).length, DECK_SIZE);
    assert.equal(Object.keys(getQuestionMap('en')).length, DECK_SIZE);
  });
});
