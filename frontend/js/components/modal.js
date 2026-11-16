/**
 * CodeSense AI — Modal dialog.
 */

let overlay = document.getElementById('modal-overlay');

function ensure() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header"><h2 class="modal-title"></h2></div>
      <div class="modal-body"></div>
      <div class="modal-footer"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  // Close on overlay click.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  // Close on Escape.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
}

export function open({ title, bodyHtml, footerButtons, onClose }) {
  ensure();
  const titleEl = overlay.querySelector('.modal-title');
  const bodyEl = overlay.querySelector('.modal-body');
  const footerEl = overlay.querySelector('.modal-footer');
  titleEl.textContent = title || '';
  bodyEl.innerHTML = bodyHtml || '';
  footerEl.innerHTML = '';
  if (footerButtons) {
    footerButtons.forEach((btn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn ${btn.class || 'btn-secondary'}`;
      b.textContent = btn.label;
      b.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (btn.action) btn.action(ev);
        close();
      });
      footerEl.appendChild(b);
    });
  }
  overlay.classList.add('open');
  return { close };
}

export function close() {
  if (overlay) overlay.classList.remove('open');
}
