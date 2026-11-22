// ═══════════════════════════════════════════════
// IN-APP PROGRESS REPORT
// ═══════════════════════════════════════════════
let _prRange = 7; // 7 or 30

function openProgressReport() {
  let el = document.getElementById('progress-report-modal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'progress-report-modal';
    el.style.cssText = 'display:none;position:fixed;inset:0;background:var(--bg);z-index:600;overflow-y:auto';
    document.body.appendChild(el);
  }
  el.style.display = 'block';
  renderProgressReport();
}

function closeProgressReport() {
  const el = document.getElementById('progress-report-modal');
  if (el) el.style.display = 'none';
}

function renderProgressReport() {
  const el = document.getElementById('progress-report-modal');
  if (!el) return;
  const days = _prRange;
  const cutoff = new Date(Date.now() - days * 86400000);
  const acts = (S.activities || []).filter(function(a){ return new Date(a.date) >= cutoff; });
  const totalHrs = acts.reduce(function(s,a){ return s+(a.hours||0); }, 0);
  const sessions = acts.length;
  const streak = getStreak();
  const sectionsActive = [...new Set(acts.map(function(a){ return a.section; }))].length;

  // 7-day chart
  const today = todayStr();
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = _ymd(new Date(Date.now() - i * 86400000));
    const hrs = (S.activities||[]).filter(function(a){ return a.date.slice(0,10)===d; }).reduce(function(s,b){ return s+(b.hours||0); },0);
    last7.push({d, hrs, isToday: d===today, day: new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'})});
  }
  const maxHrs = Math.max(...last7.map(function(d){ return d.hrs; }), 1);
  const chartBars = last7.map(function(d) {
    return '<div class="week-bar-wrap">' +
      '<div class="week-bar' + (d.isToday?' today-bar':'') + '" style="height:' + Math.max(4,Math.round(d.hrs/maxHrs*88)) + 'px" title="' + d.hrs.toFixed(1) + 'h"></div>' +
      '<div class="week-day-lbl">' + d.day.slice(0,1) + '</div>' +
    '</div>';
  }).join('');

  // Section breakdown
  const sectionRows = (S.sections || []).map(function(s) {
    const target = getHourGoal(s);
    const logged = getSectionHours(s);
    const rangeHrs = acts.filter(function(a){ return a.section===s; }).reduce(function(sum,a){ return sum+(a.hours||0); },0);
    const pct = Math.min(100, Math.round(logged / target * 100));
    return '<div style="margin-bottom:14px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span class="badge badge-' + s + '">' + s + '</span>' +
          '<span style="font-size:12px;font-weight:600">' + EXAMS[s].full + '</span>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<span style="font-size:13px;font-weight:800;color:' + EXAMS[s].color + '">' + rangeHrs.toFixed(1) + 'h</span>' +
          '<span style="font-size:10px;color:var(--mut)"> this period · ' + logged + 'h total</span>' +
        '</div>' +
      '</div>' +
      '<div class="prog-bar"><div class="prog-fill" style="width:' + pct + '%;background:' + EXAMS[s].color + '"></div></div>' +
      '<div style="font-size:10px;color:var(--mut);margin-top:3px">' + pct + '% of ' + target + 'h target</div>' +
    '</div>';
  }).join('');

  // Days studied in last 30
  const last30dates = new Set();
  const thirtyAgo = new Date(Date.now() - 30 * 86400000);
  (S.activities||[]).forEach(function(a){ if(new Date(a.date)>=thirtyAgo) last30dates.add(a.date.slice(0,10)); });
  const daysStudied30 = last30dates.size;
  const habitScore = Math.round(daysStudied30 / 30 * 100);

  // Top study day
  const dayCounts = {};
  (S.activities||[]).forEach(function(a){
    const dow = new Date(a.date).toLocaleDateString('en-US',{weekday:'long'});
    dayCounts[dow] = (dayCounts[dow]||0) + (a.hours||0);
  });
  const topDay = Object.keys(dayCounts).sort(function(a,b){ return dayCounts[b]-dayCounts[a]; })[0] || 'N/A';

  // Insights
  const insights = [];
  const weekHrs = getWeekHours();
  const weekGoal = S.hoursPerWeek || 15;
  if (weekHrs >= weekGoal) {
    insights.push('You hit your weekly goal of ' + weekGoal + 'h this week. Keep this pace to stay on track for your exam dates.');
  } else {
    insights.push('You\'ve logged ' + weekHrs.toFixed(1) + 'h this week vs your ' + weekGoal + 'h goal. ' + (weekGoal - weekHrs).toFixed(1) + 'h more to reach it.');
  }
  if (streak >= 7) {
    insights.push('Your ' + streak + '-day streak is exceptional — consistency is the #1 predictor of passing. Protect it.');
  } else if (streak > 0) {
    insights.push('You\'re on a ' + streak + '-day streak. Aim for 7 days to build lasting study momentum.');
  }
  if (habitScore >= 70) {
    insights.push('You studied ' + daysStudied30 + ' of the last 30 days (' + habitScore + '%). That study habit score puts you in the top tier of CPA candidates.');
  } else {
    insights.push('You studied ' + daysStudied30 + '/30 days (' + habitScore + '% habit score). Increasing consistency — even short sessions — will compound your progress.');
  }

  el.innerHTML =
    '<div style="max-width:860px;margin:0 auto;padding:32px 24px 80px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">' +
        '<div>' +
          '<h1 style="font-size:26px;font-weight:900;letter-spacing:-.03em">Your Progress Report</h1>' +
          '<p style="font-size:12px;color:var(--mut);margin-top:3px">' + new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) + ' · ' + S.name + '</p>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<div style="display:flex;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;overflow:hidden">' +
            '<button onclick="_prRange=7;renderProgressReport()" style="padding:6px 14px;border:none;font-size:12px;font-weight:700;cursor:pointer;background:' + (days===7?'var(--ora)':'transparent') + ';color:' + (days===7?'#fff':'var(--sub)') + '">7 Days</button>' +
            '<button onclick="_prRange=30;renderProgressReport()" style="padding:6px 14px;border:none;font-size:12px;font-weight:700;cursor:pointer;background:' + (days===30?'var(--ora)':'transparent') + ';color:' + (days===30?'#fff':'var(--sub)') + '">30 Days</button>' +
          '</div>' +
          '<button onclick="closeProgressReport()" style="padding:8px 16px;background:var(--surf);border:1.5px solid var(--bdr);border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;color:var(--sub)">✕ Close</button>' +
        '</div>' +
      '</div>' +

      '<div class="stats-grid" style="margin-bottom:20px">' +
        [
          {v:totalHrs.toFixed(1),l:'Hours ('+days+'d)',c:'var(--ora)'},
          {v:sessions,l:'Sessions',c:'var(--ind)'},
          {v:streak+'d',l:'Active Streak',c:'#f59e0b'},
          {v:sectionsActive,l:'Sections Active',c:'var(--grn)'},
        ].map(function(s){ return '<div class="stat-box" style="border-top:3px solid '+s.c+'"><div class="stat-val" style="color:'+s.c+'">'+s.v+'</div><div class="stat-lbl">'+s.l+'</div></div>'; }).join('') +
      '</div>' +

      '<div class="card card-pad" style="margin-bottom:16px">' +
        '<div class="section-title">Section Breakdown</div>' +
        sectionRows +
      '</div>' +

      '<div class="card card-pad" style="margin-bottom:16px">' +
        '<div class="section-title">Study Trend — Last 7 Days</div>' +
        '<div class="week-chart">' + chartBars + '</div>' +
        '<div style="font-size:10px;color:var(--mut);text-align:center;margin-top:4px">Hours per day · <span style="color:var(--ind)">■</span> Today</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
        '<div class="card card-pad">' +
          '<div class="section-title">Session Consistency</div>' +
          '<div style="font-size:32px;font-weight:900;color:' + (habitScore>=70?'var(--grn)':habitScore>=40?'var(--amb)':'var(--red)') + '">' + habitScore + '%</div>' +
          '<div style="font-size:12px;color:var(--sub);margin-top:4px">' + daysStudied30 + ' of last 30 days studied</div>' +
          '<div class="prog-bar" style="margin-top:10px"><div class="prog-fill" style="width:' + habitScore + '%;background:' + (habitScore>=70?'var(--grn)':habitScore>=40?'var(--amb)':'var(--red)') + '"></div></div>' +
        '</div>' +
        '<div class="card card-pad">' +
          '<div class="section-title">Study Patterns</div>' +
          '<div style="margin-bottom:10px"><div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Top Study Day</div>' +
          '<div style="font-size:18px;font-weight:800;color:var(--ora)">' + topDay + '</div></div>' +
          '<div><div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Total Hours (All Time)</div>' +
          '<div style="font-size:18px;font-weight:800;color:var(--ind)">' + Math.round(getTotalHours()) + 'h</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="card card-pad">' +
        '<div class="section-title">Study Insights</div>' +
        insights.map(function(ins){ return '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--bdr)">' +
          '<span style="color:var(--ora);font-size:16px;flex-shrink:0">→</span>' +
          '<p style="font-size:13px;color:var(--sub);line-height:1.65;margin:0">' + ins + '</p>' +
        '</div>'; }).join('') +
      '</div>' +

      '<div class="card card-pad" id="pr-ai-advice-card">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center">'+LedgerBuddy.face(28,{still:true})+'</div>' +
            '<div class="section-title" style="margin:0">AI Study Advice</div>' +
          '</div>' +
          '<div style="font-size:10px;font-weight:700;color:var(--grn);display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:var(--grn);display:inline-block"></span>Powered by Claude</div>' +
        '</div>' +
        '<div id="pr-ai-advice-body">' +
          '<div style="display:flex;align-items:center;gap:8px;color:var(--mut);font-size:12px"><span style="width:8px;height:8px;border-radius:50%;background:var(--ind);animation:ledger-dot 1.2s infinite;display:inline-block"></span>Analyzing your progress...</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  _prLoadAIAdvice(totalHrs, sessions, streak, habitScore, daysStudied30, days);
}

function _prLoadAIAdvice(totalHrs, sessions, streak, habitScore, daysStudied30, rangeDays) {
  const secs = S.sections || [];
  const sectionLines = secs.map(function(s) {
    const logged = getSectionHours(s);
    const goal = getHourGoal(s);
    const examDate = S.examDates && S.examDates[s];
    const daysLeft = examDate ? Math.max(0, Math.round((new Date(examDate+' 00:00:00') - Date.now()) / 86400000)) : null;
    const scores = (S.practiceScores||{})[s]||[];
    const avgScore = scores.length ? Math.round(scores.slice(-5).reduce(function(a,b){return a+(b.score||0);},0)/Math.min(5,scores.length)) : null;
    return '- ' + s + ': ' + logged.toFixed(1) + '/' + goal + 'h' +
      (daysLeft !== null ? ', ' + daysLeft + 'd to exam' : '') +
      (avgScore !== null ? ', avg score ' + avgScore + '%' : ', no practice scores yet');
  }).join('\n');
  const readiness = calcReadinessScore();
  const prompt = 'A CPA candidate has the following study data for the last ' + rangeDays + ' days:\n\n' +
    'Total hours logged: ' + totalHrs.toFixed(1) + 'h\n' +
    'Sessions: ' + sessions + '\n' +
    'Active streak: ' + streak + ' days\n' +
    'Habit score: ' + habitScore + '% (' + daysStudied30 + '/30 days studied)\n' +
    'Readiness score: ' + readiness.score + '/100 (' + readiness.label + ')\n' +
    'Weighted practice-exam average: ' + (readiness.practiceAvg!=null ? readiness.practiceAvg + ' (75 is the pass line)' : 'none logged yet — treat readiness as unproven') + '\n' +
    'Section progress:\n' + sectionLines + '\n\n' +
    'Give 4-5 specific, actionable bullet points of advice. Be direct and concrete — name specific sections, concepts, or exam areas they should focus on. Mention any red flags you see in the data. End with one motivating sentence. Format as bullet points starting with •.';

  _fcCallAI(prompt, 500).then(function(advice) {
    const body = document.getElementById('pr-ai-advice-body');
    if (!body) return;
    if (!advice) {
      body.innerHTML = '<div style="font-size:12px;color:var(--mut)">Could not load AI advice right now — try again in a moment.</div>';
      return;
    }
    const bullets = advice.split('\n').filter(function(l){ return l.trim(); });
    body.innerHTML = bullets.map(function(line) {
      const clean = line.replace(/^[•\-\*]\s*/, '');
      const isBullet = /^[•\-\*]/.test(line.trim());
      if (!isBullet && bullets.indexOf(line) === bullets.length - 1) {
        return '<p style="font-size:12px;color:var(--ind);font-weight:700;margin:12px 0 0;line-height:1.55">' + clean + '</p>';
      }
      return '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--bdr)">' +
        '<span style="color:var(--ind);font-size:14px;flex-shrink:0;margin-top:1px">•</span>' +
        '<p style="font-size:12px;color:var(--sub);line-height:1.65;margin:0">' + clean + '</p>' +
      '</div>';
    }).join('');
  }).catch(function() {
    const body = document.getElementById('pr-ai-advice-body');
    if (body) body.innerHTML = '<div style="font-size:12px;color:var(--mut)">Could not load AI advice.</div>';
  });
}

