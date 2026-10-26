// Gifting V1 catalogue. Shared by the app and the server (the server only
// accepts ids listed here). Prices are placeholders until real ones are set:
// every item shows PRICE_LABEL and the concierge confirms the price by hand.
// leadDays: the night must be at least this many days away to offer it.

export const PRICE_LABEL = 'Price on confirmation';

// kind ids are the server contract; labels are app copy.
export const GIFT_KINDS = {
  moment_drop: { physical: true, label: 'Waiting at the table', line: 'It shows up during the night, at a stop you pick.' },
  home_delivery: { physical: true, label: 'Delivered to them', line: 'It reaches them earlier that day, with your note.' },
  sealed_note: { physical: false, label: 'A sealed note', line: 'They can open it once the night starts.' },
  teaser: { physical: false, label: 'A teaser', line: 'They see it the day before. Just enough to wonder.' }
};

export const DELIVERY_WINDOWS = {
  morning: 'Morning (9 AM - 12 PM)',
  afternoon: 'Afternoon (12 - 4 PM)',
  evening: 'Early evening (4 - 7 PM)'
};

export const GIFT_ITEMS = [
  { id: 'bouquet', name: 'Hand-tied bouquet', desc: 'Seasonal flowers, wrapped simply.', kinds: ['moment_drop', 'home_delivery'], leadDays: 0 },
  { id: 'single-stem', name: 'A single long-stem rose', desc: 'Small, classic, hard to get wrong.', kinds: ['moment_drop'], leadDays: 0 },
  { id: 'dessert-to-table', name: 'Dessert sent to the table', desc: 'Arrives with the last course.', kinds: ['moment_drop'], leadDays: 0 },
  { id: 'mini-cake', name: 'Small celebration cake', desc: 'Serves two. A short message on top if you like.', kinds: ['moment_drop', 'home_delivery'], leadDays: 1 },
  { id: 'chocolates', name: 'Box of handmade chocolates', desc: 'From a small local chocolatier.', kinds: ['moment_drop', 'home_delivery'], leadDays: 1 },
  { id: 'candle', name: 'Scented candle', desc: 'Something for after tonight.', kinds: ['home_delivery'], leadDays: 1 },
  { id: 'name-keepsake', name: 'A keepsake with their name stitched in', desc: 'Handmade, so it needs time.', kinds: ['home_delivery'], leadDays: 5 }
];

export const itemsFor = kind => GIFT_ITEMS.filter(item => item.kinds.includes(kind));
export const giftItem = id => GIFT_ITEMS.find(item => item.id === id) || null;

// Per-giver limits (per plan). Memory lines: one each.
export const GIFT_LIMITS = { physical: 3, sealed_note: 1, teaser: 1, memory: 1 };

export const GIFT_STATUSES = ['requested', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
