import type { Strings } from './types';

export const hy: Strings = {
  app: {
    name: 'AZIZ',
    tagline: 'Խաղեր ամբողջ սեղանի համար',
  },
  home: {
    play: 'ԽԱՂԱԼ',
    settings: 'Կարգավորումներ',
  },
  players: {
    title: 'Ովքե՞ր են խաղում',
    subtitle: '{min}-{max} խաղացող',
    placeholder: 'Անուն',
    add: 'Ավելացնել',
    remove: 'Հեռացնել {name}-ին',
    start: 'ՍԿՍԵԼ',
    errorTooFew: 'Պետք է առնվազն {min} խաղացող',
    errorTooMany: 'Առավելագույնը {max} խաղացող',
    errorDuplicate: 'Այս անունն արդեն խաղում է',
    errorEmpty: 'Նախ գրիր անունը',
  },
  modes: {
    wrongAnswer: {
      name: 'ՄԻԱՅՆ ՍԽԱԼ ՊԱՏԱՍԽԱՆ',
      tagline: 'Ճիշտը չասես',
      rule1: 'Ամեն հարցին պատասխանիր ՍԽԱԼ։',
      rule2: 'Ունես {seconds} վայրկյան։',
      rule3: 'Խումբը որոշում է՝ հաջողեցիր, թե ոչ։',
      start: 'ԳՆԱՑԻ՛ՆՔ',
    },
  },
  turn: {
    heading: '{name}, քո հերթն է',
    ready: 'ՊԱՏՐԱ՛ՍՏ ԵՄ',
    questionCount: 'Հարց {current} / {total}',
  },
  question: {
    hint: 'Պատասխանիր ՍԽԱԼ',
  },
  judge: {
    heading: '{name}-ը սխա՞լ պատասխանեց',
    pass: 'ԱՆՑԱՎ',
    fail: 'ԿՏՐՎԵՑ',
  },
  suddenDeath: {
    title: 'ՎՃՌՈՐՈՇ ՀԱՐՑ',
    subtitle: 'Հաշիվը հավասար է։ Մեկական հարց։',
  },
  results: {
    title: 'ԱՐԴՅՈՒՆՔՆԵՐ',
    winner: 'Հաղթող՝ {name}',
    winners: 'Հաղթողներ՝ {names}',
    points: 'միավոր',
    playAgain: 'ԽԱՂԱԼ ԿՐԿԻՆ',
    home: 'ԳԼԽԱՎՈՐ',
  },
  settings: {
    title: 'Կարգավորումներ',
    language: 'Լեզու',
    sound: 'Ձայն',
    haptics: 'Թրթռոց',
    on: 'Միացված',
    off: 'Անջատված',
    back: 'Հետ',
    version: 'Տարբերակ {version}',
  },
  common: {
    quit: 'Ավարտել խաղը',
    quitConfirmTitle: 'Ավարտե՞լ այս խաղը',
    quitConfirmBody: 'Ընթացիկ հաշիվը կկորչի։',
    cancel: 'Չեղարկել',
    confirm: 'Ավարտել',
  },
};
