// Report and block between two real accounts, run against the repo's actual
// Firestore security rules. Blocking must hold server-side (a blocked person's
// comments, props, follows and messages are refused by the rules), not just be
// hidden in the blocker's own browser.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

test('report and block', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  const A = await H.signUpAndOnboard(env, { name: 'Alice Tester', email: 'alice.br@example.com', firm: 'Deloitte Dallas' });
  const a = A.page;
  await H.clearFirstRun(a);
  await H.logSession(a, { material: 'Leases' });
  await H.settle(a);
  const invite = new URL(await a.evaluate(() => buildInviteLink()));
  const q = invite.searchParams;
  const B = await H.signUpAndOnboard(env, {
    name: 'Bob Builder', email: 'bob.br@example.com',
    url: `/?join=${q.get('c')}&uid=${q.get('uid')}&from=${q.get('from')}&fn=${encodeURIComponent(q.get('fn') || '')}`,
  });
  const b = B.page;
  await H.clearFirstRun(b);
  await b.waitForTimeout(2500);
  const actId = await a.evaluate(() => S.activities[0].id);

  // Bob comments and DMs Alice before any block.
  await b.evaluate(() => switchTab('feed'));
  await b.waitForSelector('[onclick*="openComments"]', { timeout: 10000 });
  await b.click('[onclick*="openComments"]');
  await b.fill('#comment-input', 'You are terrible at this');
  await b.press('#comment-input', 'Enter');
  await b.waitForTimeout(800);
  await b.evaluate(() => closeCommentsModal());

  await t.test('comments with cuss words are refused, in the app and by the rules', async () => {
    await b.evaluate(() => switchTab('feed'));
    await b.click('[onclick*="openComments"]');
    await b.fill('#comment-input', 'this is sh1t');
    await b.press('#comment-input', 'Enter');
    await b.waitForSelector('#cm-warn:not(:empty)');
    assert.equal(await b.inputValue('#comment-input'), 'this is sh1t', 'kept so it can be edited');
    await b.fill('#comment-input', 'Great class, keep going');
    assert.equal(await b.textContent('#cm-warn'), '', 'warning clears while typing');
    await b.evaluate(() => closeCommentsModal());
    const res = await b.evaluate(async ({ aid, act }) => {
      const tryIt = async (text) => { try { await firebaseDb.collection('users').doc(aid).collection('comments').add({ activityId: act, from: AUTH.uid, name: 'Bob', text }); return 'ok'; } catch (e) { return e.code; } };
      return { swear: await tryIt('what the FUCK'), word: await tryIt('you ass'), multi: await tryIt('nice\nbullshit'), fine: await tryIt('Class assessment on assets went well') };
    }, { aid: A.uid, act: actId });
    assert.deepEqual(res, { swear: 'permission-denied', word: 'permission-denied', multi: 'permission-denied', fine: 'ok' });
  });

  await t.test('profiles, session posts, rooms and public club chat are filtered; private chats are not', async () => {
    // In the app: a profile with a cuss word is refused and nothing changes.
    const before = await b.evaluate(() => S.bio || '');
    await b.evaluate(() => openEditProfile());
    await b.waitForSelector('#ep-bio');
    await b.fill('#ep-bio', 'studying is bullsh1t');
    await b.evaluate(() => saveEditProfile());
    assert.equal(await b.evaluate(() => S.bio || ''), before, 'bio not saved');
    assert.equal(await b.evaluate(() => _badWords('Great caption, leases done')), false);
    assert.equal(await b.evaluate(() => _badWords('leases are sh*t')), true);
    await b.evaluate(() => { const m = document.getElementById('edit-profile-modal'); if (m) m.classList.remove('open'); });

    // The rules back it up.
    const res = await b.evaluate(async () => {
      const me = AUTH.uid, db = firebaseDb;
      const tryIt = async (f) => { try { await f(); return 'ok'; } catch (e) { return e.code; } };
      const pub = 'pubtest' + Date.now(), priv = 'privtest' + Date.now();
      await db.collection('clubs').doc(pub).set({ name: 'Open FAR club', isPublic: true });
      await db.collection('clubs').doc(priv).set({ name: 'Us', isPrivate: true, members: [me] });
      const msg = (club, text) => () => db.collection('clubs').doc(club).collection('messages').add({ from: me, text, timestamp: Date.now() });
      const room = (name) => () => db.collection('rooms').doc('rm' + Math.random().toString(36).slice(2, 9)).set({ name, hostUid: me, hostName: 'Bob', focusMin: 25, breakMin: 5, timerStart: Date.now(), createdAt: Date.now(), lastActive: Date.now(), count: 1 });
      return {
        bioBad: await tryIt(() => db.collection('users').doc(me).set({ bio: 'what the fuck' }, { merge: true })),
        bioFine: await tryIt(() => db.collection('users').doc(me).set({ bio: 'Assets and assessments' }, { merge: true })),
        publicBad: await tryIt(msg(pub, 'this is shit')),
        publicFine: await tryIt(msg(pub, 'Who is doing FAR this week?')),
        privateBad: await tryIt(msg(priv, 'this is shit')),
        roomBad: await tryIt(room('bitch session')),
        roomFine: await tryIt(room('Late night FAR')),
      };
    });
    assert.deepEqual(res, { bioBad: 'permission-denied', bioFine: 'ok', publicBad: 'permission-denied', publicFine: 'ok', privateBad: 'ok', roomBad: 'permission-denied', roomFine: 'ok' });
  });

  await t.test('a comment can be reported from its ⋯ menu', async () => {
    await a.reload(); await a.waitForSelector('.nav-tab');
    await a.waitForFunction(() => (S.activities[0].comments || []).length > 0, null, { timeout: 15000 });
    await a.evaluate(() => openComments(S.activities[0].id, 'you'));
    await a.click('.cm-row:has-text("terrible") .cm-more');
    await a.click('#action-sheet .as-item:has-text("Report comment")');
    await a.waitForSelector('#report-modal');
    assert.ok(await a.isDisabled('#rp-send'), 'needs a reason first');
    await a.click('#report-modal .rp-reason:has-text("Harassment")');
    await a.fill('#rp-details', 'Keeps posting this');
    await a.click('#rp-send');
    await a.waitForSelector('#report-modal .rp-done');
    // Reports can be written but never read back from the app.
    const canRead = await a.evaluate(async () => { try { await firebaseDb.collection('reports').get(); return true; } catch (e) { return false; } });
    assert.equal(canRead, false);
    await a.click('#report-modal .btn-ghost');
  });

  await t.test('reports are validated by the rules', async () => {
    const res = await b.evaluate(async (aid) => {
      const tryIt = async (d) => { try { await firebaseDb.collection('reports').add(d); return 'ok'; } catch (e) { return e.code; } };
      const base = { reporter: AUTH.uid, reporterName: 'Bob', target: aid, targetName: 'Alice', kind: 'user', refPath: '', text: '', reason: 'spam', details: '', at: Date.now(), status: 'open' };
      return {
        good: await tryIt(base),
        spoofed: await tryIt({ ...base, reporter: aid }),
        badReason: await tryIt({ ...base, reason: 'because' }),
        extraField: await tryIt({ ...base, status: 'closed' }),
        self: await tryIt({ ...base, target: AUTH.uid }),
      };
    }, A.uid);
    assert.deepEqual(res, { good: 'ok', spoofed: 'permission-denied', badReason: 'permission-denied', extraField: 'permission-denied', self: 'permission-denied' });
  });

  await t.test('blocking from the profile cuts the follow and hides the comment', async () => {
    await a.evaluate((uid) => openUserProfile(uid), B.uid);
    await a.waitForSelector('.vp-more');
    await a.click('.vp-more');
    await a.click('#action-sheet .as-item:has-text("Block Bob")');
    await a.click('#action-sheet .as-danger:has-text("Block")');
    await a.waitForSelector('.blk-state');
    assert.match(await a.textContent('.blk-state'), /You blocked Bob/);
    const st = await a.evaluate(() => ({ blocked: [...BLOCKED.keys()], following: S.following }));
    assert.deepEqual(st.blocked, [B.uid]);
    assert.ok(!st.following.includes(B.uid));
    await a.evaluate(() => openComments(S.activities[0].id, 'you'));
    assert.equal(await a.locator('.cm-row').count(), 0, "Bob's comment is hidden from Alice");
    await a.evaluate(() => closeCommentsModal());
  });

  await t.test('the rules refuse anything new from the blocked person', async () => {
    await b.waitForTimeout(500);
    const res = await b.evaluate(async ({ aid, act }) => {
      const me = AUTH.uid, u = firebaseDb.collection('users').doc(aid);
      const tryIt = async (f) => { try { await f(); return 'ok'; } catch (e) { return e.code; } };
      const conv = [me, aid].sort().join('__dm__');
      await firebaseDb.collection('conversations').doc(conv).set({ participants: [me, aid].sort() }, { merge: true }).catch(() => {});
      return {
        comment: await tryIt(() => u.collection('comments').add({ activityId: act, from: me, name: 'Bob', text: 'again' })),
        props: await tryIt(() => u.collection('props').doc(act + '__' + me).set({ activityId: act, reactor: me })),
        follow: await tryIt(() => u.collection('followers').doc(me).set({ uid: me })),
        request: await tryIt(() => u.collection('followRequests').doc(me).set({ uid: me, name: 'Bob' })),
        dm: await tryIt(() => firebaseDb.collection('conversations').doc(conv).collection('messages').add({ from: me, text: 'hi', timestamp: Date.now() })),
        // Bob can still clean up after himself.
        unfollow: await tryIt(() => u.collection('followers').doc(me).delete()),
      };
    }, { aid: A.uid, act: actId });
    assert.deepEqual(res, { comment: 'permission-denied', props: 'permission-denied', follow: 'permission-denied', request: 'permission-denied', dm: 'permission-denied', unfollow: 'ok' });
  });

  await t.test('the blocked person no longer sees the blocker', async () => {
    await b.reload(); await b.waitForSelector('.nav-tab');
    await b.waitForFunction(() => window._realUsersLoaded, null, { timeout: 15000 });
    const st = await b.evaluate((aid) => ({ by: BLOCKED_BY.has(aid), inUsers: REAL_USERS.some((u) => u.id === aid) }), A.uid);
    assert.deepEqual(st, { by: true, inUsers: false });
    await b.evaluate((uid) => openUserProfile(uid), A.uid);
    await b.waitForSelector('.blk-state');
    assert.match(await b.textContent('.blk-state'), /isn’t available/);
  });

  await t.test('unblocking from Settings restores things', async () => {
    await a.evaluate(() => openAppSettings('privacy'));
    await a.waitForSelector('#blocked-list .blk-row');
    assert.match(await a.textContent('#blocked-list'), /Bob/);
    await a.click('#blocked-list .blk-row button');
    await a.waitForSelector('#blocked-list .blk-none');
    const ok = await b.evaluate(async ({ aid, act }) => {
      try { await firebaseDb.collection('users').doc(aid).collection('comments').add({ activityId: act, from: AUTH.uid, name: 'Bob', text: 'Sorry, good luck!' }); return true; } catch (e) { return e.code; }
    }, { aid: A.uid, act: actId });
    assert.equal(ok, true);
  });

  assert.deepEqual(await H.appErrors(A), []);
  assert.deepEqual(await H.appErrors(B), []);
});
