/**
 * CodeSense AI — Review history page.
 *
 * Owner-scoped list with search, filters, sort, pagination, and deletion.
 */

import { api } from '../app/api.js';
import { set } from '../app/state.js';
import { navigate } from '../app/router.js';
import { show as toastShow, error as toastError } from '../components/toast.js';

const listEl = document.getElementById('history-list');
const emptyEl = document.getElementById('history-empty');
const nomatchEl = document.getElementById('history-no-match');
const loadingEl = document.getElementById('history-loading');
const errorEl = document.getElementById('history-error');
const countEl = document.getElementById('history-count');
const filterLang = document.getElementById('history-filter-lang');
const filterStatus = document.getElementById('history-filter-status');
const sortSelect = document.getElementById('history-sort');
const orderSelect = document.getElementById('history-order');
const pageInfoEl = document.getElementById('history-page-info');
const prevBtn = document.getElementById('history-prev');
const nextBtn = document.getElementById('history-next');
const clearBtn = document.getElementById('history-clear');
const retryBtn = document.getElementById('history-retry');
const retryErrorBtn = document.getElementById('history-error-retry');
const clearMatchBtn = document.getElementById('history-clear-match');
const emptyNewBtn = document.getElementById('history-empty-new-review');

let languages = [];
let currentParams = { page: 1, limit: 20, language: null, status: null, sort: 'createdAt', order: 'desc' };
function renderLoading(show) { loadingEl.hidden = !show; }

function renderError(msg) {
  // Update the message paragraph, not the container — the container holds
  // the Retry button, which must survive re-renders.
  const msgEl = document.getElementById('history-error-msg');
  if (msgEl) msgEl.textContent = msg || 'Unable to load history.';
  errorEl.hidden = false;
  listEl.hidden = true;
  emptyEl.hidden = true;
  nomatchEl.hidden = true;
}

function renderEmpty() {
  listEl.hidden = true;
  emptyEl.hidden = false;
  nomatchEl.hidden = true;
  errorEl.hidden = true;
  loadingEl.hidden = true;
}

function renderNoMatch() {
  listEl.hidden = true;
  emptyEl.hidden = true;
  nomatchEl.hidden = false;
  errorEl.hidden = true;
  loadingEl.hidden = true;
}

function renderList(reviews, total) {
  loadingEl.hidden = true;
  errorEl.hidden = true;
  countEl.textContent = total;
  if (!reviews || reviews.length === 0) {
    // Distinguish first-use empty from no-match.
    renderEmpty();
    return;
  }
  emptyEl.hidden = true;
  nomatchEl.hidden = true;
  listEl.hidden = false;
  listEl.innerHTML = '';
  reviews.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    const date = new Date(r.createdAt).toLocaleString();
    const findings = Array.isArray(r.findings) ? r.findings.length : 0;
    item.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-title">${escapeHtml(r.title || '(untitled)')}</div>
        <span class="badge ${statusClass(r.status)}">${escapeHtml(r.status)}</span>
      </div>
      <div class="history-item-meta">${escapeHtml(r.language)} &middot; ${date} &middot; ${findings} finding${findings !== 1 ? 's' : ''}</div>
    `;
    item.addEventListener('click', () => navigate(`/review?id=${r._id}`));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/review?id=${r._id}`);
      }
    });
    // Delete button inside item.
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-sm btn-danger';
    del.textContent = 'Delete';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      deleteReview(r._id);
    });
    item.querySelector('.history-item-header').appendChild(del);
    listEl.appendChild(item);
  });

  // Pagination.
  const totalPages = Math.max(1, Math.ceil(total / currentParams.limit));
  if (pageInfoEl) {
    pageInfoEl.textContent = `Page ${currentParams.page} of ${totalPages}`;
  }
  prevBtn.disabled = currentParams.page <= 1;
  nextBtn.disabled = currentParams.page >= totalPages || totalPages === 0;
}

function statusClass(status) {
  switch (status) {
    case 'completed': return 'badge-low';
    case 'failed': return 'badge-error';
    case 'processing': return 'badge-medium';
    default: return 'badge-low';
  }
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

async function load() {
  renderLoading(true);
  errorEl.hidden = true;
  try {
    const res = await api.listReviews(currentParams);
    const reviews = res.reviews || [];
    const total = res.total || 0;
    set({ reviews, historyTotal: total, historyPage: currentParams.page, historyLimit: currentParams.limit });
    if (total === 0) {
      renderEmpty();
    } else {
      renderList(reviews, total);
    }
  } catch (err) {
    if (err.status === 401) {
      navigate('/login');
      return;
    }
    renderError('Unable to load history.');
    toastError('Unable to load history.');
  } finally {
    renderLoading(false);
  }
}

async function deleteReview(id) {
  if (!confirm('Delete this review? This cannot be undone.')) return;
  try {
    await api.deleteReview(id);
    toastShow('Review deleted.', 'success', 3000);
    // Refresh, resetting page if we deleted the last item on a page.
    const res = await api.listReviews({ ...currentParams, page: 1 });
    if ((res.reviews || []).length === 0 && currentParams.page > 1) {
      currentParams.page -= 1;
    }
    load();
  } catch (err) {
    toastError('Could not delete review.');
  }
}

function init() {
  if (!listEl) return;

  // Populate language filter.
  if (filterLang) {
    api.languages().then((res) => {
      languages = res.languages || [];
      filterLang.innerHTML = '<option value="">All languages</option>';
      languages.forEach((l) => {
        const o = document.createElement('option');
        o.value = l.canonicalId;
        o.textContent = l.displayName;
        filterLang.appendChild(o);
      });
    }).catch(() => {});
  }

  // Wire filter/sort controls — change resets pagination.
  const wire = (el, key, resetPage = true) => {
    el.addEventListener('change', (e) => {
      const val = e.target.value;
      currentParams[key] = val || null;
      if (resetPage) currentParams.page = 1;
      load();
    });
  };
  if (filterLang) wire(filterLang, 'language');
  if (filterStatus) wire(filterStatus, 'status');
  if (sortSelect) wire(sortSelect, 'sort');
  if (orderSelect) wire(orderSelect, 'order');

  // Pagination.
  if (prevBtn) prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentParams.page > 1) {
      currentParams.page -= 1;
      load();
    }
  });
  if (nextBtn) nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentParams.page += 1;
    load();
  });
  if (retryErrorBtn) retryErrorBtn.addEventListener('click', () => load());
  if (clearMatchBtn) clearMatchBtn.addEventListener('click', () => {
    if (clearBtn) clearBtn.click();
  });
  if (emptyNewBtn) emptyNewBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/workbench');
  });
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentParams = { page: 1, limit: 20, language: null, status: null, sort: 'createdAt', order: 'desc' };
      if (filterLang) filterLang.value = '';
      if (filterStatus) filterStatus.value = '';
      if (sortSelect) sortSelect.value = 'createdAt';
      if (orderSelect) orderSelect.value = 'desc';
      load();
    });
  }
  if (retryBtn) retryBtn.addEventListener('click', () => load());
}

export { init, load };
