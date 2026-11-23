// ═══════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// EDIT PROFILE MODAL (name, bio, photo, avatar, school, exam dates)
// ═══════════════════════════════════════════════
function openEditProfile(){
  let el=document.getElementById('edit-profile-modal');
  if(!el){
    el=document.createElement('div');
    el.id='edit-profile-modal';
    el.className='modal-overlay';
    el.innerHTML=`<div class="modal-box" onclick="event.stopPropagation()" style="max-width:480px;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-hdr" style="flex-shrink:0">
        <div class="modal-title">Edit Profile</div>
        <button class="modal-close" onclick="closeEditProfile()">×</button>
      </div>
      <div class="modal-body" id="edit-profile-body" style="overflow-y:auto;flex:1"></div>
    </div>`;
    el.addEventListener('click',e=>{if(e.target===el)closeEditProfile();});
    document.body.appendChild(el);
  }
  const sections=(S.sections||[]);
  const initials=(S.name||'CPA').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const datesHTML=sections.map(s=>`
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
    <span class="badge badge-${s}" style="min-width:46px;justify-content:center">${s}</span>
    <input type="date" id="ep-date-${s}" value="${S.examDates?.[s]||''}" min="${_ymd(new Date())}" style="flex:1;padding:6px 10px;background:var(--surf2);border:1px solid var(--bdr);border-radius:7px;color:var(--txt);font-size:12px;outline:none">
  </div>`).join('');
  const hasPic=!!S.profilePic;
  document.getElementById('edit-profile-body').innerHTML=`
<!-- Profile Photo -->
<div style="text-align:center;margin-bottom:22px">
  <div style="position:relative;display:inline-block">
    <div id="ep-avatar-preview" style="width:96px;height:96px;border-radius:50%;background:var(--ora);border:3px solid var(--bdr2);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#fff;overflow:hidden;cursor:pointer;margin:0 auto;letter-spacing:-.03em" onclick="document.getElementById('ep-file-input').click()">
      ${hasPic?`<img src="${S.profilePic}" alt="Your profile photo" style="width:100%;height:100%;object-fit:cover">`:`<span>${initials}</span>`}
    </div>
    <div onclick="document.getElementById('ep-file-input').click()" style="position:absolute;bottom:2px;right:2px;width:28px;height:28px;border-radius:50%;background:var(--ora);border:2.5px solid var(--surf);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px">${ico('camera')}</div>
  </div>
  <input type="file" id="ep-file-input" accept="image/*" style="display:none" onchange="handleProfilePicUpload(this)">
  <div style="font-size:11px;color:var(--mut);margin-top:8px">Click to upload a photo · JPG or PNG, up to 5MB</div>
  ${hasPic?`<button onclick="removeProfilePic()" style="margin-top:6px;background:none;border:none;color:var(--red);font-size:11px;cursor:pointer;font-weight:600">✕ Remove photo</button>`:''}
</div>

<div style="height:1px;background:var(--bdr);margin:0 0 18px"></div>

<div class="form-grp">
  <label>Display Name</label>
  <input id="ep-name" type="text" maxlength="50" value="${esc(S.name||'')}" placeholder="Your name">
</div>
<div class="form-grp">
  <label>Bio <span style="color:var(--mut);font-weight:400">(shown on your public profile)</span></label>
  <textarea id="ep-bio" maxlength="200" style="min-height:64px" placeholder="e.g. Big 4 associate grinding toward CPA · FAR next">${esc(S.bio||'')}</textarea>
</div>
<div class="form-row">
  <div class="form-grp">
    <label>City <span style="color:var(--mut);font-weight:400">(where you live)</span></label>
    <input id="ep-city" type="text" maxlength="60" placeholder="e.g. Austin" value="${esc(S.city||'')}">
  </div>
  <div class="form-grp">
    <label>State <span style="color:var(--mut);font-weight:400">(location)</span></label>
    <select id="ep-locstate">
      <option value="">Select…</option>
      ${['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s=>`<option value="${s}"${S.locationState===s?' selected':''}>${s}</option>`).join('')}
    </select>
  </div>
</div>
<div class="form-row">
  <div class="form-grp">
    <label>Licensing State</label>
    <select id="ep-state">
      ${['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s=>`<option value="${s}"${S.state===s?' selected':''}>${s}</option>`).join('')}
    </select>
  </div>
  <div class="form-grp">
    <label>Weekly Hours Goal</label>
    <input id="ep-hrs" type="number" min="1" max="40" value="${S.hoursPerWeek||15}">
  </div>
</div>
<div class="form-row">
  <div class="form-grp">
    <label>School / University</label>
    <input id="ep-school" type="text" maxlength="80" placeholder="e.g. University of Texas" value="${esc(S.school||'')}">
  </div>
  <div class="form-grp">
    <label>Class / Status</label>
    <select id="ep-classyear">
      <option value="">Select…</option>
      ${['Freshman','Sophomore','Junior','Senior','Graduate','Alumni','Working Professional'].map(y=>`<option value="${y}"${S.classYear===y?' selected':''}>${y}</option>`).join('')}
    </select>
  </div>
</div>
<div class="form-grp">
  <label>Target Exam Dates</label>
  ${datesHTML}
</div>
<div style="display:flex;gap:8px;margin-top:4px;padding-top:4px">
  <button class="btn btn-primary" style="flex:1;justify-content:center;padding:12px" onclick="saveEditProfile()">Save Profile</button>
  <button class="btn btn-ghost" onclick="closeEditProfile()">Cancel</button>
</div>`;
  el.classList.add('open');
}

function closeEditProfile(){document.getElementById('edit-profile-modal')?.classList.remove('open');}

function selectEpAvatar(emoji, el){
  document.getElementById('ep-avatar-val').value=emoji;
  document.querySelectorAll('.ep-av-opt').forEach(e=>{e.style.borderColor='var(--bdr)';e.style.background='var(--surf2)';});
  el.style.borderColor='var(--ora)';el.style.background='var(--ora-bg)';
  // Update preview if no photo
  const preview=document.getElementById('ep-avatar-preview');
  const emojiSpan=document.getElementById('ep-emoji-preview');
  if(emojiSpan){emojiSpan.textContent=emoji;}
  else if(preview&&!S.profilePic){preview.innerHTML=`<span id="ep-emoji-preview">${emoji}</span>`;}
}

function handleProfilePicUpload(input){
  const file=input.files?.[0];
  if(!file)return;
  if(file.size>5*1024*1024){showToast('Image must be under 5MB','err');return;}
  const reader=new FileReader();
  reader.onload=e=>{ openCropModal(e.target.result); };
  reader.readAsDataURL(file);
}

function closeCropModal(){
  document.getElementById('crop-modal')?.classList.remove('open');
}
function openCropModal(dataUrl){
  let cropEl=document.getElementById('crop-modal');
  if(!cropEl){
    cropEl=document.createElement('div');
    cropEl.id='crop-modal';
    cropEl.className='modal-overlay';
    cropEl.addEventListener('click',e=>{if(e.target===cropEl)closeCropModal();});
    document.body.appendChild(cropEl);
  }
  // Note: img src is NOT set here — we set it after onload is wired (fixes data URL onload timing)
  cropEl.innerHTML=
    '<div class="modal-box" onclick="event.stopPropagation()" style="padding:24px;max-width:360px">' +
      '<div style="font-size:16px;font-weight:800;margin-bottom:4px">Position your photo</div>' +
      '<div style="font-size:12px;color:var(--mut);margin-bottom:16px">Drag to move it. Pinch, scroll or use the slider to zoom.</div>' +
      '<div class="crop-stage" id="crop-circle" tabindex="0" role="application" aria-label="Photo position. Drag or use the arrow keys to move; plus and minus to zoom.">' +
        '<img id="crop-img" alt="" draggable="false">' +
        '<div class="crop-ring" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="crop-zoom">' +
        '<button type="button" class="crop-zbtn" onclick="_cropZoomStep(-1)" aria-label="Zoom out"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg></button>' +
        '<input type="range" id="crop-zoom" min="0" max="1000" value="0" aria-label="Zoom">' +
        '<button type="button" class="crop-zbtn" onclick="_cropZoomStep(1)" aria-label="Zoom in"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M12 5v14"/></svg></button>' +
        '<button type="button" class="crop-reset" onclick="_cropReset()">Reset</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:18px">' +
        '<button class="btn btn-primary" style="flex:1;justify-content:center" onclick="applyCrop()">Use photo</button>' +
        '<button class="btn btn-ghost" onclick="closeCropModal()">Cancel</button>' +
      '</div>' +
    '</div>';
  cropEl.classList.add('open');

  const SIZE=260, C=SIZE/2;
  const img=document.getElementById('crop-img');
  const stage=document.getElementById('crop-circle');
  const slider=document.getElementById('crop-zoom');
  let scale=1, ox=0, oy=0, minS=1, maxS=4, coverS=1;
  const pts=new Map(); let gesture=null;

  // Each axis: a photo bigger than the frame must keep covering it; a smaller
  // one can sit anywhere inside the frame. So the photo can go wherever you want.
  function clampPos(){
    const iw=img.naturalWidth*scale, ih=img.naturalHeight*scale;
    ox=iw>=SIZE?Math.min(0,Math.max(SIZE-iw,ox)):Math.max(0,Math.min(SIZE-iw,ox));
    oy=ih>=SIZE?Math.min(0,Math.max(SIZE-ih,oy)):Math.max(0,Math.min(SIZE-ih,oy));
  }
  function applyTransform(){
    img.style.width=(img.naturalWidth*scale)+'px';
    img.style.height=(img.naturalHeight*scale)+'px';
    img.style.transform='translate('+ox+'px,'+oy+'px)';
  }
  // Slider is logarithmic so zoom feels even across the range.
  const toSlider=s=>Math.round(1000*Math.log(s/minS)/Math.log(maxS/minS));
  const fromSlider=v=>minS*Math.pow(maxS/minS,v/1000);
  // Zoom to scale ns, keeping the point (px,py) in the frame still.
  function zoomTo(ns,px,py){
    ns=Math.max(minS,Math.min(maxS,ns));
    if(px==null){px=C;py=C;}
    ox=px-(px-ox)*(ns/scale);
    oy=py-(py-oy)*(ns/scale);
    scale=ns;
    clampPos();applyTransform();
    slider.value=toSlider(scale);
  }
  function reset(){
    scale=coverS;
    ox=(SIZE-img.naturalWidth*scale)/2;
    oy=(SIZE-img.naturalHeight*scale)/2;
    applyTransform();
    slider.value=toSlider(scale);
  }
  function initCrop(){
    const w=img.naturalWidth, h=img.naturalHeight;
    coverS=Math.max(SIZE/w,SIZE/h);
    // Zoom out until the whole photo fits (or a bit smaller for square photos),
    // zoom in up to 5x the fill size.
    minS=Math.min(SIZE/w,SIZE/h)*0.6;
    maxS=coverS*5;
    reset();
    window._cropData={img, getScale:()=>scale, getOx:()=>ox, getOy:()=>oy};
  }
  window._cropZoomStep=dir=>zoomTo(scale*(dir>0?1.2:1/1.2));
  window._cropReset=reset;

  // Wire onload BEFORE setting src to guarantee it fires for data URLs
  img.onload=initCrop;
  img.src=dataUrl;

  slider.oninput=function(){zoomTo(fromSlider(+this.value));};

  const local=e=>{const r=stage.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
  function startGesture(){
    const p=[...pts.values()];
    if(p.length>=2){
      const [a,b]=p;
      gesture={pinch:true,d:Math.hypot(a.x-b.x,a.y-b.y)||1,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,s:scale,ox,oy};
    }else if(p.length===1){
      gesture={pinch:false,x:p[0].x,y:p[0].y,ox,oy};
    }else gesture=null;
  }
  stage.onpointerdown=function(e){
    if(e.button>0)return;
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    try{stage.setPointerCapture(e.pointerId);}catch(_){}
    stage.classList.add('dragging');
    startGesture();
    e.preventDefault();
  };
  stage.onpointermove=function(e){
    if(!pts.has(e.pointerId)||!gesture)return;
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const p=[...pts.values()];
    if(gesture.pinch&&p.length>=2){
      const [a,b]=p;
      const d=Math.hypot(a.x-b.x,a.y-b.y)||1, mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
      // Restore the start state, zoom around the pinch midpoint, then follow it.
      scale=gesture.s;ox=gesture.ox;oy=gesture.oy;
      const r=stage.getBoundingClientRect();
      const ns=Math.max(minS,Math.min(maxS,gesture.s*d/gesture.d));
      const px=gesture.mx-r.left, py=gesture.my-r.top;
      ox=px-(px-ox)*(ns/scale)+(mx-gesture.mx);
      oy=py-(py-oy)*(ns/scale)+(my-gesture.my);
      scale=ns;
      clampPos();applyTransform();slider.value=toSlider(scale);
    }else if(!gesture.pinch){
      ox=gesture.ox+(e.clientX-gesture.x);
      oy=gesture.oy+(e.clientY-gesture.y);
      clampPos();applyTransform();
    }
  };
  stage.onpointerup=stage.onpointercancel=function(e){
    if(!pts.has(e.pointerId))return;
    pts.delete(e.pointerId);
    startGesture();
    if(!pts.size)stage.classList.remove('dragging');
  };
  stage.onwheel=function(e){
    e.preventDefault();
    const [px,py]=local(e);
    zoomTo(scale*Math.exp(-e.deltaY*0.0015),px,py);
  };
  stage.onkeydown=function(e){
    if(e.key==='+'||e.key==='='){e.preventDefault();window._cropZoomStep(1);return;}
    if(e.key==='-'||e.key==='_'){e.preventDefault();window._cropZoomStep(-1);return;}
    const step=e.shiftKey?40:10;
    const d={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
    if(!d)return;
    e.preventDefault();
    ox+=d[0];oy+=d[1];clampPos();applyTransform();
  };
}

function applyCrop(){
  const cd=window._cropData;
  if(!cd||!cd.img){showToast('No image to crop','err');return;}
  const img=cd.img;
  const currentScale=cd.getScale();
  const ox=cd.getOx();
  const oy=cd.getOy();
  // Output at 2x for retina
  const OUT=520;
  const canvas=document.createElement('canvas');
  canvas.width=OUT;canvas.height=OUT;
  const ctx=canvas.getContext('2d');
  // Circular clip
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,OUT,OUT);
  ctx.beginPath();ctx.arc(OUT/2,OUT/2,OUT/2,0,Math.PI*2);ctx.clip();
  // Draw image scaled up 2x
  ctx.drawImage(img, ox*2, oy*2, img.naturalWidth*currentScale*2, img.naturalHeight*currentScale*2);
  const dataUrl=canvas.toDataURL('image/jpeg',0.9);
  const preview=document.getElementById('ep-avatar-preview');
  if(preview) preview.innerHTML='<img src="'+dataUrl+'" alt="Profile photo preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
  window._pendingProfilePic=dataUrl;
  window._cropData=null;
  closeCropModal();
  showToast('Photo cropped — click Save Profile to apply ✓','ok');
}

function removeProfilePic(){
  S.profilePic='';
  window._pendingProfilePic=null;
  saveState();
  closeEditProfile();
  showToast('Profile photo removed','info');
  renderApp();
}

function saveEditProfile(){
  const name=(document.getElementById('ep-name')?.value?.trim()||'').slice(0,50);
  if(!name){showToast('Enter your name','err');return;}
  if(_badWords(name,document.getElementById('ep-city')?.value,document.getElementById('ep-bio')?.value,document.getElementById('ep-school')?.value)) return;
  S.name=name;
  S.state=document.getElementById('ep-state')?.value||S.state;
  S.city=(document.getElementById('ep-city')?.value?.trim()||'').slice(0,60);
  S.locationState=document.getElementById('ep-locstate')?.value||'';
  S.hoursPerWeek=parseInt(document.getElementById('ep-hrs')?.value)||S.hoursPerWeek||15;
  S.bio=document.getElementById('ep-bio')?.value?.trim()||'';
  S.school=document.getElementById('ep-school')?.value?.trim()||'';
  S.classYear=document.getElementById('ep-classyear')?.value||'';
  // avatar field removed — no longer used
  if(window._pendingProfilePic){S.profilePic=window._pendingProfilePic;window._pendingProfilePic=null;}
  (S.sections||[]).forEach(s=>{
    const d=document.getElementById('ep-date-'+s)?.value;
    if(d){if(!S.examDates)S.examDates={};S.examDates[s]=d;}
  });
  saveState();
  writeUserProfile();
  closeEditProfile();
  showToast('Profile saved! ✓','ok');
  renderApp();
}

// Legacy alias so existing calls still work
function openSettings(){openAppSettings();}
function closeSettings(){closeAppSettings();}
function saveSettings(){saveEditProfile();}

// ═══════════════════════════════════════════════
// APP SETTINGS MODAL (account, security, privacy, notifications, data)
// ═══════════════════════════════════════════════
let _settingsSection = 'account';

function openAppSettings(section='account'){
  // Close any open lighter-weight overlays (e.g. notifications) so they don't sit behind Settings
  document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
  _settingsSection=section;
  let el=document.getElementById('app-settings-modal');
  if(!el){
    el=document.createElement('div');
    el.id='app-settings-modal';
    el.style.cssText='position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.5);display:none;animation:asFade .16s ease';
    el.innerHTML=`
<div id="as-panel" style="position:absolute;top:0;right:0;bottom:0;width:min(100vw,680px);background:var(--bg);display:flex;flex-direction:column;box-shadow:-12px 0 48px rgba(0,0,0,.18);animation:slideInRight .22s ease">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 14px;border-bottom:1px solid var(--bdr);flex-shrink:0;background:var(--surf)">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:18px">${ico('gear')}</span>
      <span style="font-size:17px;font-weight:800;letter-spacing:-.02em">Settings</span>
    </div>
    <button onclick="closeAppSettings()" style="width:30px;height:30px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);cursor:pointer;font-size:18px;color:var(--sub);display:flex;align-items:center;justify-content:center;line-height:1">×</button>
  </div>
  <div id="as-mobile-nav" style="display:none;flex-wrap:wrap;padding:10px 12px;gap:6px;border-bottom:1px solid var(--bdr);background:var(--surf);flex-shrink:0"></div>
  <div style="display:flex;flex:1;min-height:0;overflow:hidden">
    <div id="as-sidebar" style="width:170px;flex-shrink:0;border-right:1px solid var(--bdr);padding:10px 8px;overflow-y:auto;background:var(--surf)"></div>
    <div id="as-body" style="flex:1;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:22px 24px 40px;min-width:0"></div>
  </div>
</div>`;
    el.addEventListener('click',e=>{ if(e.target===el) closeAppSettings(); });
    document.body.appendChild(el);
  }
  el.style.display='block';
  renderAppSettingsTabs();
  renderAppSettingsSection();
  _syncModalLock();
}

// Keep the page behind Settings / the plans screen from scrolling (phones only, see CSS).
function _syncModalLock(){
  const s=document.getElementById('app-settings-modal');
  const on=(s&&s.style.display==='block')||!!document.querySelector('#upgrade-modal.open,#ach-modal.open');
  const h=document.documentElement;
  if(on===h.classList.contains('modal-lock')) return;
  // Keep the page from shifting sideways when its scrollbar disappears.
  document.body.style.paddingRight=on?Math.max(0,innerWidth-h.clientWidth)+'px':'';
  h.classList.toggle('modal-lock',on);
}

function renderAppSettingsTabs(){
  const tabs=[
    {id:'account',  icon:'user', label:'Account'},
    {id:'billing',  icon:'creditCard', label:'Billing'},
    {id:'security', icon:'lock', label:'Security'},
    {id:'notifications',icon:'bell',label:'Notifs'},
    {id:'privacy',  icon:'shield', label:'Privacy'},
    {id:'data',     icon:'database', label:'Data'},
  ];
  const isMobile = window.innerWidth <= 600;

  // Desktop sidebar
  const sidebar = document.getElementById('as-sidebar');
  if(sidebar){
    sidebar.style.display = isMobile ? 'none' : '';
    if(!isMobile){
      sidebar.innerHTML = tabs.map(t=>{
        const active = _settingsSection===t.id;
        return `<button onclick="switchSettingsSection('${t.id}')" style="
          display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;
          border:none;border-radius:9px;cursor:pointer;text-align:left;
          background:${active?'var(--ora-bg)':'transparent'};
          color:${active?'var(--ora)':'var(--sub)'};
          font-size:13px;font-weight:${active?700:500};
          margin-bottom:2px;transition:background-color .15s,color .15s"
          onmouseover="if('${t.id}'!=='${_settingsSection}'){this.style.background='var(--surf2)';this.style.color='var(--txt)'}"
          onmouseout="if('${t.id}'!=='${_settingsSection}'){this.style.background='transparent';this.style.color='var(--sub)'}">
          <span style="font-size:16px;flex-shrink:0">${LedgerIcon(t.icon)}</span>
          <span>${t.label}</span>
          ${active?'<span style="width:4px;height:4px;border-radius:50%;background:var(--ora);margin-left:auto;flex-shrink:0"></span>':''}
        </button>`;
      }).join('');
    }
  }

  // Mobile pill nav
  const mobileNav = document.getElementById('as-mobile-nav');
  if(mobileNav){
    mobileNav.style.display = isMobile ? 'flex' : 'none';
    if(isMobile){
      mobileNav.innerHTML = tabs.map(t=>{
        const active = _settingsSection===t.id;
        return `<button onclick="switchSettingsSection('${t.id}')" style="
          display:inline-flex;align-items:center;gap:5px;padding:6px 12px;flex-shrink:0;
          border-radius:20px;border:1.5px solid ${active?'var(--ora)':'var(--bdr)'};
          background:${active?'var(--ora-bg)':'transparent'};
          color:${active?'var(--ora)':'var(--sub)'};
          font-size:12px;font-weight:${active?700:500};
          cursor:pointer;white-space:nowrap;transition:background-color .15s,color .15s,border-color .15s">
          <span>${LedgerIcon(t.icon)}</span><span>${t.label}</span>
        </button>`;
      }).join('');
    }
  }

  // Tighten body padding on mobile
  const body = document.getElementById('as-body');
  if(body) body.style.padding = isMobile ? '16px 14px 80px' : '22px 24px 40px';
}

function switchSettingsSection(section){
  _settingsSection=section;
  renderAppSettingsTabs();
  renderAppSettingsSection();
}

function renderAppSettingsSection(){
  const body=document.getElementById('as-body');if(!body)return;
  body.scrollTop=0;
  if(_settingsSection==='account') body.innerHTML=buildSettingsAccount();
  else if(_settingsSection==='billing') body.innerHTML=buildSettingsBilling();
  else if(_settingsSection==='security') body.innerHTML=buildSettingsSecurity();
  else if(_settingsSection==='notifications') body.innerHTML=buildSettingsNotifications();
  else if(_settingsSection==='privacy'){ body.innerHTML=buildSettingsPrivacy(); _renderBlockedList(); loadBlocks().then(_renderBlockedList); }
  else if(_settingsSection==='data') body.innerHTML=buildSettingsData();
}

function buildSettingsBilling(){
  const tier=subTierLabel();
  const isFreePlan=SUB.tier==='free'&&!isOnTrial();
  // Coerce startDate from any form (ms timestamp, ISO string, or Firestore Timestamp) to ms — avoids "Invalid Date".
  const _subStartMs=SUB.startDate?(typeof SUB.startDate==='number'?SUB.startDate:(SUB.startDate.seconds?SUB.startDate.seconds*1000:new Date(SUB.startDate).getTime())):NaN;
  const nextBilling=!isNaN(_subStartMs)?new Date(_subStartMs+(SUB.billingCycle==='annual'?365:30)*86400000).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'—';
  const trialEnd=isOnTrial()?new Date(SUB.trialEnd).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):null;
  const planColor=SUB.tier==='elite'?'var(--pur)':SUB.tier==='cram'?'var(--ind)':isOnTrial()?'var(--tea)':SUB.tier==='pro'?'var(--ora)':'var(--mut)';

  return`
<!-- Current Plan -->
<div style="background:${isFreePlan?'var(--surf2)':'linear-gradient(135deg,'+planColor+'18,'+planColor+'08)'};border:2px solid ${isFreePlan?'var(--bdr)':planColor};border-radius:14px;padding:18px 20px;margin-bottom:20px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
    <div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-bottom:3px">Current Plan</div>
      <div style="font-size:22px;font-weight:900;color:${planColor}">${tier}</div>
    </div>
    ${!isFreePlan?`<span class="pro-plan-badge ${subTierClass()}" style="font-size:11px;padding:4px 12px">Active</span>`:''}
  </div>
  ${isOnTrial()?`<div style="font-size:12px;color:var(--tea);font-weight:600;margin-bottom:4px">Trial ends ${trialEnd} — ${getTrialDaysLeft()} days left</div>`:''}
  ${SUB.cancelAtPeriodEnd?`<div style="font-size:12px;color:var(--amb);font-weight:600">${ico('warning')} Cancels ${SUB.cancelAt?new Date(SUB.cancelAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'at end of billing period'} — you keep access until then</div>`
    :!isFreePlan&&SUB.billingCycle!=='one_time'?`<div style="font-size:12px;color:var(--mut)">Next billing: <strong style="color:var(--sub)">${nextBilling}</strong></div>`:''}
  ${SUB.billingCycle==='one_time'?`<div style="font-size:12px;color:var(--mut)">One-time purchase · expires ${new Date((SUB.startDate||Date.now())+183*86400000).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>`:''}
  ${isFreePlan?`<div style="font-size:12px;color:var(--mut)">You're on the Free plan. Upgrade to unlock Pro features.</div>`:''}
</div>

<!-- Actions -->
${isFreePlan?`
<button class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:10px;font-size:14px;padding:13px" onclick="closeAppSettings();openUpgradeModal(null)">Upgrade to Pro — 7-Day Free Trial</button>
`:isOnTrial()?`
<div style="background:var(--tea-bg);border:1px solid rgba(20,184,166,.3);border-radius:10px;padding:14px 16px;margin-bottom:14px">
  <div style="font-size:13px;font-weight:700;color:var(--tea);margin-bottom:4px">Your trial ends in ${getTrialDaysLeft()} days</div>
  <div style="font-size:12px;color:var(--sub);margin-bottom:12px">After your trial, Pro is $14/month, or $132/year on the annual plan, and renews automatically until you cancel. Add a payment method to keep Pro, or do nothing and you'll move to the Free plan.</div>
  <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="redirectToStripeCheckout('pro_monthly')">Add Payment Method</button>
</div>
`:`
<div id="manage-sub-section">
  <button onclick="showManageSubMenu()" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;cursor:pointer;margin-bottom:10px;font-size:13px;font-weight:600;color:var(--txt);transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s" onmouseover="this.style.borderColor='var(--ind)'" onmouseout="this.style.borderColor='var(--bdr)'">
    <span style="font-size:18px">${ico('creditCard')}</span>
    <div style="text-align:left;flex:1">
      <div style="font-weight:700">Manage Subscription</div>
      <div style="font-size:11px;color:var(--mut)">Payment method · invoices · plan changes</div>
    </div>
    <span style="font-size:12px;color:var(--ind)">›</span>
  </button>
</div>
<div id="cancel-sub-section">
  ${SUB.cancelAtPeriodEnd?`
  <button id="reactivate-btn" onclick="reactivateSubscription()" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:var(--grn-bg);border:1.5px solid var(--grn);border-radius:10px;cursor:pointer;margin-bottom:10px;font-size:13px;font-weight:700;color:var(--grn);transition:all .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
    <span style="font-size:18px">${LedgerIcon('check')}</span>
    <div style="text-align:left;flex:1">
      <div style="font-weight:700">Reactivate Subscription</div>
      <div style="font-size:11px;color:var(--mut);font-weight:400">Resume your plan — cancellation will be reversed</div>
    </div>
    <span style="font-size:12px;color:var(--grn)">›</span>
  </button>`:`
  <button onclick="showCancelConfirm()" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:transparent;border:1px solid var(--bdr);border-radius:10px;cursor:pointer;margin-bottom:10px;font-size:13px;font-weight:600;color:#ef4444;transition:all .15s" onmouseover="this.style.background='#fef2f2';this.style.borderColor='#ef4444'" onmouseout="this.style.background='transparent';this.style.borderColor='var(--bdr)'">
    <span style="font-size:18px">${LedgerIcon('x')}</span>
    <div style="text-align:left;flex:1">
      <div style="font-weight:700">Cancel Subscription</div>
      <div style="font-size:11px;color:var(--mut)">End your plan at the current billing period</div>
    </div>
  </button>`}
</div>
`}

<!-- Plan comparison mini -->
<div style="height:1px;background:var(--bdr);margin:16px 0"></div>
<div class="section-title">All Plans</div>
${[
  {name:'Free',price:'$0',desc:'Timer, feed, 1 club, basic achievements, limited MCQ',active:isFreePlan,color:'var(--mut)',action:isFreePlan?null:'downgrade'},
  {name:'Pro',price:'$14/mo',desc:'Everything: unlimited AI question bank, Ledger AI coach (100 answers/mo), AI Study Plan, advanced analytics, exam protocol, study partner, unlimited clubs and shields, data export. $132/yr billed annually.',active:SUB.tier==='pro'||SUB.tier==='elite'||isOnTrial(),color:'var(--ora)',action:(SUB.tier==='pro'||SUB.tier==='elite')?null:'upgrade_pro'},
  {name:'6-Month Exam Window Pass','price':'$75 once',desc:'Six months of everything in Pro, paid once — no subscription, no auto-renew',active:SUB.tier==='cram',color:'var(--ind)',action:SUB.tier==='cram'?null:'upgrade_cram'},
].map(p=>'<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:'+(p.active?p.color+'14':'var(--surf2)')+';border:1.5px solid '+(p.active?p.color:'var(--bdr)')+';border-radius:10px;margin-bottom:8px">'+'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:'+(p.active?p.color:'var(--txt)')+'">'+p.name+'<span style="font-size:11px;color:var(--mut);font-weight:500;margin-left:8px">'+p.price+'</span></div><div style="font-size:11px;color:var(--mut);margin-top:2px">'+p.desc+'</div></div>'+(p.active?'<span style="font-size:10px;font-weight:800;color:'+p.color+'">✓ CURRENT</span>':'<button class="btn btn-ghost btn-xs" onclick="closeAppSettings();openUpgradeModal(null)">View</button>')+'</div>').join('')}

<!-- Beta tier switcher -->
${!STRIPE_ENABLED||STRIPE_CONFIG.paymentLinks.pro_monthly.includes('REPLACE')?`
<div style="margin-top:8px;padding:14px 16px;background:var(--ind-bg);border:1.5px dashed rgba(99,102,241,.4);border-radius:10px">
  <div style="font-size:12px;font-weight:700;color:var(--ind);margin-bottom:10px">Beta Mode — Switch Tier Freely</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    ${['free','pro','elite','cram'].map(t=>'<button onclick="activatePlan(\''+t+'\');buildSettingsBilling&&renderAppSettingsSection()" style="padding:6px 14px;background:'+(SUB.tier===t||isOnTrial()&&t==='pro'?'var(--ind)':'var(--surf2)')+';color:'+(SUB.tier===t||isOnTrial()&&t==='pro'?'#fff':'var(--txt)')+';border:1.5px solid '+(SUB.tier===t||isOnTrial()&&t==='pro'?'var(--ind)':'var(--bdr)')+';border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">'+t.charAt(0).toUpperCase()+t.slice(1)+'</button>').join('')}
  </div>
  <div style="font-size:10px;color:var(--mut);margin-top:8px">Billing is disabled until Stripe keys are configured. Use this to test all feature tiers.</div>
</div>
`:''}

<!-- Payment & security note -->
<div style="margin-top:12px;padding:12px 14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;font-size:11px;color:var(--mut);line-height:1.7">
  ${ico('lock')} Payments processed securely by <strong>Stripe</strong>. Ledger never stores card details. Cancel anytime.
  ${!STRIPE_ENABLED||STRIPE_CONFIG.paymentLinks.pro_monthly.includes('REPLACE')?'<br>'+ico('warning')+' Billing is in beta mode — no charges will occur.':''}
</div>`;
}

function buildSettingsAccount(){
  return`
<!-- Connected account -->
<div style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--surf2);border:1px solid var(--bdr);border-radius:12px;margin-bottom:20px">
  <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#4285f4,#34a853);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:800;flex-shrink:0;overflow:hidden">
    ${S?.profilePic?`<img src="${S.profilePic}" alt="Your profile photo" style="width:100%;height:100%;object-fit:cover">`:(AUTH?.displayName||'?').charAt(0).toUpperCase()}
  </div>
  <div style="flex:1;min-width:0">
    <div style="font-size:14px;font-weight:700">${AUTH?.displayName||'Unknown'}</div>
    <div style="font-size:12px;color:var(--mut)">${AUTH?.email||''}</div>
    <div style="margin-top:4px;display:inline-flex;align-items:center;gap:5px;background:${AUTH?.method==='google'?'#e8f0fe':'var(--grn-bg)'};border:1px solid ${AUTH?.method==='google'?'#c5d8fb':'#a7f3d0'};border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700;color:${AUTH?.method==='google'?'#1a73e8':'var(--grn)'}">
      ${AUTH?.method==='google'?'<svg width="10" height="10" viewBox="0 0 24 24" style="flex-shrink:0"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google Account':'✓ Email Account'}
    </div>
  </div>
  <button class="btn btn-ghost btn-sm" onclick="closeAppSettings();openEditProfile()">Edit Profile</button>
</div>

<div class="section-title">Linked Accounts</div>
${buildLinkedAccountsRow('google','Google','#4285f4','G')}
${buildLinkedAccountsRow('facebook','Facebook','#1877f2','f')}
${buildLinkedAccountsRow('linkedin','LinkedIn','#0077b5','in')}

<div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--bdr)">
  <div class="section-title" style="margin-bottom:10px">Study Goals</div>
  <button onclick="closeAppSettings();openHourGoalsModal()" style="display:flex;align-items:center;gap:12px;width:100%;padding:13px 16px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;cursor:pointer;margin-bottom:14px;font-size:13px;font-weight:600;color:var(--txt);text-align:left;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s" onmouseover="this.style.borderColor='var(--ora)'" onmouseout="this.style.borderColor='var(--bdr)'">
    <span style="font-size:20px">${ico('target')}</span>
    <div style="flex:1">
      <div style="font-weight:700">Customize Hour Goals</div>
      <div style="font-size:11px;color:var(--mut);margin-top:2px">Set target study hours per section to calibrate your Readiness Score</div>
    </div>
    <span style="font-size:12px;color:var(--ora)">→</span>
  </button>
</div>

<div style="margin-top:4px;padding-top:20px;border-top:1px solid var(--bdr)">
  <div class="section-title" style="margin-bottom:10px">Privacy</div>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:20px">${ico('lock')}</span>
      <div>
        <div style="font-size:13px;font-weight:700">Private Account</div>
        <div style="font-size:11px;color:var(--mut);margin-top:2px">Only approved followers can see your activity, progress, and followers/following lists</div>
      </div>
    </div>
    <label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0">
      <input type="checkbox" id="privacy-toggle" ${S?.isPrivate?'checked':''} onchange="toggleAccountPrivacy(this.checked)" style="opacity:0;width:0;height:0;position:absolute">
      <span id="privacy-toggle-track" style="position:absolute;cursor:pointer;inset:0;background:${S?.isPrivate?'var(--ind)':'var(--surf3)'};border-radius:24px;transition:background .2s">
        <span style="position:absolute;content:'';height:18px;width:18px;left:${S?.isPrivate?'21px':'3px'};bottom:3px;background:#fff;border-radius:50%;transition:left .2s;display:block"></span>
      </span>
    </label>
  </div>
  ${S?.followRequests?.length ? `<button onclick="closeAppSettings();openFollowRequestsModal()" style="display:flex;align-items:center;gap:12px;width:100%;padding:13px 16px;background:var(--ind-bg);border:1.5px solid rgba(99,102,241,.3);border-radius:10px;cursor:pointer;margin-bottom:14px;font-size:13px;font-weight:600;color:var(--txt);text-align:left">
    <span style="font-size:20px">${ico('user')}</span>
    <div style="flex:1">
      <div style="font-weight:700">Follow Requests</div>
      <div style="font-size:11px;color:var(--ind);margin-top:2px">${S.followRequests.length} pending request${S.followRequests.length!==1?'s':''}</div>
    </div>
    <span style="background:var(--ind);color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:20px">${S.followRequests.length}</span>
  </button>` : ''}
  <button onclick="closeAppSettings();signOut()" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;background:transparent;border:1px solid var(--bdr);border-radius:10px;cursor:pointer;color:var(--sub);font-size:13px;font-weight:600;text-align:left;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s" onmouseover="this.style.borderColor='var(--bdr2)';this.style.background='var(--surf2)'" onmouseout="this.style.borderColor='var(--bdr)';this.style.background='transparent'">
    <span style="font-size:16px">→</span> Sign Out
  </button>
</div>`;
}

function buildLinkedAccountsRow(platform, label, color, icon){
  const isLinked=(platform==='google'&&AUTH?.method==='google')||
    (platform==='linkedin'&&S?.social?.linkedin)||
    (platform==='facebook'&&S?.social?.facebook);
  const subtitle=platform==='google'?(AUTH?.method==='google'?AUTH.email:'Not connected'):
    (platform==='linkedin'?S?.social?.linkedin||'Not connected':S?.social?.facebook||'Not connected');
  return`<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surf2);border:1px solid ${isLinked?'var(--grn)':'var(--bdr)'};border-radius:10px;margin-bottom:8px">
    <div style="width:36px;height:36px;border-radius:9px;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:900;flex-shrink:0">${ico(icon)}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:700">${label}</div>
      <div style="font-size:11px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${isLinked?subtitle:'Not connected'}</div>
    </div>
    ${isLinked
      ?`<span style="font-size:11px;color:var(--grn);font-weight:700">✓ Connected</span>`
      :`<button class="btn btn-ghost btn-xs" onclick="handleLinkAccount('${platform}')">Connect</button>`}
  </div>`;
}

function handleLinkAccount(platform){
  if(platform==='google'){showToast('Already using Google sign-in','info');return;}
  if(platform==='linkedin'){closeAppSettings();openSocialModal('linkedin');return;}
  if(platform==='facebook'){closeAppSettings();openSocialModal('facebook');return;}
}

function buildSettingsSecurity(){
  const isGoogle=AUTH?.method==='google';
  return`
<div class="section-title">Password</div>
${isGoogle?`<div style="padding:12px 14px;background:var(--ind-bg);border:1px solid rgba(99,102,241,.2);border-radius:10px;font-size:12px;color:var(--ind);margin-bottom:16px">You're signed in with Google — password is managed through your Google account.</div>`:`
<div class="form-grp">
  <label>Current Password</label>
  <input id="sec-cur-pass" type="password" placeholder="Enter current password">
</div>
<div class="form-grp">
  <label>New Password</label>
  <input id="sec-new-pass" type="password" placeholder="Min. 8 characters">
</div>
<div class="form-grp">
  <label>Confirm New Password</label>
  <input id="sec-conf-pass" type="password" placeholder="Repeat new password">
</div>
<button class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:20px" onclick="changePassword()">Update Password</button>
<div style="height:1px;background:var(--bdr);margin-bottom:20px"></div>`}

<div class="section-title">Two-Factor Authentication</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;margin-bottom:8px">
  <div>
    <div style="font-size:13px;font-weight:700">Authenticator App (TOTP)</div>
    <div style="font-size:11px;color:var(--mut);margin-top:2px">Google Authenticator, Authy, or any TOTP app</div>
  </div>
  ${(()=>{const has2fa=!!localStorage.getItem('pf2-2fa-secret');return has2fa?'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;color:var(--grn);font-weight:700">● Enabled</span><button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="disable2FA()">Disable</button></div>':'<div style="display:flex;align-items:center;gap:10px"><span style="font-size:11px;color:var(--mut)">Not enabled</span><button class="btn btn-ghost btn-xs" onclick="open2FASetupModal()">Enable</button></div>';})()}
</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;margin-bottom:20px">
  <div>
    <div style="font-size:13px;font-weight:700">Login Alerts</div>
    <div style="font-size:11px;color:var(--mut);margin-top:2px">Get notified of new sign-ins</div>
  </div>
  <label style="display:flex;align-items:center;cursor:pointer">
    <input type="checkbox" id="sec-login-alerts" checked style="accent-color:var(--ind);width:15px;height:15px">
  </label>
</div>

<div class="section-title" style="color:var(--red)">Active Sessions</div>
<div style="padding:12px 14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;margin-bottom:8px">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div>
      <div style="font-size:13px;font-weight:700">This Device <span style="font-size:10px;color:var(--grn);font-weight:600;margin-left:6px">● Current</span></div>
      <div style="font-size:11px;color:var(--mut);margin-top:2px">${navigator.platform||'Browser'} · ${new Date().toLocaleDateString()}</div>
    </div>
    <span style="font-size:10px;color:var(--grn);font-weight:700">Active</span>
  </div>
</div>`;
}

async function changePassword(){
  const cur=document.getElementById('sec-cur-pass')?.value;
  const nw=document.getElementById('sec-new-pass')?.value;
  const cf=document.getElementById('sec-conf-pass')?.value;
  if(!cur||!nw||!cf){showToast('Fill in all password fields','err');return;}
  if(nw.length<8){showToast('New password must be at least 8 characters','err');return;}
  if(nw!==cf){showToast('Passwords do not match','err');return;}
  if(!AUTH)return;
  // Try Firebase first (real accounts)
  if(firebaseAuth?.currentUser&&AUTH?.email){
    try{
      const cred=firebase.auth.EmailAuthProvider.credential(AUTH.email,cur);
      await firebaseAuth.currentUser.reauthenticateWithCredential(cred);
      await firebaseAuth.currentUser.updatePassword(nw);
      showToast('Password updated successfully ✓','ok');
      document.getElementById('sec-cur-pass').value='';
      document.getElementById('sec-new-pass').value='';
      document.getElementById('sec-conf-pass').value='';
      return;
    }catch(e){
      if(e.code==='auth/wrong-password'||e.code==='auth/invalid-credential'){showToast('Current password is incorrect','err');}
      else{showToast('Could not update password. Try signing out and back in.','err');}
      return;
    }
  }
  // Demo mode fallback
  AUTH.passwordChanged=Date.now();
  saveAuth(AUTH);
  showToast('Password updated successfully ✓','ok');
  document.getElementById('sec-cur-pass').value='';
  document.getElementById('sec-new-pass').value='';
  document.getElementById('sec-conf-pass').value='';
}

function buildSettingsNotifications(){
  const prefs=S?.notifPrefs||{};
  const rows=[
    {id:'study_reminders',label:'Study Reminders',sub:'An evening nudge if you haven\'t studied, exam-eve reminders, and your Sunday recap',def:true},
    {id:'streak_alerts',label:'Streak Alerts',sub:'Warn you before your streak is about to break',def:true},
    {id:'crew_activity',label:'Crew Activity',sub:'When your study partner or people you follow log a session or open a study room',def:true},
    {id:'nudges',label:'Nudges',sub:'When a friend nudges you to study on a day you haven\u2019t yet',def:true},
    {id:'messages',label:'Direct Messages',sub:'When someone sends you a message',def:true},
    {id:'weekly_email',label:'Weekly Recap Email',sub:'Your week in one short email on Sunday evening',def:true},
    {id:'props_notifs',label:'Props & Comments',sub:'When someone gives you props or comments',def:true},
    {id:'club_messages',label:'Study Clubs',sub:'When someone adds you to a study club',def:true},
    {id:'achievements',label:'Achievements',sub:'When you unlock a new badge',def:true},
    {id:'leaderboard',label:'Followers',sub:'New followers, follow requests, and accepted requests',def:true},
  ];
  return`
<div class="section-title">Notifications</div>
${_pushStatusCard()}
<div class="section-title" style="margin-top:4px">What you hear about</div>
${rows.map(r=>`
<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--bdr)">
  <div style="flex:1;min-width:0;padding-right:16px">
    <div style="font-size:13px;font-weight:600">${r.label}</div>
    <div style="font-size:11px;color:var(--mut);margin-top:1px">${r.sub}</div>
  </div>
  <label style="display:flex;align-items:center;cursor:pointer;flex-shrink:0">
    <input type="checkbox" id="notif-${r.id}" aria-label="${r.label}" ${(prefs[r.id]!==undefined?prefs[r.id]:r.def)?'checked':''} style="accent-color:var(--ind);width:16px;height:16px">
  </label>
</div>`).join('')}
<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px" onclick="saveNotifPrefs()">Save Preferences</button>`;
}

function saveNotifPrefs(){
  if(!S.notifPrefs)S.notifPrefs={};
  Object.keys(NOTIF_PREF_DEFAULTS).forEach(id=>{
    const el=document.getElementById('notif-'+id);
    if(el)S.notifPrefs[id]=el.checked;
  });
  saveState();
  syncNotifyProfile();
  showToast('Notification preferences saved ✓','ok');
}

function buildSettingsPrivacy(){
  const prefs={...(S?.privacyPrefs||{}),public_profile:!(S&&S.isPrivate)};
  return`
<div class="section-title">Profile Visibility</div>
${[
  {id:'public_profile',label:'Public Profile',sub:'Off = private account: people must request to follow you',def:true},
  {id:'show_streak',label:'Show Study Streak',sub:'Publish your streak count to other users',def:true},
  {id:'show_hours',label:'Show Total Hours',sub:'Publish your total logged hours to other users',def:true},
  {id:'show_scores',label:'Share Exam Scores',sub:'Publish your logged exam results, including attempts you did not pass',def:false},
].map(r=>`
<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--bdr)">
  <div style="flex:1;min-width:0;padding-right:16px">
    <div style="font-size:13px;font-weight:600">${r.label}</div>
    <div style="font-size:11px;color:var(--mut);margin-top:1px">${r.sub}</div>
  </div>
  <label style="display:flex;align-items:center;cursor:pointer;flex-shrink:0">
    <input type="checkbox" id="priv-${r.id}" aria-label="${r.label}" ${(prefs[r.id]!==undefined?prefs[r.id]:r.def)?'checked':''} style="accent-color:var(--ind);width:16px;height:16px">
  </label>
</div>`).join('')}

<div class="section-title" style="margin-top:20px">Activity & Data Sharing</div>
${[
  {id:'appear_leaderboard',label:'Discoverable',sub:'Appear in search and suggestions for people who don\'t follow you yet',def:true},
  {id:'allow_messages',label:'Allow Direct Messages',sub:'Let other Ledger users message you',def:true},
  {id:'share_activity',label:'Share Activity to Feed',sub:'New sessions appear in followers\' feeds',def:true},
].map(r=>`
<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--bdr)">
  <div style="flex:1;min-width:0;padding-right:16px">
    <div style="font-size:13px;font-weight:600">${r.label}</div>
    <div style="font-size:11px;color:var(--mut);margin-top:1px">${r.sub}</div>
  </div>
  <label style="display:flex;align-items:center;cursor:pointer;flex-shrink:0">
    <input type="checkbox" id="priv-${r.id}" aria-label="${r.label}" ${(prefs[r.id]!==undefined?prefs[r.id]:r.def)?'checked':''} style="accent-color:var(--ind);width:16px;height:16px">
  </label>
</div>`).join('')}
<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px" onclick="savePrivacyPrefs()">Save Privacy Settings</button>

<div class="section-title" style="margin-top:24px">Blocked accounts</div>
<div style="font-size:11px;color:var(--mut);margin:-4px 0 6px">Blocked people can’t follow you, message you, or comment on or give props to your sessions.</div>
<div id="blocked-list"></div>

<div class="section-title" style="margin-top:24px">Cookies</div>
<div style="font-size:12px;color:var(--sub);line-height:1.6;margin:-4px 0 8px">Analytics cookies are <strong>${(()=>{try{return localStorage.getItem('ledger-cookie-consent')==='accepted'?'on':'off';}catch(e){return 'off';}})()}</strong>. <a href="/privacy#cookies" target="_blank" style="color:var(--ora);text-decoration:underline">Cookie policy</a></div>
<button class="btn btn-ghost" onclick="openCookieSettings()">Change cookie choice</button>`;
}

function savePrivacyPrefs(){
  if(!S.privacyPrefs)S.privacyPrefs={};
  ['public_profile','show_streak','show_hours','show_scores','appear_leaderboard','allow_messages','share_activity'].forEach(id=>{
    const el=document.getElementById('priv-'+id);
    if(el)S.privacyPrefs[id]=el.checked;
  });
  S.isPrivate=!S.privacyPrefs.public_profile; // one source of truth for "private account"
  saveState();
  writeUserProfile(); // apply immediately — these control what is published
  showToast('Privacy settings saved ✓','ok');
}

function buildSettingsData(){
  const actCount=(S?.activities||[]).length;
  const clubCount=(S?.clubs||[]).length;
  const totalHrs=getTotalHours();
  return`
<div class="section-title">Your Data</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px">
  ${[{v:actCount,l:'Sessions'},{v:Math.round(totalHrs)+'h',l:'Hours Logged'},{v:clubCount,l:'Clubs'}].map(s=>`<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--ora)">${s.v}</div><div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-top:3px">${s.l}</div></div>`).join('')}
</div>

<div class="section-title">Export</div>
<div style="font-size:12px;color:var(--mut);margin-bottom:20px">Need a copy of your data? <button onclick="exportData()" style="background:none;border:none;color:var(--ind);font-size:12px;cursor:pointer;padding:0;text-decoration:underline">Download as JSON</button></div>

<div class="section-title" style="margin-top:20px">App Preferences</div>
<button onclick="restartOnboarding()" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;cursor:pointer;margin-bottom:8px;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s" onmouseover="this.style.borderColor='var(--ind)'" onmouseout="this.style.borderColor='var(--bdr)'">
  <span style="display:flex;flex-shrink:0">${_ledgerMascotSVG(22)}</span>
  <div style="text-align:left">
    <div style="font-size:13px;font-weight:700;color:var(--txt)">Restart Tutorial</div>
    <div style="font-size:11px;color:var(--mut)">Have Ledger walk you through each section again</div>
  </div>
</button>
<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;margin-bottom:8px">
  <div>
    <div style="font-size:13px;font-weight:600">Dark Mode</div>
    <div style="font-size:11px;color:var(--mut)">Switch between light and dark theme</div>
  </div>
  <label style="display:flex;align-items:center;cursor:pointer">
    <input type="checkbox" ${isDark?'checked':''} onchange="toggleTheme()" style="accent-color:var(--ind);width:16px;height:16px">
  </label>
</div>

${isElite()?`
<div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--bdr)">
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:12px">
    <div class="section-title" style="margin-bottom:0">Pro</div>
    <span style="font-size:10px;font-weight:700;background:var(--pur-bg);color:var(--pur);border:1px solid rgba(147,51,234,.25);border-radius:20px;padding:2px 8px">Active</span>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <button onclick="openPrioritySupport()" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;background:transparent;border:1px solid var(--bdr);border-radius:10px;cursor:pointer;color:var(--txt);font-size:13px;font-weight:600;text-align:left">
      <span style="font-size:18px">${LedgerIcon('headset')}</span><div style="flex:1"><div>Priority Support</div><div style="font-size:11px;color:var(--mut);font-weight:400">Responses within 2 hours (business hours)</div></div><span style="color:var(--mut)">›</span>
    </button>
  </div>
</div>`:''}

<div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--bdr)">
  <div class="section-title">Feedback</div>
  <button onclick="openInAppReviewModal()" style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;cursor:pointer;margin-bottom:8px;transition:background-color .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s,opacity .15s" onmouseover="this.style.borderColor='var(--ora)'" onmouseout="this.style.borderColor='var(--bdr)'">
    <span style="font-size:18px">${ico('starFilled')}</span>
    <div style="text-align:left;flex:1">
      <div style="font-size:13px;font-weight:700;color:var(--txt)">Write a Review</div>
      <div style="font-size:11px;color:var(--mut)">Help other CPA candidates discover Ledger</div>
    </div>
    <span style="color:var(--mut);font-size:14px">›</span>
  </button>
</div>

<div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--bdr)">
  <div class="section-title" style="color:var(--red)">Danger Zone</div>
  <div style="padding:14px;background:var(--red-bg);border:1px solid ${isDark?'rgba(239,68,68,.3)':'#fecaca'};border-radius:10px">
    <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:4px">Delete Account</div>
    <div style="font-size:12px;color:var(--sub);margin-bottom:12px;line-height:1.6">Permanently delete your Ledger account and all associated data. This action <strong>cannot be undone</strong>.</div>
    <button onclick="confirmDeleteAccount()" style="padding:9px 18px;background:var(--red);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Delete My Account</button>
  </div>
</div>`;
}

function exportData(){
  const data={
    exportedAt:new Date().toISOString(),
    profile:{name:S.name,state:S.state,school:S.school,bio:S.bio,classYear:S.classYear},
    activities:S.activities||[],
    practiceScores:S.practiceScores||{},
    achievements:S.achievements||[],
    examDates:S.examDates||{},
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`ledger-export-${_ymd(new Date())}.json`;a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported ✓','ok');
}

async function confirmDeleteAccount(){
  const paid=SUB&&SUB.tier&&SUB.tier!=='free';
  const input=prompt((paid?'This also cancels your subscription right away, with no further charges.\n\n':'')+'Type DELETE to permanently delete your account and all data:');
  if(input===null) return;
  if(input!=='DELETE'){ showToast('Type DELETE exactly to confirm','err'); return; }
  clearTimeout(saveState._t); // a pending autosave must not re-create the docs we're about to delete
  clearInterval(window._socialSyncTimer);
  const user=firebaseAuth?.currentUser;
  if(user){
    const uid=user.uid, db=firebaseDb;
    // Firebase only allows deleting an account shortly after signing in. Check
    // that FIRST so we never wipe someone's data and then fail to remove the login.
    try{ await user.getIdToken(true); }catch(e){}
    const lastLogin=Date.parse(user.metadata?.lastSignInTime||'')||0;
    if(Date.now()-lastLogin > 4.5*60*1000){
      showToast('For your security, sign out and sign back in, then delete your account right away.','err');
      return;
    }
    // A paid subscription must end before the account does, or Stripe would
    // keep charging a card that belongs to an account that no longer exists.
    if(SUB&&SUB.tier&&SUB.tier!=='free'&&STRIPE_ENABLED){
      try{
        const tok=await user.getIdToken();
        const r=await fetch('/api/cancel-subscription',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},body:JSON.stringify({immediately:true})});
        if(!r.ok&&r.status!==400&&r.status!==404) throw new Error('cancel '+r.status);
      }catch(e){
        showToast('We couldn’t cancel your subscription, so your account wasn’t deleted. Try again, or email support@ledgercpa.app.','err');
        return;
      }
    }
    if(db){
      const del=ref=>ref.delete().catch(()=>{});
      const delAll=async q=>{ try{ const sn=await q.get(); await Promise.all(sn.docs.map(d=>del(d.ref))); }catch(e){} };
      try{
        const me=db.collection('users').doc(uid);
        // What I published about myself under other people's profiles and clubs
        await Promise.all((S?.following||[]).filter(id=>id&&id.length>4).map(t=>del(db.collection('users').doc(t).collection('followers').doc(uid))));
        await Promise.all((S?.pendingRequests||[]).filter(id=>id&&id.length>4).map(t=>del(db.collection('users').doc(t).collection('followRequests').doc(uid))));
        await Promise.all((S?.clubs||[]).filter(c=>!c.isDM).map(async c=>{
          const cref=db.collection('clubs').doc(c.id);
          await del(cref.collection('members').doc(uid));
          await del(cref.collection('presence').doc(uid));
          const upd={memberCount:firebase.firestore.FieldValue.increment(-1)};
          if(!c.isCohort&&!c.isPublic) upd.members=firebase.firestore.FieldValue.arrayRemove(uid);
          await cref.set(upd,{merge:true}).catch(()=>{});
        }));
        // Everything stored under my own profile, then the profile and private state
        await delAll(me.collection('followers'));
        await delAll(me.collection('followRequests'));
        await delAll(me.collection('comments'));
        await delAll(me.collection('blocks'));
        await delAll(me.collection('props'));
        await del(db.collection('userState').doc(uid));
        await del(db.collection('notify').doc(uid)); // push tokens + reminder profile
        await del(me);
      }catch(e){ console.warn('[Ledger] account data cleanup:',e.code||e.message); }
    }
    try{ await user.delete(); }
    catch(e){
      showToast(e.code==='auth/requires-recent-login'
        ?'Your data was removed, but the login could not be deleted. Sign in again and repeat this step.'
        :'Could not delete the login: '+(e.message||e.code),'err');
      if(e.code!=='auth/requires-recent-login') return;
    }
  }
  clearAuth();
  localStorage.clear();
  AUTH=null;S=null;
  showToast('Account deleted.','info');
  setTimeout(()=>location.reload(),800);
}

function closeAppSettings(){ const el=document.getElementById('app-settings-modal'); if(el) el.style.display='none'; _syncModalLock(); }


function confirmReset(){
  if(confirm('Reset ALL study data? Your account will remain but all sessions, scores, and progress will be deleted. This cannot be undone.')){
    const saved={...S,activities:[],practiceScores:{},achievements:[],propsGiven:0,clubs:[],clubMessages:{}};
    S=saved;saveState();
    closeAppSettings();
    showToast('Study data reset','info');
    renderApp();
  }
}

// ═══════════════════════════════════════════════
// MOBILE BOTTOM NAV
// ═══════════════════════════════════════════════
function injectMobileNav(){
  if(document.getElementById('mobile-nav'))return;
  const tabs=[
    {id:'today',icon:'sunrise',label:'Today'},
    {id:'feed',icon:'◈',label:'Feed'},
    {id:'studylab',icon:'⬡',label:'Lab'},
    {id:'dashboard',icon:'▦',label:'Dash'},
    {id:'more',icon:'···',label:'More',isMore:true}
  ];
  const nav=document.createElement('nav');
  nav.id='mobile-nav';
  nav.className='mob-nav';
  nav.innerHTML=`<div class="mob-nav-inner">${tabs.map(t=>`<button class="mob-nav-btn${currentTab===t.id?' active':''}" onclick="${t.isMore?'openMobileMoreSheet()':'switchTab(\''+t.id+'\')'}" data-mnav="${t.id}"><span class="mob-nav-icon">${ico(t.icon)}</span>${t.label}</button>`).join('')}</div>`;
  document.body.appendChild(nav);
  if(!document.getElementById('session-fab')){
    const fab=document.createElement('button');
    fab.id='session-fab';
    fab.className='session-fab';
    fab.title='Start Session';
    fab.innerHTML='▶';
    fab.addEventListener('click',openSessionModal);
    document.body.appendChild(fab);
  }
  // Inject more sheet
  if(!document.getElementById('mob-more-sheet')){
    const sheet=document.createElement('div');
    sheet.id='mob-more-sheet';
    sheet.className='mob-more-sheet';
    sheet.innerHTML=`
<div class="mob-more-backdrop" onclick="closeMobileMoreSheet()"></div>
<div class="mob-more-drawer">
  <div class="mob-more-header">
    <div style="width:30px"></div>
    <div class="mob-more-handle"></div>
    <button class="mob-more-close" onclick="closeMobileMoreSheet()">✕</button>
  </div>
  <button class="mob-more-row" onclick="closeMobileMoreSheet();switchTab('profile')">
    <div class="mob-more-icon" style="background:var(--ind-bg);color:var(--ind)">◉</div>
    <div class="mob-more-text">
      <div class="mob-more-label">Profile</div>
      <div class="mob-more-sub">Your sessions, streak &amp; achievements</div>
    </div>
    <span class="mob-more-chev">›</span>
  </button>
  <button class="mob-more-row" onclick="closeMobileMoreSheet();openMessagesPage()">
    <div class="mob-more-icon" style="background:var(--aud-bg);color:var(--aud)">${ico('chat')}</div>
    <div class="mob-more-text">
      <div class="mob-more-label">Messages</div>
      <div class="mob-more-sub">Study groups &amp; direct messages</div>
    </div>
    <span class="mob-more-chev">›</span>
  </button>
  <button class="mob-more-row" onclick="closeMobileMoreSheet();switchTab('plan')">
    <div class="mob-more-icon" style="background:var(--ora-bg);color:var(--ora)">${ico('calendarDays')}</div>
    <div class="mob-more-text">
      <div class="mob-more-label">Study Plan</div>
      <div class="mob-more-sub">AI-generated day-by-day calendar</div>
    </div>
    <span class="mob-more-chev">›</span>
  </button>
  <button class="mob-more-row" onclick="closeMobileMoreSheet();switchTab('explore')">
    <div class="mob-more-icon" style="background:var(--pur-bg);color:var(--pur)">${ico('compass')}</div>
    <div class="mob-more-text">
      <div class="mob-more-label">Explore</div>
      <div class="mob-more-sub">Find candidates, clubs &amp; leaderboards</div>
    </div>
    <span class="mob-more-chev">›</span>
  </button>
  <button class="mob-more-row" onclick="closeMobileMoreSheet();openNotificationCenter()">
    <div class="mob-more-icon" style="background:var(--amb-bg);color:var(--amb)">${ico('bell')}</div>
    <div class="mob-more-text">
      <div class="mob-more-label">Notifications</div>
      <div class="mob-more-sub">Activity &amp; alerts</div>
    </div>
    <span class="mob-more-chev">›</span>
  </button>
  <button class="mob-more-row" onclick="closeMobileMoreSheet();openAppSettings()">
    <div class="mob-more-icon" style="background:var(--grn-bg);color:var(--grn)">${ico('gear')}</div>
    <div class="mob-more-text">
      <div class="mob-more-label">Settings</div>
      <div class="mob-more-sub">Account, plan &amp; preferences</div>
    </div>
    <span class="mob-more-chev">›</span>
  </button>
</div>`;
    document.body.appendChild(sheet);
  }
}
injectMobileNav();
// injectAskBubble() runs at the end of ask-ledger.js, which defines it.

function openMobileMoreSheet(){
  const sheet=document.getElementById('mob-more-sheet');
  if(!sheet)return;
  sheet.classList.add('open');
  // mark more button active
  document.querySelectorAll('[data-mnav]').forEach(b=>b.classList.toggle('active',b.dataset.mnav==='more'));
}
function closeMobileMoreSheet(){
  const sheet=document.getElementById('mob-more-sheet');
  if(!sheet)return;
  sheet.classList.remove('open');
  // restore correct active tab
  document.querySelectorAll('[data-mnav]').forEach(b=>b.classList.toggle('active',b.dataset.mnav===currentTab));
}

