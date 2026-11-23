// ═══════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════
// Achievements: a short preview on profiles, "View all" opens the full list in a
// pop-up, and the "i" on each badge explains how to earn it.
const _achSets={};
function _achValid(ids){ const ok=new Set(ACHIEVEMENTS.map(a=>a.id)); return [...new Set(ids||[])].filter(id=>ok.has(id)); }
function _achTile(a,earned,setId){
  const e=earned.has(a.id);
  const label=esc(a.name)+(e?' (earned)':' (locked)');
  return`<div class="ach-item${e?' earned':''}" role="button" tabindex="0" aria-label="${label}. How to earn it" title="${esc(a.desc)}"
    onclick="showAchInfo('${a.id}','${setId}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showAchInfo('${a.id}','${setId}')}">
    <span class="ach-info-btn" aria-hidden="true">i</span>
    <div class="ach-icon">${LedgerIcon(a.icon)}</div>
    <div class="ach-name">${esc(a.name)}</div>
  </div>`;
}
function _achPreviewHTML(earnedIds, sectionId){
  const ids=_achValid(earnedIds);
  _achSets[sectionId]={ids,own:sectionId.startsWith('own')};
  const earned=new Set(ids);
  const sorted=[...ACHIEVEMENTS].sort((a,b)=>(earned.has(a.id)?0:1)-(earned.has(b.id)?0:1));
  return`<div class="ach-grid" id="${sectionId}-preview">${sorted.slice(0,8).map(a=>_achTile(a,earned,sectionId)).join('')}</div>
    <button onclick="openAchievementsModal('${sectionId}')" style="margin-top:10px;width:100%;padding:9px;background:var(--surf2);border:1px solid var(--bdr);border-radius:9px;font-size:12px;font-weight:700;color:var(--sub);cursor:pointer">View all ${ACHIEVEMENTS.length} achievements · ${ids.length} earned</button>`;
}
function openAchievementsModal(setId){
  let set=_achSets[setId]||{ids:[],own:true};
  // Your own list: award anything already reached before showing it.
  if(set.own&&S){ checkAchievements(); set=_achSets[setId]={ids:_achValid(S.achievements),own:true}; }
  const earned=new Set(set.ids);
  let el=document.getElementById('ach-modal');
  if(!el){
    el=document.createElement('div');
    el.id='ach-modal'; el.className='modal-overlay';
    el.addEventListener('click',e=>{if(e.target===el)closeAchievementsModal();});
    document.body.appendChild(el);
  }
  const pct=Math.round(set.ids.length/ACHIEVEMENTS.length*100);
  const groups=ACH_CATS.map(([cat,label])=>{
    const list=ACHIEVEMENTS.filter(a=>a.cat===cat); if(!list.length) return '';
    const got=list.filter(a=>earned.has(a.id)).length;
    return`<div class="ach-cat">${label}<span>${got} / ${list.length}</span></div>
      <div class="ach-grid">${list.map(a=>_achTile(a,earned,setId)).join('')}</div>`;
  }).join('');
  el.innerHTML=`<div class="modal-box" aria-labelledby="ach-modal-title" style="max-width:720px;display:flex;flex-direction:column;overflow:hidden;padding:0">
    <div style="padding:18px 20px 14px;border-bottom:1px solid var(--bdr);flex:none">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px">
        <div>
          <div id="ach-modal-title" style="font-size:17px;font-weight:800;letter-spacing:-.01em">Achievements</div>
          <div style="font-size:12px;color:var(--sub);margin-top:2px">${set.ids.length} of ${ACHIEVEMENTS.length} earned · tap any badge to see how to earn it</div>
        </div>
        <button class="modal-close" onclick="closeAchievementsModal()" aria-label="Close">×</button>
      </div>
      <div class="ach-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div>
    </div>
    <div id="ach-modal-body" style="flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:16px 20px 24px">${groups}</div>
  </div>`;
  el.classList.add('open');
  _syncModalLock();
}
function closeAchievementsModal(){
  document.getElementById('ach-info')?.classList.remove('open');
  document.getElementById('ach-modal')?.classList.remove('open');
  _syncModalLock();
}

function _buildHeatmap(activities, weekOffset, containerId){
  weekOffset=weekOffset||0;
  containerId=containerId||'heatmap-own';
  var now=new Date();
  var todayStr=_ymd(now);

  // Monday of the current week
  var dow=(now.getDay()+6)%7; // Mon=0, Sun=6
  var monThis=new Date(now); monThis.setDate(now.getDate()-dow); monThis.setHours(0,0,0,0);

  // Apply week offset
  var weekStart=new Date(monThis); weekStart.setDate(monThis.getDate()+weekOffset*7);

  // Build 7 date strings for this week
  var days=[];
  for(var i=0;i<7;i++){
    var d=new Date(weekStart); d.setDate(weekStart.getDate()+i);
    days.push(_ymd(d));
  }

  // Hours by date
  var byDay={};
  (activities||[]).forEach(function(a){var dd=a.date?a.date.slice(0,10):null;if(dd)byDay[dd]=(byDay[dd]||0)+(a.hours||0);});
  var weekVals=days.map(function(d){return byDay[d]||0;});
  var mx=Math.max.apply(null,weekVals)||1;

  // Week label
  var fmtDay=function(ds){var dt=new Date(ds+'T12:00:00');return dt.toLocaleString('default',{month:'short',day:'numeric'});};
  var weekLabel=fmtDay(days[0])+' – '+fmtDay(days[6]);
  var weekH=weekVals.reduce(function(a,b){return a+b;},0);
  var weekActive=weekVals.filter(function(h){return h>0;}).length;

  // Nav state
  var canPrev=true; // can always go further back
  var canNext=weekOffset<0;

  var navBtn=function(dir,enabled){
    var arrow=dir<0?'‹':'›';
    var fn='_stepHeatmap('+dir+',\''+containerId+'\')';
    return'<button onclick="'+fn+'" style="background:none;border:1px solid '+(enabled?'var(--bdr)':'transparent')+';border-radius:6px;width:28px;height:28px;cursor:'+(enabled?'pointer':'default')+';font-size:16px;color:'+(enabled?'var(--txt)':'var(--bdr)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;'+(enabled?'':'pointer-events:none')+'">'+arrow+'</button>';
  };

  var DOW=['M','T','W','T','F','S','S'];
  var headers=DOW.map(function(d){return'<div style="font-size:11px;font-weight:700;color:var(--mut);text-align:center;padding-bottom:8px">'+d+'</div>';}).join('');

  var cells=days.map(function(ds){
    var h=byDay[ds]||0;
    var isFuture=ds>todayStr;
    var isToday=ds===todayStr;
    if(isFuture){
      return'<div style="height:36px;display:flex;align-items:center;justify-content:center"></div>';
    } else if(h===0){
      return'<div style="height:36px;display:flex;align-items:center;justify-content:center">'
        +'<div style="width:6px;height:6px;border-radius:50%;background:var(--bdr)"></div></div>';
    } else {
      var lvl=Math.min(4,Math.ceil(h/mx*4));
      var sz=[18,21,24,28][lvl-1];
      var col=['rgba(212,64,0,.3)','rgba(212,64,0,.5)','rgba(212,64,0,.75)','var(--ora)'][lvl-1];
      var ring=isToday?';box-shadow:0 0 0 2.5px var(--ora)':'';
      return'<div style="height:36px;display:flex;align-items:center;justify-content:center">'
        +'<div title="'+ds+': '+h.toFixed(1)+'h" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+col+ring+'"></div></div>';
    }
  }).join('');

  return'<div id="'+containerId+'" style="background:var(--surf2);border:1px solid var(--bdr);border-radius:12px;padding:14px 16px;margin-bottom:20px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px">'
    +navBtn(-1,canPrev)
    +'<div style="text-align:center;flex:1">'
    +'<div style="font-size:12px;font-weight:700">'+weekLabel+'</div>'
    +'<div style="font-size:11px;color:var(--mut);margin-top:2px">'+weekActive+(weekActive===1?' day · ':' days · ')+weekH.toFixed(1)+'h</div>'
    +'</div>'
    +navBtn(1,canNext)
    +'</div>'
    +'<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">'
    +headers+cells
    +'</div></div>';
}

function _stepHeatmap(delta, containerId){
  var isOther=containerId==='heatmap-other';
  if(isOther){
    _heatmapOtherOffset=Math.min(0,_heatmapOtherOffset+delta);
    var el=document.getElementById(containerId);
    if(el){var tmp=document.createElement('div');tmp.innerHTML=_buildHeatmap(_heatmapOtherActivities,_heatmapOtherOffset,containerId);el.replaceWith(tmp.firstChild);}
  } else {
    _heatmapOwnOffset=Math.min(0,_heatmapOwnOffset+delta);
    var el2=document.getElementById(containerId);
    if(el2){var tmp2=document.createElement('div');tmp2.innerHTML=_buildHeatmap(S.activities||[],_heatmapOwnOffset,containerId);el2.replaceWith(tmp2.firstChild);}
  }
}

// "How you study": the last 30 days of sessions split by kind of work and by
// course, from the optional tags on each session.
function _studyMixHTML(acts){
  const since=_ymd(new Date(Date.now()-30*86400000));
  const recent=(acts||[]).filter(a=>(!a.type||a.type==='session')&&(a.date||'').slice(0,10)>=since);
  if(!recent.length) return '';
  const sum=(key,list)=>list.map(o=>({o,h:recent.filter(a=>a[key]===o.id).reduce((t,a)=>t+(a.hours||0),0)})).filter(x=>x.h>0).sort((x,y)=>y.h-x.h);
  const kinds=sum('kind',STUDY_KINDS), courses=sum('course',STUDY_COURSES);
  const tagged=recent.filter(a=>a.kind||a.course).length;
  const kTotal=kinds.reduce((t,k)=>t+k.h,0)||1;
  const head=`<div class="sb-title" style="display:flex;justify-content:space-between;align-items:baseline"><span>How you study</span><span style="font-size:10px;color:var(--mut);font-weight:600;text-transform:none;letter-spacing:0">Last 30 days</span></div>`;
  if(!tagged) return `<div class="sb-card">${head}<div style="font-size:12px;color:var(--sub);line-height:1.55">Pick a course and what you're doing when you log a session. Ledger will show how your hours split between questions, lectures and review.</div></div>`;
  const COLORS=['#d44000','#5a5fcf','#0ea574','#d97706','#0fb5aa','#9333ea','#64748b'];
  const pct=h=>Math.max(1,Math.round(h/kTotal*100));
  const bar=kinds.length?`<div class="mix-bar" role="img" aria-label="${kinds.map(k=>k.o.name+' '+pct(k.h)+'%').join(', ')}">${kinds.map((k,i)=>`<span style="width:${k.h/kTotal*100}%;background:${COLORS[i%COLORS.length]}"></span>`).join('')}</div>
    <div class="mix-legend">${kinds.map((k,i)=>`<span><i style="background:${COLORS[i%COLORS.length]}"></i>${esc(k.o.name)} <b>${pct(k.h)}%</b></span>`).join('')}</div>`:'';
  const crs=courses.length?`<div class="mix-courses">${courses.slice(0,4).map(c=>`<div><span>${esc(c.o.name)}</span><b>${_hrs(c.h)}</b></div>`).join('')}</div>`:'';
  const untagged=recent.filter(a=>!a.kind).length;
  return `<div class="sb-card">${head}${bar}${crs}${untagged>0?`<div style="font-size:10.5px;color:var(--mut);margin-top:8px">${untagged} session${untagged===1?'':'s'} without a type not in the split</div>`:''}</div>`;
}

function buildProfile(){
  const totalHrs=getTotalHours();
  const streak=getStreak();
  const weekHrs=getWeekHours();
  const initials=(S.name||'CPA').split(' ').map(function(w){return w[0];}).join('').toUpperCase().slice(0,2);
  const followersCount=(S.followers||[]).length;
  const followingCount=(S.following||[]).filter(id=>id&&id.length>4).length;
  const pendingRequestCount=(S.followRequests||[]).length;

  const achHTML=_achPreviewHTML(S.achievements||[],'own-ach');

  const allActs=(S.activities||[]).slice().reverse();
  const recentActs=allActs.slice(0,12).map(a=>{
    const ex=EXAMS[a.section]||{color:'var(--ind)',icon:'book',full:a.section};
    const diffStars=a.difficulty?[1,2,3,4,5].map(i=>`<span style="color:${i<=a.difficulty?'var(--amb)':'var(--bdr)'}">★</span>`).join(''):'';
    return`<div onclick="openActivityPage('${a.id}')" style="background:var(--surf2);border:1.5px solid var(--bdr);border-radius:14px;padding:0;overflow:hidden;cursor:pointer;transition:border-color .15s,box-shadow .15s" onmouseover="this.style.borderColor='${ex.color}';this.style.boxShadow='0 4px 18px rgba(0,0,0,.08)'" onmouseout="this.style.borderColor='var(--bdr)';this.style.boxShadow='none'">
      <div style="height:4px;background:${ex.color}"></div>
      <div style="padding:12px 14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:7px">
            <span class="badge badge-${a.section}" style="font-size:10px">${a.section}</span>
            ${a.feeling?`<span style="font-size:16px">${ico(a.feeling)}</span>`:''}
          </div>
          <div style="font-size:10px;color:var(--mut)">${timeAgo(a.date)}</div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:6px;margin-bottom:6px">
          <span style="font-size:26px;font-weight:900;color:${ex.color};letter-spacing:-.04em;line-height:1">${a.hours}</span>
          <span style="font-size:11px;color:var(--mut);font-weight:600;padding-bottom:2px">hrs</span>
          ${a.elapsed?`<span style="font-size:10px;color:var(--mut);padding-bottom:2px">· ${fmtDur(a.elapsed)}</span>`:''}
          ${a.location?`<span style="font-size:10px;color:var(--mut);padding-bottom:2px">· ${ico('pin')} ${esc(a.location)}</span>`:''}
        </div>
        ${a.material||studySrcLabel(a)?`<div style="font-size:11px;font-weight:600;color:var(--ind);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px">${[a.material,studySrcLabel(a)].filter(Boolean).join(' · ')}</div>`:''}
        ${a.caption?`<div style="font-size:11px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4">${a.caption}</div>`:''}
        ${(a.concepts||[]).length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${a.concepts.slice(0,3).map(c=>`<span style="font-size:10px;background:rgba(212,64,0,.09);border:1px solid rgba(212,64,0,.18);color:var(--ora);padding:2px 8px;border-radius:20px;font-weight:600">${c}</span>`).join('')}${a.concepts.length>3?`<span style="font-size:10px;color:var(--mut)">+${a.concepts.length-3}</span>`:''}</div>`:''}
        ${diffStars?`<div style="font-size:11px;margin-top:6px">${diffStars}</div>`:''}
      </div>
    </div>`;
  }).join('');

  const sectionProgress=(S.sections||[]).map(s=>{
    const ex=EXAMS[s];
    const hrs=getSectionHours(s);
    const pct=Math.min(100,Math.round(hrs/getHourGoal(s)*100));
    const passed=(S.sectionPassed||[]).includes(s);
    return`<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div style="display:flex;align-items:center;gap:7px">
          <span class="badge badge-${s}">${s}</span>
          ${passed?`<span class="badge badge-passed">Passed ${ico('checkCircle')}</span>`:''}
        </div>
        <span style="font-size:11px;color:var(--mut)">${hrs}h / ${getHourGoal(s)}h · ${pct}%</span>
      </div>
      <div class="prog-bar" style="height:8px"><div class="prog-fill" style="width:${pct}%;background:${ex.color}"></div></div>
    </div>`;
  }).join('');

  // Sidebar: exam progress
  const sideProgress=(S.sections||[]).map(s=>{
    const ex=EXAMS[s];
    const hrs=getSectionHours(s);
    const pct=Math.min(100,Math.round(hrs/getHourGoal(s)*100));
    const passed=(S.sectionPassed||[]).includes(s);
    return`<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div style="display:flex;align-items:center;gap:6px"><span class="badge badge-${s}" style="font-size:10px">${s}</span>${passed?`<span style="font-size:9px;color:var(--grn);font-weight:700">${ico('checkCircle')} Passed</span>`:''}</div>
        <span style="font-size:10px;color:var(--mut)">${pct}%</span>
      </div>
      <div class="prog-bar" style="height:6px"><div class="prog-fill" style="width:${pct}%;background:${ex.color}"></div></div>
    </div>`;
  }).join('');

  // Sidebar: clubs
  const clubs=(S.clubs||[]).filter(c=>!c.isDM);
  const sideClubs=clubs.slice(0,4).map(c=>`<div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--bdr);cursor:pointer" onclick="openClubPage('${c.id}')"><span style="font-size:18px;flex-shrink:0">${ico(c.icon)}</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div><div style="font-size:10px;color:var(--mut)">${c.members.length} members</div></div><span style="font-size:14px;color:var(--mut)">›</span></div>`).join('');

  // Sidebar: study partner
  const partnerSide=(()=>{
    if(!isPro()) return`<div style="font-size:11px;color:var(--mut);line-height:1.5;margin-bottom:8px">Hold each other accountable — see how your study hours compare week over week.</div><button class="btn btn-ghost btn-xs" style="width:100%;justify-content:center" onclick="openUpgradeModal('Study Partner')">Unlock with Pro →</button>`;
    const partner=S.accountabilityPartner?REAL_USERS.find(f=>f.id===S.accountabilityPartner):null;
    if(!partner){
      const candidates=(S.following||[]).map(id=>REAL_USERS.find(f=>f.id===id)).filter(Boolean).slice(0,4);
      return`<div style="font-size:11px;color:var(--mut);margin-bottom:8px">No partner set yet. Pick someone you follow to track hours together.</div><div style="display:flex;flex-wrap:wrap;gap:6px">${candidates.map(f=>`<button onclick="setStudyPartner('${f.id}')" style="display:flex;align-items:center;gap:5px;padding:4px 8px;background:var(--surf2);border:1px solid var(--bdr);border-radius:20px;cursor:pointer;font-size:11px;font-weight:600"><div class="avatar" style="width:16px;height:16px;font-size:8px;background:${f.color};color:#fff">${f.initials}</div>${f.name.split(' ')[0]}</button>`).join('')||'<button class="btn btn-ghost btn-xs" onclick="switchTab(\'explore\')">Follow someone first →</button>'}</div>`;
    }
    const weekAgo=new Date(Date.now()-7*86400000);
    const theirHrs=partner.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
    const myHrs=S.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
    const ahead=myHrs>theirHrs+0.5;
    const behind=theirHrs>myHrs+0.5;
    const statusMsg=ahead?`You're ahead by ${(myHrs-theirHrs).toFixed(1)}h this week`:behind?`${partner.name.split(' ')[0]} is ahead by ${(theirHrs-myHrs).toFixed(1)}h this week`:`Neck and neck this week`;
    return`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px"><div style="background:var(--ora-bg);border:1px solid var(--ora-bdr);border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;font-weight:700;color:var(--mut);margin-bottom:2px">YOU</div><div style="font-size:18px;font-weight:900;color:var(--ora)">${myHrs.toFixed(1)}h</div></div><div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;padding:8px;text-align:center"><div style="font-size:9px;font-weight:700;color:var(--mut);margin-bottom:2px">${partner.name.split(' ')[0].toUpperCase()}</div><div style="font-size:18px;font-weight:900;color:var(--ind)">${theirHrs.toFixed(1)}h</div></div></div><div style="font-size:11px;color:var(--mut);margin-bottom:8px;text-align:center">${statusMsg}</div><div style="display:flex;align-items:center;gap:6px"><div class="avatar" style="width:22px;height:22px;font-size:9px;background:${partner.color};color:#fff">${partner.initials}</div><span style="font-size:12px;font-weight:600;flex:1">${partner.name}</span><button class="btn btn-ghost btn-xs" style="font-size:10px" onclick="pingStudyPartner('${partner.id}','${partner.name.replace(/'/g,"&#39;")}')">Check In</button><button class="btn btn-ghost btn-xs" style="color:var(--mut)" onclick="removeStudyPartner()">✕</button></div>`;
  })();

  _heatmapOwnOffset=0;
  const _heatmapHTML=_buildHeatmap(S.activities||[],0,'heatmap-own');
  const _quickStartSecs=(S.sections||[]).slice(0,4).map(s=>{const ex=EXAMS[s]||{color:'var(--ind)'};return'<button onclick="openSessionModal()" style="padding:8px 14px;background:'+ex.color+'18;border:1.5px solid '+ex.color+'44;border-radius:10px;cursor:pointer;font-size:12px;font-weight:700;color:'+ex.color+'">'+s+'</button>';}).join('');

  return`
<!-- HERO — full width -->
<div class="profile-hero" style="margin-bottom:20px;border-radius:14px">
  <div class="profile-hero-inner">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:16px;min-width:0;flex:1 1 240px">
        <div class="profile-av-wrap" onclick="openEditProfile()" title="Edit profile" style="width:88px;height:88px;font-size:32px">
          ${S.profilePic?`<img src="${S.profilePic}" alt="Your profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`<span style="font-size:30px;font-weight:900;letter-spacing:-.03em">${initials}</span>`}
          <div class="profile-av-edit-overlay">Edit</div>
        </div>
        <div>
          <div class="profile-name" style="margin-top:0;font-size:24px">${S.name}${isElite()?'<span style="font-size:10px;font-weight:800;letter-spacing:.06em;padding:3px 7px;border-radius:5px;background:var(--ora);color:#fff;margin-left:8px;text-transform:uppercase;vertical-align:middle">Pro</span>':isPro()?'<span style="font-size:10px;font-weight:800;letter-spacing:.06em;padding:3px 7px;border-radius:5px;background:linear-gradient(135deg,#d44000,#d97706);color:#fff;margin-left:8px;text-transform:uppercase;vertical-align:middle">Pro</span>':''}</div>
          <div class="profile-state">${[S.state,S.classYear,S.school?'@ '+S.school:''].filter(Boolean).join(' · ')}</div>
          ${S.bio?`<div style="font-size:12px;color:rgba(255,255,255,.72);margin-top:5px;max-width:500px;line-height:1.55">${S.bio}</div>`:`<div style="font-size:12px;color:rgba(255,255,255,.38);margin-top:5px;cursor:pointer" onclick="openEditProfile()">+ Add a bio…</div>`}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;padding-top:2px">
        <button onclick="openEditProfile()" style="background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);color:#fff;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer">Edit Profile</button>
      </div>
    </div>
    <div style="display:flex;gap:0;margin-top:18px;padding-top:15px;border-top:1px solid rgba(255,255,255,.12);flex-wrap:wrap;row-gap:12px">
      <button onclick="${(S.followRequests||[]).length?'openFollowRequestsModal()':'openFollowModal(\'followers\')'}" style="background:none;border:none;cursor:pointer;text-align:center;padding:0 24px 0 0;position:relative">
        <div id="my-foll-cnt" style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1">${followersCount}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;font-weight:600">Followers</div>
        ${(S.followRequests||[]).length?`<span style="position:absolute;top:-3px;right:14px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;padding:1px 4px;border-radius:10px">${(S.followRequests||[]).length}</span>`:''}
      </button>
      <button onclick="openFollowModal('following')" style="background:none;border:none;cursor:pointer;text-align:center;padding:0 24px 0 0">
        <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1">${followingCount}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;font-weight:600">Following</div>
      </button>
      <div style="text-align:center;padding:0 24px 0 0">
        <div style="font-size:26px;font-weight:900;color:rgba(212,64,0,.9);letter-spacing:-.04em;line-height:1">${Math.round(totalHrs)}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;font-weight:600">Hours</div>
      </div>
      <div style="text-align:center;padding:0 24px 0 0">
        <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1">${streak}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;font-weight:600">Streak</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1">${(S.activities||[]).length}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;font-weight:600">Sessions</div>
      </div>
    </div>
  </div>
</div>

<!-- 2-COLUMN LAYOUT -->
<div class="profile-layout">

  <!-- LEFT: Sessions -->
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <div style="font-size:15px;font-weight:800">Recent Sessions</div>
        <div style="font-size:11px;color:var(--mut);margin-top:1px">${(S.activities||[]).length} total</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openSessionModal()">Log Session</button>
    </div>
    ${_heatmapHTML}
    ${recentActs
      ?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">${recentActs}</div>${(S.activities||[]).length>12?`<div style="text-align:center;margin-top:14px;font-size:12px;color:var(--mut)">${(S.activities||[]).length-12} older sessions not shown</div>`:''}`
      :`<div style="text-align:center;padding:28px 20px;background:var(--surf2);border:1.5px dashed var(--bdr);border-radius:14px">
          <div style="font-size:36px;margin-bottom:10px">${ico('book')}</div>
          <div style="font-size:15px;font-weight:800;margin-bottom:6px">Start your CPA journey</div>
          <div style="font-size:12px;color:var(--sub);margin-bottom:16px;line-height:1.5">Log your first session to build your streak and track progress toward passing.</div>
          ${_quickStartSecs?`<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px">${_quickStartSecs}</div>`:''}
          <button class="btn btn-primary" onclick="openSessionModal()">Log First Session</button>
        </div>`}
  </div>

  <!-- RIGHT: Sidebar -->
  <div class="profile-sidebar">

    <!-- This Week -->
    <div class="sb-card">
      <div class="sb-title">This Week</div>
      <div style="display:flex;align-items:flex-end;gap:6px;margin-bottom:6px">
        <span style="font-size:38px;font-weight:900;color:var(--ora);letter-spacing:-.04em;line-height:1">${weekHrs.toFixed(1)}</span>
        <span style="font-size:12px;color:var(--mut);font-weight:600;padding-bottom:4px">of ${S.hoursPerWeek||15}h goal</span>
      </div>
      <div class="prog-bar" style="height:7px"><div class="prog-fill" style="width:${Math.min(100,Math.round(weekHrs/(S.hoursPerWeek||15)*100))}%;background:${weekHrs>=(S.hoursPerWeek||15)?'var(--grn)':'var(--ora)'}"></div></div>
      <div style="display:flex;gap:6px;margin-top:10px">
        <button class="btn btn-ghost btn-xs" style="flex:1;justify-content:center" onclick="openWeekRecap()">Share my week</button>
        ${isPro()?`<button class="btn btn-ghost btn-xs" style="flex:1;justify-content:center" onclick="openProgressReport()">Weekly report</button>`:''}
      </div>
    </div>

    ${_studyMixHTML(S.activities||[])}

    <!-- Exam Progress -->
    <div class="sb-card">
      <div class="sb-title">Exam Progress</div>
      ${sideProgress||`<div style="font-size:12px;color:var(--mut)">No sections yet. <button class="btn btn-ghost btn-xs" onclick="openAppSettings()">Add →</button></div>`}
    </div>

    <!-- Achievements -->
    <div class="sb-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="sb-title" style="margin-bottom:0">Achievements</div>
        <span style="font-size:11px;color:var(--mut)">${_achValid(S.achievements).length}/${ACHIEVEMENTS.length}</span>
      </div>
      ${_achPreviewHTML(S.achievements||[],'own-ach-sb')}
    </div>

    <!-- Study Partner -->
    <div class="sb-card">
      <div class="sb-title">Study Partner</div>
      ${partnerSide}
    </div>

    <!-- My Clubs -->
    <div class="sb-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div class="sb-title" style="margin-bottom:0">Study Clubs</div>
        <button class="btn btn-ghost btn-xs" onclick="createClubModal()">+ Create</button>
      </div>
      ${sideClubs||`<div style="font-size:12px;color:var(--mut);padding:8px 0">No clubs yet.</div>`}
      ${clubs.length>4?`<button class="btn btn-ghost btn-xs" style="width:100%;margin-top:6px" onclick="openMessagesModal()">View all ${clubs.length} →</button>`:''}
    </div>

    ${(()=>{
      const t=todayStr(), used=restUsedInWeek(t), next=Object.keys(S.restDays||{}).filter(k=>k>=t&&restKind(k)==='rest').sort()[0];
      const line=next?'Next: '+_restDayLabel(next):(used>=REST_PER_WEEK?'This week\u2019s rest day is used':'1 rest day left this week');
      return`<div class="sb-card" style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">${ico('shield')}</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700">Rest days${isPro()?' &amp; shields':''}</div><div style="font-size:11px;color:var(--mut)">${line}</div></div><button class="btn btn-ghost btn-xs" onclick="openRestDayModal()">Plan</button></div>`;
    })()}

  </div>
</div>`;
}

// ═══════════════════════════════════════════════
// EXPLORE
// ═══════════════════════════════════════════════
function buildExplore(){
  const weekAgo=new Date(Date.now()-7*86400000);

  // Challenges
  const joinedChallengeIds=S.challenges||[];
  const challengeCards=CHALLENGES.map(c=>{
    const canAccess=isPro()||c.free;
    const joined=joinedChallengeIds.includes(c.id);
    const prog=joined?getChallengeProgress(c):0;
    const done=(S.challengeCompleted||[]).includes(c.id)||(joined&&prog>=c.target);
    const pct=joined?Math.min(100,Math.round(prog/c.target*100)):0;
    let actionBtn;
    if(!canAccess) actionBtn='<button class="challenge-pro-badge" onclick="openUpgradeModal(\'All Challenges\')">'+ico('lock')+' Pro</button>';
    else if(done) actionBtn='<span style="font-size:11px;color:var(--grn);font-weight:700">'+ico('checkCircle')+' Complete</span>';
    else if(joined) actionBtn='<button class="btn btn-ghost btn-xs" style="color:var(--mut);font-size:10px" onclick="leaveChallenge(\''+c.id+'\')">Leave</button>';
    else actionBtn='<button class="btn btn-ghost btn-xs" onclick="joinChallenge(\''+c.id+'\')">Join</button>';
    const lockedStyle=!canAccess?'filter:grayscale(.4);':'';
    return'<div class="challenge-card" style="border-color:'+(done?'var(--grn)':joined?'rgba(99,102,241,.4)':'var(--bdr)')+';background:'+(done?'var(--grn-bg)':joined?'var(--ind-bg)':'var(--surf)')+';'+lockedStyle+'"><div style="display:flex;align-items:flex-start;gap:10px"><div style="font-size:24px;flex-shrink:0">'+ico(c.icon)+'</div><div style="flex:1"><div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><div class="challenge-title" style="margin:0">'+c.title+'</div></div><div class="challenge-meta">'+c.desc+'</div>'+(joined?'<div style="margin:8px 0 4px"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut);margin-bottom:4px"><span>Progress</span><span>'+prog+' / '+c.target+'</span></div><div style="height:5px;background:var(--surf3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(done?'var(--grn)':'var(--ind)')+';border-radius:4px;transition:width .4s"></div></div></div>':'')+'<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px"><div></div>'+actionBtn+'</div><div style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:var(--amb-bg);border-radius:20px;font-size:10px;font-weight:700;color:var(--amb)">'+c.reward+'</div></div></div></div>';
  }).join('');

  // Find friends
  const friendCards=REAL_USERS.map(f=>{
    const isFollowing=(S.following||[]).includes(f.id);
    const isPending=!isFollowing&&(S.pendingRequests||[]).includes(f.id);
    const weekHrs=f.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
    return`<div class="friend-card">
      <div class="avatar av-md" style="background:${f.color};color:#fff;cursor:pointer" onclick="openUserProfile('${f.id}')">${f.initials}</div>
      <div class="friend-info" style="cursor:pointer" onclick="openUserProfile('${f.id}')">
        <div class="friend-name">${f.name} ${f.passedSections.length===4?ico('trophy'):''}${f.isPrivate?'<span style="font-size:10px;color:var(--mut)">'+ico('lock')+'</span>':''}${f.tier==='elite'?'<span style="font-size:10px;font-weight:800;letter-spacing:.06em;padding:2px 5px;border-radius:4px;background:var(--ora);color:#fff;margin-left:4px;text-transform:uppercase">Pro</span>':f.tier==='pro'?'<span style="font-size:10px;font-weight:800;letter-spacing:.06em;padding:2px 5px;border-radius:4px;background:linear-gradient(135deg,#d44000,#d97706);color:#fff;margin-left:4px;text-transform:uppercase">Pro</span>':''}</div>
        <div class="friend-meta">${f.state} · ${f.currentSection||'CPA Achieved!'} · ${f.streak}d streak · ${weekHrs.toFixed(1)}h this week</div>
        ${f.bio?`<div style="font-size:10px;color:var(--mut);margin-top:2px;font-style:italic">"${f.bio}"</div>`:''}
        ${f.passedSections.length?`<div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap">${f.passedSections.map(s=>`<span class="badge badge-${s}" style="font-size:10px">${s} ✓</span>`).join('')}</div>`:''}
      </div>
      <button class="follow-btn${isFollowing?' following':''}" style="${isPending?'background:var(--surf2);color:var(--sub);border-color:var(--bdr)':''}" onclick="event.stopPropagation();toggleFollow('${f.id}',this)">${isFollowing?'Following':isPending?'Requested':'Follow'}</button>
    </div>`;
  }).join('');

  // Study clubs
  const myAllClubs=(S.clubs||[]).filter(c=>!c.isDM);
  const joinedPubIds=myAllClubs.map(c=>c.id);
  const myClubRows=myAllClubs.map(c=>{
    const msgs=(S.clubMessages||{})[c.id]||[];
    const lastMsg=msgs.filter(m=>!m.isSystem).slice(-1)[0];
    return'<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;cursor:pointer;transition:background .12s" onclick="openClubPage(\''+c.id+'\')" onmouseover="this.style.background=\'var(--surf2)\'" onmouseout="this.style.background=\'transparent\'"><div style="font-size:22px;width:38px;text-align:center;flex-shrink:0">'+ico(c.icon)+'</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+c.name+' <span style="font-size:10px;color:'+(c.isPublic?'var(--grn)':'var(--ind)')+';font-weight:700">'+(c.isPublic?ico('globe'):ico('lock'))+'</span></div><div style="font-size:11px;color:var(--mut)"><span class="myclub-mc" data-cid="'+c.id+'">'+c.members.length+'</span> members</div>'+(lastMsg?'<div style="font-size:11px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(lastMsg.author==='you'?'You':getClubMemberName(lastMsg.author))+': '+lastMsg.text+'</div>':'')+'</div><span style="font-size:16px;color:var(--mut)">›</span></div>';
  }).join('');
  const discoverRows=PUBLIC_CLUBS.filter(c=>!joinedPubIds.includes(c.id)).map(c=>'<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr)"><div style="font-size:24px;width:40px;text-align:center;flex-shrink:0">'+ico(c.icon)+'</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+c.name+'</div><div style="font-size:11px;color:var(--mut)">'+c.desc.slice(0,55)+'…</div><div style="font-size:10px;color:var(--mut);margin-top:2px">New club · be an early member</div></div><button class="btn btn-ind btn-xs" onclick="joinPublicClub(\''+c.id+'\')">Join</button></div>').join('');
  const clubSection=(myAllClubs.length?'<div style="margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--bdr)">'+myClubRows+'</div>':'')+'<div style="font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin:8px 0">Discover Clubs</div>'+discoverRows;

  // Show-more for discover clubs (limit initial to 3)
  const discoverRowItems=PUBLIC_CLUBS.filter(c=>!joinedPubIds.includes(c.id));
  const discoverVisible=discoverRowItems.slice(0,3);
  const discoverHidden=discoverRowItems.slice(3);
  const discoverVisibleHtml=discoverVisible.map(c=>'<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr)"><div style="font-size:24px;width:40px;text-align:center;flex-shrink:0">'+ico(c.icon)+'</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+c.name+'</div><div style="font-size:11px;color:var(--mut)">'+c.desc.slice(0,55)+'…</div><div style="font-size:10px;color:var(--mut);margin-top:2px">New club · be an early member</div></div><button class="btn btn-ind btn-xs" onclick="joinPublicClub(\''+c.id+'\')">Join</button></div>').join('');
  const discoverHiddenHtml=discoverHidden.length?'<div id="explore-more-clubs" style="display:none">'+discoverHidden.map(c=>'<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr)"><div style="font-size:24px;width:40px;text-align:center;flex-shrink:0">'+ico(c.icon)+'</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+c.name+'</div><div style="font-size:11px;color:var(--mut)">'+c.desc.slice(0,55)+'…</div><div style="font-size:10px;color:var(--mut);margin-top:2px">New club · be an early member</div></div><button class="btn btn-ind btn-xs" onclick="joinPublicClub(\''+c.id+'\')">Join</button></div>').join('')+'</div><button id="explore-show-more-btn" class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:8px" onclick="document.getElementById(\'explore-more-clubs\').style.display=\'block\';this.style.display=\'none\'">Show '+discoverHidden.length+' more clubs ↓</button>':'';
  const clubSectionNew=(myAllClubs.length?'<div style="margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--bdr)">'+myClubRows+'</div>':'')+'<div style="font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin:8px 0">Discover Clubs</div>'+discoverVisibleHtml+discoverHiddenHtml;

  // Study buddy matching — people studying the same section as you right now
  const myCurrentSection=getCurrentSection();
  const buddyMatches=REAL_USERS.filter(f=>f.currentSection===myCurrentSection).slice(0,6);
  const buddyCards=buddyMatches.map(f=>{
    const sharedSection=myCurrentSection;
    const fWeekHrs=f.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
    const isFollowing=(S.following||[]).includes(f.id);
    const isBuddyPending=!isFollowing&&(S.pendingRequests||[]).includes(f.id);
    return`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr)">
      <div class="avatar av-sm" style="background:${f.color};color:#fff;cursor:pointer;flex-shrink:0" onclick="openUserProfile('${f.id}')">${f.initials}</div>
      <div style="flex:1;min-width:0;cursor:pointer" onclick="openUserProfile('${f.id}')">
        <div style="font-size:13px;font-weight:700">${f.name} ${f.isPrivate?'<span style="font-size:10px;color:var(--mut)">'+ico('lock')+'</span>':''}<span class="badge badge-${sharedSection}" style="font-size:10px;margin-left:4px">${sharedSection}</span></div>
        <div style="font-size:11px;color:var(--mut)">${f.state} · ${ico('flame')}${f.streak}d streak · ${fWeekHrs.toFixed(1)}h this week</div>
      </div>
      <button class="follow-btn${isFollowing?' following':''}" style="flex-shrink:0${isBuddyPending?';background:var(--surf2);color:var(--sub);border-color:var(--bdr)':''}" onclick="toggleFollow('${f.id}',this)">${isFollowing?'Following':isBuddyPending?'Requested':'Follow'}</button>
    </div>`;
  }).join('');

  // Build Study Circle: everyone active this week (you + following), no ranks
  const circleEntries=[];
  const myWeekHrsVal=S.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
  circleEntries.push({name:'You',initials:(S.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),color:'#4f46e5',section:S.sections[0]||'FAR',weekHrs:myWeekHrsVal,streak:getStreak(),isYou:true,tier:SUB.tier||'free'});
  REAL_USERS.forEach(f=>{
    const hrs=f.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
    circleEntries.push({name:f.name,initials:f.initials,color:f.color,section:f.currentSection||'CPA ✓',weekHrs:hrs,streak:f.streak,isYou:false,id:f.id,tier:f.tier||'free'});
  });
  const activeThisWeek=circleEntries.filter(e=>e.weekHrs>0);
  const circleCards=activeThisWeek.map(e=>{
    const tierDot=e.tier==='elite'?'<span style="width:7px;height:7px;border-radius:50%;background:var(--ora);display:inline-block;margin-left:4px;vertical-align:middle"></span>':e.tier==='pro'?'<span style="width:7px;height:7px;border-radius:50%;background:var(--ora);display:inline-block;margin-left:4px;vertical-align:middle"></span>':'';
    return`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr);${e.isYou?'background:var(--ind-bg);padding:8px 10px;margin:0 -10px;border-radius:8px;':''}">
      <div class="avatar" style="width:34px;height:34px;font-size:11px;border-radius:50%;background:${e.color};color:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700"${!e.isYou&&e.id?` onclick="openUserProfile('${e.id}')" style="cursor:pointer;width:34px;height:34px;font-size:11px;border-radius:50%;background:${e.color};color:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700"`:''}>${e.initials}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700">${e.name}${tierDot}</div>
        <div style="font-size:10px;color:var(--mut);margin-top:1px">${e.section} · ${ico('flame')}${e.streak}d streak</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:12px;font-weight:800;color:var(--ora)">${e.weekHrs.toFixed(1)}h</div>
        <div style="font-size:10px;color:var(--mut)">this week</div>
      </div>
    </div>`;
  }).join('');
  const inactiveCount=circleEntries.length-activeThisWeek.length;

  const sub=_curSub('explore');
  let body='';
  if(sub==='rooms'){
    body=`<div style="max-width:720px">${buildRoomsCard()}
      <div class="card card-pad" style="margin-top:16px">
        <div class="section-title" style="margin-bottom:8px">How rooms work</div>
        <div style="display:grid;gap:10px;font-size:13px;color:var(--sub);line-height:1.55">
          <div style="display:flex;gap:10px"><span style="color:var(--ora);font-size:17px;flex:none">${ico('timer')}</span><span>Everyone in a room shares one focus timer, so you study and break together.</span></div>
          <div style="display:flex;gap:10px"><span style="color:var(--ora);font-size:17px;flex:none">${ico('users')}</span><span>Anyone can join an open room. It feels like sitting at the same library table.</span></div>
          <div style="display:flex;gap:10px"><span style="color:var(--ora);font-size:17px;flex:none">${ico('checkCircle')}</span><span>When you leave, your time is ready to log as a session.</span></div>
        </div>
      </div></div>`;
  } else if(sub==='clubs'){
    body=`<div class="card card-pad" style="max-width:720px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px">
        <div><div class="section-title" style="margin-bottom:2px">Study clubs</div><div style="font-size:12px;color:var(--mut)">Group chats for the long haul, with a shared goal</div></div>
        <button class="btn btn-ind btn-xs" onclick="${isPro()?'createClubModal()':'openUpgradeModal(\'Unlimited Study Clubs\')'}">+ Create</button>
      </div>
      ${!isPro()&&myAllClubs.length>=1?'<div class="free-limit-banner" onclick="openUpgradeModal(\'Unlimited Study Clubs\')"><span style="font-size:20px">'+ico('lock')+'</span><div style="flex:1"><div style="font-size:12px;font-weight:800;color:var(--ora)">Free plan: 1 club limit</div><div style="font-size:11px;color:var(--sub)">Upgrade to Pro for unlimited clubs + priority channels</div></div><span style="font-size:11px;font-weight:700;color:var(--ora)">Upgrade →</span></div>':''}
      ${clubSectionNew}
      <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:10px" onclick="openMessagesModal()">My clubs &amp; messages →</button>
    </div>`;
  } else if(sub==='goals'){
    body=_buildGoalsPanel(challengeCards);
  } else {
    body=`<div class="explore-2col" style="max-width:none">
  <div>
    <div class="card card-pad" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div class="section-title" style="margin-bottom:0">Study Circle</div>
        <span style="font-size:10px;color:var(--mut)">${activeThisWeek.length} studying this week</span>
      </div>
      <div style="font-size:11px;color:var(--mut);margin-bottom:12px">You and the people you follow, this week</div>
      ${circleCards||'<div style="font-size:12px;color:var(--mut);text-align:center;padding:16px 0">No activity this week — log a session to show up here!</div>'}
      ${inactiveCount>0?`<div style="font-size:10px;color:var(--mut);margin-top:8px;text-align:center">${inactiveCount} member${inactiveCount!==1?'s':''} taking a rest day</div>`:''}
    </div>
    ${buddyMatches.length?`<div class="card card-pad" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <div style="font-size:18px;color:var(--ind)">${ico('handshake')}</div>
        <div>
          <div class="section-title" style="margin-bottom:0">Also Studying ${myCurrentSection}</div>
          <div style="font-size:11px;color:var(--mut)">Connect with people on the same section</div>
        </div>
      </div>
      ${buddyCards}
    </div>`:''}
  </div>
  <div>
    <div class="card card-pad">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px">
        <div class="section-title" style="margin-bottom:0">Find CPA Candidates</div>
        <button class="btn btn-ghost btn-xs" onclick="openSearchModal()">${ico('magnifier')} Search</button>
      </div>
      ${(S.followRequests||[]).length?`<button onclick="openFollowRequestsModal()" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;margin-bottom:10px;border-radius:10px;border:1px solid var(--ora-bdr);background:var(--ora-bg);color:var(--ora-dk);font-size:12px;font-weight:700;cursor:pointer">${(S.followRequests||[]).length} follow request${(S.followRequests||[]).length!==1?'s':''} waiting<span>Review →</span></button>`:''}
      ${friendCards||'<div style="font-size:12px;color:var(--mut);text-align:center;padding:16px 0">No one here yet. Search for a friend by name.</div>'}
    </div>
  </div>
</div>`;
  }

  return`<div style="max-width:960px;margin:0 auto">
  <div class="page-head"><div style="min-width:0">
    <h1>Explore</h1>
    <p>Find people on the same path, study side by side, and set goals to aim for.</p>
  </div></div>
  ${_subTabsHTML('explore')}
  ${_subPanel('explore',body)}
</div>`;
}

// Goals tab: your own goals (Pro) first, then the built-in milestones.
function _goalTypeLabel(t){return {hours:'hours',sessions:'sessions',days:'study days',streak:'day streak'}[t]||t;}
function _customGoalCard(c){
  const prog=getCustomChallengeProgress(c);
  const done=(S.challengeCompleted||[]).includes(c.id)||(prog>=c.goalVal);
  const pct=Math.min(100,Math.round(prog/Math.max(1,c.goalVal)*100));
  const ended=c.endDate&&_ymd(new Date())>c.endDate;
  const endLabel=c.endDate?(ended?'Ended '+_fmtDay(c.endDate,{month:'short',day:'numeric'}):'By '+_fmtDay(c.endDate,{month:'short',day:'numeric'})):'No deadline';
  const val=c.goalType==='hours'?(+prog).toFixed(1).replace(/\.0$/,''):prog;
  return`<div class="challenge-card" style="border-color:${done?'var(--grn)':'var(--ora-bdr)'};background:${done?'var(--grn-bg)':'var(--surf)'}">
    <div style="display:flex;align-items:flex-start;gap:10px">
      <div style="font-size:22px;flex-shrink:0;color:var(--ora)">${ico(c.icon||'target')}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:3px">
          <div class="challenge-title" style="margin:0;overflow-wrap:anywhere">${esc(c.name)}</div>
          <button onclick="deleteCustomChallenge('${c.id}')" aria-label="Delete goal" style="background:none;border:none;cursor:pointer;color:var(--mut);font-size:14px;padding:0 2px;line-height:1">✕</button>
        </div>
        <div class="challenge-meta">${c.goalVal} ${_goalTypeLabel(c.goalType)}${c.section?' of '+c.section:''}${c.desc?' · '+esc(c.desc):''}</div>
        <div style="margin:8px 0 2px">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut);margin-bottom:4px"><span>${val} / ${c.goalVal}</span><span>${endLabel}</span></div>
          <div style="height:5px;background:var(--surf3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${done?'var(--grn)':'var(--ora)'};border-radius:4px;transition:width .4s"></div></div>
        </div>
        ${done?'<span style="font-size:11px;color:var(--grn);font-weight:700">'+ico('checkCircle')+' Complete</span>':ended?'<span style="font-size:11px;color:var(--mut);font-weight:600">Deadline passed</span>':''}
      </div>
    </div>
  </div>`;
}
function _buildGoalsPanel(challengeCards){
  const customs=S.customChallenges||[];
  const pro=isPro();
  const createBtn=`<button class="btn btn-primary btn-sm" onclick="${pro?'openCreateGoal()':'openUpgradeModal(\'Custom Goals\')'}">${pro?'':ico('lock')+' '}Create a goal</button>`;
  const mine=customs.length
    ?`<div class="goals-grid">${customs.map(_customGoalCard).join('')}</div>`
    :`<div style="display:flex;align-items:center;gap:14px;padding:16px;border:1.5px dashed var(--bdr2);border-radius:12px;background:var(--surf2)">
        <div style="font-size:26px;color:var(--ora);flex:none">${ico('target')}</div>
        <div style="flex:1;font-size:13px;color:var(--sub);line-height:1.5">${pro?'Set a goal that fits your plan, like "20 hours of FAR by March 1" or "a 14-day streak". Progress tracks itself from the sessions you log.':'Pro members can set their own goals, like "20 hours of FAR by March 1", and track them automatically.'}</div>
      </div>`;
  return`<div class="card card-pad" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <div><div class="section-title" style="margin-bottom:2px">My goals</div><div style="font-size:12px;color:var(--mut)">Goals you set yourself${pro?'':' · Pro'}</div></div>
        ${createBtn}
      </div>
      ${mine}
    </div>
    <div class="card card-pad">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div class="section-title" style="margin-bottom:0">Milestones</div>
        <span style="font-size:11px;color:var(--mut)">${(S.challengeCompleted||[]).filter(id=>CHALLENGES.some(c=>c.id===id)).length} of ${CHALLENGES.length} done</span>
      </div>
      <div style="font-size:12px;color:var(--mut);margin-bottom:12px">Join one and it tracks itself as you study</div>
      <div class="goals-grid">${challengeCards}</div>
    </div>`;
}

// ── Create a custom goal (Pro) ──
const GOAL_ICONS=['target','flame','bolt','book','trophy','mountain','calendarCheck','rocket'];
let _goalIcon='target';
function openCreateGoal(){
  if(!isPro()){openUpgradeModal('Custom Goals');return;}
  if((S.customChallenges||[]).length>=12){showToast('You can have up to 12 goals. Delete one to add another.','info');return;}
  _goalIcon='target';
  document.getElementById('goal-modal')?.remove();
  const el=document.createElement('div');
  el.id='goal-modal'; el.className='modal-overlay open';
  el.addEventListener('click',e=>{if(e.target===el)closeCreateGoal();});
  const secs=(S.sections||[]).map(s=>`<option value="${s}">${s}</option>`).join('');
  el.innerHTML=`<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="goal-title" style="max-width:460px">
    <div class="modal-hdr"><div class="modal-title" id="goal-title">Create a goal</div><button class="modal-close" onclick="closeCreateGoal()" aria-label="Close">×</button></div>
    <div class="modal-body">
      <div class="form-grp"><label for="goal-name">Name</label><input id="goal-name" type="text" maxlength="60" placeholder="e.g. Finish FAR leases" oninput="_goalPreview()"></div>
      <div class="form-row">
        <div class="form-grp"><label for="goal-type">Goal</label>
          <select id="goal-type" onchange="_goalTypeChanged()">
            <option value="hours">Study hours</option><option value="sessions">Sessions</option><option value="days">Days studied</option><option value="streak">Day streak</option>
          </select></div>
        <div class="form-grp"><label for="goal-val">Target</label><input id="goal-val" type="number" min="1" max="2000" step="1" value="20" oninput="_goalPreview()"></div>
      </div>
      <div class="form-row">
        <div class="form-grp" id="goal-sec-grp"><label for="goal-sec">Section</label><select id="goal-sec" onchange="_goalPreview()"><option value="">Any section</option>${secs}</select></div>
        <div class="form-grp"><label for="goal-end">Deadline <span style="color:var(--mut);font-weight:400">(optional)</span></label><input id="goal-end" type="date" min="${todayStr()}" onchange="_goalPreview()"></div>
      </div>
      <div class="form-grp"><label>Icon</label>
        <div id="goal-icons" style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px;max-width:340px">${GOAL_ICONS.map(i=>`<button type="button" data-ic="${i}" aria-label="${i}" onclick="_goalPickIcon('${i}')" style="width:100%;height:38px;border-radius:9px;border:1.5px solid ${i===_goalIcon?'var(--ora)':'var(--bdr)'};background:${i===_goalIcon?'var(--ora-bg)':'var(--surf2)'};color:${i===_goalIcon?'var(--ora)':'var(--sub)'};font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">${ico(i)}</button>`).join('')}</div>
      </div>
      <div id="goal-preview" style="font-size:12px;color:var(--sub);background:var(--surf2);border-radius:9px;padding:10px 12px;margin:4px 0 14px;line-height:1.5"></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;padding:11px" onclick="saveCustomGoal()">Create goal</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  _goalPreview();
  setTimeout(()=>document.getElementById('goal-name')?.focus(),50);
}
function closeCreateGoal(){document.getElementById('goal-modal')?.remove();}
function _goalPickIcon(i){
  _goalIcon=i;
  document.querySelectorAll('#goal-icons button').forEach(b=>{const on=b.dataset.ic===i;b.style.borderColor=on?'var(--ora)':'var(--bdr)';b.style.background=on?'var(--ora-bg)':'var(--surf2)';b.style.color=on?'var(--ora)':'var(--sub)';});
}
function _goalTypeChanged(){
  const t=document.getElementById('goal-type').value;
  // A streak isn't tied to one section; it's any day you study.
  document.getElementById('goal-sec-grp').style.display=t==='streak'?'none':'';
  const v=document.getElementById('goal-val');
  v.value={hours:20,sessions:10,days:14,streak:7}[t]; v.step=t==='hours'?'0.5':'1';
  _goalPreview();
}
function _goalRead(){
  const t=document.getElementById('goal-type')?.value||'hours';
  return {name:(document.getElementById('goal-name')?.value||'').trim().slice(0,60),goalType:t,goalVal:parseFloat(document.getElementById('goal-val')?.value)||0,section:t==='streak'?'':(document.getElementById('goal-sec')?.value||''),endDate:document.getElementById('goal-end')?.value||''};
}
function _goalPreview(){
  const g=_goalRead(), el=document.getElementById('goal-preview'); if(!el) return;
  if(!(g.goalVal>0)){el.textContent='Enter a target above 0.';return;}
  const what=g.goalType==='streak'?`Reach a ${g.goalVal}-day study streak`:`Log ${g.goalVal} ${_goalTypeLabel(g.goalType)}${g.section?' of '+g.section:''}`;
  const by=g.endDate?' by '+_fmtDay(g.endDate,{weekday:'short',month:'short',day:'numeric'}):'';
  const days=g.endDate?Math.round((new Date(g.endDate+'T12:00:00')-new Date(todayStr()+'T12:00:00'))/86400000)+1:0;
  const pace=g.endDate&&g.goalType==='hours'&&days>0?` That's about ${(g.goalVal/days*7).toFixed(1)} hours a week.`:'';
  el.textContent=what+by+'. Counting starts today, from the sessions you log.'+pace;
}
function saveCustomGoal(){
  if(!isPro()){openUpgradeModal('Custom Goals');return;}
  const g=_goalRead();
  if(!g.name){showToast('Give your goal a name','err');document.getElementById('goal-name')?.focus();return;}
  if(_badWords(g.name)) return;
  const max={hours:2000,sessions:1000,days:365,streak:365}[g.goalType]||1000;
  if(!(g.goalVal>0)||g.goalVal>max){showToast('Pick a target between 1 and '+max,'err');return;}
  if(g.goalType!=='hours') g.goalVal=Math.round(g.goalVal);
  if(g.endDate&&g.endDate<todayStr()){showToast('The deadline is in the past','err');return;}
  if(!S.customChallenges) S.customChallenges=[];
  S.customChallenges.push({id:'cg'+Date.now(),name:g.name,desc:'',icon:_goalIcon,goalType:g.goalType,goalVal:g.goalVal,section:g.section,endDate:g.endDate,createdAt:todayStr()+'T00:00:00'});
  saveState();
  closeCreateGoal();
  logLedgerEvent('custom_goal_created',{type:g.goalType});
  showToast('Goal created. It tracks itself as you log sessions.','ok');
  renderTab();
}

