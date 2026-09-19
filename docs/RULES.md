# Wrong Answer Only — V1 rules

These are the rules the app implements today. They live in code in
[`src/modes/wrong-answer/rules.ts`](../src/modes/wrong-answer/rules.ts) — change them there,
nowhere else.

| Rule | V1 value |
| --- | --- |
| Players | 2–8 |
| Questions per player | 5 |
| Timer | 2.5, 3 or 3.5 seconds, picked before the game (default 3) |
| PASS | +1 point |
| FAIL | 0 points |
| Winner | Highest score |
| Tie at the top | One sudden-death round, timer minus 0.5 seconds (never under 2) |

## How a game runs

1. Turn order is **shuffled once at the start**, then it is strict round-robin, so everyone
   gets exactly 5 questions and nobody can be skipped.
2. Questions are dealt from a **shuffled deck with no repeats** inside a session.
3. Each turn: `READY` → question + the chosen countdown → the group taps `PASS` or `FAIL`.
4. Highest score wins. If several players are level at the top, sudden death decides it.

## Sudden death

Sudden death runs **only** when two or more players are tied for the highest score at the end of
normal play, and it lasts **exactly one round**. A tie anywhere else in the table is ignored.

- Only the tied leaders play. Everyone else is done.
- Each tied leader gets **one question**, on a clock **half a second shorter** than the chosen timer, never under **2 seconds** (2.5 → 2, 3 → 2.5, 3.5 → 3).
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

---

# Same Answer — V1 rules

These rules live in code in
[`src/modes/same-answer/rules.ts`](../src/modes/same-answer/rules.ts) — change them there,
nowhere else.

| Rule | V1 value |
| --- | --- |
| Players | 4–8, on 2–4 teams |
| Team size | At least 2 per team; uneven teams are fine (2 vs 3, 2 vs 2 vs 3, 2 vs 3 vs 3…) |
| Turns per team | 5 — a 2-team game is 10 turns, 3 teams is 15, 4 teams is 20 |
| Thinking time | 5 seconds, silent |
| Reveal | 3 → 2 → 1 → SAY IT (one second each) |
| Points | `max(matched − 1, 0)`: 0 or 1 matched → 0, 2 → 1, 3 → 2, 4 → 3 |
| Winner | Highest score; a tie at the top means joint winners |

## How a game runs

1. Teams are built on the setup screen from the shared player roster. Team order is fixed:
   Team 1 → Team 2 → Team 3 → Team 4 → Team 1…
2. Prompts are dealt from a **shuffled deck with no repeats** inside a session (100 prompts per
   language, at most 20 used per game).
3. Each turn: team screen + `READY` → prompt with the 5 second thinking clock → 3-2-1-SAY IT →
   the group taps how many teammates said the same thing → the points show → `NEXT`.
4. After every team has played 5 turns the standings appear.

## Counting a match

Only the **largest group** of teammates who said the same thing counts. A single player
matching nobody is not a match, so the selector never offers `1`.

- 2-person team: `0 · 2`
- 3-person team: `0 · 2 · 3`
- 4-person team: `0 · 2 · 3 · 4`

Example — a team of four says *Dolma, Dolma, Lavash, Lavash*: the largest matching group is
2, the team scores 1 point. The two pairs are **not** added together.

## Uneven teams

Scores are deliberately **not** normalised for team size. A 4-person team can score up to 3
per turn, a 2-person team at most 1. That is the V1 rule; there are no handicaps or
multipliers.

## Things deliberately NOT in V1

- No sudden death — tied leaders are joint winners.
- No timer settings for Same Answer.
- No custom team names or avatars.
- No speech recognition; the group counts matches by hand.
