# Cold-start measurement — Render Free

Service: `codesense-ai-backend` (`srv-dbtu9ggjo6nc73fldetg`)
URL: <https://codesense-ai-backend-9skh.onrender.com>
Measured: 2026-11-17, one continuous session, no keep-alive ping configured.

## Method

The backend received **no traffic at all** (no curl, no browser, no CI job) between the
timestamps below. Render's API/log calls do not reach the service instance, so they do
not reset the idle timer. The first request afterwards was timed end-to-end with
`fetch()` from a machine outside Render; the server log was then inspected to confirm
that a **new process** had started (proving the previous instance really was gone and
this was a genuine cold start, not a warm hit).

## Run 1 — 16.0 minutes idle → **no spin-down**

| Time (UTC) | Event |
| --- | --- |
| 05:40:01 | last application request (logout) |
| 05:56:02 | first request after idle: **HTTP 200 in 326 ms** |

No new `codesense-backend.started` line appeared, i.e. the instance was **still warm**
after 16 idle minutes. Render documents a 15-minute idle spin-down; that did not take
effect here. Treat the spin-down timer as *approximate and platform-controlled*, not a
guarantee.

## Run 2 — 20.5 minutes idle → **real cold start**

| Time (UTC) | Event |
| --- | --- |
| 05:56:02 | last application request of the previous run |
| 06:16:38 | first request after idle → **HTTP 200 after 22,520 ms** |
| 06:16:49 | Render starts the process (`Running 'npm start'`) |
| 06:16:57 | `codesense-db.connected` (Atlas `ac-pndnnwt-shard-00-01`, db `codesense_ai`) |
| 06:16:57 | `codesense-backend.started` port 10000, host 0.0.0.0, `database:connected` |
| 06:16:41 | second (warm) request: **HTTP 200 in 197 ms** |
| 06:16:41 | session check: **HTTP 200 in 725 ms** |

Breakdown of the 22.5 s:

- ~11 s: platform scheduling / instance provision before the process is launched
- ~7 s: process start → Express listening + Mongoose connected
- remainder: connection setup and the first Atlas round-trip

So: **first request after a real spin-down ≈ 22 s (measured); subsequent requests
~200–750 ms.**

## Session persistence across the restart

A session was created **before** the idle window (logged in at 05:37) and its signed
cookie was replayed after the cold start:

```
pre-restart session: HTTP 200 in 725 ms -> user=session.probe.1794893826821@example.com
```

The same session still authenticated against a **freshly started process**. Sessions live
in MongoDB Atlas (`sessions` collection, TTL store), so a spin-down/restart does **not**
log users out. Only the in-process CSRF/session *memory* would have been lost — and there
is none; CSRF tokens are stored in the session document too.

## Practical consequences

1. A visitor arriving after a long idle period waits ~20 s for their first page action that
   touches the API.
2. A request that arrives *while* the instance is spinning down may fail; the frontend
   surfaces an honest error (it never shows fabricated data). A retry succeeds.
3. Keep-alive pinging would eliminate the wait but consumes the free 750 instance-hours
   per month for the whole workspace, so it is **not** enabled here.

## Reproduce

```bash
# leave the service completely idle for 20+ minutes, then:
curl -s -o /dev/null -w "first request: %{http_code} in %{time_total}s\n" \
  https://codesense-ai-backend-9skh.onrender.com/api/v1/health/live
curl -s -o /dev/null -w "warm request:  %{http_code} in %{time_total}s\n" \
  https://codesense-ai-backend-9skh.onrender.com/api/v1/health/live
```

Then confirm a new process actually started:

```bash
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/logs?ownerId=<ownerId>&resource=srv-dbtu9ggjo6nc73fldetg&limit=50&direction=backward" \
  | grep -o '"message":"codesense-backend.started[^}]*}'
```
