// ═══════════════════════════════════════════════
// SUBSCRIPTION SYSTEM
// ═══════════════════════════════════════════════
const SUB_KEY='pf2:sub';
function loadSub(){try{const r=localStorage.getItem(SUB_KEY);return r?JSON.parse(r):null;}catch{return null;}}
function saveSub(sub){localStorage.setItem(SUB_KEY,JSON.stringify(sub));}

// tier: 'free' | 'trial' | 'pro' | 'elite' | 'cram'
// billingCycle: 'monthly' | 'annual'
let SUB = loadSub() || {tier:'free',billingCycle:'monthly',startDate:null,trialUsed:false,studentVerified:false};

function isPro(){return SUB.tier==='pro'||SUB.tier==='elite'||SUB.tier==='cram'||isOnTrial();}
// ONE PAID TIER (2026-11-02): Pro includes everything that used to be Elite.
// Kept as its own helper so the ~20 Elite-gated call sites keep working, and so
// legacy 'elite' subscribers and Exam Window Pass ('cram') holders keep access.
// Side effect, intended: the 7-day trial now unlocks the full tier.
function isElite(){return isPro();}
function isOnTrial(){return SUB.tier==='trial'&&SUB.trialEnd&&Date.now()<SUB.trialEnd;}
function getTrialDaysLeft(){if(!isOnTrial())return 0;return Math.ceil((SUB.trialEnd-Date.now())/86400000);}
function subTierLabel(){
  if(SUB.tier==='cram')return'Exam Window Pass';
  if(isOnTrial())return'Pro Trial';
  if(SUB.tier==='pro'||SUB.tier==='elite')return'Pro';
  return'Free';
}
function subTierClass(){
  if(SUB.tier==='cram')return'badge-cram';
  if(isOnTrial())return'badge-trial';
  if(SUB.tier==='pro'||SUB.tier==='elite')return'badge-pro';
  return'';
}
// Nav chip class
function navProClass(){
  if(SUB.tier==='cram')return'nav-pro-chip-elite';
  if(isOnTrial())return'nav-pro-chip-trial';
  if(SUB.tier==='pro'||SUB.tier==='elite')return'nav-pro-chip-pro';
  return'nav-pro-chip-free';
}
function navProLabel(){
  if(SUB.tier==='cram')return'Window Pass';
  if(isOnTrial()){const d=getTrialDaysLeft();return'Trial · '+d+'d left';}
  if(SUB.tier==='pro'||SUB.tier==='elite')return'Pro';
  return'Upgrade';
}

// PRO FEATURES MAP — what requires pro (or elite)
const PRO_FEATURES={
  // Pro tier
  examSimulator:    {label:'Question Bank',icon:'pencil',desc:'Unlimited MCQs per section with explanations, timed sets, and random quizzes.'},
  unlimitedClubs:   {label:'Unlimited Study Clubs',icon:'columns',desc:'Create unlimited private clubs. Free tier is limited to 1 club.'},
  priorityBadges:   {label:'Member Badge',icon:'medal',desc:'Pro member badge visible on your public profile and in your study circle.'},
  streakShield:     {label:'Streak Shield',icon:'shield',desc:'Miss a day? Use a Streak Shield to protect your streak — 3 shields per month.'},
  exportData:       {label:'Export Your Data',icon:'upload',desc:'Download all your sessions, scores, and progress as a JSON file at any time.'},
  customGoals:      {label:'Custom Weekly Goals',icon:'target',desc:'Set custom per-section weekly hour goals with smart reminders.'},
  // Formerly the Elite tier — all included in Pro as of 2026-11-02
  aiStudyCoach:     {label:'Ledger AI coach',icon:'chat',desc:'AI coach that adapts to your pace, flags weak spots, and builds your daily study focus. 100 answers per month.'},
  advancedAnalytics:{label:'Advanced Analytics',icon:'barChart',desc:'Deep-dive heatmaps, topic-level breakdowns, time-of-day analysis, and year-view activity.'},
  studySchedule:    {label:'AI Study Plan',icon:'calendar',desc:'Day-by-day personalized calendar built around your exam date, study hours, and style.'},
  partnerSync:      {label:'Study Partner Pairing',icon:'handshake',desc:'Link with a study partner and see each other\'s weekly hours side-by-side.'},
};

let _upgradeBilling='annual';

function openUpgradeModal(featureHint){
  let el=document.getElementById('upgrade-modal');
  if(!el){
    el=document.createElement('div');
    el.id='upgrade-modal';
    el.className='modal-overlay';
    el.addEventListener('click',e=>{if(e.target===el)closeUpgradeModal();});
    document.body.appendChild(el);
  }
  el._fresh=true;
  renderUpgradeModal(featureHint||null);
  el.classList.add('open');
  _syncModalLock();
  // Which locked feature drove someone to the paywall — the input you need to
  // decide what belongs in the paid tier.
  logLedgerEvent('upgrade_modal_viewed',{hint:featureHint||'none',tier:(typeof SUB!=='undefined'&&SUB.tier)||'free'});
}
function closeUpgradeModal(){
  const el=document.getElementById('upgrade-modal');
  if(el)el.classList.remove('open');
  _syncModalLock();
}

// The full Terms and Privacy Policy live on their own pages so there is only
// one version of each.
function openLegalModal(type){ window.open(type==='privacy'?'/privacy':'/terms','_blank','noopener'); }
function closeLegalModal(){
  const el=document.getElementById('legal-modal');
  if(el)el.classList.remove('open');
}

function renderUpgradeModal(featureHint){
  const el=document.getElementById('upgrade-modal');if(!el)return;
  // Switching Monthly/Annual redraws the plans: keep the scroll spot and skip the
  // open animation so the screen doesn't flash and jump back to the top.
  const _redraw=!el._fresh&&el.classList.contains('open');
  const _oldBox=el.querySelector('.upgrade-modal-box');
  const _keepScroll=_redraw&&_oldBox?_oldBox.scrollTop:0;
  const _keepHint=_redraw?el._hint:featureHint;
  el._fresh=false;
  if(_redraw&&featureHint==null)featureHint=_keepHint;
  el._hint=featureHint;
  const isAnnual=_upgradeBilling==='annual';
  // ONE PAID TIER: Pro — $14/mo, $132/yr ($11/mo). Window Pass = $75 one-time.
  const proMonthly=14,proAnnual=11;
  const cramPrice=75;
  const proDisplay=isAnnual?proAnnual:proMonthly;
  const _hintIsElite=false; // one paid tier — no separate Elite styling any more
  const hintHTML=featureHint?('<div style="background:'+(_hintIsElite?'var(--pur-bg)':'var(--ora-bg)')+';border:1px solid '+(_hintIsElite?'rgba(147,51,234,.25)':'var(--ora-bdr)')+';border-radius:10px;padding:10px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:600;color:'+(_hintIsElite?'var(--pur)':'var(--ora)')+'"><span style="font-size:18px">'+(_hintIsElite?'✦':ico('lock'))+'</span><span>Unlock <strong>'+featureHint+'</strong> — '+'included with Pro'+'</span></div>'):'';

  // Feature rows per plan
  const free=[
    {on:true,text:'Feed + Activity Log'},
    {on:true,text:'Study Timer (unlimited sessions)'},
    {on:true,text:'Dashboard + Exam Pacing'},
    {on:true,text:'1 Study Club'},
    {on:true,text:'Study Circle (community view)'},
    {on:true,text:'Basic Achievements'},
    {on:false,text:'Full Question Bank'},
    {on:false,text:'Streak Shield'},
    {on:false,text:'Exam Day Protocol'},
    {on:false,text:'AI Study Plan'},
    {on:false,text:'Ledger AI coach'},
  ];
  const pro=[
    {on:true,text:'Everything in Free'},
    {on:true,text:'Unlimited AI Question Bank — every section, no daily cap'},
    {on:true,text:'Ledger, your AI coach — 100 answers/month'},
    {on:true,text:'AI Study Plan — day-by-day calendar'},
    {on:true,text:'Advanced Analytics + Year-View Heatmap'},
    {on:true,text:'Custom Topic Generator — drill any topic on demand'},
    {on:true,text:'Exam Day Protocol'},
    {on:true,text:'Score Tracker + Custom Per-Section Goals'},
    {on:true,text:'Study Partner Pairing'},
    {on:true,text:'Unlimited Study Clubs + Challenges'},
    {on:true,text:'Unlimited Streak Shields'},
    {on:true,text:'Weekly Progress Insights'},
    {on:true,text:'Export your data any time (JSON)'},
    {on:true,text:'Priority Support'},
  ];

  const fRow=f=>'<div class="plan-feat"><span class="'+(f.on?'plan-feat-on':'plan-feat-off')+'">'+(f.on?'✓':'×')+'</span><span style="'+(f.on?'':'color:var(--mut);text-decoration:line-through')+'">'+f.text+'</span></div>';

  const isFree=SUB.tier==='free'&&!isOnTrial();
  const isProActive=SUB.tier==='pro'||SUB.tier==='elite'||isOnTrial();
  const isCramActive=SUB.tier==='cram';

  const freeCTA=isFree?'<button class="plan-cta plan-cta-active" disabled>✓ Current Plan</button>':'<button class="plan-cta plan-cta-ghost" onclick="closeUpgradeModal()">Stay Free</button>';
  const proCTA=isProActive?'<button class="plan-cta plan-cta-active" disabled>✓ Active'+(isOnTrial()?' (Trial)':'')+'</button>':'<button class="plan-cta plan-cta-pro" onclick="activatePlan(\'pro\')">Start 7-Day Free Trial</button>'+
    '<div style="font-size:10px;color:var(--sub);line-height:1.5;margin-top:8px;text-align:center">Then '+(isAnnual?'$132/year':'$'+proMonthly+'/month')+', renews automatically until you cancel. Cancel anytime in Settings.</div>';

  const cramCTA=isCramActive?'<div class="plan-feat-on" style="text-align:center;font-size:16px;margin-top:10px">✓ Active</div>':'<button class="cram-cta" onclick="activatePlan(\'cram\')">Get the Window Pass — $'+cramPrice+'</button>';

  el.innerHTML=
  '<div class="upgrade-modal-box">'+
  // Hero
  '<div class="upgrade-hero">'+
  '<div class="upgrade-hero-inner">'+
  '<div style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:8px">Ledger Premium</div>'+
  '<div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-.5px;line-height:1.1">Pass faster.<br>Study smarter.</div>'+
  '<div style="font-size:14px;color:rgba(255,255,255,.6);margin-top:10px;max-width:420px;margin-left:auto;margin-right:auto">CPA candidates use Ledger Pro to stay on track, build streaks, and hit their study goals.</div>'+
  '<div style="display:flex;gap:20px;justify-content:center;margin-top:18px;flex-wrap:wrap">' +
    '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#fff">'+ico('barChart')+'</div><div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em">Section tracking</div></div>' +
    '<div style="width:1px;background:rgba(255,255,255,.12)"></div>' +
    '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#fff">'+ico('flame')+'</div><div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em">Daily streaks</div></div>' +
    '<div style="width:1px;background:rgba(255,255,255,.12)"></div>' +
    '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#fff;line-height:1">'+LedgerBuddy.face(26,{still:true})+'</div><div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em">AI study coach</div></div>' +
    '<div style="width:1px;background:rgba(255,255,255,.12)"></div>' +
    '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#fff">'+ico('users')+'</div><div style="font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.07em">Study clubs</div></div>' +
  '</div>'+
  '<div class="billing-toggle">'+
  '<button class="billing-opt'+(isAnnual?'':' active')+'" onclick="_upgradeBilling=\'monthly\';renderUpgradeModal(null)">Monthly</button>'+
  '<button class="billing-opt'+(isAnnual?' active':'')+'" onclick="_upgradeBilling=\'annual\';renderUpgradeModal(null)">Annual<span class="savings-pill">Save 21%</span></button>'+
  '</div>'+
  '</div>'+
  '<button onclick="closeUpgradeModal()" style="position:absolute;top:16px;right:20px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:50%;width:32px;height:32px;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">×</button>'+
  '</div>'+
  // Hint
  (featureHint?'<div style="padding:20px 32px 0">'+hintHTML+'</div>':'')+
  // Plan cards
  '<div class="plan-cards-row">'+
  // Free
  '<div class="plan-card">'+
  '<div class="plan-name">Free</div>'+
  '<div class="plan-price"><sup>$</sup>0</div>'+
  '<div class="plan-period">Forever free</div>'+
  '<div class="plan-sep"></div>'+
  free.map(fRow).join('')+
  freeCTA+
  '</div>'+
  // Pro — popular
  '<div class="plan-card popular">'+
  '<div class="plan-popular-badge">MOST POPULAR</div>'+
  '<div class="plan-name" style="color:var(--ora)">Pro</div>'+
  '<div class="plan-price" style="color:var(--ora)"><sup>$</sup>'+proDisplay+'</div>'+
  '<div class="plan-period">per month'+(isAnnual?' · billed $132/yr':'')+'</div>'+
  (isAnnual?'<div style="font-size:10px;color:var(--mut);text-decoration:line-through;margin-top:2px">$'+proMonthly+'/mo without annual</div>':'')+
  '<div style="font-size:10px;color:var(--grn);font-weight:700;margin-top:3px">7 days free — card required, cancel anytime</div>'+
  '<div class="plan-sep"></div>'+
  pro.map(fRow).join('')+
  proCTA+
  '</div>'+
  '</div>'+
  // Cram plan
  '<div class="cram-section">'+
  '<div class="cram-inner">'+
  '<div style="font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:6px">ONE-TIME PURCHASE</div>'+
  '<div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:4px">6-Month Exam Window Pass <span style="font-size:14px;font-weight:700;color:rgba(255,255,255,.6)">— $'+cramPrice+' one-time</span></div>'+
  '<div style="font-size:13px;color:rgba(255,255,255,.65);line-height:1.6;max-width:480px">Six months of everything in Pro, paid once. Best pick if your exam date is already scheduled — no subscription, no auto-renew, nothing to cancel.</div>'+
  '<div class="cram-feat-row">'+
  '<span class="cram-feat-chip">✓ Everything in Pro</span>'+
  '<span class="cram-feat-chip">✓ 6-Month Access</span>'+
  '<span class="cram-feat-chip">✓ Exam Protocol PDF</span>'+
  '<span class="cram-feat-chip">✓ Unlimited Question Bank</span>'+
  '<span class="cram-feat-chip">✓ No Subscription</span>'+
  '</div>'+
  '</div>'+
  '<div style="position:relative;z-index:1;flex-shrink:0">'+
  '<div style="text-align:center;margin-bottom:10px">'+
  '<div style="font-size:28px;font-weight:900;color:#fff">$'+cramPrice+'</div>'+
  '<div style="font-size:11px;color:rgba(255,255,255,.5)">one-time · 6 months</div>'+
  '<div style="font-size:10px;color:rgba(16,185,129,.8);margin-top:2px">vs $84 for 6 months of Pro monthly</div>'+
  '</div>'+
  cramCTA+
  '</div>'+
  '</div>'+
  // Firm cohorts
  '<div class="student-section" style="cursor:default">'+
  '<span style="font-size:26px">'+ico('building')+'</span>'+
  '<div style="flex:1">'+
  '<div style="font-size:13px;font-weight:800;color:var(--txt)">Studying with your firm\'s start class?</div>'+
  '<div style="font-size:11px;color:var(--mut);margin-top:2px">Firm cohort plans are billed to the firm, per candidate, for one exam window. Email <strong>support@ledgercpa.app</strong> and we\'ll set it up.</div>'+
  '</div>'+
  '</div>'+
  // Testimonials
  '<div style="margin:0 32px 24px;background:var(--surf2);border:1.5px dashed var(--bdr);border-radius:16px;padding:24px;text-align:center">'+
  '<div style="font-size:22px;margin-bottom:8px">'+ico('starFilled')+'</div>'+
  '<div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px">No reviews yet — be the first.</div>'+
  '<div style="font-size:12px;color:var(--mut);line-height:1.6">Ledger just launched. We\'re not making up quotes.<br>Use it, pass your section, and tell us about it.</div>'+
  '</div>'+
  // Auto-renew disclosure + fine print
  '<div style="margin:0 32px 16px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.18);border-radius:10px;padding:12px 14px;font-size:12px;color:var(--txt);line-height:1.6">'+
    '<strong>'+ico('warning')+' Subscription auto-renews.</strong> After your 7-day free trial, Ledger Pro charges '+(isAnnual?'$132 every year':'$'+proMonthly+' every month')+' to your card automatically until you cancel. '+
    'Cancel anytime in Settings → Subscription. Cancel before the trial ends and you are never charged.'+
  '</div>'+
  '<div style="padding:0 32px 24px;text-align:center;font-size:10px;color:var(--mut);line-height:1.8">'+
    'By subscribing you agree to our <a href="/terms" target="_blank" style="color:var(--mut)">Terms of Service</a> and <a href="/privacy" target="_blank" style="color:var(--mut)">Privacy Policy</a>. '+
    'All prices in USD. 30-day money-back guarantee on your first purchase; after that, refunds within 7 days of a charge — email support@ledgercpa.app.'+
  '</div>'+
  '</div>';
  if(_redraw){
    const box=el.querySelector('.upgrade-modal-box');
    if(box){box.classList.add('no-anim');box.scrollTop=_keepScroll;}
    el.querySelector('.billing-opt.active')?.focus({preventScroll:true});
  }
}

function activatePlan(tier){
  // ── Beta mode: free switching, no payment required ──
  // Route to Stripe only when STRIPE_ENABLED=true AND real keys are configured
  if(STRIPE_ENABLED && tier!=='trial' && !STRIPE_CONFIG.paymentLinks.pro_monthly.includes('REPLACE')){
    const keyMap={pro:'pro_'+(_upgradeBilling==='annual'?'annual':'monthly'),elite:'elite_'+(_upgradeBilling==='annual'?'annual':'monthly'),cram:'cram_plan'};
    redirectToStripeCheckout(keyMap[tier]||'pro_monthly');
    return;
  }
  if(tier==='free'){
    SUB={...SUB,tier:'free',startDate:null};
    saveSub(SUB);
    closeUpgradeModal();
    showToast('Switched to Free tier','info');
  } else if(tier==='pro'&&!SUB.trialUsed){
    SUB={...SUB,tier:'trial',billingCycle:_upgradeBilling,startDate:Date.now(),trialEnd:Date.now()+7*86400000,trialUsed:true};
    saveSub(SUB);
    closeUpgradeModal();
    showToast('7-day free trial started! Enjoy all Pro features.','ok');
  } else if(tier==='pro'){
    SUB={...SUB,tier:'pro',billingCycle:_upgradeBilling,startDate:Date.now()};
    saveSub(SUB);
    closeUpgradeModal();
    showToast('Ledger Pro activated! Welcome to Pro.','ok');
  } else if(tier==='elite'){
    SUB={...SUB,tier:'elite',billingCycle:_upgradeBilling,startDate:Date.now()};
    saveSub(SUB);
    closeUpgradeModal();
    showToast('Ledger Pro activated.','ok');
  } else if(tier==='cram'){
    SUB={...SUB,tier:'cram',billingCycle:'one_time',startDate:Date.now(),cramEnd:Date.now()+183*86400000};
    saveSub(SUB);
    closeUpgradeModal();
    showToast('6-Month Cram Plan activated! Let\'s get you that CPA.','ok');
  }
  renderApp();
}

// Pro paywall gate — call before rendering a locked feature
function requirePro(featureName,onGranted){
  if(isPro()){onGranted();return;}
  openUpgradeModal(featureName);
}

// Render a lock overlay for a block element
function proLockHTML(featureName,btnLabel){
  if(isPro())return'';
  const lbl=btnLabel||'Unlock with Pro';
  return'<div class="pro-lock-overlay" onclick="openUpgradeModal(\''+featureName+'\')">'+'<div class="pro-lock-icon">'+ico('lock')+'</div>'+'<div class="pro-lock-label">'+featureName+'</div>'+'<button class="pro-lock-cta">'+lbl+'</button>'+'</div>';
}
function eliteLockHTML(featureName,btnLabel){
  if(isElite())return'';
  const lbl=btnLabel||'Unlock with Pro';
  return'<div class="pro-lock-overlay" onclick="openUpgradeModal(\''+featureName+'\')" style="background:var(--ora-bg);border:1.5px solid var(--ora-bdr)">'+'<div class="pro-lock-icon">'+ico('lock')+'</div>'+'<div class="pro-lock-label">'+featureName+' — Pro</div>'+'<button class="pro-lock-cta" style="background:var(--ora)">'+lbl+'</button>'+'</div>';
}

// Inline upsell banner (used inside cards)
function upsellBannerHTML(text,cta,featureName,tier){
  const _t=tier||'Pro';
  return'<div class="upsell-inline" onclick="openUpgradeModal(\''+featureName+'\')">'+'<span style="font-size:24px">'+ico('sparkles')+'</span>'+'<div style="flex:1"><div style="font-size:12px;font-weight:800;color:'+(_t==='Elite'?'var(--pur)':'var(--ind)')+'">'+text+'</div><div style="font-size:11px;color:var(--mut);margin-top:2px">Available with Ledger '+_t+'</div></div>'+'<button class="challenge-pro-badge" style="'+(_t==='Elite'?'background:var(--pur);color:#fff':'')+'">'+cta+'</button>'+'</div>';
}

// Post-onboarding offer — shown once after completing onboarding
function showPostOnboardingOffer(){
  window._firstRunOfferPending=false;
  const el=document.createElement('div');
  // When the chooser goes away (any of its buttons), start the guided tour.
  const _mo=new MutationObserver(()=>{
    if(!document.body.contains(el)){ _mo.disconnect(); setTimeout(()=>{ try{_maybeShowOnboard(currentTab||'feed');}catch(e){} },300); }
  });
  _mo.observe(document.body,{childList:true});
  el.className='modal-overlay open';
  el.id='post-ob-offer';
  el.style.cssText='overflow-y:auto;align-items:flex-start;padding:20px 16px';
  el.innerHTML=
  '<div style="background:var(--surf);border-radius:24px;width:100%;max-width:580px;overflow:hidden;animation:modalIn .3s ease;box-shadow:0 40px 100px rgba(0,0,0,.4);margin:auto">'+
  // Hero
  '<div style="background:linear-gradient(155deg,#0a0805,#15100b,#1c1510);padding:32px 32px 24px;text-align:center;position:relative;overflow:hidden">'+
  '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(212,64,0,.35),transparent 60%)"></div>'+
  '<div style="position:relative;z-index:1">'+
  '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.45);margin-bottom:10px">Account Created</div>'+
  '<div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-.5px;line-height:1.15;margin-bottom:8px">Choose your plan.<br>First 7 days are free.</div>'+
  '<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(14,165,116,.15);border:1px solid rgba(14,165,116,.3);color:#34d399;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">✓ Free forever plan — no card needed</div>'+
  '</div>'+
  '</div>'+
  // Plan cards
  '<div style="padding:20px 20px 24px">'+
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'+
  // Free
  '<div style="border:1.5px solid var(--bdr);border-radius:16px;padding:16px 14px;display:flex;flex-direction:column">'+
  '<div style="font-size:10px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Free</div>'+
  '<div style="font-size:26px;font-weight:900;color:var(--txt);line-height:1;margin-bottom:2px">$0</div>'+
  '<div style="font-size:10px;color:var(--mut);margin-bottom:12px">forever</div>'+
  '<div style="font-size:11px;color:var(--sub);line-height:1.6;flex:1">Session logging<br>Streak tracking<br>Study groups<br>Community feed</div>'+
  '<button onclick="document.getElementById(\'post-ob-offer\').remove()" style="margin-top:14px;width:100%;padding:10px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;font-size:12px;font-weight:700;color:var(--sub);cursor:pointer">Continue Free</button>'+
  '</div>'+
  // Pro
  '<div style="border:2px solid var(--ora);border-radius:16px;padding:16px 14px;display:flex;flex-direction:column;background:linear-gradient(160deg,var(--surf),var(--ora-bg));position:relative">'+
  '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--ora);color:#fff;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;white-space:nowrap;text-transform:uppercase;letter-spacing:.06em">Most Popular</div>'+
  '<div style="font-size:10px;font-weight:800;color:var(--ora);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Pro</div>'+
  '<div style="font-size:26px;font-weight:900;color:var(--ora);line-height:1;margin-bottom:2px">$14</div>'+
  '<div style="font-size:10px;color:var(--mut);margin-bottom:12px">per month · or $132/yr</div>'+
  '<div style="font-size:11px;color:var(--sub);line-height:1.6;flex:1">Everything in Free<br>Unlimited AI question bank<br>Ledger AI coach (100/mo)<br>AI Study Plan + analytics<br>Exam Day Protocol<br>Study partner pairing</div>'+
  '<button onclick="activatePlan(\'pro\');document.getElementById(\'post-ob-offer\').remove()" style="margin-top:14px;width:100%;padding:10px;background:var(--ora);border:none;border-radius:10px;font-size:12px;font-weight:800;color:#fff;cursor:pointer">Start 7-Day Free Trial →</button>'+
  '<div style="font-size:10px;color:var(--sub);line-height:1.5;margin-top:6px;text-align:center">Then $14/month, renews automatically until you cancel. Cancel anytime in Settings.</div>'+
  '</div>'+
  '</div>'+
  '<div style="text-align:center;font-size:11px;color:var(--mut);line-height:1.6">Exam date already set? The <strong>$75 Exam Window Pass</strong> is 6 months of Pro, paid once — see Settings → Subscription.<br>The trial needs a card to start. Cancel before day 7 and you are never charged.</div>'+
  '</div>'+
  '</div>';
  // After offer closes (via any button), fire the tour
  const _obs=new MutationObserver(function(m,obs){
    if(!document.getElementById('post-ob-offer')){
      obs.disconnect();
      setTimeout(_maybeAutoStartOnboarding,400);
    }
  });
  _obs.observe(document.body,{childList:true});
  document.body.appendChild(el);
}

