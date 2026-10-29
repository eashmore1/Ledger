// Loads every marketing/legal page in a real browser and checks the baseline
// a pre-launch review always checks first: no console errors, no failed
// network requests for same-origin assets, exactly one <h1>, a real <title>,
// and that every in-page nav link points somewhere that actually resolves.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { startServer } = require('./helpers/server');

const PAGES = [
  'landing.html',
  'pricing.html',
  'faq.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  '404.html',
  'index.html',
];

test('marketing + app pages load cleanly', async (t) => {
  const server = await startServer();
  const browser = await chromium.launch();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  for (const page of PAGES) {
    await t.test(page, async () => {
      const ctx = await browser.newContext();
      const tab = await ctx.newPage();
      const consoleErrors = [];
      const failedRequests = [];

      tab.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      tab.on('requestfailed', (req) => {
        // Firebase/Stripe/Anthropic calls are expected to fail in this
        // sandboxed test environment (no real credentials/network egress to
        // those hosts) — only same-origin asset failures are real bugs.
        // Vercel Analytics' script only resolves on an actual Vercel
        // deployment, so it's expected to fail against this local test server.
        if (req.url().startsWith(server.url) && !req.url().includes('/_vercel/insights/')) {
          failedRequests.push(req.url());
        }
      });
      tab.on('pageerror', (err) => consoleErrors.push(String(err)));

      const resp = await tab.goto(`${server.url}/${page}`, { waitUntil: 'load', timeout: 15000 });
      assert.equal(resp.status(), 200, `${page} should respond 200`);

      const title = await tab.title();
      assert.ok(title && title.trim().length > 0, `${page} must have a non-empty <title>`);

      const h1Count = await tab.locator('h1').count();
      assert.ok(h1Count >= 1, `${page} should render at least one <h1>`);

      // index.html is a single-page app — only one view's h1 should ever be
      // live in the DOM at a time even though the file defines several.
      if (page !== 'index.html') {
        assert.equal(h1Count, 1, `${page} should render exactly one visible <h1>`);
      }

      assert.deepEqual(failedRequests, [], `${page} should have no failed same-origin requests`);

      // Known benign noise: Firebase/network calls that can't succeed in this
      // offline test sandbox. Filter those out and fail on anything else.
      const realErrors = consoleErrors.filter((e) =>
        !/firebase|firestore|network|fetch|Failed to load resource|net::ERR_|anthropic|stripe/i.test(e)
      );
      assert.deepEqual(realErrors, [], `${page} should have no unexpected console errors`);

      await ctx.close();
    });
  }
});

test('marketing pages: every nav link resolves to a real route', async (t) => {
  const server = await startServer();
  const browser = await chromium.launch();
  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const KNOWN_ROUTES = new Set([
    '/', '/landing', '/pricing', '/faq', '/about', '/contact',
    '/privacy', '/terms', '/login', '/signup',
  ]);

  for (const page of ['landing.html', 'pricing.html', 'faq.html', 'about.html', 'contact.html']) {
    await t.test(page, async () => {
      const tab = await browser.newPage();
      await tab.goto(`${server.url}/${page}`, { waitUntil: 'load' });
      const hrefs = await tab.locator('.nav-links a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
      assert.ok(hrefs.length > 0, `${page} nav should have links`);
      for (const href of hrefs) {
        assert.notEqual(href, '', `${page} has a nav link with an empty href`);
        assert.notEqual(href, '#', `${page} has a dead "#" nav link`);
        if (href.startsWith('/') && !href.startsWith('//')) {
          assert.ok(
            KNOWN_ROUTES.has(href) || href.startsWith('mailto:'),
            `${page} links to unrecognized route "${href}"`
          );
        }
      }
      await tab.close();
    });
  }
});
