"""Before/after calibration check on simulated couples (v3 vs v3.1 candidates)."""
import random, sys, importlib
sys.argv = ['x']
import model, simulate as S
from codebook import *

KEY = ['energy', 'social_exposure', 'novelty']

def run(n=3000, seed=11, label=''):
    importlib.reload(S)  # picks up current model module state
    rng = random.Random(seed)
    stats = dict(pinned=0, dims=0, veto=0, false_veto=0, true_veto_opp=0, true_veto=0,
                 flag=0, true_gap=0, tp=0)
    bucket = {m: 0 for m in KEY}; opp = {m: 0 for m in KEY}; people = 0
    top_wanted = 0; top_unjust = 0
    for _ in range(n):
        t1, t2 = S.make_person(rng), S.make_person(rng)
        p1, p2 = S.take_quiz(t1, rng), S.take_quiz(t2, rng)
        for t, p in ((t1, p1), (t2, p2)):
            people += 1
            top_wanted += t[p.top(DRIVERS, 1)[0]] >= 0.5
            for m in KEY:
                stats['dims'] += 1; stats['pinned'] += p.v[m] in (0.0, 1.0)
                bucket[m] += S.bucket(p.v[m]) == S.bucket(t[m]); opp[m] += abs(S.bucket(p.v[m]) - S.bucket(t[m])) == 2
        shared, conflicts = model.merge([p1, p2])
        for t, other in ((t1, t2), (t2, t1)):
            top = max(DRIVERS, key=lambda d: t[d])
            top_unjust += model.is_vetoed([p1, p2], top) and other[top] >= 0.2
        vetoed = model.vetoed if hasattr(model, 'vetoed') else None
        for d in DRIVERS:
            v = model.is_vetoed([p1, p2], d)
            both_want = t1[d] >= 0.5 and t2[d] >= 0.5
            someone_dislikes = min(t1[d], t2[d]) < 0.2
            stats['veto'] += v
            stats['false_veto'] += v and both_want
            stats['true_veto_opp'] += someone_dislikes
            stats['true_veto'] += v and someone_dislikes
        flagged = {c['dimension'] for c in conflicts if c['dimension'] in KEY}
        for m in KEY:
            gap = abs(t1[m] - t2[m]) > 0.4
            stats['true_gap'] += gap; stats['flag'] += m in flagged; stats['tp'] += gap and m in flagged
    out = {
        'Top mood is one they want': top_wanted / people,
        **{f'{m}: right bucket': bucket[m] / people for m in KEY},
        **{f'{m}: opposite bucket': opp[m] / people for m in KEY},
        'Values stuck at exactly 0 or 1': stats['pinned'] / stats['dims'],
        'Own top mood vetoed w/o real dislike': top_unjust / people,
        'Moods vetoed per couple (of 8)': stats['veto'] / n,
        'Vetoes hitting a mood BOTH want': stats['false_veto'] / max(1, stats['veto']),
        'Real dislikes caught by a veto': stats['true_veto'] / max(1, stats['true_veto_opp']),
        'Couples flagged per dimension': stats['flag'] / (n * 3),
        'Flag precision (real gap > 0.4)': stats['tp'] / max(1, stats['flag']),
        'Flag recall (real gaps caught)': stats['tp'] / max(1, stats['true_gap']),
    }
    return out

VARIANTS = [('v3', dict(headroom=False, veto='v3', conflict='v3'), 0.2),
            ('v3.1', dict(headroom=True, veto='v31', conflict='v31'), 0.23)]
if __name__ == '__main__':
    results = []
    for name, cfg, misery in VARIANTS:
        model.CFG.update(cfg); model.MISERY = misery; results.append((name, run()))
    keys = list(results[0][1])
    print('| Measure | ' + ' | '.join(n for n, _ in results) + ' |'); print('|---|' + '---|' * len(results))
    for k in keys:
        fmt = (lambda v: f'{v:.2f}') if 'per couple' in k else (lambda v: f'{v:.0%}')
        print(f'| {k} | ' + ' | '.join(fmt(r[k]) for _, r in results) + ' |')
