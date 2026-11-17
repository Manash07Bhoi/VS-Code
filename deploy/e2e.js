/**
 * CodeSense AI — live end-to-end verification.
 * Usage: node e2e.js <BASE_URL> [--label=...]
 * Real HTTP requests only. No mocks, no fake assertions.
 */
const fs = require('fs');
const path = require('path');

const BASE = (process.argv[2] || '').replace(/\/$/, '');
const LABEL = (process.argv.find((a) => a.startsWith('--label=')) || '--label=live').split('=')[1];
if (!BASE) { console.error('usage: node e2e.js <BASE_URL>'); process.exit(2); }

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 300) });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | ${String(detail).slice(0, 260)}`);
}

class Jar {
  constructor() { this.c = new Map(); }
  store(res) {
    const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    for (const sc of list) {
      const [pair, ...attrs] = sc.split(';');
      const idx = pair.indexOf('=');
      const name = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      const expired = /max-age=0/i.test(attrs.join(';')) || val === '';
      if (expired) this.c.delete(name); else this.c.set(name, { val, attrs: attrs.map((a) => a.trim()) });
    }
  }
  header() { return [...this.c.entries()].map(([k, v]) => `${k}=${v.val}`).join('; '); }
  raw(name) { return this.c.get(name); }
}

async function req(jar, method, p, { body, headers = {}, origin } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (jar && jar.header()) h.Cookie = jar.header();
  if (origin) h.Origin = origin;
  const t0 = Date.now();
  const res = await fetch(BASE + p, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  const ms = Date.now() - t0;
  if (jar) jar.store(res);
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, json, text, ms, res };
}

(async () => {
  const jar = new Jar();
  const email = `deploy.check.${Date.now()}@example.com`;
  const password = 'DeployCheck123';
  const NETLIFY = 'https://codesenseai-review.netlify.app';

  // 1. Health — liveness (cold-start timing captured here)
  const live = await req(jar, 'GET', '/api/v1/health/live');
  record('health/live returns 200 ok', live.status === 200 && live.json?.status === 'ok', `HTTP ${live.status} ${JSON.stringify(live.json)} in ${live.ms}ms`);

  // 2. Health — readiness incl. DB
  const ready = await req(jar, 'GET', '/api/v1/health/ready');
  record('health/ready database=connected', ready.status === 200 && ready.json?.checks?.database === 'connected', `HTTP ${ready.status} ${JSON.stringify(ready.json)}`);
  record('health/ready provider honestly not-configured', ready.json?.checks?.provider === 'not-configured', `provider=${ready.json?.checks?.provider}`);

  // 3. CORS preflight from the real Netlify origin
  const pre = await req(jar, 'OPTIONS', '/api/v1/auth/login', {
    headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-csrf-token' },
    origin: NETLIFY,
  });
  const acao = pre.res.headers.get('access-control-allow-origin');
  record('CORS preflight allows Netlify origin + credentials', (pre.status === 204 || pre.status === 200) && acao === NETLIFY && pre.res.headers.get('access-control-allow-credentials') === 'true', `HTTP ${pre.status} ACAO=${acao} ACAC=${pre.res.headers.get('access-control-allow-credentials')}`);

  // 4. CORS must NOT echo an arbitrary origin
  const evil = await req(jar, 'GET', '/api/v1/health/live', { origin: 'https://evil.example' });
  const evilAcao = evil.res.headers.get('access-control-allow-origin');
  record('CORS rejects unknown origin', evilAcao !== 'https://evil.example', `ACAO=${evilAcao}`);

  // 5. CSRF token issue + cookie attributes
  const csrf1 = await req(jar, 'GET', '/api/v1/auth/csrf-token');
  const sid = jar.raw('cs.sid');
  const attrs = (sid?.attrs || []).join('; ').toLowerCase();
  record('csrf-token issues a token', csrf1.status === 200 && typeof csrf1.json?.csrfToken === 'string' && csrf1.json.csrfToken.length === 64, `HTTP ${csrf1.status} len=${csrf1.json?.csrfToken?.length}`);
  record('session cookie cs.sid is HttpOnly+Secure+SameSite=Lax', Boolean(sid) && /httponly/.test(attrs) && /secure/.test(attrs) && /samesite=lax/.test(attrs), attrs);

  // 6. Unauthenticated /me
  const meAnon = await req(jar, 'GET', '/api/v1/auth/me');
  record('GET /auth/me unauthenticated -> 401', meAnon.status === 401, `HTTP ${meAnon.status} ${JSON.stringify(meAnon.json)}`);

  // 7. Registration
  const beforeReg = sid?.val;
  const reg = await req(jar, 'POST', '/api/v1/auth/register', { body: { email, password } });
  const afterReg = jar.raw('cs.sid')?.val;
  record('register creates account', reg.status === 201 && reg.json?.created === true, `HTTP ${reg.status} created=${reg.json?.created}`);
  record('register rotates session id (fixation resistance)', Boolean(beforeReg) && Boolean(afterReg) && beforeReg !== afterReg, `session id changed=${beforeReg !== afterReg}`);
  record('register returns session-bound CSRF token', typeof reg.json?.csrfToken === 'string' && reg.json.csrfToken.length === 64, `len=${reg.json?.csrfToken?.length}`);

  // 8. Duplicate registration must not leak existence
  const dup = await req(jar, 'POST', '/api/v1/auth/register', { body: { email, password } });
  record('duplicate register is non-enumerating', dup.status === 201 && dup.json?.created === false, `HTTP ${dup.status} created=${dup.json?.created} msg="${dup.json?.message}"`);

  // 9. Wrong password
  const badLogin = await req(jar, 'POST', '/api/v1/auth/login', { body: { email, password: 'WrongPass123' } });
  record('login with wrong password -> 401', badLogin.status === 401, `HTTP ${badLogin.status} code=${badLogin.json?.error?.code}`);

  // 10. Correct login (live sessions are persisted in MongoDB)
  const login = await req(jar, 'POST', '/api/v1/auth/login', { body: { email, password } });
  record('login succeeds', login.status === 200 && login.json?.user?.email === email, `HTTP ${login.status} user=${login.json?.user?.email}`);
  let csrf = login.json?.csrfToken || reg.json?.csrfToken;

  // 11. Authenticated /me
  const me = await req(jar, 'GET', '/api/v1/auth/me');
  record('GET /auth/me authenticated -> 200', me.status === 200 && me.json?.user?.email === email, `HTTP ${me.status} user=${me.json?.user?.email}`);

  // 12. DB read: empty review history
  const list0 = await req(jar, 'GET', '/api/v1/reviews');
  record('GET /reviews (DB read) -> 200', list0.status === 200 && Array.isArray(list0.json?.reviews), `HTTP ${list0.status} total=${list0.json?.total}`);

  // 13. CSRF enforcement: mutating request without token
  const noCsrf = await req(jar, 'POST', '/api/v1/reviews', { body: { source: 'const a = 1;', language: 'javascript' } });
  record('review POST without CSRF -> 403 CSRF_ERROR', noCsrf.status === 403 && noCsrf.json?.error?.code === 'CSRF_ERROR', `HTTP ${noCsrf.status} code=${noCsrf.json?.error?.code}`);

  // 14. Review with AI provider not configured -> honest failure (no fake findings)
  const review = await req(jar, 'POST', '/api/v1/reviews', { headers: { 'X-CSRF-Token': csrf }, body: { source: 'const a = 1;\nconsole.log(a);', language: 'javascript', title: 'deploy check' } });
  const honestProvider = review.status === 503 || review.status === 502;
  const noFakeFindings = !Array.isArray(review.json?.findings) || review.json.findings.length === 0;
  record('AI review without provider -> honest 5xx (no fabricated findings)', honestProvider && noFakeFindings, `HTTP ${review.status} code=${review.json?.error?.code || review.json?.status} findings=${JSON.stringify(review.json?.findings)?.slice(0, 80)}`);

  // 15. DB write: the review attempt is persisted with its real status
  const list1 = await req(jar, 'GET', '/api/v1/reviews');
  const persisted = (list1.json?.reviews || []).length > 0;
  record('review attempt persisted in MongoDB', persisted, `HTTP ${list1.status} total=${list1.json?.total} statuses=${JSON.stringify((list1.json?.reviews || []).map((r) => r.status))}`);

  // 16. Language registry (server-side data)
  const langs = await req(jar, 'GET', '/api/v1/languages');
  record('GET /languages returns real registry', langs.status === 200 && (langs.json?.languages || []).length >= 5, `HTTP ${langs.status} count=${(langs.json?.languages || []).length}`);

  // 17. Validation rejection
  const invalid = await req(jar, 'POST', '/api/v1/reviews', { headers: { 'X-CSRF-Token': csrf }, body: { source: 'x', language: 'not-a-language' } });
  record('invalid language rejected -> 400', invalid.status === 400, `HTTP ${invalid.status} code=${invalid.json?.error?.code}`);

  // 18. Logout invalidates the session server-side
  const logout = await req(jar, 'POST', '/api/v1/auth/logout', { headers: { 'X-CSRF-Token': csrf } });
  record('logout succeeds and clears cookie', logout.status === 200 && !jar.raw('cs.sid'), `HTTP ${logout.status} cookieCleared=${!jar.raw('cs.sid')}`);
  const meAfter = await req(jar, 'GET', '/api/v1/auth/me');
  record('session invalid after logout -> 401', meAfter.status === 401, `HTTP ${meAfter.status}`);

  const passed = results.filter((r) => r.ok).length;
  const out = { label: LABEL, base: BASE, when: new Date().toISOString(), passed, total: results.length, email, results };
  fs.writeFileSync(path.join(__dirname, `e2e-${LABEL}.json`), JSON.stringify(out, null, 2));
  console.log(`\nSUMMARY ${LABEL}: ${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('E2E CRASH', e); process.exit(3); });
