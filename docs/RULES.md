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

---

# Act It! (Ցույց տուր) — V1 rules

These rules live in code in [`src/modes/act-it/rules.ts`](../src/modes/act-it/rules.ts) —
change them there, nowhere else.

| Rule | V1 value |
| --- | --- |
| Players | 4–8, in 2–4 teams of at least 2; uneven teams are fine (3 vs 2, 3 vs 3 vs 2 …) |
| A turn | One teammate guesses, the rest of that team acts; the other teams sit it out |
| Turns per team | The size of the largest team — every team gets the same number |
| Turn length | 45 seconds, after a 3 → 2 → 1 → GO count-in |
| CORRECT | +1 point to the active team, next card immediately |
| SKIP | 0 points, next card immediately, at most 2 per turn |
| Winner | Highest team score; a tie at the top means joint winners |

## How a game runs

1. Teams are made on the setup screen from the shared roster: pick 2, 3 or 4 teams and tap a
   number next to each name. Team order is 1, 2, 3, 4 and the order inside a team is roster
   order — **nothing is shuffled**, so the table can always tell whose turn is next.
2. The whole schedule is built once at the start: **round → team → guesser**. Round 1 is every
   team's first player in team order, round 2 every team's second, and so on. A team smaller
   than the round count wraps back to its first player, so with Team 1 [Aram, Ani, Gor],
   Team 2 [Mari, Narek, Davit], Team 3 [Lilit, Karen] the order is
   Aram → Mari → Lilit → Ani → Narek → Karen → Gor → Davit → Lilit.
3. Cards are dealt from a **shuffled deck with no repeats for the whole game** (200 cards per
   language) — the deck is not reset between teams. If a game somehow used all 200, it wraps.
4. Each turn: the pre-turn screen names the team, the guesser and the actor(s) → the guesser
   holds the screen toward their team without looking at it → `READY` → 3-2-1-GO → the
   actors see one word at a time and tap `CORRECT` or `SKIP` → `TIME!` shows what the guesser got
   this turn and the team's running total → `NEXT`.
5. After the last scheduled turn the team standings appear.

## Judging a guess

The guess does **not** need the exact wording on the card; it counts when the actors agree the
concept was clearly identified (physician for DOCTOR, automobile for CAR). Actors may move,
mime and act together but may not speak, mouth the word, spell, or show anything written. The
group judges this; the app does not.

## Play again

Same teams, same assignments, same player order, scores and skips reset, **only the deck is
reshuffled**. The game starts again from round 1, team 1, first guesser.

## Things deliberately NOT in V1

- No sudden death — tied teams are joint winners.
- No individual scores — only the team's total counts.
- No timer setting, no difficulty levels, no custom card packs.
- No sensors, camera or microphone — the phone is passed and tapped by hand.
