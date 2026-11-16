# IDE Workbench Architecture — CodeSense AI

**Updated:** 2026-11-16

The workbench (`frontend/js/workbench/`) is a VS Code-inspired, browser-based developer workbench built on the existing vanilla-JS stack — no framework migration. It replaces the previous single-file editor page; all other app pages (auth, dashboard, history, review reports, settings) are preserved.

## Module map

```
js/workbench/
├── workbench.js          orchestrator: boot order, panel switching, keybindings (capture phase),
│                         command registry wiring, scratch-file opener, titlebar actions
├── workspace.js          browser-local multi-file model (localStorage), CRUD, dirty state,
│                         local checkpoints, search/replace, language detection + caps
├── editorGroup.js        one Monaco instance + one model per file; tabs state (persisted);
│                         cursor/selection/marker events; diff viewer management
├── monacoLoader.js       single CDN load of Monaco, blob-URL worker proxy, cs-dark/cs-light themes
├── tabStrip.js           tab strip UI (active/dirty/close/close-others, middle-click, context menu)
├── activityBar.js        left icon navigation (7 views) + live problems badge
├── statusBar.js          real editor state (language, Ln/Col, selection, indent, encoding, EOL, dirty)
├── commandPalette.js     Ctrl+Shift+P commands / Ctrl+P quick-open files, fuzzy scoring, keyboard nav
├── commands.js           command registry (28 commands; every palette entry works)
├── bottomPanel.js        Problems / Output / Terminal panes; resizer; severity+source filters
├── outputChannel.js      append-only real event log channels (workbench, ai-review)
├── theme.js              dark/light themes persisted, app CSS + Monaco theme sync
├── dialog.js             accessible prompt/confirm dialogs (Enter/Escape, focus management)
└── panels/
    ├── explorerPanel.js  file tree, folders, context menu, new/rename/delete with confirmation
    ├── searchPanel.js    workspace search (case/regex toggles), match navigation, replace/replace-all
    ├── scmPanel.js       honest local-change tracking + local checkpoints (NOT Git)
    ├── runPanel.js       truthful run/debug unavailable state + required architecture
    ├── extensionsPanel.js live language registry + provider status + editor capabilities
    └── aiReviewPanel.js  review file/selection/security, explain, improve→diff (see AI_REVIEW_ARCHITECTURE.md)
```

## Layout

Titlebar (brand, dashboard, account, theme) → body (activity bar 48px | sidebar 260px resizable | main) → main (tab strip | editor area [+ diff overlay] | bottom panel resizable) → status bar. The workbench renders as a full-viewport overlay when its route activates.

## Data flow

1. **Workspace** (`workspace.js`) is the single source of truth for files; it persists to `localStorage` (`codesense-workbench-v1`) and emits events (`files-changed`, `content-changed`, `file-saved`, `file-renamed`).
2. **EditorGroup** creates one Monaco model per opened file (`inmemory://workspace/<path>`), syncs edits back into the workspace on every content change, and re-renders tabs/dirty state.
3. **Tabs** persist open editors + active path (`codesense-workbench-tabs-v1`) and are restored on boot.
4. **Panels** subscribe to workspace/editor events; nothing polls.

## Honest-by-design behaviors

- **Source Control view** tracks working-copy changes against local checkpoints and says clearly it is *not a Git repository*. No fake commits, no fabricated history. The future real-Git architecture (authenticated backend Git service, per docs) is documented in the panel.
- **Run and Debug** and **Terminal** show truthful unavailable states with the isolation architecture a real implementation requires (container sandbox, resource limits, deny-by-default networking, audit logging). No fake breakpoints, no simulated consoles.
- **Problems** aggregates only real sources: Monaco editor diagnostics (JS/TS via Monaco's language services) and AI review findings — each labeled by source; nothing is presented as a compiler error.
- **Diff viewer**: AI proposals open read-only side-by-side; *Accept* marks the file dirty — persistence still requires an explicit save. The original is preserved until approval.

## Keyboard model

Workbench shortcuts (Ctrl+Shift+P/E/F/G/A/M/T, Ctrl+P/B/S/N/\`, Alt+Z) are registered in the **capture phase** so Monaco's key handling cannot swallow them while the editor has focus. In-editor commands (Ctrl+F/H find/replace, multi-cursor Alt+Click, undo/redo) remain Monaco-native.

## Responsiveness

- ≥ 901px: classic docked sidebar.
- ≤ 900px: sidebar becomes a bounded slide-over drawer over the editor only — bottom-panel tabs and status bar remain reachable.
- ≤ 640px: labels condense, status bar hides low-priority items, activity targets shrink (no horizontal overflow at 360px — verified by Playwright at 360×800 and 390×844).
- `prefers-reduced-motion` disables transitions.

## Storage boundaries (clearly labeled in UI)

| Store | Scope | Contents |
|---|---|---|
| `codesense-workbench-v1` | browser-local | workspace files, checkpoints (2 MiB / 200-file caps) |
| `codesense-workbench-tabs-v1` | browser-local | open editors + active tab |
| `codesense-theme` | browser-local | dark/light choice |
| Server database | per-account (authenticated) | users, sessions, persisted reviews |

The browser-local workspace is never described as server-persisted storage or version control.
