// index.html is the full logged-in app. We can't exercise authenticated
// flows here (they need real Firebase credentials this sandbox doesn't
// have), but we CAN verify the one thing every signed-out visitor hits
// first: the app loads and renders a usable sign-in/sign-up screen instead
// of a blank page or an unhandled error.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { startServer } = require('./helpers/server');

test('index.html renders the auth screen for a signed-out visitor', async (t) => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(`${server.url}/index.html`, { waitUntil: 'load' });
  // Firebase init / auth-state resolution happens async — give it a moment.
  await page.waitForTimeout(500);

  assert.deepEqual(pageErrors, [], 'index.html should not throw unhandled JS errors on load');

  const hasEmailField = await page.locator('input[type="email"]').count();
  const hasPasswordField = await page.locator('input[type="password"]').count();
  assert.ok(hasEmailField > 0, 'signed-out app should show an email field');
  assert.ok(hasPasswordField > 0, 'signed-out app should show a password field');

  const authTabs = await page.locator('.auth-tab').count();
  assert.ok(authTabs >= 2, 'should offer both Sign In and Create Account tabs');
});
