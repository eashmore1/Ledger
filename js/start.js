// ═══════════════════════════════════════════════
// START — wait for deferred Firebase/Stripe scripts
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  init();
  registerServiceWorker();
  // Hide Google sign-in on native app — redirect auth doesn't work in Capacitor WebView
  const isNative = window.Capacitor?.isNativePlatform?.() || window.Capacitor?.platform === 'ios' || window.Capacitor?.platform === 'android';
  if(isNative){
    const googleBtn = document.getElementById('google-signin-btn');
    if(googleBtn){
      googleBtn.style.display = 'none';
      // Add a note so users know to use email
      const note = document.createElement('div');
      note.style.cssText = 'font-size:11px;color:var(--mut);text-align:center;margin-bottom:14px';
      note.textContent = 'Use email & password to sign in on the app.';
      googleBtn.parentNode.insertBefore(note, googleBtn.nextSibling);
    }
  }
});
