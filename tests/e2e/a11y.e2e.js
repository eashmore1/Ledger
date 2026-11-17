// Automated WCAG 2 A/AA check (axe-core) of the marketing pages and the main
// signed-in screens, in light and dark mode.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const axe = require('axe-core');
const H = require('./harness');

const RULES = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } };
async function violations(p) {
  await p.addScriptTag({ content: axe.source });
  const r = await p.evaluate(async (opts) => (await axe.run(document, opts)).violations, RULES);
  return r.map((v) => `${v.id} ×${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' — ' + ((n.any[0] && n.any[0].message) || '').slice(0, 120)).join(' | ')}`);
}

test('accessibility (WCAG 2 AA)', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  await t.test('marketing pages', async () => {
    for (const scheme of ['light', 'dark']) {
      const ctx = await env.browser.newContext({ colorScheme: scheme });
      await ctx.addInitScript(() => { try { localStorage.setItem('ledger-cookie-consent', 'declined'); } catch (e) {} });
      await ctx.route(/fonts\.(googleapis|gstatic)|_vercel/, (r) => r.fulfill({ status: 200, body: '' }));
      const p = await ctx.newPage();
      for (const pg of ['landing', 'pricing', 'about', 'faq', 'contact', 'terms', 'privacy', '404']) {
        await p.goto(`${env.server.url}/${pg}.html`, { waitUntil: 'load' });
        assert.deepEqual(await violations(p), [], `${pg} (${scheme})`);
      }
      await ctx.close();
    }
  });

  const A = await H.signUpAndOnboard(env, { name: 'Ada Access', email: 'ada.access@example.com' });
  const p = A.page;
  await H.clearFirstRun(p);
  await H.logSession(p, { material: 'Leases' });
  await H.settle(p);

  for (const dark of [false, true]) {
    await t.test(`signed-in app (${dark ? 'dark' : 'light'})`, async () => {
      if (dark) { await p.evaluate(() => toggleTheme()); await p.waitForTimeout(400); }
      for (const tab of ['today', 'dashboard', 'feed', 'explore', 'plan', 'studylab', 'profile']) {
        await p.evaluate((x) => switchTab(x), tab); await p.waitForTimeout(800);
        assert.deepEqual(await violations(p), [], `tab ${tab}`);
      }
      await p.evaluate(() => openAppSettings('privacy')); await p.waitForTimeout(500);
      assert.deepEqual(await violations(p), [], 'settings');
      await p.evaluate(() => closeAppSettings());
      await p.evaluate(() => openUpgradeModal()); await p.waitForTimeout(400);
      assert.deepEqual(await violations(p), [], 'upgrade');
      await p.evaluate(() => closeUpgradeModal());
    });
  }
});
