// ─────────────────────────────────────────────────────────────────────────────
// Ledger — One-time Question Bank generator  /api/generate-bank
//
// "Generate once, cache forever." Produces the full practice-question bank with
// Claude (Sonnet) and stores it in Firestore. After this runs, serving questions
// to any user is just a database read — zero AI cost per request.
//
// Bank layout in Firestore:
//   questionBank/{SECTION}                       ← meta doc {section, topics[], questionCount, updatedAt}
//   questionBank/{SECTION}/topics/{slug}         ← {section, topic, slug, questions:[{q,choices,correct,exp}], count, model, generatedAt}
//
// Trigger (admin only — guarded by BANK_ADMIN_SECRET), chunked to stay under the
// function timeout. Run each section in two halves:
//   curl -s "https://ledgercpa.app/api/generate-bank?secret=XXX&section=FAR&from=0&count=10"
//   curl -s "https://ledgercpa.app/api/generate-bank?secret=XXX&section=FAR&from=10&count=10"
//   ...repeat for AUD, REG, TCP, BAR, ISC
//
// Env vars (already set in Vercel): ANTHROPIC_API_KEY, FIREBASE_SERVICE_ACCOUNT
// New env var to add:               BANK_ADMIN_SECRET
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');

if (!admin.apps.length) {
  let serviceAccount;
  try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'); } catch (e) {}
  if (serviceAccount && serviceAccount.project_id) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

const GEN_MODEL = 'claude-sonnet-4-6';
const PER_TOPIC = 20; // questions per topic

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

async function genTopic(section, topic, perTopic){
  const full=SECTION_FULL[section]||section;
  const n=perTopic||PER_TOPIC;
  const prompt='Generate exactly '+n+' multiple-choice questions for the CPA exam section '+section+' ('+full+'), '
    + 'all focused on this topic: '+topic+'. '
    + 'Each question must be exam-realistic and test genuine conceptual understanding or a calculation, with exactly 4 answer choices and one unambiguously correct answer. '
    + 'Cover a range of subtopics and difficulty within the topic; do not repeat questions. '
    + 'Return ONLY a JSON array (no prose, no markdown fences). Each element is an object with keys: '
    + '"q" (question text), "choices" (array of exactly 4 strings), "correct" (integer 0-3 index of the correct choice), '
    + '"exp" (a concise 1-2 sentence explanation citing the relevant standard/rule when applicable).';
  const resp=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
    body:JSON.stringify({ model:GEN_MODEL, max_tokens:8000, system:'You are an expert CPA exam item writer. You produce accurate, exam-aligned multiple-choice questions.', messages:[{role:'user',content:prompt}] }),
  });
  if(!resp.ok){ const e=await resp.json().catch(()=>({})); throw new Error('anthropic '+resp.status+' '+(e?.error?.message||'')); }
  const data=await resp.json();
  const text=data.content?.[0]?.text||'';
  const m=text.match(/\[[\s\S]*\]/);
  let arr=[]; try{ arr=JSON.parse(m?m[0]:text); }catch(e){ throw new Error('parse failed'); }
  return arr.map(normQ).filter(Boolean);
}

module.exports = async (req, res) => {
  const q = req.query || {};
  if (!process.env.BANK_ADMIN_SECRET || q.secret !== process.env.BANK_ADMIN_SECRET) {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (!admin.apps.length) return res.status(500).json({ error: 'firebase not configured' });

  // ── UPLOAD MODE ── write pre-made questions straight to Firestore (no AI call).
  // POST { section, topics: [{ topic, questions: [{q,choices,correct,exp}] }] }
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
      const qs = (t.questions || []).map(normQ).filter(Boolean);
      if (!qs.length) { written.push({ topic: t.topic, count: 0, skipped: true }); continue; }
      const slug = slugify(t.topic || ('topic-' + (written.length + 1)));
      await db.collection('questionBank').doc(section).collection('topics').doc(slug).set({
        section, topic: t.topic, slug, questions: qs, count: qs.length, model: 'manual', generatedAt: Date.now(),
      });
      written.push({ topic: t.topic, slug, count: qs.length });
    }
    const snap = await db.collection('questionBank').doc(section).collection('topics').get();
    let qCount = 0; const topicSlugs = [];
    snap.forEach(d => { const dd = d.data(); qCount += (dd.count || 0); topicSlugs.push(dd.slug || d.id); });
    await db.collection('questionBank').doc(section).set({
      section, full: SECTION_FULL[section], topics: topicSlugs, topicCount: topicSlugs.length,
      questionCount: qCount, updatedAt: Date.now(),
    }, { merge: true });
    return res.json({ ok: true, section, written, sectionTotal: qCount });
  }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'anthropic not configured' });

  const section = (q.section || '').toUpperCase();
  if (!TOPICS[section]) return res.status(400).json({ error: 'unknown section', valid: Object.keys(TOPICS) });

  // Read-only quality peek: return a few stored questions for review.
  if (q.peek) {
    if (!admin.apps.length) return res.status(500).json({ error: 'firebase not configured' });
    const snap = await admin.firestore().collection('questionBank').doc(section).collection('topics').get();
    let all = [];
    snap.forEach(d => { const dd = d.data() || {}; (dd.questions || []).forEach(x => all.push({ topic: dd.topic, ...x })); });
    const sample = all.sort(() => Math.random() - 0.5).slice(0, Math.min(parseInt(q.peek, 10) || 3, 12));
    return res.json({ section, total: all.length, topics: snap.size, sample });
  }

  const from = Math.max(0, parseInt(q.from, 10) || 0);
  const count = Math.max(1, Math.min(parseInt(q.count, 10) || 10, 20));
  const perTopic = Math.max(5, Math.min(parseInt(q.perTopic, 10) || PER_TOPIC, 25));
  const topics = TOPICS[section].slice(from, from + count);

  const db = admin.firestore();
  const done = [];
  let totalQ = 0;
  const CONCURRENCY = 4; // generate several topics in parallel to fit the function timeout
  try {
    for (let i = 0; i < topics.length; i += CONCURRENCY) {
      const batch = topics.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(async (topic) => {
        try { return { topic, questions: await genTopic(section, topic, perTopic) }; }
        catch (e) { return { topic, error: e.message }; }
      }));
      for (const r of results) {
        if (r.error || !r.questions || !r.questions.length) { done.push({ topic: r.topic, count: 0, skipped: true, error: r.error }); continue; }
        const slug = slugify(r.topic);
        await db.collection('questionBank').doc(section).collection('topics').doc(slug).set({
          section, topic: r.topic, slug, questions: r.questions, count: r.questions.length, model: GEN_MODEL, generatedAt: Date.now(),
        });
        totalQ += r.questions.length;
        done.push({ topic: r.topic, slug, count: r.questions.length });
      }
    }

    // Refresh the section meta doc from whatever topics now exist.
    const snap = await db.collection('questionBank').doc(section).collection('topics').get();
    let qCount = 0; const topicSlugs = [];
    snap.forEach(d => { const dd = d.data(); qCount += (dd.count || 0); topicSlugs.push(dd.slug || d.id); });
    await db.collection('questionBank').doc(section).set({
      section, full: SECTION_FULL[section], topics: topicSlugs, topicCount: topicSlugs.length,
      questionCount: qCount, model: GEN_MODEL, updatedAt: Date.now(),
    }, { merge: true });

    return res.json({ ok: true, section, from, generatedTopics: done.length, generatedQuestions: totalQ, sectionTotal: qCount, done });
  } catch (e) {
    return res.status(500).json({ error: e.message, completed: done });
  }
};
