// ═══════════════════════════════════════════════
// TODAY — the screen the app opens on. Answers "what do I do right now?":
// today's target, where the streak stands, who else is studying, and whatever
// the exam calendar needs from you today.
// ═══════════════════════════════════════════════
function _addDays(ymd,n){const d=new Date(ymd+'T12:00:00');d.setDate(d.getDate()+n);return _ymd(d);}
function _daysUntil(ymd){if(!ymd)return null;const t=new Date(ymd+'T00:00:00'),n=new Date();n.setHours(0,0,0,0);return Math.round((t-n)/86400000);}
function _fmtDay(ymd,opts){return new Date(ymd+'T12:00:00').toLocaleDateString('en-US',opts||{weekday:'short',month:'short',day:'numeric'});}
// Passes and "sat the exam" posts live in the activity list too; only real sessions count as study time.
function _isStudyAct(a){return !!a&&(!a.type||a.type==='session');}
function _hoursOn(ymd){return (S.activities||[]).filter(a=>a.date&&a.date.slice(0,10)===ymd&&_isStudyAct(a)).reduce((s,a)=>s+(a.hours||0),0);}
function _half(n){return Math.round(n*2)/2;}
function _hrs(n){n=Math.round(n*10)/10;return (n%1===0?String(n):n.toFixed(1))+'h';}
function _thisWeek(){
  const now=new Date(),dow=(now.getDay()+6)%7,mon=new Date(now);mon.setDate(now.getDate()-dow);mon.setHours(0,0,0,0);
  const today=todayStr(),days=[];
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);const key=_ymd(d);days.push({key,hrs:_hoursOn(key),isToday:key===today,future:key>today,lbl:d.toLocaleDateString('en-US',{weekday:'short'}).slice(0,2)});}
  const weekKey=days[0].key;
  const target=(S.commitments&&S.commitments[weekKey])||S.hoursPerWeek||15;
  return {days,weekKey,target,committed:!!(S.commitments&&S.commitments[weekKey]),hrs:days.reduce((s,d)=>s+d.hrs,0)};
}

// One-time tidy-up of saved data. "Passed" posts used to carry the section's
// whole hour total in `hours`, which every hours sum then counted a second time.
function _migrateActivities(){
  if(!S||!Array.isArray(S.activities)) return;
  let dirty=false;
  S.activities.forEach(a=>{ if(a&&a.type==='pass'&&a.hours){ a.sectionHours=a.hours; a.hours=0; dirty=true; } });
  if(dirty) saveState();
}

// How the current section is tracking against its exam date.
function _sectionPace(sec){
  const d=S.examDates&&S.examDates[sec], days=_daysUntil(d);
  if(!d||days===null||days<=0) return null;
  const goal=getHourGoal(sec), logged=getSectionHours(sec), needed=Math.max(0,goal-logged);
  const weeksLeft=Math.max(0.5,days/7), needPerWeek=needed/weeksLeft;
  const recent=(S.activities||[]).filter(a=>_isStudyAct(a)&&Date.now()-new Date(a.date).getTime()<28*86400000).reduce((s,a)=>s+(a.hours||0),0)/4;
  const usual=recent>0.5?recent:(S.hoursPerWeek||15);
  const projected=Math.min(goal,logged+usual*weeksLeft);
  // The date you'd be ready by if nothing changed.
  const realistic=_addDays(todayStr(),Math.ceil(needed/Math.max(usual,1)*7));
  return {sec,date:d,days,goal,logged,needed,needPerWeek,usual,projected,short:Math.max(0,goal-projected),behind:needPerWeek>usual*1.05&&needed>1,realistic};
}

// What today asks of you: the plan's entry for today if there is one, otherwise
// the pace the exam date demands, otherwise an even share of the weekly goal.
function _todayTarget(sec){
  const today=todayStr(), plan=S.aiStudyPlan;
  const pd=plan&&Array.isArray(plan.days)?plan.days.find(d=>d.date===today):null;
  if(pd){
    if(!pd.isStudy) return {section:sec,hours:0,rest:true,why:(pd.blocked&&_planDayLabel(plan,today))||'Rest day on your study plan'};
    const m=(typeof ACTIVITY_MODES!=='undefined'&&ACTIVITY_MODES[pd.mode])||null;
    return {section:pd.section||plan.primarySec||sec,hours:pd.hours||0,why:'From your study plan'+(m?' · '+m.label:'')};
  }
  const pace=_sectionPace(sec);
  if(pace){
    const perDay=pace.needed>0?pace.needed/pace.days*7/6:1; // six study days a week
    return {section:sec,hours:Math.min(5,Math.max(0.5,_half(perDay))),why:pace.days+' day'+(pace.days!==1?'s':'')+' to '+sec+' · '+Math.round(pace.needed)+'h left to cover'};
  }
  const wk=_thisWeek();
  return {section:sec,hours:Math.min(5,Math.max(0.5,_half(wk.target/6))),why:'Based on your '+wk.target+'h weekly goal'};
}

function commitWeekFromToday(hrs){
  const wk=_thisWeek();
  if(!S.commitments) S.commitments={};
  S.commitments[wk.weekKey]=hrs;
  saveState();renderTab();
  showToast('Committed to '+hrs+'h this week','ok');
}

function openMoveExamDate(sec,suggest){
  document.getElementById('move-exam-modal')?.remove();
  const cur=(S.examDates&&S.examDates[sec])||'';
  const el=document.createElement('div');
  el.id='move-exam-modal';
  el.className='modal-overlay open';
  el.style.zIndex='2000';
  el.innerHTML=`<div class="modal-box" style="max-width:400px" onclick="event.stopPropagation()">
    <div class="modal-hdr"><div class="modal-title">${cur?'Move':'Set'} your ${esc(sec)} exam date</div><button class="modal-close" onclick="document.getElementById('move-exam-modal').remove()">×</button></div>
    <div style="padding:4px 22px 22px">
      ${suggest?`<div style="font-size:12.5px;color:var(--sub);line-height:1.55;margin-bottom:14px">At your recent pace you'd finish the hours for ${esc(sec)} around <strong style="color:var(--txt)">${_fmtDay(suggest,{month:'long',day:'numeric'})}</strong>. Rescheduling with Prometric is a separate step — this only updates Ledger.</div>`:''}
      <div class="form-grp"><label>Exam date</label><input type="date" id="mx-date" value="${suggest||cur}" min="${todayStr()}"></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="saveMoveExamDate('${esc(sec)}')">Save date</button>
    </div></div>`;
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.body.appendChild(el);
}
function saveMoveExamDate(sec){
  const v=document.getElementById('mx-date')?.value;
  if(!v){showToast('Pick a date','err');return;}
  if(v<todayStr()){showToast('Pick a date in the future','err');return;}
  document.getElementById('move-exam-modal')?.remove();
  if(S.sectionStatus&&S.sectionStatus[sec]!=='passed'){S.sectionStatus[sec]='studying';}
  setPacingTargetDate(sec,v);
  showToast(sec+' exam set for '+_fmtDay(v,{month:'short',day:'numeric'}),'ok');
}

function _todayHero(sec,tgt,done){
  const ex=EXAMS[tgt.section]||EXAMS[sec]||{color:'#d44000',full:tgt.section};
  const streak=getStreak(), logged=done>0;
  const active=TS.phase==='active'||TS.phase==='paused';
  const stage=examStage(sec);
  const dateLine=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const pct=tgt.hours>0?Math.min(100,Math.round(done/tgt.hours*100)):(logged?100:0);
  const R=50,C=2*Math.PI*R;
  const ring=`<svg width="124" height="124" viewBox="0 0 124 124" class="today-ring" aria-hidden="true">
      <circle cx="62" cy="62" r="${R}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="10"/>
      <circle cx="62" cy="62" r="${R}" fill="none" stroke="${pct>=100?'#34d399':'#ff7a3d'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct/100)}" transform="rotate(-90 62 62)"/>
      <text x="62" y="60" text-anchor="middle" font-size="26" font-weight="800" fill="#fff">${_hrs(done)}</text>
      <text x="62" y="80" text-anchor="middle" font-size="11" font-weight="600" fill="rgba(255,255,255,.6)">${tgt.hours>0?'of '+_hrs(tgt.hours):'today'}</text>
    </svg>`;
  let head,sub,cta;
  const startBtn=(label)=>`<button class="today-cta" id="today-start-btn" onclick="openSessionModal('${tgt.section}')">${label}</button>`;
  const pastBtn=`<button class="today-cta-2" onclick="openSessionModal('${tgt.section}');setTimeout(toggleManualLog,60)">Log a past session</button>`;
  if(stage.k==='examday'){
    head='Exam day. You\'ve done the work.';
    sub=Math.round(getSectionHours(sec))+' hours logged for '+sec+'. Skip the cramming — eat, arrive early, and trust it.';
    cta=`<button class="today-cta" onclick="openSatModal('${sec}')">I sat ${sec}</button><button class="today-cta-2" onclick="openExamDayChecklist()">Exam-day checklist</button>`;
  } else if(active){
    head='Session in progress';
    sub=esc(TS.section)+(TS.material?' · '+esc(TS.material):'')+' · <span id="today-timer">'+fmtElapsed(TS.elapsed)+'</span>'+(TS.phase==='paused'?' (paused)':'');
    cta=`<button class="today-cta" id="today-start-btn" onclick="openSessionModal()">${TS.phase==='paused'?'Resume session':'Open timer'}</button>`;
  } else if(restKind(todayStr())==='rest'&&!logged){
    head='Rest day';
    sub=streak>0?'Your '+streak+'-day streak is safe today. Recharge, and pick it back up tomorrow.':'Recharge today. Pick it back up tomorrow.';
    cta=startBtn('Study anyway')+`<button class="today-cta-2" onclick="cancelRestDay('${todayStr()}')">Undo rest day</button>`;
  } else if(tgt.rest&&!logged){
    head='Rest day';
    sub=esc(tgt.why)+'. Rest is part of the plan — or get ahead if you feel like it.';
    cta=startBtn('Study anyway')+(restKind(todayStr())||restBlocker(todayStr())?pastBtn:`<button class="today-cta-2" onclick="takeRestDay()">Keep my streak: rest today</button>`);
  } else if(tgt.hours>0&&done>=tgt.hours){
    head='Done for today';
    sub=_hrs(done)+' logged — target hit. Anything more is a bonus.';
    cta=startBtn('Keep going')+pastBtn;
  } else if(!(S.activities||[]).some(_isStudyAct)){
    head='Log your first session';
    sub='Start the timer when you sit down to study. '+_hrs(tgt.hours)+' of '+tgt.section+' is a good first day.';
    cta=startBtn('Start Session')+pastBtn;
  } else {
    head=logged?_hrs(Math.max(0,tgt.hours-done))+' to go today':_hrs(tgt.hours)+' of '+tgt.section+' today';
    sub=esc(tgt.why)+(stage.k==='scheduled'&&stage.days===1?' · Exam tomorrow: light review, then sleep.':'');
    cta=startBtn(logged?'Start another session':'Start Session')+pastBtn;
  }
  const hr=new Date().getHours();
  const resting=restKind(todayStr())==='rest'&&!logged;
  const buddyPose=stage.k==='examday'?'cheer':active?'idle':((tgt.rest||resting)&&!logged)?'sleep':(tgt.hours>0&&done>=tgt.hours)?'cheer':!(S.activities||[]).some(_isStudyAct)?'wave':(streak>0&&!logged&&hr>=18)?'worry':logged?'idle':'point';
  const canRest=!logged&&!resting&&!active&&!restBlocker(todayStr());
  const restLink=canRest&&streak>0?`<button class="today-chip-link" onclick="takeRestDay()">or rest today</button>`:'';
  const streakChip=(streak>0
    ?`<span class="today-chip${logged||resting?' ok':' warn'}">${ico('flame')} ${streak}-day streak · ${logged?'safe for today':resting?'resting today':'log today to keep it'}</span>`
    :`<span class="today-chip">${logged?'Streak started today':'Study today to start a streak'}</span>`)
    +restLink+`<button class="today-chip-link" onclick="openRestDayModal()">Rest days</button>`;
  return `<div class="today-hero" id="today-hero" style="--sec:${ex.color}">
    <div class="today-hero-txt">
      <div class="today-eyebrow">${_getGreeting()}, ${S.name} · ${dateLine}</div>
      <h1 class="today-head">${head}</h1>
      <div class="today-sub">${sub}</div>
      <div class="today-cta-row">${cta}</div>
      <div class="today-chip-row">${streakChip}</div>
    </div>
    <div class="today-hero-ring"><div class="today-buddy" id="today-buddy" data-pose="${buddyPose}">${LedgerBuddy(buddyPose,92)}</div><div class="today-ring-col">${ring}<div class="today-ring-lbl"><span class="badge badge-${tgt.section}" style="background:rgba(255,255,255,.14);color:#fff">${tgt.section}</span></div></div></div>
  </div>`;
}

function _todayCatchUp(sec){
  const p=_sectionPace(sec);
  if(!p||!p.behind) return '';
  if(localStorage.getItem('todayCatchupDismissed')===todayStr()) return '';
  const perDay=Math.max(0.5,_half(p.needPerWeek/6)), commit=Math.ceil(p.needPerWeek);
  const doable=p.needPerWeek<=Math.max(p.usual*1.6,p.usual+8);
  return `<div class="card card-pad today-card" id="today-catchup" style="border-color:rgba(239,68,68,.35)">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="flex:1;min-width:0">
        <div class="section-title" style="color:var(--far);margin-bottom:6px">Behind on ${sec}</div>
        <div style="font-size:15px;font-weight:800;line-height:1.35">At ${_hrs(p.usual)} a week you'll reach about ${Math.round(p.projected)} of ${p.goal} hours by ${_fmtDay(p.date,{month:'short',day:'numeric'})} — ${Math.round(p.short)}h short.</div>
        <div style="font-size:12.5px;color:var(--sub);line-height:1.55;margin-top:6px">${doable
          ?`The catch-up: <strong style="color:var(--txt)">${_hrs(perDay)} a day, six days a week</strong> (${_hrs(p.needPerWeek)} a week) from now until the exam.`
          :`Catching up would take ${_hrs(p.needPerWeek)} a week. That's a lot on top of a job — moving the date may be the better call.`}</div>
      </div>
      <button onclick="localStorage.setItem('todayCatchupDismissed','${todayStr()}');document.getElementById('today-catchup').remove()" title="Hide for today" aria-label="Hide for today" style="background:none;border:none;color:var(--mut);font-size:20px;line-height:1;cursor:pointer;padding:0 2px;flex-shrink:0">×</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
      ${doable?`<button class="btn btn-primary btn-sm" onclick="commitWeekFromToday(${commit})">Commit to ${commit}h this week</button>`:''}
      <button class="btn btn-ghost btn-sm" onclick="openMoveExamDate('${sec}','${p.realistic}')">Move my exam date</button>
    </div>
  </div>`;
}

function _todayWeek(){
  const wk=_thisWeek();
  const pct=Math.min(100,Math.round(wk.hrs/Math.max(1,wk.target)*100));
  const cells=wk.days.map(d=>{
    const rk=d.hrs>0?null:restKind(d.key);
    return `<div class="today-day${d.isToday?' is-today':''}${d.hrs>0?' done':''}${d.future?' future':''}${rk?' rest':''}" title="${_fmtDay(d.key)}: ${rk==='rest'?'rest day':rk==='shield'?'covered by a Streak Shield':_hrs(d.hrs)}">
      <div class="today-day-dot">${d.hrs>0?_hrs(d.hrs).replace('h',''):rk?(rk==='rest'?'R':ico('shield')):''}</div><div class="today-day-lbl">${d.lbl}</div></div>`;}).join('');
  return `<div class="card card-pad today-card" id="today-week">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:12px">
      <div class="section-title" style="margin:0">This week</div>
      <div style="font-size:12px;color:var(--mut)"><strong style="color:var(--txt)">${_hrs(wk.hrs)}</strong> of ${wk.target}h${wk.committed?' · committed':''}</div>
    </div>
    <div class="today-days">${cells}</div>
    <div class="prog-bar" style="height:6px;margin-top:14px"><div class="prog-fill" style="width:${pct}%;background:${pct>=100?'var(--grn)':'var(--ind)'}"></div></div>
  </div>`;
}

function _todayCrew(){
  const today=todayStr();
  const followed=(REAL_USERS||[]).filter(f=>(S.following||[]).includes(f.id));
  if(!followed.length){
    return `<div class="card card-pad today-card" id="today-crew">
      <div class="section-title">Your crew today</div>
      <div style="font-size:13px;color:var(--sub);line-height:1.55;margin-bottom:12px">Nobody here yet. People who study alongside someone are far more likely to show up — follow a few candidates or bring a friend.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ind btn-sm" onclick="switchTab('explore')">Find people</button><button class="btn btn-ghost btn-sm" onclick="shareInvite()">Invite a friend</button></div>
      <div id="today-live" style="margin-top:0"></div>
    </div>`;
  }
  const rows=followed.map(f=>{
    const acts=(f.activities||[]).filter(a=>a.date&&a.date.slice(0,10)===today&&_isStudyAct(a));
    const hrs=acts.reduce((s,a)=>s+(a.hours||0),0);
    const resting=(f.restDays||[]).includes(today);
    const nb=typeof nudgeBlocker==='function'?nudgeBlocker(f):'n/a';
    return {f,hrs,sec:acts.length?acts[acts.length-1].section:'',visible:(f.activities||[]).length>0,partner:S.accountabilityPartner===f.id,resting,
      canNudge:hrs===0&&!resting&&(nb===''||nb==='done'),nudged:nb==='done'};
  }).sort((a,b)=>(b.partner-a.partner)||(b.hrs-a.hrs)||(b.canNudge-a.canNudge)||((b.f.streak||0)-(a.f.streak||0)));
  const studied=rows.filter(r=>r.hrs>0).length;
  const waiting=rows.filter(r=>r.canNudge);
  const iStudied=_hoursOn(today)>0;
  const list=rows.slice(0,6).map(r=>{
    const f=r.f;
    const status=r.hrs>0?`<span style="color:var(--grn);font-weight:700">${_hrs(r.hrs)}${r.sec?' '+esc(r.sec):''} today</span>`
      :r.resting?'Rest day'
      :r.visible?'Not yet today'+(f.streak?' · '+f.streak+'d streak':''):(f.streak?f.streak+'d streak':'CPA candidate');
    const av=f.profilePic?`<img src="${f.profilePic}" alt="" style="width:100%;height:100%;object-fit:cover">`:esc(f.initials||'?');
    const right=r.canNudge&&iStudied
      ?`<button class="nudge-btn${r.nudged?' sent':''}" ${r.nudged?'disabled':''} onclick="event.stopPropagation();sendNudge('${f.id}',this)" aria-label="Nudge ${esc(f.name)} to study">${r.nudged?'Nudged':'Nudge'}</button>`
      :`<span class="today-dot${r.hrs>0?' on':''}"></span>`;
    return `<div class="today-crew-row" onclick="openUserProfile('${f.id}')">
      <div class="avatar av-sm" style="background:${f.color};color:#fff;overflow:hidden;padding:0;position:relative">${av}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}${r.partner?' <span class="today-tag">Partner</span>':''}</div>
        <div style="font-size:11px;color:var(--mut)">${status}</div>
      </div>
      ${right}
    </div>`;
  }).join('');
  // Who nudged me today (until I study).
  const inbox=!iStudied&&typeof nudgesToday==='function'?nudgesToday():[];
  const nudgedMe=inbox.length?`<div class="nudge-in" role="status">
      <span class="nudge-in-ic">${ico('wave')}</span>
      <span style="flex:1;min-width:0"><strong>${esc(inbox[0].name.split(' ')[0])}</strong>${inbox.length>1?' and '+(inbox.length-1)+' other'+(inbox.length>2?'s':''):''} nudged you to study today.</span>
      <button class="btn btn-primary btn-xs" onclick="openSessionModal()">Start</button>
    </div>`:'';
  const hint=waiting.length&&iStudied?`<div class="nudge-hint">${waiting.length===1?esc(waiting[0].f.name.split(' ')[0])+' hasn’t':waiting.length+' people haven’t'} studied yet. A nudge helps.</div>`
    :waiting.length?`<div class="nudge-hint">${waiting.length===1?'1 person hasn’t':waiting.length+' people haven’t'} studied yet today. Log a session and you can nudge them.</div>`:'';
  return `<div class="card card-pad today-card" id="today-crew">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:10px">
      <div class="section-title" style="margin:0">Your crew today</div>
      <div style="font-size:12px;color:var(--mut)"><strong style="color:var(--txt)">${studied}</strong> of ${followed.length} studied</div>
    </div>
    ${nudgedMe}
    <div id="today-live"></div>
    ${hint}
    ${list}
    ${followed.length>6?`<button class="btn btn-ghost btn-xs" style="width:100%;justify-content:center;margin-top:8px" onclick="switchTab('feed')">See everyone in the feed →</button>`:''}
  </div>`;
}

function _todayQuick(){
  const b=(icon,label,sub,on)=>`<button class="today-quick" onclick="${on}"><span class="today-quick-ic">${ico(icon)}</span><span><span class="today-quick-l">${label}</span><span class="today-quick-s">${sub}</span></span></button>`;
  return `<div class="today-quick-row">
    ${b('⬡','Practice questions','Drill a quick set',"switchTab('studylab')")}
    ${b('calendarDays','Study plan','See the days ahead',"switchTab('plan')")}
    ${b('▦','Progress','Readiness and pacing',"switchTab('dashboard')")}
  </div>`;
}

function buildToday(){
  const sec=getCurrentSection();
  const tgt=_todayTarget(sec);
  const done=_hoursOn(todayStr());
  return `<div class="today-wrap">
    <div class="today-main">
      ${_todayHero(sec,tgt,done)}
      ${buildJourneyPrompts()}
      ${_todayCatchUp(sec)}
      ${_todayPushPrompt()}
      ${_todayWeek()}
      ${typeof buildWeekRecapPrompt==='function'?buildWeekRecapPrompt():''}
      ${_todayQuick()}
    </div>
    <div class="today-side">
      ${_todayCrew()}
      <div id="today-rooms">${typeof buildRoomsCard==='function'?buildRoomsCard():''}</div>
      ${buildExamJourney()}
    </div>
  </div>`;
}

// Runs after the Today tab is painted: live timer text and "studying right now".
let _todayTick=null;
function _todayAfterRender(){
  clearInterval(_todayTick);
  _todayTick=setInterval(()=>{
    const el=document.getElementById('today-timer');
    if(!el||currentTab!=='today'){clearInterval(_todayTick);_todayTick=null;return;}
    el.textContent=fmtElapsed(TS.elapsed);
  },1000);
  _loadTodayLive();
  if(typeof watchRooms==='function') watchRooms();
}
// One read of "studying now" across my clubs, so Today shows it without opening each club.
async function _loadTodayLive(){
  if(!firebaseDb||!AUTH||!AUTH.uid) return;
  const clubs=(S.clubs||[]).filter(c=>!c.isDM&&c.id).slice(0,6);
  if(!clubs.length) return;
  const seen=new Map(), now=Date.now();
  await Promise.all(clubs.map(c=>firebaseDb.collection('clubs').doc(c.id).collection('presence').get().then(s=>{
    s.docs.forEach(d=>{const p=d.data();if(p&&p.lastBeat&&now-p.lastBeat<120000&&p.uid!==AUTH.uid) seen.set(p.uid,p);});
  }).catch(()=>{})));
  const host=document.getElementById('today-live'); if(!host||!seen.size) return;
  const live=[...seen.values()];
  const who=live.length===1?esc(live[0].name||'Someone')+(live[0].section?' is studying '+esc(live[0].section):' is studying')+' right now':live.length+' people in your clubs are studying right now';
  host.innerHTML=`<div class="today-live"><span class="today-live-dot"></span><span style="flex:1;min-width:0">${who}</span><button class="btn btn-xs" style="background:#22c55e;color:#04301c;border:none;font-weight:800" onclick="openSessionModal()">Join in</button></div>`;
}

// ═══════════════════════════════════════════════
// EXAM JOURNEY — what happens around the exam itself: sitting it, waiting for
// the score, passing, or regrouping for a retake.
// ═══════════════════════════════════════════════
// Target release dates for the discipline sections' testing windows (AICPA
// targets; they can move). Core sections are scored on a rolling basis.
const DISC_RELEASES=[['2026-10','2026-12-15'],['2027-01','2027-03-16'],['2027-04','2027-06-09']];
const SCORE_RELEASE_URL='https://www.aicpa-cima.com/resources/article/find-out-when-youll-get-your-cpa-exam-score';
function estScoreRelease(section,sitDate){
  const ex=EXAMS[section]||{};
  if(ex.isCore===false){
    const hit=DISC_RELEASES.find(r=>sitDate.slice(0,7)===r[0]);
    return hit?{date:hit[1],exact:true}:{date:_addDays(sitDate,60),exact:false};
  }
  return {date:_addDays(sitDate,21),exact:false};
}

// Where a section stands. One of: passed, awaiting (sat, no score yet),
// examday, checkin (exam date went by and we don't know what happened),
// scheduled, retake (failed, no new date), studying, planned.
function examStage(s){
  if((S.sectionPassed||[]).includes(s)) return {k:'passed'};
  const sit=(S.examSits||{})[s];
  if(sit) return {k:'awaiting',sit,days:_daysUntil(sit.expectedRelease)};
  const last=getLastExamResult(s), retake=!!(last&&!last.passed);
  const d=S.examDates&&S.examDates[s], days=_daysUntil(d);
  if(d&&days!==null){
    if(days===0) return {k:'examday',date:d,retake};
    if(days>0) return {k:'scheduled',date:d,days,retake};
    if(days>=-45&&!(last&&last.sitDate>=d)) return {k:'checkin',date:d,daysAgo:-days,retake};
  }
  if(retake) return {k:'retake',last};
  return {k:getSectionHours(s)>0?'studying':'planned'};
}

function openSatModal(section){
  document.getElementById('sat-modal')?.remove();
  const d=(S.examDates&&S.examDates[section])||todayStr();
  const sitDate=d>todayStr()?todayStr():d;
  const est=estScoreRelease(section,sitDate);
  const el=document.createElement('div');
  el.id='sat-modal';
  el.className='modal-overlay open';
  el.style.zIndex='2000';
  el.innerHTML=`<div class="modal-box" style="max-width:430px" onclick="event.stopPropagation()">
    <div class="modal-hdr"><div class="modal-title">You sat ${esc(section)}</div><button class="modal-close" onclick="document.getElementById('sat-modal').remove()">×</button></div>
    <div style="padding:4px 22px 22px">
      <div style="font-size:13px;color:var(--sub);line-height:1.55;margin-bottom:16px">The hard part is behind you. Ledger will count down to your score and keep your streak honest while you wait.</div>
      <div class="form-grp"><label>Date you sat</label><input type="date" id="sat-date" value="${sitDate}" max="${todayStr()}" onchange="_satDateChanged('${esc(section)}')"></div>
      <div class="form-grp"><label>Score expected</label><input type="date" id="sat-release" value="${est.date}">
        <div id="sat-release-note" style="font-size:11px;color:var(--mut);margin-top:5px;line-height:1.5">${_satReleaseNote(est)}</div></div>
      <label style="display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--sub);margin:4px 0 16px;cursor:pointer"><input type="checkbox" id="sat-share" ${privacyPref('share_activity')?'checked':''} style="width:16px;height:16px;accent-color:var(--ora)"> Tell my followers I sat ${esc(section)}</label>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="saveSat('${esc(section)}')">Start the countdown</button>
    </div></div>`;
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.body.appendChild(el);
}
function _satReleaseNote(est){
  return (est.exact?'The AICPA\'s target release for this testing window.':'A rough estimate — release dates depend on when you tested.')+
    ` <a href="${SCORE_RELEASE_URL}" target="_blank" rel="noopener" style="color:var(--ind);font-weight:600">Check the AICPA's schedule</a> and change it if yours differs.`;
}
function _satDateChanged(section){
  const v=document.getElementById('sat-date')?.value; if(!v) return;
  const est=estScoreRelease(section,v);
  const r=document.getElementById('sat-release'), n=document.getElementById('sat-release-note');
  if(r) r.value=est.date; if(n) n.innerHTML=_satReleaseNote(est);
}
function saveSat(section){
  const sitDate=document.getElementById('sat-date')?.value, rel=document.getElementById('sat-release')?.value;
  const share=!!document.getElementById('sat-share')?.checked;
  if(!sitDate||sitDate>todayStr()){showToast('Enter the date you sat the exam','err');return;}
  if(!rel||rel<sitDate){showToast('The score date should be after the exam date','err');return;}
  if(!S.examSits) S.examSits={};
  S.examSits[section]={sitDate,expectedRelease:rel,loggedAt:Date.now()};
  if(share&&!(S.activities||[]).some(a=>a.type==='sat'&&a.section===section&&a.sitDate===sitDate)){
    S.activities.push({id:'x'+Date.now(),type:'sat',date:todayStr()+'T'+new Date().toTimeString().slice(0,8),section,sitDate,hours:0,sectionHours:Math.round(getSectionHours(section)),kudos:[],comments:[]});
  }
  logLedgerEvent('exam_sat',{section});
  saveState();
  document.getElementById('sat-modal')?.remove();
  renderTab();
  burstConfetti(document.getElementById('today-hero')||document.body);
  showToast(section+' is done. Score expected '+_fmtDay(rel,{month:'short',day:'numeric'})+'.','ok');
}
function cancelSat(section){
  if(!S.examSits||!S.examSits[section]) return;
  if(!confirm('Remove the '+section+' score countdown?')) return;
  const sit=S.examSits[section];
  delete S.examSits[section];
  const i=(S.activities||[]).findIndex(a=>a.type==='sat'&&a.section===section&&a.sitDate===sit.sitDate);
  if(i>=0){ S.deletedActs=[...(S.deletedActs||[]),S.activities[i].id].slice(-500); S.activities.splice(i,1); }
  saveState();renderTab();
}

function _failOdds(section){
  const pr=(EXAMS[section]||{}).passRate;
  if(!pr) return 'Plenty of people who go on to be CPAs failed a section first.';
  return pr<50?'Most people who sit '+section+' don\'t pass it on a given attempt.':'About '+(100-pr)+' in 100 people who sit '+section+' don\'t pass it on a given attempt.';
}
// A fail is private and gets a plan, not a toast.
function openRetakeModal(section,score){
  document.getElementById('retake-modal')?.remove();
  const gap=75-score, hrs=Math.round(getSectionHours(section));
  const last=getLastExamResult(section)||{};
  const el=document.createElement('div');
  el.id='retake-modal';
  el.className='modal-overlay open';
  el.style.zIndex='2000';
  const close="document.getElementById('retake-modal').remove()";
  el.innerHTML=`<div class="modal-box" style="max-width:440px" onclick="event.stopPropagation()">
    <div class="modal-hdr"><div class="modal-title">${esc(section)}: ${score}</div><button class="modal-close" onclick="${close}">×</button></div>
    <div style="padding:4px 22px 22px">
      <div style="font-size:15px;font-weight:800;line-height:1.4;margin-bottom:8px">${gap<=5?gap+' point'+(gap!==1?'s':'')+' short. That is close.':'Not the result you wanted. It\'s a setback, not a verdict.'}</div>
      <div style="font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:16px">${_failOdds(section)} ${hrs>0?'Your '+hrs+' hours on '+esc(section)+' still count — a':'A'} retake starts from what you already know, and your score report shows where to aim. Only you can see this result.</div>
      <div class="form-grp"><label>Retake date <span style="font-weight:400;color:var(--mut)">(you can change it later)</span></label><input type="date" id="rt-date" min="${todayStr()}" value=""></div>
      <div class="form-grp"><label>NTS expires <span style="font-weight:400;color:var(--mut)">(optional)</span></label><input type="date" id="rt-nts" value="${last.ntsExpiry||''}"></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="saveRetake('${esc(section)}')">Set my retake</button>
      <button onclick="${close}" style="width:100%;margin-top:8px;padding:10px;background:none;border:none;font-size:12.5px;color:var(--mut);cursor:pointer;font-family:inherit">Not yet — I need a minute</button>
    </div></div>`;
  document.body.appendChild(el);
}
function saveRetake(section){
  const d=document.getElementById('rt-date')?.value, nts=document.getElementById('rt-nts')?.value||null;
  if(!d){showToast('Pick a retake date, or come back to this later','err');return;}
  if(d<todayStr()){showToast('Pick a date in the future','err');return;}
  const last=getLastExamResult(section); if(last&&nts) last.ntsExpiry=nts;
  if(!S.sectionStatus) S.sectionStatus={};
  S.sectionStatus[section]='studying';
  document.getElementById('retake-modal')?.remove();
  logLedgerEvent('retake_scheduled',{section});
  setPacingTargetDate(section,d);
  showToast(section+' retake set for '+_fmtDay(d,{month:'short',day:'numeric'})+'. One day at a time.','ok');
}

function openExamDayChecklist(){
  openSubTab('dashboard','exams');
  setTimeout(()=>{
    const b=document.getElementById('exam-protocol-body');
    if(b&&b.style.display==='none'&&typeof _toggleExamProtocol==='function') _toggleExamProtocol();
    (document.getElementById('exam-protocol-card')||document.getElementById('page-content'))?.scrollIntoView({behavior:'smooth',block:'start'});
  },250);
}

// Cards that need an answer from you today: an exam date that went by, a score that's due.
function buildJourneyPrompts(){
  const out=[];
  (S.sections||[]).forEach(s=>{
    const st=examStage(s), ex=EXAMS[s]||{color:'var(--ora)'};
    if(st.k==='checkin'){
      if(localStorage.getItem('journeyCheckinDismissed_'+s)===st.date) return;
      out.push(`<div class="card card-pad today-card journey-prompt" data-journey="${s}" style="border-left:4px solid ${ex.color}">
        <div style="font-size:15px;font-weight:800">How did ${s} go on ${_fmtDay(st.date,{month:'short',day:'numeric'})}?</div>
        <div style="font-size:12.5px;color:var(--sub);margin-top:4px;line-height:1.5">Your exam date has passed. Tell Ledger what happened so your plan stays right.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn btn-primary btn-sm" onclick="openSatModal('${s}')">I sat it</button>
          <button class="btn btn-ghost btn-sm" onclick="openMoveExamDate('${s}')">I rescheduled</button>
          <button class="btn btn-ghost btn-sm" onclick="localStorage.setItem('journeyCheckinDismissed_${s}','${st.date}');renderTab()">Dismiss</button>
        </div></div>`);
    } else if(st.k==='awaiting'){
      const due=st.days!==null&&st.days<=0;
      out.push(`<div class="card card-pad today-card journey-prompt" data-journey="${s}" style="border-left:4px solid ${ex.color}">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="journey-count" style="color:${ex.color}">${due?'✓':st.days}<span>${due?'due':'day'+(st.days!==1?'s':'')}</span></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:800">${due?s+' scores should be out':s+' score expected '+_fmtDay(st.sit.expectedRelease)}</div>
            <div style="font-size:12.5px;color:var(--sub);margin-top:3px;line-height:1.5">${due?'Check your state board or NASBA, then log it here.':'Sat '+_fmtDay(st.sit.sitDate,{month:'short',day:'numeric'})+'. Waiting is the worst part — a head start on your next section helps.'}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn ${due?'btn-primary':'btn-ghost'} btn-sm" onclick="openLogResultModal('${s}')">Log my score</button>
          <button class="btn btn-ghost btn-sm" onclick="cancelSat('${s}')">Remove</button>
        </div></div>`);
    } else if(st.k==='retake'){
      out.push(`<div class="card card-pad today-card journey-prompt" data-journey="${s}" style="border-left:4px solid ${ex.color}">
        <div style="font-size:15px;font-weight:800">Ready to plan your ${s} retake?</div>
        <div style="font-size:12.5px;color:var(--sub);margin-top:4px;line-height:1.5">Pick a date and Ledger rebuilds your daily target around it.</div>
        <div style="margin-top:12px"><button class="btn btn-primary btn-sm" onclick="openRetakeModal('${s}',${st.last.score})">Set a retake date</button></div></div>`);
    }
  });
  return out.join('');
}

// The whole exam at a glance: one track per section.
function buildExamJourney(){
  const secs=S.sections||[];
  if(!secs.length) return '';
  const STEPS=['Study','Scheduled','Sat','Passed'];
  const rows=secs.map(s=>{
    const st=examStage(s), ex=EXAMS[s]||{color:'var(--ora)'};
    let at=0,label='',action='';
    if(st.k==='passed'){at=4;label='Passed';}
    else if(st.k==='awaiting'){at=3;label=st.days!==null&&st.days<=0?'Score due':'Score in '+st.days+'d';action=`<button class="btn btn-ghost btn-xs" onclick="openLogResultModal('${s}')">Log score</button>`;}
    else if(st.k==='examday'){at=2;label='Exam today';action=`<button class="btn btn-ghost btn-xs" onclick="openSatModal('${s}')">I sat it</button>`;}
    else if(st.k==='scheduled'){at=2;label=(st.retake?'Retake in ':'Exam in ')+st.days+'d';action=`<button class="btn btn-ghost btn-xs" onclick="openMoveExamDate('${s}')">${_fmtDay(st.date,{month:'short',day:'numeric'})}</button>`;}
    else if(st.k==='checkin'){at=2;label='Exam date passed';action=`<button class="btn btn-ghost btn-xs" onclick="openSatModal('${s}')">I sat it</button>`;}
    else if(st.k==='retake'){at=1;label='Retake — no date yet';action=`<button class="btn btn-ghost btn-xs" onclick="openRetakeModal('${s}',${st.last.score})">Set date</button>`;}
    else {at=st.k==='studying'?1:0;label=st.k==='studying'?Math.round(getSectionHours(s))+'h logged':'Not started';action=`<button class="btn btn-ghost btn-xs" onclick="openMoveExamDate('${s}')">Set date</button>`;}
    const track=STEPS.map((n,i)=>`<span class="journey-seg${i<at?' on':''}" style="${i<at?'background:'+ex.color:''}" title="${n}"></span>`).join('');
    return `<div class="journey-row" data-stage="${st.k}">
      <span class="badge badge-${s}" style="min-width:44px;justify-content:center">${s}</span>
      <div style="flex:1;min-width:0"><div class="journey-track">${track}</div><div style="font-size:11px;color:var(--mut);margin-top:4px">${label}</div></div>
      ${action}
    </div>`;
  }).join('');
  // Credit window: once one section is passed the clock is running on the rest.
  let windowLine='';
  const firstPass=(S.examResults||[]).filter(r=>r.passed&&r.sitDate).sort((a,b)=>a.sitDate.localeCompare(b.sitDate))[0];
  const passedN=(S.sectionPassed||[]).length;
  if(firstPass&&passedN>0&&passedN<secs.length){
    const months=S.creditMonths||30;
    const end=new Date(firstPass.sitDate+'T12:00:00');end.setMonth(end.getMonth()+months);
    const left=Math.round((end-Date.now())/86400000/30.4);
    windowLine=`<div style="font-size:11px;color:var(--mut);line-height:1.55;margin-top:12px;padding-top:12px;border-top:1px solid var(--bdr)">Your ${esc(firstPass.section)} credit runs to about <strong style="color:var(--txt)">${end.toLocaleDateString('en-US',{month:'short',year:'numeric'})}</strong>${left>0?' ('+left+' months left)':''} on a
      <select onchange="S.creditMonths=parseInt(this.value);saveState();renderTab()" style="background:var(--surf2);border:1px solid var(--bdr);border-radius:6px;color:var(--sub);font-size:11px;padding:1px 4px">${[18,24,30,36].map(m=>`<option value="${m}"${m===months?' selected':''}>${m}-month</option>`).join('')}</select>
      window. Rules vary by state — confirm with your board.</div>`;
  }
  return `<div class="card card-pad today-card" id="exam-journey">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:12px">
      <div class="section-title" style="margin:0">Exam journey</div>
      <div style="font-size:12px;color:var(--mut)"><strong style="color:var(--txt)">${passedN}</strong> of ${secs.length} passed</div>
    </div>
    ${rows}${windowLine}
  </div>`;
}

// "Sat for the exam" post in the feed.
function buildSatCard(a,ex){
  ex=ex||EXAMS[a.section]||{color:'var(--ind)',full:a.section};
  const propCount=Array.isArray(a.kudos)?a.kudos.length:0, commentCount=Array.isArray(a.comments)?a.comments.length:0;
  const hasGivenProps=Array.isArray(a.kudos)&&(a.kudos.includes('you')||a.kudos.includes(AUTH?.uid));
  const _pic=a.userPic||(a.isMine?S?.profilePic:'')||'';
  const av=_pic?`<img src="${_pic}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`${a.userInitials||''}`;
  return `<div class="activity-card sat-card" style="margin-bottom:16px;overflow:hidden" data-aid="${a.id}" data-uid="${a.userId}">
  <div class="ac-header">
    <div class="avatar av-md" style="background:${a.userColor};color:#fff;cursor:pointer;overflow:hidden" onclick="openUserProfile('${a.userId}')">${av}</div>
    <div style="flex:1;min-width:0">
      <span class="ac-user-name" style="cursor:pointer" onclick="openUserProfile('${a.userId}')">${a.userName}${a.isMine?' <span style="font-size:10px;color:var(--mut);font-weight:400">(you)</span>':''}</span>
      <div class="ac-meta">${timeAgo(a.date)} · ${ex.full}</div>
    </div>
    <span class="badge badge-${a.section}">${a.section}</span>
    ${a.isMine?'':`<button class="ac-more" aria-label="More options" title="Report or block" onclick="event.stopPropagation();_postMore('${a.id}','${a.userId}')">⋯</button>`}
  </div>
  <div style="margin:0 16px 12px;padding:16px;border-radius:12px;background:${ex.color}12;border:1px solid ${ex.color}33;text-align:center">
    <div style="font-size:17px;font-weight:900;letter-spacing:-.01em">Sat for ${a.section}</div>
    <div style="font-size:12px;color:var(--sub);margin-top:4px">${a.sectionHours?a.sectionHours+' hours of study behind it. ':''}Now the wait for the score.</div>
  </div>
  <div class="ac-actions">
    <button class="ac-action${hasGivenProps?' props-given':''}" onclick="giveProps('${a.id}','${a.userId}')" data-props="${a.id}"><span>${hasGivenProps?ico('heartFilled'):ico('heartOutline')}</span> Props <span style="font-weight:800;color:${hasGivenProps?'var(--ora)':'var(--mut)'}">${propCount}</span></button>
    <button class="ac-action" onclick="openComments('${a.id}','${a.userId}')">Comment <span style="font-weight:800;color:var(--mut)">${commentCount}</span></button>
  </div>
</div>`;
}

