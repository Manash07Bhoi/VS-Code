/**
 * CodeSense AI — Command palette and Quick Open.
 *
 * Ctrl+Shift+P opens the command palette (searches the live command
 * registry). Ctrl+P opens Quick Open (fuzzy file search over the workspace).
 * Keyboard: arrows navigate, Enter executes, Escape closes.
 */

import * as commands from './commands.js';
import * as workspace from './workspace.js';
import * as editorGroup from './editorGroup.js';

const overlayEl = () => document.getElementById('wb-palette-overlay');
const inputEl = () => document.getElementById('wb-palette-input');
const listEl = () => document.getElementById('wb-palette-list');

let mode = 'commands'; // 'commands' | 'files'
let items = [];
let selected = 0;
let lastFocused = null;
let open = false;

function fuzzyScore(query, text) {
  // Simple subsequence fuzzy match with contiguity bonus; returns score or -1.
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak += 1;
      score += 1 + streak * 2;
      if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '/' || t[ti - 1] === '-') score += 3;
      qi += 1;
    } else {
      streak = 0;
    }
  }
  return qi === q.length ? score : -1;
}

function computeItems(query) {
  if (mode === 'commands') {
    const all = commands.list();
    return all
      .map((c) => {
        const label = (c.category ? c.category + ': ' : '') + c.title;
        return { label, category: '', keybinding: c.keybinding, score: fuzzyScore(query, label), run: () => commands.execute(c.id) };
      })
      .filter((it) => it.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
  }
  // Quick open files.
  return workspace.list()
    .map((path) => {
      const base = path.split('/').pop();
      return {
        label: base,
        category: path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '',
        keybinding: '',
        score: Math.max(fuzzyScore(query, base), fuzzyScore(query, path) - 2),
        run: () => editorGroup.openTab(path),
      };
    })
    .filter((it) => it.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}

function renderList() {
  const list = listEl();
  list.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'wb-palette-empty';
    empty.textContent = mode === 'commands' ? 'No matching commands.' : 'No matching files.';
    list.appendChild(empty);
    return;
  }
  items.forEach((it, idx) => {
    const item = document.createElement('button');
    item.className = 'wb-palette-item';
    item.type = 'button';
    item.setAttribute('role', 'option');
    item.dataset.selected = idx === selected ? 'true' : 'false';
    item.setAttribute('aria-selected', idx === selected ? 'true' : 'false');

    const label = document.createElement('span');
    label.className = 'wb-palette-label';
    label.textContent = it.label;
    item.appendChild(label);

    if (it.category) {
      const cat = document.createElement('span');
      cat.className = 'wb-palette-cat';
      cat.textContent = it.category;
      item.appendChild(cat);
    }
    if (it.keybinding) {
      const kbd = document.createElement('span');
      kbd.className = 'wb-palette-kbd';
      kbd.textContent = it.keybinding;
      item.appendChild(kbd);
    }
    item.addEventListener('click', () => executeItem(idx));
    list.appendChild(item);
  });
  const sel = list.querySelector('.wb-palette-item[data-selected="true"]');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

function executeItem(idx) {
  const it = items[idx];
  if (!it) return;
  close();
  try { it.run(); } catch (err) { console.error('[palette] command failed:', err); }
}

function refresh() {
  items = computeItems(inputEl().value.trim());
  selected = items.length ? 0 : -1;
  renderList();
}

function show(which) {
  mode = which;
  open = true;
  lastFocused = document.activeElement;
  const overlay = overlayEl();
  const input = inputEl();
  input.value = '';
  input.placeholder = mode === 'commands' ? 'Type a command…' : 'Search files by name…';
  overlay.hidden = false;
  refresh();
  input.focus();
}

function close() {
  if (!open) return;
  open = false;
  overlayEl().hidden = true;
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

function isOpen() {
  return open;
}

function handleKey(e) {
  if (!open) return;
  if (e.key === 'Escape') { e.preventDefault(); close(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) { selected = (selected + 1) % items.length; renderList(); } }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) { selected = (selected - 1 + items.length) % items.length; renderList(); } }
  else if (e.key === 'Enter') { e.preventDefault(); if (selected >= 0) executeItem(selected); }
}

function init() {
  inputEl().addEventListener('input', refresh);
  overlayEl().addEventListener('mousedown', (e) => {
    if (e.target === overlayEl()) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    handleKey(e);
  });
}

export { init, show, close, isOpen };
