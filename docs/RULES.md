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
| Tie at the top | Sudden death |

## How a game runs

1. Turn order is **shuffled once at the start**, then it is strict round-robin, so everyone
   gets exactly 5 questions and nobody can be skipped.
2. Questions are dealt from a **shuffled deck with no repeats** inside a session.
3. Each turn: `READY` → question + 3 second countdown → the group taps `PASS` or `FAIL`.
4. Ties at the top go to sudden death: one question each, only for the tied players.

## Open decision for the product owner

**Sudden death has to be able to end.** These questions are easy enough that a tied group can
pass round after round forever, so the app currently does this:

- every sudden-death round after the first is **one second faster** (3s → 2s → 1s floor);
- after **5 sudden-death rounds** the players still level **share the win**.

This is an engineering default to stop the game hanging, not a product decision. Tell me which
you want instead and it is a one-line change:

- keep it as is;
- no cap, and accept that the group keeps playing until someone slips;
- first FAIL loses instead (last player standing);
- a harder question pool for sudden death (needs Phase 9 content first).

## Things deliberately NOT in V1

- No skipping a question.
- No timer pause.
- No undo on a PASS/FAIL tap.
- No streak bonus or difficulty progression.

All of these are Phase 6 candidates — after you have watched real people play.
