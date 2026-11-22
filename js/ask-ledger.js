// ═══════════════════════════════════════════════
// ASK LEDGER
// ═══════════════════════════════════════════════
const _coachResponses = [
  // Section overviews
  {k:['far','financial accounting','governmental','gasb','nonprofit','asc 842','asc 606','lease','revenue recogni'],r:'FAR has the lowest pass rate (~43%) for a reason — breadth. The three areas candidates most underestimate: (1) Governmental accounting: GASB fund accounting, modified accrual basis, government-wide statements under GASB 34. Budget 30% of your FAR time here alone. (2) ASC 842 leases: know how to classify and measure both lessee and lessor leases, and the ROU asset/lease liability entries cold. (3) ASC 606 revenue: the 5-step model isn\'t just conceptual — they test contract modifications, variable consideration, and principal vs. agent. Budget 170+ hours total.'},
  {k:['aud','audit','attestation','pcaob','internal control','risk assessment','au-c','ssars','ssae'],r:'AUD tests whether you think like an auditor, not an accountant. The #1 distinction: auditors verify independently — any answer choice saying "discuss with management" is almost always wrong. Master three pillars: (1) AU-C 315 risk assessment — understand how IR, CR, and DR interact in the audit risk model (AR = IR × CR × DR). (2) Report types — unmodified (AU-C 700), qualified/adverse/disclaimer (AU-C 705), emphasis-of-matter (AU-C 706). Know what triggers each. (3) SSARS vs. SSAE — compilations require no independence, reviews require limited assurance, examinations (SSAE) require reasonable assurance.'},
  {k:['reg','regulation','tax','irs','partnership','s-corp','c-corp','entity','basis','built-in gain'],r:'REG is 60% federal tax, 40% business law. The highest-tested, most-failed area: entity taxation. Build a comparison chart of C-corp, S-corp, and partnership on these dimensions: formation rules, basis rules, distribution rules, loss limitations, and SE tax treatment. For partnerships: know §704(b) substantial economic effect and the difference between inside and outside basis cold — they test basis computations constantly. For S-corps: AAA account, built-in gains tax (§1374), and the order of basis adjustments. Budget 110–120 hours.'},
  {k:['tcp','tax compliance','tax planning','199a','qbid','gilti','international','1031','like-kind'],r:'TCP goes deeper than REG on planning strategy. The highest-weighted areas: (1) §199A qualified business income deduction — know the W-2 wage limitation, UBIA property cap, and SSTB exclusions. (2) Like-kind exchanges under §1031 — what qualifies, boot recognition, and basis in replacement property. (3) International tax: GILTI (§951A), FDII, BEAT, and subpart F are all tested. You don\'t need to memorize every rate, but you need to know what triggers each regime and how they interact. Candidates who passed REG strongly have a real advantage here. Budget 110+ hours.'},
  {k:['bar','business analysis','reporting','analytics','variance','cvp','capital budget','npv','wacc'],r:'BAR combines financial reporting depth with managerial accounting and analysis. Candidates who passed FAR underestimate the analytics component. Focus on: (1) Variance analysis — be able to compute materials (price + efficiency), labor (rate + efficiency), and overhead (spending + volume) variances and explain what each means. (2) Capital budgeting — NPV, IRR, payback, and WACC computation. Know the difference between IRR and MIRR. (3) Ratio analysis — DuPont decomposition, CCC (cash conversion cycle), and what each ratio actually signals about a business. Budget 140+ hours.'},
  {k:['isc','information systems','controls','soc','cybersecurity','it audit','cobit','coso'],r:'ISC has more MCQs than any other section (82). The #1 failure cause: underestimating SOC reports. Know this cold: SOC 1 (SSAE 18) covers controls at a service organization relevant to user entity financial reporting. SOC 2 covers the Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy). Type I is at a point in time; Type II covers an operating period. The CIA triad (Confidentiality, Integrity, Availability) underpins every cybersecurity question. For IT controls: know the difference between general IT controls (GITCs) and application controls, and how each affects the audit approach.'},
  // Exam mechanics
  {k:['score','pass rate','75','scaled','how is it scored','adaptive','mst'],r:'A 75 is a scaled score — not a percentage of questions correct. The CPA exam uses Multistage Adaptive Testing (MST): testlet 1 is medium difficulty; your performance determines whether testlet 2 is harder or easier. A harder testlet 2 is a good sign — harder questions carry more scoring weight. The strongest pass predictor: consistently scoring 70%+ on practice MCQs for 2+ weeks before your exam. Focus relentlessly on wrong answers — understanding why you missed a question is worth more than reviewing material you already know.'},
  {k:['mcq','multiple choice','testlet','strategy','test taking','process of elimination'],r:'MCQ execution: 90 seconds maximum per question — if you\'re stuck, make your best guess, flag it, and move on. Never change an answer unless you have a specific reason. Eliminate the two obviously wrong answers first (they\'re always there), then reason between the remaining two. On AUD: any answer involving "discuss with management" is almost always wrong — auditors verify independently. On FAR: if a question mentions governmental accounting and gives a GAAP answer, it\'s probably wrong. If testlet 2 gets noticeably harder, you\'re doing well — do not panic.'},
  {k:['tbs','task-based','simulation','research','fasb codification','codification'],r:'TBSs are worth 50% of your score on most sections (60% for ISC) and they\'re where passing candidates separate themselves. Every TBS has a Research tab — practice it. For FAR: navigate FASB Codification at codification.fasb.org. For REG: use the IRC search at uscode.house.gov. For AUD: PCAOB standards at pcaobus.org. Speed in the research tool is a learnable skill, not luck. In document review TBSs, read the requirement first, then the documents — not the other way around. Never leave a TBS blank.'},
  {k:['nts','notice to schedule','schedule exam','prometric','window','exam date','when should i'],r:'Your NTS (Notice to Schedule) is valid for 12 months from the issue date in most states — don\'t let it expire. Schedule your exam at Prometric before you feel ready: research consistently shows candidates who schedule first and work toward a deadline pass at higher rates than those who study indefinitely. For most sections, 6–8 weeks of focused, daily study (practice MCQs every day, not just reading) is the optimal window. Schedule, then study hard to the date.'},
  // Study strategy
  {k:['behind','pace','slow','falling behind','not enough time','catching up'],r:'Recovery strategy: two focused sessions per day — 90 minutes in the morning for new material, 90 minutes in the evening for MCQ review only. No exceptions, no marathon days to "make up" for lost time — they burn you out and retention drops. Identify your 3 weakest topic areas right now and allocate the first 30 minutes of every morning session to those specifically. The candidates who recover from being behind don\'t study more hours — they study smarter and stop wasting time on things they already know.'},
  {k:['streak','motivation','discipline','consistency','habit','routine'],r:'The candidates who pass aren\'t the ones who grind 12-hour days — they\'re the ones who showed up every single day for 6-8 weeks. Consistency compounds: a 70-day streak of 2-hour sessions (140 hours) beats ten 14-hour marathon weeks with gaps between them, every time. Your streak in Ledger is a real asset. Protect it. Two studies published in cognitive science journals found that daily, shorter practice sessions improve exam performance 40% more than equivalent time in longer, less frequent sessions. The neural pathway you build by studying every day is the actual skill.'},
  {k:['tired','burnout','exhausted','overwhelmed','stressed','anxiety','anxious','mental'],r:'Burnout ends more CPA journeys than failure does. Three rules: (1) One completely study-free day per week — non-negotiable. Your brain consolidates learning during rest, not during study. (2) Every 4th week, cut your hours by 50% (a deload week). (3) Sleep is more valuable than an extra study hour — 8 hours of sleep before your exam is a better investment than a final 2-hour cram session. If you\'re feeling overwhelmed right now, step back and look at how far you\'ve come. Log your session today — even 30 minutes. Momentum beats motivation.'},
  {k:['exam day','day of exam','morning of','test day','what should i do'],r:'Exam day execution: (1) Eat a real breakfast — protein and complex carbs, nothing that spikes and crashes your blood sugar. (2) Arrive 30 minutes early to Prometric — early check-in means more total time. (3) You get a laminated scratch sheet — use it immediately for any formulas, mnemonics, or frameworks you\'ve memorized. (4) First testlet: pace yourself, don\'t rush. (5) If testlet 2 gets harder, smile — that\'s the adaptive system telling you you\'re doing well. (6) Flag hard MCQs and keep moving. Never leave anything blank — a guess is better than nothing. (7) On TBSs: read the requirement tab first, then the documents.'},
  // Specific accounting concepts
  {k:['revenue recognition','asc 606','five step','performance obligation','variable consideration'],r:'ASC 606 five-step model: (1) Identify the contract — must have commercial substance, approved by both parties, and collectibility probable. (2) Identify performance obligations — each distinct good or service. "Distinct" = capable of being standalone AND separately identifiable. (3) Determine transaction price — including variable consideration (estimate using expected value or most likely amount, constrained to amount not probable of significant reversal). (4) Allocate price — relative standalone selling price basis; residual approach only when SSP is highly variable. (5) Recognize revenue when (or as) each obligation is satisfied. At a point in time vs. over time: over time if customer simultaneously receives/consumes benefit, asset has no alternative use + right to payment, or entity creates/enhances customer-controlled asset.'},
  {k:['lease','asc 842','right of use','rou','finance lease','operating lease','lessee','lessor'],r:'ASC 842 lessee classification: Finance lease if (1) title transfers, (2) purchase option reasonably certain to exercise, (3) lease term = major part of useful life (≥75% bright-line), (4) PV of payments = substantially all fair value (≥90% bright-line), or (5) specialized asset with no alternative use. All else = operating lease. Both types require recognizing a ROU asset and lease liability at commencement. Finance: front-loaded expense (amortization + interest separate). Operating: straight-line total expense. Lessor: sales-type (dealer profit + interest income), direct financing (interest income only), or operating (rental income). Short-term exemption: lease term ≤ 12 months, no ROU asset required.'},
  {k:['deferred tax','asc 740','temporary difference','permanent difference','dtl','dta','valuation allowance'],r:'ASC 740: Deferred tax assets (DTAs) arise from deductible temporary differences — you\'ll pay less tax later (e.g., warranty expense recognized for GAAP before deductible for tax). Deferred tax liabilities (DTLs) arise from taxable temporary differences — you\'ll pay more tax later (e.g., accelerated MACRS depreciation for tax, straight-line for GAAP). Permanent differences never reverse — they never create deferred taxes (e.g., municipal bond interest, penalties, 50% meals). Valuation allowance required if it\'s more likely than not (>50%) that some or all of a DTA won\'t be realized. Uncertain tax positions under ASC 740-10: recognize only if more-likely-than-not that position will be sustained; measure at largest amount with >50% cumulative probability.'},
  {k:['goodwill','impairment','asc 350','intangible','business combination','asc 805'],r:'Under ASC 805, goodwill = acquisition price − fair value of net identifiable assets acquired. Goodwill is not amortized (public companies) — it\'s tested for impairment annually (or when triggering events occur) under ASC 350. The simplified impairment test (post-2017): if carrying value of reporting unit > fair value, impairment loss = the excess (capped at carrying value of goodwill). Private companies can elect to amortize goodwill over 10 years. Identifiable intangibles: recognized separately if they arise from contractual/legal rights OR are separable. Customer lists, trade names, patents, non-competes all qualify. In-process R&D is capitalized at acquisition but subsequently tested for impairment.'},
  {k:['partnership basis','inside basis','outside basis','704','754','743','hot asset','751'],r:'Outside basis (§722): partner\'s basis in their partnership interest — starts at FMV of contributed property (or basis if §721 applies), adjusted for income allocations, additional contributions, and distributions. Inside basis: partnership\'s basis in its assets. The two diverge when a partner buys into a partnership at FMV that differs from existing inside basis. §754 election: allows the partnership to adjust inside basis (§743(b) on transfer of partnership interest; §734(b) on distributions) to eliminate this disparity. Hot assets (§751): unrealized receivables and substantially appreciated inventory — distributions/sales of these trigger ordinary income even if the partner would otherwise have capital gain. Know this for REG: §751 prevents capital gain conversion.'},
  {k:['cpa license','150 hours','experience','state board','nasba','how to become','licensure','requirements'],r:'CPA licensure requirements: (1) Education: 150 semester hours with a concentration in accounting (varies by state — most require 24–30 hours in accounting + 24 in business). (2) Exam: Pass all 4 sections within the 30-month window (18 months in some states). Score of 75+ on each section. (3) Experience: 1–2 years of accounting experience (varies by state) under a licensed CPA — public accounting, industry, government, or nonprofit generally all qualify. (4) Ethics: most states require passing an ethics exam (AICPA ethics course, or state-specific). Apply through your state board — NASBA handles score transfers between states. The 18-month exam window starts when your first section is passed.'},
  {k:['becker','gleim','wiley','roger','study material','review course','which is better'],r:'All four major review courses (Becker, Roger/UWorld, Gleim, Wiley/CPAExcel) cover the content you need to pass. The difference is pedagogy: Becker is structured and comprehensive — good if you want hand-holding and video lectures. Gleim has the largest MCQ bank (~10,000 questions) — best for pure drilling. Roger/UWorld is known for engaging video instruction and is strong for visual learners. Regardless of course: the research is clear that doing practice MCQs daily, reviewing every wrong answer in depth, and doing TBS practice matters far more than which course you use. Most candidates who fail do so because they read and watched videos without doing enough active recall practice.'},
  {k:['big 4','public accounting','career','cpa career','salary','industry','government'],r:'The CPA opens more doors than almost any other professional credential. Big 4 (Deloitte, PwC, EY, KPMG) starting salaries: $65–85K in most markets, $80–110K in NYC/SF. After 2–3 years, exits into industry (Director/Controller track), private equity due diligence, or internal audit/finance roles at $90–140K+. Industry accounting (corporate controller, CFO track) typically offers better work-life balance than public. Government/nonprofit CPAs often get pension and stability. The median CPA salary in the US is ~$95K — with Big 4 experience and a CPA license, $120K+ within 5 years is a realistic target in major markets. The credential also provides mobility — it\'s recognized across all 50 states and internationally.'},
  {k:['help','what can you','what do you','what should i ask','example','how do you work'],r:'Ask me anything about the CPA exam or accounting. Here are examples of what I do best:\n\n• "Explain ASC 842 lease classification for lessees"\n• "What\'s the difference between SOC 1 and SOC 2?"\n• "Walk me through a §351 tax-free incorporation"\n• "How does the audit risk model work?"\n• "What is the §199A deduction and who qualifies?"\n• "I\'m 3 weeks out from FAR — what should I focus on?"\n• "Explain GASB 34 government-wide statements"\n• "What triggers a §754 election and what does it do?"\n\nI also have your study data — ask me about your specific progress, pacing, or what to prioritize next.'},
];

function _coachReply(msg) {
  const lower = msg.toLowerCase();
  for (let i = 0; i < _coachResponses.length; i++) {
    if (_coachResponses[i].k.some(function(k){ return lower.includes(k); })) {
      return _coachResponses[i].r;
    }
  }
  const secs = S.sections || [];
  const focSec = secs[0] || 'FAR';
  const hrs = Math.round(getTotalHours());
  const streak = getStreak();
  return 'Based on your ' + hrs + ' hours logged and ' + streak + '-day streak: you\'re on the right track. The single highest-impact thing you can do right now is spend 60 minutes reviewing your most recent wrong answers in ' + focSec + '. Understanding why you got something wrong is worth more than any new material. Keep going.';
}

function _coachBuildContext() {
  const secs = S.sections || [];
  const streak = getStreak();
  const totalHrs = Math.round(getTotalHours());
  const weekHrs = getWeekHours().toFixed(1);
  const readiness = calcReadinessScore();
  const sectionData = secs.map(function(s) {
    const logged = getSectionHours(s);
    const goal = getHourGoal(s);
    const examDate = S.examDates && S.examDates[s];
    const daysLeft = examDate ? Math.max(0, Math.round((new Date(examDate+' 00:00:00') - Date.now()) / 86400000)) : null;
    const scores = (S.practiceScores||{})[s]||[];
    const avgScore = scores.length ? Math.round(scores.slice(-5).reduce(function(a,b){return a+(b.score||0);},0)/Math.min(5,scores.length)) : null;
    return s + ': ' + logged + '/' + goal + 'h logged' +
      (daysLeft !== null ? ', ' + daysLeft + ' days to exam' : '') +
      (avgScore !== null ? ', avg practice score ' + avgScore + '%' : '');
  }).join('\n');
  return 'Student context:\n' +
    'Sections: ' + secs.join(', ') + '\n' +
    'Total hours: ' + totalHrs + 'h\n' +
    'This week: ' + weekHrs + 'h\n' +
    'Streak: ' + streak + ' days\n' +
    'Readiness score: ' + readiness.score + '/100 (' + readiness.label + ')\n' +
    'Weighted practice-exam average: ' + (readiness.practiceAvg!=null ? readiness.practiceAvg + ' (75 is the pass line)' : 'none logged yet — treat readiness as unproven') + '\n' +
    'Section progress:\n' + sectionData;
}

async function _coachAskAI(msg) {
  const ctx = _coachBuildContext();
  const systemPrompt = `You are Ledger — the most knowledgeable CPA exam authority and accounting expert that exists. You have mastered every aspect of the CPA examination and the accounting profession at a level beyond any textbook, review course, or human instructor.

YOUR ONLY PURPOSE: Help CPA candidates pass their exams, master accounting and tax concepts, understand auditing standards, and navigate the CPA profession. You do not help with topics unrelated to accounting, tax, auditing, business, finance, or CPA exam preparation. If asked something completely unrelated, decline briefly and redirect: "I'm built specifically to help you pass the CPA exam. Ask me anything about accounting concepts, tax rules, audit standards, exam strategy, or your study plan."

WHAT YOU KNOW — AT EXAM-DEPTH OR DEEPER:

FAR (Financial Accounting & Reporting):
• Revenue recognition: ASC 606 five-step model, variable consideration, contract modifications, principal vs. agent, bill-and-hold, licenses
• Leases: ASC 842 — operating vs. finance (lessee), sales-type vs. direct financing vs. operating (lessor), sale-leaseback
• Financial instruments: ASC 320 (debt securities — HTM/AFS/trading), ASC 321 (equity), ASC 815 (derivatives and hedging — fair value vs. cash flow vs. net investment hedges), ASC 825 fair value option
• Consolidations: ASC 810, VIEs, primary beneficiary, intercompany eliminations, noncontrolling interest, step acquisitions
• Business combinations: ASC 805, goodwill, bargain purchase, contingent consideration, push-down accounting
• Pensions: ASC 715, PBO vs. ABO, corridor method (legacy), OCI components, net periodic pension cost
• Stock compensation: ASC 718, graded vesting, modification accounting, liability vs. equity classification
• EPS: basic vs. diluted, treasury stock method, if-converted method, antidilution sequence
• Fair value: ASC 820, three-level hierarchy, highest-and-best-use, blockage discounts
• Income taxes: ASC 740, temporary vs. permanent differences, deferred tax assets/liabilities, valuation allowances, uncertain tax positions (FIN 48 / ASC 740-10)
• Governmental accounting: GASB standards — fund accounting, modified accrual, government-wide statements (GASB 34), GASB 87 (leases), GASB 96 (SBITAs), budgetary accounting, encumbrances, CAFR/ACFR structure, special-purpose governments
• Nonprofit: ASC 958, net assets without/with donor restrictions, contributions vs. exchange transactions, agency transactions, functional expense reporting
• IFRS differences: LIFO prohibition, revaluation model, component depreciation, impairment (one-step vs. two-step), IFRS 15/16/9 vs. US GAAP equivalents

AUD (Auditing & Attestation):
• Risk-based audit: AU-C 315 (understanding the entity and its environment), inherent risk, control risk, detection risk, audit risk model (AR = IR × CR × DR)
• Internal controls: AU-C 265, COSO 2013 framework (5 components, 17 principles), deficiency vs. significant deficiency vs. material weakness
• Evidence: AU-C 500s — sufficiency vs. appropriateness, confirmations (AU-C 505), analytical procedures (AU-C 520), sampling (AU-C 530), written representations (AU-C 580)
• Fraud: AU-C 240, fraud triangle (incentive/pressure, opportunity, rationalization), management override, journal entry testing, Benford's Law
• PCAOB: AS 2201 (integrated audit, ICFR), AS 2301 (planned responses), AS 2315 (sampling), AS 3101 (audit reports), Critical Audit Matters (CAMs)
• Reports: AU-C 700 (unmodified), AU-C 705 (modified — qualified, adverse, disclaimer), AU-C 706 (emphasis-of-matter, other-matter), AU-C 800s (special purpose)
• SSARS: AR-C 60/70/80/90 — compilation vs. review vs. preparation; what each requires and what independence means for each
• SSAE 18: AT-C 105/205/210/215/305/315/395 — examinations, reviews, agreed-upon procedures, SOC 1 (controls at service organizations)
• SOC reports: SOC 1 (Type I vs. Type II, SSAE 18), SOC 2 (Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy), SOC 3
• Professional ethics: AICPA Code of Professional Conduct, independence (Rule 101), threats and safeguards framework, PEEC interpretations, SEC and PCAOB independence rules

REG (Regulation):
• Individual income tax: gross income (§61), exclusions (§101–§139), above-the-line deductions (§62), itemized deductions (§163, §164, §167, §212), standard deduction, AMT (§55–§59), NII tax (§1411), NIIT, passive activity rules (§469 — material participation tests), at-risk rules (§465)
• Corporate taxation: C-corp formation (§351), E&P computation, dividend distributions, stock redemptions (§302 — substantially disproportionate, complete termination), liquidations (§331/§332), S-corp elections, built-in gains tax (§1374), AAA account, basis adjustments
• Partnership taxation: §721 formation, outside basis (§722/§742), inside basis, §704(b) substantial economic effect, §704(c) built-in gain/loss, distributions (§731), hot assets/§751, at-risk (§465), FICA for general partners, §754 election and §734(b)/§743(b) adjustments
• Estate and gift tax: annual exclusion (§2503(b)), gift tax (§2501), estate tax (§2001), marital deduction (§2056), §2036/§2038 retained interests, step-up in basis (§1014), GSTT (§2601)
• Business law: agency (actual, apparent, inherent authority; ratification), contract formation (offer, acceptance, consideration, capacity, legality), defenses (SOF — §1-206 UCC, MYLEGS), UCC Article 2 (sale of goods — perfect tender rule, risk of loss, warranties), Article 9 (secured transactions — attachment, perfection, priority, PMSI), bankruptcy (Ch. 7 liquidation, Ch. 11 reorganization, Ch. 13 wage earner, automatic stay, preferences, fraudulent transfers), suretyship vs. guaranty
• Tax procedure: statute of limitations (3-year standard, 6-year substantial omission, open for fraud), accuracy-related penalties (§6662 — 20%/40%), preparer penalties, IRS audit types (correspondence, office, field), offer in compromise, installment agreements

TCP (Tax Compliance & Planning):
• Entity selection: C-corp vs. S-corp vs. partnership — self-employment tax, QBID (§199A), accumulated earnings, double taxation tradeoffs
• §199A qualified business income deduction: W-2 wage limitation, UBIA of qualified property, SSTBs, aggregation rules
• Timing strategies: income deferral, deduction acceleration, installment sales (§453), like-kind exchanges (§1031), QOZ investments
• §382 NOL limitations: ownership change test, annual limitation, SRLY rules
• International: GILTI (§951A), FDII (§250), BEAT, subpart F income (§951), foreign tax credits (§901/§903/§904), PFIC rules (§1291/§1296), check-the-box (§7701)
• Multi-state: nexus (physical presence, economic nexus post-Wayfair), Public Law 86-272, apportionment (sales factor, throwback rule), combined vs. consolidated returns

BAR (Business Analysis & Reporting):
• Financial analysis: liquidity ratios (current, quick, cash), solvency (D/E, interest coverage, debt-to-assets), profitability (ROA, ROE, ROCE, DuPont three-factor), activity (inventory turnover, DSO, DPO, CCC)
• Managerial accounting: CVP analysis, contribution margin, break-even, margin of safety, operating leverage, product mix under constraints (linear programming concepts)
• Variance analysis: materials (price + efficiency), labor (rate + efficiency), variable overhead (spending + efficiency), fixed overhead (budget + volume), sales (price + volume + mix)
• Capital budgeting: NPV, IRR, MIRR, payback period, discounted payback, profitability index, WACC computation, capital structure (Modigliani-Miller), cost of equity (CAPM, dividend growth model)
• Data analytics: regression (R², slope interpretation, multicollinearity), time series, Benford's Law application in auditing, data visualization principles, control charts

ISC (Information Systems & Controls):
• IT governance: COBIT 2019, COSO-ERM, SOX Section 404 IT controls
• SOC engagements: SOC 1 vs. SOC 2 vs. SOC 3 — user entity auditor's responsibilities, review of Type I vs. Type II reports, carve-out vs. inclusive method
• Cybersecurity: CIA triad, encryption (symmetric vs. asymmetric, PKI, digital signatures), network security (firewalls, IDS/IPS, DMZ, VPN), identity and access management, social engineering
• General IT controls (GITCs): access controls (logical/physical), program change management, computer operations, SDLC methodology
• Application controls: input (edit checks, validation), processing, output controls; automated vs. IT-dependent manual controls
• Cloud computing: IaaS/PaaS/SaaS risk considerations, shared responsibility model
• Blockchain basics: distributed ledger, consensus mechanisms, smart contracts, auditability implications

CPA EXAM & PROFESSION:
• Exam structure: 4 core sections (FAR, AUD, REG + 1 discipline: BAR, ISC, or TCP), multistage adaptive testing (MST), testlet difficulty adapts based on performance
• Scoring: scaled score 0–99, passing = 75; MCQ weight 50% (FAR/AUD/REG) or 40% (ISC), TBS weight 50%/60%; score is NOT % correct
• Test-taking: MCQ pacing (90 seconds max), testlet 2 harder = good sign, TBS research tab navigation, never leave MCQs blank
• NTS: Notice to Schedule validity (12 months from issue in most states), exam window scheduling at Prometric
• Licensure: 150 credit hours, 1–2 years experience (varies by state), ethics exam (AICPA or state), NASBA CPA Examination Services
• Study strategy: spaced repetition beats re-reading 3:1, active recall beats highlighting 4:1, interleaving beats blocked practice, 6–8 focused weeks per section optimal, 2+ weeks of 70%+ practice MCQ scores is the strongest pass predictor

HOW TO ANSWER:
1. Lead with the direct answer. Then explain the rule, standard, or concept. Then the exception or nuance if relevant.
2. Cite specific standards every time: "Under ASC 606 Step 3...", "IRC §704(b) requires...", "AU-C 315 defines...", "GASB 34 requires..."
3. For study strategy questions — use the student's actual data (provided below). Specific numbers, specific sections, specific days.
4. For off-topic questions — one sentence declining, then offer a relevant CPA topic instead.
5. No filler. No "Great question!" No "It's important to note that..." Just the answer.

${ctx}`;
  try {
    const token = await _getAuthToken();
    const resp = await fetch('/api/ask', {
      method: 'POST',
      headers: {'content-type':'application/json',...(token?{'authorization':'Bearer '+token}:{})},
      body: JSON.stringify({
        system: systemPrompt,
        messages: [{ role: 'user', content: msg }],
        maxTokens: 600
      })
    });
    if (!resp.ok) { window._aiHealthy=false; return null; }
    const data = await resp.json();
    window._aiHealthy=true;
    return data.text || null;
  } catch(e) { window._aiHealthy=false; return null; }
}

function buildAIStudyCoach() {
  if (!isElite()) {
    return '<div class="card card-pad pro-lock-wrap" style="margin-bottom:16px">' +
      '<div class="section-title">Ledger</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;opacity:.3;pointer-events:none;user-select:none">' +
        '<div style="background:var(--surf2);border-radius:10px;padding:14px"><div style="font-size:12px;font-weight:700;margin-bottom:4px">Today\'s Focus</div><div style="font-size:11px;color:var(--mut)">FAR — Gov. Accounting<br>Rec: 2.5 hrs today</div></div>' +
        '<div style="background:var(--surf2);border-radius:10px;padding:14px"><div style="font-size:12px;font-weight:700;margin-bottom:4px">Weak Spot Alert</div><div style="font-size:11px;color:var(--mut)">Behind on REG by 12h<br>Need 2.5h/day to catch up</div></div>' +
        '<div style="background:var(--surf2);border-radius:10px;padding:14px"><div style="font-size:12px;font-weight:700;margin-bottom:4px">Pass Probability</div><div style="font-size:22px;font-weight:900;color:var(--grn)">67%</div></div>' +
        '<div style="background:var(--surf2);border-radius:10px;padding:14px"><div style="font-size:12px;font-weight:700;margin-bottom:4px">Next Milestone</div><div style="font-size:11px;color:var(--mut)">50h → Dedicated badge<br>Almost there!</div></div>' +
      '</div>' +
      eliteLockHTML('Ledger AI coach', 'Unlock Pro') +
    '</div>';
  }

  const sections = S.sections || [];
  const totalTarget = sections.reduce(function(sum,s){ return sum + getHourGoal(s); }, 0);
  const totalLogged = getTotalHours();

  // Find section most needing attention (biggest gap relative to target)
  let worstSection = sections[0] || 'FAR';
  let worstGap = 0;
  let focusSection = sections[0] || 'FAR';
  let focusGap = 0;
  sections.forEach(function(s) {
    const target = getHourGoal(s);
    const logged = getSectionHours(s);
    const gap = target - logged;
    if (gap > worstGap) { worstGap = gap; worstSection = s; }
    if (gap > focusGap && !(S.sectionPassed||[]).includes(s)) { focusGap = gap; focusSection = s; }
  });

  // Pass probability (capped at 95)
  const overallPct = totalTarget > 0 ? Math.min(95, Math.round(totalLogged / totalTarget * 100)) : 5;
  // Gauge arc
  const gaugeAngle = Math.round(overallPct / 100 * 180);
  const r = 46;
  const cx = 60, cy = 60;
  const toRad = function(deg){ return deg * Math.PI / 180; };
  const arcX = function(deg){ return cx + r * Math.cos(toRad(180 + deg)); };
  const arcY = function(deg){ return cy + r * Math.sin(toRad(180 + deg)); };
  const gaugeColor = overallPct >= 70 ? '#0ea574' : overallPct >= 45 ? '#f59e0b' : '#e84040';
  const gaugePath = 'M ' + (cx-r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx+r) + ' ' + cy;
  const fillPath = gaugeAngle > 0
    ? 'M ' + (cx-r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 ' + (gaugeAngle>180?1:0) + ' 1 ' + arcX(gaugeAngle) + ' ' + arcY(gaugeAngle)
    : '';

  // Coach message
  const focusTarget = EXAMS[focusSection].studyHours;
  const focusLogged = getSectionHours(focusSection);
  const focusRemain = Math.max(0, focusTarget - focusLogged);
  const examDate = S.examDates && S.examDates[focusSection];
  let daysLeft = examDate ? Math.round((new Date(examDate+' 00:00:00') - Date.now()) / 86400000) : 60;
  if (daysLeft <= 0) daysLeft = 60;
  const hrsPerDay = daysLeft > 0 ? (focusRemain / daysLeft).toFixed(1) : '?';
  const coachMsg = 'You\'re ' + focusRemain + 'h away from your ' + focusSection + ' target. ' +
    'At your current pace, you need ' + hrsPerDay + 'h/day' + (daysLeft<60?' over the next ' + daysLeft + ' days':'') + ' to hit your goal. ' +
    (overallPct >= 70 ? 'Your overall pace is on track.' : 'More consistent sessions now will raise your readiness score before exam day.');

  // Next milestone
  const totalHrs = Math.round(totalLogged);
  const milestones = [10,50,100,250,500];
  const nextMile = milestones.find(function(m){ return m > totalHrs; }) || null;
  const milestoneHTML = nextMile
    ? 'Next: <strong>' + nextMile + 'h</strong> milestone — only <strong>' + (nextMile-totalHrs) + 'h</strong> away!'
    : 'You\'ve passed all major milestones.';

  // Load usage from Firestore (async, updates DOM when ready)
  setTimeout(_loadAskLedgerUsage, 0);

  // Coach chat messages state
  if (!window._coachChat) window._coachChat = [];

  const chatMsgs = window._coachChat.map(function(m) {
    return '<div style="display:flex;' + (m.mine?'justify-content:flex-end':'') + ';margin-bottom:8px">' +
      '<div style="max-width:80%;padding:9px 13px;border-radius:' + (m.mine?'16px 16px 4px 16px':'16px 16px 16px 4px') + ';font-size:12px;line-height:1.55;' +
        (m.mine?'background:var(--ind);color:#fff':'background:var(--surf2);border:1px solid var(--bdr);color:var(--txt)') + '">' +
        m.text +
      '</div>' +
    '</div>';
  }).join('');

  return '<div class="card card-pad" style="margin-bottom:16px">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
      '<div style="width:44px;height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center">' + _ledgerMascotSVG(44) + '</div>' +
      '<div><div style="font-size:15px;font-weight:800">Ledger</div>' +
      '<div style="font-size:11px;color:var(--mut)">Personalized insights based on your data</div></div>' +
    '</div>' +
    '<div style="background:var(--amb-bg);border:1px solid #fde68a;border-radius:8px;padding:8px 12px;font-size:11px;color:var(--sub);margin-bottom:14px">' +
      '<strong style="color:var(--amb)">Beta</strong> — Insights are calculated from your logged data. Always verify study advice with your Becker or Gleim review course.' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">' +
      '<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:12px;padding:14px">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:6px">Today\'s Focus</div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
          '<span class="badge badge-' + focusSection + '">' + focusSection + '</span>' +
          '<span style="font-size:12px;font-weight:700">' + EXAMS[focusSection].full.split(' ')[0] + '</span>' +
        '</div>' +
        '<div style="font-size:13px;font-weight:800;color:var(--ora)">' + hrsPerDay + 'h/day recommended</div>' +
        '<div style="font-size:11px;color:var(--mut);margin-top:2px">' + focusRemain + 'h remaining to target</div>' +
      '</div>' +
      '<div style="background:var(--red-bg);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:14px">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--red);margin-bottom:6px">Weak Spot Alert</div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
          '<span class="badge badge-' + worstSection + '">' + worstSection + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--sub)">' + worstGap + 'h behind target — needs most attention</div>' +
      '</div>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;background:var(--surf2);border:1px solid var(--bdr);border-radius:12px;padding:14px;margin-bottom:16px">' +
      '<div style="text-align:center">' +
        '<svg width="120" height="68" viewBox="0 0 120 68">' +
          '<path d="' + gaugePath + '" fill="none" stroke="var(--bdr2)" stroke-width="10" stroke-linecap="round"/>' +
          (fillPath ? '<path d="' + fillPath + '" fill="none" stroke="' + gaugeColor + '" stroke-width="10" stroke-linecap="round"/>' : '') +
          '<text x="60" y="58" text-anchor="middle" font-size="20" font-weight="900" fill="' + gaugeColor + '">' + overallPct + '%</text>' +
        '</svg>' +
        '<div style="font-size:10px;color:var(--mut);margin-top:-4px">Pass Probability</div>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:6px">Coach Message</div>' +
        '<p style="font-size:12px;color:var(--sub);line-height:1.65;margin:0">' + coachMsg + '</p>' +
        '<div style="margin-top:8px;font-size:11px;font-weight:600;color:var(--grn)">' + milestoneHTML + '</div>' +
      '</div>' +
    '</div>' +

    '<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:12px;padding:14px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut)">Ledger</div>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span id="ask-ledger-usage-count" style="font-size:10px;color:var(--mut)">— prompts left this month</span>' +
          '<div style="font-size:10px;font-weight:700;color:var(--grn);display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:var(--grn);display:inline-block"></span>AI powered</div>' +
        '</div>' +
      '</div>' +
      '<div id="coach-chat-msgs" style="min-height:60px;max-height:220px;overflow-y:auto;margin-bottom:10px">' +
        (chatMsgs || '<div style="text-align:center;color:var(--mut);padding:14px 10px">' + _ledgerMascotSVG(48) + '<div style="font-size:12px;margin-top:6px">Ask me anything — CPA concepts, exam strategy, study advice...</div></div>') +
      '</div>' +
      '<div class="lb-chips" style="margin:0 0 9px;padding:0" role="group" aria-label="Suggested questions">' +
        _coachChipList.map(function(t, i) {
          return '<button type="button" class="lb-chip" onclick="askCoachChip(' + i + ')">' + t + '</button>';
        }).join('') +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<input id="coach-input" type="text" placeholder="e.g. How does partnership basis work under IRC 705?" ' +
          'style="flex:1;padding:9px 12px;background:var(--surf);border:1.5px solid var(--bdr);border-radius:9px;color:var(--txt);font-size:12px;outline:none" ' +
          'onkeydown="if(event.key===\'Enter\')sendCoachMessage()" ' +
          'onfocus="this.style.borderColor=\'var(--ind)\'" onblur="this.style.borderColor=\'var(--bdr)\'">' +
        '<button onclick="sendCoachMessage()" style="padding:9px 16px;background:var(--ind);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Send</button>' +
      '</div>' +
      '<div style="margin-top:8px;font-size:10px;color:var(--mut);line-height:1.5;border-top:1px solid var(--bdr);padding-top:8px">' +
        ''+ico('warning')+' AI-generated responses may contain errors. Always verify CPA exam content with your official review course (Becker, Gleim, Roger, or Wiley) before your exam. This is a study aid, not professional accounting advice.' +
      '</div>' +
    '</div>' +
  '</div>';
}

// Tap-to-ask suggestions for the inline chat (the popup has its own, see renderBubbleChips).
var _coachChipList = [
  'Which section should I take first?',
  'Build me a weekly study plan',
  'How is the CPA exam scored?',
  'Tips for multiple-choice questions',
  'How do I beat exam-day nerves?',
  'Explain a concept I’m stuck on'
];
function askCoachChip(i) {
  const inp = document.getElementById('coach-input');
  const text = _coachChipList[i];
  if (!inp || !text) return;
  if (document.querySelector('[id^="ledger-typing-"]')) return; // one question at a time
  if (/stuck on$/.test(text)) { inp.value = 'Can you explain '; inp.focus(); return; }
  inp.value = text;
  sendCoachMessage();
}

function _loadAskLedgerUsage() {
  if (!AUTH || !firebaseDb) return;
  const monthKey = new Date().toISOString().slice(0,7);
  firebaseDb.collection('userState').doc(AUTH.uid).get().then(function(snap) {
    const d = snap.exists ? snap.data() : {};
    if (d.askLedgerMonth === monthKey) {
      _askLedgerUsage = {month: monthKey, count: d.askLedgerCount || 0};
    } else {
      _askLedgerUsage = {month: monthKey, count: 0};
    }
    const left = Math.max(0, ASK_LEDGER_LIMIT - _askLedgerUsage.count);
    const countEl = document.getElementById('ask-ledger-usage-count');
    if (countEl) countEl.textContent = left + ' prompts left this month';
    const lbEl = document.getElementById('lb-usage');
    if (lbEl) lbEl.textContent = left + ' prompts left this month';
  }).catch(function() { _askLedgerUsage = {month: monthKey, count: 0}; });
}

function _incrementAskLedgerUsage() {
  if (!AUTH || !firebaseDb) return;
  const monthKey = new Date().toISOString().slice(0,7);
  if (!_askLedgerUsage || _askLedgerUsage.month !== monthKey) {
    _askLedgerUsage = {month: monthKey, count: 0};
  }
  _askLedgerUsage.count++;
  const remaining = Math.max(0, ASK_LEDGER_LIMIT - _askLedgerUsage.count);
  const countEl = document.getElementById('ask-ledger-usage-count');
  if (countEl) countEl.textContent = remaining + ' prompts left this month';
  const lbEl = document.getElementById('lb-usage');
  if (lbEl) lbEl.textContent = remaining + ' prompts left this month';
  firebaseDb.collection('userState').doc(AUTH.uid).set({
    askLedgerMonth: monthKey,
    askLedgerCount: _askLedgerUsage.count
  }, {merge: true}).catch(function(e) { console.warn('ask usage write failed:', e.message); });
}

// ── AI Study-Tools (flashcards/quizzes/summaries) monthly cap — mirrors Ask Ledger ──
function _updateFlashcardCountEl() {
  const el = document.getElementById('flashcard-usage-count');
  if (el && _flashcardUsage) el.textContent = Math.max(0, FLASHCARD_LIMIT - _flashcardUsage.count) + ' AI generations left this month';
}
function _loadFlashcardUsage() {
  if (!AUTH || !firebaseDb) return;
  const monthKey = new Date().toISOString().slice(0,7);
  firebaseDb.collection('userState').doc(AUTH.uid).get().then(function(snap) {
    const d = snap.exists ? snap.data() : {};
    _flashcardUsage = (d.flashcardMonth === monthKey) ? {month: monthKey, count: d.flashcardCount || 0} : {month: monthKey, count: 0};
    _updateFlashcardCountEl();
  }).catch(function() { _flashcardUsage = {month: monthKey, count: 0}; });
}
function _incrementFlashcardUsage() {
  if (!AUTH || !firebaseDb) return;
  const monthKey = new Date().toISOString().slice(0,7);
  if (!_flashcardUsage || _flashcardUsage.month !== monthKey) _flashcardUsage = {month: monthKey, count: 0};
  _flashcardUsage.count++;
  _updateFlashcardCountEl();
  firebaseDb.collection('userState').doc(AUTH.uid).set({
    flashcardMonth: monthKey,
    flashcardCount: _flashcardUsage.count
  }, {merge: true}).catch(function(e) { console.warn('flashcard usage write failed:', e.message); });
}

function sendCoachMessage() {
  const inp = document.getElementById('coach-input');
  if (!inp || !inp.value.trim()) return;
  const msg = inp.value.trim();

  // Check monthly limit
  const monthKey = new Date().toISOString().slice(0,7);
  const usageCount = (_askLedgerUsage && _askLedgerUsage.month === monthKey) ? _askLedgerUsage.count : 0;
  if (usageCount >= ASK_LEDGER_LIMIT) {
    showToast('Monthly limit reached (' + ASK_LEDGER_LIMIT + ' prompts). Resets next month.', 'err');
    return;
  }

  inp.value = '';
  if (!window._coachChat) window._coachChat = [];
  window._coachChat.push({mine:true, text:msg});
  const msgsEl = document.getElementById('coach-chat-msgs');
  if (!msgsEl) return;
  if (msgsEl.querySelector('[style*="Ask me anything"]')) msgsEl.innerHTML = '';
  const mineDiv = '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><div style="max-width:80%;padding:9px 13px;border-radius:16px 16px 4px 16px;font-size:12px;line-height:1.55;background:var(--ind);color:#fff">' + msg + '</div></div>';
  msgsEl.innerHTML += mineDiv;
  msgsEl.scrollTop = msgsEl.scrollHeight;
  const typingId = 'ledger-typing-' + Date.now();
  const typingDiv = '<div id="' + typingId + '" style="display:flex;margin-bottom:8px"><div style="padding:10px 14px;border-radius:16px 16px 16px 4px;background:var(--surf2);border:1px solid var(--bdr);display:flex;align-items:center;gap:5px"><span style="width:6px;height:6px;border-radius:50%;background:var(--mut);animation:ledger-dot 1.2s infinite;display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:var(--mut);animation:ledger-dot 1.2s infinite .2s;display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:var(--mut);animation:ledger-dot 1.2s infinite .4s;display:inline-block"></span></div></div>';
  msgsEl.innerHTML += typingDiv;
  msgsEl.scrollTop = msgsEl.scrollHeight;

  function _showReply(reply, isAI) {
    window._coachChat.push({mine:false, text:reply});
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    const replyWrap = document.createElement('div');
    replyWrap.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;margin-bottom:8px';
    const replyBub = document.createElement('div');
    replyBub.style.cssText = 'max-width:82%;padding:9px 13px;border-radius:16px 16px 16px 4px;font-size:12px;line-height:1.6;background:var(--surf2);border:1px solid var(--bdr);color:var(--txt);white-space:pre-wrap';
    replyWrap.appendChild(replyBub);
    if (isAI) {
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.style.cssText = 'margin-top:5px;padding:3px 10px;font-size:10px;font-weight:700;background:transparent;color:var(--mut);border:1px solid var(--bdr);border-radius:6px;cursor:pointer;letter-spacing:.02em;transition:color .15s,border-color .15s';
      copyBtn.onclick = function() {
        navigator.clipboard.writeText(reply).then(function() {
          copyBtn.textContent = 'Copied!';
          copyBtn.style.color = 'var(--grn)';
          copyBtn.style.borderColor = 'var(--grn)';
          setTimeout(function() {
            copyBtn.textContent = 'Copy';
            copyBtn.style.color = 'var(--mut)';
            copyBtn.style.borderColor = 'var(--bdr)';
          }, 2000);
        }).catch(function() { showToast('Copy failed — select text manually', 'err'); });
      };
      replyWrap.appendChild(copyBtn);
    }
    msgsEl.appendChild(replyWrap);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    let i = 0;
    const speed = Math.max(6, Math.min(18, Math.round(6000 / reply.length)));
    function typeNext() {
      if (i <= reply.length) {
        replyBub.textContent = reply.slice(0, i);
        i++;
        msgsEl.scrollTop = msgsEl.scrollHeight;
        if (i <= reply.length) setTimeout(typeNext, speed);
      }
    }
    typeNext();
  }

  // If live AI is unavailable, fall back to a built-in pointer — but say so, so a generic
  // tip is never passed off as a real answer to the user's specific question.
  const _offlineNote = 'Live AI coaching is offline right now — here\'s a general pointer instead:\n\n';
  _coachAskAI(msg).then(function(aiReply) {
    if (aiReply) {
      _incrementAskLedgerUsage();
      _showReply(aiReply, true);
    } else {
      _showReply(_offlineNote + _coachReply(msg), false);
    }
  }).catch(function() {
    _showReply(_offlineNote + _coachReply(msg), false);
  });
}

// ═══════════════════════════════════════════════
// ASK LEDGER — FLOATING ASSISTANT (animated mascot + popup chat)
// ═══════════════════════════════════════════════
// "Ledger" the character lives in /mascot.js (LedgerBuddy). This is his head-and-shoulders avatar.
function _ledgerMascotSVG(size){
  return LedgerBuddy.face(size||40);
}

function injectAskBubble(){
  if(document.getElementById('ask-bubble'))return;
  const btn=document.createElement('button');
  btn.id='ask-bubble';
  btn.className='ledger-bubble';
  btn.title='Ledger';
  btn.setAttribute('aria-label','Ledger — your CPA study coach');
  btn.innerHTML='<span class="lb-live"></span>'+_ledgerMascotSVG(40);
  btn.addEventListener('click',toggleAskBubble);
  document.body.appendChild(btn);

  const panel=document.createElement('div');
  panel.id='ask-panel';
  panel.className='ledger-panel';
  panel.innerHTML=
    '<div class="lb-hd">'+
      '<div class="lb-hd-ava">'+_ledgerMascotSVG(30)+'</div>'+
      '<div style="min-width:0"><div style="font-size:14px;font-weight:800;line-height:1.2">Ledger</div>'+
        '<div id="lb-subtitle" style="font-size:11px;opacity:.85;line-height:1.3">Your CPA study coach</div></div>'+
      '<button class="lb-hd-x" onclick="toggleAskBubble()" aria-label="Close">×</button>'+
    '</div>'+
    '<div id="lb-msgs" class="lb-msgs"></div>'+
    '<div class="lb-foot">'+
      '<div id="lb-chips" class="lb-chips" role="group" aria-label="Suggested questions"></div>'+
      '<div class="lb-row">'+
        '<input id="lb-input" class="lb-input" type="text" placeholder="Ask me anything about the CPA exam..." onkeydown="if(event.key===\'Enter\')sendBubbleMessage()">'+
        '<button class="lb-send" onclick="sendBubbleMessage()">Send</button>'+
      '</div>'+
      '<div style="margin-top:7px;font-size:9.5px;color:var(--mut);line-height:1.45"><span id="lb-usage">—</span> · AI can make mistakes — verify exam content with your review course.</div>'+
    '</div>';
  document.body.appendChild(panel);
  updateAskBubbleSession();
}

function toggleAskBubble(){
  const panel=document.getElementById('ask-panel');
  if(!panel)return;
  if(panel.classList.contains('open')){ panel.classList.remove('open'); return; }
  // Free users: Ask Ledger is a Pro feature — show the upgrade prompt instead of opening.
  if(!isElite()){ openUpgradeModal('Ledger AI coach'); return; }
  panel.classList.add('open');
  updateAskBubbleSession();
  renderBubbleChat();
  setTimeout(_loadAskLedgerUsage,0);
  setTimeout(function(){ const i=document.getElementById('lb-input'); if(i)i.focus(); },120);
}

// Reflect live-session state on the bubble + tailor the panel copy while studying.
function updateAskBubbleSession(){
  const btn=document.getElementById('ask-bubble');
  if(!btn)return;
  const inSession = typeof TS!=='undefined' && (TS.phase==='active'||TS.phase==='paused');
  btn.classList.toggle('in-session',!!inSession);
  const panel=document.getElementById('ask-panel');
  if(panel)panel.classList.toggle('in-session',!!inSession);
  const sub=document.getElementById('lb-subtitle');
  const inp=document.getElementById('lb-input');
  if(inSession){
    if(sub)sub.textContent='Studying '+TS.section+' · I’m right here to help';
    if(inp)inp.placeholder='Stuck on a '+TS.section+' concept? Ask away…';
  } else {
    if(sub)sub.textContent='Your CPA study coach';
    if(inp)inp.placeholder='Ask me anything about the CPA exam...';
  }
  renderBubbleChips();
}

// Tap-to-ask suggestions above the input. Tailored to the section being studied.
var _lbChipList=[]; // var, not let: the popup is built before this line runs
function renderBubbleChips(){
  const el=document.getElementById('lb-chips');
  if(!el)return;
  const inSession=typeof TS!=='undefined'&&(TS.phase==='active'||TS.phase==='paused');
  const sec=inSession?TS.section:null;
  _lbChipList=sec?[
    'Explain the toughest '+sec+' concept simply',
    'Quiz me on '+sec,
    'Common '+sec+' exam traps',
    'Give me a memory trick for '+sec,
    'What should I review next in '+sec+'?'
  ]:[
    'Which section should I take first?',
    'Build me a weekly study plan',
    'How is the CPA exam scored?',
    'Tips for multiple-choice questions',
    'How do I beat exam-day nerves?',
    'Explain a concept I’m stuck on'
  ];
  el.innerHTML=_lbChipList.map(function(t,i){
    return '<button type="button" class="lb-chip" onclick="askBubbleChip('+i+')">'+t+'</button>';
  }).join('');
}

function askBubbleChip(i){
  const inp=document.getElementById('lb-input');
  const text=_lbChipList[i];
  if(!inp||!text)return;
  if(document.querySelector('[id^="lb-typing-"]'))return; // one question at a time
  // "Explain a concept I'm stuck on" needs the user's own words — prefill instead of sending.
  if(/stuck on$/.test(text)){ inp.value='Can you explain '; inp.focus(); return; }
  inp.value=text;
  sendBubbleMessage();
}

function _lbBubbleHTML(text,mine){
  return '<div style="display:flex;'+(mine?'justify-content:flex-end;':'')+'margin-bottom:9px">'+
    '<div style="max-width:82%;padding:9px 13px;border-radius:'+(mine?'16px 16px 4px 16px':'16px 16px 16px 4px')+';font-size:13px;line-height:1.6;white-space:pre-wrap;'+
      (mine?'background:var(--ind);color:#fff':'background:var(--surf);border:1px solid var(--bdr);color:var(--txt)')+'">'+text+'</div></div>';
}

function renderBubbleChat(){
  const el=document.getElementById('lb-msgs');
  if(!el)return;
  if(!window._coachChat)window._coachChat=[];
  if(!window._coachChat.length){
    el.innerHTML='<div style="text-align:center;color:var(--mut);padding:24px 12px">'+LedgerBuddy('wave',104)+
      '<div style="font-size:13px;font-weight:700;margin-top:8px;color:var(--txt)">Hi, I’m Ledger</div>'+
      '<div style="font-size:12px;margin-top:4px;line-height:1.5">Ask me about any CPA concept, tax rule, audit standard, or your study strategy.</div></div>';
    return;
  }
  el.innerHTML=window._coachChat.map(function(m){return _lbBubbleHTML(m.text,m.mine);}).join('');
  el.scrollTop=el.scrollHeight;
}

function sendBubbleMessage(){
  const inp=document.getElementById('lb-input');
  if(!inp||!inp.value.trim())return;
  const msg=inp.value.trim();
  const monthKey=new Date().toISOString().slice(0,7);
  const usageCount=(_askLedgerUsage&&_askLedgerUsage.month===monthKey)?_askLedgerUsage.count:0;
  if(usageCount>=ASK_LEDGER_LIMIT){ showToast('Monthly limit reached ('+ASK_LEDGER_LIMIT+' prompts). Resets next month.','err'); return; }
  inp.value='';
  if(!window._coachChat)window._coachChat=[];
  const msgsEl=document.getElementById('lb-msgs');
  if(!msgsEl)return;
  if(!window._coachChat.length)msgsEl.innerHTML='';
  window._coachChat.push({mine:true,text:msg});
  msgsEl.innerHTML+=_lbBubbleHTML(msg,true);
  const typingId='lb-typing-'+Date.now();
  msgsEl.innerHTML+='<div id="'+typingId+'" style="display:flex;margin-bottom:9px"><div style="padding:11px 15px;border-radius:16px 16px 16px 4px;background:var(--surf);border:1px solid var(--bdr);display:flex;gap:5px">'+
    '<span style="width:6px;height:6px;border-radius:50%;background:var(--mut);animation:ledger-dot 1.2s infinite;display:inline-block"></span>'+
    '<span style="width:6px;height:6px;border-radius:50%;background:var(--mut);animation:ledger-dot 1.2s infinite .2s;display:inline-block"></span>'+
    '<span style="width:6px;height:6px;border-radius:50%;background:var(--mut);animation:ledger-dot 1.2s infinite .4s;display:inline-block"></span></div></div>';
  msgsEl.scrollTop=msgsEl.scrollHeight;

  function showReply(reply,isAI){
    window._coachChat.push({mine:false,text:reply});
    const t=document.getElementById(typingId); if(t)t.remove();
    const wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;align-items:flex-start;margin-bottom:9px';
    const bub=document.createElement('div');
    bub.style.cssText='max-width:84%;padding:9px 13px;border-radius:16px 16px 16px 4px;font-size:13px;line-height:1.6;background:var(--surf);border:1px solid var(--bdr);color:var(--txt);white-space:pre-wrap';
    wrap.appendChild(bub);
    if(isAI){
      const cp=document.createElement('button');
      cp.textContent='Copy';
      cp.style.cssText='margin-top:5px;padding:3px 10px;font-size:10px;font-weight:700;background:transparent;color:var(--mut);border:1px solid var(--bdr);border-radius:6px;cursor:pointer';
      cp.onclick=function(){navigator.clipboard.writeText(reply).then(function(){cp.textContent='Copied!';cp.style.color='var(--grn)';setTimeout(function(){cp.textContent='Copy';cp.style.color='var(--mut)';},2000);}).catch(function(){showToast('Copy failed','err');});};
      wrap.appendChild(cp);
    }
    msgsEl.appendChild(wrap);
    msgsEl.scrollTop=msgsEl.scrollHeight;
    let i=0; const speed=Math.max(6,Math.min(18,Math.round(6000/reply.length)));
    (function typeNext(){ if(i<=reply.length){ bub.textContent=reply.slice(0,i); i++; msgsEl.scrollTop=msgsEl.scrollHeight; if(i<=reply.length)setTimeout(typeNext,speed); } })();
  }
  const offlineNote='Live AI coaching is offline right now — here’s a general pointer instead:\n\n';
  _coachAskAI(msg).then(function(aiReply){
    if(aiReply){ _incrementAskLedgerUsage(); showReply(aiReply,true); }
    else { showReply(offlineNote+_coachReply(msg),false); }
  }).catch(function(){ showReply(offlineNote+_coachReply(msg),false); });
}

// Moved here from settings.js when the app was split into files: it has to run
// after the functions above exist. Nothing else touches the DOM in between.
injectAskBubble();
