/**
 * CodeSense AI — Source Control panel (honest local versioning).
 *
 * This is NOT a Git repository and the panel says so clearly. It shows the
 * local workspace changes since the newest local checkpoint, diff previews
 * via the Monaco diff editor, and a "Save local checkpoint" action that
 * snapshots workspace state. No fake commits, no fake history.
 */

import * as workspace from '../workspace.js';
import * as editorGroup from '../editorGroup.js';
import { promptDialog } from '../dialog.js';
import { log } from '../outputChannel.js';

function render(bodyEl, headerActionsEl) {
  renderHeaderActions(headerActionsEl);
  bodyEl.innerHTML = '';

  const note = document.createElement('div');
  note.className = 'wb-scm-note';
  note.innerHTML = '<strong>Local workspace changes</strong> — not a Git repository. This browser-local workspace tracks edits against local checkpoints. Real Git integration requires an authenticated backend Git service (documented in docs/architecture/IDE_WORKBENCH_ARCHITECTURE.md).';
  bodyEl.appendChild(note);

  const changes = workspace.changedSinceCheckpoint();

  if (!changes.length) {
    const empty = document.createElement('div');
    empty.className = 'wb-empty';
    empty.textContent = 'No local changes since the last checkpoint.';
    bodyEl.appendChild(empty);
  } else {
    const label = document.createElement('div');
    label.style.cssText = 'padding:2px 12px 6px;color:var(--text-muted);font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;';
    label.textContent = `Changes (${changes.length})`;
    bodyEl.appendChild(label);

    changes.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'wb-scm-item';
      row.title = `Compare ${c.path} with the newest local checkpoint`;
      const statusGlyph = document.createElement('span');
      statusGlyph.className = `wb-scm-status ${c.status}`;
      statusGlyph.textContent = c.status === 'modified' ? 'M' : c.status === 'added' ? 'U' : 'D';
      row.appendChild(statusGlyph);

      const name = document.createElement('span');
      name.style.cssText = 'overflow:hidden;text-overflow:ellipsis;';
      name.textContent = c.path;
      row.appendChild(name);

      row.addEventListener('click', () => showChangeDiff(c));
      bodyEl.appendChild(row);
    });
  }

  // Checkpoint history (local snapshots, honestly labeled).
  const checkpoints = workspace.listCheckpoints();
  if (checkpoints.length) {
    const label = document.createElement('div');
    label.style.cssText = 'padding:10px 12px 6px;color:var(--text-muted);font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;';
    label.textContent = `Local checkpoints (${checkpoints.length})`;
    bodyEl.appendChild(label);
    checkpoints.slice(0, 5).forEach((cp) => {
      const row = document.createElement('div');
      row.className = 'wb-scm-item';
      row.style.cursor = 'default';
      const d = new Date(cp.createdAt);
      row.innerHTML = `<span class="wb-scm-status" style="color:var(--text-muted)">·</span>
        <span>${cp.label} — ${d.toLocaleTimeString()} · ${Object.keys(cp.files).length} file(s)</span>`;
      bodyEl.appendChild(row);
    });
  }
}

function renderHeaderActions(headerActionsEl) {
  if (!headerActionsEl) return;
  headerActionsEl.innerHTML = '';

  const btn = document.createElement('button');
  btn.className = 'wb-btn';
  btn.style.height = '22px';
  btn.style.fontSize = '11px';
  btn.title = 'Save a local checkpoint of the whole workspace (not a commit)';
  btn.textContent = '✓ Checkpoint';
  btn.addEventListener('click', checkpointFlow);
  headerActionsEl.appendChild(btn);
}

async function checkpointFlow() {
  const label = await promptDialog(
    'Save local checkpoint',
    'Snapshot all current file contents as a local checkpoint (this is NOT a commit and stays in this browser):',
    { value: 'Local checkpoint' }
  );
  if (!label) return;
  workspace.createCheckpoint(label);
  log('workbench', `Local checkpoint saved: ${label}`);
  window.__wb.showScm();
}

function showChangeDiff(change) {
  const baseline = workspace.checkpointBaseline(change.path);
  const current = workspace.read(change.path) || '';

  if (change.status === 'deleted') {
    editorGroup.showDiff({
      title: change.path,
      note: 'Deleted since checkpoint',
      original: baseline || '',
      modified: '',
      language: (workspace.stat(change.path) || {}).language || 'plaintext',
      mode: 'review',
    });
    return;
  }

  editorGroup.showDiff({
    title: change.path,
    note: 'Local change vs newest checkpoint (working copy on the right)',
    original: baseline === null ? '' : baseline,
    modified: current,
    language: (workspace.stat(change.path) || {}).language || 'plaintext',
    mode: 'review',
  });
}

export { render };
