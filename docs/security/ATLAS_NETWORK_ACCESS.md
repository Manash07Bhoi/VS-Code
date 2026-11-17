# MongoDB Atlas network access — exposure and trade-off

Status: documented risk, accepted for the free-tier deployment (2026-11-17).

## What is configured

MongoDB Atlas → Network Access allows connections broadly (the deployment requires access
from Render, and Render's **free** plan has no static egress IPs — the address pool is
dynamic and not publishable as a fixed allow-list entry).

With that rule, the database's internet-facing control is:

1. TLS on every connection (Atlas enforces TLS; the driver connects with `mongodb+srv`,
   which implies `tls=true`).
2. A database user scoped to the application (`alberteinstein9485_db_user`) with a
   generated, high-entropy password stored **only** in the Render dashboard.
3. No database credential anywhere in git, the frontend bundle, logs, or documentation
   (verified: `git grep` for the password/URI/`AIza`/token patterns returns 0 tracked
   files).

## Why it cannot simply be tightened

- Render Free does not offer static outbound IPs, so an IP allow-list entry cannot be made
  durable for this service. Narrowing the rule to today's address would break the
  deployment as soon as the instance is rescheduled (and it is rescheduled on every deploy
  and every cold start).
- Atlas' private endpoints / VPC peering are not available on the free tier.

The alternative that removes the exposure — a paid plan with static egress, or hosting the
backend in the same network as the database — would require spending money, which the
zero-budget requirement forbids.

## Residual risk (stated plainly)

- Anyone on the internet can **reach the TCP/TLS endpoint** of the cluster. They cannot
  authenticate without the credentials; Atlas enforces auth per database user and rate
  limits failed logins.
- A leaked credential would be exploitable from anywhere (no network fence). That is why
  the password is uncommitted and rotated through the Render dashboard only.
- The cluster is a free tier M0: no point-in-time recovery, limited backup guarantees.
  Data loss would be unrecoverable beyond any manual dump.

## Mitigations in place

| Control | State |
| --- | --- |
| TLS required | Atlas enforced; connection verified |
| Separate DB user for the app | yes |
| Strong random password | yes (dashboard-only) |
| Secrets never committed | verified by scan (0 hits) |
| Least-privilege credential | user is scoped to the `codesense_ai` database (Atlas default for a project user) |
| Session data protected | session cookie is `HttpOnly`+`Secure`; only a signed session id round-trips |
| Application-level auth | bcrypt password hashes, session regeneration, CSRF on mutations, rate limiting |

## If this ever needs to be production-grade

1. Move the backend to a host with static egress (Render Starter+, Fly, a VPS) and restrict
   Atlas to those addresses only.
2. Or move to Atlas' paid tier and use Private Endpoint / VPC peering.
3. Enable continuous backups / point-in-time recovery.
4. Add database-level alerting on failed authentication spikes.

Until one of those is funded, this document is the accepted risk statement: the exposure
is **the network path, not the credentials**, and the credentials are the only defence —
which is why they are handled as secrets and never committed.
