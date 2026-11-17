// Notifications are sent by the server on a user's behalf, so what gets sent,
// to whom and how often is decided server-side. These run that logic (and the
// service worker that displays the result) with Firebase stubbed out.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

// ── A tiny in-memory Firestore + messaging stand-in ─────────────────────────
function makeAdmin(seed) {
  const docs = new Map(Object.entries(seed || {}));
  const sent = [];
  const DEL = { __del: true };
  const setPath = (obj, pathStr, val) => {
    const ks = pathStr.split('.'); let o = obj;
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]] = o[ks[i]] || {};
    if (val === DEL) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = val;
  };
  const snap = (p) => ({ id: p.split('/').pop(), exists: docs.has(p), data: () => docs.get(p), ref: docRef(p) });
  function docRef(p) {
    return {
      path: p,
      get: async () => snap(p),
      set: async (v, o) => {
        if (o && o.mergeFields) { const cur = Object.assign({}, docs.get(p)); o.mergeFields.forEach((k) => { cur[k] = v[k]; }); docs.set(p, cur); }
        else docs.set(p, o && o.merge ? Object.assign({}, docs.get(p), v) : v);
      },
      update: async (v) => { const cur = JSON.parse(JSON.stringify(docs.get(p) || {})); Object.keys(v).forEach((k) => setPath(cur, k, v[k])); docs.set(p, cur); },
      collection: (n) => colRef(p + '/' + n),
    };
  }
  function colRef(p) {
    const inCol = () => [...docs.keys()].filter((k) => k.startsWith(p + '/') && k.slice(p.length + 1).indexOf('/') < 0).sort();
    const query = (filters, lim, after) => ({
      where: (f, op, v) => query(filters.concat([[f, op, v]]), lim, after),
      orderBy: () => query(filters, lim, after),
      limit: (n) => query(filters, n, after),
      startAfter: (d) => query(filters, lim, d.id),
      get: async () => {
        let keys = inCol().filter((k) => filters.every(([f, op, v]) => { const x = (docs.get(k) || {})[f]; return op === 'array-contains' ? Array.isArray(x) && x.includes(v) : x === v; }));
        if (after) keys = keys.filter((k) => k.split('/').pop() > after);
        if (lim) keys = keys.slice(0, lim);
        const d = keys.map(snap);
        return { docs: d, empty: !d.length, size: d.length };
      },
    });
    return Object.assign(query([], 0, null), { doc: (id) => docRef(p + '/' + id) });
  }
  const firestore = () => ({
    collection: colRef,
    runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o) }),
  });
  firestore.FieldValue = { delete: () => DEL };
  firestore.FieldPath = { documentId: () => '__name__' };
  const admin = {
    apps: [{}], initializeApp() {}, credential: { cert() {} }, firestore,
    auth: () => ({
      verifyIdToken: async (t) => { if (!/^tok:/.test(t)) throw new Error('bad'); return { uid: t.slice(4) }; },
      getUser: async (uid) => ({ email: uid + '@example.com' }),
    }),
    messaging: () => ({
      sendEachForMulticast: async (m) => {
        sent.push(m);
        return { responses: m.tokens.map((t) => (/dead/.test(t) ? { success: false, error: { code: 'messaging/registration-token-not-registered' } } : { success: true })) };
      },
    }),
  };
  return { admin, docs, sent };
}
function load(seed) {
  const ctx = makeAdmin(seed);
  const adminPath = require.resolve('firebase-admin');
  require.cache[adminPath] = { id: adminPath, filename: adminPath, loaded: true, exports: ctx.admin };
  for (const f of ['_lib/push.js', 'notify.js', 'cron-reminders.js']) delete require.cache[path.resolve(__dirname, '..', 'api', f)];
  ctx.push = require('../api/_lib/push.js');
  ctx.notify = require('../api/notify.js');
  ctx.cron = require('../api/cron-reminders.js');
  return ctx;
}
function call(handler, req) {
  return new Promise((resolve) => {
    const res = {
      code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; return this; },
      status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o }); },
      end(b) { resolve({ code: this.code, body: b || null }); },
    };
    handler(Object.assign({ method: 'POST', headers: {}, query: {}, body: {} }, req), res);
  });
}
const TOKEN = 'x'.repeat(40);
const device = (t) => ({ d1: { token: t || TOKEN, platform: 'web' } });
// 01:00 UTC on a Wednesday = 7pm Tuesday in Chicago (CST).
const TUE_EVENING = new Date('2026-11-18T01:00:00Z');
const SUN_EVENING = new Date('2026-11-23T01:00:00Z'); // 7pm Sunday Nov 22 in Chicago

test('evening reminders: who gets what', async (t) => {
  const { push } = load();
  const base = { tz: 'America/Chicago', streak: 6, lastStudyDate: '2026-11-16' };

  await t.test('uses the user\'s own calendar day, not UTC', () => {
    assert.deepEqual(push.localParts('America/Chicago', TUE_EVENING), { ymd: '2026-11-17', hour: 19, dow: 2 });
    assert.equal(push.localParts('Asia/Tokyo', TUE_EVENING).ymd, '2026-11-18');
  });
  await t.test('a streak that ends tonight gets the streak warning', () => {
    const m = push.pickReminder(base, TUE_EVENING, 'daily');
    assert.equal(m.type, 'streak');
    assert.match(m.title, /6-day streak ends at midnight/);
  });
  await t.test('someone who already studied today is left alone', () => {
    assert.equal(push.pickReminder({ ...base, lastStudyDate: '2026-11-17' }, TUE_EVENING, 'daily'), null);
  });
  await t.test('a broken streak gets the plain reminder, and only for a week', () => {
    assert.equal(push.pickReminder({ ...base, lastStudyDate: '2026-11-14' }, TUE_EVENING, 'daily').type, 'reminder');
    assert.equal(push.pickReminder({ ...base, lastStudyDate: '2026-11-01' }, TUE_EVENING, 'daily'), null, 'no nagging people who have stopped');
    assert.equal(push.pickReminder({ tz: 'America/Chicago' }, TUE_EVENING, 'daily'), null, 'nor people who never started');
  });
  await t.test('nothing is sent outside the evening', () => {
    assert.equal(push.pickReminder({ ...base, tz: 'Asia/Tokyo' }, TUE_EVENING, 'daily'), null, '10am in Tokyo');
    assert.equal(push.pickReminder(base, TUE_EVENING, 'hourly'), null, 'hourly mode waits for 8pm');
    assert.equal(push.pickReminder(base, new Date('2026-11-18T02:00:00Z'), 'hourly').type, 'streak');
  });
  await t.test('the night before an exam or a score outranks everything', () => {
    assert.match(push.pickReminder({ ...base, exams: { FAR: '2026-11-18' } }, TUE_EVENING, 'daily').title, /FAR is tomorrow/);
    assert.match(push.pickReminder({ ...base, scoreDue: { AUD: '2026-11-18' } }, TUE_EVENING, 'daily').title, /AUD scores are expected tomorrow/);
  });
  await t.test('Sunday is the week in review', () => {
    const p = { ...base, lastStudyDate: '2026-11-21', week: { key: '2026-11-16', hrs: 11.5, days: 4, target: 15 } };
    const m = push.pickReminder(p, SUN_EVENING, 'daily');
    assert.equal(m.type, 'recap');
    assert.match(m.title, /11\.5h over 4 days/);
    assert.match(m.body, /3\.5h short of your 15h goal/);
    assert.match(m.body, /6-day streak ends at midnight/);
    assert.equal(m.onceKey, 'recap-2026-11-16');
  });
});

test('sending respects preferences, limits and dead devices', async (t) => {
  await t.test('a switched-off kind is never sent', async () => {
    const c = load({ 'notify/u1': { tokens: device(), prefs: { streak_alerts: false } } });
    assert.equal((await c.push.sendToUser('u1', { type: 'streak', title: 'a', body: 'b' })).reason, 'pref-off');
    assert.equal(c.sent.length, 0);
  });
  await t.test('no devices, no send', async () => {
    const c = load({ 'notify/u1': { tz: 'UTC' } });
    assert.equal((await c.push.sendToUser('u1', { type: 'streak', title: 'a', body: 'b' })).reason, 'no-devices');
  });
  await t.test('a "once" message is sent once', async () => {
    const c = load({ 'notify/u1': { tokens: device() } });
    const msg = { type: 'streak', title: 'Streak', body: 'b', onceKey: 'rem-2026-11-17', url: '/?action=start' };
    assert.equal((await c.push.sendToUser('u1', msg)).sent, 1);
    assert.equal((await c.push.sendToUser('u1', msg)).reason, 'already-sent');
    assert.equal(c.sent.length, 1);
    assert.deepEqual(c.sent[0].data, { title: 'Streak', body: 'b', url: '/?action=start', tag: 'streak', type: 'streak' });
  });
  await t.test('a daily cap stops a flood', async () => {
    const c = load({ 'notify/u1': { tokens: device() } });
    for (let i = 0; i < 20; i++) await c.push.sendToUser('u1', { type: 'kudos', title: 'k' + i, body: '' });
    assert.equal(c.sent.length, c.push.DAILY_CAP);
  });
  await t.test('a token the push service rejects is forgotten', async () => {
    const c = load({ 'notify/u1': { tokens: { d1: { token: TOKEN, platform: 'web' }, d2: { token: 'dead' + TOKEN, platform: 'web' } } } });
    assert.equal((await c.push.sendToUser('u1', { type: 'kudos', title: 'k', body: '' })).sent, 1);
    assert.deepEqual(Object.keys(c.docs.get('notify/u1').tokens), ['d1']);
  });
});

test('/api/notify only announces things that really happened', async (t) => {
  const seed = () => ({
    'users/ann': { displayName: 'Ann Lee', recentActivities: [{ id: 's1', hours: 2.5, section: 'FAR' }] },
    'notify/bob': { tokens: device(), watch: ['ann'] },
    'notify/cat': { tokens: device('y'.repeat(40)), watch: [] },
  });
  const post = (c, body, token) => call(c.notify, { headers: { authorization: 'Bearer ' + (token || 'tok:ann') }, body });

  await t.test('requires a signed-in caller', async () => {
    const c = load(seed());
    assert.equal((await call(c.notify, { body: { type: 'follow', toUid: 'bob' } })).code, 401);
    assert.equal((await post(c, { type: 'follow', toUid: 'bob' }, 'garbage')).code, 401);
  });
  await t.test('props without a real props record are refused', async () => {
    const c = load(seed());
    assert.equal((await post(c, { type: 'kudos', toUid: 'bob', activityId: 'a1' })).code, 400);
    assert.equal(c.sent.length, 0);
  });
  await t.test('real props notify the author, once', async () => {
    const c = load({ ...seed(), 'users/bob/props/a1__ann': { reactor: 'ann', activityId: 'a1' } });
    assert.equal((await post(c, { type: 'kudos', toUid: 'bob', activityId: 'a1' })).body.sent, 1);
    await post(c, { type: 'kudos', toUid: 'bob', activityId: 'a1' });
    assert.equal(c.sent.length, 1);
    assert.equal(c.sent[0].data.title, 'Ann Lee gave you props');
  });
  await t.test('the caller cannot choose the text or an arbitrary recipient', async () => {
    const c = load(seed());
    const r = await post(c, { type: 'follow', toUid: 'cat', title: 'FREE MONEY', body: 'click', url: 'https://evil.example' });
    assert.equal(r.code, 400, 'no follower edge, so nothing to announce');
    assert.equal((await post(c, { type: 'whatever' })).code, 400);
    assert.equal(c.sent.length, 0);
  });
  await t.test('a direct message notifies the other person without quoting the message', async () => {
    const c = load({ ...seed(), 'conversations/ann__dm__bob': { participants: ['ann', 'bob'], lastFrom: 'ann', lastMessage: 'my secret' } });
    assert.equal((await post(c, { type: 'dm', convId: 'ann__dm__bob' })).body.sent, 1);
    assert.equal(c.sent[0].data.title, 'New message from Ann Lee');
    assert.doesNotMatch(JSON.stringify(c.sent[0]), /secret/);
    assert.equal((await post(c, { type: 'dm', convId: 'bob__dm__cat' })).code, 400, 'not my conversation');
  });
  await t.test('a logged session reaches the people watching, built from the public profile', async () => {
    const c = load(seed());
    assert.equal((await post(c, { type: 'session_logged' })).body.sent, 1);
    assert.equal(c.sent[0].data.title, 'Ann just logged 2.5h of FAR');
    assert.deepEqual(c.sent[0].tokens, [TOKEN], 'only bob watches ann');
    await post(c, { type: 'session_logged' });
    assert.equal(c.sent.length, 1, 'one per person per day');
  });
  await t.test('someone who hides their activity generates no session pushes', async () => {
    const s = seed(); s['users/ann'].recentActivities = [];
    const c = load(s);
    assert.equal((await post(c, { type: 'session_logged' })).body.sent, 0);
  });
  await t.test('blocking stops pushes in both directions', async () => {
    const c = load({ ...seed(), 'users/bob/props/a1__ann': { reactor: 'ann' }, 'users/bob/blocks/ann': { blocked: 'ann' } });
    assert.equal((await post(c, { type: 'kudos', toUid: 'bob', activityId: 'a1' })).body.sent, 0, 'bob blocked ann');
    assert.equal((await post(c, { type: 'session_logged' })).body.sent, 0, 'bob watches ann but blocked her');
    const c2 = load({ ...seed(), 'users/ann/blocks/bob': { blocked: 'bob' } });
    assert.equal((await post(c2, { type: 'session_logged' })).body.sent, 0, 'ann blocked bob');
    assert.equal(c.sent.length + c2.sent.length, 0);
  });
  await t.test('a report is emailed to the moderator once, and only by its reporter', async () => {
    const mails = []; const realFetch = global.fetch;
    global.fetch = async (url, o) => { mails.push(JSON.parse(o.body)); return { ok: true }; };
    process.env.RESEND_API_KEY = 'k';
    t.after(() => { global.fetch = realFetch; delete process.env.RESEND_API_KEY; });
    const rep = { reporter: 'ann', reporterName: 'Ann Lee', target: 'zed', targetName: '<b>Zed</b>', kind: 'comment', reason: 'harassment', text: 'mean <script>', details: '', refPath: 'users/bob/comments/c1', status: 'open' };
    const c = load({ ...seed(), 'reports/r1': rep });
    assert.equal((await post(c, { type: 'report', reportId: 'r1' }, 'tok:bob')).code, 400, 'not your report');
    assert.equal((await post(c, { type: 'report', reportId: 'r1' })).body.emailed, true);
    assert.equal((await post(c, { type: 'report', reportId: 'r1' })).body.emailed, false, 'only once');
    assert.equal(mails.length, 1);
    assert.deepEqual(mails[0].to, ['support@ledgercpa.app']);
    assert.doesNotMatch(mails[0].html, /<script>|<b>Zed/);
  });
  await t.test('a room can only be announced by its host', async () => {
    const c = load({ ...seed(), 'rooms/r1': { hostUid: 'zed', name: 'x' }, 'rooms/r2': { hostUid: 'ann', name: 'FAR grind' } });
    assert.equal((await post(c, { type: 'room_started', roomId: 'r1' })).code, 400);
    assert.equal((await post(c, { type: 'room_started', roomId: 'r2' })).body.sent, 1);
    assert.equal(c.sent[0].data.url, '/?room=r2');
  });
});

test('/api/cron-reminders', async (t) => {
  const RealDate = Date;
  const at = (iso) => { global.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [iso])); } static now() { return new RealDate(iso).getTime(); } }; };
  t.after(() => { global.Date = RealDate; delete process.env.CRON_SECRET; delete process.env.RESEND_API_KEY; });
  const seed = () => ({
    'notify/a': { tz: 'America/Chicago', streak: 6, lastStudyDate: '2026-11-16', tokens: device() },
    'notify/b': { tz: 'America/Chicago', streak: 2, lastStudyDate: '2026-11-17', tokens: device('b'.repeat(40)) },
    'notify/c': { tz: 'America/Chicago', streak: 0, lastStudyDate: '2026-11-15', tokens: device('c'.repeat(40)), prefs: { study_reminders: false } },
  });

  await t.test('refuses to run without the secret', async () => {
    const c = load(seed());
    delete process.env.CRON_SECRET;
    assert.equal((await call(c.cron, { method: 'GET' })).code, 500);
    process.env.CRON_SECRET = 's3cret';
    assert.equal((await call(c.cron, { method: 'GET', headers: { authorization: 'Bearer nope' } })).code, 401);
  });
  await t.test('reminds the right people, and never twice in a day', async () => {
    process.env.CRON_SECRET = 's3cret';
    at('2026-11-18T01:00:00Z');
    const c = load(seed());
    const run = () => call(c.cron, { method: 'GET', headers: { authorization: 'Bearer s3cret' } });
    const r1 = await run();
    assert.equal(r1.code, 200);
    assert.equal(r1.body.pushes, 1, 'a: streak at risk. b studied today. c turned reminders off.');
    assert.match(c.sent[0].data.title, /6-day streak/);
    assert.equal((await run()).body.pushes, 0);
    assert.equal(c.sent.length, 1);
  });
  await t.test('Sunday recap email: only when configured, once a week, with a working unsubscribe', async () => {
    process.env.CRON_SECRET = 's3cret';
    at('2026-11-23T01:00:00Z');
    const mails = [];
    const realFetch = global.fetch;
    global.fetch = async (url, o) => { mails.push(JSON.parse(o.body)); return { ok: true }; };
    t.after(() => { global.fetch = realFetch; });
    const s = { 'notify/a': { tz: 'America/Chicago', name: 'Ann', streak: 3, lastStudyDate: '2026-11-22', week: { key: '2026-11-16', hrs: 16, days: 5, target: 15 }, tokens: device() } };
    let c = load(s);
    const run = () => call(c.cron, { method: 'GET', headers: { authorization: 'Bearer s3cret' } });
    assert.equal((await run()).body.emails, 0, 'no email provider configured');
    process.env.RESEND_API_KEY = 'k';
    c = load(s);
    assert.equal((await run()).body.emails, 1);
    assert.equal((await run()).body.emails, 0, 'not twice in one week');
    assert.deepEqual(mails[0].to, ['a@example.com']);
    assert.match(mails[0].subject, /16h over 5 days/);
    const link = mails[0].html.match(/api\/notify\?unsub=([^"]+)"/)[1];
    // Following the link turns the email off for good…
    const page = await call(c.notify, { method: 'GET', query: { unsub: link } });
    assert.match(page.body, /will not get the weekly recap/);
    assert.equal(c.docs.get('notifyMeta/a').emailOff, true);
    // …and a forged link does nothing.
    const c2 = load(s);
    assert.match((await call(c2.notify, { method: 'GET', query: { unsub: 'a.' + '0'.repeat(32) } })).body, /not valid/);
    assert.equal(c2.docs.has('notifyMeta/a'), false);
  });
});

test('service worker: showing and opening notifications', async (t) => {
  function boot({ clients = [] } = {}) {
    const handlers = {}; const shown = []; const opened = [];
    const self = {
      location: { origin: 'https://ledgercpa.app' },
      addEventListener: (n, f) => { handlers[n] = f; },
      registration: { showNotification: async (title, o) => { shown.push({ title, ...o }); } },
      clients: { matchAll: async () => clients, openWindow: async (u) => { opened.push(u); }, claim() {} },
      skipWaiting() {},
    };
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '..', 'sw.js'), 'utf8'), { self, caches: {}, fetch() {}, URL, Promise, Object, String, console });
    const fire = async (name, ev) => { let p; handlers[name](Object.assign({ waitUntil: (x) => { p = x; } }, ev)); await p; };
    return { fire, shown, opened };
  }
  const push = (data) => ({ data: { json: () => ({ data }) } });

  await t.test('a push becomes a notification when Ledger is not in front', async () => {
    const sw = boot();
    await sw.fire('push', push({ title: 'Your 6-day streak ends at midnight', body: 'Even 25 minutes keeps it alive.', url: '/?action=start', tag: 'reminder' }));
    assert.equal(sw.shown.length, 1);
    assert.equal(sw.shown[0].title, 'Your 6-day streak ends at midnight');
    assert.equal(sw.shown[0].data.url, '/?action=start');
  });
  await t.test('if Ledger is open and focused the page gets it instead', async () => {
    const posted = [];
    const sw = boot({ clients: [{ visibilityState: 'visible', focused: true, postMessage: (m) => posted.push(m) }] });
    await sw.fire('push', push({ title: 'Ann gave you props', body: '' }));
    assert.equal(sw.shown.length, 0);
    assert.equal(posted[0].msg.title, 'Ann gave you props');
  });
  await t.test('tapping opens the page it points to — and only ever a Ledger page', async () => {
    const sw = boot();
    const click = (url) => sw.fire('notificationclick', { notification: { close() {}, data: { url } } });
    await click('/?room=r2');
    await click('https://evil.example/phish');
    assert.deepEqual(sw.opened, ['https://ledgercpa.app/?room=r2', 'https://ledgercpa.app/']);
  });
  await t.test('a malformed push still shows something rather than failing silently', async () => {
    const sw = boot();
    await sw.fire('push', { data: { json: () => { throw new Error('not json'); } } });
    assert.equal(sw.shown[0].title, 'Ledger');
  });
});
