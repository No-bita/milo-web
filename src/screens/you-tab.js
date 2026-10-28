import { renderTabBar, attachTabBar } from '../components/tab-bar.js';
import { store } from '../domain/store.js';
import { escapeHtml as escape, initialOf } from '../logic/partner.js';
import { DATA_REQUESTS_EMAIL } from '../data/contact.js';
import { yourPerson, personName, accountsEnabled, accountMe } from '../domain/account-api.js';
import { signOut } from '../domain/auth.js';
import { cleanName } from '../domain/network-adapter.js';

// You: who you are and who your person is. Plans live on Home and Nights, so
// nothing here shows a plan's status or starts one.
const MAX_DOTS = 12;
const HEART = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
const PERSON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
const HELP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><path d="M12 17h.01"/></svg>';
const CHEVRON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

const sinceLabel = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));

function nightsBlock({ booked, planned }) {
  const total = booked + planned;
  if (!total) return '';
  const shown = Math.min(total, MAX_DOTS);
  const solid = Math.min(booked, shown);
  const dots = Array.from({ length: shown }, (_, i) => `<i class="${i < solid ? 'is-booked' : 'is-planned'}"></i>`).join('');
  const more = total > MAX_DOTS ? `<span class="milo-you-more">+${total - MAX_DOTS}</span>` : '';
  const parts = [booked ? `${booked} booked` : '', planned ? `${planned} planned` : ''].filter(Boolean).join(' · ');
  const aria = [booked ? `${booked} booked ${booked === 1 ? 'night' : 'nights'}` : '', planned ? `${planned} planned ${planned === 1 ? 'night' : 'nights'}` : ''].filter(Boolean).join(' and ');
  return `<div class="milo-you-nights">
      <p class="milo-you-count">${total} ${total === 1 ? 'night' : 'nights'} together</p>
      <div class="milo-you-dots" role="img" aria-label="${aria}">${dots}${more}</div>
      <p class="milo-you-split">${parts}</p>
    </div>`;
}

function personSection(state, me) {
  const person = yourPerson(state);
  if (!person) {
    return `<section class="milo-you-section" aria-labelledby="miloYouPersonTitle">
      <p class="milo-you-label">YOUR PERSON</p>
      <article class="milo-you-row milo-you-empty">
        <span class="milo-you-icon is-dashed" aria-hidden="true">${HEART}</span>
        <div><h2 id="miloYouPersonTitle">Your person shows up here</h2><p>Once they join a plan with you, you'll see them here.</p></div>
      </article>
    </section>`;
  }
  const name = personName(state, person);
  return `<section class="milo-you-section" aria-labelledby="miloYouPersonTitle">
      <p class="milo-you-label is-warm">YOUR PERSON</p>
      <article class="milo-you-person" data-person-id="${escape(person.id)}">
        <div class="milo-you-person-head">
          <span class="milo-you-pair" aria-hidden="true"><i class="is-me">${initialOf(me)}</i><i class="is-them">${initialOf(name)}</i></span>
          <div><h2 id="miloYouPersonTitle">${escape(name)}</h2>${person.since ? `<p>Together on Milo since ${sinceLabel(person.since)}</p>` : ''}</div>
        </div>
        ${nightsBlock(person.nights)}
        <button type="button" class="milo-you-text" id="miloYouManagePerson" aria-expanded="false" aria-controls="miloYouRename">Manage</button>
        <form class="milo-you-rename" id="miloYouRename" hidden novalidate>
          <label for="miloYouRenameInput">Name on this phone</label>
          <input id="miloYouRenameInput" class="milo-input" name="nickname" maxlength="40" autocomplete="off" value="${escape(name)}">
          <p class="milo-you-hint">Only changes how ${escape(person.display_name)} shows here. Leave it empty to use the name they gave.</p>
          <div class="milo-you-rename-actions">
            <button type="button" class="milo-you-text" id="miloYouRenameCancel">Cancel</button>
            <button type="submit" class="milo-you-save" id="miloYouRenameSave">Save</button>
          </div>
        </form>
      </article>
    </section>`;
}

// Accounts on: the signed-in account from the server. Off: the email kept on this phone.
function accountSection(session, state) {
  const real = accountsEnabled();
  const me = real ? accountMe(state) : null;
  const user = real ? me : session.user;
  if (!user?.email) {
    return `<section class="milo-you-section" aria-labelledby="miloYouAccountTitle">
      <p class="milo-you-label">YOUR ACCOUNT</p>
      <article class="milo-you-card">
        <div class="milo-you-row-inner">
          <span class="milo-you-icon" aria-hidden="true">${PERSON}</span>
          <div><h2 id="miloYouAccountTitle">Make Milo yours</h2><p>Save your plans and pick up on any phone.</p></div>
        </div>
        <button type="button" class="milo-you-outline" id="miloYouLoginBtn">Sign in or create account</button>
      </article>
    </section>`;
  }
  const name = String((real ? me.name : session.name) || '').trim();
  return `<section class="milo-you-section" aria-labelledby="miloYouAccountTitle">
      <p class="milo-you-label">YOUR ACCOUNT</p>
      <article class="milo-you-row milo-you-account">
        <span class="milo-you-icon is-filled" aria-hidden="true">${initialOf(name || user.email)}</span>
        <div><h2 id="miloYouAccountTitle">${escape(name || user.email)}</h2><p>${name ? `${escape(user.email)} · ` : ''}Signed in</p></div>
        ${real ? '<button type="button" class="milo-you-text" id="miloYouAccountManage" aria-expanded="false" aria-controls="miloYouSignOut">Manage</button>' : '<button type="button" class="milo-you-text" id="miloYouLoginBtn">Manage</button>'}
      </article>
      ${real ? '<button type="button" class="milo-you-outline" id="miloYouSignOut" hidden>Sign out</button>' : ''}
    </section>`;
}

export function renderYou(sessionId = 'aarav') {
  const state = store.getState();
  const session = state[sessionId === 'sneha' ? 'sessionB' : 'sessionA'] || {};
  return `<div class="milo-home milo-tabscreen milo-you" data-session-id="${sessionId}">
    <header class="milo-header"><span class="milo-wordmark">milo.</span></header>
    <div class="milo-home-body">
      <h1 class="milo-headline milo-home-headline">You</h1>
      <p class="milo-you-lead">Your little corner of Milo.</p>
      ${personSection(state, session.name || session.user?.email || '')}
      ${accountSection(session, state)}
      <nav class="milo-you-help" aria-label="Help">
        <a href="mailto:${DATA_REQUESTS_EMAIL}?subject=Milo%20help" id="miloYouHelp"><span class="milo-you-help-icon">${HELP}</span><span>Help and support</span><span class="milo-you-chevron">${CHEVRON}</span></a>
      </nav>
    </div>
    ${renderTabBar('you')}
  </div>`;
}

export function attachYouListeners(container, sessionId = 'aarav') {
  attachTabBar(container, sessionId);
  container.querySelector('#miloYouLoginBtn')?.addEventListener('click', () => {
    store.updateSession(sessionId, { returnScreen: 'you', originScreen: 'you', loginReason: null, screen: 'login' });
  });
  const accountManage = container.querySelector('#miloYouAccountManage');
  const signOutBtn = container.querySelector('#miloYouSignOut');
  accountManage?.addEventListener('click', () => {
    const open = signOutBtn.hidden;
    signOutBtn.hidden = !open;
    accountManage.setAttribute('aria-expanded', String(open));
  });
  signOutBtn?.addEventListener('click', async () => {
    signOutBtn.disabled = true;
    await signOut(sessionId);
  });

  const manage = container.querySelector('#miloYouManagePerson');
  const form = container.querySelector('#miloYouRename');
  const card = container.querySelector('.milo-you-person');
  if (!manage || !form || !card) return;
  const input = form.querySelector('#miloYouRenameInput');
  const toggle = (open) => {
    form.hidden = !open;
    manage.hidden = open;
    manage.setAttribute('aria-expanded', String(open));
    if (open) input.focus(); else manage.focus();
  };
  manage.addEventListener('click', () => toggle(true));
  form.querySelector('#miloYouRenameCancel').addEventListener('click', () => toggle(false));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = card.dataset.personId;
    const person = yourPerson(store.getState());
    if (!person || person.id !== id) return;
    const nickname = cleanName(input.value);
    const names = { ...(store.getState().sessionA.personNames || {}) };
    if (nickname && nickname !== person.display_name) names[id] = nickname; else delete names[id];
    // Nicknames live on this phone only; the server keeps the name they gave.
    store.updateSession('aarav', { personNames: names });
  });
}
