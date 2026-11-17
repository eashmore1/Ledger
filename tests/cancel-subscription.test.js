'use strict';
// /api/cancel-subscription: normal cancel (at period end) and the immediate
// cancel used when someone deletes their account.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function load({ subId = 'sub_123' } = {}) {
  const calls = [];
  const stripePath = require.resolve('stripe');
  const adminPath = require.resolve('firebase-admin');
  require.cache[stripePath] = { id: stripePath, filename: stripePath, loaded: true, exports: () => ({
    subscriptions: {
      update: async (id, body) => { calls.push(['update', id, body]); return { cancel_at: 1900000000 }; },
      cancel: async (id) => { calls.push(['cancel', id]); return { status: 'canceled' }; },
    },
  }) };
  const doc = { get: async () => ({ exists: true, data: () => ({ sub: subId ? { stripeSubscriptionId: subId } : {} }) }), update: async (u) => calls.push(['db', u]) };
  require.cache[adminPath] = { id: adminPath, filename: adminPath, loaded: true, exports: {
    apps: [{}], firestore: () => ({ collection: () => ({ doc: () => doc }) }),
    auth: () => ({ verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1' }; } }),
  } };
  const file = path.resolve(__dirname, '..', 'api', 'cancel-subscription.js');
  delete require.cache[file];
  return { handler: require(file), calls };
}
function res() {
  const r = { code: 200, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
}
const req = (body, token = 'good') => ({ method: 'POST', headers: { authorization: 'Bearer ' + token }, body });

test('normal cancel keeps access until the period ends', async () => {
  const { handler, calls } = load();
  const r = res(); await handler(req({}), r);
  assert.equal(r.code, 200);
  assert.deepEqual(calls[0], ['update', 'sub_123', { cancel_at_period_end: true }]);
});

test('deleting the account cancels the subscription right away', async () => {
  const { handler, calls } = load();
  const r = res(); await handler(req({ immediately: true }), r);
  assert.equal(r.code, 200);
  assert.deepEqual(calls, [['cancel', 'sub_123']]);
});

test('needs a valid sign-in', async () => {
  const { handler, calls } = load();
  const r = res(); await handler(req({ immediately: true }, 'bad'), r);
  assert.equal(r.code, 401);
  assert.equal(calls.length, 0);
});
