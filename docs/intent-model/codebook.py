"""Milo intent model v3 - codebook.

Every screen option and card, with its mapping to the shared dimensions.
Mirrors the questionnaire document (v3)."""

MODES = ["talk", "consume", "create_do", "watch", "move", "rest"]
DRIVERS = ["romance", "connection", "comfort", "fun", "discovery",
           "feel_special", "social", "meaning"]
MODS = ["energy", "social_exposure", "structure", "novelty", "pace", "immersion"]

# Screen 4: mood tiles -> driver
MOOD_TILES = {
    "Romantic": "romance", "Cozy and calm": "comfort",
    "Deep conversation": "connection", "Fun and playful": "fun",
    "Something new": "discovery", "Dressed up and special": "feel_special",
    "Lively and social": "social", "Peaceful and meaningful": "meaning",
}
MOOD_WEIGHTS = [0.6, 0.4, 0.3]          # 1st, 2nd, 3rd pick

# Screen 5: "Tonight is mostly about..." -> mode (pick up to 2)
MODE_TILES = {"Talking": "talk", "Eating and drinking": "consume",
              "Doing something together": "create_do", "Watching a show or music": "watch",
              "Wandering around": "move", "Unwinding": "rest"}
MODE_WEIGHTS = [0.45, 0.3]


# Screen 6: swipe cards
# show_when tags: evening, late, not_after_9, not_first_date, budget_hi,
#                 drinks, before_sunset, day_or_early, not_reconnecting
CARDS = {
 "T1": dict(text="Coffee and a conversation that runs two hours", modes=["talk"], drivers=["connection"], nudges=dict(energy=-0.2, social_exposure=-0.1, novelty=-0.1), show=[]),
 "T2": dict(text="A rooftop drink as the city lights come on", modes=["talk","consume"], drivers=["romance"], nudges=dict(social_exposure=0.1, novelty=0.1), show=["evening"]),
 "T3": dict(text="A quiet bar with a corner table just for two", modes=["talk"], drivers=["romance","connection"], nudges=dict(energy=-0.15, social_exposure=-0.2), show=["drinks"]),
 "C1": dict(text="A slow dinner in a hidden courtyard", modes=["consume","talk"], drivers=["romance"], nudges=dict(energy=-0.2, social_exposure=-0.15, novelty=0.1), show=[]),
 "C2": dict(text="A tasting menu, one surprise course at a time", modes=["consume"], drivers=["discovery","feel_special"], nudges=dict(novelty=0.25, immersion=0.1), show=["budget_hi"]),
 "C3": dict(text="Midnight dosa and filter coffee at an old favourite", modes=["consume"], drivers=["comfort"], nudges=dict(novelty=-0.2, energy=-0.1), show=["late"]),
 "C4": dict(text="A dessert crawl: three stops, no regrets", modes=["consume","move"], drivers=["fun"], nudges=dict(energy=0.15, pace=0.2, novelty=0.1), show=[]),
 "C5": dict(text="Street food hopping through an old market", modes=["consume","move"], drivers=["discovery"], nudges=dict(energy=0.2, social_exposure=0.2, novelty=0.2), show=[]),
 "D1": dict(text="Hands in clay at a pottery wheel", modes=["create_do"], drivers=["discovery","connection"], nudges=dict(immersion=0.25, novelty=0.2), show=["not_after_9"]),
 "D2": dict(text="Cooking a meal together in a chef-led class", modes=["create_do"], drivers=["connection"], nudges=dict(immersion=0.25, novelty=0.15), show=["not_first_date"]),
 "D3": dict(text="Board games, and the loser buys dessert", modes=["create_do"], drivers=["fun"], nudges=dict(energy=0.1, immersion=0.15), show=[]),
 "D4": dict(text="Bowling or the arcade, keeping score", modes=["create_do"], drivers=["fun"], nudges=dict(energy=0.25, social_exposure=0.15), show=[]),
 "D5": dict(text="A paint-and-sip evening, no talent required", modes=["create_do"], drivers=["discovery","fun"], nudges=dict(immersion=0.2, novelty=0.15), show=["evening"]),
 "W1": dict(text="Live acoustic music over dinner", modes=["watch","consume"], drivers=["romance"], nudges=dict(social_exposure=0.1), show=["evening"]),
 "W2": dict(text="A stand-up comedy night", modes=["watch"], drivers=["fun"], nudges=dict(energy=0.15, social_exposure=0.2), show=["evening"]),
 "W3": dict(text="An open-air movie under fairy lights", modes=["watch","rest"], drivers=["romance","comfort"], nudges=dict(energy=-0.15), show=["evening"]),
 "W4": dict(text="A gallery or a play, then coffee to talk about it", modes=["watch","talk"], drivers=["discovery"], nudges=dict(novelty=0.15, energy=-0.1), show=["day_or_early"]),
 "M1": dict(text="A long walk through quiet, leafy streets", modes=["move","talk"], drivers=["connection"], nudges=dict(energy=-0.1, social_exposure=-0.15), show=[]),
 "M2": dict(text="A sunset drive just out of the city", modes=["move"], drivers=["romance","meaning"], nudges=dict(novelty=0.15, pace=-0.1), show=["before_sunset"]),
 "M3": dict(text="Wandering a neighbourhood you've never explored", modes=["move"], drivers=["discovery"], nudges=dict(novelty=0.25, energy=0.1), show=[]),
 "R1": dict(text="A couples spa evening, phones off", modes=["rest"], drivers=["comfort","romance"], nudges=dict(energy=-0.3, social_exposure=-0.3), show=["not_first_date","budget_hi"]),
 "R2": dict(text="Stargazing with a blanket and hot chocolate", modes=["rest"], drivers=["meaning","romance"], nudges=dict(energy=-0.25, social_exposure=-0.25, novelty=0.1), show=["evening"]),
 "S1": dict(text="A buzzing place with a great crowd and music", modes=["consume","watch"], drivers=["social"], nudges=dict(energy=0.3, social_exposure=0.3), show=["not_reconnecting"]),
 "I1": dict(text="Dressing up for somewhere that feels like an occasion", modes=["consume"], drivers=["feel_special"], nudges=dict(social_exposure=0.1, structure=0.15), show=["budget_hi"]),
}
SWIPE_WEIGHT = {"into": 1.0, "maybe": 0.3, "not": -0.6}
CARD_MODE_DELTA, CARD_DRIVER_DELTA = 0.3, 0.2

# Screen 7: this-or-that pairs (right side = positive direction)
# Only P6, P3, P2 are asked in v3; the rest are kept for reference.
PAIRS = {
 "P1": dict(left="Talk for hours", right="Do something together", effects=dict(create_do=0.2, talk=-0.2)),
 "P2": dict(left="Somewhere we know and love", right="Somewhere neither of us has been", effects=dict(novelty=0.2)),
 "P3": dict(left="A cozy corner", right="A buzzing room", effects=dict(social_exposure=0.2)),
 "P4": dict(left="Go with the flow", right="A plan we can relax into", effects=dict(structure=0.2)),
 "P5": dict(left="One great place all night", right="A few stops through the night", effects=dict(pace=0.2)),
 "P6": dict(left="Slow and easy", right="Up for anything", effects=dict(energy=0.2)),
 "P7": dict(left="Come as you are", right="Dress up", effects=dict(feel_special=0.2, structure=0.1)),
 "P8": dict(left="Watch something together", right="Get hands-on", effects=dict(immersion=0.2)),
}
PAIR_TARGET = {"P1": "create_do", "P2": "novelty", "P3": "social_exposure", "P4": "structure",
               "P5": "pace", "P6": "energy", "P7": "feel_special", "P8": "immersion"}

# Context priors (screens 2-3)
PRIORS = {
 "night_out": {},
 "first_date": dict(energy=0.4, social_exposure=0.5, novelty=0.4, connection=0.2),
 "anniversary": dict(romance=0.3, feel_special=0.2, social_exposure=0.35),
 "birthday": dict(feel_special=0.3, fun=0.2),
 "reconnecting": dict(connection=0.3, comfort=0.2, energy=0.3, social_exposure=0.2),
 "proposal": dict(romance=0.4, meaning=0.3),
}

# Match-reveal edit chips
EDIT_CHIPS = {
 "more_lively": dict(energy=0.25, social_exposure=0.2),
 "quieter": dict(energy=-0.25, social_exposure=-0.2),
 "less_adventurous": dict(novelty=-0.3), "more_adventurous": dict(novelty=0.3),
 "more_doing": dict(create_do=0.3, talk=-0.2),
 "more_romantic": dict(romance=0.3), "more_fun": dict(fun=0.3),
}

# v3: the three pairs always asked, on a 4-point scale
ACTIVE_PAIRS = ["P6", "P3", "P2"]          # energy, social exposure, novelty
PAIR_STRENGTH = {"def_left": -0.35, "lean_left": -0.12, "lean_right": 0.12, "def_right": 0.35}

# v3: dimensions the quiz cannot measure reliably -> set from occasion defaults
DEFAULT_ONLY = ["structure", "pace", "immersion"]
