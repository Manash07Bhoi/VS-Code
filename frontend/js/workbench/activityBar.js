/**
 * CodeSense AI — Workbench activity bar.
 *
 * Left vertical navigation between workbench views. Every icon is
 * functional (toggles a real sidebar panel). The Problems icon carries a
 * live count badge from the problems store.
 */

const ICONS = {
  explorer: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.5 4.5A1.5 1.5 0 0 1 4 3h3.2l1.4 1.8H16A1.5 1.5 0 0 1 17.5 6.3v9.2A1.5 1.5 0 0 1 16 17H4a1.5 1.5 0 0 1-1.5-1.5v-11z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="5.2" stroke="currentColor" stroke-width="1.4"/><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  scm: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="4.2" r="2" stroke="currentColor" stroke-width="1.3"/><circle cx="4.5" cy="15" r="2" stroke="currentColor" stroke-width="1.3"/><circle cx="15.5" cy="15" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M10 6.2v3.3M10 9.5c-2.6 0-4.3 1.6-5 3.6M10 9.5c2.6 0 4.3 1.6 5 3.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  run: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5.5 3.8v12.4c0 .7.8 1.1 1.4.7l9.4-6.2c.5-.4.5-1.1 0-1.5L6.9 3.1c-.6-.4-1.4 0-1.4.7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  extensions: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3.2" y="3.2" width="5.6" height="5.6" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="11.2" y="3.2" width="5.6" height="5.6" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="3.2" y="11.2" width="5.6" height="5.6" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M14 10.8v6.4M10.8 14h6.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  ai: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.2l1.9 4.6 4.9.4-3.7 3.2 1.1 4.7L10 12.6l-4.2 2.5 1.1-4.7-3.7-3.2 4.9-.4L10 2.2z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/></svg>',
  problems: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.3"/><path d="M10 6.2v4.2M10 13.4v.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  account: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="7" r="2.8" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 16.5c.9-2.8 3-4.2 5.5-4.2s4.6 1.4 5.5 4.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
};

const VIEWS = [
  { id: 'explorer', title: 'Explorer (Ctrl+Shift+E)' },
  { id: 'search', title: 'Search (Ctrl+Shift+F)' },
  { id: 'scm', title: 'Source Control — local changes (Ctrl+Shift+G)' },
  { id: 'run', title: 'Run and Debug' },
  { id: 'extensions', title: 'Supported Integrations' },
  { id: 'ai', title: 'AI Review (Ctrl+Shift+A)' },
];

const el = () => document.getElementById('wb-activitybar');

let currentView = 'explorer';
let problemsCount = 0;
let hidden = false;
const listeners = new Set();

function onSwitch(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function emitSwitch(viewId) {
  listeners.forEach((fn) => { try { fn(viewId); } catch (_e) { /* isolated */ } });
}

function switchView(viewId) {
  if (!VIEWS.some((v) => v.id === viewId)) return;
  currentView = viewId;
  render();
  emitSwitch(viewId);
}

function toggleSidebar() {
  hidden = !hidden;
  render();
}

function setProblemsCount(n) {
  problemsCount = n;
  render();
}

function getView() {
  return currentView;
}

function isHidden() {
  return hidden;
}

function render() {
  const bar = el();
  if (!bar) return;
  bar.innerHTML = '';

  VIEWS.forEach((v) => {
    const btn = document.createElement('button');
    btn.className = 'wb-activity' + (!hidden && currentView === v.id ? ' active' : '');
    btn.setAttribute('aria-label', v.title);
    btn.title = v.title;
    btn.dataset.view = v.id;
    btn.innerHTML = ICONS[v.id];
    btn.addEventListener('click', () => {
      if (hidden) { hidden = false; switchView(v.id); }
      else if (currentView === v.id) { toggleSidebar(); }
      else { switchView(v.id); }
    });
    bar.appendChild(btn);
  });

  // Problems lives just above the fold with its live badge.
  const spacer = document.createElement('div');
  spacer.className = 'wb-activity-spacer';
  bar.appendChild(spacer);

  const problemsBtn = document.createElement('button');
  problemsBtn.className = 'wb-activity' + (!hidden && currentView === 'problems' ? ' active' : '');
  problemsBtn.setAttribute('aria-label', 'Problems (Ctrl+Shift+M)');
  problemsBtn.title = 'Problems (Ctrl+Shift+M)';
  problemsBtn.dataset.view = 'problems';
  problemsBtn.innerHTML = ICONS.problems;
  if (problemsCount > 0) {
    const badge = document.createElement('span');
    badge.className = 'wb-badge problems';
    badge.textContent = problemsCount > 99 ? '99+' : String(problemsCount);
    problemsBtn.appendChild(badge);
  }
  problemsBtn.addEventListener('click', () => {
    const { showProblems } = window.__wb || {};
    if (typeof showProblems === 'function') showProblems();
  });
  bar.appendChild(problemsBtn);
}

export { render, switchView, toggleSidebar, setProblemsCount, getView, isHidden, onSwitch, ICONS };
