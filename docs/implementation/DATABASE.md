# Database Design — CodeSense AI

MongoDB with Mongoose. The backend owns all database access; the browser never connects directly.

## Collections

### users

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Primary key |
| `email` | String | Unique, normalized lowercase, trimmed, min 3 / max 254 |
| `passwordHash` | String | bcrypt hash (work factor 12), never plaintext |
| `status` | String | `active` \| `disabled`, default `active` |
| `lastAuthenticatedAt` | Date | Updated on successful login |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

**Indexes:**
- `email` — unique (owner lookup, duplicate prevention)

### reviews

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Primary key |
| `owner` | ObjectId → users | Required, indexed; every query includes owner scope |
| `language` | String | Canonical ID (javascript, typescript, python, java, cpp) |
| `title` | String | Optional, max 200 |
| `source` | String | Retained source (max 256 KiB at schema level, 64 KiB at API level) |
| `sourceDigest` | String | SHA-256 of source (revision identity) |
| `sourceSize` | Number | Byte length of source |
| `status` | String | `accepted` \| `processing` \| `completed` \| `failed` |
| `findings` | Array | Normalized finding objects (see below) |
| `summary` | String | Plain-language summary |
| `limitationNotice` | String | Honest analysis-limits notice |
| `provider` | String | Provider name (e.g. `gemini`) |
| `model` | String | Model name |
| `promptVersion` | String | Prompt schema version |
| `schemaVersion` | String | Output schema version |
| `correlationId` | String | Request correlation ID |
| `failureReason` | String | Honest failure reason when status = `failed` |
| `completedAt` | Date | Completion timestamp |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

**Finding sub-schema (embedded, no `_id`):**
- `findingId` — stable unique ID
- `category` — `bug/correctness` \| `security` \| `performance` \| `code-quality`
- `severity` — `low` \| `medium` \| `high` \| `critical` (nullable)
- `confidence` — `low` \| `medium` \| `high` (nullable, independent of severity)
- `title`, `explanation`, `impact`, `recommendation`, `evidence`, `snippet`, `caveats` — strings
- `lineStart`, `lineEnd` — integer line numbers or null

**Indexes:**
- `{ owner: 1, createdAt: -1 }` — history sort
- `{ owner: 1, status: 1, createdAt: -1 }` — filtered history
- `{ owner: 1, _id: 1 }` — detail/delete lookup

### sessions (connect-mongodb-session)

| Field | Notes |
|-------|-------|
| `_id` | Session ID |
| `expires` | TTL index (expireAfterSeconds = SESSION_MAX_AGE_MS / 1000) |
| `session` | Session JSON (userId, email, csrfToken, etc.) |

**Indexes:** TTL on `expires`.

## Ownership and isolation

Every private review query includes `owner: req.auth.userId` in the MongoDB predicate:
- `findOne({ _id: reviewId, owner: ownerId })` — detail
- `deleteOne({ _id: reviewId, owner: ownerId })` — deletion
- `find({ owner: ownerId, ...filter })` — list

Cross-user access returns `404` (no IDOR, no enumeration).

## Index creation

Run `scripts/ensure-indexes.js` (idempotent) to create all indexes. Indexes are also defined in Mongoose schemas and created automatically on model initialization; the script is an explicit operational step.

## Retention and deletion

- User deletion (not yet implemented as a separate endpoint) would remove the user record and all owned reviews.
- Review deletion removes the record and associated source.
- No data is sent to or promised deleted from the external AI provider (provider-side deletion not controllable).
- Backups: not implemented in this release; document as a deployment-time requirement.
