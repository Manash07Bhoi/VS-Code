/**
 * CodeSense AI — Toast notifications.
 */

let container = document.getElementById('toast');

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'toast';
  document.body.appendChild(container);
}

export function show(message, type = 'info', duration = 5000) {
  ensureContainer();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(el);

  // Auto-remove.
  const timer = setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, duration);

  // Close on click.
  el.addEventListener('click', () => {
    clearTimeout(timer);
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  });
}

export function error(message, duration) {
  show(message, 'error', duration);
}

export function success(message, duration) {
  show(message, 'success', duration);
}

export function info(message, duration) {
  show(message, 'info', duration);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Namespace export for convenience.
export const toast = { show, error, success, info };
