/**
 * CodeSense AI — Dashboard page.
 */

import { api } from '../app/api.js';
import { state, set } from '../app/state.js';
import { navigate } from '../app/router.js';
import { show as toastShow, error as toastError } from '../components/toast.js';

const reviewsList = document.getElementById('dashboard-reviews');
const emptyState = document.getElementById('dashboard-empty');
const btnNewReview = document.getElementById('btn-new-review');
const btnEmptyNewReview = document.getElementById('btn-empty-new-review');
const countEl = document.getElementById('dashboard-count');
const loadingEl = document.getElementById('dashboard-loading');
const errorEl = document.getElementById('dashboard-error');
const retryBtn = document.getElementById('dashboard-retry');

function renderLoading(show) {
  loadingEl.hidden = !show;
  reviewsList.hidden = show;
  emptyState.hidden = show;
  errorEl.hidden = show;
}

function renderError(msg) {
  // Update the message text only — the container holds the Retry button.
  const p = errorEl.querySelector('p');
  if (p) p.textContent = msg || 'Unable to load your reviews.';
  errorEl.hidden = false;
  loadingEl.hidden = true;
  reviewsList.hidden = true;
  emptyState.hidden = true;
}

function renderReviews(reviews, total) {
  loadingEl.hidden = true;
  errorEl.hidden = true;
  if (countEl) {
    countEl.textContent = typeof total === 'number' && total > 0
      ? `${total} review${total !== 1 ? 's' : ''} total`
      : '';
  }
  if (!reviews || reviews.length === 0) {
    emptyState.hidden = false;
    reviewsList.hidden = true;
    return;
  }
  emptyState.hidden = true;
  reviewsList.hidden = false;
  reviewsList.innerHTML = '';
  reviews.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Review ${r.title || '(untitled)'} — ${r.status}`);
    const date = new Date(r.createdAt).toLocaleString();
    const findingCount = Array.isArray(r.findings) ? r.findings.length : 0;
    item.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-title">${escapeHtml(r.title || '(untitled)')}</div>
        <span class="badge badge-${severityClass(r.status)}">${escapeHtml(r.status)}</span>
      </div>
      <div class="history-item-meta">${escapeHtml(r.language)} &middot; ${date} &middot; ${findingCount} finding${findingCount !== 1 ? 's' : ''}</div>
    `;
    item.addEventListener('click', () => navigate(`/review?id=${r._id}`));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/review?id=${r._id}`);
      }
    });
    reviewsList.appendChild(item);
  });
}

function severityClass(status) {
  switch (status) {
    case 'completed': return 'low';
    case 'failed': return 'error';
    case 'processing': return 'medium';
    default: return 'low';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function load() {
  try {
    set({ loading: true });
    renderLoading(true);
    const res = await api.listReviews({ page: 1, limit: 10 });
    const total = res.total || 0;
    set({ reviews: res.reviews || [], historyTotal: total, historyPage: 1, historyLimit: 10 });
    renderReviews(res.reviews || [], total);
  } catch (err) {
    if (err.status === 401) {
      navigate('/login');
      return;
    }
    renderError('Unable to load your reviews.');
    toastError('Unable to load your reviews.');
  } finally {
    set({ loading: false });
  }
}

function init() {
  if (!btnNewReview) return;
  btnNewReview.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/workbench');
  });
  if (btnEmptyNewReview) {
    btnEmptyNewReview.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/workbench');
    });
  }
  if (retryBtn) {
    retryBtn.addEventListener('click', () => load());
  }
}


export { init, load };
