// The single-user core loop: first run, logging study time (live timer and
// after the fact), seeing it reflected, and logging an exam result.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

test('core study-tracking flows', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  await t.test('the verification screen offers to resend, not to create the account again', async () => {
    const u = await H.newUser(env);
    const p = u.page;
    await p.goto(env.server.url + '/', { waitUntil: 'load' });
    await p.waitForSelector('.auth-tab');
    await p.click('#cookie-banner button:has-text("Accept")');
    await p.click('.auth-tab:has-text("Create Account")');
    await p.fill('#auth-name', 'Vera Verify');
    await p.fill('#auth-email', 'vera@example.com');
    await p.fill('#auth-pass', 'Passw0rd!x');
    await p.click('.auth-form-btn');
    await p.waitForSelector('text=Already verified? Sign in');
    await p.waitForTimeout(300);
    assert.match(await p.locator('.auth-form-btn').innerText(), /Resend Verification Email/);
    // An unverified account must not get into the app.
    await p.click('text=Already verified? Sign in');
    await p.fill('#auth-email', 'vera@example.com');
    await p.fill('#auth-pass', 'Passw0rd!x');
    await p.click('.auth-form-btn');
    await p.waitForTimeout(2000);
    assert.equal(await p.locator('.nav-tab').count() + await p.locator('#ob-name').count(), 0);
    await u.context.close();
  });

  const A = await H.signUpAndOnboard(env, { name: 'Alice Tester', email: 'alice@example.com' });
  const a = A.page;

  await t.test('first run shows one thing at a time: plan chooser, then the tour', async () => {
    await a.waitForSelector('#post-ob-offer');
    await a.waitForTimeout(1200);
    assert.equal(await a.locator('#onb-card').count(), 0, 'tour must not open on top of the plan chooser');
    assert.equal(await a.locator('#study-nudge-banner').count(), 0, 'no "you have not studied" nag for a brand-new account');
    await a.click('#post-ob-offer button:has-text("Free")');
    await a.waitForSelector('#onb-card');
    await a.evaluate(() => onbSkipAll());
    await H.clearFirstRun(a);
  });

  await t.test('a timed session is saved and shows on the dashboard', async () => {
    await H.logSession(a, { material: 'Leases', minutes: 90 });
    assert.deepEqual(await a.evaluate(() => S.activities.map((x) => [x.section, x.hours, x.material])), [['FAR', 1.5, 'Leases']]);
    await a.evaluate(() => switchTab('dashboard'));
    assert.match(await a.locator('body').innerText(), /1\.5/);
    assert.equal(await a.evaluate(() => getStreak()), 1);
  });

  await t.test('a past session can be logged without running the timer', async () => {
    await a.evaluate(() => openSessionModal());
    await a.click('#ss-manual-toggle');
    await a.fill('#ss-mat', 'Bonds — paper flashcards');
    await a.fill('#ss-man-h', '2');
    await a.fill('#ss-man-m', '30');
    const y = new Date(Date.now() - 86400000);
    const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    await a.fill('#ss-date', yStr);
    await a.click('#ss-manual button:has-text("Continue")');
    await a.waitForSelector('.sess-save-btn');
    await a.click('.sess-save-btn');
    await a.waitForSelector('#session-logged-modal');
    await a.evaluate(() => closeSessionLoggedModal());
    const acts = await a.evaluate(() => S.activities.map((x) => [x.hours, x.date.slice(0, 10), !!x.manual]));
    assert.deepEqual(acts[1], [2.5, yStr, true]);
    assert.equal(await a.evaluate(() => getTotalHours()), 4);
    assert.equal(await a.evaluate(() => getStreak()), 2, 'yesterday + today is a 2-day streak');
  });

  await t.test('a past session needs a duration and cannot be dated in the future', async () => {
    await a.evaluate(() => openSessionModal());
    await a.click('#ss-manual-toggle');
    await a.click('#ss-manual button:has-text("Continue")');
    assert.equal(await a.locator('.sess-save-btn').count(), 0, 'no duration → stays on setup');
    await a.fill('#ss-man-h', '1');
    await a.evaluate(() => { document.getElementById('ss-date').value = '2099-01-01'; });
    await a.click('#ss-manual button:has-text("Continue")');
    assert.equal(await a.locator('.sess-save-btn').count(), 0, 'future date → stays on setup');
    await a.evaluate(() => closeSessOverlay());
    assert.equal(await a.evaluate(() => S.activities.length), 2);
  });

  await t.test('an in-progress timer survives a page reload', async () => {
    await a.evaluate(() => openSessionModal());
    await a.fill('#ss-mat', 'Consolidations');
    await a.click('#ss-start-btn');
    await a.evaluate(() => { TS.startTime = Date.now() - 600 * 1000; pauseTimer(); });
    await a.reload();
    await a.waitForSelector('.nav-tab');
    await a.waitForTimeout(1500);
    const ts = await a.evaluate(() => ({ phase: TS.phase, elapsed: TS.elapsed, material: TS.material }));
    assert.equal(ts.material, 'Consolidations');
    assert.ok(ts.elapsed >= 600, 'elapsed time kept');
    await a.evaluate(() => discardSession());
  });

  assert.deepEqual(H.appErrors(A), []);
});
