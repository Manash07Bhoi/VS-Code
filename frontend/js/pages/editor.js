/**
 * CodeSense AI — Editor page.
 *
 * Monaco-based code workspace with language selection, source-size feedback,
 * and Analyze action. Bound to a submitted source revision.
 */

import { api } from '../app/api.js';
import { state, set, get } from '../app/state.js';
import { loadMonaco, isLoaded, init as monacoInit, getValue, setValue, setLanguage, getLanguage, focus, setSelectionRange, highlightRange, clearDecorations, onChange as monacoOnChange } from '../app/monaco.js';
import { navigate } from '../app/router.js';
import { show as toastShow, error as toastError } from '../components/toast.js';

const container = document.getElementById('monaco-container');
const langSelect = document.getElementById('editor-language');
const sourceSizeEl = document.getElementById('editor-source-size');
const analyzeBtn = document.getElementById('editor-analyze');
const editorErrorEl = document.getElementById('editor-error');
const editorLoadingEl = document.getElementById('editor-loading');
const editorUnavailableEl = document.getElementById('editor-unavailable');
const statusPill = document.getElementById('editor-status');

let editorDecorations = [];
let initialized = false;
let languages = [];

function renderLoading(el, show) { el.hidden = !show; }

function updateSourceSize() {
  const value = getValue();
  const bytes = new TextEncoder().encode(value).length;
  const kb = (bytes / 1024).toFixed(2);
  sourceSizeEl.textContent = `${bytes} bytes (${kb} KB)`;
  if (bytes > 64 * 1024) {
    sourceSizeEl.style.color = 'var(--error)';
  } else if (bytes > 48 * 1024) {
    sourceSizeEl.style.color = 'var(--warning)';
  } else {
    sourceSizeEl.style.color = 'var(--text-muted)';
  }
}

function populateLanguages(list) {
  languages = list || [];
  if (!langSelect) return;
  langSelect.innerHTML = '';
  list.forEach((l) => {
    const o = document.createElement('option');
    o.value = l.canonicalId;
    o.textContent = `${l.displayName} (${l.monacoId})`;
    o.disabled = !l.reviewEnabled;
    if (o.disabled) o.title = 'Not enabled for review';
    if (l.canonicalId === state.language) o.selected = true;
    langSelect.appendChild(o);
  });
}

function setStatus(text, kind = 'idle') {
  if (!statusPill) return;
  statusPill.textContent = text;
  statusPill.className = 'status-pill status-' + kind;
}

async function loadLanguages() {
  try {
    const res = await api.languages();
    populateLanguages(res.languages || []);
    set({ languages: res.languages || [] });
  } catch (err) {
    toastError('Unable to load language list.');
  }
}

function init() {
  if (!container || !analyzeBtn) return;

  // Load Monaco once.
  renderLoading(editorLoadingEl, true);
  renderLoading(editorUnavailableEl, false);
  renderLoading(editorErrorEl, false);

  loadLanguages();

  monacoInit(container, { value: state.source || '', language: state.language })
    .then((editorInstance) => {
      initialized = true;
      renderLoading(editorLoadingEl, false);
      updateSourceSize();
      focus();
      // Jump to a source line carried from a review report (review page).
      const jumpToLine = Number(state.jumpToLine || 0);
      if (jumpToLine >= 1) {
        set({ jumpToLine: 0 }); // consume once
        const totalLines = editorInstance.getModel().getLineCount();
        const targetLine = Math.min(Math.max(jumpToLine, 1), totalLines);
        const range = { startLine: targetLine, startCol: 1, endLine: targetLine, endCol: 1 };
        setSelectionRange(range);
        highlightRange(range);
        setStatus(`Jumped to line ${targetLine}`, 'info');
      }
    })
    .catch((err) => {
      renderLoading(editorLoadingEl, false);
      renderLoading(editorErrorEl, true);
      editorErrorEl.textContent = 'Editor unavailable: ' + err.message;
      toastError('Code editor failed to load.');
    });

  // Language change.
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      const id = e.target.value;
      setLanguage(id);
      set({ language: id });
    });
  }

  // Source changes.
  monacoOnChange(updateSourceSize);

  // Analyze.
  analyzeBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const language = getLanguage();
    const source = getValue();

    if (!source || source.trim() === '') {
      toastError('Please enter some code before analyzing.');
      return;
    }
    const bytes = new TextEncoder().encode(source).length;
    if (bytes > 64 * 1024) {
      toastError('Source code exceeds 64 KiB limit.');
      return;
    }

    set({ submitting: true });
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing…';
    setStatus('Reviewing with AI provider…', 'processing');

    try {
      const res = await api.createReview({ source, language });
      set({ submitting: false, review: res });
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze';

      if (res.status === 'failed' || res.providerUnavailable) {
        setStatus(res.providerUnavailable ? 'Provider not configured' : 'Review failed', 'error');
        if (res.providerUnavailable) {
          toastError(res.failureReason || 'AI provider is not configured on the server.');
        } else {
          toastError(res.failureReason || 'The review could not be completed.');
        }
        // Still allow viewing the failed record.
        navigate(`/review?id=${res.reviewId}&status=failed`);
      } else {
        setStatus('Review complete', 'success');
        toastShow('Review complete.', 'success', 3000);
        navigate(`/review?id=${res.reviewId}`);
      }
    } catch (err) {
      set({ submitting: false });
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze';
      setStatus('Review failed', 'error');

      if (err.status === 429) {
        toastError('Too many review requests. Please wait and try again.');
      } else if (err.status === 413) {
        toastError('Source code is too large.');
      } else if (err.status === 400 && err.code === 'VALIDATION_ERROR') {
        toastError(err.message || 'Invalid submission.');
      } else if (err.status === 502 || err.code === 'PROVIDER_UNAVAILABLE') {
        setStatus('Provider unavailable', 'error');
        toastError('The AI provider is currently unavailable. Your review was recorded as failed.');
        navigate(`/review?id=${err.reviewId || ''}&status=failed`);
      } else {
        toastError('Analysis failed. Please try again.');
      }
    } finally {
      set({ submitting: false });
    }
  });
}

// Expose for main view activation.
export { init, loadLanguages, updateSourceSize, populateLanguages };
