# Data Lifecycle, Retention, Migrations and Recovery — CodeSense AI

## 1. Data classes

- Account identity: email, password hash, creation/update timestamps.
- Session material: opaque session identifier/hash and expiry/revocation metadata if server-managed.
- Review metadata: owner, language, status, timestamps, duration and safe provider metadata.
- Review source: submitted code, if retained.
- Review output: normalized findings, summary and recommendations.
- Operational records: request IDs, error codes and redacted metrics.

## 2. Data minimization

Retain only what is required for the product. Decide explicitly whether source code is retained with the report. If retained, disclose it clearly and provide deletion. If not retained, define how users can still inspect a report and whether source snippets are stored. Do not imply source is ephemeral if it is persisted in MongoDB or sent to an external provider.

## 3. Retention policy

Before release, define:
- account retention;
- review/source retention;
- failed-review retention;
- session expiry;
- operational log retention;
- backup retention;
- deletion propagation and backup expiry.

No arbitrary retention period should be invented in this addendum. Product owner and deployment constraints must approve actual values and document them in the privacy notice.

## 4. Deletion semantics

A user deleting a review must:
- be authenticated;
- own the review;
- receive confirmation before destructive UI action;
- cause the persisted record to be deleted or marked deleted according to the selected policy;
- remove associated source and finding data as specified;
- prevent subsequent detail retrieval;
- not claim immediate deletion from backups or external AI providers unless that behavior is technically and contractually guaranteed.

Account deletion must revoke sessions and remove/anonymize owned data according to approved policy.

## 5. MongoDB indexes

Define indexes from real query patterns, including:
- unique normalized email;
- owner + createdAt descending for history;
- owner + status + createdAt where status filtering is used;
- TTL only for records with approved expiry semantics.

Avoid unbounded arrays and unbounded document growth. Set document and source limits. Index names and migrations must be version-controlled.

## 6. Migrations

Every schema/index change must include:
- migration identifier;
- preconditions;
- forward operation;
- backward/compensation strategy where safe;
- expected duration/locking impact;
- data compatibility window;
- verification query;
- rollback decision;
- release note.

Do not rely on destructive automatic schema mutation at application startup in production.

## 7. Backup and recovery

Document database backup mechanism, encryption, access control, retention, recovery point objective (RPO), recovery time objective (RTO), restore owner and test schedule. A backup is not proven until a restore drill succeeds in an isolated environment. Never invent RPO/RTO values; set and test them.

## 8. Required tests

- owner isolation;
- cascade/associated data deletion;
- index creation on clean DB;
- migration from previous schema;
- failed migration recovery;
- backup restore;
- expired record cleanup;
- bounded history queries;
- database outage behavior.
