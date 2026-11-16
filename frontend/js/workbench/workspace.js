/**
 * CodeSense AI — Workbench workspace model.
 *
 * Browser-local multi-file workspace persisted to localStorage. This is
 * explicitly NOT a Git repository and NOT server-persisted storage: it is a
 * local editing workspace (clearly labeled as such in the UI). Review
 * submissions continue to go through the authenticated backend API.
 *
 * Model:
 *   { version: 1,
 *     files: { "<path>": { content, savedContent, language, createdAt, updatedAt } },
 *     checkpoints: [ { id, label, createdAt, files: { path: savedContent } } ] }
 */

const STORAGE_KEY = 'codesense-workbench-v1';
const MAX_FILES = 200;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024; // 2 MiB workspace cap

const listeners = new Set();
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || typeof parsed.files !== 'object') {
      return freshState();
    }
    return parsed;
  } catch (_e) {
    return freshState();
  }
}

function freshState() {
  return { version: 1, files: {}, checkpoints: [] };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Quota exceeded or storage unavailable: workspace stays in-memory only.
    emit('storage-error', { message: err.message });
  }
}

function emit(event, detail = {}) {
  listeners.forEach((fn) => {
    try { fn(event, detail); } catch (_e) { /* listener errors are isolated */ }
  });
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// --- Language detection from path ---

const EXT_LANGUAGE = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python',
  java: 'java',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hh: 'cpp', c: 'cpp', h: 'cpp',
  json: 'json', md: 'markdown', markdown: 'markdown',
  html: 'html', htm: 'html', css: 'css',
  txt: 'plaintext',
};

// Languages the backend review engine accepts (canonical IDs from
// backend/src/config/languages.js). Other files can be edited but not
// reviewed — the UI disables review actions honestly.
const REVIEWABLE = new Set(['javascript', 'typescript', 'python', 'java', 'cpp']);

function detectLanguage(path) {
  const ext = (path.split('.').pop() || '').toLowerCase();
  return EXT_LANGUAGE[ext] || 'plaintext';
}

function isReviewable(languageId) {
  return REVIEWABLE.has(languageId);
}

// --- Validation ---

function validatePath(path) {
  if (typeof path !== 'string') throw new Error('Path must be a string.');
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  if (!trimmed) throw new Error('Path must not be empty.');
  if (trimmed.length > 200) throw new Error('Path is too long (max 200 characters).');
  if (trimmed.split('/').some((seg) => seg === '' || seg === '.' || seg === '..')) {
    throw new Error('Path contains invalid segments.');
  }
  if (!/^[\w .-]+(\/[\w .-]+)*$/.test(trimmed)) {
    throw new Error('Path may only contain letters, digits, spaces, dots, dashes and slashes.');
  }
  return trimmed;
}

// --- File operations ---

function list() {
  return Object.keys(state.files).sort();
}

function exists(path) {
  return Object.prototype.hasOwnProperty.call(state.files, path);
}

function stat(path) {
  return state.files[path] || null;
}

function read(path) {
  const f = state.files[path];
  return f ? f.content : null;
}

function createFile(path, content = '') {
  path = validatePath(path);
  if (exists(path)) throw new Error(`A file named "${path}" already exists.`);
  if (Object.keys(state.files).length >= MAX_FILES) {
    throw new Error(`Workspace file limit reached (${MAX_FILES}).`);
  }
  state.files[path] = {
    content,
    savedContent: null, // never saved yet => "unsaved to workspace"
    language: detectLanguage(path),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  persist();
  emit('files-changed');
  return path;
}

function write(path, content) {
  const f = state.files[path];
  if (!f) throw new Error(`File not found: ${path}`);
  f.content = content;
  f.updatedAt = Date.now();
  persist();
  emit('content-changed', { path });
}

function save(path) {
  const f = state.files[path];
  if (!f) throw new Error(`File not found: ${path}`);
  const total = Object.entries(state.files).reduce(
    (acc, [p, v]) => acc + (p === path ? new Blob([v.content]).size : new Blob([v.savedContent || '']).size), 0);
  if (total > MAX_TOTAL_BYTES) {
    throw new Error('Workspace size limit exceeded (2 MiB). Remove unused files first.');
  }
  f.savedContent = f.content;
  f.updatedAt = Date.now();
  persist();
  emit('file-saved', { path });
  return true;
}

function saveAll() {
  const dirty = dirtyFiles();
  dirty.forEach((p) => { state.files[p].savedContent = state.files[p].content; });
  if (dirty.length) {
    persist();
    emit('files-saved', { paths: dirty });
  }
  return dirty;
}

function rename(oldPath, newPath) {
  newPath = validatePath(newPath);
  const f = state.files[oldPath];
  if (!f) throw new Error(`File not found: ${oldPath}`);
  if (exists(newPath)) throw new Error(`A file named "${newPath}" already exists.`);
  delete state.files[oldPath];
  const moved = { ...f, language: detectLanguage(newPath), updatedAt: Date.now() };
  state.files[newPath] = moved;
  persist();
  emit('file-renamed', { oldPath, newPath });
  return newPath;
}

function remove(path) {
  if (!exists(path)) throw new Error(`File not found: ${path}`);
  delete state.files[path];
  persist();
  emit('files-changed', { path });
}

function isDirty(path) {
  const f = state.files[path];
  if (!f) return false;
  return f.savedContent !== f.content;
}

function dirtyFiles() {
  return Object.keys(state.files).filter((p) => isDirty(p));
}

// Files that differ from the newest checkpoint (or that have never been
// checkpointed) — the "Source Control" view's honest local change list.
function changedSinceCheckpoint() {
  const newest = state.checkpoints[0];
  const changes = [];
  for (const [path, f] of Object.entries(state.files)) {
    const baseline = newest ? newest.files[path] : undefined;
    if (baseline === undefined) {
      changes.push({ path, status: 'added' });
    } else if (baseline !== f.content) {
      changes.push({ path, status: 'modified' });
    }
  }
  if (newest) {
    for (const path of Object.keys(newest.files)) {
      if (!exists(path)) changes.push({ path, status: 'deleted' });
    }
  }
  return changes;
}

function checkpointBaseline(path) {
  const newest = state.checkpoints[0];
  return newest ? (newest.files[path] !== undefined ? newest.files[path] : null) : null;
}

function createCheckpoint(label) {
  const files = {};
  for (const [path, f] of Object.entries(state.files)) {
    files[path] = f.content;
  }
  const cp = {
    id: `cp-${Date.now().toString(36)}`,
    label: label || `Local checkpoint`,
    createdAt: Date.now(),
    files,
  };
  state.checkpoints.unshift(cp);
  if (state.checkpoints.length > 10) state.checkpoints.length = 10; // keep last 10
  persist();
  emit('checkpoint-created', { id: cp.id });
  return cp;
}

function listCheckpoints() {
  return state.checkpoints.slice();
}

// --- Search across files ---

function searchAll({ query, caseSensitive = false, regex = false }) {
  if (!query) return [];
  let matcher;
  if (regex) {
    let re;
    try {
      re = new RegExp(query, caseSensitive ? 'g' : 'gi');
    } catch (_e) {
      return { error: 'Invalid regular expression.' };
    }
    matcher = (line) => { re.lastIndex = 0; return re.test(line) ? line.match(re) : null; };
  } else {
    const needle = caseSensitive ? query : query.toLowerCase();
    matcher = (line) => {
      const hay = caseSensitive ? line : line.toLowerCase();
      const i = hay.indexOf(needle);
      return i >= 0 ? [needle] : null;
    };
  }
  const results = [];
  for (const path of list()) {
    const content = state.files[path].content;
    const lines = content.split('\n');
    const matches = [];
    lines.forEach((line, idx) => {
      const m = matcher(line);
      if (m) matches.push({ line: idx + 1, text: line.length > 300 ? line.slice(0, 300) + '…' : line, length: m[0].length });
    });
    if (matches.length) results.push({ path, matches, total: matches.length });
  }
  return results;
}

function replaceInFile(path, query, replacement, { caseSensitive = false, regex = false } = {}) {
  const content = read(path);
  if (content === null) throw new Error(`File not found: ${path}`);
  let next;
  if (regex) {
    const re = new RegExp(query, caseSensitive ? 'g' : 'gi');
    next = content.replace(re, replacement);
  } else {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
    next = content.replace(re, replacement);
  }
  if (next !== content) write(path, next);
  return next !== content;
}

// --- Import / export ---

function serialize() {
  return JSON.stringify(state);
}

function reset() {
  state = freshState();
  persist();
  emit('files-changed');
}

export {
  list, exists, stat, read, createFile, write, save, saveAll, rename, remove,
  isDirty, dirtyFiles, changedSinceCheckpoint, checkpointBaseline,
  createCheckpoint, listCheckpoints,
  searchAll, replaceInFile,
  detectLanguage, isReviewable, REVIEWABLE, validatePath,
  serialize, reset, subscribe,
};
