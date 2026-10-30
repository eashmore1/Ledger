// Ledger icon library — minimal line icons used in place of emoji.
// Each icon renders at 1em (matches the font-size of whatever text it sits
// in) and uses currentColor, so it drops into existing ad-hoc font-size
// styling without any layout changes at the call site.
(function(){
  'use strict';
  const ICONS = {
    arrow:        '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check:        '<path d="M4 12.5l5 5L20 6.5"/>',
    x:            '<path d="M6 6l12 12M18 6L6 18"/>',
    starFilled:   '<path d="M12 2.5l2.9 6.2 6.7.7-5 4.7 1.4 6.6L12 17.6l-6 3.1 1.4-6.6-5-4.7 6.7-.7z" fill="currentColor" stroke="none"/>',
    starOutline:  '<path d="M12 2.5l2.9 6.2 6.7.7-5 4.7 1.4 6.6L12 17.6l-6 3.1 1.4-6.6-5-4.7 6.7-.7z"/>',
    lock:         '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock:       '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 7.4-2"/>',
    heartFilled:  '<path d="M12 20s-7.5-4.6-10-9.3C.5 7.4 2.4 4 6 4c2 0 3.6 1.2 4.5 2.6C11.4 5.2 13 4 15 4c3.6 0 5.5 3.4 4 6.7C19.5 15.4 12 20 12 20z" fill="currentColor" stroke="none"/>',
    heartOutline: '<path d="M12 20s-7.5-4.6-10-9.3C.5 7.4 2.4 4 6 4c2 0 3.6 1.2 4.5 2.6C11.4 5.2 13 4 15 4c3.6 0 5.5 3.4 4 6.7C19.5 15.4 12 20 12 20z"/>',
    bell:         '<path d="M7 17h10M9 3.6A5 5 0 0 1 17 8v4.5l1.5 3H5.5L7 12.5V8c0-.9.2-1.7.6-2.4"/><path d="M10.5 20a1.5 1.5 0 0 0 3 0"/>',
    chat:         '<path d="M4 5h16v10H9l-4 4v-4H4z"/>',
    warning:      '<path d="M12 4.5L21 19H3z"/><path d="M12 10v4"/><circle cx="12" cy="16.6" r=".2" fill="currentColor" stroke="none"/>',
    bot:          '<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M12 3v3M9 13v1M15 13v1"/>',
    envelope:     '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/>',
    building:     '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    barChart:     '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    magnifier:    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M19.5 19.5L15 15"/>',
    scales:       '<path d="M12 3v3M6 6l-6 11h12zM18 6l6 11H12M12 6l-6 0M12 6l6 0M4 20h16"/>',
    lineChart:    '<path d="M3 20h18M4 16l5-6 4 3 6-8"/>',
    monitor:      '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
    calculator:   '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8"/><circle cx="8.5" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="15.5" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="8.5" cy="16" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r=".7" fill="currentColor" stroke="none"/><circle cx="15.5" cy="16" r=".7" fill="currentColor" stroke="none"/>',
    handshake:    '<path d="M2 12l4-3 3 1.5 3-1.5 3 2 4-2.5 3 2"/><path d="M9 10.5l3 3.5-2 2-4-4M15 10l3 4-2 2"/>',
    graduationCap:'<path d="M12 4L2 9l10 5 10-5-10-5z"/><path d="M6 11.5V16c0 1.1 2.7 2 6 2s6-.9 6-2v-4.5"/>',
    flame:        '<path d="M12 2c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1-.5-1.8-1-2.5 2 1 3.5 3 3.5 5.5a5 5 0 1 1-10 0C7.5 9 9 5.5 12 2z"/>',
    calendar:     '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8 3v3.5M16 3v3.5"/>',
    pencil:       '<path d="M4 20l1-4.2L15.8 5 19 8.2 8.2 19z"/><path d="M13.2 6.6l3.2 3.2"/>',
    clipboard:    '<rect x="6" y="5" width="12" height="16" rx="1.5"/><rect x="9" y="3" width="6" height="3.5" rx="1"/><path d="M9 11h6M9 14.5h6M9 18h4"/>',
    book:         '<path d="M4 5.5c2.5-1 5-1 8 .5v13c-3-1.5-5.5-1.5-8-.5z"/><path d="M20 5.5c-2.5-1-5-1-8 .5v13c3-1.5 5.5-1.5 8-.5z"/>',
  };

  function svg(name, opts){
    opts = opts || {};
    const body = ICONS[name];
    if(!body) return '';
    const cls = opts.className ? ` class="${opts.className}"` : '';
    let style = 'display:inline-block;vertical-align:-0.125em;flex:none;';
    if(opts.rotate) style += `transform:rotate(${opts.rotate}deg);`;
    if(opts.style) style += opts.style;
    return `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="${style}"${cls} aria-hidden="true">${body}</svg>`;
  }

  window.LedgerIcon = svg;
})();
