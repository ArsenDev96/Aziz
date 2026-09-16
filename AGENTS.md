# Working on ARA!

Expo SDK 57 — read the versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing
code that touches the SDK.

## Rules of the house

- **Gameplay rules are the product owner's call, not the engineer's.** Numbers live in
  `src/modes/wrong-answer/rules.ts` and are documented in `docs/RULES.md`. Do not quietly change
  a timer, a score or a round count — propose it.
- **No hardcoded strings in screens.** Every visible string goes through `src/locales`, and both
  `hy.ts` and `en.ts` get the key. Armenian is the primary language.
- **No hardcoded colors or sizes in screens.** They come from `src/theme/theme.ts`.
- **Game logic stays pure.** `src/modes/**/engine.ts` must not import React, storage or Expo —
  it takes state in and returns state out, so `npm test` can cover it.
- Questions are paired by id across languages. Adding a question means adding it to `en.ts` and
  `hy.ts` with the same id.

## Before saying something works

```bash
npm run typecheck && npm test && npx expo lint
```

Then run it on the device or emulator. A clean bundle is not a working game.
