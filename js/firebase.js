// ═══════════════════════════════════════════════
// FIREBASE CONFIG — fill in your Firebase project credentials
// https://console.firebase.google.com → Project Settings → Your apps
// ═══════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyASLIcRmTXVAblhb7s_Pk6Q-WWLqpBLDAw",
  authDomain:        "ledger-cpa.firebaseapp.com",
  projectId:         "ledger-cpa",
  storageBucket:     "ledger-cpa.firebasestorage.app",
  messagingSenderId: "945276121037",
  appId:             "1:945276121037:web:5ef71ad06a9b3e2c1f5e84",
  measurementId:     "G-0PQ50496QD"
};
const FIREBASE_ENABLED = true;

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseAnalytics = null;
function initFirebase(){
  if(!FIREBASE_ENABLED) return;
  try {
    if(!firebase.apps.length) firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    else firebaseApp = firebase.app();
    firebaseAuth = firebase.auth();
    installFirestoreSanitizer();
    try{
      firebaseDb = firebase.firestore();
    }catch(e){
      setTimeout(()=>{ try{ firebaseDb=firebase.firestore(); }catch(e2){} },500);
    }
    // Analytics is opt-in: the cookie banner promises a choice, so nothing is
    // collected unless the visitor pressed Accept.
    initAnalyticsIfConsented();
    // Persist auth across page reloads
    firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    // Auth state changes handled in init() via onAuthStateChanged
  } catch(e){ console.warn('Firebase init failed:', e.message); }
}

// ═══════════════════════════════════════════════
// UNTRUSTED-TEXT BOUNDARY
// Every screen in this app is built by concatenating strings into innerHTML,
// and hundreds of those strings are text other users typed (names, bios, club
// names, captions, comments). Rather than rely on every template remembering
// to escape, text is made inert at the two places it ENTERS the app:
//   1. anything read from Firestore (snapshot.data() is wrapped below), and
//   2. invite-link URL parameters.
// safeText() swaps the characters that can break out of HTML text, an HTML
// attribute, or a quoted JS string inside an inline handler for look-alike
// characters. It is idempotent, so text that is later esc()'d as well still
// displays correctly.
// ═══════════════════════════════════════════════
function safeText(v){
  if(typeof v!=='string') return v;
  return v.replace(/</g,'\u2039').replace(/>/g,'\u203A')
          .replace(/"/g,'\u201D').replace(/'/g,'\u2019').replace(/`/g,'\u2019')
          .replace(/&(?=#|[a-zA-Z][a-zA-Z0-9]*;)/g,'\uFF06') /* only entity-like '&' can decode into a quote */.replace(/\\/g,'\u2044')
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g,'');
}
function deepSafe(v, depth){
  depth=depth||0;
  if(typeof v==='string') return safeText(v);
  if(!v||typeof v!=='object'||depth>8) return v;
  if(Array.isArray(v)) return v.map(x=>deepSafe(x,depth+1));
  // Leave Firestore value types (Timestamp, GeoPoint, references…) alone.
  if(Object.getPrototypeOf(v)!==Object.prototype) return v;
  const out={};
  for(const k of Object.keys(v)) out[safeText(k)]=deepSafe(v[k],depth+1);
  return out;
}
function installFirestoreSanitizer(){
  try{
    // QueryDocumentSnapshot overrides data(), so both classes need wrapping.
    [firebase.firestore.DocumentSnapshot, firebase.firestore.QueryDocumentSnapshot].forEach(cls=>{
      const proto=cls&&cls.prototype;
      if(!proto||Object.prototype.hasOwnProperty.call(proto,'__ledgerSafe')) return;
      const raw=proto.data;
      proto.data=function(){
        const d=raw.apply(this,arguments);
        if(!d) return d;
        const path=(this.ref&&this.ref.path)||'';
        // userState/{uid} is the signed-in user's OWN private blob (a JSON string
        // plus counters) — it must round-trip byte-for-byte.
        if(path.indexOf('userState/')===0) return d;
        return deepSafe(d);
      };
      Object.defineProperty(proto,'__ledgerSafe',{value:true});
    });
    // Document IDs are chosen by whoever creates the document and end up in
    // inline handlers (openClubView('<id>')), so they get the same treatment.
    const base=firebase.firestore.DocumentSnapshot.prototype;
    const desc=Object.getOwnPropertyDescriptor(base,'id');
    if(desc&&desc.get&&desc.configurable){
      Object.defineProperty(base,'id',{configurable:true,enumerable:desc.enumerable,get(){ return safeText(desc.get.call(this)); }});
    }
  }catch(e){ console.warn('[Ledger] Firestore sanitizer not installed:',e.message); }
}

function initAnalyticsIfConsented(){
  if(firebaseAnalytics||!firebaseApp) return;
  let ok=false; try{ ok=localStorage.getItem('ledger-cookie-consent')==='accepted'; }catch(e){}
  if(!ok) return;
  try{ firebaseAnalytics = firebase.analytics(); setLedgerUserProps(); }catch(e){}
}

// Thin wrapper — never throws, safe to call anywhere
function logLedgerEvent(name, params){
  try{ if(firebaseAnalytics) firebaseAnalytics.logEvent(name, params||{}); }catch(e){}
}
// Who someone is, in coarse buckets only (never name, email or uid), so any
// chart can be split by plan, cohort membership or how far along they are.
function setLedgerUserProps(){
  try{
    if(!firebaseAnalytics||typeof S==='undefined'||!S) return;
    const passed=(S.sectionPassed||[]).length;
    const standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
    firebaseAnalytics.setUserProperties({
      plan:(typeof SUB!=='undefined'&&SUB&&SUB.tier)||'free',
      in_cohort:S.firmCode?'yes':'no',
      sections_passed:String(passed),
      following_bucket:(n=>n===0?'0':n<5?'1-4':n<20?'5-19':'20+')((S.following||[]).length),
      installed:standalone?'yes':'no'
    });
  }catch(e){}
}

// Milestone events (first session, week-2 return, onboarding complete) are only
// meaningful the first time they happen. The guard is per-device in localStorage:
// a re-install double-counts, which is the right trade for not needing a server
// round-trip before every log. Key is namespaced per uid so shared devices and
// account switches don't suppress each other's milestones.
function logLedgerEventOnce(name, params){
  const key='pf2-ev-'+name+'-'+((typeof AUTH!=='undefined'&&AUTH&&AUTH.uid)||'anon');
  try{ if(localStorage.getItem(key)) return false; localStorage.setItem(key,'1'); }catch(e){}
  logLedgerEvent(name, params);
  return true;
}

async function signInWithGoogle(){
  if(!FIREBASE_ENABLED){ simulateGoogleSignIn(); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  try {
    // Try popup on all devices — modern mobile browsers support it from a direct tap.
    const result = await firebaseAuth.signInWithPopup(provider);
    await _processGoogleUser(result.user);
  } catch(e){
    if(e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request'){
      // Popup was blocked — fall back to redirect.
      // Reset URL to '/' first so Firebase returns to a safe, always-valid path.
      history.replaceState({},'','/');
      try{ await firebaseAuth.signInWithRedirect(provider); }
      catch(e2){ showToast('Sign-in failed: ' + (e2.message||e2.code),'err'); }
    } else if(e.code !== 'auth/popup-closed-by-user'){
      showToast('Sign-in failed: ' + (e.message||e.code),'err');
    }
  }
}

async function _processGoogleUser(user){
  logLedgerEvent('login', {method:'google'});
  await enterSignedIn(user);
}

async function signInWithEmailFirebase(email, password){
  if(!FIREBASE_ENABLED) return false;
  try {
    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    if(!cred.user.emailVerified){
      // Keep signed in so they can resend, but don't grant app access
      return 'unverified';
    }
    // Check for 2FA before granting access
    let totpSecret = await _fetch2FASecret(cred.user.uid);
    if(!totpSecret) totpSecret = localStorage.getItem('pf2-2fa-secret');
    if(totpSecret && window.OTPAuth){
      const passed = await show2FALoginPrompt(totpSecret);
      if(!passed){ await firebaseAuth.signOut().catch(()=>{}); return false; }
    }
    AUTH = { uid: cred.user.uid, displayName: cred.user.displayName||email.split('@')[0], email, method:'email', created: Date.now() };
    saveAuth(AUTH);
    return true;
  } catch(e){
    const msg = e.code==='auth/wrong-password'||e.code==='auth/invalid-credential' ? 'Incorrect password'
              : e.code==='auth/user-not-found' ? 'No account with that email'
              : e.message;
    showToast(msg,'err');
    return false;
  }
}

async function signUpWithEmailFirebase(email, password, name){
  if(!FIREBASE_ENABLED) return false;
  try {
    const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    // Send verification email — user must verify before accessing the app
    await cred.user.sendEmailVerification({
      url: 'https://ledgercpa.app'
    });
    logLedgerEvent('sign_up', {method:'email'});
    // Don't set AUTH yet — wait for verification
    return 'verify';
  } catch(e){
    showToast(e.code==='auth/email-already-in-use'?'Account already exists — sign in instead':e.message,'err');
    return false;
  }
}

async function resendVerificationEmail(){
  if(!FIREBASE_ENABLED) return;
  try {
    const user = firebaseAuth.currentUser;
    if(!user){ showToast('Please sign in first','err'); return; }
    await user.sendEmailVerification({ url: 'https://ledgercpa.app' });
    showToast('Verification email sent — check your inbox ✓','ok');
  } catch(e){
    showToast('Could not send email: '+e.message,'err');
  }
}

function signOut(){
  if(FIREBASE_ENABLED && firebaseAuth){
    firebaseAuth.signOut().catch(()=>{});
  }
  if(S) saveState(); // persist latest state under UID key before clearing auth
  clearAuth();
  AUTH=null; S=null;
  SUB={tier:'free',billingCycle:'monthly',startDate:null,trialUsed:false,studentVerified:false};
  saveSub(SUB);
  showToast('Signed out','info');
  setTimeout(()=>location.reload(),500);
}

// ═══════════════════════════════════════════════
// TWO-FACTOR AUTHENTICATION (TOTP)
// ═══════════════════════════════════════════════
let _2fa_pending_resolve = null;
let _2fa_login_secret = null;

// The TOTP secret lives in the PRIVATE userState/{uid} doc. It used to be on
// the public users/{uid} profile, readable by every signed-in user; if we still
// find it there we move it across and delete the public copy.
async function _fetch2FASecret(uid){
  if(!firebaseDb||!uid) return null;
  try{
    const priv = await firebaseDb.collection('userState').doc(uid).get();
    if(priv.exists && priv.data().totp_secret) return priv.data().totp_secret;
  }catch(e){}
  try{
    const pub = await firebaseDb.collection('users').doc(uid).get();
    const legacy = pub.exists ? pub.data().totp_secret : null;
    if(legacy){
      await firebaseDb.collection('userState').doc(uid).set({totp_secret:legacy},{merge:true});
      await firebaseDb.collection('users').doc(uid).update({totp_secret:firebase.firestore.FieldValue.delete()}).catch(()=>{});
      return legacy;
    }
  }catch(e){}
  return null;
}
async function get2FASecret(){
  // Check localStorage cache first, then Firestore
  const cached = localStorage.getItem('pf2-2fa-secret');
  if(cached) return cached;
  const secret = await _fetch2FASecret(AUTH?.uid);
  if(secret) localStorage.setItem('pf2-2fa-secret', secret);
  return secret;
}

async function open2FASetupModal(){
  if(!window.OTPAuth){ showToast('Security library loading — try again in a moment','info'); return; }
  // Generate a new TOTP secret
  const secret = new OTPAuth.Secret();
  const secretBase32 = secret.base32;
  const label = encodeURIComponent(AUTH?.email || AUTH?.displayName || 'user');
  const totp = new OTPAuth.TOTP({issuer:'Ledger CPA',label,algorithm:'SHA1',digits:6,period:30,secret});
  const otpUri = totp.toString();
  const qrUrl = _qrDataUrl(otpUri);
  window._2fa_setup_secret = secretBase32;
  let el = document.getElementById('twofa-modal');
  if(!el){
    el = document.createElement('div');
    el.id = 'twofa-modal';
    el.className = 'modal-overlay';
    el.addEventListener('click', e=>{ if(e.target===el) close2FAModal(); });
    document.body.appendChild(el);
  }
  el.innerHTML = `<div class="modal-box" style="max-width:380px">
    <div class="modal-hdr"><span style="font-size:14px;font-weight:800">${LedgerIcon('lock')} Set Up Two-Factor Auth</span><button class="modal-close" onclick="close2FAModal()">${LedgerIcon('x')}</button></div>
    <div style="padding:18px;text-align:center">
      <p style="font-size:12px;color:var(--mut);margin:0 0 14px">Scan this QR code with <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app</p>
      <img src="${qrUrl}" alt="QR code for your authenticator app" style="width:180px;height:180px;border-radius:10px;border:2px solid var(--bdr);margin-bottom:12px">
      <div style="font-size:10px;color:var(--mut);margin-bottom:6px">Or enter the key manually:</div>
      <div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;padding:10px;font-family:monospace;font-size:12px;letter-spacing:.12em;word-break:break-all;margin-bottom:16px;color:var(--txt)">${secretBase32}</div>
      <div style="font-size:12px;color:var(--mut);text-align:left;margin-bottom:8px">Enter the 6-digit code from your app to confirm setup:</div>
      <input type="text" id="2fa-setup-code" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="000 000"
        style="width:100%;padding:12px;text-align:center;font-size:22px;letter-spacing:.25em;border:1.5px solid var(--bdr);border-radius:8px;background:var(--surf2);color:var(--txt);outline:none;box-sizing:border-box;margin-bottom:14px"
        onkeydown="if(event.key==='Enter')verify2FASetup()">
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="close2FAModal()">Cancel</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="verify2FASetup()">Verify & Enable</button>
      </div>
    </div>
  </div>`;
  el.classList.add('open');
  setTimeout(()=>document.getElementById('2fa-setup-code')?.focus(),200);
}

function close2FAModal(){
  document.getElementById('twofa-modal')?.classList.remove('open');
  delete window._2fa_setup_secret;
}

async function verify2FASetup(){
  if(!window.OTPAuth){ showToast('Library not loaded — refresh and try again','err'); return; }
  const code = document.getElementById('2fa-setup-code')?.value?.replace(/\s/g,'');
  if(!code||code.length!==6){ showToast('Enter the 6-digit code from your app','err'); return; }
  const secretBase32 = window._2fa_setup_secret;
  if(!secretBase32){ showToast('Setup session expired — try again','err'); return; }
  try{
    const totp = new OTPAuth.TOTP({algorithm:'SHA1',digits:6,period:30,secret:OTPAuth.Secret.fromBase32(secretBase32)});
    const delta = totp.validate({token:code,window:1});
    if(delta===null){ showToast('Incorrect code — try again','err'); return; }
    // Save secret
    if(firebaseDb&&AUTH?.uid) await firebaseDb.collection('userState').doc(AUTH.uid).set({totp_secret:secretBase32},{merge:true}).catch(()=>{});
    localStorage.setItem('pf2-2fa-secret', secretBase32);
    close2FAModal();
    showToast('Two-factor auth enabled ✓','ok');
    // Refresh security settings if open
    const sec = document.querySelector('[data-settings-sec="security"]');
    if(sec) sec.click();
    else { const body=document.getElementById('settings-body'); if(body&&body.dataset.sec==='security') body.innerHTML=buildSettingsSecurity(); }
  }catch(e){ showToast('Verification failed: '+e.message,'err'); }
}

async function disable2FA(){
  if(!confirm('Disable two-factor authentication? Your account will be less secure.')) return;
  if(firebaseDb&&AUTH?.uid){
    await firebaseDb.collection('userState').doc(AUTH.uid).set({totp_secret:firebase.firestore.FieldValue.delete()},{merge:true}).catch(()=>{});
    await firebaseDb.collection('users').doc(AUTH.uid).update({totp_secret:firebase.firestore.FieldValue.delete()}).catch(()=>{});
  }
  localStorage.removeItem('pf2-2fa-secret');
  showToast('2FA disabled','info');
  // Refresh settings UI
  const body=document.getElementById('settings-body');
  if(body) body.innerHTML=buildSettingsSecurity();
}

function show2FALoginPrompt(secretBase32){
  return new Promise(resolve=>{
    _2fa_pending_resolve = resolve;
    _2fa_login_secret = secretBase32;
    let el = document.getElementById('twofa-modal');
    if(!el){
      el = document.createElement('div');
      el.id = 'twofa-modal';
      el.className = 'modal-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="modal-box" style="max-width:340px">
      <div class="modal-hdr"><span style="font-size:14px;font-weight:800">Two-Factor Authentication</span></div>
      <div style="padding:18px;text-align:center">
        <p style="font-size:13px;color:var(--mut);margin:0 0 16px">Enter the 6-digit code from your authenticator app</p>
        <input type="text" id="2fa-login-code" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="000 000"
          style="width:100%;padding:14px;text-align:center;font-size:26px;letter-spacing:.3em;border:1.5px solid var(--bdr);border-radius:8px;background:var(--surf2);color:var(--txt);outline:none;box-sizing:border-box;margin-bottom:16px"
          onkeydown="if(event.key==='Enter')verify2FALogin()">
        <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="verify2FALogin()">Verify</button>
        <button onclick="cancel2FALogin()" style="margin-top:10px;background:none;border:none;color:var(--mut);font-size:12px;cursor:pointer">Sign out and try a different account</button>
      </div>
    </div>`;
    el.classList.add('open');
    setTimeout(()=>document.getElementById('2fa-login-code')?.focus(),100);
  });
}

async function verify2FALogin(){
  if(!window.OTPAuth){ showToast('Library not loaded — refresh and try again','err'); return; }
  const code = document.getElementById('2fa-login-code')?.value?.replace(/\s/g,'');
  if(!code||code.length!==6){ showToast('Enter the 6-digit code','err'); return; }
  try{
    const totp = new OTPAuth.TOTP({algorithm:'SHA1',digits:6,period:30,secret:OTPAuth.Secret.fromBase32(_2fa_login_secret)});
    const delta = totp.validate({token:code,window:1});
    if(delta===null){ showToast('Incorrect code — try again','err'); return; }
    document.getElementById('twofa-modal')?.classList.remove('open');
    _2fa_login_secret = null;
    const resolve = _2fa_pending_resolve;
    _2fa_pending_resolve = null;
    resolve(true);
  }catch(e){ showToast('Verification failed','err'); }
}

function cancel2FALogin(){
  document.getElementById('twofa-modal')?.classList.remove('open');
  _2fa_login_secret = null;
  const resolve = _2fa_pending_resolve;
  _2fa_pending_resolve = null;
  if(resolve) resolve(false);
  signOut();
}

