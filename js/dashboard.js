// ═══════════════════════════════════════════════
// CURRENT SECTION HELPER
// ═══════════════════════════════════════════════
function getCurrentSection(){
  // Returns the section whose exam date is soonest in the future (not yet passed).
  // Fallback: first non-passed section. Fallback: first section in list.
  const passed=new Set(S.sectionPassed||[]);
  const now=Date.now();
  const _open=(S.sections||[]).filter(s=>!passed.has(s));
  const _sat=S.examSits||{};
  const _pool=_open.some(s=>!_sat[s])?_open.filter(s=>!_sat[s]):_open;
  // Sitting an exam today outranks everything else.
  const _todayExam=_pool.find(s=>S.examDates?.[s]===todayStr());
  if(_todayExam) return _todayExam;
  const withDates=_pool
    .filter(s=>S.examDates?.[s])
    .map(s=>({s,t:new Date(S.examDates[s]+' 00:00:00').getTime()}))
    .filter(x=>x.t>now)
    .sort((a,b)=>a.t-b.t);
  if(withDates.length) return withDates[0].s;
  return _pool[0]||(S.sections||[])[0]||'FAR';
}

// ═══════════════════════════════════════════════
// READINESS SCORE
// ═══════════════════════════════════════════════

// Fix 3: recency-weighted hours — recent study counts more than stale history
function getDecayedSectionHours(section){
  if(!S)return 0;
  const now=Date.now();
  return(S.activities||[])
    .filter(a=>a.section===section)
    .reduce((sum,a)=>{
      const weeksSince=(now-new Date(a.date).getTime())/(7*86400000);
      const w=weeksSince<=4?1:weeksSince<=12?0.85:weeksSince<=24?0.65:0.45;
      return sum+(a.hours||0)*w;
    },0);
}

function calcReadinessScore(overrideSection){
  const passed=new Set(S.sectionPassed||[]);
  const allSections=(S.sections||[]);
  // Only "all passed" when there is at least one section AND every one is passed.
  if(allSections.length && allSections.every(s=>passed.has(s)))return{score:100,label:'All Sections Passed!',color:'var(--grn)',tier:'passed',breakdown:[],hasScores:false};

  // ── Reliability helpers: every input is validated so the score can never be NaN ──
  const now=Date.now();
  const clampInt=(v,lo,hi)=>{ v=Math.round(Number(v)); if(!isFinite(v)) return lo; return Math.max(lo,Math.min(hi,v)); };
  const dayMs=(str)=>{ if(!str) return null; const t=new Date(String(str).slice(0,10)+'T00:00:00').getTime(); return isFinite(t)?t:null; };
  const num=(v)=>{ const n=Number(v); return isFinite(n)?n:0; };

  const s=(overrideSection&&(S.sections||[]).includes(overrideSection))?overrideSection:getCurrentSection();
  const logged=Math.max(0,num(getSectionHours(s)));
  const decayed=Math.max(0,num(getDecayedSectionHours(s)));
  const goal=Math.max(1,num(getHourGoal(s))||150);
  const examMs=dayMs(S.examDates?.[s]); // null when missing or malformed

  // ── 1. Volume (0–25) — timeline-adjusted, recency-decayed hours ──────────────
  let volumePts;
  if(examMs){
    const sectionActs=(S.activities||[]).filter(a=>a&&a.section===s&&dayMs(a.date)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const startMs=(sectionActs.length?dayMs(sectionActs[0].date):null)||num(S.created)||(now-90*86400000);
    const totalMs=Math.max(1,examMs-startMs);
    const fracElapsed=Math.max(0,Math.min(1.5,(now-startMs)/totalMs));
    const expectedNow=goal*fracElapsed;
    volumePts=expectedNow<5 ? (decayed/goal*25) : (decayed/expectedNow*25);
  } else {
    volumePts=decayed/goal*25;
  }
  volumePts=clampInt(volumePts,0,25);

  // ── 2. Pacing (0–15) — on track for exam date ────────────────────────────────
  let pacingPts=10; // neutral credit when no exam date is set (can't assess pacing)
  if(examMs){
    const daysLeft=Math.round((examMs-now)/86400000);
    const weeksLeft=Math.max(0.5,daysLeft/7);
    const needed=Math.max(0,goal-logged);
    const hrsPerWeek=needed/weeksLeft;
    const last28=(S.activities||[]).filter(a=>{const t=dayMs(a&&a.date);return t&&now-t<28*86400000;});
    const actualPace=last28.reduce((acc,b)=>acc+Math.max(0,num(b.hours)),0)/4;
    const available=actualPace>0.5?actualPace:Math.max(1,num(S.hoursPerWeek)||15);
    if(daysLeft<0) pacingPts=0;
    else if(hrsPerWeek<=0) pacingPts=15;
    else pacingPts=15*Math.pow(Math.min(1.2,available/hrsPerWeek)/1.2,1.5);
  }
  pacingPts=clampInt(pacingPts,0,15);

  // ── 3. Practice Scores (0–40) — recency-weighted Becker/Gleim/Wiley/UWorld ──
  // Most predictive signal: candidates averaging 75+ on practice exams pass at high rates.
  // Only valid entries (finite score, real date) count; scores are clamped to 0–100.
  const sScores=((S.practiceScores||{})[s]||[]).filter(sc=>sc&&isFinite(Number(sc.score))&&dayMs(sc.date));
  const hasScores=sScores.length>0;
  let practicePts=0,weightedAvg=0,daysSinceScore=Infinity;
  if(sScores.length){
    let totalWeight=0,weightedSum=0;
    sScores.forEach(sc=>{
      const score=Math.max(0,Math.min(100,Number(sc.score)));
      const daysAgo=Math.max(0,(now-dayMs(sc.date))/86400000);
      daysSinceScore=Math.min(daysSinceScore,daysAgo);
      const w=Math.max(0.3,Math.exp(-daysAgo/120)); // full weight <30d, ~50% at 3mo
      weightedSum+=score*w; totalWeight+=w;
    });
    weightedAvg=totalWeight>0?weightedSum/totalWeight:0;
    // 75 is the pass line, so it anchors 35 of the 40 points. Below it the curve
    // is convex rather than linear: a 60 average is not 80% of the way to passing,
    // and the old straight line said it was (28/35). Above 75, the last 5 points
    // accrue to 80, which is where candidates have real margin.
    practicePts = weightedAvg>=75
      ? 35+Math.min(5,(weightedAvg-75)/5*5)
      : 35*Math.pow(weightedAvg/75,1.6);
  }
  practicePts=clampInt(practicePts,0,40);

  // ── 4. Momentum (0–10) — are your scores improving? ──────────────────────────
  let momentumPts=0;
  if(sScores.length===1){
    momentumPts=3; // credit for logging first score
  } else if(sScores.length>=2){
    const nums=sScores.map(sc=>Math.max(0,Math.min(100,Number(sc.score))));
    const latest=nums[nums.length-1];
    const prevAvg=nums.slice(0,-1).reduce((a,b)=>a+b,0)/(nums.length-1);
    const delta=latest-prevAvg;
    if(delta>=5) momentumPts=10;       // strong upward trend
    else if(delta>=2) momentumPts=7;   // improving
    else if(delta>=-2) momentumPts=4;  // flat — stable is fine
    else momentumPts=1;                // declining — still credit for trying
  }
  momentumPts=clampInt(momentumPts,0,10);

  // ── 5. Consistency (0–10) — active days with ≥30 min in last 14 days ─────────
  const twoWeeksAgo=now-14*86400000;
  const activeDays=new Set();
  (S.activities||[]).forEach(a=>{
    const t=dayMs(a&&a.date);
    if(t&&t>twoWeeksAgo&&num(a.hours)>=0.5) activeDays.add(String(a.date).slice(0,10));
  });
  const consistencyPts=clampInt(activeDays.size,0,10);

  const score=clampInt(volumePts+pacingPts+practicePts+momentumPts+consistencyPts,0,99);
  const breakdown=[{section:s,score,volumePts,pacingPts,practicePts,momentumPts,consistencyPts,logged,decayed:Math.round(decayed),hasScores}];

  // ── Label gating ────────────────────────────────────────────────────────────
  // 60 of the 100 points measure effort (volume, pacing, consistency, momentum);
  // only Practice measures whether you can actually pass. So the headline label
  // is capped by the evidence of mastery, not by the raw total. Without this a
  // 70 practice average — a failing average — reads "Exam Ready" on a full
  // effort score, which is the single most dangerous thing this app could say.
  const TIERS=[
    {max:35,label:'Just Getting Started',color:'#ef4444',tier:'start'},
    {max:50,label:'Building Foundation',color:'#f59e0b',tier:'building'},
    {max:65,label:'On Track',color:'var(--ind)',tier:'track'},
    {max:80,label:'Strong Progress',color:'var(--grn)',tier:'strong'},
    {max:Infinity,label:'Exam Ready',color:'var(--grn)',tier:'ready'}
  ];
  let idx=TIERS.findIndex(t=>score<t.max); if(idx<0) idx=TIERS.length-1;
  let capReason='';
  // The caveat is shown whenever it applies, not only when it actually lowered
  // the label — "Strong Progress" off a 70 average needs the same footnote as
  // a capped one, or the gating is invisible exactly where it matters most.
  const capTo=(i,why)=>{ if(idx>i) idx=i; if(why) capReason=why; };
  if(!hasScores){
    // Nothing here measures whether you can pass. Effort alone tops out at
    // "Building Foundation" no matter how many hours are logged. No caveat text:
    // the card already shows the "50 pts locked" prompt right below this.
    capTo(1,null);
  } else if(weightedAvg<68){
    capTo(2,`Your practice average is ${Math.round(weightedAvg)}. Passing is 75.`);
  } else if(weightedAvg<75){
    capTo(3,`Your practice average is ${Math.round(weightedAvg)} — close, but passing is 75.`);
  } else if(sScores.length<2){
    capTo(3,'One practice score above 75 is a good sign, not yet a trend. Log another.');
  } else if(daysSinceScore>60){
    capTo(3,`Your most recent practice score is ${Math.round(daysSinceScore)} days old — too stale to call you exam ready.`);
  }
  const {label,color,tier}=TIERS[idx];
  return{score,label,color,tier,breakdown,section:s,hasScores,practiceAvg:hasScores?Math.round(weightedAvg):null,capReason};
}

function setReadinessSection(sec){_readinessSection=sec;renderTab();}
function buildReadinessCard(){
  const r=calcReadinessScore(_readinessSection);
  const _secs=(S.sections||[]).filter(Boolean);
  const _switcher=_secs.length>1?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px">${_secs.map(sec=>{const on=sec===r.section;return`<button onclick="setReadinessSection('${sec}')" style="padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid ${on?(EXAMS[sec]?.color||'var(--ora)'):'var(--bdr)'};background:${on?(EXAMS[sec]?.color||'var(--ora)'):'var(--surf2)'};color:${on?'#fff':'var(--mut)'}">${sec}</button>`;}).join('')}</div>`:'';
  const circumference=2*Math.PI*52;
  const dash=circumference*(1-r.score/100);
  const glowStyle=r.tier==='ready'?'box-shadow:0 0 0 1.5px rgba(34,197,94,.25),var(--shadow)':'';
  return`<div class="card card-pad" style="margin-bottom:20px;${glowStyle}">
  <div style="display:flex;align-items:center;gap:20px">
    <div style="position:relative;flex-shrink:0">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surf3)" stroke-width="8"/>
        <circle id="readiness-ring" cx="60" cy="60" r="52" fill="none" stroke="${r.color}" stroke-width="8"
          stroke-dasharray="${circumference}" stroke-dashoffset="${dash}"
          stroke-linecap="round" transform="rotate(-90 60 60)"
          style="transition:stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)"/>
        <text x="60" y="55" text-anchor="middle" font-size="28" font-weight="900" fill="var(--txt)">${r.score}</text>
        <text x="60" y="72" text-anchor="middle" font-size="10" font-weight="700" fill="var(--mut)">/ 100</text>
      </svg>
    </div>
    <div style="flex:1">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-bottom:8px">Readiness Score</div>
      ${_switcher}
      <div style="font-size:20px;font-weight:900;color:${r.color};line-height:1.1;margin-bottom:${r.capReason?'4px':'10px'}">${r.label}</div>
      ${r.capReason?`<div style="font-size:11.5px;color:var(--sub);line-height:1.5;margin-bottom:10px">${esc(r.capReason)}</div>`:''}
      <div style="display:flex;flex-direction:column;gap:8px">
        ${r.breakdown.map(b=>[
          ['pencil','Practice',b.practicePts,40],
          ['lineChart','Momentum',b.momentumPts,10],
          ['book','Volume',b.volumePts,25],
          ['calendar','Pacing',b.pacingPts,15],
          ['flame','Consist.',b.consistencyPts,10]
        ].map(([icon,lbl,pts,max])=>`<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;width:18px;text-align:center;flex-shrink:0">${ico(icon)}</span>
          <span style="font-size:11px;color:var(--mut);width:62px;flex-shrink:0">${lbl}</span>
          <div style="flex:1;height:5px;background:var(--surf3);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${Math.round(pts/max*100)}%;background:${EXAMS[b.section]?.color||'var(--ind)'};border-radius:4px"></div>
          </div>
          <span style="font-size:11px;font-weight:700;color:var(--sub);width:36px;text-align:right">${pts}/${max}</span>
        </div>`).join('')).join('')}
      </div>
      ${!r.hasScores?`<div style="margin-top:8px;padding:8px 10px;background:var(--amb-bg,#fef3c7);border:1px solid var(--amb,#f59e0b);border-radius:8px;font-size:10px;color:var(--amb,#b45309);line-height:1.5;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <span><strong>50 pts locked</strong> — log Becker/Gleim practice scores to unlock Practice + Momentum signals.</span>
        <button onclick="_openScoreTracker()" style="background:#b45309;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">Log Practice Score →</button>
      </div>`:''}
      <div style="font-size:10px;color:var(--mut);margin-top:6px;line-height:1.5">Practice scores (40pts) are the strongest predictor · momentum tracks score trend · volume weighted for recency</div>
    </div>
  </div>
  <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
    <button class="btn btn-xs" onclick="openScoreModal('${r.section}')" style="background:var(--ora);color:#fff;border:none;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:11px;flex-shrink:0">Log Practice Score</button>
    <button class="btn btn-ghost btn-xs" onclick="openPacingTipsModal()" style="flex-shrink:0">How is this calculated? →</button>
  </div>
</div>`;
}

function openHourGoalsModal(){
  const sections=S.sections||['FAR','AUD','REG','TCP'];
  const currentIntensity=S.studyIntensity||'standard';
  const el=document.createElement('div');
  el.className='modal-overlay open';
  el.style.cssText='z-index:9999';
  el.innerHTML=`<div class="modal-box" style="max-width:580px;padding:28px" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:17px;font-weight:800">Customize Hour Goals</div>
      <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
    </div>
    <div style="font-size:12px;color:var(--sub);margin-bottom:16px;line-height:1.55">Your readiness score and pacing alerts use these goals. Set them to match how you actually study — not a generic average.</div>
    <div style="display:flex;gap:7px;margin-bottom:16px">
      ${['fast','standard','thorough'].map(k=>{const p=HOUR_GOAL_PRESETS[k];const active=currentIntensity===k;return`<button type="button" onclick="applyHourGoalPreset('${k}',this)" style="flex:1;padding:9px 6px;border-radius:9px;border:2px solid ${active?'var(--ora)':'var(--bdr)'};background:${active?'var(--ora-bg)':'var(--surf2)'};cursor:pointer;text-align:center;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s">
        <div style="font-size:11px;font-weight:800;color:${active?'var(--ora)':'var(--txt)'};margin-bottom:2px">${p.label}</div>
        <div style="font-size:10px;color:var(--mut)">${p.tag}</div>
      </button>`;}).join('')}
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
      ${sections.map(s=>{const ex=EXAMS[s];const preset=HOUR_GOAL_PRESETS[currentIntensity]||HOUR_GOAL_PRESETS.standard;const fast=HOUR_GOAL_PRESETS.fast.goals[s]||ex.studyHours;const std=HOUR_GOAL_PRESETS.standard.goals[s]||ex.studyHours;const thorough=HOUR_GOAL_PRESETS.thorough.goals[s]||ex.studyHours;return`<div style="display:flex;align-items:center;gap:12px;padding:11px 13px;background:var(--surf2);border-radius:10px">
        <span class="badge badge-${s}" style="min-width:46px;justify-content:center;flex-shrink:0">${s}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;margin-bottom:2px">${ex.full.split(' ').slice(0,3).join(' ')}</div>
          <div style="font-size:10px;color:var(--mut)">Ambitious: ${fast}h · Standard: ${std}h · Thorough: ${thorough}h</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button onclick="adjustHourGoal('${s}',-5,this)" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--bdr);background:var(--surf);cursor:pointer;font-size:14px;font-weight:700;color:var(--sub)">−</button>
          <span id="hg-${s}" style="font-size:14px;font-weight:900;min-width:38px;text-align:center;color:var(--txt)">${getHourGoal(s)}h</span>
          <button onclick="adjustHourGoal('${s}',5,this)" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--bdr);background:var(--surf);cursor:pointer;font-size:14px;font-weight:700;color:var(--sub)">+</button>
        </div>
      </div>`;}).join('')}
    </div>
    <button onclick="saveHourGoals();this.closest('.modal-overlay').remove()" style="width:100%;padding:14px;background:var(--ora);color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer">Save Hour Goals</button>
  </div>`;
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.body.appendChild(el);
  // Store working copy in closure
  window._tempHourGoals={...(S.hourGoals||{})};
  S.sections.forEach(s=>{if(!window._tempHourGoals[s])window._tempHourGoals[s]=getHourGoal(s);});
}

function adjustHourGoal(section,delta,btn){
  if(!window._tempHourGoals)window._tempHourGoals={};
  const cur=window._tempHourGoals[section]||getHourGoal(section);
  const next=Math.max(50,Math.min(400,cur+delta));
  window._tempHourGoals[section]=next;
  const lbl=document.getElementById('hg-'+section);
  if(lbl)lbl.textContent=next+'h';
}

function applyHourGoalPreset(key,btn){
  const preset=HOUR_GOAL_PRESETS[key];
  if(!preset)return;
  S.studyIntensity=key;
  // Update buttons
  btn.parentElement.querySelectorAll('button').forEach((b,i)=>{
    const k=['fast','standard','thorough'][i];
    const active=k===key;
    b.style.borderColor=active?'var(--ora)':'var(--bdr)';
    b.style.background=active?'var(--ora-bg)':'var(--surf2)';
    b.querySelector('div').style.color=active?'var(--ora)':'var(--txt)';
  });
  // Apply preset values
  (S.sections||[]).forEach(s=>{
    const v=preset.goals[s]||EXAMS[s]?.studyHours||150;
    if(!window._tempHourGoals)window._tempHourGoals={};
    window._tempHourGoals[s]=v;
    const lbl=document.getElementById('hg-'+s);
    if(lbl)lbl.textContent=v+'h';
  });
}

function saveHourGoals(){
  if(!S)return;
  if(!S.hourGoals)S.hourGoals={};
  Object.assign(S.hourGoals,window._tempHourGoals||{});
  saveState();
  showToast('Hour goals saved','ok');
  renderTab();
}

function openPacingTipsModal(){
  const r=calcReadinessScore();
  let tips=[];
  r.breakdown.forEach(b=>{
    // Volume (max 25)
    if(b.volumePts<12) tips.push(`You're behind where you should be for <strong>${b.section}</strong> — log more sessions to close the gap`);
    else if(b.volumePts<20) tips.push(`<strong>${b.section}</strong> volume is building but you need to accelerate — you're behind your timeline target`);
    // Pacing (max 15)
    if(b.pacingPts<6) tips.push(`Your recent study pace isn't enough for <strong>${b.section}</strong> — hours per week are below what's needed. Study more or push your exam date`);
    else if(b.pacingPts<11) tips.push(`You're a bit tight on <strong>${b.section}</strong> pacing — adding 2-3 hrs/week builds a comfortable buffer`);
    // Practice (max 40) — most important signal
    if(!b.hasScores) tips.push(`No practice scores logged for <strong>${b.section}</strong> — this is 50 points locked. Log a Becker, Gleim, Wiley, or UWorld score to unlock the strongest readiness signal`);
    else if(b.practicePts<20) tips.push(`Your <strong>${b.section}</strong> practice scores are below the 75 passing threshold — log each attempt to track your trajectory`);
    else if(b.practicePts<32) tips.push(`You're getting close on <strong>${b.section}</strong> practice — aim for 75+ consistently before scheduling`);
    // Momentum (max 10)
    if(b.hasScores&&b.momentumPts<=1) tips.push(`Your <strong>${b.section}</strong> practice scores are trending down — review weak areas and log another attempt`);
    // Consistency (max 10)
    if(b.consistencyPts<5) tips.push(`${ico('flame')} Only ${activeDaysCount(b.section)} qualifying days in the last 14 — aim for at least 10 days with 30+ min sessions`);
    // Recency
    if(b.decayed&&b.logged&&b.decayed<b.logged*0.7) tips.push(`Most of your <strong>${b.section}</strong> hours were logged a long time ago — recent study counts more, so revisit the material`);
  });
  if(!tips.length) tips=['On pace — keep logging sessions and practice scores.'];

  const el=document.createElement('div');
  el.className='modal-overlay open';
  el.style.cssText='z-index:9999';
  el.innerHTML=`<div class="modal-box" style="max-width:580px;padding:28px" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="font-size:17px;font-weight:800">How Your Readiness Score Works</div>
      <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
    </div>
    <div style="font-size:13px;color:var(--sub);line-height:1.7;margin-bottom:16px">Your score (0–99) uses five signals. Practice test scores carry the most weight — they're the strongest real-world predictor of passing the CPA exam.</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
      ${[['pencil','Practice Scores (40pts)','Recency-weighted average of your Becker, Gleim, Wiley, or UWorld scores. 75 = CPA passing threshold = full credit. Scores from the last 30 days count fully; older scores decay gradually.'],
         ['lineChart','Momentum (10pts)','Is your practice score trending up? Improving scores signal real mastery. Flat = partial credit. Declining = investigate weak areas.'],
         ['book','Study Volume (25pts)','Hours logged vs. where you should be TODAY in your timeline. Recency-weighted — old sessions fade, recent sessions count more.'],
         ['calendar','Pacing (15pts)','Your actual hrs/week (last 28 days) vs. what you need to finish before exam day. Falls off smoothly if you fall behind.'],
         ['flame','Consistency (10pts)','Days with 30+ min sessions in the last 14 days. 10 qualifying days = full 10pts.']
      ].map(([i,t,d])=>`<div style="display:flex;gap:12px;align-items:flex-start">
        <div style="font-size:20px;flex-shrink:0">${ico(i)}</div>
        <div><div style="font-size:13px;font-weight:700">${t}</div><div style="font-size:11px;color:var(--mut)">${d}</div></div>
      </div>`).join('')}
    </div>
    <div style="font-size:12px;font-weight:700;margin-bottom:10px">What to work on:</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${tips.map(t=>`<div style="font-size:12px;color:var(--sub);background:var(--ora-bg);border:1px solid var(--ora-bdr);border-radius:8px;padding:10px 12px">${t}</div>`).join('')}
    </div>
  </div>`;
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.body.appendChild(el);
}
function activeDaysCount(section){
  const twoWeeksAgo=Date.now()-14*86400000;
  const days=new Set();
  (S.activities||[]).forEach(a=>{if(new Date(a.date).getTime()>twoWeeksAgo&&(a.hours||0)>=0.5)days.add(a.date.slice(0,10));});
  return days.size;
}

// ═══════════════════════════════════════════════
// PACING ALERT (behind alert banner)
// ═══════════════════════════════════════════════
function buildPacingAlert(){
  const behind=[];
  // Only alert for the current active section (one at a time)
  const s=getCurrentSection();
  const passed=new Set(S.sectionPassed||[]);
  if(!passed.has(s)){
    const ex=EXAMS[s];
    const logged=getSectionHours(s);
    const targetDate=S.examDates?.[s];
    if(targetDate){
      const daysLeft=Math.round((new Date(targetDate+' 00:00:00')-Date.now())/86400000);
      if(daysLeft>0){
        const weeksLeft=Math.max(0.5,daysLeft/7);
        const needed=Math.max(0,getHourGoal(s)-logged);
        const hrsPerWeek=needed/weeksLeft;
        const last28a=(S.activities||[]).filter(a=>Date.now()-new Date(a.date).getTime()<28*86400000);
        const actualPaceA=last28a.reduce((a,b)=>a+(b.hours||0),0)/4;
        const available=actualPaceA>0.5?actualPaceA:(S.hoursPerWeek||15);
        if(hrsPerWeek>available){
          const catchUpHrsToday=(hrsPerWeek/7).toFixed(1);
          behind.push({s,daysLeft,hrsPerWeek:hrsPerWeek.toFixed(1),catchUpHrsToday,needed:Math.round(needed),available:available.toFixed(1)});
        }
      }
    }
  }

  // Also check: hasn't studied in 2+ days with an upcoming exam
  const lastActivity=(S.activities||[]).slice(-1)[0];
  const daysSinceStudy=lastActivity?Math.round((Date.now()-new Date(lastActivity.date))/86400000):99;
  const hasUpcomingExam=(S.sections||[]).some(s=>S.examDates?.[s]&&new Date(S.examDates[s]+' 00:00:00')>Date.now());
  const inactiveAlert=daysSinceStudy>=2&&hasUpcomingExam;

  if(!behind.length&&!inactiveAlert) return '';

  const alerts=[];
  if(inactiveAlert&&daysSinceStudy>=2){
    alerts.push(`<div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:10px;margin-bottom:8px">
      <div style="font-size:18px;flex-shrink:0">${ico('alarm')}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:var(--amb)">You haven't studied in ${daysSinceStudy} days</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px">Every day away from the material makes it harder to retain. Even 30 minutes today keeps the streak alive.</div>
      </div>
      <button class="btn btn-sm" style="background:#b45309;color:#fff;border:none;flex-shrink:0;white-space:nowrap" onclick="openPostModal()">Log Session →</button>
    </div>`);
  }

  behind.forEach(b=>{
    alerts.push(`<div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.25);border-radius:10px;margin-bottom:8px">
      <div style="font-size:18px;flex-shrink:0">${ico('trendDown')}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:var(--red)"><span class="badge badge-${b.s}" style="margin-right:6px">${b.s}</span>${b.daysLeft} days to exam · ${b.needed}h still to cover</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px">At your current ${b.available}h/wk pace you won't make it. You need <strong>${b.hrsPerWeek}h/week</strong> — about <strong>${b.catchUpHrsToday}h/day</strong>. Either increase your hours or push your exam date.</div>
      </div>
      <button class="btn btn-sm" style="background:#ef4444;color:#fff;border:none;flex-shrink:0;white-space:nowrap" onclick="openSubTab('dashboard','exams',{scrollTo:'dash-pacing'})">Reschedule →</button>
    </div>`);
  });

  return`<div style="margin-bottom:20px">${alerts.join('')}</div>`;
}

// ═══════════════════════════════════════════════
// WEEKLY COMMITMENT CONTRACT
// ═══════════════════════════════════════════════
function buildWeeklyCommitment(){
  // Get start of this week (Monday)
  const now=new Date();
  const dayOfWeek=now.getDay()===0?6:now.getDay()-1; // 0=Mon
  const weekStart=new Date(Date.now()-dayOfWeek*86400000);
  weekStart.setHours(0,0,0,0);
  const weekKey=_ymd(weekStart);

  if(!S.commitments) S.commitments={};
  const commitment=S.commitments[weekKey];
  const weekHrsLogged=S.activities.filter(a=>new Date(a.date)>=weekStart).reduce((acc,a)=>acc+(a.hours||0),0);

  const curSec=getCurrentSection();
  const curEx=EXAMS[curSec];

  if(!commitment){
    // Show "set your commitment" prompt
    return`<div class="card card-pad" style="margin-bottom:20px;border:1px solid var(--ora-bdr);background:var(--ora-bg)">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="font-size:28px;flex-shrink:0">${ico('handshake')}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:800;margin-bottom:3px">Set Your <span class="badge badge-${curSec}" style="vertical-align:middle;margin:0 2px">${curSec}</span> Goal This Week</div>
          <div style="font-size:12px;color:var(--sub)">A weekly goal gives you something concrete to hit. How many hours of ${curEx?.full||curSec} this week?</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        ${[5,10,15,20,25].map(h=>`<button class="btn btn-ghost btn-sm" onclick="setWeeklyCommitment(${h})" style="flex:1;min-width:60px;justify-content:center">${h}h</button>`).join('')}
        <button class="btn btn-ghost btn-sm" onclick="setCustomCommitment()" style="flex:1;min-width:60px;justify-content:center">Custom</button>
      </div>
    </div>`;
  }

  const pct=Math.min(100,Math.round(weekHrsLogged/commitment*100));
  const remaining=Math.max(0,commitment-weekHrsLogged).toFixed(1);
  const daysLeftInWeek=7-dayOfWeek;
  const hrsPerDayNeeded=daysLeftInWeek>0?(parseFloat(remaining)/daysLeftInWeek).toFixed(1):'0';
  const met=weekHrsLogged>=commitment;

  return`<div class="card card-pad" style="margin-bottom:20px;${met?'border:1px solid var(--grn-bdr);background:var(--grn-bg)':'border:1px solid var(--ind-bdr);background:var(--ind-bg)'}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div>
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--mut)">This Week — <span class="badge badge-${curSec}" style="font-size:10px;vertical-align:middle">${curSec}</span></div>
        <div style="font-size:16px;font-weight:900;margin-top:2px">${met?'Weekly goal met':remaining+'h left to hit your '+commitment+'h goal'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:28px;font-weight:900;color:${met?'var(--grn)':'var(--ind)'};line-height:1">${pct}<span style="font-size:14px">%</span></div>
        <div style="font-size:10px;color:var(--mut)">${weekHrsLogged.toFixed(1)} / ${commitment}h</div>
      </div>
    </div>
    <div class="prog-bar" style="height:8px;margin-bottom:${met?'0':'10px'}">
      <div class="prog-fill" style="width:${pct}%;background:${met?'var(--grn)':'var(--ind)'}"></div>
    </div>
    ${!met?`<div style="font-size:11px;color:var(--sub)">${daysLeftInWeek} days left in week · needs <strong>${hrsPerDayNeeded}h/day</strong> to hit your commitment</div>`:''}
    <div style="margin-top:10px;display:flex;gap:8px">
      ${!met?`<button class="btn btn-primary btn-sm" onclick="openPostModal()" style="flex-shrink:0">+ Log Session</button>`:''}
      <button class="btn btn-ghost btn-sm" onclick="clearWeeklyCommitment('${weekKey}')" style="flex-shrink:0;margin-left:auto;color:var(--mut)">Change goal</button>
    </div>
  </div>`;
}

function setWeeklyCommitment(hrs){
  const now=new Date();
  const dayOfWeek=now.getDay()===0?6:now.getDay()-1;
  const weekStart=new Date(Date.now()-dayOfWeek*86400000);
  weekStart.setHours(0,0,0,0);
  const weekKey=_ymd(weekStart);
  if(!S.commitments) S.commitments={};
  S.commitments[weekKey]=hrs;
  saveState();
  switchTab('dashboard');
  showToast(`Weekly goal set: ${hrs}h`,'ok');
}

function setCustomCommitment(){
  const val=prompt('Enter your weekly hour goal (e.g. 12):');
  const hrs=parseFloat(val);
  if(!hrs||hrs<1||hrs>100){showToast('Enter a number between 1 and 100','err');return;}
  setWeeklyCommitment(Math.round(hrs*2)/2);
}

function clearWeeklyCommitment(weekKey){
  if(!S.commitments) return;
  delete S.commitments[weekKey];
  saveState();
  switchTab('dashboard');
}

// ═══════════════════════════════════════════════
// STRUGGLING SUPPORT MODAL
// ═══════════════════════════════════════════════
function openStrugglingModal(){
  const el=document.createElement('div');
  el.className='modal-overlay open';
  el.style.cssText='z-index:9999';
  const studyingNow=Math.max(1,(S.following||[]).filter(id=>id&&id.length>4).length);
  const quotes=[
    {q:"The CPA exam is the hardest thing I've ever done — but passing FAR at 4am is also the best feeling I've ever had.",a:"Passed candidate, Texas"},
    {q:"I failed REG twice. Third time I passed with an 87. Don't let a fail define your story.",a:"r/CPA community"},
    {q:"Every single person who passed the CPA exam felt exactly what you're feeling right now. Keep going.",a:"Another71 forum"},
    {q:"You're not studying for a grade. You're buying yourself freedom. Every hour is an investment.",a:"Ledger community"},
  ];
  const q=quotes[Math.floor(Math.random()*quotes.length)];
  const streak=getStreak();
  el.innerHTML=`<div class="modal-box" style="max-width:560px;padding:28px" onclick="event.stopPropagation()">
    <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
    <div style="text-align:center;padding:8px 0 20px">
      <div style="font-size:40px;margin-bottom:12px">${ico('bicep')}</div>
      <div style="font-size:20px;font-weight:900;margin-bottom:6px">You're Not Alone</div>
      <div style="font-size:13px;color:var(--sub);line-height:1.6">The CPA exam has a ~50% pass rate. Everyone who's passed felt exactly where you are now.</div>
    </div>
    <div style="background:var(--ora-bg);border:1px solid var(--ora-bdr);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:13px;color:var(--sub);line-height:1.7;font-style:italic">"${q.q}"</div>
      <div style="font-size:10px;color:var(--mut);margin-top:8px;font-weight:700">— ${q.a}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px">
      <div style="text-align:center;background:var(--surf2);border-radius:10px;padding:12px 8px">
        <div style="font-size:22px;font-weight:900;color:var(--ora)">${studyingNow+1}</div>
        <div style="font-size:10px;color:var(--mut)">people in your circle studying</div>
      </div>
      <div style="text-align:center;background:var(--surf2);border-radius:10px;padding:12px 8px">
        <div style="font-size:22px;font-weight:900;color:var(--ind)">${streak}</div>
        <div style="font-size:10px;color:var(--mut)">day streak — don't break it</div>
      </div>
      <div style="text-align:center;background:var(--surf2);border-radius:10px;padding:12px 8px">
        <div style="font-size:22px;font-weight:900;color:var(--grn)">${Math.round(getTotalHours())}</div>
        <div style="font-size:10px;color:var(--mut)">hours already invested</div>
      </div>
    </div>
    <div style="font-size:13px;font-weight:700;margin-bottom:10px">What do you need right now?</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start;gap:12px" onclick="this.closest('.modal-overlay').remove();openPostModal()">
        <span style="font-size:18px">${ico('timer')}</span> Log a short session — even 25 minutes counts
      </button>
      <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start;gap:12px" onclick="this.closest('.modal-overlay').remove();switchTab('explore')">
        <span style="font-size:18px">${ico('users')}</span> See who else is grinding right now
      </button>
      <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start;gap:12px" onclick="this.closest('.modal-overlay').remove();openSubTab('studylab','coach')">
        <span style="font-size:18px;line-height:1">${LedgerBuddy.face(22,{still:true})}</span> Ask Ledger for a personalized game plan
      </button>
      <button class="btn btn-ghost" style="text-align:left;justify-content:flex-start;gap:12px" onclick="this.closest('.modal-overlay').remove();openSupportModal()">
        <span style="font-size:18px">${ico('chat')}</span> Talk to support — we actually read these
      </button>
    </div>
  </div>`;
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.body.appendChild(el);
}

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
// ── Section tabs ─────────────────────────────────────────────────────────────
// Dashboard, Study Lab and Explore each split into a few tabs along the top
// (instead of stacking folds and cards on one long page). The open tab is kept
// in the URL (#dashboard/exams) so a reload or the back button lands there.
const SUBTABS={
  dashboard:[
    {id:'overview',label:'Overview',icon:'lineChart'},
    {id:'exams',label:'Exams',icon:'calendarCheck'},
    {id:'scores',label:'Scores',icon:'target'},
    {id:'calendar',label:'Calendar',icon:'calendarDays'},
  ],
  studylab:[
    {id:'qbank',label:'Question Bank',icon:'clipboard'},
    {id:'tools',label:'Study Tools',icon:'bolt'},
    {id:'coach',label:'Ledger',icon:'chat'},
  ],
  explore:[
    {id:'people',label:'People',icon:'users'},
    {id:'rooms',label:'Rooms',icon:'timer'},
    {id:'clubs',label:'Clubs',icon:'chat'},
    {id:'goals',label:'Goals',icon:'target'},
  ],
};
const _subTab={dashboard:'overview',studylab:'qbank',explore:'people'};
function _curSub(page){
  const list=SUBTABS[page]; if(!list) return '';
  if(!list.some(t=>t.id===_subTab[page])) _subTab[page]=list[0].id;
  return _subTab[page];
}
function _hashFor(tab){
  if(!tab||tab==='today') return '';
  const list=SUBTABS[tab];
  return '#'+tab+(list&&_subTab[tab]&&_subTab[tab]!==list[0].id?'/'+_subTab[tab]:'');
}
// Optional per-tab extras: a live dot or a count next to the label.
function _subTabExtra(page,id){
  try{
    if(page==='explore'&&id==='rooms'){
      const now=Date.now();
      const live=(typeof _roomsCache!=='undefined'?_roomsCache:[]).filter(r=>r.lastActive&&now-r.lastActive<ROOM_FRESH_MS).length;
      return (live||(typeof _room!=='undefined'&&_room))?'<span class="subtab-live" title="Rooms open now"></span>':'';
    }
    if(page==='explore'&&id==='people'){
      const n=(S.followRequests||[]).length; return n?`<span class="subtab-badge" title="Follow requests">${n}</span>`:'';
    }
    if(page==='dashboard'&&id==='exams'){
      const due=(S.sections||[]).filter(s=>{const k=examStage(s).k;return k==='checkin'||k==='examday'||(k==='awaiting'&&examStage(s).days!==null&&examStage(s).days<=0);}).length;
      return due?`<span class="subtab-badge" title="Needs an update">${due}</span>`:'';
    }
  }catch(e){}
  return '';
}
function _subTabsHTML(page){
  const cur=_curSub(page);
  return `<div class="subtabs" role="tablist" aria-label="${page==='dashboard'?'Dashboard':page==='studylab'?'Study Lab':'Explore'} sections" data-page="${page}" onkeydown="_subTabKey(event,'${page}')">${
    SUBTABS[page].map(t=>{const on=t.id===cur;return `<button type="button" class="subtab" role="tab" id="subtab-${page}-${t.id}" data-subtab="${page}:${t.id}" aria-selected="${on}" aria-controls="subpanel-${page}" tabindex="${on?0:-1}" onclick="openSubTab('${page}','${t.id}')"><span class="subtab-ico" aria-hidden="true">${ico(t.icon)}</span>${t.label}${_subTabExtra(page,t.id)}</button>`;}).join('')
  }</div>`;
}
function _subPanel(page,body){
  return `<div class="subpanel" role="tabpanel" id="subpanel-${page}" aria-labelledby="subtab-${page}-${_curSub(page)}">${body}</div>`;
}
// Arrow keys / Home / End move between tabs, like a native tab strip.
function _subTabKey(e,page){
  const keys={ArrowRight:1,ArrowLeft:-1,Home:'first',End:'last'};
  if(!(e.key in keys)) return;
  e.preventDefault();
  const list=SUBTABS[page], i=list.findIndex(t=>t.id===_curSub(page));
  const k=keys[e.key];
  const n=k==='first'?0:k==='last'?list.length-1:(i+k+list.length)%list.length;
  openSubTab(page,list[n].id,{focus:true});
}
function openSubTab(page,id,opts){
  opts=opts||{};
  if(!SUBTABS[page]||!SUBTABS[page].some(t=>t.id===id)) return;
  const changed=_subTab[page]!==id;
  _subTab[page]=id;
  if(page==='studylab') _studyLabTab=id;
  if(currentTab!==page){ switchTab(page); }
  else if(changed){
    try{const h=_hashFor(page);if((location.hash||'')!==h)history.replaceState(history.state,'',location.pathname+location.search+h);}catch(e){}
    // If the tab strip has scrolled off the top, bring it back so the new tab starts at its top.
    const bar=document.querySelector('.subtabs[data-page="'+page+'"]');
    const barTop=bar?bar.getBoundingClientRect().top:0;
    renderTab();
    if(barTop<0) document.querySelector('.subtabs[data-page="'+page+'"]')?.scrollIntoView({block:'start'});
  }
  if(opts.focus) document.getElementById('subtab-'+page+'-'+id)?.focus();
  if(opts.scrollTo) setTimeout(()=>document.getElementById(opts.scrollTo)?.scrollIntoView({behavior:'smooth',block:'start'}),80);
}

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
function buildDashboard(){
  const sub=_curSub('dashboard');
  const body=sub==='exams'?_dashExams():sub==='scores'?_dashScores():sub==='calendar'?_dashCalendar():_dashOverview();
  return `<div style="max-width:880px;margin:0 auto">
    <div class="page-head dash-heading">
      <div style="min-width:0">
        <h1>${_getGreeting()}, ${esc(S.name||'')}.</h1>
        <p>${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
      </div>
      <div class="dash-heading-actions" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex-shrink:0">
        <button onclick="openLogResultModal()" style="display:flex;align-items:center;gap:6px;background:var(--ora);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">Log Result</button>
        <button onclick="openStrugglingModal()" style="display:flex;align-items:center;gap:6px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:8px 14px;font-size:12px;font-weight:600;color:var(--sub);cursor:pointer;white-space:nowrap">Stuck?</button>
      </div>
    </div>
    ${_subTabsHTML('dashboard')}
    ${_subPanel('dashboard',body)}
  </div>`;
}

// Supportive (never competitive) line: how many people you follow studied this week.
function _buildDashSocialLine(){
  const wk=Date.now()-7*86400000;
  const active=(REAL_USERS||[]).filter(f=>(f&&f.activities||[]).some(a=>{const t=new Date(a&&a.date).getTime();return isFinite(t)&&t>wk;})).length;
  if(active>0){
    return`<div onclick="switchTab('feed')" style="display:flex;align-items:center;gap:8px;margin:12px 2px 0;font-size:12px;color:var(--mut);cursor:pointer"><span style="width:7px;height:7px;border-radius:50%;background:var(--grn);box-shadow:0 0 0 3px var(--grn-bg);flex-shrink:0"></span><span>${active} study partner${active!==1?'s':''} ${active!==1?'were':'was'} active this week — you're not grinding alone.</span></div>`;
  }
  return`<div onclick="switchTab('explore')" style="display:flex;align-items:center;gap:8px;margin:12px 2px 0;font-size:12px;color:var(--mut);cursor:pointer"><span style="width:7px;height:7px;border-radius:50%;background:var(--bdr2);flex-shrink:0"></span><span>Studying solo? <span style="color:var(--ind);font-weight:600">Find a study partner →</span> Accountability makes a real difference.</span></div>`;
}

// Merged "This Week" card: weekly pacing chart + the weekly-commitment feature in one.
function _buildWeekThisCard(){
  const now=new Date();
  const dayOfWeek=now.getDay()===0?6:now.getDay()-1;
  const weekStart=new Date(Date.now()-dayOfWeek*86400000);weekStart.setHours(0,0,0,0);
  const weekKey=_ymd(weekStart);
  if(!S.commitments)S.commitments={};
  const commitment=S.commitments[weekKey];
  const weekHrs=getWeekHours();
  const weekGoal=S.hoursPerWeek||15;
  const target=commitment||weekGoal;
  const pct=Math.min(100,Math.round(weekHrs/Math.max(1,target)*100));
  const met=weekHrs>=target;
  const today=todayStr();
  const last7=[];
  for(let i=6;i>=0;i--){const d=_ymd(new Date(Date.now()-i*86400000));const hrs=S.activities.filter(a=>a.date.slice(0,10)===d).reduce((a,b)=>a+(b.hours||0),0);last7.push({d,hrs,isToday:d===today,day:new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'})});}
  const maxHrs=Math.max(...last7.map(d=>d.hrs),1);
  const bars=last7.map(d=>`<div class="week-bar-wrap"><div class="week-bar${d.isToday?' today-bar':''}" style="height:${Math.max(4,Math.round(d.hrs/maxHrs*88))}px" title="${d.hrs}h"></div><div class="week-day-lbl">${d.day.slice(0,2)}</div></div>`).join('');
  const col=pct>=100?'var(--grn)':pct>=70?'var(--amb)':'var(--ind)';
  const commitRow=commitment
    ?`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--bdr)"><div style="font-size:11px;color:var(--sub)">${met?'Goal crushed this week!':'Committed to '+commitment+'h this week'}</div><button onclick="clearWeeklyCommitment('${weekKey}')" style="background:none;border:none;color:var(--mut);font-size:11px;font-weight:600;cursor:pointer">Change goal</button></div>`
    :`<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--bdr)"><div style="font-size:11px;color:var(--mut);margin-bottom:7px">Commit to a weekly goal to stay on track</div><div style="display:flex;gap:6px;flex-wrap:wrap">${[10,15,20,25].map(h=>`<button onclick="setWeeklyCommitment(${h})" style="flex:1;min-width:52px;padding:6px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);font-size:12px;font-weight:700;color:var(--sub);cursor:pointer">${h}h</button>`).join('')}<button onclick="setCustomCommitment()" style="flex:1;min-width:52px;padding:6px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);font-size:12px;font-weight:700;color:var(--sub);cursor:pointer">Custom</button></div></div>`;
  return`<div class="card card-pad" style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><div class="section-title" style="margin-bottom:2px">This Week</div><div style="font-size:12px;color:var(--mut)">${weekHrs.toFixed(1)} of ${target} hrs${commitment?' · your commitment':' · weekly goal'}</div></div>
      <div style="font-size:30px;font-weight:900;line-height:1;color:${col};font-family:var(--font-display)">${pct}<span style="font-size:15px;font-weight:700;opacity:.6">%</span></div>
    </div>
    <div class="prog-bar" style="height:9px;margin:12px 0 6px"><div class="prog-fill" style="width:${pct}%;background:${col}"></div></div>
    <div class="week-chart">${bars}</div>
    <div style="font-size:10px;color:var(--mut);text-align:center">Last 7 days · <span style="color:var(--ind)">■</span> = today</div>
    ${commitRow}
  </div>`;
}

// Overview: how ready you are, and how you've been studying.
function _dashOverview(){
  const totalHrs=getTotalHours();
  const weekHrs=getWeekHours();
  const streak=getStreak();
  const passed=(S.sectionPassed||[]).length;
  const secCount=(S.sections||[]).length||4;
  const stat=(v,l,c,border)=>`<div style="flex:1;min-width:0;padding:14px 16px;${border?'border-right:1px solid var(--bdr);':''}"><div style="font-size:24px;font-weight:700;font-family:var(--font-display);line-height:1;letter-spacing:-.01em;color:${c};white-space:nowrap">${v}</div><div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-top:5px">${l}</div></div>`;
  const statStrip=`<div class="dash-stats" style="display:flex;background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px">
    ${stat(Math.round(totalHrs),'Total Hours','var(--ora)',1)}
    ${stat(weekHrs.toFixed(1)+'h','This Week','var(--ind)',1)}
    ${stat((streak>1?''+ico('flame')+' ':'')+streak,'Day Streak','#d97706',1)}
    ${stat(passed+'/'+secCount,'Passed','var(--grn)',0)}
  </div>`;
  return `
    <div>${buildCountdownAlerts()}${buildPacingAlert()}${buildBurnoutCheckIn()}${buildStreakRecovery()}</div>
    ${buildReadinessCard()}
    ${statStrip}
    ${_buildWeekThisCard()}
    <div class="card card-pad" style="margin-bottom:16px">
      <div class="section-title" style="margin-bottom:2px">Study heat map</div>
      <div style="font-size:12px;color:var(--mut);margin-bottom:12px">When and how much you study, by day</div>
      <div id="heat-map-card">${buildHeatMap()}</div>
    </div>
    ${buildAdvancedAnalytics()}
    ${_buildDashSocialLine()}`;
}

// Exams: where each section stands, the pace you need, and the exam-day checklist.
function _dashExams(){
  return `
    ${buildExamJourney()||`<div class="card card-pad" style="margin-bottom:16px;text-align:center;color:var(--sub);font-size:13px">Add the sections you're taking in Settings to track your exams here.</div>`}
    <div class="card card-pad" id="dash-pacing" style="margin-bottom:16px">
      <div class="section-title" style="margin-bottom:2px">Exam pacing</div>
      <div style="font-size:12px;color:var(--mut);margin-bottom:12px">Hours logged against each section's goal, and the weekly pace your exam date needs</div>
      ${_buildPacingCardsHTML()}
    </div>
    ${buildExamDayProtocolCard(true)}`;
}

// Scores: practice exam results, the strongest single sign you're ready.
function _dashScores(){
  return `
    <div id="score-tracker-card" class="card card-pad" style="margin-bottom:16px">
      <div class="section-title" style="margin-bottom:2px">Practice exam scores</div>
      <div style="font-size:12px;color:var(--mut);margin-bottom:14px;line-height:1.5">Log full-length mock exams from Becker, Gleim, Wiley, UWorld or Roger. Scoring 75+ again and again is the strongest sign you're ready, so these count the most in your Readiness score.</div>
      ${buildScoreTracker()}
    </div>`;
}

// Calendar: every day you've logged, month by month.
let _calOffset=0;
function _dashCalendar(){
  return `<div class="card card-pad" style="margin-bottom:16px" id="dash-cal">${buildCalendar(_calOffset)}</div>`;
}
function _calStep(d){
  _calOffset=Math.max(-36,Math.min(12,_calOffset+d));
  const el=document.getElementById('dash-cal');
  if(el) el.innerHTML=buildCalendar(_calOffset);
}
function _openScoreTracker(){ openSubTab('dashboard','scores',{scrollTo:'score-tracker-card'}); }

// Per-section pacing rows (rings, progress, pace message, target date, status, retake info).
// Lives inside the "Exam Pacing" fold on the single-canvas dashboard.
function _buildPacingCardsHTML(){
  const pacingCards=(S.sections||[]).map(s=>{
    const ex=EXAMS[s];
    const logged=getSectionHours(s);
    const pct=Math.min(100,Math.round(logged/getHourGoal(s)*100));
    const targetDate=S.examDates?.[s];
    const status=S.sectionStatus?.[s]||'planned';
    const passed=(S.sectionPassed||[]).includes(s);
    let paceMsg='';let paceClass='';
    if(targetDate&&!passed){
      const daysLeft=Math.round((new Date(targetDate+' 00:00:00')-Date.now())/86400000);
      const weeksLeft=Math.max(0.5,daysLeft/7);
      const needed=Math.max(0,getHourGoal(s)-logged);
      const hrsPerWeek=(needed/weeksLeft).toFixed(1);
      const available=S.hoursPerWeek||15;
      if(daysLeft<0){paceMsg='Exam date passed';paceClass='behind';}
      else if(parseFloat(hrsPerWeek)>available){paceMsg=`Need ${hrsPerWeek}h/wk — behind (you have ${available}h/wk)`;paceClass='behind';}
      else if(parseFloat(hrsPerWeek)<available*0.75){paceMsg=`${hrsPerWeek}h/wk needed — comfortable pace`;paceClass='on-pace';}
      else{paceMsg=`${hrsPerWeek}h/wk needed — tight but doable`;paceClass='ahead';}
    } else if(passed){paceMsg='Passed!';}
    else{paceMsg='Add a target date to see your pace';}
    if(!passed&&(S.examSits||{})[s]){const _st=S.examSits[s];paceMsg='Sat '+_fmtDay(_st.sitDate,{month:'short',day:'numeric'})+' · score expected '+_fmtDay(_st.expectedRelease,{month:'short',day:'numeric'});paceClass='on-pace';}

    const lastResult=getLastExamResult(s);
    const isRetake=lastResult&&!lastResult.passed;
    let retakeInfo='';
    if(isRetake){
      const hrsSinceSit=Math.round(getSectionHoursSinceSit(s));
      const adjustedGoal=Math.max(20,getHourGoal(s)-hrsSinceSit);
      let ntsMsg='';
      if(lastResult.ntsExpiry){
        const ntsMs=new Date(lastResult.ntsExpiry+' 00:00:00')-Date.now();
        const ntsDays=Math.round(ntsMs/86400000);
        ntsMsg=ntsDays<0?' · NTS may have expired':ntsDays===0?' · NTS expires today':` · ${ntsDays}d on NTS`;
      } else {ntsMsg=' · Enter NTS expiry for countdown';}
      retakeInfo=`<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">
        <span style="background:#ef444422;color:#ef4444;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px">↺ Retake</span>
        <span style="font-size:10px;color:var(--mut)">${hrsSinceSit}h logged since last sit · goal: ${adjustedGoal}h more${ntsMsg}</span>
      </div>`;
    }

    return`<div class="pacing-card" style="flex-wrap:wrap">
      <div style="width:44px;height:44px;flex-shrink:0">
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--bdr2)" stroke-width="4"/>
          <circle cx="22" cy="22" r="18" fill="none" stroke="${ex.color}" stroke-width="4" stroke-dasharray="${2*Math.PI*18}" stroke-dashoffset="${2*Math.PI*18*(1-pct/100)}" stroke-linecap="round" transform="rotate(-90 22 22)"/>
          <text x="22" y="26" text-anchor="middle" font-size="9" font-weight="800" fill="${ex.color}">${pct}%</text>
        </svg>
      </div>
      <div class="pc-bar-wrap" style="flex:1;min-width:0">
        <div class="pc-name">
          <span><span class="badge badge-${s}" style="margin-right:5px">${s}</span>${ex.full}</span>
          <span style="font-size:11px;color:var(--mut);font-weight:400">${logged}/${getHourGoal(s)}h</span>
        </div>
        <div class="prog-bar" style="margin:4px 0"><div class="prog-fill" style="width:${pct}%;background:${ex.color}"></div></div>
        <div class="pc-pace ${paceClass}">${paceMsg}</div>
        ${retakeInfo}
      </div>
      <div class="pc-right">
        <div class="pc-right-label" style="font-size:10px;color:var(--mut)">Exam Date</div>
        <div style="display:inline-flex;align-items:center;gap:4px">
          <div style="position:relative;display:inline-flex;align-items:center;gap:4px;background:var(--surf2);border:1px solid var(--bdr);border-radius:7px;padding:4px 8px;cursor:pointer" title="Click to change exam date">
            <span style="font-size:12px;font-weight:700;color:${targetDate?'var(--txt)':'var(--mut)'};pointer-events:none;white-space:nowrap">${targetDate?new Date(targetDate+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Set date'}</span>
            <span style="font-size:11px;color:var(--mut);pointer-events:none">✎</span>
            <input type="date" value="${targetDate||''}" onchange="setPacingTargetDate('${s}',this.value)" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%">
          </div>
          ${targetDate?`<button onclick="setPacingTargetDate('${s}','')" title="Remove date" style="width:18px;height:18px;border-radius:50%;border:1px solid var(--bdr);background:var(--surf2);color:var(--mut);font-size:11px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0">×</button>`:''}
        </div>
        <select onchange="updateSectionStatus('${s}',this.value)" style="margin-top:6px;padding:3px 6px;background:var(--surf2);border:1px solid var(--bdr);border-radius:6px;color:var(--sub);font-size:10px;outline:none;cursor:pointer">
          <option value="planned"${status==='planned'?' selected':''}>Planned</option>
          <option value="studying"${status==='studying'?' selected':''}>Studying</option>
          <option value="passed"${(S.sectionPassed||[]).includes(s)?' selected':''}>Passed ✓</option>
        </select>
        ${!passed?`<div class="pc-log-btn"><button onclick="openLogResultModal('${s}')" style="margin-top:5px;padding:3px 8px;background:var(--surf2);border:1px solid var(--bdr);border-radius:6px;color:var(--sub);font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap">Log Result</button></div>`:''}
      </div>
    </div>`;
  }).join('');

  return pacingCards||'<div style="font-size:12px;color:var(--mut);text-align:center;padding:8px 0">No sections yet — add one in onboarding.</div>';
}

function buildCalendar(offset){
  offset=offset||0;
  const now=new Date();
  const base=new Date(now.getFullYear(),now.getMonth()+offset,1);
  const yr=base.getFullYear();
  const mo=base.getMonth();
  const first=new Date(yr,mo,1);
  const last=new Date(yr,mo+1,0);
  const startDow=first.getDay();
  const today=todayStr();

  // Build log map
  const logMap={};
  (S.activities||[]).forEach(a=>{
    const d=a.date.slice(0,10);
    if(!logMap[d])logMap[d]=[];
    logMap[d].push(a);
  });

  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  let cells='';
  const dows=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  cells+=dows.map(d=>`<div class="cal-dow">${d}</div>`).join('');
  for(let i=0;i<startDow;i++)cells+=`<div class="cal-day other-month"><div class="cal-day-num">${new Date(yr,mo,1-startDow+i).getDate()}</div></div>`;
  for(let d=1;d<=last.getDate();d++){
    const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isT=ds===today;
    const logs=logMap[ds]||[];
    const examToday=Object.entries(S.examDates||{}).find(([,v])=>v===ds);
    cells+=`<div class="cal-day${isT?' is-today':''}" onclick="openDayLog('${ds}')">
      <div class="cal-day-num">${d}</div>
      ${examToday?`<div class="cal-pill" style="background:${EXAMS[examToday[0]].color}">${examToday[0]}</div>`:''}
      ${logs.slice(0,2).map(a=>`<div class="cal-pill" style="background:${EXAMS[a.section]?.color||'#4f46e5'}">✓ ${a.section} ${a.hours}h</div>`).join('')}
    </div>`;
  }
  const trail=(7-(startDow+last.getDate())%7)%7;
  for(let i=1;i<=trail;i++)cells+=`<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
  const monthKey=`${yr}-${String(mo+1).padStart(2,'0')}`;
  const monthActs=(S.activities||[]).filter(a=>String(a.date).slice(0,7)===monthKey);
  const monthHrs=monthActs.reduce((t,a)=>t+(a.hours||0),0);
  const monthDays=new Set(monthActs.map(a=>String(a.date).slice(0,10))).size;
  const exams=Object.entries(S.examDates||{}).filter(([,v])=>String(v).slice(0,7)===monthKey);
  return`<div class="cal-nav">
      <button onclick="_calStep(-1)" aria-label="Previous month">‹</button>
      <div style="text-align:center"><div style="font-size:15px;font-weight:800">${months[mo]} ${yr}</div><div style="font-size:11px;color:var(--mut);margin-top:2px">${offset?'<button onclick="_calStep('+(-offset)+')" style="width:auto;height:auto;border:none;background:none;color:var(--ind);font-size:11px;font-weight:700;padding:0;cursor:pointer">Back to this month</button>':'Tap a day to see or add sessions'}</div></div>
      <button onclick="_calStep(1)" aria-label="Next month"${offset>=12?' disabled':''}>›</button>
    </div>
    <div class="cal-grid">${cells}</div>
    <div class="cal-sum">
      <span><b>${(+monthHrs.toFixed(1))}</b>hours</span>
      <span><b>${monthDays}</b>day${monthDays!==1?'s':''} studied</span>
      <span><b>${monthActs.length}</b>session${monthActs.length!==1?'s':''}</span>
      ${exams.length?`<span>${exams.map(([k,v])=>`<span class="badge badge-${k}">${k}</span> ${_fmtDay(v,{month:'short',day:'numeric'})}`).join(' · ')}</span>`:''}
    </div>`;
}

