/**
 * CodeSense AI — Navbar component.
 */

import { auth } from '../app/auth.js';
import { api } from '../app/api.js';
import { navigate } from '../app/router.js';
import { toast } from '../components/toast.js';

const returnToKey = 'codesense-return-to';

export function initNavbar({ onLogout, onLogin }) {
  const brand = document.getElementById('nav-brand');
  const navActions = document.getElementById('nav-actions');
  const accountBtn = document.getElementById('nav-account');
  const accountMenu = document.getElementById('nav-account-menu');
  const navEmail = document.getElementById('nav-email');
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const btnLogout = document.getElementById('btn-logout');
  const navLinks = document.querySelectorAll('[data-route]');

  function render(user) {
    const authed = auth.isAuthenticated();
    // Public actions.
    const publicEl = document.getElementById('nav-public');
    const privateEl = document.getElementById('nav-private');
    if (publicEl) publicEl.style.display = authed ? 'none' : 'flex';
    if (privateEl) privateEl.style.display = authed ? 'flex' : 'none';
    if (navEmail) navEmail.textContent = user ? user.email : '';
    // Highlight active route.
    const path = window.location.hash.replace(/^#/, '') || '/';
    navLinks.forEach((link) => {
      const route = link.getAttribute('data-route');
      const active = route === 'landing' ? path === '/' || path === '#/landing' :
                     path === `#/${route}` || path === `#${route}`;
      link.classList.toggle('active', active);
      link.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  auth.subscribe(render);
  render(auth.getUser());

  // Nav link clicks.
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const route = link.getAttribute('data-route');
      if (route) {
        e.preventDefault();
        navigate(`/${route}`);
        accountMenu.classList.remove('open');
      }
    });
  });

  // Account menu toggle.
  if (accountBtn && accountMenu) {
    accountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      accountMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!accountBtn.contains(e.target) && !accountMenu.contains(e.target)) {
        accountMenu.classList.remove('open');
      }
    });
  }

  if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/login');
    });
  }
  if (btnRegister) {
    btnRegister.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/register');
    });
  }
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await api.logout();
        auth.setUser(null);
        toast.show('Signed out.', 'info', 3000);
        navigate('/');
        if (onLogout) onLogout();
      } catch (err) {
        // Even if the server call fails, clear local state.
        auth.setUser(null);
        toast.show('Signed out.', 'info', 3000);
        navigate('/');
      }
    });
  }

  // Return-to after login.
  const stored = sessionStorage.getItem(returnToKey);
  if (stored) sessionStorage.removeItem(returnToKey);

  return { render };
}
