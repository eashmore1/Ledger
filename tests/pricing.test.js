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
    assert.equal(await page.locator('#pro-price').innerText(), '$14');
  });

  await t.test('switching to annual updates the plan price', async () => {
    await page.locator('#bill-annual').click();
    assert.equal(await page.locator('#pro-price').innerText(), '$11');
    assert.match(await page.locator('#pro-period').innerText(), /\$132\/yr/);
    const savePillVisible = await page.locator('#save-badge').isVisible();
    assert.ok(savePillVisible, 'annual savings badge should appear');
  });

  await t.test('switching back to monthly restores the monthly price', async () => {
    await page.locator('#bill-monthly').click();
    assert.equal(await page.locator('#pro-price').innerText(), '$14');
  });

  await t.test('exactly one paid subscription tier is offered', async () => {
    assert.equal(await page.locator('.plan-card').count(), 2);
    assert.equal(await page.locator('#elite-price').count(), 0);
  });

  await t.test('the trial is not advertised as card-free', async () => {
    const body = (await page.locator('body').innerText()).toLowerCase();
    assert.ok(!body.includes('requires no payment information'),
      'pricing page must not claim the trial needs no payment information');
    assert.ok(body.includes('card required'),
      'pricing page should disclose that the trial requires a card');
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
