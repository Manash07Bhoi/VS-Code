/**
 * CodeSense AI — Workbench dialog helper.
 *
 * Accessible prompt/confirm dialogs for the workbench (create/rename/delete
 * flows, unsaved-change protection, replace-all confirmations). Returns a
 * Promise; keyboard: Enter confirms, Escape cancels.
 */

const overlayEl = () => document.getElementById('wb-dialog-overlay');
const titleEl = () => document.getElementById('wb-dialog-title');
const messageEl = () => document.getElementById('wb-dialog-message');
const inputEl = () => document.getElementById('wb-dialog-input');
const okBtn = () => document.getElementById('wb-dialog-ok');
const cancelBtn = () => document.getElementById('wb-dialog-cancel');

/**
 * @param {string} title
 * @param {string} message
 * @param {object} opts { input: {value, placeholder} | null, okLabel, danger }
 * @returns {Promise<string|null|true>} input value / true / null on cancel
 */
function dialog(title, message, opts = {}) {
  return new Promise((resolve) => {
    const overlay = overlayEl();
    const input = inputEl();
    const ok = okBtn();
    const cancel = cancelBtn();

    titleEl().textContent = title;
    messageEl().textContent = message;
    ok.textContent = opts.okLabel || 'OK';

    if (opts.input) {
      input.hidden = false;
      input.value = opts.input.value || '';
      input.placeholder = opts.input.placeholder || '';
    } else {
      input.hidden = true;
      input.value = '';
    }

    ok.className = 'wb-btn ' + (opts.danger ? 'danger' : 'primary');

    function done(result) {
      overlay.hidden = true;
      document.removeEventListener('keydown', keyHandler, true);
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk() {
      if (opts.input) {
        const value = input.value.trim();
        if (!value) { input.focus(); return; }
        done(value);
      } else {
        done(true);
      }
    }
    function onCancel() { done(null); }
    function keyHandler(e) {
      if (e.key === 'Escape') { e.preventDefault(); done(null); }
      else if (e.key === 'Enter' && overlay && !overlay.hidden) { e.preventDefault(); onOk(); }
    }

    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    document.addEventListener('keydown', keyHandler, true);
    overlay.hidden = false;
    (opts.input ? input : ok).focus();
    if (opts.input) input.select();
  });
}

const confirmDialog = (title, message, opts = {}) =>
  dialog(title, message, { ...opts, input: null });
const promptDialog = (title, message, input, opts = {}) =>
  dialog(title, message, { ...opts, input });

export { dialog, confirmDialog, promptDialog };
