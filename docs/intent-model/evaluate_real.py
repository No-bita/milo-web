"""Accuracy test with REAL people.

How to collect the data (15-30 people is enough for a first read):
 1. Each person takes the quiz (v3 questionnaire) and you record their answers.
 2. Immediately after, BEFORE seeing any result, they answer the
    ground-truth questions directly:
      - Which of the 8 moods did you want MOST tonight? And second?
      - What was tonight mostly about? (one of the 6 activity tiles)
      - Rate 1-5: how lively did you want it? (energy)
                 how buzzing vs private should the place be? (social)
                 how new vs familiar? (novelty)
 3. Then show the match reveal and record Yes / Mostly / Not quite.

Fill responses.csv (see sample_responses.csv for the format) and run:
    python3 evaluate_real.py responses.csv
"""
import csv, sys, statistics as st
from model import *

INV_MODE = {v: k for k, v in MODE_TILES.items()}
bucket = lambda x: 0 if x < 1/3 else (1 if x < 2/3 else 2)
gt_scale = lambda r: (int(r) - 1) / 4            # 1-5 -> 0-1

def run_person(row):
    p = Profile(row.get("occasion") or "night_out")
    p.mood([x for x in row["mood_picks"].split("|") if x])
    if row.get("mode_picks"):
        p.mode_pick([x for x in row["mode_picks"].split("|") if x])
    for item in filter(None, row["swipes"].split(";")):
        cid, resp = item.split(":"); p.swipe(cid.strip(), resp.strip())
    for item in filter(None, row["pairs"].split(";")):
        pid, ans = item.split(":"); p.pair(pid.strip(), ans.strip())
    return p

def main(path):
    rows = list(csv.DictReader(open(path)))
    n = len(rows)
    top1 = top2 = mode_hit = 0
    dims = {"energy": "gt_energy", "social_exposure": "gt_social", "novelty": "gt_novelty"}
    bucket_hit = {d: 0 for d in dims}; opposite = {d: 0 for d in dims}; err = {d: [] for d in dims}
    recog = {"yes": 0, "mostly": 0, "no": 0}
    misses = []
    for r in rows:
        p = run_person(r)
        est = p.top(DRIVERS, 2)
        gt1, gt2 = MOOD_TILES[r["gt_top_mood"]], MOOD_TILES[r["gt_second_mood"]]
        top1 += est[0] == gt1; top2 += est[0] in (gt1, gt2)
        mode_hit += MODE_TILES[r["gt_top_mode"]] in p.top(MODES, 2)
        for d, col in dims.items():
            g = gt_scale(r[col])
            bucket_hit[d] += bucket(p.v[d]) == bucket(g)
            opposite[d] += abs(bucket(p.v[d]) - bucket(g)) == 2
            err[d].append(abs(p.v[d] - g))
        recog[r.get("recognition", "").strip().lower() or "no"] += 1
        if est[0] not in (gt1, gt2):
            misses.append((r["person_id"], est[0], gt1))
    print(f"People tested: {n}\n")
    print(f"Top mood exactly right:              {top1/n:.0%}   (simulation: ~78%)")
    print(f"Top mood within their top 2:         {top2/n:.0%}   (simulation: ~99%)")
    print(f"Their main activity in model top 2:  {mode_hit/n:.0%}   (simulation: ~82%)")
    print(f"\n{'dimension':16s} {'right bucket':>13s} {'opposite':>9s} {'avg error':>10s}   (simulation)")
    sim = {"energy": "71%", "social_exposure": "70%", "novelty": "75%"}
    for d in dims:
        print(f"{d:16s} {bucket_hit[d]/n:>13.0%} {opposite[d]/n:>9.0%} {st.mean(err[d]):>10.2f}   ({sim[d]})")
    print(f"\nMatch reveal: Yes {recog['yes']/n:.0%} | Mostly {recog['mostly']/n:.0%} | Not quite {recog['no']/n:.0%}   (target: 80%+ Yes)")
    if misses:
        print("\nPeople where the top mood was missed (person, model said, they said):")
        for m in misses: print("  ", m)
    print("\nHow to read this: real results 10-15 points below the simulation are normal.")
    print("A dimension far below simulation, or with many 'opposite' cases, means its")
    print("cards or pair wording are being read differently by real people: rewrite them.")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "sample_responses.csv")
