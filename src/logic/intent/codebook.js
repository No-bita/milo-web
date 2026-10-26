// Milo intent model v3.1 - codebook (JS port of docs/intent-model/codebook.py).
// Generated from the Python reference; keep the two in sync. The parity test
// (src/logic/intent-model.test.mjs) fails if this drifts from golden.json.
// show_when tags on cards: evening, late, not_after_9, not_first_date, budget_hi,
// drinks, before_sunset, day_or_early, not_reconnecting.

export const MODES = ["talk", "consume", "create_do", "watch", "move", "rest"];
export const DRIVERS = [
  "romance",
  "connection",
  "comfort",
  "fun",
  "discovery",
  "feel_special",
  "social",
  "meaning"
];
export const MODS = ["energy", "social_exposure", "structure", "novelty", "pace", "immersion"];
export const MOOD_TILES = {
  "Romantic": "romance",
  "Cozy and calm": "comfort",
  "Deep conversation": "connection",
  "Fun and playful": "fun",
  "Something new": "discovery",
  "Dressed up and special": "feel_special",
  "Lively and social": "social",
  "Peaceful and meaningful": "meaning"
};
export const MOOD_WEIGHTS = [0.6, 0.4, 0.3];
export const MODE_TILES = {
  "Talking": "talk",
  "Eating and drinking": "consume",
  "Doing something together": "create_do",
  "Watching a show or music": "watch",
  "Wandering around": "move",
  "Unwinding": "rest"
};
export const MODE_WEIGHTS = [0.45, 0.3];
export const CARDS = {
  "T1": {"text": "Coffee and a conversation that runs two hours", "modes": ["talk"], "drivers": ["connection"], "nudges": {"energy": -0.2, "social_exposure": -0.1, "novelty": -0.1}, "show": []},
  "T2": {"text": "A rooftop drink as the city lights come on", "modes": ["talk", "consume"], "drivers": ["romance"], "nudges": {"social_exposure": 0.1, "novelty": 0.1}, "show": ["evening"]},
  "T3": {"text": "A quiet bar with a corner table just for two", "modes": ["talk"], "drivers": ["romance", "connection"], "nudges": {"energy": -0.15, "social_exposure": -0.2}, "show": ["drinks"]},
  "C1": {"text": "A slow dinner in a hidden courtyard", "modes": ["consume", "talk"], "drivers": ["romance"], "nudges": {"energy": -0.2, "social_exposure": -0.15, "novelty": 0.1}, "show": []},
  "C2": {"text": "A tasting menu, one surprise course at a time", "modes": ["consume"], "drivers": ["discovery", "feel_special"], "nudges": {"novelty": 0.25, "immersion": 0.1}, "show": ["budget_hi"]},
  "C3": {"text": "Midnight dosa and filter coffee at an old favourite", "modes": ["consume"], "drivers": ["comfort"], "nudges": {"novelty": -0.2, "energy": -0.1}, "show": ["late"]},
  "C4": {"text": "A dessert crawl: three stops, no regrets", "modes": ["consume", "move"], "drivers": ["fun"], "nudges": {"energy": 0.15, "pace": 0.2, "novelty": 0.1}, "show": []},
  "C5": {"text": "Street food hopping through an old market", "modes": ["consume", "move"], "drivers": ["discovery"], "nudges": {"energy": 0.2, "social_exposure": 0.2, "novelty": 0.2}, "show": []},
  "D1": {"text": "Hands in clay at a pottery wheel", "modes": ["create_do"], "drivers": ["discovery", "connection"], "nudges": {"immersion": 0.25, "novelty": 0.2}, "show": ["not_after_9"]},
  "D2": {"text": "Cooking a meal together in a chef-led class", "modes": ["create_do"], "drivers": ["connection"], "nudges": {"immersion": 0.25, "novelty": 0.15}, "show": ["not_first_date"]},
  "D3": {"text": "Board games, and the loser buys dessert", "modes": ["create_do"], "drivers": ["fun"], "nudges": {"energy": 0.1, "immersion": 0.15}, "show": []},
  "D4": {"text": "Bowling or the arcade, keeping score", "modes": ["create_do"], "drivers": ["fun"], "nudges": {"energy": 0.25, "social_exposure": 0.15}, "show": []},
  "D5": {"text": "A paint-and-sip evening, no talent required", "modes": ["create_do"], "drivers": ["discovery", "fun"], "nudges": {"immersion": 0.2, "novelty": 0.15}, "show": ["evening"]},
  "W1": {"text": "Live acoustic music over dinner", "modes": ["watch", "consume"], "drivers": ["romance"], "nudges": {"social_exposure": 0.1}, "show": ["evening"]},
  "W2": {"text": "A stand-up comedy night", "modes": ["watch"], "drivers": ["fun"], "nudges": {"energy": 0.15, "social_exposure": 0.2}, "show": ["evening"]},
  "W3": {"text": "An open-air movie under fairy lights", "modes": ["watch", "rest"], "drivers": ["romance", "comfort"], "nudges": {"energy": -0.15}, "show": ["evening"]},
  "W4": {"text": "A gallery or a play, then coffee to talk about it", "modes": ["watch", "talk"], "drivers": ["discovery"], "nudges": {"novelty": 0.15, "energy": -0.1}, "show": ["day_or_early"]},
  "M1": {"text": "A long walk through quiet, leafy streets", "modes": ["move", "talk"], "drivers": ["connection"], "nudges": {"energy": -0.1, "social_exposure": -0.15}, "show": []},
  "M2": {"text": "A sunset drive just out of the city", "modes": ["move"], "drivers": ["romance", "meaning"], "nudges": {"novelty": 0.15, "pace": -0.1}, "show": ["before_sunset"]},
  "M3": {"text": "Wandering a neighbourhood you've never explored", "modes": ["move"], "drivers": ["discovery"], "nudges": {"novelty": 0.25, "energy": 0.1}, "show": []},
  "R1": {"text": "A couples spa evening, phones off", "modes": ["rest"], "drivers": ["comfort", "romance"], "nudges": {"energy": -0.3, "social_exposure": -0.3}, "show": ["not_first_date", "budget_hi"]},
  "R2": {"text": "Stargazing with a blanket and hot chocolate", "modes": ["rest"], "drivers": ["meaning", "romance"], "nudges": {"energy": -0.25, "social_exposure": -0.25, "novelty": 0.1}, "show": ["evening"]},
  "S1": {"text": "A buzzing place with a great crowd and music", "modes": ["consume", "watch"], "drivers": ["social"], "nudges": {"energy": 0.3, "social_exposure": 0.3}, "show": ["not_reconnecting"]},
  "I1": {"text": "Dressing up for somewhere that feels like an occasion", "modes": ["consume"], "drivers": ["feel_special"], "nudges": {"social_exposure": 0.1, "structure": 0.15}, "show": ["budget_hi"]}
};
export const SWIPE_WEIGHT = {"into": 1.0, "maybe": 0.3, "not": -0.6};
export const CARD_MODE_DELTA = 0.3;
export const CARD_DRIVER_DELTA = 0.2;
export const PAIRS = {
  "P1": {
    "left": "Talk for hours",
    "right": "Do something together",
    "effects": {
      "create_do": 0.2,
      "talk": -0.2
    }
  },
  "P2": {
    "left": "Somewhere we know and love",
    "right": "Somewhere neither of us has been",
    "effects": {
      "novelty": 0.2
    }
  },
  "P3": {
    "left": "A cozy corner",
    "right": "A buzzing room",
    "effects": {
      "social_exposure": 0.2
    }
  },
  "P4": {
    "left": "Go with the flow",
    "right": "A plan we can relax into",
    "effects": {
      "structure": 0.2
    }
  },
  "P5": {
    "left": "One great place all night",
    "right": "A few stops through the night",
    "effects": {
      "pace": 0.2
    }
  },
  "P6": {
    "left": "Slow and easy",
    "right": "Up for anything",
    "effects": {
      "energy": 0.2
    }
  },
  "P7": {
    "left": "Come as you are",
    "right": "Dress up",
    "effects": {
      "feel_special": 0.2,
      "structure": 0.1
    }
  },
  "P8": {
    "left": "Watch something together",
    "right": "Get hands-on",
    "effects": {
      "immersion": 0.2
    }
  }
};
export const PAIR_TARGET = {
  "P1": "create_do",
  "P2": "novelty",
  "P3": "social_exposure",
  "P4": "structure",
  "P5": "pace",
  "P6": "energy",
  "P7": "feel_special",
  "P8": "immersion"
};
export const PRIORS = {
  "night_out": {},
  "first_date": {
    "energy": 0.4,
    "social_exposure": 0.5,
    "novelty": 0.4,
    "connection": 0.2
  },
  "anniversary": {
    "romance": 0.3,
    "feel_special": 0.2,
    "social_exposure": 0.35
  },
  "birthday": {
    "feel_special": 0.3,
    "fun": 0.2
  },
  "reconnecting": {
    "connection": 0.3,
    "comfort": 0.2,
    "energy": 0.3,
    "social_exposure": 0.2
  },
  "proposal": {
    "romance": 0.4,
    "meaning": 0.3
  }
};
export const EDIT_CHIPS = {
  "more_lively": {
    "energy": 0.25,
    "social_exposure": 0.2
  },
  "quieter": {
    "energy": -0.25,
    "social_exposure": -0.2
  },
  "less_adventurous": {
    "novelty": -0.3
  },
  "more_adventurous": {
    "novelty": 0.3
  },
  "more_doing": {
    "create_do": 0.3,
    "talk": -0.2
  },
  "more_romantic": {
    "romance": 0.3
  },
  "more_fun": {
    "fun": 0.3
  }
};
export const ACTIVE_PAIRS = ["P6", "P3", "P2"];
export const PAIR_STRENGTH = {"def_left": -0.35, "lean_left": -0.12, "lean_right": 0.12, "def_right": 0.35};
export const DEFAULT_ONLY = ["structure", "pace", "immersion"];
