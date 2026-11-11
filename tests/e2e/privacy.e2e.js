// Settings → Privacy switches and account deletion. The switches used to be
// saved and then ignored everywhere; deletion used to leave the user's full
// study history behind in the database.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

const pubDoc = (p, uid) => p.evaluate(async (uid) => { const d = await firebaseDb.collection('users').doc(uid).get(); return d.exists ? d.data() : null; }, uid);

test('privacy settings and account deletion', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  const A = await H.signUpAndOnboard(env, { name: 'Alice Tester', email: 'alice@example.com', firm: 'Deloitte Dallas' });
  const B = await H.signUpAndOnboard(env, { name: 'Bob Builder', email: 'bob@example.com' });
  const a = A.page, b = B.page;
  await H.clearFirstRun(a);
  await H.clearFirstRun(b);
  await H.logSession(a, { material: 'Leases' });
  await H.settle(a);

  await t.test('declining cookies leaves analytics off; accepting turns it on', async () => {
    // The harness pressed Accept during sign-up.
    assert.ok(await a.evaluate(() => !!firebaseAnalytics), 'analytics on after Accept');
    const v = await H.newUser(env);
    await v.page.goto(env.server.url + '/', { waitUntil: 'load' });
    await v.page.waitForSelector('.auth-tab');
    assert.equal(await v.page.evaluate(() => firebaseAnalytics), null, 'no analytics before a choice is made');
    await v.page.click('#cookie-banner button:has-text("Decline")');
    await v.page.reload();
    await v.page.waitForSelector('.auth-tab');
    assert.equal(await v.page.evaluate(() => firebaseAnalytics), null, 'no analytics after Decline');
    await v.context.close();
  });

  await t.test('default profile publishes hours and activity but never exam scores', async () => {
    await a.evaluate(() => { S.examResults = [{ section: 'FAR', sitDate: '2026-10-01', score: 61, passed: false, attempt: 1, loggedAt: 1 }]; saveState(); });
    await H.settle(a);
    const pub = await pubDoc(b, A.uid);
    assert.equal(pub.hoursTotal, 1.5);
    assert.equal(pub.recentActivities.length, 1);
    assert.deepEqual(pub.examResults, [], 'a failed attempt must not be public by default');
  });

  await t.test('switching privacy options off stops the data being published', async () => {
    await a.evaluate(() => openAppSettings('privacy'));
    for (const id of ['show_hours', 'show_streak', 'share_activity', 'appear_leaderboard', 'allow_messages']) await a.uncheck('#priv-' + id);
    await a.click('button:has-text("Save Privacy Settings")');
    await a.waitForTimeout(1500);
    const pub = await pubDoc(b, A.uid);
    assert.equal(pub.hoursTotal, 0);
    assert.equal(pub.currentStreak, 0);
    assert.deepEqual(pub.recentActivities, []);
    assert.equal(pub.discoverable, false);
    assert.equal(pub.allowMessages, false);
  });

  await t.test('a non-discoverable user is hidden from search and cannot be messaged', async () => {
    await b.evaluate(() => refreshRealUsers()); // drop the copy cached while she was still discoverable
    await b.evaluate(() => openSearchModal());
    await b.fill('#search-input', 'ali');
    await b.waitForTimeout(1500);
    assert.doesNotMatch(await b.locator('.modal-overlay.open').first().innerText(), /Alice/);
    await b.evaluate((uid) => { closeSearchModal(); return openDirectMessage(uid, 'Alice', 'AL'); }, A.uid);
    await b.waitForTimeout(800);
    assert.equal(await b.locator('.dm-comp-inp').count(), 0, 'no composer opens');
  });

  await t.test('deleting an account removes its data, not just the login', async () => {
    const cohort = 'firm_' + (await a.evaluate(() => S.firmCode));
    await a.evaluate(() => closeAppSettings());
    await a.evaluate(() => { window.prompt = () => 'DELETE'; return confirmDeleteAccount(); });
    await a.waitForSelector('.auth-tab', { timeout: 15000 });
    assert.equal(await pubDoc(b, A.uid), null, 'public profile is gone');
    const members = await b.evaluate(async (c) => (await firebaseDb.collection('clubs').doc(c).collection('members').get()).docs.map((d) => d.id), cohort);
    assert.ok(!members.includes(A.uid), 'removed from cohort roster');
    // userState is private, so check it through the emulator's admin REST API.
    const r = await fetch(`http://${H.FS_HOST}/v1/projects/${H.PROJECT}/databases/(default)/documents/userState/${A.uid}`, { headers: { Authorization: 'Bearer owner' } });
    assert.equal(r.status, 404, 'private study state is gone');
    const back = await H.signIn(env, { email: 'alice@example.com' });
    await back.page.waitForTimeout(2500);
    assert.equal(await back.page.locator('.nav-tab').count(), 0, 'the login no longer works');
  });

  assert.deepEqual(H.appErrors(A).filter((e) => !/auth\//.test(e)), []);
  assert.deepEqual(H.appErrors(B), []);
});
