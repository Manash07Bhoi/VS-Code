# Database Design and Data Integrity — CodeSense AI

## 1. Database choice

MongoDB with Mongoose is the default proposal because review results are structured and nested. Verify hosting, backup and index capabilities. If repository or operational evidence justifies another database, document the decision before changing it.

## 2. Core collections

### users

Purpose: account identity and authentication metadata.

Fields to consider: stable identifier, normalized unique email, password hash, account status, created/updated timestamps, last-authenticated timestamp where justified, security/version metadata and basic preferences if stored on profile. Never store plaintext passwords, provider keys or recoverable password content.

Indexes: unique normalized email and only other indexes justified by actual queries. Apply schema validation and explicit update allowlists.

### reviews

Purpose: one submitted review lifecycle and retained result.

Fields to consider: stable identifier, immutable owner, canonical language ID, safe label/title, submitted source or privacy-conscious retained representation, source digest/revision, source size, lifecycle status, category summaries derived from actual findings, normalized findings, improved-code output if present, provider/model metadata, prompt/schema version, correlation ID, timestamps, failure category and retention metadata.

Source retention is a product/privacy decision. If source is retained for report detail or location navigation, disclose it and enable deletion. If source is not retained, design report behavior accordingly.

Indexes: owner plus created timestamp for history sort; owner plus status/date where filters exist; owner plus identifier lookup. Every detail/delete query includes owner scope. Index findings only if real queries require it.

### preferences (optional)

Use a separate collection only if preferences are not stored on the user record. Possible fields: theme, editor font size, tab size, word wrap and reduced-motion preference. Validate values. Do not create unused collections/fields.

### notifications (conditional)

Create only if real persisted events require it. Fields: owner, event type, source entity, safe display content, created timestamp, read timestamp and delivery state if needed. Never seed fake events. Index owner and read/created state.

## 3. Relationships and ownership

- One user owns many reviews.
- A review has exactly one immutable owner.
- Notification, if implemented, belongs to a user and references a real event.
- Preferences belong to one user.
- Account deletion follows a documented cleanup policy.

Every private-data query includes the authenticated owner in its database predicate. Do not fetch by ID and rely only on frontend checks.

## 4. Review lifecycle

Use only lifecycle statuses the implementation supports. A minimal state may be accepted/processing/completed/failed. Add queued/cancelled only with genuine durable job/cancellation mechanisms. Completed requires a persisted schema-valid report. Failed must not contain a fabricated result.

## 5. Validation and schema evolution

Validate required fields, enums, lengths, nested finding shapes, timestamps and owner references. Avoid unbounded arrays and oversized source documents. Add schema versioning when report structure changes. Migration/backfill operations must be repeatable, logged and tested with a test database or verified backup.

## 6. Retention and deletion

Document actual retention duration for source, reports, accounts and logs. Do not promise provider-side deletion without provider support and verification. User deletion removes app-controlled records and separately stored source/artifacts. Account deletion handles reviews, notifications and preferences. Backups need expiry and must not be represented as immediate erasure.

## 7. Security

Use least-privilege DB user, encrypted transport where supported, restricted network access, no frontend credentials, no raw document/source logging, ID validation, allowlisted query construction against NoSQL injection and projections that avoid unnecessary sensitive fields.

## 8. Backup and recovery

Choose backup frequency based on actual hosting/recovery needs. Record encryption, access, retention and owner. Test restoration periodically; a backup job alone does not prove recoverability.

## 9. Verification

Test unique email behavior, schema constraints, owner isolation, stable pagination, filtering, deletion, persistence across restart, index creation and database outage. Use separate test DB; never run destructive tests against production.
