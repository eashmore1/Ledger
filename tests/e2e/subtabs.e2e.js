// Dashboard, Study Lab and Explore: tabs along the top, the open tab kept in
// the URL, keyboard support, nothing spilling sideways on a phone, and custom
// goals (Pro).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

const PAGES = {
  dashboard: ['overview', 'exams', 'scores', 'calendar'],
  studylab: ['qbank', 'tools', 'coach'],
  explore: ['people', 'rooms', 'clubs', 'goals'],
};
const overflowX = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;

test('section tabs', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  for (const vp of [{ width: 375, height: 812 }, { width: 1366, height: 800 }]) {
    await t.test(`every tab renders at ${vp.width}px`, async () => {
      const A = await H.signUpAndOnboard(env, { name: 'Tabs ' + vp.width, email: `tabs${vp.width}@example.com`, viewport: vp });
      const p = A.page;
      await H.clearFirstRun(p);
      await H.logSession(p);
      for (const [page, subs] of Object.entries(PAGES)) {
        await p.evaluate((pg) => switchTab(pg), page);
        for (const sub of subs) {
          await p.click(`[data-subtab="${page}:${sub}"]`);
          assert.equal(await p.getAttribute(`[data-subtab="${page}:${sub}"]`, 'aria-selected'), 'true');
          assert.equal(await p.locator('.subtab[aria-selected="true"]').count(), 1);
          assert.ok((await p.evaluate(() => location.hash)).startsWith('#' + page), 'hash keeps the page');
          assert.ok(await p.evaluate(overflowX) <= 1, `${page}/${sub} has no sideways scroll`);
          // The tab strip itself fits without scrolling.
          assert.ok(await p.evaluate(() => { const b = document.querySelector('.subtabs'); return b.scrollWidth <= b.clientWidth + 1; }), `${page} tabs fit`);
        }
      }
      // The first Dashboard tab holds readiness and analytics.
      await p.evaluate(() => openSubTab('dashboard', 'overview'));
      assert.equal(await p.locator('#readiness-ring').count(), 1);
      assert.equal(await p.locator('#heat-map-card').count(), 1);
      assert.deepEqual(H.appErrors(A), []);
      await A.context.close();
    });
  }

  await t.test('keyboard, reload and links into a tab', async () => {
    const A = await H.signUpAndOnboard(env, { name: 'Tabs Keys', email: 'tabskeys@example.com' });
    const p = A.page;
    await H.clearFirstRun(p);
    await p.evaluate(() => switchTab('dashboard'));
    await p.focus('[data-subtab="dashboard:overview"]');
    await p.keyboard.press('ArrowRight');
    assert.equal(await p.evaluate(() => _subTab.dashboard), 'exams');
    assert.equal(await p.evaluate(() => document.activeElement.dataset.subtab), 'dashboard:exams');
    await p.keyboard.press('End');
    assert.equal(await p.evaluate(() => _subTab.dashboard), 'calendar');
    await p.keyboard.press('ArrowRight');
    assert.equal(await p.evaluate(() => _subTab.dashboard), 'overview', 'wraps around');
    // Calendar steps back a month and returns.
    await p.click('[data-subtab="dashboard:calendar"]');
    const now = await p.textContent('.cal-nav');
    await p.click('[aria-label="Previous month"]');
    assert.notEqual(await p.textContent('.cal-nav'), now);
    await p.click('text=Back to this month');
    assert.equal(await p.textContent('.cal-nav'), now);
    // The open tab survives a reload.
    await p.click('[data-subtab="dashboard:exams"]');
    assert.equal(await p.evaluate(() => location.hash), '#dashboard/exams');
    await p.reload();
    await p.waitForSelector('.subtabs[data-page="dashboard"]');
    assert.equal(await p.getAttribute('[data-subtab="dashboard:exams"]', 'aria-selected'), 'true');
    // Links elsewhere in the app open the right tab.
    await p.evaluate(() => { switchTab('today'); _openScoreTracker(); });
    await p.waitForSelector('#score-tracker-card');
    assert.equal(await p.evaluate(() => currentTab + '/' + _subTab.dashboard), 'dashboard/scores');
    assert.deepEqual(H.appErrors(A), []);
    await A.context.close();
  });

  await t.test('custom goals are Pro-only and track themselves', async () => {
    const A = await H.signUpAndOnboard(env, { name: 'Goal Setter', email: 'goals@example.com' });
    const p = A.page;
    await H.clearFirstRun(p);
    await p.evaluate(() => { SUB.tier = 'free'; switchTab('explore'); openSubTab('explore', 'goals'); });
    await p.click('button:has-text("Create a goal")');
    assert.equal(await p.locator('#goal-modal').count(), 0, 'free users get the upgrade screen instead');
    await p.evaluate(() => { document.querySelectorAll('.modal-overlay.open').forEach((m) => m.classList.remove('open')); _syncModalLock(); SUB.tier = 'pro'; renderTab(); });
    await p.click('button:has-text("Create a goal")');
    await p.waitForSelector('#goal-modal');
    await p.fill('#goal-name', 'Leases sprint');
    await p.selectOption('#goal-type', 'hours');
    await p.fill('#goal-val', '2');
    assert.match(await p.textContent('#goal-preview'), /Log 2 hours/);
    await p.click('#goal-modal button:has-text("Create goal")');
    assert.equal(await p.locator('#goal-modal').count(), 0);
    assert.match(await p.textContent('#subpanel-explore'), /Leases sprint/);
    await H.logSession(p, { minutes: 150 });
    assert.ok(await p.evaluate(() => S.challengeCompleted.includes(S.customChallenges[0].id)), 'goal marked complete');
    await p.evaluate(() => { switchTab('explore'); openSubTab('explore', 'goals'); });
    assert.match(await p.textContent('#subpanel-explore'), /Complete/);
    assert.deepEqual(H.appErrors(A), []);
    await A.context.close();
  });
});
