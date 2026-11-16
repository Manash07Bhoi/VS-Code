# Product Content, UX Writing and Terminology Guide

## 1. Voice

Use a precise, calm, respectful and educational voice. Avoid hype, fear-based security language and absolute guarantees. Explain technical issues plainly without talking down to experienced developers.

## 2. Preferred product language

- “AI-assisted review” rather than “perfect code scanner”.
- “Potential security concern” when exploitability is not established.
- “Finding” or “suggestion” rather than declaring each model output a confirmed bug.
- “No findings returned” rather than “Your code is completely safe”.
- “Suggested improvement” rather than “Guaranteed fix”.
- “Analysis could not be completed” rather than a fake successful report.

## 3. Finding structure

Each finding should answer:
1. What was observed?
2. Where is it located, if reliably known?
3. Why might it matter?
4. What source evidence supports it?
5. How confident is the analysis and what context is missing?
6. What practical next step should the user take?

Severity estimates impact if real; confidence indicates evidence strength. Do not collapse them into a single status.

## 4. Empty and error wording

Explain why an empty state has no content and what genuine next action exists. Error text identifies failed operation and safe next step without exposing stack trace or secrets. Do not blame the user for service failure. Avoid vague errors when a more precise safe message is available.

## 5. Notifications and status

Use “Review submitted”, “Review completed” and “Review could not be completed” only when backend confirms the state. Do not say “Saved” before persistence succeeds. Never show percentage progress unless backend reports actual progress.

## 6. Marketing claims

Do not claim complete vulnerability detection, guaranteed fixes, security certification, benchmark superiority, customer adoption or performance improvement without evidence. Explain that AI can miss issues and produce false positives. Disclose external AI processing of source code.

## 7. Consistency

Use terms consistently for review, finding, category, history and report. Maintain a glossary if useful. Map API error codes to consistent copy. Review every visible string for clarity, grammar and true application behavior.
