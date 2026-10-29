'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { startServer } = require('./helpers/server');

test('cookie consent banner', async (t) => {
  const server = await startServer();
  const browser = await chromium.launch();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  await t.test('shows on first visit and Accept dismisses + persists', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${server.url}/landing.html`, { waitUntil: 'load' });

    const banner = page.locator('#cookie-banner');
    await assert.doesNotReject(banner.waitFor({ state: 'visible', timeout: 3000 }));

    await page.getByRole('button', { name: /accept/i }).click();
    await assert.doesNotReject(banner.waitFor({ state: 'hidden', timeout: 3000 }));

    const stored = await page.evaluate(() => localStorage.getItem('ledger-cookie-consent'));
    assert.equal(stored, 'accepted');

    // A reload should respect the stored choice and not show the banner again.
    await page.reload({ waitUntil: 'load' });
    const bannerDisplay = await page.locator('#cookie-banner').evaluate((el) => getComputedStyle(el).display);
    assert.equal(bannerDisplay, 'none');

    await ctx.close();
  });

  await t.test('Decline dismisses and records the choice without accepting', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${server.url}/landing.html`, { waitUntil: 'load' });

    await page.getByRole('button', { name: /decline/i }).click();
    const stored = await page.evaluate(() => localStorage.getItem('ledger-cookie-consent'));
    assert.equal(stored, 'declined');

    await ctx.close();
  });
});
