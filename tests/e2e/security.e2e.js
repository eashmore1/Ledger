// Stored cross-site scripting. Every screen is built with innerHTML, and most
// of what it renders is text other users typed. This plants hostile markup in
// every user-controlled field one account can write, then walks a second
// account through every social surface and asserts nothing executed.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

const EVIL = `<img src=x onerror="window.__xss=(window.__xss||'')+'|html'">');window.__xss=(window.__xss||'')+'|attr';//&#39;);window.__xss='|ent';//`;

test("hostile user content never executes in another user's browser", async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  const X = await H.signUpAndOnboard(env, { name: 'Mallory Evil', email: 'mal@example.com', firm: 'Evil Corp' });
  const x = X.page; await H.clearFirstRun(x);
  // plant hostile content everywhere a user controls text
  await x.evaluate((EVIL) => { S.name = EVIL; S.bio = EVIL; S.school = EVIL; S.firmName = EVIL; S.state = EVIL; S.city = EVIL; S.avatar = EVIL; saveState(); }, EVIL);
  await H.logSession(x, { material: EVIL });
  await x.evaluate((EVIL) => { S.activities[0].caption = EVIL; S.activities[0].section = 'FAR'; saveState(); }, EVIL);
  await H.settle(x);
  const inv = new URL(await x.evaluate(() => buildInviteLink())).searchParams;
  const B = await H.signUpAndOnboard(env, { name: 'Bob Builder', email: 'bob@example.com', url: `/?join=${inv.get('c')}&uid=${inv.get('uid')}&from=${encodeURIComponent(EVIL)}&fn=${encodeURIComponent(EVIL)}` });
  const b = B.page; await H.clearFirstRun(b);
  const hits = [];
  const chk = async (label) => { await b.waitForTimeout(900); const v = await b.evaluate(() => { const v = window.__xss || ''; window.__xss = ''; return v; }); if (v) hits.push(label + ' ' + v); };
  await b.waitForTimeout(3000); await chk('after onboarding via invite (toast, feed, cohort card)');
  // X interacts with B so hostile strings arrive via comments/DM/club/follow
  await x.evaluate(async ({ buid, EVIL }) => {
    S.following = [buid]; saveState(); saveFollowToFirestore();
    const convId = [AUTH.uid, buid].sort().join('__dm__');
    await firebaseDb.collection('conversations').doc(convId).set({ participants: [AUTH.uid, buid].sort(), lastMessage: EVIL, lastFrom: AUTH.uid, lastAt: firebase.firestore.FieldValue.serverTimestamp() });
    await firebaseDb.collection('conversations').doc(convId).collection('messages').add({ from: AUTH.uid, text: EVIL, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    await firebaseDb.collection('clubs').doc('firm_' + S.firmCode).collection('messages').add({ from: AUTH.uid, text: EVIL, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    await firebaseDb.collection('clubs').doc('firm_' + S.firmCode).set({ name: EVIL, desc: EVIL, lastMessage: EVIL }, { merge: true });
    const ref = firebaseDb.collection('clubs').doc(); await ref.set({ name: EVIL, icon: EVIL, desc: EVIL, isPrivate: true, members: [AUTH.uid, buid] });
    await firebaseDb.collection('users').doc(buid).collection('followRequests').doc(AUTH.uid).set({ uid: AUTH.uid, name: EVIL });
  }, { buid: B.uid, EVIL });
  await H.logSession(b, { material: 'Leases' }); await H.settle(b);
  await x.evaluate(async ({ buid, EVIL }) => { const d = (await firebaseDb.collection('users').doc(buid).get()).data(); const act = d.recentActivities[0].id;
    await firebaseDb.collection('users').doc(buid).collection('comments').add({ activityId: act, from: AUTH.uid, name: EVIL, text: EVIL });
    await firebaseDb.collection('users').doc(buid).collection('props').doc(act + '__' + AUTH.uid).set({ activityId: act, reactor: AUTH.uid }); }, { buid: B.uid, EVIL });
  await b.reload(); await b.waitForSelector('.nav-tab'); await b.waitForTimeout(5000); await chk('reload: feed + sync (notifications, clubs, requests)');
  for (const tab of ['feed', 'dashboard', 'plan', 'profile', 'explore', 'studylab']) { await b.evaluate((t) => switchTab(t), tab); await chk('tab ' + tab); }
  await b.evaluate(() => openNotificationCenter()); await chk('notification center'); await b.evaluate(() => closeNotifModal());
  await b.evaluate(() => openFollowRequestsModal()); await chk('follow requests modal'); await b.evaluate(() => document.getElementById('follow-req-modal')?.remove());
  await b.evaluate(() => openSearchModal()); await b.fill('#search-input', '<img'); await chk('search results'); await b.evaluate(() => closeSearchModal());
  await b.evaluate((uid) => openUserProfile(uid), X.uid); await b.waitForTimeout(1500); await chk('view user profile');
  await b.evaluate((uid) => openUserFollowList && openUserFollowList(uid, 'followers'), X.uid).catch(() => {}); await chk('user follow list');
  await b.evaluate(() => { try { closeUserProfile(); } catch (e) {} openFollowModal('followers'); }); await chk('my followers modal'); await b.evaluate(() => closeFollowModal());
  await b.evaluate(() => openMessagesPage()); await b.waitForTimeout(2500); await chk('messages inbox');
  await b.evaluate((uid) => openDirectMessage(uid, 'x', 'x'), X.uid); await b.waitForTimeout(1500); await chk('DM thread');
  await b.evaluate(() => { history.back(); }); await b.waitForTimeout(500);
  await b.evaluate(() => openClubView('firm_' + S.firmCode)); await b.waitForTimeout(1500); await chk('cohort chat');
  for (const tab of ['members', 'leaderboard', 'about']) { await b.evaluate((t) => { _clubViewTab = t; renderClubView('firm_' + S.firmCode); }, tab); await b.waitForTimeout(1200); await chk('cohort ' + tab); }
  await b.evaluate(() => closeClubView());
  await b.evaluate(() => openClubsModal && openClubsModal()).catch(() => {}); await chk('clubs modal');
  const cid = await b.evaluate(() => (S.clubs.find(c => !c.isCohort && !c.isDM) || {}).id); assert.ok(cid, 'the hostile club reached the victim (so its name was really rendered)');
  if (cid) { await b.evaluate((id) => { closeClubsModal(); openClubView(id); }, cid); await b.waitForTimeout(1200); await chk('evil club view'); await b.evaluate(() => closeClubView()); }
  await b.evaluate(() => { const a = S.activities[0]; openComments(a.id, AUTH.uid); }); await chk('comments modal on own activity');
  await b.evaluate(() => { closeCommentsModal(); showCohortDigestCard && showCohortDigestCard(); }).catch(() => {}); await chk('cohort digest card');

  assert.deepEqual(hits, [], 'script injected through user content executed');
  assert.deepEqual(H.appErrors(B), [], 'hostile content must not break rendering either');

  await t.test('rules reject documents with markup in their IDs', async () => {
    const denied = await x.evaluate(async (buid) => {
      const bad = '<img src=x onerror=alert(1)>';
      const tryIt = async (fn) => { try { await fn(); return false; } catch (e) { return e.code === 'permission-denied'; } };
      return [
        await tryIt(() => firebaseDb.collection('clubs').doc(bad).set({ name: 'x', members: [AUTH.uid, buid] })),
        await tryIt(() => firebaseDb.collection('users').doc(buid).collection('comments').doc(bad).set({ activityId: 'a', from: AUTH.uid, text: 'x' })),
        await tryIt(() => firebaseDb.collection('clubs').doc('firm_' + S.firmCode).collection('messages').doc(bad).set({ from: AUTH.uid, text: 'x' })),
      ];
    }, B.uid);
    assert.deepEqual(denied, [true, true, true]);
  });
});
