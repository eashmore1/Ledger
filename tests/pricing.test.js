'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { startServer } = require('./helpers/server');

test('pricing page', async (t) => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  await page.goto(`${server.url}/pricing.html`, { waitUntil: 'load' });

  await t.test('defaults to monthly pricing', async () => {
    assert.equal(await page.locator('#pro-price').innerText(), '$9');
    assert.equal(await page.locator('#elite-price').innerText(), '$14');
  });

  await t.test('switching to annual updates both plan prices', async () => {
    await page.locator('#bill-annual').click();
    assert.equal(await page.locator('#pro-price').innerText(), '$7');
    assert.equal(await page.locator('#elite-price').innerText(), '$11');
    const savePillVisible = await page.locator('#save-badge').isVisible();
    assert.ok(savePillVisible, 'annual savings badge should appear');
  });

  await t.test('switching back to monthly restores monthly prices', async () => {
    await page.locator('#bill-monthly').click();
    assert.equal(await page.locator('#pro-price').innerText(), '$9');
    assert.equal(await page.locator('#elite-price').innerText(), '$14');
  });

  await t.test('FAQ accordion expands and collapses on click', async () => {
    const firstItem = page.locator('.faq-item').first();
    const firstQuestion = firstItem.locator('.faq-q');
    assert.equal(await firstItem.evaluate((el) => el.classList.contains('open')), false);

    await firstQuestion.click();
    assert.equal(await firstItem.evaluate((el) => el.classList.contains('open')), true);

    await firstQuestion.click();
    assert.equal(await firstItem.evaluate((el) => el.classList.contains('open')), false);
  });
});
