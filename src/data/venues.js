// ==========================================================
// MILO V2 — CURATED BANGALORE VENUES
// Real venues with specific attributes for hard constraint
// filtering and intelligent recommendation generation.
// ==========================================================

export const BANGALORE_VENUES = [
  {
    id: 'clayful-studio',
    name: 'Clayful Studio',
    category: 'activity',
    area: 'Indiranagar',
    address: '12th Main, Indiranagar, Bangalore',
    tags: ['fun', 'culture', 'low-key', 'romantic'],
    pricePerPerson: 750,
    hasAlcohol: false,
    isLoud: false,
    isOutdoor: false,
    rating: 4.8,
    reviewsCount: 142,
    travelMinutes: {
      'HSR Layout': 22,
      'Indiranagar': 5,
      'Koramangala': 16
    }
  },
  {
    id: 'drift-dessert',
    name: 'Drift Artisanal Dessert',
    category: 'food',
    area: 'Indiranagar',
    address: '100 Feet Road, Indiranagar, Bangalore',
    tags: ['food', 'low-key', 'romantic'],
    pricePerPerson: 400,
    hasAlcohol: false,
    isLoud: false,
    isOutdoor: false,
    rating: 4.7,
    reviewsCount: 98,
    travelMinutes: {
      'HSR Layout': 24,
      'Indiranagar': 6,
      'Koramangala': 18
    }
  },
  {
    id: 'araku-coffee',
    name: 'Araku Coffee & Roastery',
    category: 'food',
    area: 'Indiranagar',
    address: '12th Main Rd, HAL 2nd Stage, Indiranagar',
    tags: ['food', 'low-key', 'romantic', 'culture'],
    pricePerPerson: 450,
    hasAlcohol: false,
    isLoud: false,
    isOutdoor: false,
    rating: 4.6,
    reviewsCount: 310,
    travelMinutes: {
      'HSR Layout': 20,
      'Indiranagar': 4,
      'Koramangala': 15
    }
  },
  {
    id: 'record-room',
    name: 'Record Room — Vinyl Bar',
    category: 'drinks',
    area: 'Koramangala',
    address: '80 Feet Road, 4th Block, Koramangala',
    tags: ['drinks', 'food', 'culture', 'romantic', 'make-a-night'],
    pricePerPerson: 900,
    hasAlcohol: true,
    isLoud: false,
    isOutdoor: false,
    rating: 4.6,
    reviewsCount: 220,
    travelMinutes: {
      'HSR Layout': 14,
      'Indiranagar': 20,
      'Koramangala': 5
    }
  },
  {
    id: 'underground-comedy',
    name: 'The Underground Comedy Club',
    category: 'activity',
    area: 'Church Street',
    address: 'Church Street, Bangalore',
    tags: ['fun', 'culture', 'make-a-night'],
    pricePerPerson: 600,
    hasAlcohol: false,
    isLoud: true,
    isOutdoor: false,
    rating: 4.5,
    reviewsCount: 180,
    travelMinutes: {
      'HSR Layout': 27,
      'Indiranagar': 18,
      'Koramangala': 22
    }
  },
  {
    id: 'church-street-social',
    name: 'Church Street Social',
    category: 'food-drinks',
    area: 'Church Street',
    address: 'Cobalt Building, Church St, Bangalore',
    tags: ['food', 'drinks', 'fun', 'make-a-night'],
    pricePerPerson: 850,
    hasAlcohol: true,
    isLoud: true,
    isOutdoor: false,
    rating: 4.4,
    reviewsCount: 420,
    travelMinutes: {
      'HSR Layout': 28,
      'Indiranagar': 20,
      'Koramangala': 23
    }
  },
  {
    id: 'sankey-botanical-walk',
    name: 'Sankey Garden & Twilight Walk',
    category: 'outdoors',
    area: 'Sadashivnagar',
    address: 'Sankey Tank, Sadashivnagar, Bangalore',
    tags: ['outdoors', 'romantic', 'low-key'],
    pricePerPerson: 100,
    hasAlcohol: false,
    isLoud: false,
    isOutdoor: true,
    rating: 4.6,
    reviewsCount: 260,
    travelMinutes: {
      'HSR Layout': 38,
      'Indiranagar': 28,
      'Koramangala': 32
    }
  }
];
