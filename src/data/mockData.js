// ==========================================================
// MILO — CORE DATA REGISTRY & SPEC MODELS
// Source of truth: MILO_PRODUCT_SPEC.md (v1.3 · 2026-10-03)
// ==========================================================

export const INTENTS = [
  {
    id: 'intimate',
    label: 'Intimate',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    alt: 'Candlelit intimate dinner table',
    seeds: { company: -1.0 }
  },
  {
    id: 'fun',
    label: 'A little fun',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    alt: 'Cocktails and warm social laughter',
    seeds: { energy: 1.0 }
  },
  {
    id: 'novelty',
    label: 'Something new',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    alt: 'Hands shaping pottery in an artisan studio',
    seeds: { novelty: 1.0 }
  },
  {
    id: 'low-key',
    label: 'Low-key',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    alt: 'Quiet cosy corner cafe with books and warm light',
    seeds: { energy: -1.0, occasion: -1.0 }
  },
  {
    id: 'special',
    label: 'Special',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    alt: 'Sparkling wine glasses and celebratory ambiance',
    seeds: { occasion: 1.0 }
  },
  {
    id: 'spontaneous',
    label: 'Spontaneous',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
    alt: 'City street at twilight with warm lights',
    seeds: { pace: 1.0, occasion: -1.0 }
  },
  {
    id: 'buzz',
    label: 'A bit of buzz',
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    alt: 'Lively atmospheric dining room with evening buzz',
    seeds: { company: 1.0 }
  },
  {
    id: 'outdoors',
    label: 'Outdoors',
    image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    alt: 'Open air terrace courtyard with greenery and lights',
    seeds: { setting: 1.0 }
  }
];

// Experience concepts pool (12) from Appendix A.2
export const EXPERIENCE_POOL = [
  {
    id: 'courtyard-dinner',
    num: 1,
    title: 'A slow dinner in a hidden courtyard',
    subline: 'Candlelight, no rush, nowhere else to be.',
    shape: 'Dinner → Dessert, same table',
    tags: ['Romantic', 'Intimate', 'Quiet'],
    traits: { energy: -1, novelty: 0, pace: -1, setting: 1, occasion: 1, company: -1 },
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'neighbourhood-wander',
    num: 2,
    title: "Explore a neighbourhood you've never really wandered through",
    subline: 'Follow whatever looks interesting.',
    shape: 'Wander → Snacks → Somewhere to sit',
    tags: ['Spontaneous', 'Discovery', 'Low-key'],
    traits: { energy: 0, novelty: 1, pace: 1, setting: 1, occasion: -1, company: 0 },
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'live-music',
    num: 3,
    title: 'A small live music set and a long dinner',
    subline: 'Close enough to feel it, quiet enough to talk.',
    shape: 'Dinner → Live set',
    tags: ['Atmospheric', 'Live Set', 'Intimate'],
    traits: { energy: 1, novelty: 0, pace: 0, setting: -1, occasion: 1, company: 0 },
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'sunset-cosy',
    num: 4,
    title: 'Sunset outdoors, then somewhere cosy',
    subline: 'Golden hour first, a warm corner after.',
    shape: 'Sunset → Cosy dinner',
    tags: ['Golden Hour', 'Cosy', 'Scenic'],
    traits: { energy: -1, novelty: 0, pace: 1, setting: 1, occasion: 0, company: -1 },
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80',
    fallback: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'dessert-crawl',
    num: 5,
    title: 'A late-night dessert crawl',
    subline: 'Three stops, all of them sweet.',
    shape: 'Dessert → Dessert → Dessert',
    tags: ['Playful', 'Indulgent', 'Late Night'],
    traits: { energy: 1, novelty: 1, pace: 1, setting: 0, occasion: -1, company: 0 },
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'dressed-up',
    num: 6,
    title: 'Get dressed up and make an evening of it',
    subline: 'The kind of night you plan an outfit for.',
    shape: 'Get ready → Dinner → Drinks',
    tags: ['Special', 'Dressed Up', 'Evening'],
    traits: { energy: 0, novelty: 0, pace: -1, setting: -1, occasion: 1, company: 0 },
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'creative-activity',
    num: 7,
    title: 'A creative activity followed by dinner',
    subline: 'Make something together, then eat.',
    shape: 'Workshop → Dinner',
    tags: ['Hands-on', 'Novel', 'Engaging'],
    traits: { energy: 0, novelty: 1, pace: 1, setting: -1, occasion: 0, company: -1 },
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'rooftop-drinks',
    num: 8,
    title: 'Rooftop drinks with a view',
    subline: 'The city lit up below you.',
    shape: 'Drinks → Small plates',
    tags: ['Skyline View', 'Buzz', 'Open Air'],
    traits: { energy: 1, novelty: 0, pace: 0, setting: 1, occasion: 1, company: 1 },
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'tiny-bar',
    num: 9,
    title: 'A tiny bar where nobody knows you',
    subline: 'Eight seats, good music, one long conversation.',
    shape: 'One bar, all night',
    tags: ['Hidden Gem', 'Intimate', 'Conversational'],
    traits: { energy: -1, novelty: 1, pace: -1, setting: -1, occasion: 0, company: -1 },
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'street-food-film',
    num: 10,
    title: 'Street food and a late film',
    subline: 'Easy, a little messy, very good.',
    shape: 'Street food → Late film',
    tags: ['Casual', 'Late Night', 'Cinematic'],
    traits: { energy: 0, novelty: 0, pace: 1, setting: 0, occasion: -1, company: 1 },
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'long-walk',
    num: 11,
    title: 'A long walk that ends somewhere warm',
    subline: 'Talk the whole way there.',
    shape: 'Walk → Somewhere warm',
    tags: ['Stroll', 'Unrushed', 'Warm'],
    traits: { energy: -1, novelty: 0, pace: 1, setting: 1, occasion: -1, company: -1 },
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'board-games',
    num: 12,
    title: 'Board games and good wine somewhere cosy',
    subline: 'A little competitive, very relaxed.',
    shape: 'Games → Wine → Snacks',
    tags: ['Cosy', 'Playful', 'Relaxed'],
    traits: { energy: -1, novelty: 1, pace: -1, setting: -1, occasion: -1, company: 0 },
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80'
  }
];

// Curated 6 Nights Pool (Appendix A.6)
export const NIGHTS_POOL = [
  {
    id: 'middle-ground',
    name: 'The Middle Ground',
    reasonLine: 'Quiet enough for a long conversation. Interesting enough to feel like a night out.',
    fitTemplate: '{Short}, with room for a long conversation.',
    leanLine: null,
    skipIf: "you'd rather settle in one place all night.",
    beats: [
      { name: 'Dinner', desc: 'somewhere small and candlelit, no rush.' },
      { name: 'Walk', desc: 'quiet streets, nowhere we need to be.' },
      { name: 'Dessert', desc: 'a table outside if it is warm.' }
    ],
    profile: { energy: -0.3, novelty: 0.4, pace: 0.3, setting: 0.3, occasion: 0, company: -0.7 },
    defaultImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'little-adventure',
    name: 'The Little Adventure',
    reasonLine: 'Something neither of you usually does.',
    fitTemplate: '{Short}: make something together, then linger over dinner.',
    leanLine: 'Something new to do first, then somewhere easy.',
    skipIf: "you're tired and just want to be looked after.",
    beats: [
      { name: 'Creative activity', desc: 'hands-on, fun, no pressure.' },
      { name: 'Dinner', desc: 'relax and talk about what you made.' },
      { name: 'Dessert', desc: 'a sweet finish to the night.' }
    ],
    profile: { energy: 0, novelty: 1, pace: 0.6, setting: -0.5, occasion: 0, company: -0.4 },
    defaultImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'lively-one',
    name: 'The Lively One',
    reasonLine: 'A little more energy, without becoming a party night.',
    fitTemplate: '{Short}, with a bit more spark.',
    leanLine: 'A little more energy, without it becoming a party night.',
    skipIf: 'you want a quiet night and an early finish.',
    beats: [
      { name: 'Rooftop', desc: 'drinks above the city lights.' },
      { name: 'Sharing plates', desc: 'lively room, vibrant dishes.' },
      { name: 'Live music', desc: 'small set, close enough to feel it.' }
    ],
    profile: { energy: 0.8, novelty: 0.2, pace: 0.4, setting: 0.3, occasion: 0.5, company: 0.5 },
    defaultImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'slow-one',
    name: 'The Slow One',
    reasonLine: 'One beautiful table and all the time in the world.',
    fitTemplate: '{Short}, at one beautiful table.',
    leanLine: 'Settle in somewhere and stay.',
    skipIf: 'three hours in one seat sounds like a lot.',
    beats: [
      { name: 'Long dinner', desc: 'multiple courses, no rush.' },
      { name: 'Nightcap', desc: 'same table, one last drink.' }
    ],
    profile: { energy: -0.8, novelty: 0, pace: -1, setting: 0, occasion: 0.7, company: -0.8 },
    defaultImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'golden-hour',
    name: 'The Golden Hour',
    reasonLine: 'Catch the light, then find somewhere warm.',
    fitTemplate: '{Short}, starting with the light.',
    leanLine: 'Some fresh air first, then somewhere warm.',
    skipIf: "it's cold, or you'd rather not be outside.",
    beats: [
      { name: 'Sunset spot', desc: 'golden hour views together.' },
      { name: 'Street food', desc: 'warm bites on the move.' },
      { name: 'Somewhere cosy', desc: 'settle in from the chill.' }
    ],
    profile: { energy: -0.2, novelty: 0.2, pace: 0.7, setting: 1, occasion: -0.5, company: -0.3 },
    defaultImage: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'dressed-up-one',
    name: 'The Dressed-Up One',
    reasonLine: "The kind of evening you'll talk about later.",
    fitTemplate: '{Short}, and worth dressing up for.',
    leanLine: null,
    skipIf: "tonight's a jeans-and-trainers kind of night.",
    beats: [
      { name: 'Special dinner', desc: 'the outfit was worth it.' },
      { name: 'Cocktail bar', desc: 'intimate corner for a late drink.' }
    ],
    profile: { energy: 0.2, novelty: 0, pace: -0.4, setting: -0.6, occasion: 1, company: 0 },
    defaultImage: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80'
  }
];
