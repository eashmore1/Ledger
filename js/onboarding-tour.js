// ═══════════════════════════════════════════════
// CONTEXTUAL ONBOARDING — section-by-section, hosted by Ask Ledger.
// Fires the first time a new user opens each tab. Replayable from Settings.
// ═══════════════════════════════════════════════
const ONB_INTRO = {
  t: "Hi, I'm Ledger",
  b: "I'm your study guide. I'll walk you through each part of Ledger one section at a time, highlighting what to look at and where to click next. You can hit <strong>Skip tour</strong> anytime, and replay it later from <strong>Settings → Data → Restart Tutorial</strong>.",
  intro: true,
};

// The order the tour walks through the app. Matches the order of the nav tabs.
const ONB_ORDER = ['today','feed','dashboard','studylab','plan','explore','profile'];

// ── Tour targets ────────────────────────────────────────────────
// Each step can name the element it is about (`target`). The tour spotlights
// that element and anchors the card next to it. A target that isn't on screen
// (e.g. a card that only exists once you have data) falls back to a centered card.
function _onbVisible(el){
  if(!el||!el.isConnected) return false;
  const r=el.getBoundingClientRect();
  if(r.width<4||r.height<4) return false;
  const cs=getComputedStyle(el);
  return cs.visibility!=='hidden'&&cs.display!=='none'&&(el.offsetParent!==null||cs.position==='fixed');
}
function _onbFirst(...sels){
  for(const s of sels){
    const list=typeof s==='function'?[s()]:[...document.querySelectorAll(s)];
    const el=list.find(_onbVisible);
    if(el) return el;
  }
  return null;
}
// A card on the current page whose heading starts with `text`.
function _onbCard(text){
  const root=document.getElementById('page-content')||document;
  const want=text.toLowerCase();
  return [...root.querySelectorAll('.card,.sb-card')].find(c=>_onbVisible(c)&&(c.innerText||'').trim().toLowerCase().startsWith(want))||null;
}
const _onbIsMobile=()=>_onbVisible(document.getElementById('mobile-nav'));

// Where to click to open each tab. Desktop uses the top bar (Profile is the
// avatar); mobile uses the bottom bar, with Study Plan and Explore inside "More".
const ONB_NAV = {
  today:     {label:'Today',      sels:[".nav-tab[onclick=\"switchTab('today')\"]", "[data-mnav='today']"]},
  feed:      {label:'Feed',       sels:[".nav-tab[onclick=\"switchTab('feed')\"]", "[data-mnav='feed']"]},
  dashboard: {label:'Dashboard', mobileLabel:'Dash', sels:[".nav-tab[onclick=\"switchTab('dashboard')\"]", "[data-mnav='dashboard']"]},
  studylab:  {label:'Study Lab', mobileLabel:'Lab', sels:[".nav-tab[onclick=\"switchTab('studylab')\"]", "[data-mnav='studylab']"]},
  plan:      {label:'Study Plan', sels:[".nav-tab[onclick=\"switchTab('plan')\"]", ".mob-more-sheet.open .mob-more-row[onclick*=\"switchTab('plan')\"]", "[data-mnav='more']"], inMore:true},
  explore:   {label:'Explore',    sels:[".nav-tab[onclick=\"switchTab('explore')\"]", ".mob-more-sheet.open .mob-more-row[onclick*=\"switchTab('explore')\"]", "[data-mnav='more']"], inMore:true},
  profile:   {label:'Profile', sels:['#nav-avatar-btn', ".mob-more-sheet.open .mob-more-row[onclick*=\"switchTab('profile')\"]", "[data-mnav='more']"], inMore:true, desktopHint:'your avatar in the top bar'},
};
function _onbNavTarget(tab){ const n=ONB_NAV[tab]; return n?_onbFirst(...n.sels):null; }
function _onbNavHint(tab){
  const n=ONB_NAV[tab]; if(!n) return '';
  if(_onbIsMobile()){
    if(n.inMore){
      const open=document.querySelector('.mob-more-sheet.open');
      return open ? 'Tap <strong>'+n.label+'</strong> to continue.' : 'Tap <strong>More</strong> at the bottom, then <strong>'+n.label+'</strong>.';
    }
    return 'Tap <strong>'+(n.mobileLabel||n.label)+'</strong> in the bar at the bottom of the screen.';
  }
  return 'Click '+(n.desktopHint?'<strong>'+n.desktopHint+'</strong>':'<strong>'+n.label+'</strong> in the top bar')+' to continue.';
}

const ONBOARD_GUIDE = {
  today: { label:'Today', steps:[
    { t:'Start here every day', b:"This is your home base. It shows how much to study today, which section to work on, and whether your streak is safe. One tap on <strong>Start Session</strong> starts the timer.",
      target:'#today-hero' },
    { t:'Your crew today', b:"See who has already studied today and who is studying right now. Showing up is easier when someone notices — follow a few people and this fills in.",
      target:'#today-crew' },
    { t:'Study rooms', b:"Open a room or join one to study alongside other candidates, with a shared focus timer that keeps everyone on the same clock.",
      target:'#rooms-card' },
    { t:'Your exam journey', b:"Each section moves from studying to scheduled, sat, and passed. Tell Ledger when you sit an exam and it counts down to your score — and helps you regroup if a retake is needed.",
      target:'#exam-journey' },
  ]},
  feed: { label:'Feed', steps:[
    { t:'Your Feed', b:"Every study session you and the people you follow log shows up here, newest first — so you can see who's putting in the work and stay motivated to keep pace.",
      target:()=>_onbFirst('.activity-card',()=>[...document.querySelectorAll('#page-content button[onclick="openSessionModal()"]')].find(b=>/first session/i.test(b.innerText))?.closest('.card')) },
    { t:'Give props and comment', b:"Tap the heart to give props on a session, or leave a comment to encourage someone. The accountability is the point.",
      target:()=>_onbFirst('[onclick*="giveProps"]',()=>document.querySelector('[onclick*="openComments"]'),'.activity-card') },
    { t:'Build your study crew', b:"This card helps you follow other candidates and join study clubs. The more people you connect with, the more useful your feed becomes.",
      target:()=>_onbFirst('#crew-onboard-card',()=>_onbCard('your cohort')) },
  ]},
  dashboard: { label:'Dashboard', steps:[
    { t:'Your command center', b:"The Dashboard tracks your progress at a glance: total hours logged, current day streak, sections passed, and how you're pacing this week.",
      target:()=>_onbCard('this week') },
    { t:'Readiness Score', b:"This score out of 100 estimates how prepared you are for your current section. It blends your practice-exam scores, study volume, pacing against your exam date, and consistency — practice scores carry the most weight.",
      target:()=>_onbFirst(()=>document.getElementById('readiness-ring')?.closest('.card')) },
    { t:'Practice Exam Scores', b:"Log your Becker, Gleim, Wiley, or UWorld mock-exam scores in the <strong>Scores</strong> tab. Scoring 75 or higher again and again on practice exams is the strongest sign that you're ready for the real thing.",
      target:'[data-subtab="dashboard:scores"]' },
    { t:'Exams and calendar', b:"<strong>Exams</strong> has each section's pacing, your exam dates, and the Exam Day checklist. <strong>Calendar</strong> shows every day you've logged.",
      target:'.subtabs[data-page="dashboard"]' },
  ]},
  plan: { label:'Study Plan', steps:[
    { t:'Your Study Plan', b:"Tell Ledger your exam date and how many hours you can study each week, and it builds a day-by-day plan that keeps you on pace to finish each section in time." },
    { t:'It adapts as you go', b:"As you log sessions, your plan adjusts automatically. If you fall behind, Ledger shows you exactly how many hours per day you need to catch back up before exam day." },
  ]},
  studylab: { label:'Study Lab', steps:[
    { t:'The Study Lab', b:"This is your practice hub, with three areas: a Question Bank of practice multiple-choice questions, AI Study Tools, and a chat with me." },
    { t:'Question Bank', b:"Work through practice multiple-choice questions with a full explanation for every answer choice. These are original practice questions written to mirror exam style — not actual AICPA exam content.",
      target:'[data-subtab="studylab:qbank"]' },
    { t:'AI Study Tools', b:"Generate custom flashcards and quizzes on any CPA topic in seconds. It's the fastest way to drill a weak spot without hunting for materials.",
      target:'[data-subtab="studylab:tools"]' },
    { t:'Chat with me', b:"Ask me anything about accounting, tax, audit, or exam strategy and I'll answer with your own study data in mind. Pro members get 100 answers a month, and you can copy any answer straight into your notes.",
      target:'[data-subtab="studylab:coach"]' },
  ]},
  explore: { label:'Explore', steps:[
    { t:'Explore and connect', b:"Find other CPA candidates studying the same sections as you and follow them. Building a network of people on the same journey keeps you accountable.",
      target:()=>_onbFirst(()=>_onbCard('find cpa candidates'),'[data-subtab="explore:people"]') },
    { t:'Study Circle', b:"See who in your network studied this week. A little momentum from the people around you goes a long way.",
      target:()=>_onbFirst(()=>_onbCard('study circle'),'[data-subtab="explore:people"]') },
    { t:'Rooms, clubs and goals', b:"<strong>Rooms</strong> let you study alongside other candidates on a shared focus timer. <strong>Clubs</strong> give you a group chat for the long haul. <strong>Goals</strong> has milestones to aim for.",
      target:'.subtabs[data-page="explore"]' },
  ]},
  profile: { label:'Profile', steps:[
    { t:'Your Profile', b:"This is what other candidates see: your sections, total hours, day streak, and recent sessions. Tap <strong>Edit Profile</strong> to add a photo, a short bio, and your school.",
      target:()=>_onbFirst('#page-content button[onclick="openEditProfile()"]') },
    { t:'Your activity heatmap', b:"The calendar shows the days you studied. Keeping it filled in is the simplest habit to build — aim for at least one logged session a day.",
      target:'#heatmap-own' },
    { t:'You control your privacy', b:"Everything here is yours to share or hide. Open <strong>Settings → Privacy</strong> to make your account private or hide specific stats like your hours or streak.",
      target:()=>_onbFirst('.nav-right button[onclick="openAppSettings()"]') },
  ]},
};

// _onbState: {tab, steps, idx}            explaining a section
//            {goto:<tab>}                  waiting for the user to open the next tab
//            {finale:true}                 last card
let _onbState = null;

function _onbSeen(){ try{ return JSON.parse(localStorage.getItem('pf2-onb-seen')||'{}'); }catch(e){ return {}; } }
function _onbSaveSeen(m){ try{ localStorage.setItem('pf2-onb-seen', JSON.stringify(m)); }catch(e){} }

// Called at app start: turns the guide on for brand-new users only.
function _maybeAutoStartOnboarding(){
  if(localStorage.getItem('pf2-onb-done') || localStorage.getItem('pf2-tour-done')) return;
  localStorage.setItem('pf2-onb-active','1');
  setTimeout(()=>_maybeShowOnboard(currentTab||'today'), 500);
}

// Called after every tab render; shows that tab's guide once, if onboarding is live.
function _maybeShowOnboard(tab){
  if(localStorage.getItem('pf2-onb-active')!=='1') return;
  // Arriving on any tab ends the "click here next" pointer.
  if(_onbState&&_onbState.goto){ _cleanOnb(); _onbState=null; }
  if(document.getElementById('onb-card')) return;      // one card at a time
  // First run shows the plan chooser first; the tour waits until it is closed
  // instead of opening on top of it (two stacked modals on a brand-new account).
  if(window._firstRunOfferPending || document.getElementById('post-ob-offer')) return;
  if(_onbSeen()[tab]){ _onbPointToNext(); return; }      // this section is done — show where to go next
  const guide=ONBOARD_GUIDE[tab];
  if(!guide||!guide.steps||!guide.steps.length) return;
  let steps=guide.steps;
  if(!localStorage.getItem('pf2-onb-intro')){
    steps=[ONB_INTRO].concat(steps);                   // coach introduces himself on the very first section
    localStorage.setItem('pf2-onb-intro','1');
  }
  _onbState={tab, steps, idx:0};
  _renderOnbCard();
}

// Called by switchTab() the moment the user navigates, so the spotlight never
// lingers over the new page while it renders.
function _onbOnNavigate(){
  if(_onbState&&_onbState.goto){ _cleanOnb(); _onbState=null; }
}

function _onbNextTab(){
  const seen=_onbSeen();
  return ONB_ORDER.find(t=>!seen[t])||null;
}

// Between sections: spotlight the tab to open next.
function _onbPointToNext(){
  const next=_onbNextTab();
  if(!next){ _onbState={finale:true}; _renderOnbCard(); return; }
  if(next===currentTab){ _maybeShowOnboard(next); return; }
  _onbState={goto:next};
  _renderOnbCard();
}

function _onbCurrentStep(){
  const st=_onbState; if(!st) return null;
  if(st.goto){
    const n=ONB_NAV[st.goto];
    const done=Object.keys(_onbSeen()).filter(k=>ONB_ORDER.includes(k)).length;
    return {
      kind:'goto', sub:'Next up · '+done+' of '+ONB_ORDER.length+' done',
      t:'Open '+n.label, b:()=>_onbNavHint(st.goto),
      target:()=>_onbNavTarget(st.goto), click:true,
    };
  }
  if(st.finale){
    return {
      kind:'finale', sub:'Tour complete',
      t:"You're all set", b:"That's everything. The best next step is to log your first study session — every hour you log feeds your streak, your pacing and your readiness score.",
      target:()=>_onbFirst('#nav-log-btn','#session-fab'),
    };
  }
  const {tab,steps,idx}=st;
  const step=steps[idx];
  const guide=ONBOARD_GUIDE[tab];
  const hasIntro=steps[0]&&steps[0].intro;
  const denom=hasIntro?steps.length-1:steps.length;
  const pos=hasIntro?idx:idx+1;
  return {kind:'step', sub:step.intro?'Welcome':(guide.label+' · '+pos+' of '+denom), t:step.t, b:step.b, target:step.target, idx, total:steps.length, last:idx===steps.length-1};
}

function _onbResolveTarget(target){
  if(!target) return null;
  if(typeof target==='function'){ try{ const el=target(); return _onbVisible(el)?el:null; }catch(e){ return null; } }
  return _onbFirst(target);
}

function _renderOnbCard(){
  _cleanOnb();
  if(!_onbState) return;
  const step=_onbCurrentStep();
  if(!step) return;

  let dots='', nav='';
  if(step.kind==='step'){
    dots='<div class="onb-dots">'+Array.from({length:step.total},(_,i)=>'<span class="onb-dot'+(i===step.idx?' on':'')+'"></span>').join('')+'</div>';
    const nextTab=step.last?ONB_ORDER.find(t=>t!==_onbState.tab&&!_onbSeen()[t]):null;
    nav=(step.idx>0?'<button class="onb-back" onclick="onbBack()">Back</button>':'')+
        '<button class="onb-next" onclick="onbNext()">'+(step.last?(nextTab?'Next: '+ONB_NAV[nextTab].label+' →':'Finish'):'Next →')+'</button>';
  } else if(step.kind==='finale'){
    nav='<button class="onb-next" onclick="onbSkipAll()">Finish</button>';
  }

  const card=document.createElement('div');
  card.id='onb-card'; card.className='onb-card';
  card.setAttribute('role','dialog'); card.setAttribute('aria-live','polite');
  card.setAttribute('aria-label','Ledger tour: '+step.t);
  card.innerHTML=
    '<div class="onb-arrow" aria-hidden="true"></div>'+
    '<div class="onb-head">'+
      '<div class="onb-avatar">'+_ledgerMascotSVG(34)+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div class="onb-name">Ledger</div>'+
        '<div class="onb-sub">'+step.sub+'</div>'+
      '</div>'+
      '<button class="onb-x" onclick="onbSkipAll()" title="Skip tutorial" aria-label="Skip tutorial">✕</button>'+
    '</div>'+
    '<div class="onb-title">'+step.t+'</div>'+
    '<div class="onb-body" id="onb-body">'+(typeof step.b==='function'?step.b():step.b)+'</div>'+
    dots+
    '<div class="onb-foot">'+
      '<button class="onb-skip" onclick="onbSkipAll()">Skip tour</button>'+
      '<div class="onb-nav">'+nav+'</div>'+
    '</div>';
  document.body.appendChild(card);

  // Spotlight + click shield. The shield is four panels AROUND the spotlight
  // hole, so outside clicks are swallowed; in "click here" steps the hole itself
  // stays open so the highlighted control is the one thing you can press.
  const spot=document.createElement('div'); spot.id='onb-spot'; spot.className='onb-spot'+(step.click?' onb-spot-click':'');
  document.body.appendChild(spot);
  const shield=document.createElement('div'); shield.id='onb-shield';
  shield.innerHTML='<div></div><div></div><div></div><div></div>'+(step.click?'':'<div class="onb-hole"></div>');
  document.body.appendChild(shield);
  const bg=document.createElement('div'); bg.id='onb-bg'; bg.className='onb-bg';
  document.body.appendChild(bg);

  // Bring the target on screen. The top bar scrolls away with the page, so a
  // "click here" target in it needs this too.
  const first=_onbResolveTarget(step.target);
  if(first){
    const r=first.getBoundingClientRect();
    if(step.click){
      if(r.top<0||r.bottom>innerHeight) first.scrollIntoView({block:'nearest'});
    } else {
      // Leave room for the card underneath: put the target near the top of the
      // screen when target + card fit together, otherwise just center it.
      const ch=card.offsetHeight+28, top=80;
      const fitsBelow=r.top>=top-8&&r.bottom+ch<=innerHeight;
      if(!fitsBelow){
        if(r.height+ch<=innerHeight-top) window.scrollBy({top:r.top-top,behavior:'smooth'});
        else if(r.top<top||r.bottom>innerHeight-24) first.scrollIntoView({block:'center',behavior:'smooth'});
      }
    }
  }
  _onbStartTracking(step);
  setTimeout(()=>{ const b=card.querySelector('.onb-next'); if(b&&!step.click) b.focus({preventScroll:true}); },60);
}

// Keep the spotlight and card glued to the target while the page scrolls,
// resizes, animates, or (on mobile) the "More" sheet slides open.
let _onbRaf=0;
function _onbStartTracking(step){
  cancelAnimationFrame(_onbRaf);
  let lastHint='', lastScrollFix=0;
  const started=performance.now();
  const tick=()=>{
    const card=document.getElementById('onb-card'), spot=document.getElementById('onb-spot'), shield=document.getElementById('onb-shield'), bg=document.getElementById('onb-bg');
    if(!card||!spot||!shield) return;
    const el=_onbResolveTarget(step.target);
    // A target that has ended up off screen (the user scrolled with the wheel,
    // or the page re-rendered) is scrolled back into view.
    if(el){
      const rr=el.getBoundingClientRect();
      const off=rr.bottom<8||rr.top>innerHeight-8;
      const now=performance.now();
      if(off&&now-started>700&&now-lastScrollFix>700){ lastScrollFix=now; el.scrollIntoView({block:'nearest'}); }
    }
    const panes=shield.children;
    if(!el){
      // Nothing to point at: classic centered card over a dimmed page.
      spot.style.display='none';
      bg.style.display='block';
      for(const p of panes){ p.style.cssText='position:fixed;inset:0;z-index:11000'; }
      card.classList.remove('onb-anchored');
      card.style.left=card.style.top='';
    } else {
      bg.style.display='none';
      const pad=step.click?6:8;
      const r=el.getBoundingClientRect();
      const x=Math.max(0,r.left-pad), y=Math.max(0,r.top-pad);
      const w=Math.max(0,Math.min(innerWidth,r.right+pad)-x), h=Math.max(0,Math.min(innerHeight,r.bottom+pad)-y);
      spot.style.display='block';
      spot.style.left=x+'px'; spot.style.top=y+'px'; spot.style.width=w+'px'; spot.style.height=h+'px';
      const radius=parseFloat(getComputedStyle(el).borderRadius)||8;
      spot.style.borderRadius=Math.min(radius+pad,24)+'px';
      const P='position:fixed;z-index:11000;';
      panes[0].style.cssText=P+'left:0;top:0;width:100%;height:'+y+'px';
      panes[1].style.cssText=P+'left:0;top:'+(y+h)+'px;width:100%;bottom:0';
      panes[2].style.cssText=P+'left:0;top:'+y+'px;width:'+x+'px;height:'+h+'px';
      panes[3].style.cssText=P+'left:'+(x+w)+'px;top:'+y+'px;right:0;height:'+h+'px';
      if(panes[4]) panes[4].style.cssText=P+'left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px';
      // Card: below the target if it fits, else above, else beside the screen edge.
      card.classList.add('onb-anchored');
      const cw=card.offsetWidth, ch=card.offsetHeight, gap=16, m=12;
      let top, left, arrowUp;
      const cx=x+w/2;
      left=Math.max(m,Math.min(innerWidth-cw-m,cx-cw/2));
      if(y+h+gap+ch<=innerHeight-m){ top=y+h+gap; arrowUp=true; }
      else if(y-gap-ch>=m){ top=y-gap-ch; arrowUp=false; }
      else if(innerWidth-(x+w)>=cw+gap+m){ left=x+w+gap; top=Math.max(m,Math.min(innerHeight-ch-m,y)); arrowUp=null; }
      else if(x>=cw+gap+m){ left=x-gap-cw; top=Math.max(m,Math.min(innerHeight-ch-m,y)); arrowUp=null; }
      else { top=innerHeight-ch-m; arrowUp=null; } // tall target: dock at the bottom edge
      card.style.left=left+'px'; card.style.top=top+'px';
      const arrow=card.querySelector('.onb-arrow');
      if(arrow){
        if(arrowUp===null){ arrow.style.display='none'; }
        else{
          arrow.style.display='block';
          arrow.className='onb-arrow '+(arrowUp?'up':'down');
          arrow.style.left=Math.max(18,Math.min(cw-30,cx-left-6))+'px';
        }
      }
    }
    // The "go to tab" hint changes when the mobile More sheet opens.
    if(step.kind==='goto'){
      const hint=typeof step.b==='function'?step.b():step.b;
      if(hint!==lastHint){ const bd=document.getElementById('onb-body'); if(bd) bd.innerHTML=hint; lastHint=hint; }
    }
    _onbRaf=requestAnimationFrame(tick);
  };
  _onbRaf=requestAnimationFrame(tick);
}

function onbNext(){
  if(!_onbState||!_onbState.steps) return;
  if(_onbState.idx < _onbState.steps.length-1){ _onbState.idx++; _renderOnbCard(); }
  else { _onbFinishSection(); }
}
function onbBack(){
  if(_onbState && _onbState.steps && _onbState.idx>0){ _onbState.idx--; _renderOnbCard(); }
}
function _onbFinishSection(){
  const seen=_onbSeen();
  if(_onbState&&_onbState.tab) seen[_onbState.tab]=1;
  _onbSaveSeen(seen);
  _cleanOnb(); _onbState=null;
  _onbPointToNext(); // spotlight the next tab, or show the closing card
}
function onbSkipAll(){
  _cleanOnb(); _onbState=null; _onbComplete();
}
function _onbComplete(){
  localStorage.removeItem('pf2-onb-active');
  localStorage.setItem('pf2-onb-done','1');
  localStorage.setItem('pf2-tour-done','1'); // also satisfies the legacy flag
}
function restartOnboarding(){
  localStorage.setItem('pf2-onb-active','1');
  localStorage.removeItem('pf2-onb-done');
  localStorage.removeItem('pf2-onb-intro');
  _onbSaveSeen({});
  _cleanOnb(); _onbState=null;
  if(typeof closeAppSettings==='function') closeAppSettings();
  currentTab='today';
  renderApp();
  setTimeout(()=>_maybeShowOnboard('today'), 500);
}
function _cleanOnb(){
  cancelAnimationFrame(_onbRaf);
  ['onb-bg','onb-card','onb-spot','onb-shield'].forEach(id=>document.getElementById(id)?.remove());
}

