// Notifications end to end: a person turns them on in the app, and the real
// /api/notify and /api/cron-reminders handlers — running against the same
// emulated database, with only the final hand-off to the push service captured —
// send the right thing to that person's device.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

// The server handlers, pointed at the emulators.
process.env.FIRESTORE_EMULATOR_HOST = H.FS_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = H.AUTH_EMU.replace(/^https?:\/\//, '');
process.env.CRON_SECRET = 'e2e-secret';
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: H.PROJECT });
const sent = [];
Object.defineProperty(admin, 'messaging', { configurable: true, value: () => ({
  sendEachForMulticast: async (m) => { sent.push(m); return { responses: m.tokens.map(() => ({ success: true })) }; },
}) });
const notify = require('../../api/notify.js');
const cron = require('../../api/cron-reminders.js');

function run(handler, req) {
  return new Promise((resolve) => {
    const res = { code: 200, setHeader() { return this; }, status(c) { this.code = c; return this; }, json(o) { resolve({ code: this.code, body: o }); }, end(b) { resolve({ code: this.code, body: b || null }); } };
    handler(Object.assign({ method: 'POST', headers: {}, query: {}, body: {} }, req), res);
  });
}
// Serve /api/notify in the browser from the real handler.
const calls = [];
const api = {
  '/api/notify': async (route, req) => {
    const r = await run(notify, { method: req.method(), headers: req.headers(), body: req.postDataJSON() });
    calls.push({ body: req.postDataJSON(), code: r.code });
    return route.fulfill({ status: r.code, contentType: 'application/json', body: JSON.stringify(r.body) });
  },
};
// Pretend to be a browser that supports push and whose owner says yes.
const grantPush = (p, token) => p.evaluate((tok) => {
  window.PushManager = window.PushManager || function () {};
  Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'default', requestPermission: async () => { window.Notification.permission = 'granted'; return 'granted'; } } });
  window._pushGetToken = async () => tok;
}, token);
const notifyDoc = (p) => p.evaluate(async () => (await firebaseDb.collection('notify').doc(AUTH.uid).get()).data() || null);

test('notifications reach a closed app', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  const A = await H.signUpAndOnboard(env, { name: 'Ana Sender', email: 'ana@example.com', api });
  const B = await H.signUpAndOnboard(env, { name: 'Ben Receiver', email: 'ben@example.com', api });
  const a = A.page, b = B.page;
  await H.clearFirstRun(a);
  await H.clearFirstRun(b);
  const TOKEN_B = 'fcm-token-for-ben-' + 'x'.repeat(40);

  await t.test('turning notifications on registers this device and a reminder profile', async () => {
    await grantPush(b, TOKEN_B);
    await b.evaluate(() => openAppSettings('notifications'));
    await b.waitForSelector('#push-status[data-state="default"]');
    await b.click('#push-enable-btn');
    await b.waitForSelector('#push-status[data-state="on"]');
    const doc = await notifyDoc(b);
    const devices = Object.values(doc.tokens);
    assert.equal(devices.length, 1);
    assert.equal(devices[0].token, TOKEN_B);
    assert.equal(devices[0].platform, 'web');
    assert.ok(doc.tz, 'time zone recorded');
    assert.equal(doc.prefs.streak_alerts, true);
    assert.deepEqual(Object.keys(doc.week).sort(), ['days', 'hrs', 'key', 'target']);
    await b.evaluate(() => closeAppSettings());
  });

  await t.test('nobody else can read or write that profile', async () => {
    const denied = (fn) => a.evaluate(fn, B.uid).then(() => false, () => true);
    assert.ok(await denied((uid) => firebaseDb.collection('notify').doc(uid).get()), 'cannot read another user\'s tokens');
    assert.ok(await denied((uid) => firebaseDb.collection('notify').doc(uid).set({ tokens: { x: { token: 'mine' } } }, { merge: true })), 'cannot add a device to another user');
    assert.ok(await denied(() => firebaseDb.collection('notifyMeta').doc(AUTH.uid).set({ n: 0 })), 'send counters are server-only');
  });

  await t.test('following someone notifies them on their device', async () => {
    sent.length = 0;
    await a.evaluate(async (uid) => {
      window._lastSyncedFollowing = [];                // "already synced" — this is a new follow, not a backfill
      S.following = [...(S.following || []), uid]; saveState();
      await saveFollowToFirestore();
    }, B.uid);
    await a.waitForTimeout(1500);
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].tokens, [TOKEN_B]);
    assert.equal(sent[0].data.title, 'Ana started following you');
    assert.equal(sent[0].data.url, '/user/' + A.uid);
  });

  await t.test('a logged session reaches the follower who is watching', async () => {
    // Ana turns notifications on too, and follows nobody yet → Ben must watch Ana.
    await b.evaluate(async (uid) => { S.following = [uid]; saveState(); await saveFollowToFirestore(); await syncNotifyProfile(true); }, A.uid);
    assert.deepEqual((await notifyDoc(b)).watch, [A.uid]);
    sent.length = 0;
    await H.logSession(a, { minutes: 90 });
    await a.waitForFunction(() => window._notifySession === false, null, { timeout: 10000 });
    await a.waitForTimeout(1500);
    const crew = sent.filter((m) => m.data.type === 'crew');
    assert.equal(crew.length, 1);
    assert.match(crew[0].data.title, /^Ana just logged 1\.5h of FAR$/);
    assert.deepEqual(crew[0].tokens, [TOKEN_B]);
  });

  await t.test('a made-up event from the browser sends nothing', async () => {
    sent.length = 0; calls.length = 0;
    await a.evaluate((uid) => notifyEvent('kudos', { toUid: uid, activityId: 'never-happened', title: 'spam' }), B.uid);
    await a.waitForTimeout(1200);
    assert.equal(calls[0].code, 400);
    assert.equal(sent.length, 0);
  });

  await t.test('the evening job warns about a streak that is about to end — once', async () => {
    // Put Ben in whichever time zone it is currently 8pm, with a streak that needs today.
    const { localParts, addDays } = require('../../api/_lib/push.js');
    const zones = Array.from({ length: 27 }, (_, i) => 'Etc/GMT' + (i - 14 >= 0 ? '+' : '') + (i - 14)).filter((z) => { try { return localParts(z).hour === 20; } catch (e) { return false; } });
    assert.ok(zones.length, 'found a zone where it is 8pm');
    const local = localParts(zones[0]);
    await b.evaluate(({ tz, last }) => firebaseDb.collection('notify').doc(AUTH.uid).set({ tz, streak: 9, lastStudyDate: last }, { merge: true }), { tz: zones[0], last: addDays(local.ymd, -1) });
    sent.length = 0;
    assert.equal((await run(cron, { method: 'GET', headers: { authorization: 'Bearer wrong' } })).code, 401);
    const r = await run(cron, { method: 'GET', query: { mode: 'hourly' }, headers: { authorization: 'Bearer e2e-secret' } });
    assert.equal(r.code, 200);
    assert.equal(r.body.pushes, 1);
    // On a Sunday the same warning rides along in the weekly recap instead.
    if (local.dow === 0) assert.match(sent[0].data.body, /9-day streak ends at midnight/);
    else assert.equal(sent[0].data.title, 'Your 9-day streak ends at midnight');
    assert.deepEqual(sent[0].tokens, [TOKEN_B]);
    assert.equal((await run(cron, { method: 'GET', query: { mode: 'hourly' }, headers: { authorization: 'Bearer e2e-secret' } })).body.pushes, 0, 'not twice');
  });

  await t.test('signing out detaches the device and really ends the session', async () => {
    await b.evaluate(() => signOut()); // the confirm() is auto-accepted by the harness
    await b.waitForSelector('.auth-tab');
    const tokens = (await admin.firestore().collection('notify').doc(B.uid).get()).data().tokens || {};
    assert.deepEqual(Object.keys(tokens), [], 'no pushes for this account on a signed-out browser');
    await b.reload({ waitUntil: 'load' });
    await b.waitForSelector('.auth-tab');
    assert.equal(await b.locator('#page-content').count(), 0, 'a reload does not sign you back in');
  });

  assert.deepEqual(H.appErrors(A).filter((e) => !/permission|insufficient/i.test(e)), []);
  assert.deepEqual(H.appErrors(B), []);
});

// The app works in the user's local day. In UTC-based code a session logged at
// 8:30pm in Chicago was filed under tomorrow and the streak read 0 that night.
test('an evening session counts for today in the user\'s own time zone', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());
  const U = await H.signUpAndOnboard(env, { name: 'Eve Ning', email: 'eve@example.com', context: { timezoneId: 'America/Chicago' } });
  const p = U.page;
  await H.clearFirstRun(p);
  // 8:30pm Chicago on Nov 17 is already Nov 18 in UTC.
  await p.clock.install({ time: new Date('2026-11-18T02:30:00Z') });
  await p.evaluate(() => { renderTab(); });
  assert.equal(await p.evaluate(() => todayStr()), '2026-11-17');
  await p.evaluate(() => {
    S.activities.push({ id: 'u' + Date.now(), date: todayStr() + 'T' + new Date().toTimeString().slice(0, 8), section: 'FAR', hours: 1.5, kudos: [], comments: [] });
    saveState(); switchTab('today');
  });
  assert.equal(await p.evaluate(() => getStreak()), 1, 'the streak counts tonight\'s session');
  assert.equal(await p.evaluate(() => hasLoggedToday()), true);
  assert.match(await p.locator('#today-hero').innerText(), /safe for today/i);
  assert.equal(await p.locator('.today-day.is-today.done').count(), 1, 'today\'s box is filled in on the week strip');
});
