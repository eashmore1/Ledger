// ═══════════════════════════════════════════════
// MISC HANDLERS
// ═══════════════════════════════════════════════
function attachTabHandlers(){
  // If my profile is showing, refresh my follower count from the real subcollection.
  if(document.getElementById('my-foll-cnt')&&AUTH?.uid) _loadFollowerCount(AUTH.uid,'my-foll-cnt');
  // Refresh any club member counts shown on this tab with the real Firestore count.
  if(firebaseDb) document.querySelectorAll('.myclub-mc').forEach(el=>{const cid=el.getAttribute('data-cid');if(cid)firebaseDb.collection('clubs').doc(cid).collection('members').get().then(s=>{el.textContent=s.size;}).catch(()=>{});});
  // Animate progress bars from 0 → target width
  document.querySelectorAll('.prog-fill').forEach(el=>{
    const target=el.style.width;
    if(!target||target==='0%')return;
    el.style.width='0%';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.width=target;}));
  });

  // Animate weekly chart bars from 0 → target height
  document.querySelectorAll('.week-bar').forEach(el=>{
    const target=el.style.height;
    if(!target||target==='0px')return;
    el.style.height='0px';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.height=target;}));
  });

  // Count-up animation for dashboard stat numbers
  function _countUpEl(el,duration){
    const text=el.textContent.trim();
    if(text.includes('/')||text===''||text==='0')return;
    const num=parseFloat(text);
    if(isNaN(num))return;
    const isDecimal=text.includes('.');
    let startTime=null;
    el.textContent=isDecimal?'0.0':'0';
    const tick=(t)=>{
      if(!startTime)startTime=t;
      const p=Math.min((t-startTime)/duration,1);
      const eased=1-Math.pow(1-p,4);
      el.textContent=isDecimal?(num*eased).toFixed(1):String(Math.round(num*eased));
      if(p<1)requestAnimationFrame(tick);
      else el.textContent=isDecimal?num.toFixed(1):String(num);
    };
    requestAnimationFrame(tick);
  }
  if(currentTab==='dashboard'){
    document.querySelectorAll('.stat-val').forEach(el=>_countUpEl(el,680));
  }
  if(currentTab==='profile'){
    document.querySelectorAll('.profile-stat-val').forEach(el=>_countUpEl(el,600));
  }
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
    closeAppSettings(); // Settings uses display:none, not a .open class — close it on Escape too
    if(TS.phase==='setup'||TS.phase==='recap'){document.getElementById('sess-overlay')?.classList.remove('open');}
    else if(TS.phase==='active'){pauseTimer();document.getElementById('sess-overlay')?.classList.remove('open');}
  }
});

// ── Modal accessibility layer ───────────────────────────────────────────────
// Retrofits dialog semantics, a focus trap, and focus return onto every
// .modal-overlay the app opens, without having to touch each of the 60+
// individual open*Modal() functions scattered through this file. It watches
// for the `open` class (how every modal here is shown/hidden) and layers
// behavior on top — purely additive, no existing modal markup or logic changes.
(function(){
  const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let lastTrigger=null, trapEl=null;
  function trapKeydown(e){
    if(e.key!=='Tab'||!trapEl||!document.body.contains(trapEl))return;
    const focusables=[...trapEl.querySelectorAll(FOCUSABLE)].filter(el=>el.offsetParent!==null);
    if(!focusables.length)return;
    const first=focusables[0],last=focusables[focusables.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
  function onModalOpened(overlay){
    if(!overlay.hasAttribute('role'))overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    lastTrigger=document.activeElement;
    trapEl=overlay.querySelector('.modal-box')||overlay;
    document.removeEventListener('keydown',trapKeydown,true);
    document.addEventListener('keydown',trapKeydown,true);
    setTimeout(()=>{
      if(!trapEl||!document.body.contains(trapEl))return;
      const target=trapEl.querySelector(FOCUSABLE);
      if(target){target.focus({preventScroll:true});}
      else{if(!trapEl.hasAttribute('tabindex'))trapEl.setAttribute('tabindex','-1');trapEl.focus({preventScroll:true});}
    },30);
  }
  function onModalClosed(){
    document.removeEventListener('keydown',trapKeydown,true);
    trapEl=null;
    if(lastTrigger&&document.body.contains(lastTrigger)&&typeof lastTrigger.focus==='function'){
      lastTrigger.focus({preventScroll:true});
    }
    lastTrigger=null;
  }
  new MutationObserver(muts=>{
    muts.forEach(m=>{
      if(m.type!=='attributes'||m.attributeName!=='class')return;
      const el=m.target;
      if(!(el instanceof HTMLElement)||!el.classList.contains('modal-overlay'))return;
      const isOpen=el.classList.contains('open');
      const wasOpen=(m.oldValue||'').split(' ').includes('open');
      if(isOpen&&!wasOpen)onModalOpened(el);
      else if(!isOpen&&wasOpen)onModalClosed();
      if((el.id==='upgrade-modal'||el.id==='ach-modal')&&typeof _syncModalLock==='function')_syncModalLock();
    });
  }).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true,attributeOldValue:true});
})();

// ═══════════════════════════════════════════════
// HEAT MAP
// ═══════════════════════════════════════════════
function setHeatMapRange(r){
  _heatMapRange=r;
  const el=document.getElementById('heat-map-card');
  if(el) el.innerHTML=buildHeatMap();
}

function buildHeatMap(){
  // Build per-day map
  const dayMap={};
  (S.activities||[]).forEach(a=>{
    const d=a.date.slice(0,10);
    if(!dayMap[d]) dayMap[d]={hours:0,sections:{}};
    dayMap[d].hours+=(a.hours||0);
    dayMap[d].sections[a.section]=(dayMap[d].sections[a.section]||0)+(a.hours||0);
  });
  Object.keys(dayMap).forEach(d=>{
    const secs=dayMap[d].sections;
    dayMap[d].primary=Object.keys(secs).sort((a,b)=>secs[b]-secs[a])[0]||null;
  });

  const pro=isPro();
  const today=new Date(); today.setHours(0,0,0,0);
  const hexMap={'var(--ora)':'#d44000','var(--ind)':'#6366f1','var(--pur)':'#a855f7','var(--grn)':'#22c55e','var(--tea)':'#14b8a6','var(--amb)':'#f59e0b'};

  function cellBg(key){
    const e=dayMap[key];
    if(!e||e.hours===0) return isDark?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)';
    const raw=(e.primary&&EXAMS[e.primary])?EXAMS[e.primary].color:'var(--ora)';
    const hex=hexMap[raw]||raw;
    const h=e.hours; const op=h<1?0.28:h<2?0.50:h<3?0.72:h<4?0.88:1.0;
    return hex+Math.round(op*255).toString(16).padStart(2,'0');
  }

  const effectiveRange=(!isElite()&&_heatMapRange==='year')?'month':_heatMapRange;
  const userSections=S.sections||[];
  const legendHTML=userSections.map(s=>{
    const c=EXAMS[s]?.color||'var(--ora)';
    return`<div style="display:flex;align-items:center;gap:4px"><div style="width:9px;height:9px;border-radius:2px;background:${c}"></div><span style="font-size:10px;color:var(--mut);font-weight:600">${s}</span></div>`;
  }).join('');

  const elite=isElite();
  const toggleRanges=elite
    ?[{id:'week',label:'Week'},{id:'month',label:'Month'},{id:'year',label:'Year'}]
    :[{id:'week',label:'Week'},{id:'month',label:'Month'}];
  const toggleHTML=`<div style="display:flex;gap:0;background:var(--surf3);border-radius:8px;padding:3px;width:fit-content">`+
    toggleRanges.map(r=>`<button onclick="setHeatMapRange('${r.id}')" style="padding:5px 14px;border-radius:6px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:background-color .12s,border-color .12s,color .12s,box-shadow .12s,transform .12s,opacity .12s;background:${effectiveRange===r.id?'var(--surf)':'transparent'};color:${effectiveRange===r.id?'var(--txt)':'var(--mut)'};box-shadow:${effectiveRange===r.id?'var(--shadow)':'none'}">${r.label}</button>`).join('')+
    (!elite?`<button onclick="openUpgradeModal('Full Activity History')" style="padding:5px 14px;border-radius:6px;border:none;font-size:11px;font-weight:700;cursor:pointer;background:transparent;color:var(--sub)">${ico('lock')} Year</button>`:'')+'</div>';

  // ── WEEK VIEW ─────────────────────────────────────────────
  if(effectiveRange==='week'){
    const days=[];
    for(let i=6;i>=0;i--){
      const d=new Date(today); d.setDate(today.getDate()-i);
      const key=_ymd(d);
      const e=dayMap[key]||{hours:0,primary:null};
      days.push({key,label:d.toLocaleDateString('en-US',{weekday:'short'}),date:d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),e,isToday:i===0});
    }
    const maxH=Math.max(...days.map(d=>d.e.hours),1);
    const totalHrs=days.reduce((a,d)=>a+d.e.hours,0);
    const activeDays=days.filter(d=>d.e.hours>0).length;
    const bars=days.map(d=>{
      const barH=d.e.hours>0?Math.max(6,Math.round(d.e.hours/maxH*80)):0;
      const col=d.e.primary&&EXAMS[d.e.primary]?EXAMS[d.e.primary].color:'var(--ora)';
      const bg=cellBg(d.key);
      return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px">
        <div style="font-size:11px;font-weight:800;color:${d.e.hours>0?col:'transparent'}">${d.e.hours>0?d.e.hours.toFixed(1)+'h':'-'}</div>
        <div style="width:100%;height:80px;display:flex;align-items:flex-end;justify-content:center">
          <div style="width:min(100%,40px);height:${barH}px;background:${bg};border-radius:5px 5px 2px 2px;${d.isToday?'outline:2px solid var(--ora);outline-offset:2px':''}"></div>
        </div>
        <div style="font-size:11px;font-weight:${d.isToday?800:600};color:${d.isToday?'var(--ora)':'var(--sub)'}">${d.label}</div>
        <div style="font-size:10px;color:var(--mut)">${d.date}</div>
      </div>`;
    }).join('');
    return`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px">
      <div><div class="section-title" style="margin:0">Study Activity</div><div style="font-size:11px;color:var(--mut);margin-top:2px">${activeDays} active days · ${totalHrs.toFixed(1)}h this week</div></div>
      ${toggleHTML}
    </div>
    <div style="display:flex;gap:6px">${bars}</div>
    <div style="display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap">${legendHTML}</div>`;
  }

  // ── MONTH VIEW ────────────────────────────────────────────
  if(effectiveRange==='month'){
    const CELL=22, GAP=4;
    const weeksM=5;
    const startM=new Date(today); startM.setDate(today.getDate()-today.getDay()-(weeksM-1)*7);
    const cols=[];
    for(let w=0;w<weeksM;w++){
      const cells=[];
      for(let d=0;d<7;d++){
        const cur=new Date(startM); cur.setDate(startM.getDate()+w*7+d);
        const key=_ymd(cur);
        const future=cur>today;
        const e=dayMap[key]||{hours:0,primary:null};
        const isToday=cur.getTime()===today.getTime();
        const bg=future?(isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.05)'):cellBg(key);
        const tip=e.hours>0?`${key} · ${e.hours.toFixed(1)}h${e.primary?' · '+e.primary:''}`:`${key} · no study`;
        cells.push(`<div style="width:${CELL}px;height:${CELL}px;border-radius:4px;background:${bg};${isToday?'outline:2px solid var(--ora);outline-offset:1px':''}" title="${tip}"></div>`);
      }
      cols.push(`<div style="display:flex;flex-direction:column;gap:${GAP}px">${cells.join('')}</div>`);
    }
    const dlabM=['S','M','T','W','T','F','S'].map((day,i)=>
      `<div style="height:${CELL}px;line-height:${CELL}px;font-size:10px;color:${i%2===1?'var(--mut)':'transparent'};text-align:right;padding-right:4px;font-weight:700">${day}</div>`
    ).join('');
    let lm=''; const mlabM=[];
    for(let w=0;w<weeksM;w++){
      const d=new Date(startM); d.setDate(startM.getDate()+w*7);
      const m=d.toLocaleDateString('en-US',{month:'short'});
      if(m!==lm){lm=m;mlabM.push(`<div style="width:${CELL}px;flex-shrink:0;font-size:10px;color:var(--mut);font-weight:700">${m}</div>`);}
      else mlabM.push(`<div style="width:${CELL}px;flex-shrink:0"></div>`);
    }
    const wKeys=Object.keys(dayMap).filter(d=>{const dt=new Date(d+'T12:00:00');return dt>=startM&&dt<=today;});
    const aDays=wKeys.filter(d=>dayMap[d].hours>0).length;
    const tHrs=wKeys.reduce((a,d)=>a+(dayMap[d]?.hours||0),0);
    const avgH=aDays>0?(tHrs/aDays).toFixed(1):0;
    return`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div><div class="section-title" style="margin:0">Study Activity — Last 5 Weeks</div><div style="font-size:11px;color:var(--mut);margin-top:2px">${aDays} active days · ${tHrs.toFixed(1)}h · ${avgH}h avg/day</div></div>
      ${toggleHTML}
    </div>
    <div style="display:flex;margin-bottom:5px"><div style="width:22px;flex-shrink:0"></div><div style="display:flex;gap:${GAP}px">${mlabM.join('')}</div></div>
    <div style="display:flex;gap:4px"><div style="display:flex;flex-direction:column;gap:${GAP}px;width:22px">${dlabM}</div><div style="display:flex;gap:${GAP}px">${cols.join('')}</div></div>
    <div style="display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap">${legendHTML}</div>`;
  }

  // ── YEAR VIEW ─────────────────────────────────────────────
  // 11px cells, 2px gaps → 52*(11+2)=676 + 22 day-label = 698px — fits ~840px card
  const CELL=11, GAP=2;
  const weeksY=pro?52:16;
  const startY=new Date(today); startY.setDate(today.getDate()-today.getDay()-(weeksY-1)*7);
  const cols=[];
  for(let w=0;w<weeksY;w++){
    const cells=[];
    for(let d=0;d<7;d++){
      const cur=new Date(startY); cur.setDate(startY.getDate()+w*7+d);
      const key=_ymd(cur);
      const future=cur>today;
      const e=dayMap[key]||{hours:0,primary:null};
      const isToday=cur.getTime()===today.getTime();
      const bg=future?(isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.05)'):cellBg(key);
      const tip=e.hours>0?`${key} · ${e.hours.toFixed(1)}h${e.primary?' · '+e.primary:''}`:`${key} · no study`;
      cells.push(`<div style="width:${CELL}px;height:${CELL}px;border-radius:2px;background:${bg};${isToday?'outline:2px solid var(--ora);outline-offset:1px':''}" title="${tip}"></div>`);
    }
    cols.push(`<div style="display:flex;flex-direction:column;gap:${GAP}px">${cells.join('')}</div>`);
  }
  let ly=''; const yLabels=[];
  for(let w=0;w<weeksY;w++){
    const d=new Date(startY); d.setDate(startY.getDate()+w*7);
    const m=d.toLocaleDateString('en-US',{month:'short'});
    if(m!==ly){ly=m;yLabels.push(`<div style="width:${CELL}px;flex-shrink:0;font-size:10px;color:var(--mut);font-weight:700;white-space:nowrap">${m}</div>`);}
    else yLabels.push(`<div style="width:${CELL}px;flex-shrink:0"></div>`);
  }
  const dlabY=['S','M','T','W','T','F','S'].map((day,i)=>
    `<div style="height:${CELL}px;line-height:${CELL}px;font-size:10px;color:${i%2===1?'var(--mut)':'transparent'};text-align:right;padding-right:4px;font-weight:700">${day}</div>`
  ).join('');
  const wKeysY=Object.keys(dayMap).filter(d=>{const dt=new Date(d+'T12:00:00');return dt>=startY&&dt<=today;});
  const aDaysY=wKeysY.filter(d=>dayMap[d].hours>0).length;
  const tHrsY=wKeysY.reduce((a,d)=>a+(dayMap[d]?.hours||0),0);
  const avgY=aDaysY>0?(tHrsY/aDaysY).toFixed(1):0;

  let gridHTML;
  if(pro){
    gridHTML=`<div style="display:flex;gap:${GAP}px">${cols.join('')}</div>`;
  } else {
    const blurred=cols.slice(0,weeksY-1).join('');
    const last=cols[weeksY-1];
    gridHTML=`<div style="display:flex;gap:${GAP}px">
      <div style="position:relative;display:inline-flex;gap:${GAP}px">
        <div style="display:flex;gap:${GAP}px;filter:blur(3px);opacity:.3;pointer-events:none;user-select:none">${blurred}</div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="openUpgradeModal('Full Activity History')">
          <div style="background:var(--surf);border:1px solid var(--bdr);border-radius:8px;padding:7px 12px;text-align:center;box-shadow:var(--shadow-md)">
            <div style="font-size:10px;font-weight:800;color:var(--ora)">52 weeks with Pro</div>
            <div style="font-size:10px;color:var(--sub);margin-top:2px">Unlock →</div>
          </div>
        </div>
      </div>${last}
    </div>`;
  }

  return`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div><div class="section-title" style="margin:0">${pro?'Study Activity — Last 52 Weeks':'Study Activity — Last 16 Weeks'}</div><div style="font-size:11px;color:var(--mut);margin-top:2px">${aDaysY} active days · ${tHrsY.toFixed(1)}h · ${avgY}h avg/day</div></div>
    ${toggleHTML}
  </div>
  <div style="display:flex;margin-bottom:4px"><div style="width:22px;flex-shrink:0"></div><div style="display:flex;gap:${GAP}px">${yLabels.join('')}</div></div>
  <div style="display:flex;gap:4px"><div style="display:flex;flex-direction:column;gap:${GAP}px;width:22px">${dlabY}</div>${gridHTML}</div>
  <div style="display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap">${legendHTML}</div>`;
}

// ═══════════════════════════════════════════════
// SCORE TRACKER
// ═══════════════════════════════════════════════
function buildScoreTracker(){
  const scores=S.practiceScores||{};
  const sections=S.sections||['FAR','AUD','REG','TCP'];
  const rows=sections.map(s=>{
    const ex=EXAMS[s];
    const sScores=scores[s]||[];
    const latest=sScores.length?sScores[sScores.length-1]:null;
    const avg=sScores.length?Math.round(sScores.reduce((a,b)=>a+b.score,0)/sScores.length):null;
    const trend=sScores.length>=2?(sScores[sScores.length-1].score>sScores[sScores.length-2].score?ico('lineChart'):ico('trendDown')):'—';
    const passed=(S.sectionPassed||[]).includes(s);
    return`<div class="score-row">
      <span class="badge badge-${s}" style="min-width:46px;justify-content:center;flex-shrink:0">${s}</span>
      <div class="score-row-mid">
        ${sScores.slice(-5).map((sc,i)=>`<div style="text-align:center">
          <div style="width:34px;height:34px;border-radius:8px;background:${sc.score>=75?'var(--grn-bg)':sc.score>=65?'var(--amb-bg)':'var(--red-bg)'};border:1.5px solid ${sc.score>=75?'var(--grn)':sc.score>=65?'var(--amb)':'var(--red)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:${sc.score>=75?'var(--grn)':sc.score>=65?'var(--amb)':'var(--red)'}">${sc.score}</div>
          <div style="font-size:10px;color:var(--mut);margin-top:2px">${sc.label||'P'+(i+1)}</div>
        </div>`).join('')}
        ${sScores.length===0?`<span style="font-size:12px;color:var(--mut);align-self:center">No scores yet</span>`:''}
      </div>
      <div class="score-row-right">
        ${avg!==null?`<div style="font-size:18px;font-weight:900;color:${avg>=75?'var(--grn)':avg>=65?'var(--amb)':'var(--red)'}">${avg}</div><div style="font-size:10px;color:var(--mut)">avg ${trend}</div>`:''}
        ${passed?`<div class="badge badge-passed" style="margin-top:4px">Passed ${ico('checkCircle')}</div>`:''}
      </div>
      <button class="btn btn-ghost btn-xs" onclick="openScoreModal('${s}')">+ Score</button>
    </div>`;
  }).join('');
  return`<div>${rows}</div>`;
}

function openScoreModal(section){
  document.getElementById('post-modal').querySelector('.modal-title').textContent=`Log Practice Score — ${section}`;
  document.getElementById('post-modal-body').innerHTML=`
<div style="margin-bottom:14px;padding:11px 13px;background:var(--surf2);border-radius:9px;font-size:12px;color:var(--sub)">
  Log your Becker, Gleim, Wiley, or UWorld practice exam score for <strong>${section}</strong>.<br>
  Target <strong style="color:var(--grn)">75+</strong> on practice exams before scheduling your real exam.
</div>
<div class="form-row">
  <div class="form-grp">
    <label>Score (0–99)</label>
    <input id="sc-score" type="number" min="0" max="99" placeholder="e.g. 74">
  </div>
  <div class="form-grp">
    <label>Label</label>
    <input id="sc-label" type="text" placeholder="e.g. Becker Mock 1">
  </div>
</div>
<div class="form-grp">
  <label>Date</label>
  <input id="sc-date" type="date" value="${todayStr()}">
</div>
<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:4px" onclick="submitScore('${section}')">Save Score</button>`;
  document.getElementById('post-modal').classList.add('open');
}

function submitScore(section){
  const score=parseInt(document.getElementById('sc-score')?.value);
  const label=document.getElementById('sc-label')?.value?.trim()||'';
  const date=document.getElementById('sc-date')?.value||todayStr();
  if(isNaN(score)||score<0||score>99){showToast('Enter a valid score 0–99','err');return;}
  if(!S.practiceScores)S.practiceScores={};
  if(!S.practiceScores[section])S.practiceScores[section]=[];
  S.practiceScores[section].push({score,label,date});
  // Practice scores are the only readiness input that measures mastery, and the
  // one the score card nags for — worth knowing how many users ever log one.
  logLedgerEvent('practice_score_logged',{section,score,passing:score>=75,
    nth:S.practiceScores[section].length});
  if(S.practiceScores[section].length===1) logLedgerEventOnce('first_practice_score',{section,score});
  saveState();
  closePostModal();
  showToast(`${section} score ${score} logged${score>=75?' — at passing level':''}`,'ok');
  renderTab();
}

// ═══════════════════════════════════════════════
// EXAM TIPS TAB
// ═══════════════════════════════════════════════
// Exam Day Protocol card — preserved on the Dashboard after the Exam Hub was retired.
function _toggleExamProtocol(){
  const b=document.getElementById('exam-protocol-body');
  const c=document.getElementById('exam-protocol-chev');
  if(!b) return;
  const open=b.style.display==='none';
  b.style.display=open?'block':'none';
  if(c) c.style.transform=open?'rotate(180deg)':'';
}
function buildExamDayProtocolCard(open){
  // Opens expanded on the Dashboard's Exams tab; still collapsible.
  if(isPro()){
    return `<div class="card card-pad" id="exam-protocol-card" style="border-top:3px solid var(--amb);margin-bottom:16px">
      <div onclick="_toggleExamProtocol()" style="display:flex;align-items:center;gap:12px;cursor:pointer">
        <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--amb),#d97706);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${ico('clipboard')}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:800">Exam Day Protocol</div>
          <div style="font-size:11px;color:var(--mut)">Your checklist from 2 weeks out to the day after</div>
        </div>
        <span id="exam-protocol-chev" style="font-size:16px;color:var(--mut);transition:transform .2s;flex-shrink:0${open?';transform:rotate(180deg)':''}">▾</span>
      </div>
      <div id="exam-protocol-body" style="display:${open?'block':'none'};margin-top:16px">${_buildExamDayProtocol()}</div>
    </div>`;
  }
  return `<div class="card card-pad" id="exam-protocol-card" style="text-align:center;padding:40px 24px;border:2px dashed var(--bdr2);margin-bottom:16px">
    <div style="font-size:44px;margin-bottom:12px">${ico('clipboard')}</div>
    <div style="font-size:18px;font-weight:900;margin-bottom:8px;letter-spacing:-.02em">Exam Day Protocol <span style="font-size:11px;font-weight:700;background:var(--ora-bg);color:var(--ora);border:1px solid var(--ora-bdr);border-radius:20px;padding:2px 8px;vertical-align:middle">Pro</span></div>
    <div style="font-size:13px;color:var(--sub);max-width:420px;margin:0 auto 18px;line-height:1.7">A day-by-day checklist from two weeks out through the day after, with the reason behind every step, so nothing slips before you sit.</div>
    <button class="btn btn-primary" style="font-size:13px;padding:10px 26px" onclick="openUpgradeModal('Exam Day Protocol')">Unlock with Pro — 7 days free</button>
  </div>`;
}

