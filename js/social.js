// ═══════════════════════════════════════════════
// SOCIAL CONNECT
// ═══════════════════════════════════════════════
function openSocialModal(platform){
  const labels={linkedin:{name:'LinkedIn',icon:'in',iconCls:'soc-li',placeholder:'https://linkedin.com/in/yourname'},facebook:{name:'Facebook',icon:'f',iconCls:'soc-fb',placeholder:'https://facebook.com/yourname'}};
  const l=labels[platform];
  if(!S.social)S.social={linkedin:'',facebook:''};
  const current=S.social[platform]||'';
  let el=document.getElementById('social-modal');
  if(!el){
    el=document.createElement('div');
    el.id='social-modal';
    el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:420px"><div class="modal-hdr"><div class="modal-title" id="social-modal-title"></div><button class="modal-close" onclick="closeSocialModal()">×</button></div><div class="modal-body" id="social-modal-body"></div></div>`;
    el.addEventListener('click',e=>{if(e.target===el)closeSocialModal();});
    document.body.appendChild(el);
  }
  document.getElementById('social-modal-title').textContent=`Connect ${l.name}`;
  document.getElementById('social-modal-body').innerHTML=`
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:14px;background:var(--surf2);border-radius:12px">
    <div class="soc-icon ${l.iconCls}" style="width:44px;height:44px;border-radius:12px;font-size:18px">${l.icon}</div>
    <div><div style="font-size:14px;font-weight:700;margin-bottom:2px">Connect ${l.name}</div><div style="font-size:11px;color:var(--sub)">Link your ${l.name} profile to Ledger</div></div>
  </div>
  <div class="form-grp">
    <label>Profile URL</label>
    <input id="social-url-inp" type="url" placeholder="${l.placeholder}" value="${current}" style="width:100%;padding:10px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:9px;color:var(--txt);font-size:13px;outline:none">
  </div>
  <div style="font-size:11px;color:var(--mut);margin-bottom:16px;line-height:1.6">Your profile link lets study partners and recruiters find you on ${l.name}. You can remove it any time.</div>
  <div style="display:flex;gap:8px">
    <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="saveSocialLink('${platform}')">Save</button>
    ${current?`<button class="btn btn-red btn-sm" onclick="removeSocialLink('${platform}')">Disconnect</button>`:''}
  </div>`;
  el.classList.add('open');
  setTimeout(()=>document.getElementById('social-url-inp')?.focus(),60);
}
function closeSocialModal(){document.getElementById('social-modal')?.classList.remove('open');}
function saveSocialLink(platform){
  const url=document.getElementById('social-url-inp')?.value?.trim();
  if(!url){showToast('Enter a profile URL','err');return;}
  if(!url.startsWith('http')){showToast('Enter a valid URL starting with https://','err');return;}
  if(!S.social)S.social={linkedin:'',facebook:''};
  S.social[platform]=url;
  saveState();closeSocialModal();
  showToast(`${platform==='linkedin'?'LinkedIn':'Facebook'} connected! ✓`,'ok');
  renderTab();
}
function removeSocialLink(platform){
  if(!S.social)S.social={linkedin:'',facebook:''};
  S.social[platform]='';
  saveState();closeSocialModal();
  showToast('Disconnected','info');
  renderTab();
}

// How to earn an achievement (and, on your own profile, how close you are).
function showAchInfo(id,setId){
  const a=ACHIEVEMENTS.find(x=>x.id===id); if(!a) return;
  const set=_achSets[setId]||{ids:_achValid(S&&S.achievements),own:true};
  const has=set.ids.includes(id);
  let prog='';
  if(set.own&&!has&&a.goal&&S){
    const [k,n]=a.goal, v=Math.min(_achMetrics()[k]||0,n);
    const unit={sessions:'sessions',hours:'hours',sectionMax:'hours on your top section',streak:'days in a row',passed:'sections passed',follows:'following',followers:'followers',props:'Props given',questions:'questions answered',scores:'scores recorded',clubs:'clubs'}[k]||'';
    prog=`<div style="margin-top:16px;text-align:left">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--sub);margin-bottom:6px"><span>Your progress</span><strong style="color:var(--txt)">${v.toLocaleString()} / ${n.toLocaleString()} ${unit}</strong></div>
      <div class="ach-bar"><div style="width:${Math.round(v/n*100)}%"></div></div></div>`;
  }
  let el=document.getElementById('ach-info');
  if(!el){
    el=document.createElement('div');
    el.id='ach-info'; el.className='modal-overlay'; el.style.zIndex='520';
    el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open');});
    document.body.appendChild(el);
  }
  el.innerHTML=`<div class="modal-box" style="max-width:360px;position:relative;padding:24px 22px 20px;text-align:center" aria-labelledby="ach-info-title">
    <button class="modal-close" onclick="document.getElementById('ach-info').classList.remove('open')" aria-label="Close" style="position:absolute;top:12px;right:12px">×</button>
    <div style="width:64px;height:64px;margin:0 auto 12px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:34px;background:${has?'var(--amb-bg)':'var(--surf2)'};border:1.5px solid ${has?'var(--amb)':'var(--bdr)'};${has?'':'filter:grayscale(1);opacity:.7'}">${LedgerIcon(a.icon)}</div>
    <div id="ach-info-title" style="font-size:17px;font-weight:800">${esc(a.name)}</div>
    <div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;${has?'background:var(--amb-bg);color:var(--amb)':'background:var(--surf2);color:var(--sub)'}">${has?'Earned':'Not earned yet'}</div>
    <div style="margin-top:16px;text-align:left">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--sub);margin-bottom:4px">How to earn it</div>
      <div style="font-size:14px;line-height:1.55;color:var(--txt)">${esc(a.how||a.desc)}</div>
    </div>${prog}
  </div>`;
  el.classList.add('open');
}

// ═══════════════════════════════════════════════
// FOLLOWERS / FOLLOWING MODAL
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// ELITE FEATURES — SUPPORT
// ═══════════════════════════════════════════════
function openSupportModal(){
  // Works for all users; paid (Pro) accounts get the priority label
  let el=document.getElementById('support-modal');
  if(el)el.remove();
  el=document.createElement('div');
  el.id='support-modal';
  el.className='modal-overlay';
  const isEliteUser=isElite();
  el.innerHTML=
    '<div class="modal-box" style="max-width:420px" onclick="event.stopPropagation()">' +
      '<div class="modal-hdr">' +
        '<div class="modal-title">Contact Support</div>' +
        '<button class="modal-close" onclick="document.getElementById(\'support-modal\').classList.remove(\'open\')">×</button>' +
      '</div>' +
      '<div class="modal-body">' +
        (isEliteUser
          ?'<div style="display:flex;align-items:center;gap:10px;background:rgba(147,51,234,.08);border:1px solid rgba(147,51,234,.2);border-radius:10px;padding:11px 14px;margin-bottom:16px"><span style="font-size:20px">'+ico('bolt')+'</span><div style="font-size:12px;color:var(--pur);font-weight:600">Pro members get responses within 2 hours (9am–6pm CT, Mon–Fri)</div></div>'
          :'<div style="font-size:12px;color:var(--sub);margin-bottom:16px;line-height:1.6">We read every message and reply within 1 business day. For bug reports, feature ideas, or anything on your mind.</div>'
        ) +
        '<div class="form-grp" style="margin-bottom:8px"><label>What\'s going on?</label><textarea id="support-msg-ta" style="min-height:100px" placeholder="Describe your issue, question, or feedback…"></textarea></div>' +
        '<div class="form-grp" style="margin-bottom:16px"><label>Your email</label><input type="email" id="support-email-inp" value="'+(AUTH?.email||'')+'" style="width:100%;padding:9px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:9px;color:var(--txt);font-size:13px;outline:none"></div>' +
        '<button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px" onclick="sendSupportMessage()">Send Message</button>' +
        '<div style="font-size:10px;color:var(--mut);text-align:center;margin-top:8px">Or email us directly: support@ledgercpa.app</div>' +
      '</div>' +
    '</div>';
  el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open');});
  document.body.appendChild(el);
  el.classList.add('open');
}

function openPrioritySupport(){
  let el=document.getElementById('support-modal');
  if(el)el.remove();
  el=document.createElement('div');
  el.id='support-modal';
  el.className='modal-overlay';
  el.innerHTML=
    '<div class="modal-box" style="max-width:420px" onclick="event.stopPropagation()">' +
      '<div class="modal-hdr">' +
        '<div class="modal-title">Priority Support</div>' +
        '<button class="modal-close" onclick="document.getElementById(\'support-modal\').classList.remove(\'open\')">×</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div style="display:flex;align-items:center;gap:10px;background:rgba(147,51,234,.08);border:1px solid rgba(147,51,234,.2);border-radius:10px;padding:11px 14px;margin-bottom:16px">' +
          '<span style="font-size:20px">'+ico('bolt')+'</span>' +
          '<div style="font-size:12px;color:var(--pur);font-weight:600">Pro members get responses within 2 hours during business hours (9am–6pm CT, Mon–Fri)</div>' +
        '</div>' +
        '<div class="form-grp" style="margin-bottom:8px"><label>What do you need help with?</label><textarea id="support-msg-ta" style="min-height:100px" placeholder="Describe your issue, bug, or question…"></textarea></div>' +
        '<div class="form-grp" style="margin-bottom:16px"><label>Your email</label><input type="email" id="support-email-inp" value="'+(AUTH?.email||'')+'" style="width:100%;padding:9px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:9px;color:var(--txt);font-size:13px;outline:none"></div>' +
        '<button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px" onclick="sendSupportMessage()">Send Message</button>' +
      '</div>' +
    '</div>';
  el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open');});
  document.body.appendChild(el);
  el.classList.add('open');
}
function sendSupportMessage(){
  const msg=document.getElementById('support-msg-ta')?.value?.trim()||'';
  const email=document.getElementById('support-email-inp')?.value?.trim()||'';
  if(!msg){showToast('Please describe your issue','err');return;}
  // Save to state + open mailto as the real delivery mechanism
  if(!S.supportTickets)S.supportTickets=[];
  S.supportTickets.push({sentAt:new Date().toISOString(),message:msg,email,status:'sent'});
  saveState();
  const subject=encodeURIComponent('[Ledger Pro Support] '+msg.slice(0,60));
  const body=encodeURIComponent('From: '+email+'\n\n'+msg);
  window.location.href='mailto:support@ledgercpa.app?subject='+subject+'&body='+body;
  document.getElementById('support-modal')?.classList.remove('open');
  showToast('Message sent — expect a reply within 2 hours','ok');
}

function setStudyPartner(id){
  if(!isPro()){openUpgradeModal('Study Partner');return;}
  const f=REAL_USERS.find(f=>f.id===id);
  S.accountabilityPartner=id;
  saveState();
  renderTab();
  showToast((f?f.name.split(' ')[0]:'Partner')+' is now your study partner','ok');
}
function removeStudyPartner(){
  S.accountabilityPartner=null;
  saveState();
  renderTab();
}
function pingStudyPartner(partnerId, partnerName){
  const firstName=partnerName.split(' ')[0];
  const msgs=[
    `Hey ${firstName}! Just checking in — how's the studying going?`,
    `Checking in on you! How are your sections coming along?`,
    `Hey! How's the CPA grind treating you this week?`,
  ];
  const msg=msgs[Math.floor(Math.random()*msgs.length)];
  const f=REAL_USERS.find(x=>x.id===partnerId);
  const color=f?.color||'#5a5fcf';
  const initials=f?.initials||partnerName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'??';
  const convId=_convId(AUTH?.uid||'you',partnerId);
  openConversationPage(convId,partnerId,partnerName,color,initials);
  setTimeout(()=>{
    const inp=document.getElementById('dm-inp-'+convId);
    if(inp){inp.value=msg;inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,120)+'px';inp.focus();}
  },400);
}

// Build a follow-row-compatible profile object from a raw Firestore user doc
// (for followers not already loaded into REAL_USERS).
function _followShapeFromDoc(id,u){
  u=u||{};
  const name=u.displayName||u.name||'CPA Candidate';
  const initials=name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'??';
  const colors=['#d44000','#5a5fcf','#0ea574','#9333ea','#0fb5aa'];
  const color=u.color||colors[(name.charCodeAt(0)||0)%colors.length];
  return {id,name,initials,color,state:u.state||'',currentSection:u.currentSection||u.disc||'',streak:u.streak||0,passedSections:u.passedSections||u.sectionPassed||[],bio:u.bio||'',activities:[]};
}

async function openFollowModal(type){
  let el=document.getElementById('follow-modal');
  if(!el){
    el=document.createElement('div');
    el.id='follow-modal';
    el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:420px"><div class="modal-hdr"><div class="modal-title" id="follow-modal-title"></div><button class="modal-close" onclick="closeFollowModal()">×</button></div><div class="modal-body" id="follow-modal-body" style="padding-top:4px"></div></div>`;
    el.addEventListener('click',e=>{if(e.target===el)closeFollowModal();});
    document.body.appendChild(el);
  }
  el.classList.add('open');
  const weekAgo=new Date(Date.now()-7*86400000);
  const titleEl=document.getElementById('follow-modal-title');
  const bodyEl=document.getElementById('follow-modal-body');
  let users;
  if(type==='followers'){
    // Followers live in the Firestore subcollection users/{uid}/followers (source of
    // truth, matches the profile count) — NOT the local S.followers array, which is
    // never updated when someone else follows you.
    titleEl.textContent='Followers';
    bodyEl.innerHTML='<div style="text-align:center;padding:32px;color:var(--mut);font-size:13px">Loading…</div>';
    try{
      let ids=[];
      if(firebaseDb&&AUTH?.uid){
        const snap=await firebaseDb.collection('users').doc(AUTH.uid).collection('followers').get();
        ids=snap.docs.map(d=>d.id).filter(id=>id&&id!==AUTH.uid);
      }
      titleEl.textContent=`Followers (${ids.length})`;
      const resolved=await Promise.all(ids.map(async id=>{
        const known=REAL_USERS.find(u=>u.id===id);
        if(known) return known;
        try{
          const doc=await firebaseDb.collection('users').doc(id).get();
          return doc.exists?_followShapeFromDoc(id,doc.data()):null;
        }catch(e){ return null; }
      }));
      users=resolved.filter(Boolean);
    }catch(e){
      bodyEl.innerHTML='<div class="empty-state" style="padding:24px 0"><div class="empty-msg">Could not load followers. Try again.</div></div>';
      return;
    }
  } else {
    users=REAL_USERS.filter(f=>(S.following||[]).includes(f.id));
    titleEl.textContent=`Following (${(S.following||[]).filter(id=>id&&id.length>4).length})`;
  }
  const rows=users.map(f=>{
    const isFollowing=(S.following||[]).includes(f.id);
    const wHrs=f.activities.filter(a=>new Date(a.date)>weekAgo).reduce((a,b)=>a+(b.hours||0),0);
    return`<div class="fol-user-row" onclick="closeFollowModal();openUserProfile('${f.id}')">
      <div class="avatar av-md" style="background:${f.color};color:#fff">${f.initials}</div>
      <div class="fol-user-meta">
        <div class="fol-user-name">${f.name} ${f.passedSections.length===4?ico('trophy'):''}</div>
        <div class="fol-user-sub">${f.state} · ${f.currentSection||'CPA ✓'} · ${ico('flame')}${f.streak}d · ${wHrs.toFixed(1)}h this week</div>
        ${f.bio?`<div style="font-size:10px;color:var(--mut);margin-top:2px;font-style:italic">"${f.bio}"</div>`:''}
      </div>
      <button class="follow-btn${isFollowing?' following':''}" onclick="event.stopPropagation();toggleFollow('${f.id}',this);this.textContent=((S.following||[]).includes('${f.id}')?'Following':'Follow');this.className='follow-btn'+((S.following||[]).includes('${f.id}')?' following':'')">${isFollowing?'Following':'Follow'}</button>
    </div>`;
  }).join('');
  bodyEl.innerHTML=users.length?rows:`<div class="empty-state" style="padding:24px 0"><div class="empty-icon">${ico('users')}</div><div class="empty-msg">${type==='followers'?'No followers yet — share your profile to get found!':'Not following anyone yet.<br>Go to <strong>Explore</strong> to find fellow candidates.'}</div></div>`;
}
function closeFollowModal(){document.getElementById('follow-modal')?.classList.remove('open');}

function openFollowRequestsModal(){
  let el=document.getElementById('follow-req-modal');
  if(el) el.remove();
  el=document.createElement('div');
  el.id='follow-req-modal';
  el.className='modal-overlay open';
  el.style.cssText='z-index:9999';
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.body.appendChild(el);
  _renderFollowRequestsModal();
}

function _renderFollowRequestsModal(){
  const el=document.getElementById('follow-req-modal');
  if(!el) return;
  const requests=S.followRequests||[];
  const rows=requests.length ? requests.map(r=>`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--bdr)">
      <div class="avatar av-md" style="background:${r.color||'#4f46e5'};color:#fff;flex-shrink:0">${r.initials||'?'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700">${r.name||'CPA Candidate'}</div>
        <div style="font-size:11px;color:var(--mut)">Wants to follow you</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button onclick="acceptFollowRequest('${r.uid}')" style="padding:6px 12px;background:var(--ind);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">Confirm</button>
        <button onclick="denyFollowRequest('${r.uid}')" style="padding:6px 12px;background:var(--surf2);color:var(--sub);border:1px solid var(--bdr);border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">Delete</button>
      </div>
    </div>`).join('')
    : `<div class="empty-state" style="padding:32px 0"><div class="empty-icon">${ico('user')}</div><div class="empty-msg">No pending follow requests</div></div>`;
  el.innerHTML=`<div class="modal-box" style="max-width:480px;padding:24px" onclick="event.stopPropagation()">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="font-size:17px;font-weight:800">Follow Requests${requests.length?` <span style="font-size:12px;background:var(--red);color:#fff;padding:1px 7px;border-radius:20px;font-weight:700">${requests.length}</span>`:''}
      </div>
      <button onclick="document.getElementById('follow-req-modal').remove()" class="modal-close">×</button>
    </div>
    <div>${rows}</div>
    ${requests.length?`<div style="display:flex;gap:8px;margin-top:16px">
      <button onclick="acceptAllFollowRequests()" style="flex:1;padding:10px;background:var(--ind);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Confirm All</button>
      <button onclick="denyAllFollowRequests()" style="flex:1;padding:10px;background:var(--surf2);color:var(--sub);border:1px solid var(--bdr);border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Delete All</button>
    </div>`:''}
  </div>`;
}

function acceptFollowRequest(uid){
  if(!S.followRequests) return;
  const req=S.followRequests.find(r=>r.uid===uid);
  if(!req) return;
  S.followRequests=S.followRequests.filter(r=>r.uid!==uid);
  if(!S.followers) S.followers=[];
  if(!S.followers.includes(uid)) S.followers.push(uid);
  saveState();
  // Create the follower edge under MY profile (the owner may write their own followers,
  // which is how an accepted private-account request becomes a real, counted follow).
  if(firebaseDb&&AUTH&&AUTH.uid){
    firebaseDb.collection('users').doc(AUTH.uid).collection('followers').doc(uid).set({uid:uid,at:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});
    firebaseDb.collection('users').doc(AUTH.uid).collection('followRequests').doc(uid).delete().catch(()=>{});
    S._seenFollowers=[...new Set([...(S._seenFollowers||[]),uid])];
  }
  showToast('Follow request accepted — '+req.name+' can now see your activity','ok');
  _renderFollowRequestsModal();
  renderTab();
}

function denyFollowRequest(uid){
  if(!S.followRequests) return;
  if(firebaseDb&&AUTH?.uid) firebaseDb.collection('users').doc(AUTH.uid).collection('followRequests').doc(uid).delete().catch(()=>{});
  S.followRequests=S.followRequests.filter(r=>r.uid!==uid);
  saveState();
  _renderFollowRequestsModal();
  renderTab();
}

function acceptAllFollowRequests(){
  [...(S.followRequests||[])].forEach(r=>acceptFollowRequest(r.uid));
  showToast('All follow requests accepted','ok');
}

function denyAllFollowRequests(){
  [...(S.followRequests||[])].forEach(r=>denyFollowRequest(r.uid));
}

// ═══════════════════════════════════════════════
// USER PROFILE VIEW
// ═══════════════════════════════════════════════
// Dismiss every open overlay/modal before a full-page navigation.
function _closeAllOverlays(){
  document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
  ['search-modal','log-result-modal','upgrade-modal','follow-modal','notif-modal',
   'mess-modal','follow-req-modal','sess-overlay','social-modal','comments-modal','post-modal'].forEach(id=>{
    const el=document.getElementById(id);
    // Pop-ups built on demand are thrown away; the ones written into the page
    // (session, comments, post) must stay or they can never be opened again.
    if(!el) return;
    if(el.classList.contains('open')) el.classList.remove('open');
    else if(!['sess-overlay','comments-modal','post-modal'].includes(id)) el.remove();
  });
  document.body.style.overflow='';
}

// ═══════════════════════════════════════════════════════════════════
// SHARED PAGE-NAVIGATION HELPERS
// ═══════════════════════════════════════════════════════════════════

const _LOGO_SVG=`<svg width="20" height="20" viewBox="0 0 180 180" style="border-radius:5px;flex-shrink:0"><rect width="180" height="180" fill="#18103a"/><rect x="26" y="55" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="80" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="105" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="26" y="130" width="128" height="5" rx="2.5" fill="#fff" opacity=".12"/><rect x="34" y="40" width="26" height="96" rx="6" fill="#fff"/><rect x="34" y="116" width="82" height="26" rx="6" fill="#fff"/><circle cx="142" cy="44" r="13" fill="#d44000"/></svg>`;

function _appPageNavHTML(){
  const avatarBg=S?.profilePic?'transparent':'linear-gradient(135deg,#5a5fcf,#9333ea)';
  const avatarContent=S?.profilePic?`<img src="${S.profilePic}" alt="Your profile photo" style="width:100%;height:100%;object-fit:cover">`:(AUTH?.displayName||'?').charAt(0).toUpperCase();
  return`<nav class="topnav">
    <div class="topnav-inner">
      <button onclick="history.back()" class="page-nav-back" style="display:flex;align-items:center;gap:6px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--txt);flex-shrink:0;transition:background .15s" onmouseover="this.style.background='var(--surf3)'" onmouseout="this.style.background='var(--surf2)'">← Back</button>
      <div class="nav-logo" onclick="currentTab='today';renderApp()" style="display:flex;align-items:center;gap:7px;margin:0 auto;cursor:pointer">${_LOGO_SVG}Ledger</div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button onclick="openSessionModal()" class="post-btn page-nav-session" style="font-size:12px;padding:7px 14px">Start Session</button>
        <button onclick="openEditProfile()" style="background:${avatarBg};border:2px solid var(--bdr);border-radius:50%;width:34px;height:34px;color:#fff;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0">${avatarContent}</button>
      </div>
    </div>
  </nav>`;
}

function _mountPageShell(contentId){
  // Kill any live messaging listeners from a previous view — a leaked conversation
  // listener keeps marking that conversation "read" while the user isn't viewing it.
  if(typeof _detachDMConvListener==='function') _detachDMConvListener();
  if(typeof _detachDMInboxListener==='function') _detachDMInboxListener();
  document.body.classList.remove('no-app-nav');
  document.body.style.overflow='';
  document.getElementById('root').innerHTML=`<div class="app-wrap">${_appPageNavHTML()}<div class="uprofile-page-wrap"><div id="${contentId}" style="max-width:1160px;margin:0 auto;padding:var(--sp-5) var(--sp-5) 96px"></div></div></div>`;
}

// ── USER PROFILE ─────────────────────────────────────────────────────
async function openUserProfile(userId){
  if(userId==='you'||userId===AUTH?.uid){switchTab('profile');return;}
  _closeAllOverlays();
  history.pushState({view:'userProfile',userId,fromTab:currentTab},'','/user/'+encodeURIComponent(userId));
  document.title='Profile — Ledger';
  await _loadAndRenderProfilePage(userId);
}

async function _loadAndRenderProfilePage(userId){
  _mountPageShell('uprofile-content');
  if(isBlocked(userId)){ _renderBlockedProfile(userId); return; }
  document.getElementById('uprofile-content').innerHTML=`<div style="padding:80px;text-align:center;color:var(--mut);font-size:13px">Loading…</div>`;
  const mock=REAL_USERS.find(x=>x.id===userId);
  if(mock){_renderFullUserProfile(_normProfileMock(mock));return;}
  if(firebaseDb){
    try{
      const snap=await firebaseDb.collection('users').doc(userId).get();
      if(snap.exists){_renderFullUserProfile(_normProfileFirestore(snap.data()));return;}
    }catch(e){}
  }
  document.getElementById('uprofile-content').innerHTML=`<div style="padding:80px 40px;text-align:center"><div style="font-size:32px;margin-bottom:12px">${ico('magnifier')}</div><div style="font-size:14px;font-weight:700;color:var(--txt)">Profile not found</div><button class="btn btn-ghost btn-sm" style="margin-top:16px" onclick="history.back()">← Go Back</button></div>`;
}

// ── ACTIVITY PAGE ────────────────────────────────────────────────────
function openActivityPage(actId){
  _closeAllOverlays();
  history.pushState({view:'activityPage',actId,fromTab:currentTab},'','/activity/'+actId);
  document.title='Study Session — Ledger';
  _renderActivityPage(actId);
}

function _renderActivityPage(actId){
  _mountPageShell('activity-page-content');
  const act=(S.activities||[]).find(a=>a.id===actId);
  if(!act){
    document.getElementById('activity-page-content').innerHTML=`<div style="padding:80px 40px;text-align:center"><div style="font-size:32px;margin-bottom:12px">${ico('magnifier')}</div><div style="font-size:14px;font-weight:700;color:var(--txt)">Session not found</div><button class="btn btn-ghost btn-sm" style="margin-top:16px" onclick="history.back()">← Go Back</button></div>`;
    return;
  }
  const ex=EXAMS[act.section]||{color:'var(--ind)',icon:'book',full:act.section};
  const d=new Date(act.date);
  const dateStr=d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const timeStr=d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  const propCount=Array.isArray(act.kudos)?act.kudos.length:0;
  const commentCount=Array.isArray(act.comments)?act.comments.length:0;
  const hasGivenProps=Array.isArray(act.kudos)&&act.kudos.includes('you');
  const diffLabel=act.difficulty?[1,2,3,4,5].map(i=>i<=act.difficulty?'★':'☆').join(''):'';
  const feelEmoji={'great':'faceGreat','good':'faceGood','okay':'faceOkay','rough':'faceRough','bad':'faceBad'}[act.feeling]||'';
  const statBlocks=[
    `<div style="flex:1;background:var(--surf2);border:1px solid var(--bdr);border-radius:14px;padding:16px;text-align:center">
      <div style="font-size:32px;font-weight:900;color:${ex.color};letter-spacing:-.015em;line-height:1;font-family:var(--font-display)">${act.hours}<span class="stat-unit">h</span></div>
      <div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.07em;margin-top:5px;font-weight:700">Duration</div>
    </div>`,
    act.elapsed?`<div style="flex:1;background:var(--surf2);border:1px solid var(--bdr);border-radius:14px;padding:16px;text-align:center">
      <div style="font-size:24px;font-weight:900;color:var(--txt);letter-spacing:-.02em;line-height:1;margin-top:4px">${fmtDur(act.elapsed)}</div>
      <div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.07em;margin-top:5px;font-weight:700">Timer</div>
    </div>`:'',
    (diffLabel||feelEmoji)?`<div style="flex:1;background:var(--surf2);border:1px solid var(--bdr);border-radius:14px;padding:16px;text-align:center">
      ${feelEmoji?`<div style="font-size:28px;line-height:1.1">${ico(feelEmoji)}</div>`:''}
      ${diffLabel?`<div style="font-size:12px;color:${ex.color};font-weight:800;letter-spacing:.05em;margin-top:${feelEmoji?4:8}px">${diffLabel}</div>`:''}
      <div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.07em;margin-top:5px;font-weight:700">${feelEmoji&&diffLabel?'Mood / Difficulty':feelEmoji?'Feeling':'Difficulty'}</div>
    </div>`:''
  ].filter(Boolean).join('');
  document.getElementById('activity-page-content').innerHTML=`
<div>
  <div style="background:linear-gradient(155deg,#0e0804,#1c1008,#0e0804);position:relative;overflow:hidden;padding:24px 20px 22px">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at -10% 65%,${ex.color}55,transparent 45%)"></div>
    <div style="position:relative;z-index:1">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div style="width:48px;height:48px;border-radius:14px;background:${ex.color}22;border:1px solid ${ex.color}44;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">${LedgerIcon(ex.icon)}</div>
        <div>
          <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:-.02em">${ex.full} Session</div>
          <div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:2px">${dateStr} · ${timeStr}</div>
        </div>
        <span class="badge badge-${act.section}" style="margin-left:auto;font-size:10px">${act.section}</span>
      </div>
    </div>
  </div>
  <div style="padding:20px 16px 0">
    <div style="display:flex;gap:10px;margin-bottom:18px">${statBlocks}</div>
    ${act.material?`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:5px">Material</div><div style="font-size:13px;font-weight:600;color:var(--ind)">${act.material}</div></div>`:''}
    ${studySrcLabel(act)?`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:6px">Studied with</div><div class="ac-tags">${_srcTagsHTML(act)}</div></div>`:''}
    ${act.location?`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:5px">Location</div><div style="font-size:13px;font-weight:600;color:var(--sub)">${ico('pin')} ${esc(act.location)}</div></div>`:''}
    ${act.caption?`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:5px">Notes</div><div style="font-size:13px;color:var(--sub);line-height:1.65;background:var(--surf2);border-radius:10px;padding:10px 12px">"${act.caption}"</div></div>`:''}
    ${(act.concepts||[]).length?`<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:6px">Concepts (${act.concepts.length})</div><div style="display:flex;flex-wrap:wrap;gap:5px">${act.concepts.map(c=>`<span style="font-size:11px;background:rgba(212,64,0,.1);border:1px solid rgba(212,64,0,.2);color:var(--ora);padding:3px 10px;border-radius:20px;font-weight:600">${c}</span>`).join('')}</div></div>`:''}
    ${act.photo?`<div style="margin-bottom:14px;border-radius:12px;overflow:hidden;max-height:300px"><img src="${act.photo}" alt="Study session photo" style="width:100%;max-height:300px;object-fit:cover;display:block" loading="lazy"></div>`:''}
  </div>
  <div style="border-top:1px solid var(--bdr);display:flex">
    <button class="ac-action${hasGivenProps?' props-given':''}" onclick="giveProps('${act.id}','you')" style="flex:1;padding:14px;border:none;background:transparent;color:${hasGivenProps?'var(--ora)':'var(--mut)'};cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px">
      <span>${hasGivenProps?ico('heartFilled'):ico('heartOutline')}</span> Props <span style="font-weight:800">${propCount}</span>
    </button>
    <button class="ac-action" onclick="openComments('${act.id}','you')" style="flex:1;padding:14px;border:none;background:transparent;color:var(--mut);cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px">
      Comments <span style="font-weight:800">${commentCount}</span>
    </button>
    <button class="ac-action" onclick="shareActivity('${act.id}')" style="flex:1;padding:14px;border:none;background:transparent;color:var(--mut);cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px">Share</button>
  </div>
  <div style="padding:14px 16px;display:flex;gap:8px;border-top:1px solid var(--bdr)">
    <button onclick="openEditActivityModal('${act.id}')" style="flex:1;padding:11px;background:var(--ora);border:none;border-radius:10px;color:#fff;cursor:pointer;font-size:13px;font-weight:700">Edit Session</button>
    <button onclick="deleteActivity('${act.id}')" style="flex:1;padding:11px;background:transparent;border:1px solid var(--bdr);border-radius:10px;color:var(--mut);cursor:pointer;font-size:13px;font-weight:600" onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'" onmouseout="this.style.borderColor='var(--bdr)';this.style.color='var(--mut)'">Delete</button>
  </div>
</div>`;
  window.scrollTo({top:0});
}

// ── CLUB PAGE ──────────────────────────────────────────────────────
function openClubPage(clubId){
  const club=(S.clubs||[]).find(c=>c.id===clubId);
  if(club?.isDM){openClubChat(clubId);return;}
  try{localStorage.setItem('pf2-lr-'+clubId, Date.now());}catch(e){}
  _closeAllOverlays();
  const pc=PUBLIC_CLUBS.find(c=>c.id===clubId);
  const name=(club||pc)?.name||'Club';
  history.pushState({view:'clubPage',clubId,fromTab:currentTab},'','/club/'+encodeURIComponent(clubId));
  document.title=name+' — Ledger';
  _renderClubPage(clubId);
}

function _renderClubPage(clubId){
  _mountPageShell('club-page-outer');
  const memberClub=(S.clubs||[]).find(c=>c.id===clubId);
  const pc=PUBLIC_CLUBS.find(c=>c.id===clubId);
  if(!memberClub&&!pc){
    document.getElementById('club-page-outer').innerHTML=`<div style="padding:80px 40px;text-align:center"><div style="font-size:32px;margin-bottom:12px">${ico('home')}</div><div style="font-size:14px;font-weight:700;color:var(--txt)">Club not found</div><button class="btn btn-ghost btn-sm" style="margin-top:16px" onclick="history.back()">← Go Back</button></div>`;
    return;
  }
  if(!memberClub&&pc){
    // Not yet a member — show public club landing
    document.getElementById('club-page-outer').innerHTML=`
<div>
  <div style="background:linear-gradient(155deg,#0e0804,#1c1008);padding:28px 20px 22px;position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 10% 80%,rgba(90,95,207,.45),transparent 55%)"></div>
    <div style="position:relative;z-index:1;display:flex;align-items:center;gap:16px">
      <div style="width:64px;height:64px;border-radius:18px;background:var(--ind-bg);border:1.5px solid rgba(99,102,241,.4);display:flex;align-items:center;justify-content:center;font-size:34px;flex-shrink:0">${ico(pc.icon)}</div>
      <div>
        <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-.02em">${pc.name}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:3px">Public Club · <span id="pub-mc-${pc.id}">Be an early member</span></div>
      </div>
    </div>
  </div>
  <div style="padding:20px 16px">
    <p style="font-size:14px;color:var(--sub);line-height:1.7;margin-bottom:20px">${pc.desc}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">${(pc.tags||[]).map(t=>`<span class="badge badge-${t==='all'?'AUD':t}" style="font-size:11px">${t==='all'?'All Sections':t}</span>`).join('')}</div>
    <button onclick="joinPublicClub('${pc.id}');openClubPage('${pc.id}')" style="width:100%;padding:14px;background:var(--ind);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer">Join ${pc.name} →</button>
  </div>
</div>`;
    // Fetch real member count from Firestore
    if(firebaseDb){
      firebaseDb.collection('clubs').doc(pc.id).get().then(snap=>{
        if(snap.exists&&snap.data().memberCount>0){
          const el2=document.getElementById('pub-mc-'+pc.id);
          const mc=snap.data().memberCount;
          if(el2) el2.textContent=''+mc.toLocaleString()+' member'+(mc!==1?'s':'');
        }
      }).catch(()=>{});
    }
    return;
  }
  // Member — render full club UI using existing functions
  // We reuse club-view-content / club-view-body IDs so renderClubView works
  document.getElementById('club-page-outer').innerHTML=`<div id="club-view-content" style="display:flex;flex-direction:column;min-height:calc(100vh - 64px)"></div>`;
  _clubViewTab='chat';
  renderClubView(clubId);
}

function _normProfileMock(f){
  const allSecs=[...new Set([...(f.passedSections||[]),(f.currentSection||null)].filter(Boolean))];
  return{uid:f.id,name:f.name,initials:f.initials,color:f.color,bio:f.bio||'',state:f.state,city:'',locationState:'',school:'',classYear:'',disc:f.currentSection||'',sections:allSecs,sectionPassed:f.passedSections||[],hoursTotal:f.totalHours||0,streak:f.streak||0,sessionCount:f.activities.length,weekHrs:f.activities.filter(a=>new Date(a.date)>new Date(Date.now()-7*86400000)).reduce((s,a)=>s+(a.hours||0),0),activities:f.activities||[],achievements:[],avatar:f.avatar||'',profilePic:f.profilePic||'',tier:f.tier||'free',firmName:f.firmName||'',isMock:true,isPrivate:!!f.isPrivate,followersCount:f.followersCount||0,followingCount:f.followingCount||0,followers:f.followers||[],following:f.following||[]};
}
function _normProfileFirestore(u){
  const name=u.displayName||'CPA Candidate';
  const initials=name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?';
  const colors=['#d44000','#5a5fcf','#0ea574','#9333ea','#0fb5aa'];
  const color=colors[name.charCodeAt(0)%colors.length];
  return{uid:u.uid,name,initials,color:u.color||color,bio:u.bio||'',state:u.state||'',city:u.city||'',locationState:u.locationState||'',school:u.school||'',classYear:u.classYear||'',disc:u.disc||'',sections:u.sections||[],sectionPassed:u.sectionPassed||[],hoursTotal:u.hoursTotal||0,streak:0,sessionCount:0,weekHrs:0,activities:[],achievements:u.achievements||[],avatar:u.avatar||'',profilePic:u.profilePic||'',tier:u.tier||'free',firmName:u.firmName||'',isPrivate:u.isPrivate||false,followersCount:u.followersCount||0,followingCount:u.followingCount||0,followers:u.followers||[],following:u.following||[],isMock:false};
}

function _renderFullUserProfile(u){
  _knownNames[u.uid]=u.name;
  const isFollowing=(S.following||[]).includes(u.uid);
  const isPendingRequest=!isFollowing&&(S.pendingRequests||[]).includes(u.uid);
  const isLocked=!!(u.isPrivate)&&!isFollowing;
  const avatarInner=u.profilePic?`<img src="${u.profilePic}" alt="Member profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:u.avatar&&u.avatar.length<=2?`<span style="font-size:28px">${ico(u.avatar)}</span>`:`<span style="font-size:26px;font-weight:900;letter-spacing:-.03em">${u.initials}</span>`;
  const tierBadge=u.tier==='elite'?`<span class="badge" style="background:var(--ora);color:#fff;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase">Pro</span>`:u.tier==='pro'?`<span class="badge" style="background:linear-gradient(135deg,#d44000,#d97706);color:#fff;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase">Pro</span>`:'';

  // Follow / Message buttons (compact, hero top-right)
  const followBtnStyle=`background:${isFollowing?'rgba(255,255,255,.15)':isPendingRequest?'rgba(255,255,255,.1)':'var(--ora)'};border:1px solid ${(isFollowing||isPendingRequest)?'rgba(255,255,255,.28)':'transparent'};color:#fff;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap`;
  const followBtnLabel=isFollowing?'✓ Following':isPendingRequest?'Requested':'+ Follow';

  const sectionProgress=u.sections.map(s=>{
    const ex=EXAMS[s];if(!ex)return'';
    const passed=u.sectionPassed.includes(s);
    const pct=passed?100:0;
    return`<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:7px"><span class="badge badge-${s}">${s}</span>${passed?`<span class="badge badge-passed">Passed ${ico('checkCircle')}</span>`:''}</div>
        <span style="font-size:11px;color:var(--mut)">${passed?'100%':'In progress'}</span>
      </div>
      <div class="prog-bar" style="height:8px"><div class="prog-fill" style="width:${pct}%;background:${ex.color}"></div></div>
    </div>`;
  }).join('');

  const allActs=u.activities.slice().reverse();
  _heatmapOtherOffset=0;
  _heatmapOtherActivities=u.activities||[];
  const _uHeatmap=u.activities.length>0?_buildHeatmap(u.activities,0,'heatmap-other'):'';
  const activityFeed=isLocked
    ?`<div style="text-align:center;padding:56px 16px">
        <div style="font-size:40px;margin-bottom:12px">${ico('lock')}</div>
        <div style="font-size:16px;font-weight:800;color:var(--txt);margin-bottom:8px">Private Account</div>
        <div style="font-size:13px;color:var(--sub);line-height:1.6;max-width:260px;margin:0 auto 20px">${isPendingRequest?'Follow request pending.':'Follow to see their study activity.'}</div>
        ${!isPendingRequest?`<button id="vp-follow-btn" onclick="toggleFollowViewProfile('${u.uid}')" style="padding:10px 24px;background:var(--ora);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Request to Follow</button>`:''}
      </div>`
    :allActs.length===0
      ?`<div style="text-align:center;padding:48px 20px;background:var(--surf2);border:1.5px dashed var(--bdr);border-radius:14px;color:var(--mut)">
          <div style="font-size:44px;margin-bottom:12px;opacity:.55">${ico('inbox')}</div>
          <div style="font-size:15px;font-weight:800;color:var(--txt);margin-bottom:6px">No sessions yet</div>
          <div style="font-size:12px;line-height:1.55;max-width:240px;margin:0 auto">${u.name.split(' ')[0]}'s study sessions will appear here once they start logging.</div>
        </div>`
      :_uHeatmap+allActs.map(a=>{
          const ex=EXAMS[a.section];if(!ex)return'';
          if(a.type==='pass'){
            const scoreLine=(typeof a.score==='number')?` · Score ${a.score}`:'';
            return`<div style="border-radius:14px;overflow:hidden;border:1px solid ${ex.color}44;margin-bottom:12px">
              <div style="background:linear-gradient(135deg,${ex.color}dd,${ex.color}99);padding:20px;text-align:center;color:#fff">
                <div style="font-size:36px;margin-bottom:8px">${ico('party')}</div>
                <div style="font-size:17px;font-weight:900">Passed ${a.section}!</div>
                <div style="font-size:11px;color:rgba(255,255,255,.8);margin-top:3px">${ex.full}${scoreLine}</div>
                <div style="font-size:10px;color:rgba(255,255,255,.55);margin-top:8px">${timeAgo(a.date)}</div>
              </div>
            </div>`;
          }
          const diffStars=a.difficulty?[1,2,3,4,5].map(i=>`<span style="color:${i<=a.difficulty?ex.color:'var(--bdr)'}">★</span>`).join(''):'';
          const feelEmoji={'great':'faceGreat','good':'faceGood','okay':'faceOkay','rough':'faceRough','bad':'faceBad'}[a.feeling]||'';
          return`<div style="border-left:3px solid ${ex.color};background:var(--surf);border-radius:0 12px 12px 0;margin-bottom:10px;overflow:hidden">
            <div style="padding:12px 14px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <div style="display:flex;align-items:center;gap:7px">
                  <span class="badge badge-${a.section}" style="font-size:10px">${a.section}</span>
                  ${feelEmoji?`<span style="font-size:14px">${ico(feelEmoji)}</span>`:''}
                </div>
                <span style="font-size:10px;color:var(--mut)">${timeAgo(a.date)}</span>
              </div>
              <div style="display:flex;align-items:baseline;gap:5px;margin-bottom:4px">
                <span style="font-size:22px;font-weight:900;color:${ex.color};letter-spacing:-.04em;line-height:1">${a.hours}</span>
                <span style="font-size:11px;color:var(--mut);font-weight:600">hrs</span>
              </div>
              ${a.material||studySrcLabel(a)?`<div style="font-size:11px;font-weight:600;color:var(--ind);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${[a.material,studySrcLabel(a)].filter(Boolean).join(' · ')}</div>`:''}
              ${a.caption?`<div style="font-size:11px;color:var(--sub);font-style:italic;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">"${a.caption}"</div>`:''}
              ${diffStars?`<div style="font-size:11px;margin-top:4px">${diffStars}</div>`:''}
            </div>
          </div>`;
        }).join('');

  // Pre-computed sidebar cards
  const _sideAboutRows=[
    u.school?`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bdr)"><span style="font-size:16px;width:22px;flex-shrink:0;text-align:center">${ico('graduationCap')}</span><div><div style="font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px">School</div><div style="font-size:13px;font-weight:700">${u.school}${u.classYear?' · '+u.classYear:''}</div></div></div>`:null,
    u.state?`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bdr)"><span style="font-size:16px;width:22px;flex-shrink:0;text-align:center">${ico('pin')}</span><div><div style="font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px">Location</div><div style="font-size:13px;font-weight:700">${u.state}</div></div></div>`:null,
    u.disc?`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bdr)"><span style="font-size:16px;width:22px;flex-shrink:0;text-align:center">${ico('clipboard')}</span><div><div style="font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px">Discipline</div><div style="font-size:13px;font-weight:700">${u.disc}</div></div></div>`:null,
    u.firmName?`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0"><span style="font-size:16px;width:22px;flex-shrink:0;text-align:center">${ico('building')}</span><div><div style="font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px">Firm</div><div style="font-size:13px;font-weight:700">${u.firmName}</div></div></div>`:null,
  ].filter(Boolean).join('');
  const _sideAboutCard=_sideAboutRows?`<div class="sb-card"><div class="sb-title">About</div>${_sideAboutRows}</div>`:'';
  const _sideProgCard=sectionProgress?`<div class="sb-card"><div class="sb-title">Exam Progress</div>${sectionProgress}</div>`:'';
  const _sideAchCard=_achValid(u.achievements).length?`<div class="sb-card"><div class="sb-title">Achievements (${_achValid(u.achievements).length})</div>${_achPreviewHTML(u.achievements,'view-ach')}</div>`:'';

  document.title=`${u.name} — Ledger`;
  document.getElementById('uprofile-content').innerHTML=`

  <!-- HERO (full width) -->
  <div class="profile-hero" style="border-radius:16px;margin-bottom:20px">
    <div class="profile-hero-inner">
      <div class="vp-hero-top" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:14px;min-width:0">
          <div style="width:80px;height:80px;border-radius:50%;background:${u.color};border:3px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;color:#fff">${avatarInner}</div>
          <div style="min-width:0">
            <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.15;overflow-wrap:anywhere">${u.name}${u.isPrivate?' <span style="font-size:13px;opacity:.65">'+ico('lock')+'</span>':''} ${tierBadge}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:3px">${[u.disc,u.state,u.classYear].filter(Boolean).join(' · ')}</div>
            ${u.bio?`<div style="font-size:12px;color:rgba(255,255,255,.72);margin-top:5px;line-height:1.5;max-width:420px">${u.bio}</div>`:''}
          </div>
        </div>
        <div class="vp-hero-btns" style="display:flex;gap:8px;flex-shrink:0;padding-top:2px">
          <button id="vp-follow-btn" onclick="toggleFollowViewProfile('${u.uid}')" style="${followBtnStyle}">${followBtnLabel}</button>
          <button onclick="openDirectMessage('${u.uid}','${u.name}','${u.initials}')" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.85);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer">${ico('chat')}</button>
          <button class="vp-more" aria-label="More options" title="Report or block" onclick="openUserActions('${u.uid}')" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.85);border-radius:8px;padding:8px 12px;font-size:15px;font-weight:800;cursor:pointer;line-height:1">⋯</button>
        </div>
      </div>
      <!-- Stats row -->
      <div class="vp-stats" style="display:flex;gap:0;padding-top:14px;border-top:1px solid rgba(255,255,255,.12)">
        ${[
          {v:Math.round(u.hoursTotal),l:'Hours',c:'rgba(212,64,0,.9)',fn:''},
          u.streak?{v:u.streak,l:'Streak',c:'#fff',fn:''}:null,
          u.sessionCount?{v:u.sessionCount,l:'Sessions',c:'#fff',fn:''}:null,
          !isLocked?{v:u.followersCount||0,l:'Followers',c:'#fff',id:'prof-foll-cnt',fn:`openUserFollowList('${u.uid}','followers','${u.name}')`}:null,
          !isLocked?{v:u.followingCount||0,l:'Following',c:'#fff',fn:`openUserFollowList('${u.uid}','following','${u.name}')`}:null,
        ].filter(Boolean).map(s=>`<div class="vp-stat" onclick="${s.fn||''}" style="flex:1;min-width:0;text-align:center;${s.fn?'cursor:pointer':''}">
          <div ${s.id?`id="${s.id}"`:''} style="font-size:22px;font-weight:900;color:${s.c};letter-spacing:-.04em;line-height:1">${s.v}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;font-weight:600">${s.l}</div>
        </div>`).join('<div class="vp-stat-div" style="width:1px;background:rgba(255,255,255,.1)"></div>')}
      </div>
    </div>
  </div>

  <!-- 2-COLUMN LAYOUT -->
  <div class="profile-layout">

    <!-- LEFT: Activity feed -->
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div>
          <div style="font-size:15px;font-weight:800">Activity</div>
          ${!isLocked&&u.activities.length?`<div style="font-size:11px;color:var(--mut);margin-top:1px">${u.activities.length} sessions logged</div>`:''}
        </div>
        ${!isLocked?`<button onclick="openDirectMessage('${u.uid}','${u.name}','${u.initials}')" style="background:var(--surf2);border:1px solid var(--bdr);color:var(--txt);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer">Message</button>`:''}
      </div>
      ${activityFeed}
    </div>

    <!-- RIGHT: Sidebar -->
    <div class="profile-sidebar">
      ${_sideAboutCard}
      ${_sideProgCard}
      ${_sideAchCard}
    </div>

  </div>
`;

  // Override the stored follower count with the REAL count from the followers subcollection.
  if(!u.isPrivate||!isLocked) _loadFollowerCount(u.uid,'prof-foll-cnt');
  window.scrollTo({top:0});
}

function toggleFollowViewProfile(uid){
  if(!S.following)S.following=[];
  const btn=document.getElementById('vp-follow-btn');
  const idx=S.following.indexOf(uid);
  if(idx>=0){
    S.following.splice(idx,1);
    saveState();saveFollowToFirestore();checkAchievements();
    if(btn){btn.textContent='+ Follow';btn.style.background='var(--ora)';btn.style.border='1px solid transparent';}
    const sb=document.getElementById('vp-follow-btn-sticky');if(sb){sb.textContent='+ Follow';sb.style.background='var(--ora)';sb.style.color='#fff';sb.style.border='1px solid transparent';}
    showToast('Unfollowed','info');
  } else if(_isUserPrivate(uid)){
    if(!S.pendingRequests)S.pendingRequests=[];
    if(S.pendingRequests.includes(uid)){
      S.pendingRequests=S.pendingRequests.filter(id=>id!==uid);
      if(btn){btn.textContent='+ Follow';btn.style.background='var(--ora)';btn.style.border='1px solid transparent';}
      saveState();showToast('Follow request cancelled','info');
    } else {
      S.pendingRequests.push(uid);
      if(btn){btn.textContent='Requested';btn.style.background='rgba(255,255,255,.15)';btn.style.border='1px solid rgba(255,255,255,.25)';}
      saveState();showToast('Follow request sent','ok');
    }
  } else {
    S.following.push(uid);
    saveState();saveFollowToFirestore();checkAchievements();
    if(btn){btn.textContent='✓ Following';btn.style.background='rgba(255,255,255,.15)';btn.style.border='1px solid rgba(255,255,255,.25)';}
    const sb=document.getElementById('vp-follow-btn-sticky');if(sb){sb.textContent='Following';sb.style.background='var(--surf2)';sb.style.color='var(--txt)';sb.style.border='1px solid var(--bdr)';}
    showToast('Following!','ok');
    // Pull the newly-followed user's recent activity into the feed right away.
    loadRealUsers().then(()=>{ if(currentTab==='feed'||currentTab==='explore')renderTab(); });
  }
}



function closeUserProfile(){
  const st=history.state;
  if(st?.view==='userProfile'){
    history.back();
  } else {
    // fallback: restore app
    renderApp();
    if(st?.fromTab)switchTab(st.fromTab);
  }
}

function switchProfileTab(tab){
  ['activity','progress','about'].forEach(t=>{
    const btn=document.getElementById('vpt-'+t);
    const isActive=t===tab;
    if(btn){
      btn.classList.toggle('active',isActive);
      btn.style.color=isActive?'var(--ora)':'var(--mut)';
      btn.style.borderBottomColor=isActive?'var(--ora)':'transparent';
    }
  });
  const tabContent=document.getElementById('vp-tab-content');
  const progressContent=document.getElementById('vp-progress-content');
  const aboutContent=document.getElementById('vp-about-content');
  if(tabContent) tabContent.style.display=tab==='activity'?'block':'none';
  if(progressContent) progressContent.style.display=tab==='progress'?'block':'none';
  if(aboutContent) aboutContent.style.display=tab==='about'?'block':'none';
}

function openProfileActivity(cardEl){
  const section=cardEl.dataset.section;
  const hours=cardEl.dataset.hours;
  const date=cardEl.dataset.date;
  const material=cardEl.dataset.material;
  const caption=cardEl.dataset.caption;
  const difficulty=parseInt(cardEl.dataset.difficulty)||0;
  const feeling=cardEl.dataset.feeling;
  const ex=EXAMS[section]||{color:'var(--ora)',full:section,icon:'book'};
  const feelingLabel={great:'Great',good:'Good',okay:'Okay',rough:'Rough',bad:'Bad'}[feeling]||'';
  const diffStars=difficulty?[1,2,3,4,5].map(i=>`<span style="color:${i<=difficulty?ex.color:'var(--surf3)'};font-size:18px">★</span>`).join(''):'';
  const el=document.createElement('div');
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2200;display:flex;align-items:flex-end;animation:fadeIn .2s ease';
  el.innerHTML=`
  <div style="background:var(--surf);border-radius:20px 20px 0 0;width:100%;max-width:680px;margin:0 auto;padding:0 0 40px;animation:slideInFromBottom .3s cubic-bezier(.22,.61,.36,1)" onclick="event.stopPropagation()">
    <div style="width:40px;height:4px;border-radius:2px;background:var(--bdr2);margin:12px auto 20px"></div>
    <div style="padding:0 20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="width:48px;height:48px;border-radius:14px;background:${ex.color}18;border:1.5px solid ${ex.color}33;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${LedgerIcon(ex.icon)}</div>
        <div>
          <div style="display:flex;align-items:center;gap:8px"><span class="badge badge-${section}">${section}</span><span style="font-size:16px;font-weight:900">${hours}h</span></div>
          <div style="font-size:12px;color:var(--mut);margin-top:2px">${new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div>
        </div>
      </div>
      ${material?`<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:4px">Topic</div><div style="font-size:14px;font-weight:600">${material}</div></div>`:''}
      ${caption?`<div style="margin-bottom:14px;background:var(--surf2);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--sub);font-style:italic;line-height:1.6">"${caption}"</div>`:''}
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${difficulty?`<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:4px">Difficulty</div><div>${diffStars}</div></div>`:''}
        ${feelingLabel?`<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:4px">Feeling</div><div style="font-size:16px">${feelingLabel}</div></div>`:''}
      </div>
    </div>
  </div>`;
  el.addEventListener('click',()=>el.remove());
  document.body.appendChild(el);
}

async function openUserFollowList(uid, type, name){
  // Show followers or following list for a given user
  const el=document.createElement('div');
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:2200;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  el.innerHTML=`<div style="background:var(--surf);border-radius:20px;width:100%;max-width:400px;max-height:70vh;display:flex;flex-direction:column;box-shadow:var(--shadow-lg)">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--bdr);flex-shrink:0">
      <div style="font-size:15px;font-weight:800">${name}'s ${type==='followers'?'Followers':'Following'}</div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;cursor:pointer;font-size:20px;color:var(--mut)">×</button>
    </div>
    <div id="uflist-body" style="overflow-y:auto;padding:12px 16px;flex:1">
      <div style="text-align:center;padding:32px;color:var(--mut);font-size:13px">Loading…</div>
    </div>
  </div>`;
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});

  try {
    // Followers come from the followers subcollection (source of truth, matches the count);
    // following stays on the user's own doc array (which they maintain themselves).
    let ids;
    if(type==='followers'){
      const fsnap=await firebaseDb.collection('users').doc(uid).collection('followers').get();
      ids=fsnap.docs.map(d=>d.id);
    } else {
      const doc=await firebaseDb.collection('users').doc(uid).get();
      ids=((doc.exists?doc.data():{}).following)||[];
    }
    const body=document.getElementById('uflist-body');
    if(!body)return;
    if(!ids.length){body.innerHTML=`<div style="text-align:center;padding:32px;color:var(--mut);font-size:13px">No ${type} yet</div>`;return;}

    // Load profiles for the ids
    const profiles=await Promise.all(ids.slice(0,50).map(id=>firebaseDb.collection('users').doc(id).get()));
    body.innerHTML=profiles.map(p=>{
      if(!p.exists)return'';
      const u=p.data();
      const n=u.displayName||'CPA Candidate';
      const initials=n.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
      const colors=['#d44000','#5a5fcf','#0ea574','#9333ea','#0fb5aa'];
      const col=colors[n.charCodeAt(0)%colors.length];
      const isFollowing=(S.following||[]).includes(p.id);
      return`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bdr)">
        <div style="width:40px;height:40px;border-radius:50%;background:${col};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;overflow:hidden;cursor:pointer" onclick="this.closest('[style*=fixed]').remove();openUserProfile('${p.id}')">${u.profilePic?`<img src="${u.profilePic}" alt="${esc(n)}'s profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`${initials}`}</div>
        <div style="flex:1;min-width:0;cursor:pointer" onclick="this.closest('[style*=fixed]').remove();openUserProfile('${p.id}')">
          <div style="font-size:13px;font-weight:700">${n}</div>
          <div style="font-size:11px;color:var(--mut)">${u.state||''}</div>
        </div>
        ${p.id!==AUTH?.uid?`<button onclick="if((S.following||[]).includes('${p.id}')){S.following=S.following.filter(x=>x!=='${p.id}');this.textContent='Follow';this.style.background='var(--ora)';this.style.color='#fff';}else{if(!S.following)S.following=[];S.following.push('${p.id}');this.textContent='Following';this.style.background='var(--surf2)';this.style.color='var(--txt)';}saveState();saveFollowToFirestore();" style="padding:6px 14px;background:${isFollowing?'var(--surf2)':'var(--ora)'};color:${isFollowing?'var(--txt)':'#fff'};border:1px solid ${isFollowing?'var(--bdr)':'transparent'};border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0">${isFollowing?'Following':'Follow'}</button>`:'<span style="font-size:11px;color:var(--mut)">You</span>'}
      </div>`;
    }).join('');
  } catch(e) {
    const body=document.getElementById('uflist-body');
    if(body) body.innerHTML=`<div style="text-align:center;padding:32px;color:var(--mut);font-size:13px">Could not load list</div>`;
  }
}


function toggleFollowProfile(userId,btn){
  const following=S.following||[];
  const idx=following.indexOf(userId);
  if(idx>=0){following.splice(idx,1);}else{following.push(userId);}
  S.following=following;saveState();checkAchievements();saveFollowToFirestore();
  const isNow=(S.following||[]).includes(userId);
  btn.textContent=isNow?'✓ Following':'+ Follow';
  btn.className=`btn ${isNow?'btn-ghost':'btn-primary'}`;
  btn.style.flex='1';btn.style.justifyContent='center';
  showToast(isNow?'Following! Sessions will appear in your feed.':'Unfollowed','ok');
  renderUserProfile(userId);
  if(isNow) refreshRealUsers();
}

// ── FIREBASE MESSAGING HELPERS ────────────────────────────────────────────
let _heatmapOwnOffset=0;
let _heatmapOtherOffset=0;
let _heatmapOtherActivities=[];
let _clubViewMsgUnsub = null;
const ASK_LEDGER_LIMIT = 100;
let _askLedgerUsage = null; // {month:'2026-06', count:47} — loaded from Firestore
const FLASHCARD_LIMIT = 50; // monthly AI Study-Tools generations (flashcards/quizzes/summaries); every paid tier = unlimited
let _flashcardUsage = null; // {month, count} — loaded from Firestore userState (mirrors Ask Ledger)

function _detachClubViewListener(){ if(_clubViewMsgUnsub){ _clubViewMsgUnsub(); _clubViewMsgUnsub=null; } }

function _convId(uid1, uid2){ return [uid1,uid2].sort().join('__dm__'); }

// ── User profile cache — resolves display info for ANY uid (not just REAL_USERS) ──
// REAL_USERS only holds followed + recently-active users, so DMs with anyone else
// used to render as "User"/"Member ??". This cache backfills from users/{uid}.
const _userProfileCache = {};        // uid -> {name, initials, color} (null = fetch failed/missing)
const _userProfileFetching = new Set();

function _cachedUserInfo(uid){
  const f=REAL_USERS.find(u=>u.id===uid);
  if(f) return {name:f.name,initials:f.initials||f.name.slice(0,2).toUpperCase(),color:f.color||'#5a5fcf'};
  const c=_userProfileCache[uid];
  if(c) return c;
  return null;
}

async function _resolveUserProfiles(uids){
  if(!firebaseDb) return false;
  const need=[...new Set(uids)].filter(u=>u&&u!=='system'&&u!=='you'&&u!==AUTH?.uid&&!_cachedUserInfo(u)&&!_userProfileFetching.has(u)&&!(u in _userProfileCache));
  if(!need.length) return false;
  need.forEach(u=>_userProfileFetching.add(u));
  let found=false;
  await Promise.all(need.map(async uid=>{
    try{
      const doc=await firebaseDb.collection('users').doc(uid).get();
      if(doc.exists){
        const u=doc.data();
        const name=u.displayName||'CPA Candidate';
        _userProfileCache[uid]={name,initials:name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?',color:u.color||hashColor(uid)};
        found=true;
      } else {
        _userProfileCache[uid]=null; // remember the miss so we don't refetch forever
      }
    }catch(e){ _userProfileCache[uid]=null; }
    finally{ _userProfileFetching.delete(uid); }
  }));
  return found;
}

function _fbMsgAuthorInfo(fromUid){
  if(!fromUid||fromUid==='system') return {name:'System',initials:'SY',color:'var(--mut)'};
  if(fromUid===AUTH?.uid||fromUid==='you'){
    const n=S?.name||'You';
    return {name:'You',initials:n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ME',color:'var(--ora)'};
  }
  const c=_cachedUserInfo(fromUid);
  if(c) return c;
  return {name:'Member',initials:(fromUid||'??').slice(0,2).toUpperCase(),color:hashColor(fromUid)};
}

function deleteChatMessage(collection, channelId, msgId){
  if(!firebaseDb||!collection||!channelId||!msgId) return;
  if(!confirm('Delete this message? This cannot be undone.')) return;
  firebaseDb.collection(collection).doc(channelId).collection('messages').doc(msgId).delete()
    .then(()=>showToast('Message deleted','info'))
    .catch(e=>{
      console.warn('deleteChatMessage error:',e.code,e.message);
      showToast(e.code==='permission-denied'?'You can only delete your own messages.':'Could not delete: '+(e.code||e.message),'err');
    });
  // The onSnapshot listener re-renders automatically once the doc is removed.
}

