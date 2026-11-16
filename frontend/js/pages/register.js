/**
 * CodeSense AI — Registration page.
 */

import { api, setCsrfToken } from '../app/api.js';
import { auth } from '../app/auth.js';
import { navigate } from '../app/router.js';
import { toast, error, success } from '../components/toast.js';

const form = document.getElementById('form-register');
const emailInput = document.getElementById('reg-email');
const passwordInput = document.getElementById('reg-password');
const submitBtn = document.getElementById('reg-submit');
const btnLogin = document.getElementById('reg-to-login');
const errorEl = document.getElementById('reg-error');
const pendingEl = document.getElementById('reg-pending');

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
  document.querySelectorAll('#form-register .error').forEach((el) => el.classList.remove('error'));
  document.querySelectorAll('#form-register .field-error').forEach((el) => el.remove());
  errorEl.textContent = '';
  errorEl.hidden = true;
}

function setPending(pending) {
  submitting = pending;
  submitBtn.disabled = pending;
  submitBtn.textContent = pending ? 'Creating account…' : 'Create account';
  pendingEl.hidden = !pending;
}

function init() {
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;
    clearFieldErrors();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Client validation.
    let valid = true;
    if (!email) { showFieldError(emailInput, 'Email is required.'); valid = false; }
    if (!password || password.length < 8) {
      showFieldError(passwordInput, 'Password must be at least 8 characters.');
      valid = false;
    }
    if (!valid) return;

    setPending(true);
    try {
      const res = await api.register(email, password);
      if (res.created) {
        auth.setUser({ id: res.user.id, email: res.user.email });
        // Apply the fresh CSRF token bound to the regenerated session.
        if (res.csrfToken) setCsrfToken(res.csrfToken);
        success('Account created. You are signed in.');
        navigate('/dashboard');
      } else {
        // Account may already exist; prompt to log in.
        info('An account with this email may already exist. Try logging in instead.');
      }
    } catch (err) {
      if (err.status === 429) {
        error('Too many attempts. Please wait and try again.');
      } else if (err.status === 400 && err.code === 'VALIDATION_ERROR') {
        const fe = err.fieldErrors || {};
        Object.entries(fe).forEach(([field, msg]) => {
          const input = document.getElementById('reg-' + field);
          if (input) showFieldError(input, msg);
        });
        error('Please fix the errors above.');
      } else {
        error('Could not create account. Please try again.');
      }
    } finally {
      setPending(false);
    }
  });

  if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/login');
    });
  }

  // Password visibility toggle (show/hide). Never submits the form.
  const regToggle = form.querySelector('.password-toggle');
  const regPassword = document.getElementById('reg-password');
  if (regToggle && regPassword) {
    let showing = false;
    regToggle.addEventListener('click', () => {
      showing = !showing;
      regPassword.type = showing ? 'text' : 'password';
      regToggle.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
      regToggle.textContent = showing ? '🙈' : '👁';
    });
  }
}

function info(message, duration) {
  const el = document.getElementById('reg-info') || document.createElement('div');
  el.id = 'reg-info';
  el.className = 'field-error';
  el.style.color = 'var(--info)';
  el.textContent = message;
  if (!document.getElementById('reg-info')) {
    form.appendChild(el);
  }
  setTimeout(() => el.remove(), duration || 5000);
}


export { init };
