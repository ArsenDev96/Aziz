# AZIZ

Armenian party games for one phone and a table full of people. Offline, no account, no backend.

**Status: Phase 4 — first playable prototype.** One game mode (Wrong Answer Only), 50 questions
in Armenian and English, deliberately unpolished. The next step is [a real
playtest](docs/PLAYTEST.md), not more features.

## Run it

```bash
npm install
npm run android      # emulator or a USB-connected phone, via Expo Go
```

Checks:

```bash
npm run typecheck    # tsc
npm test             # game-engine unit tests
npx expo lint        # eslint
npx expo-doctor      # project health
```

## What is in the prototype

| Screen | Route |
| --- | --- |
| Home | [`app/index.tsx`](app/index.tsx) |
| Player setup (2–8, names are remembered) | [`app/players.tsx`](app/players.tsx) |
| Game intro / rules | [`app/game/intro.tsx`](app/game/intro.tsx) |
| Turn → question + countdown → PASS/FAIL | [`app/game/play.tsx`](app/game/play.tsx) |
| Results, play again | [`app/game/results.tsx`](app/game/results.tsx) |
| Settings — language, vibration | [`app/settings.tsx`](app/settings.tsx) |

The three in-game states live in one route on purpose: a route per turn would push a new screen
onto the stack fifteen times a game.

## Layout

```text
app/                       screens (expo-router)
src/
  components/              Screen, AzizButton, Countdown
  content/wrong-answer/    questions — en.ts and hy.ts, paired by id
  locales/                 en.ts, hy.ts — every UI string
  modes/wrong-answer/      rules.ts (the numbers) + engine.ts (pure game logic)
  state/                   settings + game providers, AsyncStorage backed
  theme/theme.ts           all colors and sizes
tests/                     engine unit tests
docs/                      RULES.md, PLAYTEST.md
```

`src/modes/wrong-answer/engine.ts` has no React and no I/O — deal a deck, take a verdict, return
the next state. That is what makes the rules testable and what a second game mode will copy.

## Language

Armenian is the default; English is available in Settings. UI strings are in `src/locales`,
questions in `src/content/wrong-answer`, and the two question files share ids so a translation
never drifts from its original.

## Before Google Play

- `am.aziz.party` in [`app.json`](app.json) is a placeholder — the real package name can never be
  changed after the first upload, so decide it before the first release build.
- Icons and the splash screen are still the Expo defaults (Phase 7).
- No sound yet (Phase 10), so Settings has no sound switch to toggle.
- No analytics (Phase 14).
