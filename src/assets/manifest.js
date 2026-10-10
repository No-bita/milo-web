// ==========================================================
// MILO V2 — CURATED ASSET MANIFEST
// Centralized image registry with aesthetic consistency,
// reliable URLs, fallback handling, and alt text.
// Every asset MUST have a fallback and alt text.
// ==========================================================

export const DEFAULT_FALLBACK_URL = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';

export const ASSET_MANIFEST = {
  // Screen 3: Preferences / Reflection Photography
  prefFood: {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    alt: 'Delicious artisanal cuisine'
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
