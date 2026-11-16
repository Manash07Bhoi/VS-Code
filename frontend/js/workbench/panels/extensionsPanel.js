/**
 * CodeSense AI — Supported Integrations panel.
 *
 * Real data only: the language registry from the backend (/api/v1/languages),
 * the AI provider configuration status, and editor capabilities. Each card
 * reflects the actual server state fetched at panel render time.
 */

import { api } from '../../app/api.js';
import { log } from '../outputChannel.js';

let cachedLanguages = null;

function render(bodyEl) {
  bodyEl.innerHTML = '';

  const section = document.createElement('div');
  section.className = 'wb-info-section';
  section.innerHTML = '<h4>Languages</h4>';
  const langs = document.createElement('div');
  langs.id = 'wb-ext-languages';
  langs.innerHTML = '<div class="wb-empty">Loading language registry…</div>';
  section.appendChild(langs);
  bodyEl.appendChild(section);

  const providerSection = document.createElement('div');
  providerSection.className = 'wb-info-section';
  providerSection.innerHTML = '<h4>AI Provider</h4>';
  const providerCard = document.createElement('div');
  providerCard.id = 'wb-ext-provider';
  providerCard.innerHTML = '<div class="wb-empty">Checking provider status…</div>';
  providerSection.appendChild(providerCard);
  bodyEl.appendChild(providerSection);

  const editorSection = document.createElement('div');
  editorSection.className = 'wb-info-section';
  editorSection.innerHTML = `
    <h4>Editor</h4>
    <div class="wb-lang-row"><span class="wb-dot on"></span> Monaco Editor 0.52 (syntax highlighting, folding, multi-cursor, find/replace)</div>
    <div class="wb-lang-row"><span class="wb-dot on"></span> JavaScript / TypeScript in-browser diagnostics (Monaco language services)</div>
    <div class="wb-lang-row"><span class="wb-dot off"></span> IntelliSense for Python / Java / C++ — not integrated (basic editing only, no completion servers)</div>
  `;
  bodyEl.appendChild(editorSection);

  loadLanguages(langs);
  loadProviderStatus(providerCard);
}

async function loadLanguages(container) {
  try {
    const res = await api.languages();
    const languages = res.languages || [];
    cachedLanguages = languages;
    container.innerHTML = '';
    languages.forEach((l) => {
      const row = document.createElement('div');
      row.className = 'wb-lang-row';
      row.innerHTML = `<span class="wb-dot ${l.reviewEnabled ? 'on' : 'off'}"></span>
        <span>${escapeHtml(l.displayName)} <span style="color:var(--text-muted)">(${escapeHtml(l.monacoId)})</span></span>
        <span style="margin-left:auto;color:var(--text-muted);font-size:11px;">${l.reviewEnabled ? 'review enabled' : 'editing only'}</span>`;
      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = `<div class="wb-empty">Language registry unavailable (${escapeHtml(err.message || 'network error')}). Retrying happens on next panel open.</div>`;
    log('workbench', `Language registry fetch failed: ${err.message || 'network error'}`);
  }
}

async function loadProviderStatus(container) {
  try {
    const res = await api.health();
    const ready = res && (res.ready === true || res.status === 'ready');
    const geminiConfigured = res && res.provider === 'gemini';
    container.innerHTML = `
      <div class="wb-lang-row"><span class="wb-dot ${ready ? 'on' : 'off'}"></span>
        Backend health: ${ready ? 'ready' : 'not ready'}</div>
      <div class="wb-lang-row"><span class="wb-dot ${geminiConfigured ? 'on' : 'off'}"></span>
        Gemini review provider: ${geminiConfigured ? 'configured' : 'not configured (honest unavailable state is shown on AI actions)'}</div>
    `;
  } catch (_err) {
    container.innerHTML = `
      <div class="wb-lang-row"><span class="wb-dot off"></span> Backend unreachable — AI actions will show a provider-unavailable state.</div>
    `;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

export { render };
