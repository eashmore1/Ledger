'use strict';
// The calculator button sits next to Ledger only while a session is running,
// and the solo session screen uses the study-room look.
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

test('session calculator', async (t) => {
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());
  for (const [label, viewport] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    await t.test(label + ': calculator appears only during a session and works', async () => {
      const u = await H.signUpAndOnboard(env, { name: 'Cal ' + label, email: 'cal-' + label + '@test.dev', viewport });
      const p = u.page;
      await H.clearFirstRun(p);
      assert.equal(await p.locator('#calc-btn.show').count(), 0, 'no calculator outside a session');
      await p.evaluate(() => openSessionModal());
      await p.fill('#ss-mat', 'Bond amortization');
      await p.click('#ss-start-btn');
      await p.waitForSelector('#sess-overlay.sess-live .room-clock#sess-clock');
      assert.match(await p.textContent('.solo-topic'), /Bond amortization/);
      await p.waitForSelector('#calc-btn.show');
      await p.click('#calc-btn'); // clickable above the full-screen session
      await p.waitForSelector('#calc-panel.open');
      for (const k of ['1', '2', '0', '0', '*', '5', '%']) await p.click(`#calc-panel [data-k="${k}"]`);
      await p.click('#calc-panel [data-k="="]');
      assert.equal(await p.textContent('#calc-panel .calc-val'), '60');
      await p.keyboard.type('250+50');
      await p.keyboard.press('Enter');
      assert.equal(await p.textContent('#calc-panel .calc-val'), '300');
      if (label === 'desktop') await p.screenshot({ path: process.env.SHOT_DIR ? process.env.SHOT_DIR + '/calc-' + label + '.png' : '/dev/null' }).catch(() => {});
      else await p.screenshot({ path: process.env.SHOT_DIR ? process.env.SHOT_DIR + '/calc-' + label + '.png' : '/dev/null' }).catch(() => {});
      await p.keyboard.press('Escape');
      assert.equal(await p.locator('#calc-panel.open').count(), 0);
      // Pausing keeps it; ending the session takes it away.
      await p.click('.sess-ctrl-pause');
      assert.equal(await p.locator('#calc-btn.show').count(), 1);
      await p.click('.sess-ctrl-resume');
      await p.evaluate(() => { TS.startTime = Date.now() - 1800 * 1000; });
      await p.click('.sess-ctrl-end');
      await p.waitForSelector('.sess-save-btn');
      assert.equal(await p.locator('#calc-btn.show').count(), 0, 'gone once the session ends');
      assert.deepEqual(H.appErrors(u), []);
      await u.context.close();
    });
  }
});
