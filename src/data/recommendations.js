// ==========================================================
// MILO V2 — RECOMMENDATION ENGINE (REVISED COPY)
// Milo voice: warm, conversational, observant dating partner.
// ==========================================================

export const BASE_RECOMMENDATIONS = [
  {
    id: 'pottery-dessert',
    badge: '1',
    title: 'Pottery + Dessert',
    subtitle: 'Make something slightly wonky together, then reward yourselves with dessert.',
    tag: 'Playful',
    tagClass: 'milo-tag-blue',
    area: 'Indiranagar',
    venues: [
      {
        name: 'Clayful Studio',
        activity: 'Pottery',
        time: '7:30 PM',
        address: '12th Main, Indiranagar',
        latLong: '12.9716,77.6412'
      },
      {
        name: 'Drift',
        activity: 'Dessert',
        time: '8:45 PM',
        address: '100 Feet Road, Indiranagar',
        latLong: '12.9698,77.6399'
      }
    ],
    timing: 'Fri · 7:30 PM',
    duration: '~2 hours',
    costSummary: '~₹1,800 for two',
    confirmedTotal: '₹2,300 for two',
    confirmedPerPerson: '₹1,150 each',
    rating: 4.6,
    reviewsCount: 120,
    hasAlcohol: false,
    isOutdoor: false,
    isLoud: false,
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    whyReason: 'You both wanted something fun and hands-on, and Indiranagar works for you. It\'s easygoing enough to talk, but gives you something to do when the conversation needs a little help.'
  },
  {
    id: 'coffee-quiet-bar',
    badge: '2',
    title: 'Coffee + A Quiet Drink',
    subtitle: 'Start slow. Find a good corner. See where the evening goes.',
    tag: 'Cosy',
    tagClass: 'milo-tag-green',
    area: 'Koramangala',
    venues: [
      {
        name: 'Araku Roastery',
        activity: 'Coffee tasting',
        time: '7:30 PM',
        address: '12th Main, Indiranagar'
      },
      {
        name: 'Record Room',
        activity: 'Vinyl lounge',
        time: '8:30 PM',
        address: '80 Feet Road, Koramangala'
      }
    ],
    timing: 'Fri · 7:30 PM',
    duration: '~90 mins',
    costSummary: '~₹1,500 for two',
    confirmedTotal: '₹1,900 for two',
    confirmedPerPerson: '₹950 each',
    rating: 4.7,
    reviewsCount: 210,
    hasAlcohol: true,
    isOutdoor: false,
    isLoud: false,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    whyReason: 'You both leaned towards something intimate and low-key. This gives you plenty of time to talk without making the whole evening feel like an interview.'
  },
  {
    id: 'comedy-late-bite',
    badge: '3',
    title: 'Comedy + Late Bite',
    subtitle: 'Laugh at someone else\'s jokes. Then argue about whose were better.',
    tag: 'Upbeat',
    tagClass: 'milo-tag-amber',
    area: 'Church Street',
    venues: [
      {
        name: 'Underground Comedy Club',
        activity: 'Live Stand-up',
        time: '7:30 PM',
        address: 'Church Street'
      },
      {
        name: 'Church Street Social',
        activity: 'Late dinner',
        time: '9:00 PM',
        address: 'Church Street'
      }
    ],
    timing: 'Fri · 7:30 PM',
    duration: '~2.5 hours',
    costSummary: '~₹2,100 for two',
    confirmedTotal: '₹2,600 for two',
    confirmedPerPerson: '₹1,300 each',
    rating: 4.5,
    reviewsCount: 165,
    hasAlcohol: true,
    isOutdoor: false,
    isLoud: true,
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80',
    whyReason: 'You both wanted something lively, and Church Street gives you plenty to do afterwards. A little more energy, without turning the night into a full-blown plan.'
  }
];

export function getFilteredRecommendations(plannerConstraints = {}, inviteeConstraints = {}) {
  const combinedHardNos = new Set([
    ...(plannerConstraints.hardNos || []),
    ...(inviteeConstraints.hardNos || [])
  ]);

  return BASE_RECOMMENDATIONS.filter(rec => {
    if (combinedHardNos.has('no-alcohol') && rec.hasAlcohol) return false;
    if (combinedHardNos.has('no-outdoor') && rec.isOutdoor) return false;
    if (combinedHardNos.has('no-loud-places') && rec.isLoud) return false;
    return true;
  });
}
