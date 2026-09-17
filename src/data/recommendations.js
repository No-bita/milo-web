// ==========================================================
// MILO V2 — RECOMMENDATION ENGINE
// Milo voice: warm, conversational, observant dating partner.
// Consumes planner, invitee, dateContext, and venues.
// ==========================================================

import { getDemoDateInfo } from './demo-date.js';
import { BANGALORE_VENUES } from './venues.js';
import { getAsset } from '../assets/manifest.js';

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
    duration: '~2 hours',
    costSummary: '~₹1,800 for two',
    confirmedTotal: '₹2,300 for two',
    confirmedPerPerson: '₹1,150 each',
    rating: 4.8,
    reviewsCount: 142,
    hasAlcohol: false,
    isOutdoor: false,
    isLoud: false,
    imageKey: 'potteryWorkshop',
    image: getAsset('potteryWorkshop').src,
    whyReason: 'You both wanted something fun and hands-on, and Indiranagar works for both of you. Easygoing enough to talk, but gives your hands something to do when the conversation needs a breath.'
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
    duration: '~90 mins',
    costSummary: '~₹1,500 for two',
    confirmedTotal: '₹1,900 for two',
    confirmedPerPerson: '₹950 each',
    rating: 4.7,
    reviewsCount: 210,
    hasAlcohol: true,
    isOutdoor: false,
    isLoud: false,
    imageKey: 'coffeeAraku',
    image: getAsset('coffeeAraku').src,
    whyReason: 'You both leaned towards something intimate and low-key. Plenty of room to talk without making the whole evening feel like an interview.'
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
    duration: '~2.5 hours',
    costSummary: '~₹2,100 for two',
    confirmedTotal: '₹2,600 for two',
    confirmedPerPerson: '₹1,300 each',
    rating: 4.5,
    reviewsCount: 165,
    hasAlcohol: true,
    isOutdoor: false,
    isLoud: true,
    imageKey: 'comedyClub',
    image: getAsset('comedyClub').src,
    whyReason: 'A livelier energy with Church Street as a backdrop. Fun, high momentum, without turning the night into a massive ordeal.'
  }
];

/**
 * Intelligent recommendation matching.
 * Consumes: planner, invitee, dateContext, venues.
 */
export function getRecommendations({
  planner = {},
  invitee = {},
  dateContext = {},
  venues = BANGALORE_VENUES
} = {}) {
  const plannerLocalities = (planner.localities && planner.localities.length) 
    ? planner.localities 
    : [planner.preferredArea || 'Indiranagar'];

  const inviteeLocalities = (invitee.localities && invitee.localities.length) 
    ? invitee.localities 
    : [invitee.preferredArea || 'Indiranagar'];

  const plannerHard = planner.hardConstraints || planner.hardNo || [];
  const inviteeHard = invitee.hardConstraints || invitee.hardNo || [];
  const combinedHard = new Set([...plannerHard, ...inviteeHard]);

  const plannerSoft = new Set(planner.softPreferences || planner.preferences || []);
  const inviteeSoft = new Set(invitee.softPreferences || invitee.preferences || []);

  // Format date display for timing pill
  const dateInfo = getDemoDateInfo(dateContext.date, dateContext.time);
  const timingStr = `${dateInfo.weekdayShort} · ${dateInfo.formattedTime}`;

  // 1. Filter out violations of hard constraints
  const filtered = BASE_RECOMMENDATIONS.filter(rec => {
    if (combinedHard.has('no-alcohol') && rec.hasAlcohol) return false;
    if (combinedHard.has('no-outdoor') && rec.isOutdoor) return false;
    if (combinedHard.has('no-loud-places') && rec.isLoud) return false;
    return true;
  });

  // 2. Score locality and soft preferences
  const scored = filtered.map(rec => {
    let score = 0;
    const isAnywhereP = plannerLocalities.includes('Anywhere') || plannerLocalities.includes('Anywhere in Bangalore');
    const isAnywhereI = inviteeLocalities.includes('Anywhere') || inviteeLocalities.includes('Anywhere in Bangalore');

    const matchesPlannerLoc = isAnywhereP || plannerLocalities.includes(rec.area);
    const matchesInviteeLoc = isAnywhereI || inviteeLocalities.includes(rec.area);

    if (matchesPlannerLoc && matchesInviteeLoc) {
      score += 25; // Strong mutual locality match
    } else if (matchesPlannerLoc || matchesInviteeLoc) {
      score += 10;
    }

    // Soft preferences score
    if (rec.id === 'pottery-dessert') {
      if (plannerSoft.has('fun') || inviteeSoft.has('fun')) score += 8;
      if (plannerSoft.has('food') || inviteeSoft.has('food')) score += 5;
    } else if (rec.id === 'coffee-quiet-bar') {
      if (plannerSoft.has('low-key') || inviteeSoft.has('low-key')) score += 8;
      if (plannerSoft.has('romantic') || inviteeSoft.has('romantic')) score += 5;
    } else if (rec.id === 'comedy-late-bite') {
      if (plannerSoft.has('stay-out-late') || inviteeSoft.has('stay-out-late')) score += 8;
      if (plannerSoft.has('drinks') || inviteeSoft.has('drinks')) score += 5;
    }

    return {
      ...rec,
      timing: timingStr,
      score
    };
  });

  // Sort descending by match score
  scored.sort((a, b) => b.score - a.score);

  // Re-index badge numbers
  return scored.map((item, idx) => ({
    ...item,
    badge: (idx + 1).toString()
  }));
}

// Backward-compatible export
export function getFilteredRecommendations(plannerConstraints = {}, inviteeConstraints = {}) {
  return getRecommendations({
    planner: { hardConstraints: plannerConstraints.hardNos || [] },
    invitee: { hardConstraints: inviteeConstraints.hardNos || [] }
  });
}
