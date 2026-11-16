/**
 * CodeSense AI — Review report page.
 *
 * Displays a persisted review report: findings, source, recommendations,
 * improved code, copy actions, and delete.
 */

import { api } from '../app/api.js';
import { set } from '../app/state.js';
import { navigate } from '../app/router.js';
import { show as toastShow, error as toastError } from '../components/toast.js';
import { open as modalOpen } from '../components/modal.js';
import { openScratch } from '../workbench/workbench.js';

const container = document.getElementById('review-container');
const notFoundEl = document.getElementById('review-not-found');
const unauthorizedEl = document.getElementById('review-unauthorized');
const errorEl = document.getElementById('review-error');
const loadingEl = document.getElementById('review-loading');
const reportEl = document.getElementById('report-content');
const btnDelete = document.getElementById('review-delete');
const btnBack = document.getElementById('review-back');
const btnCopySource = document.getElementById('review-copy-source');

let reviewData = null;

const EXT_FOR_LANGUAGE = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  java: '.java',
  cpp: '.cpp',
};

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function categoryClass(cat) {
  return 'badge-cat-' + cat.replace('/', '-').replace(/\s/g, '-');
}

function renderReview(r) {
  reviewData = r;
  set({ review: r });

  const date = new Date(r.createdAt).toLocaleString();
  const completed = r.completedAt ? new Date(r.completedAt).toLocaleString() : null;
  const findings = Array.isArray(r.findings) ? r.findings : [];

  document.getElementById('review-language').textContent = escapeHtml(r.language);
  document.getElementById('review-status').textContent = escapeHtml(r.status);
  document.getElementById('review-status').className = 'badge ' + severityClass(r.status);
  document.getElementById('review-date').textContent = date;
  if (completed) {
    document.getElementById('review-completed').textContent = completed;
    document.getElementById('review-completed-row').hidden = false;
  } else {
    document.getElementById('review-completed-row').hidden = true;
  }
  document.getElementById('review-title').textContent = escapeHtml(r.title || '(untitled)');
  document.getElementById('review-summary').textContent = escapeHtml(r.summary || 'No summary available.');
  document.getElementById('review-limitation').textContent = escapeHtml(r.limitationNotice || '');
  document.getElementById('review-finding-count').textContent = findings.length;

  // Source.
  const sourceEl = document.getElementById('review-source');
  sourceEl.textContent = r.source || '(source not retained)';

  // Findings list.
  const findingsList = document.getElementById('review-findings');
  findingsList.innerHTML = '';
  if (findings.length === 0) {
    findingsList.innerHTML = `<div class="empty-state" style="height:auto;padding:var(--space-4);"><p>No findings were returned by the review. This does not mean the code is safe or production-ready.</p></div>`;
  } else {
    findings.forEach((f, idx) => {
      const card = document.createElement('div');
      card.className = 'finding-card';
      const loc = (f.lineStart && f.lineEnd) ? `${f.lineStart}–${f.lineEnd}` :
                  (f.lineStart) ? `line ${f.lineStart}` : 'location not available';
      card.innerHTML = `
        <div class="finding-header">
          <div>
            <div class="badge ${categoryClass(f.category)}">${escapeHtml(f.category)}</div>
            <div class="finding-title">${escapeHtml(f.title)}</div>
            <div class="finding-meta">
              <span class="badge badge-${f.confidence === 'high' ? 'low' : f.confidence === 'medium' ? 'medium' : 'error'}">${escapeHtml(f.confidence || 'unknown')} confidence</span>
              ${f.severity ? `<span class="badge badge-${f.severity}">${escapeHtml(f.severity)} severity</span>` : ''}
              <span class="finding-loc">${escapeHtml(loc)}</span>
            </div>
          </div>
          <div class="finding-id">#${idx + 1}</div>
        </div>
        <div class="finding-body">
          <div class="finding-row"><span class="k">Explanation</span><span class="v">${escapeHtml(f.explanation)}</span></div>
          ${f.impact ? `<div class="finding-row"><span class="k">Impact</span><span class="v">${escapeHtml(f.impact)}</span></div>` : ''}
          <div class="finding-row"><span class="k">Recommendation</span><span class="v">${escapeHtml(f.recommendation || 'No specific recommendation.')}</span></div>
          ${f.evidence ? `<div class="finding-evidence">${escapeHtml(f.evidence)}</div>` : ''}
        </div>
        <div class="finding-actions">
          <button class="btn btn-sm btn-outline copy-finding" data-idx="${idx}">Copy recommendation</button>
          ${f.improvedCode ? `<button class="btn btn-sm btn-outline view-improved" data-idx="${idx}">View improved code</button>` : ''}
          ${(f.lineStart || f.lineEnd) ? `<button class="btn btn-sm btn-outline jump-to" data-idx="${idx}" data-line="${f.lineStart || ''}">Jump to location</button>` : ''}
        </div>
      `;
      findingsList.appendChild(card);
    });
  }

  // Improved code panel (from findings or report).
  const improvedPanel = document.getElementById('review-improved-panel');
  const improvedCodeEl = document.getElementById('review-improved-code');
  const improvedSource = r.improvedCode || null;
  if (improvedSource) {
    improvedPanel.hidden = false;
    improvedCodeEl.textContent = escapeHtml(improvedSource);
  } else {
    improvedPanel.hidden = true;
  }

  reportEl.hidden = false;
  notFoundEl.hidden = true;
  unauthorizedEl.hidden = true;
  errorEl.hidden = true;
  loadingEl.hidden = true;
}

function severityClass(status) {
  switch (status) {
    case 'completed': return 'badge-low';
    case 'failed': return 'badge-error';
    case 'processing': return 'badge-medium';
    default: return 'badge-low';
  }
}

function renderNotFound() {
  reportEl.hidden = true;
  notFoundEl.hidden = false;
  unauthorizedEl.hidden = true;
  errorEl.hidden = true;
  loadingEl.hidden = true;
}
function renderUnauthorized() {
  reportEl.hidden = true;
  notFoundEl.hidden = true;
  unauthorizedEl.hidden = false;
  errorEl.hidden = true;
  loadingEl.hidden = true;
}
function renderError(msg) {
  reportEl.hidden = true;
  notFoundEl.hidden = true;
  unauthorizedEl.hidden = true;
  errorEl.hidden = false;
  errorEl.textContent = msg;
  loadingEl.hidden = true;
}
function renderLoading(show) {
  loadingEl.hidden = !show;
  reportEl.hidden = show;
}

function getReviewId() {
  const hash = window.location.hash.slice(1);
  const m = hash.match(/[?&]id=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function load() {
  const id = getReviewId();
  if (!id) {
    renderError('No review ID provided.');
    return;
  }
  renderLoading(true);
  try {
    const res = await api.getReview(id);
    const r = res.review || res;
    renderReview(r);
  } catch (err) {
    if (err.status === 401) {
      navigate('/login');
      return;
    }
    if (err.status === 404) {
      renderNotFound();
      return;
    }
    renderError('Unable to load this review.');
    toastError('Unable to load this review.');
  } finally {
    renderLoading(false);
  }
}

function init() {
  if (!btnDelete) return;

  btnBack.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/history');
  });

  btnDelete.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!reviewData) return;
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await api.deleteReview(reviewData._id);
      toastShow('Review deleted.', 'success', 3000);
      navigate('/history');
    } catch (err) {
      if (err.status === 404) {
        toastError('Review not found.');
        navigate('/history');
      } else {
        toastError('Could not delete review.');
      }
    }
  });

  if (btnCopySource) {
    btnCopySource.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(reviewData.source || '');
        toastShow('Source copied.', 'success', 2500);
      } catch (err) {
        toastError('Could not copy source.');
      }
    });
  }

  // Delegated clicks on finding actions.
  document.getElementById('review-findings').addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = Number(btn.getAttribute('data-idx'));
    const finding = (reviewData.findings || [])[idx];
    if (!finding) return;

    if (btn.classList.contains('copy-finding')) {
      try {
        await navigator.clipboard.writeText(finding.recommendation || '');
        toastShow('Recommendation copied.', 'success', 2500);
      } catch (err) {
        toastError('Could not copy.');
      }
    }
    if (btn.classList.contains('view-improved')) {
      modalOpen({
        title: 'Improved Code',
        bodyHtml: `<pre style="white-space:pre-wrap;font-family:var(--font-mono);font-size:0.875rem;background:var(--surface-bg);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:var(--space-3);">${escapeHtml(finding.improvedCode || '')}</pre>`,
        footerButtons: [{ label: 'Close', class: 'btn-secondary' }],
      });
    }
    if (btn.classList.contains('jump-to')) {
      const line = Number(btn.getAttribute('data-line'));
      if (line && reviewData) {
        // Open the reviewed source as a scratch file in the workbench and
        // jump to the finding's line.
        const lang = reviewData.language || 'plaintext';
        const ext = EXT_FOR_LANGUAGE[lang] || '.txt';
        const reviewId = typeof reviewData._id === 'string' ? reviewData._id.slice(-6) : 'src';
        openScratch(`review-${reviewId}${ext}`, reviewData.source || '', lang, line);
        navigate('/workbench');
      }
    }
  });
}

export { init, load };
