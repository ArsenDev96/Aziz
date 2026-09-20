import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { withArmenianArticle } from '../src/locales/armenian';

const table = (cases: [string, string][]) => {
  for (const [input, expected] of cases) {
    it(`${input} -> ${expected}`, () => assert.equal(withArmenianArticle(input), expected));
  }
};

describe('Armenian definite article on player names', () => {
  describe('Armenian vowel-final names take -ն', () => {
    table([
      ['Անի', 'Անին'],
      ['Սոնա', 'Սոնան'],
      ['Մարի', 'Մարին'],
      ['Արա', 'Արան'],
      ['Նարե', 'Նարեն'],
      ['Մանե', 'Մանեն'],
      ['Լիլո', 'Լիլոն'],
      ['Անահիտու', 'Անահիտուն'],
      ['ԱՆԻ', 'ԱՆԻն'],
    ]);
  });

  describe('Armenian consonant-final names take -ը', () => {
    table([
      ['Արսեն', 'Արսենը'],
      ['Դավիթ', 'Դավիթը'],
      ['Գոռ', 'Գոռը'],
      ['Հայկ', 'Հայկը'],
      ['Արամ', 'Արամը'],
      ['Լիլիթ', 'Լիլիթը'],
      ['Վահագն', 'Վահագնը'],
    ]);
  });

  describe('Latin vowel-final names keep a hyphen and take -ն', () => {
    table([
      ['Ana', 'Ana-ն'],
      ['Sona', 'Sona-ն'],
      ['Mari', 'Mari-ն'],
      ['Leo', 'Leo-ն'],
      ['Lou', 'Lou-ն'],
      ['Lily', 'Lily-ն'],
    ]);
  });

  describe('Latin consonant-final names keep a hyphen and take -ը', () => {
    table([
      ['Ars', 'Ars-ը'],
      ['Davit', 'Davit-ը'],
      ['Gor', 'Gor-ը'],
      ['Mark', 'Mark-ը'],
      ['ARS', 'ARS-ը'],
    ]);
  });

  it('trims surrounding whitespace and leaves an empty name alone', () => {
    assert.equal(withArmenianArticle(' Անի '), 'Անին');
    assert.equal(withArmenianArticle(''), '');
    assert.equal(withArmenianArticle('   '), '');
  });

  it('treats a non-letter ending (digits, symbols) like a Latin consonant', () => {
    assert.equal(withArmenianArticle('Ani2'), 'Ani2-ը');
  });
});
