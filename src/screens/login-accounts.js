// Real sign-in (accounts v1): email, then a 6-digit code, or Google. A first sign-in with
// no name from any plan asks "What should Milo call you?" once. Shown instead of the old
// local-only form when VITE_MILO_ACCOUNTS=true.
import { store } from '../domain/store.js';
import { startEmail, verifyEmail, googleSignIn, setAccountName, loadGoogle, googleClientId } from '../domain/auth.js';
import { escapeHtml as escape } from '../logic/partner.js';
import { cleanName } from '../domain/network-adapter.js';

// Survives the app's full re-renders while this screen is open.
let flow = { step: 'email', email: '', error: '', busy: false };
const set = (patch, sessionId) => { flow = { ...flow, ...patch }; store.updateSession(sessionId, { loginTick: Date.now() }); };
export const resetLoginFlow = () => { flow = { step: 'email', email: '', error: '', busy: false }; };

const ERRORS = {
  invalid_code: "That code didn't work. Check it, or send a new one.",
  invalid_request: 'Check your email address and try again.',
  rate_limited: 'Too many tries. Wait a few minutes, then try again.',
  account_conflict: 'That email is already linked to a different Google account.'
};
const errorText = (r) => ERRORS[r.code] || "Milo couldn't reach the server. Try again.";

const session = (sessionId) => store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA'] || {};

function intro(sessionId) {
  if (flow.step === 'code') return ['Check your email', `We sent a 6-digit code to ${escape(flow.email)}. It works for 10 minutes.`];
  if (flow.step === 'name') return ['What should Milo call you?', 'Your person sees this name on your plans.'];
  if (session(sessionId).loginReason === 'booking') return ['Sign in to book.', 'Milo needs to know who to confirm with. Your plan stays as it is.'];
  return ['Welcome to Milo.', 'Sign in to save your plans and pick up on any phone.'];
}

function body(sessionId) {
  const err = `<p class="milo-field-error is-visible" id="miloAuthError-${sessionId}" role="alert"${flow.error ? '' : ' hidden'}>${escape(flow.error)}</p>`;
  if (flow.step === 'code') {
    return `<form class="milo-login-form" id="miloCodeForm-${sessionId}" novalidate aria-label="Enter your code">
        <div class="milo-form-group">
          <label for="miloCodeInput-${sessionId}" class="milo-form-label">6-digit code</label>
          <input id="miloCodeInput-${sessionId}" class="milo-input milo-code-input" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}" required>
        </div>
        ${err}
        <button type="submit" class="milo-cta-button milo-login-cta" id="miloCodeSubmit-${sessionId}"${flow.busy ? ' disabled' : ''}>Sign in</button>
      </form>
      <div class="milo-auth-links">
        <button type="button" class="milo-text-link" id="miloCodeResend-${sessionId}">Send a new code</button>
        <button type="button" class="milo-text-link" id="miloCodeChange-${sessionId}">Use a different email</button>
      </div>`;
  }
  if (flow.step === 'name') {
    const suggested = session(sessionId).name || '';
    return `<form class="milo-login-form" id="miloNameForm-${sessionId}" novalidate aria-label="Your name">
        <div class="milo-form-group">
          <label for="miloAccountName-${sessionId}" class="milo-form-label">Your name</label>
          <input id="miloAccountName-${sessionId}" class="milo-input" name="name" maxlength="40" autocomplete="given-name" value="${escape(suggested)}" required>
        </div>
        ${err}
        <button type="submit" class="milo-cta-button milo-login-cta" id="miloNameSubmit-${sessionId}"${flow.busy ? ' disabled' : ''}>Continue</button>
      </form>`;
  }
  const google = googleClientId() ? '<div class="milo-google-slot" id="miloGoogleSlot"></div>' : '';
  return `<form class="milo-login-form" id="miloEmailForm-${sessionId}" novalidate aria-label="Sign in with email">
        <div class="milo-form-group">
          <label for="miloEmailInput-${sessionId}" class="milo-form-label">Email address</label>
          <input type="email" id="miloEmailInput-${sessionId}" name="email" class="milo-input" value="${escape(flow.email || session(sessionId).user?.email || '')}" required autocomplete="email" placeholder="you@example.com">
        </div>
        ${err}
        <button type="submit" class="milo-cta-button milo-login-cta" id="miloEmailSubmit-${sessionId}"${flow.busy ? ' disabled' : ''}>Send me a code</button>
      </form>
      <div class="milo-login-divider" role="separator"><span>or</span></div>
      <div class="milo-social-group">
        ${google}
        <button type="button" class="milo-social-btn" id="miloPhoneBtn-${sessionId}" disabled aria-label="Continue with Phone (coming soon)">
          <span>Continue with Phone</span><span class="milo-social-badge">Soon</span>
        </button>
      </div>`;
}

export function renderAccountLogin(sessionId = 'aarav') {
  const [headline, subline] = intro(sessionId);
  return `<div class="milo-login-container" data-session-id="${sessionId}">
      <header class="milo-header milo-login-header">
        <button class="milo-header-back" id="miloLoginBack-${sessionId}" aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span class="milo-wordmark">milo.</span>
        <div class="milo-header-space"></div>
      </header>
      <div class="milo-login-body">
        <div class="milo-login-intro">
          <div class="milo-login-monogram" aria-hidden="true"><span>m.</span></div>
          <h1 class="milo-headline milo-login-headline">${headline}</h1>
          <p class="milo-subline milo-login-subline">${subline}</p>
        </div>
        ${body(sessionId)}
        <p class="milo-login-privacy">Your dates, moods, and partner selections stay private. By signing in you agree to Milo's privacy principles.</p>
      </div>
    </div>`;
}

function finish(sessionId) {
  const live = session(sessionId);
  const destination = live.returnScreen || 'you';
  resetLoginFlow();
  store.updateSession(sessionId, { returnScreen: null, originScreen: null, loginReason: null, screen: destination });
}

async function signedIn(sessionId, result) {
  if (!result.ok) { set({ busy: false, error: errorText(result) }, sessionId); return; }
  if (!result.account?.name) { set({ step: 'name', busy: false, error: '' }, sessionId); return; }
  finish(sessionId);
}

export function attachAccountLoginListeners(container, sessionId = 'aarav') {
  container.querySelector(`#miloLoginBack-${sessionId}`)?.addEventListener('click', () => {
    if (flow.step === 'code') { set({ step: 'email', error: '' }, sessionId); return; }
    const live = session(sessionId);
    const back = live.originScreen || live.returnScreen || 'you';
    resetLoginFlow();
    store.updateSession(sessionId, { returnScreen: null, originScreen: null, loginReason: null, screen: back });
  });

  container.querySelector(`#miloEmailForm-${sessionId}`)?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = event.target.elements.email;
    const email = input.value.trim();
    if (!input.checkValidity() || !email) { set({ email, error: 'Enter a valid email address.' }, sessionId); return; }
    set({ email, busy: true, error: '' }, sessionId);
    const r = await startEmail(email);
    set(r.ok ? { step: 'code', busy: false } : { busy: false, error: errorText(r) }, sessionId);
  });

  const codeForm = container.querySelector(`#miloCodeForm-${sessionId}`);
  codeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = event.target.elements.code.value.replace(/\D/g, '');
    if (code.length !== 6) { set({ error: 'Enter the 6 digits from the email.' }, sessionId); return; }
    set({ busy: true, error: '' }, sessionId);
    await signedIn(sessionId, await verifyEmail(sessionId, flow.email.trim().toLowerCase(), code));
  });
  if (codeForm) container.querySelector(`#miloCodeInput-${sessionId}`)?.focus();
  container.querySelector(`#miloCodeResend-${sessionId}`)?.addEventListener('click', async () => {
    const r = await startEmail(flow.email);
    set({ error: r.ok ? '' : errorText(r) }, sessionId);
  });
  container.querySelector(`#miloCodeChange-${sessionId}`)?.addEventListener('click', () => set({ step: 'email', error: '' }, sessionId));

  container.querySelector(`#miloNameForm-${sessionId}`)?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = cleanName(event.target.elements.name.value);
    if (!name) { set({ error: 'Add a name, up to 40 letters.' }, sessionId); return; }
    set({ busy: true, error: '' }, sessionId);
    const r = await setAccountName(name);
    if (!r.ok) { set({ busy: false, error: errorText(r) }, sessionId); return; }
    finish(sessionId);
  });

  const slot = container.querySelector('#miloGoogleSlot');
  if (slot) {
    loadGoogle().then((google) => {
      if (!google || !slot.isConnected) return;
      google.accounts.id.initialize({ client_id: googleClientId(), callback: async ({ credential }) => {
        set({ busy: true, error: '' }, sessionId);
        await signedIn(sessionId, await googleSignIn(sessionId, credential));
      } });
      google.accounts.id.renderButton(slot, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(slot.clientWidth || 320, 400) });
    });
  }
}
