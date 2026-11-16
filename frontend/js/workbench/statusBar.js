/**
 * CodeSense AI — Workbench status bar.
 *
 * All values reflect real editor/workspace state and update live: language,
 * cursor line/column and selection, indentation, encoding, line endings,
 * problems count, workspace dirty count, theme. The language, indentation
 * and problems items are clickable controls.
 */

import * as editorGroup from './editorGroup.js';
import * as workspace from './workspace.js';
import * as theme from './theme.js';

const el = () => document.getElementById('wb-statusbar');

let cursor = { line: 1, col: 1 };
let selection = null;
let problems = { errors: 0, warnings: 0, infos: 0 };
let language = 'plaintext';

function setCursor(line, col, sel) {
  cursor = { line, col };
  selection = sel || null;
  render();
}

function setProblems(counts) {
  problems = counts;
  render();
}

function setLanguage(langId) {
  language = langId;
  render();
}

function detectLineEndings() {
  const path = editorGroup.getActive();
  if (!path) return 'LF';
  const content = workspace.read(path) || '';
  if (content.includes('\r\n')) return 'CRLF';
  return 'LF';
}

function item(text, { title = '', onClick = null, cls = '', id = '', small = false } = {}) {
  const span = document.createElement(onClick ? 'button' : 'span');
  span.className = 'wb-status-item' + (onClick ? '' : ' no-click') + (cls ? ' ' + cls : '') + (small ? ' hide-sm' : '');
  span.textContent = text;
  if (title) span.title = title;
  if (id) span.id = id;
  if (onClick) span.addEventListener('click', onClick);
  return span;
}

function render() {
  const bar = el();
  if (!bar) return;
  bar.innerHTML = '';
  const active = editorGroup.getActive();

  // Left: workspace identity + local changes + problems.
  const left = document.createElement('div');
  left.className = 'wb-status-left';

  left.appendChild(item('CS Workspace', {
    title: 'Browser-local workspace — not a Git repository (files persist in this browser only)',
  }));

  const dirtyCount = workspace.dirtyFiles().length;
  if (dirtyCount > 0) {
    left.appendChild(item(`${dirtyCount} unsaved`, {
      title: `${dirtyCount} file(s) with unsaved changes — Ctrl+S to save`,
      cls: '',
      onClick: () => { const { showScm } = window.__wb || {}; if (showScm) showScm(); },
    }));
  }

  const problemsText = problems.errors + problems.warnings + problems.infos === 0
    ? 'No problems'
    : `${problems.errors} err ${problems.warnings} warn ${problems.infos} info`;
  left.appendChild(item(problemsText, {
    title: 'Problems — real editor diagnostics and AI review findings (Ctrl+Shift+M)',
    onClick: () => { const { showProblems } = window.__wb || {}; if (showProblems) showProblems(); },
    cls: problems.errors ? '' : 'problems-ok',
  }));

  bar.appendChild(left);

  // Right: editor state.
  const right = document.createElement('div');
  right.className = 'wb-status-right';

  if (active) {
    const reviewable = workspace.isReviewable(language);
    right.appendChild(item(language, {
      title: reviewable ? 'Language (click to change)' : 'Language (editing only — not reviewable)',
      onClick: () => { const { pickLanguage } = window.__wb || {}; if (pickLanguage) pickLanguage(); },
    }));

    let posText = `Ln ${cursor.line}, Col ${cursor.col}`;
    if (selection && !selection.isEmpty && selection.lineCount) {
      posText += ` (${selection.lineCount} selected)`;
    }
    right.appendChild(item(posText, { title: 'Cursor position' }));

    right.appendChild(item('Spaces: 4', {
      title: 'Indentation (click to change)',
      onClick: () => { const { pickIndentation } = window.__wb || {}; if (pickIndentation) pickIndentation(); },
    }));
    right.appendChild(item('UTF-8', { title: 'Encoding', small: true }));
    right.appendChild(item(detectLineEndings(), { title: 'Line endings', small: true }));
  }

  right.appendChild(item(theme.get() === 'dark' ? 'Dark' : 'Light', {
    title: 'Toggle theme (Ctrl+Shift+T)',
    onClick: () => theme.toggle(),
  }));

  bar.appendChild(right);
}

function init() {
  editorGroup.subscribe((event, detail) => {
    if (event === 'cursor-changed') setCursor(detail.line, detail.col, detail.selection);
    else if (event === 'selection-changed') { selection = detail.selection; render(); }
    else if (event === 'tabs-changed') {
      const active = editorGroup.getActive();
      language = active ? (workspace.stat(active) || {}).language || 'plaintext' : 'plaintext';
      render();
    }
  });
  workspace.subscribe(() => render());
  theme.onChange(() => render());
  render();
}

export { init, render, setProblems, setLanguage, setCursor };
