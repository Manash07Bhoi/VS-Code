# Website Wireframes — CodeSense AI

These editable text wireframes define layout hierarchy and control placement. They are not claims that the screens already exist.

## 1. Public shell

```text
┌────────────────────────────────────────────────────────────────────┐
│ CodeSense AI                         Product     Sign in  Create    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│          Review code. Understand issues. Improve with clarity.     │
│          Concise product explanation and limitations               │
│                       [ Create account ]                            │
│          Actual capabilities • Privacy • Supported browsers        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

No fabricated customer logos, user counts, testimonials or benchmarks. Every link must lead to real content.

## 2. Authenticated dashboard

```text
┌──────────────┬─────────────────────────────────────────────────────┐
│ Brand        │ Workspace                         Account menu     │
│              ├─────────────────────────────────────────────────────┤
│ Workspace    │ Welcome / useful context                            │
│ New Review   │ [ New code review ]                                  │
│ History      │                                                     │
│ Preferences  │ Recent reviews (actual persisted records)            │
│              │ Review / Language / Status / Date / Open              │
└──────────────┴─────────────────────────────────────────────────────┘
```

With no records, show an honest first-use empty state and New Review action. Never use sample rows.

## 3. Editor workspace

```text
┌────────────────────────────────────────────────────────────────────┐
│ CodeSense AI   Workspace / Editor                  Account         │
├──────────────┬─────────────────────────────────────┬───────────────┤
│ Navigation   │ Review workspace                    │ Guidance      │
│ New Review   │ Language [ supported language  v ]  │ Analysis      │
│ History      │ ┌─────────────────────────────────┐ │ scope         │
│ Preferences  │ │                                 │ │ Privacy and   │
│              │ │        MONACO EDITOR            │ │ limitations   │
│              │ └─────────────────────────────────┘ │               │
│              │ Source size / validation            │               │
│              │ [ Analyze code ]                    │               │
├──────────────┴─────────────────────────────────────┴───────────────┤
│ Real status: Ready / Submitting / Processing / Completed / Failed   │
└────────────────────────────────────────────────────────────────────┘
```

The guidance panel is collapsible. It cannot consume the editor's usable width. Status reflects real lifecycle state.

## 4. Report screen

```text
┌──────────────┬─────────────────────────────────────────────────────┐
│ Navigation   │ Review report                  Back to history      │
│              │ Language • Submitted time • Real status               │
│              │ Summary and review limitations                       │
│              │ [Bugs] [Security] [Performance] [Quality]             │
│              ├───────────────────────┬─────────────────────────────┤
│              │ Finding list          │ Selected finding            │
│              │ Severity / title      │ Explanation                 │
│              │ Location if known     │ Evidence / impact           │
│              │                       │ Recommendation              │
│              │                       │ Improved code if available   │
└──────────────┴───────────────────────┴─────────────────────────────┘
```

No jump action without valid location metadata. No improved-code block without a defensible suggestion.

## 5. History screen

```text
┌──────────────┬─────────────────────────────────────────────────────┐
│ Navigation   │ Review history                                      │
│              │ Search reviews...                                    │
│              │ Language [v] Status [v] Category [v] Date [range]   │
│              │ Sort [Newest first v]          Clear filters         │
│              │ Actual user-owned review records                     │
│              │ Review | Language | Status | Created | Actions        │
│              │ Pagination                                           │
└──────────────┴─────────────────────────────────────────────────────┘
```

No-history, no-match and API-error states are different. Search is server-backed and owner-scoped.

## 6. Account and preferences

```text
┌──────────────┬─────────────────────────────────────────────────────┐
│ Navigation   │ Settings                                             │
│              │ Account / security actions actually implemented       │
│              │ Current account details                              │
│              │ Editor preferences                                   │
│              │ Theme / font size / tab width / word wrap             │
│              │ [ Save changes ]                                     │
└──────────────┴─────────────────────────────────────────────────────┘
```

Only show settings backed by real behavior and persistence. No billing, plan or upgrade area.

## 7. Dialogs and overlays

Use overlays for destructive confirmation, account actions and meaningful selection. Each dialog needs a clear title, consequence, cancel and confirm actions, accessible focus management, Escape behavior where safe and focus return. A toast alone is insufficient confirmation for deletion.

## 8. Implementation review

Compare rendered pages with these structures. Record intentional deviations and reasons. Test navigation, desktop layout, overflow, panel resizing, focus and all state variants. A wireframe is not proof of a working screen.
