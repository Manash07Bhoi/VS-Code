/**
 * CodeSense AI — deployed frontend workflow test (real Chromium).
 * Drives the live Netlify site against the live Render backend.
 * Failures are classified so only genuine API defects fail the run.
 */
// Playwright is a dev dependency of ./backend: run with
//   node deploy/browser_test.js
// after `npm --prefix backend ci && npx --prefix backend playwright install chromium`.
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('../backend/node_modules/playwright')); }
const fs = require('fs');

const SITE = 'https://codesenseai-review.netlify.app';
const results = [];
const rec = (n, ok, d) => { results.push({ name: n, ok, detail: String(d).slice(0, 400) }); console.log(`${ok ? 'PASS' : 'FAIL'} | ${n} | ${String(d).slice(0, 240)}`); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const consoleErrors = [];
  const events = [];
  let lastNavAt = Date.now();
  const nav = async (url, opts) => { lastNavAt = Date.now(); return page.goto(url, opts); };

  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push({ text: m.text(), at: Date.now() }); });
  page.on('requestfailed', (r) => events.push({ kind: 'failed', url: r.url(), err: r.failure()?.errorText, at: Date.now() }));
  page.on('response', (r) => { if (r.status() >= 400) events.push({ kind: 'http', url: r.url(), status: r.status(), at: Date.now() }); });

  const email = `browser.check.${Date.now()}@example.com`;
  const password = 'BrowserCheck123';

  // 1. App boots
  const t0 = Date.now();
  const resp = await nav(SITE + '/', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForFunction(() => window.__CODESENSE_READY === true, { timeout: 30000 });
  rec('SPA boots and signals ready', resp.status() === 200, `HTTP ${resp.status()} in ${Date.now() - t0}ms, __CODESENSE_READY=true`);

  // 2. Register through the real UI
  await nav(SITE + '/#/register', { waitUntil: 'networkidle' });
  await page.fill('#reg-email', email);
  await page.fill('#reg-password', password);
  await Promise.all([page.waitForFunction(() => location.hash.includes('dashboard'), { timeout: 45000 }), page.click('#reg-submit')]);
  const navEmail = (await page.textContent('#nav-email')).trim();
  rec('UI registration -> dashboard, signed in', navEmail === email, `hash=${await page.evaluate(() => location.hash)} navEmail=${navEmail}`);

  // 3. Session cookie is first-party on the Netlify origin (proxy, not cross-site)
  const sid = (await ctx.cookies()).find((c) => c.name === 'cs.sid');
  rec('session cookie first-party on netlify origin', Boolean(sid) && sid.domain === 'codesenseai-review.netlify.app', `domain=${sid?.domain} httpOnly=${sid?.httpOnly} secure=${sid?.secure} sameSite=${sid?.sameSite}`);

  // 4. Reload -> session persists (MongoDB-backed, not process memory)
  await nav(SITE + '/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__CODESENSE_READY === true, { timeout: 30000 });
  const me = await page.evaluate(async () => { const r = await fetch('/api/v1/auth/me', { credentials: 'include' }); return { status: r.status, body: await r.json() }; });
  rec('session survives full page reload', me.status === 200 && me.body.user.email === email, `HTTP ${me.status} user=${me.body?.user?.email}`);

  // 5. History renders the real (empty) DB result
  await nav(SITE + '/#/history', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const hist = await page.evaluate(() => ({
    err: (document.getElementById('history-error')?.hidden === false) ? document.getElementById('history-error').textContent.trim() : '',
    emptyShown: Boolean(document.getElementById('history-empty') && !document.getElementById('history-empty').hidden),
    items: document.querySelectorAll('#history-list [data-review-id]').length,
  }));
  rec('history renders real DB result', hist.err === '' && (hist.emptyShown || hist.items > 0), `error="${hist.err}" emptyStateShown=${hist.emptyShown} items=${hist.items}`);

  // 6. Workbench shell renders for an authenticated user
  await page.waitForTimeout(1500);
  await nav(SITE + '/#/workbench', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const wb = await page.evaluate(() => { const r = document.getElementById('wb-root'); return Boolean(r && r.offsetHeight > 0); });
  rec('authenticated workbench shell renders', wb, `wb-root visible=${wb}`);

  // 7. Logout through the UI
  const logoutResp = page.waitForResponse((r) => r.url().includes('/api/v1/auth/logout'), { timeout: 45000 });
  await page.evaluate(() => document.getElementById('btn-logout').click());
  const lr = await logoutResp;
  rec('UI logout returns 200', lr.status() === 200, `HTTP ${lr.status()}`);
  const after = await page.evaluate(async () => (await fetch('/api/v1/auth/me', { credentials: 'include' })).status);
  rec('after logout /auth/me -> 401', after === 401, `HTTP ${after}`);

  // --- Failure classification ---
  const isApi = (u) => u.includes('codesenseai-review.netlify.app/api/');
  const expectedAnon = (e) => isApi(e.url) && /\/auth\/me$/.test(e.url) && (e.status === 401);
  const navAborted = (e) => e.err === 'net::ERR_ABORTED' && (e.at - lastNavAt) < 4000;
  const apiDefects = events.filter((e) => isApi(e.url) && !expectedAnon(e) && !navAborted(e));
  const thirdParty = events.filter((e) => !isApi(e.url) && !(e.url.startsWith(SITE)));
  rec('no unexpected API failures on the proxied origin', apiDefects.length === 0, apiDefects.map((e) => `${e.status || e.err} ${e.url}`).slice(0, 4).join(' ; ') || 'none (only expected anonymous /auth/me 401s and navigation-aborted fetches)');
  const badConsole = consoleErrors.filter((c) => !/status of 401/.test(c.text));
  rec('no unexpected console errors', badConsole.length === 0, badConsole.slice(0, 3).map((c) => c.text).join(' ; ') || 'none');

  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  fs.writeFileSync(__dirname + '/browser-test.json', JSON.stringify({
    when: new Date().toISOString(), site: SITE, backend: 'https://codesense-ai-backend-9skh.onrender.com',
    passed, total: results.length, results,
    observations: { thirdPartyOrCDNIssues: thirdParty.map((e) => `${e.status || e.err} ${e.url}`), consoleErrors },
  }, null, 2));
  console.log(`\nSUMMARY browser: ${passed}/${results.length} passed`);
  if (thirdParty.length) console.log('OBSERVED third-party/CDN issues (pre-existing, frontend scope):', thirdParty.map((e) => `${e.status || e.err} ${e.url}`).join(' ; '));
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('BROWSER TEST CRASH', e.message); process.exit(3); });
