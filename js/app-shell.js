// ═══════════════════════════════════════════════
// CHALLENGE HELPERS
// ═══════════════════════════════════════════════
function getChallengeProgress(ch){
  const acts=S.activities||[];
  const weekAgo=new Date(Date.now()-7*86400000);
  switch(ch.type){
    case 'hours_total': return Math.min(ch.target,parseFloat(getTotalHours().toFixed(1)));
    case 'hours_session': return Math.min(ch.target,Math.max(0,...[0,...acts.map(a=>a.hours||0)]));
    case 'hours_week': return Math.min(ch.target,parseFloat(acts.filter(a=>new Date(a.date)>weekAgo).reduce((s,a)=>s+(a.hours||0),0).toFixed(1)));
    case 'hours_section_week': return Math.min(ch.target,parseFloat(acts.filter(a=>a.section===ch.section&&new Date(a.date)>weekAgo).reduce((s,a)=>s+(a.hours||0),0).toFixed(1)));
    case 'sessions_total': return Math.min(ch.target,acts.length);
    case 'streak': return Math.min(ch.target,getStreak());
    case 'pass_section': return Math.min(ch.target,(S.sectionPassed||[]).length);
    case 'pass_all': return Math.min(4,(S.sectionPassed||[]).length);
    case 'sections_studied': return Math.min(ch.target,[...new Set(acts.map(a=>a.section))].length);
    default: return 0;
  }
}
function isChallengeDone(ch){ return getChallengeProgress(ch)>=ch.target; }
function isJoined(chId){ return (S.challenges||[]).includes(chId); }

function getCustomChallengeProgress(ch){
  const acts=S.activities||[];
  const start=String(ch.createdAt||'').slice(0,10);
  const end=ch.endDate?String(ch.endDate).slice(0,10):'';
  const relevant=acts.filter(a=>{
    const d=String(a.date||'').slice(0,10);
    return d&&d>=start&&(!end||d<=end)&&(!ch.section||a.section===ch.section);
  });
  if(ch.goalType==='hours') return Math.min(ch.goalVal,parseFloat(relevant.reduce((s,a)=>s+(a.hours||0),0).toFixed(1)));
  if(ch.goalType==='sessions') return Math.min(ch.goalVal,relevant.length);
  if(ch.goalType==='days') return Math.min(ch.goalVal,new Set(relevant.map(a=>String(a.date).slice(0,10))).size);
  if(ch.goalType==='streak') return Math.min(ch.goalVal,getStreak());
  return 0;
}
function deleteCustomChallenge(id){
  if(!confirm('Delete this goal?'))return;
  S.customChallenges=(S.customChallenges||[]).filter(c=>c.id!==id);
  S.challenges=(S.challenges||[]).filter(cid=>cid!==id);
  S.challengeCompleted=(S.challengeCompleted||[]).filter(cid=>cid!==id);
  saveState();
  showToast('Goal deleted','info');
  renderTab();
}
function joinChallenge(chId){
  const ch=CHALLENGES.find(c=>c.id===chId);if(!ch)return;
  if(!S.challenges)S.challenges=[];
  if(S.challenges.includes(chId)){showToast('Already joined!','info');return;}
  S.challenges.push(chId);
  saveState();
  renderTab();
  showToast('Challenge joined! Progress tracks automatically','ok');
}
function leaveChallenge(chId){
  S.challenges=(S.challenges||[]).filter(id=>id!==chId);
  saveState();
  renderTab();
  showToast('Left challenge','info');
}
function checkChallengeAchievements(){
  const joined=S.challenges||[];
  const newlyCompleted=[];
  CHALLENGES.forEach(ch=>{
    if(!joined.includes(ch.id))return;
    const prog=getChallengeProgress(ch);
    const wasComplete=(S.challengeCompleted||[]).includes(ch.id);
    if(prog>=ch.target&&!wasComplete){
      if(!S.challengeCompleted)S.challengeCompleted=[];
      S.challengeCompleted.push(ch.id);
      newlyCompleted.push(ch);
    }
  });
  // Your own goals (a streak goal counts once reached, even after the deadline).
  (S.customChallenges||[]).forEach(c=>{
    if((S.challengeCompleted||[]).includes(c.id)) return;
    if(c.endDate&&c.goalType==='streak'&&todayStr()>String(c.endDate).slice(0,10)) return;
    if(getCustomChallengeProgress(c)>=c.goalVal){
      if(!S.challengeCompleted)S.challengeCompleted=[];
      S.challengeCompleted.push(c.id);
      newlyCompleted.push({title:c.name,custom:true});
    }
  });
  if(newlyCompleted.length){
    saveState();
    newlyCompleted.forEach((ch,i)=>{
      if(ch.custom){setTimeout(()=>showToast('Goal reached: '+ch.title+'!','ok'),500+i*600);return;}
      setTimeout(()=>showToast('Challenge complete: '+ch.title+'! Reward: '+ch.reward,'ok'),500+i*600);
    });
  }
}

// ═══════════════════════════════════════════════
// MAIN APP SHELL
// ═══════════════════════════════════════════════
function renderApp(){
  logLedgerEvent('app_open');
  // Retention buckets. Firebase can derive retention from app_open alone, but
  // only as a cohort chart — these fire once per user so they can be used as
  // conversion goals and audience definitions, and so day-N return is visible
  // next to the activation events above it in the same funnel.
  (function(){
    const created=Number(S&&S.created);
    if(!isFinite(created)||!created) return;
    const days=(Date.now()-created)/86400000;
    if(days>=1&&days<7)       logLedgerEventOnce('return_day_2_7');
    else if(days>=7&&days<21) logLedgerEventOnce('return_week_2');
    else if(days>=28)         logLedgerEventOnce('return_day_30');
  })();
  // Leaving the messages page: kill live messaging listeners so background snapshots
  // don't keep marking the open conversation as read.
  if(typeof _detachDMConvListener==='function') _detachDMConvListener();
  if(typeof _detachDMInboxListener==='function') _detachDMInboxListener();
  // Once per page load: rehydrate an in-progress study session so a reload never loses the timer.
  if(!window._tsRestored){window._tsRestored=true;try{tsResumeAfterLoad();}catch(e){console.warn('[Ledger] session restore:',e);}}
  // Once per page load: push my current study stats to my clubs' shared leaderboards.
  if(!window._clubSynced){window._clubSynced=true;setTimeout(()=>{try{syncClubActivity();}catch(e){}},2500);}
  // Once per page load: backfill follower edges so existing follows count correctly cross-user.
  if(!window._followBackfilled){window._followBackfilled=true;setTimeout(()=>{try{saveFollowToFirestore();}catch(e){}},3000);}
  // Once per page load: make sure I'm in my firm's shared cohort club.
  if(!window._cohortEnsured){window._cohortEnsured=true;setTimeout(()=>{try{ensureFirmCohort();}catch(e){}},3500);}
  // Restore the active tab from the URL hash so a reload keeps you where you were
  // (instead of always snapping back to the feed).
  const [_hashTab,_hashSub]=(location.hash||'').replace(/^#/,'').split('/');
  if(['today','feed','dashboard','plan','profile','explore','studylab'].includes(_hashTab)){
    currentTab=_hashTab;
    if(_hashSub&&SUBTABS[_hashTab]&&SUBTABS[_hashTab].some(t=>t.id===_hashSub)){_subTab[_hashTab]=_hashSub;if(_hashTab==='studylab')_studyLabTab=_hashSub;}
  }
  if(!window._actsMigrated){window._actsMigrated=true;try{_migrateActivities();}catch(e){}}
  history.pushState({view:'app'},'','/'+_hashFor(currentTab));
  document.body.classList.remove('no-app-nav');
  document.title='Ledger — CPA Study Tracker';
  const avatarBg = S?.profilePic ? 'transparent' : 'linear-gradient(135deg,#5a5fcf,#9333ea)';
  const avatarBorder = S?.profilePic ? '2px solid var(--bdr)' : 'none';
  const avatarContent = S?.profilePic
    ? `<img src="${S.profilePic}" alt="Your profile photo" style="width:100%;height:100%;object-fit:cover">`
    : (AUTH?.displayName||'?').charAt(0).toUpperCase();
  document.getElementById('root').innerHTML=`
<div class="app-wrap">
  <nav class="topnav">
    <div class="topnav-inner">
      <div class="nav-logo" onclick="switchTab('today')" style="display:flex;align-items:center;gap:7px"><svg width="22" height="22" viewBox="0 0 180 180" style="border-radius:5px;flex-shrink:0"><rect width="180" height="180" fill="#18103a"/><rect x="26" y="55" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="80" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="105" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="130" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="34" y="40" width="26" height="96" rx="6" fill="#fff"/><rect x="34" y="116" width="82" height="26" rx="6" fill="#fff"/><circle cx="142" cy="44" r="13" fill="#d44000"/></svg>Ledger</div>
      <div class="nav-tabs">
        ${[
          // Ordered by how often a candidate actually opens them. Study Lab is
          // the paid surface (MCQs, flashcards, AI coach) and was last; Profile
          // is a weekly visit at best and now lives behind the avatar, which is
          // where people look for it anyway.
          {id:'today',icon:'sunrise',label:'Today'},
          {id:'feed',icon:'◈',label:'Feed'},
          {id:'dashboard',icon:'▦',label:'Dashboard'},
          {id:'studylab',icon:'⬡',label:'Study Lab'},
          {id:'plan',icon:'calendarDays',label:'Study Plan'},
          {id:'explore',icon:'◎',label:'Explore'},
        ].map(t=>`<button class="nav-tab${currentTab===t.id?' active':''}" onclick="switchTab('${t.id}')">${t.label}</button>`).join('')}
      </div>
      <div class="nav-right">
        <span id="nav-sess-chip" style="display:none"></span>
        <button class="post-btn" id="nav-log-btn" onclick="openSessionModal()">Start Session</button>
        <button class="nav-pro-chip ${navProClass()}" onclick="openUpgradeModal(null)">${navProLabel()}</button>
        <button onclick="openSearchModal()" title="Search Users" class="btn btn-ghost btn-sm" style="font-size:15px;padding:7px 9px;border-radius:9px">${ico('magnifier')}</button>
        <button onclick="openNotificationCenter()" title="Notifications" class="btn btn-ghost btn-sm" id="notif-bell-btn" style="font-size:15px;padding:7px 9px;border-radius:9px;position:relative">${ico('bell')}${(()=>{const uc=(S&&S.notifications?S.notifications.filter(n=>!n.read).length:0);return uc>0?`<span style="position:absolute;top:3px;right:3px;min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1;padding:0 3px">${uc>9?'9+':uc}</span>`:'';})()}</button>
        <button onclick="openMessagesPage()" title="Messages" class="btn btn-ghost btn-sm nav-btn-msg" style="font-size:15px;padding:7px 9px;border-radius:9px">${ico('chat')}</button>
        <button onclick="openAppSettings()" title="Settings" class="btn btn-ghost btn-sm nav-btn-set" style="font-size:15px;padding:7px 9px;border-radius:9px">${ico('gear')}</button>
        <button id="nav-avatar-btn" onclick="switchTab('profile')" title="${AUTH?.displayName||'Profile'}" style="background:${avatarBg};border:${avatarBorder};border-radius:50%;width:34px;height:34px;box-shadow:${currentTab==='profile'?'0 0 0 2px var(--ora)':'var(--shadow-btn)'};color:#fff;font-size:13px;font-weight:800;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0;transition:transform var(--transition);box-shadow:var(--shadow-btn)" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform=''">${avatarContent}</button>
      </div>
    </div>
  </nav>
  <div class="page fade-in" id="page-content"></div>
  <footer class="lg-footer">
    <style>
    .lg-footer{background:#0c0a14;color:rgba(255,255,255,.72);padding:48px 24px 26px;font-family:var(--font),'Libre Franklin',system-ui,sans-serif;margin-top:40px}
    .lg-footer a{color:rgba(255,255,255,.6);text-decoration:none;transition:color .15s}
    .lg-footer a:hover{color:#fff}
    .lg-foot-inner{max-width:1060px;margin:0 auto}
    .lg-foot-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:32px;align-items:start}
    .lg-foot-h{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:rgba(255,255,255,.62);margin-bottom:16px}
    .lg-foot-col a{display:block;font-size:13px;margin-bottom:11px;line-height:1.2}
    .lg-foot-col a:last-child{margin-bottom:0}
    .lg-foot-bottom{border-top:1px solid rgba(255,255,255,.09);margin-top:40px;padding-top:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;font-size:12px;color:rgba(255,255,255,.66)}
    .lg-foot-disc{font-size:11px;color:rgba(255,255,255,.6);line-height:1.7;margin:20px auto 0;max-width:920px;text-align:center}
    @media(max-width:760px){.lg-foot-grid{grid-template-columns:1fr 1fr;gap:28px 24px}.lg-foot-brand{grid-column:1 / -1}.lg-foot-bottom{justify-content:center;text-align:center}}
    @media(max-width:640px){.lg-footer{padding-bottom:90px}}
    </style>
    <div class="lg-foot-inner">
      <div class="lg-foot-grid">
        <div class="lg-foot-brand">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><img src="/logo.svg" alt="Ledger" style="width:26px;height:26px"><span style="font-family:var(--font-display);font-style:italic;font-size:21px;font-weight:700;color:#fff;letter-spacing:-.01em">Ledger</span></div>
          <p style="font-size:13px;line-height:1.65;color:rgba(255,255,255,.66);max-width:280px;margin:0">The CPA study tracker that keeps you on pace — log hours, drill MCQs, get AI coaching, and stay accountable with your study circle.</p>
          <div style="margin-top:16px;font-size:12px;color:rgba(255,255,255,.66)">A product of <a href="https://momentumapps.net" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><strong style="color:rgba(255,255,255,.8)">Momentum Apps LLC</strong></a> &middot; <a href="https://momentumapps.net" target="_blank" rel="noopener" style="color:inherit">momentumapps.net</a></div>
        </div>
        <div class="lg-foot-col"><div class="lg-foot-h">Product</div><a href="/landing">Features</a><a href="/pricing">Pricing</a><a href="/faq">FAQ</a></div>
        <div class="lg-foot-col"><div class="lg-foot-h">Company</div><a href="/about">About</a><a href="/contact">Contact</a><a href="mailto:support@ledgercpa.app">Support</a></div>
        <div class="lg-foot-col"><div class="lg-foot-h">Legal</div><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a><a href="/terms#refunds">Refund Policy</a><a href="#" onclick="openCookieSettings();return false">Cookie Settings</a></div>
      </div>
      <div class="lg-foot-bottom"><div>&copy; 2026 Momentum Apps LLC. All rights reserved.</div><div>Ledger&trade; is a product of <a href="https://momentumapps.net" target="_blank" rel="noopener">Momentum Apps LLC</a> &middot; <a href="mailto:support@ledgercpa.app">support@ledgercpa.app</a></div></div>
      <p class="lg-foot-disc">Ledger is an independent study tracking tool and is not affiliated with, endorsed by, or approved by the AICPA, NASBA, Prometric, Becker, Gleim, Roger, Wiley, UWorld, or any other exam review provider. &ldquo;CPA&rdquo; and &ldquo;CPA Exam&rdquo; are trademarks of the AICPA and NASBA. Ledger is a study aid and does not guarantee exam passage. Results vary.</p>
    </div>
  </footer>
</div>`;
  renderTab();
  syncNavActive(currentTab);
  updateNavChip(); // reflect any restored in-progress session in the top bar
  // Handle direct deep-link navigation on page reload
  const _profMatch=window.location.pathname.match(/^\/user\/(.+)/);
  const _actMatch=window.location.pathname.match(/^\/activity\/(.+)/);
  const _clubMatch=window.location.pathname.match(/^\/club\/(.+)/);
  if(_profMatch){setTimeout(()=>openUserProfile(decodeURIComponent(_profMatch[1])),80);}
  else if(_actMatch){setTimeout(()=>openActivityPage(decodeURIComponent(_actMatch[1])),80);}
  else if(_clubMatch){setTimeout(()=>openClubPage(decodeURIComponent(_clubMatch[1])),80);}
  else if(window.location.pathname==='/messages'){setTimeout(()=>openMessagesPage(),80);}
  if(!window._pushBooted){ window._pushBooted=true; setTimeout(()=>{ refreshPushToken(); syncNotifyProfile(); if(!navigator.onLine) _offlineBanner(true); },4000); }
  // Home-screen shortcuts / reminder notifications: /?action=start|log|rooms
  try{
    const _act=new URLSearchParams(_BOOT_SEARCH).get('action');
    if(_act&&!window._shortcutHandled){ window._shortcutHandled=true; setTimeout(()=>{ if(!document.getElementById('post-ob-offer')) _runShortcut(_act); },900); }
  }catch(e){}
  // Study-room invite link: /?room=<id>[&club=<clubId>]
  try{
    const _q=new URLSearchParams(_BOOT_SEARCH), _rid=_q.get('room');
    if(_rid&&!window._roomInviteHandled){
      window._roomInviteHandled=true;
      const _cid=_q.get('club')||'';
      setTimeout(()=>openRoomInvite(_rid,_cid),1200);
    }
  }catch(e){}
  setTimeout(checkStreakUrgency, 800);
  setTimeout(checkTrialUrgency, 1600);
  setTimeout(checkStudyNudge, 1000);
  // Show contextual onboarding on first visit — wait until post-onboarding offer is gone
  setTimeout(function(){
    if(document.getElementById('post-ob-offer')) return; // offer still open, hold off
    _maybeAutoStartOnboarding();
  }, 900);
  if(!window._streakUrgencyInterval){
    window._streakUrgencyInterval=setInterval(checkStreakUrgency, 60000);
  }
}

// Keeps every nav surface in sync with the active tab. Called from switchTab and
// from renderApp, which can land on a tab from the URL hash without going through
// switchTab at all.
function syncNavActive(tab){
  const labelMap={today:'Today',feed:'Feed',dashboard:'Dashboard',plan:'Study Plan',profile:'Profile',explore:'Explore',studylab:'Study Lab'};
  document.querySelectorAll('.nav-tab').forEach(b=>{
    b.classList.toggle('active',b.textContent.trim().startsWith(labelMap[tab]||tab));
  });
  // Study Plan and Explore live in the More sheet, so highlight More while you're
  // on one of them — otherwise the bottom bar shows nothing selected.
  const mobBar=['today','feed','studylab','dashboard'];
  document.querySelectorAll('[data-mnav]').forEach(b=>{
    b.classList.toggle('active', b.dataset.mnav==='more' ? !mobBar.includes(tab) : b.dataset.mnav===tab);
  });
  // Profile has no tab button any more — the avatar is its entry point.
  const av=document.getElementById('nav-avatar-btn');
  if(av) av.style.boxShadow = tab==='profile' ? '0 0 0 2px var(--ora)' : 'var(--shadow-btn)';
}
function switchTab(tab){
  // close more sheet if open
  const _moreSheet=document.getElementById('mob-more-sheet');
  if(_moreSheet&&_moreSheet.classList.contains('open'))_moreSheet.classList.remove('open');
  if(typeof _onbOnNavigate==='function') _onbOnNavigate(tab);
  const prevTab=currentTab;
  currentTab=tab;
  const tabOrder=['today','feed','dashboard','studylab','plan','explore','profile'];
  syncNavActive(tab);
  const page=document.getElementById('page-content');
  if(page){
    const prevIdx=tabOrder.indexOf(prevTab);
    const nextIdx=tabOrder.indexOf(tab);
    const dir=nextIdx>=prevIdx?'tab-right':'tab-left';
    page.classList.remove('fade-in','tab-right','tab-left');
    void page.offsetWidth;
    page.classList.add(dir);
  }
  // Persist the tab in the URL hash so reload restores it (no extra history entry).
  try{const _h=_hashFor(tab);if((location.hash||'')!==_h)history.replaceState(history.state,'',location.pathname+location.search+_h);}catch(e){}
  _animateNextRender=true;
  renderTab();
}

// ═══════════════════════════════════════════════
// ANIMATION UTILITIES
// ═══════════════════════════════════════════════
function animateCount(el, target, suffix='', decimals=0){
  if(!el) return;
  const dur=700, start=Date.now();
  const from=parseFloat(el.textContent)||0;
  const tick=()=>{
    const p=Math.min((Date.now()-start)/dur,1);
    const ease=1-Math.pow(1-p,3);
    const val=from+(target-from)*ease;
    el.textContent=decimals?val.toFixed(decimals):Math.round(val);
    if(suffix) el.textContent+=suffix;
    if(p<1) requestAnimationFrame(tick);
    else el.classList.add('stat-pop');
  };
  requestAnimationFrame(tick);
}

function burstConfetti(originEl){
  const rect=originEl?originEl.getBoundingClientRect():{top:window.innerHeight*0.45,left:window.innerWidth/2,width:0,height:0};
  const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  const colors=['#d44000','#6366f1','#10b981','#f59e0b','#a855f7','#3b82f6','#ec4899','#14b8a6'];
  for(let i=0;i<32;i++){
    const el=document.createElement('div');
    const angle=(Math.random()*360);
    const dist=80+Math.random()*120;
    const dx=Math.cos(angle*Math.PI/180)*dist, dy=Math.sin(angle*Math.PI/180)*dist-80;
    const size=5+Math.random()*6;
    const isCircle=Math.random()>.45;
    el.style.cssText=`position:fixed;left:${cx-size/2}px;top:${cy-size/2}px;width:${size}px;height:${size}px;`+
      `border-radius:${isCircle?'50%':'2px'};background:${colors[i%colors.length]};`+
      `pointer-events:none;z-index:9999;`+
      `--dx:${dx}px;--dy:${dy}px;--dr:${Math.random()>0.5?360:-360}deg;`+
      `animation:confetti-fly ${0.6+Math.random()*0.5}s cubic-bezier(.22,.61,.36,1) ${i*18}ms forwards`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1400+i*18);
  }
}

let _animateNextRender=false; // only true when user explicitly switches tabs
function renderTab(){
  const el=document.getElementById('page-content');
  if(!el)return;
  if(currentTab==='today')el.innerHTML=buildToday();
  else if(currentTab==='feed')el.innerHTML=buildFeed();
  else if(currentTab==='dashboard')el.innerHTML=buildDashboard();
  else if(currentTab==='plan')el.innerHTML=buildStudyPlanTab();
  else if(currentTab==='profile'){el.innerHTML=buildProfile();}
  else if(currentTab==='explore')el.innerHTML=buildExplore();
  else if(currentTab==='studylab')el.innerHTML=buildStudyLab();
  attachTabHandlers();
  if(currentTab==='today') _todayAfterRender();
  else if(currentTab==='explore'&&typeof watchRooms==='function') watchRooms();
  const shouldAnimate=_animateNextRender;
  _animateNextRender=false;
  // All entrance animations only fire on deliberate tab switches — never on data re-renders
  if(shouldAnimate){
    requestAnimationFrame(()=>{
      el.querySelectorAll('.card').forEach((c,i)=>{
        c.style.animationDelay=(i*48)+'ms';
        c.classList.add('card-enter');
      });
      el.querySelectorAll('.prog-fill').forEach(bar=>{
        const w=bar.style.width;
        bar.style.width='0%';
        requestAnimationFrame(()=>{ bar.style.width=w; });
      });
      el.querySelectorAll('[data-count]').forEach(n=>{
        animateCount(n, parseFloat(n.dataset.count)||0, n.dataset.suffix||'', n.dataset.decimals||0);
      });
      const ring=document.getElementById('readiness-ring');
      if(ring){
        const target=ring.getAttribute('stroke-dashoffset');
        const total=ring.getAttribute('stroke-dasharray');
        ring.setAttribute('stroke-dashoffset',total);
        requestAnimationFrame(()=>requestAnimationFrame(()=>ring.setAttribute('stroke-dashoffset',target)));
      }
    });
  }
  // Contextual onboarding: show this tab's guide once, if the tour is live for a new user.
  if(localStorage.getItem('pf2-onb-active')==='1'){
    setTimeout(()=>_maybeShowOnboard(currentTab), 350);
  }
}

function toggleTheme(){
  isDark=!isDark;
  localStorage.setItem('pf2-theme',isDark?'dark':'light');
  applyTheme();
  renderApp(); // full re-render updates nav icon + all theme-sensitive inline styles
}

