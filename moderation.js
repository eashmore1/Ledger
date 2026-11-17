/* Ledger language filter — keeps cuss words, slurs and abusive phrases out of
 * comments. check(text) returns the offending word (or null); censor(text)
 * masks anything already posted.
 *
 * It catches the usual dodges: CAPS, repeated letters (fuuuck), look-alike
 * characters (sh1t, @ss, b!tch), symbols in place of vowels (f*ck) and
 * spaced-out letters (f u c k). Words are matched on word boundaries so normal
 * accounting words (class, assets, assessment, pass, analysis, Dickens,
 * cocktail, summa cum laude) are left alone.
 *
 * The word lists are ROT13-encoded only so the file doesn't read as a wall of
 * slurs; decode one with rot13() below. Plain DOM-free JS so it can be unit
 * tested in Node (module.exports) as well as used in the page.
 */
(function (root) {
  'use strict';

  const rot13 = (s) => s.replace(/[a-z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 97 + 13) % 26 + 97));
  const list = (s) => s.split(',').map(rot13);

  // Offensive anywhere inside a word ("youfucker", "bullshitting").
  const ANYWHERE = list('shpx,spx,cuhpx,fuvg,phag,ovgpu,ovngpu,avttre,avttn,zbgures,snttbg,sntbg,pbpxfhpx,juber,fyhg,gjng');
  // Offensive at the start of a word, with any ending ("asshole", "retarded").
  const PREFIX = list('nffubyr,nffung,qvpxurnq,qhzonff,wnpxnff,ohyyfuvg,ergneq,onfgneq,chffl,qvcfuvg,qbhpuront,tbqqnza,qnzzvg,qnzavg,fxnax,wvmm,oybjwbo,unaqwbo,qvyqb,cbea,encvfg,cvffrq,cvffvat,jnax,shxva');
  // Offensive only as a whole word.
  const EXACT = list('nff,nefr,qvpx,qvpxf,pbpx,pbpxf,gvgf,gvggl,gvggvrf,obbo,obbof,cvff,qnza,qnzarq,uryy,penc,penccl,cevpx,snt,sntf,phz,nany,encr,encrq,qbhpur,ubr,ubrf,ahqr,ahqrf,jgs,fgsh,tgsb,xlf,fzq,szy,fcvp,puvax,xvxr,genaal,fug,shx');
  // Abusive phrases.
  const PHRASES = list('xvyy lbhefrys,xvyy hefrys,xvyy lbhe frys,tb qvr,fhpx zl');
  // Real words and names that contain a listed word.
  const ALLOW = list('fuvvgnxr,fuvgnxr,fphagubecr,phz ynhqr,ergneqnag,ergneqngvba,ergneqre');

  // Characters people swap in for each letter.
  const LOOK = { a: 'a4@*', b: 'b8', e: 'e3*', g: 'g9', i: 'i1!l|*', l: 'l1|', o: 'o0*', s: 's5$z', t: 't7+', u: 'uv*' };
  const cls = (ch) => '[' + (LOOK[ch] || ch).replace(/[\\\]^-]/g, '\\$&') + ']';
  // "ass" → [a4@*]+[s5$z]{2,}: repeated letters still match, but a double
  // letter must stay doubled so "as" is not "ass".
  function pattern(word) {
    let out = '';
    for (let i = 0; i < word.length;) {
      if (word[i] === ' ') { out += '[\\s._-]+'; i++; continue; }
      let n = 1; while (word[i + n] === word[i]) n++;
      out += cls(word[i]) + (n === 1 ? '+' : '{' + n + ',}');
      i += n;
    }
    return out;
  }
  const B = '(?<![a-z0-9])', E = '(?![a-z0-9])';
  const RE = new RegExp([
    ...ANYWHERE.map((w) => pattern(w)),
    ...PREFIX.map((w) => B + pattern(w)),
    ...EXACT.map((w) => B + pattern(w) + E),
    ...PHRASES.map((w) => B + pattern(w)),
  ].join('|'), 'gi');

  function normalize(text) {
    let t = String(text || '').normalize('NFKD').replace(/[̀-ͯ​-‏⁠﻿]/g, '').toLowerCase();
    for (const w of ALLOW) t = t.split(w).join(' '.repeat(w.length));
    return t;
  }
  // "f u c k" / "f.u.c.k" → "fuck" (runs of three or more single characters).
  const joinSpaced = (t) => t.replace(/(?<![^\s._-])(?:[^\s._-][\s._-]+){2,}[^\s._-](?![^\s._-])/g, (m) => m.replace(/[\s._-]+/g, ''));

  function check(text) {
    const t = normalize(text);
    for (const s of [t, joinSpaced(t)]) {
      RE.lastIndex = 0;
      const m = RE.exec(s);
      if (m) return m[0].trim();
    }
    return null;
  }

  // Mask bad words in text that is already posted ("f***"). Lengths are kept
  // the same by normalize(), so match positions line up with the original.
  function censor(text) {
    const src = String(text || '');
    const t = normalize(src);
    if (t.length !== src.length) return check(src) ? '[removed: inappropriate language]' : src;
    let out = '', last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(t))) {
      out += src.slice(last, m.index) + src[m.index] + '*'.repeat(Math.max(1, m[0].length - 1));
      last = m.index + m[0].length;
      if (!m[0].length) RE.lastIndex++;
    }
    out += src.slice(last);
    return check(out) ? '[removed: inappropriate language]' : out;
  }

  const api = { check, censor, rot13 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LedgerModeration = api;
})(typeof window !== 'undefined' ? window : globalThis);
