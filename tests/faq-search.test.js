'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { startServer } = require('./helpers/server');

test('FAQ search and filtering', async (t) => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  await page.goto(`${server.url}/faq.html`, { waitUntil: 'load' });

  const items = page.locator('.faq-item');
  const totalCount = await items.count();
  assert.ok(totalCount > 5, 'FAQ page should have a real set of questions');

  await t.test('a matching query narrows results without hiding everything', async () => {
    await page.fill('#faq-search', 'refund');
    // filterFaq runs synchronously on input — give the DOM a tick to settle.
    await page.waitForTimeout(100);
    const visible = await items.evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
    assert.ok(visible > 0, 'searching "refund" should return at least one result');
    assert.ok(visible < totalCount, 'searching "refund" should narrow the list, not show everything');
  });

  await t.test('a nonsense query shows the no-results state, not a blank page', async () => {
    await page.fill('#faq-search', 'zzzznonexistentquery12345');
    await page.waitForTimeout(100);
    const visible = await items.evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
    assert.equal(visible, 0, 'a nonsense query should match zero FAQ items');
    const noResultsVisible = await page.locator('#no-results').evaluate((el) => getComputedStyle(el).display !== 'none');
    assert.ok(noResultsVisible, 'the no-results message should be shown when nothing matches');
  });

  await t.test('clearing the search restores every item', async () => {
    await page.fill('#faq-search', '');
    await page.waitForTimeout(100);
    const visible = await items.evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
    assert.equal(visible, totalCount, 'clearing the search should restore the full list');
  });
});
