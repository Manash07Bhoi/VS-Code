/**
 * CodeSense AI — Application entry point.
 *
 * Bootstraps the SPA shell: navbar, router, API client, and page modules.
 * Views are activated via hash routes.
 */

import { api, fetchCsrfToken } from './app/api.js';
import { auth } from './app/auth.js';
import { initNavbar } from './components/navbar.js';
import { initRouter, registerView, setOnRouteChange } from './app/router.js';
import { init as registerInit } from './pages/register.js';
import { init as loginInit } from './pages/login.js';
import { load as dashboardLoad, init as dashboardInit } from './pages/dashboard.js';
import { init as workbenchInit } from './workbench/workbench.js';
import { init as reviewInit, load as reviewLoad } from './pages/review.js';
import { init as historyInit, load as historyLoad } from './pages/history.js';
import { init as settingsInit } from './pages/settings.js';

const viewEls = {};
function collectViews() {
  document.querySelectorAll('[data-view]').forEach((el) => {
    viewEls[el.getAttribute('data-view')] = el;
  });
}

const pageInitialized = new Set();

async function bootstrap() {
  collectViews();
  Object.entries(viewEls).forEach(([viewId, el]) => {
    registerView(viewId, el);
  });

  initNavbar({});

  await fetchCsrfToken();

  try {
    const res = await api.me();
    auth.setUser({ id: res.user.id, email: res.user.email });
  } catch (err) {
    auth.setUser(null);
  }

  setOnRouteChange((viewId) => {
    // One-time per-view initialization.
    if (!pageInitialized.has(viewId)) {
      switch (viewId) {
        case 'register': registerInit(); break;
        case 'login': loginInit(); break;
        case 'dashboard': dashboardInit(); break;
        case 'workbench': workbenchInit(); break;
        case 'review': reviewInit(); break;
        case 'history': historyInit(); break;
        case 'settings': settingsInit(); break;
      }
      pageInitialized.add(viewId);
    }
    // Data refresh on every activation (covers revisits and changed query
    // parameters, e.g. opening a different review id).
    switch (viewId) {
      case 'dashboard': dashboardLoad(); break;
      case 'review': reviewLoad(); break;
      case 'history': historyLoad(); break;
    }
    // Notify the activated view (pages may listen for refresh events).
    window.dispatchEvent(new CustomEvent(`codesense-view:${viewId}`));
  });

  initRouter();
  // Readiness marker for browser tests: set only after the router, navbar,
  // and API bootstrap have completed.
  window.__CODESENSE_READY = true;

  // Remove the branded boot splash once the shell is interactive.
  const splash = document.getElementById('boot-splash');
  if (splash) splash.remove();
}

window.__CODESENSE = { api, auth };

// Keep the account dropdown header in sync with the signed-in user.
auth.subscribe((user) => {
  const menuEmail = document.getElementById('nav-menu-email');
  if (menuEmail) menuEmail.textContent = user ? user.email : '';
  const menuRole = document.getElementById('nav-menu-role');
  if (menuRole) menuRole.textContent = user ? 'Account' : '';
});

document.addEventListener('DOMContentLoaded', bootstrap);
