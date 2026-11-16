/**
 * CodeSense AI — Login page.
 */

import { api, setCsrfToken } from '../app/api.js';
import { auth } from '../app/auth.js';
import { navigate } from '../app/router.js';
import { show as toastShow, error as toastError } from '../components/toast.js';

const form = document.getElementById('form-login');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.getElementById('login-submit');
const btnRegister = document.getElementById('login-to-register');
const errorEl = document.getElementById('login-error');
const pendingEl = document.getElementById('login-pending');

let submitting = false;

function showFieldError(input, message) {
  input.classList.add('error');
  let el = input.parentElement.querySelector('.field-error');
  if (!el) {
    el = document.createElement('p');
    el.className = 'field-error';
    input.parentElement.appendChild(el);
  }
  el.textContent = message;
}

function clearFieldErrors() {
  document.querySelectorAll('#form-login .error').forEach((el) => el.classList.remove('error'));
  document.querySelectorAll('#form-login .field-error').forEach((el) => el.remove());
  errorEl.textContent = '';
  errorEl.hidden = true;
}

function setPending(pending) {
  submitting = pending;
  submitBtn.disabled = pending;
  submitBtn.textContent = pending ? 'Signing in…' : 'Sign in';
  pendingEl.hidden = !pending;
}

function init() {
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      if (!email) showFieldError(emailInput, 'Email is required.');
      if (!password) showFieldError(passwordInput, 'Password is required.');
      return;
    }

    setPending(true);
    try {
      const res = await api.login(email, password);
      auth.setUser({ id: res.user.id, email: res.user.email });
      // Apply the fresh CSRF token bound to the regenerated session.
      if (res.csrfToken) setCsrfToken(res.csrfToken);

      // Return to intended route or dashboard.
      const intended = sessionStorage.getItem('codesense-return-to') || '/dashboard';
      sessionStorage.removeItem('codesense-return-to');
      toastShow('Signed in.', 'success', 3000);
      navigate(intended);
    } catch (err) {
      if (err.status === 429) {
        toastError('Too many attempts. Please wait and try again.');
      } else if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
        // Genuine credential rejection — generic error, no account enumeration.
        toastError('Invalid email or password.');
      } else {
        // Any other failure (404/5xx/network) means the sign-in service could
        // not be reached or failed — never blame the credentials for that.
        toastError('Unable to reach the sign-in service. Please try again later.');
      }
    } finally {
      setPending(false);
    }
  });

  if (btnRegister) {
    btnRegister.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/register');
    });
  }

  // Password visibility toggle (show/hide). Never submits the form.
  const loginToggle = form.querySelector('.password-toggle');
  const loginPassword = document.getElementById('login-password');
  if (loginToggle && loginPassword) {
    let showing = false;
    loginToggle.addEventListener('click', () => {
      showing = !showing;
      loginPassword.type = showing ? 'text' : 'password';
      loginToggle.setAttribute('aria-pressed', showing ? 'true' : 'false');
      loginToggle.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
      loginToggle.textContent = showing ? '🙈' : '👁';
    });
  }
}


export { init };
