// Study plan built around a review course's units (Becker etc.): setup form,
// unit scheduling, check-offs re-pacing the rest, and time off moving units.
'use strict';
const test = require('node:test');
const assert0 = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('./helpers/server');
const ROOT = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'study-plan-'));
const nm = (...p) => path.join(ROOT, 'node_modules', ...p);
const CDN = [
  [/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+\.js)/, (m) => nm('firebase', m[1])],
];
function assert(c, m) { assert0.ok(c, m); }

// Every unit left appears, in order, only on study days before review starts.
const CHECK = () => {
  const plan = S.aiStudyPlan, cp = S.courseProgress[plan.primarySec];
  const today = _ymd(new Date());
  const seen = [];
  plan.days.filter((d) => d.date >= today && d.units).forEach((d) => {
    if (!d.isStudy || d.blocked || d.date >= plan.learnEnd) seen.push('BAD:' + d.date);
    d.units.forEach((u) => { if (seen[seen.length - 1] !== u) seen.push(u); });
  });
  const left = []; for (let u = 1; u <= cp.units; u++) if (!cp.done.includes(u)) left.push(u);
  return { seen, left };
};

test('study plan schedules Becker units and re-paces on check-off', { timeout: 120000 }, async () => {
  const server = await startServer();
  const base = server.url || ('http://127.0.0.1:' + server.port);
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const vp of [{ width: 1200, height: 900, name: 'desktop' }, { width: 390, height: 844, name: 'phone' }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      page.on('pageerror', (e) => errors.push(vp.name + ': ' + e.message));
      await page.route('**/*', async (route) => {
        const url = route.request().url();
        for (const [re, f] of CDN) { const m = url.match(re); if (m) return route.fulfill({ path: f(m), contentType: 'text/javascript' }); }
        if (!url.startsWith(base)) return route.abort();
        return route.continue();
      });
      await page.goto(base + '/index.html');
      await page.waitForFunction(() => typeof buildStudyPlanTab === 'function');
      await page.evaluate(() => {
        SUB.tier = 'pro'; currentTab = 'plan';
        if (!S) S = { name: 'Test', activities: [] };
        S.sections = ['FAR']; S.sectionPassed = [];
        const d = new Date(); d.setDate(d.getDate() + 70);
        S.examDates = { FAR: _ymd(d) };
        S.activities = [{ date: _ymd(new Date()), hours: 2, section: 'FAR', course: 'becker' }];
        S.aiStudyPlan = null; S.courseProgress = {};
        _planSettings = null;
        [...document.body.children].forEach((c) => { if (c.tagName !== 'SCRIPT' && c.id !== 'toast-wrap') c.style.display = 'none'; });
        const old = document.getElementById('page-content'); if (old) old.id = 'old-page-content';
        const pc = document.createElement('main'); pc.id = 'page-content'; pc.style.cssText = 'padding:16px;display:block';
        document.body.appendChild(pc);
        window.renderTab = () => { pc.innerHTML = buildStudyPlanTab(); };
        renderTab();
      });

      // Setup: Becker is preselected from tagged sessions.
      assert(await page.isVisible('button[aria-pressed="true"]:has-text("Becker")'), 'Becker preselected from sessions');
      await page.fill('#plan-units', '10');
      await page.fill('#plan-units-done', '2');
      if (vp.name === 'phone') await page.screenshot({ path: path.join(OUT, 'setup-phone.png'), fullPage: true });
      await page.click('button:has-text("Build My Study Plan")');
      await page.waitForFunction(() => S.aiStudyPlan && !_planGenerating, null, { timeout: 8000 });

      let r = await page.evaluate(CHECK);
      assert0.deepEqual(r.seen, r.left, 'units 3–10 scheduled in order before review');
      assert0.deepEqual(r.left, [3, 4, 5, 6, 7, 8, 9, 10]);
      const plan = await page.evaluate(() => ({ phases: S.aiStudyPlan.phases.map((p) => p.name), learnEnd: S.aiStudyPlan.learnEnd, exam: S.aiStudyPlan.examDate }));
      assert(plan.phases[0].includes('Becker units') && plan.phases[1].includes('Final Review'), 'course then review phases');
      assert(plan.learnEnd < plan.exam, 'review starts before the exam');
      const txt = await page.textContent('#page-content');
      assert(/Becker FAR/.test(txt) && /2\/10 units/.test(txt), 'progress card shown');
      assert(/This week: Unit/.test(txt), 'this week line shown');
      assert(/Becker Unit 3/.test(txt), 'today names the unit');
      if (vp.name === 'desktop') await page.screenshot({ path: path.join(OUT, 'plan-desktop.png'), fullPage: true });
      else await page.screenshot({ path: path.join(OUT, 'plan-phone.png'), fullPage: true });

      // Finish unit 3 from today's panel: today moves on to unit 4.
      await page.click('button:has-text("Finished Unit 3")');
      r = await page.evaluate(CHECK);
      assert0.deepEqual(r.seen, r.left, 'still in order after check-off');
      assert(!r.left.includes(3), 'unit 3 done');
      assert(await page.evaluate(() => S.aiStudyPlan.days.find((d) => d.date === _ymd(new Date())).units[0] === 4), 'today now unit 4');

      // Finish an out-of-order unit from the grid.
      await page.click('button[aria-label="Unit 7"]');
      r = await page.evaluate(CHECK);
      assert0.deepEqual(r.seen, r.left, 'skips unit 7 once finished');

      // Two weeks off: units still all fit, none on blocked days.
      await page.evaluate(() => {
        const a = new Date(); a.setDate(a.getDate() + 3); const b = new Date(); b.setDate(b.getDate() + 16);
        S.aiStudyPlan.timeOff.push({ id: 't1', start: _ymd(a), end: _ymd(b), label: 'Trip' });
        rebalanceStudyPlan(); renderTab();
      });
      r = await page.evaluate(CHECK);
      assert0.deepEqual(r.seen, r.left, 'time off moves units to open days');

      // Rebuild keeps check-offs.
      await page.evaluate(() => regeneratePlan());
      assert0.equal(await page.inputValue('#plan-units-done'), '4', 'finished count carried into setup');
      await page.click('button:has-text("Build My Study Plan")');
      await page.waitForFunction(() => S.aiStudyPlan && !_planGenerating, null, { timeout: 8000 });
      assert0.deepEqual(await page.evaluate(() => S.courseProgress.FAR.done), [1, 2, 3, 7], 'rebuild keeps exact check-offs');
      r = await page.evaluate(CHECK);
      assert0.deepEqual(r.seen, r.left, 'rebuilt plan schedules what is left');

      // No course: falls back to the study-type phases.
      await page.evaluate(() => regeneratePlan());
      await page.click('button:has-text("None")');
      await page.click('button:has-text("Build My Study Plan")');
      await page.waitForFunction(() => S.aiStudyPlan && !_planGenerating, null, { timeout: 8000 });
      const noCourse = await page.evaluate(() => ({ learnEnd: S.aiStudyPlan.learnEnd || null, any: S.aiStudyPlan.days.some((d) => d.units), phase: S.aiStudyPlan.phases[0].name, kept: S.courseProgress.FAR.units }));
      assert(!noCourse.learnEnd && !noCourse.any && noCourse.phase.includes('Foundation'), 'no course: regular phases');
      assert0.equal(noCourse.kept, 10, 'units kept for when a course is picked again');

      await ctx.close();
    }
    assert0.deepEqual(errors, [], 'no page errors');
    console.log('screenshots in', OUT);
  } finally {
    await browser.close();
    await server.close();
  }
});
