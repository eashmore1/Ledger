// ═══════════════════════════════════════════════
// POST MODAL
// ═══════════════════════════════════════════════
let postFeeling='💪';let postDiff=3;
// One event per logged session. No notes, captions or material text: only
// the shape of the session, so the dashboard can show how people study.
function _logSessionEvent(act,via){
  const p={section:act.section,hours:Math.round((+act.hours||0)*4)/4,via,course:act.course||'none',kind:act.kind||'none',has_photo:!!act.photo,private:!!act.private};
  logLedgerEvent('session_logged',p);
  // The activation moment. Everything before this is setup; a user who never
  // reaches it never had a chance to retain.
  if((S.activities||[]).length===1) logLedgerEventOnce('first_session_logged',p);
}

function openPostModal(prefSection=''){
  postFeeling='💪';postDiff=3;
  _srcPick.pm={course:S.lastCourse||'',kind:''};
  const sectionOpts=(S.sections||['FAR','AUD','REG','TCP']).map(s=>`<option value="${s}"${s===prefSection?' selected':''}>${s} — ${EXAMS[s]?.full||s}</option>`).join('');
  const feelingOpts=['💪','😤','😅','🤔','😵','🔥'].map(f=>`<div class="feeling-opt${f===postFeeling?' selected':''}" onclick="selectFeeling('${f}',this)">${ico(f)}</div>`).join('');
  const diffOpts=[1,2,3,4,5].map(d=>`<div class="diff-opt${d===postDiff?' selected':''}" onclick="selectDiff(${d},this)">${d}</div>`).join('');

  document.getElementById('post-modal-body').innerHTML=`
<div class="form-grp">
  <label>Exam Section</label>
  <select id="pm-section">${sectionOpts}</select>
</div>
<div class="form-row">
  <div class="form-grp">
    <label>Hours Studied</label>
    <input id="pm-hours" type="number" min="0.5" max="16" step="0.5" placeholder="e.g. 2.5">
  </div>
  <div class="form-grp">
    <label>Date</label>
    <input id="pm-date" type="date" value="${todayStr()}">
  </div>
</div>
<div class="form-grp">
  <label>Material Covered <span style="color:var(--mut);font-weight:400">(optional)</span></label>
  <input id="pm-material" type="text" maxlength="120" placeholder="e.g. Governmental Accounting — Fund Structure">
</div>
${studySrcPickerHTML('pm','form-grp')}
<div class="form-grp">
  <label>Session Notes <span style="color:var(--mut);font-weight:400">(optional)</span></label>
  <textarea id="pm-caption" maxlength="500" placeholder="How did it go? What clicked? What's still tricky?"></textarea>
</div>
<div class="form-row">
  <div class="form-grp">
    <label>How'd it feel?</label>
    <div class="feeling-row" id="feeling-row">${feelingOpts}</div>
  </div>
  <div class="form-grp">
    <label>Difficulty (1–5)</label>
    <div class="diff-row" id="diff-row">${diffOpts}</div>
  </div>
</div>
<div style="display:flex;align-items:center;gap:9px;padding:10px 12px;background:var(--surf2);border-radius:9px;margin-bottom:6px;margin-top:2px;cursor:pointer" onclick="document.getElementById('pm-private').checked=!document.getElementById('pm-private').checked">
  <input type="checkbox" id="pm-private" style="width:15px;height:15px;accent-color:var(--ind);cursor:pointer" onclick="event.stopPropagation()">
  <div>
    <div style="font-size:12px;font-weight:700;color:var(--txt)">Keep private</div>
    <div style="font-size:11px;color:var(--mut)">Session shows as "logged a session" to others — details are just for you</div>
  </div>
</div>
<button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;font-size:14px;margin-top:4px" onclick="submitPost()">Log Session</button>`;
  document.getElementById('post-modal').classList.add('open');
}
function closePostModal(){document.getElementById('post-modal').classList.remove('open');}
function selectFeeling(f,el){
  postFeeling=f;
  document.querySelectorAll('#feeling-row .feeling-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
}
function selectDiff(d,el){
  postDiff=d;
  document.querySelectorAll('#diff-row .diff-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
}
function submitPost(){
  const btn=document.querySelector('#post-modal .btn-primary');
  if(btn?.disabled)return;
  const section=document.getElementById('pm-section')?.value;
  const hours=parseFloat(document.getElementById('pm-hours')?.value)||0;
  const date=document.getElementById('pm-date')?.value||todayStr();
  const material=(document.getElementById('pm-material')?.value?.trim()||'').slice(0,120);
  const caption=(document.getElementById('pm-caption')?.value?.trim()||'').slice(0,500);
  if(!section){showToast('Select a section','err');return;}
  if(_badWords(material,caption)) return;
  if(hours<=0){showToast('Enter the number of hours you studied','err');return;}
  if(hours>16){showToast('Hours capped at 16 per session','err');return;}
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  const isPrivate=document.getElementById('pm-private')?.checked||false;
  const act={id:'u'+Date.now(),date:date+'T'+new Date().toTimeString().slice(0,8),section,hours,material,caption,difficulty:postDiff,feeling:postFeeling,kudos:[],comments:[],private:isPrivate};
  if(_srcPick.pm.course) act.course=_srcPick.pm.course;
  if(_srcPick.pm.kind) act.kind=_srcPick.pm.kind;
  rememberStudySrc(act.course);
  S.activities.push(act);
  _logSessionEvent(act,'manual');
  saveState();
  checkAchievements();
  checkChallengeAchievements();
  closePostModal();
  openSessionLoggedModal(act);
  checkReviewPrompt();
}

// ═══════════════════════════════════════════════
// SESSION LOGGED MODAL
// ═══════════════════════════════════════════════
function openSessionLoggedModal(act, priorReadiness){
  const ex=EXAMS[act.section]||{color:'var(--ind)',icon:'book',full:act.section};
  const secActs=S.activities.filter(a=>a.section===act.section);
  const secHrs=secActs.reduce((t,a)=>t+(a.hours||0),0);
  const goal=(S.hourGoals||{})[act.section]||0;
  const pct=goal?Math.min(100,Math.round((secHrs/goal)*100)):0;
  const streak=getStreak();
  const newScore=calcReadinessScore().score;
  const delta=priorReadiness!=null?newScore-priorReadiness:0;

  // On-track logic: target ~1h/day on weekdays
  const daysLeft=goal&&S.examDates?.[act.section]?(()=>{
    const d=Math.max(0,Math.round((new Date(S.examDates[act.section]+' 00:00:00')-Date.now())/(1000*86400)));
    return d;
  })():null;
  const hrsLeft=goal?Math.max(0,goal-secHrs):null;
  const onTrack=daysLeft&&hrsLeft?(hrsLeft/daysLeft)<=2:'unknown';

  // Milestone: next 25h checkpoint
  const nextMilestone=goal?Math.ceil(secHrs/25)*25:null;
  const milestoneLeft=nextMilestone&&nextMilestone<=goal?Math.max(0,(nextMilestone-secHrs).toFixed(1)):null;

  let el=document.getElementById('session-logged-modal');
  if(!el){
    el=document.createElement('div');
    el.id='session-logged-modal';
    el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:480px;padding:28px"><div id="slm-body"></div></div>`;
    el.addEventListener('click',e=>{if(e.target===el)closeSessionLoggedModal();});
    document.body.appendChild(el);
  }

  document.getElementById('slm-body').innerHTML=`
<div style="text-align:center;margin-bottom:20px">
  <div style="margin-bottom:6px">${LedgerBuddy('cheer',96)}</div>
  <div style="font-size:18px;font-weight:800;color:var(--txt)">Session logged!</div>
  <div style="font-size:13px;color:var(--mut);margin-top:4px">${act.hours}h of ${LedgerIcon(ex.icon)} ${ex.full} · ${streak} day streak</div>
</div>

${goal?`<div style="margin-bottom:20px">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
    <div style="font-size:12px;font-weight:700;color:var(--txt)">${act.section} Hours</div>
    <div style="font-size:12px;font-weight:800;color:${ex.color}">${secHrs.toFixed(1)}h <span style="color:var(--mut);font-weight:400">/ ${goal}h goal &middot; ${pct}%</span></div>
  </div>
  <div style="background:var(--surf2);border-radius:6px;height:10px;overflow:hidden">
    <div style="height:100%;background:${ex.color};width:${pct}%;border-radius:6px;transition:width .5s"></div>
  </div>
  ${daysLeft!=null&&hrsLeft!=null?`<div style="font-size:11px;color:${onTrack?'var(--grn)':'var(--ora)'};margin-top:6px;font-weight:600">${onTrack?'✓ On track':'Push a little harder'} &mdash; ${hrsLeft.toFixed(0)}h left with ${daysLeft} days to exam</div>`:''}
</div>`:''}

${delta>0?`<div style="padding:10px 14px;background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:10px;margin-bottom:16px;font-size:12px;color:var(--ind);font-weight:600">Readiness +${delta} → ${newScore}</div>`:''}

${milestoneLeft&&milestoneLeft>0?`<div style="padding:10px 14px;background:var(--surf2);border-radius:10px;margin-bottom:16px;font-size:12px;color:var(--sub)">Next milestone: <strong>${nextMilestone}h for ${act.section}</strong> — just ${milestoneLeft}h away</div>`:''}

<button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;font-size:14px" onclick="closeSessionLoggedModal()">View My Log</button>
`;
  el.classList.add('open');
}

function closeSessionLoggedModal(){
  document.getElementById('session-logged-modal')?.classList.remove('open');
  currentTab='feed';
  renderApp();
}

// ═══════════════════════════════════════════════
// SOCIAL ACTIONS
// ═══════════════════════════════════════════════
function giveProps(actId,userId){
  if(userId==='you'){showToast("Can't give yourself props",'err');return;}
  if(!AUTH){showToast('Sign in to give props','err');return;}
  const me=AUTH.uid;
  const authorUid=userId;
  const friend=REAL_USERS.find(f=>f.id===userId);
  let act=null;
  if(friend)act=friend.activities.find(a=>a.id===actId);
  if(!act){showToast("Something went wrong — try reloading",'err');return;}
  if(!Array.isArray(act.kudos))act.kudos=[];
  const hasProps=act.kudos.includes(me)||act.kudos.includes('you');
  // Persist to the author's props subcollection so they (and everyone) see it.
  const _ref=firebaseDb?firebaseDb.collection('users').doc(authorUid).collection('props').doc(actId+'__'+me):null;
  if(hasProps){
    act.kudos=act.kudos.filter(k=>k!==me&&k!=='you');
    if(_ref)_ref.delete().catch(()=>{});
  }
  else{
    act.kudos.push(me);S.propsGiven=(S.propsGiven||0)+1;saveState();checkAchievements();logLedgerEvent('props_given',{});
    if(_ref)_ref.set({activityId:actId,reactor:me,author:authorUid,at:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>notifyEvent('kudos',{toUid:authorUid,activityId:actId})).catch(e=>{if(e.code==='permission-denied')showToast('Couldn\'t save that — please try again.','err');});
  }
  // Animate button
  const btn=document.querySelector(`[data-aid="${actId}"][data-uid="${userId}"] .ac-action`)||
    document.querySelector(`.activity-card[data-aid="${actId}"] .ac-action`);
  if(btn){
    btn.classList.add('props-anim');
    if(!hasProps){
      const r=btn.getBoundingClientRect();
      const p=document.createElement('div');
      p.textContent='+1';
      p.style.cssText=`position:fixed;left:${r.left+r.width/2}px;top:${r.top-6}px;font-size:12px;font-weight:800;color:var(--ora);pointer-events:none;z-index:1000;animation:propsFloat .65s cubic-bezier(.22,.61,.36,1) forwards;white-space:nowrap`;
      document.body.appendChild(p);
      setTimeout(()=>p.remove(),650);
    }
  }
  if(!hasProps)showToast('Props given!','ok');
  setTimeout(()=>renderTab(), hasProps?0:480);
}

// Who wrote a comment: photo, color and initials from what we already know
// about them (me, or someone in my network), falling back to their name.
function _cmPerson(c){
  const me=AUTH?.uid;
  if(c.from&&c.from===me){
    const n=S.name||c.user||'You';
    return {name:n,pic:S.profilePic||'',color:S.profileColor||hashColor(me),mine:true};
  }
  const f=(REAL_USERS||[]).find(u=>u.id===c.from);
  return {name:(f&&f.name)||c.user||'Member',pic:(f&&f.profilePic)||'',color:(f&&f.color)||hashColor(c.from||c.user||''),mine:false};
}
function _cmInitials(n){return (String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2)||'?').toUpperCase();}
function _cmAvatar(p,click){
  return `<div class="cm-av" style="background:${p.color}"${click?` onclick="${click}"`:''}>${p.pic?`<img src="${esc(p.pic)}" alt="">`:esc(_cmInitials(p.name))}</div>`;
}
function _cmFind(actId,userId){
  const me=AUTH?.uid;
  if(userId==='you'||userId===me) return {act:S.activities.find(a=>a.id===actId),owner:{name:S.name||'You',pic:S.profilePic||'',color:S.profileColor||(me?hashColor(me):'var(--ind)')},ownerUid:me,mine:true};
  const f=REAL_USERS.find(u=>u.id===userId);
  return {act:f&&f.activities.find(a=>a.id===actId),owner:f?{name:f.name,pic:f.profilePic||'',color:f.color||hashColor(f.id)}:null,ownerUid:userId,mine:false};
}
let _cmOpen=null;
function openComments(actId,userId,flashLast){
  const {act,owner,ownerUid,mine}=_cmFind(actId,userId);
  if(!act)return;
  _cmOpen={actId,userId};
  const me=AUTH?.uid;
  const comments=act.comments||[];
  const shown=comments.filter(c=>!isBlocked(c.from));
  const ex=EXAMS[act.section]||{};
  const what=act.type==='sat'?`Sat for ${esc(act.section)}`:`${esc(act.section||'Study')} · ${esc(act.hours)}h`;
  const rows=comments.map((c,i)=>{
    if(isBlocked(c.from)) return '';
    const p=_cmPerson(c);
    const go=c.from&&!p.mine?`closeCommentsModal();openUserProfile('${esc(c.from)}')`:'';
    const canDel=me&&(c.from===me||mine);
    return `<div class="cm-row${flashLast&&i===comments.length-1?' cm-new':''}">
      ${_cmAvatar(p,go)}
      <div class="cm-main">
        <div class="cm-top">
          <span class="cm-name"${go?` onclick="${go}"`:' style="cursor:default;text-decoration:none"'}>${esc(p.name)}</span>
          ${c.from&&c.from===ownerUid?'<span class="cm-chip">Author</span>':''}
          ${c.at?`<span class="cm-time">${timeAgo(c.at)}</span>`:''}
        </div>
        <div class="cm-text">${esc(window.LedgerModeration?LedgerModeration.censor(c.text):c.text)}</div>
      </div>
      ${c.from&&c.from===me?`<button class="cm-del" onclick="deleteComment('${actId}','${userId}',${i})">Delete</button>`
        :c.from?`<button class="cm-more" aria-label="More options" onclick="_cmMore('${actId}','${userId}',${i})">⋯</button>`
        :canDel?`<button class="cm-del" onclick="deleteComment('${actId}','${userId}',${i})">Delete</button>`:''}
    </div>`;
  }).join('');
  const empty=`<div class="cm-empty">
    <div class="cm-empty-ic">${ico('chat')}</div>
    <div class="cm-empty-t">No comments yet</div>
    <div class="cm-empty-s">${mine?'When someone cheers you on, it shows up here.':'Be the first to cheer them on.'}</div>
  </div>`;
  const myP=_cmPerson({from:me,user:S.name});
  const ttl=document.querySelector('#comments-modal .modal-title'); if(ttl) ttl.innerHTML='Comments'+(shown.length?`<span class="cm-count">${shown.length}</span>`:'');
  document.getElementById('comments-modal-body').innerHTML=`
<div class="cm-post" style="--cm-c:${ex.color||'var(--ind)'}">
  ${_cmAvatar(owner||{name:'?',color:'var(--ind)'})}
  <div style="flex:1;min-width:0">
    <div class="cm-post-name">${esc(owner?owner.name:'Member')}</div>
    <div class="cm-post-meta">${what}${act.date?' · '+timeAgo(act.date):''}</div>
    ${act.caption?`<div class="cm-post-cap">${esc(act.caption)}</div>`:''}
  </div>
</div>
<div class="cm-list" id="cm-list">${shown.length?rows:empty}</div>
<div class="cm-warn" id="cm-warn" role="alert"></div>
<div class="cm-compose">
  ${_cmAvatar(myP)}
  <div class="cm-field">
    <input id="comment-input" type="text" maxlength="300" autocomplete="off" enterkeyhint="send" aria-label="Add a comment" placeholder="${mine?'Reply…':'Say something encouraging…'}" oninput="_cmInput(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();addComment('${actId}','${userId}')}">
    <span class="cm-left" id="cm-left"></span>
  </div>
  <button class="cm-send" id="cm-send" disabled onclick="addComment('${actId}','${userId}')">Post</button>
</div>`;
  document.getElementById('comments-modal').classList.add('open');
  const list=document.getElementById('cm-list'); list.scrollTop=list.scrollHeight;
  // Don't pop the phone keyboard open uninvited; on a computer, start typing right away.
  if(flashLast||matchMedia('(hover:hover) and (pointer:fine)').matches) document.getElementById('comment-input').focus({preventScroll:true});
}
function _cmInput(el){
  document.querySelector('#comments-modal .cm-field')?.classList.remove('cm-bad');
  const w=document.getElementById('cm-warn'); if(w) w.textContent='';
  const n=el.value.length, left=document.getElementById('cm-left'), send=document.getElementById('cm-send');
  if(send) send.disabled=!el.value.trim();
  if(left) left.textContent=n>=240?String(300-n):'';
}
function closeCommentsModal(){document.getElementById('comments-modal').classList.remove('open');}
function addComment(actId,userId){
  const input=document.getElementById('comment-input');
  const text=(input?.value?.trim()||'').slice(0,300);
  if(!text)return;
  if(!AUTH){showToast('Sign in to comment','err');return;}
  const me=AUTH.uid; const myName=S.name||AUTH.displayName||'You';
  const authorUid=(userId==='you'||userId===me)?me:userId;
  if(isBlocked(authorUid)){showToast('You can’t comment on this post.','err');return;}
  if(window.LedgerModeration&&LedgerModeration.check(text)){
    const f=document.querySelector('#comments-modal .cm-field'), w=document.getElementById('cm-warn');
    if(f) f.classList.add('cm-bad');
    if(w) w.textContent='Keep it encouraging — that comment has language that isn’t allowed on Ledger.';
    return;
  }
  let act=null;
  if(authorUid===me){act=S.activities.find(a=>a.id===actId);}
  else{const f=REAL_USERS.find(f=>f.id===authorUid);if(f)act=f.activities.find(a=>a.id===actId);}
  if(!act)return;
  if(!act.comments)act.comments=[];
  const c={user:myName,text,from:me,at:Date.now()};
  act.comments.push(c);
  logLedgerEvent('comment_posted',{own_post:authorUid===me});
  // Persist to the author's comments subcollection so the comment reaches them + everyone.
  if(firebaseDb){firebaseDb.collection('users').doc(authorUid).collection('comments').add({activityId:actId,from:me,name:myName,text,at:firebase.firestore.FieldValue.serverTimestamp()}).then(ref=>{ c.id=ref.id; if(authorUid!==me) notifyEvent('comment',{toUid:authorUid,activityId:actId}); }).catch(e=>{if(e.code==='permission-denied')showToast('Couldn\'t post that comment — please try again.','err');});}
  if(authorUid===me)saveState();
  input.value='';
  openComments(actId,userId,true);
  renderTab();
}
// ⋯ on someone else's post in the feed.
function _postMore(actId,uid){
  const f=(REAL_USERS||[]).find(u=>u.id===uid); const a=f&&(f.activities||[]).find(x=>x.id===actId);
  const name=(f&&f.name)||_nameOf(uid);
  const text=a?[a.type==='sat'?'Sat for '+a.section:a.type==='pass'?'Passed '+a.section:(a.section||'')+' · '+(a.hours||0)+'h',a.material,a.caption].filter(Boolean).join(' — '):'';
  openContentActions(_regReport({kind:'post',target:uid,targetName:name,text:String(text),refPath:'users/'+uid+' activity '+actId}));
}
// ⋯ on someone else's comment: report or block them (and delete, on my own post).
function _cmMore(actId,userId,idx){
  const {act,ownerUid,mine}=_cmFind(actId,userId);
  const c=act&&act.comments&&act.comments[idx]; if(!c||!c.from) return;
  const p=_cmPerson(c);
  const k=_regReport({kind:'comment',target:c.from,targetName:p.name,text:String(c.text||''),
    refPath:'users/'+ownerUid+'/comments/'+(c.id||'')+' (post '+actId+')'});
  openContentActions(k,mine?[{label:'Delete comment',icon:'x',run:()=>deleteComment(actId,userId,idx)}]:[]);
}
// The commenter can remove their own comment; the post's author can remove any.
function deleteComment(actId,userId,idx){
  const {act,ownerUid,mine}=_cmFind(actId,userId);
  const c=act&&act.comments&&act.comments[idx];
  if(!c||!AUTH||!(c.from===AUTH.uid||mine))return;
  if(!confirm('Delete this comment?'))return;
  act.comments.splice(idx,1);
  _cmOpen=null;
  if(firebaseDb&&c.id) firebaseDb.collection('users').doc(ownerUid).collection('comments').doc(c.id).delete().catch(()=>showToast('Couldn\'t delete that comment — please try again.','err'));
  if(mine)saveState();
  openComments(actId,userId);
  renderTab();
}

function shareActivity(actId){
  const url = window.location.href;
  if(navigator.share){
    navigator.share({title:'My CPA Study Session — Ledger',text:'Check out my study session on Ledger!',url})
      .catch(e=>{ if(e.name!=='AbortError') _fallbackShare(url); });
    return;
  }
  _fallbackShare(url);
}
function _fallbackShare(url){
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(url)
      .then(()=>showToast('Link copied!','ok'))
      .catch(()=>_execCommandShare(url));
    return;
  }
  _execCommandShare(url);
}
function _execCommandShare(url){
  // Works on iOS Safari, older Android, and browsers without Clipboard API
  try{
    const ta=document.createElement('textarea');
    ta.value=url;
    ta.setAttribute('readonly','');
    ta.style.cssText='position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    // iOS Safari needs this extra selection step
    const range=document.createRange();
    range.selectNodeContents(ta);
    const sel=window.getSelection();
    if(sel){sel.removeAllRanges();sel.addRange(range);}
    ta.setSelectionRange(0,99999);
    const ok=document.execCommand('copy');
    document.body.removeChild(ta);
    if(ok){showToast('Link copied!','ok');return;}
  }catch(e){}
  _showShareDialog(url);
}
function _showShareDialog(url){
  let overlay=document.getElementById('_share-overlay');
  if(overlay)overlay.remove();
  overlay=document.createElement('div');
  overlay.id='_share-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px';
  overlay.innerHTML=
    '<div style="background:var(--surf);border-radius:18px;padding:24px;max-width:380px;width:100%;box-shadow:var(--shadow-lg)">' +
      '<div style="font-size:16px;font-weight:800;margin-bottom:4px">Share Session</div>' +
      '<div style="font-size:12px;color:var(--sub);margin-bottom:14px">Tap to select, then copy the link below</div>' +
      '<input id="_share-url-inp" value="'+url+'" readonly ' +
        'style="width:100%;padding:10px 12px;background:var(--surf2);border:1.5px solid var(--bdr2);border-radius:9px;color:var(--txt);font-size:12px;outline:none;box-sizing:border-box" ' +
        'onclick="this.select();this.setSelectionRange(0,9999)" ' +
        'onfocus="this.select();this.setSelectionRange(0,9999)">' +
      '<div style="display:flex;gap:8px;margin-top:14px">' +
        '<button onclick="const i=document.getElementById(\'_share-url-inp\');i.select();i.setSelectionRange(0,9999);try{document.execCommand(\'copy\');showToast(\'Copied!\',\'ok\');}catch(e){}document.getElementById(\'_share-overlay\').remove();" ' +
          'style="flex:1;padding:11px;background:var(--ind);color:#fff;border:none;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer">Copy Link</button>' +
        '<button onclick="document.getElementById(\'_share-overlay\').remove()" ' +
          'style="padding:11px 16px;background:var(--surf2);border:1px solid var(--bdr);border-radius:9px;font-weight:600;font-size:13px;cursor:pointer;color:var(--txt)">Close</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  setTimeout(()=>{const inp=document.getElementById('_share-url-inp');if(inp){inp.focus();inp.select();inp.setSelectionRange(0,9999);}},80);
}

// ── Session photo helpers ──────────────────────────────────────────────────
function _compressImage(dataURL, maxW, maxH, quality, cb){
  const img=new Image();
  img.onload=function(){
    let w=img.width,h=img.height;
    const ratio=Math.min(1, maxW/w, maxH/h);
    const cw=Math.round(w*ratio), ch=Math.round(h*ratio);
    const canvas=document.createElement('canvas');
    canvas.width=cw; canvas.height=ch;
    canvas.getContext('2d').drawImage(img,0,0,cw,ch);
    cb(canvas.toDataURL('image/jpeg',quality));
  };
  img.src=dataURL;
}
function _sessPhotoPickerHTML(){
  return '<label for="sess-photo-inp" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;background:var(--surf2);border:1.5px dashed var(--bdr2);border-radius:10px;cursor:pointer;color:var(--sub);font-size:13px;font-weight:600;width:100%;box-sizing:border-box">' +
    '<span style="font-size:20px">'+ico('camera')+'</span>Add photo from camera or library' +
    '<input type="file" id="sess-photo-inp" accept="image/*" style="display:none" onchange="handleSessionPhotoUpload(this)">' +
  '</label>';
}
function clearSessionPhoto(){
  TS.sessionPhoto=null;
  const area=document.getElementById('sess-photo-area');
  if(area) area.innerHTML=_sessPhotoPickerHTML();
}
function handleSessionPhotoUpload(input){
  const file=input.files?.[0];
  if(!file)return;
  if(file.size>15*1024*1024){showToast('Image must be under 15 MB','err');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    _compressImage(e.target.result,1200,1200,0.72,function(compressed){
      TS.sessionPhoto=compressed;
      const area=document.getElementById('sess-photo-area');
      if(area){
        area.innerHTML=
          '<div style="position:relative;display:inline-block;width:100%">' +
            '<img src="'+compressed+'" alt="Study session photo" loading="lazy" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;display:block">' +
            '<button onclick="clearSessionPhoto()" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;border-radius:50%;width:28px;height:28px;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">×</button>' +
          '</div>';
      }
    });
  };
  reader.readAsDataURL(file);
}

function _isUserPrivate(uid){
  const u=REAL_USERS.find(f=>f.id===uid);
  if(u) return !!u.isPrivate;
  return !!(window._cachedPrivacy&&window._cachedPrivacy[uid]);
}

function toggleAccountPrivacy(val){
  S.isPrivate=val;
  S.privacyPrefs={...(S.privacyPrefs||{}),public_profile:!val};
  const track=document.getElementById('privacy-toggle-track');
  if(track){
    track.style.background=val?'var(--ind)':'var(--surf3)';
    const dot=track.querySelector('span');
    if(dot) dot.style.left=val?'21px':'3px';
  }
  saveState();
  showToast(val?'Account set to private — only followers can see your activity':'Account is now public','ok');
}

function _sendFollowRequest(uid, btn){
  if(!S.pendingRequests) S.pendingRequests=[];
  if(S.pendingRequests.includes(uid)){
    // Cancel request
    S.pendingRequests=S.pendingRequests.filter(id=>id!==uid);
    if(btn){btn.textContent='Follow';btn.classList.remove('following');btn.style.background='';btn.style.color='';}
    saveState();
    showToast('Follow request cancelled','info');
  } else {
    S.pendingRequests.push(uid);
    logLedgerEvent('follow',{private:true});
    if(btn){btn.textContent='Requested';btn.classList.remove('following');btn.style.background='var(--surf2)';btn.style.color='var(--sub)';}
    saveState();
    showToast('Follow request sent','ok');
  }
}

function toggleFollow(fId,btn){
  if(isBlocked(fId)){ showToast('You can’t follow this account.','err'); return; }
  const following=S.following||[];
  const idx=following.indexOf(fId);
  if(idx>=0){
    following.splice(idx,1);
    S.following=following;
    if(btn){btn.textContent='Follow';btn.classList.remove('following');btn.style.background='';btn.style.color='';}
    saveState();checkAchievements();saveFollowToFirestore();
    if(currentTab==='feed'||currentTab==='explore')renderTab();
    showToast('Unfollowed','info');
  } else if(_isUserPrivate(fId)){
    _sendFollowRequest(fId,btn);
  } else {
    following.push(fId);
    S.following=following;
    logLedgerEvent('follow',{private:false});
    if(btn){btn.textContent='Following';btn.classList.add('following');btn.style.background='';btn.style.color='';btn.classList.remove('just-followed');void btn.offsetWidth;btn.classList.add('just-followed');}
    saveState();checkAchievements();saveFollowToFirestore();
    showToast('Following! Their sessions will now appear in your feed.','ok');
    // Pull the newly-followed user's recent activity into the feed right away.
    loadRealUsers().then(()=>{ if(currentTab==='feed'||currentTab==='explore')renderTab(); });
  }
}

function setPacingTargetDate(section,date){
  if(!S.examDates)S.examDates={};
  if(date){S.examDates[section]=date;}else{delete S.examDates[section];}
  saveState();
  if(firebaseDb&&AUTH?.uid){
    try{firebaseDb.collection('users').doc(AUTH.uid).update({examDates:S.examDates,updatedAt:Date.now()});}catch(e){}
  }
  renderTab();
}

function updateSectionStatus(section,status){
  if(!S.sectionStatus)S.sectionStatus={};
  S.sectionStatus[section]=status;
  if(status==='passed'){
    if(!S.sectionPassed)S.sectionPassed=[];
    if(!S.sectionPassed.includes(section)){
      const _priorAch=new Set(S.achievements||[]);
      S.sectionPassed.push(section);showToast(`${section} marked as Passed!`,'ok');
      addPassActivity(section,null);
      checkAchievements();checkShareTrigger(_priorAch);
      const hrs=Math.round(getSectionHours(section));
      setTimeout(()=>showPassCelebration(section,null,hrs),300);
      writeUserProfile();
    } else { checkAchievements(); }
  } else {
    S.sectionPassed=(S.sectionPassed||[]).filter(s=>s!==section);
  }
  saveState();
  renderTab();
}

function openDayLog(dateStr){
  const logs=(S.activities||[]).filter(a=>a.date.slice(0,10)===dateStr);
  const fmt=new Date(dateStr+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const examOn=Object.entries(S.examDates||{}).find(([,v])=>v===dateStr);
  let html='';
  if(examOn)html+=`<div style="background:${EXAMS[examOn[0]].color}15;border:1px solid ${EXAMS[examOn[0]].color}44;border-radius:10px;padding:12px 14px;margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:${EXAMS[examOn[0]].color}">EXAM TARGET DATE</div><div style="font-size:14px;font-weight:700">${examOn[0]} — ${EXAMS[examOn[0]].full}</div></div>`;
  if(logs.length){
    html+=logs.map(a=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--surf2);border-radius:8px;margin-bottom:6px">
      <div><span class="badge badge-${a.section}" style="margin-right:6px">${a.section}</span><strong>${a.hours}h</strong>${a.caption?`<div style="font-size:11px;color:var(--mut);margin-top:2px">${a.caption}</div>`:''}</div>
      <button onclick="deleteActivity('${a.id}')" style="background:none;border:none;color:var(--mut);cursor:pointer;font-size:16px;padding:0 4px">×</button>
    </div>`).join('');
  } else if(!examOn){html+=`<div style="text-align:center;padding:20px;color:var(--mut);font-size:13px">No sessions on this day.</div>`;}
  // Temp show as alert-like using toast
  const modal=document.getElementById('post-modal');
  document.getElementById('post-modal-body').innerHTML=`
<div style="font-size:13px;color:var(--sub);margin-bottom:14px;font-weight:600">${fmt}</div>
${html}
<div style="display:flex;gap:8px;margin-top:8px">
  <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="closePostModal();openSessionModal()">Start Session</button>
  <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="closePostModal();openPostModal()">+ Quick Log</button>
</div>`;
  document.getElementById('post-modal').querySelector('.modal-title').textContent=fmt;
  modal.classList.add('open');
}

function deleteActivity(id){
  if(!confirm('Delete this session? This cannot be undone.'))return;
  S.activities=(S.activities||[]).filter(a=>a.id!==id);
  // Tombstone so a cross-device merge doesn't resurrect the deleted session.
  S.deletedActs=[...(S.deletedActs||[]),id].slice(-500);
  saveState();
  checkAchievements();
  closeActivityDetail();
  showToast('Session deleted','ok');
  renderTab();
}

// ═══════════════════════════════════════════════
// ACTIVITY DETAIL MODAL
// ═══════════════════════════════════════════════
function openActivityDetail(actId){
  const act=(S.activities||[]).find(a=>a.id===actId);
  if(!act)return;
  const ex=EXAMS[act.section]||{color:'var(--ind)',icon:'book',full:act.section};
  const d=new Date(act.date);
  const dateStr=d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const timeStr=d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  const diffStars=act.difficulty?[1,2,3,4,5].map(i=>'<span style="color:'+(i<=act.difficulty?'var(--amb)':'var(--bdr)')+'">★</span>').join(''):'';
  const statCols=act.elapsed?'1fr 1fr 1fr':'1fr 1fr';

  document.getElementById('activity-detail-modal')?.remove();
  const el=document.createElement('div');
  el.id='activity-detail-modal';
  el.style.cssText='position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .15s ease';
  el.innerHTML=`
<div style="background:var(--surf);border-radius:22px;width:100%;max-width:520px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.3);max-height:90vh;display:flex;flex-direction:column">
  <div style="height:5px;background:${ex.color};flex-shrink:0"></div>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 0;flex-shrink:0">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:42px;height:42px;border-radius:13px;background:${ex.color}18;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${LedgerIcon(ex.icon)}</div>
      <div>
        <div style="font-size:15px;font-weight:900;color:var(--txt)">${ex.full}</div>
        <div style="font-size:11px;color:var(--mut)">${dateStr} · ${timeStr}</div>
      </div>
    </div>
    <button onclick="closeActivityDetail()" style="width:30px;height:30px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer;font-size:18px;color:var(--sub);display:flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0">×</button>
  </div>
  <div style="overflow-y:auto;padding:16px 20px 20px">
    <div style="display:grid;grid-template-columns:${statCols};gap:10px;margin-bottom:16px">
      <div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:13px;padding:14px;text-align:center">
        <div style="font-size:30px;font-weight:900;color:${ex.color};letter-spacing:-.04em;line-height:1">${act.hours}</div>
        <div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.07em;margin-top:4px;font-weight:700">Hours</div>
      </div>
      ${act.elapsed?`<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:13px;padding:14px;text-align:center">
        <div style="font-size:24px;font-weight:900;color:var(--txt);letter-spacing:-.02em;line-height:1;margin-top:3px">${fmtDur(act.elapsed)}</div>
        <div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.07em;margin-top:4px;font-weight:700">Timer</div>
      </div>`:''}
      <div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:13px;padding:14px;text-align:center">
        <div style="font-size:28px;line-height:1;margin-bottom:4px">${ico(act.feeling||'—')}</div>
        <div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.07em;font-weight:700">Feeling</div>
        ${diffStars?`<div style="font-size:12px;margin-top:3px">${diffStars}</div>`:''}
      </div>
    </div>

    ${act.material?`<div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:5px">Material</div>
      <div style="font-size:13px;font-weight:600;color:var(--ind)">${act.material}</div>
    </div>`:''}

    ${studySrcLabel(act)?`<div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:6px">Studied with</div>
      <div class="ac-tags">${_srcTagsHTML(act)}</div>
    </div>`:''}

    ${act.location?`<div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:5px">Location</div>
      <div style="font-size:13px;font-weight:600;color:var(--sub)">${ico('pin')} ${esc(act.location)}</div>
    </div>`:''}

    ${act.caption?`<div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:5px">Notes</div>
      <div style="font-size:13px;color:var(--sub);line-height:1.65;background:var(--surf2);border-radius:10px;padding:10px 12px">${act.caption}</div>
    </div>`:''}

    ${(act.concepts||[]).length?`<div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:6px">Concepts Covered (${act.concepts.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${act.concepts.map(c=>`<span style="font-size:11px;background:rgba(212,64,0,.1);border:1px solid rgba(212,64,0,.2);color:var(--ora);padding:3px 10px;border-radius:20px;font-weight:600">${c}</span>`).join('')}
      </div>
    </div>`:''}

    ${act.photo?`<div style="margin-bottom:14px;border-radius:12px;overflow:hidden;max-height:260px"><img src="${act.photo}" alt="Study session photo" style="width:100%;max-height:260px;object-fit:cover;display:block" loading="lazy"></div>`:''}

    <div style="padding-top:12px;border-top:1px solid var(--bdr);display:flex;gap:8px">
      <button onclick="openEditActivityModal('${act.id}')" style="flex:1;padding:11px;background:var(--ora);border:none;border-radius:10px;color:#fff;cursor:pointer;font-size:12px;font-weight:700;transition:opacity .12s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">Edit Session</button>
      <button onclick="deleteActivity('${act.id}')" style="flex:1;padding:11px;background:transparent;border:1px solid var(--bdr);border-radius:10px;color:var(--mut);cursor:pointer;font-size:12px;font-weight:600;transition:background-color .12s,border-color .12s,color .12s,box-shadow .12s,transform .12s,opacity .12s" onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)';this.style.background='var(--red-bg)'" onmouseout="this.style.borderColor='var(--bdr)';this.style.color='var(--mut)';this.style.background='transparent'">Delete</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(el);
  el.addEventListener('click',function(e){if(e.target===el)closeActivityDetail();});
}

function closeActivityDetail(){
  document.getElementById('activity-detail-modal')?.remove();
}

// ═══════════════════════════════════════════════
// EDIT SESSION
// ═══════════════════════════════════════════════
let _editConcepts=[],_editPhoto=null,_editFeeling='💪',_editDiff=3;

function openEditActivityModal(actId){
  const act=(S.activities||[]).find(a=>a.id===actId);
  if(!act)return;
  _editConcepts=[...(act.concepts||[])];
  _editPhoto=act.photo||null;
  _srcPick.edit={course:act.course||'',kind:act.kind||''};
  _editFeeling=act.feeling||'💪';
  _editDiff=act.difficulty||3;
  const ex=EXAMS[act.section]||{color:'var(--ind)',icon:'book',full:act.section};
  const sectionOpts=(S.sections||['FAR','AUD','REG','TCP']).map(s=>`<option value="${s}"${s===act.section?' selected':''}>${s} — ${EXAMS[s]?.full||s}</option>`).join('');
  const feelingOpts=['💪','😤','😅','🤔','😵','🔥'].map(f=>`<div class="feeling-opt${f===_editFeeling?' selected':''}" onclick="setEditFeeling('${f}',this)">${ico(f)}</div>`).join('');
  const diffOpts=[1,2,3,4,5].map(d=>`<div class="diff-opt${d===_editDiff?' selected':''}" onclick="setEditDiff(${d},this)">${d}</div>`).join('');
  const conceptTagsHTML=_editConcepts.map((c,i)=>`<span class="concept-tag">${c}<span class="concept-tag-x" onclick="removeEditConceptTag(${i})">×</span></span>`).join('')||'<span style="font-size:11px;color:var(--mut)">No concepts yet</span>';
  const photoHTML=_editPhoto
    ?`<div style="position:relative;display:inline-block;width:100%"><img src="${_editPhoto}" alt="Study session photo" loading="lazy" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;display:block"><button onclick="clearEditPhoto()" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;border-radius:50%;width:28px;height:28px;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">×</button></div>`
    :`<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--surf2);border:1.5px dashed var(--bdr);border-radius:10px;cursor:pointer;font-size:12px;color:var(--mut)"><input type="file" accept="image/*" style="display:none" onchange="handleEditPhoto(this)">Add photo</label>`;
  const dateVal=act.date?act.date.slice(0,10):todayStr();
  document.getElementById('activity-detail-modal')?.remove();
  const el=document.createElement('div');
  el.id='activity-detail-modal';
  el.style.cssText='position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .15s ease';
  el.innerHTML=`
<div style="background:var(--surf);border-radius:22px;width:100%;max-width:560px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.3);max-height:90vh;display:flex;flex-direction:column">
  <div style="height:5px;background:${ex.color};flex-shrink:0"></div>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 12px;flex-shrink:0;border-bottom:1px solid var(--bdr)">
    <div style="font-size:16px;font-weight:900;color:var(--txt)">Edit Session</div>
    <button onclick="closeActivityDetail()" style="width:30px;height:30px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer;font-size:18px;color:var(--sub);display:flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0">×</button>
  </div>
  <div style="overflow-y:auto;padding:20px">
    <div class="form-row">
      <div class="form-grp">
        <label>Exam Section</label>
        <select id="edit-section">${sectionOpts}</select>
      </div>
      <div class="form-grp">
        <label>Date</label>
        <input id="edit-date" type="date" value="${dateVal}">
      </div>
    </div>
    <div class="form-grp">
      <label>Hours Studied</label>
      <input id="edit-hours" type="number" min="0.1" max="16" step="0.5" value="${act.hours||''}">
    </div>
    <div class="form-grp">
      <label>Material Covered <span style="color:var(--mut);font-weight:400">(optional)</span></label>
      <input id="edit-material" type="text" maxlength="120" value="${(act.material||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}" placeholder="e.g. Governmental Accounting — Fund Structure">
    </div>
    ${studySrcPickerHTML('edit','form-grp')}
    <div class="form-grp">
      <label>Session Notes <span style="color:var(--mut);font-weight:400">(optional)</span></label>
      <textarea id="edit-caption" maxlength="500" placeholder="How did it go? What clicked? What's still tricky?">${act.caption||''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-grp">
        <label>How'd it feel?</label>
        <div class="feeling-row" id="edit-feeling-row">${feelingOpts}</div>
      </div>
      <div class="form-grp">
        <label>Difficulty (1–5)</label>
        <div class="diff-row" id="edit-diff-row">${diffOpts}</div>
      </div>
    </div>
    <div class="form-grp">
      <label>Concepts Covered</label>
      <div class="concept-inp-wrap">
        <input class="concept-inp" id="edit-concept-inp" placeholder="Type a concept, press Enter…" onkeydown="if(event.key==='Enter'){event.preventDefault();addEditConceptTag();}">
        <button class="concept-add-btn" onclick="addEditConceptTag()">Add</button>
      </div>
      <div class="concept-tags-wrap" id="edit-concept-tags-wrap">${conceptTagsHTML}</div>
    </div>
    <div class="form-grp">
      <label>Photo <span style="font-size:10px;color:var(--mut);font-weight:400">optional</span></label>
      <div id="edit-photo-area">${photoHTML}</div>
    </div>
    <div style="display:flex;align-items:center;gap:9px;padding:10px 12px;background:var(--surf2);border-radius:9px;margin-bottom:16px;cursor:pointer" onclick="document.getElementById('edit-private').checked=!document.getElementById('edit-private').checked">
      <input type="checkbox" id="edit-private" ${act.private?'checked':''} style="width:15px;height:15px;accent-color:var(--ind);cursor:pointer" onclick="event.stopPropagation()">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--txt)">Keep private</div>
        <div style="font-size:11px;color:var(--mut)">Session shows as "logged a session" to others — details are just for you</div>
      </div>
    </div>
    <button onclick="saveEditedActivity('${act.id}')" style="width:100%;padding:13px;background:var(--ora);color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px">Save Changes</button>
    <button onclick="closeActivityDetail();openActivityPage('${act.id}')" style="width:100%;padding:10px;background:transparent;border:1px solid var(--bdr);border-radius:10px;color:var(--mut);cursor:pointer;font-size:12px">Cancel</button>
  </div>
</div>`;
  document.body.appendChild(el);
  el.addEventListener('click',function(e){if(e.target===el)closeActivityDetail();});
}
function setEditFeeling(f,el){
  _editFeeling=f;
  document.querySelectorAll('#edit-feeling-row .feeling-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
}
function setEditDiff(d,el){
  _editDiff=d;
  document.querySelectorAll('#edit-diff-row .diff-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
}
function addEditConceptTag(){
  const inp=document.getElementById('edit-concept-inp');
  const val=(inp?.value||'').trim().slice(0,60);
  if(!val||_editConcepts.includes(val)){if(inp)inp.value='';return;}
  _editConcepts.push(val);
  if(inp)inp.value='';
  _renderEditConceptTags();
}
function removeEditConceptTag(idx){
  _editConcepts.splice(idx,1);
  _renderEditConceptTags();
}
function _renderEditConceptTags(){
  const wrap=document.getElementById('edit-concept-tags-wrap');
  if(!wrap)return;
  wrap.innerHTML=_editConcepts.map((c,i)=>`<span class="concept-tag">${c}<span class="concept-tag-x" onclick="removeEditConceptTag(${i})">×</span></span>`).join('')||'<span style="font-size:11px;color:var(--mut)">No concepts yet</span>';
}
function clearEditPhoto(){
  _editPhoto=null;
  const area=document.getElementById('edit-photo-area');
  if(area)area.innerHTML=`<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--surf2);border:1.5px dashed var(--bdr);border-radius:10px;cursor:pointer;font-size:12px;color:var(--mut)"><input type="file" accept="image/*" style="display:none" onchange="handleEditPhoto(this)">Add photo</label>`;
}
function handleEditPhoto(input){
  const file=input?.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(e){
    const img=new Image();
    img.onload=function(){
      const canvas=document.createElement('canvas');
      const MAX=800;let w=img.width,h=img.height;
      if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
      if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      _editPhoto=canvas.toDataURL('image/jpeg',0.75);
      const area=document.getElementById('edit-photo-area');
      if(area)area.innerHTML=`<div style="position:relative;display:inline-block;width:100%"><img src="${_editPhoto}" alt="Study session photo" loading="lazy" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;display:block"><button onclick="clearEditPhoto()" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;border-radius:50%;width:28px;height:28px;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">×</button></div>`;
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function saveEditedActivity(actId){
  const idx=(S.activities||[]).findIndex(a=>a.id===actId);
  if(idx===-1){showToast('Session not found','err');return;}
  const section=document.getElementById('edit-section')?.value;
  const hours=parseFloat(document.getElementById('edit-hours')?.value)||0;
  const date=document.getElementById('edit-date')?.value||todayStr();
  const material=(document.getElementById('edit-material')?.value?.trim()||'').slice(0,120);
  const caption=(document.getElementById('edit-caption')?.value?.trim()||'').slice(0,500);
  const isPrivate=document.getElementById('edit-private')?.checked||false;
  if(!section){showToast('Select a section','err');return;}
  if(_badWords(material,caption)) return;
  if(hours<=0){showToast('Enter the number of hours you studied','err');return;}
  if(hours>16){showToast('Hours capped at 16 per session','err');return;}
  const existing=S.activities[idx];
  S.activities[idx]={
    ...existing,
    section,hours,
    date:date+'T'+(existing.date?.slice(11)||new Date().toTimeString().slice(0,8)),
    material,caption,
    course:_srcPick.edit.course||undefined,
    kind:_srcPick.edit.kind||undefined,
    difficulty:_editDiff,feeling:_editFeeling,
    concepts:[..._editConcepts],
    photo:_editPhoto,
    private:isPrivate,
  };
  saveState();checkAchievements();
  closeActivityDetail();
  showToast('Session updated ✓','ok');
  renderTab();
}

// ═══════════════════════════════════════════════
// SESSION TIMER
// ═══════════════════════════════════════════════
function openSessionModal(prefSection='', prefMaterial=''){
  const overlay=document.getElementById('sess-overlay');
  if(!overlay)return;
  if(!S){showToast('Complete setup first','err');return;}
  // In a study room the room is the timer screen.
  if(typeof _room!=='undefined'&&_room&&(TS.phase==='active'||TS.phase==='paused')){openRoomView();return;}
  if(TS.phase==='active'||TS.phase==='paused'||TS.phase==='recap'){overlay.classList.add('open');renderSessCard();return;}
  if(prefSection)TS.section=prefSection;
  else if(!TS.section&&S.sections?.length)TS.section=S.sections[0];
  if(prefMaterial)TS.material=prefMaterial;
  if(!TS.course)TS.course=S.lastCourse||'';
  TS.phase='setup';
  TS.date=todayStr();
  overlay.classList.add('open');
  renderSessCard();
}

function closeSessOverlay(){
  if(TS.phase==='active'){pauseTimer();}
  document.getElementById('sess-overlay')?.classList.remove('open');
}

function renderSessCard(){
  const box=document.getElementById('sess-box');
  if(!box)return;
  box.classList.toggle('sess-box-wide', TS.phase==='recap');
  const _live=TS.phase==='active'||TS.phase==='paused';
  box.classList.toggle('sess-box-solo', _live);
  document.getElementById('sess-overlay')?.classList.toggle('sess-live', _live);
  const ex=TS.section&&EXAMS[TS.section]?EXAMS[TS.section]:null;
  const col=ex?.color||'var(--ora)';

  if(TS.phase==='setup'){
    const sectionOpts=(S.sections||['FAR','AUD','REG','TCP']).map(s=>`<option value="${s}"${s===TS.section?' selected':''}>${s} — ${EXAMS[s]?.full||s}</option>`).join('');
    box.innerHTML=`
    <div class="sess-hdr">
      <div class="sess-status sess-st-setup" style="background:${col}18;color:${col}">New Session</div>
      <button class="sess-close-btn" onclick="closeSessOverlay()">×</button>
    </div>
    <div class="sess-body">
      <div style="font-size:22px;font-weight:900;margin-bottom:6px;letter-spacing:-.02em">Start a Study Session</div>
      <div style="font-size:13px;color:var(--sub);margin-bottom:26px;line-height:1.5">Choose your focus area and start your timer</div>
      <div class="sess-fgrp">
        <label>Exam Section</label>
        <select id="ss-sec" onchange="ssUpdateSection()">${sectionOpts}</select>
      </div>
      <div class="sess-fgrp">
        <label>Material / Topic</label>
        <input id="ss-mat" type="text" placeholder="e.g. Governmental Accounting — Fund Types" value="${esc(TS.material||'')}">
      </div>
      ${studySrcPickerHTML('ts')}
      <div class="sess-2col">
        <div class="sess-fgrp">
          <label>Goal (hours, optional)</label>
          <input id="ss-goal" type="number" min="0.5" max="8" step="0.5" placeholder="e.g. 2" value="${TS.goalHours||''}">
        </div>
        <div class="sess-fgrp">
          <label>Session Date</label>
          <input id="ss-date" type="date" max="${todayStr()}" value="${TS.date||todayStr()}">
        </div>
      </div>
      <button class="sess-start-btn" id="ss-start-btn" onclick="startTimer()">Start Session</button>
      <div id="ss-manual" style="display:none;margin-top:4px">
        <div class="sess-fgrp">
          <label>How long did you study?</label>
          <div class="sess-2col" style="margin-bottom:0">
            <input id="ss-man-h" type="number" inputmode="numeric" min="0" max="16" step="1" placeholder="Hours" aria-label="Hours studied">
            <input id="ss-man-m" type="number" inputmode="numeric" min="0" max="59" step="5" placeholder="Minutes" aria-label="Minutes studied">
          </div>
        </div>
        <button class="sess-start-btn" onclick="logPastSession()">Continue</button>
      </div>
      <button id="ss-manual-toggle" onclick="toggleManualLog()" style="width:100%;margin-top:8px;padding:10px;background:transparent;border:none;color:var(--ind);cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Already studied? Log a past session</button>
      <button onclick="closeSessOverlay()" style="width:100%;margin-top:8px;padding:10px;background:transparent;border:1px solid var(--bdr);border-radius:10px;color:var(--sub);cursor:pointer;font-size:13px;font-weight:600">Cancel</button>
    </div>`;
  }
  else if((TS.phase==='active'||TS.phase==='paused')&&typeof _room!=='undefined'&&_room){
    box.innerHTML=''; // in a room, the room screen is the timer
  }
  else if(TS.phase==='paused'&&TS.longCheck){
    // Ledger came back to a timer that ran for hours. Probably left on, so
    // ask before crediting it rather than logging 9 hours nobody studied.
    const h=Math.floor(TS.elapsed/3600), m=Math.round((TS.elapsed%3600)/60);
    box.innerHTML=`<div class="room-box solo-box" role="dialog" aria-label="Timer check">
    <div class="room-hdr">
      <div style="min-width:0;flex:1">
        <div class="room-name">Welcome back</div>
        <div class="room-sub">${esc(TS.section||'')}${ex?' · '+esc(ex.full):''}${TS.material?' · '+esc(TS.material):''}</div>
      </div>
    </div>
    <div class="room-clock-wrap">
      <div class="room-phase"><span class="rec-dot" style="animation:none;opacity:.4"></span> Timer held</div>
      <div class="room-clock" id="sess-clock">${fmtElapsed(TS.elapsed)}</div>
      <div class="room-phase-sub">Your timer kept running while Ledger was closed${TS.elapsed>=TS_MAX_SECS?' and stopped at the 16-hour limit':''}. Were you studying the whole time?</div>
    </div>
    <div class="ts-check">
      <button class="room-btn room-btn-main" onclick="tsLongEnd()">Yes, log ${fmtDur(TS.elapsed).replace(/ 0s$/,'')}</button>
      <div class="ts-check-set">
        <div class="solo-lbl">No, I actually studied</div>
        <div class="ts-check-row">
          <input id="ts-fix-h" type="number" inputmode="numeric" min="0" max="16" step="1" value="${Math.min(h,2)}" aria-label="Hours"><span>h</span>
          <input id="ts-fix-m" type="number" inputmode="numeric" min="0" max="59" step="5" value="${h>=2?0:m}" aria-label="Minutes"><span>m</span>
          <button class="room-btn" onclick="tsLongSet()">Log this</button>
        </div>
      </div>
      <div class="ts-check-links">
        <button onclick="tsLongKeep()">Keep the timer running</button>
        <button onclick="discardSession()">Discard session</button>
      </div>
    </div>
  </div>`;
  }
  else if(TS.phase==='active'||TS.phase==='paused'){
    // Same look as a study room: full-screen night sky, one big clock.
    const paused=TS.phase==='paused';
    const goalSecs=(TS.goalHours||0)*3600;
    const goalPct=goalSecs>0?Math.min(100,Math.round(TS.elapsed/goalSecs*100)):0;
    box.innerHTML=`<div class="room-box solo-box" role="dialog" aria-label="Study session">
    <div class="room-hdr">
      <div style="min-width:0;flex:1">
        <div class="room-name">Solo session</div>
        <div class="room-sub">${esc(TS.section||'')}${ex?' · '+esc(ex.full):''}</div>
      </div>
      <button class="room-hbtn" onclick="closeSessOverlay()" title="${paused?'Close':'Pause and minimize'}" aria-label="${paused?'Close':'Pause and minimize'}">${paused?'×':'—'}</button>
    </div>
    <div class="room-clock-wrap">
      <div class="room-phase ${paused?'':'focus'}"><span class="rec-dot" ${paused?'style="animation:none;opacity:.4"':''}></span> ${paused?'Paused':'Focus'}</div>
      <div class="room-clock" id="sess-clock">${fmtElapsed(TS.elapsed)}</div>
      ${goalSecs>0?`<div class="room-bar"><div class="room-bar-fill" id="sess-goal-fill" style="width:${goalPct}%"></div></div>
      <div class="room-phase-sub" id="sess-goal-lbl">${goalPct}% of your ${fmtDur(goalSecs)} goal</div>`
      :`<div class="room-phase-sub">${paused?'Your timer is stopped. Resume when you\'re ready.':'Heads down. Ledger and a calculator are in the corner if you need them.'}</div>`}
    </div>
    <div class="room-me">
      <div style="flex:1;min-width:0">
        <div class="solo-lbl">Currently studying</div>
        <div class="solo-topic">${esc(TS.material||'General study')}</div>
      </div>
      ${paused
        ?`<button class="room-btn sess-ctrl-resume" onclick="resumeTimer()">Resume</button>`
        :`<button class="room-btn sess-ctrl-pause" onclick="pauseTimer()">Pause</button>`}
    </div>
    <div class="room-foot">
      <button class="room-btn room-btn-main sess-ctrl-end" onclick="endSession()">End &amp; log session</button>
    </div>
  </div>`;
  }
  else if(TS.phase==='recap'){
    const ex2=EXAMS[TS.section];
    const col2=ex2?.color||'var(--ora)';
    const conceptTagsHTML=TS.concepts.map((c,i)=>
      `<span class="concept-tag">${c}<span class="concept-tag-x" onclick="removeConceptTag(${i})">×</span></span>`
    ).join('');
    const feelings=['💪','😤','😅','🤔','😵','🔥'];
    const feelHTML=feelings.map(f=>`<button class="feeling-r-btn${TS.feeling===f?' sel':''}" onclick="setSessFeeling('${f}')">${ico(f)}</button>`).join('');
    const diffHTML=[1,2,3,4,5].map(d=>`<button class="diff-r-btn${TS.difficulty===d?' sel':''}" onclick="setSessDiff(${d})">${d}</button>`).join('');
    const sectionOpts=(S.sections||[]).map(s=>`<option value="${s}"${s===TS.section?' selected':''}>${s}</option>`).join('');
    box.innerHTML=`
    <div class="sess-color-bar" style="background:linear-gradient(90deg,#10b981,#059669)"></div>
    <div class="sess-hdr" style="padding:14px 18px 0">
      <div class="sess-status sess-st-done">✓ Session Complete</div>
      <button class="sess-close-btn" onclick="discardSession()">×</button>
    </div>
    <div class="sess-body">
      <div class="sess-recap-grid">

        <!-- LEFT: hero + stats + vibe -->
        <div class="sess-recap-left">
          <div style="text-align:center;padding:12px 0 20px">
            <div style="font-size:20px;font-weight:900;letter-spacing:-.03em;color:var(--txt);margin-bottom:4px">Session logged.</div>
            <div style="font-size:12px;color:var(--sub);line-height:1.5">${ex2?.full||TS.section}<br>${new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</div>
          </div>

          <div class="sess-rstats" style="grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px">
            <div class="sess-rstat"><div class="sess-rstat-val" style="color:${col2};font-size:22px">${fmtDur(TS.elapsed)}</div><div class="sess-rstat-lbl">Duration</div></div>
            <div class="sess-rstat"><div class="sess-rstat-val" style="font-size:22px">${(TS.elapsed/3600).toFixed(2)}h</div><div class="sess-rstat-lbl">Hours</div></div>
          </div>

          <div class="sess-fgrp" style="margin-bottom:16px">
            <label>How'd it feel?</label>
            <div class="feeling-row-r" id="feeling-row-r">${feelHTML}</div>
          </div>
          <div class="sess-fgrp" style="margin-bottom:0">
            <label>Difficulty (1–5)</label>
            <div class="diff-r-row" id="diff-r-row">${diffHTML}</div>
          </div>
        </div>

        <!-- RIGHT: concepts + notes + fields + save -->
        <div class="sess-recap-right">
          <div class="sess-fgrp">
            <label>Concepts Covered</label>
            <div class="concept-inp-wrap">
              <input class="concept-inp" id="concept-inp" placeholder="Type a concept, press Enter…" onkeydown="if(event.key==='Enter'){event.preventDefault();addConceptTag();}">
              <button class="concept-add-btn" onclick="addConceptTag()">Add</button>
            </div>
            <div class="concept-tags-wrap" id="concept-tags-wrap">${conceptTagsHTML||'<span style="font-size:11px;color:var(--mut)">Nothing tagged yet</span>'}</div>
          </div>
          <div class="sess-fgrp">
            <label>Session Notes</label>
            <textarea class="sess-notes-ta" id="sess-notes-ta" oninput="TS.notes=this.value;tsPersist()" placeholder="What clicked? What's still fuzzy? Anything to revisit next time?" style="min-height:90px">${esc(TS.notes||'')}</textarea>
          </div>
          <div class="sess-fgrp">
            <label>Photo <span style="font-size:10px;color:var(--mut);font-weight:400">optional</span></label>
            <div id="sess-photo-area">
              ${TS.sessionPhoto
                ? '<div style="position:relative;display:inline-block;width:100%"><img src="'+TS.sessionPhoto+'" alt="Study session photo" loading="lazy" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;display:block"><button onclick="clearSessionPhoto()" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;border-radius:50%;width:28px;height:28px;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">×</button></div>'
                : _sessPhotoPickerHTML()
              }
            </div>
          </div>
          <div class="sess-fgrp">
            <label>Location <span style="font-size:10px;color:var(--mut);font-weight:400">optional</span></label>
            <div class="sess-loc-row" id="sess-loc-row">
              ${['Home','Library','Café','Office','Campus'].map(l=>`<button class="sess-loc-btn${TS.location===l?' sel':''}" onclick="setSessLocation('${l}')">${l}</button>`).join('')}
              <input class="sess-loc-other" id="sess-loc-other" placeholder="Other…" maxlength="40"
                value="${['Home','Library','Café','Office','Campus'].includes(TS.location)?'':esc(TS.location||'')}"
                oninput="setSessLocation(this.value,true)" onclick="event.stopPropagation()">
            </div>
          </div>
          ${studySrcPickerHTML('ts')}
          <div class="sess-2col" style="margin-bottom:16px">
            <div class="sess-fgrp" style="margin-bottom:0">
              <label>Section</label>
              <select id="recap-sec" onchange="TS.section=this.value;tsPersist()" style="width:100%;padding:9px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:9px;color:var(--txt);font-size:13px;outline:none">${sectionOpts}</select>
            </div>
            <div class="sess-fgrp" style="margin-bottom:0">
              <label>Date</label>
              <input id="recap-date" type="date" max="${todayStr()}" onchange="TS.date=this.value;tsPersist()" value="${TS.date||todayStr()}" style="width:100%;padding:9px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:9px;color:var(--txt);font-size:13px;outline:none">
            </div>
          </div>
          <button class="sess-save-btn" onclick="saveSession()">✓ Log Session</button>
          <button onclick="discardSession()" style="width:100%;margin-top:8px;padding:10px;background:transparent;border:1px solid var(--bdr);border-radius:10px;color:var(--mut);cursor:pointer;font-size:12px;transition:border-color .12s" onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'" onmouseout="this.style.borderColor='var(--bdr)';this.style.color='var(--mut)'">Discard Session</button>
        </div>

      </div>
    </div>`;
    setTimeout(()=>document.getElementById('concept-inp')?.focus(),80);
  }
}

function ssUpdateSection(){
  const sec=document.getElementById('ss-sec')?.value;
  if(sec){
    TS.section=sec;
    const ex=EXAMS[sec];
    if(ex){
      const bar=document.querySelector('.sess-color-bar');
      if(bar)bar.style.background=`linear-gradient(90deg,${ex.color},${ex.color}88)`;
    }
  }
}

// ── LIVE STUDY PRESENCE ──────────────────────────────────────────────────
// While actively studying, broadcast presence to every club I'm in so members
// see "studying now" in real time. Heartbeat keeps it fresh; cleared on stop.
let _presenceHeartbeat=null;
function _writeClubPresence(){
  if(!firebaseDb||!AUTH||!AUTH.uid) return;
  const myClubs=(S.clubs||[]).filter(c=>!c.isDM&&Array.isArray(c.members)&&c.members.includes('you'));
  if(!myClubs.length) return;
  const name=S.name||AUTH.displayName||'Member';
  const data={
    uid:AUTH.uid, name,
    initials:(name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase())||'M',
    color:(S&&S.profileColor)||'#5a5fcf',
    section:TS.section||'', startedAt:TS.startTime||Date.now(), lastBeat:Date.now()
  };
  myClubs.forEach(c=>firebaseDb.collection('clubs').doc(c.id).collection('presence').doc(AUTH.uid).set(data,{merge:true}).catch(()=>{}));
}
function _clearClubPresence(){
  if(!firebaseDb||!AUTH||!AUTH.uid) return;
  const myClubs=(S.clubs||[]).filter(c=>!c.isDM&&Array.isArray(c.members)&&c.members.includes('you'));
  myClubs.forEach(c=>firebaseDb.collection('clubs').doc(c.id).collection('presence').doc(AUTH.uid).delete().catch(()=>{}));
}
function _startPresence(){ _writeClubPresence(); clearInterval(_presenceHeartbeat); _presenceHeartbeat=setInterval(_writeClubPresence,45000); }
function _stopPresence(){ clearInterval(_presenceHeartbeat); _presenceHeartbeat=null; _clearClubPresence(); }
window.addEventListener('beforeunload',()=>{ try{ if(_presenceHeartbeat) _clearClubPresence(); }catch(e){} });

// Called from the setup form (reads its fields) or directly with {section,material}
// when a session starts without the form, e.g. on joining a study room.
// Once a second while the timer runs: clock, top-bar chip and goal bar.
function _sessTickUI(){
  const cl=document.getElementById('sess-clock');
  if(cl)cl.textContent=fmtElapsed(TS.elapsed);
  const chip=document.getElementById('topbar-timer');
  if(chip)chip.textContent=fmtElapsed(TS.elapsed);
  const goalSecs=(TS.goalHours||0)*3600;
  const fill=document.getElementById('sess-goal-fill');
  if(fill&&goalSecs>0){
    const pct=Math.min(100,Math.round(TS.elapsed/goalSecs*100));
    fill.style.width=pct+'%';
    const lbl=document.getElementById('sess-goal-lbl'); if(lbl) lbl.textContent=pct+'% of your '+fmtDur(goalSecs)+' goal';
  }
}
function startTimer(opts){
  const direct=!!(opts&&opts.section);
  const sec=direct?opts.section:(document.getElementById('ss-sec')?.value||TS.section);
  const mat=direct?(opts.material||''):(document.getElementById('ss-mat')?.value?.trim()||'');
  const goal=direct?0:(parseFloat(document.getElementById('ss-goal')?.value)||0);
  const date=direct?todayStr():(document.getElementById('ss-date')?.value||todayStr());
  if(!sec){showToast('Select a section','err');return;}
  if(_badWords(mat)) return;
  TS.section=sec;TS.material=mat;TS.goalHours=goal;TS.date=date;
  if(!TS.course)TS.course=S.lastCourse||'';
  TS.elapsed=0;TS.startTime=Date.now();TS.phase='active';
  tsStartTicking();
  tsPersist();
  logLedgerEvent('timer_started',{section:sec,course:TS.course||'none',kind:TS.kind||'none',has_goal:goal>0,quick:direct});
  _startPresence(); // broadcast "studying now" to my clubs
  renderSessCard();
  updateNavChip();
}

// Log a session that already happened (forgot the timer, studied on paper,
// studied away from the phone). Skips the live timer and goes straight to the
// same recap screen a timed session ends on.
function toggleManualLog(){
  const box=document.getElementById('ss-manual'), start=document.getElementById('ss-start-btn'), tog=document.getElementById('ss-manual-toggle');
  if(!box)return;
  const open=box.style.display==='none';
  box.style.display=open?'block':'none';
  if(start)start.style.display=open?'none':'';
  if(tog)tog.textContent=open?'Use the live timer instead':'Already studied? Log a past session';
  if(open)document.getElementById('ss-man-h')?.focus();
}
function logPastSession(){
  const sec=document.getElementById('ss-sec')?.value||TS.section;
  const mat=document.getElementById('ss-mat')?.value?.trim()||'';
  const date=document.getElementById('ss-date')?.value||todayStr();
  const h=parseFloat(document.getElementById('ss-man-h')?.value)||0;
  const m=parseFloat(document.getElementById('ss-man-m')?.value)||0;
  const secs=Math.round(h*3600+m*60);
  if(!sec){showToast('Select a section','err');return;}
  if(h<0||m<0||secs<60){showToast('Enter how long you studied','err');return;}
  if(secs>16*3600){showToast('A single session can be at most 16 hours','err');return;}
  if(date>todayStr()){showToast('The session date can\'t be in the future','err');return;}
  clearInterval(timerInterval);timerInterval=null;
  TS.section=sec;TS.material=mat;TS.goalHours=0;TS.date=date;
  TS.startTime=null;TS.elapsed=secs;TS.manual=true;TS.phase='recap';
  if(!TS.location){try{TS.location=localStorage.getItem('pf2-last-loc')||'';}catch(e){}}
  tsPersist();
  renderSessCard();updateNavChip();
}

function pauseTimer(){
  if(TS.phase!=='active')return;
  clearInterval(timerInterval);timerInterval=null;
  TS.elapsed=Math.min(TS_MAX_SECS,Math.floor((Date.now()-TS.startTime)/1000));
  TS.phase='paused';
  tsPersist();
  _stopPresence();
  renderSessCard();updateNavChip();
  if(typeof _room!=='undefined'&&_room) _roomBeat();
}

function resumeTimer(){
  if(TS.phase!=='paused')return;
  TS.startTime=Date.now()-(TS.elapsed*1000);
  TS.phase='active';TS.longCheck=false;
  tsStartTicking();
  tsPersist();
  _startPresence();
  renderSessCard();updateNavChip();
  if(typeof _room!=='undefined'&&_room) _roomBeat();
}

function endSession(){
  if(typeof _room!=='undefined'&&_room) leaveRoom(true);
  clearInterval(timerInterval);timerInterval=null;
  if(TS.phase==='active')TS.elapsed=Math.min(TS_MAX_SECS,Math.floor((Date.now()-TS.startTime)/1000));
  TS.phase='recap';TS.longCheck=false;
  // Preselect the last place they studied
  if(!TS.location){try{TS.location=localStorage.getItem('pf2-last-loc')||'';}catch(e){}}
  tsPersist(); // keeps the recap, so closing the app mid-recap doesn't lose the session
  _stopPresence();
  renderSessCard();updateNavChip();
}

// Answers to the "were you studying the whole time?" check.
function tsLongEnd(){ TS.longCheck=false; endSession(); }
function tsLongKeep(){ TS.longCheck=false; resumeTimer(); }
function tsLongSet(){
  const h=parseFloat(document.getElementById('ts-fix-h')?.value)||0;
  const m=parseFloat(document.getElementById('ts-fix-m')?.value)||0;
  const secs=Math.round(h*3600+m*60);
  if(h<0||m<0||secs<60){showToast('Enter how long you studied','err');return;}
  if(secs>TS.elapsed){showToast('That is longer than the timer ran. Use "Yes, log" instead.','err');return;}
  TS.elapsed=secs; TS.longCheck=false;
  endSession();
}
// Bring back a session saved before the app closed (called once per page load).
function tsResumeAfterLoad(){
  const got=tsRestore();
  if(!got) return;
  const sec=TS.section?TS.section+' ':'';
  if(got==='running'){
    tsStartTicking(); _sessTickUI();
    setTimeout(()=>{ try{ _startPresence(); }catch(e){} },2500);
    showToast('Your '+sec+'session kept running while you were away · '+fmtElapsed(TS.elapsed),'info');
  } else if(got==='paused'){
    showToast('Your paused '+sec+'session is still here. Resume or log it.','info');
  } else {
    // 'long' asks a question and 'recap' is a half-finished log: show them.
    if(got==='recap') showToast('Finish logging your '+sec+'session.','info');
    document.getElementById('sess-overlay')?.classList.add('open');
    renderSessCard();
  }
  updateNavChip();
}

function updateNavChip(){
  const chip=document.getElementById('nav-sess-chip');
  const btn=document.getElementById('nav-log-btn');
  if(!chip)return;
  const isActive=TS.phase==='active'||TS.phase==='paused';
  if(TS.phase==='recap'){
    // A finished session that hasn't been logged yet (recap closed with Esc, or brought back after a reload).
    chip.style.display='inline-flex';
    chip.innerHTML=`<span class="active-sess-chip" onclick="openSessionModal()">${esc(TS.section||'')} <span class="active-sess-time">Finish log</span></span>`;
    if(btn){btn.textContent='Finish log';btn.onclick=()=>openSessionModal();}
  } else if(isActive){
    chip.style.display='inline-flex';
    chip.innerHTML=`<span class="active-sess-chip" onclick="openSessionModal()"><span class="rec-dot" ${TS.phase==='paused'?'style="animation:none;opacity:.4"':''}></span>${TS.section} <span class="active-sess-time" id="topbar-timer">${fmtElapsed(TS.elapsed)}</span></span>`;
    if(btn){btn.textContent='Resume';btn.onclick=()=>openSessionModal();}
  } else {
    chip.style.display='none';
    if(btn){btn.textContent='Start Session';btn.onclick=()=>openSessionModal();}
  }
  if(typeof updateAskBubbleSession==='function')updateAskBubbleSession();
  if(window.LedgerCalc) LedgerCalc.setSession(isActive&&!document.body.classList.contains('no-app-nav'));
}

function addConceptTag(){
  const inp=document.getElementById('concept-inp');
  if(!inp)return;
  const val=inp.value.trim();
  if(!val||TS.concepts.includes(val))return;
  TS.concepts.push(val);tsPersist();
  inp.value='';
  const wrap=document.getElementById('concept-tags-wrap');
  if(wrap)wrap.innerHTML=TS.concepts.map((c,i)=>`<span class="concept-tag">${c}<span class="concept-tag-x" onclick="removeConceptTag(${i})">×</span></span>`).join('')||'<span style="font-size:11px;color:var(--mut)">No concepts yet</span>';
  inp.focus();
}

function removeConceptTag(idx){
  TS.concepts.splice(idx,1);tsPersist();
  const wrap=document.getElementById('concept-tags-wrap');
  if(wrap)wrap.innerHTML=TS.concepts.map((c,i)=>`<span class="concept-tag">${c}<span class="concept-tag-x" onclick="removeConceptTag(${i})">×</span></span>`).join('')||'<span style="font-size:11px;color:var(--mut)">No concepts yet</span>';
}

function setSessFeeling(f){
  TS.feeling=f;tsPersist();
  document.querySelectorAll('.feeling-r-btn').forEach(b=>b.classList.toggle('sel',b.textContent===f));
}

function setSessLocation(loc, isCustom){
  loc=(loc||'').trim();
  // Tapping the already-selected pill clears it
  if(!isCustom&&TS.location===loc) loc='';
  TS.location=loc;tsPersist();
  document.querySelectorAll('.sess-loc-btn').forEach(b=>b.classList.toggle('sel',b.textContent===loc));
  if(!isCustom){
    const other=document.getElementById('sess-loc-other');
    if(other) other.value='';
  }
}

function setSessDiff(d){
  TS.difficulty=d;tsPersist();
  document.querySelectorAll('.diff-r-btn').forEach((b,i)=>b.classList.toggle('sel',i+1===d));
}

function saveSession(){
  const saveBtn=document.querySelector('.sess-save-btn');
  if(saveBtn?.disabled)return;
  const notes=(document.getElementById('sess-notes-ta')?.value?.trim()||'').slice(0,500);
  const section=document.getElementById('recap-sec')?.value||TS.section;
  const date=document.getElementById('recap-date')?.value||TS.date||todayStr();
  const hours=parseFloat((TS.elapsed/3600).toFixed(2));
  if(!section){showToast('No section selected','err');return;}
  if(_badWords(notes,TS.material)) return;
  if(TS.elapsed<30){showToast('Sessions must be at least 30 seconds to save','err');return;}
  if(date>todayStr()){showToast('The session date can\'t be in the future','err');return;}
  if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Saving…';}
  const act={
    id:'u'+Date.now(),
    date:date+'T'+new Date().toTimeString().slice(0,8),
    section,hours:Math.max(0.1,hours),
    material:TS.material,
    course:TS.course||undefined,
    kind:TS.kind||undefined,
    caption:notes,
    difficulty:TS.difficulty,
    feeling:TS.feeling,
    concepts:[...TS.concepts],
    elapsed:TS.elapsed,
    manual:TS.manual?true:undefined,
    photo:TS.sessionPhoto||null,
    location:(TS.location||'').slice(0,40)||null,
    kudos:[],comments:[]
  };
  if(TS.location){try{localStorage.setItem('pf2-last-loc',TS.location);}catch(e){}}
  rememberStudySrc(TS.course);
  const _priorScore=calcReadinessScore().score;
  S.activities.push(act);
  _logSessionEvent(act,TS.manual?'manual':'timer');
  window._notifySession=true;
  const _priorAch=new Set(S.achievements||[]);
  saveState();checkAchievements();checkChallengeAchievements();
  syncClubActivity(); // push updated study stats to my clubs' shared leaderboard
  document.getElementById('sess-overlay')?.classList.remove('open');
  tsReset();updateNavChip();
  checkShareTrigger(_priorAch);
  burstConfetti(document.getElementById('sess-overlay'));
  openSessionLoggedModal(act,_priorScore);
  checkReviewPrompt();
}

function discardSession(){
  if(typeof _room!=='undefined'&&_room) leaveRoom(true);
  clearInterval(timerInterval);timerInterval=null;
  tsReset();
  document.getElementById('sess-overlay')?.classList.remove('open');
  updateNavChip();
}

