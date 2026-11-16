/**
 * CodeSense AI — API client (Vanilla JS).
 *
 * Talks to the backend over JSON. Attaches CSRF token and credentials (cookies).
 * Never contains AI keys, DB credentials, or server-only modules.
 */

const API_BASE = (window.__CODESENSE_API_BASE || '/api/v1').replace(/\/+$/, '');

let csrfToken = null;

async function setCsrfToken(token) {
  csrfToken = token;
}

async function fetchCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/csrf-token`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.csrfToken) csrfToken = data.csrfToken;
    }
  } catch (err) {
    // Non-fatal; mutating requests will surface a CSRF error if needed.
    console.warn('codesense-api.csrf-fetch-failed', err.message);
  }
}

function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Request-Id': crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36) };
  if (csrfToken) h['X-CSRF-Token'] = csrfToken;
  return { ...h, ...extra };
}

function handleResponse(res) {
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.code = res.status === 401 ? 'UNAUTHENTICATED' :
                 res.status === 403 ? 'FORBIDDEN' :
                 res.status === 404 ? 'NOT_FOUND' :
                 res.status === 429 ? 'RATE_LIMITED' :
                 res.status === 502 || res.status === 504 ? 'PROVIDER_UNAVAILABLE' :
                 res.status === 503 ? 'SERVICE_UNAVAILABLE' : 'REQUEST_ERROR';
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function request(path, opts = {}, csrfRetry = true) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...opts,
    headers: { ...headers(), ...(opts.headers || {}) },
  });

  // Centralized CSRF refresh: if a mutating request is rejected with a stale
  // CSRF token (for example after session regeneration on login/register),
  // refetch a fresh token bound to the current session and retry exactly once.
  // This keeps subsequent authenticated writes working without duplicating
  // fragile token logic across pages.
  if (
    csrfRetry &&
    res.status === 403 &&
    opts.method &&
    !['GET', 'HEAD', 'OPTIONS'].includes(opts.method)
  ) {
    try {
      await fetchCsrfToken();
    } catch (_err) {
      // Non-fatal; fall through to handleResponse which will surface the error.
    }
    return request(path, opts, false);
  }

  return handleResponse(res);
}

const api = {
  // Auth
  register: (email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  csrfToken: () => fetchCsrfToken(),

  // Languages
  languages: () => request('/languages'),

  // Reviews
  createReview: (payload) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  listReviews: (params) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.language) qs.set('language', params.language);
    if (params.status) qs.set('status', params.status);
    if (params.sort) qs.set('sort', params.sort);
    if (params.order) qs.set('order', params.order);
    return request(`/reviews?${qs.toString()}`);
  },
  getReview: (id) => request(`/reviews/${id}`),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),

  health: () => request('/health/ready'),
};

export { api, setCsrfToken, fetchCsrfToken };
