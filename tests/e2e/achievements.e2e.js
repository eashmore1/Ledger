// Achievements: "View all" pop-up, the "i" explanation, the page behind stays
// still, and every badge's name and icon fit inside its box.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

// Problems with any visible badge: text cut off, a word wider than the box,
// anything spilling outside it, or the "i" covering the icon.
const fit = () => [...document.querySelectorAll('.ach-item')].filter((t) => t.offsetParent).flatMap((t) => {
  const n = t.querySelector('.ach-name'), out = [];
  if (n.scrollHeight > n.clientHeight + 1) out.push('cut off: ' + n.textContent);
  const ts = getComputedStyle(t), cs = getComputedStyle(n);
  const room = t.clientWidth - parseFloat(ts.paddingLeft) - parseFloat(ts.paddingRight);
  const c = document.createElement('canvas').getContext('2d');
  c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  n.textContent.toUpperCase().split(/[\s-]+/).forEach((w) => {
    const wd = c.measureText(w).width + w.length * (parseFloat(cs.letterSpacing) || 0);
    if (wd > room + 0.5) out.push(`word too wide: ${w}`);
  });
  const r = t.getBoundingClientRect();
  [...t.children].forEach((ch) => { const q = ch.getBoundingClientRect(); if (q.left < r.left - 0.5 || q.right > r.right + 0.5 || q.bottom > r.bottom + 0.5) out.push('spills: ' + n.textContent); });
  const i = t.querySelector('.ach-info-btn').getBoundingClientRect(), ic = t.querySelector('.ach-icon').getBoundingClientRect();
  if (i.left < ic.right && i.bottom > ic.top) out.push('i covers icon: ' + n.textContent);
  return out;
});

test('achievements pop-up', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  for (const vp of [{ width: 390, height: 844 }, { width: 1366, height: 800 }]) {
    await t.test(`at ${vp.width}px`, async () => {
      const A = await H.signUpAndOnboard(env, { name: 'Ach ' + vp.width, email: `ach${vp.width}@example.com`, viewport: vp });
      const p = A.page;
      await H.clearFirstRun(p);
      await H.logSession(p);
      await p.evaluate(() => switchTab('profile'));
      assert.deepEqual(await p.evaluate(fit), [], 'profile badges fit');

      await p.click('button:has-text("View all")');
      await p.waitForSelector('#ach-modal.open');
      const total = await p.evaluate(() => ACHIEVEMENTS.length);
      assert.equal(await p.locator('#ach-modal .ach-item').count(), total);
      assert.ok(total >= 55, 'expanded achievement list');
      assert.deepEqual(await p.evaluate(fit), [], 'pop-up badges fit');

      // Only the list scrolls; the page behind doesn't move.
      const y = await p.evaluate(() => scrollY);
      const box = await p.locator('#ach-modal-body').boundingBox();
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      for (let i = 0; i < 12; i++) await p.mouse.wheel(0, 600);
      await p.waitForTimeout(300);
      assert.equal(await p.evaluate(() => scrollY), y, 'page behind stayed put');
      assert.ok(await p.evaluate(() => document.getElementById('ach-modal-body').scrollTop) > 0, 'list scrolled');

      // "i" explains how to earn it, with progress on your own profile.
      await p.evaluate(() => { document.getElementById('ach-modal-body').scrollTop = 0; });
      await p.click('#ach-modal .ach-item:has-text("In the Zone") .ach-info-btn', { force: true });
      await p.waitForSelector('#ach-info.open');
      const info = (await p.textContent('#ach-info .modal-box')).replace(/\s+/g, ' ');
      assert.match(info, /How to earn it Log 10 study sessions/);
      assert.match(info, /Your progress\s*1 \/ 10 sessions/);
      await p.click('#ach-info .modal-close');

      await p.keyboard.press('Escape');
      assert.equal(await p.evaluate(() => document.documentElement.classList.contains('modal-lock')), false, 'page unfrozen after closing');
      assert.deepEqual(H.appErrors(A), []);
      await A.context.close();
    });
  }
});
