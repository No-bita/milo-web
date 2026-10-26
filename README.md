# Milo intent model v3.1 (reference)

This folder is the Python reference for the app's JS port in src/logic/intent/.
The JS must match it: run `python3 gen_golden.py` here to regenerate
src/logic/intent/golden.json, then `npm test` checks the port.

---

# Milo intent model v3 (final)

Turns a couple's quiz answers into one profile per person, merges them,
and produces the match reveal. Plain Python 3, no installs needed.

## Files

| File | What it is |
|---|---|
| codebook.py | Every mood tile, activity tile, swipe card, pair, prior and edit chip, with its mapping to the shared dimensions |
| model.py | The model: scoring, card selection, pair selection, merging 2+ people, merging hard constraints and swipes, reveal text |
| example.py | Worked example: two partners take the quiz and are merged |
| simulate.py | Accuracy test on simulated people (10,000 per scenario, four scenarios) |
| evaluate_real.py | Accuracy test on real people's answers |
| sample_responses.csv | Format example for real data (rows are synthetic) |

## Run

    python3 example.py                         # see a couple's merged profile
    python3 simulate.py                        # 10,000-person simulated accuracy
    python3 simulate.py 2000                   # quicker run
    python3 evaluate_real.py responses.csv     # real-people accuracy

## Quiz flow (v3)

1. How are we planning this? (together / surprise)
2. Occasion
3. Relationship stage
4. Mood tiles: pick up to 3            -> moods (drivers)
5. "Tonight is mostly about...": up to 2 -> activity type (modes)
6. 8 swipe cards, chosen adaptively    -> activity type + texture (modulators)
7. 3 four-point pairs: energy, social setting, novelty
8. Food and drinks chips               -> preferences + hard constraints
9. Practical details                   -> hard constraints
10. Optional: places you love, an evening you loved

Structure, pace and immersion come from occasion defaults, not the quiz.

## Simulated accuracy (10,000 people per scenario)

| Measure | A: as assumed | B: behave differently | C: careless | D: mixed moods |
|---|---|---|---|---|
| Top mood is one they genuinely want | 99% | 97% | 91% | 99% |
| Main activity in true top 2 | 81% | 74% | 73% | 81% |
| Energy: right bucket | 70% | 68% | 64% | 69% |
| Social setting: right bucket | 69% | 68% | 65% | 69% |
| Novelty: right bucket | 75% | 72% | 66% | 74% |
| Opposite bucket (worst error) | 0-1% | 0-1% | 2% | 0-1% |

Guessing "medium" gets the right bucket ~33% of the time.

## Merging rules (2 or more people)

- Hard constraints: strictest wins (any diet, lowest budget, earliest home time)
- Moods and activities: anyone below 0.2 = veto; otherwise average
- Energy / setting / novelty: average; a gap above 0.4 is flagged -> take turns across stops
- Swiped cards: anyone said "Not tonight" = out; otherwise ranked by combined enthusiasm

## Important

Weights are reasoned starting values, not measured. The simulation checks that
the quiz carries enough information; only real people (evaluate_real.py, then
real plans in the pilot) show true accuracy.

## v3.1 changes (proposed, for review)

- Headroom: each nudge shrinks as a value nears 0 or 1, so values no longer pin at the ends (was 37% of energy/setting/novelty values).
- Veto: a strong no (below 0.23) vetoes a mood or activity only if nobody holds it as a top-2 want at 0.5+. Otherwise it is averaged.
- Turn-taking flag: the gap must be over 0.4 AND the two people must sit on opposite sides of the middle.
- Home-by merges across midnight correctly (00:30 is later than 23:30).
- Card eligibility: not_ tags now hide a card when the tag is present (v3 never applied them).
- merge_swipes breaks ties in codebook order, so results are the same on every run.
- Reveal labels are single ideas ("romantic and cozy", not "romantic and calm and cozy").
- New: nights.py scores the app's six nights against the merged profile (scores are reasoned starting values).
- New: calib_eval.py compares v3 and v3.1 on simulated couples: python3 calib_eval.py
- model.CFG holds the switches; set headroom=False, veto='v3', conflict='v3' and MISERY=0.2 to get v3 behaviour back.
