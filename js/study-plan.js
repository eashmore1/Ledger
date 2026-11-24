// ═══════════════════════════════════════════════
// ADVANCED ANALYTICS
// ═══════════════════════════════════════════════
function buildAdvancedAnalytics() {
  if (!isElite()) {
    return '<div class="card card-pad pro-lock-wrap" style="margin-bottom:16px">' +
      '<div class="section-title">Analytics</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;opacity:.3;pointer-events:none;user-select:none">' +
        '<div class="stat-box"><div class="stat-val" style="color:var(--ind)">—</div><div class="stat-lbl">Best Study Day</div></div>' +
        '<div class="stat-box"><div class="stat-val" style="color:var(--grn)">—</div><div class="stat-lbl">Avg Session</div></div>' +
        '<div class="stat-box"><div class="stat-val" style="color:var(--amb)">—</div><div class="stat-lbl">Peak Hour</div></div>' +
      '</div>' +
      eliteLockHTML('Advanced Analytics', 'Unlock Pro') +
    '</div>';
  }

  const acts = S.activities || [];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Best day of week
  const dayTotals = [0,0,0,0,0,0,0];
  const dayCounts = [0,0,0,0,0,0,0];
  acts.forEach(function(a) {
    const d = new Date(a.date+'T12:00:00').getDay();
    dayTotals[d] += (a.hours||0);
    dayCounts[d]++;
  });
  const dayAvgs = dayTotals.map(function(t,i){ return dayCounts[i]>0?t/dayCounts[i]:0; });
  const bestDayIdx = dayAvgs.indexOf(Math.max.apply(null, dayAvgs));
  const bestDay = acts.length > 0 ? days[bestDayIdx] : '—';

  // Avg session length
  const avgSession = acts.length > 0 ? (acts.reduce(function(s,a){ return s+(a.hours||0); },0)/acts.length).toFixed(1) : '—';

  // Section breakdown by time (last 30 days)
  const thirtyAgo = new Date(Date.now()-30*86400000);
  const recentActs = acts.filter(function(a){ return new Date(a.date)>=thirtyAgo; });
  const secTotals = {};
  recentActs.forEach(function(a){ secTotals[a.section]=(secTotals[a.section]||0)+(a.hours||0); });
  const totalSec = Object.values(secTotals).reduce(function(s,v){ return s+v; },0)||1;

  const sectionBars = Object.entries(secTotals).sort(function(a,b){ return b[1]-a[1]; }).map(function(e) {
    const pct = Math.round(e[1]/totalSec*100);
    const sec = e[0];
    const color = (window.EXAMS&&window.EXAMS[sec]) ? EXAMS[sec].color : '#6366f1';
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
      '<span class="badge badge-' + sec + '" style="min-width:38px;text-align:center">' + sec + '</span>' +
      '<div style="flex:1;background:var(--surf2);border-radius:4px;height:10px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:4px;transition:width .5s"></div>' +
      '</div>' +
      '<span style="font-size:11px;font-weight:700;color:var(--sub);min-width:32px;text-align:right">' + e[1].toFixed(1) + 'h</span>' +
    '</div>';
  }).join('');

  // Day-of-week bar chart
  const maxDayAvg = Math.max.apply(null, dayAvgs.concat([0.1]));
  const dowBars = dayAvgs.map(function(avg, i) {
    const h = Math.max(4, Math.round(avg/maxDayAvg*48));
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px">' +
      '<div style="width:24px;height:' + h + 'px;background:' + (i===bestDayIdx?'var(--ind)':'var(--bdr2)') + ';border-radius:4px;transition:height .4s"></div>' +
      '<div style="font-size:10px;color:var(--mut);font-weight:600">' + days[i].slice(0,1) + '</div>' +
    '</div>';
  }).join('');

  return '<div class="card card-pad" style="margin-bottom:16px">' +
    '<div class="section-title">Analytics</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">' +
      '<div class="stat-box" style="border-top:3px solid var(--ind)"><div class="stat-val" style="color:var(--ind)">' + bestDay + '</div><div class="stat-lbl">Best Study Day</div></div>' +
      '<div class="stat-box" style="border-top:3px solid var(--grn)"><div class="stat-val" style="color:var(--grn)">' + avgSession + 'h</div><div class="stat-lbl">Avg Session</div></div>' +
      '<div class="stat-box" style="border-top:3px solid var(--amb)"><div class="stat-val" style="color:var(--amb)">' + acts.length + '</div><div class="stat-lbl">Total Sessions</div></div>' +
    '</div>' +
    '<div style="margin-bottom:14px">' +
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:10px">Avg Hours by Day of Week</div>' +
      '<div style="display:flex;gap:6px;align-items:flex-end;height:60px">' + dowBars + '</div>' +
    '</div>' +
    (sectionBars ? '<div>' +
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:10px">Section Focus (Last 30 Days)</div>' +
      sectionBars +
    '</div>' : '') +
  '</div>';
}

// ═══════════════════════════════════════════════
// AI PERSONALIZED STUDY PLAN (Pro)
// + BASIC SCHEDULE (Pro/Free)
// ═══════════════════════════════════════════════

// Activity modes — what type of work to do each day.
// We deliberately do NOT specify topics — that comes from the user's
// Becker / Gleim / Roger / Wiley material. We tell them HOW to study
// and WHICH section needs attention most, based on actual progress data.
const ACTIVITY_MODES = {
  new_material:{
    label:'New Material',icon:'book',color:'#4f46e5',
    desc:'Follow your study material (Becker/Gleim/etc.) — pick up wherever you left off.',
    tips:[
      'Don\'t rush chapters just to feel productive. Comprehension > volume.',
      'Write down 3 things you learned at the end of the session.',
      'Watch lecture video first, then do the chapter MCQs while it\'s fresh.',
    ],
  },
  mcq_practice:{
    label:'MCQ Practice',icon:'bolt',color:'#d44000',
    desc:'Drill 40–60 MCQs from your study platform. Review every wrong answer fully.',
    tips:[
      'Speed is a skill — volume builds pattern recognition. Don\'t just check answers.',
      'Missed an MCQ? Read the full explanation, not just the correct answer.',
      'Group similar wrong answers — patterns reveal your actual weak spots.',
    ],
  },
  tbs_practice:{
    label:'TBS Practice',icon:'target',color:'#059669',
    desc:'Work through task-based simulations in your study platform. Read the requirement before the data.',
    tips:[
      'TBS points are often easier than they look — don\'t skip them on exam day.',
      'Allocate 10–15 min per sim. If you\'re stuck, move on and come back.',
      'Partial credit exists. Always attempt every simulation, even if unsure.',
    ],
  },
  mock_exam:{
    label:'Mock Exam',icon:'pencil',color:'#9333ea',
    desc:'Full timed practice exam. Exam conditions — no phone, no notes, no breaks.',
    tips:[
      'Simulate the real thing. Your score today shows exactly what needs work.',
      'Don\'t grade yourself mid-exam. Complete it fully first.',
      'After: analyze wrong answers by category to find patterns.',
    ],
  },
  final_review:{
    label:'Final Review',icon:'magnifier',color:'#dc2626',
    desc:'Hit your weakest MCQ categories and highest-tested topics only.',
    tips:[
      'Don\'t try to learn new material this close to exam day.',
      'Mnemonics, flashcards, quick-fire MCQs — retention mode only.',
      'Sleep > cramming the night before. Seriously.',
    ],
  },
  course:{
    label:'Course Units',icon:'book',color:'#4f46e5',
    desc:'Work through the units scheduled for today in your review course: lectures first, then that unit\'s MCQs and simulations.',
    tips:[
      'Finish a unit\'s MCQs before moving on. That\'s where the lecture actually sticks.',
      'Ahead of schedule? Check the unit off and the rest of the plan spreads out.',
      'Missed a day? Don\'t double up blindly. Check off what you finished and the plan re-paces.',
    ],
  },
  rest:{
    label:'Rest Day',icon:'bed',color:'var(--mut)',
    desc:'Scheduled rest. Recovery is part of the plan.',
    tips:['Rest is productive. Your brain consolidates memory during sleep.'],
  },
};

// ── REVIEW COURSE UNITS (Becker and others) ──────────────────────────────────
// Review courses don't share progress, so the student tells Ledger how many
// units their course has for a section and checks them off as they finish.
// Progress lives on S.courseProgress[sec] = {course, units, done:[unit numbers]}
// (outside the plan) so rebuilding the plan never loses check-offs. The plan
// spreads the units that are left across its study days, weighted by hours.
const PLAN_COURSES=['becker','uworld','gleim','surgent','wiley','ninja'];
// Units per section in Becker's current course, from Becker's LiveOnline page
// (core sections 6 units, BAR 5, ISC and TCP 4). Prefilled, always editable,
// since older Becker versions had more (FAR used to run F1–F9 or F10).
const COURSE_UNIT_DEFAULTS={becker:{AUD:6,FAR:6,REG:6,BAR:5,ISC:4,TCP:4}};
function _defaultUnits(course,sec){
  return (COURSE_UNIT_DEFAULTS[course]&&COURSE_UNIT_DEFAULTS[course][sec])||'';
}

function _courseFor(sec){
  const cp=S.courseProgress&&S.courseProgress[sec];
  return cp&&cp.course&&cp.units>0?cp:null;
}
function _courseLabel(cp){
  return (cp&&typeof courseName==='function'&&courseName(cp.course))||'Course';
}
function _unitsLeft(cp){
  if(!cp) return [];
  const done=new Set(cp.done||[]);
  const out=[];
  for(let u=1;u<=cp.units;u++) if(!done.has(u)) out.push(u);
  return out;
}
// "Unit 4", "Units 4–5", "Units 4, 6"
function _unitsText(units){
  if(!units||!units.length) return '';
  if(units.length===1) return 'Unit '+units[0];
  const contiguous=units.every((u,i)=>i===0||u===units[i-1]+1);
  return 'Units '+(contiguous?units[0]+'–'+units[units.length-1]:units.join(', '));
}
// Short form for calendar cells: "U4", "U4–5"
function _unitsShort(units){
  if(!units||!units.length) return '';
  return 'U'+units[0]+(units.length>1?'–'+units[units.length-1]:'');
}
// Mode label for a plan day: "Becker Unit 4" on course days, else the mode name.
function _planDayModeLabel(plan,day){
  const m=ACTIVITY_MODES[day.mode]||ACTIVITY_MODES.new_material;
  if(day.mode==='course'&&day.units&&day.units.length){
    return _courseLabel(_courseFor(plan.primarySec))+' '+_unitsText(day.units);
  }
  return m.label;
}
function _planDayDesc(plan,day){
  const m=ACTIVITY_MODES[day.mode]||ACTIVITY_MODES.new_material;
  if(day.mode==='course'&&day.units&&day.units.length){
    return 'Work through '+_courseLabel(_courseFor(plan.primarySec))+' '+plan.primarySec+' '+_unitsText(day.units)+': lectures first, then the unit\'s MCQs and simulations. Check a unit off when you finish it.';
  }
  if(day.mode==='course') return 'Course units are done. Use today to redo missed MCQs from your weakest units.';
  return m.desc;
}

// Spread the units still left over the upcoming study days before review
// starts. Past days keep what they had, so the calendar stays a true record.
function _assignCourseUnits(plan){
  if(!plan||!Array.isArray(plan.days)) return;
  const cp=_courseFor(plan.primarySec);
  const today=_ymd(new Date());
  plan.coursePacedOn=today;
  plan.courseOverflow=0;
  const future=plan.days.filter(d=>d.date>=today);
  future.forEach(d=>{ delete d.units; });
  if(!cp||!plan.learnEnd) return;
  const left=_unitsLeft(cp);
  const slots=future.filter(d=>d.isStudy&&!d.blocked&&d.date<plan.learnEnd&&d.mode==='course');
  if(!left.length) return;
  if(!slots.length){ plan.courseOverflow=left.length; return; }
  const total=slots.reduce((s,d)=>s+(d.hours||1),0)||slots.length;
  const per=total/left.length; // hours per unit
  let c=0;
  slots.forEach(d=>{
    const a=c, b=c+(d.hours||1);
    c=b;
    const first=Math.floor(a/per+1e-9);
    const last=Math.min(left.length-1,Math.max(first,Math.ceil(b/per-1e-9)-1));
    d.units=left.slice(first,last+1);
  });
}

// Units per week needed from today to finish before review starts.
function _coursePace(plan){
  const cp=_courseFor(plan.primarySec);
  if(!cp||!plan.learnEnd) return null;
  const today=_ymd(new Date());
  const left=_unitsLeft(cp).length;
  const daysToReview=Math.max(0,Math.round((new Date(plan.learnEnd+'T12:00:00')-new Date(today+'T12:00:00'))/86400000));
  const perWeek=daysToReview>0?left/daysToReview*7:null;
  return {cp,left,done:cp.units-left,daysToReview,perWeek};
}

// This calendar week's units (Sun–Sat), from the plan.
function _courseUnitsThisWeek(plan){
  const now=new Date(); now.setHours(0,0,0,0);
  const start=new Date(now); start.setDate(now.getDate()-now.getDay());
  const end=new Date(start); end.setDate(start.getDate()+6);
  const s=_ymd(start), e=_ymd(end), today=_ymd(now);
  const set=new Set();
  plan.days.forEach(d=>{ if(d.date>=s&&d.date<=e&&d.date>=today&&d.units) d.units.forEach(u=>set.add(u)); });
  return [...set].sort((a,b)=>a-b);
}

function toggleCourseUnit(sec,n){
  const cp=_courseFor(sec); if(!cp) return;
  cp.done=cp.done||[];
  const i=cp.done.indexOf(n);
  const finishing=i<0;
  if(finishing) cp.done.push(n); else cp.done.splice(i,1);
  cp.done.sort((a,b)=>a-b);
  const plan=S.aiStudyPlan;
  if(plan&&plan.primarySec===sec) _assignCourseUnits(plan);
  saveState();
  const modalDate=document.getElementById('plan-day-modal')?.dataset.date;
  if(currentTab==='plan') renderTab();
  if(modalDate) openPlanDayDetail(modalDate);
  const left=_unitsLeft(cp).length;
  if(finishing){
    showToast(left?'Unit '+n+' done · '+left+' to go':'All '+cp.units+' '+_courseLabel(cp)+' units done. On to review!','ok');
    if(!left) burstConfetti(document.body);
  } else showToast('Unit '+n+' marked not done','ok');
}

// "Mark Unit 4 finished" buttons for a plan day's units.
function _unitButtonsHTML(plan,day){
  const cp=_courseFor(plan.primarySec);
  if(!cp||!day||!day.units||!day.units.length) return '';
  const done=new Set(cp.done||[]);
  return `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">${day.units.map(u=>done.has(u)
    ?`<button onclick="toggleCourseUnit('${plan.primarySec}',${u})" style="width:100%;padding:9px;background:#10b98118;border:1.5px solid #10b98155;border-radius:10px;font-size:12px;font-weight:700;color:var(--grn);cursor:pointer">✓ Unit ${u} finished</button>`
    :`<button onclick="toggleCourseUnit('${plan.primarySec}',${u})" style="width:100%;padding:9px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;font-size:12px;font-weight:700;color:var(--txt);cursor:pointer">Finished Unit ${u}</button>`).join('')}</div>`;
}

// Sidebar card: course progress, this week's units, pace, and a unit grid.
function _courseProgressCard(plan){
  const pace=_coursePace(plan);
  if(!pace) return '';
  const {cp,left,done}=pace;
  const cName=_courseLabel(cp);
  const ex=EXAMS[plan.primarySec]||{color:'var(--ind)'};
  const pct=Math.round(done/cp.units*100);
  const week=_courseUnitsThisWeek(plan);
  const doneSet=new Set(cp.done||[]);
  const reviewOn=new Date(plan.learnEnd+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
  let paceLine;
  if(!left) paceLine=`<span style="color:var(--grn);font-weight:700">Course finished.</span> The rest of the plan is review.`;
  else if(plan.courseOverflow) paceLine=`<span style="color:#ef4444;font-weight:700">Review time has started with ${left} unit${left!==1?'s':''} left.</span> Finish them first, or move your exam date and rebuild.`;
  else{
    const pw=pace.perWeek||left;
    const behind=plan.courseStartPace&&pw>plan.courseStartPace*1.15;
    const every=Math.round(7/pw);
    const pwTxt=pw>=1.05?(Math.round(pw*10)/10)+' units a week':every<=7?'about 1 unit a week':'about 1 unit every '+every+' days';
    paceLine=`${left} left · ${pwTxt} to finish by ${reviewOn}${behind?` <span style="color:var(--amb);font-weight:700">· a bit behind your starting pace</span>`:''}`;
  }
  const cells=[];
  for(let u=1;u<=cp.units;u++){
    const on=doneSet.has(u), wk=week.includes(u);
    cells.push(`<button onclick="toggleCourseUnit('${plan.primarySec}',${u})" aria-pressed="${on}" aria-label="Unit ${u}${on?', finished':''}" style="height:30px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;border:1.5px solid ${on?ex.color:wk?ex.color+'88':'var(--bdr)'};background:${on?ex.color:wk?ex.color+'14':'var(--surf2)'};color:${on?'#fff':wk?ex.color:'var(--mut)'}">${on?'✓':u}</button>`);
  }
  return `<div class="card card-pad" style="margin-bottom:14px">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--mut)">${esc(cName)} ${plan.primarySec}</div>
      <div style="font-size:11px;font-weight:700;color:var(--sub)">${done}/${cp.units} units</div>
    </div>
    <div style="height:6px;background:var(--surf2);border-radius:4px;overflow:hidden;margin-bottom:10px"><div style="height:6px;background:${ex.color};border-radius:4px;width:${pct}%"></div></div>
    ${week.length&&left?`<div style="font-size:13px;font-weight:800;color:var(--txt);margin-bottom:4px">This week: ${_unitsText(week)}</div>`:''}
    <div style="font-size:11px;color:var(--sub);line-height:1.5;margin-bottom:12px">${paceLine}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(34px,1fr));gap:5px">${cells.join('')}</div>
    <div style="font-size:10px;color:var(--mut);margin-top:10px;line-height:1.5">Tap a unit when you finish it in ${esc(cName)}. The plan re-paces the rest.</div>
  </div>`;
}

// The course most of this person's tagged sessions came from, if any.
function _mostUsedCourse(){
  const counts={};
  (S.activities||[]).forEach(a=>{ if(a&&PLAN_COURSES.includes(a.course)) counts[a.course]=(counts[a.course]||0)+1; });
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  return top?top[0]:'';
}

function _getPlanTip(mode){
  const m=ACTIVITY_MODES[mode]||ACTIVITY_MODES.new_material;
  return m.tips[Math.floor(Math.random()*m.tips.length)];
}

// Returns sections ranked by urgency (most behind = highest priority)
function _sectionPriority(activeSections){
  return activeSections.slice().sort((a,b)=>{
    const urgA=(EXAMS[a]?.studyHours||150-getSectionHours(a))/(EXAMS[a]?.studyHours||150);
    const urgB=(EXAMS[b]?.studyHours||150-getSectionHours(b))/(EXAMS[b]?.studyHours||150);
    return urgB-urgA; // highest urgency first
  });
}

function generateAIPlan(settings){
  if(!isElite()) return;
  settings=settings||_planSettings||{};

  // Single-section focus — users study one test at a time
  const primarySec=settings.section||getCurrentSection()||'FAR';
  const examDate=settings.examDate||(S.examDates?.[primarySec]||null);
  if(!examDate){showToast('Set an exam date first','err');return;}

  const daysLeft=Math.max(7,Math.min(Math.ceil((new Date(examDate+' 00:00')-Date.now())/86400000),120));
  const planDays=daysLeft;
  const dailyHrs=settings.dailyHrs||Math.max(1.5,Math.min(8,(S.hoursPerWeek||15)/6));
  const studyStyle=settings.studyStyle||'balanced';
  const studyDays=settings.studyDays||[1,2,3,4,5,6]; // array of dow (0=Sun)
  const longDays=settings.longDays||[]; // days with extended hours (~1.6x)

  const logged=getSectionHours(primarySec);
  const target=EXAMS[primarySec]?.studyHours||150;
  const pctComplete=Math.min(100,Math.round(logged/target*100));
  const sectionStats={};
  sectionStats[primarySec]={logged,target,pct:pctComplete,remaining:Math.max(0,target-logged)};

  // Phase ratios based on study style + time available
  let phases=[];
  if(planDays>=28){
    let r1,r2,r3;
    if(studyStyle==='mcq_heavy'){r1=0.30;r2=0.75;r3=0.90;}
    else if(studyStyle==='tbs_heavy'){r1=0.45;r2=0.68;r3=0.90;}
    else{r1=0.38;r2=0.70;r3=0.88;} // balanced
    const p1=Math.floor(planDays*r1),p2=Math.floor(planDays*r2),p3=Math.floor(planDays*r3);
    phases=[
      {n:1,mode:'new_material',name:'Phase 1 — Foundation',icon:'book',start:1,end:p1,focus:'Work through '+primarySec+' reading material. Build the conceptual base before drilling questions.',color:'#4f46e5'},
      {n:2,mode:'mcq_practice',name:'Phase 2 — MCQ Drill',icon:'bolt',start:p1+1,end:p2,focus:'High-volume practice questions. Aim for 40–60 MCQs per session. Review every wrong answer.',color:'#d44000'},
      {n:3,mode:'tbs_practice',name:'Phase 3 — Simulations',icon:'target',start:p2+1,end:p3,focus:'Task-based simulations and weak-area targeting. Use Becker/Gleim diagnostic results to guide focus.',color:'#059669'},
      {n:4,mode:'final_review',name:'Phase 4 — Final Sprint',icon:'rocket',start:p3+1,end:planDays,focus:'Mock exams under timed conditions. Only high-yield review. Protect your sleep.',color:'#9333ea'},
    ];
  } else if(planDays>=14){
    const p1=Math.floor(planDays*(studyStyle==='mcq_heavy'?0.45:0.55));
    phases=[
      {n:1,mode:'mcq_practice',name:'Phase 1 — MCQ Blitz',icon:'bolt',start:1,end:p1,focus:'Rapid-fire practice questions to identify weak areas. 50+ MCQs per session.',color:'#d44000'},
      {n:2,mode:'final_review',name:'Phase 2 — Final Sprint',icon:'rocket',start:p1+1,end:planDays,focus:'Targeted TBS practice, a mock exam, and final-week mental prep.',color:'#9333ea'},
    ];
  } else {
    phases=[{n:1,mode:'final_review',name:'Exam Crunch',icon:'flame',start:1,end:planDays,focus:'High-yield MCQs and key TBS only. No new material. Stay sharp and rested.',color:'#ef4444'}];
  }

  // Following a review course: finish its units first, then review. The course
  // already mixes lectures, MCQs and sims inside each unit, so those don't get
  // phases of their own. Review gets ~15% of the time (more when time is short).
  const cp=_courseFor(primarySec);
  const courseLeft=_unitsLeft(cp).length;
  let learnEndDay=0;
  if(cp&&courseLeft>0&&planDays>=5){
    const cName=_courseLabel(cp);
    const reviewDays=planDays>=28?Math.max(7,Math.round(planDays*0.15))
      :planDays>=14?Math.max(4,Math.round(planDays*0.3))
      :Math.max(2,Math.round(planDays*0.35));
    learnEndDay=planDays-reviewDays;
    phases=[
      {n:1,mode:'course',name:'Phase 1 — '+cName+' units',icon:'book',start:1,end:learnEndDay,focus:'Finish your remaining '+courseLeft+' '+cName+' '+primarySec+' unit'+(courseLeft!==1?'s':'')+'. Each day says which unit to work on.',color:'#4f46e5'},
      {n:2,mode:'final_review',name:'Phase 2 — Final Review',icon:'rocket',start:learnEndDay+1,end:planDays,focus:'Course finished. Mock exams, your weakest areas, and '+cName+' Final Review if you have it. Protect your sleep.',color:'#9333ea'},
    ];
  }

  // Sprint alternating modes for final phase
  const sprintModes=['mock_exam','final_review','mcq_practice','final_review','mock_exam','tbs_practice'];

  const today=new Date();today.setHours(0,0,0,0);
  const days=[];
  let studyDayNum=0;

  for(let i=0;i<planDays;i++){
    const dt=new Date(today);dt.setDate(today.getDate()+i);
    const dow=dt.getDay();
    const isStudy=studyDays.includes(dow);
    const dateStr=_ymd(dt);
    const dayNum=i+1;
    const phase=phases.find(p=>dayNum>=p.start&&dayNum<=p.end)||phases[phases.length-1];

    let hrs=0,mode=phase.mode;
    const isLongDay=longDays.includes(dow);
    if(isStudy){
      // Ramp toward exam: start slightly lighter, peak in final sprint
      const progress=dayNum/planDays;
      const ramp=progress<0.5?0.9+progress*0.2:1.0+Math.max(0,(progress-0.75)*0.5);
      const baseHrs=dailyHrs*ramp;
      const longMultiplier=isLongDay?1.6:1.0;
      hrs=Math.min(8,Math.max(1,parseFloat((baseHrs*longMultiplier).toFixed(1))));

      // Final sprint: alternate modes
      if(phase.n===phases[phases.length-1].n&&phases.length>1){
        mode=sprintModes[studyDayNum%sprintModes.length];
      }
      studyDayNum++;
    }

    // baseHours / isStudyBase are the immutable "intended" values — blocked-day
    // rebalancing redistributes against these so repeated edits never drift.
    days.push({dayNum,date:dateStr,section:primarySec,mode,hours:hrs,baseHours:hrs,phase:phase.n,phaseColor:phase.color,isStudy,isStudyBase:isStudy,isLong:isStudy&&isLongDay,blocked:false,done:false});
  }

  S.aiStudyPlan={
    generated:new Date().toISOString(),
    primarySec,
    examDate,
    daysLeft:planDays,
    studyStyle,
    studyDays,
    longDays,
    dailyHrs,
    sectionStats,
    phases,
    days,
    blockedDates:[],
    timeOff:[],
  };
  if(learnEndDay){
    // First day of review; course units are scheduled on study days before it.
    const t=new Date(today); t.setDate(today.getDate()+learnEndDay);
    S.aiStudyPlan.learnEnd=_ymd(t);
    S.aiStudyPlan.course=cp.course;
    _assignCourseUnits(S.aiStudyPlan);
    const pace=_coursePace(S.aiStudyPlan);
    S.aiStudyPlan.courseStartPace=pace&&pace.perWeek;
  }
  saveState();
}

// ── BLOCKED DAYS (Step 3) — life happens; adapt the plan, don't break it ──────
// Redistributes the study hours from blocked/upcoming days across the remaining
// available study days so the user never falls "behind" — the plan flexes to fit
// real life instead of forcing a restart.
// Full set of blocked dates = single-day toggles + every day inside a labeled
// time-off range ("Vacation at the beach", etc.).
function _planBlockedSet(plan){
  const set=new Set(plan.blockedDates||[]);
  (plan.timeOff||[]).forEach(t=>{
    if(!t.start) return;
    const end=t.end||t.start;
    let d=new Date(t.start+'T12:00:00'); const e=new Date(end+'T12:00:00');
    let guard=0;
    while(d<=e && guard<400){ set.add(_ymd(d)); d.setDate(d.getDate()+1); guard++; }
  });
  return set;
}
// The labeled time-off range (if any) covering a given date.
function _planDayLabel(plan,dateStr){
  const t=(plan.timeOff||[]).find(t=>{const e=t.end||t.start;return t.start&&dateStr>=t.start&&dateStr<=e;});
  return t?(t.label||'Time off'):'';
}

function rebalanceStudyPlan(){
  const plan=S.aiStudyPlan; if(!plan) return;
  const blocked=_planBlockedSet(plan);
  const todayStr=_ymd(new Date());
  const baseH=d=>(d.baseHours!=null?d.baseHours:d.hours)||0;
  const isBase=d=>(d.isStudyBase!=null?d.isStudyBase:d.isStudy);

  // Hours pool to preserve = every upcoming study-weekday's intended hours
  // (including the blocked ones — those are what we redistribute).
  let poolHours=0;
  plan.days.forEach(d=>{ if(d.date>=todayStr && isBase(d)) poolHours+=baseH(d); });

  // Recipients = upcoming study weekdays that are NOT blocked.
  const recip=plan.days.filter(d=>d.date>=todayStr && isBase(d) && !blocked.has(d.date));
  const totalWeight=recip.reduce((s,d)=>s+baseH(d),0)||recip.length||1;

  plan.days.forEach(d=>{
    if(d.date<todayStr) return; // the past is fixed
    if(blocked.has(d.date)){ d.blocked=true; d.isStudy=false; d.hours=0; return; }
    d.blocked=false;
    if(!isBase(d)){ d.isStudy=false; d.hours=0; return; } // genuine rest weekday
    d.isStudy=true;
    const w=totalWeight?baseH(d)/totalWeight:1/recip.length;
    d.hours=Math.min(8,Math.max(1,parseFloat((poolHours*w).toFixed(1))));
  });
  _assignCourseUnits(plan);
  plan.rebalancedAt=Date.now();
  saveState();
}

function toggleBlockDay(dateStr){
  const plan=S.aiStudyPlan; if(!plan) return;
  plan.blockedDates=plan.blockedDates||[];
  const i=plan.blockedDates.indexOf(dateStr);
  const blocking=i<0;
  if(blocking) plan.blockedDates.push(dateStr);
  else plan.blockedDates.splice(i,1);

  rebalanceStudyPlan();
  document.getElementById('plan-day-modal')?.remove();
  if(currentTab==='plan') renderTab();

  // Honest feedback about what just happened to the plan.
  const todayStr=_ymd(new Date());
  const blockedNow=_planBlockedSet(plan);
  const recip=plan.days.filter(d=>d.date>=todayStr && (d.isStudyBase!=null?d.isStudyBase:d.isStudy) && !blockedNow.has(d.date));
  const maxed=recip.length && recip.every(d=>d.hours>=8);
  if(blocking){
    showToast(maxed
      ? "Day off saved — remaining days are near max. Consider a later exam date."
      : "Day off saved — those hours moved to your other days",'ok');
  } else {
    showToast('Day reopened — plan rebalanced','ok');
  }
}

// ── LABELED TIME OFF (Step 3.5) — block a range like a real calendar ──────────
function closeTimeOffModal(){
  document.getElementById('timeoff-modal')?.classList.remove('open');
}
function openTimeOffModal(){
  const plan=S.aiStudyPlan; if(!plan) return;
  const today=_ymd(new Date());
  let el=document.getElementById('timeoff-modal');
  if(!el){
    el=document.createElement('div');
    el.id='timeoff-modal';
    el.className='modal-overlay';
    el.addEventListener('click',e=>{if(e.target===el)closeTimeOffModal();});
    document.body.appendChild(el);
  }
  const ranges=(plan.timeOff||[]).slice().sort((a,b)=>(a.start||'').localeCompare(b.start||''));
  const fmt=ds=>new Date(ds+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const existing=ranges.length?`<div style="margin-top:18px;border-top:1px solid var(--bdr);padding-top:14px">
    <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-bottom:10px">Your time off</div>
    ${ranges.map(t=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--surf2);border-radius:10px;margin-bottom:8px">
      <span style="font-size:16px;flex-shrink:0">${ico('plane')}</span>
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(t.label||'Time off').replace(/</g,'&lt;')}</div>
      <div style="font-size:11px;color:var(--mut)">${fmt(t.start)}${(t.end&&t.end!==t.start)?' – '+fmt(t.end):''}</div></div>
      <button onclick="removeTimeOff('${t.id}')" style="background:transparent;border:1px solid var(--bdr);border-radius:8px;color:var(--mut);width:28px;height:28px;cursor:pointer;flex-shrink:0;font-size:14px">×</button>
    </div>`).join('')}
  </div>`:'';
  el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:440px;overflow:hidden">
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-size:17px;font-weight:900;letter-spacing:-.02em">Add time off</div>
        <button onclick="closeTimeOffModal()" style="width:30px;height:30px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer;font-size:18px;color:var(--sub)">×</button>
      </div>
      <div style="font-size:12px;color:var(--sub);line-height:1.5;margin-bottom:16px">Block out vacation, work crunch, or any days you can't study. Your plan reshuffles those hours across the rest of your schedule.</div>
      <label style="display:block;font-size:11px;font-weight:700;color:var(--sub);margin-bottom:6px">What's the occasion?</label>
      <input id="timeoff-label" type="text" placeholder="e.g. Vacation at the beach" maxlength="60" style="width:100%;box-sizing:border-box;padding:10px 12px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:13px;outline:none;margin-bottom:14px">
      <div style="display:flex;gap:10px;margin-bottom:4px">
        <div style="flex:1">
          <label style="display:block;font-size:11px;font-weight:700;color:var(--sub);margin-bottom:6px">From</label>
          <input id="timeoff-start" type="date" min="${today}" value="${today}" onchange="if(document.getElementById('timeoff-end').value<this.value)document.getElementById('timeoff-end').value=this.value;document.getElementById('timeoff-end').min=this.value" style="width:100%;box-sizing:border-box;padding:9px 10px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:13px;outline:none">
        </div>
        <div style="flex:1">
          <label style="display:block;font-size:11px;font-weight:700;color:var(--sub);margin-bottom:6px">To</label>
          <input id="timeoff-end" type="date" min="${today}" value="${today}" style="width:100%;box-sizing:border-box;padding:9px 10px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:13px;outline:none">
        </div>
      </div>
      <button onclick="saveTimeOff()" style="width:100%;margin-top:16px;padding:13px;background:var(--ind);color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:800;cursor:pointer">Add to my plan</button>
      ${existing}
    </div>
  </div>`;
  el.classList.add('open');
}

function saveTimeOff(){
  const plan=S.aiStudyPlan; if(!plan) return;
  const start=(document.getElementById('timeoff-start')||{}).value||'';
  let end=(document.getElementById('timeoff-end')||{}).value||start;
  const label=((document.getElementById('timeoff-label')||{}).value||'').trim()||'Time off';
  if(!start){ showToast('Pick a start date','err'); return; }
  if(end<start) end=start;
  plan.timeOff=plan.timeOff||[];
  plan.timeOff.push({id:'to_'+Date.now(), start, end, label});
  rebalanceStudyPlan();
  closeTimeOffModal();
  if(currentTab==='plan') renderTab();
  showToast('Time off added — your plan adapted around it','ok');
}

function removeTimeOff(id){
  const plan=S.aiStudyPlan; if(!plan) return;
  plan.timeOff=(plan.timeOff||[]).filter(t=>t.id!==id);
  rebalanceStudyPlan();
  closeTimeOffModal();
  document.getElementById('plan-day-modal')?.remove();
  if(currentTab==='plan') renderTab();
  showToast('Time off removed — plan rebalanced','ok');
}

// ═══════════════════════════════════════════════════════════════════
// STUDY PLAN TAB — full calendar view
// ═══════════════════════════════════════════════════════════════════
let _planViewMonth=null; // {year,month}
let _planGenerating=false;
let _planSettings=null; // customization before generating

function buildStudyPlanTab(){
  if(!isElite()) return _buildPlanGate();
  if(_planGenerating) return _buildPlanLoading();
  const plan=S.aiStudyPlan;
  if(!plan) return _buildPlanSetup();
  // New day: re-spread the units still left from today forward.
  if(plan.learnEnd&&plan.coursePacedOn!==_ymd(new Date())){ _assignCourseUnits(plan); saveState(); }
  return _buildPlanCalendar(plan);
}

function _buildPlanGate(){
  const feats=[
    ['calendar','Day-by-day calendar','See exactly what to study every day from now to exam day'],
    ['timer','Hours planned per day','No guessing — your daily study block is laid out for you'],
    ['target','Phase-based roadmap','Foundation → MCQ Drill → Mock Exams → Final Sprint'],
    ['barChart','Built from your data','Uses your exam date, logged hours, and weekly capacity'],
    ['checkCircle','Track execution','Mark days done. See your completion rate build toward 100%'],
    ['refresh','Regenerate anytime','Change your exam date? Rebuild the plan in 2 seconds'],
  ];
  return`<div style="max-width:800px;margin:0 auto;padding:40px 20px;text-align:center">
    <div style="font-size:56px;margin-bottom:18px">${ico('calendarDays')}</div>
    <div style="font-size:28px;font-weight:900;letter-spacing:-.04em;margin-bottom:10px">AI Study Plan</div>
    <div style="font-size:14px;color:var(--sub);max-width:440px;margin:0 auto 28px;line-height:1.7">A personalized day-by-day calendar built around your exam date. Know exactly what to study each day — no guesswork.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:660px;margin:0 auto 32px;text-align:left">
      ${feats.map(([icon,title,desc])=>`<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:14px;padding:16px">
        <div style="font-size:26px;margin-bottom:8px">${ico(icon)}</div>
        <div style="font-size:12px;font-weight:800;margin-bottom:4px;color:var(--txt)">${title}</div>
        <div style="font-size:11px;color:var(--mut);line-height:1.5">${desc}</div>
      </div>`).join('')}
    </div>
    <button onclick="openUpgradeModal('AI Study Plan')" style="padding:14px 40px;background:var(--ora);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 18px rgba(147,51,234,.35)">Unlock Pro — Get Your Plan</button>
    <div style="font-size:11px;color:var(--mut);margin-top:12px">Included with Pro ($14/mo) · Also unlocks Ledger (your AI coach), analytics &amp; the unlimited question bank</div>
  </div>`;
}

function _buildPlanLoading(){
  const msgs=['Analyzing your exam date…','Calculating study phases…','Mapping your daily schedule…','Tuning hours to your capacity…','Finalizing your day-by-day plan…'];
  const msg=msgs[Math.floor(Math.random()*msgs.length)];
  return`<div style="max-width:500px;margin:100px auto;text-align:center;padding:0 20px">
    <div style="margin-bottom:18px">${LedgerBuddy('think',120)}</div>
    <div style="font-size:22px;font-weight:900;letter-spacing:-.03em;margin-bottom:10px">Building your plan…</div>
    <div style="font-size:14px;color:var(--sub);margin-bottom:32px;line-height:1.7">${msg}</div>
    <div style="background:var(--surf2);border-radius:100px;height:6px;overflow:hidden;max-width:300px;margin:0 auto">
      <div style="height:6px;background:linear-gradient(90deg,var(--ora),#b03500);border-radius:100px;animation:plan-progress 2.4s ease-in-out forwards"></div>
    </div>
  </div>
  <style>
    @keyframes plan-progress{0%{width:0%}60%{width:75%}90%{width:92%}100%{width:100%}}
  </style>`;
}

function _buildPlanSetup(){
  const availableSections=(S.sections||[]).filter(s=>!(S.sectionPassed||[]).includes(s));
  const allSections=availableSections.length?availableSections:(S.sections||['FAR']);
  // Default to section with nearest exam date, or first section
  let defaultSec=allSections[0];
  let nearestDays=Infinity;
  allSections.forEach(s=>{
    const d=S.examDates?.[s];
    if(d){const dl=Math.ceil((new Date(d+' 00:00')-Date.now())/86400000);if(dl>0&&dl<nearestDays){nearestDays=dl;defaultSec=s;}}
  });
  const storedSettings=_planSettings||{};
  const selectedSec=storedSettings.section||defaultSec;
  const examDate=storedSettings.examDate||(S.examDates?.[selectedSec]||'');
  const weeklyHrs=storedSettings.weeklyHrs||(S.hoursPerWeek||15);
  const studyStyle=storedSettings.studyStyle||'balanced';
  const studyDays=storedSettings.studyDays||[1,2,3,4,5,6]; // Mon-Sat default
  const longDays=storedSettings.longDays||[]; // subset of studyDays for extended sessions
  const ex=EXAMS[selectedSec]||{color:'var(--ora)',full:selectedSec};

  const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayToggles=dayNames.map((d,i)=>`<button onclick="_planToggleDay(${i})" id="plan-day-${i}" style="width:38px;height:38px;border-radius:50%;border:2px solid ${studyDays.includes(i)?ex.color:'var(--bdr)'};background:${studyDays.includes(i)?ex.color:'var(--surf2)'};color:${studyDays.includes(i)?'#fff':'var(--mut)'};font-size:11px;font-weight:700;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s">${d.slice(0,2)}</button>`).join('');
  // Long day toggles — only show study days
  const longDayToggles=dayNames.map((d,i)=>{
    if(!studyDays.includes(i)) return '';
    const isLong=longDays.includes(i);
    return`<button onclick="_planToggleLongDay(${i})" id="plan-long-${i}" style="display:flex;flex-direction:column;align-items:center;gap:2px;width:52px;padding:8px 4px;border-radius:10px;border:2px solid ${isLong?'#f97316':'var(--bdr)'};background:${isLong?'#f9731614':'var(--surf2)'};color:${isLong?'#f97316':'var(--mut)'};font-size:11px;font-weight:700;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s">
      <span style="font-size:14px">${isLong?ico('flame'):ico('cloud')}</span>
      <span>${d.slice(0,2)}</span>
    </button>`;
  }).join('');

  const styleOptions=[
    {id:'mcq_heavy',label:'MCQ Heavy',icon:'bolt',desc:'More practice questions — great if you have limited time'},
    {id:'balanced',label:'Balanced',icon:'scales',desc:'Equal mix of reading, MCQs, and simulations'},
    {id:'tbs_heavy',label:'Sim Heavy',icon:'target',desc:'More task-based simulations — great for technical sections'},
  ];

  const daysLeft=examDate?Math.max(0,Math.ceil((new Date(examDate+' 00:00')-Date.now())/86400000)):null;
  const canGenerate=!!examDate&&daysLeft>0;

  // Review course: which one, how many units, how many already finished.
  const savedCp=(S.courseProgress&&S.courseProgress[selectedSec])||null;
  const course=storedSettings.course!=null?storedSettings.course:(savedCp?savedCp.course:_mostUsedCourse());
  const units=storedSettings.units!=null?storedSettings.units:((savedCp&&savedCp.units)||_defaultUnits(course,selectedSec));
  const isDefaultUnits=!!units&&units===_defaultUnits(course,selectedSec)&&!(savedCp&&savedCp.units);
  const unitsDone=storedSettings.unitsDone!=null?storedSettings.unitsDone:(savedCp?(savedCp.done||[]).length:0);
  const cName=course?courseName(course):'';
  const courseChips=[...PLAN_COURSES.map(id=>({id,name:courseName(id)})),{id:'',name:'None'}].map(o=>{
    const on=o.id===course;
    return `<button onclick="_planSelectCourse('${o.id}')" aria-pressed="${on}" style="padding:8px 14px;border-radius:20px;border:2px solid ${on?ex.color:'var(--bdr)'};background:${on?ex.color+'14':'var(--surf2)'};color:${on?ex.color:'var(--sub)'};font-size:12px;font-weight:700;cursor:pointer">${o.name}</button>`;
  }).join('');
  const numStyle='width:76px;padding:9px 10px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:14px;font-weight:700;outline:none';
  const courseCard=`<div class="card card-pad" style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:800;margin-bottom:4px">Which review course are you using?</div>
      <div style="font-size:11px;color:var(--mut);margin-bottom:14px">Ledger schedules your course unit by unit, so each day tells you which unit to work on.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${courseChips}</div>
      ${course?`<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:16px">
        <div>
          <label for="plan-units" style="display:block;font-size:11px;font-weight:700;color:var(--sub);margin-bottom:6px">Units in your ${esc(cName)} ${selectedSec} course</label>
          <input id="plan-units" type="number" inputmode="numeric" min="1" max="60" placeholder="e.g. 10" value="${units||''}" oninput="_planUpdateSettings()" style="${numStyle}">
        </div>
        <div>
          <label for="plan-units-done" style="display:block;font-size:11px;font-weight:700;color:var(--sub);margin-bottom:6px">Units already finished</label>
          <input id="plan-units-done" type="number" inputmode="numeric" min="0" max="60" value="${unitsDone||0}" oninput="_planUpdateSettings()" style="${numStyle}">
        </div>
      </div>
      <div style="font-size:11px;color:var(--mut);margin-top:10px;line-height:1.5">${isDefaultUnits?`Becker's current ${selectedSec} course has ${units} units. If yours shows a different number, change it here.`:`Count the units listed for ${selectedSec} in your ${esc(cName)} course. Leave it blank and the plan schedules by study type instead.`}</div>`:''}
    </div>`;

  return`<div style="max-width:680px;margin:0 auto;padding:20px 0">
    <div style="margin-bottom:28px">
      <h1 style="font-size:26px;font-weight:900;letter-spacing:-.04em;margin-bottom:6px">Build Your Study Plan</h1>
      <p style="color:var(--sub);font-size:13px;margin:0">Customize your settings — Ledger builds a day-by-day calendar around your exam.</p>
    </div>

    <!-- Section selector -->
    <div class="card card-pad" style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:800;margin-bottom:4px">Which exam are you preparing for?</div>
      <div style="font-size:11px;color:var(--mut);margin-bottom:14px">Focus on one at a time. You can rebuild the plan after you pass.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${allSections.map(s=>{
          const e=EXAMS[s]||{color:'var(--ora)',full:s};
          const isSelected=s===selectedSec;
          const d=S.examDates?.[s];
          const dl=d?Math.ceil((new Date(d+' 00:00')-Date.now())/86400000):null;
          return`<button onclick="_planSelectSection('${s}')" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px 16px;border-radius:12px;border:2px solid ${isSelected?e.color:'var(--bdr)'};background:${isSelected?e.color+'14':'var(--surf2)'};cursor:pointer;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s;min-width:110px">
            <span class="badge badge-${s}" style="font-size:11px">${s}</span>
            <span style="font-size:11px;font-weight:700;color:${isSelected?e.color:'var(--sub)'}">${e.full?.split(' ').slice(0,2).join(' ')}</span>
            ${dl!=null&&dl>0?`<span style="font-size:10px;color:var(--mut)">${dl}d to exam</span>`:dl===0?`<span style="font-size:10px;color:#ef4444">Exam today!</span>`:'<span style="font-size:10px;color:var(--mut)">No date set</span>'}
          </button>`;
        }).join('')}
      </div>
    </div>

    <!-- Exam date -->
    <div class="card card-pad" style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:800;margin-bottom:4px">Exam date for ${selectedSec}</div>
      <div style="font-size:11px;color:var(--mut);margin-bottom:12px">The plan ends the day before your exam. Set this accurately.</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <input type="date" id="plan-exam-date" value="${examDate}" min="${_ymd(new Date())}" onchange="_planUpdateSettings()" style="padding:9px 12px;background:var(--surf2);border:1.5px solid ${canGenerate?ex.color:'var(--bdr)'};border-radius:10px;color:var(--txt);font-size:14px;font-weight:700;outline:none;cursor:pointer">
        ${canGenerate?`<span style="font-size:13px;font-weight:700;color:${ex.color}">${daysLeft} days away</span>`:''}
      </div>
      ${!canGenerate&&examDate?`<div style="font-size:11px;color:#ef4444;margin-top:8px">${ico('warning')} That date is in the past — pick a future date</div>`:!examDate?`<div style="font-size:11px;color:var(--amb);margin-top:8px">Pick your exam date to continue</div>`:''}
    </div>

    ${courseCard}

    <!-- Daily hours + study days -->
    <div class="card card-pad" style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:800;margin-bottom:4px">Study schedule</div>
      <div style="font-size:11px;color:var(--mut);margin-bottom:16px">How many hours per day, and which days you're available.</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:600;color:var(--sub);white-space:nowrap">Daily hours:</span>
        <input type="range" id="plan-hrs" min="1" max="8" step="0.5" value="${weeklyHrs/6>8?8:Math.round(weeklyHrs/6*2)/2||2}" oninput="document.getElementById('plan-hrs-lbl').textContent=this.value+'h';_planUpdateSettings()" style="flex:1;max-width:200px;accent-color:${ex.color}">
        <span id="plan-hrs-lbl" style="font-size:16px;font-weight:900;color:${ex.color};min-width:36px">${(Math.round(weeklyHrs/6*2)/2||2).toFixed(1)}h</span>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--sub);margin-bottom:10px">Study days:</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="plan-day-toggles">${dayToggles}</div>
    </div>

    <!-- Long session days -->
    <div class="card card-pad" style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:800;margin-bottom:4px">Which days can you go long? ${ico('flame')}</div>
      <div style="font-size:11px;color:var(--mut);margin-bottom:14px">Pick your high-energy days — Ledger schedules 1.6× more hours on these. Great for weekends or lighter work days.</div>
      ${studyDays.length===0?`<div style="font-size:12px;color:var(--mut)">Select study days above first.</div>`:`<div style="display:flex;gap:8px;flex-wrap:wrap" id="plan-long-toggles">${longDayToggles}</div>
      <div style="font-size:10px;color:var(--mut);margin-top:10px" id="plan-long-hint">${longDays.length>0?`${ico('flame')} Long days: ${longDays.map(i=>dayNames[i]).join(', ')} · ~${Math.min(8,Math.round(weeklyHrs/6*1.6*10)/10)}h on these days`:'No long days — tap a day above to mark it as a long session day'}</div>`}
    </div>

    <!-- Study style (a review course sets its own mix of lectures, MCQs and sims) -->
    <div class="card card-pad" style="margin-bottom:28px;${course?'display:none':''}">
      <div style="font-size:13px;font-weight:800;margin-bottom:4px">Study style</div>
      <div style="font-size:11px;color:var(--mut);margin-bottom:14px">How do you want to split your time across the plan?</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${styleOptions.map(o=>`<button onclick="_planSelectStyle('${o.id}')" id="plan-style-${o.id}" style="flex:1;min-width:140px;padding:12px 14px;border-radius:12px;border:2px solid ${studyStyle===o.id?ex.color:'var(--bdr)'};background:${studyStyle===o.id?ex.color+'14':'var(--surf2)'};cursor:pointer;text-align:left;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s">
          <div style="font-size:18px;margin-bottom:5px">${ico(o.icon)}</div>
          <div style="font-size:12px;font-weight:800;color:${studyStyle===o.id?ex.color:'var(--txt)'};">${o.label}</div>
          <div style="font-size:10px;color:var(--mut);margin-top:3px;line-height:1.4">${o.desc}</div>
        </button>`).join('')}
      </div>
    </div>

    <!-- Generate button -->
    <button onclick="submitPlanSetup()" ${!canGenerate?'disabled':''}
      style="width:100%;padding:16px;background:${canGenerate?'linear-gradient(135deg,var(--ora),#b03500)':'var(--surf3)'};color:${canGenerate?'#fff':'var(--mut)'};border:none;border-radius:14px;font-size:16px;font-weight:800;cursor:${canGenerate?'pointer':'not-allowed'};box-shadow:${canGenerate?'0 6px 24px rgba(212,64,0,.35)':'none'};transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s;letter-spacing:-.01em">
      ${canGenerate?'Build My Study Plan →':'Set an exam date to continue'}
    </button>
    ${canGenerate?`<div style="font-size:11px;color:var(--mut);text-align:center;margin-top:10px">Focused on ${selectedSec} only · ${daysLeft} days · Rebuild anytime for free</div>`:''}
    ${S.aiStudyPlan?`<button onclick="_planSettings=null;renderTab()" style="display:block;width:100%;margin-top:10px;padding:10px;background:transparent;border:1px solid var(--bdr);border-radius:10px;font-size:12px;font-weight:600;color:var(--mut);cursor:pointer">← Back to existing plan</button>`:''}
  </div>`;
}

function _planSelectSection(sec){
  _planSettings=Object.assign({},_planSettings||{},{
    section:sec,
    examDate:S.examDates?.[sec]||'',
    course:undefined,units:undefined,unitsDone:undefined, // reload this section's saved course
  });
  renderTab();
}
function _planSelectCourse(id){
  _planUpdateSettings();
  const s=_planSettings||{};
  const sec=s.section||getCurrentSection();
  const prevCourse=s.course!=null?s.course:((S.courseProgress&&S.courseProgress[sec]&&S.courseProgress[sec].course)||_mostUsedCourse());
  // Don't carry one course's prefilled count over to another course.
  const clear=s.units===''||(s.units!=null&&s.units===_defaultUnits(prevCourse,sec));
  _planSettings=Object.assign({},s,{course:id},clear?{units:undefined}:{});
  renderTab();
}
function _planSelectStyle(style){
  _planSettings=Object.assign({},_planSettings||{},{studyStyle:style});
  const storedSec=(_planSettings||{}).section||getCurrentSection();
  const ex=EXAMS[storedSec]||{color:'var(--ora)'};
  document.querySelectorAll('[id^="plan-style-"]').forEach(b=>{
    const id=b.id.replace('plan-style-','');
    b.style.borderColor=id===style?ex.color:'var(--bdr)';
    b.style.background=id===style?ex.color+'14':'var(--surf2)';
    b.querySelector('div:nth-child(2)').style.color=id===style?ex.color:'var(--txt)';
  });
}
function _planToggleDay(i){
  const current=(_planSettings||{}).studyDays||[1,2,3,4,5,6];
  const idx=current.indexOf(i);
  const updated=idx>=0?current.filter(d=>d!==i):[...current,i].sort();
  if(updated.length===0){showToast('Select at least 1 study day','err');return;}
  // Also remove from longDays if the day is being unselected
  const currentLong=(_planSettings||{}).longDays||[];
  const updatedLong=currentLong.filter(d=>updated.includes(d));
  _planSettings=Object.assign({},_planSettings||{},{studyDays:updated,longDays:updatedLong});
  const storedSec=(_planSettings||{}).section||getCurrentSection();
  const ex=EXAMS[storedSec]||{color:'var(--ora)'};
  const btn=document.getElementById('plan-day-'+i);
  if(btn){
    const on=updated.includes(i);
    btn.style.borderColor=on?ex.color:'var(--bdr)';
    btn.style.background=on?ex.color:'var(--surf2)';
    btn.style.color=on?'#fff':'var(--mut)';
  }
  // Re-render long day toggles section
  renderTab();
}
function _planToggleLongDay(i){
  const current=(_planSettings||{}).longDays||[];
  const studyDays=(_planSettings||{}).studyDays||[1,2,3,4,5,6];
  if(!studyDays.includes(i)){showToast('That day is not a study day','err');return;}
  const idx=current.indexOf(i);
  const updated=idx>=0?current.filter(d=>d!==i):[...current,i].sort();
  _planSettings=Object.assign({},_planSettings||{},{longDays:updated});
  const btn=document.getElementById('plan-long-'+i);
  if(btn){
    const on=updated.includes(i);
    btn.style.borderColor=on?'#f97316':'var(--bdr)';
    btn.style.background=on?'#f9731614':'var(--surf2)';
    btn.style.color=on?'#f97316':'var(--mut)';
    btn.querySelector('span:first-child').innerHTML=ico(on?'flame':'cloud');
  }
}
function _planUpdateSettings(){
  const dateEl=document.getElementById('plan-exam-date');
  const hrsEl=document.getElementById('plan-hrs');
  if(dateEl) _planSettings=Object.assign({},_planSettings||{},{examDate:dateEl.value});
  if(hrsEl) _planSettings=Object.assign({},_planSettings||{},{dailyHrs:parseFloat(hrsEl.value)||2});
  const uEl=document.getElementById('plan-units');
  const udEl=document.getElementById('plan-units-done');
  if(uEl) _planSettings=Object.assign({},_planSettings||{},{units:uEl.value===''?'':Math.max(0,Math.min(60,parseInt(uEl.value,10)||0))});
  if(udEl) _planSettings=Object.assign({},_planSettings||{},{unitsDone:Math.max(0,Math.min(60,parseInt(udEl.value,10)||0))});
}

// Save the course picked in setup to S.courseProgress. Keeps existing
// check-offs when the count of finished units hasn't changed.
// Picking "None" keeps the units and check-offs; the plan just stops using them.
function _savePlanCourse(sec,settings){
  if(!S.courseProgress) S.courseProgress={};
  const prev=S.courseProgress[sec]||null;
  const course=settings.course!=null?settings.course:(prev?prev.course:_mostUsedCourse());
  const units=settings.units!=null?(parseInt(settings.units,10)||0):((prev&&prev.units)||_defaultUnits(course,sec)||0);
  if(!course&&!prev) return;
  const doneCount=Math.min(units,settings.unitsDone!=null?settings.unitsDone:((prev&&prev.done)||[]).length);
  let done=((prev&&prev.done)||[]).filter(u=>u<=units);
  if(done.length!==doneCount){ done=[]; for(let u=1;u<=doneCount;u++) done.push(u); }
  S.courseProgress[sec]={course:course||'',units,done};
}

function submitPlanSetup(){
  _planUpdateSettings();
  const settings=_planSettings||{};
  const sec=settings.section||getCurrentSection();
  const examDate=settings.examDate||(S.examDates?.[sec]||'');
  if(!examDate){showToast('Set your exam date first','err');return;}
  const daysLeft=Math.ceil((new Date(examDate+' 00:00')-Date.now())/86400000);
  if(daysLeft<=0){showToast('Exam date must be in the future','err');return;}
  // Save exam date back to state if changed
  if(!S.examDates) S.examDates={};
  S.examDates[sec]=examDate;
  _savePlanCourse(sec,settings);
  saveState();
  _planGenerating=true;
  renderTab();
  setTimeout(()=>{
    generateAIPlan(settings);
    _planGenerating=false;
    _planViewMonth=null;
    renderTab();
    showToast('Your study plan is ready!','ok');
  },2600);
}

function _buildPlanCalendar(plan){
  const todayObj=new Date();todayObj.setHours(0,0,0,0);
  const todayStr=_ymd(todayObj);
  if(!_planViewMonth){
    _planViewMonth={year:todayObj.getFullYear(),month:todayObj.getMonth()};
  }
  const {year,month}=_planViewMonth;
  const monthStart=new Date(year,month,1);
  const monthEnd=new Date(year,month+1,0);
  const monthName=monthStart.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const dayMap={};
  plan.days.forEach(d=>{dayMap[d.date]=d;});

  // Calendar grid cells
  const startDow=monthStart.getDay();
  const totalCells=Math.ceil((startDow+monthEnd.getDate())/7)*7;
  const cells=[];
  for(let i=0;i<totalCells;i++){
    const off=i-startDow;
    const cellDate=new Date(year,month,1+off);
    const cellStr=_ymd(cellDate);
    const inMonth=off>=0&&off<monthEnd.getDate();
    if(!inMonth){
      cells.push(`<div style="min-height:78px;border-radius:10px;background:var(--surf2);opacity:.25;border:1px solid var(--bdr)"></div>`);
      continue;
    }
    const d=dayMap[cellStr];
    const isToday=cellStr===todayStr;
    const isPast=cellDate<todayObj;
    const dayNum=cellDate.getDate();
    let bg='var(--surf)',border=isToday?'2px solid var(--ora)':'1px solid var(--bdr)',inner='';
    if(d&&d.isStudy){
      const ex=EXAMS[d.section]||{color:'var(--ind)'};
      const m=ACTIVITY_MODES[d.mode]||ACTIVITY_MODES.new_material;
      bg=isPast?'var(--surf2)':ex.color+'12';
      border=isToday?`2px solid ${ex.color}`:`1px solid ${ex.color}28`;
      inner=`<div style="font-size:10px;font-weight:${isToday?900:700};color:${isToday?ex.color:'var(--sub)'};margin-bottom:4px">${dayNum}</div>
        <div style="font-size:18px;line-height:1;margin-bottom:3px">${d.done?ico('checkCircle'):ico(m.icon)}</div>
        <div style="font-size:10px;font-weight:700;color:${ex.color};background:${ex.color}20;border-radius:4px;padding:1px 5px;display:inline-block;margin-bottom:2px"${d.units&&d.units.length?` title="${_unitsText(d.units)}"`:''}>${d.units&&d.units.length?_unitsShort(d.units):d.section}</div>
        <div style="font-size:10px;color:var(--mut)">${d.hours}h${d.isLong?' '+ico('flame')+'':''}</div>`;
    }else if(d&&d.blocked){
      const lbl=_planDayLabel(plan,cellStr);
      bg='var(--surf2)';border=isToday?'2px solid var(--ora)':'1px dashed var(--bdr2)';
      inner=`<div style="font-size:10px;font-weight:${isToday?900:600};color:var(--mut);margin-bottom:4px">${dayNum}</div>
        <div style="font-size:18px">${ico('plane')}</div>
        <div style="font-size:9px;color:var(--mut);margin-top:2px;line-height:1.2;max-height:22px;overflow:hidden">${lbl?lbl.replace(/</g,'&lt;'):'Off'}</div>`;
    }else if(d&&!d.isStudy){
      inner=`<div style="font-size:10px;font-weight:${isToday?900:600};color:var(--mut);margin-bottom:4px">${dayNum}</div>
        <div style="font-size:18px;opacity:.35">${ico('bed')}</div>
        <div style="font-size:10px;color:var(--mut);margin-top:2px">Rest</div>`;
    }else{
      inner=`<div style="font-size:10px;font-weight:600;color:var(--mut)">${dayNum}</div>`;
    }
    cells.push(`<div onclick="${d?`openPlanDayDetail('${cellStr}')`:''}" style="min-height:78px;border-radius:10px;background:${bg};border:${border};padding:8px 6px;text-align:center;cursor:${d?'pointer':'default'};transition:transform .12s,box-shadow .12s;${isPast&&d?'opacity:.6':''}" ${d?`onmouseover="this.style.transform='scale(1.04)';this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='';this.style.boxShadow=''"`:''}>
      ${inner}
    </div>`);
  }
  const dayHdrs=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div style="text-align:center;font-size:10px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.07em;padding-bottom:6px">${d}</div>`).join('');

  // Sidebar: today block
  const todayEntry=dayMap[todayStr];
  let todaySide='';
  if(todayEntry&&todayEntry.isStudy){
    const ex=EXAMS[todayEntry.section]||{color:'var(--ora)'};
    const m=ACTIVITY_MODES[todayEntry.mode]||ACTIVITY_MODES.new_material;
    todaySide=`<div style="background:linear-gradient(135deg,${ex.color}14,${ex.color}06);border:1.5px solid ${ex.color}44;border-radius:14px;padding:16px;margin-bottom:14px">
      <div style="font-size:10px;font-weight:800;color:${ex.color};text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">Today — Day ${todayEntry.dayNum}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <div style="background:${m.color};color:#fff;border-radius:8px;padding:5px 11px;font-size:12px;font-weight:800">${ico(m.icon)} ${esc(_planDayModeLabel(plan,todayEntry))}</div>
        <span class="badge badge-${todayEntry.section}">${todayEntry.section}</span>
      </div>
      <div style="font-size:22px;font-weight:900;color:var(--txt);margin-bottom:4px">${todayEntry.hours}h${todayEntry.isLong?' <span style="font-size:14px;background:#f9731620;color:#f97316;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:800;vertical-align:middle">'+ico('flame')+' Long Day</span>':''}</div>
      <div style="font-size:11px;color:var(--sub);line-height:1.55;margin-bottom:12px">${esc(_planDayDesc(plan,todayEntry))}</div>
      ${_unitButtonsHTML(plan,todayEntry)}
      <div style="font-size:11px;color:var(--mut);font-style:italic;border-top:1px solid ${ex.color}22;padding-top:10px;margin-bottom:12px">${_getPlanTip(todayEntry.mode)}</div>
      ${todayEntry.done
        ?`<div style="background:#10b98120;color:var(--grn);border-radius:8px;padding:8px;text-align:center;font-size:12px;font-weight:700">✓ Day Complete!</div>`
        :`<button onclick="markPlanDayDone('${todayStr}')" style="width:100%;padding:10px;background:${ex.color};color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Mark Today Done ✓</button>`}
    </div>`;
  }else if(todayEntry&&!todayEntry.isStudy){
    todaySide=`<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:14px;padding:16px;margin-bottom:14px;text-align:center">
      <div style="margin-bottom:6px">${LedgerBuddy('sleep',84)}</div>
      <div style="font-size:13px;font-weight:800;margin-bottom:4px">Rest Day</div>
      <div style="font-size:11px;color:var(--mut);line-height:1.5">Recovery is part of the plan. Your brain consolidates memory during rest.</div>
    </div>`;
  }

  // Sidebar: phase roadmap
  const todayPhase=todayEntry?.phase;
  const phaseRows=plan.phases.map(p=>{
    const pd=plan.days.filter(d=>d.phase===p.n&&d.isStudy);
    const done=pd.filter(d=>d.done).length;
    const pp=pd.length?Math.round(done/pd.length*100):0;
    const cur=todayPhase===p.n;
    return`<div style="display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;background:${cur?p.color+'14':'var(--surf2)'};border:1px solid ${cur?p.color+'44':'var(--bdr)'}">
      <div style="font-size:18px;flex-shrink:0">${ico(p.icon)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:800;color:${cur?p.color:'var(--txt)'};margin-bottom:3px">${p.name}</div>
        <div style="height:3px;background:var(--surf3);border-radius:2px"><div style="height:3px;background:${p.color};border-radius:2px;width:${pp}%"></div></div>
      </div>
      <div style="font-size:10px;font-weight:700;color:var(--mut);flex-shrink:0">${pp}%</div>
    </div>`;
  }).join('');

  // Countdown + progress
  const daysLeft=Math.max(0,Math.ceil((new Date(plan.examDate+' 00:00')-Date.now())/86400000));
  const studyDays=plan.days.filter(d=>d.isStudy);
  const doneDays=studyDays.filter(d=>d.done).length;
  const pct=studyDays.length?Math.round(doneDays/studyDays.length*100):0;
  const totalHrsPlanned=studyDays.reduce((s,d)=>s+d.hours,0);
  const ex=EXAMS[plan.primarySec]||{color:'var(--ora)',full:plan.primarySec};

  return`<div style="max-width:1140px;margin:0 auto">
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <h1 style="font-size:26px;font-weight:900;letter-spacing:-.04em;margin:0">Study Plan</h1>
          <span class="badge badge-${plan.primarySec}" style="font-size:12px">${plan.primarySec}</span>
          <span style="background:var(--ora);color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;letter-spacing:.05em;text-transform:uppercase">Pro</span>
        </div>
        <p style="color:var(--sub);font-size:13px;margin:0">${daysLeft} days to exam · ${Math.round(totalHrsPlanned)}h planned · ${pct}% complete${(()=>{const n=[..._planBlockedSet(plan)].filter(bd=>bd>=todayStr).length;return n?` · ${ico('plane')} ${n} day${n>1?'s':''} off`:'';})()}</p>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <button onclick="openTimeOffModal()" style="padding:8px 14px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;font-size:12px;font-weight:700;color:var(--sub);cursor:pointer">${ico('plane')} Add time off</button>
        <button onclick="regeneratePlan()" style="padding:8px 16px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;font-size:12px;font-weight:700;color:var(--sub);cursor:pointer">Edit &amp; Rebuild</button>
      </div>
    </div>

    <!-- 2-col layout -->
    <div class="plan-grid">

      <!-- CALENDAR -->
      <div class="card" style="padding:20px">
        <!-- Month nav -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <button onclick="planPrevMonth()" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;color:var(--sub)">‹</button>
          <div style="font-size:15px;font-weight:800">${monthName}</div>
          <button onclick="planNextMonth()" style="width:32px;height:32px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;color:var(--sub)">›</button>
        </div>
        <!-- Mode legend -->
        <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap">
          ${Object.entries(ACTIVITY_MODES).filter(([k])=>k!=='rest'&&plan.days.some(d=>d.isStudy&&d.mode===k)).map(([k,m])=>`<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--mut)">${ico(m.icon)} ${m.label}</div>`).join('')}
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--mut)">${ico('checkCircle')} Done &nbsp;${ico('bed')} Rest &nbsp;${ico('plane')} Off</div>
        </div>
        <div style="font-size:10px;color:var(--mut);margin-bottom:12px;font-style:italic">Life happens — tap any upcoming day to mark it off. Your hours move to the rest of the plan automatically.</div>
        <!-- Day headers + grid -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px">${dayHdrs}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${cells.join('')}</div>
      </div>

      <!-- SIDEBAR -->
      <div>
        ${todaySide}

        <!-- Exam countdown -->
        <div class="card card-pad" style="margin-bottom:14px">
          <div style="text-align:center;padding:6px 0 10px">
            <div style="font-size:40px;font-weight:900;color:${ex.color};letter-spacing:-.04em;line-height:1">${daysLeft}</div>
            <div style="font-size:12px;color:var(--mut);margin-bottom:6px">days to ${plan.primarySec} exam</div>
            <div style="font-size:11px;color:var(--sub);font-weight:600">${new Date(plan.examDate+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
          </div>
          <div style="height:6px;background:var(--surf2);border-radius:4px;overflow:hidden;margin-bottom:4px">
            <div style="height:6px;background:linear-gradient(90deg,${ex.color},${ex.color}88);border-radius:4px;width:${pct}%;transition:width .6s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut)">
            <span>${doneDays} days done</span><span>${pct}% complete</span>
          </div>
        </div>

        ${_courseProgressCard(plan)}

        <!-- Phase roadmap -->
        <div class="card card-pad" style="margin-bottom:14px">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-bottom:10px">Your Roadmap</div>
          <div style="display:flex;flex-direction:column;gap:6px">${phaseRows}</div>
        </div>

        <!-- Stats -->
        <div class="card card-pad">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            ${[
              [Math.round(totalHrsPlanned)+'h','Total Planned'],
              [studyDays.length+' days','Study Days'],
              [doneDays+' done','Completed'],
              [plan.phases.length+' phases','Roadmap'],
            ].map(([v,l])=>`<div style="text-align:center;background:var(--surf2);border-radius:10px;padding:10px 6px">
              <div style="font-size:18px;font-weight:900;color:var(--txt);letter-spacing:-.03em">${v}</div>
              <div style="font-size:10px;color:var(--mut);margin-top:2px">${l}</div>
            </div>`).join('')}
          </div>
          <div style="font-size:10px;color:var(--mut);text-align:center;margin-top:10px;line-height:1.5">Generated ${timeAgo(plan.generated)} · <em>${_courseFor(plan.primarySec)&&plan.learnEnd?'Built around your '+esc(_courseLabel(_courseFor(plan.primarySec)))+' units':'Becker/Gleim guides the what — this plan guides the when'}</em></div>
        </div>
      </div>
    </div>
  </div>`;
}

function planPrevMonth(){
  if(!_planViewMonth){const n=new Date();_planViewMonth={year:n.getFullYear(),month:n.getMonth()};}
  let{year,month}=_planViewMonth;
  month--;if(month<0){month=11;year--;}
  _planViewMonth={year,month};renderTab();
}
function planNextMonth(){
  if(!_planViewMonth){const n=new Date();_planViewMonth={year:n.getFullYear(),month:n.getMonth()};}
  let{year,month}=_planViewMonth;
  month++;if(month>11){month=0;year++;}
  _planViewMonth={year,month};renderTab();
}

function openPlanDayDetail(dateStr){
  const plan=S.aiStudyPlan;if(!plan)return;
  const day=plan.days.find(d=>d.date===dateStr);if(!day)return;
  const dt=new Date(dateStr+'T12:00:00');
  const dateLabel=dt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const ex=day.isStudy&&EXAMS[day.section]?EXAMS[day.section]:{color:'var(--mut)',full:'Rest'};
  const m=day.isStudy?(ACTIVITY_MODES[day.mode]||ACTIVITY_MODES.new_material):ACTIVITY_MODES.rest;
  const todayStr=_ymd(new Date());
  const offRange=(plan.timeOff||[]).find(t=>{const e=t.end||t.start;return t.start&&dateStr>=t.start&&dateStr<=e;});
  document.getElementById('plan-day-modal')?.remove();
  const el=document.createElement('div');
  el.id='plan-day-modal';
  el.dataset.date=dateStr;
  el.style.cssText='position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .15s ease';
  el.innerHTML=`<div style="background:var(--surf);border-radius:20px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.3)">
    <div style="height:5px;background:${ex.color}"></div>
    <div style="padding:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div>
          <div style="font-size:13px;font-weight:800;color:var(--txt)">${dateLabel}</div>
          <div style="font-size:11px;color:var(--mut)">Day ${day.dayNum} of ${plan.daysLeft}</div>
        </div>
        <button onclick="document.getElementById('plan-day-modal').remove()" style="width:30px;height:30px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer;font-size:18px;color:var(--sub);display:flex;align-items:center;justify-content:center">×</button>
      </div>
      ${day.blocked?`
        <div style="text-align:center;padding:14px 0 18px">
          <div style="font-size:40px;margin-bottom:10px">${ico('plane')}</div>
          <div style="font-size:14px;font-weight:800;margin-bottom:6px">${offRange?(offRange.label||'Time off').replace(/</g,'&lt;'):'Day Off'}</div>
          <div style="font-size:12px;color:var(--mut);line-height:1.5">${offRange?'Part of your scheduled time off. Those study hours are spread across your remaining days — you\'re still on track.':'You marked this day unavailable. Its study hours were spread across your remaining days — you\'re still on track.'}</div>
        </div>
        ${offRange
          ?`<button onclick="removeTimeOff('${offRange.id}')" style="width:100%;padding:11px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;font-size:13px;font-weight:700;color:var(--sub);cursor:pointer">Remove this time off</button>`
          :dateStr>=todayStr?`<button onclick="toggleBlockDay('${dateStr}')" style="width:100%;padding:11px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;font-size:13px;font-weight:700;color:var(--sub);cursor:pointer">Reopen this day</button>`:''}
      `:day.isStudy?`
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
          <div style="background:${m.color};color:#fff;border-radius:8px;padding:6px 13px;font-size:13px;font-weight:800">${ico(m.icon)} ${esc(_planDayModeLabel(plan,day))}</div>
          <span class="badge badge-${day.section}">${day.section}</span>
          <span style="font-size:15px;font-weight:900;color:var(--txt)">${day.hours}h</span>
        </div>
        <div style="font-size:13px;color:var(--sub);line-height:1.6;background:var(--surf2);border-radius:10px;padding:12px 14px;margin-bottom:14px">${esc(_planDayDesc(plan,day))}</div>
        ${dateStr<=todayStr?_unitButtonsHTML(plan,day):''}
        <div style="font-size:11px;color:var(--mut);font-style:italic;margin-bottom:16px">${_getPlanTip(day.mode)}</div>
        ${day.done
          ?`<div style="background:#10b98120;color:var(--grn);border-radius:10px;padding:10px;text-align:center;font-size:13px;font-weight:700">✓ Completed</div>`
          :dateStr<=todayStr?`<button onclick="markPlanDayDone('${dateStr}');document.getElementById('plan-day-modal')?.remove()" style="width:100%;padding:11px;background:${ex.color};color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Mark Done ✓</button>`
          :`<div style="background:var(--surf2);border-radius:10px;padding:10px;text-align:center;font-size:12px;color:var(--mut)">Upcoming — not yet</div>`}
        ${dateStr>todayStr&&!day.done?`<button onclick="toggleBlockDay('${dateStr}')" style="width:100%;margin-top:8px;padding:10px;background:transparent;border:1px solid var(--bdr);border-radius:10px;font-size:12px;font-weight:600;color:var(--mut);cursor:pointer">Can't study this day — life happens</button>`:''}
      `:`
        <div style="text-align:center;padding:20px 0">
          <div style="margin-bottom:8px">${LedgerBuddy('sleep',92)}</div>
          <div style="font-size:14px;font-weight:800;margin-bottom:6px">Rest Day</div>
          <div style="font-size:12px;color:var(--mut);line-height:1.5">Recovery is part of the plan. Your brain consolidates memory during rest.</div>
        </div>
      `}
    </div>
  </div>`;
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
}

function runGeneratePlan(){
  // Legacy call — route to new setup flow
  if(currentTab==='plan'){
    _planSettings=null;
    S.aiStudyPlan=null;
    saveState();
    renderTab();
  }
}

function markPlanDayDone(dateStr){
  if(!S.aiStudyPlan) return;
  const day=S.aiStudyPlan.days.find(d=>d.date===dateStr);
  if(day){day.done=true;saveState();}
  burstConfetti(document.querySelector('.sess-start-btn')||document.body);
  if(currentTab==='plan'){
    renderTab();
  } else {
    const el=document.getElementById('schedule-section');
    if(el) el.outerHTML=buildStudySchedule();
  }
  showToast('Day complete! Keep the streak going','ok');
  checkAchievements();
}

function regeneratePlan(){
  // Prefill settings from existing plan so user can tweak before rebuilding
  if(S.aiStudyPlan){
    _planSettings={
      section:S.aiStudyPlan.primarySec,
      examDate:S.aiStudyPlan.examDate,
      dailyHrs:S.aiStudyPlan.dailyHrs||2,
      studyStyle:S.aiStudyPlan.studyStyle||'balanced',
      studyDays:S.aiStudyPlan.studyDays||[1,2,3,4,5,6],
      longDays:S.aiStudyPlan.longDays||[],
    };
  }
  S.aiStudyPlan=null;saveState();
  renderTab();
}

function _buildAIPlanUI(){
  const plan=S.aiStudyPlan;
  if(!plan) return '<div class="card card-pad" style="text-align:center;padding:36px 20px">'+
    '<div style="margin-bottom:10px">'+LedgerBuddy('point',104)+'</div>'+
    '<div style="font-size:20px;font-weight:900;letter-spacing:-.03em;margin-bottom:8px">AI Study Plan</div>'+
    '<div style="font-size:13px;color:var(--mut);max-width:340px;margin:0 auto 10px;line-height:1.65">Ledger analyzes your exam date, hours logged per section, and weekly goal to build a personalized time-blocking plan.</div>'+
    '<div style="font-size:12px;color:var(--sub);max-width:300px;margin:0 auto 24px;line-height:1.6;background:var(--surf2);border-radius:10px;padding:10px 14px">Your Becker, Gleim, or Roger material tells you <em>what</em> to study. This plan tells you <em>when</em>, <em>how long</em>, and <em>which mode</em> to be in each day.</div>'+
    '<button onclick="runGeneratePlan()" style="padding:14px 36px;background:linear-gradient(135deg,var(--ora),#b03500);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 18px rgba(212,64,0,.38);animation:pulse-glow 2s infinite">Generate My Plan</button>'+
    '<div style="font-size:11px;color:var(--mut);margin-top:14px">Takes ~2 seconds · Regenerate any time</div>'+
    '</div>';

  const today=_ymd(new Date());
  const todayEntry=plan.days.find(d=>d.date===today);
  const studyDays=plan.days.filter(d=>d.isStudy);
  const doneDays=studyDays.filter(d=>d.done).length;
  const pct=studyDays.length?Math.round(doneDays/studyDays.length*100):0;
  const daysLeft=Math.max(0,Math.ceil((new Date(plan.examDate+' 00:00')-new Date())/86400000));

  // Section urgency strip
  const stats=plan.sectionStats||{};
  const secStrip=Object.keys(stats).map(s=>{
    const st=stats[s];
    const ex=EXAMS[s]||{};
    const behind=st.pct<50;
    return '<div style="flex:1;min-width:100px;background:var(--surf2);border-radius:10px;padding:10px 12px;border:1px solid '+(behind?ex.color+'44':'var(--bdr)')+'">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'+
        '<span class="badge badge-'+s+'">'+s+'</span>'+
        '<span style="font-size:11px;font-weight:800;color:'+(behind?ex.color:'var(--grn)')+'">'+st.pct+'%</span>'+
      '</div>'+
      '<div style="height:4px;background:var(--surf);border-radius:2px;overflow:hidden"><div style="height:4px;background:'+ex.color+';width:'+st.pct+'%;border-radius:2px"></div></div>'+
      '<div style="font-size:10px;color:var(--mut);margin-top:4px">'+st.logged.toFixed(0)+'h / '+st.target+'h'+( behind?' · needs attention':'')+'</div>'+
    '</div>';
  }).join('');

  // Today block
  let todayBlock='';
  if(todayEntry&&todayEntry.isStudy){
    const m=ACTIVITY_MODES[todayEntry.mode]||ACTIVITY_MODES.new_material;
    const exCol=EXAMS[todayEntry.section]?.color||'var(--ora)';
    todayBlock='<div style="background:linear-gradient(135deg,var(--ora-bg),rgba(212,64,0,.04));border:2px solid var(--ora);border-radius:14px;padding:18px;margin-bottom:20px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
        '<div style="font-size:10px;font-weight:800;color:var(--ora);text-transform:uppercase;letter-spacing:.1em">Today — Day '+todayEntry.dayNum+' of '+plan.daysLeft+'</div>'+
        (todayEntry.done
          ?'<span style="background:#10b981;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px">✓ Done</span>'
          :'<button onclick="markPlanDayDone(\''+today+'\')" style="background:var(--ora);color:#fff;border:none;border-radius:20px;padding:6px 16px;font-size:11px;font-weight:700;cursor:pointer">Mark Done ✓</button>')+
      '</div>'+
      // Mode pill + section
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
        '<div style="background:'+m.color+';color:#fff;border-radius:8px;padding:6px 13px;font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px">'+ico(m.icon)+' '+m.label+'</div>'+
        '<span class="badge badge-'+todayEntry.section+'">'+todayEntry.section+'</span>'+
        '<span style="font-size:13px;font-weight:700;color:var(--sub)">'+todayEntry.hours+'h</span>'+
      '</div>'+
      // What to actually do
      '<div style="font-size:13px;color:var(--txt);line-height:1.55;margin-bottom:8px">'+m.desc+'</div>'+
      '<div style="font-size:11px;color:var(--mut);font-style:italic;border-top:1px solid var(--bdr);padding-top:8px">'+_getPlanTip(todayEntry.mode)+'</div>'+
    '</div>';
  } else if(todayEntry&&!todayEntry.isStudy){
    todayBlock='<div style="background:var(--surf2);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px">'+
      '<div style="font-size:28px">'+ico('bed')+'</div>'+
      '<div><div style="font-size:13px;font-weight:700">Rest Day</div><div style="font-size:11px;color:var(--mut)">Recovery is part of the plan. Your brain consolidates memory during rest.</div></div>'+
    '</div>';
  }

  // Phase roadmap cards
  const phaseCards=plan.phases.map(p=>{
    const pd=plan.days.filter(d=>d.phase===p.n&&d.isStudy);
    const done=pd.filter(d=>d.done).length;
    const pp=pd.length?Math.round(done/pd.length*100):0;
    const isCurrent=todayEntry&&todayEntry.phase===p.n;
    return '<div style="flex:1;min-width:120px;background:var(--surf);border:1.5px solid '+(isCurrent?p.color:'var(--bdr)')+';border-radius:12px;padding:12px 13px;'+(isCurrent?'box-shadow:0 2px 12px '+p.color+'28;':'')+'">'+
      '<div style="font-size:20px;margin-bottom:3px">'+ico(p.icon)+'</div>'+
      '<div style="font-size:10px;font-weight:800;color:'+p.color+';margin-bottom:2px">'+p.name+'</div>'+
      '<div style="font-size:10px;color:var(--mut);margin-bottom:7px;line-height:1.4">'+p.focus+'</div>'+
      '<div style="font-size:10px;color:var(--sub);margin-bottom:4px">'+done+'/'+pd.length+' days</div>'+
      '<div style="height:4px;background:var(--surf2);border-radius:2px"><div style="height:4px;background:'+p.color+';border-radius:2px;width:'+pp+'%;transition:width .6s"></div></div>'+
    '</div>';
  }).join('');

  // Next 7 days
  const next7=plan.days.filter(d=>d.date>=today).slice(0,7);
  const weekRows=next7.map(d=>{
    const dt=new Date(d.date+'T12:00:00');
    const lbl=dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    const isT=d.date===today;
    const m=ACTIVITY_MODES[d.mode]||ACTIVITY_MODES.new_material;
    const exCol=d.isStudy&&EXAMS[d.section]?EXAMS[d.section].color:'var(--mut)';
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr);'+(isT?'background:var(--ora-bg);border-radius:8px;padding:10px 8px;margin:0 -4px;':'')+'">'+
      '<div style="width:86px;flex-shrink:0;font-size:11px;font-weight:'+(isT?'800':'600')+';color:'+(isT?'var(--ora)':'var(--sub)')+'">'+lbl+(isT?'':'')+'</div>'+
      (d.isStudy
        ?'<div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px">'+
            '<span style="font-size:14px;flex-shrink:0">'+ico(m.icon)+'</span>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:12px;font-weight:700;color:var(--txt)">'+m.label+'</div>'+
              '<div style="display:flex;align-items:center;gap:6px;margin-top:1px">'+
                '<span class="badge badge-'+d.section+'" style="font-size:10px;padding:1px 6px">'+d.section+'</span>'+
                '<span style="font-size:10px;color:var(--mut)">'+d.hours+'h</span>'+
              '</div>'+
            '</div>'+
          '</div>'+
          (d.done?'<span style="font-size:15px;flex-shrink:0">'+ico('checkCircle')+'</span>':'<span style="font-size:15px;flex-shrink:0;opacity:.2">'+ico('square')+'</span>')
        :'<div style="flex:1;font-size:11px;color:var(--mut);font-style:italic">Rest day '+ico('bed')+'</div>')+
    '</div>';
  }).join('');

  const totalHrsPlanned=studyDays.reduce((sum,d)=>sum+d.hours,0);

  return '<div class="card card-pad">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
      '<div>'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<div class="section-title" style="margin-bottom:0">AI Study Plan</div>'+
          '<span style="background:linear-gradient(135deg,var(--ora),#b03500);color:#fff;font-size:10px;font-weight:800;padding:2px 9px;border-radius:20px;letter-spacing:.05em;text-transform:uppercase">Pro</span>'+
        '</div>'+
        '<div style="font-size:11px;color:var(--mut);margin-top:2px">'+daysLeft+' days to exam · '+Math.round(totalHrsPlanned)+'h planned · '+pct+'% done</div>'+
      '</div>'+
      '<button onclick="regeneratePlan()" style="padding:6px 12px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:8px;font-size:11px;font-weight:700;color:var(--sub);cursor:pointer">↺ Redo</button>'+
    '</div>'+

    // Progress bar
    '<div style="margin-bottom:18px">'+
      '<div style="height:7px;background:var(--surf2);border-radius:4px;overflow:hidden"><div style="height:7px;background:linear-gradient(90deg,var(--ora),#b03500);border-radius:4px;width:'+pct+'%;transition:width .6s"></div></div>'+
      '<div style="display:flex;justify-content:space-between;margin-top:4px">'+
        '<span style="font-size:10px;color:var(--mut)">'+doneDays+' days done</span>'+
        '<span style="font-size:10px;color:var(--mut)">'+daysLeft+' days to exam</span>'+
      '</div>'+
    '</div>'+

    // Section priority
    (Object.keys(stats).length>0?
      '<div style="font-size:10px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Section Priority · Based on Your Hours</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">'+secStrip+'</div>'
    :'')+

    // Today
    todayBlock+

    // Roadmap
    '<div style="font-size:10px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Your Roadmap</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">'+phaseCards+'</div>'+

    // Week ahead
    '<div style="font-size:10px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Next 7 Days</div>'+
    weekRows+

    '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--bdr);font-size:10px;color:var(--mut);text-align:center">'+
      'Generated '+timeAgo(plan.generated)+' · Your study material (Becker/Gleim/etc.) guides the <em>what</em> — this plan guides the <em>when</em>'+
    '</div>'+
  '</div>';
}

// Basic schedule for Pro/Free
let _scheduleEditMode=false;
function _generateBasicSchedule(){
  const sections=S.sections||['FAR'];
  const weeklyHrs=S.hoursPerWeek||15;
  const studyDays=[1,2,3,4,5];
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const hrsPerDay=weeklyHrs/studyDays.length;
  return days.map((d,i)=>{
    if(!studyDays.includes(i)) return{day:d,active:false,hours:0,section:''};
    const pick=sections[studyDays.indexOf(i)%sections.length];
    return{day:d,active:true,hours:parseFloat(hrsPerDay.toFixed(1)),section:pick};
  });
}
function saveStudySchedule(){
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  S.studySchedule=days.map((d,i)=>({day:d,active:document.getElementById('sched-active-'+i)?.checked||false,hours:parseFloat(document.getElementById('sched-hrs-'+i)?.value)||0,section:document.getElementById('sched-sec-'+i)?.value||''}));
  S.hoursPerWeek=parseInt(document.getElementById('sched-weekly-hrs')?.value||S.hoursPerWeek||15);
  saveState();_scheduleEditMode=false;
  showToast('Schedule saved ✓','ok');
  const el=document.getElementById('schedule-section');
  if(el) el.outerHTML=buildStudySchedule();
}
function toggleScheduleEdit(){
  _scheduleEditMode=!_scheduleEditMode;
  const el=document.getElementById('schedule-section');
  if(el) el.outerHTML=buildStudySchedule();
}

function buildStudySchedule(){
  // AI Study Plan lives in the dedicated Study Plan tab — never show it here

  const pro=isPro();
  const schedule=S.studySchedule||_generateBasicSchedule();
  const sections=S.sections||['FAR'];
  const weeklyHrs=S.hoursPerWeek||15;
  const editMode=_scheduleEditMode&&pro;
  const totalPlanned=schedule.filter(d=>d.active).reduce((s,d)=>s+d.hours,0);

  const dayRows=schedule.map((item,i)=>{
    const isToday=new Date().getDay()===i;
    const color=item.section&&EXAMS[item.section]?EXAMS[item.section].color:'var(--mut)';
    if(editMode) return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr);'+(isToday?'background:var(--ora-bg);border-radius:8px;padding:10px 8px;':'')+'">'+
      '<input type="checkbox" id="sched-active-'+i+'"'+(item.active?' checked':'')+' style="accent-color:var(--ora);width:15px;height:15px;cursor:pointer">'+
      '<div style="width:34px;font-size:11px;font-weight:800;color:'+(isToday?'var(--ora)':'var(--mut)')+'">'+item.day+'</div>'+
      '<select id="sched-sec-'+i+'" style="padding:5px 8px;background:var(--surf2);border:1px solid var(--bdr);border-radius:7px;color:var(--txt);font-size:12px;font-weight:700;outline:none">'+
        sections.map(s=>'<option value="'+s+'"'+(s===item.section?' selected':'')+'>'+s+'</option>').join('')+
      '</select>'+
      '<input id="sched-hrs-'+i+'" type="number" min="0" max="12" step="0.5" value="'+(item.hours||0)+'" style="width:56px;padding:5px 8px;background:var(--surf2);border:1px solid var(--bdr);border-radius:7px;color:var(--txt);font-size:12px;font-weight:700;outline:none;text-align:center">'+
      '<span style="font-size:11px;color:var(--mut)">hrs</span>'+
    '</div>';
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr);'+(isToday?'background:var(--ora-bg);border-radius:8px;padding:10px 8px;margin:0 -4px;':'')+'">'+
      '<div style="width:34px;font-size:11px;font-weight:800;color:'+(isToday?'var(--ora)':'var(--sub)')+'">'+item.day+(isToday?'':'')+'</div>'+
      (item.active&&item.section
        ?'<div style="flex:1;background:'+color+'18;border:1px solid '+color+'33;border-radius:7px;padding:7px 11px;display:flex;align-items:center;justify-content:space-between"><span style="font-size:12px;font-weight:700;color:'+color+'">'+item.section+' — '+EXAMS[item.section]?.full?.split(' ')[0]+'</span><span style="font-size:12px;font-weight:800;color:'+color+'">'+item.hours+'h</span></div>'
        :'<div style="flex:1;background:var(--surf2);border-radius:7px;padding:7px 11px;font-size:11px;color:var(--mut);font-style:italic">Rest day '+ico('bed')+'</div>')+
    '</div>';
  }).join('');

  const editControls=editMode?'<div style="background:var(--ind-bg);border:1px solid rgba(90,95,207,.2);border-radius:10px;padding:14px;margin-bottom:14px">'+
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">'+
      '<span style="font-size:12px;font-weight:600;color:var(--sub)">Weekly goal:</span>'+
      '<input id="sched-weekly-hrs" type="range" min="5" max="30" value="'+weeklyHrs+'" style="flex:1;accent-color:var(--ind)" oninput="document.getElementById(\'sched-hrs-lbl\').textContent=this.value+\'h\'">'+
      '<span id="sched-hrs-lbl" style="font-size:13px;font-weight:800;color:var(--ind);min-width:30px">'+weeklyHrs+'h</span>'+
    '</div>'+
    '<div style="display:flex;gap:8px">'+
      '<button onclick="saveStudySchedule()" style="flex:1;padding:9px;background:var(--grn);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">✓ Save</button>'+
      '<button onclick="toggleScheduleEdit()" style="padding:9px 14px;background:transparent;border:1.5px solid var(--bdr);border-radius:9px;font-size:12px;font-weight:600;color:var(--sub);cursor:pointer">Cancel</button>'+
    '</div>'+
  '</div>':'';

  return '<div id="schedule-section"><div class="card card-pad">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'+
      '<div><div class="section-title" style="margin-bottom:2px">Study Schedule</div>'+
      '<div style="font-size:11px;color:var(--mut)">'+totalPlanned.toFixed(1)+'h planned this week</div></div>'+
      (pro
        ?'<button onclick="toggleScheduleEdit()" style="padding:6px 14px;background:'+(editMode?'var(--ind)':'var(--surf2)')+';border:1.5px solid '+(editMode?'var(--ind)':'var(--bdr)')+';border-radius:8px;font-size:11px;font-weight:700;color:'+(editMode?'#fff':'var(--sub)')+';cursor:pointer">Customize</button>'
        :'<button onclick="openUpgradeModal(null)" style="padding:6px 14px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:8px;font-size:11px;font-weight:600;color:var(--mut);cursor:pointer">AI Plan (Pro)</button>')+
    '</div>'+editControls+dayRows+
    (!pro?'<div style="margin-top:14px;padding:12px;background:linear-gradient(135deg,var(--ora-bg),rgba(212,64,0,.04));border:1px solid var(--ora-bdr);border-radius:10px;text-align:center"><div style="font-size:12px;font-weight:700;color:var(--ora);margin-bottom:4px">Want an AI-generated plan?</div><div style="font-size:11px;color:var(--sub);margin-bottom:8px">Pro members get a day-by-day personalized roadmap based on their exam date and progress.</div><button onclick="openUpgradeModal(null)" style="padding:7px 18px;background:var(--ora);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">Upgrade to Pro</button></div>':'') +
  '</div></div>';
}

