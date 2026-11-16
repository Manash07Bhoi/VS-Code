# Feature Matrix — CodeSense AI Workbench

**Legend:** ✓ fully implemented & verified · ◐ partial/limited (noted) · ✗ not implemented (honest state provided)

## Workbench shell

| Feature | Status | Notes |
|---|---|---|
| Activity bar (7 views) | ✓ | Explorer, Search, Source Control, Run/Debug, Integrations, AI Review, Problems — every icon functional |
| Sidebar panels | ✓ | Per-view content, header actions, resize (desktop), slide-over drawer ≤ 900px |
| Editor tabs | ✓ | Multiple files, active tab, dirty dots, close/close-others/close-all, middle-click, overflow scroll, persisted |
| Command palette | ✓ | Ctrl+Shift+P; 28 registered commands, fuzzy search, keyboard nav, keybinding hints |
| Quick open | ✓ | Ctrl+P fuzzy file search over the workspace |
| Status bar | ✓ | Live language, Ln/Col + selection, Spaces, UTF-8, EOL, unsaved count, problems, theme — real editor state |
| Bottom panel | ✓ | Problems / Output / Terminal tabs; drag + keyboard resize; open/close |
| Themes | ✓ | Dark + light, persisted, app CSS + Monaco themes switch together |
| Responsive | ✓ | 360/390/768/1366/1920 verified by Playwright; no horizontal overflow at 360px |
| Accessibility | ✓ | ARIA roles (tabs/tree/dialog/listbox), focus-visible, keyboard nav, reduced-motion; Lighthouse a11y 1.00 |

## Editor (Monaco)

| Feature | Status | Notes |
|---|---|---|
| Syntax highlighting | ✓ | JS, TS, Python, Java, C++ (+ JSON/MD/HTML/CSS/plaintext editing) |
| Line numbers / minimap / folding | ✓ | |
| Bracket matching / auto-close | ✓ | |
| Multi-cursor, selection highlight | ✓ | Alt+Click, Monaco-native |
| Find / replace in file | ✓ | Ctrl+F / Ctrl+H (Monaco) |
| Undo/redo per file | ✓ | Per-model histories |
| Word wrap toggle | ✓ | Alt+Z command |
| JS/TS diagnostics | ✓ | Monaco language services → Problems panel (labeled "Editor") |
| Python/Java/C++ IntelliSense | ✗ | No language servers; basic editing only — never implied otherwise |
| Language selection | ✓ | Status-bar picker + command (session-only override, labeled) |

## Workspace

| Feature | Status | Notes |
|---|---|---|
| Multi-file workspace | ✓ | Browser-local (localStorage), 2 MiB / 200-file caps, clearly labeled |
| Create/rename/delete files & folders | ✓ | Dialogs + context menus with confirmations |
| Dirty state & save/save-all | ✓ | Ctrl+S / palette; unsaved-change protection on close |
| Search across files | ✓ | Match counts, grouping, navigation, case/regex |
| Replace / replace all | ✓ | Per-file and workspace-wide with explicit confirmation |
| Workspace state restore | ✓ | Files + open tabs + active tab restored on reload |
| Server-persisted workspace | ✗ | Out of scope (documented); reviews ARE server-persisted |

## AI capabilities

| Feature | Status | Notes |
|---|---|---|
| Review current file | ✓ | Persisted review; findings list + Problems panel integration |
| Review selection | ✓ | Line-offset-corrected navigation |
| Security-focused review | ✓ | `focus: security` through the API, persisted |
| Explain code | ✓ | Ephemeral assist endpoint; panel render |
| Generate fix suggestions | ✓ | Assist improve → diff viewer → explicit Accept/Reject |
| Finding navigation | ✓ | Opens file, reveals + highlights range |
| Stale-finding protection | ✓ | SHA-256 digest comparison; refuses navigation when stale |
| Review history | ✓ | Preserved pages + "Open saved review report" link |
| Provider-unavailable state | ✓ | Honest 503/failed states everywhere; never canned output |

## Source control / execution

| Feature | Status | Notes |
|---|---|---|
| Changed-file list | ✓ | Local working-copy changes vs newest checkpoint |
| Diff preview | ✓ | Monaco diff editor per change |
| Local checkpoints | ✓ | Labeled "not a commit"; last 10 kept |
| Real Git (branch/stage/commit) | ✗ | Requires authenticated backend Git service (architecture documented) |
| Terminal | ✗ | Truthful unavailable state + required isolation architecture |
| Run / debug | ✗ | Truthful unavailable state + required isolation architecture |
| Fake alternatives | — | None exist anywhere in the product |
