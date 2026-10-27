// Intent model v3.1 quiz content for the app: the model's own 8 moods and 24
// swipe cards (src/logic/intent/codebook.js), with photos reused from the
// current deck where one fits. Cards with no matching photo show as text cards.
// Moods keep the codebook's ids (drivers) so answers map 1:1 to the model.

const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Order = the codebook's MOOD_TILES order. label = the codebook tile text (the model keys on it).
export const V31_MOODS = [
  { id: 'romance', label: 'Romantic', image: U('1517248135467-4c7edcad34c4', 600), fallback: U('1555396273-367ea4eb4db5', 600), alt: 'Candlelit intimate dinner table' },
  { id: 'comfort', label: 'Cozy and calm', image: U('1554118811-1e0d58224f24', 600), fallback: U('1501339847302-ac426a4a7cbb', 600), alt: 'Quiet cosy corner cafe with books and warm light' },
  { id: 'connection', label: 'Deep conversation', image: U('1501339847302-ac426a4a7cbb', 600), fallback: U('1554118811-1e0d58224f24', 600), alt: 'A quiet cafe table for two' },
  { id: 'fun', label: 'Fun and playful', image: U('1551024709-8f23befc6f87', 600), fallback: U('1514933651103-005eec06c04b', 600), alt: 'Cocktails and warm social laughter' },
  { id: 'discovery', label: 'Something new', image: U('1565193566173-7a0ee3dbe261', 600), fallback: U('1517248135467-4c7edcad34c4', 600), alt: 'Hands shaping pottery in an artisan studio' },
  { id: 'feel_special', label: 'Dressed up and special', image: U('1510812431401-41d2bd2722f3', 600), fallback: U('1470337458703-46ad1756a187', 600), alt: 'Sparkling wine glasses and celebratory ambiance' },
  { id: 'social', label: 'Lively and social', image: U('1543007630-9710e4a00a20', 600), fallback: U('1514933651103-005eec06c04b', 600), alt: 'Lively atmospheric dining room with evening buzz' },
  { id: 'meaning', label: 'Peaceful and meaningful', image: U('1519671482749-fd09be7ccebf', 600), fallback: U('1519331379826-f10be5486c6f', 600), alt: 'A quiet sunset outdoors' }
];

// Codebook card id -> photo from the current deck (same scene). Missing = text card.
export const V31_CARD_PHOTOS = {
  T1: U('1554118811-1e0d58224f24'),   // board-games / cosy cafe
  T2: U('1516589178581-6cd7833ae3b2'), // rooftop-drinks
  T3: U('1551024709-8f23befc6f87'),   // tiny-bar
  C1: U('1517248135467-4c7edcad34c4'), // courtyard-dinner
  C4: U('1551024601-bec78aea704b'),   // dessert-crawl
  C5: U('1504674900247-0877df9cc836'), // street-food-film
  D1: U('1565193566173-7a0ee3dbe261'), // creative-activity (pottery)
  D3: U('1554118811-1e0d58224f24'),   // board-games
  W1: U('1514306191717-452ec28c7814'), // live-music
  M1: U('1448375240586-882707db888b'), // long-walk
  M2: U('1519671482749-fd09be7ccebf'), // sunset-cosy
  M3: U('1519501025264-65ba15a82390'), // neighbourhood-wander
  S1: U('1543007630-9710e4a00a20'),   // buzz
  I1: U('1510812431401-41d2bd2722f3')  // dressed-up
};

// App occasion ids (shared.occasion) -> the model's occasion priors (owner-approved mapping).
export const OCCASION_PRIOR = {
  'date-night': 'night_out',
  'just-because': 'night_out',
  'quality-time': 'reconnecting',
  anniversary: 'anniversary',
  birthday: 'birthday',
  proposal: 'proposal'
};

// Home's occasion tiles, in their on-screen order (milo-plan-card-1 ... -6).
export const OCCASION_IDS = ['date-night', 'anniversary', 'proposal', 'birthday', 'quality-time', 'just-because'];
