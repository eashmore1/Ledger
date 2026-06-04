with open('/home/user/Ledger/index.html', 'r') as f:
    lines = f.readlines()

# 1) Fix _mountPageShell — remove max-width:680px constraint
for i, l in enumerate(lines):
    if 'max-width:680px;margin:0 auto;padding:0 0 80px' in l and 'uprofile-page-wrap' in l:
        lines[i] = l.replace(
            'max-width:680px;margin:0 auto;padding:0 0 80px',
            'max-width:1160px;margin:0 auto;padding:var(--sp-5) var(--sp-5) 96px'
        )
        print(f"Shell fix: line {i+1}")
        break

# 2) Verify anchors for block replacement
assert 'document.title=`${u.name}' in lines[7433], f"Anchor not at 7434: {repr(lines[7433][:60])}"
assert '</div>`;\n' == lines[7498], f"End not at 7499: {repr(lines[7498][:60])}"
print("Anchors verified OK")

new_block = """  // Pre-computed sidebar cards
  const _sideAboutRows=[
    u.school?`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bdr)"><span style="font-size:16px;width:22px;flex-shrink:0;text-align:center">🎓</span><div><div style="font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px">School</div><div style="font-size:13px;font-weight:700">${u.school}${u.classYear?' · '+u.classYear:''}</div></div></div>`:null,
    u.state?`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bdr)"><span style="font-size:16px;width:22px;flex-shrink:0;text-align:center">📍</span><div><div style="font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px">Location</div><div style="font-size:13px;font-weight:700">${u.state}</div></div></div>`:null,
    u.disc?`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bdr)"><span style="font-size:16px;width:22px;flex-shrink:0;text-align:center">📋</span><div><div style="font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px">Discipline</div><div style="font-size:13px;font-weight:700">${u.disc}</div></div></div>`:null,
    u.firmName?`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0"><span style="font-size:16px;width:22px;flex-shrink:0;text-align:center">🏢</span><div><div style="font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px">Firm</div><div style="font-size:13px;font-weight:700">${u.firmName}</div></div></div>`:null,
  ].filter(Boolean).join('');
  const _sideAboutCard=_sideAboutRows?`<div class="sb-card"><div class="sb-title">About</div>${_sideAboutRows}</div>`:'';
  const _sideProgCard=sectionProgress?`<div class="sb-card"><div class="sb-title">Exam Progress</div>${sectionProgress}</div>`:'';
  const _sideAchCard=u.achievements.length?`<div class="sb-card"><div class="sb-title">Achievements (${u.achievements.length})</div>${_achPreviewHTML(u.achievements,'view-ach',false)}</div>`:'';

  document.title=`${u.name} — Ledger`;
  document.getElementById('uprofile-content').innerHTML=`

  <!-- HERO (full width) -->
  <div class="profile-hero" style="border-radius:16px;margin-bottom:20px">
    <div class="profile-hero-inner">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:80px;height:80px;border-radius:50%;background:${u.color};border:3px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;color:#fff">${avatarInner}</div>
          <div>
            <div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.15">${u.name}${u.isPrivate?' <span style="font-size:13px;opacity:.65">🔒</span>':''} ${tierBadge}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:3px">${[u.disc,u.state,u.classYear].filter(Boolean).join(' · ')}</div>
            ${u.bio?`<div style="font-size:12px;color:rgba(255,255,255,.72);margin-top:5px;line-height:1.5;max-width:420px">${u.bio}</div>`:''}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;padding-top:2px">
          <button id="vp-follow-btn" onclick="toggleFollowViewProfile('${u.uid}')" style="${followBtnStyle}">${followBtnLabel}</button>
          <button onclick="openDirectMessage('${u.uid}','${u.name}','${u.initials}')" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.85);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer">💬</button>
        </div>
      </div>
      <!-- Stats row -->
      <div style="display:flex;gap:0;padding-top:14px;border-top:1px solid rgba(255,255,255,.12)">
        ${[
          {v:Math.round(u.hoursTotal),l:'Hours',c:'rgba(212,64,0,.9)',fn:''},
          u.streak?{v:u.streak,l:'Streak',c:'#fff',fn:''}:null,
          u.sessionCount?{v:u.sessionCount,l:'Sessions',c:'#fff',fn:''}:null,
          !isLocked?{v:u.followersCount||0,l:'Followers',c:'#fff',fn:`openUserFollowList('${u.uid}','followers','${u.name}')`}:null,
          !isLocked?{v:u.followingCount||0,l:'Following',c:'#fff',fn:`openUserFollowList('${u.uid}','following','${u.name}')`}:null,
        ].filter(Boolean).map(s=>`<div onclick="${s.fn||''}" style="flex:1;text-align:center;${s.fn?'cursor:pointer':''}">
          <div style="font-size:22px;font-weight:900;color:${s.c};letter-spacing:-.04em;line-height:1">${s.v}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;font-weight:600">${s.l}</div>
        </div>`).join('<div style="width:1px;background:rgba(255,255,255,.1)"></div>')}
      </div>
    </div>
  </div>

  <!-- 2-COLUMN LAYOUT -->
  <div class="profile-layout">

    <!-- LEFT: Activity feed -->
    <div>
      <div style="font-size:15px;font-weight:800;margin-bottom:14px">Activity</div>
      ${activityFeed}
    </div>

    <!-- RIGHT: Sidebar -->
    <div class="profile-sidebar">
      ${_sideAboutCard}
      ${_sideProgCard}
      ${_sideAchCard}
    </div>

  </div>
`;\n"""

lines[7433:7499] = [new_block]

with open('/home/user/Ledger/index.html', 'w') as f:
    f.writelines(lines)

print(f"Done. Total lines: {len(lines)}")
