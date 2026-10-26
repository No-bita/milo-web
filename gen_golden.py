"""Generate src/logic/intent/golden.json: fixed random quiz runs with the
Python reference's outputs, so the JS port can be checked against it.

Run from this folder:  python3 gen_golden.py [runs]
Deterministic: same seed -> same file.
"""
import json, os, random, sys
sys.argv = sys.argv[:1] + sys.argv[1:]
import codebook as C
import model as M
import nights as N
import simulate as S

TAGS = ["evening", "late", "after_9", "first_date", "budget_hi", "drinks", "before_sunset", "day_or_early", "reconnecting"]
OCCASIONS = list(C.PRIORS)
CHIP_KEYS = list(C.EDIT_CHIPS)
R = lambda x: round(x, 6)

def person_run(rng, ctx):
    t = S.make_person(rng, mixed=rng.random() < 0.25)
    occasion = rng.choice(OCCASIONS)
    p = M.Profile(occasion)
    moods = S.answer_mood(t, rng, 0.15)
    modes = S.answer_mode(t, rng, 0.15)
    p.mood(moods); p.mode_pick(modes)
    cards = M.pick_cards(p, ctx)
    swipes = []
    for c in cards:
        r = S.answer_card(t, c, rng, 0.15, rng.choice(["base", "diff"]))
        p.swipe(c, r); swipes.append([c, r])
    pairs = []
    for pid in M.pick_pairs(p):
        a = S.answer_pair(t, pid, rng, 0.15); p.pair(pid, a); pairs.append([pid, a])
    edits = rng.sample(CHIP_KEYS, rng.choice([0, 0, 1]))
    for chip in edits:
        p.edit(chip)
    return p, dict(occasion=occasion, moods=moods, modes=modes, cards=cards, swipes=swipes, pairs=pairs, edits=edits)

def profile_out(p):
    return dict(v={k: R(x) for k, x in p.v.items()}, conf={k: R(x) for k, x in p.conf.items()},
                top_drivers=p.top(C.DRIVERS, 2), top_modes=p.top(C.MODES, 2))

def constraints(rng):
    c = {}
    if rng.random() < 0.4: c["diet"] = rng.sample(["veg", "vegan", "jain", "no_pork", "no_beef"], rng.choice([1, 2]))
    if rng.random() < 0.3: c["alcohol"] = rng.random() < 0.5
    if rng.random() < 0.6: c["budget_for_two"] = rng.choice([1500, 2500, 4000, 6000])
    if rng.random() < 0.5: c["home_by"] = rng.choice(["21:30", "22:00", "23:00", "23:30", "00:30", "01:00"])
    if rng.random() < 0.4: c["max_travel_min"] = rng.choice([15, 30, 45])
    return c

def main(n=200, seed=2026):
    rng = random.Random(seed)
    runs = []
    for _ in range(n):
        ctx = sorted(t for t in TAGS if rng.random() < 0.35)
        size = rng.choice([2, 2, 2, 3])
        people, answers = zip(*[person_run(rng, set(ctx)) for _ in range(size)])
        shared, conflicts = M.merge(list(people))
        cons = [constraints(rng) for _ in people]
        merged_cons = M.merge_constraints(cons)
        swipe_dicts = [dict(a["swipes"]) for a in answers]
        top, ranked = N.pick_nights(list(people), merged_cons)
        runs.append(dict(
            context=ctx, answers=list(answers), constraints=cons,
            eligible=M.eligible_cards(set(ctx)),
            profiles=[profile_out(p) for p in people],
            shared={k: R(x) for k, x in shared.items()}, conflicts=conflicts,
            vetoed=[d for d in C.DRIVERS + C.MODES if M.is_vetoed(list(people), d)],
            merged_constraints=merged_cons, merged_swipes=M.merge_swipes(swipe_dicts),
            reveal=M.reveal_text(shared), nights=[[k, s] for k, s in ranked],
        ))
    codebook = dict(MODES=C.MODES, DRIVERS=C.DRIVERS, MODS=C.MODS, MOOD_TILES=C.MOOD_TILES, MOOD_WEIGHTS=C.MOOD_WEIGHTS,
                    MODE_TILES=C.MODE_TILES, MODE_WEIGHTS=C.MODE_WEIGHTS, CARDS=C.CARDS, SWIPE_WEIGHT=C.SWIPE_WEIGHT,
                    CARD_MODE_DELTA=C.CARD_MODE_DELTA, CARD_DRIVER_DELTA=C.CARD_DRIVER_DELTA, PAIRS=C.PAIRS,
                    PAIR_TARGET=C.PAIR_TARGET, PRIORS=C.PRIORS, EDIT_CHIPS=C.EDIT_CHIPS, ACTIVE_PAIRS=C.ACTIVE_PAIRS,
                    PAIR_STRENGTH=C.PAIR_STRENGTH, DEFAULT_ONLY=C.DEFAULT_ONLY)
    params = dict(CONF_START=M.CONF_START, CONF_UP=M.CONF_UP, CONF_DOWN=M.CONF_DOWN, CONF_MAX=M.CONF_MAX,
                  SURPRISE_SCALE=M.SURPRISE_SCALE, MISERY=M.MISERY, CONFLICT_GAP=M.CONFLICT_GAP, CFG=M.CFG, LABEL=M.LABEL)
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "logic", "intent", "golden.json")
    with open(out, "w") as f:
        json.dump(dict(version="3.1", seed=seed, codebook=codebook, params=params, nights=N.NIGHTS, runs=runs), f, sort_keys=True, separators=(",", ":"))
    print(f"wrote {n} runs to {os.path.normpath(out)}")

if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 200)
