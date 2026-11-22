(function(){
  const COOKIE_KEY = 'ledger-cookie-consent';
  var banner = document.getElementById('cookie-banner');
  if(!banner) return;
  var consent = localStorage.getItem(COOKIE_KEY);
  // While the banner is up, pad the page by its height so it can never sit on
  // top of a primary button (it used to cover onboarding's "Continue").
  function pad(){ document.body.style.paddingBottom = banner.style.display==='none' ? '' : banner.offsetHeight+'px'; }
  if(!consent){ banner.style.display = 'flex'; pad(); window.addEventListener('resize', pad); }
  window.dismissCookieBanner = function(accepted){
    try{ localStorage.setItem(COOKIE_KEY, accepted ? 'accepted' : 'declined'); }catch(e){}
    banner.style.display = 'none';
    pad();
    if(accepted && typeof initAnalyticsIfConsented==='function') initAnalyticsIfConsented();
    // Withdrawing consent stops analytics straight away.
    if(!accepted){ try{ if(typeof firebaseAnalytics!=='undefined'&&firebaseAnalytics) firebaseAnalytics.setAnalyticsCollectionEnabled(false); }catch(e){} }
    else { try{ if(typeof firebaseAnalytics!=='undefined'&&firebaseAnalytics) firebaseAnalytics.setAnalyticsCollectionEnabled(true); }catch(e){} }
  };
  window.openCookieSettings = function(){ banner.style.display = 'flex'; pad(); };
})();

/* ── A11Y: keyboard access for elements with onclick handlers ──
   The app renders interactive rows/cards as <div onclick>. Native keyboard
   users can't reach or activate those. This makes any non-native click target
   focusable (role=button + tabindex) and activates it on Enter/Space. A
   MutationObserver re-applies after the app's innerHTML re-renders. */
(function(){
  var NATIVE=/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|OPTION)$/;
  function enhance(el){
    if(!el||el.nodeType!==1||NATIVE.test(el.tagName)) return;
    if(!el.hasAttribute('onclick')) return;
    if(el.hasAttribute('role')||el.hasAttribute('tabindex')) return;
    // Don't make a wrapper focusable if it already contains a native control —
    // avoids nested/duplicate tab stops.
    if(el.querySelector('button,a[href],input,select,textarea')) return;
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
  }
  function scan(root){
    if(!root||root.nodeType!==1) return;
    if(root.hasAttribute&&root.hasAttribute('onclick')) enhance(root);
    if(root.querySelectorAll){
      var n=root.querySelectorAll('[onclick]');
      for(var i=0;i<n.length;i++) enhance(n[i]);
    }
  }
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' '&&e.key!=='Spacebar') return;
    var t=e.target;
    if(!t||t.nodeType!==1||NATIVE.test(t.tagName)) return;
    if(t.getAttribute('role')!=='button'&&!t.hasAttribute('onclick')) return;
    if(t.isContentEditable) return;
    e.preventDefault();
    t.click();
  });
  function init(){
    scan(document.body);
    new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var added=muts[i].addedNodes;
        for(var j=0;j<added.length;j++) scan(added[j]);
      }
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
