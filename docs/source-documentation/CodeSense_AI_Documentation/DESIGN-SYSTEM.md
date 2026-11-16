# CodeSense AI Design System

## 1. Principles

1. Editor-first hierarchy.
2. Quiet confidence rather than excessive neon/decorative effects.
3. Readability for extended coding sessions.
4. Honest, backend-derived state.
5. Predictable interaction.
6. Accessible motion and reduced-motion support.
7. No visual implication of data or functionality that does not exist.

## 2. Visual direction

Use a dark-first developer interface with deep charcoal/graphite foundations, elevated neutral surfaces and restrained violet/indigo accent. Reserve semantic colors for state: red for serious errors, amber for warnings, blue for information/in-progress and green for verified success. Never communicate state through color alone.

A light theme is optional and should ship only when all pages, editor, syntax theme, dialogs, code blocks, states and interactions are fully designed and tested.

## 3. Design tokens

Centralize CSS custom properties for:
- page/surface/elevated surface/border/text/muted/accent/focus/success/warning/danger/information colors;
- base spacing scale;
- typography families, sizes, weights and line heights;
- radii for controls, cards, panels and overlays;
- elevation/shadow levels;
- z-index layers;
- motion duration/easing;
- editor dimensions and desktop responsive breakpoints.

Tokens live in one authoritative source. Do not scatter arbitrary colors throughout components. Check contrast in each theme.

## 4. Typography

Use a legible licensed UI font with system fallbacks and a monospaced code font. Keep a disciplined heading scale. Avoid oversized marketing typography inside the workspace. Ensure body, findings and metadata are readable at common desktop zoom.

## 5. Layout

Authenticated shell uses consistent navigation and content canvas. Editor split layout gives the code surface priority and provides an optional secondary panel. Panels have minimum widths; they cannot cover Analyze action. Tables/reports have sensible max-width and scroll behavior.

At compact desktop widths, collapse secondary panels before shrinking text/controls below usable size. Android support is not claimed.

## 6. Components

Build reusable button, icon button, form field, select, badge, tab, menu, dialog, toast, table/list, pagination, empty state, loading skeleton, error panel, finding card, code block and editor toolbar.

Each component specifies semantic role, accessible name, default/hover/focus/active/disabled/loading states, error handling, keyboard behavior, responsive behavior, reduced-motion behavior and event/result contract. Use actual button/link semantics. Icon-only actions require accessible labels.

## 7. Monaco styling

Align editor background, gutters, selection, cursor, current-line highlight, diagnostics and typography with app theme. Avoid brittle overrides of Monaco internals. Ensure stable container sizing and dispose editor instances/listeners on route teardown.

## 8. Motion

Use short, purposeful transitions for navigation, panel expansion, dialogs and menus. Avoid parallax, continuous animated backgrounds, distracting particles or long entrance animations. Respect reduced motion. Never animate fake progress; use measured progress or indeterminate state.

## 9. Logo and icons

Create original CodeSense AI identity related to code inspection/clarity. Do not copy VS Code/Microsoft marks. Provide scalable vector, horizontal/compact variants, monochrome/accent variants and favicon. Keep icon family consistent. Emoji should not be production iconography.

## 10. Quality review

Review all screens across supported desktop widths and common zoom levels. Check hierarchy, contrast, spacing, alignment, state designs, focus, reduced motion and editor readability. Screenshots of conceptual designs are not proof of working functionality.
