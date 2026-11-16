# Screen-by-Screen Product and UX Specification

This document defines CodeSense AI screens. Route names are finalized by implementation and documented consistently. Target desktop Chrome and Firefox; Android is out of scope.

## 1. Global authenticated shell

Shared shell contains brand identity, primary navigation, page title/context, account menu, notification access only where real events exist, and central content. Keep the editor uncluttered. Active navigation must reflect the current route and be keyboard accessible. Menus close on Escape/outside click and restore focus to the trigger.

## 2. Public landing / product introduction

Purpose: explain actual product value and route visitors to registration/login. Content includes product name, truthful capability summary, limitations, supported browser expectations and account actions. Do not show fabricated customer logos, user counts, statistics, testimonials, pricing or benchmark claims. Links must lead to real pages. Do not promise guest analysis if it is not implemented.

## 3. Registration

Layout: focused form with original logo, concise explanation, email, password, visibility toggle, documented password guidance, submit and login link. Policy links appear only when real policy content exists. Client validation provides immediate feedback; server remains authoritative. Prevent duplicate submission. Show field errors, safe creation failure, throttling and success only after persistence/session creation. Do not fake mail verification.

## 4. Login

Layout: email, password, reveal control, submit and registration link. Password recovery appears only when a real secure delivery flow exists. Apply server-side throttling, secure session creation and non-revealing credential errors. Handle network, session and rate-limit failures.

## 5. Dashboard / workspace overview

Purpose: provide user's actual recent reviews and a clear start action. Layout: welcome/context, New Review action, actual recent report list and account/preferences link. Counts must derive from records. No decorative metric cards without a defined query. Recent items navigate to actual reports. States: loading, first-use empty, populated, API failure and expired session.

## 6. Code editor workspace

Purpose: write/paste code and request analysis. Layout: compact top bar, language selector, Monaco surface, optional collapsible guidance panel, source-size feedback, Analyze action and accessible status area. Editor dominates the viewport.

Controls:
- language selector exposes only review-supported languages, or clearly separates editor syntax modes;
- Monaco initialization is asynchronous and reports genuine failure;
- Analyze cannot submit empty, unsupported or oversized input;
- code is never silently truncated;
- clearing meaningful content requires confirmation;
- draft persistence is explicitly defined; no autosave claim without implementation;
- report is bound to submitted source revision;
- duplicate submissions are prevented;
- leaving with unsaved code or processing review follows an explicit rule.

States: loading, ready, editor unavailable, empty source, invalid/oversized source, pending, processing, completed, failed, provider unavailable and session expired.

## 7. Review report

Purpose: explain the actual result of one saved analysis. Layout: report context, language/date/status, caveated summary, category navigation, finding list, detail panel, location if known, recommendation and improved code if available.

Each finding displays category, severity if justified, confidence/evidence strength, title, explanation, impact, source location only when reliable, evidence and recommended action. No invented line numbers. Zero findings is “no findings returned,” not “code is safe.”

Interactions: select category/finding, copy real recommendation/code, jump only when location exists, apply a suggestion only with confirmation and preservation of original source. States include loading, not found, unauthorized, failed, completed with findings, completed without findings, malformed legacy data and network failure.

## 8. Review history

Purpose: manage persisted reports belonging to the authenticated user. Layout: search, language/status/category/date filters where supported, sort, actual result count, table/list, pagination and clear filters.

Show safe metadata: title/label, language, created time, status and summary derived from stored report. Use server-side search/filter/sort/pagination, stable ordering and validated sort fields. Reset page on filter changes. Delete with confirmation and update actual results. States: loading, no history, no matches, populated, API/database error, page out of range and session expired.

## 9. Account/security settings

Show account identity, password change if securely implemented, session/logout, account deletion only with verified deletion flow, and privacy/retention explanation. Never show password hashes or tokens. Sensitive changes require confirmation/re-authentication as appropriate. No subscription or premium settings.

## 10. Application preferences

Possible genuine preferences: theme, editor font size, tab size, word wrap and reduced motion. Only show settings that alter real UI/editor behavior and persist as documented. Validate allowed values. Clearly distinguish local-only and server-synced preferences.

## 11. Notifications

A notification surface is allowed only for real persisted events. Synchronous review may use inline status. Asynchronous reviews may show actual completed/failed events, read state and report links. Never show sample entries or a fabricated badge count.

## 12. System screens

Not-found, access-denied, expired-session and service-unavailable screens must explain the condition and provide real navigation/recovery. Maintenance state appears only when driven by a real operator/deployment signal.

## 13. Screen acceptance

For each screen verify layout, semantics, keyboard focus, route access, each control, loading/empty/error/success states, browser console, network, desktop responsive widths and persistence claims. A visual appearance alone does not establish completion.
