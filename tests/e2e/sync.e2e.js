// Cross-device data safety. These lock in fixes for real data-loss bugs:
// signing in on a second device used to send a returning user through
// onboarding (and overwrite their cloud data), and a device with stale local
// state used to clobber newer work logged elsewhere.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

test('cross-device sync', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  const d1 = await H.signUpAndOnboard(env, { name: 'Alice Tester', email: 'alice@example.com' });
  await H.clearFirstRun(d1.page);
  await H.logSession(d1.page, { material: 'Leases' });
  await H.settle(d1.page);

  let d2;
  await t.test('signing in on a second device restores data instead of re-onboarding', async () => {
    d2 = await H.signIn(env, { email: 'alice@example.com' });
    await d2.page.waitForSelector('.nav-tab', { timeout: 15000 });
    assert.equal(await d2.page.locator('#ob-name').count(), 0, 'returning user must not see onboarding');
    const acts = await d2.page.evaluate(() => S.activities.map((a) => a.material));
    assert.deepEqual(acts, ['Leases']);
  });

  await t.test('work logged on device 2 reaches stale device 1 without either side losing sessions', async () => {
    await H.clearFirstRun(d2.page);
    await H.logSession(d2.page, { material: 'Bonds' });
    await H.settle(d2.page);
    // Device 1 still holds the old local copy. It logs another session offline-style, then reloads.
    await H.logSession(d1.page, { material: 'Consolidations' });
    await H.settle(d1.page);
    await d1.page.reload();
    await d1.page.waitForSelector('.nav-tab');
    const on1 = await d1.page.evaluate(() => S.activities.map((a) => a.material).sort());
    assert.deepEqual(on1, ['Bonds', 'Consolidations', 'Leases']);
    await H.settle(d1.page);
    await d2.page.reload();
    await d2.page.waitForSelector('.nav-tab');
    const on2 = await d2.page.evaluate(() => S.activities.map((a) => a.material).sort());
    assert.deepEqual(on2, ['Bonds', 'Consolidations', 'Leases']);
  });

  await t.test('a deleted session stays deleted after syncing with another device', async () => {
    await d2.page.evaluate(() => { const id = S.activities.find((a) => a.material === 'Bonds').id; deleteActivity(id); });
    await H.settle(d2.page);
    await d1.page.reload();
    await d1.page.waitForSelector('.nav-tab');
    const on1 = await d1.page.evaluate(() => S.activities.map((a) => a.material).sort());
    assert.deepEqual(on1, ['Consolidations', 'Leases']);
  });

  await t.test('public profile never contains email or a 2FA secret', async () => {
    const pub = await d1.page.evaluate(async () => (await firebaseDb.collection('users').doc(AUTH.uid).get()).data());
    assert.equal(pub.email, undefined);
    assert.equal(pub.totp_secret, undefined);
    assert.ok(pub.hoursTotal > 0, 'hours are published for followers');
  });

  assert.deepEqual(H.appErrors(d1), []);
  assert.deepEqual(H.appErrors(d2), []);
});
