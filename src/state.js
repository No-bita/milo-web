// ==========================================================
// MILO V2 — CENTRAL REACTIVE STATE STORE
// Lightweight, observable state for the 16-screen prototype.
// ==========================================================

import { BASE_RECOMMENDATIONS, getFilteredRecommendations } from './data/recommendations.js';

const initialState = {
  currentScreenIndex: 1, // 1 to 16
  viewMode: 'mobile',    // 'mobile' | 'grid'
  
  // Established Date Context (Date already agreed!)
  dateContext: {
    date: 'Friday, 25 Oct',
    time: '7:30 PM',
    occasion: 'Regular Date Night',
    flexibleWindow: true
  },

  // Person A: Planner (Rohan)
  planner: {
    name: 'Rohan',
    preferredArea: 'Indiranagar',
    preferences: ['fun', 'food'],
    hardNo: ['no-loud-places']
  },

  // Person B: Invitee (Priya)
  invitee: {
    name: 'Priya',
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
    perPersonAmount: '₹1,150 per person'
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
  }
};

let state = { ...initialState };
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(updates) {
  state = {
    ...state,
    ...updates,
    // Deep merge objects if supplied
    dateContext: updates.dateContext ? { ...state.dateContext, ...updates.dateContext } : state.dateContext,
    planner: updates.planner ? { ...state.planner, ...updates.planner } : state.planner,
    invitee: updates.invitee ? { ...state.invitee, ...updates.invitee } : state.invitee,
    booking: updates.booking ? { ...state.booking, ...updates.booking } : state.booking,
    reminders: updates.reminders ? { ...state.reminders, ...updates.reminders } : state.reminders,
    feedback: updates.feedback ? { ...state.feedback, ...updates.feedback } : state.feedback
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
  return getFilteredRecommendations(
    { hardNos: state.planner.hardNo },
    { hardNos: state.invitee.hardNo }
  );
}

export function getSelectedDateOption() {
  const recs = BASE_RECOMMENDATIONS;
  return recs.find(r => r.id === state.selectedOptionId) || recs[0];
}
