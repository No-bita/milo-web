// ==========================================================
// MILO V2 — SCREEN 15: AFTER THE DATE (FEEDBACK)
// Interactive 5-star rating, liked tags, energy assessment,
// notes, and updates to learnedProfile.
// ==========================================================

import { getState, setState, nextScreen, prevScreen } from '../state.js';

export function renderScreen15() {
  const state = getState();
  const feedback = state.feedback || { rating: 4, liked: ['activity'], energy: 'just-right', notes: '' };

  return `
    <div style="display:flex; flex-direction:column; min-height:100%; justify-content:space-between; padding-bottom: 24px;">
      <div>
        <div class="milo-nav-header">
          <button class="milo-back-btn" id="btnScreen15Back" aria-label="Go back">←</button>
          <span style="font-size:0.85rem; font-weight:600; color:var(--milo-text-secondary);">Feedback</span>
          <div style="width: 32px;"></div>
        </div>

        <h1 class="milo-screen-h1" style="margin-top: 16px;">So... how'd we do?</h1>
        <p class="milo-screen-subhead">
          Be honest. I can take it — and it makes the next date even better.
        </p>

        <!-- 5 Star Interactive Rating -->
        <div style="display:flex; justify-content:center; margin: 16px 0 20px;">
          <div class="milo-star-rating" id="miloStarContainer">
            ${[1, 2, 3, 4, 5].map(num => `
              <span class="milo-star ${num <= feedback.rating ? 'active' : ''}" data-star="${num}">★</span>
            `).join('')}
          </div>
        </div>

        <!-- What did you like? -->
        <div style="margin-bottom: 18px;">
          <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 8px;">
            What was the highlight?
          </label>
          <div class="milo-chip-group" style="margin:0; gap:8px;">
            ${['Venue', 'Activity', 'Food', 'Vibe'].map(tag => {
              const code = tag.toLowerCase();
              const isSelected = (feedback.liked || []).includes(code);
              return `
                <button class="milo-pill ${isSelected ? 'selected' : ''}" data-feedback-tag="${code}">
                  ${tag}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- And the energy? -->
        <div style="margin-bottom: 18px;">
          <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 8px;">
            And the energy level?
          </label>
          <div class="milo-segmented">
            <button class="milo-segmented-btn ${feedback.energy === 'too-quiet' ? 'selected' : ''}" data-energy="too-quiet">
              Too quiet
            </button>
            <button class="milo-segmented-btn ${feedback.energy === 'just-right' ? 'selected' : ''}" data-energy="just-right">
              Just right
            </button>
            <button class="milo-segmented-btn ${feedback.energy === 'a-little-much' ? 'selected' : ''}" data-energy="a-little-much">
              A little loud
            </button>
          </div>
        </div>

        <!-- Anything I should remember? -->
        <div style="margin-bottom: 14px;">
          <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--milo-text-secondary); display: block; margin-bottom: 6px;">
            Anything I should remember for next time?
          </label>
          <textarea 
            id="txtFeedbackNotes" 
            placeholder="Tell me what worked, what didn't, or what you'd happily do again."
            style="width:100%; height:75px; padding:10px 12px; border:1px solid var(--milo-border); border-radius:var(--milo-radius-md); font-family:var(--milo-font-sans); font-size:0.85rem; resize:none; outline:none; background:#FFFFFF;"
          >${feedback.notes || ''}</textarea>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="milo-action-footer">
        <button class="milo-btn-primary" id="btnSubmitFeedback">
          Save & see what Milo learned →
        </button>
      </div>
    </div>
  `;
}

export function attachScreen15Listeners(container) {
  const backBtn = container.querySelector('#btnScreen15Back');
  if (backBtn) backBtn.addEventListener('click', () => prevScreen());

  // Star rating
  container.querySelectorAll('[data-star]').forEach(star => {
    star.addEventListener('click', (e) => {
      const rating = parseInt(e.currentTarget.getAttribute('data-star'), 10);
      setState({ feedback: { ...getState().feedback, rating } });
    });
  });

  // Highlight tags
  container.querySelectorAll('[data-feedback-tag]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tag = e.currentTarget.getAttribute('data-feedback-tag');
      const state = getState();
      const current = new Set(state.feedback?.liked || []);
      if (current.has(tag)) current.delete(tag);
      else current.add(tag);
      setState({ feedback: { ...state.feedback, liked: Array.from(current) } });
    });
  });

  // Energy
  container.querySelectorAll('[data-energy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const energy = e.currentTarget.getAttribute('data-energy');
      setState({ feedback: { ...getState().feedback, energy } });
    });
  });

  // Submit button
  const submitBtn = container.querySelector('#btnSubmitFeedback');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const notesEl = container.querySelector('#txtFeedbackNotes');
      const noteVal = notesEl ? notesEl.value : '';
      const state = getState();
      
      setState({
        feedback: { ...state.feedback, notes: noteVal },
        learnedProfile: {
          ...state.learnedProfile,
          likedActivities: ['Hands-on pottery', 'Dessert stops'],
          preferredVibe: state.feedback.energy === 'a-little-much' ? 'Quieter, more intimate' : 'Playful & tactile',
          notes: noteVal || 'Responds best to active hands-on early evening plans.'
        }
      });
      nextScreen();
    });
  }
}
