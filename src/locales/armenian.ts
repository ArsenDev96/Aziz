/**
 * Armenian definite article for a player's name used as the subject of a sentence:
 * "Անին գուշակում է", "Արսենը սխա՞լ պատասխանեց". Pure so it can be unit-tested.
 *
 * Armenian-script names take the suffix directly: -ն after a vowel, -ը after a consonant.
 * Latin-script (or any other) names keep a hyphen before the suffix so the reader sees where
 * the name ends: "Ana-ն", "Ars-ը". No transliteration is attempted — a plain final-letter check.
 */
const ARMENIAN_LETTER = /[Ա-Ֆա-և]$/u;
// ա ե է ը ի ո օ, plus ւ for names ending in "ու".
const ARMENIAN_VOWEL = /[աեէըիոօւԱԵԷԸԻՈՕՒ]$/u;
const LATIN_VOWEL = /[aeiouy]$/iu;

export const ARMENIAN_ARTICLE_AFTER_VOWEL = 'ն';
export const ARMENIAN_ARTICLE_AFTER_CONSONANT = 'ը';

export const withArmenianArticle = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (ARMENIAN_LETTER.test(trimmed)) {
    const suffix = ARMENIAN_VOWEL.test(trimmed)
      ? ARMENIAN_ARTICLE_AFTER_VOWEL
      : ARMENIAN_ARTICLE_AFTER_CONSONANT;
    return trimmed + suffix;
  }
  const suffix = LATIN_VOWEL.test(trimmed)
    ? ARMENIAN_ARTICLE_AFTER_VOWEL
    : ARMENIAN_ARTICLE_AFTER_CONSONANT;
  return `${trimmed}-${suffix}`;
};
