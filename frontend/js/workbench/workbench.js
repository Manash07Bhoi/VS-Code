/**
 * CodeSense AI — Workbench orchestrator.
 *
 * Boots the VS Code-inspired workbench: editor group, activity bar, sidebar
 * panels, tab strip, bottom panel, status bar, command palette, theme, and
 * the command registry with real keybindings. Integrates with the existing
 * app shell (auth, router, navbar, toasts).
 */

import * as workspace from './workspace.js';
import * as editorGroup from './editorGroup.js';
import * as activityBar from './activityBar.js';
import * as statusBar from './statusBar.js';
import * as commandPalette from './commandPalette.js';
import * as bottomPanel from './bottomPanel.js';
import * as tabStrip from './tabStrip.js';
import * as theme from './theme.js';
import * as commands from './commands.js';
import { log } from './outputChannel.js';
import { confirmDialog, promptDialog } from './dialog.js';

import * as explorerPanel from './panels/explorerPanel.js';
import * as searchPanel from './panels/searchPanel.js';
import * as scmPanel from './panels/scmPanel.js';
import * as runPanel from './panels/runPanel.js';
import * as extensionsPanel from './panels/extensionsPanel.js';
import * as aiReviewPanel from './panels/aiReviewPanel.js';

let initialized = false;

const PANELS = {
  explorer: { title: 'Explorer', render: (b, h) => explorerPanel.render(b, h) },
  search: { title: 'Search', render: (b) => searchPanel.render(b) },
  scm: { title: 'Source Control — Local Changes', render: (b, h) => scmPanel.render(b, h) },
  run: { title: 'Run and Debug', render: (b) => runPanel.render(b) },
  extensions: { title: 'Supported Integrations', render: (b) => extensionsPanel.render(b) },
  ai: { title: 'AI Review', render: (b) => aiReviewPanel.render(b) },
};

function renderSidebar() {
  const body = document.getElementById('wb-panel-body');
  const actions = document.getElementById('wb-panel-actions');
  const title = document.getElementById('wb-panel-title');
  const sidebar = document.getElementById('wb-sidebar');
  if (!body || !title) return;

  const view = activityBar.getView();
  const panel = PANELS[view] || PANELS.explorer;
  title.textContent = panel.title;
  if (sidebar) sidebar.classList.toggle('hidden', activityBar.isHidden());
  panel.render(body, actions);
}

function refreshExplorer() {
  if (activityBar.getView() === 'explorer') renderSidebar();
  tabStrip.render();
}

function showPanelView(view) {
  activityBar.switchView(view);
  renderSidebar();
}

function showProblems() {
  bottomPanel.showTab('problems');
  bottomPanel.openPanel();
}

function showScm() {
  showPanelView('scm');
}

function refreshProblems() {
  bottomPanel.refreshProblems();
}

// --- Language / indentation pickers (status bar interactions) ---

async function pickLanguage() {
  const path = editorGroup.getActive();
  if (!path) return;
  const file = workspace.stat(path);
  const options = ['javascript', 'typescript', 'python', 'java', 'cpp', 'json', 'markdown', 'html', 'css', 'plaintext'];
  const current = (file || {}).language || 'plaintext';
  const answer = await promptDialog(
    'Set language mode',
    `Language for "${path.split('/').pop()}" — one of: ${options.join(', ')}:`,
    { value: current }
  );
  if (!answer || !options.includes(answer)) return;
  if (file) {
    file.language = answer;
    // Language is derived from the path; a manual override is ephemeral for
    // the session (documented in the architecture notes).
    editorGroup.ensureLanguage(path);
    const model = null; // editorGroup handles model language updates.
    statusBar.setLanguage(answer);
    log('workbench', `Language mode set to ${answer} for ${path} (session-only override)`);
    refreshProblems();
  }
}

async function pickIndentation() {
  const answer = await promptDialog(
    'Indentation',
    'Spaces per indent (2, 4 or 8):',
    { value: '4' }
  );
  if (!answer) return;
  const n = parseInt(answer, 10);
  if (![2, 4, 8].includes(n)) return;
  // Applied via the palette command for consistency.
  commands.execute('workbench.action.indentation', n);
}

// --- Command registry ---

function registerCommands() {
  commands.register('workbench.action.save', 'Save Active File', () => {
    const path = editorGroup.getActive();
    if (!path) return;
    try {
      workspace.save(path);
      log('workbench', `Saved: ${path}`);
      tabStrip.render();
      refreshExplorer();
    } catch (err) {
      log('workbench', `Save failed for ${path}: ${err.message}`);
    }
  }, { category: 'File', keybinding: 'Ctrl+S' });

  commands.register('workbench.action.saveAll', 'Save All Files', () => {
    const saved = workspace.saveAll();
    log('workbench', `Save all: ${saved.length} file(s) saved`);
    tabStrip.render();
    refreshExplorer();
  }, { category: 'File', keybinding: 'Ctrl+K S' });

  commands.register('workbench.action.newFile', 'New File…', () => {
    explorerPanel.createFileFlow();
  }, { category: 'File', keybinding: 'Ctrl+N' });

  commands.register('workbench.action.openFile', 'Open File…', () => {
    commandPalette.show('files');
  }, { category: 'File', keybinding: 'Ctrl+P' });

  commands.register('workbench.action.closeEditor', 'Close Editor', () => {
    const path = editorGroup.getActive();
    if (path) tabStrip.requestClose(path);
  }, { category: 'File', keybinding: 'Ctrl+W' });

  commands.register('workbench.action.closeOtherEditors', 'Close Other Editors', () => {
    const path = editorGroup.getActive();
    if (path) editorGroup.closeOthers(path);
  }, { category: 'File' });

  commands.register('workbench.action.find', 'Find in File', () => {
    editorGroup.triggerEditorAction('actions.find');
  }, { category: 'Edit', keybinding: 'Ctrl+F' });

  commands.register('workbench.action.replace', 'Replace in File', () => {
    editorGroup.triggerEditorAction('editor.action.startFindReplaceAction');
  }, { category: 'Edit', keybinding: 'Ctrl+H' });

  commands.register('workbench.action.replaceAll', 'Replace All Across Workspace…', () => {
    showPanelView('search');
    // The search panel exposes replace-all once a query is typed.
    log('workbench', 'Workspace replace-all: type query in the Search panel, then use Replace all');
  }, { category: 'Edit' });

  commands.register('workbench.action.toggleWordWrap', 'Toggle Word Wrap', () => {
    const ed = document.getElementById('wb-editor-host');
    if (!ed) return;
    // Toggled through editor update options via the palette command id.
    window.__wbToggleWordWrap();
  }, { category: 'View', keybinding: 'Alt+Z' });

  commands.register('workbench.action.toggleExplorer', 'Toggle Explorer View', () => {
    showPanelView('explorer');
  }, { category: 'View', keybinding: 'Ctrl+Shift+E' });

  commands.register('workbench.action.toggleSearch', 'Toggle Search View', () => {
    showPanelView('search');
  }, { category: 'View', keybinding: 'Ctrl+Shift+F' });

  commands.register('workbench.action.toggleScm', 'Toggle Source Control View', () => {
    showPanelView('scm');
  }, { category: 'View', keybinding: 'Ctrl+Shift+G' });

  commands.register('workbench.action.toggleExtensions', 'Toggle Supported Integrations', () => {
    showPanelView('extensions');
  }, { category: 'View' });

  commands.register('workbench.action.toggleAiReview', 'Toggle AI Review View', () => {
    showPanelView('ai');
  }, { category: 'View', keybinding: 'Ctrl+Shift+A' });

  commands.register('workbench.action.toggleSidebar', 'Toggle Sidebar Visibility', () => {
    activityBar.toggleSidebar();
    renderSidebar();
  }, { category: 'View', keybinding: 'Ctrl+B' });

  commands.register('workbench.action.togglePanel', 'Toggle Bottom Panel', () => {
    bottomPanel.toggle();
  }, { category: 'View', keybinding: 'Ctrl+`' });

  commands.register('workbench.action.showProblems', 'Show Problems Panel', () => {
    showProblems();
  }, { category: 'View', keybinding: 'Ctrl+Shift+M' });

  commands.register('workbench.action.showOutput', 'Show Output Panel', () => {
    bottomPanel.showTab('output');
    bottomPanel.openPanel();
  }, { category: 'View', keybinding: 'Ctrl+Shift+U' });

  commands.register('workbench.action.showTerminalState', 'Show Terminal Panel (unavailable state)', () => {
    bottomPanel.showTab('terminal');
    bottomPanel.openPanel();
  }, { category: 'View', keybinding: 'Ctrl+`' });

  commands.register('workbench.action.changeTheme', 'Change Theme (Dark / Light)', () => {
    theme.toggle();
    log('workbench', `Theme switched to ${theme.get()}`);
  }, { category: 'Preferences', keybinding: 'Ctrl+Shift+T' });

  commands.register('workbench.action.changeLanguage', 'Change Language Mode…', () => {
    pickLanguage();
  }, { category: 'Preferences', keybinding: 'Ctrl+K M' });

  commands.register('workbench.action.indentation', 'Set Indentation…', (n) => {
    window.__wbSetIndentation(typeof n === 'number' ? n : undefined);
  }, { category: 'Preferences' });

  commands.register('workbench.action.runAiReview', 'AI: Review Current File', () => {
    showPanelView('ai');
    aiReviewPanel.runReview({ scope: 'file' });
  }, { category: 'AI', when: () => aiReviewPanel.isReviewableActive() });

  commands.register('workbench.action.runAiReviewSelection', 'AI: Review Selected Code', () => {
    showPanelView('ai');
    aiReviewPanel.runReview({ scope: 'selection' });
  }, { category: 'AI', when: () => aiReviewPanel.isReviewableActive() });

  commands.register('workbench.action.runAiSecurityReview', 'AI: Security-Focused Review', () => {
    showPanelView('ai');
    aiReviewPanel.runReview({ scope: 'file', focus: 'security' });
  }, { category: 'AI', when: () => aiReviewPanel.isReviewableActive() });

  commands.register('workbench.action.explainCode', 'AI: Explain Selected Code', () => {
    showPanelView('ai');
    aiReviewPanel.runExplain();
  }, { category: 'AI', when: () => aiReviewPanel.isReviewableActive() });

  commands.register('workbench.action.generateFixes', 'AI: Generate Fix Suggestions', () => {
    showPanelView('ai');
    aiReviewPanel.runImprove();
  }, { category: 'AI', when: () => aiReviewPanel.isReviewableActive() });

  commands.register('workbench.action.commandPalette', 'Show All Commands', () => {
    commandPalette.show('commands');
  }, { category: 'Help', keybinding: 'Ctrl+Shift+P' });

  commands.register('workbench.action.goToDashboard', 'Go to Dashboard', () => {
    window.location.hash = '#/dashboard';
  }, { category: 'Help' });
}

// --- Global keybindings ---

function registerKeybindings() {
  // Capture phase: Monaco's key handling can stop propagation of keydown
  // events for combos it recognizes, which would swallow workbench shortcuts
  // while the editor has focus. Listening in the capture phase lets the
  // workbench process its own shortcuts first.
  document.addEventListener('keydown', (e) => {
    const view = document.getElementById('view-workbench');
    if (!view || !view.classList.contains('active')) return;
    const mod = e.ctrlKey || e.metaKey;

    const handled = () => { e.preventDefault(); e.stopPropagation(); };

    if (mod && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      handled();
      commandPalette.show('commands');
    } else if (mod && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
      handled();
      commandPalette.show('files');
    } else if (mod && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      handled();
      showPanelView('explorer');
    } else if (mod && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
      handled();
      showPanelView('search');
    } else if (mod && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
      handled();
      showPanelView('scm');
    } else if (mod && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      handled();
      showPanelView('ai');
    } else if (mod && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
      handled();
      showProblems();
    } else if (mod && e.shiftKey && (e.key === 'T' || e.key === 't')) {
      handled();
      theme.toggle();
    } else if (mod && e.key === 'b') {
      handled();
      activityBar.toggleSidebar();
      renderSidebar();
    } else if (mod && e.key === '`') {
      handled();
      bottomPanel.toggle();
    } else if (mod && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
      handled();
      commands.execute('workbench.action.save');
    } else if (mod && e.key === 'n') {
      handled();
      explorerPanel.createFileFlow();
    } else if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
      handled();
      window.__wbToggleWordWrap();
    }
  }, true);
}

// --- Tab context menu ---

function showTabMenu(e, path) {
  const existing = document.querySelector('.wb-context-menu');
  if (existing) existing.remove();
  const menu = document.createElement('div');
  menu.className = 'wb-context-menu';

  const add = (label, fn) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', () => { menu.remove(); fn(); });
    menu.appendChild(btn);
  };

  add('Close', () => tabStrip.requestClose(path));
  add('Close Others', () => editorGroup.closeOthers(path));
  add('Close All', () => {
    editorGroup.getOpenTabs().slice().forEach((p) => tabStrip.requestClose(p));
  });

  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  menu.style.left = Math.min(e.clientX, window.innerWidth - rect.width - 8) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight - rect.height - 8) + 'px';
  const close = (ev) => {
    if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', close, true); }
  };
  setTimeout(() => document.addEventListener('mousedown', close, true), 0);
}

// --- Editor helpers exposed to commands ---

function bindEditorHelpers() {
  let wordWrap = false;
  window.__wbToggleWordWrap = () => {
    wordWrap = !wordWrap;
    const ed = window.__wbEditor;
    if (ed) ed.updateOptions({ wordWrap: wordWrap ? 'on' : 'off' });
    log('workbench', `Word wrap ${wordWrap ? 'on' : 'off'}`);
  };
  window.__wbSetIndentation = (n) => {
    const size = n || 4;
    const ed = window.__wbEditor;
    if (ed) ed.updateOptions({ tabSize: size, insertSpaces: true });
    log('workbench', `Indentation set to ${size} spaces`);
    statusBar.render();
  };
}

// --- Init ---

async function init() {
  if (initialized) return true;
  initialized = true;

  theme.init();

  const editor = await editorGroup.init();
  window.__wbEditor = editor;

  window.__wb = {
    refreshExplorer,
    refreshProblems,
    showScm,
    showProblems,
    pickLanguage,
    pickIndentation,
    showTabMenu,
  };

  registerCommands();
  registerKeybindings();
  bindEditorHelpers();

  activityBar.render();
  activityBar.onSwitch(() => renderSidebar());
  commandPalette.init();
  statusBar.init();
  bottomPanel.init();

  editorGroup.subscribe((event) => {
    if (event === 'tabs-changed') tabStrip.render();
  });
  workspace.subscribe((event) => {
    tabStrip.render();
    if (event === 'files-changed' || event === 'file-renamed' || event === 'file-saved' || event === 'files-saved') {
      if (activityBar.getView() === 'explorer' || activityBar.getView() === 'scm') renderSidebar();
    }
  });

  tabStrip.render();
  renderSidebar();

  // Titlebar actions.
  const backBtn = document.getElementById('wb-back-dashboard');
  if (backBtn) backBtn.addEventListener('click', () => { window.location.hash = '#/dashboard'; });
  const themeBtn = document.getElementById('wb-theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', () => theme.toggle());
  const welcomeNew = document.getElementById('wb-welcome-new-file');
  if (welcomeNew) welcomeNew.addEventListener('click', () => explorerPanel.createFileFlow());
  const diffClose = document.getElementById('wb-diff-close');
  if (diffClose) diffClose.addEventListener('click', () => editorGroup.closeDiff());

  // Welcome screen visibility.
  const updateWelcome = () => {
    const welcome = document.getElementById('wb-welcome');
    if (welcome) welcome.hidden = !!editorGroup.getActive();
  };
  editorGroup.subscribe(updateWelcome);
  updateWelcome();

  // Account slot: show the signed-in email.
  const slot = document.getElementById('wb-account-slot');
  if (slot) {
    import('../app/auth.js').then(({ auth }) => {
      if (auth.getUser()) {
        slot.innerHTML = `<span style="color:var(--text-muted);font-size:12px;" title="Signed in">${auth.getUser().email}</span>`;
      }
    }).catch(() => { /* auth module unavailable */ });
  }

  // First-run: create an untitled file so the editor is usable immediately.
  if (!workspace.list().length && !editorGroup.getActive()) {
    workspace.createFile('untitled-1.js', '');
    editorGroup.openTab('untitled-1.js');
    refreshExplorer();
  }

  log('workbench', 'Workbench ready');
  return true;
}

// Open reviewed source as a scratch file in the workbench (used by the
// review report page's "Jump to location"). The scratch file is created in
// the browser-local workspace and clearly named after the review.
async function openScratch(name, content, language, line) {
  await init();
  let path = name;
  let counter = 1;
  while (workspace.exists(path)) {
    const dot = name.lastIndexOf('.');
    path = dot > 0 ? `${name.slice(0, dot)}-${counter}${name.slice(dot)}` : `${name}-${counter}`;
    counter += 1;
    if (counter > 50) break;
  }
  workspace.createFile(path, content || '');
  const file = workspace.stat(path);
  if (file && language) file.language = language;
  editorGroup.openTab(path);
  if (line && line >= 1) {
    setTimeout(() => editorGroup.revealLine(path, line), 350);
  }
  log('workbench', `Opened review source as scratch file: ${path}`);
}

export { init, showPanelView, renderSidebar, refreshExplorer, refreshProblems, openScratch };
