// /api/generate-bank grows the question bank. These run the handler against an
// in-memory Firestore and a stubbed Anthropic client, and check that it only
// ever adds questions, drops duplicates and anything that fails the accuracy
// check, and stops at the target.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Minimal in-memory Firestore: enough of the API the handler uses.
function fakeDb(){
  const docs = new Map(); // path -> data
  const docRef = (p) => ({
    id: p.split('/').pop(), path: p,
    get: async () => ({ exists: docs.has(p), id: p.split('/').pop(), data: () => docs.get(p) }),
    set: async (v, o) => { docs.set(p, o && o.merge ? { ...(docs.get(p) || {}), ...v } : { ...v }); },
    delete: async () => { docs.delete(p); },
    collection: (c) => colRef(p + '/' + c),
  });
  const colRef = (p) => ({
    doc: (id) => docRef(p + '/' + id),
    get: async () => {
      const list = [...docs.keys()].filter(k => k.startsWith(p + '/') && !k.slice(p.length + 1).includes('/'))
        .map(k => ({ id: k.split('/').pop(), ref: docRef(k), data: () => docs.get(k) }));
      return { size: list.length, docs: list, forEach: (f) => list.forEach(f) };
    },
  });
  return { docs, collection: colRef, doc: docRef };
}

function q(text, i = 0){ return { q: text, choices: ['Alpha ' + i, 'Bravo ' + i, 'Charlie ' + i, 'Delta ' + i], correct: 1, exp: 'Because Bravo is right under the rule.' }; }
const words = 'lease asset bond equity revenue goodwill pension hedge inventory tax deferred cash audit sample control fraud opinion trust estate gift partnership basis credit loss'.split(' ');
// Distinct question text for index n (shares few words with other indexes).
function distinct(n){ return 'Question ' + words[n % words.length] + ' ' + words[(n * 7 + 3) % words.length] + ' number' + n + ' unique' + n + ' item' + n + ' case' + n; }

function load(){
  const db = fakeDb();
  const adminStub = { apps: [{}], initializeApp() {}, credential: { cert() {} }, firestore: () => db };
  const adminPath = require.resolve('firebase-admin');
  require.cache[adminPath] = { id: adminPath, filename: adminPath, loaded: true, exports: adminStub };
  const handlerPath = path.resolve(__dirname, '..', 'api', 'generate-bank.js');
  delete require.cache[handlerPath];
  process.env.BANK_ADMIN_SECRET = 'shh';
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const handler = require(handlerPath);
  const batches = new Map();
  let counter = 0;
  const api = { created: [], answer: null };
  handler._test.setClient({ messages: { batches: {
    create: async ({ requests }) => { const id = 'b' + (++counter); batches.set(id, requests); api.created.push(requests); return { id }; },
    retrieve: async () => ({ processing_status: 'ended', request_counts: {} }),
    results: async (id) => (async function* () { for (const r of batches.get(id)) yield api.answer(r); })(),
  } } });
  return { handler, db, api };
}
function call(handler, query, method = 'GET', body){
  return new Promise((resolve) => {
    const res = { code: 200, status(c) { this.code = c; return this; }, json(o) { resolve({ code: this.code, body: o }); } };
    handler({ method, query, body }, res);
  });
}
const ok = (obj) => ({ type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(obj) }] } });

test('needs the admin secret', async () => {
  const { handler, api } = load();
  assert.equal((await call(handler, { action: 'grow' })).code, 403);
  assert.equal((await call(handler, { secret: 'nope', action: 'grow' })).code, 403);
  assert.equal(api.created.length, 0);
});

test('grows a topic to the target, adding and never replacing', async () => {
  const { handler, db, api } = load();
  const slug = 'leases-asc-842';
  const existing = [q('What is the lessee\'s initial measurement of a finance lease liability under ASC 842?', 0)];
  await db.doc('questionBank/FAR/topics/' + slug).set({ section: 'FAR', topic: 'Leases (ASC 842)', slug, questions: existing, count: 1 });

  let n = 0;
  api.answer = (r) => {
    if (r.custom_id.startsWith('w')) {
      const prompt = r.params.messages[0].content;
      if (/Leases/.test(prompt)) assert.match(prompt, /Do not repeat[\s\S]*finance lease liability/);
      const want = +prompt.match(/Write (\d+) new/)[1];
      const qs = [];
      for (let i = 0; i < want; i++) qs.push(q(distinct(n++), n));
      // One near-copy of the existing question and one malformed item get dropped.
      qs.push(q('What is the lessee\'s initial measurement of a finance lease liability under ASC 842?', 99));
      qs.push({ q: 'Broken item with three choices only?', choices: ['a', 'b', 'c'], correct: 0, exp: 'x' });
      return { custom_id: r.custom_id, result: ok({ questions: qs }) };
    }
    // Reviewer fails question #0 of every topic.
    const count = (r.params.messages[0].content.match(/\n#\d+\n/g) || []).length + 1;
    return { custom_id: r.custom_id, result: ok({ reviews: Array.from({ length: count }, (_, i) => ({ i, ok: i !== 0, issue: i ? '' : 'two answers defensible' })) }) };
  };

  const s1 = (await call(handler, { secret: 'shh', action: 'grow', section: 'FAR', target: '10' })).body;
  assert.equal(s1.phase, 'writing');
  // 20 FAR topics; the stored one needs 9 more, the other 19 need 10 each.
  const writeReqs = api.created[0];
  assert.ok(writeReqs.every(r => r.params.model && r.params.output_config.format.type === 'json_schema'));
  assert.ok(writeReqs.every(r => /^[a-zA-Z0-9_-]{1,64}$/.test(r.custom_id)));

  const s2 = (await call(handler, { secret: 'shh', action: 'grow' })).body;
  assert.equal(s2.phase, 'checking');
  assert.ok(s2.duplicatesDropped >= 1, 'the near-copy of the stored question is dropped');

  const s3 = (await call(handler, { secret: 'shh', action: 'grow' })).body;
  assert.equal(s3.phase, 'done');
  assert.ok(s3.failedCheck >= 20);

  const topic = db.docs.get('questionBank/FAR/topics/' + slug);
  assert.equal(topic.count, 10, 'stops at the target');
  assert.equal(topic.questions[0].q, existing[0].q, 'the original question is kept first');
  assert.ok(topic.questions.every(x => x.choices.length === 4 && x.correct >= 0 && x.correct <= 3));
  assert.ok(topic.questions.every(x => x.choices[x.correct].startsWith('Bravo')), 'reshuffling keeps the right answer marked');
  assert.equal(db.docs.get('questionBank/FAR').questionCount, 200);
  assert.equal([...db.docs.keys()].filter(k => k.includes('/pending/')).length, 0, 'pending cleaned up');

  // Next run has nothing to do.
  const s4 = (await call(handler, { secret: 'shh', action: 'grow', section: 'FAR', target: '10' })).body;
  assert.equal(s4.phase, 'done');
  assert.match(s4.message, /already has 10/);
  const status = (await call(handler, { secret: 'shh', target: '10' })).body;
  assert.equal(status.sections.FAR.questions, 200);
  assert.equal(status.sections.FAR.belowTarget.length, 0);
});

test('a refused or cut-off result is skipped, not stored', async () => {
  const { handler, db, api } = load();
  api.answer = (r) => ({ custom_id: r.custom_id, result: { type: 'succeeded', message: { stop_reason: r.custom_id === 'w0' ? 'refusal' : 'max_tokens', content: [{ type: 'text', text: '{"questions":[' }] } } });
  await call(handler, { secret: 'shh', action: 'grow', section: 'ISC', target: '5' });
  const s2 = (await call(handler, { secret: 'shh', action: 'grow' })).body;
  assert.equal(s2.phase, 'done');
  assert.equal(s2.added, 0);
  assert.equal([...db.docs.keys()].filter(k => k.startsWith('questionBank/ISC/topics/')).length, 0);
});

test('uploads add to a topic and skip duplicates', async () => {
  const { handler, db } = load();
  const body = { section: 'TCP', topics: [{ topic: 'Gifting strategies', questions: [q(distinct(1)), q(distinct(2))] }] };
  await call(handler, { secret: 'shh' }, 'POST', body);
  const r = (await call(handler, { secret: 'shh' }, 'POST', { section: 'TCP', topics: [{ topic: 'Gifting strategies', questions: [q(distinct(2)), q(distinct(3))] }] })).body;
  assert.equal(r.written[0].added, 1);
  assert.equal(db.docs.get('questionBank/TCP/topics/gifting-strategies').count, 3);
  assert.equal(r.sectionTotal, 3);
});

test('choices are only reshuffled when nothing points at a position', () => {
  const { handler } = load();
  const { shuffleChoices } = handler._test;
  const item = { q: 'x', choices: ['w', 'x', 'y', 'z'], correct: 2, exp: 'y wins.' };
  for (let i = 0; i < 20; i++) { const s = shuffleChoices(item); assert.equal(s.choices[s.correct], 'y'); }
  const pinned = { ...item, exp: 'Option B is wrong because...' };
  assert.deepEqual(shuffleChoices(pinned), pinned);
  const nota = { ...item, choices: ['w', 'x', 'y', 'None of the above'] };
  assert.deepEqual(shuffleChoices(nota), nota);
});
