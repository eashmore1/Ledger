// ─────────────────────────────────────────────────────────────────────────────
// Ledger — question bank builder  /api/generate-bank
//
// "Generate once, cache forever." Questions are written by Claude and stored in
// Firestore; serving them to users is a plain database read with no AI cost.
//
// Firestore layout:
//   questionBank/{SECTION}                 meta {section, topics[], questionCount, updatedAt}
//   questionBank/{SECTION}/topics/{slug}   {section, topic, slug, questions:[{q,choices,correct,exp}], count}
//   questionBankJobs/current               the grow job in progress, if any
//   questionBankJobs/current/pending/{id}  questions written but not yet checked
//
// Everything is admin-only (BANK_ADMIN_SECRET). Open these in a browser:
//
//   How full is the bank? (free, no AI)
//     /api/generate-bank?secret=XXX
//
//   Grow every topic to 50 questions. Open the same link again every so often;
//   each visit moves the job one step and says what happens next:
//     /api/generate-bank?secret=XXX&action=grow
//       1st visit  sends the writing job (Message Batches, half price)
//       later      once written: dedupes, then sends an accuracy check
//       later      once checked: adds the questions that passed
//     Optional: &section=FAR (one section only), &target=60 (other size, max 100)
//
//   Read a few stored questions:  ?secret=XXX&section=FAR&peek=5
//   Upload hand-written questions: POST {section, topics:[{topic, questions}]}
//
// New questions are ADDED to a topic; nothing already in the bank is replaced.
// Env vars: ANTHROPIC_API_KEY, FIREBASE_SERVICE_ACCOUNT, BANK_ADMIN_SECRET
// ─────────────────────────────────────────────────────────────────────────────
const admin = require('firebase-admin');

if (!admin.apps.length) {
  let serviceAccount;
  try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'); } catch (e) {}
  if (serviceAccount && serviceAccount.project_id) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

const AnthropicSDK = require('@anthropic-ai/sdk');
const Anthropic = AnthropicSDK.default || AnthropicSDK;

const GEN_MODEL = 'claude-opus-5-5';
const DEFAULT_TARGET = 50;   // questions per topic
const MAX_TARGET = 100;
const PER_REQUEST = 15;      // questions asked for in one writing request
const OVERSHOOT = 1.3;       // ask for extra to cover duplicates and failed checks
const JOB_DOC = ['questionBankJobs', 'current'];

let _client = null;
function client(){ return _client || (_client = new Anthropic()); }

const TOPICS = {
  FAR: [
    'Conceptual framework and standard-setting','Income statement and revenue recognition (ASC 606)',
    'Balance sheet presentation and disclosures','Statement of cash flows mechanics',
    'Receivables and the allowance method','Inventory (FIFO, LIFO, LCNRV)',
    'Property, plant and equipment and depreciation','Intangible assets and goodwill impairment',
    'Investments (debt and equity, equity method)','Leases (ASC 842)',
    'Bonds and long-term debt','Stockholders equity and earnings per share',
    'Income taxes and deferred taxes (ASC 740)','Pensions and postretirement benefits',
    'Business combinations and consolidations','Contingencies and subsequent events',
    'Governmental accounting and fund accounting (GASB)','Not-for-profit accounting (ASC 958)',
    'Foreign currency and derivatives/hedging','Financial statement ratio analysis',
  ],
  AUD: [
    'Engagement acceptance and audit planning','Ethics, independence and the AICPA Code',
    'Audit risk model and materiality','Internal control and the COSO framework',
    'Tests of controls','Substantive procedures and audit evidence',
    'Audit sampling','Auditing the revenue cycle',
    'Auditing the expenditure cycle','Auditing cash and investments',
    'Audit data analytics and IT considerations','Fraud risk and the auditor response (AU-C 240)',
    'Audit reports and opinion modifications','Going concern evaluation',
    'Subsequent events and subsequently discovered facts','Reviews and compilations (SSARS)',
    'Attestation engagements (SSAE)','Group audits and using the work of others',
    'Communications with those charged with governance','Quality management and documentation',
  ],
  REG: [
    'Individual gross income and exclusions','Individual deductions and adjustments',
    'Individual credits and the AMT','Filing status, dependents and tax computation',
    'Property transactions — basis and holding period','Capital gains/losses and §1231/1245/1250',
    'Like-kind exchanges and involuntary conversions','Corporate formation and §351',
    'Corporate income, deductions and distributions','S corporations',
    'Partnership formation, basis and distributions','Estate and gift taxation',
    'Trust and fiduciary taxation','Tax-exempt organizations',
    'Business law — contracts','Business law — agency and employment',
    'Secured transactions (UCC Article 9)','Negotiable instruments and sales (UCC)',
    'Debtor-creditor relationships and bankruptcy','Circular 230 and federal tax procedure',
  ],
  TCP: [
    'Individual tax planning strategies','Gifting and wealth-transfer strategies',
    'Personal financial planning and retirement accounts','Advanced property transactions (installment sales, §1031)',
    'Gain/loss recognition and character planning','Entity choice and formation planning',
    'C corporation tax planning','S corporation distributions and basis planning',
    'Partnership special allocations and §754 elections','Partnership distributions and liquidations',
    'Multistate and multi-jurisdictional tax planning','International tax basics (GILTI, FDII, foreign tax credit)',
    'Tax credit planning (R&D, energy)','Accounting methods and periods',
    'Net operating losses and the §163(j) interest limitation','Compensation and stock-based planning',
    'Estate and trust income tax planning','Charitable contribution planning',
    'Tax implications of M&A transactions','Tax research and compliance procedures',
  ],
  BAR: [
    'Financial statement analysis and ratios','Managerial and cost accounting fundamentals',
    'Cost-volume-profit analysis','Budgeting and variance analysis',
    'Forecasting and projection techniques','Performance measurement and the balanced scorecard',
    'Advanced revenue recognition (ASC 606)','Advanced leases and lessor accounting',
    'Advanced business combinations','Consolidations and variable interest entities',
    'Derivatives and hedge accounting','Stock-based compensation (ASC 718)',
    'Advanced pension accounting','Advanced income taxes (ASC 740)',
    'Foreign currency translation and remeasurement','Advanced governmental reporting (GASB)',
    'Advanced not-for-profit reporting','Economic concepts and the business cycle',
    'Financial valuation and cost of capital','Data analytics and financial modeling',
  ],
  ISC: [
    'IT governance and frameworks (COBIT)','SOC 1 and SOC 2 engagements',
    'Trust services criteria','IT general controls (ITGCs)',
    'Application controls','Logical and physical access controls',
    'Change management controls','System development life cycle (SDLC)',
    'Data management and governance','Network security and architecture',
    'Encryption and data protection','Information security frameworks (NIST)',
    'Cybersecurity risk management','Incident response and business continuity',
    'Disaster recovery and backup','Privacy regulations and data confidentiality',
    'IT audit procedures and evidence','System availability and processing integrity',
    'Third-party and vendor risk management','Emerging tech risks (cloud, AI, blockchain)',
  ],
};

const SECTION_FULL = {
  FAR:'Financial Accounting & Reporting', AUD:'Auditing & Attestation', REG:'Regulation',
  TCP:'Tax Compliance & Planning', BAR:'Business Analysis & Reporting', ISC:'Information Systems & Controls',
};

function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60); }

function normQ(o){
  if(!o || typeof o!=='object') return null;
  const q=(o.q||o.question||'').toString().trim();
  let choices=o.choices||o.options||o.answers;
  if(!Array.isArray(choices)||choices.length<4) return null;
  choices=choices.slice(0,4).map(c=>(c==null?'':c).toString());
  let correct=o.correct;
  if(typeof correct==='string'){ const L='ABCD'.indexOf(correct.trim().toUpperCase()); correct=L>=0?L:choices.findIndex(c=>c===correct); }
  correct=parseInt(correct,10);
  if(!(correct>=0&&correct<=3)) return null;
  if(q.length<8) return null;
  const exp=(o.exp||o.explanation||'').toString().trim()||'Review this concept with your primary course.';
  return {q,choices,correct,exp};
}

// ── Duplicate detection ─────────────────────────────────────────────────────
const STOP = new Set('the a an of to and or in on for is are was were be by with that this which what as at from it its under how does do if not would should most following company entity'.split(' '));
function stemWords(q){
  return new Set(String(q||'').toLowerCase().replace(/[^a-z0-9$%.]+/g,' ').split(' ').filter(w => w && !STOP.has(w)));
}
function similarity(a, b){
  if (!a.size || !b.size) return 0;
  let inter = 0; for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}
const DUP_AT = 0.6;
// Keeps candidates that aren't near-copies of the existing questions or of each other.
function dedupe(existing, candidates){
  const seen = existing.map(x => stemWords(x.q));
  const kept = [];
  for (const c of candidates) {
    const w = stemWords(c.q);
    if (seen.some(s => similarity(s, w) >= DUP_AT)) continue;
    seen.push(w); kept.push(c);
  }
  return kept;
}

// A question is safe to reshuffle when nothing refers to answer letters/positions.
const POSITIONAL = /\b(choice|option|answer)\s*\(?[A-D]\)?(?![a-z])|\([A-D]\)|\b(all|none|both) of the (above|following|choices)\b|\b[A-D] and [A-D]\b/i;
function shuffleChoices(item, rnd = Math.random){
  if (POSITIONAL.test(item.exp) || item.choices.some(c => POSITIONAL.test(c))) return item;
  const order = [0,1,2,3];
  for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return { ...item, choices: order.map(i => item.choices[i]), correct: order.indexOf(item.correct) };
}
// Generator output also needs four distinct choices.
function validQ(o){
  if (!o || !Array.isArray(o.choices || o.options || o.answers) || (o.choices || o.options || o.answers).length !== 4) return null;
  const n = normQ(o);
  if (!n) return null;
  const uniq = new Set(n.choices.map(c => c.trim().toLowerCase()));
  if (uniq.size !== 4 || n.choices.some(c => !c.trim())) return null;
  return n;
}

// ── Prompts ─────────────────────────────────────────────────────────────────
const QUESTIONS_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['questions'],
  properties: { questions: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['q', 'choices', 'correct', 'exp'],
    properties: {
      q: { type: 'string' },
      choices: { type: 'array', items: { type: 'string' } },
      correct: { type: 'integer', enum: [0, 1, 2, 3] },
      exp: { type: 'string' },
    },
  } } },
};
const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['reviews'],
  properties: { reviews: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['i', 'ok', 'issue'],
    properties: { i: { type: 'integer' }, ok: { type: 'boolean' }, issue: { type: 'string' } },
  } } },
};
const ANGLES = [
  'Lean toward calculation and application questions with realistic numbers.',
  'Lean toward rules, recognition and measurement criteria, and how standards apply to a short fact pattern.',
  'Lean toward exceptions, edge cases and commonly confused rules that trip up candidates.',
  'Lean toward scenario-based judgment questions like those in the exam\'s harder testlets.',
  'Lean toward disclosure, presentation and documentation requirements.',
];

const WRITER_SYSTEM = 'You are a senior CPA exam item writer. Your questions match the current AICPA CPA Exam Blueprints and are technically exact.';
function writePrompt(section, topic, n, angleIdx, existingStems){
  const full = SECTION_FULL[section] || section;
  return 'Write ' + n + ' new multiple-choice questions for the CPA exam section ' + section + ' (' + full + ') on this topic: ' + topic + '.\n\n'
    + 'Rules:\n'
    + '- Exam-realistic: each tests real understanding or a calculation, with 4 choices and exactly one defensibly correct answer. Wrong choices should be plausible mistakes a candidate might make.\n'
    + '- Use current authoritative guidance (FASB ASC, GASB, AICPA/PCAOB standards, the Internal Revenue Code as amended, current UCC and federal law).\n'
    + '- If an answer depends on an inflation-adjusted or year-specific amount, state the tax year in the question and use that year\'s amount, or give the amount in the facts.\n'
    + '- Do not refer to choices by letter or position anywhere, and do not use "all of the above" or "none of the above".\n'
    + '- "exp" is 1-3 sentences: why the correct answer is right, citing the standard or code section where useful, and the trap in the most tempting wrong choice.\n'
    + '- "correct" is the 0-based index of the correct choice. Vary which position is correct.\n'
    + '- ' + ANGLES[angleIdx % ANGLES.length] + '\n'
    + (existingStems.length
      ? '\nThe bank already has these questions on this topic. Do not repeat or lightly reword any of them; cover different points:\n'
        + existingStems.map(s => '- ' + s).join('\n') + '\n'
      : '');
}
const REVIEWER_SYSTEM = 'You are a meticulous CPA exam technical reviewer. You reject any question you would not stake your license on.';
function reviewPrompt(section, topic, items){
  return 'Review these CPA exam (' + section + ', topic: ' + topic + ') multiple-choice questions. For each one, set ok=true only if ALL hold:\n'
    + '1. Exactly one choice is correct under current authoritative guidance, and it is the one marked correct.\n'
    + '2. No other choice could also be argued correct; the facts given are enough to answer.\n'
    + '3. Any calculation in the question and explanation is arithmetically right.\n'
    + '4. The explanation agrees with the marked answer and contains no false statement.\n'
    + '5. Year-dependent amounts are tied to a stated year and are right for that year.\n'
    + 'Otherwise ok=false, with the problem in "issue" (empty string when ok). Return one review per question, with "i" matching its number.\n\n'
    + items.map((x, i) => '#' + i + '\nQ: ' + x.q + '\n' + x.choices.map((c, j) => '  [' + j + '] ' + c).join('\n')
      + '\nMarked correct: [' + x.correct + ']\nExplanation: ' + x.exp).join('\n\n');
}
function request(custom_id, system, prompt, schema, effort){
  return { custom_id, params: {
    model: GEN_MODEL, max_tokens: 32000, system,
    output_config: { effort, format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: prompt }],
  } };
}
// Reads a batch result's JSON body, or null when it failed, was refused or was cut off.
function resultJSON(r){
  if (!r || !r.result || r.result.type !== 'succeeded') return null;
  const m = r.result.message;
  if (!m || m.stop_reason !== 'end_turn') return null;
  const t = (m.content || []).find(b => b.type === 'text');
  try { return t ? JSON.parse(t.text) : null; } catch (e) { return null; }
}
async function readResults(batchId){
  const out = new Map();
  for await (const r of await client().messages.batches.results(batchId)) out.set(r.custom_id, r);
  return out;
}

// ── Firestore helpers ───────────────────────────────────────────────────────
async function refreshMeta(db, section){
  const snap = await db.collection('questionBank').doc(section).collection('topics').get();
  let qCount = 0; const topicSlugs = [];
  snap.forEach(d => { const dd = d.data(); qCount += (dd.count || 0); topicSlugs.push(dd.slug || d.id); });
  await db.collection('questionBank').doc(section).set({
    section, full: SECTION_FULL[section], topics: topicSlugs, topicCount: topicSlugs.length,
    questionCount: qCount, updatedAt: Date.now(),
  }, { merge: true });
  return qCount;
}
// Every topic in a section: the stored ones plus any listed topic not stored yet.
async function sectionTopics(db, section){
  const snap = await db.collection('questionBank').doc(section).collection('topics').get();
  const bySlug = new Map();
  snap.forEach(d => { const dd = d.data() || {}; const slug = dd.slug || d.id;
    bySlug.set(slug, { section, slug, topic: dd.topic || slug, questions: Array.isArray(dd.questions) ? dd.questions : [] }); });
  for (const t of TOPICS[section] || []) { const slug = slugify(t); if (!bySlug.has(slug)) bySlug.set(slug, { section, slug, topic: t, questions: [] }); }
  return [...bySlug.values()];
}
async function bankStatus(db, target){
  const sections = {}; let total = 0, goal = 0;
  for (const section of Object.keys(TOPICS)) {
    const topics = await sectionTopics(db, section);
    const n = topics.reduce((a, t) => a + t.questions.length, 0);
    total += n; goal += topics.length * target;
    sections[section] = { questions: n, topics: topics.length, belowTarget: topics.filter(t => t.questions.length < target).map(t => t.topic + ' (' + t.questions.length + ')') };
  }
  return { total, goal, target, sections };
}

// ── Grow job: write → dedupe + check → add ─────────────────────────────────
async function startGrow(db, sections, target){
  const reqs = [], map = {};
  let asked = 0;
  for (const section of sections) {
    for (const t of await sectionTopics(db, section)) {
      const need = target - t.questions.length;
      if (need <= 0) continue;
      const ask = Math.ceil(need * OVERSHOOT);
      const stems = t.questions.map(x => String(x.q).replace(/\s+/g, ' ').slice(0, 160));
      for (let k = 0, left = ask; left > 0; k++, left -= PER_REQUEST) {
        const n = Math.min(PER_REQUEST, left);
        const id = 'w' + reqs.length;
        map[id] = { section, slug: t.slug, topic: t.topic };
        reqs.push(request(id, WRITER_SYSTEM, writePrompt(section, t.topic, n, k + t.questions.length, stems), QUESTIONS_SCHEMA, 'medium'));
        asked += n;
      }
    }
  }
  if (!reqs.length) return { phase: 'done', message: 'Every topic already has ' + target + ' or more questions.' };
  const batch = await client().messages.batches.create({ requests: reqs });
  await db.doc(JOB_DOC.join('/')).set({ phase: 'writing', batchId: batch.id, map, target, sections, asked, model: GEN_MODEL, startedAt: Date.now() });
  return { phase: 'writing', batchId: batch.id, requests: reqs.length, questionsAsked: asked,
    next: 'Writing has started. Open this same link again in about an hour (it can take up to 24 hours).' };
}

async function batchEnded(batchId){
  const b = await client().messages.batches.retrieve(batchId);
  return { ended: b.processing_status === 'ended', counts: b.request_counts };
}

async function finishWriting(db, job){
  const results = await readResults(job.batchId);
  const byTopic = new Map();
  let written = 0, failed = 0;
  for (const [id, where] of Object.entries(job.map)) {
    const body = resultJSON(results.get(id));
    if (!body || !Array.isArray(body.questions)) { failed++; continue; }
    const key = where.section + '/' + where.slug;
    if (!byTopic.has(key)) byTopic.set(key, { ...where, items: [] });
    for (const q of body.questions) { const v = validQ(q); if (v) { byTopic.get(key).items.push(v); written++; } }
  }
  const reqs = [], pending = db.doc(JOB_DOC.join('/')).collection('pending');
  let kept = 0, dupes = 0;
  const topicsOf = {};
  for (const g of byTopic.values()) {
    topicsOf[g.section] = topicsOf[g.section] || await sectionTopics(db, g.section);
    const existing = topicsOf[g.section].find(t => t.slug === g.slug);
    const fresh = dedupe(existing ? existing.questions : [], g.items);
    dupes += g.items.length - fresh.length;
    if (!fresh.length) continue;
    const id = 'r' + reqs.length;
    await pending.doc(id).set({ section: g.section, slug: g.slug, topic: g.topic, items: fresh });
    reqs.push(request(id, REVIEWER_SYSTEM, reviewPrompt(g.section, g.topic, fresh), REVIEW_SCHEMA, 'high'));
    kept += fresh.length;
  }
  if (!reqs.length) {
    await db.doc(JOB_DOC.join('/')).set({ phase: 'done', finishedAt: Date.now(), added: 0 }, { merge: true });
    return { phase: 'done', written, failedRequests: failed, duplicatesDropped: dupes, added: 0 };
  }
  const batch = await client().messages.batches.create({ requests: reqs });
  await db.doc(JOB_DOC.join('/')).set({ phase: 'checking', checkBatchId: batch.id, written, duplicatesDropped: dupes, failedRequests: failed }, { merge: true });
  return { phase: 'checking', written, duplicatesDropped: dupes, failedRequests: failed, sentForCheck: kept,
    next: 'Accuracy check has started. Open this same link again in about an hour.' };
}

async function finishChecking(db, job){
  const results = await readResults(job.checkBatchId);
  const pending = db.doc(JOB_DOC.join('/')).collection('pending');
  const snap = await pending.get();
  let added = 0, rejected = 0, unchecked = 0, overTarget = 0;
  const touched = new Set(), sample = [];
  for (const d of snap.docs) {
    const p = d.data();
    const body = resultJSON(results.get(d.id));
    if (!body || !Array.isArray(body.reviews)) { unchecked += p.items.length; await d.ref.delete(); continue; }
    const ok = new Set(body.reviews.filter(r => r.ok === true).map(r => r.i));
    body.reviews.filter(r => r.ok === false).slice(0, 2).forEach(r => { if (sample.length < 8 && p.items[r.i]) sample.push({ topic: p.topic, q: p.items[r.i].q.slice(0, 120), issue: r.issue }); });
    const passed = p.items.filter((_, i) => ok.has(i));
    rejected += p.items.length - passed.length;
    const ref = db.collection('questionBank').doc(p.section).collection('topics').doc(p.slug);
    const cur = await ref.get();
    const have = cur.exists && Array.isArray(cur.data().questions) ? cur.data().questions : [];
    const room = Math.max(0, job.target - have.length);
    const add = dedupe(have, passed).slice(0, room).map(x => shuffleChoices(x));
    overTarget += Math.max(0, passed.length - add.length);
    if (add.length) {
      const all = have.concat(add);
      await ref.set({ section: p.section, topic: p.topic, slug: p.slug, questions: all, count: all.length, model: GEN_MODEL, updatedAt: Date.now() }, { merge: true });
      added += add.length; touched.add(p.section);
    }
    await d.ref.delete();
  }
  const totals = {};
  for (const s of touched) totals[s] = await refreshMeta(db, s);
  await db.doc(JOB_DOC.join('/')).set({ phase: 'done', finishedAt: Date.now(), added, rejected, unchecked }, { merge: true });
  return { phase: 'done', added, failedCheck: rejected, couldNotCheck: unchecked, extraBeyondTarget: overTarget, sectionTotals: totals, sampleRejections: sample };
}

// One step of the grow job; safe to call repeatedly.
async function growStep(db, opts){
  const ref = db.doc(JOB_DOC.join('/'));
  const snap = await ref.get();
  const job = snap.exists ? snap.data() : null;
  if (job && job.busyUntil > Date.now()) return { phase: job.phase, message: 'Already working on this step. Try again in a couple of minutes.' };
  if (!job || job.phase === 'done') {
    const status = await bankStatus(db, opts.target);
    const res = await startGrow(db, opts.sections, opts.target);
    return { ...res, bankBefore: status.total };
  }
  const batchId = job.phase === 'writing' ? job.batchId : job.checkBatchId;
  const st = await batchEnded(batchId);
  if (!st.ended) return { phase: job.phase, progress: st.counts, next: 'Still ' + job.phase + '. Open this link again later.' };
  await ref.set({ busyUntil: Date.now() + 5 * 60 * 1000 }, { merge: true });
  try {
    return job.phase === 'writing' ? await finishWriting(db, job) : await finishChecking(db, job);
  } finally {
    await ref.set({ busyUntil: 0 }, { merge: true });
  }
}

module.exports = async (req, res) => {
  const q = req.query || {};
  if (!process.env.BANK_ADMIN_SECRET || q.secret !== process.env.BANK_ADMIN_SECRET) {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (!admin.apps.length) return res.status(500).json({ error: 'firebase not configured' });

  // ── UPLOAD MODE ── write pre-made questions straight to Firestore (no AI call).
  // POST { section, topics: [{ topic, questions: [{q,choices,correct,exp}] }], replace?: true }
  if (req.method === 'POST') {
    const body = req.body || {};
    const section = (body.section || '').toUpperCase();
    if (!SECTION_FULL[section]) return res.status(400).json({ error: 'unknown section' });
    const incoming = Array.isArray(body.topics) ? body.topics
      : (body.topic ? [{ topic: body.topic, questions: body.questions }] : []);
    if (!incoming.length) return res.status(400).json({ error: 'no topics provided' });
    const db = admin.firestore();
    const written = [];
    for (const t of incoming) {
      const qs = (t.questions || []).map(validQ).filter(Boolean);
      if (!qs.length) { written.push({ topic: t.topic, count: 0, skipped: true }); continue; }
      const slug = slugify(t.topic || ('topic-' + (written.length + 1)));
      const ref = db.collection('questionBank').doc(section).collection('topics').doc(slug);
      // Added to what's there, unless the upload says replace:true.
      const cur = body.replace ? null : await ref.get();
      const have = cur && cur.exists && Array.isArray(cur.data().questions) ? cur.data().questions : [];
      const add = dedupe(have, qs);
      const all = have.concat(add);
      await ref.set({ section, topic: t.topic, slug, questions: all, count: all.length, updatedAt: Date.now() }, { merge: true });
      written.push({ topic: t.topic, slug, added: add.length, duplicatesDropped: qs.length - add.length, count: all.length });
    }
    const qCount = await refreshMeta(db, section);
    return res.json({ ok: true, section, written, sectionTotal: qCount });
  }
  const db = admin.firestore();
  const target = Math.max(1, Math.min(parseInt(q.target, 10) || DEFAULT_TARGET, MAX_TARGET));
  const one = (q.section || '').toUpperCase();
  if (one && !TOPICS[one]) return res.status(400).json({ error: 'unknown section', valid: Object.keys(TOPICS) });

  // Read-only quality peek: return a few stored questions for review.
  if (q.peek) {
    if (!one) return res.status(400).json({ error: 'peek needs &section=' });
    const snap = await db.collection('questionBank').doc(one).collection('topics').get();
    let all = [];
    snap.forEach(d => { const dd = d.data() || {}; (dd.questions || []).forEach(x => all.push({ topic: dd.topic, ...x })); });
    const sample = all.sort(() => Math.random() - 0.5).slice(0, Math.min(parseInt(q.peek, 10) || 3, 12));
    return res.json({ section: one, total: all.length, topics: snap.size, sample });
  }

  try {
    if (q.action === 'grow') {
      if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'anthropic not configured' });
      return res.json(await growStep(db, { sections: one ? [one] : Object.keys(TOPICS), target }));
    }
    const job = (await db.doc(JOB_DOC.join('/')).get()).data() || null;
    return res.json({ ...(await bankStatus(db, target)), job: job ? { phase: job.phase, startedAt: job.startedAt, finishedAt: job.finishedAt || null, added: job.added } : null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

module.exports._test = { TOPICS, slugify, dedupe, similarity, stemWords, shuffleChoices, validQ, writePrompt, reviewPrompt, resultJSON, growStep, bankStatus, setClient: (c) => { _client = c; } };
