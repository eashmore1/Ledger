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
    creditCard:   '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18M7 15h4"/>',
    refresh:      '<path d="M4 11a8 8 0 0 1 14-5.3M20 13a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    user:         '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/>',
    shield:       '<path d="M12 3l7 3v5.5c0 4.5-3 7.6-7 9.5-4-1.9-7-5-7-9.5V6z"/>',
    database:     '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    headset:      '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19v1a2 2 0 0 1-2 2h-3"/>',

    // ─ Achievement badges ─
    footprints:   '<path d="M9 4.5c1.6 0 2.4 1.4 2.4 3.2 0 2-1.3 3.3-1.1 5.4.2 2-1 3.4-2.6 3.4S5 15.3 5.4 13.2C5.7 11 7.4 9.3 7.4 7.4c0-1.6.1-2.9 1.6-2.9z"/><path d="M15.5 9c1.6 0 2.4 1.4 2.4 3.2 0 2-1.3 3.3-1.1 5.4.2 2-1 3.4-2.6 3.4s-2.7-1.2-2.3-3.3c.3-2.2 2-3.9 2-5.8 0-1.6.1-2.9 1.6-2.9z"/>',
    target:       '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    medalRibbon:  '<circle cx="12" cy="15" r="5.5"/><path d="M9 5l-3 6.5M15 5l3 6.5"/><path d="M12 12.5l1.3 2.7 3 .4-2.2 2 .5 3-2.6-1.5-2.6 1.5.5-3-2.2-2 3-.4z" fill="currentColor" stroke="none"/>',
    medal:        '<circle cx="12" cy="15" r="5.5"/><circle cx="12" cy="15" r="2.3" fill="currentColor" stroke="none"/><path d="M9 5l3 5 3-5"/>',
    bicep:        '<path d="M5 14c0-5 2.5-9 6-9 2 0 2.8 1.4 2.8 3 0 1.4-1 2-1 3.4 0 2 2.2 1.6 2.2 4 0 2.8-2.4 5.6-6 5.6-2.3 0-4-1.8-4-4z"/>',
    bolt:         '<path d="M13 2L5 14h5l-1 8 8-12h-5z" fill="currentColor" stroke="none"/>',
    bulb:         '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2.1h5.2c0-.9.3-1.6.9-2.1A6 6 0 0 0 12 3z"/>',
    percent:      '<path d="M5 19L19 5"/><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/>',
    nut:          '<path d="M9 4h6l4 7-4 7H9l-4-7z"/><circle cx="12" cy="11" r="2.6"/>',
    mountain:     '<path d="M3 19h18L15 6l-3.5 5L9 8z"/><path d="M5.5 15.5l2-2.3 1.7 1.8"/>',
    roboticArm:   '<circle cx="6" cy="18" r="2.2"/><path d="M6 15.8V11l6-3 5 2.5"/><circle cx="17.5" cy="10.2" r="2.2"/>',
    calendarCheck:'<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8 3v3.5M16 3v3.5"/><path d="M9 14l2 2 4-4.5"/>',
    fist:         '<path d="M6 11V9a2 2 0 0 1 4 0M10 10.5V8a2 2 0 0 1 4 0M14 10.5V9a2 2 0 0 1 4 0v6.5a4.5 4.5 0 0 1-4.5 4.5h-2A5.5 5.5 0 0 1 6 14.5V12a1.5 1.5 0 0 1 3 0"/>',
    calendarDays: '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8 3v3.5M16 3v3.5M8 13h2M14 13h2M8 17h2"/>',
    burst:        '<path d="M12 2l1.4 4.6L17 3.8l-.8 4.8L21 7l-2.6 4 3.6 2-4 1.3 2 3.9-4.3-.8.4 4.6-3.6-2.6-2 4-1.6-4L5 21l.4-4.6-4.3.8 2-3.9-4-1.3 3.6-2L0 7l4.8 1.6L4 3.8l3.6 2.8z" fill="currentColor" stroke="none"/>',
    crown:        '<path d="M4 18h16l-1.5-9-3.5 3-3-5-3 5-3.5-3z"/>',
    gem:          '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6"/>',
    rocket:       '<path d="M12 2c3 1.5 5 5 5 9 0 2.5-1 4.7-2.4 6.3L12 20l-2.6-2.7C8 15.7 7 13.5 7 11c0-4 2-7.5 5-9z"/><circle cx="12" cy="10" r="1.6" fill="currentColor" stroke="none"/><path d="M9 16.5l-3 3.5 4-1M15 16.5l3 3.5-4-1"/>',
    dice:         '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r=".9" fill="currentColor" stroke="none"/>',
    brain:        '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 8 17a3 3 0 0 0 1-.2V6.5A2.5 2.5 0 0 0 9 4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8A3 3 0 0 1 16 17a3 3 0 0 1-1-.2V6.5A2.5 2.5 0 0 1 15 4z"/>',
    lotus:        '<path d="M12 20c-5-1-6-4.5-6-7 2 .5 4 2 6 5 2-3 4-4.5 6-5 0 2.5-1 6-6 7z"/><path d="M12 13c-3-1-4-4-4-7 2.5.5 4.5 2.5 4 7zM12 13c3-1 4-4 4-7-2.5.5-4.5 2.5-4 7z"/>',
    lion:         '<circle cx="12" cy="12" r="4"/><path d="M12 4c2 1.5 2 3 1 4.5M12 4c-2 1.5-2 3-1 4.5M5.5 7c1.5 1.8 2.5 3 2.9 4.8M18.5 7c-1.5 1.8-2.5 3-2.9 4.8M4 13c2 .3 3.2 1 4.3 2.4M20 13c-2 .3-3.2 1-4.3 2.4M7 19c1.2-1.4 2.6-2.1 5-2.1s3.8.7 5 2.1"/>',
    sun:          '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M3.5 12h3M17.5 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    owl:          '<circle cx="8" cy="11" r="3"/><circle cx="16" cy="11" r="3"/><circle cx="8" cy="11" r=".8" fill="currentColor" stroke="none"/><circle cx="16" cy="11" r=".8" fill="currentColor" stroke="none"/><path d="M12 8l-2-4.5h4z"/><path d="M6.5 14c-1 2-1 4.5.5 6M17.5 14c1 2 1 4.5-.5 6"/>',
    peace:        '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 12l-5.5 6M12 12l5.5 6"/>',
    trident:      '<path d="M12 21V8"/><path d="M8 4a3 3 0 1 0 4 4 3 3 0 1 0 4-4"/><path d="M8.5 9c1 .8 2.2 1 3.5 1s2.5-.2 3.5-1"/>',
    trophy:       '<path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 5.5H4a3 3 0 0 0 3 5M17 5.5h3a3 3 0 0 1-3 5"/><path d="M12 15v3M8.5 21h7l-.8-3h-5.4z"/>',
    sparkles:     '<path d="M12 3l1.2 4L17 8.2l-3.8 1.2L12 13.4 10.8 9.4 7 8.2l3.8-1.2z" fill="currentColor" stroke="none"/><path d="M5 15l.7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7z" fill="currentColor" stroke="none"/>',
    stadium:      '<ellipse cx="12" cy="12" rx="9" ry="5.5"/><ellipse cx="12" cy="12" rx="5" ry="2.8"/>',
    clap:         '<path d="M9 13l-3-5a1.6 1.6 0 1 1 2.8-1.5l1.9 3.3M12 11.3l-2.6-4.6a1.6 1.6 0 1 1 2.8-1.5l2.6 4.6M15 11l-1.8-3.2a1.6 1.6 0 1 1 2.8-1.5l2.6 4.6"/><path d="M7.5 12l-1-1.7a1.6 1.6 0 1 0-2.8 1.5l2.6 4.6a5 5 0 0 0 7 1.9l2-1.2a4 4 0 0 0 1.4-5.4l-1.3-2.4"/>',
    megaphone:    '<path d="M3 10v4h3l9 4V6l-9 4z"/><path d="M19 9.5a4 4 0 0 1 0 5"/><path d="M8 14v4a2 2 0 0 0 4 0v-3"/>',
    trumpet:      '<path d="M3 11l10-4v8L3 13z"/><path d="M13 7l7-1.5v9L13 13"/><circle cx="5" cy="12" r=".9" fill="currentColor" stroke="none"/><path d="M3 11v2"/>',
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
