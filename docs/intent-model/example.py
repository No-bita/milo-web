"""Worked example: two partners take the quiz, profiles are merged."""
from model import *

ctx = {"evening", "drinks"}

sneha = Profile("anniversary")
sneha.mood(["Romantic", "Cozy and calm"])
sneha.mode_pick(["Talking", "Eating and drinking"])
for c in pick_cards(sneha, ctx):
    sneha.swipe(c, "into" if c in ("C1", "T3", "W3", "M1") else "not")
sneha.pair("P6", "def_left"); sneha.pair("P3", "def_left"); sneha.pair("P2", "lean_right")

aarav = Profile("anniversary")
aarav.mood(["Romantic", "Something new"])
aarav.mode_pick(["Eating and drinking", "Doing something together"])
for c in pick_cards(aarav, ctx):
    aarav.swipe(c, "into" if c in ("C1", "D1", "C5", "T2") else "maybe")
aarav.pair("P6", "lean_right"); aarav.pair("P3", "lean_left"); aarav.pair("P2", "def_right")

shared, conflicts = merge([sneha, aarav])
print("Sneha top moods:", sneha.top(DRIVERS), "| Aarav top moods:", aarav.top(DRIVERS))
print("Shared modulators:", {m: round(shared[m], 2) for m in ["energy", "social_exposure", "novelty"]})
print("Conflicts:", conflicts or "none")
print("Reveal:", reveal_text(shared))
print("Constraints:", merge_constraints([
    {"diet": ["veg"], "budget_for_two": 4000, "home_by": "23:00"},
    {"alcohol": True, "budget_for_two": 5000, "home_by": "23:30", "max_travel_min": 30}]))
