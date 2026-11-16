/**
 * CodeSense AI — Search panel.
 *
 * Real search across all workspace files with match counts, per-file
 * grouping, match navigation (opens the file at the line, highlights the
 * match), and replace/replace-all with explicit confirmation.
 */

import * as workspace from '../workspace.js';
import * as editorGroup from '../editorGroup.js';
import { confirmDialog } from '../dialog.js';
import { log } from '../outputChannel.js';

let lastQuery = '';
let caseSensitive = false;
let useRegex = false;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function render(bodyEl) {
  bodyEl.innerHTML = '';

  const form = document.createElement('div');
  form.className = 'wb-search-form';

  const input = document.createElement('input');
  input.className = 'wb-input';
  input.type = 'text';
  input.id = 'wb-search-input';
  input.placeholder = 'Search workspace…';
  input.setAttribute('aria-label', 'Search workspace');
  input.value = lastQuery;
  form.appendChild(input);

  const toggles = document.createElement('div');
  toggles.className = 'wb-search-toggles';

  const csBtn = document.createElement('button');
  csBtn.type = 'button';
  csBtn.className = 'wb-toggle';
  csBtn.textContent = 'Aa';
  csBtn.title = 'Match case';
  csBtn.setAttribute('aria-pressed', String(caseSensitive));
  csBtn.addEventListener('click', () => {
    caseSensitive = !caseSensitive;
    csBtn.setAttribute('aria-pressed', String(caseSensitive));
    runSearch();
  });
  toggles.appendChild(csBtn);

  const reBtn = document.createElement('button');
  reBtn.type = 'button';
  reBtn.className = 'wb-toggle';
  reBtn.textContent = '.*';
  reBtn.title = 'Use regular expression';
  reBtn.setAttribute('aria-pressed', String(useRegex));
  reBtn.addEventListener('click', () => {
    useRegex = !useRegex;
    reBtn.setAttribute('aria-pressed', String(useRegex));
    runSearch();
  });
  toggles.appendChild(reBtn);

  form.appendChild(toggles);

  const replaceInput = document.createElement('input');
  replaceInput.className = 'wb-input';
  replaceInput.type = 'text';
  replaceInput.id = 'wb-search-replace';
  replaceInput.placeholder = 'Replace with…';
  replaceInput.setAttribute('aria-label', 'Replace with');
  form.appendChild(replaceInput);

  bodyEl.appendChild(form);

  const summary = document.createElement('div');
  summary.className = 'wb-search-summary';
  summary.id = 'wb-search-summary';
  bodyEl.appendChild(summary);

  const results = document.createElement('div');
  results.id = 'wb-search-results';
  bodyEl.appendChild(results);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runSearch(); }
  });

  if (lastQuery) runSearch();
}

function runSearch() {
  lastQuery = (document.getElementById('wb-search-input') || {}).value || lastQuery;
  const summary = document.getElementById('wb-search-summary');
  const results = document.getElementById('wb-search-results');
  if (!summary || !results) return;

  results.innerHTML = '';
  if (!lastQuery) {
    summary.textContent = 'Type a query and press Enter.';
    return;
  }

  const res = workspace.searchAll({ query: lastQuery, caseSensitive, regex: useRegex });
  if (res && res.error) {
    summary.textContent = res.error;
    return;
  }

  const totalMatches = res.reduce((acc, f) => acc + f.total, 0);
  summary.textContent = `${totalMatches} match${totalMatches === 1 ? '' : 'es'} in ${res.length} file${res.length === 1 ? '' : 's'}`;

  if (!totalMatches) return;

  res.forEach((file) => {
    const group = document.createElement('div');
    group.className = 'wb-search-file';

    const head = document.createElement('div');
    head.className = 'wb-search-file-head';
    head.innerHTML = `<span class="wb-file-icon" style="color:var(--text-muted)">${file.total}</span> ${escapeHtml(file.path)}`;
    head.title = 'Replace all matches in this file';
    head.addEventListener('click', () => replaceInFileFlow(file.path));
    group.appendChild(head);

    file.matches.slice(0, 50).forEach((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wb-search-match';
      const matchHtml = escapeHtml(m.text)
        .replace(/^(\s*)/, '$1')
        .replace(new RegExp(escapeRegExp(lastQuery), useRegex ? 'g' : 'gi'), (mm) => `<mark>${escapeHtml(mm)}</mark>`);
      btn.innerHTML = `Line ${m.line}: ${matchHtml || '(empty line)'}`;
      btn.title = `${file.path}:${m.line}`;
      btn.addEventListener('click', () => {
        editorGroup.revealLine(file.path, m.line);
      });
      group.appendChild(btn);
    });

    if (file.matches.length > 50) {
      const more = document.createElement('div');
      more.className = 'wb-search-match';
      more.style.cursor = 'default';
      more.textContent = `… ${file.matches.length - 50} more matches`;
      group.appendChild(more);
    }

    results.appendChild(group);
  });
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function replaceInFileFlow(path) {
  const replaceInput = document.getElementById('wb-search-replace');
  const replacement = replaceInput ? replaceInput.value : '';
  const res = workspace.searchAll({ query: lastQuery, caseSensitive, regex: useRegex });
  const file = (res || []).find((f) => f.path === path);
  if (!file) return;
  const ok = await confirmDialog(
    'Replace in file',
    `Replace ${file.total} match${file.total === 1 ? '' : 'es'} in "${path}" with "${replacement}"?`,
    { okLabel: 'Replace' }
  );
  if (!ok) return;
  const changed = workspace.replaceInFile(path, lastQuery, replacement, { caseSensitive, regex: useRegex });
  log('workbench', `Replace in ${path}: ${changed ? 'done' : 'no changes'}`);
  runSearch();
  window.__wb.refreshExplorer();
}

async function replaceAllFlow() {
  const replaceInput = document.getElementById('wb-search-replace');
  const replacement = replaceInput ? replaceInput.value : '';
  const res = workspace.searchAll({ query: lastQuery, caseSensitive, regex: useRegex }) || [];
  const totalMatches = res.reduce((acc, f) => acc + f.total, 0);
  if (!totalMatches) return;
  const ok = await confirmDialog(
    'Replace all',
    `Replace ${totalMatches} match${totalMatches === 1 ? '' : 'es'} across ${res.length} file${res.length === 1 ? '' : 's'} with "${replacement}"?`,
    { okLabel: 'Replace all' }
  );
  if (!ok) return;
  let files = 0;
  res.forEach((f) => {
    if (workspace.replaceInFile(f.path, lastQuery, replacement, { caseSensitive, regex: useRegex })) files += 1;
  });
  log('workbench', `Replace all: ${files} file(s) changed`);
  runSearch();
  window.__wb.refreshExplorer();
}

export { render, runSearch, replaceAllFlow };
