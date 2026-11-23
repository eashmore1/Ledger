// ═══════════════════════════════════════════════
// SHAREABLE MILESTONE CARDS
// ═══════════════════════════════════════════════
const SHARE_MILESTONES={
  streak_7:   {label:'STUDY STREAK',headline:'7 Days.',sub:'Consistency beats motivation every time.',accent:'#f59e0b',num:'7'},
  streak_14:  {label:'STUDY STREAK',headline:'14 Days.',sub:'Two weeks straight. No days off.',accent:'#f59e0b',num:'14'},
  streak_30:  {label:'STUDY STREAK',headline:'30 Days.',sub:'A full month of showing up.',accent:'#ef4444',num:'30'},
  streak_60:  {label:'STUDY STREAK',headline:'60 Days.',sub:'Two months. Most candidates quit by now.',accent:'#a855f7',num:'60'},
  streak_100: {label:'STUDY STREAK',headline:'100 Days.',sub:'One in a hundred ever get here.',accent:'#d44000',num:'100'},
  hrs_50:     {label:'HOURS LOGGED',headline:'50 Hours.',sub:'The foundation is being built.',accent:'#0ea574',num:'50'},
  hrs_100:    {label:'HOURS LOGGED',headline:'100 Hours.',sub:'A third of the way to exam-ready.',accent:'#0ea574',num:'100'},
  hrs_250:    {label:'HOURS LOGGED',headline:'250 Hours.',sub:'Elite study volume. Stay the course.',accent:'#5a5fcf',num:'250'},
  section_pass:{label:'CPA EXAM',headline:'First Section Passed.',sub:'One down. The license is real.',accent:'#0ea574',num:'1/4'},
  two_sections:{label:'CPA EXAM',headline:'Two Sections Passed.',sub:'Halfway to the CPA license.',accent:'#0ea574',num:'2/4'},
  three_sections:{label:'CPA EXAM',headline:'Three Sections Passed.',sub:"One left. You're going to make it.",accent:'#d44000',num:'3/4'},
  all_pass:   {label:'CPA LICENSED',headline:'All Four Sections.',sub:'The credential is yours. You earned it.',accent:'#d44000',num:'✓'},
};

function drawShareCard(canvas, milestoneId, statLine){
  const cfg=SHARE_MILESTONES[milestoneId];
  if(!cfg)return;
  const W=canvas.width, H=canvas.height;
  const ctx=canvas.getContext('2d');
  const acc=cfg.accent;

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle='#0d0a18';
  ctx.fillRect(0,0,W,H);

  // Radial glow behind the number circle (right side)
  const gx=W*0.78, gy=H*0.5;
  const glow=ctx.createRadialGradient(gx,gy,10,gx,gy,320);
  glow.addColorStop(0,acc+'28');
  glow.addColorStop(0.5,acc+'0e');
  glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow;
  ctx.fillRect(0,0,W,H);

  // Very subtle dot grid
  ctx.fillStyle='rgba(255,255,255,.035)';
  for(let x=40;x<W;x+=48)for(let y=40;y<H;y+=48){ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill();}

  // ── Left accent stripe ───────────────────────────────────────────────────────
  const stripe=ctx.createLinearGradient(0,0,0,H);
  stripe.addColorStop(0,acc);
  stripe.addColorStop(0.6,acc+'99');
  stripe.addColorStop(1,acc+'11');
  ctx.fillStyle=stripe;
  ctx.fillRect(0,0,5,H);

  // ── Right: Big decorative ring + number ─────────────────────────────────────
  const cx=W*0.78, cy=H/2, R=130;
  // Outer ring (faint)
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);
  ctx.strokeStyle=acc+'22';ctx.lineWidth=1.5;ctx.stroke();
  // Middle ring
  ctx.beginPath();ctx.arc(cx,cy,R*0.82,0,Math.PI*2);
  ctx.strokeStyle=acc+'18';ctx.lineWidth=1;ctx.stroke();
  // Accent arc (partial — goes 3/4 around)
  ctx.beginPath();ctx.arc(cx,cy,R,-Math.PI*0.5,Math.PI*1.0);
  ctx.strokeStyle=acc;ctx.lineWidth=4;ctx.lineCap='round';ctx.stroke();
  // Number / label inside ring
  const numStr=cfg.num||'';
  const numSize=numStr.length>3?52:numStr.length===3?62:76;
  ctx.fillStyle='#ffffff';
  ctx.font=`800 ${numSize}px 'Libre Franklin',system-ui,sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(numStr,cx,cy);
  ctx.textAlign='left';ctx.textBaseline='alphabetic';

  // ── Left: Text content ───────────────────────────────────────────────────────
  const lx=60, contentY=H*0.5;

  // Label chip
  ctx.font='700 11px "Libre Franklin",system-ui,sans-serif';
  const labelW=ctx.measureText(cfg.label).width+32;
  ctx.fillStyle=acc+'22';
  const chipH=28, chipY=contentY-130;
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(lx,chipY,labelW,chipH,6);
  else {ctx.moveTo(lx+6,chipY);ctx.lineTo(lx+labelW-6,chipY);ctx.arcTo(lx+labelW,chipY,lx+labelW,chipY+chipH,6);ctx.lineTo(lx+labelW,chipY+chipH-6);ctx.arcTo(lx+labelW,chipY+chipH,lx+labelW-6,chipY+chipH,6);ctx.lineTo(lx+6,chipY+chipH);ctx.arcTo(lx,chipY+chipH,lx,chipY+chipH-6,6);ctx.lineTo(lx,chipY+6);ctx.arcTo(lx,chipY,lx+6,chipY,6);}
  ctx.fill();
  ctx.fillStyle=acc;
  ctx.font='700 11px "Libre Franklin",system-ui,sans-serif';
  ctx.letterSpacing='0.1em';
  ctx.fillText(cfg.label,lx+16,chipY+19);
  ctx.letterSpacing='0';

  // Headline — split into two lines if long
  ctx.fillStyle='#ffffff';
  const words=cfg.headline.split(' ');
  const line1=words.slice(0,Math.ceil(words.length/2)).join(' ');
  const line2=words.slice(Math.ceil(words.length/2)).join(' ');
  const headSize=cfg.headline.length>18?52:cfg.headline.length>12?60:68;
  ctx.font=`800 ${headSize}px 'Libre Franklin',system-ui,sans-serif`;
  ctx.fillText(line1,lx,contentY-50);
  if(line2){ctx.fillText(line2,lx,contentY-50+headSize*1.12);}

  // Sub-text
  ctx.fillStyle='rgba(255,255,255,.55)';
  ctx.font='400 20px "Libre Franklin",system-ui,sans-serif';
  const subY=line2?contentY-50+headSize*1.12+44:contentY-50+44;
  ctx.fillText(cfg.sub,lx,subY);

  // ── Bottom bar ──────────────────────────────────────────────────────────────
  const barY=H-64;
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(lx,barY);ctx.lineTo(W-lx,barY);ctx.stroke();

  // Name + stat
  ctx.fillStyle='rgba(255,255,255,.38)';
  ctx.font='600 14px "Libre Franklin",system-ui,sans-serif';
  ctx.fillText(statLine,lx,H-32);

  // Ledger branding right-aligned
  ctx.fillStyle=acc;
  ctx.font='700 14px "Libre Franklin",system-ui,sans-serif';
  ctx.textAlign='right';
  ctx.fillText('ledgercpa.app',W-lx,H-32);
  ctx.textAlign='left';

  // ── Top-right Ledger mark ────────────────────────────────────────────────────
  ctx.fillStyle='rgba(255,255,255,.2)';
  ctx.font='700 13px "Libre Franklin",system-ui,sans-serif';
  ctx.letterSpacing='0.12em';
  ctx.textAlign='right';
  ctx.fillText('LEDGER',W-lx,36);
  ctx.textAlign='left';
  ctx.letterSpacing='0';
}

function showShareModal(milestoneId){
  const cfg=SHARE_MILESTONES[milestoneId];
  if(!cfg)return;
  // Don't show same milestone twice — scoped to user so switching accounts works correctly
  const shownKey='share_shown_'+(AUTH?.uid||'anon')+'_'+milestoneId;
  if(localStorage.getItem(shownKey))return;
  localStorage.setItem(shownKey,'1');

  const streak=getStreak();
  const totalHrs=Math.round(getTotalHours());
  const passed=(S.sectionPassed||[]).join(', ')||'';
  let statLine=S.name||'Ledger';
  if(milestoneId.startsWith('streak'))statLine+=` · ${streak}-day streak`;
  else if(milestoneId.startsWith('hrs'))statLine+=` · ${totalHrs} total hours logged`;
  else if(passed)statLine+=` · Passed: ${passed}`;

  const overlay=document.createElement('div');
  overlay.id='share-card-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:2000;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  overlay.innerHTML=`
<div style="background:var(--surf);border-radius:20px;padding:24px;max-width:520px;width:100%;box-shadow:var(--shadow-lg)">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div>
      <div style="font-size:16px;font-weight:800">Share your milestone</div>
      <div style="font-size:12px;color:var(--mut);margin-top:2px">Download the card and post it wherever CPAs hang out</div>
    </div>
    <button onclick="document.getElementById('share-card-overlay').remove()" style="background:var(--surf2);border:none;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:16px;color:var(--mut)">×</button>
  </div>
  <canvas id="share-canvas" width="1200" height="630" style="width:100%;border-radius:14px;display:block;margin-bottom:16px;box-shadow:0 8px 40px rgba(0,0,0,.4)"></canvas>
  <div style="display:flex;gap:10px">
    <button id="share-download-btn" style="flex:1;padding:11px;background:var(--ora);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Download Card</button>
    <button onclick="navigator.clipboard.writeText('Just hit: ${cfg.headline.replace(/'/g,"\\'")} while studying for the CPA exam. Tracking every hour on Ledger — ledgercpa.app').then(()=>showToast('Caption copied!','ok'))" style="flex:1;padding:11px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;color:var(--txt)">Copy Caption</button>
  </div>
  <div style="margin-top:10px;text-align:center;font-size:11px;color:var(--mut)">Great for LinkedIn · r/CPA · Twitter</div>
</div>`;
  document.body.appendChild(overlay);

  document.fonts.ready.then(()=>{
    const canvas=document.getElementById('share-canvas');
    if(!canvas)return;
    drawShareCard(canvas,milestoneId,statLine);
    document.getElementById('share-download-btn').onclick=()=>{
      const a=document.createElement('a');
      a.download=`ledger-${milestoneId.replace('_','-')}.png`;
      a.href=canvas.toDataURL('image/png');
      a.click();
    };
  });
}

function checkShareTrigger(priorAchSet){
  const newOnes=(S.achievements||[]).filter(id=>!priorAchSet.has(id));
  const trigger=newOnes.find(id=>SHARE_MILESTONES[id]);
  if(trigger)setTimeout(()=>showShareModal(trigger),1400);
}

// ═══════════════════════════════════════════════
// REVIEW PROMPT
// ═══════════════════════════════════════════════
function _isReviewMilestone(count){
  if(count===1)return true;
  if(count>=5&&count%5===0)return true;
  return false;
}

function checkReviewPrompt(){
  if(S.reviewLeft)return; // already left a review
  const count=(S.activities||[]).length;
  if(!_isReviewMilestone(count))return;
  if((S.reviewLastPromptCount||0)>=count)return; // already prompted for this milestone
  S.reviewLastPromptCount=count;
  saveState();
  setTimeout(showReviewPrompt,5000); // wait 5s so session logged modal can breathe
}

function showReviewPrompt(){
  if(document.getElementById('review-prompt-sheet'))return;
  const count=(S.activities||[]).length;
  const el=document.createElement('div');
  el.id='review-prompt-sheet';
  el.style.cssText='position:fixed;inset:0;z-index:2100;pointer-events:none';
  el.innerHTML=`
<div id="rev-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .3s ease"></div>
<div id="rev-drawer" style="position:absolute;bottom:0;left:0;right:0;max-width:520px;margin:0 auto;background:var(--surf);border-radius:22px 22px 0 0;padding:28px 24px calc(28px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 40px rgba(0,0,0,.18);transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);text-align:center">
  <div style="width:40px;height:4px;background:var(--bdr);border-radius:2px;margin:0 auto 22px"></div>
  <div style="font-size:34px;margin-bottom:10px">${ico('starFilled')}</div>
  <div style="font-size:19px;font-weight:900;color:var(--txt);margin-bottom:6px;letter-spacing:-.03em">Enjoying Ledger?</div>
  <div style="font-size:13px;color:var(--sub);line-height:1.65;margin-bottom:24px">You've logged ${count} session${count===1?'':'s'} — that's real progress.<br>A quick review helps other CPA candidates find this.</div>
  <button onclick="openReviewUrl()" style="width:100%;padding:14px;background:var(--ora);color:#fff;border:none;border-radius:13px;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:10px;letter-spacing:-.01em">Write a Review</button>
  <button onclick="closeReviewPrompt()" style="width:100%;padding:12px;background:transparent;border:none;font-size:13px;color:var(--mut);cursor:pointer;font-weight:600">Maybe later</button>
</div>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>{
    el.style.pointerEvents='all';
    document.getElementById('rev-backdrop').style.background='rgba(0,0,0,.45)';
    document.getElementById('rev-drawer').style.transform='none';
  });
  document.getElementById('rev-backdrop').addEventListener('click',closeReviewPrompt);
}

function closeReviewPrompt(){
  const el=document.getElementById('review-prompt-sheet');
  if(!el)return;
  const drawer=document.getElementById('rev-drawer');
  const backdrop=document.getElementById('rev-backdrop');
  if(drawer)drawer.style.transform='translateY(100%)';
  if(backdrop)backdrop.style.background='rgba(0,0,0,0)';
  setTimeout(()=>el.remove(),360);
}

function openReviewUrl(){
  closeReviewPrompt();
  openInAppReviewModal();
}

function openInAppReviewModal(){
  document.getElementById('review-modal')?.remove();
  const el=document.createElement('div');
  el.id='review-modal';
  el.style.cssText='position:fixed;inset:0;z-index:2100;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .18s ease';
  el.innerHTML=`
<div style="background:var(--surf);border-radius:20px;width:100%;max-width:480px;padding:28px 28px 24px;box-shadow:0 24px 80px rgba(0,0,0,.25);position:relative">
  <button onclick="closeReviewModal()" style="position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer;font-size:18px;color:var(--sub);display:flex;align-items:center;justify-content:center;line-height:1">×</button>
  <div style="font-size:26px;margin-bottom:8px">${ico('starFilled')}</div>
  <div style="font-size:18px;font-weight:900;color:var(--txt);margin-bottom:4px;letter-spacing:-.03em">Write a Review</div>
  <div style="font-size:12px;color:var(--sub);margin-bottom:22px;line-height:1.5">Your feedback goes directly to the Ledger team. It helps us improve and helps other CPA candidates find us.</div>
  <div style="margin-bottom:16px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:8px">Your Rating</div>
    <div id="review-stars-row" style="display:flex;gap:6px">
      ${[1,2,3,4,5].map(n=>`<button data-star="${n}" onclick="setReviewStar(${n})" style="font-size:30px;background:none;border:none;cursor:pointer;opacity:.25;transition:opacity .12s,transform .1s;padding:2px;line-height:1;transform:scale(1)" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">${ico('starFilled')}</button>`).join('')}
    </div>
  </div>
  <div style="margin-bottom:14px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:6px">Your Name <span style="font-weight:400;text-transform:none">— optional</span></div>
    <input id="review-name" type="text" placeholder="e.g. Alex M." style="width:100%;padding:10px 12px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:13px;outline:none;box-sizing:border-box;transition:border-color .12s" onfocus="this.style.borderColor='var(--ind)'" onblur="this.style.borderColor='var(--bdr)'">
  </div>
  <div style="margin-bottom:20px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:6px">Your Review</div>
    <textarea id="review-text" placeholder="What has Ledger done for your CPA journey? Be as specific as you want — what sections, how many hours, what worked for you." style="width:100%;min-height:110px;padding:10px 12px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:13px;line-height:1.6;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box;transition:border-color .12s" onfocus="this.style.borderColor='var(--ind)'" onblur="this.style.borderColor='var(--bdr)'"></textarea>
  </div>
  <button id="review-submit-btn" onclick="submitReview()" style="width:100%;padding:13px;background:var(--ora);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:-.01em;transition:opacity .12s" onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">Submit Review</button>
  <div style="font-size:11px;color:var(--mut);text-align:center;margin-top:10px">Sent directly to the Ledger team — not posted publicly</div>
</div>`;
  document.body.appendChild(el);
  el.addEventListener('click',function(e){ if(e.target===el) closeReviewModal(); });
  window._reviewStars=0;
}

function closeReviewModal(){
  document.getElementById('review-modal')?.remove();
}

function setReviewStar(n){
  window._reviewStars=n;
  document.querySelectorAll('#review-stars-row [data-star]').forEach(function(btn){
    btn.style.opacity=parseInt(btn.getAttribute('data-star'))<=n?'1':'.25';
  });
}

async function submitReview(){
  const text=(document.getElementById('review-text')?.value||'').trim();
  const name=(document.getElementById('review-name')?.value||'').trim();
  const stars=window._reviewStars||0;
  const btn=document.getElementById('review-submit-btn');
  if(!text){showToast('Write something before submitting','err');return;}
  if(!stars){showToast('Tap a star to rate Ledger','err');return;}
  if(btn){btn.disabled=true;btn.textContent='Submitting…';}
  try{
    const resp=await fetch('/api/review',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({stars,text,name})
    });
    if(!resp.ok) throw new Error('failed');
    closeReviewModal();
    S.reviewLeft=true;
    saveState();
    showToast('Thank you — your review means a lot','ok');
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Submit Review';}
    showToast('Could not send — please try again','err');
  }
}

// ═══════════════════════════════════════════════
// TRIAL URGENCY MODAL
// ═══════════════════════════════════════════════
function checkTrialUrgency(){
  if(!isOnTrial())return;
  const daysLeft=getTrialDaysLeft();
  if(daysLeft>3)return;
  const shownKey='trial_urgency_shown_d'+daysLeft;
  if(localStorage.getItem(shownKey))return;
  localStorage.setItem(shownKey,'1');

  // Build usage stats from actual session data
  const weekAgo=new Date(Date.now()-7*86400000);
  const weekSessions=S.activities.filter(a=>new Date(a.date)>weekAgo);
  const weekHrs=weekSessions.reduce((a,b)=>a+(b.hours||0),0).toFixed(1);
  const leaderboardUses=parseInt(localStorage.getItem('lb_views')||'0');
  const heatmapNote=weekSessions.length>0?`${weekSessions.length} sessions logged this week`:'';

  const urgencyColor=daysLeft===1?'var(--red)':daysLeft===2?'var(--ora)':'var(--amb)';
  const urgencyMsg=daysLeft===1?'Last day of your trial.':daysLeft===2?'2 days left in your trial.':'3 days left in your trial.';

  const overlay=document.createElement('div');
  overlay.id='trial-urgency-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:2000;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  overlay.innerHTML=`
<div style="background:var(--surf);border-radius:20px;padding:28px;max-width:440px;width:100%;box-shadow:var(--shadow-lg)">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
    <div style="width:10px;height:10px;border-radius:50%;background:${urgencyColor};box-shadow:0 0 0 3px ${urgencyColor}33"></div>
    <div style="font-size:12px;font-weight:800;color:${urgencyColor};text-transform:uppercase;letter-spacing:.06em">${urgencyMsg}</div>
  </div>
  <div style="font-size:22px;font-weight:900;letter-spacing:-.02em;margin-bottom:6px">Your Pro trial is ending</div>
  <div style="font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:16px">When it ends, your account goes back to the Free plan. Your sessions, hours, streak and history all stay. Free keeps session logging, pacing, the feed and your study club.</div>
  <div style="background:var(--surf2);border-radius:12px;padding:14px 16px;margin-bottom:20px">
    <div style="font-size:11px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Pro-only features</div>
    <div style="font-size:13px;color:var(--sub);line-height:1.8">Ledger AI coach · Unlimited AI question bank · AI Study Plan · Advanced analytics · Score tracker · Streak shields</div>
    ${weekHrs>0?`<div style="font-size:12px;color:var(--mut);margin-top:8px">You logged ${weekHrs}h this week.</div>`:''}
  </div>
  <button onclick="document.getElementById('trial-urgency-overlay').remove();activatePlan('pro')" style="width:100%;padding:14px;background:linear-gradient(135deg,var(--ora),var(--ora-dk));color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 16px rgba(212,64,0,.35);margin-bottom:6px">Keep Pro — $14/month</button>
  <div style="font-size:11px;color:var(--mut);text-align:center;line-height:1.5;margin-bottom:8px">Renews automatically every month until you cancel. Cancel anytime in Settings.</div>
  <button onclick="document.getElementById('trial-urgency-overlay').remove()" style="width:100%;padding:11px;background:transparent;border:none;color:var(--sub);font-size:13px;font-weight:600;cursor:pointer">No thanks</button>
</div>`;
  document.body.appendChild(overlay);
}

// ═══════════════════════════════════════════════
// STREAK URGENCY BANNER
// ═══════════════════════════════════════════════
function hasLoggedToday(){
  if(!S||!S.activities)return false;
  const today=_ymd(new Date());
  return S.activities.some(a=>a.date.slice(0,10)===today);
}

// ═══════════════════════════════════════════════
// EXAM RESULT LOGGING
// ═══════════════════════════════════════════════
function getLastExamResult(section){
  const results=(S.examResults||[]).filter(r=>r.section===section);
  if(!results.length)return null;
  return results.sort((a,b)=>(b.loggedAt||0)-(a.loggedAt||0))[0];
}

function getSectionHoursSinceSit(section){
  const results=(S.examResults||[]).filter(r=>r.section===section);
  if(!results.length)return getSectionHours(section);
  const lastSit=results.sort((a,b)=>b.sitDate.localeCompare(a.sitDate))[0].sitDate;
  return(S.activities||[]).filter(a=>a.section===section&&a.date.slice(0,10)>=lastSit).reduce((sum,a)=>sum+(a.hours||0),0);
}

function openLogResultModal(prefSection){
  const sections=S.sections||['FAR','AUD','REG','TCP'];
  const section=prefSection||sections.find(s=>(S.examSits||{})[s])||(sections.find(s=>!(S.sectionPassed||[]).includes(s)))||sections[0];
  const _sit=(S.examSits||{})[section];
  let el=document.getElementById('log-result-modal');
  if(el)el.remove();
  el=document.createElement('div');
  el.id='log-result-modal';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2000;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  el.innerHTML=`
<div style="background:var(--surf);border-radius:20px;padding:28px;max-width:440px;width:100%;box-shadow:var(--shadow-lg)">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
    <div style="font-size:16px;font-weight:800">Log Exam Result</div>
    <button onclick="document.getElementById('log-result-modal').remove()" style="background:var(--surf2);border:none;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:16px;color:var(--mut)">×</button>
  </div>
  <div style="display:grid;gap:14px">
    <div>
      <label style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Section</label>
      <select id="lr-section" style="width:100%;padding:10px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:14px;font-weight:600;outline:none">
        ${sections.map(s=>`<option value="${s}"${s===section?' selected':''}>${s} — ${EXAMS[s]?.full||s}</option>`).join('')}
      </select>
    </div>
    <div>
      <label style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Exam Date (Sit Date)</label>
      <input type="date" id="lr-sitdate" value="${(_sit&&_sit.sitDate)||todayStr()}" max="${todayStr()}" style="width:100%;padding:10px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:14px;outline:none">
    </div>
    <div>
      <label style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Score <span style="font-weight:400;color:var(--mut)">(0–99 scaled)</span></label>
      <input type="number" id="lr-score" min="0" max="99" placeholder="e.g. 81" style="width:100%;padding:10px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:18px;font-weight:700;outline:none">
      <div style="font-size:11px;color:var(--mut);margin-top:4px">CPA scores are reported 0–99. A score of 75 or higher is a pass.</div>
    </div>
    <div>
      <label style="font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">NTS Expiry <span style="font-weight:400;color:var(--mut)">(optional)</span></label>
      <input type="date" id="lr-nts" style="width:100%;padding:10px 12px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:14px;outline:none">
      <div style="font-size:11px;color:var(--mut);margin-top:4px">Your Notice to Schedule expiry — enables the retake countdown.</div>
    </div>
  </div>
  <button onclick="logExamResult()" style="width:100%;margin-top:20px;padding:14px;background:var(--ora);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer">Log Result →</button>
</div>`;
  document.body.appendChild(el);
}

// Creates a celebratory "passed this section" card in the feed/profile.
// De-duped per section so re-logging or status toggles don't spam the feed.
function addPassActivity(section,score){
  if(!section)return;
  if(!S.activities)S.activities=[];
  if(S.activities.some(a=>a.type==='pass'&&a.section===section))return;
  S.activities.push({
    id:'p'+Date.now(),
    type:'pass',
    date:todayStr()+'T'+new Date().toTimeString().slice(0,8),
    section,
    score:(typeof score==='number'&&!isNaN(score))?score:null,
    hours:0,sectionHours:Math.round(getSectionHours(section)),
    kudos:[],comments:[]
  });
}

async function logExamResult(){
  const section=document.getElementById('lr-section')?.value;
  const sitDate=document.getElementById('lr-sitdate')?.value;
  const scoreRaw=parseInt(document.getElementById('lr-score')?.value,10);
  const ntsExpiry=document.getElementById('lr-nts')?.value||null;
  if(!section||!sitDate){showToast('Select a section and sit date','err');return;}
  if(isNaN(scoreRaw)||scoreRaw<0||scoreRaw>99){showToast('Score must be 0–99','err');return;}
  const passed=scoreRaw>=75;
  if(!S.examResults)S.examResults=[];
  const attempt=(S.examResults.filter(r=>r.section===section).length)+1;
  const newResult={section,sitDate,score:scoreRaw,passed,attempt,ntsExpiry:ntsExpiry||null,loggedAt:Date.now()};
  S.examResults.push(newResult);
  if(S.examSits&&S.examSits[section]) delete S.examSits[section]; // the wait is over
  // A failed attempt's exam date is behind us; the retake gets its own.
  if(!passed&&S.examDates&&S.examDates[section]&&S.examDates[section]<=todayStr()) delete S.examDates[section];
  logLedgerEvent('exam_result_logged', {section, score: scoreRaw, passed});
  if(passed&&!(S.sectionPassed||[]).includes(section)){
    if(!S.sectionPassed)S.sectionPassed=[];
    S.sectionPassed.push(section);
    if(!S.sectionStatus)S.sectionStatus={};
    S.sectionStatus[section]='passed';
    addPassActivity(section,scoreRaw);
    const _priorAch=new Set(S.achievements||[]);
    checkAchievements();checkShareTrigger(_priorAch);
  }
  saveState();
  if(passed)writeUserProfile();
  if(firebaseDb&&AUTH?.uid){
    try{
      await firebaseDb.collection('users').doc(AUTH.uid).update({
        examResults:privacyPref('show_scores')?(S.examResults||[]):[],
        sectionPassed:S.sectionPassed||[],
        updatedAt:Date.now()
      });
    }catch(e){}
  }
  document.getElementById('log-result-modal')?.remove();
  renderTab();
  if(passed){
    const hrs=Math.round(getSectionHours(section));
    setTimeout(()=>showPassCelebration(section,scoreRaw,hrs),400);
  } else {
    setTimeout(()=>openRetakeModal(section,scoreRaw),300);
  }
}

// ═══════════════════════════════════════════════
// PASS CELEBRATION
// ═══════════════════════════════════════════════
function showPassCelebration(section,score,hours){
  const sec=section||'CPA';
  const ex=EXAMS[sec]||{color:'var(--grn)',full:sec};
  const hrs=hours||Math.round(getSectionHours(sec));
  const scoreText=score!=null?` · Score: ${score}`:'';
  const shareText=`Just passed ${sec}${scoreText}! ${hrs} hours logged on Ledger. ledgercpa.app`;
  window._celebShareText=shareText;
  const liUrl=`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://ledgercpa.app')}&summary=${encodeURIComponent(shareText)}`;

  // Confetti burst
  if(typeof confetti==='function'){
    const col=ex.color.replace('var(--grn)','#10b981').replace('var(--ora)','#d44000').replace('var(--ind)','#6366f1').replace('var(--pur)','#a855f7');
    confetti({particleCount:100,spread:80,origin:{y:0.55},colors:[col,'#ffffff',col+'99']});
    setTimeout(()=>confetti({particleCount:50,spread:100,origin:{y:0.45},angle:60,colors:[col,'#fff']}),500);
    setTimeout(()=>confetti({particleCount:50,spread:100,origin:{y:0.45},angle:120,colors:[col,'#fff']}),500);
  } else {
    burstConfetti(document.body);
  }

  let el=document.getElementById('pass-celebration-overlay');
  if(el)el.remove();
  el=document.createElement('div');
  el.id='pass-celebration-overlay';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);z-index:2100;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .3s ease';
  // Determine which SHARE_MILESTONES key applies
  const passedCount=(S.sectionPassed||[]).length;
  const milestoneId=passedCount>=4?'all_pass':passedCount===3?'three_sections':passedCount===2?'two_sections':'section_pass';
  const statLine=(S.name||'Ledger')+` · ${hrs}h logged for ${sec}`;

  el.innerHTML=`
<div style="background:var(--surf);border-radius:24px;padding:28px 24px;max-width:480px;width:100%;box-shadow:0 40px 80px rgba(0,0,0,.35);animation:modalIn .4s cubic-bezier(.22,.61,.36,1);max-height:90vh;overflow-y:auto">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:20px">
    <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:${ex.color}18;border:2px solid ${ex.color}44;margin-bottom:14px;animation:badgeBurst .6s cubic-bezier(.22,.61,.36,1)">
      <span style="font-size:24px;font-weight:900;color:${ex.color}">${sec}</span>
    </div>
    <div style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${ex.color};margin-bottom:6px">Section Complete</div>
    <div style="font-size:26px;font-weight:900;letter-spacing:-.03em;margin-bottom:4px">You passed ${ex.full||sec}.</div>
    ${score!=null?`<div style="font-size:40px;font-weight:900;color:${ex.color};line-height:1;margin:8px 0 2px;letter-spacing:-.04em">${score}</div><div style="font-size:11px;color:var(--mut);margin-bottom:4px">scaled score · 75 to pass</div>`:''}
    <div style="font-size:12px;color:var(--mut);margin-top:6px">${hrs} hours logged. That work is permanent.</div>
  </div>

  <!-- Certificate card preview -->
  <div style="margin-bottom:16px">
    <canvas id="pass-cert-canvas" width="1200" height="630" style="width:100%;border-radius:12px;display:block;box-shadow:0 4px 20px rgba(0,0,0,.3)"></canvas>
  </div>

  <!-- Actions -->
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;gap:8px">
      <button id="pass-cert-download" style="flex:1;padding:12px;background:${ex.color};color:#fff;border:none;border-radius:11px;font-size:13px;font-weight:800;cursor:pointer">↓ Download Card</button>
      <a href="${liUrl}" target="_blank" rel="noopener" onclick="document.getElementById('pass-celebration-overlay').remove()" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;background:#0077b5;color:#fff;border-radius:11px;text-decoration:none;font-size:13px;font-weight:800">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 23.2 24 22.222 0h.003z"/></svg>
        LinkedIn
      </a>
    </div>
    <button onclick="shareCelebration()" style="padding:11px;background:var(--surf2);border:1px solid var(--bdr);border-radius:11px;font-size:13px;font-weight:600;cursor:pointer;color:var(--txt)">Copy & Share</button>
    <button onclick="document.getElementById('pass-celebration-overlay').remove()" style="padding:9px;background:none;border:none;font-size:12px;color:var(--mut);cursor:pointer">Dismiss</button>
  </div>
</div>`;
  document.body.appendChild(el);

  // Draw the certificate card and wire download button
  document.fonts.ready.then(()=>{
    const canvas=document.getElementById('pass-cert-canvas');
    if(!canvas)return;
    drawShareCard(canvas,milestoneId,statLine);
    const dlBtn=document.getElementById('pass-cert-download');
    if(dlBtn){
      dlBtn.onclick=()=>{
        const a=document.createElement('a');
        a.download=`ledger-${sec.toLowerCase()}-passed.png`;
        a.href=canvas.toDataURL('image/png');
        a.click();
      };
    }
  });
}

function showAchievementUnlock(ach){
  // Small floating card from bottom-right, stacks with toasts
  const el=document.createElement('div');
  el.style.cssText=`position:fixed;bottom:${innerWidth>640&&!document.body.classList.contains('no-app-nav')?100:28}px;right:24px;z-index:1050;background:var(--surf);border:1.5px solid rgba(245,158,11,.4);border-radius:16px;padding:14px 18px;display:flex;align-items:center;gap:14px;box-shadow:0 12px 40px rgba(0,0,0,.2);max-width:300px;animation:modalIn .4s cubic-bezier(.22,.61,.36,1);transition:opacity .4s`;
  el.innerHTML=`
    <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#f59e0b22,#d9770622);border:1.5px solid rgba(245,158,11,.3);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;animation:badgeBurst .5s cubic-bezier(.22,.61,.36,1)">${LedgerIcon(ach.icon)}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--amb);margin-bottom:3px">Achievement</div>
      <div style="font-size:14px;font-weight:800;color:var(--txt)">${ach.name}</div>
      <div style="font-size:11px;color:var(--mut);margin-top:1px">${ach.desc}</div>
    </div>`;
  document.body.appendChild(el);
  burstConfetti(el);
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),400);},4000);
}

// Reusable shareable milestone card (streaks, hours, sections) — reuses drawShareCard + SHARE_MILESTONES.
function showMilestoneShareCard(milestoneId){
  const cfg=SHARE_MILESTONES[milestoneId]; if(!cfg) return;
  const statLine=(S.name||'Ledger')+' · '+Math.round((typeof getTotalHours==='function'?getTotalHours():0))+'h logged on Ledger';
  const shareText=cfg.headline+' '+cfg.sub+' — tracked on Ledger. ledgercpa.app';
  const liUrl='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent('https://ledgercpa.app')+'&summary='+encodeURIComponent(shareText);
  if(typeof confetti==='function'){confetti({particleCount:90,spread:80,origin:{y:0.5},colors:[cfg.accent,'#ffffff',cfg.accent+'99']});}
  let el=document.getElementById('milestone-card-overlay'); if(el)el.remove();
  el=document.createElement('div'); el.id='milestone-card-overlay';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);z-index:2100;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .3s ease';
  el.innerHTML='<div style="background:var(--surf);border-radius:24px;padding:24px;max-width:480px;width:100%;box-shadow:0 40px 80px rgba(0,0,0,.35);animation:modalIn .4s cubic-bezier(.22,.61,.36,1);max-height:90vh;overflow-y:auto">'+
    '<div style="text-align:center;margin-bottom:14px"><div style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:'+cfg.accent+';margin-bottom:4px">'+cfg.label+'</div><div style="font-size:25px;font-weight:900;letter-spacing:-.03em">'+cfg.headline+'</div><div style="font-size:13px;color:var(--mut);margin-top:4px">'+cfg.sub+'</div></div>'+
    '<div style="margin-bottom:16px"><canvas id="milestone-card-canvas" width="1200" height="630" style="width:100%;border-radius:12px;display:block;box-shadow:0 4px 20px rgba(0,0,0,.3)"></canvas></div>'+
    '<div style="display:flex;gap:8px"><button id="milestone-card-dl" style="flex:1;padding:12px;background:'+cfg.accent+';color:#fff;border:none;border-radius:11px;font-size:13px;font-weight:800;cursor:pointer">↓ Download Card</button>'+
      '<a href="'+liUrl+'" target="_blank" rel="noopener" onclick="document.getElementById(\'milestone-card-overlay\').remove()" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;background:#0077b5;color:#fff;border-radius:11px;text-decoration:none;font-size:13px;font-weight:800">Share on LinkedIn</a></div>'+
    '<button onclick="document.getElementById(\'milestone-card-overlay\').remove()" style="width:100%;margin-top:8px;padding:11px;background:transparent;color:var(--mut);border:none;font-size:13px;font-weight:600;cursor:pointer">Close</button>'+
  '</div>';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.fonts.ready.then(()=>{
    const canvas=document.getElementById('milestone-card-canvas'); if(!canvas)return;
    drawShareCard(canvas,milestoneId,statLine);
    const dl=document.getElementById('milestone-card-dl');
    if(dl)dl.onclick=()=>{const a=document.createElement('a');a.download='ledger-'+milestoneId+'.png';a.href=canvas.toDataURL('image/png');a.click();};
  });
}

// Shareable cohort weekly digest — the screenshot the captain posts in the group chat.
async function showCohortDigestCard(){
  const clubId=_cohortClubId();
  if(!clubId||!firebaseDb){ showToast('Cohort progress unavailable offline','err'); return; }
  let docs=[];
  try{ await syncClubActivity(); const snap=await firebaseDb.collection('clubs').doc(clubId).collection('members').get(); docs=snap.docs.map(d=>({id:d.id,...d.data()})); }catch(e){ showToast('Could not load cohort','err'); return; }
  const todayStr=_ymd(new Date());
  const stats={
    firmName:S.firmName||'Our Cohort',
    members:docs.length,
    weekHrs:docs.reduce((s,m)=>s+(m.weekHrs||0),0),
    gStreak:(typeof _computeGroupStreak==='function')?_computeGroupStreak(docs):0,
    activeToday:docs.filter(m=>Array.isArray(m.studyDates)&&m.studyDates.includes(todayStr)).length
  };
  const shareText=stats.firmName+' logged '+stats.weekHrs.toFixed(0)+'h together this week on Ledger. ledgercpa.app';
  const liUrl='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent('https://ledgercpa.app')+'&summary='+encodeURIComponent(shareText);
  let el=document.getElementById('cohort-digest-overlay'); if(el)el.remove();
  el=document.createElement('div'); el.id='cohort-digest-overlay';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);z-index:2100;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .3s ease';
  el.innerHTML='<div style="background:var(--surf);border-radius:24px;padding:24px;max-width:480px;width:100%;box-shadow:0 40px 80px rgba(0,0,0,.35);max-height:90vh;overflow-y:auto">'+
    '<div style="text-align:center;margin-bottom:14px"><div style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ind);margin-bottom:4px">Cohort Weekly</div><div style="font-size:22px;font-weight:900;letter-spacing:-.03em">'+esc(stats.firmName)+'</div></div>'+
    '<div style="margin-bottom:16px"><canvas id="cohort-digest-canvas" width="1200" height="630" style="width:100%;border-radius:12px;display:block;box-shadow:0 4px 20px rgba(0,0,0,.3)"></canvas></div>'+
    '<div style="display:flex;gap:8px"><button id="cohort-digest-dl" style="flex:1;padding:12px;background:#6366f1;color:#fff;border:none;border-radius:11px;font-size:13px;font-weight:800;cursor:pointer">↓ Download Card</button>'+
      '<a href="'+liUrl+'" target="_blank" rel="noopener" onclick="document.getElementById(\'cohort-digest-overlay\').remove()" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;background:#0077b5;color:#fff;border-radius:11px;text-decoration:none;font-size:13px;font-weight:800">Share on LinkedIn</a></div>'+
    '<button onclick="document.getElementById(\'cohort-digest-overlay\').remove()" style="width:100%;margin-top:8px;padding:11px;background:transparent;color:var(--mut);border:none;font-size:13px;font-weight:600;cursor:pointer">Close</button>'+
  '</div>';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  document.fonts.ready.then(()=>{
    const canvas=document.getElementById('cohort-digest-canvas'); if(!canvas)return;
    drawCohortDigestCard(canvas,stats);
    const dl=document.getElementById('cohort-digest-dl');
    if(dl)dl.onclick=()=>{const a=document.createElement('a');a.download='ledger-cohort.png';a.href=canvas.toDataURL('image/png');a.click();};
  });
}
function drawCohortDigestCard(canvas, stats){
  const W=canvas.width,H=canvas.height,ctx=canvas.getContext('2d');
  const acc='#6366f1';
  ctx.fillStyle='#0d0a18';ctx.fillRect(0,0,W,H);
  const glow=ctx.createRadialGradient(W*0.5,H*0.18,10,W*0.5,H*0.18,460);
  glow.addColorStop(0,acc+'26');glow.addColorStop(0.5,acc+'0c');glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.035)';
  for(let x=40;x<W;x+=48)for(let y=40;y<H;y+=48){ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill();}
  const stripe=ctx.createLinearGradient(0,0,W,0);
  stripe.addColorStop(0,acc);stripe.addColorStop(1,acc+'11');
  ctx.fillStyle=stripe;ctx.fillRect(0,0,W,6);
  ctx.textAlign='center';
  ctx.fillStyle=acc;ctx.font='800 22px "Libre Franklin",system-ui,sans-serif';
  ctx.fillText('COHORT · THIS WEEK',W/2,92);
  ctx.fillStyle='#ffffff';
  let fn=String(stats.firmName||'Our Cohort');
  ctx.font='900 64px "Libre Franklin",system-ui,sans-serif';
  if(ctx.measureText(fn).width>W-140) ctx.font='900 46px "Libre Franklin",system-ui,sans-serif';
  ctx.fillText(fn,W/2,172);
  const cols=[
    {v:stats.weekHrs.toFixed(stats.weekHrs<100?1:0)+'h',l:'STUDIED TOGETHER',c:'#f59e0b'},
    {v:String(stats.gStreak),l:'DAY GROUP STREAK',c:'#ffffff'},
    {v:String(stats.members),l:stats.members===1?'MEMBER':'MEMBERS',c:acc}
  ];
  const cw=W/3;
  cols.forEach((co,i)=>{
    const cx=cw*i+cw/2;
    ctx.fillStyle=co.c;ctx.font='900 96px "Libre Franklin",system-ui,sans-serif';
    ctx.fillText(co.v,cx,408);
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='700 20px "Libre Franklin",system-ui,sans-serif';
    ctx.fillText(co.l,cx,452);
  });
  ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='600 24px "Libre Franklin",system-ui,sans-serif';
  ctx.fillText('Tracked on Ledger · ledgercpa.app',W/2,564);
  ctx.textAlign='left';
}

function showStreakMilestone(days){
  // Use the shareable milestone card when we have a design for this streak length.
  if(SHARE_MILESTONES['streak_'+days]){ showMilestoneShareCard('streak_'+days); return; }
  const configs={
    7: {label:'One week straight.',sub:'Consistency is the whole game.'},
    14:{label:'Two weeks.',sub:'You\'re building a real habit.'},
    30:{label:'30 days.',sub:'A month of showing up. That\'s discipline.'},
    60:{label:'60 days.',sub:'Most candidates quit long before this.'},
    100:{label:'100 days.',sub:'You\'re a different person than when you started.'},
  };
  const cfg=configs[days]||{label:`${days}-day streak.`,sub:'Keep going.'};
  const el=document.createElement('div');
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);z-index:2100;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;animation:fadeIn .3s ease';
  el.innerHTML=`
<div style="background:var(--surf);border-radius:24px;padding:40px 32px;max-width:380px;width:100%;text-align:center;box-shadow:0 40px 80px rgba(0,0,0,.3);animation:modalIn .4s cubic-bezier(.22,.61,.36,1)">
  <div style="font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--mut);margin-bottom:16px">Study Streak</div>
  <div style="font-size:80px;font-weight:900;letter-spacing:-.02em;line-height:1;color:var(--txt);margin-bottom:12px;font-family:var(--font-display)">${days}</div>
  <div style="font-size:20px;font-weight:800;letter-spacing:-.02em;margin-bottom:8px">${cfg.label}</div>
  <div style="font-size:14px;color:var(--sub);line-height:1.6;margin-bottom:28px">${cfg.sub}</div>
  <button onclick="this.closest('[style*=fixed]').remove()" style="width:100%;padding:14px;background:var(--ora);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 18px rgba(212,64,0,.3)">Keep Going</button>
</div>`;
  document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target===el)el.remove();});
  if(typeof confetti==='function'){
    confetti({particleCount:60,spread:70,origin:{y:0.5},colors:['#d44000','#6366f1','#10b981','#f59e0b']});
  } else { burstConfetti(el); }
}

function shareCelebration(){
  const text=window._celebShareText||'Just passed my CPA exam! Logged on Ledger.';
  document.getElementById('pass-celebration-overlay')?.remove();
  if(navigator.share){
    navigator.share({title:text,text,url:'https://ledgercpa.app'}).catch(()=>{});
  }else{
    navigator.clipboard?.writeText(text+' https://ledgercpa.app').then(()=>showToast('Copied!','ok'));
  }
}

// ═══════════════════════════════════════════════
// COUNTDOWN ALERTS
// ═══════════════════════════════════════════════
function buildCountdownAlerts(){
  if(!S)return'';
  const today=todayStr();
  const alerts=(S.sections||[]).filter(s=>{
    if((S.sectionPassed||[]).includes(s))return false;
    const d=S.examDates?.[s];if(!d)return false;
    const days=Math.round((new Date(d+' 00:00:00')-Date.now())/86400000);
    if(days<0||days>14)return false;
    return localStorage.getItem('countdownDismissedDate_'+s)!==today;
  }).map(s=>{
    const d=S.examDates[s];
    const days=Math.round((new Date(d+' 00:00:00')-Date.now())/86400000);
    const r=calcReadinessScore();
    const rColor=days<=3?'var(--red)':days<=7?'var(--ora)':'var(--amb)';
    const label=days===0?'EXAM TODAY':days===1?'1 DAY UNTIL EXAM':`${days} DAYS UNTIL EXAM`;
    return`<div style="background:var(--surf);border:1.5px solid ${rColor}55;border-radius:12px;padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
      <div style="width:8px;height:8px;border-radius:50%;background:${rColor};flex-shrink:0;box-shadow:0 0 0 3px ${rColor}33"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:800;color:${rColor}">${label} — ${s}</div>
        <div style="font-size:11px;color:var(--sub);margin-top:1px">Readiness: <strong style="color:${r.color}">${r.score}/100</strong> · ${r.label}</div>
      </div>
      <button onclick="localStorage.setItem('countdownDismissedDate_${s}','${today}');this.closest('div[style]').remove()" style="background:none;border:none;color:var(--mut);font-size:18px;cursor:pointer;padding:0;flex-shrink:0" title="Dismiss for today">×</button>
    </div>`;
  });
  return alerts.join('');
}

// ═══════════════════════════════════════════════
// STREAK RECOVERY
// ═══════════════════════════════════════════════
// ── BURNOUT CHECK-IN (Step 2) ──────────────────────────────────────────────
// Subtle, never a nag. It should feel like the app noticing you, not warning you.
// Compares this week's rhythm against an established 3-week baseline.
function dismissBurnoutCheckIn(){
  if(!S)return;
  S._burnout={dismissedAt:Date.now()};
  saveState();
  renderTab();
}
function buildBurnoutCheckIn(){
  if(!S)return'';
  const acts=(S.activities||[]).filter(a=>a&&a.date);
  if(acts.length<6)return''; // not enough history to notice a change in rhythm
  const now=Date.now(), DAY=86400000;
  // Respect a dismissal for 7 days — back off, don't nag.
  const dAt=(S._burnout||{}).dismissedAt||0;
  if(dAt && now-dAt<7*DAY) return '';

  const ageDays=a=>(now-new Date(a.date).getTime())/DAY;
  const wk=acts.filter(a=>{const d=ageDays(a);return d>=0&&d<7;});
  const base=acts.filter(a=>{const d=ageDays(a);return d>=7&&d<28;}); // prior 3 weeks
  const sum=arr=>arr.reduce((s,a)=>s+(a.hours||0),0);
  const uniqDays=arr=>new Set(arr.map(a=>a.date.slice(0,10))).size;

  const wkHrs=sum(wk), baseHrs=sum(base);
  const baseWeekHrs=baseHrs/3, baseDaysPerWk=uniqDays(base)/3, wkDays=uniqDays(wk);
  // Need an established baseline to have something to gently "notice."
  if(baseWeekHrs<2 || uniqDays(base)<5) return '';

  const pullingBack    = wkHrs>0 && wkHrs < 0.5*baseWeekHrs;
  const shorterSessions= !pullingBack && wk.length>=2 && base.length>=4 &&
                         (wkHrs/wk.length) < 0.6*(baseHrs/base.length);
  const fewerDays      = !pullingBack && !shorterSessions && baseDaysPerWk>=4 &&
                         wkDays>0 && wkDays<=baseDaysPerWk-2;

  // consecutive active days ending today/yesterday
  const dset=new Set(acts.map(a=>a.date.slice(0,10)));
  let consec=0;
  for(let i=0;i<16;i++){const d=_ymd(new Date(now-i*DAY));if(dset.has(d))consec++;else if(i>0)break;}
  const grinding = consec>=10 || (wkHrs>1.7*baseWeekHrs && wkHrs>=14 && wkDays>=6);

  let icon,title,body,extraCta='';
  if(pullingBack||shorterSessions||fewerDays){
    icon='wave'; title='Just checking in';
    body = pullingBack
      ? `You've logged a bit less this week than your usual rhythm — no pressure at all. Some weeks are just like that. We're here whenever you're ready to pick back up.`
      : shorterSessions
      ? `Your sessions have been a little shorter this week — totally fine. Even 20 focused minutes keeps the momentum alive.`
      : `Looks like a lighter week than your usual pace — life happens. Jump back in whenever it suits you.`;
    extraCta=`<button onclick="openStrugglingModal()" style="padding:7px 13px;background:transparent;color:var(--sub);border:1px solid var(--bdr);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0">What's going on?</button>`;
  } else if(grinding){
    icon='leaf'; title="You've been going hard";
    body=`${consec>=10?`${consec} days straight`:'A huge week'} — that's seriously impressive. One real rest day actually helps your brain lock in what you've learned. Consider this your permission to take one.`;
  } else {
    return '';
  }

  return`<div style="background:linear-gradient(135deg,var(--ind-bg),var(--surf));border:1px solid rgba(90,95,207,.22);border-radius:14px;padding:16px 18px;margin-bottom:16px;display:flex;align-items:flex-start;gap:14px">
    <div style="flex-shrink:0;line-height:1">${LedgerBuddy(icon==='leaf'?'sleep':'wave',64)}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:14px;font-weight:800;color:var(--txt);margin-bottom:3px">${title}</div>
      <div style="font-size:12.5px;color:var(--sub);line-height:1.55">${body}</div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button onclick="dismissBurnoutCheckIn()" style="padding:7px 13px;background:var(--ind);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0">${grinding?"I'll rest":'Thanks'}</button>
        ${extraCta}
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
// REST DAYS + STREAK SHIELDS (rules live next to getStreak in core.js)
// ═══════════════════════════════════════════════
function _restAfterChange(msg){
  saveState();
  try{ if(typeof syncNotifyProfile==='function') syncNotifyProfile(); }catch(e){}
  if(msg) showToast(msg,'ok');
  if(document.getElementById('rest-modal')) _renderRestModal();
  try{ renderTab(); }catch(e){}
}
function _restDayLabel(ymd){
  const t=todayStr();
  if(ymd===t) return 'today';
  if(ymd===_dayShift(t,1)) return 'tomorrow';
  return new Date(ymd+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
}
// Why a day can't be a rest day, or '' when it can.
function restBlocker(ymd){
  const t=todayStr();
  if(ymd<t) return 'That day has passed.';
  if(ymd>_dayShift(t,13)) return 'Plan rest days up to two weeks ahead.';
  if(_studiedOn(ymd)) return 'You already studied that day.';
  if(restUsedInWeek(ymd,ymd)>=REST_PER_WEEK) return 'You have used this week’s rest day.';
  return '';
}
function takeRestDay(ymd){
  if(!S) return;
  ymd=ymd||todayStr();
  if(restKind(ymd)==='rest') return;
  const why=restBlocker(ymd);
  if(why){ showToast(why,'err'); return; }
  _setRest(ymd,'rest');
  logLedgerEvent&&logLedgerEvent('rest_day_taken',{ahead:ymd!==todayStr()});
  const st=getStreak();
  _restAfterChange(ymd===todayStr()
    ?(st>0?'Rest day set. Your '+st+'-day streak is safe today.':'Rest day set. Enjoy it.')
    :'Rest day planned for '+_restDayLabel(ymd)+'.');
}
function cancelRestDay(ymd){
  if(!S||restKind(ymd)!=='rest') return;
  _setRest(ymd,null);
  _restAfterChange('Rest day removed.');
}
// Pro: patch the missed days of a streak that just broke.
function useStreakShield(){
  if(!S) return;
  const gap=streakGap();
  if(!gap){ showToast('There is no broken streak to restore right now.','info'); return; }
  if(!isPro()){ openUpgradeModal('Streak Shield'); return; }
  gap.days.forEach(d=>_setRest(d,'shield'));
  S.shieldsUsed=(S.shieldsUsed||0)+gap.days.length;
  logLedgerEvent&&logLedgerEvent('streak_shield_used',{days:gap.days.length});
  checkAchievements();
  _restAfterChange('Streak restored: '+getStreak()+' days. Study today to keep it going.');
}

// The rest-day planner: this week and next, one tap to set or clear a day.
function openRestDayModal(){
  document.getElementById('rest-modal')?.remove();
  const el=document.createElement('div');
  el.id='rest-modal'; el.className='modal-overlay open';
  el.innerHTML='<div class="modal-box" style="max-width:430px" onclick="event.stopPropagation()"><div class="modal-hdr"><div class="modal-title">Rest days</div><button class="modal-close" aria-label="Close" onclick="document.getElementById(\'rest-modal\').remove()">×</button></div><div class="modal-body" id="rest-modal-body"></div></div>';
  el.addEventListener('click',e=>{ if(e.target===el) el.remove(); });
  document.body.appendChild(el);
  _renderRestModal();
}
function _renderRestModal(){
  const body=document.getElementById('rest-modal-body'); if(!body) return;
  const t=todayStr(), mon=_weekMonday(t);
  const week=(off)=>{
    const m=_dayShift(mon,off*7);
    const used=restUsedInWeek(m);
    const cells=[0,1,2,3,4,5,6].map(i=>{
      const k=_dayShift(m,i), kind=restKind(k), studied=_studiedOn(k);
      const past=k<t, d=new Date(k+'T12:00:00');
      let cls='rest-day', act='', note='';
      if(studied){cls+=' studied';note='Studied';}
      else if(kind==='rest'){cls+=' rest';note='Rest';if(!past)act=`cancelRestDay('${k}')`;}
      else if(kind==='shield'){cls+=' shield';note='Shield';}
      else if(past){cls+=' past';}
      else if(!restBlocker(k)){cls+=' open';act=`takeRestDay('${k}')`;}
      else cls+=' locked';
      if(k===t) cls+=' is-today';
      const label=d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})+(note?': '+note:'')+(act?(kind==='rest'?'. Tap to remove.':'. Tap to rest.'):'');
      return `<button class="${cls}" ${act?`onclick="${act}"`:'disabled'} aria-label="${label}" title="${label}">
        <span class="rest-dow">${d.toLocaleDateString('en-US',{weekday:'short'}).slice(0,2)}</span>
        <span class="rest-num">${d.getDate()}</span>
        <span class="rest-note">${note||(k===t?'Today':'')}</span>
      </button>`;
    }).join('');
    return `<div class="rest-week"><div class="rest-week-hd"><span>${off===0?'This week':'Next week'}</span><span>${used>=REST_PER_WEEK?'Rest day used':REST_PER_WEEK+' rest day available'}</span></div><div class="rest-grid">${cells}</div></div>`;
  };
  const st=getStreak(), gap=streakGap();
  body.innerHTML=`
    <div class="rest-intro">A rest day keeps your streak going without counting toward it. You get <strong>one a week</strong>, Monday to Sunday. Plan it today or up to two weeks ahead.${st>0?` Your streak is <strong>${st} day${st===1?'':'s'}</strong>.`:''}</div>
    ${week(0)}${week(1)}
    <div class="rest-shield">
      <span class="rest-shield-ic">${ico('shield')}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:800">Streak Shield${isPro()?'':' · Pro'}</div>
        <div style="font-size:12px;color:var(--sub);line-height:1.5;margin-top:2px">${gap
          ?`Your ${gap.was}-day streak broke on ${_restDayLabel(gap.days[0]).replace(/^today$/,'today')}. A shield covers the missed day${gap.days.length>1?'s':''} and brings it back to ${gap.restored}.`
          :'Missed a day without planning it? A shield covers up to 3 missed days from the past week, after the fact.'}</div>
      </div>
      ${gap?`<button class="btn btn-sm ${isPro()?'btn-primary':'btn-ghost'}" onclick="useStreakShield()">${isPro()?'Restore':'Get Pro'}</button>`:''}
    </div>`;
}

function buildStreakRecovery(){
  if(!S)return'';
  const streak=getStreak();
  if(streak>0)return'';
  const gap=streakGap();
  if(gap){
    const day=_restDayLabel(gap.days[0]);
    return`<div class="streak-save" role="status">
      <div class="streak-save-ic">${ico('shield')}</div>
      <div style="flex:1;min-width:0">
        <div class="streak-save-t">Your ${gap.was}-day streak broke ${day==='today'?'today':'on '+day.split(',')[0]}</div>
        <div class="streak-save-s">${isPro()?`A Streak Shield covers the missed day${gap.days.length>1?'s':''} and brings it back to ${gap.restored}.`:`Pro members can bring it back to ${gap.restored} with a Streak Shield.`}</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="useStreakShield()">${isPro()?'Use a shield':'Restore with Pro'}</button>
    </div>`;
  }
  const longest=S.longestStreak||0;
  if(longest===0&&!(S.activities||[]).length)return'';
  return`<div style="background:var(--surf);border:1.5px solid rgba(245,158,11,.3);border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
    <div style="font-size:24px;flex-shrink:0">${ico('flame')}</div>
    <div style="flex:1">
      <div style="font-size:13px;font-weight:800;color:var(--txt)">Streak broken${longest>0?` — Your longest: ${longest} days`:''}</div>
      <div style="font-size:12px;color:var(--sub);margin-top:2px">Study today to start a new one.</div>
    </div>
    <button onclick="openSessionModal()" style="padding:7px 13px;background:var(--ora);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0">Study Now</button>
  </div>`;
}

// ═══════════════════════════════════════════════
// IN-APP STUDY NUDGE
// ═══════════════════════════════════════════════
function checkStudyNudge(){
  if(!S||document.getElementById('study-nudge-banner'))return;
  if(hasLoggedToday())return;
  if(restKind(todayStr()))return;
  // Never over a session in progress or a recap being filled in.
  if(TS.phase!=='setup'||document.getElementById('sess-overlay')?.classList.contains('open'))return;
  const today=todayStr();
  if(localStorage.getItem('nudgeDismissedDate')===today)return;
  if(document.getElementById('post-ob-offer'))return; // don't stack on the first-run plan offer
  // A streak that ends tonight is a "streak alert"; otherwise it's the daily reminder.
  const _atRisk=(typeof getStreak==='function'?getStreak():0);
  const _streakMsg=_atRisk>0 && notifPref('streak_alerts');
  if(!_streakMsg && !notifPref('study_reminders'))return;
  if(!_streakMsg && !(S.activities||[]).length)return; // nothing to remind a brand-new account about yet
  const banner=document.createElement('div');
  banner.id='study-nudge-banner';
  // Bottom-RIGHT corner (not dead-center) so it never covers primary action buttons (Send, Flashcards, etc.)
  banner.style.cssText='position:fixed;bottom:20px;right:20px;left:auto;transform:none;z-index:1100;max-width:340px;width:calc(100% - 32px);animation:slide-up-banner .3s ease forwards';
  banner.innerHTML=`<div style="background:var(--navy);color:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 8px 32px rgba(0,0,0,.4);display:flex;align-items:center;gap:12px">
    <div style="font-size:22px;flex-shrink:0">${ico('book')}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:700">${_streakMsg?('Your '+_atRisk+'-day streak ends tonight.'):"You haven't studied today."}</div>
      <div style="font-size:11px;opacity:.7;margin-top:2px">${_streakMsg?'Log a session today to keep it going.':'Every session counts.'}</div>
    </div>
    <button onclick="document.getElementById('study-nudge-banner').remove();openSessionModal()" style="padding:7px 12px;background:var(--ora);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">Log a session →</button>
    <button onclick="document.getElementById('study-nudge-banner').remove();localStorage.setItem('nudgeDismissedDate','${today}')" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:20px;cursor:pointer;padding:0;flex-shrink:0;line-height:1">×</button>
  </div>`;
  document.body.appendChild(banner);
  // Auto-dismiss after 12s so it doesn't linger over the UI (does not set the dismissed flag — it can nudge again next visit).
  setTimeout(()=>{const b=document.getElementById('study-nudge-banner');if(b){b.style.transition='opacity .4s ease';b.style.opacity='0';setTimeout(()=>b.remove(),400);}},12000);
}

// ═══════════════════════════════════════════════
// PWA INSTALL PROMPT
// ═══════════════════════════════════════════════
let _deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  _deferredInstallPrompt=e;
  const sessions=(S?.activities||[]).length;
  if(sessions>=2&&!localStorage.getItem('pwaPromptDismissed'))setTimeout(showPWAPrompt,2500);
});

function showPWAPrompt(){
  if(document.getElementById('pwa-prompt-banner'))return;
  if(localStorage.getItem('pwaPromptDismissed'))return;
  const isIOS=/iPhone|iPad/.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.userAgent));
  const banner=document.createElement('div');
  banner.id='pwa-prompt-banner';
  banner.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1100;max-width:400px;width:calc(100% - 32px);animation:slide-up-banner .3s ease forwards';
  if(isIOS){
    banner.innerHTML=`<div style="background:var(--navy);color:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 8px 32px rgba(0,0,0,.4);display:flex;align-items:flex-start;gap:12px">
      <div style="font-size:22px;flex-shrink:0;margin-top:2px">${ico('phone')}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700">Add Ledger to your Home Screen</div>
        <div style="font-size:11px;opacity:.7;margin-top:3px;line-height:1.5">Tap <strong>Share ⎙</strong> then <strong>Add to Home Screen</strong> for one-tap access.</div>
      </div>
      <button onclick="document.getElementById('pwa-prompt-banner').remove();localStorage.setItem('pwaPromptDismissed','1')" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:20px;cursor:pointer;padding:0;flex-shrink:0;line-height:1;margin-top:-2px">×</button>
    </div>`;
  }else{
    banner.innerHTML=`<div style="background:var(--navy);color:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 8px 32px rgba(0,0,0,.4);display:flex;align-items:center;gap:12px">
      <div style="font-size:22px;flex-shrink:0">${ico('phone')}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700">Add Ledger to your Home Screen</div>
        <div style="font-size:11px;opacity:.7;margin-top:2px">Get one-tap access from your home screen.</div>
      </div>
      <button onclick="if(_deferredInstallPrompt){_deferredInstallPrompt.prompt();_deferredInstallPrompt.userChoice.then(()=>{localStorage.setItem('pwaPromptDismissed','1');document.getElementById('pwa-prompt-banner')?.remove()})}" style="padding:7px 12px;background:var(--ora);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">Install</button>
      <button onclick="document.getElementById('pwa-prompt-banner').remove();localStorage.setItem('pwaPromptDismissed','1')" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:20px;cursor:pointer;padding:0;flex-shrink:0;line-height:1">×</button>
    </div>`;
  }
  document.body.appendChild(banner);
}

// ═══════════════════════════════════════════════
// LONGEST STREAK BACKFILL
// ═══════════════════════════════════════════════
function backfillLongestStreak(){
  if(!S||S.longestStreakMigrated)return;
  const dates=[...new Set((S.activities||[]).map(a=>a.date.slice(0,10)))].sort();
  let cur=0,max=0,prev=null;
  for(const d of dates){
    if(prev){const diff=Math.round((new Date(d)-new Date(prev))/86400000);cur=diff===1?cur+1:1;}
    else{cur=1;}
    max=Math.max(max,cur);prev=d;
  }
  S.longestStreak=Math.max(max,S.longestStreak||0);
  S.longestStreakMigrated=true;
  saveState();
  if(firebaseDb&&AUTH?.uid){
    try{firebaseDb.collection('users').doc(AUTH.uid).update({longestStreak:S.longestStreak,longestStreakMigrated:true});}catch(e){}
  }
}

function checkStreakUrgency(){
  if(!S||isPro())return;
  const streak=getStreak();
  if(streak<5)return;
  if(hasLoggedToday())return;
  const hour=new Date().getHours();
  if(hour<20)return; // only after 8pm
  if(document.getElementById('streak-urgency-banner'))return;
  const dismissKey='streak_urgency_dismissed_'+_ymd(new Date());
  if(localStorage.getItem(dismissKey))return;
  if(restKind(todayStr()))return; // resting today: nothing is at risk
  const _canRest=!restBlocker(todayStr());

  const banner=document.createElement('div');
  banner.id='streak-urgency-banner';
  banner.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1200;max-width:420px;width:calc(100% - 32px);animation:slide-up-banner .3s ease forwards';
  banner.innerHTML=`
<div style="background:linear-gradient(135deg,#18103a,#1e1540);color:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 8px 32px rgba(0,0,0,.45);display:flex;align-items:flex-start;gap:12px">
  <div style="font-size:26px;flex-shrink:0;line-height:1;margin-top:2px">${ico('flame')}</div>
  <div style="flex:1;min-width:0">
    <div style="font-size:13px;font-weight:800;margin-bottom:3px">Your ${streak}-day streak ends at midnight.</div>
    <div style="font-size:11px;opacity:.7;margin-bottom:10px;line-height:1.5">${_canRest?'Log a session to keep it alive, or make today your rest day for the week.':'Log a session to keep it alive. Even 25 minutes counts.'}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="document.getElementById('streak-urgency-banner').remove();openSessionModal()" style="padding:7px 14px;background:var(--ora);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">Log Session Now</button>
      ${_canRest?`<button onclick="document.getElementById('streak-urgency-banner').remove();takeRestDay()" style="padding:7px 14px;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">Take a rest day</button>`:''}
    </div>
  </div>
  <button onclick="document.getElementById('streak-urgency-banner').remove();localStorage.setItem('${dismissKey}','1')" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:20px;cursor:pointer;padding:0;flex-shrink:0;line-height:1;margin-top:-2px" title="Dismiss">&times;</button>
</div>`;
  document.body.appendChild(banner);
}


// ═══════════════════════════════════════════════
// WEEKLY RECAP CARD — a story-sized (1080×1920) picture of one Monday–Sunday
// week: hours, the seven days, sessions, streak, sections and study mix.
// Opened from the profile, from Today on Sunday/Monday, and from the Sunday
// recap notification (/?action=recap).
// ═══════════════════════════════════════════════
function weekRecapStats(mon){
  const days=[], t=todayStr();
  for(let i=0;i<7;i++){
    const k=_dayShift(mon,i), acts=(S.activities||[]).filter(a=>(a.date||'').slice(0,10)===k&&_isStudyAct(a));
    days.push({key:k,hrs:acts.reduce((s,a)=>s+(a.hours||0),0),n:acts.length,rest:acts.length?null:restKind(k),future:k>t,isToday:k===t});
  }
  const acts=(S.activities||[]).filter(a=>{const d=(a.date||'').slice(0,10);return d>=mon&&d<=_dayShift(mon,6)&&_isStudyAct(a);});
  const prevMon=_dayShift(mon,-7);
  const prev=(S.activities||[]).filter(a=>{const d=(a.date||'').slice(0,10);return d>=prevMon&&d<mon&&_isStudyAct(a);}).reduce((s,a)=>s+(a.hours||0),0);
  const hasPrev=(S.activities||[]).some(a=>(a.date||'').slice(0,10)<mon);
  const by=(key)=>{const m={};acts.forEach(a=>{if(a[key])m[a[key]]=(m[a[key]]||0)+(a.hours||0);});return Object.entries(m).sort((x,y)=>y[1]-x[1]);};
  const secs=by('section');
  const total=days.reduce((s,d)=>s+d.hrs,0);
  return {
    mon, end:_dayShift(mon,6), days, total, sessions:acts.length,
    daysStudied:days.filter(d=>d.hrs>0).length, prev, hasPrev,
    target:(S.commitments&&S.commitments[mon])||S.hoursPerWeek||15,
    secs, kind:(by('kind')[0]||[])[0]||'', course:(by('course')[0]||[])[0]||'',
    streak:getStreak(), isCurrent:mon===_weekMonday(t),
  };
}
function _wrRange(st){
  const a=new Date(st.mon+'T12:00:00'), b=new Date(st.end+'T12:00:00');
  const m=d=>d.toLocaleDateString('en-US',{month:'short'});
  return (m(a)===m(b)?m(a)+' '+a.getDate()+'–'+b.getDate():m(a)+' '+a.getDate()+' – '+m(b)+' '+b.getDate()).toUpperCase();
}
function drawWeekRecap(canvas,st){
  const W=1080,H=1920,ctx=canvas.getContext('2d');
  canvas.width=W;canvas.height=H;
  const F="'Libre Franklin',system-ui,sans-serif", ORA='#ff7a3d', L=80, R=W-80;
  const rr=(x,y,w,h,r)=>{ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);};
  const txt=(s,x,y,font,color,align)=>{ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align||'left';ctx.fillText(s,x,y);ctx.textAlign='left';};
  const hrsTxt=n=>{n=Math.round(n*10)/10;return n%1===0?String(n):n.toFixed(1);};
  // Background
  ctx.fillStyle='#0d0a18';ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(W*0.85,260,20,W*0.85,260,900);
  g.addColorStop(0,'rgba(255,122,61,.26)');g.addColorStop(.45,'rgba(212,64,0,.08)');g.addColorStop(1,'rgba(13,10,24,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.03)';
  for(let x=40;x<W;x+=54)for(let y=40;y<H;y+=54){ctx.beginPath();ctx.arc(x,y,1.6,0,Math.PI*2);ctx.fill();}
  // Header
  ctx.letterSpacing='6px';
  txt('LEDGER',L,140,`800 30px ${F}`,'rgba(255,255,255,.55)');
  txt(_wrRange(st),R,140,`700 30px ${F}`,ORA,'right');
  ctx.letterSpacing='0px';
  const first=((S.name||'').trim().split(' ')[0]||'My');
  txt((first==='My'?'My':first+'’s')+' CPA week',L,300,`700 58px ${F}`,'rgba(255,255,255,.88)');
  // Hours
  const big=hrsTxt(st.total);
  ctx.font=`800 280px ${F}`;const bw=ctx.measureText(big).width;
  txt(big,L-8,580,`800 280px ${F}`,'#ffffff');
  txt(st.total===1?'hour':'hours',L+bw+18,580,`600 68px ${F}`,'rgba(255,255,255,.55)');
  // Change vs last week
  let delta='First week on Ledger', dc='rgba(255,255,255,.55)';
  if(st.isCurrent&&st.total<st.prev){
    // A week still in progress isn't "less" than a finished one yet.
    const left=st.days.filter(d=>d.future||d.isToday).length;
    delta='So far · '+left+' day'+(left===1?'':'s')+' to go';
  } else if(st.hasPrev){
    const d=Math.round((st.total-st.prev)*10)/10;
    if(d>0){delta='▲ '+hrsTxt(d)+'h more than last week';dc='#34d399';}
    else if(d<0){delta='▼ '+hrsTxt(-d)+'h less than last week';dc='#fbbf24';}
    else delta='Same as last week';
  }
  txt(delta,L,668,`700 38px ${F}`,dc);
  // Goal bar
  const pct=Math.min(1,st.total/Math.max(1,st.target)), hit=st.total>=st.target;
  rr(L,722,R-L,20,10);ctx.fillStyle='rgba(255,255,255,.1)';ctx.fill();
  if(pct>0){rr(L,722,Math.max(20,(R-L)*pct),20,10);ctx.fillStyle=hit?'#34d399':ORA;ctx.fill();}
  txt(hit?'Weekly goal hit: '+hrsTxt(st.target)+'h':Math.round(pct*100)+'% of a '+hrsTxt(st.target)+'h weekly goal',L,800,`600 32px ${F}`,'rgba(255,255,255,.6)');
  // Seven days
  const D=112, step=(R-L-D)/6, cy=950;
  const lbl=['M','T','W','T','F','S','S'];
  st.days.forEach((d,i)=>{
    const cx=L+D/2+i*step;
    ctx.beginPath();ctx.arc(cx,cy,D/2,0,Math.PI*2);
    if(d.hrs>0){ctx.fillStyle=ORA;ctx.fill();txt(hrsTxt(d.hrs),cx,cy+13,`800 ${d.hrs>=10?32:36}px ${F}`,'#1d0b02','center');}
    else if(d.rest){ctx.setLineDash([10,9]);ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=4;ctx.stroke();ctx.setLineDash([]);txt(d.rest==='shield'?'Shield':'Rest',cx,cy+9,`700 24px ${F}`,'rgba(255,255,255,.7)','center');}
    else{ctx.strokeStyle=d.future?'rgba(255,255,255,.07)':'rgba(255,255,255,.16)';ctx.lineWidth=4;ctx.stroke();}
    if(d.isToday){ctx.beginPath();ctx.arc(cx,cy,D/2+12,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=3;ctx.stroke();}
    txt(lbl[i],cx,cy+D/2+56,`700 28px ${F}`,'rgba(255,255,255,.5)','center');
  });
  // Tiles
  const ty=1130, tw=(R-L-48)/3, tiles=[[String(st.sessions),st.sessions===1?'Session':'Sessions'],[st.daysStudied+'/7','Days studied'],[String(st.streak),'Day streak']];
  tiles.forEach((tl,i)=>{
    const x=L+i*(tw+24);
    rr(x,ty,tw,210,30);ctx.fillStyle='rgba(255,255,255,.06)';ctx.fill();
    txt(tl[0],x+tw/2,ty+118,`800 86px ${F}`,'#ffffff','center');
    ctx.letterSpacing='2px';txt(tl[1].toUpperCase(),x+tw/2,ty+170,`700 24px ${F}`,'rgba(255,255,255,.5)','center');ctx.letterSpacing='0px';
  });
  // Sections
  let y=1440;
  if(st.secs.length){
    ctx.letterSpacing='4px';txt('BY SECTION',L,y,`700 26px ${F}`,'rgba(255,255,255,.45)');ctx.letterSpacing='0px';
    const max=st.secs[0][1]||1;
    st.secs.slice(0,4).forEach(([sec,h],i)=>{
      const yy=y+64+i*72, col=(EXAMS[sec]&&EXAMS[sec].color)||ORA;
      txt(sec,L,yy+12,`800 36px ${F}`,col);
      const bx=L+130, bmax=R-L-130-150;
      rr(bx,yy-10,bmax,22,11);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fill();
      rr(bx,yy-10,Math.max(22,bmax*h/max),22,11);ctx.fillStyle=col;ctx.fill();
      txt(hrsTxt(h)+'h',R,yy+12,`700 34px ${F}`,'#ffffff','right');
    });
    y+=64+Math.min(4,st.secs.length)*72+30;
  }
  // Study mix
  const mix=[kindName(st.kind)?'Mostly '+kindName(st.kind):'',courseName(st.course)].filter(Boolean).join(' · ');
  if(mix&&y<1720){
    ctx.letterSpacing='4px';txt('STUDIED WITH',L,y+20,`700 26px ${F}`,'rgba(255,255,255,.45)');ctx.letterSpacing='0px';
    txt(mix,L,y+76,`700 40px ${F}`,'rgba(255,255,255,.85)');
  }
  // Footer
  ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L,1800);ctx.lineTo(R,1800);ctx.stroke();
  txt('Tracked on Ledger',L,1856,`600 30px ${F}`,'rgba(255,255,255,.5)');
  txt('ledgercpa.app',R,1856,`700 30px ${F}`,ORA,'right');
}
let _wrMon=null, _wrBlobCache=null;
function openWeekRecap(which){
  if(!S) return;
  const t=todayStr(), thisMon=_weekMonday(t), lastMon=_dayShift(thisMon,-7);
  // Early in a new week, the finished week is the one worth sharing.
  let mon=which==='last'?lastMon:which==='this'?thisMon:thisMon;
  if(!which){ const cur=weekRecapStats(thisMon); if(cur.total===0||((new Date().getDay()===1)&&weekRecapStats(lastMon).total>0)) mon=lastMon; }
  _wrMon=mon;
  let el=document.getElementById('week-recap');
  if(!el){
    el=document.createElement('div');
    el.id='week-recap';el.className='modal-overlay open';
    el.addEventListener('click',e=>{if(e.target===el)el.remove();});
    document.body.appendChild(el);
  }
  const st=weekRecapStats(mon);
  el.innerHTML=`<div class="modal-box wr-box" onclick="event.stopPropagation()">
    <div class="modal-hdr"><div class="modal-title">Your week</div><button class="modal-close" aria-label="Close" onclick="document.getElementById('week-recap').remove()">×</button></div>
    <div class="modal-body" style="padding-top:2px">
      <div class="wr-seg" role="tablist" aria-label="Which week">
        <button role="tab" aria-selected="${mon===lastMon}" class="${mon===lastMon?'on':''}" onclick="openWeekRecap('last')">Last week</button>
        <button role="tab" aria-selected="${mon===thisMon}" class="${mon===thisMon?'on':''}" onclick="openWeekRecap('this')">This week</button>
      </div>
      <div class="wr-canvas-wrap"><canvas id="wr-canvas" width="1080" height="1920" role="img" aria-label="Weekly recap: ${_hrs(st.total)} over ${st.daysStudied} days, ${st.sessions} sessions"></canvas></div>
      ${st.total===0?`<div class="wr-empty">${st.isCurrent?'Nothing logged this week yet. Your card fills in as you study.':'No sessions that week.'}</div>`:''}
      <div class="wr-actions">
        <button class="btn btn-primary" id="wr-share" ${st.total===0?'disabled':''} onclick="shareWeekRecap()">Share</button>
        <button class="btn btn-ghost" ${st.total===0?'disabled':''} onclick="downloadWeekRecap()">Save image</button>
      </div>
      <div class="wr-foot">Sized for Instagram and TikTok stories. Only your first name is on it.</div>
    </div>
  </div>`;
  // The image is made ahead of time: iPhone only opens the share sheet when it
  // is called straight from the tap, with nothing awaited first.
  const draw=()=>{const c=document.getElementById('wr-canvas');if(!c)return;drawWeekRecap(c,st);_wrBlobCache=null;c.toBlob(b=>{_wrBlobCache=b;},'image/png');};
  draw(); // draw now with whatever font is ready, then again once fonts load
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(draw);
  logLedgerEvent('week_recap_opened',{week:mon===thisMon?'this':'last'});
}
function _wrCaption(){
  const st=weekRecapStats(_wrMon||_weekMonday(todayStr()));
  return `${_hrs(st.total)} of CPA studying over ${st.daysStudied} day${st.daysStudied===1?'':'s'} this week. Tracking every session on Ledger.`;
}
function _wrBlob(){
  const c=document.getElementById('wr-canvas');
  return new Promise(res=>{ if(!c) return res(null); c.toBlob(b=>res(b),'image/png'); });
}
async function shareWeekRecap(){
  const blob=_wrBlobCache||await _wrBlob(); if(!blob) return;
  const file=new File([blob],'ledger-week-'+(_wrMon||'')+'.png',{type:'image/png'});
  const text=_wrCaption();
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file],text}); logLedgerEvent('week_recap_shared',{via:'share'}); }catch(e){}
    return;
  }
  downloadWeekRecap();
  try{ await navigator.clipboard.writeText(text+' https://ledgercpa.app'); showToast('Image saved and caption copied.','ok'); }catch(e){}
}
async function downloadWeekRecap(){
  const blob=await _wrBlob(); if(!blob) return;
  const a=document.createElement('a');
  a.download='ledger-week-'+(_wrMon||'')+'.png';
  a.href=URL.createObjectURL(blob); a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  logLedgerEvent('week_recap_shared',{via:'download'});
}
// On Today: a quiet card on Sunday (this week) and Monday (last week).
function buildWeekRecapPrompt(){
  if(!S) return '';
  const dow=new Date().getDay(); // 0 Sun, 1 Mon
  if(dow!==0&&dow!==1) return '';
  const which=dow===0?'this':'last';
  const mon=which==='this'?_weekMonday(todayStr()):_dayShift(_weekMonday(todayStr()),-7);
  try{ if(localStorage.getItem('wrPromptHidden')===mon) return ''; }catch(e){}
  const st=weekRecapStats(mon);
  if(st.total<1) return '';
  return `<div class="card card-pad today-card wr-prompt" id="wr-prompt">
    <div style="flex:1;min-width:0">
      <div class="section-title" style="margin-bottom:4px">${which==='this'?'Your week so far':'Last week'}</div>
      <div style="font-size:15px;font-weight:800;line-height:1.35">${_hrs(st.total)} over ${st.daysStudied} day${st.daysStudied===1?'':'s'}${st.total>=st.target?' · goal hit':''}</div>
      <div style="font-size:12px;color:var(--sub);margin-top:3px">Share your week so your friends see the work.</div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
      <button class="btn btn-primary btn-sm" onclick="openWeekRecap('${which}')">Share</button>
      <button class="wr-x" aria-label="Hide" onclick="try{localStorage.setItem('wrPromptHidden','${mon}')}catch(e){};document.getElementById('wr-prompt').remove()">×</button>
    </div>
  </div>`;
}
