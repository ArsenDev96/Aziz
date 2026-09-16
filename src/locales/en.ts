export const en = {
  app: {
    name: 'AZIZ',
    tagline: 'Party games for the whole table',
  },
  home: {
    play: 'PLAY',
    settings: 'Settings',
  },
  players: {
    title: 'Who is playing?',
    subtitle: '{min}-{max} players',
    placeholder: 'Name',
    add: 'Add',
    remove: 'Remove {name}',
    start: 'START',
    errorTooFew: 'Add at least {min} players',
    errorTooMany: 'Maximum {max} players',
    errorDuplicate: 'That name is already in the game',
    errorEmpty: 'Type a name first',
  },
  modes: {
    wrongAnswer: {
      name: 'Wrong Answer Only',
      tagline: 'Never say the right answer',
      rule1: 'Answer every question WRONG.',
      rule2: 'You have {seconds} seconds.',
      rule3: 'The group decides if you made it.',
      start: 'LET\u2019S GO',
    },
  },
  turn: {
    heading: '{name}, it\u2019s your turn',
    ready: 'READY',
    questionCount: 'Question {current} of {total}',
  },
  question: {
    hint: 'Answer it WRONG',
  },
  judge: {
    heading: 'Did {name} say a wrong answer?',
    pass: 'PASS',
    fail: 'FAIL',
  },
  suddenDeath: {
    title: 'SUDDEN DEATH',
    subtitle: 'Tied at the top. One question each.',
  },
  results: {
    title: 'RESULTS',
    winner: 'Winner: {name}',
    winners: 'Winners: {names}',
    points: 'pts',
    playAgain: 'PLAY AGAIN',
    home: 'HOME',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    sound: 'Sound',
    haptics: 'Vibration',
    on: 'On',
    off: 'Off',
    back: 'Back',
    version: 'Version {version}',
  },
  common: {
    quit: 'Quit game',
    quitConfirmTitle: 'Quit this game?',
    quitConfirmBody: 'The current scores will be lost.',
    cancel: 'Cancel',
    confirm: 'Quit',
  },
} as const;
