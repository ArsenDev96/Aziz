# AZIZ — Play Console answer sheet

Package `am.aziz.party` · version 1.0.0 · Android only · listing locales `hy-AM` (default) and `en-US`.

Everything below is derived from the audited 1.0.0 build: no account, no backend, no
analytics, no crash-reporting SDK, no ads, no external API, no camera/microphone/location/
contacts/phone/SMS/Bluetooth/storage access. Merged release manifest permissions:
`android.permission.INTERNET`, `android.permission.VIBRATE` (plus the Android-generated
`<package>.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` signature permission). Data persisted
on-device only: language, haptics preference, Wrong Answer Only timer, player names.

Play Console wording changes from time to time. Where an answer depends on Google's exact
definition, it is marked **VERIFY** — read the help text next to the question before ticking.

---

## 1. Category and tags

**A. Category (confident):** Game → **Casual**.

Why: Play has no "Party" game category. AZIZ is a light, social, pass-the-phone game with
no progression, which is how Play describes Casual. The closest alternatives are **Trivia**
(fits Wrong Answer Only but not Act It!) and **Word** (fits Act It! only); Casual covers
all three modes. **Board** is sometimes used for party games but implies a board-game
adaptation. Pick Casual; if Play later shows category performance data that argues for
Trivia, it can be changed without a new release.

**B. Tags to look for (Play Console → Store settings → Tags, up to 5).** Tag names below
are what to look for; only select ones that actually appear in the picker:

- Party
- Casual
- Trivia
- Word
- Offline
- Local multiplayer — only if the picker offers a *local* / pass-and-play variant. Do **not**
  choose a plain "Multiplayer" or "Online multiplayer" tag: AZIZ has no network play.

## 2. Internal keyword / positioning list (not for pasting into the listing)

Primary concepts: party games · party game app · group games · games for friends ·
one phone · pass the phone · offline games · no internet · charades · act it out ·
team games · guessing game · wrong answers game · game night · Armenian games ·
Armenian party game · հայկական խաղ · խաղեր ընկերների հետ · սեղանի խաղ հեռախոսով ·
ընկերական խաղ · շարադներ / ցույց տալու խաղ.

Positioning in one line: *the party game you open when everyone is already at the table —
one phone, three games, Armenian and English, nothing to install for anyone else.*

Avoid in copy: "best", "#1", "addictive", "AI", "multiplayer" (reads as online), "cards"
as a purchasable thing, anything implying custom decks or profiles.

## 3. Data safety

**Does your app collect or share any of the required user data types?** → **No.**

Reasoning, in Play's terms:

- Play defines *collection* as data transmitted off the device to the developer or a third
  party by the app or its SDKs. AZIZ transmits nothing: no server, no analytics, no crash
  reporting, no ads SDK, no third-party SDK with network access. On-device storage and
  processing of player names and settings is explicitly **not** collection under Play's
  definition.
- *Sharing* is transfer to a third party. There is no transfer, so nothing is shared.
- Player names are user-entered text kept in the app's private storage and never sent
  anywhere; they never reach the developer. Language, haptics and timer preferences are the
  same.
- Because the answer is No, Play will not ask the follow-up questions (encryption in
  transit, deletion requests, data types). For the record: users can delete everything by
  removing names in-app, clearing app storage or uninstalling.

**Android Auto Backup.** Android may include AZIZ's local preferences in the user's own
OS-level device backup (their Google account). The app does not initiate this, the
developer does not receive or have access to it, and it is not a transfer to the developer
or to a third party chosen by the developer. Our position is that this does **not** change
the "No" answer. **VERIFY:** read the current Data safety help text on device backups /
"data transferred by the OS" before submitting; if Google's current wording treats
OS backups of app data as collection, the safe alternative is to declare *App activity →
Other user-generated content* (player names) as **collected, optional, not shared,
processed ephemerally: no, deletion available**, with the purpose "App functionality" — or,
in a future build, disable `allowBackup` (not a change we make now; Android config is frozen).

**Advertising ID declaration** (asked inside Data safety): → **No**, the app does not use
the advertising ID. It contains no ads or analytics SDK.

**Security practices** questions only appear if collection is declared; with "No" they
are skipped. Do not claim "encrypted in transit" anywhere — nothing is transmitted.

**Privacy policy URL** is still required for the Data safety section and the store
listing: [PRIVACY_POLICY_URL] (host `release/playstore/privacy/privacy-policy*.md`).

## 4. Ads

**Does your app contain ads?** → **No.**

No ad SDK, no house ads, no cross-promotion, no sponsored content, no advertising ID use.

## 5. App access

**Are all functions in your app available without special access?** → choose
**"All functionality is available without special access"** (the option that does not
require providing credentials or instructions).

There is no login, account, membership, invite code, paywall or region lock. The first
screen asks only for a language, and every game is reachable from Home.

## 6. Target audience and content

**Target age groups to select:** **13–15, 16–17, 18 and over** (i.e. 13+). Do **not**
select 12 and under.

Why:

- AZIZ is a general-audience social game for a table of friends. It is not designed for
  children, and it is not being submitted to the Families / Designed for Families program.
- Selecting any group under 13 triggers Families policy obligations (child-directed
  design, ads and data requirements, additional review) that this app has no reason to
  take on.
- Content is mild but includes one generic alcohol reference (see §7), charades cards such
  as "Kissing", "Tamada" (toastmaster), "Vampire", "Zombie", and a party-game framing —
  fine for teens, not something to market to under-13s.
- 13+ is the standard, defensible answer for a mild general-audience app; 18+ only would
  be unnecessarily restrictive and is not supported by the content.

**"Could your store listing unintentionally appeal to children?"** (asked when the app is
not child-directed) → answer **No**, and keep the listing as it is: screenshots show
questions, teams and scores, the copy addresses friends and game nights, and there are no
child characters or kid-oriented imagery. The logo is a playful yellow word mark; that is
brand styling, not child-directed design. **VERIFY** the question's exact wording — if
Play asks specifically about the *store listing assets*, the honest answer remains No.

## 7. Content rating (IARC questionnaire)

Fill it as a **Game**. Answer strictly from the shipped decks:

| Topic | Answer | Notes |
| --- | --- | --- |
| Violence (realistic, cartoon, toward humans/animals) | **No** | No violence depicted. Card words like "Soldier", "Police officer", "Thief", "Snowball fight", "Tug of war", "Boxing", "Wrestling", "Fencing", "Archery" are pantomime prompts, not depictions. One trivia question asks "What color is blood?" (answer: red) — no injury or gore. |
| Fear / horror | **No** | "Zombie", "Vampire", "Ghost" appear only as charades words; nothing frightening is shown. |
| Sexual content / nudity | **No** | One charades card is "Kissing"; no sexual content, nudity or suggestive imagery. |
| Language / profanity | **No** | Decks contain no profanity or crude humour. |
| Controlled substances — alcohol, tobacco, drugs | **Yes — reference to alcohol, no depiction of use.** | Wrong Answer Only includes the question *"What is wine made from?"* / «Գինին ինչի՞ց են սարքում։» (id `wa-152`). It is a factual food-trivia reference; no drinking, no glamorisation, no drinking-game mechanics. No tobacco or drug references. Answer the alcohol sub-question truthfully as a *reference*; do not tick "use" or "glamorisation". The charades card "Drinking" (HY «Խմել») is generic drinking and "Tamada" is a toastmaster — mention only if a question asks about *any* reference to drinking culture. |
| Gambling (simulated or real) | **No** | No betting, wagering, casino or loot mechanics. Scores only. |
| Crude humour / scatological | **No** | |
| Discrimination / hate | **No** | |
| User interaction: chat, voice, messaging | **No** | No online communication of any kind. |
| User-generated content shared online | **No** | Player names are typed in but never shared or uploaded. |
| Shares user location | **No** | No location permission. |
| Digital purchases / in-app purchases | **No** | |
| Unrestricted internet access (browser, web content) | **No** | The app opens no web content. |
| Advertising | **No** | |

Do not pre-announce a final rating: the questionnaire produces regional ratings
automatically, and the single alcohol reference may add an "alcohol reference"-type
descriptor in some regions without necessarily changing the age band. Whatever it returns,
keep the alcohol answer as above — under-declaring it is a policy violation, and removing
the question would be a content change (out of scope for this release).

## 8. App content declarations — recommended answers

| Play Console declaration | Answer for AZIZ |
| --- | --- |
| Privacy policy | Provide [PRIVACY_POLICY_URL] |
| Ads | No, the app does not contain ads |
| App access | All functionality available without special access |
| Content ratings | Complete IARC per §7 |
| Target audience and content | 13–15, 16–17, 18+; not child-directed; listing does not unintentionally appeal to children |
| News apps | No — not a news app |
| COVID-19 contact tracing and status apps | No / not applicable (only appears if flagged) |
| Data safety | No data collected, no data shared; advertising ID not used (§3) |
| Government apps | No — not a government app |
| Financial features | No financial features (none of the listed features: loans, banking, crypto, payments, etc.) |
| Health apps | No / not applicable — not a health app, no health data |
| Advertising ID | Not used |
| Photo and video permissions | Not applicable — app requests no media permissions |
| Foreground service / full-screen intent / exact alarm permissions | Not applicable — none declared |
| User-generated content (policy, not a separate form) | Not applicable — names are local-only text, never shared or shown to other users |
| Social features / online interaction (asked within Target audience / IARC) | None — no chat, no profiles, no friend lists, no online play |
| Gambling | No real-money or simulated gambling |
| Dating | Not a dating app |

If a declaration listed above does not appear for this account/app, skip it — the table
covers the forms Play commonly shows; it does not create new ones.

## 9. Owner-supplied details still missing

Required before the listing can be submitted:

1. **[CONTACT_EMAIL]** — public developer/support email shown on the store listing and
   used in the privacy policy. (Required by Play.)
2. **[PRIVACY_POLICY_URL]** — a public https URL hosting the privacy policy (required
   because the app is on Play and the Data safety section links to it). Any static page or
   repository page works; no full website is needed.
3. **[DEVELOPER_NAME]** — the developer display name on the Play developer account and in
   the policy header (individual or entity name as registered with Google).
4. **[EFFECTIVE_DATE]** — date the policy page goes live.

Optional (Play does not require them):

5. Website URL for the listing.
6. Support website / phone (email is sufficient).
7. Physical address — only if Google's developer-account verification requires it for the
   account type (individual vs organisation); not something to invent for the listing.

## 10. Screenshot and feature-graphic reference (documentation only — do not modify)

Phone screenshots, 1080×1920 px, PNG, RGB, 9:16 — six per locale:

| # | Screen | EN headline | HY headline |
| --- | --- | --- | --- |
| 01 | Home | 3 games. One phone. | 3 խաղ՝ մեկ հեռախոսով |
| 02 | Wrong Answer Only | Answer wrong on purpose | Դիտմամբ սխալ պատասխանիր |
| 03 | Same Answer | Think alike. Score together. | Մտածեք նույնը |
| 04 | Act It! pre-turn | One guesses. The team acts. | Մեկը գուշակում է, թիմը՝ ցույց տալիս |
| 05 | Act It! gameplay | Act fast. Guess fast. | Արագ ցույց տուր, արագ գուշակիր |
| 06 | Results | Compete. Score. Win together. | Մրցեք։ Միավոր հավաքեք։ Հաղթեք։ |

Files: `release/playstore/final/en/playstore-en-0N-*.png`, `release/playstore/final/hy/playstore-hy-0N-*.png`.
Raw (unframed) captures: `release/playstore/screenshots/{en,hy}/`.

Feature graphic: `release/playstore/final/feature-graphic.png` — 1024×500, RGB, no alpha,
logo only, no text → one file for all locales. Upload unchanged.

## 11. Copy QA checklist (done for this document set)

- Title 4/30; short description EN 54/80, HY 61/80; full description EN 1062, HY 1085 characters.
- No mention or implication of: online multiplayer, accounts/profiles, matchmaking, voice
  recognition, AI, ads, achievements, custom card creation, or holding the phone on the
  forehead. (The in-app instruction is "Hold the screen toward your teammates, and don't look.")
- No "best", "#1", download CTAs, emojis, ratings or badges in the copy.
- Mode names match the app: Wrong Answer Only / Same Answer / Act It! and
  ՄԻԱՅՆ ՍԽԱԼ ՊԱՏԱՍԽԱՆ / ՆՈՒՅՆ ՊԱՏԱՍԽԱՆԸ / ՑՈՒՅՑ ՏՈՒՐ.
- Armenian uses Eastern Armenian orthography and punctuation (։ ՝ ՞) throughout.
