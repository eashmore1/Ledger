// ═══════════════════════════════════════════════
// STUDY ROOMS — study alongside other people on one shared clock.
// A room is a small Firestore doc (rooms/{id}, or clubs/{clubId}/rooms/{id}
// for a club-only room) plus a members/ list that each person keeps fresh
// with a heartbeat. Joining a room starts your own session timer; the shared
// focus/break clock is derived from the room's start time, so nobody has to
// "run" it and everyone sees the same countdown.
// ═══════════════════════════════════════════════
const ROOM_FRESH_MS=150000;           // a member/room with no heartbeat for 2.5 min is gone
const ROOM_STALE_MS=6*3600000;        // rooms idle this long are swept
const ROOM_TIMERS=[{f:50,b:10,l:'50 min focus · 10 min break'},{f:25,b:5,l:'25 min focus · 5 min break'},{f:90,b:15,l:'90 min focus · 15 min break'},{f:0,b:0,l:'No timer — open study'}];
let _room=null;                       // the room I'm in: {id,clubId,ref,data,members,beat,tick,unsubM,unsubR,lastPhase,autoPaused,joinedAt}
let _roomsCache=[];
let _roomsTimer=null;
const ROOM_CHAT_MAX=300;              // characters per chat message
const ROOM_CHAT_KEEP=100;             // messages kept on screen

function _roomsCol(clubId){return clubId?firebaseDb.collection('clubs').doc(clubId).collection('rooms'):firebaseDb.collection('rooms');}
function _fmtMS(ms){const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
// Where the shared clock is right now.
function _roomPhase(r,now){
  now=now||Date.now();
  const f=(r.focusMin||0)*60000, b=(r.breakMin||0)*60000;
  if(!f) return {k:'open'};
  const cyc=f+b, since=Math.max(0,now-(r.timerStart||now)), pos=since%cyc;
  const round=Math.floor(since/cyc)+1;
  return pos<f?{k:'focus',left:f-pos,total:f,round}:{k:'break',left:cyc-pos,total:b,round};
}
function _roomPhaseText(r){
  const p=_roomPhase(r);
  if(p.k==='open') return 'Open study';
  return (p.k==='focus'?'Focus':'Break')+' · '+Math.max(1,Math.ceil(p.left/60000))+'m left';
}
function _roomFreshMembers(){const now=Date.now();return ((_room&&_room.members)||[]).filter(m=>m&&m.lastBeat&&now-m.lastBeat<ROOM_FRESH_MS);}

// ── The rooms card (Today and Explore) ──────────────────────────
function buildRoomsCard(){
  return `<div class="card card-pad today-card" id="rooms-card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">
      <div class="section-title" style="margin:0">Study rooms</div>
      <button class="btn btn-ghost btn-xs" onclick="openCreateRoom()">+ New room</button>
    </div>
    <div id="rooms-list">${_roomsListHTML()}</div>
  </div>`;
}
function _roomsListHTML(){
  const now=Date.now();
  const live=_roomsCache.filter(r=>r.lastActive&&now-r.lastActive<ROOM_FRESH_MS&&!(_room&&_room.id===r.id));
  let mine='';
  if(_room){
    mine=`<div class="room-row room-row-mine" onclick="openRoomView()">
      <span class="today-live-dot"></span>
      <div style="flex:1;min-width:0"><div class="room-row-name">${esc(_room.data.name||'Study room')}</div><div class="room-row-meta">You're in this room · ${_roomPhaseText(_room.data)}${_room.unread?' · <b style="color:var(--grn)">'+_room.unread+' new message'+(_room.unread===1?'':'s')+'</b>':''}</div></div>
      <button class="btn btn-xs" style="background:#22c55e;color:#04301c;border:none;font-weight:800">Open</button>
    </div>`;
  }
  if(!live.length&&!_room){
    return `<div style="font-size:13px;color:var(--sub);line-height:1.55;margin-bottom:12px">No rooms open right now. Start one and anyone can sit down next to you — same clock, same breaks.</div>
      <button class="btn btn-ind btn-sm" onclick="openCreateRoom()">Start a room</button>`;
  }
  return mine+live.map(r=>{
    const n=Math.max(1,r.count||1);
    return `<div class="room-row" data-room="${esc(r.id)}">
      <span class="today-live-dot"></span>
      <div style="flex:1;min-width:0">
        <div class="room-row-name">${esc(r.name||'Study room')}</div>
        <div class="room-row-meta">${n} studying · ${_roomPhaseText(r)}${r.clubName?' · '+esc(r.clubName):''}</div>
      </div>
      <button class="btn btn-ind btn-xs" onclick="joinRoom('${esc(r.id)}','${esc(r.clubId||'')}')">Join</button>
    </div>`;
  }).join('');
}
function _refreshRoomsList(){const el=document.getElementById('rooms-list');if(el)el.innerHTML=_roomsListHTML();}

// Load open rooms (public ones, plus rooms in my clubs) and keep the card fresh
// while it's on screen. A poll, not a listener: the card is glanceable, and a
// collection listener per visitor would cost far more reads.
async function watchRooms(){
  clearTimeout(_roomsTimer);
  if(!document.getElementById('rooms-card')) return;
  await loadRooms();
  _refreshRoomsList();
  _roomsTimer=setTimeout(()=>{ if(!document.hidden) watchRooms(); else _roomsTimer=setTimeout(watchRooms,30000); },30000);
}
async function loadRooms(){
  if(!firebaseDb||!AUTH||!AUTH.uid) return;
  const out=[], now=Date.now();
  const take=(d,clubId,clubName)=>{
    const r=d.data()||{};
    if(r.lastActive&&now-r.lastActive>ROOM_STALE_MS){ _clearRoomChat(d.ref).then(()=>d.ref.delete()).catch(()=>{}); return; } // sweep the long-dead
    out.push(Object.assign({},r,{id:d.id,clubId:clubId||'',clubName:clubName||''}));
  };
  const jobs=[firebaseDb.collection('rooms').orderBy('lastActive','desc').limit(15).get().then(s=>s.docs.forEach(d=>take(d,''))).catch(()=>{})];
  (S.clubs||[]).filter(c=>!c.isDM&&c.id).slice(0,6).forEach(c=>{
    jobs.push(_roomsCol(c.id).get().then(s=>s.docs.forEach(d=>take(d,c.id,c.name))).catch(()=>{}));
  });
  await Promise.all(jobs);
  _roomsCache=out.sort((a,b)=>(b.count||0)-(a.count||0)||(b.lastActive||0)-(a.lastActive||0));
}

// ── Create ──────────────────────────────────────────────────────
function openCreateRoom(){
  if(!firebaseDb||!AUTH||!AUTH.uid){showToast('Study rooms need a connection','err');return;}
  document.getElementById('room-create-modal')?.remove();
  const first=(S.name||'My').split(' ')[0];
  const clubs=(S.clubs||[]).filter(c=>!c.isDM&&c.id);
  const el=document.createElement('div');
  el.id='room-create-modal';
  el.className='modal-overlay open';
  el.style.zIndex='2000';
  el.innerHTML=`<div class="modal-box" style="max-width:420px" onclick="event.stopPropagation()">
    <div class="modal-hdr"><div class="modal-title">Start a study room</div><button class="modal-close" onclick="document.getElementById('room-create-modal').remove()">×</button></div>
    <div style="padding:4px 22px 22px">
      <div class="form-grp"><label>Room name</label><input id="rc-name" type="text" maxlength="60" value="${esc(first)}'s study room"></div>
      <div class="form-grp"><label>Shared timer</label><select id="rc-timer">${ROOM_TIMERS.map((t,i)=>`<option value="${i}">${t.l}</option>`).join('')}</select></div>
      <div class="form-grp"><label>Who can join</label><select id="rc-who"><option value="">Anyone on Ledger</option>${clubs.map(c=>`<option value="${esc(c.id)}">Only ${esc(c.name||'my club')}</option>`).join('')}</select></div>
      <button class="btn btn-primary" id="rc-go" style="width:100%;justify-content:center" onclick="createRoom()">Open room and start studying</button>
      <div style="font-size:11px;color:var(--mut);margin-top:10px;line-height:1.5;text-align:center">Your session timer starts when the room opens.</div>
    </div></div>`;
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.body.appendChild(el);
}
async function createRoom(){
  const btn=document.getElementById('rc-go'); if(btn&&btn.disabled) return;
  const name=safeText((document.getElementById('rc-name')?.value||'').trim()).slice(0,60);
  const t=ROOM_TIMERS[parseInt(document.getElementById('rc-timer')?.value)||0]||ROOM_TIMERS[0];
  const clubId=document.getElementById('rc-who')?.value||'';
  if(!name){showToast('Give the room a name','err');return;}
  if(_badWords(name)) return;
  if(btn){btn.disabled=true;btn.textContent='Opening…';}
  const id='r'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const now=Date.now();
  try{
    await _roomsCol(clubId).doc(id).set({name,hostUid:AUTH.uid,hostName:S.name||'Host',focusMin:t.f,breakMin:t.b,timerStart:now,createdAt:now,lastActive:now,count:1});
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Open room and start studying';}
    showToast('Could not open the room — try again','err');return;
  }
  document.getElementById('room-create-modal')?.remove();
  logLedgerEvent('room_created',{timer:t.f,club:!!clubId});
  await joinRoom(id,clubId);
  if(typeof notifyEvent==='function') notifyEvent('room_started',{roomId:id,clubId});
}

// ── Join / leave ────────────────────────────────────────────────
async function joinRoom(id,clubId){
  if(!firebaseDb||!AUTH||!AUTH.uid){showToast('Study rooms need a connection','err');return;}
  if(_room){ if(_room.id===id){openRoomView();return;} await leaveRoom(true); }
  if(TS.phase==='recap'){ showToast('Save or discard your finished session first','info'); document.getElementById('sess-overlay')?.classList.add('open'); renderSessCard(); return; }
  clubId=clubId||'';
  const ref=_roomsCol(clubId).doc(id);
  let snap=null;
  try{ snap=await ref.get(); }catch(e){}
  if(!snap||!snap.exists){showToast('That room has closed','info');watchRooms();return;}
  _room={id,clubId,ref,data:snap.data()||{},members:[],joinedAt:Date.now(),lastPhase:null,autoPaused:false};
  // Being in a room means studying: start (or pick back up) my own session.
  if(TS.phase==='paused') resumeTimer();
  else if(TS.phase!=='active') startTimer({section:TS.section||getCurrentSection(),material:TS.material||''});
  _room.lastPhase=_roomPhase(_room.data).k;
  _room.chat=[]; _room.unread=0;
  const firstBeat=_roomBeat();
  _room.beat=setInterval(_roomBeat,45000);
  _room.unsubM=ref.collection('members').onSnapshot(s=>{ if(!_room) return; _room.members=s.docs.map(d=>d.data()); _renderRoomMembers(); },()=>{});
  _room.unsubR=ref.onSnapshot(d=>{
    if(!_room) return;
    if(!d.exists){
      // Only the server saying "gone" closes the room — a local delete that the
      // rules then refuse shows up here first as "missing".
      const r=_room;
      const settle=firebaseDb.waitForPendingWrites?firebaseDb.waitForPendingWrites().catch(()=>{}):Promise.resolve();
      settle.then(()=>ref.get({source:'server'})).then(x=>{ if(_room===r&&!x.exists) _roomClosed(); }).catch(()=>{});
      return;
    }
    _room.data=d.data()||_room.data; _renderRoomClock();
  },()=>{});
  _room.tick=setInterval(_roomTick,1000);
  // The chat is readable only once my row is in the room.
  const mine=_room;
  Promise.resolve(firstBeat).then(()=>{ if(_room===mine) _watchRoomChat(); });
  logLedgerEvent('room_joined',{});
  openRoomView();
  _refreshRoomsList();
}
// Heartbeat: my row in the room, and the room's "still alive" stamp.
function _roomBeat(){
  if(!_room||!firebaseDb||!AUTH||!AUTH.uid) return;
  const name=S.name||'Member', now=Date.now();
  const me={uid:AUTH.uid,name,initials:(name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase())||'M',color:(S&&S.profileColor)||hashColor(AUTH.uid),
    section:TS.section||'',material:(TS.material||'').slice(0,80),joinedAt:_room.joinedAt,lastBeat:now,
    status:TS.phase==='active'?'studying':'paused',elapsed:TS.elapsed||0};
  const p=_room.ref.collection('members').doc(AUTH.uid).set(me).catch(()=>{});
  const others=_roomFreshMembers().filter(m=>m.uid!==AUTH.uid).length;
  _room.ref.update({lastActive:now,count:others+1}).catch(()=>{});
  return p;
}
async function leaveRoom(silent){
  const r=_room; if(!r) return;
  _room=null;
  clearInterval(r.beat);clearInterval(r.tick);
  try{r.unsubM&&r.unsubM();}catch(e){} try{r.unsubR&&r.unsubR();}catch(e){} try{r.unsubC&&r.unsubC();}catch(e){}
  document.getElementById('room-overlay')?.remove(); document.getElementById('room-chat-pop')?.remove();
  const now=Date.now();
  const others=(r.members||[]).filter(m=>m&&m.uid!==AUTH.uid&&m.lastBeat&&now-m.lastBeat<ROOM_FRESH_MS).length;
  const closing=!others&&r.data.hostUid===AUTH.uid;
  // The chat is only for the session: when the room closes, it goes with it.
  // (Read it while my row still lets me.)
  if(closing) await _clearRoomChat(r.ref);
  try{ await r.ref.collection('members').doc(AUTH.uid).delete(); }catch(e){}
  try{
    // Last one out closes the room (only its host is allowed to); otherwise just step out.
    if(closing) await r.ref.delete();
    else await r.ref.update({count:Math.max(0,others),lastActive:others?now:now-ROOM_FRESH_MS});
  }catch(e){}
  _roomsCache=_roomsCache.filter(x=>x.id!==r.id||others>0);
  if(!silent) showToast('You left the room','info');
  if(document.getElementById('rooms-card')) watchRooms();
}
function _roomClosed(){
  if(!_room) return;
  const r=_room; _room=null;
  clearInterval(r.beat);clearInterval(r.tick);
  try{r.unsubM&&r.unsubM();}catch(e){} try{r.unsubR&&r.unsubR();}catch(e){} try{r.unsubC&&r.unsubC();}catch(e){}
  document.getElementById('room-overlay')?.remove(); document.getElementById('room-chat-pop')?.remove();
  showToast('The room closed — your session is still running','info');
  if(TS.phase==='active'||TS.phase==='paused') openSessionModal();
  _refreshRoomsList();
}
// Keep studying on my own, without the room.
function leaveRoomKeepStudying(){
  leaveRoom(true).then(()=>{ showToast('You left the room — your timer is still running','info'); });
}
function endRoomSession(){
  leaveRoom(true);
  document.getElementById('sess-overlay')?.classList.add('open');
  endSession();
}
window.addEventListener('beforeunload',()=>{ try{ if(_room&&AUTH&&AUTH.uid) _room.ref.collection('members').doc(AUTH.uid).delete(); }catch(e){} });

// ── The room itself ─────────────────────────────────────────────
function openRoomView(){
  if(!_room) return;
  let el=document.getElementById('room-overlay');
  if(!el){ el=document.createElement('div'); el.id='room-overlay'; el.className='room-overlay'; document.body.appendChild(el); }
  const r=_room.data;
  const secOpts=(S.sections||[]).map(s=>`<option value="${s}"${s===TS.section?' selected':''}>${s}</option>`).join('');
  el.innerHTML=`<div class="room-box" role="dialog" aria-label="Study room">
    <div class="room-hdr">
      <div style="min-width:0;flex:1">
        <div class="room-name">${esc(r.name||'Study room')}</div>
        <div class="room-sub">Hosted by ${esc(r.hostName||'a candidate')}${_room.clubId?' · club room':' · open to anyone'}</div>
      </div>
      <button class="room-hbtn" onclick="copyRoomInvite()" title="Copy invite link">Invite</button>
      <button class="room-hbtn" onclick="minimizeRoom()" title="Keep studying in the background" aria-label="Minimize">—</button>
    </div>
    <div class="room-clock-wrap" id="room-clock-wrap"></div>
    <div class="room-me">
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.5)">Your session</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
          <span id="room-my-time" class="room-my-time">${fmtElapsed(TS.elapsed||0)}</span>
          <select id="room-my-sec" onchange="TS.section=this.value;tsPersist();_roomBeat();updateNavChip()" class="room-sec-sel" aria-label="Section">${secOpts}</select>
        </div>
      </div>
      <button class="room-btn" id="room-pause-btn" onclick="roomTogglePause()">${TS.phase==='paused'?'Resume':'Pause'}</button>
    </div>
    <div class="room-members-hdr"><span id="room-count"></span></div>
    <div class="room-members" id="room-members"></div>
    <div class="room-chat" id="room-chat"></div>
    <div class="room-foot">
      <button class="room-btn room-btn-main" onclick="endRoomSession()">End &amp; log session</button>
      <button class="room-btn" onclick="leaveRoomKeepStudying()">Leave room</button>
    </div>
  </div>`;
  _renderRoomClock();_renderRoomMembers();_renderRoomChatShell();
}
function minimizeRoom(){ document.getElementById('room-overlay')?.remove(); showToast('Still in the room — tap the timer up top to come back','info'); }
function roomTogglePause(){
  if(!_room) return;
  _room.autoPaused=false;
  if(TS.phase==='active') pauseTimer(); else if(TS.phase==='paused') resumeTimer();
  const b=document.getElementById('room-pause-btn'); if(b) b.textContent=TS.phase==='paused'?'Resume':'Pause';
}
function _renderRoomClock(){
  const host=document.getElementById('room-clock-wrap'); if(!host||!_room) return;
  const p=_roomPhase(_room.data);
  if(p.k==='open'){
    host.innerHTML=`<div class="room-phase">Open study</div><div class="room-clock" id="room-clock">${fmtElapsed(Math.floor((Date.now()-(_room.data.timerStart||Date.now()))/1000))}</div><div class="room-phase-sub">No shared timer — the room has been open this long.</div>`;
    return;
  }
  const pct=Math.max(0,Math.min(100,100-(p.left/p.total*100)));
  host.innerHTML=`<div class="room-phase ${p.k}">${p.k==='focus'?'Focus':'Break'} · round ${p.round}</div>
    <div class="room-clock" id="room-clock">${_fmtMS(p.left)}</div>
    <div class="room-bar"><div class="room-bar-fill ${p.k}" id="room-bar-fill" style="width:${pct}%"></div></div>
    <div class="room-phase-sub">${p.k==='focus'?'Heads down. Everyone here is on the same clock.':'Stretch, water, eyes off the screen. Your timer is paused.'}</div>`;
}
function _renderRoomMembers(){
  const host=document.getElementById('room-members'); if(!host||!_room) return;
  const now=Date.now();
  const list=_roomFreshMembers().filter(m=>!isBlocked(m.uid)).sort((a,b)=>(b.uid===AUTH.uid)-(a.uid===AUTH.uid)||(a.joinedAt||0)-(b.joinedAt||0));
  const cnt=document.getElementById('room-count'); if(cnt) cnt.textContent=list.length+(list.length===1?' person here':' people here');
  host.innerHTML=list.map(m=>{
    const me=m.uid===AUTH.uid;
    const secs=me?(TS.elapsed||0):(m.elapsed||0)+(m.status==='studying'?Math.floor((now-m.lastBeat)/1000):0);
    return `<div class="room-member${m.status==='paused'?' paused':''}" data-member="${esc(m.uid)}">
      <div class="room-av" style="background:${esc(m.color||'#5a5fcf')}">${esc(m.initials||'?')}<span class="room-av-dot"></span></div>
      <div style="min-width:0;flex:1">
        <div class="room-m-name">${esc(m.name||'Member')}${me?' <span style="opacity:.5;font-weight:500">(you)</span>':''}</div>
        <div class="room-m-meta">${m.section?esc(m.section)+' · ':''}${m.status==='paused'?'paused':Math.floor(secs/60)+'m in'}</div>
      </div>
    </div>`;
  }).join('')||'<div style="font-size:12px;color:rgba(255,255,255,.5)">Connecting…</div>';
}
// Runs every second while I'm in a room: clocks, and the focus↔break hand-off.
function _roomTick(){
  if(!_room) return;
  const p=_roomPhase(_room.data);
  if(p.k!==_room.lastPhase){
    const was=_room.lastPhase; _room.lastPhase=p.k;
    if(p.k==='break'){
      if(TS.phase==='active'){ pauseTimer(); _room.autoPaused=true; }
      _roomChime(); showToast('Break — '+(_room.data.breakMin||5)+' minutes. Your timer is paused.','info');
    } else if(p.k==='focus'&&was==='break'){
      if(_room.autoPaused&&TS.phase==='paused') resumeTimer();
      _room.autoPaused=false;
      _roomChime(); showToast('Back to focus','ok');
    }
    const b=document.getElementById('room-pause-btn'); if(b) b.textContent=TS.phase==='paused'?'Resume':'Pause';
    _renderRoomClock();
  }
  const c=document.getElementById('room-clock');
  if(c){
    if(p.k==='open') c.textContent=fmtElapsed(Math.floor((Date.now()-(_room.data.timerStart||Date.now()))/1000));
    else{ c.textContent=_fmtMS(p.left); const f=document.getElementById('room-bar-fill'); if(f) f.style.width=Math.max(0,Math.min(100,100-(p.left/p.total*100)))+'%'; }
  }
  const mt=document.getElementById('room-my-time'); if(mt) mt.textContent=fmtElapsed(TS.elapsed||0);
  if(new Date().getSeconds()%20===0) _renderRoomMembers();
}
function _roomChime(){
  try{
    const C=window.AudioContext||window.webkitAudioContext; if(!C) return;
    const ctx=_roomChime._c||(_roomChime._c=new C());
    [660,880].forEach((hz,i)=>{
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type='sine'; o.frequency.value=hz; o.connect(g); g.connect(ctx.destination);
      const t=ctx.currentTime+i*0.18;
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.12,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.5);
      o.start(t); o.stop(t+0.55);
    });
  }catch(e){}
}

// ── Live chat ───────────────────────────────────────────────────
// rooms/{id}/chat — only people in the room can read it, and it is deleted
// with the room. It is not a history like DMs: it exists for the session.
// Each person can hide the chat panel and/or mute its pop-ups; both choices
// are remembered on this device.
const ROOM_CHAT_PREF_KEY='ledgerRoomChat';
function _roomChatPref(){
  try{ const p=JSON.parse(localStorage.getItem(ROOM_CHAT_PREF_KEY)||'{}'); return {open:p.open!==false,muted:!!p.muted}; }
  catch(e){ return {open:true,muted:false}; }
}
function _setRoomChatPref(ch){
  const p=Object.assign({},_chatPref(),ch);
  try{ localStorage.setItem(ROOM_CHAT_PREF_KEY,JSON.stringify(p)); }catch(e){}
  _roomChatPref._mem=p;
  return p;
}
// Falls back to an in-memory copy when storage is unavailable.
function _chatPref(){ return _roomChatPref._mem||(_roomChatPref._mem=_roomChatPref()); }
// Is the chat on screen right now?
function _roomChatVisible(){ return !!(document.getElementById('room-overlay')&&_chatPref().open); }

function setRoomChatOpen(open){
  _setRoomChatPref({open:!!open});
  if(open&&_room) _room.unread=0;
  _renderRoomChatShell();
  _refreshRoomsList();
  if(open) setTimeout(()=>document.getElementById('room-chat-in')?.focus({preventScroll:true}),0);
}
function toggleRoomChatMute(){
  const p=_setRoomChatPref({muted:!_chatPref().muted});
  document.getElementById('room-chat-pop')?.remove();
  _renderRoomChatShell();
  showToast(p.muted?'Chat pop-ups muted — messages still collect here':'Chat pop-ups on','info');
}
function _roomMuteBtn(){
  const m=_chatPref().muted;
  return `<button class="room-ibtn${m?' on':''}" id="room-chat-mute" onclick="toggleRoomChatMute()" aria-pressed="${m}" aria-label="${m?'Unmute chat pop-ups':'Mute chat pop-ups'}" title="${m?'Pop-ups muted — tap to turn on':'Mute pop-ups'}">${ico(m?'bellOff':'bell')}</button>`;
}
// The chat panel: open (messages + box) or folded down to one slim bar.
function _renderRoomChatShell(){
  const host=document.getElementById('room-chat'); if(!host||!_room) return;
  const p=_chatPref();
  host.classList.toggle('closed',!p.open);
  if(!p.open){
    const n=_room.unread||0;
    host.innerHTML=`<div class="room-chat-bar">
      <button class="room-chat-pill" id="room-chat-show" onclick="setRoomChatOpen(true)">${ico('chat')}<span>Chat</span>${n?`<span class="room-chat-badge">${n>99?'99+':n}</span>`:''}</button>
      ${_roomMuteBtn()}
    </div>`;
    return;
  }
  const draft=document.getElementById('room-chat-in')?.value||'';
  _room.unread=0;
  host.innerHTML=`<div class="room-chat-hdr">
      <span class="room-chat-title">${ico('chat')} Chat</span>
      <span class="room-chat-note">Only this room · gone when it closes</span>
      ${_roomMuteBtn()}
      <button class="room-ibtn" id="room-chat-hide" onclick="setRoomChatOpen(false)" aria-label="Hide chat" title="Hide chat">${ico('x')}</button>
    </div>
    <div class="room-chat-list" id="room-chat-list" aria-live="polite"></div>
    <form class="room-chat-form" onsubmit="event.preventDefault();sendRoomChat()">
      <input id="room-chat-in" type="text" maxlength="${ROOM_CHAT_MAX}" placeholder="Message the room" autocomplete="off" enterkeyhint="send" aria-label="Message the room">
      <button class="room-chat-send" type="submit" id="room-chat-send" aria-label="Send">${ico('arrow')}</button>
    </form>`;
  const inp=document.getElementById('room-chat-in'); if(inp&&draft) inp.value=draft;
  _renderRoomChat();
}
function _watchRoomChat(){
  if(!_room) return;
  const r=_room;
  let first=true;
  r.unsubC=r.ref.collection('chat').orderBy('at').limitToLast(ROOM_CHAT_KEEP).onSnapshot(s=>{
    if(_room!==r) return;
    const before=new Set(r.chat.map(m=>m.id));
    r.chat=s.docs.map(d=>Object.assign({id:d.id},d.data()));
    const fresh=first?[]:r.chat.filter(m=>!before.has(m.id)&&m.from!==AUTH.uid&&!isBlocked(m.from));
    first=false;
    if(fresh.length&&!_roomChatVisible()){
      r.unread=(r.unread||0)+fresh.length;
      if(!_chatPref().muted) _roomChatPop(fresh[fresh.length-1],fresh.length);
      _renderRoomChatShell();
      _refreshRoomsList();
    }
    _renderRoomChat();
  },()=>{});
}
// A small tappable card for a new message while the chat is hidden.
function _roomChatPop(m,n){
  document.getElementById('room-chat-pop')?.remove();
  clearTimeout(_roomChatPop._t);
  const el=document.createElement('div');
  el.id='room-chat-pop'; el.className='room-chat-pop'; el.setAttribute('role','status');
  const more=n>1?` <span class="room-chat-pop-more">+${n-1} more</span>`:'';
  el.innerHTML=`<button class="room-chat-pop-main" onclick="openRoomChatFromPop()">
      <span class="room-chat-pop-av" style="background:${esc(m.color||'#5a5fcf')}">${esc(String(m.name||'?').trim().charAt(0).toUpperCase()||'?')}</span>
      <span class="room-chat-pop-body"><span class="room-chat-pop-name">${esc(m.name||'Someone')} · ${esc((_room&&_room.data.name)||'Study room')}${more}</span><span class="room-chat-pop-text">${esc(String(m.text||'').slice(0,140))}</span></span>
    </button>
    <button class="room-chat-pop-mute" onclick="toggleRoomChatMute()" aria-label="Mute chat pop-ups" title="Mute chat pop-ups">${ico('bellOff')}</button>
    <button class="room-chat-pop-x" onclick="this.parentNode.remove()" aria-label="Dismiss">${ico('x')}</button>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
  _roomChatPop._t=setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(),300); },5500);
}
function openRoomChatFromPop(){
  document.getElementById('room-chat-pop')?.remove();
  if(!_room) return;
  _setRoomChatPref({open:true});
  if(!document.getElementById('room-overlay')) openRoomView(); else _renderRoomChatShell();
  _refreshRoomsList();
  setTimeout(()=>document.getElementById('room-chat-in')?.focus({preventScroll:true}),0);
}
function _renderRoomChat(){
  const host=document.getElementById('room-chat-list'); if(!host||!_room) return;
  const nearBottom=host.scrollHeight-host.scrollTop-host.clientHeight<40;
  const list=(_room.chat||[]).filter(m=>!isBlocked(m.from));
  let prev=null;
  host.innerHTML=list.length?list.map(m=>{
    const me=m.from===AUTH.uid;
    // Back-to-back messages from one person within 3 minutes share a header.
    const cont=prev&&prev.from===m.from&&(m.at||0)-(prev.at||0)<180000;
    prev=m;
    const t=new Date(m.at||Date.now()).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
    const rk=me?'':_regReport({kind:'message',target:m.from,targetName:m.name||'Member',text:String(m.text||'').slice(0,1000),refPath:_room.ref.path+'/chat/'+m.id});
    return `<div class="room-chat-msg${me?' mine':''}${cont?' cont':''}" data-msg="${esc(m.id)}">
      ${cont?'':`<div class="room-chat-meta">${me?'':`<b style="color:${esc(m.color||'#a5a8ff')}">${esc(m.name||'Member')}</b>`}<span>${esc(t)}</span></div>`}
      <div class="room-chat-row"><div class="room-chat-text">${esc(m.text||'')}</div>${me?'':`<button class="room-chat-more" aria-label="Report or block" title="Report or block" onclick="openContentActions('${rk}')">⋯</button>`}</div>
    </div>`;
  }).join(''):'<div class="room-chat-empty">No messages yet. Keep it short, everyone\'s studying.</div>';
  if(nearBottom||!host.dataset.seen){ host.scrollTop=host.scrollHeight; host.dataset.seen='1'; }
}
async function sendRoomChat(){
  if(!_room||!firebaseDb||!AUTH||!AUTH.uid) return;
  const inp=document.getElementById('room-chat-in'); if(!inp) return;
  const text=safeText(inp.value.replace(/\s+/g,' ').trim()).slice(0,ROOM_CHAT_MAX);
  if(!text) return;
  if(_badWords(text)) return;
  const now=Date.now();
  if(_room.lastSent&&now-_room.lastSent<1500){ showToast('Slow down a little','info'); return; }
  _room.lastSent=now;
  const id='m'+now.toString(36)+Math.random().toString(36).slice(2,8);
  const msg={from:AUTH.uid,name:(S.name||'Member').slice(0,80),color:(S&&S.profileColor)||hashColor(AUTH.uid),text,at:now,
    expireAt:firebase.firestore.Timestamp.fromMillis(now+12*3600000)};
  inp.value='';
  try{ await _room.ref.collection('chat').doc(id).set(msg); logLedgerEvent('room_chat',{}); }
  catch(e){ if(document.getElementById('room-chat-in')&&!document.getElementById('room-chat-in').value) document.getElementById('room-chat-in').value=text; showToast('Message didn\'t send — try again','err'); }
}
// Delete a room's chat (the host when closing it, or anyone sweeping a dead room).
async function _clearRoomChat(ref){
  try{
    for(let i=0;i<10;i++){
      const s=await ref.collection('chat').limit(200).get();
      if(s.empty) return;
      const b=firebaseDb.batch(); s.docs.forEach(d=>b.delete(d.ref)); await b.commit();
      if(s.size<200) return;
    }
  }catch(e){}
}

// ── Invites ─────────────────────────────────────────────────────
function _roomInviteUrl(){
  if(!_room) return '';
  const base=(location.origin&&/^https?:/.test(location.origin)&&!/localhost|127\.0\.0\.1/.test(location.origin))?location.origin:'https://ledgercpa.app';
  return base+'/?room='+encodeURIComponent(_room.id)+(_room.clubId?'&club='+encodeURIComponent(_room.clubId):'');
}
function copyRoomInvite(){
  const url=_roomInviteUrl(); if(!url) return;
  const text='Study with me on Ledger — I\'m in "'+(_room.data.name||'a study room')+'" right now: '+url;
  if(navigator.share){ navigator.share({title:'Join my study room',text}).catch(()=>{}); return; }
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(text):Promise.reject()).then(()=>showToast('Invite link copied','ok')).catch(()=>{ prompt('Copy this invite link:',url); });
}
// Opening an invite link: show the room and let the person decide to sit down.
async function openRoomInvite(id,clubId){
  if(!firebaseDb||!AUTH||!AUTH.uid||!/^[A-Za-z0-9_-]{1,128}$/.test(id||'')||(clubId&&!/^[A-Za-z0-9_-]{1,128}$/.test(clubId))) return;
  let snap=null; try{ snap=await _roomsCol(clubId||'').doc(id).get(); }catch(e){}
  if(!snap||!snap.exists||!(snap.data().lastActive&&Date.now()-snap.data().lastActive<ROOM_FRESH_MS)){ showToast('That study room has closed','info'); return; }
  const r=snap.data();
  document.getElementById('room-invite-modal')?.remove();
  const el=document.createElement('div');
  el.id='room-invite-modal';
  el.className='modal-overlay open';
  el.style.zIndex='2000';
  el.innerHTML=`<div class="modal-box" style="max-width:380px" onclick="event.stopPropagation()">
    <div class="modal-hdr"><div class="modal-title">${esc(r.name||'Study room')}</div><button class="modal-close" onclick="document.getElementById('room-invite-modal').remove()">×</button></div>
    <div style="padding:4px 22px 22px">
      <div style="font-size:13px;color:var(--sub);line-height:1.55;margin-bottom:16px">${esc(r.hostName||'A candidate')} is studying now with ${Math.max(1,r.count||1)} ${Math.max(1,r.count||1)===1?'person':'people'} in the room · ${_roomPhaseText(r)}. Joining starts your session timer.</div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="document.getElementById('room-invite-modal').remove();joinRoom('${esc(id)}','${esc(clubId||'')}')">Join the room</button>
    </div></div>`;
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.body.appendChild(el);
}

// ═══════════════════════════════════════════════
// NOTIFICATIONS THAT REACH YOU WHEN LEDGER IS CLOSED
//
// Three parts:
//  · notify/{uid} — a small private profile this device keeps up to date (time
//    zone, streak, last study day, this week, exam dates, preferences, and the
//    push tokens of devices that turned notifications on). The server reads it
//    to decide what to send and when.
//  · A push token for this browser (Firebase Cloud Messaging), stored in that
//    profile once the person taps "Turn on".
//  · notifyEvent() — tells /api/notify that something just happened (props, a
//    comment, a message…) so the other person hears about it.
// ═══════════════════════════════════════════════
// Web Push public key from the Firebase console (Project settings → Cloud
// Messaging → Web Push certificates). Public by design. Left empty, the Firebase
// SDK falls back to its built-in default key.
const FCM_VAPID_KEY='';
const FIREBASE_SDK_VERSION='10.12.2';
let _swReg=null;

function _isNativeApp(){return !!(window.Capacitor&&((window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())||window.Capacitor.platform==='ios'||window.Capacitor.platform==='android'));}
function _isIOS(){return /iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.userAgent));}
function _isStandalone(){return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;}
function _deviceId(){
  let id='';
  try{ id=localStorage.getItem('ledger-device-id')||''; }catch(e){}
  if(!/^[a-z0-9]{12}$/.test(id)){ id=Array.from({length:12},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join(''); try{localStorage.setItem('ledger-device-id',id);}catch(e){} }
  return id;
}

function registerServiceWorker(){
  if(!('serviceWorker' in navigator)||_isNativeApp()) return;
  navigator.serviceWorker.register('/sw.js').then(r=>{_swReg=r;}).catch(()=>{});
  navigator.serviceWorker.addEventListener('message',e=>{
    const d=e.data||{}; if(d.source!=='ledger-sw') return;
    if(d.kind==='push'&&d.msg){            // arrived while Ledger is open and in front
      showToast(d.msg.title+(d.msg.body?' — '+d.msg.body:''),'info');
      if(typeof syncSocial==='function') syncSocial();
    } else if(d.kind==='open'&&d.url){     // a notification was tapped
      try{ _openPushUrl(new URL(d.url,location.origin)); }catch(err){}
    }
  });
}
// Go where a notification points, inside the already-open app.
function _openPushUrl(u){
  if(!S||!AUTH||u.origin!==location.origin) return;
  const q=u.searchParams;
  if(q.get('room')){ openRoomInvite(q.get('room'),q.get('club')||''); return; }
  if(q.get('action')){ _runShortcut(q.get('action')); return; }
  const user=u.pathname.match(/^\/user\/([A-Za-z0-9_-]+)$/);
  if(user){ openUserProfile(user[1]); return; }
  if(u.pathname==='/messages'){ openMessagesPage(); return; }
  const tab=(u.hash||'').replace('#','');
  if(typeof _closeAllOverlays==='function') _closeAllOverlays();
  switchTab(['today','feed','dashboard','plan','profile','explore','studylab'].includes(tab)?tab:'today');
}
// Home-screen shortcuts and reminder notifications open the app with ?action=…
function _runShortcut(action){
  if(action==='start') openSessionModal();
  else if(action==='log'){ openSessionModal(); setTimeout(()=>{ if(TS.phase==='setup') toggleManualLog(); },80); }
  else if(action==='recap'){ switchTab('today'); setTimeout(()=>openWeekRecap(),200); }
  else if(action==='rooms'){ switchTab('today'); setTimeout(()=>document.getElementById('rooms-card')?.scrollIntoView({behavior:'smooth',block:'center'}),300); }
}

// ── The private profile the server reads ────────────────────────
function _notifyProfile(){
  const today=todayStr();
  const study=(S.activities||[]).filter(_isStudyAct);
  const last=study.reduce((m,a)=>{const d=(a.date||'').slice(0,10);return d>m?d:m;},'');
  const wk=_thisWeek();
  const sec=getCurrentSection(), tgt=_todayTarget(sec);
  const exams={}, scoreDue={};
  (S.sections||[]).forEach(s=>{
    if((S.sectionPassed||[]).includes(s)) return;
    const d=S.examDates&&S.examDates[s]; if(d&&d>=today) exams[s]=d;
    const sit=(S.examSits||{})[s]; if(sit&&sit.expectedRelease>=today) scoreDue[s]=sit.expectedRelease;
  });
  const prefs={};
  Object.keys(NOTIF_PREF_DEFAULTS).forEach(k=>{prefs[k]=notifPref(k);});
  // Whose studying I want to hear about: my partner, and (if I left it on) people I follow.
  const real=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{5,128}$/.test(id);
  const watch=[];
  if(real(S.accountabilityPartner)) watch.push(S.accountabilityPartner);
  if(prefs.crew_activity) (S.following||[]).filter(real).slice(0,15).forEach(id=>{ if(!watch.includes(id)) watch.push(id); });
  let tz='America/Chicago'; try{ tz=Intl.DateTimeFormat().resolvedOptions().timeZone||tz; }catch(e){}
  return {
    tz, name:(S.name||'').split(' ')[0].slice(0,40), streak:getStreak(), lastStudyDate:last,
    week:{key:wk.weekKey,hrs:Math.round(wk.hrs*10)/10,days:wk.days.filter(d=>d.hrs>0).length,target:wk.target},
    // today.rest: days that hold the streak (rest days and shields), so the
    // evening job doesn't warn about a streak that is safe. (Inside `today`
    // because the notify doc's database rules fix its top-level fields.)
    today:{hours:tgt.hours||0,section:tgt.section||'',
      rest:Object.keys(S.restDays||{}).filter(k=>restKind(k)&&k>=_dayShift(today,-14)&&k<=_dayShift(today,14)).sort()},
    exams, scoreDue, prefs, watch
  };
}
const NOTIFY_FIELDS=['tz','name','streak','lastStudyDate','week','today','exams','scoreDue','prefs','watch','updatedAt'];
let _notifyLast='';
async function syncNotifyProfile(force){
  if(!firebaseDb||!AUTH||!AUTH.uid||!S) return;
  let p; try{ p=_notifyProfile(); }catch(e){ return; }
  const sig=AUTH.uid+JSON.stringify(p);
  if(!force&&sig===_notifyLast) return;
  try{
    // mergeFields replaces these fields whole (so a removed exam date really goes) and leaves `tokens` alone.
    await firebaseDb.collection('notify').doc(AUTH.uid).set(Object.assign({updatedAt:Date.now()},p),{mergeFields:NOTIFY_FIELDS});
    _notifyLast=sig;
  }catch(e){}
  _scheduleNativeReminder();
}

// ── Turning push on for this device ─────────────────────────────
// 'on' | 'default' (can ask) | 'denied' | 'ios-install' | 'native' | 'unsupported'
function pushState(){
  if(_isNativeApp()) return (window.Capacitor.Plugins&&window.Capacitor.Plugins.LocalNotifications)?'native':'unsupported';
  if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window)) return (_isIOS()&&!_isStandalone())?'ios-install':'unsupported';
  if(Notification.permission==='denied') return 'denied';
  let on=false; try{ on=localStorage.getItem('ledger-push-on')===(AUTH&&AUTH.uid); }catch(e){}
  return (Notification.permission==='granted'&&on)?'on':'default';
}
function _loadScript(src){
  return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>rej(new Error('load failed')); document.head.appendChild(s); });
}
// Ask Firebase Cloud Messaging for this browser's push token.
async function _pushGetToken(){
  const reg=_swReg||await navigator.serviceWorker.ready;
  if(!firebase.messaging) await _loadScript('https://www.gstatic.com/firebasejs/'+FIREBASE_SDK_VERSION+'/firebase-messaging-compat.js');
  const opts={serviceWorkerRegistration:reg};
  if(FCM_VAPID_KEY) opts.vapidKey=FCM_VAPID_KEY;
  return firebase.messaging().getToken(opts);
}
async function _savePushToken(token,platform){
  await syncNotifyProfile(true); // the profile has to exist before a device is attached to it
  await firebaseDb.collection('notify').doc(AUTH.uid).set({tokens:{[_deviceId()]:{token,platform:platform||'web',ua:(navigator.userAgent||'').slice(0,120),at:Date.now()}}},{merge:true});
  try{ localStorage.setItem('ledger-push-on',AUTH.uid); }catch(e){}
}
async function enablePush(){
  const st=pushState();
  if(st==='native'){ return _enableNativeReminders(); }
  if(st==='ios-install'){ showToast('Add Ledger to your Home Screen first: tap Share, then "Add to Home Screen"','info'); return false; }
  if(st==='unsupported'){ showToast('This browser can\'t show notifications','err'); return false; }
  if(st==='denied'){ showToast('Notifications are blocked for Ledger in your browser settings','err'); return false; }
  if(!firebaseDb||!AUTH||!AUTH.uid){ showToast('Connect to the internet to turn on notifications','err'); return false; }
  let perm='default';
  try{ perm=await Notification.requestPermission(); }catch(e){}
  if(perm!=='granted'){ logLedgerEvent('push_declined',{perm}); _refreshPushUI(); if(perm==='denied') showToast('Notifications blocked — you can allow them in your browser settings','info'); return false; }
  try{
    const token=await _pushGetToken();
    if(!token) throw new Error('no token');
    await _savePushToken(token,'web');
  }catch(e){
    console.warn('[Ledger] push setup failed:',e&&(e.code||e.message));
    showToast('Couldn\'t finish turning on notifications — try again in a moment','err');
    _refreshPushUI(); return false;
  }
  logLedgerEvent('push_enabled',{});
  showToast('Notifications are on for this device','ok');
  _refreshPushUI();
  return true;
}
async function disablePush(){
  try{ localStorage.removeItem('ledger-push-on'); }catch(e){}
  if(_isNativeApp()){ try{ await window.Capacitor.Plugins.LocalNotifications.cancel({notifications:[{id:2001}]}); }catch(e){} try{localStorage.removeItem('ledger-native-rem');}catch(e){} }
  if(firebaseDb&&AUTH&&AUTH.uid){
    try{ await firebaseDb.collection('notify').doc(AUTH.uid).update({['tokens.'+_deviceId()]:firebase.firestore.FieldValue.delete()}); }catch(e){}
  }
  try{ if(firebase.messaging) await firebase.messaging().deleteToken(); }catch(e){}
  showToast('Notifications are off for this device','info');
  _refreshPushUI();
}
// On each launch: tokens rotate, so quietly re-register a device that already said yes.
function refreshPushToken(){
  if(pushState()!=='on'||!firebaseDb||!AUTH||!AUTH.uid) return;
  _pushGetToken().then(t=>{ if(t) _savePushToken(t,'web'); }).catch(()=>{});
}

// ── Native app: a local evening reminder (no server needed, works offline) ──
async function _enableNativeReminders(){
  const LN=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.LocalNotifications;
  if(!LN) return false;
  try{
    const r=await LN.requestPermissions();
    if(!r||r.display!=='granted'){ showToast('Allow notifications for Ledger in your phone\'s settings','info'); return false; }
    localStorage.setItem('ledger-native-rem','1');
    await _scheduleNativeReminder();
    showToast('Evening study reminders are on','ok');
    _refreshPushUI();
    return true;
  }catch(e){ return false; }
}
// One pending reminder at a time: tonight at 8 if I haven't studied yet, otherwise tomorrow at 8.
async function _scheduleNativeReminder(){
  const LN=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.LocalNotifications;
  if(!LN||!S) return;
  let on=false; try{ on=localStorage.getItem('ledger-native-rem')==='1'; }catch(e){}
  if(!on) return;
  try{
    await LN.cancel({notifications:[{id:2001}]});
    if(!notifPref('streak_alerts')&&!notifPref('study_reminders')) return;
    const at=new Date(); at.setHours(20,0,0,0);
    const studied=_hoursOn(todayStr())>0;
    if(studied||Date.now()>at.getTime()) at.setDate(at.getDate()+1);
    const streak=getStreak();
    const title=streak>0&&notifPref('streak_alerts')?'Your '+streak+'-day streak ends at midnight':'You haven\'t studied today';
    await LN.schedule({notifications:[{id:2001,title,body:'Even 25 minutes counts.',schedule:{at,allowWhileIdle:true}}]});
  }catch(e){}
}

// ── Telling the server something happened ───────────────────────
function notifyEvent(type,payload){
  if(!firebaseAuth||!firebaseAuth.currentUser) return;
  _getAuthToken().then(token=>{
    if(!token) return;
    return fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(Object.assign({type},payload||{}))});
  }).catch(()=>{});
}

// Same endpoint, for calls whose answer matters. Resolves {ok,status,data}.
async function notifyCall(type,payload){
  if(!firebaseAuth||!firebaseAuth.currentUser) return {ok:false,status:0,data:{}};
  try{
    const token=await _getAuthToken(); if(!token) return {ok:false,status:0,data:{}};
    const r=await fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(Object.assign({type},payload||{}))});
    let data={}; try{ data=await r.json(); }catch(e){}
    return {ok:r.ok,status:r.status,data};
  }catch(e){ return {ok:false,status:0,data:{}}; }
}

// ── NUDGES ──────────────────────────────────────────────────────
// A friend who follows you back hasn't studied today: one tap sends them a
// push and a bell notification. Once a day per person (the server enforces it).
function _nudgedToday(uid){
  const n=S&&S._nudgesOut;
  return !!(n&&n.day===todayStr()&&(n.ids||[]).includes(uid));
}
function _markNudged(uid){
  const t=todayStr();
  if(!S._nudgesOut||S._nudgesOut.day!==t) S._nudgesOut={day:t,ids:[]};
  if(!S._nudgesOut.ids.includes(uid)) S._nudgesOut.ids.push(uid);
}
// Can I nudge this friend right now? '' if yes, otherwise why not (for a tooltip).
function nudgeBlocker(f){
  if(!f||!f.id||!AUTH||!AUTH.uid) return 'signin';
  const t=todayStr();
  if(!(f.following||[]).includes(AUTH.uid)) return 'not-mutual';
  if((f.restDays||[]).includes(t)) return 'resting';
  if((f.activities||[]).some(a=>(a.date||'').slice(0,10)===t&&_isStudyAct(a))) return 'studied';
  if(_nudgedToday(f.id)) return 'done';
  return '';
}
async function sendNudge(uid,btn){
  const f=(REAL_USERS||[]).find(x=>x.id===uid);
  const first=((f&&f.name)||'them').split(' ')[0]; // toasts render text, not HTML
  if(_nudgedToday(uid)){ showToast('You already nudged '+first+' today.','info'); return; }
  if(btn){ btn.disabled=true; btn.classList.add('sent'); btn.textContent='Nudged'; }
  _markNudged(uid); saveState();
  try{ await syncNotifyProfile(); }catch(e){} // the server checks I studied today
  const r=await notifyCall('nudge',{toUid:uid});
  if(r.ok){ showToast('Nudge sent to '+first+'.','ok'); logLedgerEvent('nudge_sent'); return; }
  if(r.status===429&&r.data&&r.data.error==='already-nudged'){ showToast('You already nudged '+first+' today.','info'); return; }
  // Didn't go through: undo so they can try again.
  if(S._nudgesOut) S._nudgesOut.ids=(S._nudgesOut.ids||[]).filter(x=>x!==uid);
  saveState();
  if(btn){ btn.disabled=false; btn.classList.remove('sent'); btn.textContent='Nudge'; }
  const err=r.data&&r.data.error;
  showToast(r.status===403&&err==='not-mutual'?'You can nudge people who follow you back.':r.status===403&&err==='study-first'?'Log today\u2019s session first, then nudge.':r.status===0?'You\u2019re offline. Try again in a moment.':'That nudge didn\u2019t send. Try again in a moment.','err');
}
// Nudges sent to me: called from syncSocial. Turns new ones into bell
// notifications and keeps today's list for the Today screen.
let _nudgeInboxAt=0;
async function syncNudges(force){
  if(!S||!AUTH||!AUTH.uid) return false;
  if(!force&&Date.now()-_nudgeInboxAt<5*60000) return false;
  _nudgeInboxAt=Date.now();
  const r=await notifyCall('nudge_inbox');
  if(!r.ok||!r.data) return false;
  let dirty=false;
  const seen=new Set(S._seenNudges||[]), firstRun=!Array.isArray(S._seenNudges);
  const items=(r.data.nudges||[]).filter(n=>n&&n.from&&!isBlocked(n.from));
  for(const n of items){
    const key=n.from+'@'+n.at;
    if(seen.has(key)) continue;
    seen.add(key); dirty=true;
    if(!firstRun) addNotification('nudge','wave',esc(n.name)+' nudged you to study today.',n.from,'user',n.from);
  }
  if(dirty) S._seenNudges=[...seen].slice(-100);
  const t=todayStr();
  const todays=items.filter(n=>_ymd(new Date(n.at))===t).map(n=>({from:n.from,name:n.name}));
  if(JSON.stringify(todays)!==JSON.stringify((S._nudgesIn&&S._nudgesIn.day===t)?S._nudgesIn.list:[])){ S._nudgesIn={day:t,list:todays}; dirty=true; }
  // Who I nudged (from any device) so buttons read "Nudged" after a reload.
  (r.data.sent||[]).forEach(x=>{ if(x&&x.to&&_ymd(new Date(x.at))===t&&!_nudgedToday(x.to)){ _markNudged(x.to); dirty=true; } });
  return dirty;
}
function nudgesToday(){
  const n=S&&S._nudgesIn;
  return n&&n.day===todayStr()?(n.list||[]):[];
}

// ── UI ──────────────────────────────────────────────────────────
function _pushStatusCard(){
  const st=pushState();
  const box=(tone,title,sub,btn)=>`<div id="push-status" data-state="${st}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;margin-bottom:16px;background:${tone==='on'?'var(--grn-bg)':'var(--surf2)'};border:1px solid ${tone==='on'?'var(--grn-bdr)':'var(--bdr)'}">
    <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">${title}</div><div style="font-size:11.5px;color:var(--sub);margin-top:2px;line-height:1.5">${sub}</div></div>${btn||''}</div>`;
  if(st==='on') return box('on','Notifications are on for this device','Streak warnings, your crew\'s activity and messages reach you even when Ledger is closed.',`<button class="btn btn-ghost btn-sm" onclick="disablePush()">Turn off</button>`);
  if(st==='native'){
    let on=false; try{ on=localStorage.getItem('ledger-native-rem')==='1'; }catch(e){}
    return on?box('on','Evening reminders are on','A reminder at 8pm on days you haven\'t studied yet.',`<button class="btn btn-ghost btn-sm" onclick="disablePush()">Turn off</button>`)
      :box('','Evening reminders','A reminder at 8pm on days you haven\'t studied yet.',`<button class="btn btn-primary btn-sm" onclick="enablePush()">Turn on</button>`);
  }
  if(st==='denied') return box('','Notifications are blocked','Your browser is blocking notifications from Ledger. Allow them in the site settings (the lock icon in the address bar), then come back.');
  if(st==='ios-install') return box('','Add Ledger to your Home Screen','On iPhone, notifications work once Ledger is on your Home Screen: tap Share, then "Add to Home Screen", and open it from there.');
  if(st==='unsupported') return box('','Not available in this browser','This browser can\'t show notifications. Ledger still shows everything in the bell when you open it.');
  return box('','Get notified on this device','Hear about a streak that is about to end, props and messages, and when your study partner logs a session — even when Ledger is closed.',`<button class="btn btn-primary btn-sm" id="push-enable-btn" onclick="enablePush()">Turn on</button>`);
}
function _refreshPushUI(){
  const el=document.getElementById('push-status'); if(el) el.outerHTML=_pushStatusCard();
  document.getElementById('today-push-prompt')?.remove();
}
// A quiet invitation on Today, once there is a streak worth protecting.
function _todayPushPrompt(){
  const st=pushState();
  if(st!=='default'&&!(st==='native'&&localStorage.getItem('ledger-native-rem')!=='1')) return '';
  if(!(S.activities||[]).some(_isStudyAct)) return '';
  try{ const d=parseInt(localStorage.getItem('ledger-push-prompt-dismissed')||'0'); if(d&&Date.now()-d<14*86400000) return ''; }catch(e){}
  return `<div class="card card-pad today-card" id="today-push-prompt" style="display:flex;align-items:center;gap:12px">
    <div style="font-size:22px;flex-shrink:0">${ico('bell')}</div>
    <div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:800">Want a nudge before your streak ends?</div>
      <div style="font-size:12px;color:var(--sub);margin-top:2px;line-height:1.5">Ledger can remind you in the evening if you haven't studied, and tell you when your crew does.</div></div>
    <button class="btn btn-primary btn-sm" onclick="enablePush()">Turn on</button>
    <button onclick="localStorage.setItem('ledger-push-prompt-dismissed',Date.now());document.getElementById('today-push-prompt').remove()" title="Not now" aria-label="Not now" style="background:none;border:none;color:var(--mut);font-size:20px;line-height:1;cursor:pointer;padding:0 2px;flex-shrink:0">×</button>
  </div>`;
}

// ── Offline ─────────────────────────────────────────────────────
function _offlineBanner(show){
  let el=document.getElementById('offline-banner');
  if(!show){ if(el) el.remove(); return; }
  if(el) return;
  el=document.createElement('div');
  el.id='offline-banner';
  el.setAttribute('role','status');
  el.style.cssText='position:fixed;top:0;left:0;right:0;z-index:12000;background:#18103a;color:#fff;font-size:12px;font-weight:600;text-align:center;padding:7px 12px';
  el.textContent='You\'re offline. Sessions you log are saved on this device and sync when you\'re back.';
  document.body.appendChild(el);
}
window.addEventListener('offline',()=>_offlineBanner(true));
window.addEventListener('online',()=>{
  _offlineBanner(false);
  if(S&&AUTH&&firebaseDb){ try{ writeUserProfile(); }catch(e){} showToast('Back online — syncing','ok'); }
});

