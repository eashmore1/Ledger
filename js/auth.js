// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
let _pendingInvite=null; // {code, fromName, fromUid}
// Invite must survive the Google OAuth full-page redirect (mobile / in-app browsers),
// so it's persisted to localStorage, not just held in memory.
function _savePendingInvite(inv){ try{ localStorage.setItem('pf2-pending-invite', JSON.stringify({...inv, ts:Date.now()})); }catch(e){} }
function _getPendingInvite(){
  if(_pendingInvite) return _pendingInvite;
  try{
    const raw=localStorage.getItem('pf2-pending-invite');
    if(raw){
      const inv=JSON.parse(raw);
      if(inv && inv.code && (Date.now()-(inv.ts||0) < 2*60*60*1000)){ // honor for 2 hours
        _pendingInvite={code:safeText(String(inv.code)).slice(0,24),fromName:safeText(String(inv.fromName||'')).slice(0,60),fromUid:safeText(String(inv.fromUid||'')).slice(0,128),firmName:safeText(String(inv.firmName||'')).slice(0,60)};
        return _pendingInvite;
      }
    }
  }catch(e){}
  return null;
}
function _clearPendingInvite(){ _pendingInvite=null; try{ localStorage.removeItem('pf2-pending-invite'); }catch(e){} }
// Force auth screen on /login, /signup routes or ?auth=1 param
const _isLoginRoute = ['/login','/signup'].includes(window.location.pathname) || new URLSearchParams(window.location.search).get('auth')==='1';
if(_isLoginRoute){ window._forceAuth = true; history.replaceState({},'','/'); }

// Periodic pulls for things other users do (clubs I was added to, followers,
// follow requests, kudos, comments). Started for returning AND brand-new users.
function startBackgroundSync(){
  setTimeout(syncMyClubs, 2500);
  setTimeout(syncSocial, 3000);
  clearInterval(window._socialSyncTimer);
  window._socialSyncTimer=setInterval(()=>{ if(!document.hidden&&AUTH&&S){ syncSocial(); syncMyClubs(); } }, 120000);
}

// ═══════════════════════════════════════════════
// SIGNED-IN ENTRY — the ONE path every successful sign-in goes through
// (persisted session on page load, email/password form, Google popup).
// Previously each path had its own copy; the email-form copy skipped the cloud
// restore entirely, so signing in on a new device dropped a returning user into
// onboarding and then overwrote their cloud data with a blank account.
// ═══════════════════════════════════════════════
async function enterSignedIn(user){
  const method = user.providerData[0]?.providerId==='google.com' ? 'google' : 'email';
  AUTH = { uid:user.uid, displayName:user.displayName||user.email.split('@')[0], email:user.email, method, photoURL:user.photoURL||null, created:Date.now() };
  saveAuth(AUTH);
  S = loadState(AUTH.uid)||null;
  // Reconcile with the cloud copy BEFORE deciding between app and onboarding.
  // Covers: new device (no local state), a second device with stale local
  // state, and cloud-unreachable (must NOT fall through to onboarding — a
  // returning user finishing onboarding would overwrite their saved data).
  _showRestoreLoader();
  const sync = await reconcileStateWithCloud(user.uid);
  _hideRestoreLoader();
  if(!S){
    if(sync==='error'){ renderCloudUnavailable(); return; }
    renderOnboarding(); return;
  }
  await loadSubFromCloud(user.uid);
  // Auto-verify student plan if signed in with .edu email
  if(SUB.studentPlan && !SUB.studentVerified){
    if(AUTH.email && AUTH.email.toLowerCase().endsWith('.edu')){
      SUB.studentVerified = true;
      saveSub(SUB);
      try{
        if(firebaseDb) await firebaseDb.collection('users').doc(user.uid).update({'sub.studentVerified':true,'sub.studentEduEmail':AUTH.email.toLowerCase()});
      }catch(e){}
    }
  }
  // Redirect after login if coming from /login or /signup
  if(window._postAuthRedirect){ history.replaceState({},'',window._postAuthRedirect); window._postAuthRedirect=null; }
  renderApp();
  // Handle pending invite for existing users (new users are handled in obFinish).
  // Read from memory OR localStorage so it survives the Google OAuth redirect.
  const _inv=_getPendingInvite();
  if(_inv && S){
    // Always connect with the inviter, regardless of cohort.
    let changed=false;
    const fromUid=_inv.fromUid;
    if(fromUid&&fromUid.length>4&&!(S.following||[]).includes(fromUid)){
      S.following=[...(S.following||[]),fromUid];changed=true;
      saveFollowToFirestore(); // create the follower edge so the inviter's count is right
    }
    const sameCohort = S.firmCode && String(S.firmCode).toUpperCase()===String(_inv.code).toUpperCase();
    if(!S.firmCode){
      // No cohort yet — adopt the invite's cohort outright.
      S.firmCode=_inv.code; if(_inv.firmName&&!S.firmName)S.firmName=_inv.firmName; changed=true;
      if(changed){saveState();setTimeout(writeUserProfile,500);}
      ensureFirmCohort();
      if(_inv.fromName) showToast('Joined '+(S.firmName||'study group')+' — connected with '+_inv.fromName+'','ok');
      else showToast('Joined study group!','ok');
      _clearPendingInvite();
    } else if(sameCohort){
      // Already in this cohort — just confirm the connection.
      if(changed){saveState();setTimeout(writeUserProfile,500);}
      ensureFirmCohort();
      if(_inv.fromName) showToast('Connected with '+_inv.fromName+'','ok');
      _clearPendingInvite();
    } else {
      // Already in a DIFFERENT cohort — don't silently switch; ask.
      if(changed){saveState();setTimeout(writeUserProfile,500);}
      if(_inv.fromName) showToast('Connected with '+_inv.fromName+'','ok');
      promptCohortSwitch(_inv);
    }
  }
  // Show student verification banner if unverified student plan
  if(SUB.studentPlan && !SUB.studentVerified) setTimeout(showStudentVerifyBanner, 500);
  // Load real users from Firestore (replaces fake MOCK_FRIENDS)
  loadRealUsers().then(()=>{ if(currentTab==='today'||currentTab==='feed'||currentTab==='explore') renderTab(); });
  setTimeout(writeUserProfile, 1200);
  setTimeout(backfillLongestStreak, 2000);
  setTimeout(checkStudyNudge, 1800);
  startBackgroundSync();
}

function _showRestoreLoader(){
  if(document.getElementById('restore-loader')) return;
  const d=document.createElement('div');
  d.id='restore-loader';
  d.style.cssText='position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);z-index:9999';
  d.innerHTML='<div style="font-size:15px;font-weight:700;color:var(--txt)">Syncing your account…</div><div style="font-size:12px;color:var(--mut);margin-top:6px">Just a moment</div>';
  // Only show it if the sync is actually slow — avoids a flash on every load.
  d.style.opacity='0'; setTimeout(()=>{ d.style.opacity='1'; },400);
  document.body.appendChild(d);
}
function _hideRestoreLoader(){ document.getElementById('restore-loader')?.remove(); }

// Shown when we know who the user is but can reach neither a local nor a cloud
// copy of their data. Never route this case to onboarding.
function renderCloudUnavailable(){
  const root=document.getElementById('root');
  root.innerHTML='<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;background:var(--bg);color:var(--txt)">'+
    '<div style="font-size:20px;font-weight:800">We couldn\'t load your account</div>'+
    '<div style="font-size:14px;color:var(--sub);max-width:380px;line-height:1.6">Ledger couldn\'t reach its servers to load your study data. Your data is safe. Check your connection and try again.</div>'+
    '<button class="btn btn-primary" onclick="location.reload()">Try again</button>'+
    '<button class="btn btn-ghost btn-sm" onclick="signOut()">Sign out</button>'+
  '</div>';
}

// Subscription tier comes from Firestore (written only by the Stripe webhook).
// The local cache is tagged with the uid so one account's tier never leaks to
// another on a shared device; if the read fails we keep the cache for the SAME
// user rather than silently downgrading a paying customer who is offline.
async function loadSubFromCloud(uid){
  const FREE={tier:'free',billingCycle:'monthly',startDate:null,trialUsed:false,studentVerified:false};
  if(!SUB || SUB._uid!==uid){ SUB={...FREE,_uid:uid}; saveSub(SUB); }
  try{
    if(!firebaseDb) return;
    const userDoc = await firebaseDb.collection('users').doc(uid).get();
    const fsub = userDoc.exists ? userDoc.data().sub : null;
    SUB = (fsub && fsub.tier) ? {...FREE,...fsub,_uid:uid} : {...FREE,_uid:uid,trialUsed:!!(fsub&&fsub.trialUsed)};
    saveSub(SUB);
  }catch(e){ console.warn('[Ledger] subscription sync failed:',e.code||e.message); }
}

function init(){
  // Handle invite URL params
  const _p=new URLSearchParams(window.location.search);
  const urlJoinCode=_p.get('join');
  if(urlJoinCode && urlJoinCode.replace(/[^A-Za-z0-9]/g,'')){
    // Everything in an invite link is attacker-controllable: constrain the code
    // to its real alphabet and make the display strings inert. (URLSearchParams
    // has already percent-decoded these; decoding again threw on a literal "%"
    // and stopped the whole app from loading.)
    const _code=urlJoinCode.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,24);
    const fromName=safeText(_p.get('from')||'').slice(0,60);
    const fromUid=(_p.get('uid')||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,128);
    const firmName=safeText(_p.get('fn')||'').slice(0,60);
    _pendingInvite={code:_code,fromName,fromUid,firmName};
    _savePendingInvite(_pendingInvite); // survive the OAuth redirect
    // Top of the referral funnel: the link was opened. Pairs with 'invite_shared'
    // on the sender's side and 'cohort_joined' if they make it through signup.
    logLedgerEvent('invite_opened',{has_inviter:!!fromUid,has_firm:!!firmName});
    if(obData){obData.firmCode=_code;if(firmName&&!obData.firmName)obData.firmName=firmName;}
    if(S&&!S.firmCode){S.firmCode=_code;if(firmName&&!S.firmName)S.firmName=firmName;saveState();}
    history.replaceState({},'',window.location.pathname);
  }

  const isNative = !!(window.Capacitor?.isNativePlatform?.() || window.Capacitor?.platform);

  if(FIREBASE_ENABLED){
    _showSplash();
    initFirebase();
    // Handle any pending redirect sign-in result (fallback path for popup-blocked browsers).
    // Must be called before onAuthStateChanged so errors surface correctly.
    (async function(){
      try{
        const rr = await firebaseAuth.getRedirectResult();
        if(rr && rr.user){
          // Redirect auth succeeded — _processGoogleUser handles UI; onAuthStateChanged
          // will also fire with the user so no manual call needed here.
          logLedgerEvent('login',{method:'google_redirect'});
        }
      }catch(e){
        if(e.code && e.code !== 'auth/no-current-user'){
          _hideSplash();
          showToast('Google sign-in failed: '+(e.message||e.code),'err');
        }
      }
    })();
    // If the Firebase SDK failed to load (flaky network / blocked CDN), don't die on a
    // black splash screen — fall back to the cached local session.
    if(!firebaseAuth){
      _hideSplash();
      const cachedAuth=loadAuth();
      if(cachedAuth){ AUTH=cachedAuth; if(!S) S=loadState(AUTH.uid)||null; }
      if(AUTH&&S) renderApp(); else renderAuth();
      showToast('Couldn\'t reach Ledger servers — working offline from your last session.','info');
      return;
    }
    // onAuthStateChanged fires once on load — single source of truth for auth state
    const unsub = firebaseAuth.onAuthStateChanged(async user => {
      unsub(); // only need first event
      _hideSplash();
      // If on /login or /signup and already logged in, redirect to app
      if(user && window._forceAuth){
        window._forceAuth = false;
        history.replaceState({},'','/');
      }
      // If on /login or /signup and NOT logged in, show auth then redirect after
      if(!user && window._forceAuth){
        window._forceAuth = false;
        window._postAuthRedirect = '/';
        renderAuth(); return;
      }
      if(user){
        const isEmailUser = user.providerData.some(p=>p.providerId==='password');
        if(isEmailUser && !user.emailVerified){ renderAuth(); return; }
        await enterSignedIn(user);
      } else {
        AUTH=null;
        renderAuth();
      }
    });
    // Fallback — if Firebase takes too long (offline), fall through after 4s
    setTimeout(()=>{
      if(document.getElementById('splash-screen')){
        _hideSplash();
        if(!AUTH){ renderAuth(); return; }
        if(!S) S=loadState(AUTH.uid)||null;
        if(!S){ renderCloudUnavailable(); return; }
        renderApp();
      }
    }, 4000);
  } else {
    // Demo mode — use localStorage directly
    if(!AUTH){ renderAuth(); return; }
    if(!S){ renderOnboarding(); return; }
    renderApp();
  }
}

function _showSplash(){
  const root = document.getElementById('root');
  root.innerHTML = `<div id="splash-screen" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(155deg,#0a0805,#15100b,#1c1510);gap:20px">
    <svg width="72" height="72" viewBox="0 0 180 180" style="border-radius:18px">
      <rect width="180" height="180" fill="#18103a"/>
      <rect x="26" y="55" width="128" height="5" rx="2.5" fill="#fff" opacity=".15"/>
      <rect x="26" y="80" width="128" height="5" rx="2.5" fill="#fff" opacity=".15"/>
      <rect x="26" y="105" width="128" height="5" rx="2.5" fill="#fff" opacity=".15"/>
      <rect x="26" y="130" width="128" height="5" rx="2.5" fill="#fff" opacity=".15"/>
      <rect x="34" y="40" width="26" height="96" rx="6" fill="#fff"/>
      <rect x="34" y="116" width="82" height="26" rx="6" fill="#fff"/>
      <circle cx="142" cy="44" r="13" fill="#d44000"/>
    </svg>
    <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-.02em">Ledger</div>
    <div style="display:flex;gap:6px">
      <div style="width:6px;height:6px;border-radius:50%;background:#d44000;animation:ledger-dot 1.2s ease-in-out infinite"></div>
      <div style="width:6px;height:6px;border-radius:50%;background:#d44000;animation:ledger-dot 1.2s ease-in-out .2s infinite"></div>
      <div style="width:6px;height:6px;border-radius:50%;background:#d44000;animation:ledger-dot 1.2s ease-in-out .4s infinite"></div>
    </div>
  </div>`;
}
function _hideSplash(){
  const s = document.getElementById('splash-screen');
  if(s) s.remove();
}

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════
let authMode = 'signin'; // 'signin' | 'signup'
let authEmailInput = '';

function renderAuth(){
  history.pushState({view:'auth'},'','/login');
  document.title='Sign In — Ledger';
  document.body.classList.add('no-app-nav');
  applyTheme();
  // Invite landing experience: personalize the whole auth screen when arriving via a friend's link.
  const _inv=_getPendingInvite();
  const _invName=_inv&&_inv.fromName?_inv.fromName:'';
  if(_invName&&authMode==='signin')authMode='signup'; // invited visitors are new users — default to Create Account
  const _invInitials=_invName?_invName.trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase():'';
  document.getElementById('root').innerHTML=`
<div class="auth-wrap">
  <!-- LEFT PANEL — brand + features -->
  <div class="auth-left">
    <div class="auth-left-inner">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><svg width="42" height="42" viewBox="0 0 180 180" style="border-radius:10px;flex-shrink:0"><rect width="180" height="180" fill="#18103a"/><rect x="26" y="55" width="128" height="5" rx="2.5" fill="#fff" opacity=".15"/><rect x="26" y="80" width="128" height="5" rx="2.5" fill="#fff" opacity=".15"/><rect x="26" y="105" width="128" height="5" rx="2.5" fill="#fff" opacity=".15"/><rect x="26" y="130" width="128" height="5" rx="2.5" fill="#fff" opacity=".15"/><rect x="34" y="40" width="26" height="96" rx="6" fill="#fff"/><rect x="34" y="116" width="82" height="26" rx="6" fill="#fff"/><circle cx="142" cy="44" r="13" fill="#d44000"/></svg><div class="auth-brand">Ledger</div></div>
      ${_invName?`
      <div style="display:flex;align-items:center;gap:13px;margin-bottom:18px">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#d44000,#ff6a2b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0;box-shadow:0 4px 14px rgba(212,64,0,.4)">${esc(_invInitials)}</div>
        <div><div style="font-size:13px;color:rgba(255,255,255,.55);font-weight:600">${esc(_invName)} invited you</div><div style="font-size:15px;color:#fff;font-weight:700;letter-spacing:-.01em">Study toward the CPA together</div></div>
      </div>
      <div style="font-size:26px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-.02em;margin-bottom:10px">You don't have to<br>grind the CPA alone.</div>
      <div class="auth-brand-sub" style="margin-bottom:24px">${esc(_invName)} is on Ledger tracking their pace, streaks, and study hours. Join their circle and keep each other on track.</div>`:`
      <div style="font-size:26px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-.02em;margin-bottom:10px">Know exactly if you're<br>on pace to pass the CPA.</div>
      <div class="auth-brand-sub" style="margin-bottom:24px">Most candidates fail because they don't know they're behind until it's too late. Ledger fixes that.</div>`}

      <div class="auth-feature">
        <div class="auth-feature-icon">${ico('barChart')}</div>
        <div class="auth-feature-text">
          <strong>Pacing Dashboard</strong>
          <span>See exactly how many hours per week you need — and whether you're hitting it. No guesswork, no falling behind.</span>
        </div>
      </div>
      <div class="auth-feature">
        <div class="auth-feature-icon">${ico('handshake')}</div>
        <div class="auth-feature-text">
          <strong>Study Circle</strong>
          <span>See your friends grinding toward the same goal. Log sessions together, give kudos, and hold each other accountable.</span>
        </div>
      </div>
      <div class="auth-feature">
        <div class="auth-feature-icon">${ico('flame')}</div>
        <div class="auth-feature-text">
          <strong>Streaks & Accountability</strong>
          <span>Daily streaks and a live study feed keep you showing up — even on the hard days.</span>
        </div>
      </div>
      <div class="auth-feature">
        <div class="auth-feature-icon">${ico('calendar')}</div>
        <div class="auth-feature-text">
          <strong>AI Study Plan</strong>
          <span>Enter your exam date and get a day-by-day schedule built around your life and current hours.</span>
        </div>
      </div>

      <div class="auth-social-proof">
        Built for CPA candidates who take passing seriously &nbsp;·&nbsp; Free to start
      </div>
    </div>
  </div>

  <!-- RIGHT PANEL — auth form -->
  <div class="auth-right">
    <div class="auth-right-logo" style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div style="display:flex;align-items:center;gap:8px"><svg width="26" height="26" viewBox="0 0 180 180" style="border-radius:6px;flex-shrink:0"><rect width="180" height="180" fill="#18103a"/><rect x="26" y="55" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="80" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="105" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="130" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="34" y="40" width="26" height="96" rx="6" fill="#fff"/><rect x="34" y="116" width="82" height="26" rx="6" fill="#fff"/><circle cx="142" cy="44" r="13" fill="#d44000"/></svg>Ledger</div><a href="/landing" style="font-family:var(--font);font-style:normal;font-size:12px;color:var(--mut);text-decoration:none;font-weight:600;padding:6px 10px;border-radius:7px;border:1px solid var(--bdr);background:var(--surf2);transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s" onmouseover="this.style.color='var(--txt)';this.style.borderColor='var(--bdr2)'" onmouseout="this.style.color='var(--mut)';this.style.borderColor='var(--bdr)'">← Home</a></div>
    ${_invName?`<div style="display:flex;align-items:center;gap:10px;background:var(--ora-bg);border:1px solid var(--ora-bdr);border-radius:10px;padding:12px 14px;margin-bottom:18px">
      <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#d44000,#ff6a2b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0">${esc(_invInitials)}</div>
      <div><div style="font-size:13px;font-weight:700;color:var(--txt)">${esc(_invName)} invited you to study together</div></div>
    </div>`:''}
    <div id="auth-heading" style="margin-bottom:26px">
      <h1 style="font-size:24px;font-weight:800;margin-bottom:5px;letter-spacing:-.03em">${_invName?'Join '+esc(_invName)+'\'s study group':authMode==='signin'?'Welcome back':'Create your account'}</h1>
      <div style="font-size:13.5px;color:var(--sub);line-height:1.5">${_invName?'Create your free account to connect':authMode==='signin'?'Sign in to continue your CPA journey':'Join a focused community grinding toward the CPA'}</div>
    </div>

    <div class="auth-tabs" id="auth-tabs">
      <button class="auth-tab${authMode==='signin'?' active':''}" onclick="switchAuthMode('signin')">Sign In</button>
      <button class="auth-tab${authMode==='signup'?' active':''}" onclick="switchAuthMode('signup')">Create Account</button>
    </div>

    <!-- Google SSO — hidden on native app (Capacitor doesn't support redirect) -->
    <button class="google-btn" onclick="FIREBASE_ENABLED?signInWithGoogle():openGooglePicker()" id="google-signin-btn">
      <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>

    <div id="auth-form-body">
      ${buildAuthForm()}
    </div>

    <div class="auth-terms">
      By continuing, you agree to Ledger's <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.<br>
      ${authMode==='signin'?`Don't have an account? <a href="#" onclick="switchAuthMode('signup');return false">Sign up free →</a>`:`Already have an account? <a href="#" onclick="switchAuthMode('signin');return false">Sign in →</a>`}
    </div>
  </div>
</div>

<!-- Google Account Picker Overlay -->
<div class="modal-overlay" id="google-picker-overlay" onclick="if(event.target===this)closeGooglePicker()">
  <div class="google-picker" onclick="event.stopPropagation()">
    <div class="google-picker-hdr">
      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      <div>
        <div style="font-size:14px;font-weight:700">Sign in with Google</div>
        <div style="font-size:11px;color:var(--mut)">Choose or add an account</div>
      </div>
    </div>
    <div class="google-picker-accounts" id="google-accounts-list">
      <!-- accounts injected by JS -->
    </div>
    <div class="google-picker-footer" id="google-picker-footer">
      <!-- add account section -->
    </div>
  </div>
</div>`;
  renderGooglePickerAccounts();
}

function buildAuthForm(){
  const _bInv=_getPendingInvite();
  const _bInvName=_bInv&&_bInv.fromName?_bInv.fromName:'';
  if(authMode==='signup'){
    return`
<div class="form-grp">
  <label>Full Name</label>
  <input id="auth-name" type="text" placeholder="e.g. Tyler Williams" autocomplete="name">
</div>
<div class="form-grp">
  <label>Email Address</label>
  <input id="auth-email" type="email" placeholder="you@email.com" autocomplete="email">
</div>
<div class="form-grp">
  <label>Password</label>
  <input id="auth-pass" type="password" placeholder="Min. 8 characters" autocomplete="new-password">
</div>
<button class="auth-form-btn" onclick="handleEmailAuth()">${_bInvName?'Create Account &amp; Join '+esc(_bInvName).split(' ')[0]+' →':'Create Account →'}</button>`;
  } else {
    return`
<div class="form-grp">
  <label>Email Address</label>
  <input id="auth-email" type="email" placeholder="you@email.com" autocomplete="email">
</div>
<div class="form-grp">
  <label>Password</label>
  <input id="auth-pass" type="password" placeholder="Your password" autocomplete="current-password">
</div>
<div style="text-align:right;margin-top:-8px;margin-bottom:14px"><a href="#" style="font-size:12px" onclick="handleForgotPassword();return false">Forgot password?</a></div>
<button class="auth-form-btn" onclick="handleEmailAuth()">Sign In →</button>`;
  }
}

function switchAuthMode(mode){
  authMode=mode;
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active',(i===0&&mode==='signin')||(i===1&&mode==='signup')));
  const _sInv=_getPendingInvite();
  const _sInvName=_sInv&&_sInv.fromName?_sInv.fromName:'';
  const hdr=document.getElementById('auth-heading');
  if(hdr)hdr.innerHTML=`<div style="font-size:24px;font-weight:800;margin-bottom:5px;letter-spacing:-.03em">${_sInvName?'Join '+esc(_sInvName)+'\'s study group':mode==='signin'?'Welcome back':'Create your account'}</div><div style="font-size:13.5px;color:var(--sub);line-height:1.5">${_sInvName?(mode==='signin'?'Sign in to connect with '+esc(_sInvName):'Create your free account to connect and unlock Pro'):mode==='signin'?'Sign in to continue your CPA journey':'Join a focused community grinding toward the CPA'}</div>`;
  const fb=document.getElementById('auth-form-body');
  if(fb)fb.innerHTML=buildAuthForm();
  const terms=document.querySelector('.auth-terms');
  if(terms)terms.innerHTML=`By continuing you agree to Ledger's <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.<br>${mode==='signin'?`Don't have an account? <a href="#" onclick="switchAuthMode('signup');return false">Sign up free →</a>`:`Already have an account? <a href="#" onclick="switchAuthMode('signin');return false">Sign in →</a>`}`;
}

// Simulated Google accounts stored in localStorage
function getGoogleAccounts(){
  try{const r=localStorage.getItem('pf2:google-accounts');return r?JSON.parse(r):[];}catch{return [];}
}
function saveGoogleAccounts(accounts){localStorage.setItem('pf2:google-accounts',JSON.stringify(accounts));}

function renderGooglePickerAccounts(){
  const accounts=getGoogleAccounts();
  const list=document.getElementById('google-accounts-list');
  const footer=document.getElementById('google-picker-footer');
  if(!list||!footer)return;
  if(accounts.length){
    list.innerHTML=accounts.map((a,i)=>`
    <div class="google-account-row" onclick="selectGoogleAccount(${i})">
      <div class="google-av">${a.displayName.charAt(0).toUpperCase()}</div>
      <div>
        <div style="font-size:13px;font-weight:600">${a.displayName}</div>
        <div style="font-size:11px;color:var(--mut)">${a.email}</div>
      </div>
      <div style="margin-left:auto;font-size:11px;color:var(--ind);font-weight:600">Use →</div>
    </div>`).join('');
  } else {
    list.innerHTML=`<div style="padding:16px 22px;font-size:13px;color:var(--mut)">No saved Google accounts. Add one below.</div>`;
  }
  footer.innerHTML=`
<div style="width:100%">
  <div style="font-size:12px;font-weight:700;color:var(--sub);margin-bottom:10px">Add a Google account</div>
  <div style="display:flex;gap:8px;margin-bottom:8px">
    <input id="g-name-inp" type="text" placeholder="Full name" style="flex:1;padding:8px 11px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;font-size:12px;color:var(--txt);outline:none">
    <input id="g-email-inp" type="email" placeholder="Gmail address" style="flex:1.3;padding:8px 11px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;font-size:12px;color:var(--txt);outline:none">
  </div>
  <button onclick="addGoogleAccount()" style="width:100%;padding:10px;background:var(--ind);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Continue with this account →</button>
  <div style="font-size:10px;color:var(--mut);text-align:center;margin-top:8px">Ledger simulates Google OAuth — no real Google login occurs.</div>
</div>`;
}

function addGoogleAccount(){
  const name=document.getElementById('g-name-inp')?.value?.trim();
  const email=document.getElementById('g-email-inp')?.value?.trim();
  if(!name){showToast('Enter your name','err');return;}
  if(!email||!email.includes('@')){showToast('Enter a valid email','err');return;}
  const accounts=getGoogleAccounts();
  // avoid duplicates
  if(!accounts.find(a=>a.email===email)){
    accounts.push({displayName:name,email,googleId:'g_'+Date.now()});
    saveGoogleAccounts(accounts);
  }
  selectGoogleAccountByEmail(email,name);
}

function selectGoogleAccount(idx){
  const accounts=getGoogleAccounts();
  const a=accounts[idx];if(!a)return;
  selectGoogleAccountByEmail(a.email,a.displayName,a.googleId);
}

function selectGoogleAccountByEmail(email,displayName,googleId){
  const uid=googleId||'g_'+Date.now();
  AUTH={uid,googleId:uid,email,displayName,method:'google',createdAt:Date.now()};
  saveAuth(AUTH);
  closeGooglePicker();
  // Restore this user's saved state (survives signout)
  S = loadState(AUTH.uid) || null;
  // Pre-fill onboarding name
  obData.name=displayName.split(' ')[0]||displayName;
  showToast(`Signed in as ${displayName} ✓`,'ok');
  setTimeout(()=>{if(!S){renderOnboarding();}else{renderApp();}},300);
}

function openGooglePicker(){
  renderGooglePickerAccounts();
  document.getElementById('google-picker-overlay')?.classList.add('open');
  setTimeout(()=>document.getElementById('g-name-inp')?.focus(),80);
}
function closeGooglePicker(){document.getElementById('google-picker-overlay')?.classList.remove('open');}

async function handleEmailAuth(){
  const email=document.getElementById('auth-email')?.value?.trim();
  const pass=document.getElementById('auth-pass')?.value?.trim();
  const name=authMode==='signup'?document.getElementById('auth-name')?.value?.trim():'';
  if(authMode==='signup'&&!name){showToast('Enter your full name','err');return;}
  if(authMode==='signup'&&_badWords(name)) return;
  if(!email||!email.includes('@')){showToast('Enter a valid email address','err');return;}
  if(!pass||pass.length<8){showToast('Password must be at least 8 characters','err');return;}

  // ── Real Firebase path ──────────────────────────────
  if(FIREBASE_ENABLED){
    const btn=document.querySelector('.auth-form-btn');
    const btnLabel=btn?btn.textContent:'';
    if(btn){btn.disabled=true;btn.textContent='Please wait…';}
    try{
      if(authMode==='signup'){
        const result=await signUpWithEmailFirebase(email,pass,name);
        if(result==='verify'){
          renderEmailVerificationScreen(email,false);
        }
        // if false, error toast already shown
      } else {
        const result=await signInWithEmailFirebase(email,pass);
        if(result==='unverified'){
          renderEmailVerificationScreen(email,true);
        } else if(result===true){
          logLedgerEvent('login',{method:'email'});
          await enterSignedIn(firebaseAuth.currentUser);
        }
      }
    } finally {
      // Re-enable the button if we're still on the auth screen (failed login/signup),
      // so a failure never dead-ends the user on a stuck "Please wait…" button.
      // Only restore the ORIGINAL button. The verification screen that replaces
      // the form has its own .auth-form-btn ("Resend Verification Email"), which
      // this used to relabel "Create Account →".
      if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent=btnLabel||(authMode==='signup'?'Create Account →':'Sign In →');}
    }
    return;
  }

  // ── Demo / offline path ─────────────────────────────
  const displayName=authMode==='signup'?name:(email.split('@')[0]);
  const accounts=getGoogleAccounts();
  let existing=accounts.find(a=>a.email===email);
  if(authMode==='signin'&&!existing){showToast('No account with that email — sign up instead','err');return;}
  if(authMode==='signup'&&existing){showToast('An account with that email already exists — sign in instead','err');return;}
  if(authMode==='signup'){
    accounts.push({displayName,email,googleId:'e_'+Date.now()});
    saveGoogleAccounts(accounts);
    existing=accounts[accounts.length-1];
  }
  const uid=existing?.googleId||'e_'+Date.now();
  AUTH={uid,googleId:uid,email,displayName,method:'email',createdAt:Date.now()};
  saveAuth(AUTH);
  // Restore this user's saved state (survives signout)
  S = loadState(AUTH.uid) || null;
  obData.name=displayName.split(' ')[0]||displayName;
  showToast(`${authMode==='signup'?'Account created':'Signed in'} as ${displayName} ✓`,'ok');
  setTimeout(()=>{if(!S){renderOnboarding();}else{renderApp();}},300);
}


function handleForgotPassword(){
  const email=document.getElementById('auth-email')?.value?.trim();
  if(!email||!email.includes('@')){
    // Show inline reset form
    const fb=document.getElementById('auth-form-body');
    if(fb){fb.innerHTML=`
<div style="padding:14px;background:var(--ind-bg);border:1px solid rgba(99,102,241,.2);border-radius:10px;font-size:12px;color:var(--ind);margin-bottom:16px;line-height:1.6">Enter your email address below and we'll send you a link to reset your password.</div>
<div class="form-grp">
  <label>Email Address</label>
  <input id="reset-email" type="email" placeholder="you@email.com" autocomplete="email">
</div>
<button class="auth-form-btn" onclick="submitPasswordReset()">Send Reset Link →</button>
<div style="text-align:center;margin-top:12px"><a href="#" onclick="switchAuthMode('signin');return false" style="font-size:12px;color:var(--sub)">← Back to sign in</a></div>`;
    }
    return;
  }
  submitPasswordResetForEmail(email);
}
function submitPasswordReset(){
  const email=document.getElementById('reset-email')?.value?.trim();
  if(!email||!email.includes('@')){showToast('Enter a valid email address','err');return;}
  submitPasswordResetForEmail(email);
}
function submitPasswordResetForEmail(email){
  if(FIREBASE_ENABLED && firebaseAuth){
    firebaseAuth.sendPasswordResetEmail(email,{url:'https://ledgercpa.app'}).catch(()=>{});
  }
  const fb=document.getElementById('auth-form-body');
  if(fb){fb.innerHTML=`<div style="text-align:center;padding:20px 0">
    <div style="font-size:36px;margin-bottom:12px">${ico('envelope')}</div>
    <div style="font-size:15px;font-weight:700;margin-bottom:6px">Check your inbox</div>
    <div style="font-size:12px;color:var(--sub);line-height:1.7">We sent a reset link to<br><strong>${email}</strong><br>Check your spam folder if you don't see it.</div>
    <a href="#" onclick="switchAuthMode('signin');return false" style="display:inline-block;margin-top:16px;font-size:12px">← Back to sign in</a>
  </div>`;}
}

function renderEmailVerificationScreen(email, isResend){
  // isResend=true means they tried to sign in but email isn't verified yet
  const heading = isResend ? 'Verify your email' : 'Check your inbox';
  const sub = isResend
    ? 'Your account isn\'t verified yet. We sent a new link to'
    : 'We sent a verification link to';
  const fb=document.getElementById('auth-form-body');
  if(!fb) return;
  fb.innerHTML=`
<div style="text-align:center;padding:8px 0 4px">
  <div style="font-size:52px;margin-bottom:14px;line-height:1">${ico('inbox')}</div>
  <div style="font-size:18px;font-weight:800;color:var(--txt);margin-bottom:8px">${heading}</div>
  <div style="font-size:13px;color:var(--sub);line-height:1.7;margin-bottom:6px">${sub}</div>
  <div style="font-size:14px;font-weight:700;color:var(--ora);margin-bottom:18px">${email}</div>
  <div style="font-size:12px;color:var(--mut);line-height:1.7;margin-bottom:24px;padding:12px 16px;background:var(--surf2);border-radius:10px;border:1px solid var(--bdr)">
    Click the link in the email to activate your account.<br>
    Check your spam folder if you don't see it within a minute.
  </div>
  <button class="auth-form-btn" onclick="resendVerificationEmail()" style="margin-bottom:12px">
    Resend Verification Email
  </button>
  <div>
    <a href="#" onclick="switchAuthMode('signin');return false" style="font-size:12px;color:var(--sub)">
      Already verified? Sign in →
    </a>
  </div>
</div>`;
  // Re-send immediately if this is triggered from the sign-in flow
  if(isResend) resendVerificationEmail();
}

async function signOut(){
  if(!confirm('Sign out of Ledger?'))return;
  try{ if(typeof _room!=='undefined'&&_room) leaveRoom(true); }catch(e){}
  if(S) saveState(); // persist latest state under UID key before clearing auth
  // While still signed in: push the last changes, and detach this device so the
  // next person to use this browser doesn't get this account's notifications.
  const _wait=(pr)=>Promise.race([pr,new Promise(r=>setTimeout(r,2500))]).catch(()=>{});
  if(firebaseDb&&AUTH&&AUTH.uid){
    clearTimeout(saveState._t);
    await _wait(writeUserProfile());
    await _wait(firebaseDb.collection('notify').doc(AUTH.uid).update({['tokens.'+_deviceId()]:firebase.firestore.FieldValue.delete()}));
  }
  try{ localStorage.removeItem('ledger-push-on'); }catch(e){}
  // End the Firebase session too — without this a reload signed you straight back in.
  if(FIREBASE_ENABLED&&firebaseAuth){ try{ await firebaseAuth.signOut(); }catch(e){} }
  clearAuth();
  AUTH=null;S=null;
  tsReset();clearInterval(timerInterval);timerInterval=null;
  window._coachChat=[];
  _askLedgerUsage=null;
  _flashcardUsage=null;
  renderAuth();
  showToast('Signed out successfully','info');
}

