// ═══════════════════════════════════════════════
// FEED CHALLENGE CARD
// ═══════════════════════════════════════════════
function buildFeedChallengeCard(){
  // Pick up to 2 challenges not yet done, prioritise the current section's challenges
  const curSec=getCurrentSection();
  const notDone=CHALLENGES.filter(c=>!isChallengeDone(c));
  if(!notDone.length)return'';
  const relevant=notDone.filter(c=>c.section===curSec||!c.section).sort((a,b)=>isJoined(a.id)?-1:isJoined(b.id)?1:0);
  const picks=(relevant.length?relevant:notDone).slice(0,2);
  return`<div class="feed-ch-card">
  <div style="padding:14px 16px 0;display:flex;align-items:center;gap:7px">
    <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--ora),#d97706);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;flex-shrink:0">${ico('bolt',{plain:1})}</div>
    <span style="font-size:10px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.08em">Suggested Challenges</span>
  </div>
  <div style="padding:6px 16px 4px">
    ${picks.map(c=>{
      const prog=getChallengeProgress(c);
      const pct=c.target?Math.min(100,Math.round(prog/c.target*100)):0;
      const joined=isJoined(c.id);
      return`<div class="feed-ch-row">
        <div style="font-size:26px;flex-shrink:0;width:36px;text-align:center">${ico(c.icon)}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:800">${c.title}</span>
            <span style="font-size:9px;font-weight:700;color:${_textTone(c.diffColor)};background:${c.diffColor}18;padding:1px 7px;border-radius:20px;letter-spacing:.03em">${c.difficulty}</span>
            ${joined?'<span style="font-size:9px;font-weight:700;color:var(--grn);background:var(--grn-bg);padding:1px 7px;border-radius:20px">Joined ✓</span>':''}
          </div>
          <div style="font-size:11px;color:var(--sub);margin-bottom:6px">${c.desc}</div>
          <div style="background:var(--surf2);border-radius:4px;height:5px;overflow:hidden;margin-bottom:4px">
            <div style="height:100%;background:${c.diffColor};width:${pct}%;border-radius:4px;transition:width .6s"></div>
          </div>
          <div style="font-size:10px;color:var(--mut)">${prog} / ${c.target} &nbsp;·&nbsp; Earn "${c.reward}"</div>
        </div>
        <button onclick="switchTab('explore')" style="flex-shrink:0;margin-left:12px;padding:7px 13px;background:${joined?'var(--surf2)':'var(--ora)'};color:${joined?'var(--sub)':'#fff'};border:${joined?'1px solid var(--bdr)':'none'};border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">${joined?'View →':'Join →'}</button>
      </div>`;
    }).join('')}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════
// FEED
// ═══════════════════════════════════════════════
function buildFeed(){
  // Aggregate all activities: yours + followed friends
  const allActivities=[];
  // Your activities
  (S.activities||[]).forEach(a=>{
    allActivities.push({...a,userId:'you',userName:S.name,userInitials:S.name.slice(0,2).toUpperCase(),userColor:'#4f46e5',isMine:true});
  });
  // Friends
  REAL_USERS.forEach(f=>{
    if((S.following||[]).includes(f.id)){
      f.activities.forEach(a=>{
        allActivities.push({...a,userId:f.id,userName:f.name,userInitials:f.initials,userColor:f.color,userPic:f.profilePic||'',isMine:false});
      });
    }
  });
  // Sort newest first
  allActivities.sort((a,b)=>new Date(b.date)-new Date(a.date));


  const leftSidebar=`
<div class="sidebar-left">
  <div class="card card-pad" style="margin-bottom:var(--sp-4)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div class="avatar av-md" style="background:var(--ora);color:#fff;overflow:hidden;padding:0;cursor:pointer" onclick="switchTab('profile')" title="View profile">
        ${S.profilePic?`<img src="${S.profilePic}" alt="Your profile photo" style="width:100%;height:100%;object-fit:cover">`:`<span>${S.name.slice(0,2).toUpperCase()}</span>`}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:800;cursor:pointer" onclick="switchTab('profile')">${S.name}</div>
        <div style="font-size:11px;color:var(--mut)">${S.state} · ${S.disc} Discipline</div>
      </div>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:4px;justify-content:center" onclick="openSessionModal()">Start Session</button>
  </div>
  <div class="card card-pad">
    <div class="section-title">My Sections</div>
    ${(S.sections||[]).map(s=>{
      const hrs=getSectionHours(s);
      const pct=Math.min(100,Math.round(hrs/getHourGoal(s)*100));
      const status=S.sectionStatus?.[s]||'planned';
      return`<div style="margin-bottom:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span class="badge badge-${s}">${s}</span>
          <span style="font-size:10px;color:var(--mut)">${hrs}h / ${getHourGoal(s)}h</span>
        </div>
        <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${EXAMS[s].color}"></div></div>
      </div>`;
    }).join('')}
  </div>
</div>`;

  const rightSidebar=`
<div class="sidebar-right">
  <div class="card card-pad" style="margin-bottom:var(--sp-4)">
    <div class="section-title">Your Week</div>
    ${buildMiniLeaderboard()}
  </div>
  ${buildCohortCard()}
  <div class="card card-pad">
    <div class="section-title">Who's Studying</div>
    ${(()=>{
      const followed=REAL_USERS.filter(f=>(S.following||[]).includes(f.id));
      if(!followed.length) return`<div style="text-align:center;padding:12px 0">
        <div style="font-size:24px;margin-bottom:6px">${ico('wave')}</div>
        <div style="font-size:12px;color:var(--mut);line-height:1.55;margin-bottom:10px">Follow people to see who's studying live alongside you.</div>
        <button class="btn btn-ghost btn-xs" style="width:100%;justify-content:center" onclick="switchTab('explore')">Find People to Follow →</button>
      </div>`;
      return followed.slice(0,4).map(f=>`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;border-radius:8px;padding:4px;transition:background .12s" onclick="openUserProfile('${f.id}')" onmouseover="this.style.background='var(--surf2)'" onmouseout="this.style.background='transparent'">
        <div class="avatar av-sm" style="background:${f.color};color:#fff">${f.initials}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
          <div style="font-size:10px;color:var(--mut)">${f.currentSection||'CPA ✓'} · ${f.streak}d streak</div>
        </div>
        <div style="width:8px;height:8px;border-radius:50%;background:${f.streak>0?'var(--grn)':'var(--bdr)'}"></div>
      </div>`).join('');
    })()}
  </div>
</div>`;

  const actCards=allActivities.map(a=>buildActivityCard(a));
  if(!isPro()&&actCards.length>0){
    actCards.splice(Math.min(2,actCards.length),0,buildPartnerTeaserCard());
  }
  // Inject challenge suggestion card after every 5th activity (first at index 4)
  const _chCard=buildFeedChallengeCard();
  if(_chCard){
    for(let _i=4;_i<actCards.length;_i+=6){actCards.splice(_i,0,_chCard);}
    if(actCards.length<=4)actCards.push(_chCard);
  }

  // Crew-building onboarding card: show until user follows 3+ people
  const _followingCount=(S.following||[]).filter(id=>id&&id.length>4).length;
  const _crewCard=(_followingCount<3 && !localStorage.getItem('ledger-crew-dismissed'))?`<div class="card card-pad" id="crew-onboard-card" style="margin-bottom:16px;border:1.5px solid var(--ind-bdr);background:var(--ind-bg)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div style="font-size:26px">${ico('handshake')}</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:800;color:var(--txt)">Build Your Study Crew</div>
        <div style="font-size:11px;color:var(--mut);margin-top:1px">Studying alongside other candidates keeps you accountable.</div>
      </div>
      <button onclick="document.getElementById('crew-onboard-card').remove();localStorage.setItem('ledger-crew-dismissed','1')" title="Dismiss" aria-label="Dismiss" style="background:none;border:none;color:var(--mut);font-size:20px;line-height:1;cursor:pointer;padding:0 2px;flex-shrink:0;align-self:flex-start">×</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surf);border-radius:10px;border:1px solid var(--bdr)">
        <div style="width:26px;height:26px;border-radius:50%;background:${_followingCount>=3?'var(--grn)':'var(--ind)'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex-shrink:0">${_followingCount>=3?'✓':'1'}</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--txt)">Follow 3 candidates</div><div style="font-size:11px;color:var(--mut)">See their sessions in your feed · ${_followingCount}/3 done</div></div>
        ${_followingCount<3?`<button class="btn btn-ind btn-xs" onclick="switchTab('explore')">Find →</button>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surf);border-radius:10px;border:1px solid var(--bdr)">
        <div style="width:26px;height:26px;border-radius:50%;background:${(S.clubs||[]).filter(c=>!c.isDM&&!c.isCohort).length?'var(--grn)':'var(--surf2)'};color:${(S.clubs||[]).filter(c=>!c.isDM&&!c.isCohort).length?'#fff':'var(--mut)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex-shrink:0">${(S.clubs||[]).filter(c=>!c.isDM&&!c.isCohort).length?'✓':'2'}</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--txt)">Join a study club</div><div style="font-size:11px;color:var(--mut)">Chat with candidates on the same sections</div></div>
        ${!(S.clubs||[]).filter(c=>!c.isDM&&!c.isCohort).length?`<button class="btn btn-ghost btn-xs" onclick="switchTab('explore')">Browse →</button>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surf);border-radius:10px;border:1px solid var(--bdr)">
        <div style="width:26px;height:26px;border-radius:50%;background:${S.accountabilityPartner?'var(--grn)':'var(--surf2)'};color:${S.accountabilityPartner?'#fff':'var(--mut)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex-shrink:0">${S.accountabilityPartner?'✓':'3'}</div>
        <div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--txt)">Set a study partner</div><div style="font-size:11px;color:var(--mut)">Someone to hold you accountable</div></div>
        ${!S.accountabilityPartner?`<button class="btn btn-ghost btn-xs" onclick="switchTab('profile')">Set →</button>`:''}
      </div>
    </div>
  </div>`:'';

  // First paint of the session, while a followed circle's activity is still loading from
  // Firestore: show skeletons instead of the "yours only" feed, so it doesn't pop/jump when
  // friends' sessions land. Only when you actually follow people — otherwise nothing to wait for.
  const _friendsPending=(S.following||[]).some(id=>id&&typeof id==='string'&&id.length>4) && !window._realUsersLoaded;
  const _feedSkeleton=Array.from({length:4}).map(()=>`<div class="card card-pad" style="margin-bottom:16px">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <div class="skeleton" style="width:40px;height:40px;border-radius:50%"></div>
        <div style="flex:1"><div class="skeleton" style="height:12px;width:42%;margin-bottom:7px"></div><div class="skeleton" style="height:10px;width:26%"></div></div>
      </div>
      <div class="skeleton" style="height:46px;width:100%;border-radius:10px"></div>
    </div>`).join('');

  const feedCenter = _friendsPending ?
    _crewCard+_feedSkeleton :
    (allActivities.length===0 ?
      `${_crewCard}<div class="empty-state card card-pad"><div class="empty-icon">${LedgerBuddy('wave',104)}</div><div class="empty-msg">No sessions yet — log your first study session to get started!<br><br><button class="btn btn-primary" onclick="openSessionModal()">Start First Session</button></div></div>` :
      _crewCard+actCards.join(''));

  return`<div class="feed-layout">${leftSidebar}<div class="feed-center">${feedCenter}</div>${rightSidebar}</div>`;
}

function buildMiniLeaderboard(){
  // Personal weekly progress — no rankings, just your week vs your goal
  const weekAgo=new Date(Date.now()-7*86400000);
  const weekHrs=S.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
  const weekGoal=S.hoursPerWeek||15;
  const pct=Math.min(100,Math.round(weekHrs/weekGoal*100));
  const streak=getStreak();
  // Last 4 weeks comparison (this week vs prior 3)
  const weeklyTotals=[];
  for(let w=0;w<4;w++){
    const start=new Date(Date.now()-(w+1)*7*86400000);
    const end=new Date(Date.now()-w*7*86400000);
    const h=S.activities.filter(a=>{const d=new Date(a.date);return d>=start&&d<end;}).reduce((s,a)=>s+(a.hours||0),0);
    weeklyTotals.push(h);
  }
  const prior3avg=weeklyTotals.slice(1).reduce((a,b)=>a+b,0)/3;
  const trend=weekHrs>prior3avg+0.5?'↑ ahead of your recent average':weekHrs<prior3avg-0.5?'↓ below your recent average':'→ on pace with your average';
  const trendColor=weekHrs>prior3avg+0.5?'var(--grn)':weekHrs<prior3avg-0.5?'var(--red)':'var(--mut)';
  return`<div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:22px;font-weight:900;color:var(--ora)">${weekHrs.toFixed(1)}h <span style="font-size:12px;color:var(--mut);font-weight:500">/ ${weekGoal}h goal</span></div>
      <div style="font-size:11px;font-weight:700;color:${trendColor}">${trend}</div>
    </div>
    <div class="prog-bar" style="height:8px;margin-bottom:8px"><div class="prog-fill" style="width:${pct}%;background:${pct>=100?'var(--grn)':pct>=60?'var(--ind)':'var(--ora)'}"></div></div>
    <div style="display:flex;gap:16px">
      <div style="font-size:11px;color:var(--mut)">${ico('flame')} <strong style="color:var(--txt)">${streak}d</strong> streak</div>
      <div style="font-size:11px;color:var(--mut)"><strong style="color:var(--txt)">${Math.round(getTotalHours())}h</strong> total</div>
      <div style="font-size:11px;color:var(--mut)"><strong style="color:var(--txt)">${pct}%</strong> of week goal</div>
    </div>
  </div>`;
}

function _cohortClubId(){ if(!S||!S.firmCode)return ''; return 'firm_'+String(S.firmCode).toUpperCase().replace(/[^A-Z0-9]/g,''); }

function buildCohortCard(){
  if(!S.firmCode)return '';
  const firmName=S.firmName||'Your Cohort';
  // Hydrate live cohort stats after this string is inserted into the DOM.
  setTimeout(()=>{try{_loadCohortCardStats();}catch(e){}},60);
  return`<div class="card card-pad" style="margin-bottom:var(--sp-4);border:1px solid var(--ind-bdr);background:var(--ind-bg)">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <div style="min-width:0"><div class="section-title" style="margin-bottom:0">${esc(firmName)}</div><div id="cohort-card-count" style="font-size:10px;color:var(--mut);margin-top:1px">&nbsp;</div></div>
    <button class="btn btn-ind btn-xs" onclick="shareInvite()">Invite</button>
  </div>
  <div id="cohort-stats-slot"></div>
</div>`;
}

// Hydrate the dashboard cohort card with live cross-user stats: a founding-member
// seeding state when you're alone, or a weekly digest + exam alignment when others joined.
async function _loadCohortCardStats(){
  const slot=document.getElementById('cohort-stats-slot');
  if(!slot||!firebaseDb) return;
  const clubId=_cohortClubId(); if(!clubId) return;
  let docs=[];
  try{ await syncClubActivity(); }catch(e){}
  try{
    const snap=await firebaseDb.collection('clubs').doc(clubId).collection('members').get();
    docs=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){ return; }
  if(!document.getElementById('cohort-stats-slot')) return; // tab changed while loading
  const n=docs.length;
  const cntEl=document.getElementById('cohort-card-count');
  if(cntEl) cntEl.textContent=n+' member'+(n!==1?'s':'');
  if(n<=1){
    // Founding-member seeding state — the captain's most important moment.
    slot.innerHTML='<div style="display:flex;align-items:flex-start;gap:10px;background:var(--surf);border:1px solid var(--ind-bdr);border-radius:10px;padding:10px 12px">'+
      '<span style="font-size:16px;color:var(--grn,#047857);line-height:1.2;flex-shrink:0">'+ico('sprout')+'</span>'+
      '<div style="min-width:0"><div style="font-size:13px;font-weight:700;color:var(--txt)">You\'re the founding member</div>'+
      '<div style="font-size:12px;color:var(--sub);line-height:1.45;margin-top:2px">Invite your study group to see each other study live and keep a group streak.</div></div>'+
    '</div>';
    return;
  }
  // Active cohort — weekly digest strip + exam alignment.
  const todayStr=_ymd(new Date());
  const weekHrs=docs.reduce((s,m)=>s+(m.weekHrs||0),0);
  const gStreak=(typeof _computeGroupStreak==='function')?_computeGroupStreak(docs):0;
  const activeToday=docs.filter(m=>Array.isArray(m.studyDates)&&m.studyDates.includes(todayStr)).length;
  // Exam alignment: the section the most cohort members are sitting next, + common month.
  const todayMs=Date.now(); const byExam={};
  docs.forEach(m=>{ const sec=m.examSection,d=m.examDate; if(sec&&d){ const t=new Date(d+' 00:00:00').getTime(); if(t>todayMs)(byExam[sec]=byExam[sec]||[]).push(t); } });
  let best=null; Object.keys(byExam).forEach(sec=>{ if(!best||byExam[sec].length>byExam[best].length) best=sec; });
  let alignHtml='';
  if(best && byExam[best].length>=2){
    const mc={}; byExam[best].forEach(t=>{const mo=new Date(t).toLocaleDateString('en-US',{month:'long'});mc[mo]=(mc[mo]||0)+1;});
    const topMonth=Object.keys(mc).sort((a,b)=>mc[b]-mc[a])[0];
    alignHtml='<div style="display:flex;align-items:center;gap:7px;background:var(--surf2);border-radius:9px;padding:8px 11px;margin-bottom:8px"><span style="font-size:14px">'+ico('target')+'</span><div style="font-size:11.5px;color:var(--sub)"><strong style="color:var(--txt)">'+byExam[best].length+'</strong> of your cohort are sitting <strong style="color:var(--ind)">'+esc(best)+'</strong>'+(topMonth?' around <strong style="color:var(--txt)">'+topMonth+'</strong>':'')+' — you\'re in it together.</div></div>';
  }
  // Supportive accountability nudge (never ranked) based on who studied today.
  const iStudiedToday=(S.activities||[]).some(a=>(a.date||'').slice(0,10)===todayStr);
  const othersToday=Math.max(0,activeToday-(iStudiedToday?1:0));
  let nudgeHtml='';
  if(othersToday>0 && !iStudiedToday){
    nudgeHtml='<div style="display:flex;align-items:center;gap:8px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:9px;padding:9px 11px;margin-bottom:8px"><span style="font-size:14px">'+ico('sunrise')+'</span><div style="font-size:11.5px;color:var(--sub)"><strong style="color:var(--ora)">'+othersToday+'</strong> of your cohort already studied today — your turn to keep the streak alive.</div></div>';
  } else if(othersToday>0 && iStudiedToday){
    nudgeHtml='<div style="display:flex;align-items:center;gap:8px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:9px;padding:9px 11px;margin-bottom:8px"><span style="font-size:14px">'+ico('flame')+'</span><div style="font-size:11.5px;color:var(--sub)">You and <strong style="color:var(--grn)">'+othersToday+'</strong> cohort-mate'+(othersToday!==1?'s':'')+' studied today. Keep it going.</div></div>';
  }
  // Live "studying now" — one-shot presence read so the dashboard surfaces it too,
  // not just the club Progress tab. Renders into a sub-slot once resolved.
  const stat=(v,l,c)=>'<div style="flex:1;text-align:center"><div style="font-size:17px;font-weight:900;color:'+c+'">'+v+'</div><div style="font-size:9.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em">'+l+'</div></div>';
  slot.innerHTML='<div id="cohort-live-slot"></div>'+nudgeHtml+
    '<div style="display:flex;gap:6px;background:var(--surf2);border-radius:10px;padding:11px 8px;margin-bottom:8px">'+
      stat(weekHrs.toFixed(weekHrs<100?1:0)+'h','this week','var(--ora)')+
      stat(ico('flame')+gStreak,'group streak','var(--txt)')+
      stat(activeToday,'active today','var(--grn)')+
    '</div>'+alignHtml+
    '<button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-bottom:8px" onclick="showCohortDigestCard()">Share cohort progress</button>';
  // Populate live-now after render.
  try{
    const psnap=await firebaseDb.collection('clubs').doc(clubId).collection('presence').get();
    const now=Date.now();
    const live=psnap.docs.map(d=>d.data()).filter(p=>p.lastBeat&&(now-p.lastBeat)<120000&&p.uid!==(AUTH&&AUTH.uid));
    const ls=document.getElementById('cohort-live-slot');
    if(ls&&live.length){
      const who=live.length===1?(esc(live[0].name||'Someone')+(live[0].section?' is studying '+esc(live[0].section):' is studying')):(live.length+' cohort-mates are studying');
      ls.innerHTML='<div style="display:flex;align-items:center;gap:9px;background:linear-gradient(135deg,#04301c,#065f33);border-radius:10px;padding:10px 12px;margin-bottom:8px"><span style="width:9px;height:9px;border-radius:50%;background:#22c55e;animation:pulse-glow 1.6s infinite;flex-shrink:0"></span><div style="flex:1;font-size:11.5px;color:#fff;font-weight:600">'+who+' right now</div><button onclick="if(typeof openSessionModal===\'function\')openSessionModal()" style="background:#22c55e;color:#04301c;border:none;border-radius:8px;padding:5px 11px;font-size:11px;font-weight:800;cursor:pointer">Join</button></div>';
    }
  }catch(e){}
}

function buildPartnerTeaserCard(){
  const userSection=S.currentSection||(S.sections&&S.sections[0])||'FAR';
  // Pick candidates studying the same section, then fill with others
  const sameSection=REAL_USERS.filter(f=>f.currentSection===userSection&&!f.passedAll);
  const others=REAL_USERS.filter(f=>f.currentSection!==userSection&&f.currentSection&&!f.passedAll);
  const candidates=[...sameSection,...others].slice(0,3);
  const matchCount=Math.max(sameSection.length,2)+Math.floor(Math.random()*4)+1;

  const avatarRow=candidates.map(f=>`
    <div style="display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;background:var(--surf2)">
      <div class="avatar av-sm" style="background:${f.color};color:#fff;flex-shrink:0">${f.initials}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700">${f.name.split(' ')[0]}</div>
        <div style="font-size:10px;color:var(--mut)">${f.currentSection} · ${f.totalHours}h total · ${f.streak}d streak</div>
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <div style="width:7px;height:7px;border-radius:50%;background:var(--grn)"></div>
        <span style="font-size:10px;color:var(--grn);font-weight:700">Open</span>
      </div>
    </div>`).join('');

  return`<div class="activity-card" style="margin-bottom:16px;border:1.5px solid rgba(90,95,207,.25);background:linear-gradient(135deg,var(--surf),var(--ind-bg))">
  <div style="padding:16px 18px 14px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="width:38px;height:38px;border-radius:10px;background:var(--ind);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${ico('handshake')}</div>
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--txt)">${matchCount} candidates studying ${userSection} want a study partner</div>
        <div style="font-size:11px;color:var(--mut);margin-top:1px">Pro members get matched — see who's in your section</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;position:relative">
      <div style="filter:blur(3px);opacity:.55;pointer-events:none;user-select:none">${avatarRow}</div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
        <div style="background:var(--surf);border:1px solid var(--bdr);border-radius:10px;padding:8px 14px;text-align:center;box-shadow:var(--shadow-md);cursor:pointer" onclick="openUpgradeModal('Study Partner Pairing')">
          <div style="font-size:11px;font-weight:800;color:var(--ind);margin-bottom:1px">See who's available</div>
          <div style="font-size:10px;color:var(--mut)">Unlock with Pro →</div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="switchTab('explore')" style="flex:1;padding:10px;background:var(--surf2);border:1.5px solid var(--bdr);color:var(--txt);border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">See Who's Studying ${userSection}</button>
      <button onclick="openUpgradeModal('Study Partner')" style="flex:1;padding:10px;background:var(--ind);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(90,95,207,.35)">Unlock Pro →</button>
    </div>
  </div>
</div>`;
}

// Celebratory card shown when a candidate passes a section.
function buildPassCard(a,ex){
  ex=ex||EXAMS[a.section]||{color:'var(--grn)',full:a.section,icon:'party'};
  const propCount=Array.isArray(a.kudos)?a.kudos.length:0;
  const commentCount=Array.isArray(a.comments)?a.comments.length:0;
  const hasGivenProps=Array.isArray(a.kudos)&&(a.kudos.includes('you')||a.kudos.includes(AUTH?.uid));
  const _actFriend=a.userId!=='you'?REAL_USERS.find(f=>f.id===a.userId):null;
  const _pic=a.userPic||(a.isMine?S?.profilePic:'')||'';
  const _avatarHtml=_pic?`<img src="${_pic}" alt="${esc(a.userName||'User')}'s profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`${a.userInitials||''}`;
  const scoreLine=(typeof a.score==='number')?`<div style="font-size:13px;color:rgba(255,255,255,.85);font-weight:700;margin-top:2px">Score: ${a.score}</div>`:'';
  return`<div class="activity-card pass-card" style="margin-bottom:16px;overflow:hidden;border:1px solid ${ex.color}55" data-aid="${a.id}" data-uid="${a.userId}">
  <div class="ac-header">
    <div class="avatar av-md" style="background:${a.userColor};color:#fff;cursor:pointer;overflow:hidden" onclick="openUserProfile('${a.userId}')" title="View ${a.userName}'s profile">${_avatarHtml}</div>
    <div style="flex:1;min-width:0">
      <span class="ac-user-name" style="cursor:pointer" onclick="openUserProfile('${a.userId}')">${a.userName}${a.isMine?' <span style="font-size:10px;color:var(--mut);font-weight:400">(you)</span>':''}</span>
      <div class="ac-meta">${timeAgo(a.date)} · ${LedgerIcon(ex.icon)} ${ex.full}</div>
    </div>
    <span class="badge badge-passed">Passed ${ico('checkCircle')}</span>
    ${a.isMine?'':`<button class="ac-more" aria-label="More options" title="Report or block" onclick="event.stopPropagation();_postMore('${a.id}','${a.userId}')">⋯</button>`}
  </div>
  <div style="background:linear-gradient(135deg,${ex.color},${ex.color}cc);padding:22px 18px;text-align:center;color:#fff">
    <div style="font-size:40px;line-height:1;margin-bottom:8px">${ico('party')}</div>
    <div style="font-size:20px;font-weight:900;letter-spacing:-.02em">Passed ${a.section}!</div>
    <div style="font-size:12px;color:rgba(255,255,255,.85);margin-top:3px">${ex.full}</div>
    ${scoreLine}
    ${(a.sectionHours||a.hours)?`<div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:8px">${a.sectionHours||a.hours} hours logged on the way there</div>`:''}
  </div>
  <div class="ac-actions">
    <button class="ac-action${hasGivenProps?' props-given':''}" onclick="giveProps('${a.id}','${a.userId}')" data-props="${a.id}">
      <span>${hasGivenProps?ico('heartFilled'):ico('heartOutline')}</span> Props <span style="font-weight:800;color:${hasGivenProps?'var(--ora)':'var(--mut)'}">${propCount}</span>
    </button>
    <button class="ac-action" onclick="openComments('${a.id}','${a.userId}')">
      Comment <span style="font-weight:800;color:var(--mut)">${commentCount}</span>
    </button>
    <button class="ac-action" onclick="shareActivity('${a.id}')">Share</button>
  </div>
</div>`;
}

function buildActivityCard(a){
  const ex=EXAMS[a.section];
  if(a.type==='pass')return buildPassCard(a,ex);
  if(a.type==='sat')return buildSatCard(a,ex);
  const propCount=Array.isArray(a.kudos)?a.kudos.length:0;
  const commentCount=Array.isArray(a.comments)?a.comments.length:0;
  const hasGivenProps=Array.isArray(a.kudos)&&(a.kudos.includes('you')||a.kudos.includes(AUTH?.uid));
  const diffStars=[1,2,3,4,5].map(i=>`<span class="diff-star${i<=(a.difficulty||3)?' on':''}">★</span>`).join('');
  const _actFriend=a.userId!=='you'?REAL_USERS.find(f=>f.id===a.userId):null;
  const passedBadge=_actFriend?.passedSections?.length>0?`<span class="badge badge-passed" style="margin-left:6px">${ico('checkCircle')} ${_actFriend.passedSections.length} Passed</span>`:'';
  const tierBadgeAct=_actFriend?.tier==='elite'?'<span style="font-size:10px;font-weight:800;letter-spacing:.06em;padding:2px 5px;border-radius:4px;background:var(--ora);color:#fff;margin-left:5px;text-transform:uppercase">Pro</span>':_actFriend?.tier==='pro'?'<span style="font-size:10px;font-weight:800;letter-spacing:.06em;padding:2px 5px;border-radius:4px;background:linear-gradient(135deg,#d44000,#d97706);color:#fff;margin-left:5px;text-transform:uppercase">Pro</span>':'';

  // Private session: show minimal card for own sessions, hide from others' view
  const _avatarHtmlMine=a.userPic?`<img src="${a.userPic}" alt="${esc(a.userName||'Your')}'s profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:(S?.profilePic?`<img src="${S.profilePic}" alt="${esc(a.userName||'Your')}'s profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`${a.userInitials}`);
  const _avatarHtmlFriend=a.userPic?`<img src="${a.userPic}" alt="${esc(a.userName||'User')}'s profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`${a.userInitials}`;
  if(a.private && a.isMine){
    return`<div class="activity-card" style="margin-bottom:16px;border-left:3px solid var(--bdr);border-style:dashed" data-aid="${a.id}" data-uid="${a.userId}">
  <div class="ac-header" style="padding:14px 16px 12px">
    <div class="avatar av-md" style="background:${a.userColor};color:#fff;overflow:hidden;flex-shrink:0">${_avatarHtmlMine}</div>
    <div style="flex:1;min-width:0;padding-left:10px">
      <span class="ac-user-name">${a.userName} <span style="font-size:10px;color:var(--mut);font-weight:400">(you)</span></span>
      <div class="ac-meta" style="margin-top:2px">${LedgerIcon(ex.icon)} ${ex.full} · Private · ${a.hours}h</div>
    </div>
    <span style="font-size:10px;color:var(--mut);background:var(--surf2);border:1px solid var(--bdr);padding:3px 9px;border-radius:20px;font-weight:700;flex-shrink:0">Private</span>
  </div>
</div>`;
  }

  const _diffLabel=a.difficulty?[1,2,3,4,5].map(i=>i<=a.difficulty?'★':'☆').join(''):'';
  const _feelEmoji={'great':'faceGreat','good':'faceGood','okay':'faceOkay','rough':'faceRough','bad':'faceBad'}[a.feeling]||'';

  return`<div class="activity-card" style="margin-bottom:16px;border-left:3px solid ${ex.color}" data-aid="${a.id}" data-uid="${a.userId}">
  <div class="ac-header" style="padding:14px 16px 12px;align-items:flex-start">
    <div class="avatar av-md" style="background:${a.userColor};color:#fff;cursor:pointer;overflow:hidden;flex-shrink:0" onclick="openUserProfile('${a.userId}')">${a.isMine?_avatarHtmlMine:_avatarHtmlFriend}</div>
    <div style="flex:1;min-width:0;padding-left:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px">
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-width:0">
          <span class="ac-user-name" style="cursor:pointer" onclick="openUserProfile('${a.userId}')">${a.userName}${a.isMine?' <span style="font-size:10px;color:var(--mut);font-weight:400">(you)</span>':''}${tierBadgeAct}</span>
          ${passedBadge}
        </div>
        <span style="font-size:11px;color:var(--mut);flex-shrink:0;white-space:nowrap;padding-top:1px">${timeAgo(a.date)}${a.isMine?'':`<button class="ac-more" aria-label="More options" title="Report or block" onclick="event.stopPropagation();_postMore('${a.id}','${a.userId}')">⋯</button>`}</span>
      </div>
      <div style="display:flex;align-items:center;gap:5px;margin-top:4px">
        <span class="badge badge-${a.section}" style="font-size:9px">${a.section}</span>
        <span style="font-size:11px;color:var(--sub)">${LedgerIcon(ex.icon)} ${ex.full} Session</span>
      </div>
    </div>
  </div>
  <div class="ac-stat-row">
    <div class="ac-stat-blk">
      <div class="ac-stat-v">${a.hours}<span class="stat-unit">h</span></div>
      <div class="ac-stat-l">Duration</div>
    </div>
    ${_diffLabel?`<div class="ac-stat-blk">
      <div class="ac-stat-v" style="font-size:14px;letter-spacing:.02em;color:${ex.color};padding-top:5px">${_diffLabel}</div>
      <div class="ac-stat-l">Difficulty</div>
    </div>`:''}
    ${_feelEmoji?`<div class="ac-stat-blk">
      <div class="ac-stat-v" style="font-size:22px;padding-top:1px">${ico(_feelEmoji)}</div>
      <div class="ac-stat-l">Feeling</div>
    </div>`:''}
  </div>
  <div class="ac-body" style="padding:10px 16px 6px" ${a.isMine?`onclick="openActivityPage('${a.id}')" style="padding:10px 16px 6px;cursor:pointer"`:''}>
    ${a.material?`<div style="font-size:11px;color:var(--ind);font-weight:600;margin-bottom:5px">${a.material}</div>`:''}
    ${a.caption?`<div class="ac-caption" style="font-size:13px;margin:0 0 5px">"${a.caption}"</div>`:''}
    ${(a.concepts||[]).length?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin:4px 0">${a.concepts.slice(0,5).map(c=>`<span style="font-size:10px;background:rgba(212,64,0,.1);border:1px solid rgba(212,64,0,.2);color:var(--ora);padding:2px 9px;border-radius:20px;font-weight:600">${c}</span>`).join('')}${a.concepts.length>5?`<span style="font-size:10px;color:var(--mut)">+${a.concepts.length-5} more</span>`:''}</div>`:''}
    ${a.photo?`<div style="margin:6px 0 2px;border-radius:10px;overflow:hidden;max-height:300px"><img src="${a.photo}" style="width:100%;max-height:300px;object-fit:cover;display:block" loading="lazy" alt="Study session photo"></div>`:''}
    ${a.elapsed?`<div style="font-size:10px;color:var(--mut);margin-top:4px">${fmtDur(a.elapsed)} actual timer</div>`:''}
    ${(()=>{if(!a.isMine)return'';const _sa=S.activities.filter(x=>x.section===a.section);const _sh=_sa.reduce((t,x)=>t+(x.hours||0),0);const _g=(S.hourGoals||{})[a.section]||0;if(!_g)return'';const _p=Math.min(100,Math.round((_sh/_g)*100));return`<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--bdr)"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut);margin-bottom:4px"><span>${a.section} progress</span><span style="font-weight:700;color:var(--txt)">${_sh.toFixed(1)}h / ${_g}h &middot; ${_p}%</span></div><div style="background:var(--surf2);border-radius:4px;height:5px;overflow:hidden"><div style="height:100%;background:${(EXAMS[a.section]||{color:'var(--ind)'}).color};width:${_p}%;border-radius:4px;transition:width .4s"></div></div></div>`;})()}
  </div>
  <div class="ac-actions">
    <button class="ac-action${hasGivenProps?' props-given':''}" onclick="giveProps('${a.id}','${a.userId}')" data-props="${a.id}">
      <span>${hasGivenProps?ico('heartFilled'):ico('heartOutline')}</span> Props <span style="font-weight:800;color:${hasGivenProps?'var(--ora)':'var(--mut)'}">${propCount}</span>
    </button>
    <button class="ac-action" onclick="openComments('${a.id}','${a.userId}')">
      Comment <span style="font-weight:800;color:var(--mut)">${commentCount}</span>
    </button>
    <button class="ac-action" onclick="shareActivity('${a.id}')">Share</button>
  </div>
</div>`;
}

