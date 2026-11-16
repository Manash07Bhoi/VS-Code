/**
 * CodeSense AI — AI Review panel.
 *
 * Central review studio in the workbench: review the current file, the
 * selection, or a security-focused pass; explain the selection; generate fix
 * proposals reviewed in the diff viewer. Findings navigate to real source
 * lines and are marked stale when the file changes after the review. The
 * provider-unavailable state is always honest.
 */

import { api } from '../../app/api.js';
import * as workspace from '../workspace.js';
import * as editorGroup from '../editorGroup.js';
import { log } from '../outputChannel.js';
import * as commands from '../commands.js';

let busy = false;
let lastReview = null;   // { path, sourceDigest, reviewId, findings, offsetLine }
let lastExplain = null;  // { path, sourceDigest, result }
const listeners = new Set();

function emitChanged() {
  listeners.forEach((fn) => { try { fn(); } catch (_e) { /* isolated */ } });
}
function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function computeDigest(source) {
  // Browser SubtleCrypto SHA-256 of the reviewed source (for staleness checks).
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))
    .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join(''));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function isReviewableActive() {
  const path = editorGroup.getActive();
  if (!path) return false;
  const file = workspace.stat(path);
  return !!(file && workspace.isReviewable(file.language));
}

function activeFileSource() {
  const path = editorGroup.getActive();
  if (!path) return null;
  return { path, source: workspace.read(path), language: workspace.stat(path).language };
}

function selectionSource() {
  const sel = editorGroup.getSelection();
  if (!sel || sel.isEmpty || !sel.text.trim()) return null;
  const base = activeFileSource();
  if (!base) return null;
  return { ...base, source: sel.text, offsetLine: sel.startLine };
}

// --- Review actions ---

async function runReview({ scope = 'file', focus = null } = {}) {
  if (busy) return;
  let target;
  if (scope === 'selection') {
    target = selectionSource();
    if (!target) {
      setStatus('warn', 'Select some code first (click and drag in the editor), then run Review Selection.');
      return;
    }
  } else {
    target = activeFileSource();
    if (!target || !target.source.trim()) {
      setStatus('warn', 'Open a non-empty file first.');
      return;
    }
    if (!workspace.isReviewable(target.language)) {
      setStatus('warn', `"${target.language}" files can be edited but are not enabled for AI review.`);
      return;
    }
  }

  busy = true;
  setStatus('info', `Reviewing ${scope === 'selection' ? 'selection' : target.path}${focus === 'security' ? ' (security focus)' : ''}…`);
  emitChanged();
  const digest = await computeDigest(target.source);

  try {
    const res = await api.createReview({
      source: target.source,
      language: target.language,
      title: scope === 'selection' ? `Selection from ${target.path}` : target.path,
      focus: focus || undefined,
    });
    busy = false;

    if (res.status === 'failed' || res.providerUnavailable) {
      setStatus('error', res.failureReason || 'The review could not be completed.');
      log('ai-review', `Review failed: ${res.failureReason || 'unknown reason'}`);
      lastReview = null;
      emitChanged();
      return;
    }

    lastReview = {
      path: target.path,
      offsetLine: target.offsetLine || 0,
      sourceDigest: digest,
      reviewId: res.reviewId,
      status: res.status,
      findings: res.findings || [],
      summary: res.summary,
      limitationNotice: res.limitationNotice,
      focus,
    };
    setStatus(res.findings && res.findings.length
      ? 'info'
      : 'info', `${res.findings ? res.findings.length : 0} finding(s) — ${res.summary || 'review complete'}`);
    log('ai-review', `Review of ${target.path} complete: ${res.findings ? res.findings.length : 0} finding(s)`);
    emitChanged();
    window.__wb.refreshProblems();
  } catch (err) {
    busy = false;
    if (err.status === 429) setStatus('error', 'Too many review requests — wait a moment and try again.');
    else if (err.status === 503 || err.code === 'PROVIDER_UNAVAILABLE') setStatus('error', 'AI provider is not configured on the server (honest unavailable state).');
    else if (err.status === 401) setStatus('error', 'Your session expired — sign in again from the dashboard.');
    else setStatus('error', `Review failed: ${err.message || 'network error'}`);
    log('ai-review', `Review error: ${err.message || 'network error'}`);
    emitChanged();
  }
}

async function runExplain() {
  if (busy) return;
  const target = selectionSource() || activeFileSource();
  if (!target || !target.source.trim()) {
    setStatus('warn', 'Open a file (or select code) first.');
    return;
  }
  if (!workspace.isReviewable(target.language)) {
    setStatus('warn', `"${target.language}" is not enabled for AI assistance.`);
    return;
  }
  busy = true;
  setStatus('info', 'Explaining…');
  emitChanged();
  const digest = await computeDigest(target.source);
  try {
    const res = await api.assist({
      action: 'explain',
      source: target.source,
      language: target.language,
      hasSelection: !!target.offsetLine,
    });
    busy = false;
    lastExplain = {
      path: target.path,
      sourceDigest: digest,
      result: res.result,
    };
    setStatus('info', 'Explanation ready.');
    log('ai-review', `Explanation generated for ${target.path}`);
    emitChanged();
  } catch (err) {
    busy = false;
    if (err.status === 503 || err.code === 'PROVIDER_UNAVAILABLE') setStatus('error', 'AI provider is not configured on the server (honest unavailable state).');
    else setStatus('error', `Explain failed: ${err.message || 'network error'}`);
    log('ai-review', `Explain error: ${err.message || 'network error'}`);
    emitChanged();
  }
}

async function runImprove() {
  if (busy) return;
  const target = selectionSource() || activeFileSource();
  if (!target || !target.source.trim()) {
    setStatus('warn', 'Open a file (or select code) first.');
    return;
  }
  if (!workspace.isReviewable(target.language)) {
    setStatus('warn', `"${target.language}" is not enabled for AI assistance.`);
    return;
  }
  busy = true;
  setStatus('info', 'Generating improvement proposal…');
  emitChanged();
  try {
    const res = await api.assist({
      action: 'improve',
      source: target.source,
      language: target.language,
    });
    busy = false;

    const result = res.result || {};
    const proposalPath = target.path;
    const isSelection = !!target.offsetLine;

    editorGroup.showDiff({
      title: `AI proposal — ${proposalPath}`,
      note: 'AI-proposed change (right side). Nothing is applied until you approve.',
      original: target.source,
      modified: result.improvedCode || '',
      language: target.language,
      mode: 'proposal',
      onAccept: (improved) => {
        // Selection proposals replace only the selection in the file.
        if (isSelection) {
          const sel = editorGroup.getSelection();
          const path = editorGroup.getActive();
          const content = workspace.read(path) || '';
          const lines = content.split('\n');
          const startIdx = (sel ? sel.startLine : target.offsetLine) - 1;
          const selLines = (sel ? sel.text : target.source).split('\n').length;
          lines.splice(startIdx, selLines, ...improved.split('\n'));
          workspace.write(path, lines.join('\n'));
          log('ai-review', `Applied AI selection proposal to ${path} (file is now dirty — save to persist)`);
        } else {
          workspace.write(proposalPath, improved);
          log('ai-review', `Applied AI proposal to ${proposalPath} (file is now dirty — save to persist)`);
        }
        setStatus('info', 'AI proposal applied — the file is unsaved. Review and press Ctrl+S to persist.');
        window.__wb.refreshExplorer();
        emitChanged();
      },
    });
    setStatus('info', 'Improvement proposal ready — review it in the diff viewer.');
    log('ai-review', `Improvement proposal generated for ${target.path}`);
    emitChanged();
  } catch (err) {
    busy = false;
    if (err.status === 503 || err.code === 'PROVIDER_UNAVAILABLE') setStatus('error', 'AI provider is not configured on the server (honest unavailable state).');
    else setStatus('error', `Improve failed: ${err.message || 'network error'}`);
    log('ai-review', `Improve error: ${err.message || 'network error'}`);
    emitChanged();
  }
}

// --- Staleness ---

async function isStale(entry) {
  if (!entry) return false;
  const current = workspace.read(entry.path);
  if (current === null) return true; // file deleted
  const digest = await computeDigest(current);
  return digest !== entry.sourceDigest;
}

// --- Finding navigation ---

function findingActualLine(finding) {
  const rel = finding.lineStart || 0;
  if (!rel) return null;
  return (lastReview.offsetLine || 0) + rel;
}

async function navigateToFinding(finding) {
  if (!lastReview) return;
  const stale = await isStale(lastReview);
  if (stale) {
    setStatus('warn', 'The file changed after this review — line positions may be wrong. Re-run the review for current findings.');
    log('ai-review', 'Stale finding navigation blocked (file changed since review)');
    return;
  }
  const line = findingActualLine(finding);
  if (line === null) return;
  editorGroup.revealLine(lastReview.path, line, { endLine: finding.lineEnd ? (lastReview.offsetLine + finding.lineEnd) : null });
}

// --- Status + rendering ---

let statusEl = null;
function setStatus(kind, message) {
  if (statusEl) {
    statusEl.className = 'wb-ai-status ' + kind;
    statusEl.innerHTML = (busy ? '<span class="spinner"></span>' : '') + escapeHtml(message);
  }
}

function render(bodyEl) {
  bodyEl.innerHTML = '';

  const actions = document.createElement('div');
  actions.className = 'wb-ai-actions';

  const mk = (label, title, fn, opts = {}) => {
    const btn = document.createElement('button');
    btn.className = 'wb-btn' + (opts.primary ? ' primary' : '');
    btn.innerHTML = `${opts.glyph || ''}<span>${escapeHtml(label)}</span>`;
    btn.title = title;
    btn.disabled = busy;
    btn.addEventListener('click', fn);
    return btn;
  };

  actions.appendChild(mk('Review Current File', 'Run an AI review of the active file (persisted to review history)', () => runReview({ scope: 'file' }), { primary: true }));
  actions.appendChild(mk('Review Selection', 'Run an AI review of the selected code only (persisted)', () => runReview({ scope: 'selection' })));
  actions.appendChild(mk('Security-Focused Review', 'Run a review prioritized on security findings (persisted)', () => runReview({ scope: 'file', focus: 'security' })));
  actions.appendChild(mk('Explain Code', 'Explain the selection (or the whole file) in plain language (ephemeral)', () => runExplain()));
  actions.appendChild(mk('Generate Fix Suggestions', 'Propose an improved version — review it in the diff viewer, apply only on approval', () => runImprove()));
  bodyEl.appendChild(actions);

  statusEl = document.createElement('div');
  statusEl.className = 'wb-ai-status info';
  statusEl.textContent = 'Choose an action. Results appear here and in the Problems panel.';
  bodyEl.appendChild(statusEl);

  // Persisted review report link.
  if (lastReview && lastReview.reviewId) {
    const link = document.createElement('button');
    link.className = 'wb-btn';
    link.style.margin = '0 12px 8px';
    link.textContent = 'Open saved review report →';
    link.title = 'Open the persisted review report page';
    link.addEventListener('click', () => {
      window.location.hash = `#/review?id=${encodeURIComponent(lastReview.reviewId)}`;
    });
    bodyEl.appendChild(link);
  }

  // Explain result.
  if (lastExplain) {
    const card = document.createElement('div');
    card.className = 'wb-explain-result';
    const r = lastExplain.result || {};
    card.innerHTML = `
      <h5>Explanation${lastExplain.result && lastExplain.path ? ` — ${escapeHtml(lastExplain.path)}` : ''}</h5>
      <p>${escapeHtml(r.explanation || '')}</p>
      ${r.keyPoints && r.keyPoints.length ? `<h5>Key points</h5><ul>${r.keyPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>` : ''}
      ${r.caveats ? `<h5>Caveats</h5><p>${escapeHtml(r.caveats)}</p>` : ''}
    `;
    bodyEl.appendChild(card);
  }

  // Findings list.
  if (lastReview && lastReview.findings) {
    const findings = lastReview.findings;
    const header = document.createElement('div');
    header.style.cssText = 'padding:8px 12px 4px;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-muted);';
    header.textContent = `Findings (${findings.length}) — ${lastReview.focus === 'security' ? 'security focus' : 'general'}${lastReview.offsetLine ? ' · selection' : ''}`;
    bodyEl.appendChild(header);

    const list = document.createElement('div');
    isStale(lastReview).then((stale) => {
      if (stale) {
        const warn = document.createElement('div');
        warn.className = 'wb-ai-status warn';
        warn.style.margin = '0 12px 8px';
        warn.textContent = 'The file has changed since this review — findings may be outdated. Re-run for current results.';
        bodyEl.insertBefore(warn, list);
      }
      findings.forEach((f, idx) => {
        const card = document.createElement('div');
        card.className = 'wb-finding sev-' + (f.severity || 'info') + (stale ? ' stale' : '');
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        const line = findingActualLine(f);
        card.innerHTML = `
          <div class="wb-finding-head">
            <span class="wb-badge-sm sev-${escapeHtml(f.severity || 'info')}">${escapeHtml(f.severity || 'info')}</span>
            <span class="wb-finding-title">${escapeHtml(f.title || 'Untitled finding')}</span>
          </div>
          <div class="wb-finding-body">
            ${escapeHtml(f.explanation || '')}
            <div class="wb-finding-meta">
              ${f.category ? `<span class="wb-badge-sm cat-${escapeHtml(categoryKey(f.category))}">${escapeHtml(f.category)}</span>` : ''}
              ${f.confidence ? `<span> · ${escapeHtml(f.confidence)} confidence</span>` : ''}
              ${line ? `<span> · line ${line}</span>` : ''}
            </div>
          </div>`;
        card.addEventListener('click', () => navigateToFinding(f));
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigateToFinding(f); });
        list.appendChild(card);
      });
      if (!findings.length) {
        const empty = document.createElement('div');
        empty.className = 'wb-empty';
        empty.textContent = 'No findings were returned. This does not mean the code is safe or production-ready.';
        list.appendChild(empty);
      }
    });
    bodyEl.appendChild(list);
  }
}

function categoryKey(category) {
  switch (category) {
    case 'bug/correctness': return 'bug';
    case 'security': return 'security';
    case 'performance': return 'performance';
    default: return 'quality';
  }
}

// --- Problems integration ---

async function getProblemFindings() {
  if (!lastReview || !lastReview.findings) return [];
  const stale = await isStale(lastReview);
  return lastReview.findings.map((f) => ({
    path: lastReview.path,
    severity: f.severity === 'critical' || f.severity === 'high' ? 'error' :
      f.severity === 'medium' ? 'warning' : 'info',
    message: `[AI Review] ${f.title || 'finding'}${stale ? ' (stale — file changed since review)' : ''}`,
    line: findingActualLine(f) || 1,
    col: 1,
    source: 'AI Review',
    finding: f,
    stale,
  }));
}

function getReview() {
  return lastReview;
}

export {
  render, runReview, runExplain, runImprove, onChange, getProblemFindings,
  getReview, isReviewableActive, navigateToFinding,
};
