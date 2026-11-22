// ═══════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════
let obStep=0;
let obData={name:'',state:'',hoursPerWeek:15,disc:'TCP',sections:['FAR','AUD','REG','TCP'],sectionStatus:{},examDates:{},passed:{},school:'',classYear:'',bio:'',avatar:'🎓',firmCode:'',firmName:'',studyIntensity:'standard'};
function initObData(){obData.name=(AUTH?.displayName||'').split(' ')[0]||'';}
initObData();

// Age gate. The answer sticks on this device so the form can't just be retried
// with a different year (a "neutral age screen", as the FTC's COPPA guidance asks).
function _ageBlocked(){ try{ return localStorage.getItem('ledger-age-block')==='1'; }catch(e){ return false; } }
async function _ageBlock(){
  try{ localStorage.setItem('ledger-age-block','1'); }catch(e){}
  const user=firebaseAuth&&firebaseAuth.currentUser;
  if(user){
    try{ if(firebaseDb) await firebaseDb.collection('users').doc(user.uid).delete(); }catch(e){}
    try{ if(firebaseDb) await firebaseDb.collection('userState').doc(user.uid).delete(); }catch(e){}
    try{ await user.delete(); }catch(e){}
    try{ await firebaseAuth.signOut(); }catch(e){}
  }
  try{ if(AUTH&&AUTH.uid) localStorage.removeItem(getStateKey(AUTH.uid)); }catch(e){}
  clearAuth(); AUTH=null; S=null; obStep=0; obData.birthYear=undefined;
  _renderAgeBlocked();
}
function _renderAgeBlocked(){
  document.body.classList.add('no-app-nav');
  document.getElementById('root').innerHTML=`
<div class="onboard-wrap"><div class="onboard-box fade-in" style="text-align:center">
  <div class="onboard-logo">Ledger</div>
  <h3 style="margin:18px 0 8px">Sorry, you can’t use Ledger yet</h3>
  <p style="color:var(--sub);font-size:14px;line-height:1.6;margin:0 0 6px">Ledger is for people 13 and older. We didn’t keep any of the information you entered.</p>
  <p style="color:var(--mut);font-size:12px;line-height:1.6;margin:0">Questions? <a href="mailto:support@ledgercpa.app" style="color:var(--ora)">support@ledgercpa.app</a></p>
</div></div>`;
}

async function backToSignIn(){
  // Sign out any partially-created auth session so they start fresh
  if(FIREBASE_ENABLED && firebaseAuth){
    try{ await firebaseAuth.signOut(); }catch(e){}
  }
  AUTH=null; S=null; obStep=0;
  renderAuth();
}

// Handle browser back/forward so each view has its own history entry
window.addEventListener('popstate', function(e){
  const view = e.state?.view;
  if(view==='auth') { AUTH=null; S=null; obStep=0; renderAuth(); }
  else if(view==='onboarding') renderOnboarding();
  else if(view==='userProfile' && AUTH && S){ _loadAndRenderProfilePage(e.state.userId); }
  else if(view==='activityPage' && AUTH && S){ _renderActivityPage(e.state.actId); }
  else if(view==='clubPage' && AUTH && S){ _renderClubPage(e.state.clubId); }
  else if(view==='messagesPage' && AUTH && S){
    if(e.state.openConv){ _renderMessagesPage(e.state.openConv); }
    else { _renderMessagesPage(); }
  }
  else if(view==='app' && AUTH && S){ renderApp(); if(e.state?.fromTab)switchTab(e.state.fromTab); }
  else if(AUTH && S){ renderApp(); }
  else if(!AUTH) renderAuth();
});

function renderOnboarding(){
  if(_ageBlocked()){ _ageBlock(); return; }
  if(!obData.name&&AUTH?.displayName){initObData();}
  history.pushState({view:'onboarding'},'','/signup');
  document.title='Create Account — Ledger';
  document.body.classList.add('no-app-nav');
  applyTheme();
  document.getElementById('root').innerHTML=`
<div class="onboard-wrap">
  <div class="onboard-box fade-in">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div class="onboard-logo">Ledger</div>
      <button onclick="backToSignIn()" style="font-size:12px;color:var(--mut);background:var(--surf2);border:1px solid var(--bdr);border-radius:7px;padding:6px 12px;cursor:pointer;font-weight:600;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s" onmouseover="this.style.color='var(--txt)';this.style.borderColor='var(--bdr2)'" onmouseout="this.style.color='var(--mut)';this.style.borderColor='var(--bdr)'">← Back to sign in</button>
    </div>
    ${_pendingInvite?.fromName?`<div style="display:flex;align-items:center;gap:10px;background:var(--ind-bg);border:1px solid rgba(90,95,207,.25);border-radius:10px;padding:11px 14px;margin-bottom:14px;text-align:left"><div style="width:30px;height:30px;border-radius:50%;background:var(--ind);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">${esc(_pendingInvite.fromName).slice(0,2).toUpperCase()}</div><div style="font-size:12px;color:var(--ind);font-weight:600">${esc(_pendingInvite.fromName)} invited you — you'll be connected once you finish setup</div></div>`:''}
    ${AUTH?`<div style="display:inline-flex;align-items:center;gap:8px;background:var(--grn-bg);border:1px solid #a7f3d0;border-radius:8px;padding:7px 12px;margin-bottom:12px;font-size:12px;color:var(--grn);font-weight:600"><div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#4285f4,#34a853);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:800">${(AUTH.displayName||'?').charAt(0).toUpperCase()}</div>Signed in as ${AUTH.email}</div>`:''}
    <div class="onboard-sub">Tell us about yourself so we can build your personalized CPA study plan.</div>
    <div class="steps">
      ${[0,1,2,3].map(i=>`<div class="step-dot${i<=obStep?' done':''}"></div>`).join('')}
    </div>
    ${obStep===0?renderObStep0():obStep===1?renderObStep1():obStep===2?renderObStep2():renderObStep3()}
  </div>
</div>`;
  attachObHandlers();
}

function renderObStep0(){
  return`
<div class="ob-card">
  <div style="display:flex;align-items:flex-start;gap:9px;background:var(--ind-bg);border:1px solid rgba(90,95,207,.2);border-radius:10px;padding:10px 13px;margin-bottom:16px;font-size:12px;color:var(--sub);line-height:1.5">
    <span style="flex-shrink:0">${ico('book')}</span>
    <span><strong style="color:var(--ind)">Already using Becker, Ninja, or Roger?</strong> Keep it. Ledger is the layer on top — the tracker, community, and coach your course doesn't have.</span>
  </div>
  <h3>Tell us about yourself</h3>
  <div class="form-row">
    <div class="form-grp">
      <label>Your Name</label>
      <input id="ob-name" type="text" maxlength="50" placeholder="e.g. Tyler" value="${esc(obData.name||'')}" autocomplete="given-name">
    </div>
    <div class="form-grp">
      <label for="ob-birthyear">Year You Were Born</label>
      <select id="ob-birthyear">
        <option value="">Select year…</option>
        ${(()=>{const y=new Date().getFullYear();let o='';for(let i=y;i>=y-90;i--)o+=`<option value="${i}"${obData.birthYear===i?' selected':''}>${i}</option>`;return o;})()}
      </select>
    </div>
    <div class="form-grp">
      <label>Licensing State</label>
      <select id="ob-state">
        <option value="">Select state…</option>
        ${['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s=>`<option value="${s}"${obData.state===s?' selected':''}>${s}</option>`).join('')}
      </select>
    </div>
  </div>
  <div class="form-grp">
    <label>Weekly study hours available</label>
    <select id="ob-hrs">
      <option value="5">~5 hrs/week (part-time, slow build)</option>
      <option value="10"${obData.hoursPerWeek===10?' selected':''}>~10 hrs/week (typical)</option>
      <option value="15"${obData.hoursPerWeek===15?' selected':''}>~15 hrs/week (focused)</option>
      <option value="20"${obData.hoursPerWeek===20?' selected':''}>~20 hrs/week (intensive)</option>
      <option value="30">~30 hrs/week (full-time prep)</option>
    </select>
  </div>
  <div class="form-row">
    <div class="form-grp">
      <label>School / University</label>
      <input id="ob-school" type="text" placeholder="e.g. University of Texas">
    </div>
    <div class="form-grp">
      <label>Class Year</label>
      <select id="ob-classyear">
        <option value="">Select year…</option>
        <option value="Freshman">Freshman</option>
        <option value="Sophomore">Sophomore</option>
        <option value="Junior">Junior</option>
        <option value="Senior">Senior</option>
        <option value="Graduate">Graduate Student</option>
        <option value="Alumni">Alumni</option>
        <option value="Working">Working Professional</option>
      </select>
    </div>
  </div>
  <div class="form-grp">
    <label>Bio <span style="color:var(--mut);font-weight:400">(optional)</span></label>
    <input id="ob-bio" type="text" placeholder="e.g. Big 4 associate grinding toward CPA">
  </div>
  <div class="form-grp" style="margin-bottom:0">
    <label>Study Intensity <span style="color:var(--mut);font-weight:400">— sets your hour goals per section</span></label>
    <div style="display:flex;gap:8px">
      ${['fast','standard','thorough'].map(k=>{const p=HOUR_GOAL_PRESETS[k];return`<button type="button" id="ob-intensity-${k}" onclick="obSetIntensity('${k}')" style="flex:1;padding:10px 6px;border-radius:10px;border:2px solid ${k==='standard'?'var(--ora)':'var(--bdr)'};background:${k==='standard'?'var(--ora-bg)':'var(--surf2)'};cursor:pointer;text-align:center;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s">
        <div style="font-size:12px;font-weight:800;color:${k==='standard'?'var(--ora)':'var(--txt)'};margin-bottom:2px">${p.label}</div>
        <div style="font-size:10px;color:var(--mut);line-height:1.4">${p.tag}</div>
      </button>`;}).join('')}
    </div>
    <div id="ob-intensity-desc" style="margin-top:8px;font-size:11px;color:var(--sub);background:var(--surf2);border-radius:8px;padding:8px 11px;line-height:1.55">${HOUR_GOAL_PRESETS.standard.desc}</div>
  </div>
</div>
<button class="ob-big-btn" onclick="obNext()">Continue →</button>`;
}

function renderObStep1(){
  const colors={BAR:'#d97706',ISC:'#9333ea',TCP:'#0d9488'};
  return`
<div class="ob-card">
  <h3>Choose your discipline section <span style="font-size:11px;color:var(--mut);font-weight:400">(choose 1 — required)</span></h3>
  <div class="disc-opts">
    ${['BAR','ISC','TCP'].map(d=>`
    <div class="disc-opt${obData.disc===d?' sel':''}" data-disc="${d}">
      <div class="disc-code" style="color:${colors[d]}">${d}</div>
      <div class="disc-name">${EXAMS[d].full}</div>
      <div class="disc-rate" style="color:${colors[d]}">${EXAMS[d].passRate}% pass rate</div>
    </div>`).join('')}
  </div>
  <div style="margin-top:12px;padding:11px 13px;background:var(--surf2);border-radius:9px;font-size:11px;color:var(--mut);line-height:1.65">
    <strong style="color:var(--sub)">How to choose:</strong> Tax path → <strong style="color:var(--tcp)">TCP</strong>. Audit/IT path → <strong style="color:var(--isc)">ISC</strong>. Financial reporting/advisory → <strong style="color:var(--bar)">BAR</strong>. Most Big 4 tax candidates choose TCP (highest pass rate).
  </div>
</div>
<button class="ob-btn-back btn btn-ghost" onclick="obBack()" style="margin-right:8px">← Back</button>
<button class="ob-big-btn" style="width:auto;display:inline-block;padding:14px 36px" onclick="obNext()">Continue →</button>`;
}

// Step 7 — personalized section-order recommendation. CPA advice, tuned to the
// user's discipline + available time. A high-trust moment right at signup.
function recommendSectionOrder(disc, classYear, hoursPerWeek){
  disc = disc || 'TCP';
  const lowTime = (hoursPerWeek || 15) <= 10;
  const working = /Professional|Alumni/i.test(classYear || '');
  let order, reason;
  if(disc==='TCP'){
    if(lowTime || working){
      order=['REG','FAR','AUD','TCP'];
      reason='With a lighter weekly schedule, opening with REG gets you an early win and momentum — its tax foundation flows straight into TCP. You hit FAR, the biggest section, once you’ve found your rhythm.';
    } else {
      order=['FAR','AUD','REG','TCP'];
      reason='FAR builds the foundation everything else leans on. REG and TCP sit back-to-back at the end since they share heavy tax overlap — review once, test twice.';
    }
  } else if(disc==='BAR'){
    order=['FAR','BAR','AUD','REG'];
    reason='BAR builds directly on FAR’s financial reporting, so take them back-to-back while the material is fresh. AUD and REG round it out.';
  } else { // ISC
    order=['FAR','AUD','ISC','REG'];
    reason='AUD and ISC share internal-controls and IT concepts, so pairing them saves review time. FAR leads as your foundation; REG comes last.';
  }
  return {order, reason};
}

function renderObStep2(){
  const rec=recommendSectionOrder(obData.disc,obData.classYear,obData.hoursPerWeek);
  const sections=rec.order;
  const passed=obData.passed||{};
  const remaining=rec.order.filter(s=>!passed[s]);
  return`
<div class="ob-card">
  <h3>Set your target exam dates</h3>
  <div style="font-size:12px;color:var(--sub);margin-bottom:10px;line-height:1.6">Set realistic target dates for each section. We'll calculate your pacing — how many hours/week you need to be ready on time.</div>
  <div style="display:flex;align-items:flex-start;gap:8px;background:var(--grn-bg);border:1px solid #a7f3d0;border-radius:9px;padding:9px 12px;margin-bottom:16px;font-size:11.5px;color:var(--sub);line-height:1.5"><span style="flex-shrink:0">${ico('party')}</span><span><strong style="color:var(--grn)">Already passed a section?</strong> Tap <strong>Passed?</strong> next to it — we'll skip it and build your plan around what's left.</span></div>
  ${remaining.length?`<div style="background:linear-gradient(135deg,var(--ind-bg),var(--pur-bg));border:1px solid rgba(90,95,207,.25);border-radius:11px;padding:14px;margin-bottom:16px;text-align:left">
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--ind);margin-bottom:8px">${remaining.length<rec.order.length?"Recommended order for what's left":'Recommended order for you'}</div>
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:9px">
      ${remaining.map((s,i,arr)=>`<span class="badge badge-${s}" style="font-size:11px">${s}</span>${i<arr.length-1?'<span style="color:var(--mut);font-size:13px;font-weight:700">→</span>':''}`).join('')}
    </div>
    <div style="font-size:11.5px;color:var(--sub);line-height:1.6">${rec.reason}</div>
  </div>`:''}
  ${sections.map(s=>{
    const isPassed=!!passed[s];
    const goal=(function(){const p=HOUR_GOAL_PRESETS[obData.studyIntensity||'standard'];return p?p.goals[s]:EXAMS[s].studyHours;})();
    const meta=isPassed?'<span style="color:var(--grn);font-weight:700">✓ Already passed — skipped in your plan</span>':('~'+goal+' hrs goal · '+EXAMS[s].passRate+'% pass rate');
    const control=isPassed
      ?'<button type="button" onclick="obTogglePassed(\''+s+'\')" style="flex-shrink:0;padding:7px 12px;border-radius:8px;border:1.5px solid var(--grn);background:var(--grn-bg);color:var(--grn);font-size:12px;font-weight:800;cursor:pointer">✓ Passed</button>'
      :'<input type="date" id="date-'+s+'" value="'+(obData.examDates[s]||'')+'" min="'+_ymd(new Date())+'" style="padding:6px 9px;background:var(--surf);border:1px solid var(--bdr);border-radius:7px;color:var(--txt);font-size:12px;outline:none;max-width:118px"><button type="button" onclick="obTogglePassed(\''+s+'\')" title="I already passed this section" style="flex-shrink:0;padding:7px 9px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf);color:var(--mut);font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">Passed?</button>';
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;padding:11px 13px;background:var(--surf2);border-radius:9px;border:1.5px solid '+(isPassed?'var(--grn)':'transparent')+'"><span class="badge badge-'+s+'" style="flex-shrink:0;min-width:46px;justify-content:center">'+s+'</span><div style="flex:1;font-size:12px;color:var(--sub);min-width:0">'+EXAMS[s].full+'<br><span style="color:var(--mut)">'+meta+'</span></div>'+control+'</div>';
  }).join('')}
</div>
<button class="ob-btn-back btn btn-ghost" onclick="obBack()" style="margin-right:8px">← Back</button>
<button class="ob-big-btn" style="width:auto;display:inline-block;padding:14px 36px" onclick="obNext()">Continue →</button>`;
}

function obTogglePassed(s){
  // Preserve any dates typed before the re-render
  ['FAR','AUD','REG',obData.disc].forEach(x=>{const el=document.getElementById('date-'+x);if(el)obData.examDates[x]=el.value||'';});
  if(!obData.passed)obData.passed={};
  obData.passed[s]=!obData.passed[s];
  if(obData.passed[s])obData.examDates[s]='';
  renderOnboarding();
}

function renderObStep3(){
  const inviteCode=obData.firmCode||(obData.firmCode=Math.random().toString(36).slice(2,8).toUpperCase());
  const _invName=encodeURIComponent(obData.name||S?.name||'');
  const _invUid=AUTH?.uid||'';
  const _invFirm=encodeURIComponent(obData.firmName||S?.firmName||'');
  const inviteUrl='https://ledgercpa.app/join?c='+inviteCode+'&from='+_invName+'&uid='+encodeURIComponent(_invUid)+(_invFirm?'&fn='+_invFirm:'');
  return`
<div class="ob-card">
  <h3>Invite your study group</h3>
  <div style="font-size:12px;color:var(--sub);margin-bottom:16px;line-height:1.6">Ledger works best with your cohort. Add a firm or group name and share the invite link — everyone who joins sees each other's progress and can hold each other accountable.</div>
  <div class="form-grp">
    <label>Firm / Group Name <span style="color:var(--mut);font-weight:400">(optional)</span></label>
    <input id="ob-firm" type="text" placeholder="e.g. Deloitte Dallas, Study Squad, Class of 2026" value="${obData.firmName||''}" oninput="obUpdateInviteLink(this.value)">
  </div>
  <div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:16px">
    <button id="ob-invite-send" class="btn btn-ind" style="width:100%;justify-content:center;font-size:14px;padding:13px" onclick="obShareInvite()">Text my invite</button>
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
      <div id="ob-invite-link" style="flex:1;font-size:10.5px;font-weight:600;color:var(--ind);word-break:break-all;background:var(--ind-bg);padding:8px 12px;border-radius:7px;border:1px solid rgba(90,95,207,.2)">${inviteUrl}</div>
      <button id="ob-invite-copy" class="btn btn-ghost btn-sm" style="flex-shrink:0" onclick="navigator.clipboard.writeText(this.dataset.url).then(()=>showToast('Invite link copied!','ok'))" data-url="${inviteUrl}">Copy</button>
    </div>
    <div style="font-size:11px;color:var(--mut);margin-top:8px">Send your crew the link — anyone who joins studies alongside you.</div>
  </div>
</div>
<button class="ob-btn-back btn btn-ghost" onclick="obBack()" style="margin-right:8px">← Back</button>
<button class="ob-big-btn" style="width:auto;display:inline-block;padding:14px 36px" onclick="obFinish()">Build My Plan</button>`;
}

// Keep the displayed invite link in sync with the firm-name field as it's typed.
function obUpdateInviteLink(val){
  obData.firmName=(val||'').trim();
  const code=obData.firmCode||'';
  const _invName=encodeURIComponent(obData.name||S?.name||'');
  const _invUid=AUTH?.uid||'';
  const _invFirm=encodeURIComponent(obData.firmName||'');
  const url='https://ledgercpa.app/join?c='+code+'&from='+_invName+'&uid='+encodeURIComponent(_invUid)+(_invFirm?'&fn='+_invFirm:'');
  const linkEl=document.getElementById('ob-invite-link');
  const copyEl=document.getElementById('ob-invite-copy');
  if(linkEl)linkEl.textContent=url;
  if(copyEl)copyEl.dataset.url=url;
}
// Onboarding-time invite share (builds from obData since S isn't created yet).
function _obInviteUrl(){
  const code=obData.firmCode||'';
  const _invName=encodeURIComponent(obData.name||'');
  const _invUid=AUTH?.uid||'';
  const _invFirm=encodeURIComponent(obData.firmName||'');
  return 'https://ledgercpa.app/join?c='+code+'&from='+_invName+'&uid='+encodeURIComponent(_invUid)+(_invFirm?'&fn='+_invFirm:'');
}
function obShareInvite(){
  const fEl=document.getElementById('ob-firm'); if(fEl)obData.firmName=(fEl.value||'').trim();
  const url=_obInviteUrl();
  const who=obData.name?obData.name+' here — ':'';
  const grp=obData.firmName?('the '+obData.firmName+' study cohort'):'my CPA study cohort';
  const message=who+'join '+grp+' on Ledger. We log study hours together and keep each other on pace '+url;
  shareInvite({url,message});
}

function obSetIntensity(key){
  obData.studyIntensity=key;
  ['fast','standard','thorough'].forEach(k=>{
    const btn=document.getElementById('ob-intensity-'+k);
    if(!btn)return;
    const active=k===key;
    btn.style.borderColor=active?'var(--ora)':'var(--bdr)';
    btn.style.background=active?'var(--ora-bg)':'var(--surf2)';
    btn.querySelector('div').style.color=active?'var(--ora)':'var(--txt)';
  });
  const desc=document.getElementById('ob-intensity-desc');
  if(desc)desc.textContent=HOUR_GOAL_PRESETS[key].desc;
}

function attachObHandlers(){
  document.querySelectorAll('[data-disc]').forEach(el=>{
    el.addEventListener('click',()=>{
      obData.disc=el.dataset.disc;
      obData.sections=['FAR','AUD','REG',el.dataset.disc];
      document.querySelectorAll('[data-disc]').forEach(e=>e.classList.remove('sel'));
      el.classList.add('sel');
    });
  });
}
function selectEmoji(emoji, el){
  obData.avatar = emoji;
  document.querySelectorAll('.emoji-av-opt').forEach(e=>e.style.borderColor='var(--bdr)');
  el.style.borderColor='var(--ora)';
  el.style.background='var(--ora-bg)';
}
function obNext(){
  if(obStep===0){
    const name=(document.getElementById('ob-name')?.value?.trim()||'').slice(0,50);
    const state=document.getElementById('ob-state')?.value;
    const hrs=Math.min(40,Math.max(1,parseInt(document.getElementById('ob-hrs')?.value)||15));
    const by=parseInt(document.getElementById('ob-birthyear')?.value)||0;
    if(!name){showToast('Enter your name','err');return;}
    if(!by){showToast('Select the year you were born','err');return;}
    if(!state){showToast('Select your state','err');return;}
    // Ledger is 13+. Anyone who could be under 13 this year is turned away and
    // nothing about them is kept; the birth year itself is never stored.
    if(new Date().getFullYear()-by<=13){ _ageBlock(); return; }
    obData.birthYear=by;
    if(new Date().getFullYear()-by<18) showToast('You’re under 18, so please make sure a parent or guardian is okay with you using Ledger.','info');
    obData.name=name;obData.state=state;obData.hoursPerWeek=hrs;
    obData.school = (document.getElementById('ob-school')?.value?.trim()||'').slice(0,80);
    obData.classYear = document.getElementById('ob-classyear')?.value||'';
    obData.bio = (document.getElementById('ob-bio')?.value?.trim()||'').slice(0,200);
    if(_badWords(obData.name,obData.school,obData.bio)) return;
    // avatar already set by selectEmoji
    obStep=1;renderOnboarding();
  } else if(obStep===1){
    if(!obData.disc){showToast('Choose a discipline section','err');return;}
    obStep=2;renderOnboarding();
  } else if(obStep===2){
    const sections=['FAR','AUD','REG',obData.disc];
    sections.forEach(s=>{obData.examDates[s]=document.getElementById('date-'+s)?.value||'';});
    obStep=3;renderOnboarding();
  }
}
function obBack(){obStep=Math.max(0,obStep-1);renderOnboarding();}
function obFinish(){
  const sections=['FAR','AUD','REG',obData.disc];
  const examDates=obData.examDates||{};
  sections.forEach(s=>{if(!examDates[s])examDates[s]=document.getElementById('date-'+s)?.value||'';});
  const firmName=document.getElementById('ob-firm')?.value?.trim()||obData.firmName||'';
  if(_badWords(firmName)) return;
  obData.firmName=firmName;
  const passedMap=obData.passed||{};
  const sectionPassed=sections.filter(s=>passedMap[s]);
  sectionPassed.forEach(s=>{examDates[s]='';}); // passed sections need no target date
  const sectionStatus={};
  sections.forEach(s=>{sectionStatus[s]=passedMap[s]?'passed':'planned';});
  const firstActive=sections.find(s=>!passedMap[s]);
  if(firstActive)sectionStatus[firstActive]='studying';
  const _inv=_getPendingInvite(); // from memory or localStorage (survives OAuth redirect)
  const firmCode=(_inv&&_inv.code)||obData.firmCode||(obData.firmCode=Math.random().toString(36).slice(2,8).toUpperCase());
  const intensity=obData.studyIntensity||'standard';
  const preset=HOUR_GOAL_PRESETS[intensity]||HOUR_GOAL_PRESETS.standard;
  const hourGoals={};
  sections.forEach(s=>{hourGoals[s]=preset.goals[s]||EXAMS[s]?.studyHours||150;});
  S={
    name:obData.name,state:obData.state,hoursPerWeek:obData.hoursPerWeek,
    disc:obData.disc,sections,examDates,sectionStatus,
    school:obData.school,classYear:obData.classYear,bio:obData.bio,avatar:obData.avatar,
    activities:[],following:[...((_inv&&_inv.fromUid&&typeof _inv.fromUid==='string'&&_inv.fromUid.length>4)?[_inv.fromUid]:[])],
    achievements:[],sectionPassed,propsGiven:0,clubs:[],
    social:{linkedin:'',facebook:''},
    challenges:[],challengeCompleted:[],customChallenges:[],
    isPrivate:false,pendingRequests:[],followers:[],
    followRequests:[],
    firmCode,firmName,
    studyIntensity:intensity,hourGoals,
    created:Date.now()
  };
  saveState();
  writeUserProfile();
  ensureFirmCohort(); // join the shared firm cohort club if a firm code was set
  // Also write userState directly so cross-device restore works immediately
  if(firebaseDb&&AUTH?.uid){
    pushStateToCloud().catch(e=>console.warn('[Ledger] userState write failed:',e.code,e.message));
  }
  if(_inv&&_inv.fromName){
    showToast(`Welcome! You're connected with ${_inv.fromName}`,'ok');
  } else if(_inv&&_inv.code){
    showToast(`Welcome! You joined the ${firmName||'study'} cohort`,'ok');
  } else {
    showToast(`Welcome to Ledger, ${S.name}!`,'ok');
  }
  // Activation funnel: signup -> onboarding_complete -> first_session_logged.
  // cohort_joined is the payoff for the whole invite chain, so it carries enough
  // to tell an invited join apart from someone typing in a code.
  logLedgerEvent('onboarding_complete',{
    sections:sections.length, intensity, has_exam_date:sections.some(x=>examDates[x]),
    invited:!!(_inv&&_inv.code)
  });
  if(_inv&&_inv.code) logLedgerEvent('cohort_joined',{via:'invite_link',has_inviter:!!(_inv&&_inv.fromUid)});
  else if(obData.firmCode&&firmName) logLedgerEvent('cohort_joined',{via:'created_cohort',has_inviter:false});
  _clearPendingInvite(); // invite consumed
  renderApp();
  refreshRealUsers();
  startBackgroundSync();
  // Show upgrade offer after a short delay so the app renders first
  if(!SUB.trialUsed){ window._firstRunOfferPending=true; setTimeout(showPostOnboardingOffer, 1200); }
}

