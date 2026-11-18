// The questions that ship with the app (qbank/). Every source file must be
// valid, and the built files the app downloads must match the sources.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { build } = require('../scripts/build-qbank.js');

const ROOT = path.join(__dirname, '..', 'qbank');

test('every shipped question file is valid and the built files are current', () => {
  if (!fs.existsSync(path.join(ROOT, 'src'))) return;
  const { problems, report, built } = build(ROOT, { write: false });
  assert.equal(problems, 0, 'every source file parses');
  for (const [k, v] of Object.entries(report)) assert.equal(v.invalid, 0, k + ' has invalid questions');
  for (const [section, out] of Object.entries(built)) {
    const file = path.join(ROOT, section + '.json');
    assert.ok(fs.existsSync(file), section + '.json is built (run node scripts/build-qbank.js)');
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), out, section + '.json is out of date (run node scripts/build-qbank.js)');
    for (const t of out.topics) for (const q of t.questions) {
      assert.equal(q.choices.length, 4);
      assert.ok(q.correct >= 0 && q.correct <= 3);
    }
  }
});

test('the build drops bad and duplicate questions and keeps the right answer after shuffling', () => {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'qbank-'));
  fs.mkdirSync(path.join(tmp, 'src', 'FAR'), { recursive: true });
  const good = (q, right) => ({ q, choices: ['w ' + right, right, 'y ' + right, 'z ' + right], correct: 1, exp: right + ' is correct.' });
  fs.writeFileSync(path.join(tmp, 'src', 'FAR', 'leases-asc-842.json'), JSON.stringify([
    good('A lessee signs a five year lease of equipment with annual payments; how is the liability measured at commencement?', 'present value'),
    good('A lessee signs a five year lease of equipment with annual payments; how is the liability measured at commencement?', 'again'),
    { q: 'Only three choices here?', choices: ['a', 'b', 'c'], correct: 0, exp: 'x' },
    good('Which party bears residual value risk in a sales-type lease once the asset is derecognized by the lessor?', 'lessee'),
  ]));
  const { built, report } = build(tmp, { write: true });
  const t = built.FAR.topics[0];
  assert.equal(t.topic, 'Leases (ASC 842)');
  assert.equal(t.questions.length, 2);
  assert.deepEqual(report['FAR/leases-asc-842'], { kept: 2, invalid: 1, duplicates: 1 });
  assert.equal(t.questions[0].choices[t.questions[0].correct], 'present value');
  assert.equal(t.questions[1].choices[t.questions[1].correct], 'lessee');
  assert.ok(fs.existsSync(path.join(tmp, 'FAR.json')));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('question counts shown in the app and on the landing page match the shipped bank', () => {
  const sections = ['FAR', 'AUD', 'REG', 'TCP', 'BAR', 'ISC'];
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  let total = 0;
  for (const s of sections) {
    const file = path.join(ROOT, s + '.json');
    if (!fs.existsSync(file)) return;
    const n = JSON.parse(fs.readFileSync(file, 'utf8')).topics.reduce((a, t) => a + t.questions.length, 0);
    total += n;
    const m = html.match(new RegExp("\\{code:'" + s + "',[^}]*mcqTotal:(\\d+)\\}"));
    assert.ok(m, s + ' has an mcqTotal');
    assert.equal(Number(m[1]), n, s + ' mcqTotal in index.html matches qbank/' + s + '.json');
  }
  const landing = fs.readFileSync(path.join(__dirname, '..', 'landing.html'), 'utf8');
  const claim = landing.match(/([\d,]+)\+ questions/);
  assert.ok(claim, 'landing page states a question count');
  const claimed = Number(claim[1].replace(/,/g, ''));
  assert.ok(claimed <= total, `landing claims ${claimed}+ but only ${total} ship`);
  assert.ok(claimed >= total - 1000, `landing claims ${claimed}+ but ${total} ship — raise the number`);
});
