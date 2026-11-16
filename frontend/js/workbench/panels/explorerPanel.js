/**
 * CodeSense AI — Explorer panel.
 *
 * Workspace file tree with folder hierarchy, expand/collapse, file selection,
 * new file / new folder / rename / delete with confirmation, context menu,
 * and active-file indication with dirty dots.
 */

import * as workspace from '../workspace.js';
import * as editorGroup from '../editorGroup.js';
import { promptDialog, confirmDialog } from '../dialog.js';
import { log } from '../outputChannel.js';

const expandedFolders = new Set(['src']);

function basename(path) {
  return path.split('/').pop();
}

// Build a tree structure from flat paths.
function buildTree(paths) {
  const root = { name: '', path: '', children: new Map(), isFolder: true };
  for (const p of paths) {
    const parts = p.split('/');
    let node = root;
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const nodePath = parts.slice(0, i + 1).join('/');
      if (!node.children.has(part)) {
        node.children.set(part, {
          name: part,
          path: nodePath,
          isFolder: !isFile,
          children: new Map(),
        });
      }
      node = node.children.get(part);
    });
  }
  return root;
}

function render(bodyEl, headerActionsEl) {
  renderHeaderActions(headerActionsEl);
  bodyEl.innerHTML = '';

  const paths = workspace.list();
  const tree = buildTree(paths);

  const treeEl = document.createElement('div');
  treeEl.className = 'wb-tree';
  treeEl.setAttribute('role', 'tree');
  treeEl.setAttribute('aria-label', 'Workspace files');

  renderNode(treeEl, tree, 0);

  if (!paths.length) {
    const empty = document.createElement('div');
    empty.className = 'wb-empty';
    empty.innerHTML = 'This browser-local workspace is empty. Use the actions above (or right-click) to create files and folders.';
    bodyEl.appendChild(empty);
  }

  bodyEl.appendChild(treeEl);
}

function renderNode(container, node, depth) {
  const children = Array.from(node.children.values()).sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of children) {
    if (child.isFolder) {
      const isOpen = expandedFolders.has(child.path);
      const row = document.createElement('div');
      row.className = 'wb-tree-row';
      row.setAttribute('role', 'treeitem');
      row.setAttribute('aria-expanded', String(isOpen));
      row.tabIndex = 0;
      row.style.paddingLeft = (8 + depth * 14) + 'px';

      const caret = document.createElement('span');
      caret.className = 'wb-tree-caret' + (isOpen ? ' open' : '');
      caret.innerHTML = '<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      row.appendChild(caret);

      const label = document.createElement('span');
      label.className = 'wb-tree-label';
      label.textContent = child.name;
      row.appendChild(label);

      const toggle = () => {
        if (expandedFolders.has(child.path)) expandedFolders.delete(child.path);
        else expandedFolders.add(child.path);
        window.__wb.refreshExplorer();
      };
      row.addEventListener('click', toggle);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showMenu(e, { folder: child.path });
      });
      container.appendChild(row);

      if (isOpen) {
        const group = document.createElement('div');
        group.setAttribute('role', 'group');
        renderNode(group, child, depth + 1);
        container.appendChild(group);
      }
    } else {
      const row = document.createElement('div');
      const active = editorGroup.getActive() === child.path;
      row.className = 'wb-tree-row' + (active ? ' active' : '');
      row.setAttribute('role', 'treeitem');
      row.tabIndex = 0;
      row.style.paddingLeft = (8 + depth * 14 + 16) + 'px';

      const icon = document.createElement('span');
      icon.className = 'wb-file-icon';
      icon.setAttribute('aria-hidden', 'true');
      const lang = (workspace.stat(child.path) || {}).language;
      icon.textContent = fileGlyph(lang);
      icon.style.color = fileColor(lang);
      row.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'wb-tree-label';
      label.textContent = child.name;
      row.appendChild(label);

      if (workspace.isDirty(child.path)) {
        const dot = document.createElement('span');
        dot.className = 'wb-dirty-dot';
        dot.title = 'Unsaved changes';
        row.appendChild(dot);
      }

      row.title = child.path;
      row.addEventListener('click', () => editorGroup.openTab(child.path));
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editorGroup.openTab(child.path); }
      });
      row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showMenu(e, { file: child.path });
      });
      container.appendChild(row);
    }
  }
}

function fileGlyph(lang) {
  switch (lang) {
    case 'javascript': return 'JS';
    case 'typescript': return 'TS';
    case 'python': return 'PY';
    case 'java': return 'J';
    case 'cpp': return 'C+';
    case 'json': return '{}';
    case 'markdown': return 'MD';
    case 'html': return '<>';
    case 'css': return '#';
    default: return '·';
  }
}

function fileColor(lang) {
  switch (lang) {
    case 'javascript': return '#fbbf24';
    case 'typescript': return '#60a5fa';
    case 'python': return '#4ade80';
    case 'java': return '#f472b6';
    case 'cpp': return '#9b7cff';
    default: return 'var(--text-muted)';
  }
}

function renderHeaderActions(headerActionsEl) {
  if (!headerActionsEl) return;
  headerActionsEl.innerHTML = '';

  const newFile = document.createElement('button');
  newFile.className = 'wb-icon-btn';
  newFile.title = 'New file';
  newFile.setAttribute('aria-label', 'New file');
  newFile.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6L9 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8.5 9.5V6.7M7 8.1h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  newFile.addEventListener('click', () => createFileFlow());
  headerActionsEl.appendChild(newFile);

  const newFolder = document.createElement('button');
  newFolder.className = 'wb-icon-btn';
  newFolder.title = 'New folder';
  newFolder.setAttribute('aria-label', 'New folder');
  newFolder.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5A1.5 1.5 0 0 1 4 3h2.5l1.3 1.7H12A1.5 1.5 0 0 1 13.5 6.2V12A1.5 1.5 0 0 1 12 13.5H4A1.5 1.5 0 0 1 2.5 12v-7.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  newFolder.addEventListener('click', () => createFolderFlow());
  headerActionsEl.appendChild(newFolder);

  const collapse = document.createElement('button');
  collapse.className = 'wb-icon-btn';
  collapse.title = 'Collapse folders';
  collapse.setAttribute('aria-label', 'Collapse folders');
  collapse.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 5l5-3 5 3M3 8l5-3 5 3M3 11l5-3 5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  collapse.addEventListener('click', () => { expandedFolders.clear(); window.__wb.refreshExplorer(); });
  headerActionsEl.appendChild(collapse);
}

// --- Creation flows ---

async function createFileFlow(folder = '') {
  const name = await promptDialog(
    'New file',
    'File name (with extension, e.g. app.js, utils/helpers.py):',
    { value: folder ? folder + '/' : '', placeholder: 'app.js' }
  );
  if (!name) return;
  try {
    const path = workspace.createFile(name, '');
    log('workbench', `Created file: ${path}`);
    window.__wb.refreshExplorer();
    editorGroup.openTab(path);
    editorGroup.focus();
  } catch (err) {
    await confirmDialog('Cannot create file', err.message, { okLabel: 'Close' });
  }
}

async function createFolderFlow() {
  // Folders are implicit in paths; create a placeholder by asking for a path
  // that will hold a file later. We record the folder as expanded.
  const name = await promptDialog(
    'New folder',
    'Folder path (e.g. utils, src/components):',
    { value: '', placeholder: 'utils' }
  );
  if (!name) return;
  try {
    const path = workspace.validatePath(name);
    expandedFolders.add(path);
    window.__wb.refreshExplorer();
    log('workbench', `Folder ready: ${path}/ (create files inside it)`);
  } catch (err) {
    await confirmDialog('Invalid folder', err.message, { okLabel: 'Close' });
  }
}

async function renameFlow(path) {
  const newName = await promptDialog(
    'Rename file',
    'New path:',
    { value: path, placeholder: path }
  );
  if (!newName || newName === path) return;
  try {
    workspace.rename(path, newName);
    log('workbench', `Renamed: ${path} → ${newName}`);
    window.__wb.refreshExplorer();
  } catch (err) {
    await confirmDialog('Cannot rename', err.message, { okLabel: 'Close' });
  }
}

async function deleteFlow(path) {
  const dirty = workspace.isDirty(path);
  const ok = await confirmDialog(
    'Delete file',
    `Delete "${path}"${dirty ? ' (it has UNSAVED changes)' : ''}? This cannot be undone.`,
    { okLabel: 'Delete', danger: true }
  );
  if (!ok) return;
  try {
    workspace.remove(path);
    log('workbench', `Deleted file: ${path}`);
    window.__wb.refreshExplorer();
  } catch (err) {
    await confirmDialog('Cannot delete', err.message, { okLabel: 'Close' });
  }
}

// --- Context menu ---

function showMenu(e, target) {
  const existing = document.querySelector('.wb-context-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.className = 'wb-context-menu';
  menu.setAttribute('role', 'menu');

  const add = (label, fn, { danger = false, separator = false } = {}) => {
    if (separator) {
      const sep = document.createElement('div');
      sep.className = 'wb-menu-sep';
      menu.appendChild(sep);
      return;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    if (danger) btn.classList.add('danger');
    btn.addEventListener('click', () => { menu.remove(); fn(); });
    menu.appendChild(btn);
  };

  if (target.file) {
    add('New File…', () => createFileFlow(folderOf(target.file)));
    add('Rename…', () => renameFlow(target.file));
    add('Delete', () => deleteFlow(target.file), { danger: true });
  } else if (target.folder !== undefined) {
    add('New File in Folder…', () => createFileFlow(target.folder));
    add('New File at Root…', () => createFileFlow(''));
  } else {
    add('New File…', () => createFileFlow(''));
  }

  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  const x = Math.min(e.clientX, window.innerWidth - rect.width - 8);
  const y = Math.min(e.clientY, window.innerHeight - rect.height - 8);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  const close = (ev) => {
    if (!menu.contains(ev.target)) {
      menu.remove();
      document.removeEventListener('mousedown', close, true);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', close, true), 0);
}

function folderOf(path) {
  return path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
}

export { render, createFileFlow };
