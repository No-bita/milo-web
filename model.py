"""Milo intent model v3 (final).

Flow: priors -> mood tiles -> 'mostly about' tap -> 8 swipe cards ->
3 four-point pairs -> profile per person -> merge for 2+ people -> reveal.
"""
import statistics as st
from codebook import *

ALL_DIMS = MODES + DRIVERS + MODS
START = {**{d: 0.3 for d in MODES + DRIVERS}, **{m: 0.5 for m in MODS}}
CONF_START, CONF_UP, CONF_DOWN, CONF_MAX = 0.2, 0.15, 0.2, 0.9
SURPRISE_SCALE = 0.8          # modulators learn only from unexpected reactions
CFG = dict(headroom=True, veto='v31', conflict='v31')  # v3.1 defaults; calib_eval flips them to compare with v3
clip = lambda x: max(0.0, min(1.0, x))


class Profile:
    def __init__(self, occasion="night_out"):
        self.occasion = occasion
        self.v = dict(START)
        self.conf = {d: CONF_START for d in ALL_DIMS}
        self.last_dir = {d: 0 for d in ALL_DIMS}
        self.log = []
        for d, val in PRIORS.get(occasion, {}).items():
            self.v[d] = val if d in MODS else clip(self.v[d] + val)

    def nudge(self, dim, delta, source):
        if not delta:
            return
        if CFG['headroom']:
            # v3.1: moves shrink near the ends, so values approach but never sit at 0 or 1.
            room = (1 - self.v[dim]) if delta > 0 else self.v[dim]
            delta = delta * min(1.0, room / 0.5)
        self.v[dim] = clip(self.v[dim] + delta)
        direction = 1 if delta > 0 else -1
        if self.last_dir[dim] in (0, direction):
            self.conf[dim] = min(CONF_MAX, self.conf[dim] + CONF_UP)
        else:
            self.conf[dim] = max(0.05, self.conf[dim] - CONF_DOWN)
        self.last_dir[dim] = direction
        self.log.append((source, dim, round(delta, 3)))

    # ---- screens ----------------------------------------------------------
    def mood(self, tiles):                      # screen 4
        for w, tile in zip(MOOD_WEIGHTS, tiles[:3]):
            self.nudge(MOOD_TILES[tile], w, f"mood:{tile}")

    def mode_pick(self, tiles):                 # screen 5
        for w, tile in zip(MODE_WEIGHTS, tiles[:2]):
            self.nudge(MODE_TILES[tile], w, f"mode:{tile}")

    def expected(self, cid):
        """Reaction the model expects from mood + activity alone."""
        c = CARDS[cid]
        m = st.mean(self.v[x] for x in c["modes"])
        d = st.mean(self.v[x] for x in c["drivers"])
        z = (0.45 * m + 0.45 * d - 0.38) * 7
        return 1.0 if z > 0.8 else (0.3 if z > -0.5 else -0.6)

    def swipe(self, card_id, response):         # screen 6
        c, w = CARDS[card_id], SWIPE_WEIGHT[response]
        surprise = w - self.expected(card_id)
        for m in c["modes"]:
            self.nudge(m, CARD_MODE_DELTA * w, card_id)
        for d in c["drivers"]:
            self.nudge(d, CARD_DRIVER_DELTA * w, card_id)
        for k, n in c["nudges"].items():
            self.nudge(k, n * surprise * SURPRISE_SCALE, card_id)

    def pair(self, pair_id, answer):            # screen 7, 4-point
        s = PAIR_STRENGTH[answer]
        for k, n in PAIRS[pair_id]["effects"].items():
            self.nudge(k, s * (n / 0.2), pair_id)
            self.conf[k] = max(self.conf[k], 0.6 if answer.startswith("def") else 0.45)

    def edit(self, chip):                       # match-reveal correction
        for k, n in EDIT_CHIPS[chip].items():
            self.nudge(k, n, f"edit:{chip}")
            self.conf[k] = max(self.conf[k], 0.8)

    # ---- outputs ------------------------------------------------------------
    def top(self, group, n=2):
        return sorted(group, key=lambda d: -self.v[d])[:n]

    def as_dict(self):
        r = lambda g: {d: {"v": round(self.v[d], 2), "conf": round(self.conf[d], 2)} for d in g}
        return {"occasion": self.occasion, "drivers": r(DRIVERS), "modes": r(MODES),
                "modulators": r(MODS), "default_only": DEFAULT_ONLY}


# ---- card selection (screen 6) -----------------------------------------------
def eligible_cards(context):
    """context = set of true tags, e.g. {'evening','drinks','budget_hi','first_date'}."""
    out = []
    for cid, c in CARDS.items():
        # v3.1 fix: "not_first_date" means hide when "first_date" is in the context.
        # (v3 checked for the literal "not_first_date" tag, so not_ rules never applied.)
        ok = all((t[4:] not in context) if t.startswith("not_") else (t in context) for t in c["show"])
        if ok:
            out.append(cid)
    return out


def pick_cards(profile, context, n=8):
    """Energy-contrast pairs for the top two moods, then fill unseen activity types."""
    pool = eligible_cards(context)
    chosen = []
    energy = lambda c: CARDS[c]["nudges"].get("energy", 0)
    for d in profile.top(DRIVERS, 2):
        cands = sorted([c for c in pool if d in CARDS[c]["drivers"] and c not in chosen], key=energy)
        if len(cands) >= 2:
            chosen += [cands[0], cands[-1]]
        elif cands:
            chosen.append(cands[0])
    shown = {m for c in chosen for m in CARDS[c]["modes"]}
    # v3.1: round the key so float summation order cannot reorder exact ties
    # (Python 3.12+ sum() is compensated; JS is not).
    rest = sorted([c for c in pool if c not in chosen],
                  key=lambda c: -round(len(set(CARDS[c]["modes"]) - shown) * 0.5
                                       + sum(abs(v) for v in CARDS[c]["nudges"].values()), 9))
    for c in rest:
        if len(chosen) >= n:
            break
        chosen.append(c); shown |= set(CARDS[c]["modes"])
    return chosen[:n]


def pick_pairs(profile=None):
    return list(ACTIVE_PAIRS)


# ---- merging 2 or more people -------------------------------------------------
MISERY = 0.23         # v3.1 (was 0.2): with headroom, one clear 'not' lands just under this
CONFLICT_GAP = 0.4    # modulator gap that triggers turn-taking across stops

def is_vetoed(profiles, d):
    vals = [p.v[d] for p in profiles]
    if CFG['veto'] == 'v3':
        return min(vals) < MISERY
    # v3.1: a strong no only vetoes if nobody else holds this as a top-2 want.
    if min(vals) >= MISERY:
        return False
    group = DRIVERS if d in DRIVERS else MODES
    return not any(d in p.top(group, 2) and p.v[d] >= 0.5 for p in profiles)

def real_gap(vals):
    if CFG['conflict'] == 'v3':
        return max(vals) - min(vals) > CONFLICT_GAP
    # v3.1: also require the two ends to sit on opposite sides of the middle.
    return max(vals) - min(vals) > CONFLICT_GAP and min(vals) < 0.45 and max(vals) > 0.55

def merge(profiles):
    """Merge any number of profiles into one shared profile."""
    shared, conflicts = {}, []
    for d in DRIVERS + MODES:
        vals = [p.v[d] for p in profiles]
        shared[d] = min(vals) if is_vetoed(profiles, d) else sum(vals) / len(vals)
    for m in MODS:
        vals = [p.v[m] for p in profiles]
        shared[m] = sum(vals) / len(vals)
        if real_gap(vals):
            conflicts.append({"dimension": m, "low": round(min(vals), 2), "high": round(max(vals), 2),
                              "resolve": "take turns across stops"})
    return shared, conflicts


def merge_constraints(constraint_list):
    """Hard constraints: strictest wins."""
    out = {"diet": set(), "alcohol": True, "budget_for_two": None, "home_by": None, "max_travel_min": None}
    for c in constraint_list:
        out["diet"] |= set(c.get("diet", []))
        out["alcohol"] = out["alcohol"] and c.get("alcohol", True)
        for key in ("budget_for_two", "max_travel_min"):
            if c.get(key) is not None:
                out[key] = c[key] if out[key] is None else min(out[key], c[key])
        if c.get("home_by"):
            # v3.1: compare as minutes after noon, so 00:30 counts as later than 23:30.
            late = lambda t: (int(t[:2]) * 60 + int(t[3:5]) - 720) % 1440
            out["home_by"] = c["home_by"] if out["home_by"] is None else min(out["home_by"], c["home_by"], key=late)
    out["diet"] = sorted(out["diet"])
    return out


def merge_swipes(swipe_dicts):
    """{card: response} per person -> ranked shared candidates; any 'not' = out."""
    rank = {"into": 2, "maybe": 1}
    cards = set().union(*[s.keys() for s in swipe_dicts])
    out = {}
    for c in cards:
        rs = [s.get(c) for s in swipe_dicts]
        if "not" in rs:
            continue
        out[c] = sum(rank.get(r, 0) for r in rs)
    # v3.1: ties keep codebook order (Python set order is not stable across runs).
    order = list(CARDS)
    return sorted(out, key=lambda c: (-out[c], order.index(c)))


# v3.1: single-idea labels so two of them join cleanly with one "and".
LABEL = {"romance": "romantic", "connection": "full of conversation", "comfort": "cozy",
         "fun": "playful", "discovery": "a little new", "feel_special": "special",
         "social": "lively", "meaning": "meaningful"}

def reveal_text(shared):
    tops = sorted(DRIVERS, key=lambda d: -shared[d])[:2]
    e = shared["energy"]
    feel = "unhurried" if e < 0.4 else ("easy-going" if e < 0.6 else "high energy")
    return f"Something {LABEL[tops[0]]} and {LABEL[tops[1]]}, {feel}."
