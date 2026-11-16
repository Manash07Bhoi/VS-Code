/**
 * CodeSense AI — Workbench editor group.
 *
 * One Monaco editor instance with one model per workspace file, a tab strip
 * (multiple open files, dirty indicators, close/close-others), cursor /
 * marker events for the status bar and problems panel, and the diff viewer
 * overlay used by Source Control and AI proposals.
 */

import * as monacoLoader from './monacoLoader.js';
import * as workspace from './workspace.js';
import * as theme from './theme.js';
import * as commands from './commands.js';
import { log } from './outputChannel.js';

let monaco = null;
let editor = null;
let diffEditor = null;

const models = new Map();      // path -> monaco.ITextModel
const openTabs = [];           // ordered paths
let activePath = null;

const TABS_STORAGE_KEY = 'codesense-workbench-tabs-v1';

const listeners = new Set();
function emit(event, detail = {}) {
  listeners.forEach((fn) => { try { fn(event, detail); } catch (_e) { /* isolated */ } });
}
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// --- Tabs persistence ---

function persistTabs() {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify({ openTabs, activePath }));
  } catch (_e) { /* non-fatal */ }
}

function restoreTabs() {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.openTabs)) {
      parsed.openTabs.filter((p) => workspace.exists(p)).slice(0, 12).forEach((p) => openTab(p, { silent: true }));
    }
    if (parsed.activePath && openTabs.includes(parsed.activePath)) {
      setActive(parsed.activePath, { silent: true });
    } else if (openTabs.length) {
      setActive(openTabs[0], { silent: true });
    }
  } catch (_e) { /* non-fatal */ }
}

// --- Model management ---

function getModel(path) {
  if (models.has(path)) return models.get(path);
  const file = workspace.stat(path);
  if (!file) return null;
  const uri = monaco.Uri.parse('inmemory://workspace/' + encodeURI(path));
  const model = monaco.editor.createModel(file.content, file.language, uri);
  model.onDidChangeContent(() => {
    workspace.write(path, model.getValue());
    emit('tab-dirty-changed', { path });
  });
  models.set(path, model);
  return model;
}

function disposeModel(path) {
  const model = models.get(path);
  if (model) {
    model.dispose();
    models.delete(path);
  }
}

function ensureLanguage(path) {
  const file = workspace.stat(path);
  const model = models.get(path);
  if (file && model && model.getLanguageId() !== file.language) {
    monaco.editor.setModelLanguage(model, file.language);
  }
}

// --- Tab operations ---

function openTab(path, { silent = false } = {}) {
  if (!workspace.exists(path)) return false;
  if (!openTabs.includes(path)) {
    openTabs.push(path);
    if (openTabs.length > 12) {
      // Soft cap: close the least-recently-opened inactive clean tab.
      const victim = openTabs.find((p) => p !== path && !workspace.isDirty(p));
      if (victim) closeTab(victim, { silent: true });
    }
  }
  setActive(path, { silent });
  if (!silent) emit('tabs-changed');
  return true;
}

function setActive(path, { silent = false } = {}) {
  if (!openTabs.includes(path)) return;
  activePath = path;
  ensureLanguage(path);
  const model = getModel(path);
  if (editor && model) editor.setModel(model);
  if (!silent) emit('tabs-changed');
  persistTabs();
}

function closeTab(path, { silent = false } = {}) {
  const idx = openTabs.indexOf(path);
  if (idx === -1) return;
  if (workspace.isDirty(path) && !silent) {
    // Caller (UI) must confirm before calling closeTab for dirty files.
  }
  openTabs.splice(idx, 1);
  disposeModel(path);
  if (activePath === path) {
    const next = openTabs[Math.min(idx, openTabs.length - 1)] || null;
    activePath = null;
    if (next) setActive(next, { silent: true });
    else if (editor) editor.setModel(null);
  }
  if (!silent) emit('tabs-changed');
  persistTabs();
}

function closeOthers(path) {
  openTabs.slice().forEach((p) => { if (p !== path) closeTab(p, { silent: true }); });
  emit('tabs-changed');
  persistTabs();
}

function closeAll() {
  openTabs.slice().forEach((p) => closeTab(p, { silent: true }));
  emit('tabs-changed');
  persistTabs();
}

function getActive() {
  return activePath;
}

function getOpenTabs() {
  return openTabs.slice();
}

// Rename/delete sync: workspace events update open tabs and models.
function onWorkspaceEvent(event, detail) {
  if (event === 'file-renamed') {
    const { oldPath, newPath } = detail;
    const idx = openTabs.indexOf(oldPath);
    if (idx >= 0) {
      openTabs[idx] = newPath;
      if (activePath === oldPath) activePath = newPath;
      disposeModel(oldPath);
      const model = getModel(newPath);
      if (editor && activePath === newPath && model) editor.setModel(model);
      emit('tabs-changed');
      persistTabs();
    }
  } else if (event === 'files-changed') {
    if (detail.path && !workspace.exists(detail.path)) {
      closeTab(detail.path, { silent: true });
    }
    emit('tabs-changed');
  }
}

// --- Selection helpers ---

function getSelection() {
  if (!editor) return null;
  const sel = editor.getSelection();
  if (!sel) return null;
  const model = editor.getModel();
  const isEmpty = sel.isEmpty();
  return {
    startLine: sel.startLineNumber,
    startCol: sel.startColumn,
    endLine: sel.endLineNumber,
    endCol: sel.endColumn,
    lineCount: sel.endLineNumber - sel.startLineNumber + 1,
    isEmpty,
    text: model ? model.getValueInRange(sel) : '',
  };
}

function getActiveContent() {
  if (!activePath) return null;
  return workspace.read(activePath);
}

// Current indentation (spaces) — kept in sync with the editor options so the
// status bar can display the real value instead of a hardcoded one.
let indentSize = 4;

function getIndentation() {
  return indentSize;
}

function setIndentation(size) {
  const n = parseInt(size, 10);
  if (![2, 4, 8].includes(n)) return;
  indentSize = n;
  if (editor) editor.updateOptions({ tabSize: n, insertSpaces: true });
}

function revealLine(path, line, { endLine = null, col = null } = {}) {
  openTab(path);
  requestAnimationFrame(() => {
    const model = editor && editor.getModel();
    if (!model) return;
    const total = model.getLineCount();
    const target = Math.min(Math.max(1, line), total);
    const range = {
      startLineNumber: target,
      startColumn: col || 1,
      endLineNumber: endLine ? Math.min(endLine, total) : target,
      endColumn: col || 1000,
    };
    editor.setSelection(range);
    editor.revealRangeInCenter(range, monaco.editor.ScrollType.Smooth);
    editor.focus();
  });
}

// --- Markers (real editor diagnostics) ---

function getMarkers() {
  const all = [];
  for (const model of models.values()) {
    const path = model.uri.path.replace(/^\/workspace\//, '') || activePath;
    const decoded = decodeURIComponent(model.uri.path.replace(/^\//, ''));
    const filePath = decoded.startsWith('workspace/') ? decoded.slice('workspace/'.length) : decoded;
    monaco.editor.getModelMarkers({ resource: model.uri }).forEach((m) => {
      all.push({
        path: filePath,
        severity: m.severity === monaco.MarkerSeverity.Error ? 'error' :
          m.severity === monaco.MarkerSeverity.Warning ? 'warning' : 'info',
        message: m.message,
        line: m.startLineNumber,
        col: m.startColumn,
        source: m.source || 'editor',
      });
    });
  }
  return all;
}

// --- Diff viewer ---

function showDiff({ title, original, modified, language, note = '', mode = 'review', onAccept = null }) {
  const host = document.getElementById('wb-diff-host');
  const wrap = document.getElementById('wb-diff-editor-wrap');
  const titleEl = document.getElementById('wb-diff-title');
  const noteEl = document.getElementById('wb-diff-note');
  const acceptBtn = document.getElementById('wb-diff-accept');
  const rejectBtn = document.getElementById('wb-diff-reject');
  if (!host || !wrap) return;

  titleEl.textContent = title;
  noteEl.textContent = note;
  host.hidden = false;
  host.classList.add('visible');

  const originalModel = monaco.editor.createModel(original, language);
  const modifiedModel = monaco.editor.createModel(modified, language);
  if (!diffEditor) {
    diffEditor = monaco.editor.createDiffEditor(wrap, {
      automaticLayout: true,
      readOnly: true,
      renderSideBySide: true,
      originalEditable: false,
      fontSize: 13,
      fontFamily: '"Fira Mono", "Consolas", "Monaco", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
    });
  }
  diffEditor.setModel({ original: originalModel, modified: modifiedModel });

  if (mode === 'proposal' && onAccept) {
    acceptBtn.hidden = false;
    rejectBtn.hidden = false;
    const handler = () => {
      cleanup();
      onAccept(modifiedModel.getValue());
    };
    const rejectHandler = () => { cleanup(); closeDiff(); };
    function cleanup() {
      acceptBtn.removeEventListener('click', handler);
      rejectBtn.removeEventListener('click', rejectHandler);
      acceptBtn.hidden = true;
      rejectBtn.hidden = true;
    }
    acceptBtn.addEventListener('click', handler);
    rejectBtn.addEventListener('click', rejectHandler);
  } else {
    acceptBtn.hidden = true;
    rejectBtn.hidden = true;
  }
  log('workbench', `Diff opened: ${title}`);
}

function closeDiff() {
  const host = document.getElementById('wb-diff-host');
  if (!host) return;
  host.hidden = true;
  host.classList.remove('visible');
  if (diffEditor) {
    const model = diffEditor.getModel();
    diffEditor.setModel(null);
    if (model) { model.original.dispose(); model.modified.dispose(); }
  }
}

function isDiffVisible() {
  const host = document.getElementById('wb-diff-host');
  return !!(host && !host.hidden);
}

// --- Editor actions ---

function triggerEditorAction(actionId) {
  if (!editor) return false;
  const action = editor.getAction(actionId);
  if (!action) return false;
  action.run();
  return true;
}

function focus() {
  if (editor) editor.focus();
}

// --- Init ---

async function init() {
  monaco = await monacoLoader.load();

  const host = document.getElementById('wb-editor-host');
  editor = monaco.editor.create(host, {
    theme: theme.monacoTheme(),
    automaticLayout: true,
    lineNumbers: 'on',
    minimap: { enabled: true, renderCharacters: false },
    folding: true,
    bracketPairColorization: { enabled: true },
    matchBrackets: 'always',
    renderWhitespace: 'selection',
    wordWrap: 'off',
    fontSize: 13,
    fontFamily: '"Fira Mono", "Consolas", "Monaco", monospace',
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: false,
    scrollBeyondLastLine: true,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSurroundingLines: 3,
    suggestSelection: 'first',
    autoClosingBrackets: 'languageDefined',
    autoClosingQuotes: 'languageDefined',
    autoIndent: 'full',
    formatOnPaste: true,
    multiCursorModifier: 'altKey',
    accessibilitySupport: 'auto',
  });

  theme.onChange((t) => monaco.editor.setTheme(theme.monacoTheme()));

  editor.onDidChangeCursorPosition((e) => emit('cursor-changed', {
    line: e.position.lineNumber,
    col: e.position.column,
    selection: getSelection(),
  }));

  editor.onDidChangeCursorSelection(() => emit('selection-changed', { selection: getSelection() }));

  // Propagate marker changes to the problems panel.
  monaco.editor.onDidChangeMarkers(() => emit('markers-changed', {}));

  workspace.subscribe(onWorkspaceEvent);
  restoreTabs();
  emit('tabs-changed');
  return editor;
}

export {
  init, subscribe, openTab, setActive, closeTab, closeOthers, closeAll,
  getActive, getOpenTabs, getSelection, getActiveContent, revealLine,
  getMarkers, showDiff, closeDiff, isDiffVisible, triggerEditorAction, focus,
  getIndentation, setIndentation,
  ensureLanguage,
};
