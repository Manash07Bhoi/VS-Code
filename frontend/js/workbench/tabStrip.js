/**
 * CodeSense AI — Workbench tab strip UI.
 *
 * Renders the open-editor tabs (multiple files, active tab, dirty indicator,
 * close / close-others, overflow scrolling) from editorGroup state.
 */

import * as editorGroup from './editorGroup.js';
import * as workspace from './workspace.js';
import * as commands from './commands.js';
import { confirmDialog } from './dialog.js';

const el = () => document.getElementById('wb-tabs');

function basename(path) {
  return path.split('/').pop();
}

async function requestClose(path) {
  if (workspace.isDirty(path)) {
    const ok = await confirmDialog(
      'Unsaved changes',
      `"${basename(path)}" has unsaved changes. Close anyway and lose them?`,
      { okLabel: 'Close and lose changes', danger: true }
    );
    if (!ok) return;
  }
  editorGroup.closeTab(path);
}

function render() {
  const container = el();
  if (!container) return;
  const tabs = editorGroup.getOpenTabs();
  const active = editorGroup.getActive();
  container.innerHTML = '';

  if (!tabs.length) {
    const empty = document.createElement('span');
    empty.style.cssText = 'display:flex;align-items:center;padding:0 12px;color:var(--text-muted);font-size:11.5px;';
    empty.textContent = 'No open editors';
    container.appendChild(empty);
    return;
  }

  tabs.forEach((path) => {
    const tab = document.createElement('div');
    tab.className = 'wb-tab' + (path === active ? ' active' : '');
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', path === active ? 'true' : 'false');
    tab.tabIndex = path === active ? 0 : -1;
    tab.title = path;

    const label = document.createElement('span');
    label.className = 'wb-tab-label';
    label.textContent = basename(path);
    tab.appendChild(label);

    const dirty = workspace.isDirty(path);
    const close = document.createElement('button');
    close.className = 'wb-tab-close';
    close.setAttribute('aria-label', dirty ? `Close ${basename(path)} (unsaved)` : `Close ${basename(path)}`);
    close.innerHTML = dirty ? '<span class="wb-dirty-dot" title="Unsaved changes"></span>' : '×';
    close.addEventListener('click', (e) => { e.stopPropagation(); requestClose(path); });
    tab.appendChild(close);

    // Middle-click closes (VS Code convention).
    tab.addEventListener('auxclick', (e) => { if (e.button === 1) requestClose(path); });

    tab.addEventListener('click', () => editorGroup.setActive(path));

    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editorGroup.setActive(path); }
    });

    // Context menu via custom event handled in workbench orchestrator.
    tab.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const { showTabMenu } = window.__wb || {};
      if (typeof showTabMenu === 'function') showTabMenu(e, path);
    });

    container.appendChild(tab);
  });

  // Keep active tab visible on overflow.
  const activeEl = container.querySelector('.wb-tab.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

export { render, requestClose };
