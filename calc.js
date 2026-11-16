/* Ledger calculator — a floating, exam-style calculator shown next to the
 * Ledger button while a study session is running.
 *
 * It behaves like the basic calculator on the CPA exam: one operation at a
 * time (no operator precedence), memory keys, square root, percent, sign
 * change and backspace. The arithmetic engine is plain JS with no DOM so it
 * can be unit tested in Node (module.exports) as well as used in the page.
 */
(function (root) {
  'use strict';

  const MAX_DIGITS = 15;
  // 12 significant digits hides binary float noise (0.1 + 0.2 → 0.3) while
  // keeping more precision than any exam answer needs.
  const tidy = (n) => (Number.isFinite(n) ? parseFloat(n.toPrecision(12)) : NaN);
  const toStr = (n) => {
    if (!Number.isFinite(n)) return 'Error';
    if (Object.is(n, -0)) n = 0;
    const a = Math.abs(n);
    if (a !== 0 && (a >= 1e15 || a < 1e-9)) return n.toExponential(8).replace(/\.?0+e/, 'e');
    return String(n);
  };
  const apply = (a, op, b) => {
    switch (op) {
      case '+': return tidy(a + b);
      case '-': return tidy(a - b);
      case '*': return tidy(a * b);
      case '/': return b === 0 ? NaN : tidy(a / b);
    }
    return b;
  };

  function createEngine() {
    let cur = '0';      // what is on the display, as typed
    let acc = null;     // left-hand operand waiting for an operator
    let op = null;      // pending operator
    let fresh = true;   // next digit starts a new number
    let mem = 0;
    let last = null;    // {op, b} so a repeated "=" repeats the last step
    let err = false;

    const num = () => parseFloat(cur) || 0;
    const set = (n) => { cur = toStr(n); err = cur === 'Error'; };
    function clearAll() { cur = '0'; acc = null; op = null; fresh = true; last = null; err = false; }

    function press(k) {
      if (err && k !== 'C' && k !== 'CE' && k !== 'MC') return;
      if (err && k === 'CE') { clearAll(); return; }
      if (/^[0-9]$/.test(k)) {
        if (fresh || cur === '0') { cur = k; fresh = false; }
        else if (cur.replace(/[-.]/g, '').length < MAX_DIGITS) cur += k;
        return;
      }
      switch (k) {
        case '.':
          if (fresh) { cur = '0.'; fresh = false; }
          else if (!cur.includes('.') && !/e/.test(cur)) cur += '.';
          return;
        case '+': case '-': case '*': case '/':
          if (op && !fresh) { const r = apply(acc, op, num()); set(r); acc = r; }
          else acc = num();
          op = k; fresh = true; last = null;
          return;
        case '=': {
          if (op) {
            const b = num();
            const r = apply(acc, op, b);
            last = { op, b }; op = null; acc = null; set(r);
          } else if (last) set(apply(num(), last.op, last.b));
          fresh = true;
          return;
        }
        case '%':
          // 200 + 10% → 200 + 20 ; 200 × 10% → 200 × 0.1 ; 10% on its own → 0.1
          set(op && (op === '+' || op === '-') && acc !== null ? tidy(acc * num() / 100) : tidy(num() / 100));
          fresh = true;
          return;
        case 'sqrt':
          set(num() < 0 ? NaN : tidy(Math.sqrt(num()))); fresh = true;
          return;
        case 'neg':
          if (cur === '0' || cur === '0.') return;
          cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur;
          return;
        case 'back':
          if (fresh) return;
          cur = cur.length > 1 && !(cur.length === 2 && cur.startsWith('-')) ? cur.slice(0, -1) : '0';
          if (cur === '0') fresh = true;
          return;
        case 'C': clearAll(); return;
        case 'CE': cur = '0'; fresh = true; return;
        case 'MC': mem = 0; return;
        case 'MR': set(mem); fresh = true; return;
        case 'M+': mem = tidy(mem + num()); fresh = true; return;
        case 'M-': mem = tidy(mem - num()); fresh = true; return;
      }
    }

    const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    return {
      press,
      get value() { return cur; },
      get error() { return err; },
      get memory() { return mem; },
      // "1,234.5 ×" — the operand and operator waiting for the next number.
      get pending() { return op ? group(toStr(acc)) + ' ' + SYM[op] : ''; },
      display() { return err ? 'Error' : group(cur); },
    };
  }

  // Thousands separators for reading; the typed value itself stays plain.
  function group(s) {
    if (!/^-?\d+(\.\d*)?$/.test(s)) return s;
    const neg = s.startsWith('-'); if (neg) s = s.slice(1);
    const [i, f] = s.split('.');
    return (neg ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f !== undefined ? '.' + f : '');
  }

  const api = { createEngine, group };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  // ── Page UI ────────────────────────────────────────────────────────────────
  const KEYS = [
    // [label, key, class]
    ['MC', 'MC', 'sm'], ['MR', 'MR', 'sm'], ['M+', 'M+', 'sm'], ['M−', 'M-', 'sm'], ['√', 'sqrt', 'sm'], ['%', '%', 'sm'],
    ['C', 'C', 'fn'], ['CE', 'CE', 'fn'], ['⌫', 'back', 'fn'], ['÷', '/', 'op'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['×', '*', 'op'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['−', '-', 'op'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'op'],
    ['±', 'neg'], ['0', '0'], ['.', '.'], ['=', '=', 'eq'],
  ];
  const LABEL = { back: 'Backspace', neg: 'Change sign', sqrt: 'Square root', '/': 'Divide', '*': 'Multiply', '-': 'Subtract', '+': 'Add', '=': 'Equals', C: 'Clear all', CE: 'Clear entry', MC: 'Memory clear', MR: 'Memory recall', 'M+': 'Memory add', 'M-': 'Memory subtract' };
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let eng = null, panel = null, btn = null, inSession = false;

  function render() {
    if (!panel) return;
    panel.querySelector('.calc-val').textContent = eng.display();
    panel.querySelector('.calc-pend').textContent = eng.pending || ' ';
    panel.querySelector('.calc-mem').style.visibility = eng.memory !== 0 ? 'visible' : 'hidden';
  }
  function press(k) {
    eng.press(k); render();
    const b = panel && panel.querySelector('[data-k="' + CSS.escape(k) + '"]');
    if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
  }

  function build() {
    eng = eng || createEngine();
    btn = document.createElement('button');
    btn.id = 'calc-btn'; btn.className = 'calc-fab'; btn.type = 'button';
    btn.title = 'Calculator'; btn.setAttribute('aria-label', 'Calculator'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = root.LedgerIcon ? root.LedgerIcon('calculator') : '=';
    btn.addEventListener('click', () => toggle());
    panel = document.createElement('div');
    panel.id = 'calc-panel'; panel.className = 'calc-panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Calculator');
    panel.innerHTML =
      '<div class="calc-hd"><span class="calc-title">Calculator</span>' +
      '<button type="button" class="calc-x" aria-label="Close calculator">×</button></div>' +
      '<div class="calc-screen" aria-live="polite"><div class="calc-pend">&nbsp;</div>' +
      '<div class="calc-line"><span class="calc-mem" title="A number is stored in memory">M</span><span class="calc-val">0</span></div></div>' +
      '<div class="calc-keys">' + KEYS.map(([l, k, c]) =>
        '<button type="button" class="calc-k' + (c ? ' calc-' + c : '') + '" data-k="' + esc(k) + '"' +
        (LABEL[k] ? ' aria-label="' + esc(LABEL[k]) + '"' : '') + '>' + esc(l) + '</button>').join('') + '</div>';
    panel.querySelector('.calc-x').addEventListener('click', () => toggle(false));
    panel.querySelector('.calc-keys').addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k);
    });
    makeDraggable(panel, panel.querySelector('.calc-hd'));
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    render();
  }

  // Drag by the title bar so the calculator can be moved off the question.
  function makeDraggable(el, handle) {
    let sx, sy, ox, oy, dragging = false;
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const r = el.getBoundingClientRect();
      dragging = true; sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const w = el.offsetWidth, h = el.offsetHeight;
      const x = Math.max(4, Math.min(innerWidth - w - 4, ox + e.clientX - sx));
      const y = Math.max(4, Math.min(innerHeight - h - 4, oy + e.clientY - sy));
      Object.assign(el.style, { left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' });
    });
    const stop = () => { dragging = false; };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  function isOpen() { return !!(panel && panel.classList.contains('open')); }
  function toggle(force) {
    if (!panel) return;
    const open = force === undefined ? !isOpen() : !!force;
    panel.classList.toggle('open', open);
    btn.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  // Typing works while the calculator is open, unless a text field has focus.
  // Runs before the app's own key handlers (capture on window), so Escape
  // closes just the calculator, not the session screen behind it.
  window.addEventListener('keydown', (e) => {
    if (!isOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const map = { Enter: '=', '=': '=', Backspace: 'back', Delete: 'CE', Escape: null, x: '*', X: '*', ',': null };
    let k = Object.prototype.hasOwnProperty.call(map, e.key) ? map[e.key] : e.key;
    if (e.key === 'Escape') { toggle(false); e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (k && /^([0-9.+\-*/%=]|back|CE)$/.test(k)) { e.preventDefault(); e.stopImmediatePropagation(); press(k); }
  }, true);

  // Shown only while a session is running (or paused).
  function setSession(on) {
    on = !!on;
    if (on && !btn) build();
    if (!btn) return;
    inSession = on;
    btn.classList.toggle('show', on);
    if (!on) toggle(false);
  }

  root.LedgerCalc = Object.assign(api, { setSession, toggle, press: (k) => { if (!eng) eng = createEngine(); eng.press(k); render(); }, get value() { return eng ? eng.value : '0'; }, get visible() { return inSession; } });
})(typeof window !== 'undefined' ? window : globalThis);
