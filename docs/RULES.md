# Wrong Answer Only — V1 rules

These are the rules the app implements today. They live in code in
[`src/modes/wrong-answer/rules.ts`](../src/modes/wrong-answer/rules.ts) — change them there,
nowhere else.

| Rule | V1 value |
| --- | --- |
| Players | 2–8 |
| Questions per player | 5 |
| Timer | 3 seconds |
| PASS | +1 point |
| FAIL | 0 points |
| Winner | Highest score |
| Tie at the top | One sudden-death round, 2 second timer |

## How a game runs

1. Turn order is **shuffled once at the start**, then it is strict round-robin, so everyone
   gets exactly 5 questions and nobody can be skipped.
2. Questions are dealt from a **shuffled deck with no repeats** inside a session.
3. Each turn: `READY` → question + 3 second countdown → the group taps `PASS` or `FAIL`.
4. Highest score wins. If several players are level at the top, sudden death decides it.

## Sudden death

Sudden death runs **only** when two or more players are tied for the highest score at the end of
normal play, and it lasts **exactly one round**. A tie anywhere else in the table is ignored.

- Only the tied leaders play. Everyone else is done.
- Each tied leader gets **one question**, on a **2 second** clock.
- **One passes** → that player wins.
- **Several pass** → those players are joint winners.
- **Nobody passes** → all the tied leaders are joint winners.

There is never a second sudden-death round, so the game always ends after this one.

## Things deliberately NOT in V1

- No skipping a question.
- No timer pause.
- No undo on a PASS/FAIL tap.
- No streak bonus or difficulty progression.

All of these are Phase 6 candidates — after you have watched real people play.
