/**
 * CodeSense AI — Bottom panel: Problems, Output, Terminal.
 *
 * - Problems aggregates REAL sources only: Monaco editor diagnostics (JS/TS
 *   syntax checks via Monaco's language services) and AI review findings,
 *   each clearly labeled by source. Filters by severity and source.
 * - Output shows real workbench/AI event logs.
 * - Terminal shows the truthful "not available" state with the architecture
 *   required for a real terminal (no simulated console).
 */

import * as editorGroup from './editorGroup.js';
import * as aiReviewPanel from './panels/aiReviewPanel.js';
import * as activityBar from './activityBar.js';
import * as outputChannel from './outputChannel.js';
import * as statusBar from './statusBar.js';
import { log } from './outputChannel.js';

let activeTab = 'problems';
let filterSeverity = 'all'; // all | error | warning | info
let filterSource = 'all';   // all | editor | AI Review
let isOpen = true;

const panels = {
  problems: { id: 'wb-pane-problems', tab: 'wb-bottom-tab-problems' },
  output: { id: 'wb-pane-output', tab: 'wb-bottom-tab-output' },
  terminal: { id: 'wb-pane-terminal', tab: 'wb-bottom-tab-terminal' },
};

function showTab(tabId) {
  activeTab = tabId;
  isOpen = true;
  render();
}

function toggle() {
  isOpen = !isOpen;
  render();
}

function openPanel() {
  isOpen = true;
  render();
}

function render() {
  const bottom = document.getElementById('wb-bottom');
  if (!bottom) return;
  bottom.classList.toggle('hidden', !isOpen);

  for (const [key, p] of Object.entries(panels)) {
    const tab = document.getElementById(p.tab);
    if (tab) {
      tab.classList.toggle('active', activeTab === key && isOpen);
      tab.setAttribute('aria-selected', activeTab === key && isOpen ? 'true' : 'false');
    }
    const pane = document.getElementById(p.id);
    if (pane) pane.classList.toggle('active', activeTab === key && isOpen);
  }

  if (isOpen) {
    if (activeTab === 'problems') renderProblems();
    else if (activeTab === 'output') renderOutput();
    else if (activeTab === 'terminal') renderTerminal();
  }
}

// --- Problems ---

async function collectProblems() {
  const editorMarkers = editorGroup.getMarkers().map((m) => ({ ...m, source: 'Editor' }));
  const aiFindings = await aiReviewPanel.getProblemFindings();
  let all = [...editorMarkers, ...aiFindings];
  if (filterSeverity !== 'all') all = all.filter((p) => p.severity === filterSeverity);
  if (filterSource !== 'all') all = all.filter((p) => p.source === filterSource);
  return { editorMarkers, aiFindings, filtered: all };
}

async function renderProblems() {
  const pane = document.getElementById('wb-pane-problems');
  if (!pane) return;

  const { editorMarkers, aiFindings, filtered } = await collectProblems();
  const counts = {
    errors: [...editorMarkers, ...aiFindings].filter((p) => p.severity === 'error').length,
    warnings: [...editorMarkers, ...aiFindings].filter((p) => p.severity === 'warning').length,
    infos: [...editorMarkers, ...aiFindings].filter((p) => p.severity === 'info').length,
  };
  statusBar.setProblems(counts);
  activityBar.setProblemsCount(counts.errors + counts.warnings + counts.infos);

  pane.innerHTML = '';

  // Filters.
  const filters = document.createElement('div');
  filters.className = 'wb-problems-filters';

  const sevSelect = document.createElement('select');
  sevSelect.className = 'wb-input';
  sevSelect.style.width = 'auto';
  sevSelect.setAttribute('aria-label', 'Filter by severity');
  [['all', 'All severities'], ['error', 'Errors'], ['warning', 'Warnings'], ['info', 'Infos']].forEach(([v, l]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = l;
    if (v === filterSeverity) o.selected = true;
    sevSelect.appendChild(o);
  });
  sevSelect.addEventListener('change', () => { filterSeverity = sevSelect.value; renderProblems(); });
  filters.appendChild(sevSelect);

  const srcSelect = document.createElement('select');
  srcSelect.className = 'wb-input';
  srcSelect.style.width = 'auto';
  srcSelect.setAttribute('aria-label', 'Filter by source');
  [['all', 'All sources'], ['Editor', 'Editor diagnostics'], ['AI Review', 'AI review findings']].forEach(([v, l]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = l;
    if (v === filterSource) o.selected = true;
    srcSelect.appendChild(o);
  });
  srcSelect.addEventListener('change', () => { filterSource = srcSelect.value; renderProblems(); });
  filters.appendChild(srcSelect);

  const total = document.createElement('span');
  total.style.cssText = 'margin-left:auto;align-self:center;color:var(--text-muted);font-size:11px;';
  total.textContent = `${counts.errors} errors · ${counts.warnings} warnings · ${counts.infos} infos`;
  filters.appendChild(total);

  pane.appendChild(filters);

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'wb-empty';
    empty.textContent = 'No problems match the current filters. Editor diagnostics cover JavaScript/ TypeScript syntax (Monaco language services); AI findings appear after running a review.';
    pane.appendChild(empty);
    return;
  }

  const groupByPath = new Map();
  filtered.forEach((p) => {
    if (!groupByPath.has(p.path)) groupByPath.set(p.path, []);
    groupByPath.get(p.path).push(p);
  });

  groupByPath.forEach((problems, path) => {
    const head = document.createElement('div');
    head.className = 'wb-problems-group-head';
    head.textContent = `${path} (${problems.length})`;
    pane.appendChild(head);

    problems.sort((a, b) => a.line - b.line).forEach((p) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'wb-problem-row';
      row.innerHTML = `<span class="wb-problem-icon ${p.severity === 'error' ? 'err' : p.severity === 'warning' ? 'warn' : 'info'}">
          ${p.severity === 'error' ? '✕' : p.severity === 'warning' ? '⚠' : 'ⓘ'}</span>
        <span class="wb-problem-msg">${escapeHtml(p.message)}</span>
        <span class="wb-problem-loc">Ln ${p.line}${p.col ? ', Col ' + p.col : ''}</span>
        <span class="wb-problem-src">${escapeHtml(p.source)}</span>`;
      row.title = `${p.message} — ${p.source}`;
      row.addEventListener('click', () => {
        if (p.source === 'AI Review' && p.finding) {
          aiReviewPanel.navigateToFinding(p.finding);
        } else {
          editorGroup.revealLine(p.path, p.line, { col: p.col });
        }
      });
      pane.appendChild(row);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// --- Output ---

function renderOutput() {
  const pane = document.getElementById('wb-pane-output');
  if (!pane) return;
  pane.innerHTML = '';

  const channelBar = document.createElement('div');
  channelBar.className = 'wb-problems-filters';
  const select = document.createElement('select');
  select.className = 'wb-input';
  select.style.width = 'auto';
  select.setAttribute('aria-label', 'Output channel');
  outputChannel.listChannels().forEach((c) => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    if (c === outputChannel.getActive()) o.selected = true;
    select.appendChild(o);
  });
  select.addEventListener('change', () => { outputChannel.setActive(select.value); renderOutput(); });
  channelBar.appendChild(select);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'wb-btn';
  clearBtn.style.height = '24px';
  clearBtn.style.marginLeft = 'auto';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => { outputChannel.clear(outputChannel.getActive()); renderOutput(); });
  channelBar.appendChild(clearBtn);
  pane.appendChild(channelBar);

  const box = document.createElement('div');
  box.className = 'wb-output-channel';
  const lines = outputChannel.getLines(outputChannel.getActive());
  if (!lines.length) {
    box.textContent = `No output yet on the "${outputChannel.getActive()}" channel. Real events (saves, reviews, navigation) appear here.`;
  } else {
    box.innerHTML = lines.map((l) =>
      `<div><span class="t">${l.time.toLocaleTimeString()}</span> ${escapeHtml(l.message)}</div>`
    ).join('');
  }
  pane.appendChild(box);
  box.scrollTop = box.scrollHeight;
}

// --- Terminal (truthful unavailable state) ---

function renderTerminal() {
  const pane = document.getElementById('wb-pane-terminal');
  if (!pane) return;
  pane.innerHTML = '';
  const state = document.createElement('div');
  state.className = 'wb-terminal-state';
  state.innerHTML = `
    <strong>Integrated terminal is not available in this environment.</strong>
    <p>This panel does not simulate a shell and will not fake terminal output.
    Connecting a browser terminal to the application server's shell would let
    submitted code execute with server privileges — an unacceptable risk.</p>
    <h4>Architecture required for a real terminal</h4>
    <ul>
      <li>An isolated per-session container/VM sandbox (not the Express host).</li>
      <li>Resource limits: CPU, memory, process count, wall-clock timeout.</li>
      <li>Deny-by-default network policy and ephemeral, size-capped filesystems.</li>
      <li>Authenticated WebSocket gateway with per-command audit logging and output caps.</li>
      <li>Guaranteed teardown after each session.</li>
    </ul>
    <p>The UI remains ready for a future integration — see
    <code>docs/architecture/IDE_WORKBENCH_ARCHITECTURE.md</code>.</p>
  `;
  pane.appendChild(state);
}

async function refreshProblems() {
  if (activeTab === 'problems' && isOpen) renderProblems();
  else {
    // Still refresh badge/counts when panel is closed.
    const { editorMarkers, aiFindings } = await collectProblems();
    const counts = {
      errors: [...editorMarkers, ...aiFindings].filter((p) => p.severity === 'error').length,
      warnings: [...editorMarkers, ...aiFindings].filter((p) => p.severity === 'warning').length,
      infos: [...editorMarkers, ...aiFindings].filter((p) => p.severity === 'info').length,
    };
    statusBar.setProblems(counts);
    activityBar.setProblemsCount(counts.errors + counts.warnings + counts.infos);
  }
}

// --- Resize ---

function initResize() {
  const resizer = document.getElementById('wb-bottom-resizer');
  const bottom = document.getElementById('wb-bottom');
  if (!resizer || !bottom) return;

  let startY = 0;
  let startHeight = 0;

  function onMove(e) {
    const dy = startY - e.clientY;
    const next = Math.min(Math.max(startHeight + dy, 100), window.innerHeight - 220);
    bottom.style.height = next + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startY = e.clientY;
    startHeight = bottom.getBoundingClientRect().height;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  resizer.addEventListener('keydown', (e) => {
    const current = bottom.getBoundingClientRect().height;
    if (e.key === 'ArrowUp') { e.preventDefault(); bottom.style.height = Math.min(current + 40, window.innerHeight - 220) + 'px'; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); bottom.style.height = Math.max(current - 40, 100) + 'px'; }
  });
}

// --- Init ---

function init() {
  ['problems', 'output', 'terminal'].forEach((key) => {
    const tab = document.getElementById(panels[key].tab);
    if (tab) tab.addEventListener('click', () => showTab(key));
  });

  const closeBtn = document.getElementById('wb-bottom-close');
  if (closeBtn) closeBtn.addEventListener('click', () => { isOpen = false; render(); });

  initResize();

  editorGroup.subscribe((event) => {
    if (event === 'markers-changed') refreshProblems();
    else if (event === 'tabs-changed') refreshProblems();
  });
  aiReviewPanel.onChange(() => refreshProblems());
  outputChannel.onChange(() => { if (activeTab === 'output' && isOpen) renderOutput(); });

  log('workbench', 'Workbench initialized');
  render();
}

export { init, render, showTab, toggle, openPanel, refreshProblems };
