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
  console.log('[MAIN] bootstrap start hash=', JSON.stringify(window.location.hash));
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
    if (pageInitialized.has(viewId)) return;
    switch (viewId) {
      case 'register': registerInit(); break;
      case 'login': loginInit(); break;
      case 'dashboard': dashboardInit(); dashboardLoad(); break;
      case 'workbench': workbenchInit(); break;
      case 'review': reviewInit(); reviewLoad(); break;
      case 'history': historyInit(); historyLoad(); break;
      case 'settings': settingsInit(); break;
    }
    pageInitialized.add(viewId);
  });

  initRouter();
  console.log('[MAIN] bootstrap end hash=', JSON.stringify(window.location.hash));
}

window.__CODESENSE = { api, auth };

// Log all navigate calls
const _navigate = window.navigate;

document.addEventListener('DOMContentLoaded', bootstrap);
