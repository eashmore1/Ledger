"""
Full revamp of clubs and direct messaging to use Firebase Firestore.
"""

with open('/home/user/Ledger/index.html', 'r') as f:
    content = f.read()

original_len = len(content)

def rep(old, new, desc=""):
    global content
    if old not in content:
        print(f"  WARNING: Pattern not found for: {desc or old[:60]}")
        return False
    count = content.count(old)
    if count > 1:
        print(f"  WARNING: {count} matches for: {desc or old[:60]}")
    content = content.replace(old, new, 1)
    print(f"  OK: {desc or old[:60]!r}")
    return True

# ─────────────────────────────────────────────────────────────────────────────
# 1. ADD FIREBASE MESSAGING HELPERS before openDirectMessage
# ─────────────────────────────────────────────────────────────────────────────
NEW_HELPERS = r"""// ── FIREBASE MESSAGING HELPERS ────────────────────────────────────────────
let _activeMsgUnsub = null;
let _clubViewMsgUnsub = null;

function _detachMsgListener(){ if(_activeMsgUnsub){ _activeMsgUnsub(); _activeMsgUnsub=null; } }
function _detachClubViewListener(){ if(_clubViewMsgUnsub){ _clubViewMsgUnsub(); _clubViewMsgUnsub=null; } }

function _convId(uid1, uid2){ return [uid1,uid2].sort().join('__dm__'); }

function _fbMsgAuthorInfo(fromUid){
  if(!fromUid||fromUid==='system') return {name:'System',initials:'SY',color:'var(--mut)'};
  if(fromUid===AUTH?.uid||fromUid==='you'){
    const n=S?.name||'You';
    return {name:'You',initials:n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'ME',color:'var(--ora)'};
  }
  const f=REAL_USERS.find(u=>u.id===fromUid);
  if(f) return {name:f.name,initials:f.initials||f.name.slice(0,2).toUpperCase(),color:f.color||'#5a5fcf'};
  return {name:'Member',initials:'??',color:'#5a5fcf'};
}

function _renderFirebaseMsgs(areaId, msgs){
  const area=document.getElementById(areaId); if(!area) return;
  if(!msgs||!msgs.length){ area.innerHTML='<div class="chat-system">— No messages yet. Say hello! 👋 —</div>'; return; }
  area.innerHTML=msgs.map(msg=>{
    if(msg.isSystem||msg.from==='system') return `<div class="chat-system">— ${msg.text} —</div>`;
    const isMine=msg.from===AUTH?.uid;
    const {name,initials,color}=_fbMsgAuthorInfo(msg.from);
    const ts=msg.timestamp?.toDate?.() ? msg.timestamp.toDate() : (msg.timestamp ? new Date(msg.timestamp) : new Date());
    const timeStr=ts.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    return `<div class="chat-row${isMine?' mine':''}">
      <div class="avatar" style="width:26px;height:26px;font-size:10px;border-radius:50%;background:${color};color:#fff;flex-shrink:0">${initials}</div>
      <div>${!isMine?`<div style="font-size:10px;color:var(--mut);margin-bottom:2px;font-weight:600">${name}</div>`:''}
        <div class="chat-bub ${isMine?'chat-bub-mine':'chat-bub-them'}">${msg.text}</div>
        <div class="chat-meta${!isMine?' chat-meta-them':''}">${timeStr}</div></div></div>`;
  }).join('');
  area.scrollTop=area.scrollHeight;
}

function _attachMsgListener(collection, docId, areaId){
  _detachMsgListener();
  if(!firebaseDb){ document.getElementById(areaId)&&(document.getElementById(areaId).innerHTML='<div class="chat-system">— Offline —</div>'); return; }
  const msgsRef=firebaseDb.collection(collection).doc(docId).collection('messages').orderBy('timestamp','asc').limitToLast(100);
  _activeMsgUnsub=msgsRef.onSnapshot(snap=>{
    _renderFirebaseMsgs(areaId, snap.docs.map(d=>({...d.data(),id:d.id})));
  }, err=>{
    console.warn('Msg listener error:',err);
    const area=document.getElementById(areaId);
    if(area) area.innerHTML='<div class="chat-system">— Could not load messages —</div>';
  });
}

async function sendFirebaseMessage(channelId, collection){
  const inp=document.getElementById('cci-'+channelId);
  const text=inp?.value?.trim(); if(!text) return;
  if(!AUTH||!firebaseDb){ showToast('Sign in to send messages','err'); return; }
  inp.value='';
  try{
    await firebaseDb.collection(collection).doc(channelId).collection('messages').add({from:AUTH.uid,text,timestamp:firebase.firestore.FieldValue.serverTimestamp()});
    await firebaseDb.collection(collection).doc(channelId).set({lastMessage:text,lastAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  }catch(e){
    console.warn('sendFirebaseMessage error:',e); showToast('Failed to send message','err'); if(inp) inp.value=text;
  }
}

function _openFbChat(channelId, collection, title, subtitle){
  _detachMsgListener();
  let el=document.getElementById('club-chat-modal');
  if(!el){
    el=document.createElement('div'); el.id='club-chat-modal'; el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:520px;max-height:90vh;display:flex;flex-direction:column;padding:0;overflow:hidden"><div id="club-chat-content" style="display:flex;flex-direction:column;flex:1;overflow:hidden"></div></div>`;
    el.addEventListener('click',e=>{if(e.target===el)closeClubChat();}); document.body.appendChild(el);
  }
  const content=document.getElementById('club-chat-content');
  content.innerHTML=`
<div style="flex-shrink:0;padding:16px 20px 14px;border-bottom:1px solid var(--bdr)">
  <div style="display:flex;align-items:center;gap:10px">
    <div style="font-size:20px">${collection==='conversations'?'💬':'👥'}</div>
    <div style="min-width:0;flex:1"><div style="font-size:15px;font-weight:800">${title}</div><div style="font-size:10px;color:var(--mut)">${subtitle}</div></div>
    <button class="modal-close" onclick="closeClubChat()">×</button>
  </div>
</div>
<div class="club-chat-area" id="cca-${channelId}" style="flex:1;padding:12px 20px;height:auto;min-height:0;overflow-y:auto"><div style="text-align:center;color:var(--mut);font-size:12px;padding:20px">Loading…</div></div>
<div class="chat-footer" style="flex-shrink:0;padding:10px 20px 16px;border-top:1px solid var(--bdr)">
  <input class="chat-inp" id="cci-${channelId}" placeholder="Message…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendFirebaseMessage('${channelId}','${collection}');}">
  <button class="chat-send" onclick="sendFirebaseMessage('${channelId}','${collection}')">Send</button>
</div>`;
  el.classList.add('open');
  _attachMsgListener(collection, channelId, 'cca-'+channelId);
  setTimeout(()=>document.getElementById('cci-'+channelId)?.focus(), 100);
}

"""

rep(
    "function openDirectMessage(userId, displayName, displayInitials){",
    NEW_HELPERS + "function openDirectMessage(userId, displayName, displayInitials){",
    "Insert Firebase messaging helpers"
)

# ─────────────────────────────────────────────────────────────────────────────
# 2. REPLACE openDirectMessage — deterministic conv ID + Firestore
# ─────────────────────────────────────────────────────────────────────────────
OLD_OPEN_DM = """function openDirectMessage(userId, displayName, displayInitials){
  const f=REAL_USERS.find(x=>x.id===userId);
  const name=f?.name||displayName||'User';
  const initials=f?.initials||displayInitials||(name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())||'??';
  const color=f?.color||'#5a5fcf';
  if(!S.clubs)S.clubs=[];
  let directClub=(S.clubs).find(c=>c.isDM&&c.members.includes(userId));
  if(!directClub){
    const clubId='c'+Date.now();
    directClub={id:clubId,name,icon:initials[0]||'💬',color,desc:'Direct message',isPrivate:true,isDM:true,members:['you',userId],created:Date.now()};
    S.clubs.push(directClub);
    if(!S.clubMessages)S.clubMessages={};
    S.clubMessages[clubId]=[{author:'system',text:`Conversation started with ${name}`,time:new Date().toISOString(),isSystem:true}];
    saveState();
  }
  closeUserProfile();
  openClubChat(directClub.id);
}"""

NEW_OPEN_DM = """async function openDirectMessage(userId, displayName, displayInitials){
  if(!AUTH){ showToast('Sign in to message users','err'); return; }
  const f=REAL_USERS.find(x=>x.id===userId);
  const name=f?.name||displayName||'User';
  const initials=f?.initials||displayInitials||(name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())||'??';
  const color=f?.color||'#5a5fcf';

  // Deterministic conversation ID
  const convId=_convId(AUTH.uid, userId);

  // Ensure conversation doc exists in Firestore
  if(firebaseDb){
    try{
      const convRef=firebaseDb.collection('conversations').doc(convId);
      const snap=await convRef.get();
      if(!snap.exists){
        await convRef.set({participants:[AUTH.uid,userId],createdAt:firebase.firestore.FieldValue.serverTimestamp(),lastMessage:'',lastAt:firebase.firestore.FieldValue.serverTimestamp()});
      }
    }catch(e){ console.warn('DM create error:',e); }
  }

  // Sync local club record
  if(!S.clubs) S.clubs=[];
  let localDM=S.clubs.find(c=>c.isDM&&c.members.includes(userId));
  if(!localDM){
    localDM={id:convId,name,icon:initials[0]||'💬',color,desc:'Direct message',isPrivate:true,isDM:true,members:['you',userId],created:Date.now()};
    S.clubs.push(localDM); saveState();
  } else if(localDM.id!==convId){
    localDM.id=convId; saveState();
  }

  closeUserProfile();
  _openFbChat(convId,'conversations',name,'💬 Direct message');
}"""

rep(OLD_OPEN_DM, NEW_OPEN_DM, "Replace openDirectMessage")

# ─────────────────────────────────────────────────────────────────────────────
# 3. REPLACE openClubChat — delegate to _openFbChat
# ─────────────────────────────────────────────────────────────────────────────
OLD_OPEN_CLUB_CHAT = """function openClubChat(clubId){
  const club=(S.clubs||[]).find(c=>c.id===clubId);if(!club)return;
  let el=document.getElementById('club-chat-modal');
  if(!el){
    el=document.createElement('div');
    el.id='club-chat-modal';
    el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:520px;max-height:90vh;display:flex;flex-direction:column;padding:0;overflow:hidden"><div id="club-chat-content" style="display:flex;flex-direction:column;flex:1;overflow:hidden"></div></div>`;
    el.addEventListener('click',e=>{if(e.target===el)closeClubChat();});
    document.body.appendChild(el);
  }
  renderClubChat(clubId);
  el.classList.add('open');
}"""

NEW_OPEN_CLUB_CHAT = """function openClubChat(clubId){
  const club=(S.clubs||[]).find(c=>c.id===clubId); if(!club) return;
  if(club.isDM){
    const otherUid=club.members.find(m=>m!=='you'&&m!==AUTH?.uid);
    const realConvId=AUTH?.uid&&otherUid?_convId(AUTH.uid,otherUid):clubId;
    const f=REAL_USERS.find(x=>x.id===otherUid);
    _openFbChat(realConvId,'conversations',club.name,'💬 Direct message');
  } else {
    const memberCount=club.members.length;
    _openFbChat(clubId,'clubs',club.name,`👥 ${memberCount} member${memberCount!==1?'s':''}`);
  }
}"""

rep(OLD_OPEN_CLUB_CHAT, NEW_OPEN_CLUB_CHAT, "Replace openClubChat")

# ─────────────────────────────────────────────────────────────────────────────
# 4. REPLACE renderClubChat — keep function but simplify (openClubChat now uses _openFbChat)
# ─────────────────────────────────────────────────────────────────────────────
# Find the full renderClubChat function by content
old_rcc_start = "function renderClubChat(clubId){"
old_rcc_end = "}\nfunction sendClubMessage(clubId){"

# We'll find the block by searching
import re
rcc_match = re.search(r'function renderClubChat\(clubId\)\{.*?\}\nfunction sendClubMessage', content, re.DOTALL)
if rcc_match:
    old_rcc = rcc_match.group(0)
    new_rcc = """function renderClubChat(clubId){
  // Deprecated: openClubChat now uses _openFbChat directly.
  openClubChat(clubId);
}
function sendClubMessage(clubId){"""
    content = content.replace(old_rcc, new_rcc, 1)
    print("  OK: Replace renderClubChat (deprecated)")
else:
    print("  WARNING: renderClubChat match failed, trying simple approach")
    rep(
        "function renderClubChat(clubId){",
        "function renderClubChat_OLD(clubId){",
        "Mark renderClubChat as old"
    )

# ─────────────────────────────────────────────────────────────────────────────
# 5. REPLACE sendClubMessage — use sendFirebaseMessage, remove fake replies
# ─────────────────────────────────────────────────────────────────────────────
scm_match = re.search(r'function sendClubMessage\(clubId\)\{.*?\}\n\nfunction closeClubChat', content, re.DOTALL)
if scm_match:
    old_scm = scm_match.group(0)
    new_scm = """function sendClubMessage(clubId){
  sendFirebaseMessage(clubId, 'clubs');
}

function closeClubChat"""
    content = content.replace(old_scm, new_scm, 1)
    print("  OK: Replace sendClubMessage")
else:
    print("  WARNING: sendClubMessage match failed")
    rep(
        "function sendClubMessage(clubId){\n  const inp=document.getElementById('cci-'+clubId);",
        "function sendClubMessage(clubId){ sendFirebaseMessage(clubId,'clubs'); }\nfunction sendClubMessage_DEAD(clubId_DEAD){\n  const inp_DEAD=document.getElementById('cci-'+clubId_DEAD);",
        "Replace sendClubMessage fallback"
    )

# ─────────────────────────────────────────────────────────────────────────────
# 6. UPDATE closeClubChat — add _detachMsgListener
# ─────────────────────────────────────────────────────────────────────────────
rep(
    "function closeClubChat(){document.getElementById('club-chat-modal')?.classList.remove('open');}",
    "function closeClubChat(){_detachMsgListener();document.getElementById('club-chat-modal')?.classList.remove('open');}",
    "Add _detachMsgListener to closeClubChat"
)

# ─────────────────────────────────────────────────────────────────────────────
# 7. REPLACE joinPublicClub — add Firestore membership
# ─────────────────────────────────────────────────────────────────────────────
old_join = """function joinPublicClub(pubId){
  const pc=PUBLIC_CLUBS.find(c=>c.id===pubId);if(!pc)return;
  if(!S.clubs)S.clubs=[];
  if(S.clubs.find(c=>c.id===pubId)){showToast('Already a member!','info');return;}
  const club={id:pubId,name:pc.name,icon:pc.icon,desc:pc.desc,isPrivate:false,isDM:false,isPublic:true,
    members:['you'],created:Date.now()};
  S.clubs.push(club);
  if(!S.clubMessages)S.clubMessages={};
  S.clubMessages[pubId]=[
    {author:'system',text:'You joined '+pc.name+'! Welcome to the community 🎉',time:new Date().toISOString(),isSystem:true}
  ];
  saveState();
  renderTab();
  showToast('Joined '+pc.name+'! 🎉','ok');
}"""

new_join = """async function joinPublicClub(pubId){
  const pc=PUBLIC_CLUBS.find(c=>c.id===pubId); if(!pc) return;
  if(!S.clubs) S.clubs=[];
  if(S.clubs.find(c=>c.id===pubId)){ showToast('Already a member!','info'); return; }
  const club={id:pubId,name:pc.name,icon:pc.icon,desc:pc.desc,isPrivate:false,isDM:false,isPublic:true,members:['you'],created:Date.now()};
  S.clubs.push(club);
  saveState();
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
        from:'system', text:(S.name||'Someone')+' joined '+pc.name+'! 👋',
        timestamp:firebase.firestore.FieldValue.serverTimestamp(), isSystem:true
      });
    }catch(e){ console.warn('Club join Firestore error:',e); }
  }
  renderTab();
  showToast('Joined '+pc.name+'! 🎉','ok');
}"""

rep(old_join, new_join, "Replace joinPublicClub with Firebase")

# ─────────────────────────────────────────────────────────────────────────────
# 8. REPLACE renderClubViewBody — chat tab uses Firebase listener
# ─────────────────────────────────────────────────────────────────────────────
old_cvb_start = "function renderClubViewBody(clubId){\n\n  const club=(S.clubs||[]).find(c=>c.id===clubId);if(!club)return;\n\n  const el=document.getElementById('club-view-body');if(!el)return;\n\n  if(_clubViewTab==='chat'){"

# Find the chat tab section (from the start to the first else if)
cvb_chat_old = """  if(_clubViewTab==='chat'){
    const msgs=(S.clubMessages||{})[clubId]||[];
    const msgHTML=msgs.map(msg=>{
      if(msg.isSystem)return'<div class="chat-system">— '+msg.text+' —</div>';
      const isMine=msg.author==='you';
      const name=getClubMemberName(msg.author);
      const initials=getClubMemberInitials(msg.author);
      const color=getClubMemberColor(msg.author);
      const timeStr=new Date(msg.time).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
      return'<div class="chat-row'+(isMine?' mine':'')+'"><div class="avatar" style="width:26px;height:26px;font-size:10px;border-radius:50%;background:'+color+';color:#fff;flex-shrink:0">'+initials+'</div><div>'+(isMine?'':'<div style="font-size:10px;color:var(--mut);margin-bottom:2px;font-weight:600">'+name+'</div>')+'<div class="chat-bub '+(isMine?'chat-bub-mine':'chat-bub-them')+'">'+msg.text+'</div><div class="chat-meta'+(isMine?'':' chat-meta-them')+'">'+timeStr+'</div></div></div>';
    }).join('');
    el.innerHTML='<div class="club-chat-area" id="cva-chat-'+clubId+'" style="padding:12px 20px;min-height:200px;max-height:320px">'+(msgHTML||'<div class="chat-system">— No messages yet. Say hello! 👋 —</div>')+'</div><div class="chat-footer" style="padding:10px 20px 16px;border-top:1px solid var(--bdr)"><input class="chat-inp" id="cva-inp-'+clubId+'" placeholder="Message '+club.name+'…" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendClubViewMessage(\''+clubId+'\');}"><button class="chat-send" onclick="sendClubViewMessage(\''+clubId+'\')">Send</button></div>';
    setTimeout(()=>{const a=document.getElementById('cva-chat-'+clubId);if(a)a.scrollTop=a.scrollHeight;document.getElementById('cva-inp-'+clubId)?.focus();},50);
  } else if(_clubViewTab==='members'){"""

cvb_chat_new = """  if(_clubViewTab==='chat'){
    el.innerHTML='<div class="club-chat-area" id="cva-chat-'+clubId+'" style="padding:12px 20px;min-height:200px;max-height:320px;overflow-y:auto"><div style="text-align:center;color:var(--mut);font-size:12px;padding:20px">Loading…</div></div><div class="chat-footer" style="padding:10px 20px 16px;border-top:1px solid var(--bdr)"><input class="chat-inp" id="cva-inp-'+clubId+'" placeholder="Message '+club.name+'…" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendClubViewMessage(\''+clubId+'\');}"><button class="chat-send" onclick="sendClubViewMessage(\''+clubId+'\')">Send</button></div>';
    // Attach Firebase listener
    _detachClubViewListener();
    if(firebaseDb){
      _clubViewMsgUnsub=firebaseDb.collection('clubs').doc(clubId).collection('messages').orderBy('timestamp','asc').limitToLast(100).onSnapshot(snap=>{
        _renderFirebaseMsgs('cva-chat-'+clubId, snap.docs.map(d=>({...d.data(),id:d.id})));
        setTimeout(()=>document.getElementById('cva-inp-'+clubId)?.focus(), 50);
      }, err=>{ console.warn('Club view chat listener:',err); });
    }
  } else if(_clubViewTab==='members'){"""

rep(cvb_chat_old, cvb_chat_new, "Update renderClubViewBody chat tab to Firebase")

# ─────────────────────────────────────────────────────────────────────────────
# 9. REPLACE sendClubViewMessage — use Firebase, remove fake replies
# ─────────────────────────────────────────────────────────────────────────────
scvm_match = re.search(r'function sendClubViewMessage\(clubId\)\{.*?\}\n', content, re.DOTALL)
if scvm_match:
    old_scvm = scvm_match.group(0)
    new_scvm = """function sendClubViewMessage(clubId){
  const inp=document.getElementById('cva-inp-'+clubId);
  const text=inp?.value?.trim(); if(!text) return;
  if(!AUTH||!firebaseDb){ showToast('Not connected','err'); return; }
  inp.value='';
  firebaseDb.collection('clubs').doc(clubId).collection('messages').add({from:AUTH.uid,text,timestamp:firebase.firestore.FieldValue.serverTimestamp()})
    .then(()=>firebaseDb.collection('clubs').doc(clubId).set({lastMessage:text,lastAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}))
    .catch(e=>{ console.warn('sendClubViewMessage error:',e); showToast('Failed to send','err'); if(inp) inp.value=text; });
}
"""
    content = content.replace(old_scvm, new_scvm, 1)
    print("  OK: Replace sendClubViewMessage")
else:
    print("  WARNING: sendClubViewMessage match failed")

# ─────────────────────────────────────────────────────────────────────────────
# 10. ADD openMessagesPage and _renderMessagesPage AFTER closeMessagesModal
# ─────────────────────────────────────────────────────────────────────────────
MESSAGES_PAGE_FNS = """
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

async function _renderMessagesPage(){
  _mountPageShell('messages-page-content');
  const el=document.getElementById('messages-page-content');
  el.innerHTML='<div style="text-align:center;padding:60px;color:var(--mut);font-size:13px">Loading messages…</div>';

  // Load DM conversations from Firestore where user is a participant
  let firestoreDMs=[];
  if(firebaseDb&&AUTH){
    try{
      const snap=await firebaseDb.collection('conversations')
        .where('participants','array-contains',AUTH.uid)
        .orderBy('lastAt','desc').limit(50).get();
      firestoreDMs=snap.docs.map(d=>({id:d.id,...d.data()}));
    }catch(e){ console.warn('DMs load error:',e); }
  }

  // Merge local DMs not yet in Firestore
  const localDMs=(S.clubs||[]).filter(c=>c.isDM);
  const knownConvIds=new Set(firestoreDMs.map(d=>d.id));
  for(const dm of localDMs){
    if(!knownConvIds.has(dm.id)){
      const otherUid=dm.members.find(m=>m!=='you'&&m!==AUTH?.uid);
      firestoreDMs.push({id:dm.id,participants:[AUTH?.uid||'you',otherUid||''],lastMessage:'',lastAt:null,_local:dm});
    }
  }

  const clubs=(S.clubs||[]).filter(c=>!c.isDM);

  const dmHTML=firestoreDMs.length?firestoreDMs.map(conv=>{
    const otherUid=(conv.participants||[]).find(p=>p!==AUTH?.uid)||'';
    const f=REAL_USERS.find(u=>u.id===otherUid);
    const lDM=(S.clubs||[]).find(c=>c.isDM&&c.members.includes(otherUid));
    const name=f?.name||lDM?.name||'User';
    const initials=f?.initials||name.slice(0,2).toUpperCase();
    const color=f?.color||'#5a5fcf';
    const lastMsg=conv.lastMessage||'Start the conversation…';
    const lastAt=conv.lastAt?.toDate?.()?conv.lastAt.toDate().toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
    return '<div onclick="_openFbChat(\''+conv.id+'\',\'conversations\',\''+name.replace(/\'/g,'\\\'')+'  \',\'💬 Direct message\')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;cursor:pointer;transition:background .12s" onmouseover="this.style.background=\'var(--surf2)\'" onmouseout="this.style.background=\'transparent\'">'
      +'<div class="avatar av-md" style="background:'+color+';color:#fff;flex-shrink:0">'+initials+'</div>'
      +'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:13px;font-weight:700">'+name+'</div><div style="font-size:10px;color:var(--mut)">'+lastAt+'</div></div>'
      +'<div style="font-size:11px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">'+lastMsg+'</div></div></div>';
  }).join(''):'<div class="empty-state" style="padding:30px 0"><div class="empty-icon">💬</div><div class="empty-msg">No direct messages yet.<br>Visit someone\'s profile and tap 💬 to start a conversation.</div></div>';

  const clubHTML=clubs.length?clubs.map(c=>{
    const msgs=(S.clubMessages||{})[c.id]||[];
    const lastMsgObj=msgs.slice(-1)[0];
    const lastMsg=lastMsgObj?(lastMsgObj.author==='you'?'You: ':(getClubMemberName(lastMsgObj.author)+': '))+lastMsgObj.text:'No messages yet';
    const lastAt=lastMsgObj?timeAgo(lastMsgObj.time):'';
    return '<div onclick="openClubPage(\''+c.id+'\')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;cursor:pointer;transition:background .12s" onmouseover="this.style.background=\'var(--surf2)\'" onmouseout="this.style.background=\'transparent\'">'
      +'<div style="width:44px;height:44px;border-radius:12px;background:var(--ind-bg);border:1px solid rgba(99,102,241,.25);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+c.icon+'</div>'
      +'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:13px;font-weight:700">'+c.name+'</div><div style="font-size:10px;color:var(--mut)">'+lastAt+'</div></div>'
      +'<div style="font-size:11px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">'+lastMsg+'</div></div></div>';
  }).join(''):'<div class="empty-state" style="padding:30px 0"><div class="empty-icon">🏛️</div><div class="empty-msg">No study clubs yet.<br><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="createClubModal()">+ Create a Club</button></div></div>';

  el.innerHTML=`
  <div style="margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:22px;font-weight:900;letter-spacing:-.02em">Messages</div>
    <button class="btn btn-ghost btn-sm" onclick="createClubModal()">+ New Club</button>
  </div>
  <div class="profile-layout" style="margin-top:0">
    <div>
      <div style="font-size:15px;font-weight:800;margin-bottom:10px">💬 Direct Messages</div>
      <div style="background:var(--surf);border:1.5px solid var(--bdr);border-radius:14px;overflow:hidden;margin-bottom:24px">${dmHTML}</div>
      <div style="font-size:15px;font-weight:800;margin-bottom:10px">🏛️ Study Clubs</div>
      <div style="background:var(--surf);border:1.5px solid var(--bdr);border-radius:14px;overflow:hidden">${clubHTML}</div>
    </div>
    <div class="profile-sidebar">
      <div class="sb-card">
        <div class="sb-title">Explore Public Clubs</div>
        <p style="font-size:12px;color:var(--mut);line-height:1.6;margin-bottom:12px">Join study clubs to connect with CPA candidates studying the same sections.</p>
        <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center" onclick="switchTab('explore')">Browse Clubs →</button>
      </div>
      <div class="sb-card" style="margin-top:0">
        <div class="sb-title">Create a Private Club</div>
        <p style="font-size:12px;color:var(--mut);line-height:1.6;margin-bottom:12px">Start a private study club and invite people you follow.</p>
        <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center" onclick="createClubModal()">+ New Club</button>
      </div>
    </div>
  </div>`;
  window.scrollTo({top:0});
}
"""

rep(
    "function closeMessagesModal(){document.getElementById('messages-modal')?.classList.remove('open');}",
    "function closeMessagesModal(){document.getElementById('messages-modal')?.classList.remove('open');}\n" + MESSAGES_PAGE_FNS,
    "Add openMessagesPage and _renderMessagesPage"
)

# ─────────────────────────────────────────────────────────────────────────────
# 11. REDIRECT openMessagesModal to openMessagesPage
# ─────────────────────────────────────────────────────────────────────────────
# Replace just the first line of openMessagesModal with a redirect
rep(
    "function openMessagesModal(){\n  let el=document.getElementById('messages-modal');",
    "function openMessagesModal(){ openMessagesPage(); return; }\nfunction _openMessagesModal_legacy(){\n  let el=document.getElementById('messages-modal');",
    "Redirect openMessagesModal to openMessagesPage"
)

# ─────────────────────────────────────────────────────────────────────────────
# 12. ADD messagesPage ROUTING to popstate handler
# ─────────────────────────────────────────────────────────────────────────────
rep(
    "  else if(view==='clubPage' && AUTH && S){ _renderClubPage(e.state.clubId); }",
    "  else if(view==='clubPage' && AUTH && S){ _renderClubPage(e.state.clubId); }\n  else if(view==='messagesPage' && AUTH && S){ _renderMessagesPage(); }",
    "Add messagesPage case to popstate"
)

# ─────────────────────────────────────────────────────────────────────────────
# 13. ADD /messages DEEPLINK DETECTION to renderApp
# ─────────────────────────────────────────────────────────────────────────────
rep(
    "  else if(_clubMatch){setTimeout(()=>openClubPage(decodeURIComponent(_clubMatch[1])),80);}",
    "  else if(_clubMatch){setTimeout(()=>openClubPage(decodeURIComponent(_clubMatch[1])),80);}\n  else if(window.location.pathname==='/messages'){setTimeout(()=>openMessagesPage(),80);}",
    "Add /messages deeplink detection"
)

# ─────────────────────────────────────────────────────────────────────────────
# 14. UPDATE nav button from modal to page
# ─────────────────────────────────────────────────────────────────────────────
rep(
    '<button onclick="openMessagesModal()" title="Messages" class="btn btn-ghost btn-sm nav-btn-msg"',
    '<button onclick="openMessagesPage()" title="Messages" class="btn btn-ghost btn-sm nav-btn-msg"',
    "Update nav 💬 button to openMessagesPage"
)

# ─────────────────────────────────────────────────────────────────────────────
# 15. UPDATE mobile more sheet button
# ─────────────────────────────────────────────────────────────────────────────
rep(
    'onclick="closeMobileMoreSheet();openMessagesModal()"',
    'onclick="closeMobileMoreSheet();openMessagesPage()"',
    "Update mobile sheet Messages button"
)

# ─────────────────────────────────────────────────────────────────────────────
# 16. UPDATE club "View All Clubs" button reference
# ─────────────────────────────────────────────────────────────────────────────
rep(
    "closeClubView();openMessagesModal()",
    "closeClubView();openMessagesPage()",
    "Update View All Clubs button"
)

# ─────────────────────────────────────────────────────────────────────────────
# 17. FIX PUBLIC_CLUBS fake member counts — replace hardcoded numbers with note
#     (actual counts will come from Firestore; we keep memberCount as default fallback)
# ─────────────────────────────────────────────────────────────────────────────
# We'll update _renderClubPage to fetch real count from Firestore and update DOM
# For the PUBLIC_CLUBS display in _renderClubPage, we add async fetching
old_public_club_display = "'🌐 Public Club · 👥 '+pc.memberCount.toLocaleString()+' members'"
new_public_club_display = "'🌐 Public Club · 👥 <span id=\"pub-mc-'+pc.id+'\">'+pc.memberCount.toLocaleString()+'</span> members'"
rep(old_public_club_display, new_public_club_display, "Add span for real member count")

# Add async count fetch after the club landing page is rendered
# Find the line that sets the public club landing page innerHTML and add fetch after
old_join_btn = """    <button onclick="joinPublicClub('${pc.id}');openClubPage('${pc.id}')" style="width:100%;padding:14px;background:var(--ind);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer">Join ${pc.name} →</button>
  </div>
</div>`;
    return;
  }"""

new_join_btn = """    <button onclick="joinPublicClub('${pc.id}');openClubPage('${pc.id}')" style="width:100%;padding:14px;background:var(--ind);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer">Join ${pc.name} →</button>
  </div>
</div>`;
    // Fetch real member count from Firestore
    if(firebaseDb){
      firebaseDb.collection('clubs').doc(pc.id).get().then(snap=>{
        if(snap.exists&&snap.data().memberCount){
          const el2=document.getElementById('pub-mc-'+pc.id);
          if(el2) el2.textContent=snap.data().memberCount.toLocaleString();
        }
      }).catch(()=>{});
    }
    return;
  }"""

rep(old_join_btn, new_join_btn, "Add Firestore member count fetch for public club landing")

# ─────────────────────────────────────────────────────────────────────────────
# Write output
# ─────────────────────────────────────────────────────────────────────────────
with open('/home/user/Ledger/index.html', 'w') as f:
    f.write(content)

print(f"\nDone. Original: {original_len} chars → New: {len(content)} chars (Δ {len(content)-original_len:+d})")
