// The first-run tour must GUIDE: each step spotlights what it describes, and
// between sections the next tab is highlighted and is the only thing that can
// be clicked. It used to be a card that reappeared whenever you happened to
// open another tab, with nothing telling you where to go.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

// The spotlight glides between targets (0.25s), so let it settle before measuring.
const state = async (p) => { await p.waitForTimeout(350); return p.evaluate(() => {
  const spot = document.getElementById('onb-spot');
  const r = spot && getComputedStyle(spot).display !== 'none' ? spot.getBoundingClientRect() : null;
  return { title: document.querySelector('.onb-title')?.innerText || null, tab: currentTab, spot: r && { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height } };
}); };
// The element actually under the middle of the spotlight.
const underSpot = (p) => p.evaluate(() => {
  const s = document.getElementById('onb-spot').getBoundingClientRect();
  const sh = document.getElementById('onb-shield'); sh.style.display = 'none';
  const el = document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2);
  sh.style.display = '';
  return (el.closest('[onclick],[data-mnav],#nav-avatar-btn') || el).outerHTML.slice(0, 200);
});

async function walk(p, { onGoto } = {}) {
  const seen = [];
  for (let i = 0; i < 60; i++) {
    const st = await state(p);
    if (!st.title) break;
    seen.push(st.title);
    if (/^Open /.test(st.title)) { await onGoto(st); await p.waitForFunction((t) => document.querySelector('.onb-title') && document.querySelector('.onb-title').innerText !== t, st.title); continue; }
    if (/all set/.test(st.title)) { await p.click('.onb-next'); break; }
    await p.click('.onb-next');
    await p.waitForTimeout(150);
  }
  return seen;
}

test('guided first-run tour', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  await t.test('desktop: steps spotlight their subject and the next tab is the only click target', async () => {
    const A = await H.signUpAndOnboard(env, { name: 'Alice Tester', email: 'alice@example.com' });
    const a = A.page;
    await a.click('#post-ob-offer button:has-text("Free")');
    await a.waitForSelector('#onb-card');

    // Walk the Feed section.
    for (const title of ["Hi, I'm Ask Ledger", 'Your Feed', 'Give props and comment', 'Build your study crew']) {
      assert.equal((await state(a)).title, title);
      await a.click('.onb-next');
    }
    // Between sections: Dashboard is highlighted...
    let st = await state(a);
    assert.equal(st.title, 'Open Dashboard');
    assert.match(await underSpot(a), /switchTab\('dashboard'\)/);
    // ...clicking anything else does nothing...
    await a.mouse.click(5, 450);
    const exploreTab = await a.locator(".nav-tab[onclick=\"switchTab('explore')\"]").boundingBox();
    await a.mouse.click(exploreTab.x + exploreTab.width / 2, exploreTab.y + exploreTab.height / 2);
    await a.waitForTimeout(400);
    assert.equal((await state(a)).tab, 'feed', 'clicks outside the highlight are blocked');
    // ...and clicking the highlight continues the tour on that page.
    await a.mouse.click(st.spot.x, st.spot.y);
    await a.waitForFunction(() => document.querySelector('.onb-title')?.innerText === 'Your command center');
    assert.equal((await state(a)).tab, 'dashboard');

    // In-section steps spotlight the thing they describe.
    await a.click('.onb-next');
    await a.waitForTimeout(700);
    st = await state(a);
    assert.equal(st.title, 'Readiness Score');
    assert.ok(st.spot, 'Readiness step has a spotlight');
    assert.match(await a.evaluate(() => { const s = document.getElementById('onb-spot').getBoundingClientRect(); const r = document.getElementById('readiness-ring').getBoundingClientRect(); return String(r.left >= s.left && r.right <= s.right && r.top >= s.top && r.bottom <= s.bottom); }), /true/, 'the readiness ring sits inside the spotlight');

    // Finish the rest by clicking only where the tour points.
    const titles = await walk(a, { onGoto: async (s) => { await a.mouse.click(s.spot.x, s.spot.y); } });
    for (const t of ['Open Study Lab', 'Open Study Plan', 'Open Explore', 'Open Profile', "You're all set"]) assert.ok(titles.includes(t), 'tour reached: ' + t);
    assert.equal(await a.evaluate(() => localStorage.getItem('pf2-onb-done')), '1');
    assert.equal(await a.locator('#onb-card, #onb-spot, #onb-shield').count(), 0, 'tour cleans up after itself');
    assert.deepEqual(H.appErrors(A), []);
    await A.context.close();
  });

  await t.test('phone: tabs inside "More" are reached through the More sheet', async () => {
    const B = await H.signUpAndOnboard(env, { name: 'Bob Builder', email: 'bob@example.com', viewport: { width: 390, height: 844 } });
    const b = B.page;
    await b.click('#post-ob-offer button:has-text("Free")');
    await b.waitForSelector('#onb-card');
    let sawMore = false;
    await walk(b, {
      onGoto: async (s) => {
        if (/More/.test(await b.locator('#onb-body').innerText())) {
          assert.match(await underSpot(b), /data-mnav="more"/);
          sawMore = true;
          await b.mouse.click(s.spot.x, s.spot.y);
          await b.waitForTimeout(500); // sheet slides up; spotlight follows to the row
          const st = await state(b);
          assert.match(await underSpot(b), /mob-more-row/);
          await b.mouse.click(st.spot.x, st.spot.y);
        } else {
          assert.match(await underSpot(b), /data-mnav/);
          await b.mouse.click(s.spot.x, s.spot.y);
        }
      },
    });
    assert.ok(sawMore, 'Study Plan / Explore were reached via More');
    assert.equal(await b.evaluate(() => localStorage.getItem('pf2-onb-done')), '1');
    assert.deepEqual(H.appErrors(B), []);
  });

  await t.test('Skip tour ends it and leaves the app usable', async () => {
    const C = await H.signUpAndOnboard(env, { name: 'Carol Skip', email: 'carol@example.com' });
    const c = C.page;
    await c.click('#post-ob-offer button:has-text("Free")');
    await c.waitForSelector('#onb-card');
    await c.click('.onb-skip');
    assert.equal(await c.locator('#onb-card, #onb-spot, #onb-shield').count(), 0);
    await c.click(".nav-tab[onclick=\"switchTab('dashboard')\"]");
    await c.waitForTimeout(800);
    assert.equal(await c.locator('#onb-card').count(), 0, 'no guide pops up after skipping');
    assert.equal(await c.evaluate(() => currentTab), 'dashboard');
  });
});
