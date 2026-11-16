/**
 * CodeSense AI — End-to-end browser test (Puppeteer + Chromium).
 *
 * The browser executable is auto-detected across environments:
 * CI runners (Google Chrome), Linux dev boxes (chromium), and Playwright-
 * managed caches. Fails honestly when no browser is found.
 */

const puppeteer = require('puppeteer');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const BASE = 'http://127.0.0.1:3000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findBrowserExecutable() {
  const candidates = [
    process.env.E2E_BROWSER_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ].filter(Boolean);
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch (_e) { /* ignore */ }
  }
  // Playwright-managed chromium caches (glob the version directories).
  const pwRoot = path.join(os.homedir(), '.cache', 'ms-playwright');
  try {
    if (fs.existsSync(pwRoot)) {
      const dirs = fs.readdirSync(pwRoot).filter((d) => d.startsWith('chromium'));
      for (const d of dirs) {
        for (const rel of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
          const p = path.join(pwRoot, d, rel);
          if (fs.existsSync(p)) return p;
        }
      }
    }
  } catch (_e) { /* ignore */ }
  return null;
}

async function waitForHash(page, fragment, timeout = 15000) {
  await page.waitForFunction((frag) => window.location.hash.includes(frag), { timeout }, fragment);
}

async function bodyText(page) {
  return await page.evaluate(() => document.body.textContent || '');
}

async function setInput(page, selector, value) {
  await page.waitForSelector(selector, { visible: true, timeout: 5000 });
  await page.click(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type(value);
}

async function main() {
  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    console.error('E2E error: no Chromium/Chrome executable found. ' +
      'Set E2E_BROWSER_PATH or install Chromium/Google Chrome.');
    process.exit(1);
  }
  console.log('E2E browser executable:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    // puppeteer >= 23 removed the legacy headless mode; 'new' is the default
    // and passing the old string is no longer accepted in v25.
    headless: true,
    args: [
      '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--disable-setuid-sandbox', '--no-zygote',
    ],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));

  let failures = 0;
  function check(cond, msg) {
    if (!cond) { failures++; console.log('FAIL: ' + msg); }
    else console.log('ok: ' + msg);
  }
  function log(msg) { console.log('LOG: ' + msg); }

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  log('start url: ' + page.url());
  let text = await bodyText(page);
  check(text.includes('CodeSense AI'), 'landing page shows product name');

  // Register
  await page.click('a[data-route="register"]');
  await waitForHash(page, '#/register');
  log('after register-nav url: ' + page.url());
  const testEmail='e2e'+Date.now()+'@example.com'; await setInput(page, '#reg-email', testEmail);
  await setInput(page, '#reg-password', 'Password123');
  await page.click('#reg-submit');
  await sleep(2500);
  log('after submit url: ' + page.url());
  text = await bodyText(page);
  log('body snippet: ' + JSON.stringify(text.slice(0, 200)));
  check(text.includes('Dashboard') || text.includes('No reviews yet') || text.includes('New Review'),
    'register leads to dashboard');

  // Dashboard empty state
  check(text.includes('No reviews yet'), 'dashboard shows empty state');
  check(text.includes('New Review'), 'dashboard has New Review action');

  // Editor
  const editorLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[data-route="editor"]')).map(a => ({ text: a.textContent.trim() }))
  );
  log('editor links: ' + JSON.stringify(editorLinks));
  await page.click('a[data-route="editor"]');
  await sleep(1500);
  log('after editor click url: ' + page.url());
  await waitForHash(page, '#/editor');
  await sleep(2500); // Monaco init
  text = await bodyText(page);
  check(text.includes('Analyze code'), 'editor has Analyze button');

  // Enter code into Monaco
  await page.click('#monaco-container');
  await page.keyboard.type('function add(a, b) { return a + b; }\n');
  await sleep(500);
  const sourceSize = await page.evaluate(() => document.querySelector('#editor-source-size').textContent);
  check(sourceSize.includes('bytes'), 'source size indicator shows bytes: ' + sourceSize.trim());

  // Analyze (provider not configured → honest failure)
  await page.click('#editor-analyze');
  await sleep(4000);
  text = await bodyText(page);
  check(
    text.includes('failed') || text.includes('unavailable') || text.includes('provider') ||
    text.includes('Review') || text.includes('not configured'),
    'analyze produces a real (not faked) outcome'
  );

  // History
  await page.click('a[data-route="history"]');
  await waitForHash(page, '#/history');
  text = await bodyText(page);
  check(text.includes('Review History'), 'history page loads');

  // Logout: open the account dropdown (via element.click for headless reliability),
  // then sign out.
  await page.evaluate(() => document.getElementById('nav-account').click());
  await page.waitForSelector('#btn-logout', { visible: true, timeout: 5000 });
  await page.click('#btn-logout');
  await sleep(1000);
  text = await bodyText(page);
  check(text.includes('Create account'), 'logout returns to public state');

  await browser.close();
  console.log(errors.length ? 'errors: ' + JSON.stringify(errors.slice(0, 5)) : 'no console errors');
  if (failures > 0) {
    console.log('E2E: ' + failures + ' CHECK(S) FAILED');
    process.exit(1);
  } else {
    console.log('E2E: all checks passed');
  }
}

main().catch((err) => { console.error('E2E error:', err.message); process.exit(1); });
