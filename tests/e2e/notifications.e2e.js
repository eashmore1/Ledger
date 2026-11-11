// Things one user does must reach the other: follow requests to a private
// account, and notifications for new followers, kudos and comments. Before
// this was built, requests were stored only on the requester's device and the
// author of a session never learned anyone had reacted to it.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

const notifTexts = (p) => p.evaluate(() => (S.notifications || []).map((n) => n.text));

test('follow requests and social notifications', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  const A = await H.signUpAndOnboard(env, { name: 'Alice Tester', email: 'alice@example.com' });
  const B = await H.signUpAndOnboard(env, { name: 'Bob Builder', email: 'bob@example.com' });
  const a = A.page, b = B.page;
  await H.clearFirstRun(a);
  await H.clearFirstRun(b);

  await t.test('a new account has no fabricated notifications', async () => {
    await a.evaluate(() => openNotificationCenter());
    assert.match(await a.locator('#notif-modal').innerText(), /No notifications yet/);
    await a.evaluate(() => closeNotifModal());
  });

  await t.test('following a private account sends a request the owner can accept', async () => {
    await a.evaluate(() => toggleAccountPrivacy(true));
    await H.logSession(a, { material: 'Leases' });
    await H.settle(a);
    await b.evaluate(() => refreshRealUsers());
    await b.evaluate(() => openSearchModal());
    await b.fill('#search-input', 'ali');
    await b.click('.modal-overlay.open button:has-text("Follow")');
    await b.waitForTimeout(2000);
    assert.deepEqual(await b.evaluate(() => S.following), [], 'not following until accepted');
    await a.evaluate(() => syncSocial());
    await a.waitForFunction(() => (S.followRequests || []).length === 1);
    assert.match((await notifTexts(a)).join('\n'), /Bob requested to follow you/);
    await a.evaluate((uid) => acceptFollowRequest(uid), B.uid);
    await a.waitForTimeout(1500);
    await b.evaluate(() => syncSocial());
    await b.waitForFunction((uid) => (S.following || []).includes(uid), A.uid);
    assert.deepEqual(await b.evaluate(() => S.pendingRequests), []);
    assert.match((await notifTexts(b)).join('\n'), /Alice accepted your follow request/);
  });

  await t.test('kudos and comments notify the author and light up the bell', async () => {
    await b.evaluate(() => { closeSearchModal(); switchTab('feed'); });
    await b.waitForSelector('[onclick*="giveProps"]', { timeout: 10000 });
    await b.click('[onclick*="giveProps"]');
    await b.click('[onclick*="openComments"]');
    const inp = b.locator('.modal-overlay.open input[type=text], .modal-overlay.open textarea').first();
    await inp.fill('Keep going!');
    await inp.press('Enter');
    await b.waitForTimeout(1500);
    await a.evaluate(() => syncSocial());
    await a.waitForFunction(() => (S.notifications || []).some((n) => /commented/.test(n.text)));
    const texts = (await notifTexts(a)).join('\n');
    assert.match(texts, /Bob gave you props on your FAR session/);
    assert.match(texts, /Bob commented: “Keep going!”/);
    assert.ok(await a.locator('#notif-bell-btn span').isVisible(), 'unread badge shows');
  });

  await t.test('a switched-off notification type is not recorded', async () => {
    await a.evaluate(() => { S.notifPrefs = { props_notifs: false }; S.notifications = []; addNotification('props', '👏', 'x'); addNotification('follow', '👤', 'y'); });
    assert.deepEqual(await notifTexts(a), ['y']);
  });

  assert.deepEqual(H.appErrors(A), []);
  assert.deepEqual(H.appErrors(B), []);
});
