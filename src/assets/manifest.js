// ==========================================================
// MILO V2 — CURATED ASSET MANIFEST
// Centralized image registry with aesthetic consistency,
// reliable URLs, fallback handling, and alt text.
// Every asset MUST have a fallback and alt text.
// ==========================================================

export const DEFAULT_FALLBACK_URL = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';

export const ASSET_MANIFEST = {
  // Screen 1: Rooftop couple overlooking evening city
  heroWelcome: {
    src: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    fallback: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    alt: 'Couple sitting on a rooftop bench overlooking city night lights with candles'
  },

  // Screen 2: Vibe Photography
  vibeJustADate: {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    alt: 'Warm candlelit dinner table with dishes'
  },
  vibeFirstDate: {
    src: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    alt: 'Cocktails and wine glasses in intimate lounge'
  },
  vibeSpecialOccasion: {
    src: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    alt: 'Sparkling champagne flutes with celebratory evening ambiance'
  },

  // Screen 3 & 6: Bangalore Localities
  localityIndiranagar: {
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    alt: 'Indiranagar vibrant street cafes and dining'
  },
  localityKoramangala: {
    src: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    alt: 'Koramangala evening lights and lively venues'
  },
  localityHSR: {
    src: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    alt: 'HSR Layout chill neighbourhood cafes and greenery'
  },
  localityChurchStreet: {
    src: 'https://images.unsplash.com/photo-1507842229452-7d0865bc044a?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=600&q=80',
    alt: 'Church Street bookstores, art, and city buzz'
  },
  localityJPNagar: {
    src: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    alt: 'JP Nagar green parks and quiet dining'
  },
  localityWhitefield: {
    src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    alt: 'Whitefield open-air courtyards and upscale lounges'
  },
  localityAnywhere: {
    src: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80',
    fallback: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1000&q=80',
    alt: 'Bangalore cityscape skyline at dusk'
  },

  // Screen 4: Postcard Envelope
  invitePostcard: {
    src: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&w=800&q=80',
    alt: 'Warm handwritten postcard with message'
  },

  // Screen 5: Invitee Welcome Portrait
  priyaPortrait: {
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    alt: 'Priya smiling warm portrait'
  },
  rohanAvatar: {
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    fallback: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    alt: 'Rohan profile photo'
  },

  // Screen 6: Preferences Photography (2-column photo cards)
  prefFood: {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    alt: 'Delicious artisanal cuisine'
  },
  prefDrinks: {
    src: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    alt: 'Artisan cocktails and wine'
  },
  prefFun: {
    src: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    alt: 'Fun hands-on pottery activity'
  },
  prefOutdoors: {
    src: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    alt: 'Lush greenery and outdoor courtyard'
  },
  prefCulture: {
    src: 'https://images.unsplash.com/photo-1507842229452-7d0865bc044a?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=600&q=80',
    alt: 'Art exhibition, museum and culture'
  },
  prefRomantic: {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    alt: 'Romantic candlelit ambiance'
  },
  prefLowKey: {
    src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    alt: 'Cozy, quiet corner coffee and vinyl'
  },
  prefStayOutLate: {
    src: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80',
    alt: 'Late night moody bar and music'
  },
  prefSurpriseMe: {
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
    alt: 'Surprise sparklers and vibrant night'
  },

  // Screen 8, 9, 11, 12, 16: Venues & Date Activities
  potteryWorkshop: {
    src: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    alt: 'Hands shaping pottery clay at Clayful Studio'
  },
  dessertDrift: {
    src: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    alt: 'Gourmet dessert platter at Drift'
  },
  coffeeAraku: {
    src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    alt: 'Specialty coffee tasting at Araku'
  },
  comedyClub: {
    src: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80',
    fallback: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
    alt: 'Live standup comedy show'
  },

  // Screen 13: Day of Date Night Atmosphere
  dayOfDateNight: {
    src: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80',
    fallback: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1000&q=80',
    alt: 'Atmospheric night city lights and warm fairy lights'
  },

  // Screen 16: Polaroids
  polaroid1: {
    src: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=500&q=80',
    fallback: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=500&q=80',
    alt: 'Rooftop night memory'
  },
  polaroid2: {
    src: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=500&q=80',
    fallback: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
    alt: 'Pottery session memory'
  },
  polaroid3: {
    src: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=500&q=80',
    fallback: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80',
    alt: 'Drift dessert memory'
  }
};

export function getAsset(key, fallbackSrc = DEFAULT_FALLBACK_URL) {
  const asset = ASSET_MANIFEST[key];
  if (!asset) {
    return {
      src: fallbackSrc,
      fallback: DEFAULT_FALLBACK_URL,
      alt: 'Milo date visual'
    };
  }
  return {
    src: asset.src,
    fallback: asset.fallback || fallbackSrc,
    alt: asset.alt || 'Milo date visual'
  };
}

/**
 * Generates an img tag with automatic fallback on error.
 * Guaranteed never to break card layout or show a broken image box.
 */
export function renderImageHtml(key, { className = '', style = '', loading = 'lazy' } = {}) {
  const asset = getAsset(key);
  const safeFallback = asset.fallback || DEFAULT_FALLBACK_URL;
  return `<img 
    src="${asset.src}" 
    alt="${asset.alt}" 
    class="${className}" 
    style="${style}" 
    loading="${loading}" 
    onerror="if (this.src !== '${safeFallback}') { this.src = '${safeFallback}'; } else { this.style.display='none'; }"`
  + ` />`;
}
