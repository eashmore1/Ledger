// /api/ask spends real money per call, so who may call it is enforced on the
// server. These run the handler with firebase-admin and the Anthropic API
// stubbed out and check that plan and quota are actually enforced.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

function loadHandler({ tier, usage }) {
  const store = { usage: usage ? { ...usage } : null, anthropicCalls: 0 };
  const adminStub = {
    apps: [{}],
    initializeApp() {}, credential: { cert() {} },
    auth: () => ({ verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad token'); return { uid: 'u1' }; } }),
    firestore: () => ({
      collection: (name) => ({
        doc: () => name === 'users'
          ? { get: async () => ({ exists: true, data: () => (tier ? { sub: { tier } } : {}) }) }
          : { __usage: true },
      }),
      runTransaction: async (fn) => fn({
        get: async () => ({ exists: !!store.usage, data: () => store.usage }),
        set: (_ref, v) => { store.usage = v; },
      }),
    }),
  };
  const adminPath = require.resolve('firebase-admin');
  require.cache[adminPath] = { id: adminPath, filename: adminPath, loaded: true, exports: adminStub };
  const handlerPath = path.resolve(__dirname, '..', 'api', 'ask.js');
  delete require.cache[handlerPath];
  process.env.ANTHROPIC_API_KEY = 'test-key';
  global.fetch = async () => { store.anthropicCalls++; return { ok: true, json: async () => ({ content: [{ text: 'answer' }] }) }; };
  return { handler: require(handlerPath), store };
}

function call(handler, { token = 'good', body = { messages: [{ role: 'user', content: 'hi' }] } } = {}) {
  return new Promise((resolve) => {
    const res = {
      code: 200, setHeader() {},
      status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o }); },
      end() { resolve({ code: this.code, body: null }); },
    };
    handler({ method: 'POST', headers: token ? { authorization: 'Bearer ' + token } : {}, body }, res);
  });
}

const realFetch = global.fetch;
test.after(() => { global.fetch = realFetch; });

test('rejects callers who are not signed in', async () => {
  const { handler, store } = loadHandler({ tier: 'elite' });
  assert.equal((await call(handler, { token: '' })).code, 401);
  assert.equal((await call(handler, { token: 'forged' })).code, 401);
  assert.equal(store.anthropicCalls, 0);
});

test('a free account cannot use the AI endpoint even with a valid login', async () => {
  for (const tier of [null, 'free']) {
    const { handler, store } = loadHandler({ tier });
    const r = await call(handler);
    assert.equal(r.code, 403);
    assert.equal(store.anthropicCalls, 0, 'no paid API call was made');
  }
});

test('a paid account gets an answer and its usage is counted', async () => {
  const { handler, store } = loadHandler({ tier: 'pro' });
  const r = await call(handler);
  assert.equal(r.code, 200);
  assert.equal(r.body.text, 'answer');
  assert.equal(store.usage.count, 1);
  assert.equal(store.usage.month, new Date().toISOString().slice(0, 7));
});

test('the monthly limit is enforced and resets with the month', async () => {
  const month = new Date().toISOString().slice(0, 7);
  let h = loadHandler({ tier: 'pro', usage: { month, count: 2000 } });
  assert.equal((await call(h.handler)).code, 429);
  assert.equal(h.store.anthropicCalls, 0);
  h = loadHandler({ tier: 'pro', usage: { month: '2000-01', count: 2000 } });
  assert.equal((await call(h.handler)).code, 200);
  assert.equal(h.store.usage.count, 1);
});

test('oversized requests are refused before reaching the model', async () => {
  const { handler, store } = loadHandler({ tier: 'elite' });
  const r = await call(handler, { body: { messages: [{ role: 'user', content: 'x'.repeat(250000) }] } });
  assert.equal(r.code, 413);
  assert.equal(store.anthropicCalls, 0);
});
