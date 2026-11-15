// Study rooms: two people in one room see each other live, share one clock,
// and the room's settings can only be changed by its host.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

const rejects = (p, fn, arg) => p.evaluate(fn, arg).then(() => false, () => true);

test('live study rooms', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  const A = await H.signUpAndOnboard(env, { name: 'Ana Host', email: 'ana@example.com' });
  const B = await H.signUpAndOnboard(env, { name: 'Ben Guest', email: 'ben@example.com' });
  const a = A.page, b = B.page;
  await H.clearFirstRun(a);
  await H.clearFirstRun(b);

  await t.test('opening a room starts the host\'s session and shows the shared clock', async () => {
    await a.click('#rooms-card button:has-text("New room")');
    await a.fill('#rc-name', 'FAR grind');
    await a.selectOption('#rc-timer', '1'); // 25 / 5
    await a.click('#rc-go');
    await a.waitForSelector('#room-overlay');
    await a.waitForFunction(() => /1 person here/i.test(document.getElementById('room-count')?.innerText || ''));
    assert.equal(await a.evaluate(() => TS.phase), 'active', 'joining a room starts the session timer');
    assert.match(await a.locator('#room-clock').innerText(), /^\d+:\d\d$/);
    assert.match(await a.locator('.room-phase').innerText(), /FOCUS/i);
  });

  await t.test('someone else sees the room, joins, and both see each other', async () => {
    await b.evaluate(() => watchRooms());
    await b.waitForSelector('.room-row[data-room]:has-text("FAR grind")');
    await b.click('.room-row[data-room]:has-text("FAR grind") button:has-text("Join")');
    await b.waitForSelector('#room-overlay');
    for (const p of [a, b]) await p.waitForFunction(() => /2 people here/i.test(document.getElementById('room-count')?.innerText || ''));
    assert.match(await a.locator('#room-members').innerText(), /Ben/);
    assert.match(await b.locator('#room-members').innerText(), /Ana/);
    assert.equal(await b.evaluate(() => TS.phase), 'active');
    // Same clock on both screens (within a couple of seconds).
    const left = (p) => p.evaluate(() => _roomPhase(_room.data).left);
    assert.ok(Math.abs((await left(a)) - (await left(b))) < 3000, 'both see the same countdown');
  });

  await t.test('only the host can change a room; nobody can write someone else\'s row', async () => {
    assert.ok(await rejects(b, () => _room.ref.update({ name: 'renamed by a guest' })), 'guest cannot rename the room');
    assert.ok(await rejects(b, () => _room.ref.update({ timerStart: 0 })), 'guest cannot move the clock');
    assert.ok(await rejects(b, (uid) => _room.ref.collection('members').doc(uid).set({ uid, name: 'x' }), A.uid), 'guest cannot write the host\'s row');
    assert.ok(await rejects(b, (uid) => firebaseDb.collection('rooms').doc('forged1').set({ name: 'x', hostUid: uid, hostName: 'x', focusMin: 25, breakMin: 5, timerStart: 1, createdAt: 1, lastActive: 1, count: 1 }), A.uid), 'cannot open a room in someone else\'s name');
    // The heartbeat fields are the one thing a guest may touch.
    assert.equal(await rejects(b, () => _room.ref.update({ lastActive: Date.now(), count: 2 })), false);
    assert.ok(await rejects(b, () => _room.ref.delete()), 'guest cannot close a live room');
    await b.waitForTimeout(600);
    assert.equal(await b.locator('#room-overlay').count(), 1, 'a refused delete does not kick the guest out');
  });

  await t.test('the break pauses your timer and focus resumes it', async () => {
    await a.evaluate(() => { _room.unsubR(); _room.data = Object.assign({}, _room.data, { timerStart: Date.now() - 25 * 60000 + 1200 }); });
    await a.waitForFunction(() => _room.lastPhase === 'break', null, { timeout: 8000 });
    assert.equal(await a.evaluate(() => TS.phase), 'paused', 'timer pauses for the break');
    assert.match(await a.locator('.room-phase').innerText(), /BREAK/i);
    await a.evaluate(() => { _room.data = Object.assign({}, _room.data, { timerStart: Date.now() - 30 * 60000 + 1200 }); });
    await a.waitForFunction(() => _room.lastPhase === 'focus', null, { timeout: 8000 });
    assert.equal(await a.evaluate(() => TS.phase), 'active', 'timer resumes with focus');
  });

  await t.test('ending a session leaves the room; the last one out closes it', async () => {
    await b.click('#room-overlay button:has-text("End & log session")');
    await b.waitForSelector('.sess-save-btn');
    assert.equal(await b.locator('#room-overlay').count(), 0);
    await a.waitForFunction(() => /1 person here/i.test(document.getElementById('room-count')?.innerText || ''));
    await a.click('#room-overlay button:has-text("Leave room")');
    await a.waitForFunction(() => !document.getElementById('room-overlay'));
    assert.equal(await a.evaluate(() => TS.phase), 'active', 'leaving the room keeps the session running');
    await a.waitForFunction(async () => !(await firebaseDb.collection('rooms').get()).size, null, { timeout: 8000 });
    await b.evaluate(() => { discardSession(); return watchRooms(); });
    assert.equal(await b.locator('.room-row[data-room]').count(), 0, 'the closed room is gone from the list');
  });

  await t.test('an invite link offers the room to join', async () => {
    await a.evaluate(() => { discardSession(); });
    await a.click('#rooms-card button:has-text("New room")');
    await a.fill('#rc-name', 'Sunday AUD');
    await a.click('#rc-go');
    await a.waitForSelector('#room-overlay');
    const url = await a.evaluate(() => _roomInviteUrl());
    assert.match(url, /\?room=r[a-z0-9]+$/);
    await b.goto(env.server.url + '/' + url.slice(url.indexOf('?')), { waitUntil: 'load' });
    await b.waitForSelector('#room-invite-modal');
    assert.match(await b.locator('#room-invite-modal').innerText(), /Sunday AUD/);
    await b.click('#room-invite-modal button:has-text("Join the room")');
    await b.waitForSelector('#room-overlay');
    await a.waitForFunction(() => /2 people here/i.test(document.getElementById('room-count')?.innerText || ''));
  });

  assert.deepEqual(H.appErrors(A), []);
  // B deliberately triggered permission-denied writes above.
  assert.deepEqual(H.appErrors(B).filter((e) => !/permission|insufficient/i.test(e)), []);
});
