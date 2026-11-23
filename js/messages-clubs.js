// ═══════════════════════════════════════════════
// DM MESSAGING CENTER — Full revamp
// ═══════════════════════════════════════════════

let _activeDMConvId = null;
let _dmConvUnsub = null;

function _detachDMConvListener(){
  if(_dmConvUnsub){ _dmConvUnsub(); _dmConvUnsub=null; }
}

function _dmDateLabel(ts){
  const d=ts instanceof Date?ts:(ts?.toDate?.()||new Date(ts||Date.now()));
  const now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const msgDay=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const diff=(today-msgDay)/86400000;
  if(diff<1)return'Today';
  if(diff<2)return'Yesterday';
  if(diff<7)return d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
  if(d.getFullYear()===now.getFullYear())return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function _dmTimeStr(ts){
  const d=ts instanceof Date?ts:(ts?.toDate?.()||new Date(ts||Date.now()));
  return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
}

function _renderMsgsDM(areaId, msgs, channelId, opts){
  const area=document.getElementById(areaId); if(!area)return;
  opts=opts||{};
  const collection=opts.collection||'conversations';
  const isGroup=!!opts.isGroup; // club group chat: always show sender names for others
  if(collection==='clubs'&&!_isPrivateClub(channelId)) msgs=msgs.map(m=>m.isSystem?m:{...m,text:_clean(m.text)});
  // If the user scrolled up to read history, don't yank them down when new messages arrive
  const nearBottom=area.scrollHeight-area.scrollTop-area.clientHeight<120;
  msgs=(msgs||[]).filter(m=>!isBlocked(m.from||m.author));
  if(!msgs.length){
    area.innerHTML=`<div class="dm-empty-conv"><div style="font-size:46px">${isGroup?ico('users'):ico('wave')}</div><div style="font-size:14px;font-weight:700;color:var(--txt)">${isGroup?'No messages yet':'Start the conversation'}</div><div style="font-size:12px;color:var(--mut)">Say hello below</div></div>`;
    area.scrollTop=area.scrollHeight;
    return;
  }
  // spacer pushes short conversations to the bottom (standard chat behavior)
  const output=['<div class="dm-msgs-spacer"></div>'];
  let lastDayLabel=null;
  let currentGroup=null; // {isMine, from, name, initials, color, msgs:[]}

  const flushGroup=()=>{
    if(!currentGroup||!currentGroup.msgs.length)return;
    const g=currentGroup;
    const timeStr=_dmTimeStr(g.msgs[g.msgs.length-1].ts);

    const bubbles=g.msgs.map((m,idx)=>{
      const canDel=g.isMine&&m.id;
      const isLast=idx===g.msgs.length-1;
      const delHint=canDel?` oncontextmenu="event.preventDefault();if(confirm('Delete this message?'))deleteChatMessage('${collection}','${channelId}','${m.id}')"`:'';
      const cls=`dm-bubble ${g.isMine?'dm-bubble-mine':'dm-bubble-them'}`;
      return`<div class="${cls}" title="${_dmTimeStr(m.ts)}"${delHint}>${esc(m.text)}</div>`;
    }).join('');

    if(g.isMine){
      output.push(`<div class="dm-group mine">${bubbles}<div class="dm-group-meta">${timeStr}</div></div>`);
    } else {
      const av=`<div class="dm-group-av" style="background:${g.color}">${g.initials}</div>`;
      const showName=isGroup||g.msgs.length>1;
      const real=g.from&&g.from!=='system'&&g.from.length>4;
      const rk=real?_regReport({kind:'message',target:g.from,targetName:g.name,text:g.msgs.map(m=>String(m.text||'')).join('\n').slice(-1000),
        refPath:collection+'/'+channelId+'/messages/'+(g.msgs[g.msgs.length-1].id||'')}):'';
      output.push(`<div class="dm-group them">${av}${showName?`<div class="dm-sender-name">${esc(g.name)}</div>`:''}${bubbles}<div class="dm-group-meta">${timeStr}${real?`<button class="dm-more" aria-label="Report or block" title="Report or block" onclick="openContentActions('${rk}')">⋯</button>`:''}</div></div>`);
    }
    currentGroup=null;
  };

  const unknownUids=new Set();
  msgs.forEach((msg,i)=>{
    const from=msg.from||msg.author;
    if(msg.isSystem||from==='system'){
      flushGroup();
      output.push(`<div class="dm-system">${esc(msg.text||'')}</div>`);
      return;
    }
    const ts=msg.timestamp?.toDate?.()??new Date(msg.timestamp||msg.time||Date.now());
    const isMine=from===AUTH?.uid||from==='you';
    if(!isMine&&from&&!_cachedUserInfo(from)&&!(from in _userProfileCache)) unknownUids.add(from);
    const dayLabel=_dmDateLabel(ts);
    if(dayLabel!==lastDayLabel){
      flushGroup();
      output.push(`<div class="dm-date-sep"><span>${dayLabel}</span></div>`);
      lastDayLabel=dayLabel;
    }
    const prev=i>0?msgs[i-1]:null;
    const prevFrom=prev?(prev.from||prev.author):null;
    const prevTs=prev?(prev.timestamp?.toDate?.()??new Date(prev.timestamp||prev.time||0)):0;
    const sameGroup=prev&&!prev.isSystem&&prevFrom===from&&(ts-prevTs)<5*60*1000;
    if(!sameGroup){
      flushGroup();
      const info=_fbMsgAuthorInfo(from);
      currentGroup={isMine,from,name:info.name,initials:info.initials,color:info.color,msgs:[]};
    }
    currentGroup.msgs.push({...msg,ts,isMine});
  });
  flushGroup();
  area.innerHTML=output.join('');
  if(nearBottom) area.scrollTop=area.scrollHeight;
  // Backfill unknown sender names from Firestore, then re-render once with real info
  if(unknownUids.size){
    _resolveUserProfiles([...unknownUids]).then(found=>{
      if(found&&document.getElementById(areaId)) _renderMsgsDM(areaId,msgs,channelId,opts);
    });
  }
}

// Unified conversation panel — handles both DMs (kind:'dm') and study clubs (kind:'club').
let _activeConvOpts=null;
async function _renderConvPanel(opts){
  _detachDMConvListener();
  const convPanel=document.getElementById('dm-conv-panel');
  if(!convPanel)return;
  _activeConvOpts=opts;
  const {kind,channelId,name,color,initials,otherUserId,icon,memberCount}=opts;
  const collection=kind==='club'?'clubs':'conversations';
  const isPartner=kind==='dm'&&S.accountabilityPartner===otherUserId;
  const subtitle=kind==='club'?`${memberCount!=null?memberCount:'…'} member${memberCount===1?'':'s'}`:(isPartner?'Study Partner':'Direct Message');
  const avatar=kind==='club'
    ?`<div style="width:38px;height:38px;border-radius:12px;background:var(--ind-bg);border:1px solid rgba(99,102,241,.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${ico(icon||'users')}</div>`
    :`<div style="width:38px;height:38px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">${initials}</div>`;
  if(kind==='dm'&&otherUserId) _knownNames[otherUserId]=name;
  const dmBlocked=kind==='dm'&&isBlocked(otherUserId);
  const rightBtn=kind==='club'
    ?`<button class="btn btn-ghost btn-xs" onclick="openClubPage('${channelId}')" title="Open full club">Open Club</button>`
    :(otherUserId?`<button class="btn btn-ghost btn-xs" onclick="openUserProfile('${otherUserId}')">Profile</button><button class="btn btn-ghost btn-xs dm-hdr-more" aria-label="More options" title="Report or block" onclick="openUserActions('${otherUserId}')">⋯</button>`:'');

  convPanel.innerHTML=`
<div class="dm-conv-hdr">
  <button onclick="_showDMInbox()" id="dm-back-btn" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--mut);padding:2px 6px;border-radius:8px;flex-shrink:0;display:none;line-height:1;transition:background-color .15s" onmouseover="this.style.background='var(--surf2)'" onmouseout="this.style.background='transparent'">←</button>
  ${avatar}
  <div style="flex:1;min-width:0;cursor:${kind==='club'?'pointer':'default'}" ${kind==='club'?`onclick="openClubPage('${channelId}')"`:''}>
    <div style="font-size:15px;font-weight:800;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(name)}${isPartner?'<span style="font-size:10px;color:var(--ind);font-weight:700;margin-left:6px;vertical-align:middle">Study Partner</span>':''}</div>
    <div style="font-size:11px;color:var(--mut)">${subtitle}</div>
  </div>
  ${rightBtn}
</div>
<div id="dm-msgs-area" class="dm-conv-msgs"><div class="dm-system" style="margin-top:auto;margin-bottom:auto">Loading…</div></div>
${dmBlocked?`<div class="dm-blocked">${BLOCKED.has(otherUserId)?`You blocked ${esc(name)}. <button class="btn btn-ghost btn-xs" onclick="unblockUser('${otherUserId}')">Unblock</button>`:'You can’t reply to this conversation.'}</div>`:`<div class="dm-comp">
  <textarea id="dm-inp-${channelId}" class="dm-comp-inp" rows="1" placeholder="Message ${kind==='club'?esc(name):esc(name)}…"
    onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();_sendConvMessage('${kind}','${channelId}')}"
    oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';document.getElementById('dm-send-${channelId}').disabled=!this.value.trim()"></textarea>
  <button class="dm-comp-send" id="dm-send-${channelId}" onclick="_sendConvMessage('${kind}','${channelId}')" title="Send" disabled>↑</button>
</div>`}`;

  if(window.innerWidth<720){
    const btn=document.getElementById('dm-back-btn');
    if(btn)btn.style.display='';
  }

  if(!firebaseDb){
    const el=document.getElementById('dm-msgs-area');
    if(el)el.innerHTML='<div class="dm-system">No connection</div>';
    return;
  }

  // For DMs, ensure the parent conversation doc exists BEFORE listening, otherwise
  // the message read rule (which get()s the parent's participants) denies the read.
  if(kind==='dm'&&AUTH){
    try{
      const ref=firebaseDb.collection('conversations').doc(channelId);
      const snap=await ref.get();
      if(!snap.exists){
        await ref.set({participants:channelId.split('__dm__').sort(),lastMessage:'',lastAt:firebase.firestore.FieldValue.serverTimestamp()});
      }
    }catch(e){ /* listener will surface any real error */ }
  }
  // Bail if the user navigated away during the await
  if(_activeConvOpts!==opts)return;

  const msgsRef=firebaseDb.collection(collection).doc(channelId).collection('messages').orderBy('timestamp','asc').limitToLast(150);
  _dmConvUnsub=msgsRef.onSnapshot(snap=>{
    _renderMsgsDM('dm-msgs-area',snap.docs.map(d=>({...d.data(),id:d.id})),channelId,{collection,isGroup:kind==='club'});
    try{localStorage.setItem('pf2-lr-'+channelId,Date.now());}catch(e){}
  },err=>{
    const el=document.getElementById('dm-msgs-area');
    if(el)el.innerHTML=`<div class="dm-system">${err.code==='permission-denied'?'Messages are unavailable right now. Please try again shortly.':'Could not load messages ('+err.code+')'}</div>`;
  });
  setTimeout(()=>document.getElementById('dm-inp-'+channelId)?.focus(),100);
}

function _openDMFromInbox(convId, otherUid){
  const cached=_cachedUserInfo(otherUid);
  const lDM=(S.clubs||[]).find(c=>c.isDM&&c.members.includes(otherUid));
  const name=cached?.name||lDM?.name||'User';
  const initials=cached?.initials||name.slice(0,2).toUpperCase();
  const color=cached?.color||lDM?.color||hashColor(otherUid);
  openConversationPage(convId, otherUid, name, color, initials);
}

// Generic open: routes to the conv panel if the messages page is mounted, otherwise
// navigates to the messages page with the conversation open.
function _openConv(opts){
  _activeDMConvId=opts.channelId;
  try{localStorage.setItem('pf2-lr-'+opts.channelId,Date.now());}catch(e){}
  const inboxPanel=document.getElementById('dm-inbox-panel');
  if(inboxPanel){
    if(window.innerWidth<720){inboxPanel.style.display='none';}
    const convPanel=document.getElementById('dm-conv-panel');
    if(convPanel)convPanel.style.display='flex';
    _renderConvPanel(opts);
    document.querySelectorAll('.dm-inbox-row').forEach(r=>r.classList.toggle('active',r.dataset.convId===opts.channelId));
    return;
  }
  history.pushState({view:'messagesPage',openConv:opts,fromTab:currentTab},'','/messages');
  document.title=(opts.name||'Messages')+' — Ledger';
  _renderMessagesPage(opts);
}

function openConversationPage(convId, otherUserId, displayName, displayColor, displayInitials){
  _openConv({kind:'dm',channelId:convId,otherUserId,name:displayName,color:displayColor,initials:displayInitials});
}

function openClubInDMCenter(clubId){ openClubChat(clubId); }

function _showDMInbox(){
  _activeDMConvId=null;
  _activeConvOpts=null;
  _detachDMConvListener();
  const inboxPanel=document.getElementById('dm-inbox-panel');
  const convPanel=document.getElementById('dm-conv-panel');
  if(inboxPanel)inboxPanel.style.display='';
  if(convPanel){
    convPanel.style.display=window.innerWidth>=720?'flex':'none';
    if(window.innerWidth>=720){
      convPanel.innerHTML=`<div class="dm-empty-conv"><div style="font-size:44px">${ico('chat')}</div><div style="font-size:15px;font-weight:800;color:var(--txt)">Your Messages</div><div style="font-size:12px;color:var(--mut);margin-top:4px">Select a conversation or tap + to start a new one</div></div>`;
    }
  }
  document.querySelectorAll('.dm-inbox-row').forEach(r=>r.classList.remove('active'));
}

async function _sendConvMessage(kind, channelId){
  if(kind==='dm'&&channelId.split('__dm__').some(isBlocked)){ showToast('You can’t message this account.','err'); return; }
  const inp=document.getElementById('dm-inp-'+channelId);
  const text=inp?.value?.trim();
  if(!text){ return; }
  if(!AUTH){ showToast('Sign in to send messages','err'); return; }
  if(!firebaseDb){ showToast('No connection','err'); return; }
  if(kind==='club'&&!_isPrivateClub(channelId)&&_badWords(text)) return;
  const sendBtn=document.getElementById('dm-send-'+channelId);
  inp.value='';inp.style.height='auto';
  if(sendBtn)sendBtn.disabled=true;
  try{
    if(kind==='club'){
      const ref=firebaseDb.collection('clubs').doc(channelId);
      await ref.collection('messages').add({from:AUTH.uid,text,timestamp:firebase.firestore.FieldValue.serverTimestamp()});
      await ref.set({lastMessage:text,lastFrom:AUTH.uid,lastAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    } else {
      const ref=firebaseDb.collection('conversations').doc(channelId);
      await ref.set({participants:channelId.split('__dm__').sort(),lastMessage:text,lastFrom:AUTH.uid,lastAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      await ref.collection('messages').add({from:AUTH.uid,text,timestamp:firebase.firestore.FieldValue.serverTimestamp()});
      notifyEvent('dm',{convId:channelId});
    }
    // Own send shouldn't flag the conversation unread in the inbox
    try{localStorage.setItem('pf2-lr-'+channelId,Date.now()+5000);}catch(e){}
  }catch(e){
    if(inp){inp.value=text;inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,120)+'px';}
    if(sendBtn)sendBtn.disabled=false;
    if(e.code==='permission-denied'){ showToast('Couldn\'t send that message — please try again.','err'); }
    else if(e.code==='unavailable'){ showToast('Offline — will send when reconnected','info'); }
    else { showToast('Could not send ('+(e.code||'error')+')','err'); }
  }
}
// Back-compat shim
function _sendDM(convId){ return _sendConvMessage('dm',convId); }

async function openDirectMessage(userId, displayName, displayInitials){
  if(!AUTH){ showToast('Sign in to message users','err'); return; }
  if(isBlocked(userId)){ showToast(BLOCKED.has(userId)?'You blocked this person. Unblock them to message.':'You can’t message this account.','err'); return; }
  // Respect the other person's "Allow Direct Messages" setting — unless a
  // thread already exists, in which case let the conversation continue.
  const _hasThread=(S.clubs||[]).some(c=>c.isDM&&(c.members||[]).includes(userId));
  if(!_hasThread && firebaseDb){
    try{
      const _d=await firebaseDb.collection('users').doc(userId).get();
      if(_d.exists && _d.data().allowMessages===false){ showToast((_d.data().displayName||'This user')+' isn\'t accepting direct messages.','info'); return; }
    }catch(e){}
  }
  const cached=_cachedUserInfo(userId);
  const name=cached?.name||displayName||'User';
  const initials=cached?.initials||displayInitials||(name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())||'??';
  const color=cached?.color||hashColor(userId);

  // Deterministic conversation ID
  const convId=_convId(AUTH.uid, userId);

  // Ensure conversation doc exists in Firestore
  if(firebaseDb){
    try{
      const convRef=firebaseDb.collection('conversations').doc(convId);
      const snap=await convRef.get();
      if(!snap.exists){
        await convRef.set({participants:[AUTH.uid,userId].sort(),createdAt:firebase.firestore.FieldValue.serverTimestamp(),lastMessage:'',lastAt:firebase.firestore.FieldValue.serverTimestamp()});
      }
    }catch(e){ console.warn('DM create error:',e); }
  }

  // Sync local club record
  if(!S.clubs) S.clubs=[];
  let localDM=S.clubs.find(c=>c.isDM&&c.members.includes(userId));
  if(!localDM){
    localDM={id:convId,name,icon:initials[0]||'chat',color,desc:'Direct message',isPrivate:true,isDM:true,members:['you',userId],created:Date.now()};
    S.clubs.push(localDM); saveState();
  } else if(localDM.id!==convId){
    localDM.id=convId; saveState();
  }

  closeUserProfile();
  document.getElementById('search-modal')?.remove();
  openConversationPage(convId, userId, name, color, initials);
}

function promptInviteToClub(userId){
  const f=REAL_USERS.find(x=>x.id===userId)||{name:'this user',initials:'?',color:'#4f46e5'};
  const myClubs=(S.clubs||[]).filter(c=>!c.isDM&&c.members.includes('you'));
  if(!myClubs.length){
    let m=document.getElementById('no-clubs-modal'); if(m)m.remove();
    m=document.createElement('div'); m.id='no-clubs-modal'; m.className='modal-overlay open';
    m.onclick=function(e){ if(e.target===m) m.remove(); };
    m.innerHTML='<div class="modal-box" onclick="event.stopPropagation()" style="max-width:360px;text-align:center;padding:32px 28px">'+
      '<div style="font-size:36px;margin-bottom:12px">'+ico('columns')+'</div>'+
      '<div class="modal-title" style="margin-bottom:10px;font-size:17px">No study clubs yet</div>'+
      '<div style="font-size:13.5px;color:var(--sub);line-height:1.65;margin-bottom:24px">Create a club and you can invite '+esc(f.name)+' to it.</div>'+
      '<div style="display:flex;gap:10px;justify-content:center"><button class="btn btn-ghost" onclick="document.getElementById(\'no-clubs-modal\').remove()">Cancel</button>'+
      '<button class="btn btn-ind" onclick="document.getElementById(\'no-clubs-modal\').remove();createClubModal()">Create a club</button></div>'+
    '</div>';
    document.body.appendChild(m);
    return;
  }
  let el=document.getElementById('invite-club-modal');
  if(!el){
    el=document.createElement('div');
    el.id='invite-club-modal';
    el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:380px"><div class="modal-hdr"><div class="modal-title" id="invite-club-title"></div><button class="modal-close" onclick="document.getElementById('invite-club-modal').classList.remove('open')">×</button></div><div class="modal-body" id="invite-club-body"></div></div>`;
    el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open');});
    document.body.appendChild(el);
  }
  document.getElementById('invite-club-title').textContent=`Invite ${f.name} to a Club`;
  document.getElementById('invite-club-body').innerHTML=myClubs.map(c=>`
  <div style="display:flex;align-items:center;gap:12px;padding:13px;border-radius:12px;cursor:pointer;border:1px solid var(--bdr);margin-bottom:10px;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s" onclick="inviteToClub('${c.id}','${userId}',this)" onmouseover="this.style.borderColor='var(--ind)'" onmouseout="this.style.borderColor='var(--bdr)'">
    <div style="font-size:24px;flex-shrink:0">${ico(c.icon)}</div>
    <div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:700;line-height:1.35">${c.name}</div><div style="font-size:11.5px;color:var(--mut);margin-top:2px">${c.members.length} members</div></div>
    <span style="font-size:12px;color:var(--ind);font-weight:600;flex-shrink:0">Invite →</span>
  </div>`).join('');
  el.classList.add('open');
}

function inviteToClub(clubId,userId,el){
  const club=(S.clubs||[]).find(c=>c.id===clubId);
  const f=REAL_USERS.find(x=>x.id===userId)||{name:'User',initials:'?',color:'#4f46e5'};
  if(!club)return;
  if(club.members.includes(userId)){showToast(`${f.name} is already in this club!`,'info');return;}
  club.members.push(userId);
  saveState();
  if(firebaseDb&&AUTH?.uid){
    const ref=firebaseDb.collection('clubs').doc(clubId);
    ref.set({members:firebase.firestore.FieldValue.arrayUnion(AUTH.uid,userId)},{merge:true})
      .then(()=>ref.collection('messages').add({from:AUTH.uid,isSystem:true,text:(S.name||'Someone')+' added '+f.name,timestamp:firebase.firestore.FieldValue.serverTimestamp()}))
      .catch(e=>{ console.warn('inviteToClub:',e.code,e.message); showToast('Couldn\'t add '+f.name+' — please try again.','err'); });
  }
  document.getElementById('invite-club-modal')?.classList.remove('open');
  showToast(`${f.name} invited to ${club.name}!`,'ok');
  renderTab();
}

// ═══════════════════════════════════════════════
// STUDY CLUBS SYSTEM
// ═══════════════════════════════════════════════
function getClubMemberName(memberId){
  if(memberId==='you'||memberId==='system')return memberId==='system'?'System':S.name;
  return REAL_USERS.find(f=>f.id===memberId)?.name||'CPA Candidate';
}
function getClubMemberInitials(memberId){
  if(memberId==='you')return S.name.slice(0,2).toUpperCase();
  const f=REAL_USERS.find(x=>x.id===memberId);
  return f?f.initials:(memberId||'??').slice(0,2).toUpperCase();
}
function getClubMemberColor(memberId){
  if(memberId==='you')return'#6366f1';
  return REAL_USERS.find(f=>f.id===memberId)?.color||hashColor(memberId||'')||'#94a3b8';
}

function openClubsModal(){
  let el=document.getElementById('clubs-modal');
  if(!el){
    el=document.createElement('div');
    el.id='clubs-modal';
    el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:480px"><div class="modal-hdr"><div class="modal-title">My Study Clubs</div><button class="modal-close" onclick="closeClubsModal()">×</button></div><div class="modal-body" id="clubs-modal-body"></div></div>`;
    el.addEventListener('click',e=>{if(e.target===el)closeClubsModal();});
    document.body.appendChild(el);
  }
  renderClubsModal();
  el.classList.add('open');
}

function renderClubsModal(){
  const body=document.getElementById('clubs-modal-body');if(!body)return;
  const clubs=(S.clubs||[]).filter(c=>!c.isDM);
  const dms=(S.clubs||[]).filter(c=>c.isDM);
  const clubCards=clubs.map(c=>{
    const msgs=(S.clubMessages||{})[c.id]||[];
    const lastMsg=msgs.filter(m=>!m.isSystem).slice(-1)[0];
    return`<div class="my-club-card" onclick="openClubChat('${c.id}')">
      <div class="club-ico">${ico(c.icon)}</div>
      <div style="flex:1;min-width:0">
        <div class="my-club-card-name">${c.name}</div>
        <div class="my-club-card-meta">${ico('lock')} Private · ${c.members.length} member${c.members.length!==1?'s':''}</div>
        ${lastMsg?`<div class="my-club-card-preview">${getClubMemberName(lastMsg.author)}: ${lastMsg.text}</div>`:`<div class="my-club-card-meta" style="margin-top:4px">No messages yet — say hello!</div>`}
      </div>
      <span style="font-size:18px;color:var(--mut);flex-shrink:0">›</span>
    </div>`;
  }).join('');
  const dmCards=dms.length?`<div class="section-title" style="margin-top:20px;margin-bottom:10px">Direct Messages</div>`+dms.map(c=>{
    const otherMember=c.members.find(m=>m!=='you');
    const f=otherMember?REAL_USERS.find(x=>x.id===otherMember):null;
    const msgs=(S.clubMessages||{})[c.id]||[];
    const lastMsg=msgs.filter(m=>!m.isSystem).slice(-1)[0];
    return`<div class="my-club-card" onclick="openClubChat('${c.id}')">
      <div class="avatar av-md" style="background:${f?.color||'#4f46e5'};color:#fff">${f?.initials||'?'}</div>
      <div style="flex:1;min-width:0">
        <div class="my-club-card-name">${f?.name||'Unknown'}</div>
        <div class="my-club-card-meta">${f?.currentSection||'CPA ✓'} · ${f?.streak||0}d streak</div>
        ${lastMsg?`<div class="my-club-card-preview">${lastMsg.author==='you'?'You':getClubMemberName(lastMsg.author)}: ${lastMsg.text}</div>`:`<div class="my-club-card-meta" style="margin-top:4px">Start the conversation!</div>`}
      </div>
      <span style="font-size:18px;color:var(--mut);flex-shrink:0">›</span>
    </div>`;
  }).join(''):'';
  body.innerHTML=`
${clubs.length?clubCards:`<div class="empty-state" style="padding:28px 0"><div class="empty-icon">${ico('columns')}</div><div class="empty-msg" style="line-height:1.6">No study clubs yet.<br>Create a private group and invite your fellow CPA candidates.</div></div>`}
${dmCards}
<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px" onclick="closeClubsModal();createClubModal()">Create New Club</button>`;
}
function closeClubsModal(){document.getElementById('clubs-modal')?.classList.remove('open');}

function createClubModal(){
  let el=document.getElementById('create-club-modal');
  if(!el){
    el=document.createElement('div');
    el.id='create-club-modal';
    el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:460px"><div class="modal-hdr"><div class="modal-title">Create Study Club</div><button class="modal-close" onclick="closeCreateClubModal()">×</button></div><div class="modal-body" id="create-club-body"></div></div>`;
    el.addEventListener('click',e=>{if(e.target===el)closeCreateClubModal();});
    document.body.appendChild(el);
  }
  window._selectedClubIcon='📚';
  const clubIcons=['📚','🏛️','⚡','🔥','🎯','💎','🚀','🧠','💼','📊','🏆','🌟','☕','🌙','🎓','🤝'];
  const friendOptions=REAL_USERS.filter(f=>(S.following||[]).includes(f.id));
  const friendCheckboxes=friendOptions.map(f=>`
  <label style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;cursor:pointer;margin-bottom:4px;transition:background .12s" onmouseover="this.style.background='var(--surf3)'" onmouseout="this.style.background='transparent'">
    <input type="checkbox" id="cm-${f.id}" value="${f.id}" style="accent-color:var(--ind);width:16px;height:16px;flex-shrink:0">
    <div class="avatar" style="width:30px;height:30px;font-size:11px;border-radius:50%;background:${f.color};color:#fff;flex-shrink:0">${f.initials}</div>
    <span style="font-size:13.5px;font-weight:600;flex:1;min-width:0">${f.name}</span>
    <span style="font-size:10.5px;color:var(--mut);flex-shrink:0">${f.currentSection||'CPA ✓'}</span>
  </label>`).join('');
  document.getElementById('create-club-body').innerHTML=`
<div class="form-grp">
  <label>Club Name</label>
  <input id="ncn" type="text" placeholder="e.g. FAR Study Crew" maxlength="40">
</div>
<div class="form-grp">
  <label>Icon</label>
  <div style="display:flex;gap:8px;flex-wrap:wrap" id="club-icon-picker">
    ${clubIcons.map((ci,i)=>`<div onclick="selectClubIcon('${ci}',this)" data-ico="${ci}" style="width:42px;height:42px;border-radius:10px;border:2px solid ${i===0?'var(--ind)':'var(--bdr)'};background:${i===0?'var(--ind-bg)':'var(--surf2)'};display:flex;align-items:center;justify-content:center;font-size:21px;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s">${ico(ci)}</div>`).join('')}
  </div>
</div>
<div class="form-grp">
  <label>Description <span style="color:var(--mut);font-weight:400">(optional)</span></label>
  <input id="ncd" type="text" placeholder="What does this club study?">
</div>
${friendOptions.length?`<div class="form-grp"><label>Invite Members</label><div id="club-ml" style="margin-top:4px">${friendCheckboxes}</div></div>`:`<div style="font-size:12.5px;color:var(--mut);line-height:1.6;margin-bottom:18px;padding:12px 14px;background:var(--surf2);border-radius:10px">Follow people in Explore to invite them to clubs.</div>`}
<div style="display:flex;align-items:center;gap:12px;padding:13px 14px;background:var(--ind-bg);border:1px solid rgba(99,102,241,.2);border-radius:10px;margin:20px 0">
  <span style="font-size:18px;flex-shrink:0">${ico('lock')}</span>
  <div style="font-size:12.5px;color:var(--ind);line-height:1.5"><strong>Private Club</strong> — only you and invited members can see and join.</div>
</div>
<button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px" onclick="saveNewClub()">Create Club</button>`;
  el.classList.add('open');
}
function selectClubIcon(icon,el){
  window._selectedClubIcon=icon;
  document.querySelectorAll('[data-ico]').forEach(e=>{e.style.borderColor='var(--bdr)';e.style.background='var(--surf2)';});
  el.style.borderColor='var(--ind)';el.style.background='var(--ind-bg)';
}
function closeCreateClubModal(){document.getElementById('create-club-modal')?.classList.remove('open');}
// Create a study club that actually exists for the people invited to it. The
// club lives at clubs/{id} with a `members` uid array; each invitee's app finds
// it via syncMyClubs() (array-contains query). It used to be written only to
// the creator's local state, so "invited" friends never saw anything.
async function saveNewClub(){
  const name=document.getElementById('ncn')?.value?.trim();
  if(!name){showToast('Enter a club name','err');return;}
  const desc=document.getElementById('ncd')?.value?.trim()||'';
  const icon=window._selectedClubIcon||'📚';
  const invited=[];
  document.querySelectorAll('[id^="cm-"]').forEach(cb=>{if(cb.checked&&cb.value)invited.push(cb.value);});
  const shared=!!(firebaseDb&&AUTH&&AUTH.uid);
  const clubId=shared?firebaseDb.collection('clubs').doc().id:'c'+Date.now();
  const club={id:clubId,name,icon,desc,isPrivate:true,members:['you',...invited],created:Date.now()};
  if(!S.clubs)S.clubs=[];
  S.clubs.push(club);
  saveState();
  closeCreateClubModal();
  if(shared){
    try{
      const ref=firebaseDb.collection('clubs').doc(clubId);
      await ref.set({name,icon,desc,isPrivate:true,members:[AUTH.uid,...invited],memberCount:1,created:Date.now()});
      await ref.collection('members').doc(AUTH.uid).set({uid:AUTH.uid,name:S.name||AUTH.displayName||'Member',joinedAt:firebase.firestore.FieldValue.serverTimestamp()});
      await ref.collection('messages').add({from:AUTH.uid,isSystem:true,text:(S.name||'Someone')+' created "'+name+'"',timestamp:firebase.firestore.FieldValue.serverTimestamp()});
      syncClubActivity();
    }catch(e){
      console.warn('saveNewClub:',e.code,e.message);
      showToast('Club saved on this device, but we couldn\'t share it yet. Check your connection.','err');
      renderTab();
      return;
    }
  }
  showToast(`"${name}" created${invited.length?' — '+invited.length+' invited':''}`,'ok');
  renderTab();
  setTimeout(()=>openClubChat(clubId),200);
}

// Pull in clubs other people added me to, and drop ones I was removed from.
async function syncMyClubs(){
  if(!firebaseDb||!AUTH?.uid||!S) return;
  let snap;
  try{ snap=await firebaseDb.collection('clubs').where('members','array-contains',AUTH.uid).get(); }
  catch(e){ console.warn('syncMyClubs:',e.code,e.message); return; }
  if(!S.clubs)S.clubs=[];
  let changed=false;
  for(const d of snap.docs){
    const c=d.data();
    if(S.clubs.find(x=>x.id===d.id)) continue;
    S.clubs.push({id:d.id,name:c.name||'Study Club',icon:c.icon||'📚',desc:c.desc||'',isPrivate:true,isDM:false,members:['you'],created:c.created||Date.now()});
    changed=true;
    try{
      const mref=firebaseDb.collection('clubs').doc(d.id).collection('members').doc(AUTH.uid);
      if(!(await mref.get()).exists){
        await mref.set({uid:AUTH.uid,name:S.name||AUTH.displayName||'Member',joinedAt:firebase.firestore.FieldValue.serverTimestamp()});
        await firebaseDb.collection('clubs').doc(d.id).set({memberCount:firebase.firestore.FieldValue.increment(1)},{merge:true});
      }
    }catch(e){}
    addNotification('club','users','You were added to the study club "'+(c.name||'Study Club')+'".',d.id,'club',null);
  }
  if(changed){ saveState(); syncClubActivity(); if(typeof renderTab==='function'&&document.querySelector('.nav-tab')) renderTab(); }
}

function openClubChat(clubId){
  const club=(S.clubs||[]).find(c=>c.id===clubId); if(!club) return;
  if(club.isDM){
    const otherUid=club.members.find(m=>m!=='you'&&m!==AUTH?.uid);
    const realConvId=AUTH?.uid&&otherUid?_convId(AUTH.uid,otherUid):clubId;
    const f=REAL_USERS.find(x=>x.id===otherUid);
    const name=f?.name||club.name||'User';
    const color=f?.color||club.color||'#5a5fcf';
    const initials=f?.initials||name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'??';
    openConversationPage(realConvId,otherUid,name,color,initials);
  } else {
    // Group chat shares the same polished conversation panel as DMs (grouped
    // bubbles, date separators, avatars) instead of a separate cramped modal.
    _openConv({kind:'club',channelId:clubId,name:club.name,icon:club.icon,memberCount:(club.members||[]).length});
  }
}

async function joinPublicClub(pubId){
  const pc=PUBLIC_CLUBS.find(c=>c.id===pubId); if(!pc) return;
  if(!S.clubs) S.clubs=[];
  if(S.clubs.find(c=>c.id===pubId)){ showToast('Already a member!','info'); return; }
  const club={id:pubId,name:pc.name,icon:pc.icon,desc:pc.desc,isPrivate:false,isDM:false,isPublic:true,members:['you'],created:Date.now()};
  S.clubs.push(club);
  saveState();
  syncClubActivity(); // seed my stats into the new club's shared leaderboard
  // Write membership to Firestore so all members are shared across users
  if(firebaseDb&&AUTH){
    try{
      await firebaseDb.collection('clubs').doc(pubId).set({
        name:pc.name, icon:pc.icon, desc:pc.desc, isPublic:true,
        memberCount:firebase.firestore.FieldValue.increment(1)
      },{merge:true});
      await firebaseDb.collection('clubs').doc(pubId).collection('members').doc(AUTH.uid).set({
        uid:AUTH.uid, name:S.name||AUTH.displayName||'Member', joinedAt:firebase.firestore.FieldValue.serverTimestamp()
      });
      // Post welcome message
      await firebaseDb.collection('clubs').doc(pubId).collection('messages').add({
        from:AUTH.uid, text:(S.name||'Someone')+' joined '+pc.name+'!',
        timestamp:firebase.firestore.FieldValue.serverTimestamp(), isSystem:true
      });
    }catch(e){ console.warn('Club join Firestore error:',e); }
  }
  renderTab();
  logLedgerEvent('club_joined',{type:'public'});
  showToast('Joined '+pc.name+'!','ok');
}

// ═══════════════════════════════════════════════
// NOTIFICATION CENTER
// ═══════════════════════════════════════════════
function _defaultNotifications(){
  return []; // a new account starts with no notifications — never a made-up one
}

// Settings → Notifications. Each in-app notification type maps to one toggle;
// a switched-off type is simply never recorded.
const NOTIF_PREF_DEFAULTS={study_reminders:true,streak_alerts:true,props_notifs:true,club_messages:true,achievements:true,leaderboard:true,messages:true,crew_activity:true,nudges:true,weekly_email:true};
const NOTIF_TYPE_TO_PREF={props:'props_notifs',kudos:'props_notifs',comment:'props_notifs',club:'club_messages',achievement:'achievements',follow:'leaderboard',request:'leaderboard',nudge:'nudges'};
function notifPref(id){
  const p=(S&&S.notifPrefs)||{};
  return p[id]!==undefined ? !!p[id] : NOTIF_PREF_DEFAULTS[id]!==false;
}
function refreshNotifBadge(){
  const btn=document.getElementById('notif-bell-btn'); if(!btn) return;
  const uc=((S&&S.notifications)||[]).filter(n=>!n.read).length;
  try{ if(navigator.setAppBadge){ uc?navigator.setAppBadge(uc):navigator.clearAppBadge(); } }catch(e){}
  let badge=btn.querySelector('span');
  if(!uc){ if(badge) badge.style.display='none'; return; }
  if(!badge){
    badge=document.createElement('span');
    badge.style.cssText='position:absolute;top:3px;right:3px;min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 3px';
    btn.appendChild(badge);
  }
  badge.style.display='flex';
  badge.textContent=uc>9?'9+':String(uc);
}

function openNotificationCenter(){
  closeAppSettings(); // don't stack behind the higher z-index Settings panel
  if(!S.notifications) S.notifications=_defaultNotifications();
  const notifs=S.notifications;
  // Mark all as read after opening
  function markAllRead(){
    (S.notifications||[]).forEach(n=>n.read=true);
    saveState();
    // Update badge
    const badge=document.querySelector('#notif-bell-btn span');
    if(badge) badge.style.display='none';
  }
  let el=document.getElementById('notif-modal');
  if(el) el.remove();
  el=document.createElement('div');
  el.id='notif-modal';
  el.className='modal-overlay open';
  const unread=notifs.filter(n=>!n.read).length;
  const notifRows=notifs.length?notifs.map(n=>{
    const f=n.from?REAL_USERS.find(x=>x.id===n.from):null;
    const avatarBg=f?f.color:'#4f46e5';
    const avatarInit=f?f.initials:'bell';
    const hasNav=!!(n.targetType);
    const navLabel=n.targetType==='user'?'View profile':n.targetType==='activity'?'View post':n.targetType==='profile'?'View achievements':'';
    return `<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--bdr);cursor:${hasNav?'pointer':'default'};opacity:${n.read?'.65':'1'}" onclick="handleNotifNav('${n.targetType||''}','${n.targetId||''}')">
      <div style="width:40px;height:40px;border-radius:50%;background:${avatarBg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0">${f?avatarInit:ico(n.icon)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:${n.read?'500':'700'};color:var(--txt);line-height:1.4">${n.text}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
          <span style="font-size:11px;color:var(--mut)">${timeAgo(n.time)}</span>
          ${hasNav?`<span style="font-size:11px;color:var(--ind);font-weight:600">${navLabel} →</span>`:''}
        </div>
      </div>
      ${!n.read?'<div style="width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0;margin-top:6px"></div>':''}
    </div>`;
  }).join(''):`<div style="text-align:center;padding:40px 20px;color:var(--mut)"><div style="font-size:36px;margin-bottom:12px">${ico('bell')}</div><div style="font-size:14px;font-weight:600">No notifications yet</div><div style="font-size:12px;margin-top:6px">Interactions on your posts will appear here</div></div>`;
  el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:420px;max-height:85vh;display:flex;flex-direction:column">
    <div class="modal-hdr" style="flex-shrink:0">
      <div class="modal-title">Notifications${unread>0?` <span style="background:#ef4444;color:#fff;border-radius:10px;padding:2px 7px;font-size:11px;font-weight:700;margin-left:6px">${unread}</span>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${notifs.length?`<button onclick="clearAllNotifs()" style="background:none;border:none;color:var(--mut);font-size:11px;cursor:pointer;font-weight:600;padding:4px 8px;border-radius:6px;hover:background:var(--surf2)">Clear all</button>`:''}
        <button class="modal-close" onclick="closeNotifModal()">×</button>
      </div>
    </div>
    <div style="overflow-y:auto;flex:1;padding:0 22px">${notifRows}</div>
  </div>`;
  el.addEventListener('click',e=>{if(e.target===el)closeNotifModal();});
  document.body.appendChild(el);
  // Mark all read after a short delay so user can see the unread state briefly
  setTimeout(markAllRead, 800);
}

function closeNotifModal(){document.getElementById('notif-modal')?.remove();}

function handleNotifNav(targetType, targetId){
  closeNotifModal();
  if(!targetType) return;
  if(targetType==='user' && targetId){
    // Open the user's profile card
    openUserProfile(targetId);
  } else if(targetType==='activity' && targetId){
    // Go to feed and scroll to the post
    switchTab('feed');
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        const card=document.querySelector(`.activity-card[data-aid="${targetId}"]`);
        if(card){
          card.scrollIntoView({behavior:'smooth',block:'center'});
          card.style.transition='box-shadow .4s, outline .4s';
          card.style.outline='2px solid var(--ora)';
          card.style.boxShadow='0 0 0 4px rgba(212,64,0,.18)';
          setTimeout(()=>{card.style.outline='';card.style.boxShadow='';},2200);
        }
      });
    });
  } else if(targetType==='profile'){
    // Go to profile/achievements
    switchTab('profile');
  }
}

function clearAllNotifs(){
  S.notifications=[];
  saveState();
  closeNotifModal();
  showToast('Notifications cleared','info');
}

function addNotification(type, icon, text, fromId, targetType, targetId){
  const _pref=NOTIF_TYPE_TO_PREF[type];
  if(_pref && !notifPref(_pref)) return;
  if(fromId && isBlocked(fromId)) return;
  if(!S.notifications) S.notifications=_defaultNotifications();
  S.notifications.unshift({
    id:'n'+Date.now(),type,icon,text,from:fromId||null,
    targetType:targetType||null,targetId:targetId||null,
    time:new Date().toISOString(),read:false
  });
  if(S.notifications.length>50) S.notifications=S.notifications.slice(0,50);
  saveState();
  refreshNotifBadge();
}

// ───────────────────────────────────────────────
// SOCIAL SYNC — what other people did since I last looked.
// There is no server pushing notifications, so on load (and periodically) we
// read the edges other users are allowed to write under my profile — follower
// edges, follow requests, kudos, comments — and diff them against what this
// account has already seen.
// ───────────────────────────────────────────────
async function _userName(uid){
  const c=(REAL_USERS||[]).find(u=>u.id===uid);
  if(c) return c.name;
  try{ const d=await firebaseDb.collection('users').doc(uid).get(); if(d.exists) return d.data().displayName||'Someone'; }catch(e){}
  return 'Someone';
}
let _socialSyncBusy=false;
async function syncSocial(){
  if(!firebaseDb||!AUTH?.uid||!S||_socialSyncBusy) return;
  _socialSyncBusy=true;
  const me=AUTH.uid, meRef=firebaseDb.collection('users').doc(me);
  let dirty=false;
  try{
    // 1) Followers — keep S.followers in step with the real edges, announce new ones.
    try{
      const snap=await meRef.collection('followers').get();
      const ids=snap.docs.map(d=>d.id).filter(id=>id!==me);
      const firstRun=!Array.isArray(S._seenFollowers);
      const seen=new Set(S._seenFollowers||[]);
      if(!firstRun){
        for(const id of ids.filter(x=>!seen.has(x)).slice(0,10)){
          addNotification('follow','user',esc(await _userName(id))+' started following you.',id,'user',id);
        }
      }
      if(firstRun || ids.length!==seen.size || ids.some(x=>!seen.has(x))){ S._seenFollowers=ids; S.followers=ids; dirty=true; }
    }catch(e){}

    // 2) Incoming follow requests (private accounts).
    try{
      const snap=await meRef.collection('followRequests').get();
      const prev=new Set((S.followRequests||[]).map(r=>r.uid));
      const next=snap.docs.filter(d=>!isBlocked(d.id)).map(d=>{const x=d.data();const nm=esc(String(x.name||'CPA Candidate').slice(0,60));
        return {uid:d.id,name:nm,initials:esc((nm.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase())||'?'),color:hashColor(d.id),at:Date.now()};});
      next.filter(r=>!prev.has(r.uid)).forEach(r=>addNotification('request','user',r.name+' requested to follow you.',r.uid,'user',r.uid));
      if(next.length!==prev.size || next.some(r=>!prev.has(r.uid))){ S.followRequests=next; dirty=true; }
    }catch(e){}

    // 3) My outgoing requests — publish new ones, withdraw cancelled ones, and
    //    notice when one has been accepted (my follower edge now exists) or declined.
    try{
      const pending=(S.pendingRequests||[]).filter(id=>id&&id.length>4);
      const sent=new Set(S._sentRequests||[]);
      for(const uid of [...sent].filter(x=>!pending.includes(x))){
        await firebaseDb.collection('users').doc(uid).collection('followRequests').doc(me).delete().catch(()=>{});
        sent.delete(uid); dirty=true;
      }
      for(const uid of pending){
        const tRef=firebaseDb.collection('users').doc(uid);
        const edge=await tRef.collection('followers').doc(me).get().catch(()=>null);
        if(edge&&edge.exists){
          S.pendingRequests=(S.pendingRequests||[]).filter(x=>x!==uid);
          if(!(S.following||[]).includes(uid)) S.following=[...(S.following||[]),uid];
          sent.delete(uid);
          await tRef.collection('followRequests').doc(me).delete().catch(()=>{});
          addNotification('follow','checkCircle',esc(await _userName(uid))+' accepted your follow request.',uid,'user',uid);
          dirty=true; saveFollowToFirestore(); refreshRealUsers();
          continue;
        }
        if(!sent.has(uid)){
          await tRef.collection('followRequests').doc(me).set({uid:me,name:S.name||'CPA Candidate',at:firebase.firestore.FieldValue.serverTimestamp()});
          sent.add(uid); dirty=true;
        } else {
          const req=await tRef.collection('followRequests').doc(me).get().catch(()=>null);
          if(req&&!req.exists){ // declined
            S.pendingRequests=(S.pendingRequests||[]).filter(x=>x!==uid); sent.delete(uid); dirty=true;
          }
        }
      }
      S._sentRequests=[...sent];
    }catch(e){ console.warn('[Ledger] follow-request sync:',e.code||e.message); }

    // 4) Kudos and comments on my sessions.
    try{
      const [propsSnap,commentsSnap]=await Promise.all([meRef.collection('props').get(),meRef.collection('comments').get()]);
      const firstRun=!S._seenReactions;
      const seen=new Set(S._seenReactions||[]);
      const all=[];
      const label=actId=>{const a=(S.activities||[]).find(x=>x.id===actId);return a?(a.section||'study')+' session':'session';};
      for(const d of propsSnap.docs){
        const x=d.data(); all.push(d.id);
        if(firstRun||seen.has(d.id)||!x.reactor||x.reactor===me) continue;
        addNotification('props','clap',esc(await _userName(x.reactor))+' gave you props on your '+esc(label(x.activityId))+'.',x.reactor,'activity',x.activityId);
      }
      for(const d of commentsSnap.docs){
        const x=d.data(); all.push(d.id);
        if(firstRun||seen.has(d.id)||!x.from||x.from===me) continue;
        addNotification('comment','chat',esc(String(x.name||'Someone').slice(0,60))+' commented: “'+esc((window.LedgerModeration?LedgerModeration.censor(String(x.text||'')):String(x.text||'')).slice(0,80))+'”',x.from,'activity',x.activityId);
      }
      if(firstRun || all.length!==seen.size || all.some(id=>!seen.has(id))){ S._seenReactions=all.slice(-400); dirty=true; }
    }catch(e){}

    // 5) Nudges from friends (read through /api/notify; see syncNudges).
    try{ if(typeof syncNudges==='function'&&await syncNudges()) dirty=true; }catch(e){}
  }finally{
    _socialSyncBusy=false;
    if(dirty){ saveState(); if(document.querySelector('.nav-tab')&&(currentTab==='profile'||currentTab==='feed'||currentTab==='today')){ try{renderTab();}catch(e){} } }
    refreshNotifBadge();
  }
}

// ═══════════════════════════════════════════════
// SEARCH MODAL
// ═══════════════════════════════════════════════
function openSearchModal(){
  let el=document.getElementById('search-modal');
  if(el) el.remove();
  el=document.createElement('div');
  el.id='search-modal';
  el.className='modal-overlay open';
  el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:460px;max-height:90vh;display:flex;flex-direction:column">
    <div class="modal-hdr" style="flex-shrink:0">
      <div class="modal-title">Find CPA Candidates</div>
      <button class="modal-close" onclick="closeSearchModal()">×</button>
    </div>
    <div style="padding:0 22px 12px;flex-shrink:0">
      <input id="search-input" type="text" placeholder="Search by name…" style="width:100%;padding:10px 14px;background:var(--surf2);border:1.5px solid var(--bdr2);border-radius:10px;color:var(--txt);font-size:14px;outline:none;box-sizing:border-box" oninput="renderSearchResults()" autofocus>
    </div>
    <div id="search-results" style="overflow-y:auto;flex:1;padding:0 22px 16px"></div>
  </div>`;
  el.addEventListener('click',e=>{if(e.target===el)closeSearchModal();});
  document.body.appendChild(el);
  renderSearchResults();
  setTimeout(()=>document.getElementById('search-input')?.focus(),80);
}

function closeSearchModal(){document.getElementById('search-modal')?.remove();}

function _searchUserCard(u, isReal){
  const following=S.following||[];
  const uid=isReal?u.uid:u.id;
  const isFollowing=following.includes(uid);
  const passed=(u.sectionPassed||u.passedSections||[]).length;
  const name=u.displayName||u.name||'';
  const state=u.state||'';
  const bio=u.bio||'';
  const initials=name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?';
  const colors=['#d44000','#5a5fcf','#0ea574','#9333ea','#0fb5aa','#f59e0b'];
  const colorIdx=name.charCodeAt(0)%colors.length;
  const avatarHtml=u.profilePic
    ?`<img src="${u.profilePic}" alt="Member profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    :(u.avatar&&u.avatar.length<=2?`<span style="font-size:22px">${ico(u.avatar)}</span>`
    :`<span style="font-size:15px;font-weight:800;color:#fff">${initials}</span>`);
  const studyLine=u.disc?`Studying ${u.disc}`:(u.currentSection?'Studying '+u.currentSection:'');
  return `<div onclick="openUserProfile('${uid}')" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--bdr);cursor:pointer" onmouseover="this.style.background='var(--surf2)'" onmouseout="this.style.background=''">
    <div style="width:44px;height:44px;border-radius:50%;background:${u.color||colors[colorIdx]};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${avatarHtml}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:700;color:var(--txt)">${name}</div>
      <div style="font-size:11px;color:var(--mut);margin-top:2px">${state?''+state+' · ':''}${studyLine||'CPA Candidate'}${passed?' · '+ico('checkCircle')+' '+passed+' passed':''}</div>
      ${bio?`<div style="font-size:11px;color:var(--sub);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px">${bio}</div>`:''}
    </div>
    ${uid===AUTH?.uid
      ? `<span style="flex-shrink:0;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;background:var(--surf2);color:var(--mut);border:1.5px solid var(--bdr)">You</span>`
      : `<button onclick="event.stopPropagation();toggleFollowSearch('${uid}',${isReal})" style="flex-shrink:0;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid ${isFollowing?'var(--bdr2)':'var(--ora)'};background:${isFollowing?'var(--surf2)':'var(--ora)'};color:${isFollowing?'var(--txt)':'#fff'}">${isFollowing?'Following':'Follow'}</button>`
    }
  </div>`;
}

let _searchDebounce=null;
function renderSearchResults(){
  const q=(document.getElementById('search-input')?.value||'').trim();
  const container=document.getElementById('search-results');
  if(!container) return;
  // Show skeleton while we fetch
  container.innerHTML=`<div style="text-align:center;padding:28px 0;color:var(--mut);font-size:13px">Searching…</div>`;
  clearTimeout(_searchDebounce);
  _searchDebounce=setTimeout(async()=>{
    const following=S.following||[];
    let realUsers=await searchFirestoreUsers(q);
    const realUids=new Set(realUsers.map(u=>u.uid));
    // Also surface cached REAL_USERS not in Firestore search results
    const cachedExtra=REAL_USERS.filter(f=>!realUids.has(f.id)&&f.id!==AUTH?.uid&&(
      !q||f.name.toLowerCase().includes(q.toLowerCase())||f.state.toLowerCase().includes(q.toLowerCase())
    ));
    if(!container.isConnected) return;
    const allUsers=[...realUsers.map(u=>({...u,_real:true})),...cachedExtra.map(f=>({...f,uid:f.id,displayName:f.name,_real:true}))].filter(u=>!isBlocked(u.uid||u.id));
    const suggested=allUsers.filter(u=>!following.includes(u._real?u.uid:u.id));
    const followingList=allUsers.filter(u=>following.includes(u._real?u.uid:u.id));
    let html='';
    if(!q){
      html+=`<div style="font-size:10px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;padding:8px 0 4px">Suggested Candidates</div>`;
      html+=suggested.length?suggested.map(u=>_searchUserCard(u,u._real)).join(''):`<div style="color:var(--mut);font-size:12px;padding:10px 0">You're following everyone!</div>`;
      if(followingList.length){
        html+=`<div style="font-size:10px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;padding:14px 0 4px">Following</div>`;
        html+=followingList.map(u=>_searchUserCard(u,u._real)).join('');
      }
    } else {
      html+=allUsers.length?allUsers.map(u=>_searchUserCard(u,u._real)).join(''):`<div style="text-align:center;padding:32px 0;color:var(--mut)"><div style="font-size:32px;margin-bottom:10px">${ico('magnifier')}</div><div style="font-size:14px;font-weight:600">No candidates found</div><div style="font-size:12px;margin-top:4px">Try a different name or state</div></div>`;
    }
    if(container.isConnected) container.innerHTML=html;
  }, 280);
}

function toggleFollowSearch(id, isReal){
  if(!S.following) S.following=[];
  const idx=S.following.indexOf(id);
  if(idx>=0){
    S.following.splice(idx,1);
    showToast('Unfollowed','info');
    saveState();saveFollowToFirestore();renderSearchResults();
  } else if(_isUserPrivate(id)){
    if(!S.pendingRequests) S.pendingRequests=[];
    if(S.pendingRequests.includes(id)){
      S.pendingRequests=S.pendingRequests.filter(x=>x!==id);
      showToast('Follow request cancelled','info');
    } else {
      S.pendingRequests.push(id);
      showToast('Follow request sent','ok');
    }
    saveState();renderSearchResults();
  } else {
    S.following.push(id);
    if(!isReal){
      const f=REAL_USERS.find(x=>x.id===id);
      if(f) addNotification('follow','user','You followed '+f.name+'.',f.id,'user',f.id);
    }
    showToast('Following!','ok');
    saveState();saveFollowToFirestore();renderSearchResults();
    refreshRealUsers();
  }
}

// ═══════════════════════════════════════════════
// QR CODE MODAL
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// UNIFIED INVITE SHARING — text-message-first
// One canonical flow used everywhere we ask a user to invite their cohort.
// On mobile it opens the native share sheet (one tap → Messages); on desktop
// it shows a focused popup whose primary action is "Send via Text".
// ═══════════════════════════════════════════════
function buildInviteLink(){
  return 'https://ledgercpa.app/join?c='+(S&&S.firmCode||'')+
    (AUTH&&AUTH.uid?'&uid='+encodeURIComponent(AUTH.uid):'')+
    (S&&S.name?'&from='+encodeURIComponent(S.name):'')+
    (S&&S.firmName?'&fn='+encodeURIComponent(S.firmName):'');
}
function buildInviteMessage(url){
  const who=(S&&S.name)?S.name+' here — ':'';
  const grp=(S&&S.firmName)?('the '+S.firmName+' study cohort'):'my CPA study cohort';
  return who+'join '+grp+' on Ledger. We log study hours together and keep each other on pace '+url;
}
// opts: { url, message }  (both optional — derived from state if omitted)
function shareInvite(opts){
  opts=opts||{};
  const url=opts.url||buildInviteLink();
  const message=opts.message||buildInviteMessage(url);
  // Native share sheet — best on mobile: one tap straight to Messages/iMessage.
  if(navigator.share){
    logLedgerEvent('invite_shared',{method:'native_sheet'});
    navigator.share({title:'Join me on Ledger',text:message}).catch(e=>{
      if(e&&e.name==='AbortError')return; // user dismissed — do nothing
      openInviteShareSheet(url,message);
    });
    return;
  }
  openInviteShareSheet(url,message);
}
function _smsHref(message){
  // sms:?&body= is the most cross-platform form (works on iOS + Android).
  return 'sms:?&body='+encodeURIComponent(message);
}
// QR codes are drawn locally (vendor/qrcode-generator) — never by a web
// service, which would see the 2FA secret or the invite link.
function _qrDataUrl(text){
  try{ const q=qrcode(0,'M'); q.addData(String(text)); q.make(); return q.createDataURL(6,2); }
  catch(e){ return ''; }
}
function openInviteShareSheet(url,message){
  url=url||buildInviteLink();
  message=message||buildInviteMessage(url);
  const qrUrl=_qrDataUrl(url);
  let el=document.getElementById('invite-share-sheet'); if(el)el.remove();
  el=document.createElement('div'); el.id='invite-share-sheet'; el.className='modal-overlay open';
  el.onclick=function(e){ if(e.target===el) el.remove(); };
  const btn=(icon,label,onclick,bg,color)=>'<button onclick="'+onclick+'" style="display:flex;align-items:center;gap:11px;width:100%;padding:13px 15px;background:'+bg+';border:1px solid var(--bdr);border-radius:12px;color:'+(color||'var(--txt)')+';font-size:14px;font-weight:700;cursor:pointer;text-align:left;margin-bottom:9px"><span style="font-size:19px;width:24px;flex-shrink:0;text-align:center">'+ico(icon)+'</span><span style="flex:1">'+label+'</span><span style="font-size:15px;opacity:.5">→</span></button>';
  el.innerHTML='<div class="modal-box" onclick="event.stopPropagation()" style="max-width:380px">'+
    '<div class="modal-hdr"><div class="modal-title">Invite your cohort</div><button class="modal-close" onclick="document.getElementById(\'invite-share-sheet\').remove()">×</button></div>'+
    '<div style="padding:4px 2px 2px">'+
      '<div style="font-size:12.5px;color:var(--sub);line-height:1.55;margin-bottom:16px">Send your invite link the fastest way.</div>'+
      btn('chat','Send via Text','logLedgerEvent(\'invite_shared\',{method:\'sms\'});window.open(this.dataset.sms,\'_blank\')','linear-gradient(135deg,#16a34a,#15803d)','#fff')+
      btn('chat','Share on WhatsApp','logLedgerEvent(\'invite_shared\',{method:\'whatsapp\'});window.open(\'https://wa.me/?text=\'+encodeURIComponent(this.dataset.msg),\'_blank\')','var(--surf2)')+
      btn('envelope','Email it','logLedgerEvent(\'invite_shared\',{method:\'email\'});window.open(this.dataset.mail,\'_blank\')','var(--surf2)')+
      btn('clipboard','Copy link','logLedgerEvent(\'invite_shared\',{method:\'copy_link\'});_copyInviteFromSheet(this)','var(--surf2)')+
      '<div style="text-align:center;margin-top:14px;padding-top:16px;border-top:1px solid var(--bdr)">'+
        '<div style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Or scan in person</div>'+
        '<div style="background:#fff;border-radius:14px;padding:12px;display:inline-block"><img src="'+qrUrl+'" alt="Invite QR" style="width:150px;height:150px;display:block;border-radius:6px"></div>'+
      '</div>'+
    '</div></div>';
  document.body.appendChild(el);
  // Stash data on the buttons (avoids quoting headaches in inline handlers).
  const box=el.querySelector('.modal-box');
  const sms=_smsHref(message), wa=message, mail='mailto:?subject='+encodeURIComponent('Join my CPA study cohort on Ledger')+'&body='+encodeURIComponent(message);
  box.querySelectorAll('button').forEach(b=>{ b.dataset.sms=sms; b.dataset.msg=wa; b.dataset.mail=mail; b.dataset.url=url; });
}
function _copyInviteFromSheet(b){
  const url=b.dataset.url||buildInviteLink();
  (navigator.clipboard?.writeText(url)||Promise.reject()).then(()=>showToast('Invite link copied!','ok')).catch(()=>_execCommandShare(url));
}

// ═══════════════════════════════════════════════
// MESSAGES MODAL
// ═══════════════════════════════════════════════
let _msgTab='dms';
function openMessagesModal(){ openMessagesPage(); return; }
function _openMessagesModal_legacy(){
  let el=document.getElementById('messages-modal');
  if(!el){
    el=document.createElement('div');
    el.id='messages-modal';
    el.className='modal-overlay';
    el.innerHTML='<div class="modal-box" onclick="event.stopPropagation()" style="max-width:520px;max-height:88vh;display:flex;flex-direction:column;padding:0;overflow:hidden"><div style="flex-shrink:0;padding:18px 22px 0;border-bottom:1px solid var(--bdr)"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><div style="font-size:16px;font-weight:800">Messages</div><button class="modal-close" onclick="closeMessagesModal()">×</button></div><div style="display:flex;gap:0;background:var(--surf2);border-radius:8px;padding:3px;margin-bottom:12px" id="msg-tabs"></div></div><div id="msg-body" style="overflow-y:auto;flex:1;padding:12px 22px 20px"></div></div>';
    el.addEventListener('click',e=>{if(e.target===el)closeMessagesModal();});
    document.body.appendChild(el);
  }
  _msgTab='dms';
  renderMessagesTabs();
  renderMessagesBody();
  el.classList.add('open');
}
function renderMessagesTabs(){
  const el=document.getElementById('msg-tabs');if(!el)return;
  const tabs=[{id:'dms',label:'Direct Messages'},{id:'clubs',label:'Study Clubs'}];
  el.innerHTML=tabs.map(t=>'<button onclick="_msgTab=\''+t.id+'\';renderMessagesTabs();renderMessagesBody();" style="flex:1;padding:7px 8px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s;background:'+(_msgTab===t.id?'var(--surf)':'transparent')+';color:'+(_msgTab===t.id?'var(--txt)':'var(--mut)')+';box-shadow:'+(_msgTab===t.id?'var(--shadow)':'none')+'">'+t.label+'</button>').join('');
}
function renderMessagesBody(){
  const el=document.getElementById('msg-body');if(!el)return;
  if(_msgTab==='dms'){
    const dms=(S.clubs||[]).filter(c=>c.isDM);
    if(!dms.length){
      el.innerHTML='<div class="empty-state" style="padding:40px 0"><div class="empty-icon">'+ico('chat')+'</div><div class="empty-msg">No direct messages yet.<br>Go to <strong>Explore</strong> → click a candidate → Message to start a DM.</div></div>';
      return;
    }
    el.innerHTML=dms.map(c=>{
      const otherId=c.members.find(m=>m!=='you');
      const friend=REAL_USERS.find(f=>f.id===otherId);
      const msgs=(S.clubMessages||{})[c.id]||[];
      const lastMsg=msgs.filter(m=>!m.isSystem).slice(-1)[0];
      const timeStr=lastMsg?timeAgo(lastMsg.time):'';
      return'<div style="display:flex;align-items:center;gap:12px;padding:12px 8px;border-radius:10px;cursor:pointer;transition:background .12s" onclick="closeMessagesModal();openClubChat(\''+c.id+'\')" onmouseover="this.style.background=\'var(--surf2)\'" onmouseout="this.style.background=\'transparent\'"><div class="avatar av-md" style="background:'+(friend?.color||'#6366f1')+';color:#fff;flex-shrink:0">'+(friend?.initials||c.name.slice(0,2).toUpperCase())+'</div><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:13px;font-weight:700">'+c.name+'</div><div style="font-size:10px;color:var(--mut)">'+timeStr+'</div></div><div style="font-size:11px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">'+(lastMsg?((lastMsg.author==='you'?'You: ':'')+lastMsg.text):'Start the conversation…')+'</div></div></div>';
    }).join('');
  } else {
    const clubs=(S.clubs||[]).filter(c=>!c.isDM);
    if(!clubs.length){
      el.innerHTML='<div class="empty-state" style="padding:40px 0"><div class="empty-icon">'+ico('columns')+'</div><div class="empty-msg">No study clubs yet.<br><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="closeMessagesModal();createClubModal()">+ Create a Club</button></div></div>';
      return;
    }
    el.innerHTML=clubs.map(c=>{
      const msgs=(S.clubMessages||{})[c.id]||[];
      const lastMsg=msgs.filter(m=>!m.isSystem).slice(-1)[0];
      const timeStr=lastMsg?timeAgo(lastMsg.time):'';
      return'<div style="display:flex;align-items:center;gap:12px;padding:12px 8px;border-radius:10px;cursor:pointer;transition:background .12s" onclick="closeMessagesModal();openClubPage(\''+c.id+'\')" onmouseover="this.style.background=\'var(--surf2)\'" onmouseout="this.style.background=\'transparent\'"><div style="width:44px;height:44px;border-radius:12px;background:var(--ind-bg);border:1px solid rgba(99,102,241,.25);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+ico(c.icon)+'</div><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:13px;font-weight:700">'+c.name+'</div><div style="font-size:10px;color:var(--mut)">'+timeStr+'</div></div><div style="display:flex;align-items:center;gap:6px;margin-top:1px"><span style="font-size:10px;color:var(--ind)">'+c.members.length+'</span><span style="font-size:10px;color:var(--mut)">·</span><div style="font-size:11px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(lastMsg?((lastMsg.author==='you'?'You: ':getClubMemberName(lastMsg.author)+': ')+lastMsg.text):'No messages yet')+'</div></div></div></div>';
    }).join('');
  }
}
function closeMessagesModal(){document.getElementById('messages-modal')?.classList.remove('open');}

function openMessagesPage(){
  _closeAllOverlays();
  history.pushState({view:'messagesPage',fromTab:currentTab},'','/messages');
  document.title='Messages — Ledger';
  _renderMessagesPage();
}

function closeMessagesPage(){
  if(history.state?.view==='messagesPage') history.back();
  else { renderApp(); if(history.state?.fromTab) switchTab(history.state.fromTab); }
}

let _dmInboxUnsub=null;
function _detachDMInboxListener(){ if(_dmInboxUnsub){ _dmInboxUnsub(); _dmInboxUnsub=null; } }

async function _renderMessagesPage(openConv){
  _mountPageShell('messages-page-content');
  const el=document.getElementById('messages-page-content');
  el.style.padding='0';el.style.maxWidth='none';
  el.innerHTML='<div class="dm-layout"><div id="dm-inbox-panel" class="dm-inbox-panel"><div style="text-align:center;padding:40px;color:var(--mut);font-size:13px">Loading…</div></div><div id="dm-conv-panel" class="dm-conv-panel"><div class="dm-empty-conv"><div style="font-size:44px">'+ico('chat')+'</div><div style="font-size:15px;font-weight:800;color:var(--txt)">Your Messages</div><div style="font-size:12px;color:var(--mut);margin-top:4px">Select a conversation or tap + to start a new one</div></div></div></div>';

  // Firestore lastMessage/lastAt for the user's clubs (local S.clubMessages goes stale)
  const clubFsMeta={};

  const _dmRow=(conv)=>{
    const otherUid=(conv.participants||[]).find(p=>p!==AUTH?.uid)||'';
    const cached=_cachedUserInfo(otherUid);
    const lDM=(S.clubs||[]).find(c=>c.isDM&&c.members.includes(otherUid));
    const name=cached?.name||lDM?.name||'User';
    const initials=cached?.initials||name.slice(0,2).toUpperCase();
    const color=cached?.color||lDM?.color||hashColor(otherUid);
    const isMineLast=conv.lastFrom&&conv.lastFrom===AUTH?.uid;
    const preview=conv.lastMessage?(isMineLast?'You: ':'')+conv.lastMessage:(conv.id?'Start the conversation…':'');
    const lastAtDate=conv.lastAt?.toDate?.();
    const lastReadMs=parseInt(localStorage.getItem('pf2-lr-'+conv.id)||'0',10);
    const hasUnread=!!(lastAtDate&&lastAtDate.getTime()>lastReadMs&&conv.lastMessage&&!isMineLast);
    const timeLabel=lastAtDate?_dmDateLabel(lastAtDate)==='Today'?_dmTimeStr(lastAtDate):_dmDateLabel(lastAtDate):'';
    return `<div class="dm-inbox-row${hasUnread?' dm-unread':''}" data-conv-id="${esc(conv.id)}" data-other-uid="${esc(otherUid)}" onclick="_openDMFromInbox('${esc(conv.id)}','${esc(otherUid)}')">
      <div style="position:relative;flex-shrink:0"><div class="avatar" style="width:42px;height:42px;font-size:14px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">${initials}</div></div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
          <div class="dm-inbox-name">${esc(name)}</div>
          <div class="dm-inbox-time">${timeLabel}</div>
        </div>
        <div class="dm-inbox-preview">${hasUnread?'<span style="color:var(--txt);font-weight:600">':''}${esc(preview)}${hasUnread?'</span>':''}</div>
      </div>
      ${hasUnread?'<div class="dm-unread-dot"></div>':''}
    </div>`;
  };

  const _clubRow=(c)=>{
    const fs=clubFsMeta[c.id];
    const localMsgs=(S.clubMessages||{})[c.id]||[];
    const lastLocal=localMsgs.filter(m=>!m.isSystem).slice(-1)[0];
    const lastAtDate=fs?.lastAt?.toDate?.();
    const preview=fs?.lastMessage||(lastLocal?(lastLocal.author==='you'?'You: ':'')+lastLocal.text:'No messages yet');
    const lastReadMs=parseInt(localStorage.getItem('pf2-lr-'+c.id)||'0',10);
    const lastActivityMs=lastAtDate?lastAtDate.getTime():(lastLocal?new Date(lastLocal.time).getTime():0);
    const hasUnread=!!(lastActivityMs&&lastActivityMs>lastReadMs&&(fs?.lastMessage||lastLocal));
    const timeLabel=lastAtDate?(_dmDateLabel(lastAtDate)==='Today'?_dmTimeStr(lastAtDate):_dmDateLabel(lastAtDate)):(lastLocal?timeAgo(lastLocal.time):'');
    return `<div class="dm-inbox-row${hasUnread?' dm-unread':''}" data-conv-id="${esc(c.id)}" onclick="openClubInDMCenter('${esc(c.id)}')">
      <div style="width:42px;height:42px;border-radius:12px;background:var(--ind-bg);border:1px solid rgba(99,102,241,.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${ico(c.icon)}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
          <div class="dm-inbox-name">${esc(c.name)}</div>
          <div class="dm-inbox-time">${timeLabel}</div>
        </div>
        <div class="dm-inbox-preview">${esc(preview)}</div>
      </div>
      ${hasUnread?'<div class="dm-unread-dot"></div>':''}
    </div>`;
  };

  let _lastDMs=[]; // latest conversation docs, kept for name-backfill re-renders

  const renderInbox=(firestoreDMs, loadErr)=>{
    const inboxPanel=document.getElementById('dm-inbox-panel');
    if(!inboxPanel)return;
    _lastDMs=firestoreDMs;
    // Merge local-only DMs (started offline / not yet in Firestore)
    const localDMs=(S.clubs||[]).filter(c=>c.isDM);
    const merged=firestoreDMs.slice();
    const knownIds=new Set(merged.map(d=>d.id));
    for(const dm of localDMs){
      if(!knownIds.has(dm.id)){
        const otherUid=dm.members.find(m=>m!=='you'&&m!==AUTH?.uid);
        if(isBlocked(otherUid)) continue;
        merged.push({id:dm.id,participants:[AUTH?.uid||'you',otherUid||''],lastMessage:'',lastAt:null});
      }
    }
    const clubs=(S.clubs||[]).filter(c=>!c.isDM);

    const dmSection=merged.length
      ?merged.map(_dmRow).join('')
      :(loadErr?`<div style="padding:20px 16px;text-align:center;font-size:12px;color:var(--mut);line-height:1.6">Couldn't load conversations${loadErr.code?' ('+loadErr.code+')':''}.<br>Check your connection and try again.</div>`
        :`<div style="padding:20px 16px;text-align:center"><div style="font-size:32px;margin-bottom:8px">${ico('chat')}</div><div style="font-size:12px;color:var(--mut);line-height:1.6">No DMs yet.<br>Visit someone's profile and tap Message.</div></div>`);

    const clubSection=clubs.length
      ?clubs.map(_clubRow).join('')
      :`<div style="padding:16px;text-align:center"><button class="btn btn-ghost btn-sm" onclick="createClubModal()">+ Create a Club</button></div>`;

    // Preserve the search text across live re-renders
    const prevSearch=document.getElementById('dm-search-inp')?.value||'';

    inboxPanel.innerHTML=`
<div class="dm-inbox-hdr">
  <div class="dm-inbox-title">Messages
    <button class="dm-new-btn" onclick="openSearchModal()" title="New Message">+</button>
  </div>
  <input class="dm-inbox-search" placeholder="Search…" oninput="_filterDMInbox(this.value)" id="dm-search-inp">
</div>
<div class="dm-inbox-list" id="dm-inbox-list">
  ${merged.length||clubs.length?`
  <div style="padding:8px 14px 2px;font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em">Direct Messages</div>
  ${dmSection}
  <div style="padding:8px 14px 2px;font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-top:4px">Study Clubs</div>
  ${clubSection}`
  :`<div style="padding:32px 16px;text-align:center"><div style="font-size:40px;margin-bottom:12px">${ico('chat')}</div><div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px">No messages yet</div><div style="font-size:11px;color:var(--mut)">Find someone to message in Explore</div><button class="btn btn-primary btn-sm" style="margin-top:14px" onclick="switchTab('explore')">Find People →</button></div>`}
</div>`;

    if(prevSearch){
      const inp=document.getElementById('dm-search-inp');
      if(inp){inp.value=prevSearch;_filterDMInbox(prevSearch);}
    }
    // Keep the open conversation highlighted across live re-renders
    if(_activeDMConvId){
      document.querySelectorAll('.dm-inbox-row').forEach(r=>r.classList.toggle('active',r.dataset.convId===_activeDMConvId));
    }
    // Backfill names for participants we don't know yet, then re-render once
    const unknown=merged.map(c=>(c.participants||[]).find(p=>p!==AUTH?.uid)).filter(u=>u&&!_cachedUserInfo(u)&&!(u in _userProfileCache));
    if(unknown.length){
      _resolveUserProfiles(unknown).then(found=>{
        if(found&&document.getElementById('dm-inbox-panel')) renderInbox(_lastDMs,loadErr);
      });
    }
  };

  // Live inbox: conversations update in real time (new messages, unread dots, ordering)
  if(firebaseDb&&AUTH){
    const q=firebaseDb.collection('conversations').where('participants','array-contains',AUTH.uid).orderBy('lastAt','desc').limit(50);
    _dmInboxUnsub=q.onSnapshot(
      snap=>renderInbox(snap.docs.map(d=>({id:d.id,...d.data()})).filter(c=>!(c.participants||[]).some(p=>p!==AUTH?.uid&&isBlocked(p)))),
      err=>{ console.warn('DM inbox listener:',err.code,err.message); renderInbox([],err); }
    );
    // Pull real club previews (lastMessage/lastAt live on the club doc)
    const myClubs=(S.clubs||[]).filter(c=>!c.isDM).slice(0,20);
    if(myClubs.length){
      Promise.all(myClubs.map(c=>firebaseDb.collection('clubs').doc(c.id).get().catch(()=>null))).then(docs=>{
        let any=false;
        docs.forEach(d=>{ if(d&&d.exists){clubFsMeta[d.id]=d.data();any=true;} });
        if(any&&document.getElementById('dm-inbox-panel')) renderInbox(_lastDMs);
      });
    }
  } else {
    renderInbox([]);
  }

  // If a specific conversation was requested, open it
  if(openConv){
    _renderConvPanel(openConv);
    if(window.innerWidth<720){
      const p=document.getElementById('dm-inbox-panel');
      if(p)p.style.display='none';
    }
  } else if(window.innerWidth<720){
    const p=document.getElementById('dm-conv-panel');
    if(p)p.style.display='none';
  }
}

function _filterDMInbox(query){
  const q=query.toLowerCase().trim();
  document.querySelectorAll('#dm-inbox-list .dm-inbox-row').forEach(row=>{
    const name=(row.querySelector('.dm-inbox-name')?.textContent||'').toLowerCase();
    const preview=(row.querySelector('.dm-inbox-preview')?.textContent||'').toLowerCase();
    row.style.display=(!q||name.includes(q)||preview.includes(q))?'':'none';
  });
}


// ═══════════════════════════════════════════════
// CLUB VIEW (full modal with tabs)
// ═══════════════════════════════════════════════
let _clubViewTab='chat';
function openClubView(clubId){
  const club=(S.clubs||[]).find(c=>c.id===clubId);if(!club)return;
  if(club.isDM){openClubChat(clubId);return;}
  _clubViewTab='chat';
  let el=document.getElementById('club-view-modal');
  if(!el){
    el=document.createElement('div');
    el.id='club-view-modal';
    el.className='modal-overlay';
    el.innerHTML='<div class="modal-box" onclick="event.stopPropagation()" style="max-width:560px;max-height:90vh;display:flex;flex-direction:column;padding:0;overflow:hidden"><div id="club-view-content" style="display:flex;flex-direction:column;flex:1;overflow:hidden"></div></div>';
    el.addEventListener('click',e=>{if(e.target===el)closeClubView();});
    document.body.appendChild(el);
  }
  renderClubView(clubId);
  el.classList.add('open');
}
function renderClubView(clubId){
  const club=(S.clubs||[]).find(c=>c.id===clubId);if(!club)return;
  const el=document.getElementById('club-view-content');if(!el)return;
  const tabs=[{id:'chat',label:'Chat'},{id:'members',label:'Members'},{id:'leaderboard',label:'Progress'},{id:'about',label:'About'}];
  const tabNav=tabs.map(t=>'<button onclick="_clubViewTab=\''+t.id+'\';renderClubView(\''+clubId+'\');" style="flex:1;padding:8px 4px;border:none;border-bottom:2px solid '+(_clubViewTab===t.id?'var(--ind)':'transparent')+';background:transparent;font-size:11px;font-weight:'+(_clubViewTab===t.id?'700':'500')+';color:'+(_clubViewTab===t.id?'var(--ind)':'var(--mut)')+';cursor:pointer;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s;white-space:nowrap">'+t.label+'</button>').join('');
  el.innerHTML='<div style="flex-shrink:0;padding:16px 20px 0;border-bottom:1px solid var(--bdr)"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:48px;height:48px;border-radius:14px;background:var(--ind-bg);border:1px solid rgba(99,102,241,.25);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">'+ico(club.icon||'building')+'</div><div style="flex:1;min-width:0"><div style="font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(club.name||'Study Group')+'</div><div style="font-size:11px;color:var(--mut)">'+(club.isPublic?'Public':''+ico('lock')+' Private')+' · <span id="club-hdr-mc">'+club.members.length+'</span> <span id="club-hdr-ml">members</span></div></div><button class="modal-close" onclick="closeClubView()">×</button></div><div style="display:flex;gap:0">'+tabNav+'</div></div><div id="club-view-body" style="overflow-y:auto;flex:1;min-height:0"></div>';
  renderClubViewBody(clubId);
  _loadClubMemberCount(clubId,'club-hdr-mc'); // show the real member count, not the local array length
}
async function _loadClubMemberCount(clubId, elId){
  if(!firebaseDb||!clubId) return;
  try{ const s=await firebaseDb.collection('clubs').doc(clubId).collection('members').get(); const el=document.getElementById(elId); if(el) el.textContent=s.size;
    const lbl=document.getElementById('club-hdr-ml'); if(lbl&&elId==='club-hdr-mc') lbl.textContent=(s.size===1?'member':'members');
  }catch(e){}
}
function renderClubViewBody(clubId){
  const club=(S.clubs||[]).find(c=>c.id===clubId);if(!club)return;
  const el=document.getElementById('club-view-body');if(!el)return;
  _detachClubPresence(); // only the leaderboard tab keeps a live presence listener
  if(_clubViewTab==='chat'){
    el.innerHTML='<div class="dm-conv-msgs" id="cva-chat-'+clubId+'" style="min-height:260px;max-height:440px;padding:16px 20px 8px"><div class="dm-system" style="margin-top:auto;margin-bottom:auto">Loading…</div></div><div class="dm-comp" id="cva-comp-'+clubId+'" style="padding:12px 20px 16px;border-top:1px solid var(--bdr)"><textarea id="cva-inp-'+clubId+'" class="dm-comp-inp" rows="1" placeholder="Message '+esc(club.name||'group')+'…" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendClubViewMessage(\''+clubId+'\');}" oninput="this.style.height=\'auto\';this.style.height=Math.min(this.scrollHeight,120)+\'px\';document.getElementById(\'cva-send-'+clubId+'\').disabled=!this.value.trim()"></textarea><button class="dm-comp-send" id="cva-send-'+clubId+'" onclick="sendClubViewMessage(\''+clubId+'\')" title="Send" disabled>↑</button></div>';
    _detachClubViewListener();
    if(firebaseDb){
      const _msgQ=firebaseDb.collection('clubs').doc(clubId).collection('messages').orderBy('timestamp','asc').limitToLast(100);
      _clubViewMsgUnsub=_msgQ.onSnapshot(snap=>{
        _renderMsgsDM('cva-chat-'+clubId, snap.docs.map(d=>({...d.data(),id:d.id})), clubId, {collection:'clubs',isGroup:true});
      },err=>{console.warn('Club view listener:',err);});
      // Belt-and-suspenders: one-shot fetch resolves after any synchronous re-render,
      // so the panel never gets stuck on "Loading…" if the listener's first snapshot raced a DOM swap.
      _msgQ.get().then(snap=>{
        const area=document.getElementById('cva-chat-'+clubId);
        if(area && /Loading…/.test(area.textContent)) _renderMsgsDM('cva-chat-'+clubId, snap.docs.map(d=>({...d.data(),id:d.id})), clubId, {collection:'clubs',isGroup:true});
      }).catch(()=>{});
    }
    setTimeout(()=>document.getElementById('cva-inp-'+clubId)?.focus(),80);
  } else if(_clubViewTab==='members'){
    const _isCohort=clubId.indexOf('firm_')===0;
    const _invOnclick=_isCohort?'shareInvite()':'promptInviteToClub(null,\''+clubId+'\')';
    const _invLabel=_isCohort?'Invite to cohort':'+ Invite Someone';
    el.innerHTML='<div style="padding:16px 20px"><div id="club-mem-'+clubId+'"><div style="text-align:center;color:var(--mut);font-size:12px;padding:24px">Loading members…</div></div><button class="btn btn-ind btn-sm" style="width:100%;justify-content:center;margin-top:12px" onclick="'+_invOnclick+'">'+_invLabel+'</button></div>';
    _renderClubMembersTab(clubId);
  } else if(_clubViewTab==='leaderboard'){
    // Live "studying now" presence (real-time) + real cross-user progress from Firestore.
    el.innerHTML='<div style="padding:16px 20px"><div id="club-live-'+clubId+'"></div><div id="club-lb-'+clubId+'"><div style="text-align:center;color:var(--mut);font-size:12px;padding:24px">Loading group progress…</div></div></div>';
    _attachClubPresence(clubId);
    _renderClubLeaderboard(clubId);
  } else if(_clubViewTab==='about'){
    const created=new Date(club.created||Date.now()).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
    const msgCount=((S.clubMessages||{})[clubId]||[]).filter(m=>!m.isSystem).length;
    el.innerHTML='<div style="padding:20px"><div style="font-size:13px;color:var(--sub);line-height:1.7;margin-bottom:18px">'+esc(club.desc||'No description set for this club.')+'</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px"><div style="background:var(--surf2);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--ind)" id="club-about-mc">'+club.members.length+'</div><div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em">Members</div></div><div style="background:var(--surf2);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--ora)">'+msgCount+'</div><div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em">Messages</div></div><div style="background:var(--surf2);border-radius:10px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--grn)">'+(club.isPublic?ico('globe'):ico('lock'))+'</div><div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em">'+(club.isPublic?'Public':'Private')+'</div></div></div><div style="font-size:11px;color:var(--mut);margin-bottom:16px">Created '+created+'</div><div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="closeClubView();openMessagesPage()">View All Clubs</button><button class="btn btn-ghost btn-sm" style="color:var(--red);border-color:rgba(239,68,68,.3)" onclick="leaveClubFull(\''+clubId+'\')">Leave Club</button></div></div>';
    _loadClubMemberCount(clubId,'club-about-mc');
  }
}
// ── Group activity sync: write my study stats to each club I'm in (shared, read by all members) ──
async function syncClubActivity(){
  if(!firebaseDb||!AUTH||!AUTH.uid) return;
  const myClubs=(S.clubs||[]).filter(c=>!c.isDM&&Array.isArray(c.members)&&c.members.includes('you'));
  if(!myClubs.length) return;
  const acts=S.activities||[];
  const weekAgo=Date.now()-7*86400000;
  const name=S.name||AUTH.displayName||'Member';
  const data={
    uid:AUTH.uid,
    name,
    initials:(name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase())||'M',
    section:(typeof getCurrentSection==='function'?getCurrentSection():'')||'',
    examSection:(typeof getCurrentSection==='function'?getCurrentSection():'')||'',
    examDate:(()=>{try{const sec=getCurrentSection();return (S.examDates&&S.examDates[sec])||'';}catch(e){return '';}})(),
    totalHrs:(typeof getTotalHours==='function'?getTotalHours():acts.reduce((s,a)=>s+(a.hours||0),0)),
    weekHrs:acts.filter(a=>new Date(a.date).getTime()>weekAgo).reduce((s,a)=>s+(a.hours||0),0),
    monthHrs:(()=>{const d=new Date();const mk=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');return acts.filter(a=>(a.date||'').slice(0,7)===mk).reduce((s,a)=>s+(a.hours||0),0);})(),
    streak:(typeof getStreak==='function'?getStreak():0),
    studyDates:[...new Set(acts.map(a=>(a.date||'').slice(0,10)).filter(Boolean))].sort().slice(-60),
    updatedAt:Date.now()
  };
  await Promise.all(myClubs.map(c=>firebaseDb.collection('clubs').doc(c.id).collection('members').doc(AUTH.uid).set(data,{merge:true}).catch(()=>{})));
}

// Firm-cohort auto-join: everyone with the same firm code shares ONE club (firm_{CODE}),
// reusing all the group features (chat, leaderboard, group streak, live presence).
async function ensureFirmCohort(){
  if(!S||!S.firmCode||!firebaseDb||!AUTH||!AUTH.uid) return;
  const code=String(S.firmCode).toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!code) return;
  const clubId='firm_'+code;
  const name=(S.firmName&&S.firmName.trim())?S.firmName.trim():'My Cohort';
  if(!S.clubs) S.clubs=[];
  let local=S.clubs.find(c=>c.id===clubId);
  if(!local){
    S.clubs.push({id:clubId,name:name,icon:'🏢',desc:name+' — your study cohort',isPrivate:true,isDM:false,isPublic:false,isCohort:true,members:['you'],created:Date.now()});
    saveState();
  } else if(local.name!==name && name!=='My Cohort'){ local.name=name; saveState(); }
  try{
    // Only write the display name when we have a REAL firm name — never clobber the
    // shared cohort name with the "My Cohort" placeholder when a joiner didn't type one.
    const hasRealName = !!(S.firmName && S.firmName.trim());
    const clubPayload = {icon:'🏢',isCohort:true,firmCode:code};
    if(hasRealName){ clubPayload.name=name; clubPayload.desc=name+' — study cohort'; }
    await firebaseDb.collection('clubs').doc(clubId).set(clubPayload,{merge:true});
    // If we joined a cohort whose name we don't know yet, adopt the existing shared name.
    if(!hasRealName){
      try{
        const cdoc=await firebaseDb.collection('clubs').doc(clubId).get();
        const remoteName=cdoc.exists && cdoc.data().name;
        if(remoteName && remoteName.trim()){
          S.firmName=remoteName.trim();
          if(local){ local.name=S.firmName; }
          saveState();
        }
      }catch(e){}
    }
    const mref=firebaseDb.collection('clubs').doc(clubId).collection('members').doc(AUTH.uid);
    const snap=await mref.get();
    if(!snap.exists){
      await mref.set({uid:AUTH.uid,name:S.name||AUTH.displayName||'Member',joinedAt:firebase.firestore.FieldValue.serverTimestamp()});
      await firebaseDb.collection('clubs').doc(clubId).set({memberCount:firebase.firestore.FieldValue.increment(1)},{merge:true});
    }
    syncClubActivity();
  }catch(e){console.warn('ensureFirmCohort:',e);}
}

// An existing user with a different primary cohort clicked an invite — offer to switch
// instead of silently ignoring it (they keep membership in their old cohort club too).
function promptCohortSwitch(inv){
  if(!inv||!inv.code) return;
  const newName=(inv.firmName&&inv.firmName.trim())?inv.firmName.trim():'a new cohort';
  const curName=(S.firmName&&S.firmName.trim())?S.firmName.trim():'your current cohort';
  let el=document.getElementById('cohort-switch-modal');
  if(el) el.remove();
  el=document.createElement('div');
  el.id='cohort-switch-modal';
  el.className='modal-overlay open';
  el.onclick=()=>dismissCohortSwitch();
  el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:380px;text-align:center">
    <div style="font-size:34px;margin-bottom:6px">${ico('building')}</div>
    <div class="modal-title" style="margin-bottom:8px">Join ${esc(newName)}?</div>
    <div style="font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:18px">You're currently in <strong>${esc(curName)}</strong>. Switching makes ${esc(newName)} your main cohort on the dashboard — you'll stay a member of ${esc(curName)} too.</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-ind" onclick="confirmCohortSwitch()">Join ${esc(newName)}</button>
      <button class="btn btn-ghost" onclick="dismissCohortSwitch()">Stay in ${esc(curName)}</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  window._pendingCohortSwitch=inv;
}
function dismissCohortSwitch(){
  document.getElementById('cohort-switch-modal')?.remove();
  window._pendingCohortSwitch=null;
  _clearPendingInvite(); // decision made — don't re-prompt next load
}
function confirmCohortSwitch(){
  const inv=window._pendingCohortSwitch;
  document.getElementById('cohort-switch-modal')?.remove();
  if(inv&&S){
    S.firmCode=inv.code;
    S.firmName=(inv.firmName&&inv.firmName.trim())?inv.firmName.trim():'';
    saveState();
    setTimeout(writeUserProfile,300);
    ensureFirmCohort();
    showToast('Switched to '+(S.firmName||'the new cohort')+'','ok');
    if(typeof renderTab==='function') setTimeout(renderTab,200);
  }
  window._pendingCohortSwitch=null;
  _clearPendingInvite();
}

// Group streak = consecutive days (ending today, or yesterday if no session yet today) where ≥1 member studied.
function _computeGroupStreak(docs){
  const dates=new Set();
  docs.forEach(m=>(m.studyDates||[]).forEach(d=>dates.add(d)));
  if(!dates.size) return 0;
  const iso=d=>_ymd(d);
  let streak=0; const day=new Date(); day.setHours(0,0,0,0);
  if(!dates.has(iso(day))) day.setDate(day.getDate()-1); // grace before today's session is logged
  while(dates.has(iso(day))){ streak++; day.setDate(day.getDate()-1); }
  return streak;
}

// Live "studying now" presence panel — real-time list of members in an active session.
let _clubPresenceUnsub=null;
function _detachClubPresence(){ if(_clubPresenceUnsub){ _clubPresenceUnsub(); _clubPresenceUnsub=null; } }
function _attachClubPresence(clubId){
  _detachClubPresence();
  if(!firebaseDb) return;
  _clubPresenceUnsub=firebaseDb.collection('clubs').doc(clubId).collection('presence').onSnapshot(snap=>{
    const host=document.getElementById('club-live-'+clubId); if(!host) return;
    const now=Date.now();
    const live=snap.docs.map(d=>d.data()).filter(p=>p.lastBeat&&(now-p.lastBeat)<120000); // fresh < 2 min
    if(!live.length){ host.innerHTML=''; return; }
    host.innerHTML='<div style="background:linear-gradient(135deg,#04301c,#065f33);border-radius:14px;padding:14px 16px;margin-bottom:14px">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:'+(live.length?'10px':'0')+'">'+
        '<span style="width:9px;height:9px;border-radius:50%;background:#22c55e;animation:pulse-glow 1.6s infinite;flex-shrink:0"></span>'+
        '<span style="font-size:13px;font-weight:800;color:#fff">'+live.length+' studying now</span></div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:8px">'+live.map(p=>{
        const mins=p.startedAt?Math.max(0,Math.floor((now-p.startedAt)/60000)):0;
        return '<div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);border-radius:20px;padding:4px 11px 4px 4px">'+
          '<div class="avatar" style="width:24px;height:24px;font-size:9px;border-radius:50%;background:'+(p.color||'#5a5fcf')+';color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+esc(p.initials||'?')+'</div>'+
          '<span style="font-size:11px;color:#fff;font-weight:600">'+esc(p.name||'Member')+(p.section?' · '+esc(p.section):'')+(mins?' · '+mins+'m':'')+'</span></div>';
      }).join('')+'</div>'+
      ((AUTH&&!live.some(p=>p.uid===AUTH.uid))?'<button onclick="closeClubView();openSessionModal()" style="margin-top:12px;width:100%;padding:9px;background:#22c55e;color:#04301c;border:none;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer">Start studying with them</button>':'')+
    '</div>';
  },err=>{});
}

// Members tab — read the REAL cross-user member list from Firestore (the local
// club.members array only ever holds 'you' for a firm cohort), so a 30-person
// cohort actually shows 30 people, matching the header count and Progress tab.
async function _renderClubMembersTab(clubId){
  const host=document.getElementById('club-mem-'+clubId);
  if(!host) return;
  let docs=[];
  if(firebaseDb){
    try{ await syncClubActivity(); }catch(e){}
    try{
      const snap=await firebaseDb.collection('clubs').doc(clubId).collection('members').get();
      docs=snap.docs.map(d=>({id:d.id,...d.data()}));
    }catch(e){}
  }
  const h=document.getElementById('club-mem-'+clubId); if(!h) return;
  const myUid=AUTH&&AUTH.uid;
  if(!docs.length){
    // Fallback to the local list (offline / brand-new cohort) so it's never blank.
    const club=(S.clubs||[]).find(c=>c.id===clubId);
    docs=((club&&club.members)||['you']).map(m=>{
      const isYou=m==='you';
      const friend=isYou?null:REAL_USERS.find(f=>f.id===m);
      return {id:isYou?(myUid||'you'):m,uid:isYou?myUid:m,name:isYou?(S.name||'You'):getClubMemberName(m),
        initials:isYou?((S.name||'Y').slice(0,2)):getClubMemberInitials(m),color:getClubMemberColor(m),
        totalHrs:isYou?getTotalHours():(friend?.totalHours||0),streak:isYou?getStreak():(friend?.streak||0)};
    });
  }
  docs.sort((a,b)=>(b.totalHrs||0)-(a.totalHrs||0));
  const rows=docs.map(m=>{
    const isYou=(m.uid&&m.uid===myUid)||m.id===myUid||m.id==='you';
    const initials=(m.initials||(m.name||'M').slice(0,2)).toString().toUpperCase();
    const color=m.color||'#5a5fcf';
    const target=m.uid||m.id;
    return '<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--bdr);cursor:'+(isYou?'default':'pointer')+'" '+(isYou?'':'onclick="closeClubView();openUserProfile(\''+target+'\')"')+'>'+
      '<div class="avatar av-md" style="background:'+color+';color:#fff">'+esc(initials)+'</div>'+
      '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+esc(m.name||'Member')+(isYou?' <span style="font-size:10px;background:var(--ora-bg);color:var(--ora);padding:1px 6px;border-radius:10px;font-weight:700">you</span>':'')+'</div>'+
      '<div style="font-size:11px;color:var(--mut);margin-top:2px">'+Math.round(m.totalHrs||0)+'h total · '+ico('flame')+''+(m.streak||0)+'d streak</div></div>'+
      (isYou?'':'<span style="font-size:12px;color:var(--ind)">→</span>')+'</div>';
  }).join('');
  h.innerHTML='<div style="font-size:12px;font-weight:700;color:var(--sub);margin-bottom:12px">'+docs.length+' Member'+(docs.length!==1?'s':'')+'</div>'+rows;
}

async function _renderClubLeaderboard(clubId){
  const host=document.getElementById('club-lb-'+clubId);
  if(!host) return;
  if(!firebaseDb){ host.innerHTML='<div style="text-align:center;color:var(--mut);font-size:12px;padding:20px">No connection</div>'; return; }
  try{ await syncClubActivity(); }catch(e){}
  let docs=[];
  try{
    const snap=await firebaseDb.collection('clubs').doc(clubId).collection('members').get();
    docs=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){ const h=document.getElementById('club-lb-'+clubId); if(h) h.innerHTML='<div style="text-align:center;color:var(--mut);font-size:12px;padding:20px">Could not load progress ('+(e.code||'error')+')</div>'; return; }
  const h=document.getElementById('club-lb-'+clubId); if(!h) return;
  const gStreak=_computeGroupStreak(docs);
  const weekHrsTotal=docs.reduce((s,m)=>s+(m.weekHrs||0),0);
  const monthHrsTotal=docs.reduce((s,m)=>s+(m.monthHrs||0),0);
  const myUid=AUTH&&AUTH.uid;
  // Shared cohort goal (collective, not ranked) — stored on the club doc.
  let goalHrs=0;
  try{ const cdoc=await firebaseDb.collection('clubs').doc(clubId).get(); goalHrs=(cdoc.exists&&Number(cdoc.data().monthlyGoalHrs))||0; }catch(e){}
  const monthName=new Date().toLocaleDateString('en-US',{month:'long'});
  let goalCard;
  if(goalHrs>0){
    const pct=Math.min(100,Math.round((monthHrsTotal/goalHrs)*100));
    const done=monthHrsTotal>=goalHrs;
    goalCard='<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:14px;padding:14px 16px;margin-bottom:14px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:12px;font-weight:800;color:var(--txt)">'+monthName+' cohort goal</div><button onclick="openCohortGoalModal(\''+clubId+'\')" style="font-size:11px;font-weight:700;color:var(--ind);background:none;border:none;cursor:pointer">Edit</button></div>'+
      '<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:7px"><span style="font-size:20px;font-weight:900;color:'+(done?'var(--grn)':'var(--ind)')+'">'+monthHrsTotal.toFixed(0)+'h</span><span style="font-size:12px;color:var(--mut)">of '+goalHrs+'h together'+(done?' — crushed it!':'')+'</span></div>'+
      '<div style="height:9px;background:var(--bdr);border-radius:6px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+(done?'#10b981,#34d399':'var(--ind),#818cf8')+');border-radius:6px;transition:width .5s"></div></div>'+
      '<div style="font-size:10.5px;color:var(--mut);margin-top:5px">'+pct+'% there · everyone\'s hours count toward it</div>'+
    '</div>';
  } else {
    goalCard='<div style="background:var(--surf2);border:1px dashed var(--bdr);border-radius:14px;padding:14px 16px;margin-bottom:14px;text-align:center">'+
      '<div style="font-size:12.5px;font-weight:700;color:var(--sub);margin-bottom:3px">Set a shared goal for '+monthName+'</div>'+
      '<div style="font-size:11px;color:var(--mut);margin-bottom:10px">A collective hours target the whole cohort works toward together.</div>'+
      '<button class="btn btn-ind btn-sm" onclick="openCohortGoalModal(\''+clubId+'\')">Set cohort goal</button>'+
    '</div>';
  }
  // Supportive view — members listed by who's active, not ranked against each other.
  // Active-this-week first, then by name; no rank numbers or medals.
  const members=docs.slice().sort((a,b)=>{
    const aw=(a.weekHrs||0)>0?0:1, bw=(b.weekHrs||0)>0?0:1;
    if(aw!==bw) return aw-bw;
    return String(a.name||'').localeCompare(String(b.name||''));
  });
  const rows=members.map((m)=>{
    const isYou=(m.uid&&m.uid===myUid)||m.id===myUid;
    const initials=(m.initials||(m.name||'M').slice(0,2)).toString().toUpperCase();
    const color=m.color||'#5a5fcf';
    const active=(m.weekHrs||0)>0;
    return '<div style="display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid var(--bdr)'+(isYou?';background:var(--ind-bg);padding-left:10px;padding-right:10px;margin-left:-10px;margin-right:-10px;border-radius:8px':'')+'">'+
      '<div class="avatar" style="width:32px;height:32px;font-size:10px;border-radius:50%;background:'+color+';color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+esc(initials)+'</div>'+
      '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+esc(m.name||'Member')+(isYou?' (you)':'')+'</div>'+
        '<div style="font-size:10px;color:var(--mut);margin-top:1px">'+Math.round(m.totalHrs||0)+'h total · '+ico('flame')+''+(m.streak||0)+'d streak</div></div>'+
      '<div style="text-align:right;flex-shrink:0"><div style="font-size:12px;font-weight:800;color:'+(active?'var(--ora)':'var(--mut)')+'">'+(m.weekHrs||0).toFixed(1)+'h</div><div style="font-size:10px;color:var(--mut)">this week</div></div>'+
    '</div>';
  }).join('');
  const streakBanner='<div style="background:linear-gradient(135deg,#1c1206,#2a1a0a);border-radius:14px;padding:16px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px">'+
    '<div style="font-size:34px">'+ico('flame')+'</div>'+
    '<div style="flex:1"><div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-.02em">'+gStreak+'-day group streak</div>'+
      '<div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:2px">'+(gStreak>0?'Keep it alive — someone must log a session today.':'Log a session today to start your group’s streak.')+'</div></div></div>';
  const summary='<div style="display:flex;gap:10px;margin-bottom:14px">'+
    '<div style="flex:1;background:var(--surf2);border-radius:10px;padding:10px 12px;text-align:center"><div style="font-size:16px;font-weight:900;color:var(--ora)">'+weekHrsTotal.toFixed(1)+'h</div><div style="font-size:10px;color:var(--mut)">team this week</div></div>'+
    '<div style="flex:1;background:var(--surf2);border-radius:10px;padding:10px 12px;text-align:center"><div style="font-size:16px;font-weight:900;color:var(--ind)">'+members.length+'</div><div style="font-size:10px;color:var(--mut)">cohort member'+(members.length!==1?'s':'')+'</div></div></div>';
  h.innerHTML=goalCard+streakBanner+summary+(rows||'<div style="text-align:center;color:var(--mut);font-size:12px;padding:20px">No member activity yet — log a session to be first!</div>');
}

// Shared cohort goal — collective monthly hours target, stored on the club doc so
// every member sees the same number and contributes to it.
function openCohortGoalModal(clubId){
  let el=document.getElementById('cohort-goal-modal'); if(el)el.remove();
  el=document.createElement('div'); el.id='cohort-goal-modal'; el.className='modal-overlay open';
  el.onclick=()=>{ if(event.target===el) el.remove(); };
  const monthName=new Date().toLocaleDateString('en-US',{month:'long'});
  el.innerHTML='<div class="modal-box" onclick="event.stopPropagation()" style="max-width:360px">'+
    '<div class="modal-hdr"><div class="modal-title">'+monthName+' cohort goal</div><button class="modal-close" onclick="document.getElementById(\'cohort-goal-modal\').remove()">×</button></div>'+
    '<div style="padding:4px 2px 0"><div style="font-size:12.5px;color:var(--sub);line-height:1.6;margin-bottom:14px">Set a collective hours target for the whole cohort this month. Everyone\'s logged hours add up toward it — supportive, not a competition.</div>'+
    '<label style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.05em">Total hours together</label>'+
    '<input id="cohort-goal-input" type="number" min="1" step="10" placeholder="e.g. 200" style="width:100%;margin-top:6px;padding:11px 13px;background:var(--surf2);border:1px solid var(--bdr);border-radius:9px;color:var(--txt);font-size:15px;font-weight:700;outline:none">'+
    '<div style="display:flex;gap:7px;margin-top:9px;flex-wrap:wrap">'+[100,200,300,500].map(v=>'<button onclick="document.getElementById(\'cohort-goal-input\').value='+v+'" style="flex:1;min-width:60px;padding:7px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;color:var(--sub);font-size:12px;font-weight:700;cursor:pointer">'+v+'h</button>').join('')+'</div>'+
    '<button class="btn btn-ind" style="width:100%;justify-content:center;margin-top:16px" onclick="saveCohortGoal(\''+clubId+'\')">Set goal</button>'+
    '</div></div>';
  document.body.appendChild(el);
  if(firebaseDb){ firebaseDb.collection('clubs').doc(clubId).get().then(d=>{ const v=d.exists&&Number(d.data().monthlyGoalHrs); const inp=document.getElementById('cohort-goal-input'); if(inp&&v) inp.value=v; }).catch(()=>{}); }
  setTimeout(()=>document.getElementById('cohort-goal-input')?.focus(),60);
}
async function saveCohortGoal(clubId){
  const inp=document.getElementById('cohort-goal-input');
  const v=Math.max(0,Math.round(Number(inp&&inp.value)||0));
  if(!v){ showToast('Enter an hours target','err'); return; }
  if(!firebaseDb){ showToast('Offline — try again later','err'); return; }
  try{
    await firebaseDb.collection('clubs').doc(clubId).set({monthlyGoalHrs:v,monthlyGoalSetBy:(S&&S.name)||'',monthlyGoalAt:Date.now()},{merge:true});
    document.getElementById('cohort-goal-modal')?.remove();
    showToast('Cohort goal set: '+v+'h together this month','ok');
    if(typeof _renderClubLeaderboard==='function') _renderClubLeaderboard(clubId);
  }catch(e){ showToast('Could not save goal','err'); }
}

function sendClubViewMessage(clubId){
  const inp=document.getElementById('cva-inp-'+clubId);
  const text=inp?.value?.trim(); if(!text) return;
  if(!AUTH){ showToast('Sign in to send messages','err'); return; }
  if(!firebaseDb){ showToast('No connection — check your internet','err'); return; }
  if(!_isPrivateClub(clubId)&&_badWords(text)) return;
  const sendBtn=document.getElementById('cva-send-'+clubId);
  inp.value='';inp.style.height='auto';
  if(sendBtn)sendBtn.disabled=true;
  firebaseDb.collection('clubs').doc(clubId).collection('messages')
    .add({from:AUTH.uid,text,timestamp:firebase.firestore.FieldValue.serverTimestamp()})
    .then(()=>firebaseDb.collection('clubs').doc(clubId).set({lastMessage:text,lastFrom:AUTH.uid,lastAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}))
    .catch(e=>{
      console.warn('sendClubViewMessage error:',e.code,e.message);
      if(inp){inp.value=text;inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,120)+'px';}
      if(sendBtn)sendBtn.disabled=false;
      if(e.code==='permission-denied'||e.code==='PERMISSION_DENIED'){
        showToast('Couldn\'t send that message — please try again.','err');
      } else if(e.code==='unavailable'||e.code==='failed-precondition'){
        showToast('Offline — message will send when reconnected','info');
      } else {
        showToast('Failed to send: '+e.code,'err');
      }
    });
}
function leaveClubFull(clubId){
  const club=(S.clubs||[]).find(c=>c.id===clubId);
  const nm=club?club.name:'this club';
  const isCohort=clubId.indexOf('firm_')===0;
  let el=document.getElementById('leave-club-modal'); if(el)el.remove();
  el=document.createElement('div'); el.id='leave-club-modal'; el.className='modal-overlay open';
  el.onclick=function(e){ if(e.target===el) el.remove(); };
  el.innerHTML='<div class="modal-box" onclick="event.stopPropagation()" style="max-width:340px;text-align:center">'+
    '<div style="font-size:32px;margin-bottom:6px">'+ico('wave')+'</div>'+
    '<div class="modal-title" style="margin-bottom:8px">Leave '+esc(nm)+'?</div>'+
    '<div style="font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:18px">'+(isCohort?'You\'ll stop seeing this cohort\'s progress and chat. You can rejoin anytime with the invite link.':'You can rejoin anytime.')+'</div>'+
    '<div style="display:flex;gap:8px;justify-content:center"><button class="btn btn-ghost" onclick="document.getElementById(\'leave-club-modal\').remove()">Cancel</button>'+
    '<button class="btn" style="background:var(--red);color:#fff" onclick="_confirmLeaveClub(\''+clubId+'\')">Leave</button></div>'+
  '</div>';
  document.body.appendChild(el);
}
function _confirmLeaveClub(clubId){
  document.getElementById('leave-club-modal')?.remove();
  const club=(S.clubs||[]).find(c=>c.id===clubId);
  const nm=club?club.name:'this club';
  S.clubs=(S.clubs||[]).filter(c=>c.id!==clubId);
  saveState();
  // Firestore cleanup so the shared member count + leaderboard update for everyone.
  if(firebaseDb&&AUTH&&AUTH.uid){
    firebaseDb.collection('clubs').doc(clubId).collection('members').doc(AUTH.uid).delete().catch(()=>{});
    const _upd={memberCount:firebase.firestore.FieldValue.increment(-1)};
    // Shared (user-created) clubs track membership in a uid array; leaving it
    // is what stops syncMyClubs() from adding the club straight back.
    if(club&&!club.isCohort&&!club.isPublic) _upd.members=firebase.firestore.FieldValue.arrayRemove(AUTH.uid);
    firebaseDb.collection('clubs').doc(clubId).set(_upd,{merge:true}).catch(()=>{});
  }
  closeClubView();
  renderTab();
  showToast('Left '+nm+'.','info');
}

function closeClubView(){
  _detachClubViewListener();
  _detachClubPresence();
  if(history.state?.view==='clubPage'){history.back();return;}
  document.getElementById('club-view-modal')?.classList.remove('open');
}

