// AI Study Tools (flashcards, quiz, summary, PDF import) driven in a real
// browser against a mocked /api/ask: escaping, malformed AI replies, retries,
// friendly errors, deck saving, PDF text extraction and the phone layout.
'use strict';
const test = require('node:test');
const assert0 = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('./helpers/server');
const ROOT = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'study-tools-'));
const nm = (...p) => path.join(ROOT, 'node_modules', ...p);
const CDN = [
  [/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+\.js)/, (m) => nm('firebase', m[1])],
];
let replies = [];
const asks = [];
function assert(c, m) { assert0.ok(c, m); }

test('AI study tools: flashcards, quiz, summary and PDF import', { timeout: 120000 }, async () => {
  const server = await startServer();
  const base = server.url || ('http://127.0.0.1:' + server.port);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    for (const [re, f] of CDN) { const m = url.match(re); if (m) return route.fulfill({ path: f(m), contentType: 'text/javascript' }); }
    if (url.includes('/api/ask')) {
      asks.push(JSON.parse(route.request().postData()));
      const r = replies.shift() || { status: 500, body: { error: 'no mock' } };
      if (r.delay) await new Promise((res) => setTimeout(res, r.delay));
      return route.fulfill({ status: r.status || 200, contentType: 'application/json', body: JSON.stringify(r.body) });
    }
    if (!url.startsWith(base)) return route.abort();
    return route.continue();
  });
  await page.goto(base + '/index.html');
  await page.waitForFunction(() => typeof buildStudyLab === 'function');

  const show = async () => page.evaluate(() => {
    SUB.tier = 'pro'; currentTab = 'studylab'; _subTab.studylab = 'tools';
    let pc = document.getElementById('page-content');
    if (!pc || !pc.offsetParent) {
      [...document.body.children].forEach((c) => { if (c.tagName !== 'SCRIPT' && c.id !== 'toast-wrap') c.style.display = 'none'; });
      if (pc) pc.id = 'old-page-content';
      pc = document.createElement('main'); pc.id = 'page-content'; pc.style.cssText = 'padding:16px;display:block';
      document.body.appendChild(pc);
    }
    pc.innerHTML = buildStudyLab();
  });
  await show();
  const material = `Revenue recognition under ASC 606 follows five steps. 1) Identify the contract. 2) Identify performance obligations. 3) Determine the transaction price. 4) Allocate the price to obligations based on standalone selling prices. 5) Recognize revenue when (or as) obligations are satisfied. Variable consideration is constrained so that it is probable a significant reversal will not occur. x < y & <b>tags</b> must not render.`;

  // 1. Too-short input
  await page.fill('#fc-input-text', 'short');
  await page.click('button:has-text("Flashcards")');
  assert(asks.length === 0, 'short input does not call the AI');

  // 2. Flashcards: fenced JSON w/ HTML in content
  await page.fill('#fc-input-text', material);
  replies.push({ delay: 400, body: { text: '```json\n[{"q":"What is step 1 of ASC 606 <script>?","a":"Identify the contract."},{"q":"What constrains variable consideration?","a":"It is included only if a significant reversal is not probable."},{"q":"What is step 1 of ASC 606 <script>?","a":"dupe"}]\n```' } });
  await page.click('button:has-text("Flashcards")');
  await page.waitForSelector('#fc-gen-status');
  assert(await page.isDisabled('button:has-text("Quiz")'), 'buttons disabled while generating');
    await page.waitForSelector('text=Tap to reveal');
  const front = await page.textContent('.fc-grid');
  assert(front.includes('What is step 1 of ASC 606 <script>?'), 'card HTML is shown as text, not markup');
  assert(front.includes('1 / 2'), 'duplicate card removed (2 cards)');
  assert(asks[0].messages[0].content.includes('Revenue recognition'), 'material sent to AI');
  await page.click('button:has-text("Reveal Answer")');
  await page.waitForSelector('text=Got it');
  await page.click('body', { position: { x: 5, y: 5 } });
  await page.keyboard.press('3');
  assert(await page.evaluate(() => _fc.current === 1 && _fc.cards[0].timesCorrect === 1), 'key 3 grades card as known');
  await page.waitForTimeout(800);
  const before = await page.evaluate(() => (window._sp = document.getElementById('subpanel-studylab'), 1));
  await page.keyboard.press('Space');
  assert(await page.evaluate(() => _fc.flipped), 'space flips card');
  assert(await page.evaluate(() => window._sp === document.getElementById('subpanel-studylab')), 'panel element kept across redraw');
  const anim = await page.evaluate(() => document.getElementById('subpanel-studylab').getAnimations().filter((a) => a.playState === 'running').length);
  assert(anim === 0, 'panel fade does not replay on flip');

  // 3. Quiz: truncated JSON + letter prefixes + bad item
  replies.push({ body: { text: 'Here you go:\n[{"q":"Which step allocates price?","choices":["A. Step 2","B. Step 4","C. Step 5","D. Step 3"],"correct":1,"exp":"Allocation is step 4."},{"q":"bad","choices":["a","b"],"correct":0},{"q":"Variable consideration is included when?","choices":["Always","Never","When a significant reversal is not probable","When cash is received"],"correct":2,"exp":"Constraint."},{"q":"Cut off mid-ques' } });
  await page.click('button:has-text("Quiz")');
  await page.waitForSelector('text=Practice Quiz');
  let qtext = await page.textContent('.fc-grid');
  assert(qtext.includes('Question 1 of 2'), 'salvaged 2 valid questions from truncated reply');
  assert(!/A\.\s*A\./.test(qtext) && !qtext.includes('A. Step') , 'letter prefixes stripped from choices');
  // answer wrong on purpose: pick a choice that is not the correct one
  const correctIdx = await page.evaluate(() => _fc.quizQ[0].correct);
  await page.click(`[role=radio] >> nth=${(correctIdx + 1) % 4}`);
  await page.click('button:has-text("Submit Answer")');
  await page.waitForSelector('text=Explanation:');
  await page.click('button:has-text("Next Question")');
  const c2 = await page.evaluate(() => _fc.quizQ[1].correct);
  await page.click(`[role=radio] >> nth=${c2}`);
  await page.click('button:has-text("Submit Answer")');
  await page.click('button:has-text("See Results")');
  await page.waitForSelector('text=Review what you missed');
  assert((await page.textContent('.fc-grid')).includes('1 of 2 correct'), 'score shown');

  // 4. Summary markdown
  replies.push({ body: { text: '## Key Concepts\n- **Five steps** of ASC 606\n- Contract must have *commercial substance*\n\n## Quick Reference\n1. Step one\n2. Step two\n\n## Common Exam Traps\n- Price < SSP is not a trap <img src=x onerror=alert(1)>' } });
  await page.click('button:has-text("Summary")');
  await page.waitForSelector('.fc-md h4');
  const imgs = await page.$$eval('.fc-md img', (x) => x.length);
  assert(imgs === 0, 'summary HTML escaped');
  const heads = await page.$$eval('.fc-md h4', (x) => x.map((h) => h.textContent));
  assert(heads.join('|') === 'Key Concepts|Quick Reference|Common Exam Traps', 'summary headings rendered');
  assert((await page.$$eval('.fc-md strong', (x) => x.length)) === 1, 'bold rendered');
  assert((await page.$$('button[aria-pressed]')).length === 3, 'output switcher shows 3 outputs');

  // 5. Error path: 500 then retry succeeds
  replies.push({ status: 500, body: {} });
  await page.click('button:has-text("Flashcards")');
  await page.waitForSelector('[role=alert]');
  const alertText = await page.textContent('[role=alert]');
  assert(/busy/i.test(alertText), 'friendly error shown: ' + alertText.trim());
  replies.push({ body: { text: 'Sorry, I cannot.' } }, { body: { text: '[{"q":"Retry card?","a":"Yes"}]' } });
  await page.click('button:has-text("Try again")');
  await page.waitForSelector('text=Retry card?');
  assert(true, 'unparseable reply retried once automatically, then succeeded');

  // 6. Rate limit message passes through
  replies.push({ status: 429, body: { error: 'Rate limit reached — you can ask 30 questions per hour.' } });
  await page.click('button:has-text("Summary")');
  await page.waitForSelector('[role=alert]');
  assert((await page.textContent('[role=alert]')).includes('30 questions per hour'), 'server limit message shown');

  // 7. Save deck
  await page.click('button[aria-pressed]:has-text("Flashcards")');
  await page.fill('#fc-save-name', 'FAR — 606');
  await page.click('button:has-text("Save →")');
  await page.waitForSelector('text=progress saves automatically');
  assert(true, 'deck saved');

  // 8. PDF import with a generated text PDF
  const pdfPage = await ctx.newPage();
  await pdfPage.setContent('<h1>Leases</h1><p>' + 'A lessee recognizes a right-of-use asset and a lease liability for leases longer than 12 months. '.repeat(20) + '</p>');
  const pdfPath = OUT + '/sample.pdf';
  await pdfPage.pdf({ path: pdfPath });
  await pdfPage.close();
  await page.click('button:has-text("Clear")');
  await page.setInputFiles('#fc-pdf-input', pdfPath);
  await page.waitForFunction(() => /Loaded|Could not|scanned/.test(document.getElementById('fc-pdf-status').textContent), null, { timeout: 15000 });
  const pdfStatus = await page.textContent('#fc-pdf-status');
  assert(/Loaded sample\.pdf/.test(pdfStatus), 'PDF loaded: ' + pdfStatus.trim());
  const val = await page.inputValue('#fc-input-text');
  assert(val.includes('right-of-use asset'), 'PDF text extracted into the box');
  assert(/characters/.test(await page.textContent('#fc-char-count')), 'char counter shown');

  // 9. Mobile layout
  await page.setViewportSize({ width: 390, height: 844 });
  await show();
  const cols = await page.$eval('.fc-grid', (e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
  assert(cols === 1, 'single column on phone');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, 'no horizontal scroll on phone');

  assert0.deepEqual(errors, [], 'no page errors');
  await browser.close();
  await server.close();
});
