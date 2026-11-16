/**
 * CodeSense AI — Workbench theme manager.
 *
 * Dark and light themes, persisted in localStorage, switching both the app
 * CSS variables (body[data-theme]) and the Monaco editor theme.
 */

const THEME_KEY = 'codesense-theme';

let current = localStorage.getItem(THEME_KEY) || 'dark';
if (current !== 'dark' && current !== 'light') current = 'dark';

const listeners = new Set();

function monacoTheme() {
  return current === 'dark' ? 'cs-dark' : 'cs-light';
}

function apply() {
  if (current === 'light') {
    document.body.setAttribute('data-theme', 'light');
  } else {
    document.body.removeAttribute('data-theme');
  }
}

function get() {
  return current;
}

function set(theme) {
  if (theme !== 'dark' && theme !== 'light') return;
  current = theme;
  localStorage.setItem(THEME_KEY, theme);
  apply();
  listeners.forEach((fn) => { try { fn(current); } catch (_e) { /* isolated */ } });
}

function toggle() {
  set(current === 'dark' ? 'light' : 'dark');
}

function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function init() {
  apply();
}

export { init, get, set, toggle, onChange, monacoTheme };
