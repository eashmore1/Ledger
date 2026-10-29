'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { startServer } = require('./helpers/server');

test('contact form does not falsely claim delivery', async (t) => {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  await page.goto(`${server.url}/contact.html`, { waitUntil: 'load' });

  await page.fill('#fname', 'Jordan');
  await page.fill('#lname', 'Smith');
  await page.fill('#email', 'jordan@example.com');
  await page.selectOption('#topic', 'support');
  await page.fill('#message', 'Test message from the automated test suite.');

  // mailto: navigation can't actually be fulfilled in a headless test browser
  // (no mail client), so suppress the resulting navigation attempt and just
  // verify the in-page state afterward.
  await page.evaluate(() => {
    window.addEventListener('beforeunload', (e) => e.preventDefault());
  });
  await page.locator('.submit-btn').click();

  const successText = await page.locator('#success-msg').innerText();
  assert.doesNotMatch(
    successText,
    /message sent/i,
    'contact form must not claim the message was sent — mailto: delivery can\'t be confirmed from JS'
  );
  assert.match(successText, /support@ledgercpa\.app/, 'the success state must show a direct fallback email address');

  const successVisible = await page.locator('#success-msg').evaluate((el) => getComputedStyle(el).display !== 'none');
  assert.ok(successVisible, 'success state should be shown after submit');
});
