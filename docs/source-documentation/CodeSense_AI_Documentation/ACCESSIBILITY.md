# Accessibility Specification — CodeSense AI

## 1. Standard

Aim for WCAG 2.2 AA practices across public and authenticated screens. Accessibility is a functional requirement. Monaco has its own interaction model; document and test actual integration limitations rather than claiming conformance automatically.

## 2. Semantics

Use landmark elements, logical heading order, descriptive document titles, field labels, buttons for actions and links for navigation. Do not use generic containers as interactive controls without correct semantics, keyboard handling and states. DOM order should follow visual reading order.

## 3. Keyboard access

Navigation, forms, dialogs, menus, filters, reports and deletion actions must be keyboard accessible. Focus is visible. Dialogs manage and return focus. Avoid traps. Preserve Monaco shortcuts. Provide keyboard alternatives to panel resizing or drag operations.

## 4. Screen readers

Associate errors with fields. Announce async state through suitable live regions without repetition. State loading/completion/failure in text. Give icon buttons accessible names. Use table headers and meaningful list relationships. Convey severity/category in text, not color alone.

## 5. Visual accessibility

Check text/non-text contrast, focus visibility, zoom and text resizing. Avoid tiny metadata. Never rely only on color. Support reduced motion. Ensure syntax highlighting and selection are distinguishable. Avoid flashing/continuous movement.

## 6. Forms

Use persistent labels, clear instructions, field errors and an error summary where appropriate. Do not clear the form after one validation error. Password reveal control must announce its state.

## 7. Monaco Editor

Verify keyboard navigation, editor label, focus entry/exit, diagnostic announcements and high-contrast behavior where supported. Provide accessible description and alternatives for critical actions. Document user configuration needed. Do not claim full editor accessibility without testing.

## 8. Motion and interaction

Honor `prefers-reduced-motion`. Avoid hover-only and gesture-only functionality. Provide adequate desktop targets. Animation must not obscure state or delay action.

## 9. Testing

Run automated accessibility scans on representative pages, but do not treat scans as proof. Perform keyboard-only, zoom/reflow, contrast and manual screen-reader spot checks. Record browsers, assistive technology, flows and limitations.
