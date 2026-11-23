// ═══════════════════════════════════════════════
// STRIPE CONFIG — fill in your Stripe credentials
// https://dashboard.stripe.com/apikeys (publishable key)
// https://dashboard.stripe.com/payment-links (create payment links)
// ═══════════════════════════════════════════════
const STRIPE_CONFIG = {
  publishableKey: 'pk_live_51TZhxJDF8JDLWEuc1LwSbrdN3Am5SDHhuo64V1JhgnirRlXpkAKTEP3YHY7AqPebKqgmvz0gUqLRQmW1oCxWIfZ700KAr62PPL',
  // Payment Links from the Stripe dashboard.
  // ── NAMING NOTE (2026-11-02) ──────────────────────────────────────────────
  // Pro/Elite collapsed into ONE paid tier called "Pro" ($14/mo, $132/yr).
  // It bills on the Stripe prices that are still *named* "Ledger Elite", so the
  // webhook keeps resolving them to tier 'elite' — which now unlocks everything.
  // Price IDs and links are unchanged; only the marketing name collapsed.
  // TODO (30s, Stripe dashboard): rename product "Ledger Elite" -> "Ledger Pro"
  // and "Ledger Cram Plan" -> "Ledger Exam Window Pass" so checkout matches the
  // site. Renaming a product does NOT change its price IDs or Payment Links.
  paymentLinks: {
    pro_monthly:  'https://buy.stripe.com/dRm14n3iJchK3ebg7y7ss0a', // $14/mo, 7-day trial
    pro_annual:   'https://buy.stripe.com/bJe5kD5qR1D6163bRi7ss09', // $132/yr, 7-day trial
    elite_monthly:'https://buy.stripe.com/dRm14n3iJchK3ebg7y7ss0a', // same tier (legacy key)
    elite_annual: 'https://buy.stripe.com/bJe5kD5qR1D6163bRi7ss09', // same tier (legacy key)
    cram_plan:    'https://buy.stripe.com/fZubJ1bPf4Pi7ur5sU7ss0d', // $75 one-time, 6 months
    // Retired $9/$7 two-tier Pro links — kept only for reference:
    legacy_pro_monthly: 'https://buy.stripe.com/eVqdR94mN1D63eb9Ja7ss0c',
    legacy_pro_annual:  'https://buy.stripe.com/cNi9AT1aBbdG4ifaNe7ss0b',
    student_pro:  '',
  },
  // After activating subscription, Stripe redirects to your site
  successUrl: window.location.origin + window.location.pathname + '?billing=success',
  cancelUrl:  window.location.origin + window.location.pathname + '?billing=cancel',
  // Stripe Customer Portal — set up at https://dashboard.stripe.com/settings/billing/portal
  portalUrl:  'https://billing.stripe.com/p/login/8x2aEXf1r3Le9CzaNe7ss00',
};
const STRIPE_ENABLED = true;

// ── Student Discount Verification (coming soon — banner disabled) ─────────────
function showStudentVerifyBanner(){ return; // disabled until student discount launches
  if(document.getElementById('student-verify-banner')) return;
  const dismissed = parseInt(localStorage.getItem('ledger-student-verify-dismissed')||'0');
  if(dismissed && (Date.now()-dismissed) < 3*86400000) return;
  const wrap = document.querySelector('.app-wrap');
  if(!wrap) return;
  const bar = document.createElement('div');
  bar.id = 'student-verify-banner';
  bar.style.cssText = 'background:#92400e;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px;font-family:"Libre Franklin",system-ui,sans-serif;z-index:900';
  bar.innerHTML = `
    <span><strong>Verify your student discount</strong> — confirm your .edu email to keep your $5/month rate.
    <a onclick="openStudentVerifyModal()" style="color:#fcd34d;cursor:pointer;text-decoration:underline;margin-left:6px">Verify now →</a></span>
    <button onclick="document.getElementById('student-verify-banner').remove();localStorage.setItem('ledger-student-verify-dismissed',Date.now())"
      style="background:transparent;border:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:20px;line-height:1;padding:0 4px">×</button>
  `;
  // Insert after the <nav> element
  const nav = wrap.querySelector('nav.topnav');
  if(nav && nav.nextSibling) wrap.insertBefore(bar, nav.nextSibling);
  else wrap.prepend(bar);
}

// ─────────────────────────────────────────────────────────────────────────────

function redirectToStripeCheckout(planKey){
  if(!STRIPE_ENABLED){
    // Demo mode: activate locally without real payment
    const tierMap={pro_monthly:'pro',pro_annual:'pro',elite_monthly:'elite',elite_annual:'elite',cram_plan:'cram',student_pro:'pro'};
    activatePlan(tierMap[planKey]||'pro');
    return;
  }
  const url = STRIPE_CONFIG.paymentLinks[planKey];
  if(!url||url.includes('REPLACE')){ showToast('Stripe not configured yet','err'); return; }
  // Last event before the user leaves the app for Stripe. The gap between this
  // and 'purchase' (fired by the webhook path) is the checkout drop-off rate.
  logLedgerEvent('checkout_started',{plan:planKey});
  // Pass Firebase UID + plan key so webhook can identify the user
  const uid   = AUTH?.uid   || '';
  const email = AUTH?.email || '';
  const sep   = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams({
    client_reference_id: uid,
    prefilled_email:     email,
    metadata_plan:       planKey,  // Note: Stripe Payment Links don't support metadata directly,
                                   // so we also write it in the webhook via checkout session metadata
  });
  window.location.href = url + sep + 'client_reference_id=' + encodeURIComponent(uid) +
    '&prefilled_email=' + encodeURIComponent(email);
}

function openStripePortal(){
  if(!STRIPE_ENABLED||STRIPE_CONFIG.portalUrl.includes('REPLACE')){ showToast('Billing portal not configured','err'); return; }
  window.open(STRIPE_CONFIG.portalUrl,'_blank');
}

function showManageSubMenu(){
  const el=document.getElementById('manage-sub-section');
  if(!el) return;
  const portalUrl=STRIPE_CONFIG.portalUrl;
  const hasPortal=STRIPE_ENABLED&&!portalUrl.includes('REPLACE');
  const actions=[
    {icon:'creditCard',label:'Update Payment Method',sub:'Change your credit card or billing info',fn:()=>openBillingPortal()},
    {icon:'refresh',label:'Change Plan',sub:'Upgrade, downgrade, or switch billing cycle',fn:()=>{closeAppSettings();openUpgradeModal(null);}},
  ];
  el.innerHTML=`
<div style="background:var(--surf2);border:1.5px solid var(--bdr);border-radius:12px;margin-bottom:10px;overflow:hidden">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--bdr);background:var(--surf)">
    <span style="font-size:13px;font-weight:800">Manage Subscription</span>
    <button onclick="renderAppSettingsSection()" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--mut);line-height:1;padding:0 2px">×</button>
  </div>
  ${actions.map((a,i)=>`<button onclick="(${a.fn.toString()})()" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;background:transparent;border:none;border-bottom:${i<actions.length-1?'1px solid var(--bdr)':'none'};cursor:pointer;text-align:left;transition:background .12s" onmouseover="this.style.background='var(--surf)'" onmouseout="this.style.background='transparent'">
    <span style="font-size:20px;flex-shrink:0">${LedgerIcon(a.icon)}</span>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:700;color:var(--txt)">${a.label}</div>
      <div style="font-size:11px;color:var(--mut);margin-top:1px">${a.sub}</div>
    </div>
    <span style="font-size:14px;color:var(--mut)">›</span>
  </button>`).join('')}
  ${!hasPortal?`<div style="padding:10px 14px;font-size:10px;color:var(--mut);border-top:1px solid var(--bdr)">${ico('warning')} Stripe portal not configured — links disabled in beta mode</div>`:''}
</div>`;
}

function showCancelConfirm(){
  const section=document.getElementById('cancel-sub-section');
  if(!section) return;
  const tierName=subTierLabel();
  section.innerHTML=`
<div style="background:var(--red-bg);border:1.5px solid rgba(239,68,68,.4);border-radius:12px;padding:16px 18px;margin-bottom:10px">
  <div style="font-size:14px;font-weight:800;color:var(--far);margin-bottom:6px">Cancel your ${tierName} plan?</div>
  <div style="font-size:12px;color:var(--sub);line-height:1.65;margin-bottom:14px">You'll keep access until the end of your current billing period. After that your account reverts to Free — you'll lose AI Coach, Score Tracker, advanced analytics, and all Pro features.</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button onclick="executeCancelSubscription()" style="padding:9px 18px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Yes, cancel my plan</button>
    <button onclick="renderAppSettingsSection()" style="padding:9px 18px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;font-size:13px;font-weight:600;color:var(--txt);cursor:pointer">Keep my plan</button>
  </div>
</div>`;
}

async function executeCancelSubscription(){
  if(!STRIPE_ENABLED||STRIPE_CONFIG.portalUrl.includes('REPLACE')){
    // Dev / beta mode — downgrade immediately without Stripe
    SUB={tier:'free',billingCycle:'monthly',startDate:null,trialUsed:SUB.trialUsed||false,studentVerified:false};
    saveSub();
    showToast('Subscription cancelled. You\'re on the Free plan.','ok');
    renderAppSettingsTabs();
    renderAppSettingsSection();
    return;
  }

  // Disable buttons and show loading state
  const cancelBtn=document.querySelector('[onclick="executeCancelSubscription()"]');
  if(cancelBtn){cancelBtn.disabled=true;cancelBtn.textContent='Cancelling…';}

  try {
    const idToken=await _getAuthToken();
    if(!idToken) throw new Error('Not authenticated');

    const resp=await fetch('/api/cancel-subscription',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+idToken},
    });
    const data=await resp.json();
    if(!resp.ok) throw new Error(data.error||'Cancel failed');

    // Update local state — keep tier active, just mark cancelling
    SUB.cancelAtPeriodEnd=true;
    if(data.cancelAt) SUB.cancelAt=data.cancelAt;
    saveSub();

    const dateStr=data.cancelAt?new Date(data.cancelAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'the end of your billing period';
    showToast('Subscription cancelled — you keep access until '+dateStr,'ok');
    renderAppSettingsTabs();
    renderAppSettingsSection();
  } catch(e) {
    console.error('Cancel error:',e);
    showToast('Could not cancel: '+e.message+'. Email support@ledgercpa.app','err');
    if(cancelBtn){cancelBtn.disabled=false;cancelBtn.textContent='Yes, cancel my plan';}
  }
}

async function openBillingPortal(){
  if(!STRIPE_ENABLED||STRIPE_CONFIG.portalUrl.includes('REPLACE')){
    showToast('Stripe not configured yet','err'); return;
  }
  showToast('Opening billing portal…','ok');
  try{
    const idToken=await _getAuthToken();
    if(!idToken) throw new Error('Not authenticated');
    const resp=await fetch('/api/billing-portal',{
      method:'POST',
      headers:{'Authorization':'Bearer '+idToken},
    });
    const data=await resp.json();
    if(!resp.ok) throw new Error(data.error||'Failed to open portal');
    window.open(data.url,'_blank');
  }catch(e){
    // Fallback to static portal URL if API fails
    window.open(STRIPE_CONFIG.portalUrl,'_blank');
  }
}

async function reactivateSubscription(){
  const btn=document.getElementById('reactivate-btn');
  if(btn){btn.disabled=true;btn.textContent='Reactivating…';}
  try{
    const idToken=await _getAuthToken();
    if(!idToken) throw new Error('Not authenticated');
    const resp=await fetch('/api/reactivate-subscription',{
      method:'POST',
      headers:{'Authorization':'Bearer '+idToken},
    });
    const data=await resp.json();
    if(!resp.ok) throw new Error(data.error||'Reactivation failed');
    SUB.cancelAtPeriodEnd=false;
    SUB.cancelAt=null;
    saveSub(SUB);
    showToast('Subscription reactivated — you\'re all set!','ok');
    renderAppSettingsTabs();
    renderAppSettingsSection();
  }catch(e){
    showToast('Could not reactivate: '+e.message+'. Email support@ledgercpa.app','err');
    if(btn){btn.disabled=false;btn.textContent='Reactivate Subscription';}
  }
}

// Handle Stripe redirect back with ?billing=success or ?session_id=...
(function checkBillingReturn(){
  const p = new URLSearchParams(window.location.search);
  const isSuccess = p.get('billing')==='success' || !!p.get('session_id');
  if(isSuccess){
    history.replaceState({},'',window.location.pathname);
    // Show immediate feedback so user knows payment was received
    showToast('Payment received — activating your plan…','ok');
    // Poll Firestore until webhook fires and upgrades the user (usually <3s)
    let attempts = 0;
    const pollSub = async () => {
      if(!firebaseDb || !AUTH?.uid){ attempts++; if(attempts<12) setTimeout(pollSub,1200); return; }
      try{
        const doc = await firebaseDb.collection('users').doc(AUTH.uid).get();
        if(doc.exists){
          const data = doc.data();
          if(data.sub && data.sub.tier && data.sub.tier !== 'free'){
            SUB = {...SUB, ...data.sub};
            saveSub(SUB);
            logLedgerEvent('purchase', {tier: SUB.tier});
            showToast('Subscription activated! Welcome to ' + navProLabel() + '.','ok');
            renderApp();
            return;
          }
        }
      }catch(e){}
      attempts++;
      if(attempts < 12) setTimeout(pollSub, 1500);
      else showToast('Payment confirmed — your account will activate within a minute.','ok');
    };
    setTimeout(pollSub, 1200);
  } else if(p.get('billing')==='cancel'){
    history.replaceState({},'',window.location.pathname);
  }
})();

// ═══════════════════════════════════════════════
// EXAM DATA
// ═══════════════════════════════════════════════
const EXAMS = {
  FAR:{code:'FAR',full:'Financial Accounting & Reporting',color:'#dc2626',studyHours:170,passRate:43,difficulty:'Hardest',format:'50 MCQ + 7 TBS',isCore:true,icon:'barChart'},
  AUD:{code:'AUD',full:'Auditing & Attestation',color:'#2563eb',studyHours:140,passRate:46,difficulty:'Hard',format:'50 MCQ + 7 TBS',isCore:true,icon:'magnifier'},
  REG:{code:'REG',full:'Regulation',color:'#059669',studyHours:130,passRate:59,difficulty:'Moderate',format:'50 MCQ + 7 TBS',isCore:true,icon:'scales'},
  BAR:{code:'BAR',full:'Business Analysis & Reporting',color:'#d97706',studyHours:130,passRate:42,difficulty:'Hard',format:'50 MCQ + 7 TBS',isCore:false,icon:'lineChart'},
  ISC:{code:'ISC',full:'Information Systems & Controls',color:'#9333ea',studyHours:110,passRate:68,difficulty:'Moderate',format:'82 MCQ + 6 TBS',isCore:false,icon:'monitor'},
  TCP:{code:'TCP',full:'Tax Compliance & Planning',color:'#0d9488',studyHours:110,passRate:78,difficulty:'Moderate',format:'68 MCQ + 7 TBS',isCore:false,icon:'calculator'},
};
// Section colors are used for text as well as fills, so light mode gets
// deeper shades that meet WCAG AA contrast; dark mode keeps the bright ones.
const SECTION_COLORS={FAR:['#b91c1c','#dc2626'],AUD:['#1d4ed8','#2563eb'],REG:['#047857','#059669'],BAR:['#a14605','#d97706'],ISC:['#7e22ce','#9333ea'],TCP:['#0f766e','#0d9488']};
// Bright accent hexes are fine as fills but too light as text on light
// backgrounds; this returns a deeper shade for text in light mode.
const _DEEP={'#10b981':'#047857','#a855f7':'#7e22ce','#ef4444':'#b91c1c','#f59e0b':'#b45309','#d97706':'#b45309','#6366f1':'#4f46e5'};
function _textTone(hex){ return (document.body&&document.body.classList.contains('dark'))?hex:(_DEEP[String(hex).toLowerCase()]||hex); }
// Section color for text: same as _sectionColor in light mode, a lighter
// shade in dark mode so it stays readable.
const _SECTION_TEXT_DARK={FAR:'#f87171',AUD:'#60a5fa',REG:'#34d399',BAR:'#fbbf24',ISC:'#c084fc',TCP:'#2dd4bf'};
function _sectionText(code){ return (document.body&&document.body.classList.contains('dark'))?(_SECTION_TEXT_DARK[code]||'#8b90f0'):_sectionColor(code); }
function _sectionColor(code){ const c=SECTION_COLORS[code]; return c?c[document.body&&document.body.classList.contains('dark')?1:0]:'#5a5fcf'; }
Object.keys(EXAMS).forEach(k=>Object.defineProperty(EXAMS[k],'color',{get:()=>_sectionColor(k),enumerable:true,configurable:true}));

// ═══════════════════════════════════════════════
// HOUR GOAL PRESETS
// ═══════════════════════════════════════════════
const HOUR_GOAL_PRESETS={
  fast:{
    label:'Ambitious',
    tag:'Strong background or retaker',
    desc:'You have solid accounting foundations or are retaking. You study efficiently and can hit high focus for shorter sprints.',
    goals:{FAR:140,AUD:110,REG:100,BAR:110,ISC:85,TCP:85}
  },
  standard:{
    label:'Standard',
    tag:'AICPA-recommended ranges',
    desc:'Works for most first-time candidates. Balanced between thoroughness and time efficiency.',
    goals:{FAR:170,AUD:140,REG:130,BAR:130,ISC:110,TCP:110}
  },
  thorough:{
    label:'Thorough',
    tag:'Deep mastery / less background',
    desc:'Less accounting background, first-time studying this material, or you prefer to over-prepare. More repetition and review cycles.',
    goals:{FAR:200,AUD:165,REG:150,BAR:155,ISC:130,TCP:130}
  }
};

function getHourGoal(section){
  return (S?.hourGoals?.[section]) || EXAMS[section]?.studyHours || 150;
}

// ═══════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════
// cat = group in the Achievements pop-up; how = what the "i" explains;
// goal = [metric, target] for a progress bar (metrics come from _achMetrics()).
const ACH_CATS = [
  ['start','Getting started'],['sessions','Sessions'],['hours','Study hours'],['streaks','Streaks'],
  ['intensity','Intensity'],['time','Time of day'],['practice','Practice'],['exam','CPA exam'],['social','Community'],
];
const ACHIEVEMENTS = [
  // ── GETTING STARTED ──
  {id:'first_session',cat:'start',icon:'flame',name:'First Step',desc:'Log your first study session',how:'Start the timer or log a past session from the Today screen. Any length counts.',goal:['sessions',1]},
  {id:'exam_scheduled',cat:'start',icon:'calendarCheck',name:'Date Set',desc:'Add an exam date',how:'Add the date you sit for any section in your profile (Edit Profile → exam dates). Ledger paces your plan around it.'},
  {id:'first_score',cat:'start',icon:'barChart',name:'Benchmark',desc:'Record a practice score',how:'Log a practice exam or review-course score for any section from the Dashboard.',goal:['scores',1]},
  {id:'first_club',cat:'start',icon:'columns',name:'Joined In',desc:'Join or create a study club',how:'Join a club from Explore, accept an invite, or create your own. Direct messages don’t count.',goal:['clubs',1]},
  // ── SESSIONS ──
  {id:'sessions_5',cat:'sessions',icon:'footprints',name:'Getting Started',desc:'Log 5 study sessions',how:'Log 5 study sessions in total. Timed and past sessions both count.',goal:['sessions',5]},
  {id:'sessions_10',cat:'sessions',icon:'target',name:'In the Zone',desc:'Log 10 study sessions',how:'Log 10 study sessions in total.',goal:['sessions',10]},
  {id:'sessions_25',cat:'sessions',icon:'medalRibbon',name:'Quarter Century',desc:'Log 25 study sessions',how:'Log 25 study sessions in total.',goal:['sessions',25]},
  {id:'sessions_50',cat:'sessions',icon:'medal',name:'Fifty Strong',desc:'Log 50 study sessions',how:'Log 50 study sessions in total.',goal:['sessions',50]},
  {id:'sessions_100',cat:'sessions',icon:'bicep',name:'Centurion',desc:'Log 100 study sessions',how:'Log 100 study sessions in total.',goal:['sessions',100]},
  {id:'sessions_250',cat:'sessions',icon:'stadium',name:'Regular',desc:'Log 250 study sessions',how:'Log 250 study sessions in total.',goal:['sessions',250]},
  // ── HOURS ──
  {id:'hrs_10',cat:'hours',icon:'bolt',name:'First 10',desc:'Log 10 total study hours',how:'Reach 10 study hours in total across all sections.',goal:['hours',10]},
  {id:'hrs_25',cat:'hours',icon:'lineChart',name:'Gaining Ground',desc:'Log 25 total study hours',how:'Reach 25 study hours in total.',goal:['hours',25]},
  {id:'hrs_50',cat:'hours',icon:'bulb',name:'50 Hours In',desc:'Log 50 total hours',how:'Reach 50 study hours in total.',goal:['hours',50]},
  {id:'hrs_100',cat:'hours',icon:'percent',name:'Century Club',desc:'Log 100 total hours',how:'Reach 100 study hours in total.',goal:['hours',100]},
  {id:'hrs_150',cat:'hours',icon:'nut',name:'Iron Candidate',desc:'Log 150 total study hours',how:'Reach 150 study hours in total.',goal:['hours',150]},
  {id:'hrs_250',cat:'hours',icon:'mountain',name:'Summit Seeker',desc:'Log 250 total hours',how:'Reach 250 study hours in total.',goal:['hours',250]},
  {id:'hrs_500',cat:'hours',icon:'roboticArm',name:'500 Strong',desc:'Log 500 total study hours',how:'Reach 500 study hours in total.',goal:['hours',500]},
  {id:'hrs_1000',cat:'hours',icon:'crown',name:'Thousand Club',desc:'Log 1,000 total study hours',how:'Reach 1,000 study hours in total.',goal:['hours',1000]},
  {id:'section_50',cat:'hours',icon:'compass',name:'Deep Dive',desc:'Log 50 hours on one section',how:'Log 50 hours on a single section (FAR, AUD, REG, or your discipline).',goal:['sectionMax',50]},
  {id:'section_100',cat:'hours',icon:'briefcase',name:'Specialist',desc:'Log 100 hours on one section',how:'Log 100 hours on a single section.',goal:['sectionMax',100]},
  // ── STREAKS ──
  {id:'streak_3',cat:'streaks',icon:'flame',name:'3-Day Spark',desc:'3-day study streak',how:'Log at least one session on 3 days in a row.',goal:['streak',3]},
  {id:'streak_7',cat:'streaks',icon:'calendar',name:'Week Warrior',desc:'7-day study streak',how:'Log at least one session on 7 days in a row.',goal:['streak',7]},
  {id:'streak_14',cat:'streaks',icon:'fist',name:'Two Weeks',desc:'14-day study streak',how:'Log at least one session on 14 days in a row.',goal:['streak',14]},
  {id:'streak_30',cat:'streaks',icon:'calendarDays',name:'Month Machine',desc:'30-day study streak',how:'Log at least one session on 30 days in a row.',goal:['streak',30]},
  {id:'streak_60',cat:'streaks',icon:'burst',name:'Unstoppable',desc:'60-day study streak',how:'Log at least one session on 60 days in a row.',goal:['streak',60]},
  {id:'streak_100',cat:'streaks',icon:'crown',name:'Legend',desc:'100-day study streak',how:'Log at least one session on 100 days in a row.',goal:['streak',100]},
  {id:'streak_365',cat:'streaks',icon:'sunrise',name:'Year of Focus',desc:'365-day study streak',how:'Log at least one session every day for a full year.',goal:['streak',365]},
  // ── INTENSITY ──
  {id:'consistent',cat:'intensity',icon:'gem',name:'Consistent',desc:'Study 5 days in a week',how:'Log sessions on 5 different days in the same week (Sunday to Saturday).'},
  {id:'perfect_week',cat:'intensity',icon:'starFilled',name:'Perfect Week',desc:'Study all 7 days in a week',how:'Log a session every day from Sunday to Saturday of the same week.'},
  {id:'big_week',cat:'intensity',icon:'rocket',name:'Big Week',desc:'Log 20+ hours in a single week',how:'Log 20 or more hours within one week (Sunday to Saturday).'},
  {id:'weekend_warrior',cat:'intensity',icon:'coffee',name:'Weekend Warrior',desc:'Study Saturday and Sunday',how:'Log a session on both the Saturday and the Sunday of the same weekend.'},
  {id:'daily_double',cat:'intensity',icon:'dice',name:'Daily Double',desc:'Log 2 sessions in one day',how:'Log two separate sessions on the same day.'},
  {id:'triple_day',cat:'intensity',icon:'timer',name:'Hat Trick',desc:'Log 3 sessions in one day',how:'Log three separate sessions on the same day.'},
  {id:'marathon',cat:'intensity',icon:'brain',name:'Marathon',desc:'Log 5+ hrs in one session',how:'Log a single session of 5 hours or more.'},
  {id:'deep_work',cat:'intensity',icon:'lotus',name:'Deep Work',desc:'Log 6+ hours in one session',how:'Log a single session of 6 hours or more.'},
  {id:'all_day',cat:'intensity',icon:'lion',name:'All-Day Grind',desc:'Log 8+ hours in one session',how:'Log a single session of 8 hours or more.'},
  {id:'month_60',cat:'intensity',icon:'hourglass',name:'Big Month',desc:'Log 60+ hours in 30 days',how:'Log 60 or more hours within any 30-day stretch.'},
  // ── TIME OF DAY ──
  {id:'early_bird',cat:'time',icon:'sun',name:'Early Bird',desc:'Log a session starting before 6am',how:'Start a study session before 6:00 am your time.'},
  {id:'night_owl',cat:'time',icon:'owl',name:'Night Owl',desc:'Log a session after midnight',how:'Start a study session between midnight and 4:00 am your time.'},
  // ── PRACTICE ──
  {id:'qb_50',cat:'practice',icon:'pencil',name:'Warm-Up',desc:'Answer 50 practice questions',how:'Answer 50 multiple-choice questions in the Question Bank (Lab tab).',goal:['questions',50]},
  {id:'qb_250',cat:'practice',icon:'clipboard',name:'Drill Sergeant',desc:'Answer 250 practice questions',how:'Answer 250 multiple-choice questions in the Question Bank.',goal:['questions',250]},
  {id:'qb_1000',cat:'practice',icon:'graduationCap',name:'Question Master',desc:'Answer 1,000 practice questions',how:'Answer 1,000 multiple-choice questions in the Question Bank.',goal:['questions',1000]},
  {id:'score_75',cat:'practice',icon:'checkCircle',name:'Passing Pace',desc:'Score 75+ on a practice exam',how:'Record a practice exam score of 75 or higher (the CPA passing score) for any section.'},
  {id:'score_90',cat:'practice',icon:'starOutline',name:'High Scorer',desc:'Score 90+ on a practice exam',how:'Record a practice exam score of 90 or higher for any section.'},
  {id:'section_diverse',cat:'practice',icon:'book',name:'Well-Rounded',desc:'Study all 4 sections',how:'Log study time on FAR, AUD, and REG, plus your discipline section (BAR, ISC, or TCP).'},
  // ── CPA EXAM ──
  {id:'section_pass',cat:'exam',icon:'target',name:'Section Slayer',desc:'Pass your first section',how:'Mark a section as passed in your profile once you get your score.',goal:['passed',1]},
  {id:'two_sections',cat:'exam',icon:'peace',name:'Double Down',desc:'Pass 2 CPA sections',how:'Mark 2 sections as passed.',goal:['passed',2]},
  {id:'three_sections',cat:'exam',icon:'trident',name:'Almost There',desc:'Pass 3 CPA sections',how:'Mark 3 sections as passed.',goal:['passed',3]},
  {id:'all_pass',cat:'exam',icon:'trophy',name:'CPA Achieved',desc:'Pass all 4 sections',how:'Mark all 4 sections as passed. Congratulations, CPA!',goal:['passed',4]},
  // ── COMMUNITY ──
  {id:'first_follow',cat:'social',icon:'handshake',name:'First Connection',desc:'Follow your first CPA candidate',how:'Follow another candidate from Explore or their profile.',goal:['follows',1]},
  {id:'social',cat:'social',icon:'sparkles',name:'Study Crew',desc:'Follow 5 or more candidates',how:'Follow 5 other candidates.',goal:['follows',5]},
  {id:'social_10',cat:'social',icon:'users',name:'Squad Goals',desc:'Follow 10 or more candidates',how:'Follow 10 other candidates.',goal:['follows',10]},
  {id:'first_follower',cat:'social',icon:'wave',name:'Noticed',desc:'Get your first follower',how:'Have another candidate follow you. Sharing sessions to the feed helps people find you.',goal:['followers',1]},
  {id:'followers_10',cat:'social',icon:'party',name:'Following',desc:'Get 10 followers',how:'Have 10 candidates follow you.',goal:['followers',10]},
  {id:'props_10',cat:'social',icon:'clap',name:'Hype Machine',desc:'Give Props 10 times',how:'Give Props on other people’s sessions in the feed 10 times.',goal:['props',10]},
  {id:'props_25',cat:'social',icon:'megaphone',name:'Props Machine',desc:'Give Props 25 times',how:'Give Props 25 times.',goal:['props',25]},
  {id:'props_50',cat:'social',icon:'trumpet',name:'Hype Legend',desc:'Give Props 50 times',how:'Give Props 50 times.',goal:['props',50]},
];

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// REAL USERS CACHE (populated from Firestore on login)
// Replace for fake mock friends — shape is compatible for drop-in use
// ═══════════════════════════════════════════════
let REAL_USERS = [];

function hashColor(uid){
  // Deep enough that white initials on top meet WCAG AA contrast.
  const colors=['#4f46e5','#047857','#be185d','#c23a00','#0f766e','#b45309','#7c3aed','#0e7490','#15803d','#c2410c'];
  let h=0;for(let i=0;i<(uid||'').length;i++)h=(h*31+uid.charCodeAt(i))|0;
  return colors[Math.abs(h)%colors.length];
}

// Language filter for anything other people can see: profiles, session posts,
// public/firm club chat, room names. DMs and private clubs are not filtered.
// Returns true (and tells the user) when some text isn't allowed.
function _badWords(...vals){
  if(!window.LedgerModeration) return false;
  for(const v of vals){
    if(v&&LedgerModeration.check(String(v))){
      showToast('That has language that isn’t allowed on Ledger. Please reword it.','err');
      return true;
    }
  }
  return false;
}
// Invite-only clubs count as private chat, like DMs. Firm cohorts and public
// clubs are open to strangers, so they're filtered.
function _isPrivateClub(id){
  const c=(S&&S.clubs||[]).find(x=>x.id===id);
  return !!(c&&(c.isDM||(c.isPrivate&&!c.isCohort&&!c.isPublic)));
}
// Masks anything that slipped through (older posts, other clients).
function _clean(t){ return (t&&window.LedgerModeration)?LedgerModeration.censor(String(t)):(t||''); }

function firestoreToFriend(u){
  const name=_clean(u.displayName)||'CPA Candidate';
  const initials=name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?';
  const secs=u.sections||[];
  const passed=u.sectionPassed||[];
  const currentSection=secs.find(s=>!passed.includes(s))||null;
  return{
    id:u.uid,
    name,initials,
    color:u.color||hashColor(u.uid),
    state:u.state||u.locationState||'',
    currentSection,
    totalHours:u.hoursTotal||0,
    streak:u.currentStreak||0,
    tier:u.tier||'free',
    passedSections:passed,
    bio:_clean(u.bio),
    activities:(u.recentActivities||[]).map(a=>({...a,material:_clean(a.material),caption:_clean(a.caption),userId:u.uid})),
    isPrivate:!!u.isPrivate,
    restDays:Array.isArray(u.restDays)?u.restDays.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)):[],
    allowMessages:u.allowMessages!==false,
    discoverable:u.discoverable!==false,
    profilePic:u.profilePic||'',
    avatar:u.avatar||'',
    firmName:_clean(u.firmName),
    followers:u.followers||[],
    following:u.following||[],
    followersCount:(typeof u.followersCount==='number'?u.followersCount:(u.followers||[]).length),
    followingCount:(typeof u.followingCount==='number'?u.followingCount:(u.following||[]).length),
    isReal:true,
  };
}

// Re-pull followed/discover users and repaint the feed. Call after anything that
// changes who I follow, and once after onboarding (a brand-new account never
// went through the returning-user load path, so its feed sat on skeletons forever).
function refreshRealUsers(){
  return loadRealUsers().then(()=>{ if(currentTab==='today'||currentTab==='feed'||currentTab==='explore') renderTab(); });
}
// ═══════════════════════════════════════════════
// BLOCK & REPORT
// BLOCKED: people I blocked (uid → name). BLOCKED_BY: people who blocked me.
// Either way we keep each other out of feeds, search, comments, chats and
// notifications here; firestore.rules refuses new comments, props, follows,
// follow requests and direct messages from a blocked person, and /api/notify
// sends no pushes between them.
// ═══════════════════════════════════════════════
let BLOCKED=new Map(), BLOCKED_BY=new Set();
const _knownNames={};
function isBlocked(uid){ return !!uid&&(BLOCKED.has(uid)||BLOCKED_BY.has(uid)); }
function _nameOf(uid){ return BLOCKED.get(uid)||_knownNames[uid]||(_cachedUserInfo(uid)||{}).name||'this person'; }
async function loadBlocks(){
  if(!firebaseDb||!AUTH?.uid) return;
  const me=AUTH.uid;
  try{
    const snap=await firebaseDb.collection('users').doc(me).collection('blocks').get();
    BLOCKED=new Map(snap.docs.map(d=>[d.id,String(d.data().name||'')]));
  }catch(e){}
  try{
    const snap=await firebaseDb.collectionGroup('blocks').where('blocked','==',me).get();
    BLOCKED_BY=new Set(snap.docs.map(d=>d.ref.parent.parent&&d.ref.parent.parent.id).filter(Boolean));
  }catch(e){}
}
async function blockUser(uid,name){
  if(!AUTH||!firebaseDb||!uid||uid===AUTH.uid) return;
  name=String(name||_nameOf(uid)).slice(0,80);
  const me=AUTH.uid, users=firebaseDb.collection('users');
  try{ await users.doc(me).collection('blocks').doc(uid).set({blocked:uid,name,at:Date.now()}); }
  catch(e){ showToast('Couldn\'t block — please try again.','err'); return; }
  BLOCKED.set(uid,name);
  // Cut every tie, both ways: follows and pending follow requests.
  [users.doc(uid).collection('followers').doc(me), users.doc(me).collection('followers').doc(uid),
   users.doc(uid).collection('followRequests').doc(me), users.doc(me).collection('followRequests').doc(uid)]
    .forEach(r=>r.delete().catch(()=>{}));
  const drop=a=>(a||[]).filter(x=>x!==uid);
  S.following=drop(S.following); S.followers=drop(S.followers); S._seenFollowers=drop(S._seenFollowers);
  S.pendingRequests=drop(S.pendingRequests); S._sentRequests=drop(S._sentRequests);
  S.followRequests=(S.followRequests||[]).filter(r=>r.uid!==uid);
  S.notifications=(S.notifications||[]).filter(n=>n.from!==uid);
  if(S.accountabilityPartner===uid) S.accountabilityPartner=null;
  REAL_USERS=(REAL_USERS||[]).filter(u=>u.id!==uid);
  saveState(); saveFollowToFirestore(); refreshNotifBadge();
  showToast('Blocked '+name+'.','ok');
  _afterBlockChange(uid);
}
async function unblockUser(uid){
  if(!AUTH||!firebaseDb) return;
  try{ await firebaseDb.collection('users').doc(AUTH.uid).collection('blocks').doc(uid).delete(); }
  catch(e){ showToast('Couldn\'t unblock — please try again.','err'); return; }
  const name=BLOCKED.get(uid)||'them';
  BLOCKED.delete(uid);
  showToast('Unblocked '+name+'.','ok');
  _afterBlockChange(uid);
  loadRealUsers().then(()=>{ if(currentTab==='feed'||currentTab==='explore') renderTab(); });
}
// Redraw whatever is on screen so the change shows straight away.
function _afterBlockChange(uid){
  closeActionSheet();
  if(_cmOpen&&document.getElementById('comments-modal')?.classList.contains('open')) openComments(_cmOpen.actId,_cmOpen.userId);
  if(document.getElementById('blocked-list')) _renderBlockedList();
  if(history.state&&history.state.view==='userProfile'&&history.state.userId===uid&&document.getElementById('uprofile-content')){ _loadAndRenderProfilePage(uid); return; }
  if(_activeConvOpts&&document.getElementById('dm-conv-panel')){ _renderConvPanel(_activeConvOpts); return; }
  if(document.querySelector('.nav-tab')){ try{renderTab();}catch(e){} }
}
function confirmBlock(uid,name){
  name=name||_nameOf(uid);
  openActionSheet('Block '+name+'?',[
    {label:'Block', icon:'lock', danger:true, run:()=>blockUser(uid,name)},
  ],'They won\'t be able to follow you, message you, or comment on or give props to your sessions, and you won\'t see each other in feeds, search or chats. Ledger doesn\'t tell them. You can unblock any time in Settings → Privacy.');
}

// A small menu of actions (bottom sheet on phones).
let _sheetActs=[];
function openActionSheet(title,items,desc){
  closeActionSheet();
  _sheetActs=items.map(i=>i.run);
  const el=document.createElement('div');
  el.id='action-sheet'; el.className='modal-overlay open as-overlay';
  el.addEventListener('click',e=>{ if(e.target===el) closeActionSheet(); });
  el.innerHTML=`<div class="as-box" role="menu" aria-label="${esc(title||'Options')}">
    ${title||desc?`<div class="as-head">${title?`<div class="as-title">${esc(title)}</div>`:''}${desc?`<div class="as-desc">${esc(desc)}</div>`:''}</div>`:''}
    ${items.map((it,i)=>`<button type="button" class="as-item${it.danger?' as-danger':''}" role="menuitem" onclick="_runSheet(${i})">${it.icon?`<span class="as-ic">${ico(it.icon)}</span>`:''}<span>${esc(it.label)}</span></button>`).join('')}
    <button type="button" class="as-item as-cancel" onclick="closeActionSheet()">Cancel</button>
  </div>`;
  document.body.appendChild(el);
}
function _runSheet(i){ const f=_sheetActs[i]; closeActionSheet(); if(f) f(); }
function closeActionSheet(){ document.getElementById('action-sheet')?.remove(); }

// Things that can be reported are registered here and referred to by key, so
// no user text ever has to be placed inside an onclick attribute.
const _reportables={}; let _repSeq=0;
function _regReport(o){ const k='r'+(++_repSeq); _reportables[k]=o; return k; }
function openUserActions(uid){
  if(!uid||uid===AUTH?.uid) return;
  const name=_nameOf(uid);
  const k=_regReport({kind:'user',target:uid,targetName:name,text:'',refPath:'users/'+uid});
  openActionSheet(name,[
    {label:'Report '+name, icon:'warning', run:()=>openReportModal(k)},
    BLOCKED.has(uid)?{label:'Unblock '+name, icon:'unlock', run:()=>unblockUser(uid)}
                    :{label:'Block '+name, icon:'lock', danger:true, run:()=>confirmBlock(uid,name)},
  ]);
}
function openContentActions(k,extra){
  const o=_reportables[k]; if(!o) return;
  const what={comment:'comment',message:'message',post:'post'}[o.kind]||'this';
  openActionSheet('',[...(extra||[]),
    {label:'Report '+what, icon:'warning', run:()=>openReportModal(k)},
    {label:'Block '+o.targetName, icon:'lock', danger:true, run:()=>confirmBlock(o.target,o.targetName)},
  ]);
}
const REPORT_REASONS=[['harassment','Harassment or bullying'],['spam','Spam or scam'],['inappropriate','Inappropriate or offensive'],['impersonation','Pretending to be someone else'],['other','Something else']];
function openReportModal(k){
  const o=_reportables[k]; if(!o) return;
  if(!AUTH){ showToast('Sign in to report','err'); return; }
  closeActionSheet();
  document.getElementById('report-modal')?.remove();
  const what={user:'account',comment:'comment',message:'message',post:'post'}[o.kind];
  const el=document.createElement('div');
  el.id='report-modal'; el.className='modal-overlay open rp-overlay';
  el.addEventListener('click',e=>{ if(e.target===el) el.remove(); });
  el.innerHTML=`<div class="modal-box rp-box" role="dialog" aria-label="Report ${what}" onclick="event.stopPropagation()">
  <div class="modal-hdr"><div class="modal-title">Report ${what}</div><button class="modal-close" aria-label="Close" onclick="document.getElementById('report-modal').remove()">×</button></div>
  <div class="modal-body">
    ${o.text?`<div class="rp-quote"><div class="rp-quote-n">${esc(o.targetName)}</div><div class="rp-quote-t">${esc(o.text.slice(0,300))}</div></div>`:''}
    <div class="rp-q">${o.kind==='user'?'What’s wrong with '+esc(o.targetName)+'’s account?':'Why are you reporting this '+what+'?'}</div>
    <div class="rp-reasons">${REPORT_REASONS.map(([v,l])=>`<label class="rp-reason"><input type="radio" name="rp-reason" value="${v}" onchange="document.getElementById('rp-send').disabled=false"><span>${l}</span></label>`).join('')}</div>
    <textarea id="rp-details" class="rp-details" maxlength="1000" rows="3" placeholder="Anything else we should know? (optional)"></textarea>
    ${BLOCKED.has(o.target)?'':`<label class="rp-block"><input type="checkbox" id="rp-block"><span>Also block ${esc(o.targetName)}</span></label>`}
    <div class="rp-note">${esc(o.targetName)} won’t be told who reported them.</div>
    <button class="btn btn-primary rp-send" id="rp-send" disabled onclick="submitReport('${k}')">Send report</button>
  </div>
</div>`;
  document.body.appendChild(el);
}
async function submitReport(k){
  const o=_reportables[k]; const btn=document.getElementById('rp-send');
  const reason=document.querySelector('#report-modal input[name="rp-reason"]:checked')?.value;
  if(!o||!reason||!firebaseDb||!AUTH||!btn) return;
  const details=(document.getElementById('rp-details')?.value||'').trim().slice(0,1000);
  const alsoBlock=!!document.getElementById('rp-block')?.checked;
  btn.disabled=true; btn.textContent='Sending…';
  try{
    const ref=await firebaseDb.collection('reports').add({
      reporter:AUTH.uid, reporterName:String(S.name||'').slice(0,80),
      target:o.target, targetName:String(o.targetName||'').slice(0,80),
      kind:o.kind, refPath:String(o.refPath||'').slice(0,300), text:String(o.text||'').slice(0,1000),
      reason, details, at:Date.now(), status:'open'});
    notifyEvent('report',{reportId:ref.id});
  }catch(e){ btn.disabled=false; btn.textContent='Send report'; showToast('Couldn\'t send the report — please try again.','err'); return; }
  const body=document.querySelector('#report-modal .modal-body');
  if(body) body.innerHTML=`<div class="rp-done"><div class="rp-done-ic">${ico('checkCircle')}</div>
    <div class="rp-done-t">Thanks for letting us know</div>
    <div class="rp-done-s">Our team will review it.${alsoBlock?' You’ve also blocked '+esc(o.targetName)+'.':''}</div>
    <button class="btn btn-ghost" onclick="document.getElementById('report-modal').remove()">Done</button></div>`;
  if(alsoBlock) blockUser(o.target,o.targetName);
}
// Settings → Privacy → Blocked accounts
function _renderBlockedList(){
  const host=document.getElementById('blocked-list'); if(!host) return;
  host.innerHTML=BLOCKED.size?[...BLOCKED].map(([uid,name])=>`<div class="blk-row">
      <div class="cm-av" style="background:${hashColor(uid)};cursor:default">${esc(_cmInitials(name||'?'))}</div>
      <div class="blk-name">${esc(name||'Member')}</div>
      <button class="btn btn-ghost btn-sm" onclick="unblockUser('${uid}')">Unblock</button>
    </div>`).join('')
    :`<div class="blk-none">You haven’t blocked anyone.</div>`;
}
function _renderBlockedProfile(uid){
  const el=document.getElementById('uprofile-content'); if(!el) return;
  const mine=BLOCKED.has(uid);
  el.innerHTML=`<div class="blk-state"><div class="blk-ic">${ico('lock')}</div>
    <div class="blk-t">${mine?'You blocked '+esc(BLOCKED.get(uid)||'this person'):'This profile isn’t available'}</div>
    <div class="blk-s">${mine?'You won’t see each other’s sessions, comments or messages.':'You can’t view or contact this account.'}</div>
    ${mine?`<button class="btn btn-ghost" onclick="unblockUser('${uid}')">Unblock</button>`:''}</div>`;
}

async function loadRealUsers(){
  if(!firebaseDb||!AUTH?.uid||!S){ window._realUsersLoaded=true; return; }
  await loadBlocks();
  try{
    const followedIds=(S.following||[]).filter(id=>id&&typeof id==='string'&&id.length>4&&!isBlocked(id));
    const realMap={};
    // Fetch followed users in batches of 10
    for(let i=0;i<followedIds.length;i+=10){
      const batch=followedIds.slice(i,i+10);
      const snap=await firebaseDb.collection('users').where('uid','in',batch).get();
      snap.docs.forEach(d=>{const u=d.data();if(u.uid)realMap[u.uid]=firestoreToFriend(u);});
    }
    // Fetch discover users (recent registrations, not already loaded)
    const discSnap=await firebaseDb.collection('users').orderBy('updatedAt','desc').limit(40).get();
    discSnap.docs.forEach(d=>{
      const u=d.data();
      // People who switched off "Discoverable" only ever appear to those already following them.
      if(u.uid&&u.uid!==AUTH.uid&&!realMap[u.uid]&&u.discoverable!==false)realMap[u.uid]=firestoreToFriend(u);
    });
    REAL_USERS=Object.values(realMap).filter(u=>!isBlocked(u.id));
  }catch(e){console.warn('loadRealUsers:',e);}
  window._realUsersLoaded=true; // feed can stop showing skeletons now (success or fail)
  try{ await loadFeedReactions(); }catch(e){}
}

// Load cross-user props + comments (stored under each author's user doc) and merge
// them onto the matching activities so likes/comments are shared between users.
async function loadFeedReactions(){
  if(!firebaseDb||!AUTH?.uid) return;
  const me=AUTH.uid;
  const authors=new Set([me]);
  (REAL_USERS||[]).forEach(u=>{ if(u.id&&u.id.length>4) authors.add(u.id); });
  await Promise.all([...authors].map(async aid=>{
    try{
      const [propsSnap,commentsSnap]=await Promise.all([
        firebaseDb.collection('users').doc(aid).collection('props').get(),
        firebaseDb.collection('users').doc(aid).collection('comments').get()
      ]);
      const propsByAct={}, commentsByAct={};
      propsSnap.docs.forEach(d=>{const x=d.data();if(!x.activityId||isBlocked(x.reactor))return;(propsByAct[x.activityId]=propsByAct[x.activityId]||[]).push(x.reactor);});
      commentsSnap.docs.forEach(d=>{const x=d.data();if(!x.activityId||isBlocked(x.from))return;(commentsByAct[x.activityId]=commentsByAct[x.activityId]||[]).push({id:d.id,user:x.name||'Member',text:x.text||'',from:x.from,at:x.at&&x.at.toMillis?x.at.toMillis():0});});
      Object.values(commentsByAct).forEach(l=>l.sort((p,q)=>(p.at||0)-(q.at||0)));
      const apply=acts=>(acts||[]).forEach(a=>{ if(propsByAct[a.id])a.kudos=propsByAct[a.id]; if(commentsByAct[a.id])a.comments=commentsByAct[a.id]; });
      if(aid===me) apply(S&&S.activities);
      const u=(REAL_USERS||[]).find(x=>x.id===aid);
      if(u) apply(u.activities);
    }catch(e){}
  }));
}

// ═══════════════════════════════════════════════
// CHALLENGES
// ═══════════════════════════════════════════════
const CHALLENGES = [
  {id:'first_session',icon:'book',title:'First Study Session',desc:'Log your very first study session',difficulty:'Easy',diffColor:'#10b981',type:'sessions_total',target:1,reward:'First Step',participants:4820,endDate:'Ongoing',free:true},
  {id:'spark_3',icon:'flame',title:'3-Day Spark',desc:'Study 3 days in a row',difficulty:'Easy',diffColor:'#10b981',type:'streak',target:3,reward:'Spark Starter',participants:3210,endDate:'Ongoing',free:true},
  {id:'hrs_10',icon:'bolt',title:'10-Hour Kickoff',desc:'Log your first 10 total study hours',difficulty:'Easy',diffColor:'#10b981',type:'hours_total',target:10,reward:'Hustler',participants:5400,endDate:'Ongoing',free:true},
  {id:'sessions_5',icon:'book',title:'5-Session Builder',desc:'Complete 5 study sessions',difficulty:'Easy',diffColor:'#10b981',type:'sessions_total',target:5,reward:'Builder',participants:6100,endDate:'Ongoing',free:true},
  {id:'week_warrior',icon:'calendar',title:'Week Warrior',desc:'Study every day for 7 days straight',difficulty:'Medium',diffColor:'#f59e0b',type:'streak',target:7,reward:'Week Warrior',participants:2180,endDate:'Ongoing'},
  {id:'hrs_50',icon:'medalRibbon',title:'50-Hour Club',desc:'Log 50 total study hours',difficulty:'Medium',diffColor:'#f59e0b',type:'hours_total',target:50,reward:'Dedicated',participants:1890,endDate:'Ongoing'},
  {id:'far_sprint',icon:'barChart',title:'FAR Weekly Sprint',desc:'Log 20+ hours on FAR this week',difficulty:'Medium',diffColor:'#f59e0b',type:'hours_section_week',target:20,section:'FAR',reward:'FAR Warrior',participants:342,endDate:'Ongoing'},
  {id:'sessions_10',icon:'target',title:'10-Session Grinder',desc:'Complete 10 study sessions',difficulty:'Medium',diffColor:'#f59e0b',type:'sessions_total',target:10,reward:'Grinder',participants:2760,endDate:'Ongoing'},
  {id:'hrs_20_week',icon:'rocket',title:'20-Hour Week',desc:'Log 20 hours in a single week',difficulty:'Medium',diffColor:'#f59e0b',type:'hours_week',target:20,reward:'Weekly Beast',participants:1340,endDate:'Ongoing'},
  {id:'streak_30',icon:'calendarDays',title:'30-Day Machine',desc:'Study every day for 30 days straight',difficulty:'Hard',diffColor:'#ef4444',type:'streak',target:30,reward:'Month Machine',participants:218,endDate:'Ongoing'},
  {id:'hrs_100',icon:'trophy',title:'100 Hours Club',desc:'Log 100 total study hours',difficulty:'Hard',diffColor:'#ef4444',type:'hours_total',target:100,reward:'Century Club',participants:1204,endDate:'Ongoing'},
  {id:'first_pass',icon:'checkCircle',title:'First Section Pass',desc:'Pass your first CPA exam section',difficulty:'Hard',diffColor:'#ef4444',type:'pass_section',target:1,reward:'Section Slayer',participants:567,endDate:'Ongoing'},
  {id:'multi_section',icon:'graduationCap',title:'Multi-Section Master',desc:'Log hours on 3 different sections',difficulty:'Hard',diffColor:'#ef4444',type:'sections_studied',target:3,reward:'Well-Rounded',participants:823,endDate:'Ongoing'},
  {id:'marathon_sess',icon:'brain',title:'Study Marathon',desc:'Log 5+ hours in a single session',difficulty:'Elite',diffColor:'#a855f7',type:'hours_session',target:5,reward:'Marathon',participants:445,endDate:'Ongoing'},
  {id:'hrs_250',icon:'mountain',title:'Summit Seeker',desc:'Log 250 total study hours',difficulty:'Elite',diffColor:'#a855f7',type:'hours_total',target:250,reward:'Summit Seeker',participants:312,endDate:'Ongoing'},
  {id:'streak_60',icon:'burst',title:'60-Day Warrior',desc:'Study every day for 60 days straight',difficulty:'Elite',diffColor:'#a855f7',type:'streak',target:60,reward:'Warrior',participants:94,endDate:'Ongoing'},
  {id:'all_four',icon:'crown',title:'CPA Champion',desc:'Pass all 4 CPA exam sections',difficulty:'Elite',diffColor:'#a855f7',type:'pass_all',target:4,reward:'CPA Achieved',participants:89,endDate:'Ongoing'},
];

// ═══════════════════════════════════════════════
// PUBLIC CLUBS
// ═══════════════════════════════════════════════
const PUBLIC_CLUBS = [
  {id:'pub_b4',icon:'🏢',name:'Big 4 Prep Crew',desc:'Big 4 candidates grinding together. Audit, Tax, Advisory — all welcome.',memberCount:2400,tags:['FAR','AUD','REG']},
  {id:'pub_far',icon:'📊',name:'FAR Warriors',desc:'Surviving Financial Accounting together. Share notes, tips, moral support.',memberCount:1800,tags:['FAR']},
  {id:'pub_night',icon:'🌙',name:'Night Owls',desc:'Late-night study sessions. 9pm–2am grind club.',memberCount:956,tags:['all']},
  {id:'pub_morning',icon:'☕',name:'Morning Grinders',desc:'5am study sessions before work. Early bird gets the CPA.',memberCount:1100,tags:['all']},
  {id:'pub_reg',icon:'⚖️',name:'REG Study Squad',desc:'Tax law in solidarity. MCQs, TBSs, and war stories.',memberCount:734,tags:['REG']},
  {id:'pub_firstgen',icon:'💪',name:'First Gen CPAs',desc:'First generation CPA candidates supporting each other.',memberCount:445,tags:['all']},
  {id:'pub_aud',icon:'🔍',name:'AUD Crew',desc:'Mastering professional judgment together. COSO, ISA, PCAOB warriors.',memberCount:612,tags:['AUD']},
  {id:'pub_tcp',icon:'🧮',name:'TCP Tribe',desc:'Tax Compliance & Planning study group. Highest pass rate, we keep it that way.',memberCount:389,tags:['TCP']},
];

// ═══════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════
const AUTH_KEY = 'pf2:auth';
function loadAuth(){try{const r=localStorage.getItem(AUTH_KEY);return r?JSON.parse(r):null;}catch{return null;}}
function saveAuth(a){localStorage.setItem(AUTH_KEY,JSON.stringify(a));}
// clearAuth only removes the auth token — never deletes state data
function clearAuth(){localStorage.removeItem(AUTH_KEY);}

let AUTH = loadAuth() || null;

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
const KEY = 'pf2:state'; // legacy key (pre-per-user)
// Per-user state keys so multiple accounts on the same device stay separate
// and logout never loses data
function getStateKey(uid){ return uid ? 'pf2:state:u:'+uid : KEY; }
function loadState(uid){
  try{
    const userKey = uid ? getStateKey(uid) : null;
    // Try per-user key first (new)
    if(userKey){ const r=localStorage.getItem(userKey); if(r) return JSON.parse(r); }
    // Fall back to legacy key and migrate it to the user-scoped key
    const legacy=localStorage.getItem(KEY);
    if(legacy){
      const parsed=JSON.parse(legacy);
      if(userKey){ localStorage.setItem(userKey,legacy); localStorage.removeItem(KEY); }
      return parsed;
    }
    return null;
  }catch{return null;}
}
function saveState(){
  if(!S)return;
  S._rev=Date.now(); // last-modified stamp — lets another device tell whose copy is newer
  // Profile text I typed gets rendered into my own pages and published to others.
  ['name','bio','school','city','firmName','state','locationState','classYear'].forEach(k=>{ if(typeof S[k]==='string') S[k]=safeText(S[k]); });
  try{localStorage.setItem(getStateKey(AUTH?.uid),JSON.stringify(S));}
  catch(e){showToast('Storage full — clear old data in Settings','err');}
  // Sync to Firestore for cross-domain/device access (debounced)
  clearTimeout(saveState._t);
  // writeUserProfile() writes BOTH the private userState doc and the public
  // users/{uid} profile (hours, streak, recentActivities). The public half is
  // what followers' feeds, search, and leaderboards read — without it a newly
  // logged session stayed invisible to everyone else until the next app load.
  saveState._t=setTimeout(()=>{ if(firebaseDb&&AUTH?.uid&&S) writeUserProfile(); },3000);
  // Follow requests to private accounts have to be published for the other
  // person to ever see them.
  const _pr=JSON.stringify(S.pendingRequests||[]);
  if(saveState._pr!==undefined && saveState._pr!==_pr){ clearTimeout(saveState._prt); saveState._prt=setTimeout(()=>{ if(typeof syncSocial==='function') syncSocial(); },400); }
  saveState._pr=_pr;
}

// ── FIRESTORE HELPERS ──
// Privacy preferences (Settings → Privacy). Stored on S.privacyPrefs and applied
// HERE, at the point data leaves the device, so a switched-off item is never
// published at all rather than merely hidden in the UI.
const PRIVACY_DEFAULTS={show_streak:true,show_hours:true,show_scores:false,appear_leaderboard:true,allow_messages:true,share_activity:true};
function privacyPref(id){
  const p=(S&&S.privacyPrefs)||{};
  return p[id]!==undefined ? !!p[id] : !!PRIVACY_DEFAULTS[id];
}

async function writeUserProfile(){
  if(!AUTH?.uid||!S) return;
  if(!firebaseDb){ setTimeout(writeUserProfile, 800); return; }
  try{
    const showHours=privacyPref('show_hours'), showStreak=privacyPref('show_streak');
    const doc={
      uid: AUTH.uid,
      displayName: S.name||'',
      displayNameLower: (S.name||'').toLowerCase(),
      // Email and the 2FA secret used to be written here. This document is
      // readable by every signed-in user, so both are removed from it.
      email: firebase.firestore.FieldValue.delete(),
      totp_secret: firebase.firestore.FieldValue.delete(),
      state: S.state||'',
      city: S.city||'',
      locationState: S.locationState||'',
      bio: S.bio||'',
      school: S.school||'',
      classYear: S.classYear||'',
      disc: S.disc||'',
      sections: S.sections||[],
      sectionPassed: S.sectionPassed||[],
      // Exam scores (including failed attempts) are private unless the user opts in.
      examResults: privacyPref('show_scores') ? (S.examResults||[]) : [],
      longestStreak: showStreak ? (S.longestStreak||0) : 0,
      longestStreakMigrated: S.longestStreakMigrated||false,
      firmName: S.firmName||'',
      firmCode: S.firmCode||'',
      tier: (SUB&&SUB.tier)||'free',
      hoursTotal: showHours ? parseFloat((()=>{try{return(S.activities||[]).reduce((s,a)=>s+(a.hours||0),0).toFixed(1);}catch{return 0;}})()) : 0,
      currentStreak: showStreak ? getStreak() : 0,
      // Rest days near today, so friends see "rest day" instead of a nudge.
      restDays: Object.keys(S.restDays||{}).filter(k=>restKind(k)&&k>=_dayShift(todayStr(),-7)&&k<=_dayShift(todayStr(),7)).sort(),
      hideHours: !showHours,
      hideStreak: !showStreak,
      allowMessages: privacyPref('allow_messages'),
      discoverable: privacyPref('appear_leaderboard'),
      avatar: S.avatar||'',
      profilePic: S.profilePic||'',
      isPrivate: S.isPrivate||false,
      following: (S.following||[]).filter(id=>id&&id.length>4),
      followers: (S.followers||[]).filter(id=>id&&id.length>4),
      followingCount: (S.following||[]).filter(id=>id&&id.length>4).length,
      followersCount: (S.followers||[]).filter(id=>id&&id.length>4).length,
      // Recent non-private activities — used by followers' feeds
      recentActivities: !privacyPref('share_activity') ? [] : (S.activities||[]).filter(a=>!a.private).slice(-20).map(a=>deepSafe({
        id:a.id,date:a.date,section:a.section,hours:a.hours,
        type:a.type||'session',score:(typeof a.score==='number'?a.score:null),
        sectionHours:a.sectionHours||0,sitDate:a.sitDate||'',
        material:a.material||'',caption:a.caption||'',
        course:a.course||'',kind:a.kind||'',
        difficulty:a.difficulty||3,feeling:a.feeling||'',
        kudos:a.kudos||[],comments:(a.comments||[]).slice(-3)
      })),
      updatedAt: Date.now(),
      createdAt: S.created||Date.now()
    };
    await firebaseDb.collection('users').doc(AUTH.uid).set(doc,{merge:true});
    syncNotifyProfile();
    // Followers hear about a new session only once it is in the public profile.
    if(window._notifySession){ window._notifySession=false; notifyEvent('session_logged'); }
    // Also save full study state for cross-device sync. merge:true is required:
    // this doc also holds the AI usage counters and the 2FA secret, which a
    // plain set() silently wiped on every save.
    try{ await pushStateToCloud(); }
    catch(e){console.warn('[Ledger] Firestore state sync failed:',e.code,e.message);}
  }catch(e){console.warn('[Ledger] Firestore profile sync failed:',e.code,e.message);}
}

// Revision of the cloud copy this device last read or wrote. If the cloud's
// revision is anything else when we go to save, another device has written in
// the meantime and we must merge before overwriting.
let _cloudRev=null;
async function pushStateToCloud(){
  if(!firebaseDb||!AUTH?.uid||!S) return;
  const ref=firebaseDb.collection('userState').doc(AUTH.uid);
  try{
    const cur=await ref.get();
    const curRev=cur.exists ? (cur.data().rev||null) : null;
    if(cur.exists && curRev!==_cloudRev && cur.data().state){
      let remote=null; try{ remote=JSON.parse(cur.data().state); }catch(e){}
      if(remote && remote.name && (remote._rev||0)!==(S._rev||0)){
        const before=(S.activities||[]).length;
        S = (remote._rev||0)>(S._rev||0) ? mergeStates(remote,S) : mergeStates(S,remote);
        S._rev=Date.now();
        try{localStorage.setItem(getStateKey(AUTH.uid),JSON.stringify(S));}catch(e){}
        if((S.activities||[]).length!==before && typeof renderTab==='function' && document.querySelector('.nav-tab')){ try{renderTab();}catch(e){} }
      }
    }
  }catch(e){ /* offline: fall through and let the write queue */ }
  const rev=S._rev||Date.now();
  await ref.set({state:JSON.stringify(S),updatedAt:Date.now(),rev},{merge:true});
  _cloudRev=rev;
}

// Combine two copies of a user's state. `base` is the newer copy and wins for
// every scalar/setting; study sessions and exam results are UNIONED so work
// logged on either device survives (minus anything explicitly deleted).
function mergeStates(base, other){
  if(!other) return base;
  const out={...base};
  const dead=new Set([...(base.deletedActs||[]),...(other.deletedActs||[])]);
  const byId=new Map();
  [...(other.activities||[]),...(base.activities||[])].forEach(a=>{ if(a&&a.id&&!dead.has(a.id)) byId.set(a.id,a); });
  out.activities=[...byId.values()].sort((x,y)=>String(x.date||'').localeCompare(String(y.date||'')));
  out.deletedActs=[...dead].slice(-500);
  const exKey=r=>[r.section,r.sitDate,r.score,r.attempt].join('|');
  const ex=new Map();
  [...(other.examResults||[]),...(base.examResults||[])].forEach(r=>{ if(r) ex.set(exKey(r),r); });
  out.examResults=[...ex.values()].sort((x,y)=>(x.loggedAt||0)-(y.loggedAt||0));
  out.sectionPassed=[...new Set([...(base.sectionPassed||[]),...(other.sectionPassed||[])])];
  out.achievements=[...new Set([...(base.achievements||[]),...(other.achievements||[])])];
  out.longestStreak=Math.max(base.longestStreak||0,other.longestStreak||0);
  // Rest days and shields: the newer write wins day by day (so a cancel sticks).
  const rd={...(other.restDays||{})};
  Object.entries(base.restDays||{}).forEach(([k,v])=>{ if(!rd[k]||((v&&v.at)||0)>=((rd[k]&&rd[k].at)||0)) rd[k]=v; });
  out.restDays=rd;
  return out;
}

// Bring local state and the cloud copy into agreement at sign-in / app load.
// Returns 'ok' (cloud copy found and merged), 'none' (no cloud copy exists —
// genuinely new account, or local-only data that will upload on next save) or
// 'error' (cloud unreachable; caller must not treat that as "new user").
async function reconcileStateWithCloud(uid){
  if(!firebaseDb) return 'error';
  let doc;
  try{
    doc = await Promise.race([
      firebaseDb.collection('userState').doc(uid).get(),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),S?6000:15000))
    ]);
  }catch(e){ console.warn('[Ledger] cloud state read failed:',e.code||e.message); return 'error'; }
  // A cache-only answer while offline can't prove the account is new.
  if(!doc.exists) return (doc.metadata&&doc.metadata.fromCache) ? 'error' : 'none';
  let remote=null;
  try{ remote=JSON.parse(doc.data().state||'null'); }catch(e){}
  if(!remote||!remote.name) return 'none';
  const remoteRev=remote._rev||doc.data().updatedAt||0;
  _cloudRev=doc.data().rev||null;
  if(!S){ S=remote; }
  else{
    const localRev=S._rev||0;
    S = remoteRev>localRev ? mergeStates(remote,S) : mergeStates(S,remote);
  }
  try{localStorage.setItem(getStateKey(uid),JSON.stringify(S));}catch(e){}
  return 'ok';
}

async function searchFirestoreUsers(q){
  if(!firebaseDb) return [];
  try{
    const ql=q.toLowerCase().trim();
    let snap;
    if(ql){
      snap=await firebaseDb.collection('users')
        .where('displayNameLower','>=',ql)
        .where('displayNameLower','<=',ql+'\uf8ff')
        .limit(20).get();
    } else {
      snap=await firebaseDb.collection('users')
        .orderBy('createdAt','desc').limit(30).get();
    }
    const _fol=new Set((S&&S.following)||[]);
    return snap.docs.map(d=>d.data()).filter(u=>u.discoverable!==false||_fol.has(u.uid)||u.uid===AUTH?.uid);
  }catch(e){return [];}
}

async function saveFollowToFirestore(){
  if(!firebaseDb||!AUTH?.uid||!S) return;
  const _following=(S.following||[]).filter(id=>id&&id.length>4);
  try{
    await firebaseDb.collection('users').doc(AUTH.uid).update({
      following: _following,
      followingCount: _following.length,
      updatedAt: Date.now()
    });
  }catch(e){}
  // Reconcile follower EDGES so each followed user's real follower count is correct.
  // I can only write my own edge (users/{target}/followers/{me}); rules enforce that.
  // Diff against last-synced set so this covers every follow path that funnels through here,
  // and backfills existing follows on the first call (prev=[]).
  try{
    const me=AUTH.uid;
    const _firstSync=!window._lastSyncedFollowing;
    const prev=window._lastSyncedFollowing||[];
    const added=_following.filter(id=>!prev.includes(id));
    const removed=prev.filter(id=>!_following.includes(id));
    await Promise.all([
      ...added.map(t=>firebaseDb.collection('users').doc(t).collection('followers').doc(me).set({uid:me,at:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>{ if(!_firstSync) notifyEvent('follow',{toUid:t}); }).catch(()=>{})),
      ...removed.map(t=>firebaseDb.collection('users').doc(t).collection('followers').doc(me).delete().catch(()=>{}))
    ]);
    window._lastSyncedFollowing=_following.slice();
  }catch(e){}
}

// Read a user's REAL follower count from the followers subcollection and update an element.
async function _loadFollowerCount(uid, elId){
  if(!firebaseDb||!uid) return;
  try{
    const snap=await firebaseDb.collection('users').doc(uid).collection('followers').get();
    const el=document.getElementById(elId);
    if(el) el.textContent=snap.size;
  }catch(e){}
}

let S = loadState(AUTH?.uid) || null;
let currentTab = 'today';
// The address the app was opened with — renderApp() rewrites the URL, so deep-link
// parameters (study-room invites, shortcuts) are read from this copy.
const _BOOT_SEARCH = location.search;
let _dashTab = 'overview'; // 'overview' | 'progress' | 'plan'
let _readinessSection = null; // null = auto (soonest exam); else a forced section for the Readiness hero
let _heatMapRange = 'year'; // 'week' | 'month' | 'year'
let isDark = localStorage.getItem('pf2-theme')==='dark';

// ── SESSION TIMER STATE ──
let timerInterval = null;
let TS = {
  phase: 'setup', // 'setup'|'active'|'paused'|'recap'
  section: '', material: '', goalHours: 0,
  startTime: null, elapsed: 0, date: '',
  concepts: [], notes: '', feeling: '💪', difficulty: 3,
  sessionPhoto: null, // base64 image attached at recap
  location: '',       // where the session happened (optional)
};
function tsReset(){TS={phase:'setup',section:'',material:'',course:'',kind:'',goalHours:0,startTime:null,elapsed:0,date:'',concepts:[],notes:'',feeling:'💪',difficulty:3,sessionPhoto:null,location:''};try{localStorage.removeItem(tsPersistKey());}catch(e){}}
// ── In-progress session persistence (survives page reload) ──────────────────
function tsPersistKey(){return 'pf2-active-session-'+((typeof AUTH!=='undefined'&&AUTH&&AUTH.uid)||'anon');}
// A running session is saved with its wall-clock start, so the clock keeps going
// while Ledger is closed: people start the timer, then spend an hour in their
// review course's app, and the phone may unload Ledger in the meantime. The
// recap screen is saved too, so a half-filled recap isn't lost either.
const TS_MAX_SECS=16*3600;     // the longest single session Ledger accepts
const TS_CHECK_SECS=4*3600;    // past this, ask whether the clock really was studying
function tsPersist(){
  try{
    if(TS.phase==='active'||TS.phase==='paused'||TS.phase==='recap'){
      const snap={...TS};
      delete snap.sessionPhoto; // a photo can be megabytes; it isn't worth losing the session over
      delete snap.longCheck;
      if(TS.phase==='active'&&TS.startTime) snap.elapsed=Math.floor((Date.now()-TS.startTime)/1000);
      snap.savedAt=Date.now();
      localStorage.setItem(tsPersistKey(),JSON.stringify(snap));
    } else {
      localStorage.removeItem(tsPersistKey());
    }
  }catch(e){}
}
// Returns what was brought back: 'running' | 'long' | 'paused' | 'recap' | false.
function tsRestore(){
  try{
    const raw=localStorage.getItem(tsPersistKey());
    if(!raw)return false;
    const snap=JSON.parse(raw);
    if(!snap||!['active','paused','recap'].includes(snap.phase)) return false;
    if(snap.phase==='active'&&snap.startTime){
      const secs=Math.max(0,Math.floor((Date.now()-snap.startTime)/1000));
      if(secs<=TS_CHECK_SECS){
        TS={...TS,...snap,phase:'active',elapsed:secs};
        return 'running';
      }
      // Hours later: most likely the timer was left on. Hold it and ask.
      TS={...TS,...snap,phase:'paused',startTime:null,elapsed:Math.min(secs,TS_MAX_SECS),longCheck:true};
      return 'long';
    }
    if(snap.phase==='recap'){ TS={...TS,...snap}; return 'recap'; }
    TS={...TS,...snap,phase:'paused',startTime:null};
    return 'paused';
  }catch(e){}
  return false;
}
// ── Where and how a session was studied ──────────────────────────────────────
// Ledger sits beside the review course people already pay for, so a session can
// say which course and what kind of work: "FAR · Becker · MCQs". Both optional.
const STUDY_COURSES=[
  {id:'becker',name:'Becker'},{id:'uworld',name:'UWorld Roger'},{id:'gleim',name:'Gleim'},
  {id:'surgent',name:'Surgent'},{id:'wiley',name:'Wiley'},{id:'ninja',name:'NINJA CPA'},
  {id:'ledger',name:'Ledger Q-bank'},{id:'other',name:'Other'},
];
const STUDY_KINDS=[
  {id:'mcq',name:'MCQs'},{id:'sim',name:'Simulations'},{id:'lecture',name:'Lectures'},
  {id:'reading',name:'Reading'},{id:'review',name:'Review & notes'},{id:'exam',name:'Practice exam'},
  {id:'flash',name:'Flashcards'},
];
function courseName(id){const c=STUDY_COURSES.find(x=>x.id===id);return c?c.name:'';}
function kindName(id){const k=STUDY_KINDS.find(x=>x.id===id);return k?k.name:'';}
// "Becker · MCQs", or '' when neither was picked.
function studySrcLabel(a){return [courseName(a&&a.course),kindName(a&&a.kind)].filter(Boolean).join(' · ');}
// Picker state for the forms that aren't the timer (the timer keeps its own in TS).
const _srcPick={pm:{course:'',kind:''},edit:{course:'',kind:''}};
function _srcGet(scope){return scope==='ts'?{course:TS.course||'',kind:TS.kind||''}:_srcPick[scope];}
// Two rows of chips: course, then kind. `scope` says which form they belong to.
function studySrcPickerHTML(scope,wrapCls){
  const cur=_srcGet(scope);
  const row=(field,list)=>`<div class="src-row" role="group" data-src="${scope}-${field}">${list.map(o=>
    `<button type="button" class="src-chip${cur[field]===o.id?' sel':''}" data-id="${o.id}" aria-pressed="${cur[field]===o.id}" onclick="pickStudySrc('${scope}','${field}','${o.id}')">${esc(o.name)}</button>`).join('')}</div>`;
  return `<div class="${wrapCls||'sess-fgrp'}"><label>Course <span class="src-opt">optional</span></label>${row('course',STUDY_COURSES)}</div>
  <div class="${wrapCls||'sess-fgrp'}"><label>What you're doing <span class="src-opt">optional</span></label>${row('kind',STUDY_KINDS)}</div>`;
}
function pickStudySrc(scope,field,id){
  const cur=_srcGet(scope), val=cur[field]===id?'':id; // tap again to clear
  if(scope==='ts'){TS[field]=val;tsPersist();} else _srcPick[scope][field]=val;
  document.querySelectorAll(`[data-src="${scope}-${field}"] .src-chip`).forEach(b=>{
    const on=!!val&&b.dataset.id===val;
    b.classList.toggle('sel',on); b.setAttribute('aria-pressed',on);
  });
}
// Remember the course for next time: most people use one course for months.
// Small pills for a feed card or session page.
function _srcTagsHTML(a){
  return [courseName(a&&a.course),kindName(a&&a.kind)].filter(Boolean).map((t,i)=>`<span class="ac-tag${i===0&&a.course?' course':''}">${esc(t)}</span>`).join('');
}
function rememberStudySrc(course){ if(S&&course&&S.lastCourse!==course) S.lastCourse=course; }

// The 1-second clock for a running session (shared by start, resume and restore).
function tsStartTicking(){
  clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    if(TS.phase!=='active') return;
    TS.elapsed=Math.floor((Date.now()-TS.startTime)/1000);
    if(TS.elapsed>=TS_MAX_SECS){ // never let a forgotten timer run past the cap
      TS.elapsed=TS_MAX_SECS; if(typeof pauseTimer==='function') pauseTimer(); return;
    }
    if(typeof _sessTickUI==='function') _sessTickUI();
  },1000);
}
function fmtElapsed(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
function fmtDur(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h>0?`${h}h ${m}m`:`${m}m ${s%60}s`;}

function applyTheme(){
  document.body.classList.toggle('dark',isDark);
  // Match the browser/status bar to the in-app theme, not just the phone's system setting.
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.setAttribute('content',isDark?'#0c0905':'#f2ede6'));
}
applyTheme();

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
// Calendar day in the user's own time zone. (toISOString() is UTC, which filed a
// session logged at 8pm in Chicago under tomorrow and broke the streak that night.)
function _ymd(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function todayStr(){return _ymd(new Date());}
function _getGreeting(){const h=new Date().getHours();if(h<12)return'Good morning';if(h<17)return'Good afternoon';return'Good evening';}
function openDashTab(tab){_dashTab=tab;renderTab();}
function timeAgo(isoStr){
  const diff=(Date.now()-new Date(isoStr))/1000;
  if(diff<60)return 'just now';
  if(diff<3600)return Math.floor(diff/60)+'m ago';
  if(diff<86400)return Math.floor(diff/3600)+'h ago';
  return Math.floor(diff/86400)+'d ago';
}
function esc(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function showToast(msg,type='ok'){
  const wrap=document.getElementById('toast-wrap');
  const t=document.createElement('div');
  t.className=`toast toast-${type}`;
  t.textContent=msg;
  wrap.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400);},3500);
}
// ── Rest days and Streak Shields ─────────────────────────────────────────────
// A streak counts days studied in a row. Two kinds of day hold it without
// adding to it:
//   rest   — planned ahead (today or a coming day). Everyone gets one a week,
//            Monday to Sunday. Discipline includes rest; a wedding or a deadline
//            shouldn't wipe out 40 days.
//   shield — Pro: patch a day already missed (up to 3 in a row, last 7 days).
// S.restDays = { 'YYYY-MM-DD': {t:'rest'|'shield'|null, at:ms} }; t:null is a
// cancelled day, kept so another device's older copy can't bring it back.
const REST_PER_WEEK=1, SHIELD_MAX_GAP=3;
function _dayShift(ymd,n){const d=new Date(ymd+'T12:00:00');d.setDate(d.getDate()+n);return _ymd(d);}
function _weekMonday(ymd){const d=new Date(ymd+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return _ymd(d);}
function restKind(ymd){const r=S&&S.restDays&&S.restDays[ymd];return r&&r.t||null;}
function _studiedOn(ymd){return (S&&S.activities||[]).some(a=>(a.date||'').slice(0,10)===ymd);}
// Rest days already used in the week holding `ymd` (a day you studied anyway doesn't count).
function restUsedInWeek(ymd,exceptDay){
  const mon=_weekMonday(ymd);
  let n=0;
  for(let i=0;i<7;i++){const k=_dayShift(mon,i);if(k!==exceptDay&&restKind(k)==='rest'&&!_studiedOn(k))n++;}
  return n;
}
function _setRest(ymd,t){
  if(!S.restDays) S.restDays={};
  S.restDays[ymd]={t:t||null,at:Date.now()};
  // Keep about four months of history.
  const cut=_dayShift(todayStr(),-120);
  Object.keys(S.restDays).forEach(k=>{if(k<cut)delete S.restDays[k];});
}
function _streakFrom(logDates,today){
  let streak=0, check=today;
  for(let guard=0;guard<4000;guard++){
    if(logDates.has(check)) streak++;
    else if(check!==today&&!restKind(check)) break;
    check=_dayShift(check,-1);
  }
  return streak;
}
function getStreak(){
  if(!S||!(S.activities||[]).length)return 0;
  const logDates=new Set(S.activities.map(a=>(a.date||'').slice(0,10)));
  return _streakFrom(logDates,todayStr());
}
// A streak that broke recently enough for a Streak Shield to patch:
// {days:[missed ymd…], was:N (streak before the gap), restored:N (streak once patched)} or null.
function streakGap(){
  if(!S||!(S.activities||[]).length) return null;
  const today=todayStr();
  const logDates=new Set(S.activities.map(a=>(a.date||'').slice(0,10)));
  let d=_dayShift(today,-1); // today can't be "missed" yet
  // Walk back past what still counts (study or rest) to the first missed day.
  while(logDates.has(d)||restKind(d)) d=_dayShift(d,-1);
  const days=[];
  while(!logDates.has(d)&&!restKind(d)&&days.length<=SHIELD_MAX_GAP){ days.push(d); d=_dayShift(d,-1); }
  if(!days.length||days.length>SHIELD_MAX_GAP) return null;
  if(days[0]<_dayShift(today,-7)) return null;
  const was=_streakFrom(logDates,d); // the run that ended just before the gap
  if(was<2) return null;
  const tmp=S.restDays; S.restDays={...(tmp||{})};
  days.forEach(k=>{S.restDays[k]={t:'shield',at:0};});
  const restored=_streakFrom(logDates,today);
  S.restDays=tmp;
  if(restored<=getStreak()) return null;
  return {days:days.slice().reverse(),was,restored};
}
function getTotalHours(){if(!S)return 0;return S.activities.reduce((a,act)=>a+(act.hours||0),0);}
function getWeekHours(){
  if(!S)return 0;
  const weekAgo=new Date(Date.now()-7*86400000);
  return S.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
}
function getSectionHours(section){
  if(!S)return 0;
  return S.activities.filter(a=>a.section===section).reduce((a,b)=>a+(b.hours||0),0);
}
// Numbers behind the achievement progress bars (your own account only).
function _achMetrics(){
  const acts=(S&&S.activities)||[];
  const bySec={};acts.forEach(a=>{bySec[a.section]=(bySec[a.section]||0)+(a.hours||0);});
  const scores=Object.values(S.practiceScores||{}).flat();
  return{
    sessions:acts.length,
    hours:Math.floor(getTotalHours()*10)/10,
    streak:getStreak(),
    passed:(S.sectionPassed||[]).length,
    follows:(S.following||[]).filter(Boolean).length,
    followers:(S.followers||[]).filter(id=>id&&id.length>4).length,
    props:S.propsGiven||0,
    questions:Object.values(S.qbProgress||{}).reduce((t,p)=>t+((p&&p.mcqDone)||0),0),
    scores:scores.length,
    clubs:(S.clubs||[]).filter(c=>c&&c.id&&!c.isDM).length,
    sectionMax:Math.floor(Math.max(0,...Object.values(bySec))*10)/10,
  };
}
function checkAchievements(){
  if(!S)return;
  const totalHrs=getTotalHours();
  const streak=getStreak();
  const passedCount=(S.sectionPassed||[]).length;
  const propCount=S.propsGiven||0;
  const followCount=(S.following||[]).filter(Boolean).length;
  const earned=new Set(S.achievements||[]);
  const newOnes=[];

  if(streak>(S.longestStreak||0)) S.longestStreak=streak;
  const check=(id,cond)=>{if(cond&&!earned.has(id)){earned.add(id);newOnes.push(id);}};
  const sessionCount=S.activities.length;
  check('first_session',sessionCount>=1);
  check('sessions_5',sessionCount>=5);
  check('sessions_10',sessionCount>=10);
  check('sessions_25',sessionCount>=25);
  check('sessions_50',sessionCount>=50);
  check('sessions_100',sessionCount>=100);
  check('sessions_250',sessionCount>=250);
  const M=_achMetrics();
  check('exam_scheduled',Object.values(S.examDates||{}).some(Boolean));
  check('first_score',M.scores>=1);
  check('first_club',M.clubs>=1);
  check('hrs_1000',totalHrs>=1000);
  check('section_50',M.sectionMax>=50);
  check('section_100',M.sectionMax>=100);
  check('streak_365',streak>=365);
  check('qb_50',M.questions>=50);
  check('qb_250',M.questions>=250);
  check('qb_1000',M.questions>=1000);
  const _allScores=Object.values(S.practiceScores||{}).flat().map(x=>+x.score||0);
  check('score_75',_allScores.some(v=>v>=75));
  check('score_90',_allScores.some(v=>v>=90));
  check('first_follower',M.followers>=1);
  check('followers_10',M.followers>=10);

  // Hours
  check('hrs_10',totalHrs>=10);
  check('hrs_25',totalHrs>=25);
  check('hrs_50',totalHrs>=50);
  check('hrs_100',totalHrs>=100);
  check('hrs_150',totalHrs>=150);
  check('hrs_250',totalHrs>=250);
  check('hrs_500',totalHrs>=500);

  // Streaks — milestone ones get special celebration
  const _streakMilestones=[7,14,30,60,100];
  check('streak_3',streak>=3);
  check('streak_7',streak>=7);
  check('streak_14',streak>=14);
  check('streak_30',streak>=30);
  check('streak_60',streak>=60);
  check('streak_100',streak>=100);
  if(_streakMilestones.includes(streak)&&!earned.has('streak_shown_'+streak)){
    earned.add('streak_shown_'+streak);
    setTimeout(()=>showStreakMilestone(streak),800);
  }

  // Hours milestones get a shareable card (mark all crossed as shown; celebrate the highest new one)
  let _hrsToShow=null;
  [[50,'hrs_50'],[100,'hrs_100'],[250,'hrs_250']].forEach(function(m){
    if(totalHrs>=m[0] && !earned.has('shown_'+m[1])){ earned.add('shown_'+m[1]); _hrsToShow=m[1]; }
  });
  if(_hrsToShow) setTimeout(()=>showMilestoneShareCard(_hrsToShow),900);

  // Session intensity
  check('marathon',S.activities.some(a=>a.hours>=5));
  check('deep_work',S.activities.some(a=>a.hours>=6));
  check('all_day',S.activities.some(a=>a.hours>=8));

  // Time of day
  check('early_bird',S.activities.some(a=>{const h=new Date(a.date).getHours();return h<6;}));
  check('night_owl',S.activities.some(a=>{const h=new Date(a.date).getHours();return h===0||h===1||h===2||h===3;}));

  // Section progress
  check('section_pass',passedCount>=1);
  check('two_sections',passedCount>=2);
  check('three_sections',passedCount>=3);
  check('all_pass',passedCount>=4);

  // Social
  check('first_follow',followCount>=1);
  check('social',followCount>=5);
  check('social_10',followCount>=10);
  check('props_10',propCount>=10);
  check('props_25',propCount>=25);
  check('props_50',propCount>=50);

  // Weekly patterns
  const now=new Date();
  const startOfWeek=new Date(now);
  startOfWeek.setDate(now.getDate()-now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const thisWeekDates=new Set();
  const thisWeekHrs=S.activities.filter(a=>new Date(a.date)>=startOfWeek).reduce((s,a)=>s+(a.hours||0),0);
  S.activities.forEach(a=>{if(new Date(a.date)>=startOfWeek)thisWeekDates.add(a.date.slice(0,10));});
  check('consistent',thisWeekDates.size>=5);
  check('perfect_week',thisWeekDates.size>=7);
  check('big_week',thisWeekHrs>=20);

  // Daily double (2 sessions same day)
  const byDay={};
  S.activities.forEach(a=>{const d=a.date.slice(0,10);byDay[d]=(byDay[d]||0)+1;});
  check('daily_double',Object.values(byDay).some(v=>v>=2));
  check('triple_day',Object.values(byDay).some(v=>v>=3));
  // Saturday and the Sunday right after it
  check('weekend_warrior',Object.keys(byDay).some(d=>{
    const t=new Date(d+'T12:00:00'); if(t.getDay()!==6) return false;
    t.setDate(t.getDate()+1); return !!byDay[_ymd(t)];
  }));
  // 60+ hours inside any 30-day window
  const _days=Object.keys(byDay).sort();
  const _hrsOn={}; S.activities.forEach(a=>{const d=a.date.slice(0,10);_hrsOn[d]=(_hrsOn[d]||0)+(a.hours||0);});
  check('month_60',_days.some((d,i)=>{
    const end=new Date(d+'T12:00:00'); end.setDate(end.getDate()+29); const e=_ymd(end);
    let t=0; for(let j=i;j<_days.length&&_days[j]<=e;j++) t+=_hrsOn[_days[j]]; return t>=60;
  }));

  // All 4 sections studied
  const studiedSections=new Set(S.activities.map(a=>a.section));
  const allFour=['FAR','AUD','REG'].every(s=>studiedSections.has(s))&&[...studiedSections].some(s=>['BAR','ISC','TCP','UDP'].includes(s));
  check('section_diverse',allFour);

  S.achievements=Array.from(earned);
  saveState();

  // Queue achievement unlocks with staggered delay
  newOnes.forEach((id,i)=>{
    const ach=ACHIEVEMENTS.find(a=>a.id===id);
    if(ach){
      addNotification('achievement','trophy','You earned the “'+esc(ach.name)+'” achievement.',null,'profile',null);
      if(notifPref('achievements')) setTimeout(()=>showAchievementUnlock(ach), 500+i*900);
    }
  });
}

