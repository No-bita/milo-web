# milo. — Core Flow Product & UX Spec

**Status:** Source of truth for the frontend prototype · v1.3 · 2026-10-03
**Audience:** The frontend engineer or agent building the prototype. Read Sections 0 and 1 before anything else.
**Scope:** Core loop only, using deterministic mock data. No backend, auth, venues, maps, booking, payments, real sharing or real notifications. **No phone frames or device mock-ups:** the prototype is the app itself, running full screen. Each partner opens their own session (§3.10).

---

## 0. Where this spec departs from the brief and the mockups

The brief is strong. This spec keeps its core decisions. These are the places where I changed something or pinned down a detail the brief left open, with the reason for each.

| # | Issue | Decision | Why |
|---|---|---|---|
| 1 | **Hardcoded synthesis will break the demo.** If the "picture of your night" is fixed copy, it will contradict how the presenter actually swiped (they reject every quiet card, then read "You seem drawn to quieter evenings"). The whole product promise rests on "Milo understood me", and one contradiction undoes it. | Synthesis, shared understanding and the three nights are **derived from reactions** through a small deterministic trait lookup (Appendix A). It's still mock data, not an engine. | "Deterministic" should mean predictable, not scripted. The output has to match what the user did. |
| 2 | **"One of you…" is not anonymous between two people.** Each person knows which side they're on, so they know which side the other person is on. | Treat a surfaced difference as a **reveal that can't be taken back**. Surface at most one. Only use safe dimensions (energy, novelty, pace, setting). **Never** surface intimacy/company or occasion/specialness. Phrase both sides as wants. Only show it if one of the three nights visibly resolves it. | "One of you wants it intimate, the other doesn't" would create exactly the tension the product exists to remove. |
| 3 | **Tap = Maybe is a trap.** People tap cards to inspect them, so an accidental tap would register a vote. | **Maybe is a button only.** Tapping the card does nothing. Swipe left and right still work. | Votes should never happen by accident. Three buttons are already on screen. |
| 4 | **Tags on discovery cards** (mockup: "Quiet · Intimate · A little unexpected") expose the scoring taxonomy and invite judging attributes ("do I like *Quiet*?") rather than reacting to the night. They also look like directory filters. | **No tags on cards.** Use one evocative sub-line instead ("Candlelight, no rush, nowhere else to be"). | The card should prompt "do I want this kind of night?" and nothing else. |
| 5 | **Heart buttons and X stamps** (mockup screen 4) read as Tinder. A swipe deck in a couples' app is already close to dating-app territory. | No hearts, flames or big X/✓ stamps. Drag feedback is a quiet text label at the card edge. The three buttons have equal visual weight at rest, and oxblood appears only when one is pressed. | Avoid the dating-app cliché. Equal weight also avoids nudging people toward "yes". |
| 6 | **Device model.** *(Revised in v1.2 and v1.3.)* | **Each partner uses their own phone, in their own time.** A finishes, then invites B. B joins from the invite. When both have finished, each sees the shared result on their own phone. In the prototype, each partner has **their own session** (their own URL, in their own browser window or tab), and there is no phone frame (§3.10). | This is the product's actual model. Privacy comes from separate devices and sessions, not from a screen that hides one partner's answers from the other. |
| 7 | **People only answer honestly if they believe the partner won't see raw choices**, and nothing in the flow currently says so. | One line of privacy reassurance on A's invite screen and on B's invitation. | Candour is what makes the input worth anything. |
| 8 | **Global step counter** ("1/9") makes the flow feel like a form. | No global step counter. Only the deck shows progress (8 segments). | Intent-setting should not feel like a questionnaire. |
| 9 | **The "Got it" transition as a full screen with a CTA** is an extra tap with no decision behind it. | It becomes a **threshold moment**: a ~1.8s auto-advancing transition (tap to skip) in which ivory darkens to obsidian. The gesture hint moves onto the first card. | It cuts a screen and gives the colour shift meaning. |
| 10 | **Shared-screen summaries styled as pills** look selectable, because pills are interactive on the intent screen. | Non-interactive summaries are **text rows with a small line icon**, never pills. | In Milo a pill always means "you can choose this". |
| 11 | **A fixed 8-card deck makes the intent screen feel ignored** ("I said low-key and you're showing me rooftops"). | The deck draws 8 from a pool of 12. It is ordered by the person's intent, with **2 deliberate stretch cards** at positions 3 and 6. | Intent should visibly shape the deck. Stretch cards capture revealed preference, which matters more than stated preference. |
| 12 | **Mis-swipes have no remedy.** | A back arrow in the deck header **undoes the last reaction**. | A minimal fix for a common frustration. It doesn't add a feature. |
| 13 | **Ending on three options doesn't finish the job.** The product's job is a decision. On separate devices, one person can't decide for both. | Keep a minimal **"Your night"** screen. **One partner suggests a night, the other confirms it** (the latest suggestion wins), and then both partners see "Tonight's sorted." No booking. | The loop needs to close with agreement from both of them, not a unilateral choice. |
| 14 | **Sand `#EDE6DF` and Taupe `#E8DFD8` are nearly the same colour.** | Taupe is used **only for hairlines, dividers and unselected outlines**. Sand is used for surfaces. They never sit side by side as two surface fills. | Otherwise the two roles blur into one muddy tone. |
| 15 | **No text colours were defined.** | Added the ink tokens in §3.1. | Obsidian body text on ivory is too cold and harsh for the reading screens. |
| 16 | **Unlimited mood picks carry almost no signal.** People pick 4–5 of 8 because they all sound nice. | **Hard cap of 3.** All picks are weighted equally. The order they were tapped in is ignored. | A cap forces people to prioritise. Tap order mostly reflects scanning the grid from top-left, not how much someone cares. |
| 17 | **The deck cards are ambiguous.** A "no" to rooftop drinks could mean anything. | Each card adds a **shape line** ("Drinks → Small plates") that says what the night involves. "Skip if" guidance goes on the nights (S7), **never** on the deck. | The shape line answers "what would I get?" without bringing back venues. Telling people when to say no during the deck would bias the very signal Milo learns from. |
| 18 | **The three nights felt generic next to a personal S5.** | Each night's S6 line is **built from the couple's shared phrases**. When both partners reacted "I'm into it" to the same card, that card's image becomes the night's thumbnail. | The link from "what you both want" to "here's a night" has to be visible, or the effort feels wasted. |
| 19 | **There was no honest state for couples who barely overlap.** | Added a low-overlap state to S5 (A.5). The difference label is warmer ("A little difference"). The synthesis is capped at 3 observations. | S5 must never claim more closeness than the data supports. |
| 20 | **Waiting in an async flow can break momentum** for a plan that's meant for *tonight*. | A finishes **before** inviting B, so B always finishes second and sees the result immediately. A gets one in-app notification when it's ready. There are no reminders and no "nudge" button. | Only one person ever waits. Whether the wait is acceptable is a prototype question (see the closing risks). |

Things deliberately **not** added: editing or correcting the synthesis, a chat, a "surprise me" option, venue names, a compatibility summary, reminders or nudges, accounts or history. The only notifications are three mocked in-app banners about partner status (§2.6).

---

## ARTIFACT 1 — Product North Star

**What Milo is.** Milo helps two people decide what to do together tonight. Each person says what they're in the mood for, without negotiating. Milo turns that into three evenings they'd both enjoy.

**The problem.** Two people both want the time together, but working out what each wants and finding something that suits both takes effort ("I don't mind, what do you want?"). That coordination cost is what Milo removes.

**The core loop.**
1. **Me (A).** Set a broad mood, react to concrete kinds of nights, and see Milo's picture of what you want.
2. **Me (B).** Invited by A, B does the same on their own device, whenever suits them. Neither partner sees the other's raw choices.
3. **Us.** Once both have finished, each sees the same result on their own device. Milo says what you both want, names at most one difference worth knowing, and offers **three imagined evenings**. One of you suggests a night and the other confirms it.

**Milo should feel:** warm, editorial and intimate, like a thoughtful friend who listened. It's image-led and unhurried. The tone is confident without being clever, premium in its restraint rather than through luxury cues. Every screen asks for one thing.

**Milo should not feel like:** a restaurant directory, a booking or deals app, a dating app (hearts, flames, matching), a quiz or questionnaire, an analytics or compatibility dashboard, a generic recommendation feed, or "AI" theatre ("Analyzing your preferences…").

**The test for every screen:** *Does this make the two of them feel understood, and move them one step closer to a decision?*

---

## ARTIFACT 2 — UX Flow

### 2.0 Flow at a glance

```
AARAV (own device)                              SNEHA (own device)
──────────────────                              ──────────────────
S1 Intent → threshold → S2 Deck → S3 Synthesis
        │
S4 Invite ── "Send to Sneha" ─────────────────► S0 Invitation
        │                                              │
S4 Waiting ("Over to Sneha")                    S1 → threshold → S2 → S3
        │                                              │
        │◄──── banner: "Sneha's done" ──────────── (Sneha finishes second)
        │                                              │
[me → us] → S5 Shared → S6 Nights → S7          [me → us] → S5 → S6 → S7
        │                                              │
        └──── suggest ◄──────────────────────────► confirm ────┘
                       both see: "Tonight's sorted."
```

That's **8 unique screens**: S0 Invitation, S1 Intent, S2 Deck, S3 Synthesis, S4 Invite & wait, S5 Shared, S6 Nights, S7 Your night. S1–S3 are the same components on both sides. The threshold and me→us transitions are motion beats rather than screens.

**Sequencing rule:** A always finishes before inviting B, so B is always the second to finish. B goes straight from S3 to the shared result. A is notified and joins when convenient. Both partners see the **same** S5 and S6 content.

### 2.1 S1 — Broad intent

| | |
|---|---|
| **Purpose** | Capture a fast, low-effort mood signal. Seed the deck and anchor the synthesis. |
| **User sees** | The "milo." wordmark, a context line (A: "Tonight, with Sneha" · B: "Aarav's done. Your turn."), the headline "What do you want tonight to feel like?", the sub-line "Pick up to three.", 8 image tiles, and a CTA. |
| **Decision** | Which moods matter most tonight. Up to three can be chosen, and contradictions are allowed. |
| **Interactions** | Tap a tile to toggle it. 1 to 3 can be selected, and all picks count equally. The CTA is disabled until at least one is selected. **Tapping a 4th tile** doesn't select it: the tile gives a small shake (±4px, 200ms) and the sub-line flashes oxblood for ~1s. Deselecting a tile frees a slot. |
| **After** | CTA → threshold transition → S2. |
| **Must NOT** | Behave as single-select. Show a progress counter. Dim or "lose" unselected tiles. Ask follow-up questions. Pre-fill or hint at the partner's picks. Grey out or lock the other tiles at the cap. Silently replace the oldest pick. Weight picks by tap order. Use radio buttons, checkboxes or form styling. |

### 2.2 Threshold moment (for both partners)

| | |
|---|---|
| **Purpose** | Mark the shift from reflection (ivory) to immersion (obsidian) and set expectations. |
| **User sees** | "Got it." / "Let's get a little more specific." in serif, centred, while the background darkens to obsidian. |
| **Decision** | None. |
| **Interactions** | Auto-advances after ~1.8s. Tap anywhere to skip. |
| **After** | The first card rises into place. |
| **Must NOT** | Need a CTA. Show a spinner or "loading". Last longer than about 2s. |

### 2.3 S2 — Discovery deck

| | |
|---|---|
| **Purpose** | Learn intent progressively by reacting to concrete *kinds of nights*, one at a time. |
| **User sees** | An obsidian screen. The header has a back/undo arrow, 8 progress segments and the wordmark. One large image card shows a serif title, a one-line evocative sub-line and a **shape line** ("Dinner → Live set"). Three equal-weight buttons sit below: **Not tonight · Maybe · I'm into it**. The first card only carries a hint: "Swipe, or use the buttons." |
| **Decision** | "Do I want *this kind of night*?" Each card is judged on its own. |
| **Interactions** | Swipe left means Not tonight. Swipe right means I'm into it. The **Maybe button** is the only way to vote Maybe. All three buttons work. Back undoes the last reaction, and the card returns. Tapping the card does nothing. |
| **After** | The card exits in the direction of the reaction and the next one enters. After card 8, a short pause (~400ms), then a crossfade from obsidian to ivory and S3. |
| **Must NOT** | Show two cards to compare. Show venue names, ratings, prices, maps, distance or tags. Show pros and cons or "skip if" copy. Show scores or "% match". Use heart or X stamps. Allow an accidental vote on tap. Loop endlessly. Show "you liked 5 of 8". |

### 2.4 S3 — Personal synthesis

| | |
|---|---|
| **Purpose** | Create the feeling "Milo understood me", and confirm the input before it's combined with the partner's. |
| **User sees** | The headline "A little picture of your night", the sub-line "Here's what we're picking up.", **exactly 3** observations (fewer only in the A.7 edge cases) written in Milo's voice, and a CTA. |
| **Decision** | Whether this feels right. The person accepts it implicitly. |
| **Interactions** | CTA only. A (finishing first): "Looks good →". B (finishing second): "See what you both want →". |
| **After** | A → S4 Invite. B → the me→us beat → S5 (on B's side only). |
| **Must NOT** | Show scores, bars, radar charts or percentages. List cards they liked or disliked. Use the word "profile". Contradict their reactions (see §0.1). Offer a way back into the deck after confirming. |

### 2.5 S4 — Invite & wait (Aarav's side)

| | |
|---|---|
| **Purpose** | Hand the plan to B without pressure, promise privacy, and hold A's attention lightly while B does their part. |
| **User sees (invite state)** | A's and B's monograms (B's as an outline), the headline "Now it's Sneha's turn.", the sub-line "Same questions. Different tastes. We'll bring it together once you've both finished.", the privacy line "Sneha won't see what you picked. We'll only share the big picture.", and the CTA "Send to Sneha". |
| **User sees (waiting state)** | The headline "Over to Sneha.", the sub-line "We'll let you know when Sneha's done.", and no CTA. A can close the app. |
| **Decision** | Send the invite. |
| **Interactions** | "Send to Sneha" is mocked: there's no real share sheet. It switches to the waiting state and delivers the invitation to Sneha's session. When B finishes, a **banner** appears ("Sneha's done. See what you're both looking for.") and tapping it plays the me→us beat, then S5. |
| **Must NOT** | Show B's progress ("Sneha is on card 5"), picks or reactions. Offer a nudge or reminder. Show a countdown or a spinner. Let A edit their answers after sending. |

### 2.5b S0 — Invitation (Sneha's side, entry point)

| | |
|---|---|
| **Purpose** | Welcome B with context, set expectations (it's quick and private), and get B started. |
| **User sees** | Both monograms, the context line "From Aarav", the headline "Aarav wants to plan tonight with you.", the sub-line "Same questions. Different tastes. About a minute.", the privacy line "Aarav won't see what you picked. We'll only share the big picture.", and the CTA "Let's go". |
| **Decision** | Start. |
| **Interactions** | CTA only. |
| **After** | B's S1, with the context line "Aarav's done. Your turn." |
| **Must NOT** | Show any of A's picks, reactions, observations or "what Aarav is in the mood for". Require sign-up. |

### 2.6 Me → Us beat, and partner banners

The two monograms slide together and overlap (~700ms) above the line "Putting your nights together." in serif. It plays for each partner the first time they open the shared result. This transition creates the shift from "me" to "us". It is not a loader: no spinner and no progress bar.

**Partner banners** are the only notifications. They're mocked in-app banners (sand surface, top of the screen, tappable, dismissed by swiping up or after 6s):
1. To A: "Sneha's done. See what you're both looking for." → me→us → S5
2. To the other partner, when a night is suggested: "Sneha suggested The Middle Ground." → that night's S7
3. To the suggester, when it's confirmed: "Aarav's in. Tonight's sorted." → closing state

### 2.7 S5 — Shared understanding

| | |
|---|---|
| **Purpose** | Build confidence that "Milo understands *us*", and explain in advance why the three nights look the way they do. |
| **User sees** | The overlapping monograms, the headline "Here's what we think you're both looking for.", then three blocks: **You both want** (2–3 text rows with icons) · **A little difference** (optional, at most one) · **So we're looking for…** (one sentence that bridges into the nights), followed by a CTA. |
| **Decision** | None. This screen is for recognition. |
| **Interactions** | CTA "See your nights →". |
| **After** | S6. |
| **Must NOT** | Show a compatibility score, percentage, chart or Venn diagram. Show raw likes, votes or cards. Attribute the difference to a named person. Surface a difference on intimacy or occasion. Show more than one difference. Invent a difference when there isn't a meaningful one. Style the summaries as pills. |

**When a difference is surfaced** (all of these must hold):
1. It's on an allowed dimension: energy, novelty, pace or setting.
2. The partners lean in opposite directions and the gap is meaningful (Appendix A.5).
3. One of the three nights visibly resolves it (usually night 03).
4. Both sides are phrased as wants: "One of you is up for a little more energy. The other would rather keep things easy." Never "doesn't want".

If those conditions fail, **omit the block entirely**. The screen works without it.

### 2.8 S6 — Three nights

| | |
|---|---|
| **Purpose** | Turn the shared picture into three distinct, imaginable evenings. |
| **User sees** | The headline "Three nights for the two of you" and the sub-line "Different vibes, all a good fit." Below that are three editorial rows, each with a number (01–03), an image, a name, a one-to-two-line fit line built from the couple's shared phrases, and its shape as beats ("Dinner → Walk → Dessert"). |
| **Decision** | Which night to look at, and then which to choose. |
| **Interactions** | Tap a row to open S7. |
| **After** | S7 for the chosen night. |
| **Must NOT** | Show more or fewer than 3. Scroll like a feed or load more. Show ratings, prices, distances or venue names. Rank them with a "best match" badge or score. Say who a night is "for". |

### 2.9 S7 — Your night

| | |
|---|---|
| **Purpose** | Make the choice feel real, and reach agreement across two devices. |
| **User sees** | A hero image, the number and name, the night's fixed reason line, a single "why it works for you both" sentence that ties back to S5, a vertical timeline of 3 beats (each with a short descriptive line, which is the "what you get"), and one **"Skip this one if…"** line. The CTA depends on the state (below). The secondary link is "See the other two". |
| **Decision** | Suggest this night, confirm the partner's suggestion, or go back. |
| **States** | **No suggestion yet:** CTA "Suggest this to Sneha". After tapping, the CTA area reads "Suggested. We'll let you know when Sneha's in." **Partner suggested this night:** a `label` "SNEHA'S PICK" above the name, and the CTA "This is our night". **Partner suggested a different night:** CTA "Suggest this instead", and the latest suggestion replaces the earlier one. |
| **Interactions** | Primary as per the state. Secondary → back to S6. On S6, the row of the partner's suggestion carries the same small "SNEHA'S PICK" label. |
| **After (closing state)** | Once confirmed, **both partners** see it in place: "Tonight's sorted." / "The Middle Ground. Have a lovely evening." with a quiet "Start over" link. |
| **Must NOT** | Show booking, maps, a "Reserve" button, prices or venue names. Open a share sheet. Ask for a rating. Let one partner finalise without the other's confirmation. Show the suggestion as a ranking or "best" badge. |

---

## ARTIFACT 3 — Design System (Milo-specific)

### 3.1 Colour tokens

The palette does a job in the flow, so every colour has a role.

| Token | Hex | Role |
|---|---|---|
| `ivory` | `#FBF8F4` | Background for **reflection** screens: S0, S1, S3, S4, S5, S6, S7. |
| `obsidian` | `#121214` | Background for **discovery** (S2 and the threshold) only. Never a card fill on ivory screens, except S6 row images. |
| `oxblood` | `#6E2228` | **Action and commitment**: primary CTAs, selected state, the active reaction. Never decorative. |
| `oxblood-press` | `#5A1B20` | Pressed primary. |
| `oxblood-wash` | `#F3E8E5` | Selected-tile tint and the difference-block background (the only tinted block). |
| `sand` | `#EDE6DF` | Secondary surfaces: monogram fills, the S5 "So we're looking for" block, partner banners. |
| `taupe` | `#E8DFD8` | **Hairlines, dividers and unselected outlines only.** Never a surface next to sand. |
| `ink` | `#1C1917` | Primary text on light backgrounds. |
| `ink-muted` | `#6F655E` | Secondary text on light backgrounds (≈5.3:1 on ivory). |
| `on-dark` | `#F5F0EA` | Primary text on obsidian and on images. |
| `on-dark-muted` | `rgba(245,240,234,0.64)` | Secondary text on obsidian. |
| `scrim` | `linear-gradient(180deg, transparent 40%, rgba(18,18,20,0.85) 100%)` | Behind text set on images. This is the only gradient in the product. |

Rules:
- Oxblood appears in **at most one or two places per screen**. If everything is oxblood, nothing signals commitment.
- The app ignores the OS dark mode, because the palette *is* the mode system.
- No neon, glossy highlights, glassmorphism, or gradients other than the image scrim.

### 3.2 Typography

**DM Serif Display** comes in regular and italic only, so hierarchy comes from size and colour rather than weight. **Inter** handles all UI text.

| Style | Font | Size / line height | Use |
|---|---|---|---|
| `display-xl` | DM Serif Display | 34 / 40, tracking −0.01em | Screen headlines (S0, S1, S3, S4, S5) |
| `display-l` | DM Serif Display | 30 / 34 | Deck card titles, the S7 night name |
| `display-m` | DM Serif Display | 22 / 28 | S6 night names, the S5 bridge sentence |
| `voice` | DM Serif Display | 20 / 28 | Synthesis observations, the threshold copy |
| `body` | Inter 400 | 16 / 24 | Sub-lines and reasons |
| `body-s` | Inter 400 | 14 / 20 | Beat descriptions, the privacy line |
| `label` | Inter 600 | 12 / 16, UPPERCASE, tracking 0.08em | Block labels ("YOU BOTH WANT"), numbers ("01"), "SNEHA'S PICK" |
| `button` | Inter 600 | 16 / 20 | CTAs |
| `wordmark` | DM Serif Display | 22, lowercase "milo." | Header |

- **Milo's voice is serif.** Anything Milo "says" (headlines, observations, the bridge sentence) is serif. Mechanics (buttons, labels, hints) are sans.
- Use italic sparingly, for one emphasised word at most per screen (for example *both*).
- Headlines are short enough to fit in 3 lines at 375px wide.

### 3.3 Spacing

- Base unit **4px**. Common steps: 8, 12, 16, 24, 32, 48.
- **Gutter:** 24px on ivory screens. 16px on the deck, where the card is meant to be immersive and near full width.
- **Rhythm:** the gap between headline and content (32) is larger than gaps within content (12–16). Leave the space generous, like a magazine page; don't fill it.
- **Containers:** at most one level of nesting. Content sits on the page and is separated by space and taupe hairlines, not by boxes. Only three things get a filled block: the S5 difference (oxblood-wash), the S5 bridge sentence (sand), and the deck card itself.

### 3.4 Image treatment

- **Subject:** places and moments, not models. Use candlelit tables, courtyards, streets at dusk, hands, glasses, and people from behind or at a distance. **No posed couples smiling at the camera.** Users should picture themselves there.
- **Grade:** warm white balance, slightly lowered saturation, lifted blacks, a gentle film-like softness. The image set should feel like one photographer shot it in one city.
- **Never:** stock "date night" clichés, roses and hearts, overt food-porn close-ups (too restaurant-like), or neon nightlife.
- Text always sits on the image scrim and must meet 4.5:1 contrast.
- Corner radius: deck card 24, S1 tiles 16, S6 thumbnails 12, S7 hero 0 (full bleed at the top).
- Preload every deck image before the threshold ends, so a card never shows a blank or loading state.

### 3.5 Cards

- **Discovery card** (the only "card" in the product): full-bleed image, radius 24, roughly 62–66% of viewport height, width = screen − 32. A serif title (`display-l`, at most 3 lines), a sub-line (`body`, `on-dark-muted`, 1 line) and a shape line (`body-s`, `on-dark-muted`, steps joined by "→", at most 3 steps) sit bottom-left on the scrim. No tags, icons, venue names, pros and cons, or other metadata. A soft shadow `0 24px 48px rgba(0,0,0,0.45)`. The next card peeks behind it at scale 0.96 and is visible only by a few px.
- **Everything else** is a row, not a card. S6 nights are rows: image thumbnail on the left (≈96×112), text on the right, taupe hairline between rows.

### 3.6 Buttons

| Type | Spec | Use |
|---|---|---|
| **Primary** | Oxblood fill, `on-dark` text, height 56, full pill radius, full width within the gutter, pinned above the safe area. A trailing "→" is optional. | One per screen, at most. |
| **Disabled primary** | Taupe fill, `ink-muted` text. | S1 before any selection. |
| **Secondary** | Text link in `ink`, underlined on press. | "See the other two", "Start over". |
| **Reaction buttons** (deck only) | Three **equal** 64px circles with an outline in `on-dark` at 24% and a label underneath (`body-s`). Glyphs: ✕ thin (Not tonight), ○ (Maybe), ✓ thin (I'm into it). **No heart.** On press or matching drag: *Into it* fills oxblood, *Not tonight* fills `on-dark` at 16%, *Maybe* fills `on-dark` at 16%. | S2 only. |

### 3.7 Pills and selected states

- **Pills exist only where something is selectable.** In the core flow that means the S1 tiles. The tiles are image tiles rather than text pills, but they follow the same rule.
- **S1 selected tile:** a 2px oxblood ring (inset), a small oxblood circle with a white check in the top-right corner, and the label weight going from 500 to 600. Unselected tiles stay at full opacity, so there's no penalty for leaving one unselected.
- **Selection feedback:** a scale of 0.97 → 1.0 over 160ms, with optional light haptic (`navigator.vibrate(8)` where supported).
- **Non-interactive summaries** (S3 observations, S5 rows) are plain text rows with a 20px line icon in `ink-muted`. They never look tappable.

### 3.8 Discovery mode (obsidian)

- This is the one place where the product goes dark, so that it feels like stepping into the evening.
- The UI chrome recedes. The header uses `on-dark-muted`, and the progress segments are 2px tall: done = `on-dark`, remaining = `on-dark` at 20%.
- The only colour is the photography, plus oxblood on a committed "Into it".
- Drag feedback: as the card moves, a text label fades in at the leading edge in `label` style. "NOT TONIGHT" appears on the right edge when dragging left, and "INTO IT" appears on the left edge when dragging right. Opacity is proportional to drag distance. The matching button highlights in sync.

### 3.9 Motion

The philosophy: motion should feel **like a calm breath, not a casino**. Every transition says where you are (moving into immersion, back to reflection, from me to us). Nothing is bouncy except the card springing back.

| Moment | Motion | Duration / easing |
|---|---|---|
| Threshold | Background crossfades ivory → obsidian, the copy fades up 8px, then the first card rises 16px and goes from scale 0.96 to 1 | 600ms bg, card +280ms · `milo-out` |
| Drag | The card follows the finger, rotating up to ±8° in proportion to x | 1:1 |
| Release below threshold | Springs back | stiff spring, little bounce |
| Not tonight / Into it | Exits off-screen in the swipe direction while rotating | 260ms `milo-out` |
| Maybe | Card **sinks**: drops 24px, scales to 0.94 and fades out (it's set aside rather than rejected) | 240ms |
| Next card | Rises from the peeking position | 280ms |
| Undo | The last card returns from the side it left | 280ms |
| Deck → S3 | Obsidian → ivory crossfade | 500ms |
| S3 observations | Staggered fade-up of 8px, 120ms apart | 360ms each |
| Me → us | Two monograms slide in and overlap | 700ms |
| S6 rows | Staggered fade-up, 90ms apart | 320ms |
| S6 → S7 | Thumbnail expands into the hero (shared element). A crossfade is an acceptable fallback. | 400ms |
| Partner banner | Slides down from the top and settles; slides up to dismiss | 280ms `milo-out` |
| S4 invite → waiting | B's outline monogram gently pulses once, then the copy crossfades | 400ms |

- `milo-out` = `cubic-bezier(0.22, 1, 0.36, 1)`.
- Nothing longer than 700ms. No confetti, sparkles or celebratory bursts, including on the closing state.
- **Reduced motion** (`prefers-reduced-motion`): crossfades only. Cards fade out instead of flying.

### 3.10 Mobile layout principles

- Design at **390×844** and verify at **375×812** and **430×932**.
- Respect safe-area insets. The primary CTA is pinned at the bottom, 16px above the inset.
- **No scrolling on S0, S1, S2, S3, S4 or S5 at 390×844.** At 375×812, S1 tiles shrink (the aspect ratio flattens) rather than forcing a scroll. S6 should fit all three rows at 390×844. To get there, **reduce row vertical padding and image height responsively before allowing overflow. Never shrink type below the scale in §3.2.** The priority is readability first, then fitting all three rows, then zero scroll. Scrolling is never the default at 390×844. At 375×812 a small scroll is acceptable only if row 03's title is visible at first paint. S7 may scroll.
- Header: 56px. Wordmark on the left. Right side: nothing on reflection screens, the progress segments on the deck.
- Thumb zone: every interactive element in S2 sits in the bottom 45% of the screen, apart from undo.
- Touch targets are at least 44×44.
- **No phone frame, ever.** Never render device bezels, notches, fake status bars ("9:41") or a phone mock-up. On a phone, the app fills the screen. On a larger screen, it renders the same mobile layout in a centred column (max-width 430px, full viewport height) on an ivory page background. There is no separate desktop layout.
- **One person per session.** Each partner opens their own URL: `?as=aarav` or `?as=sneha`. There's no in-app switch between people, and no presenter panel.
- **How the async loop works without a backend:** shared state lives in `localStorage` and is synced between sessions with the `storage` event. To demo it, open the two URLs in two browser windows on the same machine, side by side. Two separate real phones can't sync without a backend, which is out of scope.
- **Before the invite arrives**, Sneha's session shows a prototype-only idle screen ("Nothing planned yet. When Aarav invites you, it'll show up here.") and moves to S0 automatically when the invite lands.
- **Reset:** `?reset=1` clears the shared state. "Start over" on the closing state does the same.

### 3.11 Voice and copy

- Milo speaks as **"we"**: warm, short and plain. Never say "AI", "algorithm", "analyzing", "match", "profile" or "compatibility".
- Hedge observations lightly ("seem", "a little", "tonight"). This keeps small misreads forgivable and frames the reading as about *tonight*, not about who you are.
- Refer to partners **by name**, and never with gendered pronouns. Names come from config (default: **Aarav** and **Sneha**).
- Use British/Indian spelling consistently ("neighbourhood", "cosy").

---

## ARTIFACT 4 — Screen-by-Screen Blueprint

Mock names: **A = Aarav** and **B = Sneha**, both configurable. Copy is final unless it's marked as derived.

### S1 · Broad intent  *(ivory)*

- **Headline:** What do you want tonight to feel like?
- **Supporting:** Pick up to three.
- **Context line (above the headline, `body-s` muted):** A: "Tonight, with Sneha" · B: "Aarav's done. Your turn." (always true, because A finishes before inviting)
- **Composition:** Header (wordmark) → context line → headline → sub-line → a 2×4 grid of image tiles, gap 12, with the label overlaid bottom-left on the scrim → pinned CTA.
- **Content (8 tiles):** Intimate · A little fun · Something new · Low-key · Special · Spontaneous · A bit of buzz · Outdoors
  - "Social" is renamed **"A bit of buzz"**. "Social" suggested bringing friends along, which isn't what this product is for.
- **Interaction:** Tap toggles. Up to 3 can be selected, with equal weight. Contradictions are allowed. A 4th tap shakes the tile and flashes the sub-line, and nothing gets selected.
- **CTA:** "Continue →". Disabled until one tile is selected.
- **Transition:** Threshold moment.
- **Objective:** *"This is easy, and it already feels like tonight."* It should feel like setting a mood board, not filling in a form.

### Threshold  *(ivory → obsidian, ~1.8s, tap to skip)*

- **Copy:** "Got it." (`display-xl`) / "Let's get a little more specific." (`voice`, muted)
- **Objective:** A deliberate step into the evening.

### S2 · Discovery deck  *(obsidian)*

- **Headline:** None. The card is the content.
- **Header:** ← undo (hidden on card 1) · 8 progress segments · wordmark
- **First-card hint (below the buttons, fades after the first reaction):** "Swipe, or use the buttons."
- **Composition:** One dominant card with the next card peeking behind it, and three reaction buttons with labels below.
- **Content:** 8 cards drawn from the 12-card pool (Appendix A.2), ordered by intent, with stretch cards at positions 3 and 6. Each card has an image, a title, one sub-line and a shape line.
- **Interaction:** Swipe left = Not tonight, swipe right = I'm into it, buttons for all three, Maybe by button only, undo with ←. Commit when the drag passes 30% of card width or a flick exceeds about 0.5px/ms. Vertical drag is ignored.
- **CTA:** None. The deck finishing *is* the CTA.
- **Transition:** After card 8 there's a 400ms pause, then obsidian crossfades to ivory and S3 appears.
- **Objective:** *"I'm picturing evenings, not browsing places."* It should be tactile, quick and finite, about 30–45 seconds in total.

### S3 · Personal synthesis  *(ivory)*

- **Headline:** A little picture of your night
- **Supporting:** Here's what we're picking up.
- **Composition:** Headline → sub-line → 3 observation rows (20px line icon + `voice` text, taupe hairline between rows) → pinned CTA. No boxes.
- **Content (derived, Appendix A.4), for example:**
  - You seem drawn to quieter evenings.
  - You like a little novelty.
  - You like smaller places with a bit of character.
- **CTA:** A: "Looks good →" · B: "See what you both want →"
- **Transition:** A → S4. B → me→us beat → S5.
- **Objective:** *"Milo understood me."* The observations should be specific enough to feel seen and soft enough to forgive a small misread.

### S4 · Invite & wait  *(ivory, Aarav's side)*

- **Invite state:**
  - **Headline:** Now it's Sneha's turn.
  - **Supporting:** Same questions. Different tastes. We'll bring it together once you've both finished.
  - **Privacy line (`body-s` muted):** Sneha won't see what you picked. We'll only share the big picture.
  - **Composition:** Two monograms (A in sand, B as a taupe outline, offset with no overlap; the overlap is saved for the me→us beat) → headline → sub-line → privacy line → pinned CTA.
  - **CTA:** "Send to Sneha" (mocked; there's no real share sheet)
- **Waiting state:** B's monogram pulses once. **Headline:** Over to Sneha. **Supporting:** We'll let you know when Sneha's done. No CTA.
- **Partner done:** a banner, "Sneha's done. See what you're both looking for." → me→us beat → S5.
- **Objective:** *"My part's done, and it was easy. I don't need to chase anyone."*

### S0 · Invitation  *(ivory, Sneha's side)*

- **Context line:** From Aarav
- **Headline:** Aarav wants to plan tonight with you.
- **Supporting:** Same questions. Different tastes. About a minute.
- **Privacy line (`body-s` muted):** Aarav won't see what you picked. We'll only share the big picture.
- **Composition:** Two monograms (A in sand, B as an outline) → context line → headline → sub-line → privacy line → pinned CTA.
- **CTA:** "Let's go"
- **Transition:** Crossfade to B's S1.
- **Objective:** *"This is a nice invitation, not a chore, and my answers are mine."*

### Me → us beat  *(ivory, ~1.2s total)*

- Plays for each partner the first time they open the shared result. The monograms slide together and overlap. Copy: "Putting your nights together." Then the screen auto-advances.

### S5 · Shared understanding  *(ivory)*

- **Headline:** Here's what we think you're *both* looking for.
- **Composition (top to bottom):**
  1. Overlapping monograms (small)
  2. Headline
  3. `label` YOU BOTH WANT, followed by 2–3 rows (line icon + `display-m`), e.g. "Something intimate", "A little novelty"
  4. *(Optional)* `label` A LITTLE DIFFERENCE, followed by an oxblood-wash block, radius 16, padding 16, `body` text: "One of you is up for a little more energy. The other would rather keep things easy."
  5. `label` SO WE'RE LOOKING FOR…, followed by a sand block with a `display-m` sentence: "Something intimate, a little different, without making the night hectic."
  6. Pinned CTA
- **CTA:** "See your nights →"
- **Transition:** Crossfade, then the S6 rows stagger in.
- **Objective:** *"Milo gets us."* The difference reads as context for the nights, not as a verdict on the couple.

### S6 · Three nights  *(ivory)*

- **Headline:** Three nights for the two of you
- **Supporting:** Different vibes, all a good fit.
- **Composition:** Three rows separated by hairlines. Each row: image (radius 12) · `label` "01" · `display-m` name · `body` fit line, **built from the shared phrases** (A.6), at most 2 lines · `body-s` muted beats "Dinner → Walk → Dessert". A chevron on the right shows the row can be tapped.
- **Content (derived, Appendix A.6), golden-path example:**
  - **01 · The Middle Ground.** "Something intimate, with room for a long conversation." Dinner → Walk → Dessert
  - **02 · The Little Adventure.** "A little different: make something together, then linger over dinner." Creative activity → Dinner → Dessert
  - **03 · The Lively One.** "A little more energy, without it becoming a party night." Rooftop → Sharing plates → Live music
- **Thumbnail:** when both partners reacted "I'm into it" to the same deck card, use that card's image for the night it best fits. Otherwise use the night's default image. On the golden path there's no such card, so the defaults are used.
- **Interaction:** Tap a row → S7. If the partner has suggested a night, its row carries a small `label` "SNEHA'S PICK" (in `ink-muted`, not oxblood).
- **CTA:** None. The rows are the choice.
- **Objective:** *"Three evenings we can actually imagine, and they're clearly different from each other."*

### S7 · Your night  *(image hero → ivory)*

- **Composition:** A full-bleed hero image (top ~40%) with the number and name on the scrim → reason line → **why it works** (`voice`, one sentence, e.g. "It keeps things intimate, adds something new, and never gets hectic.") → a timeline of 3 beats (a small dot and a taupe line, beat name in `button` style, one `body-s` description each, e.g. "Dinner — somewhere small and candlelit, no rush.") → **skip line** (`body-s`, `ink-muted`, e.g. "Skip this one if you'd rather settle in one place all night.") → pinned primary CTA plus a secondary link above it.
- **CTA by state:** no suggestion yet → "Suggest this to Sneha" · partner suggested this night → "This is our night" · partner suggested another → "Suggest this instead". Secondary: "See the other two".
- **After suggesting:** the CTA area reads "Suggested. We'll let you know when Sneha's in."
- **Closing state (in place, for both partners):** "Tonight's sorted." (`display-m`) / "The Middle Ground. Have a lovely evening." plus a "Start over" link. No confetti.
- **Objective:** *"Decided together, and that was easy."*

---

## ARTIFACT 5 — Frontend Acceptance Criteria

### A. UX correctness
- [ ] The full async loop runs end to end across two sessions (`?as=aarav` and `?as=sneha` in two windows): A (S1→S2→S3→S4 invite→waiting) → B (S0→S1→S2→S3) → B sees me→us → S5 → A gets the banner → me→us → S5 → S6 → S7 → one suggests, the other confirms → closing state for **both** partners.
- [ ] S1 allows 1–3 selections with equal weight. The CTA is disabled at 0. A 4th tap is refused, with a shake and a sub-line flash. Nothing is greyed out or auto-replaced.
- [ ] The deck shows exactly **one** experience at a time and has exactly **8** cards.
- [ ] Deck contents and order respond to S1 picks, with stretch cards at positions 3 and 6.
- [ ] Experience cards contain only an image, a title, a sub-line and a shape line. There's no "skip if" copy on cards. There are no venues, ratings, prices, tags, maps or distances.
- [ ] S3 shows 3 observations (fewer only in A.7 edge cases) **derived from that person's reactions and intents**, and they never contradict them on the golden path or on the edge-case paths (Appendix A.7).
- [ ] Each session shows only its own person's flow. No A data is visible or pre-filled anywhere in B's session, and vice versa, apart from the shared result. There is no in-app way to switch person.
- [ ] A finishes before inviting, so B is always the second to finish. A's waiting state shows no progress or choices from B.
- [ ] Only the three partner banners in §2.6 exist. There are no reminders or nudges.
- [ ] Both sessions show identical S5 and S6 content.
- [ ] Choosing a night needs a suggestion from one partner and confirmation from the other. The latest suggestion wins.
- [ ] S5 shows 2–3 shared rows, **at most one** difference (labelled "A little difference"), and one bridge sentence. Low-overlap couples get the low-overlap state (A.5) and never a falsely confident summary.
- [ ] Differences appear only on energy, novelty, pace or setting, and only when the gap condition holds. A night in S6 resolves the difference.
- [ ] S6 shows **exactly 3** nights, each with a number, a name, a fit line built from the shared phrases, and beats.
- [ ] S7 shows the beats, the "why it works" sentence and a "Skip this one if…" line, commits to one night, and offers a way back to the other two.
- [ ] The golden path (Appendix A.8) reproduces the example copy in §ARTIFACT 4.

### B. Visual correctness
- [ ] Ivory backs S0, S1, S3, S4, S5, S6 and S7. Obsidian backs only S2 and the threshold.
- [ ] Oxblood is used only for primary CTAs, selected states and the active "Into it". There are at most two oxblood elements per screen.
- [ ] Taupe never sits next to sand as a second surface fill.
- [ ] Headlines, observations and the bridge sentence are in DM Serif Display. UI text is in Inter. The wordmark is lowercase "milo." in serif.
- [ ] No heart icons, X/✓ stamps, flames, badges, stars or "match" language.
- [ ] No gradients other than the image scrim. No glossy or glass effects and no neon.
- [ ] Non-interactive summaries are text rows, not pills or chips.
- [ ] Imagery shows places and moments with a consistent warm grade, and no posed couples facing the camera.
- [ ] Container nesting is at most one level deep. Only the deck card, the S5 difference block and the S5 bridge block are filled blocks.

### C. Interaction correctness
- [ ] Swipe left means Not tonight and swipe right means I'm into it. Each commits at 30% of width or on a flick, and springs back below that threshold.
- [ ] **Tapping the card registers no reaction.** Maybe works only through its button.
- [ ] All three reactions are available as buttons and keyboard-accessible (← ↓ → on desktop).
- [ ] The drag shows an edge text label and highlights the matching button in proportion to distance.
- [ ] Undo restores the previous card and its reaction is removed.
- [ ] Each reaction has its own exit motion (left, right, sink for Maybe).
- [ ] The threshold auto-advances in about 1.8s and can be skipped with a tap.
- [ ] No transition exceeds 700ms (the me→us beat may total about 1.2s including the hold).
- [ ] Under `prefers-reduced-motion`, only crossfades are used.
- [ ] Deck images are preloaded, so no card ever shows an empty image.

### D. Mobile correctness
- [ ] At 390×844, S0–S5 fit without scrolling and S6 shows all three rows. S6 gets there by compressing row padding and image height, never by shrinking type below §3.2.
- [ ] At 375×812, S1 tiles shrink rather than scroll, and the title of S6 row 03 is visible at first paint.
- [ ] At 430×932, the layout scales without awkward gaps. Content stays anchored to the top and the CTA stays pinned.
- [ ] Safe-area insets are respected, and the CTA sits 16px above the bottom inset.
- [ ] All touch targets are at least 44×44.
- [ ] Text on images meets 4.5:1 contrast through the scrim.
- [ ] Swiping the deck doesn't scroll the page or trigger browser back-navigation.
- [ ] No phone frame, bezel, notch or fake status bar is rendered at any size. On a phone the app is full screen. On a larger screen it's a centred column, at most 430px wide.
- [ ] Changes in one session (invite sent, finished, suggestion, confirmation) show up in the other session's open window without a reload.

### E. Product philosophy
- [ ] No number, percentage, chart or score about preferences or compatibility appears anywhere.
- [ ] No raw votes are ever shown ("you liked 5", "you both swiped right on…").
- [ ] Neither partner can see the other's raw choices, progress or personal synthesis. The only things that cross between partners are: finished, the shared result, a suggestion, and a confirmation.
- [ ] The difference is never attributed to a named person and never framed as a problem.
- [ ] S5 reads as "me → us": the overlapping monograms, the "both" language and the bridge into the nights.
- [ ] The three nights read as imagined evenings, not search results. There are no rankings, filters or "more results".
- [ ] Copy never mentions AI, algorithms, matching or analysis.
- [ ] Nothing in the UI resembles a restaurant directory, a booking app or a dating app.
- [ ] No feature has been added beyond this spec.

---

## Closing

### 1. Proposed final core flow

**Aarav:** S1 Intent → (threshold) → S2 Deck × 8 → S3 Synthesis → S4 Invite → waiting · **Sneha:** S0 Invitation → S1 → S2 → S3 · **Both, once both have finished:** (me→us) → S5 Shared understanding → S6 Three nights → S7 Your night → suggest / confirm → "Tonight's sorted."

That's 8 unique screens, down from the 12 in the mockups. The transition screen, the swipe and Maybe states, and the partner synthesis are now states or reused components rather than screens of their own.

### 2. Three UX decisions to protect during implementation

1. **One kind of night at a time, with no venues and no tags.** The card asks "do I want this evening?", never "do I want this place?". This is what separates Milo from a directory.
2. **Privacy runs both ways, and the shared screen speaks only about "both".** No raw choices cross between partners. At most one difference is shown, it's never attributed, it's never on a sensitive dimension, and it only appears when it explains a night.
3. **The palette marks the stages of the flow.** Obsidian is for imagining, ivory for reflecting, oxblood for committing. Keep the colour shifts at the flow's stage changes; don't decorate with them.

### 3. Biggest risks that could make the prototype feel wrong

1. **The synthesis contradicts the swipes.** If S3 or S5 says something the user visibly didn't do, "Milo understood me" collapses in the first demo. That's why the outputs must be derived, and why the edge-case paths need testing.
2. **It drifts into dating-app or directory territory.** Hearts, stamps, tags, ratings, venue names, a "best match" badge or a long scrolling results list would each pull Milo into a category it's trying to escape.
3. **It feels like a form.** Step counters, checkbox styling, slow interstitials, too many containers and generic stock photography make it a questionnaire instead of an evening. The fix is pace and restraint: big images, few words, one ask per screen.
4. **The wait undoes "tonight".** In the async model, A finishes and then waits for B. If B gets to it hours later, the plan for tonight may already have gone stale. The prototype can't show real time passing, so test it by asking: "How long would you wait before just deciding yourselves?" If the answer is short, consider letting A invite B at the start so both can go in parallel. That's a sequencing change, not a new feature.

### 4. Implementation brief (hand this to the coding agent)

> **Build a mobile-first, frontend-only interactive prototype of "milo." following `MILO_PRODUCT_SPEC.md` exactly. Section 0 and Artifacts 2–5 are binding.**
>
> **Stack:** Use the existing application stack and architecture. Don't replace it unless there's a compelling reason. If the project is greenfield, React + TypeScript + Vite is preferred, with Framer Motion (or the existing equivalent) for gestures and transitions. Use DM Serif Display and Inter from Google Fonts. No backend, auth, routing library or APIs. Shared state lives in `localStorage`, synced across windows with the `storage` event.
>
> **Build:** 8 screens: Invitation, Broad intent, Discovery deck, Personal synthesis, Invite & wait, Shared understanding, Three nights, Your night. Add the threshold and me→us motion beats, and the three partner banners. **No phone frames.** Each partner is a separate session: `?as=aarav` or `?as=sneha`. A shared `localStorage` record holds `{ a, b: { status, intents, reactions }, suggestion: { by, nightId } | null, confirmedNightId | null }`. Each session keeps its own navigation state and listens for `storage` events. Aarav: `intent → deck → synthesis → invite → waiting → (banner) → shared → nights → night(id) → closed`. Sneha: `idle (prototype-only) → invitation → intent → deck → synthesis → shared → nights → night(id) → closed`. To demo, open both URLs in two windows side by side. `?reset=1` clears the state.
>
> **Data:** All content lives in one `mockData.ts`: partner names (Aarav, Sneha), 8 intents, 12 experience concepts with trait vectors, the observation library, shared and difference phrase libraries, and 6 curated nights with beats. Implement the deterministic logic in Appendix A as pure functions (`buildDeck`, `traitLeaning`, `synthesis`, `shared`, `pickNights`). Never render scores.
>
> **Non-negotiables:** One card at a time. No venues, tags or ratings on cards. Tapping a card does nothing, and Maybe works by button only. Swipe left/right plus three equal-weight buttons, and undo. No hearts or stamps. No numbers about preferences anywhere. Each partner sees only their own answers, plus the shared result. Choosing a night takes a suggestion and a confirmation. At most one difference, only on energy, novelty, pace or setting. Exactly 3 nights. Obsidian only in discovery. Oxblood only for commitment.
>
> **Viewports:** Design at 390×844 and verify at 375×812 and 430×932. No phone frame. On larger screens, render the mobile layout in a centred column with a max-width of 430px.
>
> **Done means:** Every checkbox in Artifact 5 passes, the golden path in Appendix A.8 reproduces the example copy, and the edge-case paths in A.7 produce sensible, non-contradictory copy.

---

## Appendix A — Deterministic prototype logic (internal only, never shown in the UI)

This logic is intentionally simple. It exists so that the outputs agree with the inputs, not to be smart.

### A.1 Trait dimensions
Each dimension runs from −1 to +1:

| Dim | −1 | +1 | Difference allowed? |
|---|---|---|---|
| `energy` | calm | lively | ✅ |
| `novelty` | familiar | new | ✅ |
| `pace` | one place | a few stops | ✅ |
| `setting` | indoors | outdoors | ✅ |
| `occasion` | easy | special | ❌ never surfaced |
| `company` | just us, small places | a bit of buzz | ❌ never surfaced |

### A.2 Experience pool (12). The deck draws 8.

The content still needs a pass so that each idea has a distinct character: a sensible person should turn some of them down. Keep the trait vectors when rewriting the copy, or re-check the golden path.

| # | Title | Sub-line | Shape | energy | novelty | pace | setting | occasion | company |
|---|---|---|---|---|---|---|---|---|---|
| 1 | A slow dinner in a hidden courtyard | Candlelight, no rush, nowhere else to be. | Dinner → Dessert, same table | −1 | 0 | −1 | +1 | +1 | −1 |
| 2 | Explore a neighbourhood you've never really wandered through | Follow whatever looks interesting. | Wander → Snacks → Somewhere to sit | 0 | +1 | +1 | +1 | −1 | 0 |
| 3 | A small live music set and a long dinner | Close enough to feel it, quiet enough to talk. | Dinner → Live set | +1 | 0 | 0 | −1 | +1 | 0 |
| 4 | Sunset outdoors, then somewhere cosy | Golden hour first, a warm corner after. | Sunset → Cosy dinner | −1 | 0 | +1 | +1 | 0 | −1 |
| 5 | A late-night dessert crawl | Three stops, all of them sweet. | Dessert → Dessert → Dessert | +1 | +1 | +1 | 0 | −1 | 0 |
| 6 | Get dressed up and make an evening of it | The kind of night you plan an outfit for. | Get ready → Dinner → Drinks | 0 | 0 | −1 | −1 | +1 | 0 |
| 7 | A creative activity followed by dinner | Make something together, then eat. | Workshop → Dinner | 0 | +1 | +1 | −1 | 0 | −1 |
| 8 | Rooftop drinks with a view | The city lit up below you. | Drinks → Small plates | +1 | 0 | 0 | +1 | +1 | +1 |
| 9 | A tiny bar where nobody knows you | Eight seats, good music, one long conversation. | One bar, all night | −1 | +1 | −1 | −1 | 0 | −1 |
| 10 | Street food and a late film | Easy, a little messy, very good. | Street food → Late film | 0 | 0 | +1 | 0 | −1 | +1 |
| 11 | A long walk that ends somewhere warm | Talk the whole way there. | Walk → Somewhere warm | −1 | 0 | +1 | +1 | −1 | −1 |
| 12 | Board games and good wine somewhere cosy | A little competitive, very relaxed. | Games → Wine → Snacks | −1 | +1 | −1 | −1 | −1 | 0 |

### A.3 Intent → trait seeds, and deck building
- Each intent (at most 3) seeds the person's vector with **+0.5**, with equal weight regardless of tap order: Intimate → company −1 · A little fun → energy +1 · Something new → novelty +1 · Low-key → energy −1, occasion −1 · Special → occasion +1 · Spontaneous → pace +1, occasion −1 · A bit of buzz → company +1 · Outdoors → setting +1.
- **`buildDeck`:** score each concept by the dot product of its traits and the seed vector. Take the top 6 and the bottom 2. Order the top 6 by score, and insert the bottom 2 as stretch cards at positions 3 and 6. Break ties by pool index, so the result is deterministic.

### A.4 Personal leaning and synthesis
- Reaction weights: **Into it +1.0 · Maybe +0.35 · Not tonight −0.6**. Per dimension, leaning = (seed + Σ weight × card trait) ÷ (the number of the person's deck cards that are non-zero on that dimension, minimum 1).
- Pick up to 3 dimensions with the largest |leaning| ≥ 0.25. Never more than 3. Order by strength. Map each to the library below.

| Dim | −side observation | +side observation |
|---|---|---|
| energy | You seem drawn to quieter evenings. | You're up for a bit of energy tonight. |
| novelty | Somewhere easy and familiar suits you tonight. | You like a little novelty. |
| pace | You don't need the night to be packed with plans. | You like a night that moves a little. |
| setting | Somewhere cosy and indoors feels right. | You'd like some of the night to be outdoors. |
| occasion | You want it easy, with no dressing up required. | You'd like tonight to feel a bit special. |
| company | You like smaller places with a bit of character. | You'd enjoy being around a bit of buzz. |

### A.5 Shared and difference
- **Shared:** dimensions where `sign(A) === sign(B)` AND `abs(A) ≥ 0.2` AND `abs(B) ≥ 0.2`. Shared negative leanings count: A −0.7 and B −0.8 on energy are a shared preference for calm. Take the top 2–3 by combined strength, then **display them in a fixed priority order** so the copy reads naturally: company, energy, novelty, occasion, pace, setting. Row phrases: energy −/+ "Somewhere calm" / "A bit of energy" · novelty + "A little novelty" / − "Something easy and familiar" · pace − "Nothing too packed" / + "A night that moves" · setting + "Some time outdoors" / − "Somewhere cosy" · occasion + "Something a bit special" / − "Nothing too fussy" · company − "Something intimate" / + "A bit of buzz".
- **Difference:** only on an allowed dimension, where the signs are opposite and |a − b| ≥ 0.8. Take the single largest. Copy (both sides phrased as wants):
  - energy: "One of you is up for a little more energy. The other would rather keep things easy."
  - novelty: "One of you wants to try something new. The other's happy with an old favourite."
  - pace: "One of you likes a night that moves around. The other would rather settle in somewhere."
  - setting: "One of you wants to be outside for a bit. The other's leaning cosy and indoors."
- **Bridge sentence:** `[shared₁], [shared₂], [resolution clause].` with the first letter capitalised. The bridge uses short forms rather than the row phrases: company − "something intimate" / + "somewhere with a bit of buzz" · novelty + "a little different" / − "somewhere easy" · energy − "calm" / + "with some energy" · occasion + "a bit special" / − "nothing fussy" · pace − "unhurried" / + "a night that moves" · setting + "partly outdoors" / − "somewhere cosy". Resolution clauses: energy → "without making the night hectic" · novelty → "with something new that still feels easy" · pace → "with a little movement but no rushing" · setting → "with a bit of fresh air and somewhere warm after". If there's no difference, use "and nothing too complicated".
- **Fallbacks:** if fewer than 2 dimensions are shared, add rows from the overlap in S1 intents.
- **Low-overlap state:** if there are still fewer than 2 shared rows, show whatever 0–1 rows exist. If there are none, show the single row "Time together, nothing too complicated." The bridge sentence becomes **"You're after different nights tonight, so each of these meets you halfway."** At most one difference is still shown, under the usual rules. S6 then picks the three nights with the greatest spread (01 = best fit, 02 and 03 = the two remaining nights farthest from 01 and from each other).

### A.6 Night pool (6) and selection

| Night | S7 reason line (fixed) | S6 fit template | S6 lean line (03 only, when it resolves a difference) | Skip this one if… | Beats | Profile (e, n, p, s, o, c) |
|---|---|---|---|---|---|---|
| The Middle Ground | Quiet enough for a long conversation. Interesting enough to feel like a night out. | {Short}, with room for a long conversation. | — | you'd rather settle in one place all night. | Dinner → Walk → Dessert | −0.3, +0.4, +0.3, +0.3, 0, −0.7 |
| The Little Adventure | Something neither of you usually does. | {Short}: make something together, then linger over dinner. | Something new to do first, then somewhere easy. | you're tired and just want to be looked after. | Creative activity → Dinner → Dessert | 0, +1, +0.6, −0.5, 0, −0.4 |
| The Lively One | A little more energy, without becoming a party night. | {Short}, with a bit more spark. | A little more energy, without it becoming a party night. | you want a quiet night and an early finish. | Rooftop → Sharing plates → Live music | +0.8, +0.2, +0.4, +0.3, +0.5, +0.5 |
| The Slow One | One beautiful table and all the time in the world. | {Short}, at one beautiful table. | Settle in somewhere and stay. | three hours in one seat sounds like a lot. | Long dinner → Nightcap | −0.8, 0, −1, 0, +0.7, −0.8 |
| The Golden Hour | Catch the light, then find somewhere warm. | {Short}, starting with the light. | Some fresh air first, then somewhere warm. | it's cold, or you'd rather not be outside. | Sunset spot → Street food → Somewhere cosy | −0.2, +0.2, +0.7, +1, −0.5, −0.3 |
| The Dressed-Up One | The kind of evening you'll talk about later. | {Short}, and worth dressing up for. | — | tonight's a jeans-and-trainers kind of night. | Dinner somewhere special → Cocktail bar | +0.2, 0, −0.4, −0.6, +1, 0 |

- Combined vector = the mean of A and B. "Fit" = the smallest Euclidean distance to the combined vector.
- **01** = the best fit.
- **02** = the best remaining fit with novelty ≥ +0.5, or failing that the best remaining fit.
- **03** = if there's a difference, the remaining night with the **strongest value on the difference dimension, on the side opposite to 01's lean**. (01 leans calm, so 03 = the most lively remaining night.) Otherwise, the remaining night farthest from 01.
- **S6 fit line:** fill `{Short}` with the bridge short form (A.5) of the shared dimension that best matches the night: the largest (night profile value × combined leaning) among the shared dimensions, or the first shared one if none is positive. Capitalise the first letter. Exception: when night 03 was chosen to resolve a difference and has a lean line, use the lean line instead. That makes the resolution visible.
- **S7:** show the fixed reason line, the "why it works" sentence (the shared phrases plus the resolution clause) and the skip line.

### A.7 Edge cases that must read well
- **All "Not tonight":** S3 shows a single observation, "Nothing quite landed. That's useful too. We'll keep tonight simple." Seeds still drive S5.
- **All "Into it":** S3 shows "You're up for most things tonight." plus the strongest seed-based observation.
- **All "Maybe":** S3 shows "You're open, nothing's pulling you strongly yet." plus the seed-based observations.
- **Partners identical:** no difference block.
- **Partners opposite on everything:** the low-overlap state (A.5), plus the one allowed difference with the largest gap. S6 spans all three shapes.

### A.8 Golden path (for demos and the acceptance test)
- **Aarav:** intents Intimate, Something new, Low-key. Deck order: tiny bar · long walk · *rooftop (stretch)* · board games · neighbourhood · *live music (stretch)* · sunset · creative activity.
  - Into it: tiny bar, long walk, neighbourhood, sunset. Maybe: board games, creative activity. Not tonight: rooftop, live music.
  - Expected S3: "You like smaller places with a bit of character." · "You seem drawn to quieter evenings." · "You like a little novelty." (Occasion, at −0.68, is the 4th strongest and is not shown.)
- **Sneha:** intents Intimate, A little fun, Special. Deck order: live music · courtyard dinner · *street food (stretch)* · dressed-up · creative activity · *board games (stretch)* · rooftop · sunset.
  - Into it: live music, courtyard dinner, creative activity, rooftop. Maybe: board games. Not tonight: street food, dressed-up, sunset.
- **Expected together output:** S5 shared rows "Something intimate" and "A little novelty". The energy difference (Aarav ≈ −0.8, Sneha ≈ +0.35). The bridge "Something intimate, a little different, without making the night hectic." S6 shows **The Middle Ground** ("Something intimate, with room for a long conversation."), **The Little Adventure** ("A little different: make something together, then linger over dinner.") and **The Lively One** ("A little more energy, without it becoming a party night."), in that order, with default thumbnails.
- **Async sequence:** Aarav finishes and sends the invite. Sneha accepts, finishes, and sees S5 straight away. Sneha suggests The Middle Ground. Aarav gets "Sneha's done…", sees S5 and S6 with "SNEHA'S PICK" on The Middle Ground, opens it, and taps "This is our night". Both sessions then show "Tonight's sorted."
- These expected values were hand-checked against the weights above. If the implementation doesn't reproduce them, fix the implementation before touching the weights. The copy is fixed.
