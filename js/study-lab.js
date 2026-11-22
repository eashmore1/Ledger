// ═══════════════════════════════════════════════
// AI FLASHCARDS + AUTO-GENERATED QUIZZES
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// STUDY LAB
// ═══════════════════════════════════════════════
let _studyLabTab = 'qbank'; // 'qbank' | 'tools' | 'coach'
// Study Tools (flashcard/quiz generator) state
let _fc = {
  cards:[], current:0, flipped:false, mode:'flashcard',
  quizQ:[], quizCur:0, quizSel:null, quizAns:false, quizScore:0,
  summaryText:'', lastInput:'', generating:false,
  view:'generate', // 'generate' | 'decks'
  activeDeckId:null,
  genCount:15, genType:'mixed', // 'mixed'|'definitions'|'rules'|'applied'
  quizMissed:[], error:null, pdfStatus:null
};
const FC_MAX_INPUT=15000;  // characters of material sent to the AI
const FC_MIN_INPUT=80;     // below this there is nothing to study from
const FC_QUIZ_MAX=15;

let _fcDecks=null;

function _fcGetDecks(){if(!_fcDecks){try{_fcDecks=JSON.parse(localStorage.getItem('ledger_fc_decks')||'{}');}catch(e){_fcDecks={};}}return _fcDecks;}
function _fcSaveDecks(){try{localStorage.setItem('ledger_fc_decks',JSON.stringify(_fcDecks||{}));}catch(e){}}

// ── Get current user's Firebase ID token for server-side API auth ─────────────
async function _getAuthToken(){
  try{ return await (firebaseAuth?.currentUser?.getIdToken())||''; }catch(e){ return ''; }
}

// ── Proxy all AI calls through /api/ask — the server holds the Anthropic key ──
async function _fcCallAI(userMsg,maxTok){
  const token=await _getAuthToken();
  const resp=await fetch('/api/ask',{
    method:'POST',
    headers:{'content-type':'application/json',...(token?{'authorization':'Bearer '+token}:{})},
    body:JSON.stringify({
      system:'You are an expert CPA exam tutor with deep knowledge of FAR, AUD, REG, BAR, ISC, and TCP. You create precise, exam-focused study material.',
      messages:[{role:'user',content:userMsg}],
      maxTokens:maxTok||4096
    })
  });
  if(!resp.ok){window._aiHealthy=false;const e=await resp.json().catch(()=>({}));throw new Error(e?.error||'API error '+resp.status);}
  const d=await resp.json();
  window._aiHealthy=true;
  return d.text||'';
}
// Parse a JSON array from an AI reply. Tolerates code fences and prose around
// the array, and salvages the complete objects from a reply cut off mid-array.
function _fcParseJSON(t){
  if(!t) return null;
  t=String(t).replace(/```(?:json)?/gi,'').trim();
  const s=t.indexOf('[');
  if(s<0){ try{ return JSON.parse(t); }catch(e){ return null; } }
  const e=t.lastIndexOf(']');
  if(e>s){ try{ return JSON.parse(t.slice(s,e+1)); }catch(err){} }
  const out=[]; let depth=0,start=-1,inStr=false,escp=false;
  for(let i=s+1;i<t.length;i++){
    const c=t[i];
    if(inStr){ if(escp) escp=false; else if(c==='\\') escp=true; else if(c==='"') inStr=false; continue; }
    if(c==='"'){ inStr=true; continue; }
    if(c==='{'){ if(depth===0) start=i; depth++; }
    else if(c==='}'&&depth>0){ depth--; if(depth===0&&start>=0){ try{ out.push(JSON.parse(t.slice(start,i+1))); }catch(err){} start=-1; } }
  }
  return out.length?out:null;
}

function openStudyLabTab(tab) { openSubTab('studylab', tab); }

function buildStudyLab() {
  const sub = _curSub('studylab');
  _studyLabTab = sub;
  const body = sub === 'tools' ? _buildStudyToolsPanel() : sub === 'coach' ? _buildCoachPanel() : _buildQBankPanel();
  return '<div style="max-width:960px;margin:0 auto">' +
    '<div class="page-head"><div style="min-width:0">' +
      '<h1>Study Lab</h1>' +
      '<p>Everything you need to actively study: practice questions, AI study tools, and your personal coach.</p>' +
    '</div></div>' +
    _subTabsHTML('studylab') +
    _subPanel('studylab', body) +
  '</div>';
}

// ─── Question Bank panel (full-width in Study Lab) ───────────────────────────
function _buildQBankPanel() {
  S.qbProgress = S.qbProgress || {};
  const pro = isPro();
  let totalDone = 0, graded = 0, correct = 0, totalQ = 0;

  const cards = QB_SECTIONS.map(function(sec) {
    const p = S.qbProgress[sec.code] || {};
    const done = p.mcqDone || 0;
    totalDone += done; graded += p.graded || 0; correct += p.correct || 0; totalQ += sec.mcqTotal;
    const pct = Math.min(100, Math.round(done / sec.mcqTotal * 100));
    const acc = p.graded ? Math.round(p.correct / p.graded * 100) + '% correct' : (done ? '' : 'Not started');
    return '<button type="button" class="qb-card" style="' + _qbVars(sec.code) + '" onclick="openQBSection(\'' + sec.code + '\')">' +
      '<div class="qb-card-top"><span class="qb-chip">' + sec.code + '</span>' +
        (pro ? '' : '<span class="qb-pro" style="margin-left:2px;color:var(--sub);background:var(--surf2)">5 FREE</span>') +
        '<span class="qb-card-go">' + ico('arrow') + '</span></div>' +
      '<div class="qb-card-name">' + sec.full + '</div>' +
      '<div><div class="qb-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="qb-card-foot"><span><b>' + done.toLocaleString() + '</b> of ' + sec.mcqTotal.toLocaleString() + '</span><span>' + acc + '</span></div></div>' +
    '</button>';
  }).join('');

  const summary =
    '<div class="qb-sum">' +
      '<div><div class="qb-sum-v">' + totalDone.toLocaleString() + '</div><div class="qb-sum-l">Answered</div></div>' +
      '<div><div class="qb-sum-v">' + (graded ? Math.round(correct / graded * 100) + '%' : '—') + '</div><div class="qb-sum-l">Accuracy</div></div>' +
      '<div><div class="qb-sum-v">' + totalQ.toLocaleString() + '</div><div class="qb-sum-l">In the bank</div></div>' +
    '</div>';

  const upsell = pro ? '' :
    '<div class="qb-upsell" onclick="openUpgradeModal(\'Full Question Bank\')">' +
      '<span style="font-size:22px;color:var(--ora);flex-shrink:0">' + ico('unlock') + '</span>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:13px;font-weight:800;color:var(--ora)">Unlock every question</div>' +
        '<div style="font-size:12px;color:var(--sub);margin-top:2px">Pro opens the full bank, topic drills, timed sets and random quizzes.</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openUpgradeModal(\'Full Question Bank\')">Upgrade</button>' +
    '</div>';

  return summary + upsell +
    '<div class="qb-grid">' + cards + '</div>' +
    '<div class="qb-disc">These are original practice questions written by Ledger with AI help. They are not official AICPA questions, and Ledger is not affiliated with the AICPA, NASBA or any review course. Use them alongside your review course, not instead of it.</div>';
}

// ─── Study Tools panel (AI flashcards/quizzes/summaries) ─────────────────────
function _buildStudyToolsPanel(){
  const hasCards=_fc.cards.length>0;
  const hasQuiz=_fc.quizQ.length>0;
  const hasSummary=!!_fc.summaryText;
  if(!isPro()&&!hasCards&&!hasQuiz&&!hasSummary){
    return `<div class="fc-grid">
      <div class="card card-pad">
        <div style="font-size:15px;font-weight:800;margin-bottom:4px">AI Study Tools</div>
        <div style="font-size:12px;color:var(--mut);margin-bottom:14px">Paste any CPA prep material and Ledger turns it into flashcards, a practice quiz, or a study summary.</div>
        <textarea disabled aria-label="Study material (Pro)" placeholder="Upgrade to Pro to unlock AI Study Tools" style="width:100%;min-height:120px;padding:12px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;color:var(--mut);font-size:12px;resize:none;opacity:.5;box-sizing:border-box"></textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;opacity:.4;pointer-events:none">
          <button class="btn btn-primary" style="justify-content:center" disabled>Flashcards</button>
          <button class="btn btn-ind" style="justify-content:center" disabled>Quiz</button>
          <button class="btn btn-ghost" style="justify-content:center" disabled>Summary</button>
        </div>
      </div>
      <div class="card card-pad" style="text-align:center;padding:40px 24px">
        <div style="font-size:40px;margin-bottom:14px">${ico('bolt')}</div>
        <div style="font-size:15px;font-weight:800;margin-bottom:8px">Unlock AI Study Tools</div>
        <div style="font-size:12px;color:var(--sub);line-height:1.7;margin-bottom:20px">Paste your Becker, Gleim or Roger notes, or upload a PDF, and get exam-focused flashcards, quizzes and summaries in seconds.</div>
        <button class="btn btn-primary" style="font-size:13px;padding:11px 28px;margin:0 auto" onclick="openUpgradeModal('AI Study Tools')">Start Free Trial →</button>
        <div style="font-size:10px;color:var(--mut);margin-top:8px">7 days free · Cancel anytime</div>
      </div>
    </div>`;
  }

  if(_fc.view==='decks') return _buildDecksView();

  const decks=_fcGetDecks();
  const deckCount=Object.keys(decks).length;
  if(!isElite()) setTimeout(_loadFlashcardUsage,0); // refresh the monthly-limit counter after render

  const tabBar=`<div role="tablist" style="display:flex;gap:0;border-bottom:2px solid var(--bdr);margin-bottom:16px">
    <button role="tab" aria-selected="true" onclick="_fc.view='generate';_fcRender()" style="padding:9px 18px;border:none;background:transparent;font-size:13px;font-weight:800;cursor:pointer;border-bottom:2px solid var(--ind);color:var(--ind);margin-bottom:-2px">Generate</button>
    <button role="tab" aria-selected="false" onclick="_fc.view='decks';_fcRender()" style="padding:9px 18px;border:none;background:transparent;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;color:var(--mut);margin-bottom:-2px">My Decks${deckCount?` <span style="background:var(--ind);color:#fff;border-radius:20px;padding:1px 7px;font-size:10px">${deckCount}</span>`:''}</button>
  </div>`;

  const busy=!!_fc.generating;
  const genOptions=`<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
    <div style="flex:1;min-width:120px">
      <label for="fc-count" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);display:block;margin-bottom:5px">How many</label>
      <div style="display:flex;align-items:center;gap:7px">
        <input type="range" id="fc-count" min="5" max="30" step="5" value="${_fc.genCount}" oninput="document.getElementById('fc-count-lbl').textContent=this.value;_fc.genCount=parseInt(this.value,10)" style="flex:1;accent-color:var(--ind)">
        <span id="fc-count-lbl" style="font-size:14px;font-weight:900;color:var(--ind);min-width:22px">${_fc.genCount}</span>
      </div>
      <div style="font-size:10px;color:var(--mut);margin-top:3px">Quizzes max out at ${FC_QUIZ_MAX} questions</div>
    </div>
    <div style="flex:1;min-width:130px">
      <label for="fc-type" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);display:block;margin-bottom:5px">Flashcard focus</label>
      <select id="fc-type" onchange="_fc.genType=this.value" style="width:100%;padding:7px 9px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-size:12px;outline:none">
        <option value="mixed"${_fc.genType==='mixed'?' selected':''}>Mixed (recommended)</option>
        <option value="definitions"${_fc.genType==='definitions'?' selected':''}>Definitions</option>
        <option value="rules"${_fc.genType==='rules'?' selected':''}>Rules &amp; Requirements</option>
        <option value="applied"${_fc.genType==='applied'?' selected':''}>Applied Scenarios</option>
      </select>
    </div>
  </div>`;

  const spin='<span aria-hidden="true" style="animation:spin 1s linear infinite;display:inline-block;margin-right:5px">⟳</span>';
  const btnLabel=(t,l)=>_fc.generating===t?spin+'Working…':l;
  const verb={flashcard:'flashcards',quiz:'quiz',summary:'summary'};
  const status=busy
    ? `<div id="fc-gen-status" role="status" style="margin-top:10px;padding:10px 12px;background:var(--ind-bg);border-radius:8px;font-size:12px;font-weight:600;color:var(--ind)">${spin}Writing your ${verb[_fc.generating]||'material'}. This usually takes 10–30 seconds.</div>`
    : _fc.error
      ? `<div id="fc-gen-status" role="alert" style="margin-top:10px;padding:10px 12px;background:var(--red-bg);border:1px solid var(--red);border-radius:8px;font-size:12px;color:var(--red);display:flex;align-items:center;gap:10px"><span style="flex:1;font-weight:600">${esc(_fc.error.msg)}</span><button class="btn btn-ghost btn-xs" onclick="fcGenerate('${_fc.error.type}')">Try again</button></div>`
      : '';

  const len=(_fc.lastInput||'').length;
  const leftPanel=`<div>
    ${tabBar}
    <div class="card card-pad" style="margin-bottom:12px">
      <div style="font-size:15px;font-weight:800;margin-bottom:4px">Generate Study Material</div>
      <div style="font-size:11px;color:var(--mut);margin-bottom:12px">Paste lecture notes, standards text, MCQ explanations or your own notes, or load a PDF.</div>
      ${genOptions}
      <textarea id="fc-input-text" aria-label="Study material" ${busy?'readonly':''} oninput="_fc.lastInput=this.value;_fcUpdateCharCount()" placeholder="Paste your CPA study material here…&#10;&#10;Works great with:&#10;• Becker / Gleim / Roger lecture notes&#10;• AICPA or FASB standards text&#10;• MCQ answer explanations&#10;• Chapter outlines&#10;• Your own notes"
        style="width:100%;min-height:180px;padding:12px;background:var(--surf2);border:1.5px solid var(--bdr);border-radius:10px;color:var(--txt);font-size:12px;line-height:1.65;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box"
        onfocus="this.style.borderColor='var(--ind)'" onblur="this.style.borderColor='var(--bdr)'">${esc(_fc.lastInput||'')}</textarea>
      <div style="display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('fc-pdf-input').click()" ${busy?'disabled':''}>Load PDF</button>
        <input id="fc-pdf-input" type="file" accept=".pdf,application/pdf" style="display:none" onchange="fcLoadPdf(this)">
        ${len?`<button class="btn btn-ghost btn-xs" onclick="fcClearInput()" ${busy?'disabled':''}>Clear</button>`:''}
        <span id="fc-char-count" style="margin-left:auto;font-size:10px;color:${len>FC_MAX_INPUT?'var(--amb)':'var(--mut)'}">${_fcCharCountText(len)}</span>
      </div>
      <div id="fc-pdf-status" role="status" style="${_fc.pdfStatus?'':'display:none;'}margin-top:6px;font-size:11px;font-weight:600;color:${_fc.pdfStatus&&_fc.pdfStatus.err?'var(--amb)':'var(--grn)'}">${_fc.pdfStatus?esc(_fc.pdfStatus.msg):''}</div>
      ${status}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
        <button class="btn btn-primary" style="justify-content:center" onclick="fcGenerate('flashcard')" ${busy?'disabled':''}>${btnLabel('flashcard','Flashcards')}</button>
        <button class="btn btn-ind" style="justify-content:center" onclick="fcGenerate('quiz')" ${busy?'disabled':''}>${btnLabel('quiz','Quiz')}</button>
        <button class="btn btn-ghost" style="justify-content:center" onclick="fcGenerate('summary')" ${busy?'disabled':''}>${btnLabel('summary','Summary')}</button>
      </div>
      ${!isElite()?`<div style="text-align:center;margin-top:10px;font-size:10px;color:var(--mut)"><span id="flashcard-usage-count">— AI generations left this month</span> · <span onclick="openUpgradeModal('Unlimited AI Study Tools')" style="color:var(--pur);font-weight:700;cursor:pointer">Pro = unlimited</span></div>`:''}
    </div>
  </div>`;

  // Output switcher, shown once more than one kind of output exists
  const outs=[hasCards&&['flashcard','Flashcards ('+_fc.cards.length+')'],hasQuiz&&['quiz','Quiz ('+_fc.quizQ.length+')'],hasSummary&&['summary','Summary']].filter(Boolean);
  if(outs.length&&!outs.some(o=>o[0]===_fc.mode)) _fc.mode=outs[0][0];
  const switcher=outs.length>1?`<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">${outs.map(o=>`<button onclick="_fc.mode='${o[0]}';_fcRender()" aria-pressed="${_fc.mode===o[0]}" style="padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid ${_fc.mode===o[0]?'var(--ind)':'var(--bdr)'};background:${_fc.mode===o[0]?'var(--ind-bg)':'transparent'};color:${_fc.mode===o[0]?'var(--ind)':'var(--mut)'}">${o[1]}</button>`).join('')}</div>`:'';

  const rightPanel=`<div>
    ${switcher}
    ${hasCards&&_fc.mode==='flashcard'?_buildFlashcardViewer():''}
    ${hasQuiz&&_fc.mode==='quiz'?_buildQuizViewer():''}
    ${hasSummary&&_fc.mode==='summary'?_buildSummaryViewer():''}
    ${hasCards&&_fc.mode==='flashcard'?`<div class="card card-pad" style="margin-top:12px">
      <label for="fc-save-name" style="font-size:12px;font-weight:700;margin-bottom:8px;display:block">${_fc.activeDeckId&&decks[_fc.activeDeckId]?'Saved as “'+esc(decks[_fc.activeDeckId].name)+'” · progress saves automatically':'Save deck'}</label>
      ${_fc.activeDeckId&&decks[_fc.activeDeckId]?'':`<div style="display:flex;gap:8px">
        <input id="fc-save-name" type="text" maxlength="80" placeholder="Deck name (e.g. FAR — Revenue Recognition)" onkeydown="if(event.key==='Enter')fcSaveDeck()" style="flex:1;min-width:0;padding:8px 11px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-size:12px;outline:none">
        <button class="btn btn-grn btn-sm" style="white-space:nowrap" onclick="fcSaveDeck()">Save →</button>
      </div>`}
    </div>`:''}
    ${!outs.length?`<div class="card card-pad" style="text-align:center;padding:48px 24px">
      <div style="font-size:48px;margin-bottom:16px;opacity:.18">${ico('bolt')}</div>
      <div style="font-size:15px;font-weight:800;margin-bottom:8px;color:var(--sub)">Ready to generate</div>
      <div style="font-size:12px;color:var(--mut);line-height:1.7">Paste your study material,<br>then choose <strong>Flashcards</strong>, <strong>Quiz</strong> or <strong>Summary</strong>.</div>
    </div>`:''}
  </div>`;

  return `<div class="fc-grid">${leftPanel}${rightPanel}</div>`;
}

function _buildDecksView(){
  const decks=_fcGetDecks();
  const deckArr=Object.values(decks).sort((a,b)=>b.created-a.created);
  const tabBar=`<div style="display:flex;gap:0;border-bottom:2px solid var(--bdr);margin-bottom:20px">
    <button onclick="_fc.view='generate';_fcRender()" style="padding:9px 18px;border:none;background:transparent;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;color:var(--mut);margin-bottom:-2px">Generate</button>
    <button onclick="_fc.view='decks';_fcRender()" style="padding:9px 18px;border:none;background:transparent;font-size:13px;font-weight:800;cursor:pointer;border-bottom:2px solid var(--ind);color:var(--ind);margin-bottom:-2px">My Decks <span style="background:var(--ind);color:#fff;border-radius:20px;padding:1px 7px;font-size:10px">${deckArr.length}</span></button>
  </div>`;
  if(!deckArr.length)return tabBar+`<div style="text-align:center;padding:60px 24px"><div style="font-size:48px;margin-bottom:16px;opacity:.2">${ico('book')}</div><div style="font-size:15px;font-weight:800;margin-bottom:8px;color:var(--sub)">No saved decks yet</div><div style="font-size:12px;color:var(--mut)">Generate flashcards and click "Save deck" to build your library.</div></div>`;
  return tabBar+`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">`+
    deckArr.map(d=>{
      const now=Date.now();
      const due=d.cards.filter(c=>(c.nextReview||0)<=now).length;
      const mastered=d.cards.filter(c=>(c.timesCorrect||0)>=3).length;
      const pct=d.cards.length?Math.round(mastered/d.cards.length*100):0;
      return `<div class="card card-pad" style="cursor:pointer" onclick="fcLoadDeck('${d.id}')">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
          <div style="flex:1;min-width:0">
            ${d.section?`<span class="badge badge-${d.section}" style="font-size:10px;margin-bottom:5px;display:inline-flex">${d.section}</span><br>`:''}
            <div style="font-size:13px;font-weight:800;line-height:1.3;margin-top:2px">${d.name}</div>
            <div style="font-size:10px;color:var(--mut);margin-top:2px">${d.cards.length} cards · ${new Date(d.created).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
          </div>
          <button onclick="event.stopPropagation();fcDeleteDeck('${d.id}')" style="background:transparent;border:none;cursor:pointer;font-size:16px;color:var(--mut);padding:0 4px;line-height:1">×</button>
        </div>
        <div style="height:4px;background:var(--surf3);border-radius:4px;margin-bottom:8px"><div style="height:100%;width:${pct}%;background:var(--grn);border-radius:4px"></div></div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:11px;color:var(--mut)">${mastered}/${d.cards.length} mastered</span>
          ${due>0?`<span style="font-size:11px;font-weight:700;color:var(--ora)">${due} due today</span>`:`<span style="font-size:11px;color:var(--grn)">✓ Up to date</span>`}
        </div>
      </div>`;
    }).join('')+'</div>';
}

// Re-render only the Study Tools panel, so the tab's fade-in doesn't replay on every
// click; the text box keeps its focus and cursor across the redraw.
function _fcRender(){
  if(currentTab!=='studylab') return;
  const sp=document.getElementById('subpanel-studylab');
  if(sp&&_curSub('studylab')==='tools'){
    const a=document.activeElement, keep=a&&a.id==='fc-input-text'?{s:a.selectionStart,e:a.selectionEnd}:null;
    sp.innerHTML=_buildStudyToolsPanel();
    if(keep){ const t=document.getElementById('fc-input-text'); if(t){ t.focus(); try{ t.setSelectionRange(keep.s,keep.e); }catch(e){} } }
    return;
  }
  const el=document.getElementById('page-content'); if(el) el.innerHTML=buildStudyLab();
}
// ─── AI Tools panel (Pro) ──────────────────────────────────────────────────


// ── Exam Day Protocol ──────────────────────────────────────────────────────
// Whole calendar days from today to a YYYY-MM-DD date, in the user's own time
// zone. (Parsing "YYYY-MM-DD 00:00:00" fails on Safari, and rounding hours
// was off by one late in the evening.)
function _edpDaysUntil(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || ''); if (!m) return null;
  const t = new Date(); const today = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - today) / 86400000);
}
// The exam the protocol is for: the next one coming up (today counts), or
// one you sat in the last 10 days so the "after the exam" steps still show.
function _edpNearestSec() {
  let ns = null, nd = Infinity, ps = null, pd = -Infinity;
  Object.entries(S.examDates || {}).forEach(function([s, ymd]) {
    if ((S.sectionPassed || []).includes(s)) return;
    const d = _edpDaysUntil(ymd); if (d === null) return;
    if (d >= 0 && d < nd) { nd = d; ns = s; }
    if (d < 0 && d >= -10 && d > pd) { pd = d; ps = s; }
  });
  if (ns) return { sec: ns, days: nd, date: S.examDates[ns] };
  if (ps) return { sec: ps, days: pd, date: S.examDates[ps] };
  return { sec: null, days: Infinity, date: null };
}
// Checks are stored per section AND date, so a retake starts fresh.
function _edpKey(n) { return n.sec ? n.sec + '@' + n.date : 'default'; }

const EXAM_PROTOCOL = [
  { day: 14, label: 'Two weeks out', icon: 'calendar', items: [
    ['Confirm your appointment in your Prometric account', 'Catch a wrong date, time or test center while there is still time to fix it.'],
    ['Check that the name on your ID matches your NTS exactly', 'A mismatch can get you turned away at check-in, and you would usually lose the exam fee.'],
    ['Take a full-length practice exam, timed', 'It shows where your four hours really go and which topics still cost you points.'],
    ['Pick your 3 weakest topics and give them most of this week', 'Fixing weak areas usually gains more points than polishing strong ones.'],
  ]},
  { day: 7, label: 'One week out', icon: 'target', items: [
    ['Redo every practice question you got wrong', 'Your misses are the quickest map to points you can still win.'],
    ['Practice simulations (TBS), not just multiple choice', 'Sims are a big share of your score. Get comfortable with exhibits and the tools.'],
    ['Write one page of the rules and formulas you keep forgetting', 'Read it once a day this week. You can’t bring it in, so it has to stick.'],
    ['Plan your route, travel time and parking', 'Arriving late can cost you your seat. Know exactly when you need to leave.'],
  ]},
  { day: 3, label: 'Three days out', icon: 'lotus', items: [
    ['Switch to light review: your one-pager, flashcards and misses', 'Cramming new material now tends to push out what you already know.'],
    ['Shift your sleep so you wake 3 hours before your start time', 'You want to be fully awake when the clock starts, not by the last testlet.'],
    ['Read Prometric’s test-day rules', 'Very little is allowed in the room, and lockers hold the rest. No surprises at check-in.'],
  ]},
  { day: 1, label: 'The day before', icon: 'moon', items: [
    ['Do a short review (under 2 hours), then stop', 'Rest now protects your recall tomorrow.'],
    ['Pack your ID, a snack and water for the break, and a layer', 'Testing rooms run cold, and you’ll want fuel at the break.'],
    ['Set two alarms and confirm the time you leave', 'One less thing to worry about tonight.'],
    ['Go to bed at your new bedtime', 'Aim for 7 to 9 hours. Sleep does more for recall than one more hour of review.'],
  ]},
  { day: 0, label: 'Exam day', icon: 'trophy', items: [
    ['Eat a breakfast you’re used to', 'Nothing new today. Steady energy beats a sugar spike.'],
    ['Arrive 30 minutes before your appointment', 'Check-in (ID, photo, security check) takes time. Prometric asks for 30 minutes.'],
    ['Check the clock at the start of each testlet', 'Running out of time on the sims is the most common avoidable mistake.'],
    ['Answer every question; flag the hard ones and move on', 'There’s no penalty for guessing, and a blank is always wrong.'],
    ['Take the standard break after testlet 3', 'It doesn’t count against your exam time. Stretch, eat, reset.'],
  ]},
  { day: -1, label: 'After the exam', icon: 'party', items: [
    ['Log the exam in Ledger', 'Keeps your 30-month window and study plan accurate.'],
    ['Note your score release date on the AICPA site', 'Scores come out on set dates, so you don’t have to keep checking.'],
    ['Take a day or two off, then plan your next section', 'A short rest, then keep the momentum going.'],
  ]},
];

function _buildExamDayProtocol() {
  const near = _edpNearestSec();
  const nearestSec = near.sec, nearestDays = near.days;
  const checked = (S.examProtocol || {})[_edpKey(near)] || {};

  // A phase opens on its day and stays open; "after" opens the day after the exam.
  function isPhaseActive(phase) { return !!nearestSec && (phase.day < 0 ? nearestDays < 0 : nearestDays <= phase.day); }
  function unlockDateStr(phase) {
    if (!near.date) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(near.date);
    const d = new Date(+m[1], +m[2] - 1, +m[3] - phase.day);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  // The phase you're in now (the latest one that has opened).
  const current = EXAM_PROTOCOL.filter(isPhaseActive).pop();

  const total = EXAM_PROTOCOL.reduce((a, p) => isPhaseActive(p) ? a + p.items.length : a, 0);
  const done  = EXAM_PROTOCOL.reduce((a, p) => isPhaseActive(p) ? a + p.items.filter((_, i) => checked[p.day + '_' + i]).length : a, 0);
  const pct   = total ? Math.round(done / total * 100) : 0;

  let html = '';
  if (nearestSec) {
    const when = nearestDays > 1 ? nearestDays + ' days until ' + nearestSec
      : nearestDays === 1 ? nearestSec + ' is tomorrow'
      : nearestDays === 0 ? nearestSec + ' is today. You’ve got this.'
      : 'You sat ' + nearestSec + ' ' + (-nearestDays) + ' day' + (nearestDays === -1 ? '' : 's') + ' ago';
    html += '<div style="background:var(--amb-bg);border:1.5px solid rgba(180,83,9,.25);border-radius:14px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:12px;min-width:0">' +
      '<div style="width:44px;height:44px;border-radius:12px;background:rgba(180,83,9,.12);color:var(--amb);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' + ico('hourglass') + '</div>' +
      '<div style="min-width:0"><div style="font-size:14px;font-weight:800;color:var(--amb)">' + when + '</div>' +
      '<div style="font-size:12px;color:var(--sub);margin-top:1px">' + (current ? 'Now: ' + current.label.toLowerCase() + '. Steps open as the date gets closer.' : 'Your first steps open 2 weeks before.') + '</div></div>' +
      '</div>' +
      (total ? '<div style="text-align:right;flex-shrink:0"><div style="font-size:18px;font-weight:900;color:var(--amb)">' + pct + '%</div><div style="font-size:10px;color:var(--mut)">done</div></div>' : '') +
    '</div>' +
    '<div style="height:4px;background:var(--surf2);border-radius:2px;margin-bottom:18px;overflow:hidden"><div id="edp-bar" style="height:100%;width:' + pct + '%;background:var(--amb);border-radius:2px;transition:width .4s ease"></div></div>';
  } else {
    html += '<div style="background:var(--surf2);border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:13px;color:var(--sub)">Add your exam date (Edit Profile → exam dates) and this turns into a day-by-day checklist for the two weeks before it.</div>';
  }

  EXAM_PROTOCOL.forEach(function(phase) {
    const active = isPhaseActive(phase);
    const isNow = phase === current;
    const phaseDone = active ? phase.items.filter((_, i) => checked[phase.day + '_' + i]).length : 0;
    const phaseComplete = active && phaseDone === phase.items.length;
    const uds = unlockDateStr(phase);
    const opens = phase.day < 0 ? (uds ? 'Opens ' + uds : 'Opens after your exam') : (uds ? 'Opens ' + uds : 'Opens ' + (phase.day ? phase.day + ' day' + (phase.day > 1 ? 's' : '') + ' before' : 'on exam day'));

    html += '<div class="edp-card" style="background:var(--surf);border:1.5px solid ' + (phaseComplete ? 'rgba(4,120,87,.35)' : isNow ? 'var(--amb)' : 'var(--bdr)') + ';border-radius:14px;padding:16px 18px;margin-bottom:10px;transition:border-color .2s;' + (!active ? 'opacity:.7' : '') + '">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">' +
      '<div class="edp-icon" data-emoji="' + phase.icon + '" style="width:36px;height:36px;border-radius:10px;background:' + (phaseComplete ? 'var(--grn-bg)' : 'var(--surf2)') + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">' + ico(phaseComplete ? 'checkCircle' : phase.icon) + '</div>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
      '<div style="font-size:13px;font-weight:800;color:var(--txt)">' + phase.label + '</div>' +
      (isNow ? '<span style="font-size:10px;font-weight:800;color:var(--amb);background:var(--amb-bg);border-radius:20px;padding:1px 8px">Now</span>' : '') +
      '</div>' +
      (active
        ? '<div class="edp-count" style="font-size:11px;color:var(--mut);margin-top:1px">' + phaseDone + ' of ' + phase.items.length + ' done</div>'
        : '<div style="font-size:11px;color:var(--mut);margin-top:2px">' + opens + '</div>') +
      '</div></div>' +
      phase.items.map(function(item, idx) {
        const ck = active && !!checked[phase.day + '_' + idx];
        const body = '<span style="flex:1;min-width:0"><span class="pck-label" style="display:block;font-size:13px;font-weight:600;color:' + (ck ? 'var(--mut)' : active ? 'var(--txt)' : 'var(--sub)') + ';text-decoration:' + (ck ? 'line-through' : 'none') + ';line-height:1.45">' + item[0] + '</span>' +
          '<span style="display:block;font-size:12px;color:var(--mut);line-height:1.45;margin-top:2px">' + item[1] + '</span></span>';
        const box = '<span class="pck-box" style="width:20px;height:20px;border-radius:6px;border:2px solid ' + (ck ? 'var(--grn)' : 'var(--bdr)') + ';background:' + (ck ? 'var(--grn)' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">' + (ck ? '<span style="color:#fff;font-size:12px;line-height:1;font-weight:900">✓</span>' : '') + '</span>';
        return active
          ? '<div id="pck-' + phase.day + '-' + idx + '" role="checkbox" tabindex="0" aria-checked="' + ck + '" onclick="toggleProtocolCheck(\'' + phase.day + '\',\'' + idx + '\',this)" onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();this.click()}" style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-top:1px solid var(--surf2);cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent">' + box + body + '</div>'
          : '<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-top:1px solid var(--surf2)">' + box + body + '</div>';
      }).join('') +
    '</div>';
  });
  html += '<div style="font-size:11px;color:var(--mut);line-height:1.5;margin-top:6px">General guidance, not official rules. Always check your NTS, Prometric and your state board for the latest requirements.</div>';
  return html;
}

function toggleProtocolCheck(phase, idx, rowEl) {
  const key = _edpKey(_edpNearestSec());
  if (!S.examProtocol) S.examProtocol = {};
  if (!S.examProtocol[key]) S.examProtocol[key] = {};
  const newVal = !S.examProtocol[key][phase + '_' + idx];
  S.examProtocol[key][phase + '_' + idx] = newVal;
  saveState();
  if (rowEl) rowEl.setAttribute('aria-checked', String(newVal));

  // Instant DOM update — no full re-render
  if (rowEl) {
    const box   = rowEl.querySelector('.pck-box');
    const label = rowEl.querySelector('.pck-label');
    if (box) {
      box.style.borderColor = newVal ? 'var(--grn)' : 'var(--bdr)';
      box.style.background  = newVal ? 'var(--grn)' : 'transparent';
      box.innerHTML = newVal ? '<span style="color:#fff;font-size:12px;line-height:1;font-weight:900">✓</span>' : '';
    }
    if (label) {
      label.style.color          = newVal ? 'var(--mut)' : 'var(--txt)';
      label.style.textDecoration = newVal ? 'line-through' : 'none';
    }
    // Update phase card border, count, and icon
    const card = rowEl.closest('.edp-card');
    if (card) {
      const allRows  = card.querySelectorAll('[id^="pck-' + phase + '-"]');
      const doneNow  = Array.from(allRows).filter(function(r) {
        const b = r.querySelector('.pck-box');
        return b && b.style.background && b.style.background.includes('var(--grn)');
      }).length;
      const totalNow = allRows.length;
      const complete = doneNow === totalNow;
      // Update count text
      const countEl = card.querySelector('.edp-count');
      if (countEl) countEl.textContent = doneNow + ' of ' + totalNow + ' done';
      // Update card border
      card.style.borderColor = complete ? 'rgba(14,165,116,.3)' : 'var(--bdr)';
      // Update icon — read stored emoji from data attribute to avoid losing it
      const iconEl = card.querySelector('.edp-icon');
      if (iconEl) {
        const originalEmoji = iconEl.getAttribute('data-emoji') || '';
        iconEl.innerHTML = ico(complete ? 'checkCircle' : originalEmoji);
        iconEl.style.background = complete ? 'var(--grn-bg)' : 'var(--surf2)';
      }
      card.style.borderColor = complete ? 'rgba(4,120,87,.35)' : (card.innerHTML.includes('>Now<') ? 'var(--amb)' : 'var(--bdr)');
    }
    // Overall percentage
    const rows = document.querySelectorAll('[id^="pck-"][role="checkbox"]');
    const on = Array.from(rows).filter(r => r.getAttribute('aria-checked') === 'true').length;
    const pct = rows.length ? Math.round(on / rows.length * 100) : 0;
    const bar = document.getElementById('edp-bar'); if (bar) bar.style.width = pct + '%';
    const pctEl = bar && bar.parentElement.previousElementSibling && bar.parentElement.previousElementSibling.querySelector('div[style*="font-size:18px"]');
    if (pctEl) pctEl.textContent = pct + '%';
  }
}

// ── Mnemonic Generator ─────────────────────────────────────────────────────
const MNEMONIC_DB = {
  'asc 606': {
    title: 'ASC 606 — Revenue Recognition',
    acronym: 'ICDAR',
    expansion: 'Identify Contract · Clarify Obligations · Determine Price · Allocate Price · Recognize Revenue',
    hook: 'Think: "I Can\'t Drink Any Revenue until I earn it."',
    detail: 'Step 1: Identify the contract. Step 2: Clarify (identify) performance obligations. Step 3: Determine transaction price. Step 4: Allocate to obligations. Step 5: Recognize when each obligation is satisfied.',
    color: 'var(--ind)'
  },
  'coso': {
    title: 'COSO Framework — Internal Controls',
    acronym: 'CRIME',
    expansion: 'Control Environment · Risk Assessment · Information & Communication · Monitoring · Existing Control Activities',
    hook: 'Strong internal controls prevent CRIME.',
    detail: 'The 5 components of COSO: Control Environment (tone at the top), Risk Assessment (identify risks), Information & Communication (data flows), Monitoring (ongoing assessment), Control Activities (policies and procedures).',
    color: 'var(--red)'
  },
  'audit risk': {
    title: 'Audit Risk Model',
    acronym: 'AR = IR × CR × DR',
    expansion: 'Audit Risk = Inherent Risk × Control Risk × Detection Risk',
    hook: '"I Can\'t Detect" — Inherent, Control, Detection. Auditor only controls Detection Risk.',
    detail: 'Inherent Risk: susceptibility to misstatement absent controls. Control Risk: controls fail to prevent/detect. Detection Risk: auditor\'s procedures fail. Only Detection Risk is controlled by the auditor.',
    color: 'var(--ora)'
  },
  'fraud triangle': {
    title: 'Fraud Triangle',
    acronym: 'OPR',
    expansion: 'Opportunity · Pressure · Rationalization',
    hook: '"Only People Rationalize" fraud. All three must be present.',
    detail: 'Opportunity: weakness in controls that allows fraud. Pressure (Incentive): financial need or motivation. Rationalization: the fraudster\'s mental justification. SAS 99 / AU-C 240 requires auditors to assess all three.',
    color: 'var(--amb)'
  },
  'gasb': {
    title: 'GASB vs FASB',
    acronym: 'G-FAB',
    expansion: 'Government = GASB · For-profit/NFP = FASB · Accounting = Both',
    hook: '"G is for Government, F is for For-profit." State/local government → GASB. Everything else → FASB.',
    detail: 'GASB governs state and local governments. FASB governs for-profit entities and NFPs (private). Federal government uses FASAB. The AICPA Code applies to all CPAs.',
    color: 'var(--grn)'
  },
  'going concern': {
    title: 'Going Concern Indicators',
    acronym: 'DUFF',
    expansion: 'Debt defaults · Unable to pay obligations · Financial losses (recurring) · Future viability doubts',
    hook: 'A DUFF company may not survive. The Simpsons work at a company that might go under.',
    detail: 'Auditors assess going concern for 12 months from financial statement date. Substantial doubt exists when conditions indicate the entity may not continue. Requires disclosure and possible explanatory paragraph.',
    color: 'var(--ind)'
  },
  'consolidation': {
    title: 'ASC 810 — Consolidation',
    acronym: 'PAVE',
    expansion: 'Power to direct · Ability to use economic benefits · Variable interest · Entity is a VIE',
    hook: 'To consolidate, you must PAVE the way — control + benefit.',
    detail: 'Consolidate when you have: (1) power to direct activities most significantly affecting economic performance, (2) obligation to absorb losses or right to receive benefits. VIE vs. voting interest model depends on entity structure.',
    color: 'var(--pur)'
  },
  'lease types': {
    title: 'ASC 842 — Lease Types',
    acronym: 'OFPETV',
    expansion: 'Ownership transfer · Favorable purchase option · 75% economic life · 90% PV · Title transfer · Vulnerable/specialized nature',
    hook: '"Own it For Pretty Excellent Terms" — if ANY criterion met → finance lease.',
    detail: 'Under ASC 842, lessees classify as finance or operating. Finance lease: (1) transfers ownership, (2) purchase option reasonably certain, (3) term ≥ 75% economic life, (4) PV ≥ 90% fair value, (5) specialized nature. Otherwise: operating lease.',
    color: 'var(--tea)'
  },
  'partnership': {
    title: 'Partnership Basis Rules',
    acronym: 'CASI',
    expansion: 'Contributions increase basis · Allocations of income increase · Share of liabilities increases · Income distributions decrease',
    hook: '"CAs In" means basis goes up. Distributions take it back down.',
    detail: 'Outside basis = cash contributed + FMV of property contributed + share of partnership liabilities + allocated income - allocated losses - distributions. Inside basis = basis of assets inside the partnership.',
    color: 'var(--amb)'
  },
  's-corp': {
    title: 'S-Corp Eligibility Requirements',
    acronym: 'SUCC',
    expansion: 'Small (≤100 shareholders) · US citizens/residents only · C corporation not allowed · Classes of stock: only one',
    hook: '"SUCC-eed" at being an S-Corp: Small, US-only, Can\'t be C-corp, one Class.',
    detail: 'S-Corp requirements: ≤100 shareholders, all must be US citizens/residents or certain trusts/estates, one class of stock (voting differences OK), not an ineligible corporation. Election via Form 2553.',
    color: 'var(--grn)'
  },
  'depreciation': {
    title: 'MACRS Depreciation Conventions',
    acronym: 'HMQ',
    expansion: 'Half-year convention (personal property default) · Mid-month convention (real property) · Mid-quarter (if >40% placed in Q4)',
    hook: '"How Much Q4?" — if more than 40% of assets placed in Q4, use mid-quarter for ALL personal property that year.',
    detail: 'Half-year: treat all personal property as if placed/disposed mid-year. Mid-month: for residential and commercial real property. Mid-quarter: triggered when >40% cost of personal property placed in service in Q4.',
    color: 'var(--red)'
  },
  'internal control': {
    title: 'COSO Internal Control Components',
    acronym: 'CRIME',
    expansion: 'Control Environment · Risk Assessment · Information & Communication · Monitoring · Existing Control Activities',
    hook: 'Strong internal controls prevent CRIME.',
    detail: 'Same as the COSO framework. Control Activities are the actual policies and procedures. The Control Environment is the foundation (tone at top).',
    color: 'var(--red)'
  },
};



// ─── Ask Ledger coach panel (full experience) ─────────────────────────────────
function _buildCoachPanel() {
  return buildAIStudyCoach();
}

function buildAIFlashcards() { return buildStudyLab(); }
function _buildFlashcardViewer(){
  const card=_fc.cards[_fc.current];
  if(_fc.current>=_fc.cards.length) return _buildFlashcardComplete();
  if(!card) return '';
  const total=_fc.cards.length;
  const pct=Math.round((_fc.current+1)/total*100);
  const correct=_fc.cards.filter(c=>(c.timesCorrect||0)>0).length;
  const missed=_fc.cards.filter(c=>(c.timesMissed||0)>0).length;
  const hasStats=((card.timesCorrect||0)+(card.timesMissed||0))>0;
  return `<div class="card card-pad">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="section-title" style="margin-bottom:0">Flashcards</div>
      <span style="font-size:11px;color:var(--mut)">${_fc.current+1} / ${total}</span>
    </div>
    <div style="height:5px;background:var(--surf3);border-radius:4px;margin-bottom:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--ind);border-radius:4px;transition:width .3s"></div></div>
    <div style="display:flex;gap:14px;font-size:10px;font-weight:700;margin-bottom:12px">
      <span style="color:var(--grn)">✓ ${correct} known</span>
      <span style="color:var(--red)">✗ ${missed} missed</span>
      <span style="color:var(--mut);margin-left:auto">Tap to flip<span class="fc-kbd-hint"> · Space flips, 1–3 grade</span></span>
    </div>
    <div role="button" tabindex="0" aria-label="${_fc.flipped?'Answer — activate to show question':'Question — activate to reveal answer'}" onclick="fcFlipCard()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();fcFlipCard()}" style="cursor:pointer;min-height:160px;border-radius:14px;border:2px solid ${_fc.flipped?'var(--grn)':'var(--ind)'};background:${_fc.flipped?'var(--grn-bg)':'var(--ind-bg)'};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 24px;text-align:center;transition:background-color .2s,border-color .2s,color .2s,box-shadow .2s,transform .2s,opacity .2s;position:relative">
      <div style="position:absolute;top:10px;left:14px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:${_fc.flipped?'var(--grn)':'var(--ind)'}">${_fc.flipped?'Answer':'Question'}</div>
      ${hasStats?`<div style="position:absolute;top:8px;right:12px;font-size:10px;color:var(--mut)">${(card.timesCorrect||0)>0?`<span style="color:var(--grn)">✓${card.timesCorrect}</span> `:''}${(card.timesMissed||0)>0?`<span style="color:var(--red)">✗${card.timesMissed}</span>`:''}</div>`:''}
      <div style="font-size:14px;font-weight:700;line-height:1.65;color:var(--txt);white-space:pre-line">${esc(_fc.flipped?card.a:card.q)}</div>
      ${!_fc.flipped?'<div style="font-size:11px;color:var(--mut);margin-top:10px">Tap to reveal</div>':''}
    </div>
    ${_fc.flipped
      ?`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
          <button onclick="fcSRSGrade(0)" style="padding:10px 4px;background:var(--red-bg);border:1.5px solid var(--red);border-radius:10px;cursor:pointer;font-size:11px;font-weight:800;color:var(--red)">✗ Missed</button>
          <button onclick="fcSRSGrade(1)" style="padding:10px 4px;background:var(--amb-bg);border:1.5px solid var(--amb);border-radius:10px;cursor:pointer;font-size:11px;font-weight:800;color:var(--amb)">~ Almost</button>
          <button onclick="fcSRSGrade(2)" style="padding:10px 4px;background:var(--grn-bg);border:1.5px solid var(--grn);border-radius:10px;cursor:pointer;font-size:11px;font-weight:800;color:var(--grn)">✓ Got it!</button>
        </div>`
      :`<div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center" onclick="fcNav(-1)"${_fc.current===0?' disabled':''}>← Prev</button>
          <button class="btn btn-primary btn-sm" style="flex:2;justify-content:center" onclick="fcFlipCard()">Reveal Answer</button>
          <button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center" onclick="fcNav(1)"${_fc.current===total-1?' disabled':''}>Next →</button>
        </div>`}
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center" onclick="fcShuffle()">Shuffle</button>
      <button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center" onclick="fcRestart()">↺ Restart</button>
    </div>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:3px">
      ${_fc.cards.map((c,i)=>{
        const bg=i===_fc.current?'var(--ind)':(c.timesCorrect||0)>=2?'var(--grn)':(c.timesMissed||0)>0?'#fca5a5':'var(--surf3)';
        const fc=i===_fc.current||((c.timesCorrect||0)>=2)?'#fff':'var(--mut)';
        return `<div onclick="fcGoto(${i})" style="width:22px;height:22px;border-radius:5px;cursor:pointer;background:${bg};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${fc}">${i+1}</div>`;
      }).join('')}
    </div>
  </div>`;
}

function _buildFlashcardComplete(){
  const total=_fc.cards.length;
  const correct=_fc.cards.filter(c=>(c.timesCorrect||0)>0).length;
  const pct=total?Math.round(correct/total*100):0;
  const color=pct>=80?'var(--grn)':pct>=60?'var(--amb)':'var(--red)';
  return `<div class="card card-pad" style="text-align:center">
    <div style="font-size:42px;font-weight:900;color:${color};letter-spacing:-.04em">${pct}%</div>
    <div style="font-size:15px;font-weight:800;margin-top:4px">${correct} / ${total} known</div>
    <div style="font-size:12px;color:var(--mut);margin:8px 0 20px">${pct>=80?'Great session! Review the missed cards tomorrow.':pct>=60?'Good progress. Focus on the red cards.':'Keep drilling — repetition is how this sticks.'}</div>
    <button class="btn btn-primary btn-sm" onclick="fcRestart()" style="margin:0 auto">↺ Study Again</button>
  </div>`;
}

function _buildQuizViewer() {
  if (_fc.quizCur >= _fc.quizQ.length) return _buildQuizResults();
  const q = _fc.quizQ[_fc.quizCur];
  const total = _fc.quizQ.length;
  const pct = Math.round(_fc.quizCur / total * 100);
  return '<div class="card card-pad">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
      '<div class="section-title" style="margin-bottom:0">Practice Quiz</div>' +
      '<span style="font-size:11px;color:var(--mut)">Question ' + (_fc.quizCur+1) + ' of ' + total + '</span>' +
    '</div>' +
    '<div style="height:5px;background:var(--surf3);border-radius:4px;margin-bottom:18px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:var(--grn);border-radius:4px;transition:width .3s"></div></div>' +
    '<div style="font-size:14px;font-weight:700;line-height:1.6;margin-bottom:16px;white-space:pre-line">' + esc(q.q) + '</div>' +
    '<div role="radiogroup" aria-label="Answer choices" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">' +
      q.choices.map(function(ch, ci) {
        const isSelected = _fc.quizSel === ci;
        const isCorrect = ci === q.correct;
        let bg = 'var(--surf2)', border = 'var(--bdr)', color = 'var(--txt)';
        if (_fc.quizAns) {
          if (isCorrect) { bg='var(--grn-bg)'; border='var(--grn)'; color='var(--grn)'; }
          else if (isSelected) { bg='var(--red-bg)'; border='var(--red)'; color='var(--red)'; }
        } else if (isSelected) { bg='var(--ind-bg)'; border='var(--ind)'; color='var(--ind)'; }
        return '<button role="radio" aria-checked="' + isSelected + '" ' + (_fc.quizAns ? 'disabled ' : '') + 'onclick="fcSelectAnswer(' + ci + ')" style="display:flex;align-items:flex-start;gap:8px;width:100%;text-align:left;padding:11px 14px;border-radius:10px;border:1.5px solid ' + border + ';background:' + bg + ';cursor:' + (_fc.quizAns ? 'default' : 'pointer') + ';font:inherit;font-size:13px;font-weight:600;color:' + color + ';opacity:1;transition:background-color .15s,border-color .15s,color .15s">' +
          '<span style="font-weight:800;flex-shrink:0">' + String.fromCharCode(65+ci) + '.</span><span style="flex:1;line-height:1.5">' + esc(ch) + '</span>' +
          (_fc.quizAns && isCorrect ? '<span style="font-weight:900;flex-shrink:0">✓</span>' : '') +
          (_fc.quizAns && isSelected && !isCorrect ? '<span style="font-weight:900;flex-shrink:0">✗</span>' : '') +
        '</button>';
      }).join('') +
    '</div>' +
    (_fc.quizAns && q.exp ? '<div style="padding:12px 14px;border-radius:10px;background:var(--amb-bg);border:1px solid rgba(245,158,11,.25);font-size:12px;color:var(--sub);line-height:1.65;margin-bottom:14px"><strong style="color:var(--amb)">Explanation:</strong> ' + esc(q.exp) + '</div>' : '') +
    '<div style="display:flex;gap:8px">' +
      (!_fc.quizAns ? '<button class="btn btn-primary" style="flex:1;justify-content:center" onclick="fcSubmitAnswer()" ' + (_fc.quizSel===null?'disabled':'') + '>Submit Answer</button>' :
       '<button class="btn btn-ind" style="flex:1;justify-content:center" onclick="fcNextQuizQ()">' + (_fc.quizCur===total-1?'See Results →':'Next Question →') + '</button>') +
    '</div>' +
  '</div>';
}

function _buildQuizResults() {
  const total = _fc.quizQ.length;
  const pct = Math.round(_fc.quizScore / total * 100);
  const color = pct >= 75 ? 'var(--grn)' : pct >= 55 ? 'var(--amb)' : 'var(--red)';
  const missed = (_fc.quizMissed || []).map(function(m){ return {q:_fc.quizQ[m.i], sel:m.sel}; }).filter(function(m){ return m.q; });
  const review = missed.length ? '<div style="text-align:left;margin-top:22px;border-top:1px solid var(--bdr);padding-top:16px">' +
      '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-bottom:10px">Review what you missed</div>' +
      missed.map(function(m){
        return '<div style="padding:12px 14px;border:1px solid var(--bdr);border-radius:10px;margin-bottom:8px">' +
          '<div style="font-size:12px;font-weight:700;line-height:1.5;margin-bottom:6px">' + esc(m.q.q) + '</div>' +
          '<div style="font-size:11px;color:var(--red);margin-bottom:3px">You chose: ' + esc(m.q.choices[m.sel]) + '</div>' +
          '<div style="font-size:11px;color:var(--grn);font-weight:700;margin-bottom:6px">Correct: ' + esc(m.q.choices[m.q.correct]) + '</div>' +
          (m.q.exp ? '<div style="font-size:11px;color:var(--sub);line-height:1.6">' + esc(m.q.exp) + '</div>' : '') +
        '</div>';
      }).join('') +
    '</div>' : '';
  return '<div class="card card-pad" style="text-align:center">' +
    '<div style="font-size:48px;font-weight:900;color:' + color + ';letter-spacing:-.04em">' + pct + '%</div>' +
    '<div style="font-size:16px;font-weight:800;margin-top:4px">' + _fc.quizScore + ' of ' + total + ' correct</div>' +
    '<div style="font-size:12px;color:var(--mut);margin-top:6px;margin-bottom:20px">' + (pct>=75?'Strong work. You know this material well.':pct>=55?'Good progress. Go over the questions you missed below.':'Keep at it. Review the misses below, then retake the quiz.') + '</div>' +
    '<button class="btn btn-primary btn-sm" onclick="fcRestartQuiz()" style="margin:0 auto">↺ Retake Quiz</button>' +
    review +
  '</div>';
}

function _buildSummaryViewer(){
  return '<div class="card card-pad">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px">' +
      '<div class="section-title" style="margin-bottom:0">Study Summary</div>' +
      '<button class="btn btn-ghost btn-xs" onclick="fcCopySummary()">Copy</button>' +
    '</div>' +
    '<div class="fc-md">' + _fcMarkdown(_fc.summaryText) + '</div>' +
  '</div>';
}

// Small, safe Markdown renderer for AI summaries: headings, bullets, numbered
// lists, bold/italic and inline code. Everything is escaped first.
function _fcMarkdown(md){
  const inline=function(s){
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g,'$1<em>$2</em>')
      .replace(/`([^`]+)`/g,'<code>$1</code>');
  };
  const out=[]; let list=null;
  const close=function(){ if(list){ out.push('</'+list+'>'); list=null; } };
  String(md||'').replace(/\r\n/g,'\n').split('\n').forEach(function(raw){
    const l=raw.trim();
    if(!l){ close(); return; }
    let m;
    if((m=l.match(/^#{1,6}\s+(.*)$/))){ close(); out.push('<h4>'+inline(m[1].replace(/#+$/,'').trim())+'</h4>'); return; }
    if((m=l.match(/^[-*•]\s+(.*)$/))){ if(list!=='ul'){ close(); out.push('<ul>'); list='ul'; } out.push('<li>'+inline(m[1])+'</li>'); return; }
    if((m=l.match(/^\d+[.)]\s+(.*)$/))){ if(list!=='ol'){ close(); out.push('<ol>'); list='ol'; } out.push('<li>'+inline(m[1])+'</li>'); return; }
    close(); out.push('<p>'+inline(l)+'</p>');
  });
  close();
  return out.join('');
}

function fcCopySummary(){
  const text=_fc.summaryText||'';
  const done=function(){ showToast('Summary copied','ok'); };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(function(){ showToast('Could not copy — select the text instead','err'); });
  }else{
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); done(); }catch(e){ showToast('Could not copy — select the text instead','err'); }
    ta.remove();
  }
}

function fcClearInput(){
  _fc.lastInput=''; _fc.pdfStatus=null; _fc.error=null;
  _fcRender();
  const el=document.getElementById('fc-input-text'); if(el) el.focus();
}

function _fcCharCountText(len){
  if(!len) return '';
  return len>FC_MAX_INPUT
    ? 'Only the first '+FC_MAX_INPUT.toLocaleString()+' of '+len.toLocaleString()+' characters will be used'
    : len.toLocaleString()+' / '+FC_MAX_INPUT.toLocaleString()+' characters';
}
function _fcUpdateCharCount(){
  const el=document.getElementById('fc-char-count'); if(!el) return;
  const len=(_fc.lastInput||'').length;
  el.textContent=_fcCharCountText(len);
  el.style.color=len>FC_MAX_INPUT?'var(--amb)':'var(--mut)';
}

// ── AI GENERATION ENGINE ──

function fcGenerate(type){
  _fcGenerateAsync(type).catch(function(e){
    console.warn('[Ledger] study tools:', e);
    _fc.generating=false; _fc.error={type:type,msg:'Something went wrong. Please try again.'}; _fcRender();
  });
}

function _fcFriendlyError(err){
  const m=String((err&&err.message)||'');
  if(!navigator.onLine||/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'You appear to be offline. Check your connection and try again.';
  if(/401|unauthor|sign in/i.test(m)) return 'Your session expired. Sign in again, then try once more.';
  if(/429|limit/i.test(m)) return m.replace(/^API error \d+$/,'You have hit the AI limit for now. Try again later.');
  if(/^API error 5\d\d/.test(m)) return 'The AI service is busy right now. Try again in a moment.';
  return m||'Something went wrong. Please try again.';
}

function _fcCardsFrom(parsed,count){
  if(!Array.isArray(parsed)) return [];
  const seen=new Set(), out=[];
  parsed.forEach(function(c){
    if(!c||typeof c!=='object') return;
    const q=String(c.q||c.question||c.front||'').trim(), a=String(c.a||c.answer||c.back||'').trim();
    if(q.length<4||!a) return;
    const k=q.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    if(seen.has(k)) return; seen.add(k);
    out.push({q:q.slice(0,600),a:a.slice(0,1500)});
  });
  return out.slice(0,count);
}

// Strip "A." / "(B)" style prefixes the model sometimes adds to choices.
function _fcCleanChoice(c){ return String(c).replace(/^\s*(?:\(?[A-Da-d][.):]|\([A-Da-d]\))\s+/,'').trim(); }

// Move the correct answer to a random slot so it isn't always "A". Skipped when
// a choice refers to the others ("all of the above", "both A and B").
function _fcShuffleChoices(q){
  if(q.choices.some(function(c){ return /\b(above|both|neither|all of|none of)\b|\b[A-D] (?:and|or) [A-D]\b/i.test(c); })) return q;
  const order=[0,1,2,3].sort(function(){ return Math.random()-0.5; });
  return Object.assign({},q,{choices:order.map(function(i){ return q.choices[i]; }),correct:order.indexOf(q.correct)});
}

function _fcQuizFrom(parsed,count){
  if(!Array.isArray(parsed)) return [];
  const seen=new Set(), out=[];
  parsed.forEach(function(o){
    const n=_normAIQ(o); if(!n) return;
    n.choices=n.choices.map(_fcCleanChoice);
    if(n.choices.some(function(c){ return !c; })) return;
    if(new Set(n.choices.map(function(c){ return c.toLowerCase(); })).size<4) return;
    const k=n.q.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    if(seen.has(k)) return; seen.add(k);
    out.push(_fcShuffleChoices(n));
  });
  return out.slice(0,count);
}

function _fcPrompt(type,material,count,ftype){
  if(type==='flashcard'){
    const focus=ftype==='definitions'?'Focus on defining key terms and concepts.':
      ftype==='rules'?'Focus on rules, requirements, thresholds and standards.':
      ftype==='applied'?'Focus on applied scenarios, calculations, comparisons and journal entries.':
      'Cover a balanced mix: definitions (about 40%), rules and requirements (about 35%), applied scenarios (about 25%).';
    return 'Write exactly '+count+' CPA exam flashcards based only on the study material below.\n\n'+focus+'\n\n'+
      'Rules:\n- Each front asks one specific, testable thing. No vague or overly broad questions.\n'+
      '- Each back is accurate, complete and concise (1-4 sentences). Use numbered items for lists or steps.\n'+
      '- Prioritise what is most likely to be tested. Do not repeat near-identical cards.\n'+
      '- If the material is too short for '+count+' good cards, write fewer rather than padding.\n\n'+
      'Return ONLY a JSON array, with no prose and no code fences:\n[{"q":"front of card","a":"back of card"}]\n\n'+
      'Material:\n"""\n'+material+'\n"""';
  }
  if(type==='quiz'){
    return 'Write exactly '+count+' CPA-exam-style multiple-choice questions based only on the study material below.\n\n'+
      'Rules:\n- Each question has exactly 4 choices and one unambiguously correct answer.\n'+
      '- Distractors are plausible: common mistakes, misapplied rules or wrong thresholds.\n'+
      '- Do not use "all of the above", "none of the above", or choices that refer to other choices.\n'+
      '- Do not put letters or numbers in front of the choices.\n'+
      '- Mix recall, application and calculation questions where the material allows.\n'+
      '- Each explanation (1-2 sentences) says why the correct answer is right and, where useful, why the main trap is wrong.\n'+
      '- If the material is too short for '+count+' good questions, write fewer rather than padding.\n\n'+
      'Return ONLY a JSON array, with no prose and no code fences:\n'+
      '[{"q":"question","choices":["first","second","third","fourth"],"correct":0,"exp":"explanation"}]\n'+
      '"correct" is the 0-based index of the right choice.\n\n'+
      'Material:\n"""\n'+material+'\n"""';
  }
  return 'Write a structured CPA study summary of the material below. Use Markdown and only these sections, '+
    'leaving out any that do not apply:\n\n## Key Concepts\n## Rules & Requirements\n## Quick Reference\n## Common Exam Traps\n\n'+
    'Under each heading use short "- " bullet points. Use **bold** for key terms and numbers. Formulas, thresholds, '+
    'dates and percentages belong in Quick Reference. Be precise and concise, stick to what the material says, and '+
    'start directly with the first heading (no introduction or closing remarks).\n\n'+
    'Material:\n"""\n'+material+'\n"""';
}

async function _fcGenerateAsync(type){
  if(_fc.generating) return;
  const el=document.getElementById('fc-input-text');
  const text=((el?el.value:_fc.lastInput)||'').trim();
  _fc.lastInput=el?el.value:_fc.lastInput;
  if(text.length<FC_MIN_INPUT){
    showToast(text?'Add a bit more material — at least a paragraph — so there is something to study':'Paste some study material first','err');
    if(el) el.focus();
    return;
  }
  // Monthly AI-generation cap for free users (every paid tier is unlimited). Mirrors Ask Ledger.
  if(!isElite()){
    const monthKey=new Date().toISOString().slice(0,7);
    const used=(_flashcardUsage&&_flashcardUsage.month===monthKey)?_flashcardUsage.count:0;
    if(used>=FLASHCARD_LIMIT){
      showToast('Monthly AI limit reached ('+FLASHCARD_LIMIT+' generations). Resets next month — Pro is unlimited.','err');
      return;
    }
  }
  const countEl=document.getElementById('fc-count');
  const ftypeEl=document.getElementById('fc-type');
  const count=parseInt(countEl&&countEl.value,10)||_fc.genCount||15;
  const ftype=(ftypeEl&&ftypeEl.value)||_fc.genType||'mixed';
  _fc.genCount=count; _fc.genType=ftype;
  _fc.generating=type; _fc.error=null;
  _fcRender();

  const material=text.slice(0,FC_MAX_INPUT);
  try{
    if(type==='flashcard'){
      const prompt=_fcPrompt('flashcard',material,count,ftype);
      let cards=_fcCardsFrom(_fcParseJSON(await _fcCallAI(prompt,4096)),count);
      if(!cards.length) cards=_fcCardsFrom(_fcParseJSON(await _fcCallAI(prompt+'\n\nReply with the JSON array only.',4096)),count);
      if(!cards.length) throw new Error('The AI reply could not be turned into flashcards. Please try again.');
      const now=Date.now();
      _fc.cards=cards.map(function(c,i){ return {id:'c'+i+'_'+now,q:c.q,a:c.a,ease:2.5,interval:1,nextReview:now,timesCorrect:0,timesMissed:0}; });
      _fc.current=0; _fc.flipped=false; _fc.mode='flashcard'; _fc.activeDeckId=null;
      showToast(_fc.cards.length+(_fc.cards.length===1?' flashcard':' flashcards')+' ready','ok');
    }else if(type==='quiz'){
      const n=Math.min(count,FC_QUIZ_MAX);
      const prompt=_fcPrompt('quiz',material,n);
      let qs=_fcQuizFrom(_fcParseJSON(await _fcCallAI(prompt,4096)),n);
      if(!qs.length) qs=_fcQuizFrom(_fcParseJSON(await _fcCallAI(prompt+'\n\nReply with the JSON array only.',4096)),n);
      if(!qs.length) throw new Error('The AI reply could not be turned into a quiz. Please try again.');
      _fc.quizQ=qs; _fc.quizCur=0; _fc.quizSel=null; _fc.quizAns=false; _fc.quizScore=0; _fc.quizMissed=[]; _fc.mode='quiz';
      showToast(qs.length+(qs.length===1?' quiz question':' quiz questions')+' ready','ok');
    }else{
      const summary=String(await _fcCallAI(_fcPrompt('summary',material),2048)||'').replace(/^```(?:markdown|md)?\s*|```\s*$/gi,'').trim();
      if(summary.length<40) throw new Error('The AI returned an empty summary. Please try again.');
      _fc.summaryText=summary; _fc.mode='summary';
      showToast('Summary ready','ok');
    }
    if(!isElite()) _incrementFlashcardUsage(); // only successful generations count toward the free cap
  }catch(err){
    console.warn('[Ledger] study tools generation failed:', err && err.message);
    _fc.error={type:type,msg:_fcFriendlyError(err)};
  }finally{
    _fc.generating=false;
    _fcRender();
  }
}

// ── PDF import (pdf.js, loaded on first use) ──
const PDFJS_VER='3.11.174';
let _pdfjsPromise=null;
function _loadPdfJs(){
  if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if(_pdfjsPromise) return _pdfjsPromise;
  _pdfjsPromise=new Promise(function(resolve,reject){
    const s=document.createElement('script');
    s.src='/vendor/pdfjs-'+PDFJS_VER+'.min.js';
    s.onload=function(){
      if(!window.pdfjsLib){ _pdfjsPromise=null; reject(new Error('PDF reader failed to load')); return; }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc='/vendor/pdfjs-'+PDFJS_VER+'.worker.min.js';
      resolve(window.pdfjsLib);
    };
    s.onerror=function(){ _pdfjsPromise=null; reject(new Error('PDF reader failed to load')); };
    document.head.appendChild(s);
  });
  return _pdfjsPromise;
}

function _fcSetPdfStatus(msg,err){
  _fc.pdfStatus=msg?{msg:msg,err:!!err}:null;
  const el=document.getElementById('fc-pdf-status');
  if(!el) return;
  el.style.display=msg?'block':'none';
  el.style.color=err?'var(--amb)':'var(--grn)';
  el.textContent=msg||'';
}

async function fcLoadPdf(input){
  const file=input.files&&input.files[0];
  input.value=''; // let the same file be picked again
  if(!file) return;
  if(file.size>30*1024*1024){ _fcSetPdfStatus('That PDF is over 30 MB. Split it or paste the text instead.',true); return; }
  _fcSetPdfStatus('Reading '+file.name+'…');
  try{
    const pdfjs=await _loadPdfJs();
    const data=new Uint8Array(await file.arrayBuffer());
    const doc=await pdfjs.getDocument({data:data}).promise;
    const LIMIT=FC_MAX_INPUT*4;
    let text='', pages=0;
    for(let p=1;p<=doc.numPages&&text.length<LIMIT;p++){
      const page=await doc.getPage(p);
      const tc=await page.getTextContent();
      let line='';
      tc.items.forEach(function(it){ line+=it.str+(it.hasEOL?'\n':' '); });
      text+=line.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').trim()+'\n\n';
      pages=p;
    }
    text=text.replace(/\n{3,}/g,'\n\n').trim();
    if(text.replace(/\s/g,'').length<FC_MIN_INPUT){
      _fcSetPdfStatus('This PDF looks like scanned images, so there is no text to read. Copy and paste the text instead.',true);
      return;
    }
    _fc.lastInput=text;
    const ta=document.getElementById('fc-input-text'); if(ta) ta.value=text;
    _fcUpdateCharCount();
    const more=pages<doc.numPages?' (first '+pages+' of '+doc.numPages+' pages)':' ('+pages+' page'+(pages===1?'':'s')+')';
    _fcSetPdfStatus('✓ Loaded '+file.name+more+'.'+(text.length>FC_MAX_INPUT?' Only the first '+FC_MAX_INPUT.toLocaleString()+' characters are used, so trim it to the part you want to study.':''));
  }catch(e){
    console.warn('[Ledger] PDF import failed:', e && e.message);
    const msg=/password/i.test(e&&e.name||'')||/password/i.test(e&&e.message||'')
      ? 'This PDF is password-protected. Remove the password or paste the text instead.'
      : /failed to load/i.test(e&&e.message||'')
        ? 'Could not load the PDF reader. Check your connection and try again.'
        : 'Could not read this PDF. Copy and paste the text instead.';
    _fcSetPdfStatus(msg,true);
  }
}

// Keyboard review: Space/Enter flips, 1-3 grade a flipped card, arrows move.
document.addEventListener('keydown',function(e){
  if(currentTab!=='studylab'||_fc.view!=='generate'||_fc.mode!=='flashcard'||!_fc.cards.length||_fc.current>=_fc.cards.length) return;
  if(_curSub('studylab')!=='tools'||e.metaKey||e.ctrlKey||e.altKey) return;
  const t=e.target, tag=t&&t.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||tag==='BUTTON'||(t&&t.isContentEditable)) return;
  if(document.querySelector('.modal-overlay.open,#quiz-overlay[style*="block"]')) return;
  if(e.key===' '||e.key==='Enter'){ e.preventDefault(); fcFlipCard(); }
  else if(_fc.flipped&&(e.key==='1'||e.key==='2'||e.key==='3')){ e.preventDefault(); fcSRSGrade(parseInt(e.key,10)-1); }
  else if(!_fc.flipped&&e.key==='ArrowRight'){ e.preventDefault(); fcNav(1); }
  else if(!_fc.flipped&&e.key==='ArrowLeft'){ e.preventDefault(); fcNav(-1); }
});

function fcFlipCard() {
  _fc.flipped = !_fc.flipped;
  _fcRender();
}

function fcNav(dir) {
  _fc.current = Math.max(0, Math.min(_fc.cards.length-1, _fc.current + dir));
  _fc.flipped = false;
  _fcRender();
}

function fcGoto(idx) {
  _fc.current = idx; _fc.flipped = false;
  _fcRender();
}

function fcShuffle() {
  for (let i = _fc.cards.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [_fc.cards[i],_fc.cards[j]] = [_fc.cards[j],_fc.cards[i]];
  }
  _fc.current = 0; _fc.flipped = false;
  _fcRender();
  showToast('Deck shuffled! ✓','ok');
}

function fcRestart() {
  _fc.current = 0; _fc.flipped = false;
  _fcRender();
}

function fcSelectAnswer(idx) {
  if (_fc.quizAns) return;
  _fc.quizSel = idx;
  _fcRender();
}

function fcSubmitAnswer() {
  if (_fc.quizSel === null) return;
  _fc.quizAns = true;
  const q = _fc.quizQ[_fc.quizCur];
  if (_fc.quizSel === q.correct) _fc.quizScore++;
  else (_fc.quizMissed = _fc.quizMissed || []).push({i:_fc.quizCur, sel:_fc.quizSel});
  _fcRender();
}

function fcNextQuizQ() {
  _fc.quizCur++;
  _fc.quizSel = null;
  _fc.quizAns = false;
  _fcRender();
}

function fcRestartQuiz() {
  _fc.quizCur = 0; _fc.quizSel = null; _fc.quizAns = false; _fc.quizScore = 0; _fc.quizMissed = [];
  _fcRender();
}

// ── SRS GRADING ──
function fcSRSGrade(grade){ // 0=missed, 1=almost, 2=correct
  const card=_fc.cards[_fc.current];
  if(!card)return;
  if(!card.ease)card.ease=2.5;
  if(!card.interval)card.interval=1;
  if(!card.timesCorrect)card.timesCorrect=0;
  if(!card.timesMissed)card.timesMissed=0;

  if(grade===2){
    card.timesCorrect++;
    card.ease=Math.max(1.3,card.ease+0.1);
    card.interval=Math.max(1,Math.round(card.interval*card.ease));
  } else if(grade===1){
    card.interval=Math.max(1,Math.round(card.interval*0.8));
  } else {
    card.timesMissed++;
    card.ease=Math.max(1.3,card.ease-0.2);
    card.interval=1;
  }
  card.nextReview=Date.now()+card.interval*86400000;

  // Persist to saved deck
  if(_fc.activeDeckId){
    const decks=_fcGetDecks();
    const deck=decks[_fc.activeDeckId];
    if(deck){
      const ci=deck.cards.findIndex(c=>c.id===card.id);
      if(ci>=0)Object.assign(deck.cards[ci],{ease:card.ease,interval:card.interval,nextReview:card.nextReview,timesCorrect:card.timesCorrect,timesMissed:card.timesMissed});
      _fcDecks=decks;_fcSaveDecks();
    }
  }

  _fc.current++;
  _fc.flipped=false;
  _fcRender();
}

// ── DECK MANAGEMENT ──
function fcSaveDeck(){
  if(!_fc.cards.length){showToast('No cards to save','err');return;}
  const name=(document.getElementById('fc-save-name')?.value||'').trim()||'Deck '+new Date().toLocaleDateString();
  const decks=_fcGetDecks();
  const id='d'+Date.now();
  decks[id]={id,name,section:_fc.genType||'',created:Date.now(),
    cards:_fc.cards.map(c=>({...c,id:c.id||'c'+Math.random().toString(36).slice(2)}))};
  _fcDecks=decks;_fcSaveDecks();
  _fc.activeDeckId=id;
  showToast('"'+name+'" saved — '+_fc.cards.length+(_fc.cards.length===1?' card':' cards'),'ok');
  _fcRender();
}

function fcLoadDeck(id){
  const deck=_fcGetDecks()[id];
  if(!deck)return;
  _fc.cards=deck.cards.map(c=>({...c}));
  _fc.current=0;_fc.flipped=false;_fc.mode='flashcard';
  _fc.activeDeckId=id;_fc.view='generate';
  _fcRender();
}

function fcDeleteDeck(id){
  const decks=_fcGetDecks();
  if(!decks[id])return;
  const name=decks[id].name;
  delete decks[id];
  _fcDecks=decks;_fcSaveDecks();
  showToast('"'+name+'" deleted','ok');
  _fcRender();
}

// (Removed dead "Configure AI Generation" BYO-key modal — AI generation runs
// server-side via /api/ask on the app's key; it was unreachable and its cost copy
// ("~$0.001/deck") was stale. Generation is gated by FLASHCARD_LIMIT instead.)

