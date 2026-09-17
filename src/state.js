// ==========================================================
// MILO V2 — CENTRAL REACTIVE STATE STORE
// Normalized state schema holding localities, preferences,
// hard constraints, date context, and learned profiles.
// ==========================================================

import { BASE_RECOMMENDATIONS, getRecommendations, getFilteredRecommendations } from './data/recommendations.js';
import { DEMO_DATE_ISO, DEMO_TIME_DEFAULT } from './data/demo-date.js';

const initialState = {
  currentScreenIndex: 1, // 1 to 16
  viewMode: 'mobile',    // 'mobile' | 'grid'
  
  // Date Context: ISO date string + 24h time, derived dynamically
  dateContext: {
    date: DEMO_DATE_ISO, // '2026-10-25'
    time: DEMO_TIME_DEFAULT, // '19:30'
    occasion: 'Just a date',
    flexibleWindow: true
  },

  // Person A: Planner (Rohan)
  planner: {
    name: 'Rohan',
    localities: ['Indiranagar'],
    softPreferences: ['fun', 'food'],
    hardConstraints: ['no-loud-places'],
    // Backward compatibility mirrors:
    preferredArea: 'Indiranagar',
    preferences: ['fun', 'food'],
    hardNo: ['no-loud-places']
  },

  // Person B: Invitee (Priya)
  invitee: {
    name: 'Priya',
    localities: ['Indiranagar'],
    softPreferences: ['fun', 'romantic'],
    hardConstraints: ['no-alcohol', 'no-outdoor'],
    // Backward compatibility mirrors:
    preferredArea: 'Indiranagar',
    preferences: ['fun', 'romantic'],
    hardNo: ['no-alcohol', 'no-outdoor']
  },

  inviteId: 'abc123',
  selectedOptionId: 'pottery-dessert',

  // Mock booking lifecycle: 'idle' | 'checking' | 'holding' | 'confirmed'
  booking: {
    status: 'confirmed',
    totalAmount: '₹2,300',
    perPersonAmount: '₹1,150 each'
  },

  reminders: {
    twoHours: true,
    thirtyMinutes: true,
    atVenue: true
  },

  feedback: {
    rating: 4,
    liked: ['activity'],
    energy: 'just-right',
    notes: 'Loved the pottery session! Drift desserts were a sweet finish.'
  },

  // Learned dating profile from completed dates & feedback
  learnedProfile: {
    likedActivities: ['Pottery', 'Dessert'],
    preferredVibe: 'Playful & tactile',
    favoriteNeighborhood: 'Indiranagar',
    notes: 'Responds best to active hands-on early evening plans.'
  }
};

let state = JSON.parse(JSON.stringify(initialState));
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(updates) {
  // Synchronize compatibility properties if new schema properties are updated
  if (updates.planner) {
    if (updates.planner.localities && !updates.planner.preferredArea) {
      updates.planner.preferredArea = updates.planner.localities[0] || 'Indiranagar';
    }
    if (updates.planner.softPreferences && !updates.planner.preferences) {
      updates.planner.preferences = updates.planner.softPreferences;
    }
    if (updates.planner.hardConstraints && !updates.planner.hardNo) {
      updates.planner.hardNo = updates.planner.hardConstraints;
    }
  }

  if (updates.invitee) {
    if (updates.invitee.localities && !updates.invitee.preferredArea) {
      updates.invitee.preferredArea = updates.invitee.localities[0] || 'Indiranagar';
    }
    if (updates.invitee.softPreferences && !updates.invitee.preferences) {
      updates.invitee.preferences = updates.invitee.softPreferences;
    }
    if (updates.invitee.hardConstraints && !updates.invitee.hardNo) {
      updates.invitee.hardNo = updates.invitee.hardConstraints;
    }
  }

  state = {
    ...state,
    ...updates,
    dateContext: updates.dateContext ? { ...state.dateContext, ...updates.dateContext } : state.dateContext,
    planner: updates.planner ? { ...state.planner, ...updates.planner } : state.planner,
    invitee: updates.invitee ? { ...state.invitee, ...updates.invitee } : state.invitee,
    booking: updates.booking ? { ...state.booking, ...updates.booking } : state.booking,
    reminders: updates.reminders ? { ...state.reminders, ...updates.reminders } : state.reminders,
    feedback: updates.feedback ? { ...state.feedback, ...updates.feedback } : state.feedback,
    learnedProfile: updates.learnedProfile ? { ...state.learnedProfile, ...updates.learnedProfile } : state.learnedProfile
  };

  notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach(fn => fn(state));
}

export function setScreen(screenNumber) {
  const target = Math.max(1, Math.min(16, screenNumber));
  setState({ currentScreenIndex: target });
}

export function nextScreen() {
  if (state.currentScreenIndex < 16) {
    setScreen(state.currentScreenIndex + 1);
  }
}

export function prevScreen() {
  if (state.currentScreenIndex > 1) {
    setScreen(state.currentScreenIndex - 1);
  }
}

export function setViewMode(mode) {
  setState({ viewMode: mode });
}

export function resetDemo() {
  state = JSON.parse(JSON.stringify(initialState));
  notify();
}

export function getActiveRecommendations() {
  return getRecommendations({
    planner: state.planner,
    invitee: state.invitee,
    dateContext: state.dateContext
  });
}

export function getSelectedDateOption() {
  const recs = getActiveRecommendations();
  return recs.find(r => r.id === state.selectedOptionId) || recs[0] || BASE_RECOMMENDATIONS[0];
}
