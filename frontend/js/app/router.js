/**
 * CodeSense AI — Client-side router (Vanilla JS).
 *
 * Hash-based routing to avoid server rewrite config. Maps routes to view IDs.
 * Protected routes require authentication.
 */

import { auth } from './auth.js';

const ROUTES = {
  '/': 'landing',
  '/landing': 'landing',
  '/register': 'register',
  '/login': 'login',
  '/dashboard': 'dashboard',
  '/workbench': 'workbench',
  '/editor': 'workbench', // legacy route now opens the workbench
  '/review': 'review',
  '/history': 'history',
  '/settings': 'settings',
  '/404': '404',
};

const PROTECTED = new Set(['/dashboard', '/workbench', '/editor', '/review', '/history', '/settings']);

const views = {};
let currentRoute = null;
let onRouteChange = null;

function registerView(viewId, element) {
  views[viewId] = element;
}

function showView(viewId, params = {}) {
  Object.values(views).forEach((el) => el.classList.remove('active'));
  const el = views[viewId];
  if (el) el.classList.add('active');
  currentRoute = viewId;
  if (onRouteChange) onRouteChange(viewId, params);
}

function navigate(path, params = {}) {
  console.log('[ROUTER] navigate called with', JSON.stringify(path));
  if (!path.startsWith('/')) path = '/' + path;
  console.log('[ROUTER] setting hash to', JSON.stringify(path));
  window.location.hash = path;
}

function getCurrentPath() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const fullPath = getCurrentPath();
  console.log('[ROUTER] handleRoute path=', JSON.stringify(fullPath), 'hash=', JSON.stringify(window.location.hash));
  const path = fullPath.split('?')[0];

  if (PROTECTED.has(path)) {
    if (!auth.isAuthenticated()) {
      sessionStorage.setItem('codesense-return-to', path);
      window.location.hash = '#/login';
      return;
    }
  }

  const viewId = path.slice(1) || 'landing';
  console.log('[ROUTER] showing view=', JSON.stringify(viewId));
  showView(viewId, {});
}

function setOnRouteChange(fn) {
  onRouteChange = fn;
}

export { initRouter, navigate, getCurrentPath, registerView, showView, setOnRouteChange, PROTECTED };
