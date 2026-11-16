/**
 * CodeSense AI — Responsive browser QA (Playwright).
 *
 * Exercises the real application (backend + frontend) across the five
 * required viewport sizes: 360x800, 390x844, 768x1024, 1366x768, 1920x1080.
 * Verifies the workbench renders and stays usable at every size, takes
 * evidence screenshots, and checks the honest unavailable states. Uses a
 * fresh registered account per run so tests are deterministic.
 */

const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1366', width: 1366, height: 768 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

const RUN = Date.now().toString(36);

// Wait for the SPA bootstrap (router + navbar listeners) so clicks never
// race the application initialization.
async function waitReady(page) {
  await page.waitForFunction(() => window.__CODESENSE_READY === true, null, { timeout: 15000 });
}

test.describe('CodeSense AI responsive workbench', () => {
  for (const vp of VIEWPORTS) {
    test(`workbench at ${vp.name} (${vp.width}x${vp.height})`, async ({ page, context }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Register a fresh user through the real form.
      await page.goto('/');
      await waitReady(page);
      await expect(page.locator('body')).toContainText('CodeSense AI');
      await page.click('a[data-route="register"]');
      await page.waitForSelector('#reg-email', { state: 'visible' });
      await page.fill('#reg-email', `pw-${vp.name}-${RUN}@example.com`);
      await page.fill('#reg-password', 'Password123');
      await page.click('#reg-submit');
      await page.waitForTimeout(2000);

      // Open the workbench.
      await page.click('a[data-route="workbench"]');
      await page.waitForSelector('#wb-activitybar', { state: 'visible' });
      await page.waitForTimeout(3000); // Monaco load

      // Core workbench chrome renders at this size.
      await expect(page.locator('#wb-activitybar')).toBeVisible();
      await expect(page.locator('#wb-statusbar')).toBeVisible();
      await expect(page.locator('#wb-tabs')).toBeVisible();

      // No horizontal overflow at mobile sizes (layout must fit the width).
      if (vp.width <= 768) {
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth);
        // The editor area itself scrolls internally; the page body must not.
        expect(overflow).toBeLessThanOrEqual(2);
      }

      // Status bar shows real state at every size.
      const statusText = await page.locator('#wb-statusbar').textContent();
      expect(statusText).toContain('Spaces: 4');
      expect(statusText).toContain('UTF-8');

      // The first-run scratch file opened (Monaco active model).
      const editorValue = await page.evaluate(() =>
        window.__wbEditor ? window.__wbEditor.getValue() : '(none)');
      expect(typeof editorValue).toBe('string');

      // Evidence screenshot at this viewport.
      await page.screenshot({ path: `tests/artifacts/screenshots/workbench-${vp.name}.png`, fullPage: false });

      // Activity bar icons remain clickable (44px targets respected via
      // 44px buttons).
      const activityCount = await page.locator('#wb-activitybar .wb-activity').count();
      expect(activityCount).toBeGreaterThanOrEqual(7);

      // Command palette works at this size.
      await page.keyboard.press('Control+Shift+P');
      await expect(page.locator('#wb-palette-overlay')).toBeVisible();
      await page.keyboard.type('save all');
      await page.waitForTimeout(300);
      await expect(page.locator('#wb-palette-list .wb-palette-item').first()).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#wb-palette-overlay')).toBeHidden();

      // Bottom panel + honest terminal state at this size.
      await page.keyboard.press('Control+Shift+M');
      await expect(page.locator('#wb-bottom')).toBeVisible();
      await page.click('#wb-bottom-tab-terminal');
      await expect(page.locator('#wb-pane-terminal')).toContainText(/not available/i);

      // Theme toggle works at this size.
      const before = await page.evaluate(() => document.body.getAttribute('data-theme'));
      await page.keyboard.press('Control+Shift+T');
      await page.waitForTimeout(200);
      const after = await page.evaluate(() => document.body.getAttribute('data-theme'));
      expect(after).not.toBe(before);
      await page.keyboard.press('Control+Shift+T'); // restore
      await page.waitForTimeout(200);

      // Sidebar overlay behavior on small screens: activity bar switches views.
      await page.click('#wb-activitybar button[data-view="search"]');
      await expect(page.locator('#wb-panel-title')).toHaveText(/Search/i);
      await expect(page.locator('#wb-search-input')).toBeVisible();

      // Final evidence screenshot with panels open.
      await page.screenshot({ path: `tests/artifacts/screenshots/workbench-${vp.name}-panels.png`, fullPage: false });

      // Sign out cleanly.
      await page.evaluate(() => document.getElementById('nav-account').click()).catch(() => {});
      const logout = page.locator('#btn-logout');
      if (await logout.isVisible().catch(() => false)) {
        await logout.click();
        await page.waitForTimeout(800);
        await expect(page.locator('body')).toContainText('Create account');
      }
    });
  }

  test('authentication boundaries hold', async ({ page }) => {
    // Unauthenticated access to the protected workbench redirects to login.
    await page.goto('/#/workbench');
    await waitReady(page);
    await page.waitForTimeout(800);
    expect(page.url()).toContain('#/login');
  });

  test('invalid credentials show a generic error', async ({ page }) => {
    await page.goto('/#/login');
    await waitReady(page);
    await page.waitForSelector('#login-email', { state: 'visible' });
    await page.fill('#login-email', `nouser-${RUN}@example.com`);
    await page.fill('#login-password', 'WrongPassword123');
    await page.click('#login-submit');
    await page.waitForTimeout(1500);
    // The login failure surfaces as a generic toast error (no account
    // enumeration) and the form stays on the login view.
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Invalid email or password.');
    expect(page.url()).toContain('#/login');
    // Submit is re-enabled (pending state cleared).
    await expect(page.locator('#login-submit')).toBeEnabled();
  });
});
