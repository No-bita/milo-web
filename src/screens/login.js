// ==========================================================
// MILO — EMAIL LOGIN SCREEN
// Editorial email sign-in experience with accessible form controls,
// live validation feedback, and placeholders for Google/Phone auth.
// ==========================================================

import { store } from '../domain/store.js';
import { accountsEnabled } from '../domain/account-api.js';
import { renderAccountLogin, attachAccountLoginListeners } from './login-accounts.js';

const escape = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderLogin(sessionId = 'aarav') {
  if (accountsEnabled()) return renderAccountLogin(sessionId);
  const session = store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA'] || {};
  const existingEmail = session.user?.email || '';
  const isSynthesis = session.loginReason === 'synthesis';
  const isPostPlan = session.loginReason === 'save_plan' || Boolean(session.savedSoloNightId || store.getState().shared.confirmedNightId);

  const headline = isSynthesis
    ? "Sign up to see your night."
    : isPostPlan
    ? "Save tonight's plan."
    : "Welcome to Milo.";

  const subline = isSynthesis
    ? "Sign up to save what we just learned about your night and see your tailored choices."
    : isPostPlan
    ? "Sign in with your email to keep your date night saved and easily accessible."
    : "Sign in to save your date nights and coordinate seamlessly with your person.";

  const ctaText = isSynthesis
    ? "Sign up with email"
    : isPostPlan
    ? "Save plan & sign in"
    : "Sign in with email";

  return `
    <div class="milo-login-container" data-session-id="${sessionId}">
      <header class="milo-header milo-login-header">
        <button class="milo-header-back" id="miloLoginBack-${sessionId}" aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
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

        <form class="milo-login-form" id="miloLoginForm-${sessionId}" novalidate aria-label="Sign in with email">
          <div class="milo-form-group">
            <label for="miloEmailInput-${sessionId}" class="milo-form-label">Email address</label>
            <span id="miloEmailHint-${sessionId}" class="milo-form-hint">Enter the email you want to use with Milo</span>
            <input
              type="email"
              id="miloEmailInput-${sessionId}"
              name="email"
              class="milo-input"
              value="${escape(existingEmail)}"
              required
              autocomplete="email"
              enterkeyhint="next"
              placeholder="you@example.com"
              aria-describedby="miloEmailHint-${sessionId}"
              aria-errormessage="miloEmailError-${sessionId}"
            />
            <div id="miloEmailError-${sessionId}" class="milo-field-error" role="alert" aria-live="polite">
              Please enter a valid email address.
            </div>
          </div>

          <div class="milo-form-group">
            <div class="milo-label-row">
              <label for="miloPasswordInput-${sessionId}" class="milo-form-label">Password</label>
              <button type="button" class="milo-text-link" id="miloForgotBtn-${sessionId}">Forgot password?</button>
            </div>
            <div class="milo-password-wrap">
              <input
                type="password"
                id="miloPasswordInput-${sessionId}"
                name="password"
                class="milo-input"
                required
                autocomplete="current-password"
                enterkeyhint="done"
                placeholder="••••••••"
                aria-errormessage="miloPasswordError-${sessionId}"
              />
              <button
                type="button"
                class="milo-pwd-toggle"
                id="miloPwdToggle-${sessionId}"
                aria-label="Show password"
                aria-pressed="false"
              >
                <svg class="milo-eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line class="eye-slash" x1="2" y1="2" x2="22" y2="22" style="display:none"></line>
                </svg>
              </button>
            </div>
            <div id="miloPasswordError-${sessionId}" class="milo-field-error" role="alert" aria-live="polite">
              Please enter your password.
            </div>
          </div>

          <button type="submit" class="milo-cta-button milo-login-cta" id="miloLoginSubmit-${sessionId}">
            ${ctaText}
          </button>
        </form>

        <div class="milo-login-divider" role="separator" aria-label="Or continue with other methods">
          <span>or continue with</span>
        </div>

        <div class="milo-social-group" aria-label="Alternative sign-in options">
          <button type="button" class="milo-social-btn" id="miloGoogleBtn-${sessionId}" disabled aria-label="Continue with Google (coming soon)">
            <svg class="milo-social-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
            <span class="milo-social-badge">Soon</span>
          </button>

          <button type="button" class="milo-social-btn" id="miloPhoneBtn-${sessionId}" disabled aria-label="Continue with Phone (coming soon)">
            <svg class="milo-social-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <span>Continue with Phone</span>
            <span class="milo-social-badge">Soon</span>
          </button>
        </div>

        <p class="milo-login-privacy">
          Your dates, moods, and partner selections stay private. By signing in you agree to Milo's privacy principles.
        </p>
      </div>
    </div>
  `;
}

export function attachLoginListeners(container, sessionId = 'aarav') {
  if (accountsEnabled()) { attachAccountLoginListeners(container, sessionId); return; }
  const backBtn = container.querySelector(`#miloLoginBack-${sessionId}`);
  const form = container.querySelector(`#miloLoginForm-${sessionId}`);
  const emailInput = container.querySelector(`#miloEmailInput-${sessionId}`);
  const passwordInput = container.querySelector(`#miloPasswordInput-${sessionId}`);
  const pwdToggle = container.querySelector(`#miloPwdToggle-${sessionId}`);
  const emailError = container.querySelector(`#miloEmailError-${sessionId}`);
  const passwordError = container.querySelector(`#miloPasswordError-${sessionId}`);
  const forgotBtn = container.querySelector(`#miloForgotBtn-${sessionId}`);

  const getReturnScreen = () => {
    const liveSession = store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA'];
    if (liveSession?.returnScreen) return liveSession.returnScreen;
    if (liveSession?.savedSoloNightId) return 's4_waiting';
    if (store.getState().shared?.confirmedNightId) return 's7';
    return 'you';
  };

  const getBackScreen = () => {
    const liveSession = store.getState()[sessionId === 'sneha' ? 'sessionB' : 'sessionA'];
    if (liveSession?.originScreen) return liveSession.originScreen;
    return getReturnScreen();
  };

  // Back button
  backBtn?.addEventListener('click', () => {
    const backTo = getBackScreen();
    store.updateSession(sessionId, { returnScreen: null, originScreen: null, loginReason: null });
    store.setSessionScreen(sessionId, backTo);
  });

  // Password visibility toggle
  pwdToggle?.addEventListener('click', () => {
    if (!passwordInput) return;
    const isShowing = passwordInput.type === 'text';
    passwordInput.type = isShowing ? 'password' : 'text';
    pwdToggle.setAttribute('aria-pressed', String(!isShowing));
    pwdToggle.setAttribute('aria-label', isShowing ? 'Show password' : 'Hide password');
    const slash = pwdToggle.querySelector('.eye-slash');
    if (slash) slash.style.display = isShowing ? 'none' : 'block';
  });

  // Forgot password notice
  forgotBtn?.addEventListener('click', () => {
    alert('Password reset instructions will be sent to your email.');
  });

  // Sync aria-invalid with native validity
  const syncValidity = (input, errorEl) => {
    if (!input) return;
    const isValid = input.checkValidity();
    input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    if (errorEl) {
      errorEl.classList.toggle('is-visible', !isValid && input.value.length > 0);
    }
  };

  emailInput?.addEventListener('blur', () => syncValidity(emailInput, emailError));
  emailInput?.addEventListener('input', () => {
    if (emailInput.getAttribute('aria-invalid') === 'true') {
      syncValidity(emailInput, emailError);
    }
  });

  passwordInput?.addEventListener('blur', () => syncValidity(passwordInput, passwordError));
  passwordInput?.addEventListener('input', () => {
    if (passwordInput.getAttribute('aria-invalid') === 'true') {
      syncValidity(passwordInput, passwordError);
    }
  });

  // Form submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const isEmailValid = emailInput?.checkValidity() && Boolean(emailInput.value.trim());
    const isPasswordValid = Boolean(passwordInput?.value.trim());

    if (!isEmailValid) {
      emailInput?.focus();
      emailInput?.setAttribute('aria-invalid', 'true');
      if (emailError) emailError.classList.add('is-visible');
      return;
    }

    if (!isPasswordValid) {
      passwordInput?.focus();
      passwordInput?.setAttribute('aria-invalid', 'true');
      if (passwordError) passwordError.classList.add('is-visible');
      return;
    }

    // Save user state in store and navigate to destination
    store.setSessionUser(sessionId, {
      email: emailInput.value.trim(),
      loggedIn: true
    });

    const destination = getReturnScreen();
    store.updateSession(sessionId, { returnScreen: null, loginReason: null });
    store.setSessionScreen(sessionId, destination);
  });
}
