"""v3.1 night scoring PROPOSAL: rank the app's 6 existing nights against a merged profile."""
from codebook import DRIVERS, MODES
import model

# Scores are reasoned starting values for review, not measured.
NIGHTS = {
 "middle-ground":   dict(drivers=dict(connection=.8, romance=.6, discovery=.3), modes=dict(talk=.8, consume=.6, move=.5),
                         mods=dict(energy=.35, social_exposure=.3, novelty=.5), stops=3, drinks=False),
 "little-adventure":dict(drivers=dict(discovery=.9, fun=.7, connection=.4), modes=dict(create_do=.9, consume=.5, talk=.3),
                         mods=dict(energy=.55, social_exposure=.4, novelty=.85), stops=3, drinks=False),
 "lively-one":      dict(drivers=dict(social=.9, fun=.7, feel_special=.4), modes=dict(watch=.7, consume=.6, talk=.3),
                         mods=dict(energy=.8, social_exposure=.85, novelty=.45), stops=3, drinks=True),
 "slow-one":        dict(drivers=dict(romance=.8, comfort=.7, connection=.6, feel_special=.4), modes=dict(consume=.9, talk=.7),
                         mods=dict(energy=.15, social_exposure=.2, novelty=.2), stops=2, drinks=True),
 "golden-hour":     dict(drivers=dict(meaning=.7, romance=.6, discovery=.5, comfort=.4), modes=dict(move=.7, consume=.5, rest=.3),
                         mods=dict(energy=.4, social_exposure=.35, novelty=.55), stops=3, drinks=False),
 "dressed-up-one":  dict(drivers=dict(feel_special=.9, romance=.7), modes=dict(consume=.8, talk=.5),
                         mods=dict(energy=.45, social_exposure=.55, novelty=.35), stops=2, drinks=True),
}

def weighted(shared, weights):
    return sum(shared[d] * w for d, w in weights.items()) / sum(weights.values())

def score(night, shared, vetoed, conflicts, constraints):
    n = NIGHTS[night]
    if constraints and constraints.get("alcohol") is False and n["drinks"]:
        return None                                   # hard constraint: out
    s = 0.45 * weighted(shared, n["drivers"]) + 0.30 * weighted(shared, n["modes"])
    s += 0.25 * (1 - sum(abs(shared[m] - v) for m, v in n["mods"].items()) / len(n["mods"]))
    s -= 0.25 * sum(w for d, w in {**n["drivers"], **n["modes"]}.items() if d in vetoed and w >= .6)  # relies on a veto
    if conflicts and n["stops"] >= 3:
        s += 0.03                                     # more stops = room to take turns
    return round(s, 3)

def pick_nights(profiles, constraints=None, k=3):
    shared, conflicts = model.merge(profiles)
    vetoed = {d for d in DRIVERS + MODES if model.is_vetoed(profiles, d)}
    ranked = [(n, score(n, shared, vetoed, conflicts, constraints)) for n in NIGHTS]
    ranked = sorted([r for r in ranked if r[1] is not None], key=lambda r: -r[1])
    return ranked[:k], ranked
