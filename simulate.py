"""Simulated accuracy test for the Milo intent model v3.

Creates people with KNOWN preferences, lets them answer the quiz with noise,
and measures how well the model recovers them. Four scenarios:

A  Behave as the model assumes
B  Behave differently: weigh energy/setting more, read each card a bit
   differently (1 in 10 read a card's energy/setting the opposite way)
C  Careless answers
D  Mixed moods: three moderate moods instead of one or two strong ones

This checks whether the quiz carries enough information. It does not replace
testing with real people (see evaluate_real.py).

Run:  python3 simulate.py            (10,000 people per scenario)
      python3 simulate.py 2000       (faster)
"""
import random, math, statistics as st, sys
from model import *

CTX = frozenset({"evening", "drinks", "budget_hi"})
sig = lambda x: 1 / (1 + math.exp(-x))
bucket = lambda x: 0 if x < 1/3 else (1 if x < 2/3 else 2)
INV_MOOD = {v: k for k, v in MOOD_TILES.items()}
INV_MODE = {v: k for k, v in MODE_TILES.items()}

def make_person(rng, mixed=False):
    t = {}
    main_d = rng.sample(DRIVERS, rng.choice([1, 2]))
    for d in DRIVERS:
        t[d] = rng.uniform(0.7, 0.95) if d in main_d else rng.uniform(0.05, 0.45)
    if mixed:
        for d in DRIVERS:
            t[d] = rng.uniform(0.05, 0.45)
        for d in rng.sample(DRIVERS, 3):
            t[d] = rng.uniform(0.55, 0.75)
    main_m = rng.sample(MODES, rng.choice([1, 2, 3]))
    for m in MODES:
        t[m] = rng.uniform(0.65, 0.95) if m in main_m else rng.uniform(0.05, 0.45)
    for m in MODS:
        t[m] = rng.uniform(0, 1)
    return t

def answer_mood(t, rng, noise):
    s = sorted(DRIVERS, key=lambda d: -(t[d] + rng.gauss(0, noise)))
    return [INV_MOOD[d] for d in ([d for d in s[:3] if t[d] > 0.5] or s[:1])]

def answer_mode(t, rng, noise):
    s = sorted(MODES, key=lambda m: -(t[m] + rng.gauss(0, noise)))
    return [INV_MODE[m] for m in ([m for m in s[:2] if t[m] > 0.5] or s[:1])]

def answer_card(t, cid, rng, noise, behaviour):
    c = CARDS[cid]
    m = st.mean(t[x] for x in c["modes"]); d = st.mean(t[x] for x in c["drivers"])
    if behaviour == "base":
        fit = sum(n * (t[k] - 0.5) * 2 for k, n in c["nudges"].items())
        z = (0.45 * m + 0.45 * d + fit - 0.38) * 7 + rng.gauss(0, noise * 4)
    else:
        fit = 0
        for k, n in c["nudges"].items():
            seen = n * (1 + rng.gauss(0, 0.5)) * (-1 if rng.random() < 0.10 else 1)
            fit += seen * (t[k] - 0.5) * 2
        z = (0.3 * m + 0.3 * d + 1.6 * fit - 0.25) * 6 + rng.gauss(0, noise * 4)
    return "into" if z > 0.8 else ("maybe" if z > -0.5 else "not")

def answer_pair(t, pid, rng, noise):
    x = t[PAIR_TARGET[pid]] - 0.5 + rng.gauss(0, noise * 0.6)
    return "def_left" if x < -0.22 else "lean_left" if x < 0 else "lean_right" if x < 0.22 else "def_right"

def take_quiz(t, rng, noise=0.15, behaviour="base"):
    p = Profile("night_out")
    p.mood(answer_mood(t, rng, noise))
    p.mode_pick(answer_mode(t, rng, noise))
    for c in pick_cards(p, CTX):
        p.swipe(c, answer_card(t, c, rng, noise, behaviour))
    for pid in pick_pairs(p):
        p.pair(pid, answer_pair(t, pid, rng, noise))
    return p

def evaluate(n, noise, behaviour, mixed, seed):
    rng = random.Random(seed)
    k = dict(wanted=0, top1=0, mode=0)
    bk = {d: 0 for d in MODS}; opp = {d: 0 for d in MODS}
    for _ in range(n):
        t = make_person(rng, mixed)
        p = take_quiz(t, rng, noise, behaviour)
        est = p.top(DRIVERS, 1)[0]
        k["wanted"] += t[est] >= 0.5
        k["top1"] += est == max(DRIVERS, key=lambda d: t[d])
        k["mode"] += p.top(MODES, 1)[0] in sorted(MODES, key=lambda m: -t[m])[:2]
        for d in MODS:
            bk[d] += bucket(p.v[d]) == bucket(t[d])
            opp[d] += abs(bucket(p.v[d]) - bucket(t[d])) == 2
    r = {x: v / n for x, v in k.items()}
    r.update({f"{d}_bucket": bk[d] / n for d in MODS}); r.update({f"{d}_opp": opp[d] / n for d in MODS})
    return r

SCENARIOS = [("A: behave as model assumes", 0.15, "base", False),
             ("B: behave differently", 0.15, "diff", False),
             ("C: careless answers", 0.35, "base", False),
             ("D: mixed moods", 0.15, "base", True)]

ROWS = [("Top mood is one they genuinely want", "wanted"), ("Top mood exactly right", "top1"),
        ("Main activity in true top 2", "mode"),
        ("Energy: right bucket", "energy_bucket"), ("Social setting: right bucket", "social_exposure_bucket"),
        ("Novelty: right bucket", "novelty_bucket"),
        ("Energy: opposite bucket", "energy_opp"), ("Social setting: opposite bucket", "social_exposure_opp"),
        ("Novelty: opposite bucket", "novelty_opp"),
        ("Structure: right bucket (default only)", "structure_bucket"),
        ("Pace: right bucket (default only)", "pace_bucket"),
        ("Immersion: right bucket (default only)", "immersion_bucket")]

if __name__ == "__main__":
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    res = {s[0]: evaluate(N, s[1], s[2], s[3], seed=100 + i) for i, s in enumerate(SCENARIOS)}
    print(f"{N:,} simulated people per scenario.\n")
    print("| Measure | " + " | ".join(s[0] for s in SCENARIOS) + " |")
    print("|---|" + "---|" * len(SCENARIOS))
    for label, key in ROWS:
        print(f"| {label} | " + " | ".join(f"{res[s[0]][key]:.0%}" for s in SCENARIOS) + " |")
    print("\nGuessing 'medium' for everyone gets the right bucket ~33% of the time.")
