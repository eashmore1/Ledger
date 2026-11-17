// The age gate: under-13s are turned away, their login is deleted, and the
// answer sticks on the device.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');

test('age gate', async (t) => {
  if (!(await H.emulatorsUp())) return t.skip('Firebase emulators not running');
  await H.resetEmulators();
  const env = await H.launch();
  t.after(() => env.close());

  await t.test('a teenager gets a parental-permission note and continues', async () => {
    const y = new Date().getFullYear() - 16;
    const U = await H.signUpAndOnboard(env, { name: 'Teen Tester', email: 'teen.age@example.com', birthYear: y, stopAtProfile: true });
    await U.page.click('.ob-big-btn');
    await U.page.waitForSelector('.ob-btn-back');
    assert.match(await U.page.textContent('body'), /parent or guardian/);
  });

  await t.test('a child is turned away and nothing is kept', async () => {
    const y = new Date().getFullYear() - 11;
    const U = await H.signUpAndOnboard(env, { name: 'Kid Tester', email: 'kid.age@example.com', birthYear: y, stopAtProfile: true });
    const p = U.page;
    await p.click('.ob-big-btn');
    await p.waitForSelector('text=you can’t use Ledger yet');
    await p.waitForFunction(() => !firebase.auth().currentUser);
    // The login itself is gone.
    const res = await p.evaluate(async () => { try { await firebase.auth().signInWithEmailAndPassword('kid.age@example.com', 'Passw0rd!x'); return 'signed-in'; } catch (e) { return e.code; } });
    assert.match(res, /user-not-found|invalid-credential|invalid-login/);
    await firebase_signout(p);
    // Reloading doesn't offer the form again.
    await p.reload();
    await p.waitForSelector('.auth-tab');
    assert.equal(await p.evaluate(() => _ageBlocked()), true);
  });
});

async function firebase_signout(p) { await p.evaluate(() => firebase.auth().signOut()); }
