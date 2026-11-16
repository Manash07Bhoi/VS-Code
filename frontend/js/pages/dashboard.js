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
const loadingEl = document.getElementById('dashboard-loading');
const errorEl = document.getElementById('dashboard-error');
const retryBtn = document.getElementById('dashboard-retry');

let loaded = false;

function renderLoading(show) {
  loadingEl.hidden = !show;
  reviewsList.hidden = show;
  emptyState.hidden = show;
  errorEl.hidden = show;
}

function renderError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
  loadingEl.hidden = true;
  reviewsList.hidden = true;
  emptyState.hidden = true;
}

function renderReviews(reviews) {
  loadingEl.hidden = true;
  errorEl.hidden = true;
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
  if (loaded) return;
  loaded = true;
  try {
    set({ loading: true });
    renderLoading(true);
    const res = await api.listReviews({ page: 1, limit: 10 });
    set({ reviews: res.reviews || [], historyTotal: res.total || 0, historyPage: 1, historyLimit: 10 });
    renderReviews(res.reviews || []);
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
    navigate('/editor');
  });
  if (retryBtn) {
    retryBtn.addEventListener('click', () => load());
  }
  // Load when view becomes active (handled by main).
  window.addEventListener('codesense-view:dashboard', load);
}


export { init, load };
