// The social loop between real accounts, run against the repo's actual
// Firestore security rules: follow, feed, kudos, comments, direct messages,
// cohort invite links, public clubs and user-created clubs.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

test('social features between two real users', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running — see README "End-to-end tests"');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  const A = await H.signUpAndOnboard(env, { name: 'Alice Tester', email: 'alice@example.com', firm: 'Deloitte Dallas' });
  const a = A.page;
  await H.clearFirstRun(a);
  await H.logSession(a, { material: 'Leases' });
  await H.settle(a);

  // Bob arrives through Alice's invite link.
  const invite = new URL(await a.evaluate(() => buildInviteLink()));
  const q = invite.searchParams;
  const B = await H.signUpAndOnboard(env, {
    name: 'Bob Builder', email: 'bob@example.com',
    url: `/?join=${q.get('c')}&uid=${q.get('uid')}&from=${q.get('from')}&fn=${encodeURIComponent(q.get('fn') || '')}`,
  });
  const b = B.page;
  await H.clearFirstRun(b);
  await b.waitForTimeout(2500);

  await t.test('invite link joins the cohort and connects the two users', async () => {
    const st = await b.evaluate(() => ({ firmCode: S.firmCode, firmName: S.firmName, following: S.following }));
    assert.equal(st.firmCode, q.get('c'));
    assert.equal(st.firmName, 'Deloitte Dallas');
    assert.deepEqual(st.following, [A.uid]);
    const members = await b.evaluate(async () => (await firebaseDb.collection('clubs').doc('firm_' + S.firmCode).collection('members').get()).docs.map((d) => d.data().name).sort());
    assert.deepEqual(members, ['Alice', 'Bob']);
  });

  await t.test("a followed user's session appears in the feed", async () => {
    await b.evaluate(() => switchTab('feed'));
    await b.waitForSelector('[onclick*="giveProps"]', { timeout: 10000 });
    assert.match(await b.evaluate(() => document.body.innerText), /Leases/);
  });

  await t.test('kudos and comments are stored and visible to the author', async () => {
    await b.click('[onclick*="giveProps"]');
    await b.click('[onclick*="openComments"]');
    const inp = b.locator('.modal-overlay.open input[type=text], .modal-overlay.open textarea').first();
    await inp.fill('Nice work on leases!');
    await inp.press('Enter');
    await b.waitForTimeout(1500);
    await a.reload();
    await a.waitForSelector('.nav-tab');
    await a.waitForTimeout(3500);
    const act = await a.evaluate(() => { const x = S.activities[0]; return { kudos: (x.kudos || []).length, comments: (x.comments || []).map((c) => c.text) }; });
    assert.equal(act.kudos, 1);
    assert.deepEqual(act.comments, ['Nice work on leases!']);
  });

  await t.test('direct messages are delivered in real time both ways', async () => {
    await b.evaluate((uid) => { closeCommentsModal(); openDirectMessage(uid, 'Alice', 'AL'); }, A.uid);
    await b.waitForSelector('.dm-comp-inp');
    await b.fill('.dm-comp-inp', 'Study FAR tonight?');
    await b.press('.dm-comp-inp', 'Enter');
    await a.evaluate(() => openMessagesPage());
    await a.click('.dm-inbox-row:has-text("Bob")');
    await a.waitForSelector('#dm-msgs-area:has-text("Study FAR tonight?")');
    await a.fill('.dm-comp-inp', 'Yes, 7pm.');
    await a.press('.dm-comp-inp', 'Enter');
    await b.waitForSelector('#dm-msgs-area:has-text("Yes, 7pm.")');
  });

  await t.test('cohort chat works', async () => {
    await b.evaluate(() => { history.back(); });
    await b.waitForTimeout(500);
    await b.evaluate(() => openClubView('firm_' + S.firmCode));
    const inp = b.locator('[id^="cva-inp-"]');
    await inp.fill('Hello cohort');
    await inp.press('Enter');
    await b.waitForSelector('.modal-overlay.open :text("Hello cohort")');
    await b.evaluate(() => closeClubView());
  });

  await t.test('joining a public club posts the join message', async () => {
    await b.evaluate(() => joinPublicClub('pub_far'));
    await b.waitForTimeout(1500);
    const msgs = await b.evaluate(async () => (await firebaseDb.collection('clubs').doc('pub_far').collection('messages').get()).docs.map((d) => d.data().text));
    assert.deepEqual(msgs, ['Bob joined FAR Warriors!']);
  });

  let clubId;
  await t.test('a user-created club is shared with the people invited to it', async () => {
    await b.evaluate(() => createClubModal());
    await b.fill('#ncn', 'FAR Night Crew');
    await b.check(`[id="cm-${A.uid}"]`);
    await b.evaluate(() => saveNewClub());
    await b.waitForTimeout(2000);
    clubId = await b.evaluate(() => S.clubs.find((c) => c.name === 'FAR Night Crew').id);
    await a.reload();
    await a.waitForSelector('.nav-tab');
    await a.waitForFunction(() => S.clubs.some((c) => c.name === 'FAR Night Crew'), null, { timeout: 15000 });
    await a.evaluate((id) => openClubView(id), clubId);
    const inp = a.locator('[id^="cva-inp-"]');
    await inp.fill('Thanks for the add');
    await inp.press('Enter');
    await a.waitForSelector('.modal-overlay.open :text("Thanks for the add")');
  });

  await t.test('security rules hold against an outsider', async () => {
    const C = await H.signUpAndOnboard(env, { name: 'Carol Outsider', email: 'carol@example.com' });
    const denied = (fn, ...args) => C.page.evaluate(async ({ src, args }) => {
      try { await (0, eval)('(' + src + ')')(...args); return false; } catch (e) { return e.code === 'permission-denied'; }
    }, { src: fn.toString(), args });
    const convId = [A.uid, B.uid].sort().join('__dm__');
    assert.ok(await denied((id) => firebaseDb.collection('conversations').doc(id).collection('messages').get(), convId), "reading someone else's DMs");
    assert.ok(await denied((id) => firebaseDb.collection('conversations').doc(id).collection('messages').add({ from: AUTH.uid, text: 'x' }), convId), "posting into someone else's DM thread");
    assert.ok(await denied((id) => firebaseDb.collection('clubs').doc(id).collection('messages').get(), clubId), "reading a private club's chat");
    assert.ok(await denied((id) => firebaseDb.collection('clubs').doc(id).update({ members: firebase.firestore.FieldValue.arrayUnion(AUTH.uid) }), clubId), 'adding yourself to a private club');
    assert.ok(await denied((uid) => firebaseDb.collection('userState').doc(uid).get(), A.uid), "reading another user's private state");
    assert.ok(await denied((uid) => firebaseDb.collection('users').doc(uid).update({ bio: 'hacked' }), A.uid), "editing another user's profile");
    assert.ok(await denied(() => firebaseDb.collection('users').doc(AUTH.uid).update({ sub: { tier: 'elite' } })), 'granting yourself a paid plan');
    assert.ok(await denied(() => firebaseDb.collection('users').doc(AUTH.uid).update({ 'sub.stripeSubscriptionId': 'sub_stolen' })), 'pointing your account at another Stripe subscription');
    assert.ok(await denied((uid) => firebaseDb.collection('users').doc(uid).collection('props').doc('x').set({ activityId: 'x', reactor: uid }), A.uid), 'forging kudos from someone else');
  });

  assert.deepEqual(H.appErrors(A), []);
  assert.deepEqual(H.appErrors(B), []);
});
