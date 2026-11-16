# Privacy and Source-Code Data Protection — CodeSense AI

## 1. Sensitive content

Submitted code may contain proprietary source, credentials, personal data or trade secrets. Treat source and reports as confidential user content.

## 2. User-facing disclosure

Before first review, explain in plain language:
- code is transmitted to the CodeSense AI backend;
- the configured AI provider may receive the code for analysis;
- what is stored in the app database;
- whether original source is retained with the report;
- how long data is retained;
- how users can delete reports/account;
- limits on deletion from backups and external providers.

Do not promise that code is never stored or never used by a provider unless verified against actual system behavior and provider terms.

## 3. Data minimization

- Do not collect source unless user submits it.
- Do not log full source.
- Do not store provider request/response dumps by default.
- Avoid unnecessary profile fields.
- Do not create analytics tracking without a clear purpose and disclosure.
- Do not send source to multiple providers without explicit architecture and disclosure.

## 4. Deletion

Provide review deletion and account deletion only when the complete backend lifecycle exists. Define deletion from primary database, replicas, logs, backups and provider systems separately. State what is immediate and what expires according to retention.

## 5. Privacy review

Before release, inspect privacy notices, actual database fields, logs, analytics, provider configuration, backups and deletion behavior. The written policy must match deployed reality. Seek jurisdiction-specific legal review where required; this document is an engineering requirement, not legal advice.
