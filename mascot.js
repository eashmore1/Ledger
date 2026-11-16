// Ledger, the character: a small ledger book with a face, arms and legs.
// He is the study coach and the guide around the app and on the landing page.
//
//   LedgerBuddy('wave', 120)        full body, in a pose
//   LedgerBuddy.face(32)            head-and-shoulders, for avatars and buttons
//
// Poses: idle, wave, cheer, think, point, sleep, worry.
// Flat fills only (no gradients or ids), so any number can sit on one page.
(function(){
  'use strict';
  var C = { body:'#e2551c', bodyHi:'#f47a3f', spine:'#b23a08', limb:'#b23a08', page:'#fff6e6', pageLine:'#e4d2b4',
            ribbon:'#5a5fcf', shoe:'#3d3f9e', ink:'#2a1407', white:'#fff', cheek:'#ffb199' };

  var CSS =
    '.lm{display:inline-block;vertical-align:middle;overflow:visible;flex:none}' +
    '.lm .lm-bob{animation:lm-bob 3.6s ease-in-out infinite}' +
    '.lm .lm-eyes{transform-box:fill-box;transform-origin:center;animation:lm-blink 5s infinite}' +
    '.lm .lm-wave{transform-box:view-box;transform-origin:90px 62px;animation:lm-wave 1.5s ease-in-out infinite}' +
    '.lm .lm-cheer-l{transform-box:view-box;transform-origin:26px 60px;animation:lm-cheer 1s ease-in-out infinite}' +
    '.lm .lm-cheer-r{transform-box:view-box;transform-origin:90px 60px;animation:lm-cheer 1s ease-in-out infinite reverse}' +
    '.lm .lm-dot{animation:lm-dot 1.2s ease-in-out infinite}.lm .lm-dot.d2{animation-delay:.18s}.lm .lm-dot.d3{animation-delay:.36s}' +
    '.lm .lm-z{animation:lm-z 2.6s ease-in-out infinite}.lm .lm-z.z2{animation-delay:.9s}' +
    '.lm.lm-still *{animation:none!important}' +
    '@keyframes lm-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}' +
    '@keyframes lm-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}' +
    '@keyframes lm-wave{0%,100%{transform:rotate(0)}50%{transform:rotate(16deg)}}' +
    '@keyframes lm-cheer{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(7deg)}}' +
    '@keyframes lm-dot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}' +
    '@keyframes lm-z{0%{opacity:0;transform:translate(0,4px)}40%{opacity:1}100%{opacity:0;transform:translate(4px,-8px)}}' +
    '@media (prefers-reduced-motion:reduce){.lm *{animation:none!important}}';
  function injectCSS(){
    if(typeof document === 'undefined' || document.getElementById('lm-css')) return;
    var st = document.createElement('style'); st.id = 'lm-css'; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function arm(d, hx, hy, cls){
    return '<g' + (cls ? ' class="' + cls + '"' : '') + '><path d="' + d + '" fill="none" stroke="' + C.limb + '" stroke-width="6.5" stroke-linecap="round"/>' +
      '<circle cx="' + hx + '" cy="' + hy + '" r="5.6" fill="' + C.bodyHi + '" stroke="' + C.limb + '" stroke-width="2"/></g>';
  }
  var ARMS = {
    idle:  [arm('M27 62q-11 6-11 19', 16, 82), arm('M89 62q11 6 11 19', 100, 82)],
    wave:  [arm('M27 62q-11 6-11 19', 16, 82), arm('M89 61q13-3 15-22', 104.5, 38, 'lm-wave')],
    cheer: [arm('M27 60q-13-5-14-23', 12.5, 36, 'lm-cheer-l'), arm('M89 60q13-5 14-23', 103.5, 36, 'lm-cheer-r')],
    point: [arm('M27 62q-11 6-11 19', 16, 82), arm('M89 62q9-2 17-8', 107, 53)],
    sleep: [arm('M27 64q-9 8-8 18', 19, 83), arm('M89 64q9 8 8 18', 97, 83)],
    worry: [arm('M27 62q-12 2-12 -10', 15, 51), arm('M89 62q12 2 12 -10', 101, 51)],
    think: [arm('M27 62q-11 6-11 19', 16, 82), null], // right hand is drawn over the body, at the chin
  };

  function eyes(kind){
    var L = 49, R = 71, y = 50;
    if(kind === 'happy') return '<path d="M43 52q6-8 12 0M65 52q6-8 12 0" fill="none" stroke="' + C.ink + '" stroke-width="3.2" stroke-linecap="round"/>';
    if(kind === 'closed') return '<path d="M43 50q6 6 12 0M65 50q6 6 12 0" fill="none" stroke="' + C.ink + '" stroke-width="3" stroke-linecap="round"/>';
    var dx = kind === 'up' ? -1.4 : 0.6, dy = kind === 'up' ? -2.2 : 0.8;
    var one = function(x){
      return '<ellipse cx="' + x + '" cy="' + y + '" rx="7.2" ry="7.8" fill="' + C.white + '"/>' +
        '<circle class="lm-pupil" cx="' + (x + dx) + '" cy="' + (y + dy) + '" r="3.7" fill="' + C.ink + '"/>' +
        '<circle cx="' + (x + dx - 1.5) + '" cy="' + (y + dy - 1.6) + '" r="1.5" fill="' + C.white + '"/>';
    };
    return '<g class="lm-eyes">' + one(L) + one(R) + '</g>';
  }
  var MOUTH = {
    smile: '<path class="lm-smile" d="M53 64q7 6.5 14 0" fill="none" stroke="' + C.ink + '" stroke-width="3" stroke-linecap="round"/>',
    open:  '<path d="M51.5 62.5h17a8.5 8.5 0 0 1-17 0z" fill="' + C.ink + '"/><path d="M55.5 68.2a5 3.4 0 0 1 9 0 8.5 8.5 0 0 1-9 0z" fill="#ff8c7a"/>',
    small: '<path d="M56 65.5q4 2.5 8 0" fill="none" stroke="' + C.ink + '" stroke-width="3" stroke-linecap="round"/>',
    frown: '<path d="M54 67q6-5 12 0" fill="none" stroke="' + C.ink + '" stroke-width="3" stroke-linecap="round"/>',
    sleep: '<ellipse cx="60" cy="65.5" rx="3" ry="3.6" fill="' + C.ink + '"/>',
  };
  var POSE = {
    idle:  { eyes:'open',   mouth:'smile' },
    wave:  { eyes:'open',   mouth:'open'  },
    cheer: { eyes:'happy',  mouth:'open'  },
    point: { eyes:'open',   mouth:'smile' },
    think: { eyes:'up',     mouth:'small' },
    sleep: { eyes:'closed', mouth:'sleep' },
    worry: { eyes:'open',   mouth:'frown' },
  };

  // The book itself: cream pages showing on the right and bottom edge, an
  // orange cover with a darker spine, and a bookmark ribbon out of the top.
  function book(){
    return '<path d="M68 22V4.5l6 4.6 6-4.6V22z" fill="' + C.ribbon + '"/>' +
      '<rect x="29" y="21" width="67" height="81" rx="11" fill="' + C.page + '"/>' +
      '<path d="M92.5 30v62M89 100H40" fill="none" stroke="' + C.pageLine + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<rect x="24" y="17" width="66" height="81" rx="12" fill="' + C.body + '"/>' +
      '<path d="M36 17v81a12 12 0 0 1-12-12V29a12 12 0 0 1 12-12z" fill="' + C.spine + '"/>' +
      '<path d="M43 24h36a6 6 0 0 1 6 6v3H43z" fill="' + C.bodyHi + '" opacity=".55"/>';
  }
  function extras(pose){
    if(pose === 'think') return '<circle class="lm-dot" cx="97" cy="20" r="2.6" fill="' + C.ribbon + '"/><circle class="lm-dot d2" cx="105" cy="14" r="3.3" fill="' + C.ribbon + '"/><circle class="lm-dot d3" cx="114" cy="7" r="4" fill="' + C.ribbon + '"/>';
    if(pose === 'sleep') return '<text class="lm-z" x="96" y="26" font-family="system-ui,sans-serif" font-weight="800" font-size="13" fill="' + C.ribbon + '">z</text><text class="lm-z z2" x="105" y="14" font-family="system-ui,sans-serif" font-weight="800" font-size="17" fill="' + C.ribbon + '">z</text>';
    if(pose === 'worry') return '<path d="M43 41.5l10-3M77 41.5l-10-3" fill="none" stroke="' + C.ink + '" stroke-width="2.8" stroke-linecap="round"/>' +
      '<path d="M96 22c2.4 3.2 3.6 5.4 3.6 7a3.6 3.6 0 0 1-7.2 0c0-1.6 1.2-3.8 3.6-7z" fill="#8fd3ff"/>';
    if(pose === 'cheer') return '<path d="M8 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM110 8l1.5 3.6 3.6 1.5-3.6 1.5L110 18l-1.5-3.4-3.6-1.5 3.6-1.5z" fill="#f5b73a"/>';
    return '';
  }
  function face(pose){
    var p = POSE[pose] || POSE.idle;
    return eyes(p.eyes) + MOUTH[p.mouth] +
      '<circle cx="42" cy="61" r="3.4" fill="' + C.cheek + '" opacity=".75"/><circle cx="78" cy="61" r="3.4" fill="' + C.cheek + '" opacity=".75"/>';
  }

  function buddy(pose, size, opts){
    injectCSS();
    if(!POSE[pose]) pose = 'idle';
    opts = opts || {};
    size = size || 96;
    var arms = ARMS[pose];
    var cls = 'lm lm-' + pose + (opts.still ? ' lm-still' : '') + (opts.className ? ' ' + opts.className : '');
    var label = opts.label ? ' role="img" aria-label="' + String(opts.label).replace(/"/g, '&quot;') + '"' : ' aria-hidden="true"';
    return '<svg class="' + cls + '" viewBox="-2 -2 124 130" width="' + size + '" height="' + Math.round(size * 130 / 124) + '"' + label + (opts.style ? ' style="' + opts.style + '"' : '') + '>' +
      '<ellipse cx="60" cy="122" rx="27" ry="4" fill="#000" opacity=".13"/>' +
      '<g class="lm-bob">' +
        '<path d="M47 96v17M73 96v17" fill="none" stroke="' + C.limb + '" stroke-width="6.5" stroke-linecap="round"/>' +
        '<path d="M36 117.5a7 5.5 0 0 1 7-5.5h6a3.5 3.5 0 0 1 3.5 3.5v2zM84 117.5a7 5.5 0 0 0-7-5.5h-6a3.5 3.5 0 0 0-3.5 3.5v2z" fill="' + C.shoe + '"/>' +
        (arms[0] || '') + (arms[1] || '') +
        book() + face(pose) +
        (pose === 'think' ? arm('M89 70q4 14-13 9', 75, 76.5) : '') +
        extras(pose) +
      '</g></svg>';
  }

  // Head-and-shoulders crop for small sizes (avatars, the floating button).
  buddy.face = function(size, opts){
    injectCSS();
    opts = opts || {};
    size = size || 36;
    var pose = POSE[opts.pose] ? opts.pose : 'idle';
    return '<svg class="lm lm-face lb-face' + (opts.still ? ' lm-still' : '') + '" viewBox="19 1 77 77" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<g class="lm-bob">' + book() + face(pose) + '</g></svg>';
  };
  buddy.poses = Object.keys(POSE);
  buddy.NAME = 'Ledger';

  if(typeof window !== 'undefined') window.LedgerBuddy = buddy;
  if(typeof module !== 'undefined' && module.exports) module.exports = buddy;
})();
