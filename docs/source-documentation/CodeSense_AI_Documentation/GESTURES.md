# Desktop Gestures, Pointer and Keyboard Interaction Specification

## 1. Scope

CodeSense AI targets desktop Chrome and Firefox. Mouse, keyboard, trackpad and standard pointer interaction are in scope. Android and native touch interaction are not product requirements. Every meaningful pointer action must have keyboard access.

## 2. Pointer behavior

- Single click activates button, link, navigation item, tab or finding.
- Editor click places caret and focuses Monaco.
- Click outside nonmodal popover closes it only when safe.
- Double-click selection follows Monaco.
- Text selection supports normal browser/editor copy behavior.
- Panel resize dragging is supported only with visible affordance, bounded width and keyboard alternative.
- Hover may reveal secondary help, but essential behavior is never hover-only.
- Destructive action must not trigger from ambiguous row clicks.

## 3. Trackpad and scrolling

Use native scrolling and clear scroll containers. Avoid nested scroll traps. Maintain focus visibility when moving to findings. Do not hijack browser back/forward gestures. Horizontal scrolling is limited to code or genuinely wide data and must not hide essential actions.

## 4. Keyboard navigation

- Tab / Shift+Tab: move in logical visual order.
- Enter: activate focused links/buttons or submit a valid form using native semantics.
- Space: activate button/checkbox as appropriate; do not submit unexpectedly.
- Escape: close menus/popovers/dialogs when safe and restore focus; never silently discard code.
- Arrow keys: follow native/select/menu/listbox/tab interaction conventions.
- Preserve browser and Monaco shortcuts.

## 5. Application shortcuts

Introduce global shortcuts only when useful and non-conflicting. Document and make discoverable. Do not bind destructive actions to one unmodified key. Analyze shortcut, if provided, must be modifier-based, check editor context and prevent duplicate submission. Test in both browsers.

## 6. Dialogs and menus

Dialogs trap focus while open, have accessible names, close by Escape when safe and return focus to trigger. Confirmation dialog must identify actual object/action and consequence. Menus support keyboard open/close and remain open while focus moves into contents. Tooltips cannot contain the only copy of essential instructions.

## 7. Editor-specific behavior

Monaco owns caret movement, selection, indentation, folding and editor shortcuts. App-level listeners must not interfere. Navigation controls must remain keyboard reachable. Focus changes cannot lose the draft.

## 8. Reduced motion and alternatives

Respect `prefers-reduced-motion`. No drag-only navigation, gesture-only deletion or swipe-only actions. Resizing/reordering has a non-drag alternative. Status cannot depend only on animation, color or pointer shape.

## 9. Verification

Test key journeys keyboard-only, mouse-only and mixed. Verify focus, Escape, editor shortcut conflicts, dialog focus return, scrolling and data-loss prevention in supported browsers.
