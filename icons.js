// Ledger icon library — minimal line icons used in place of emoji.
// Each icon renders at 1em (matches the font-size of whatever text it sits
// in) and uses currentColor, so it drops into existing ad-hoc font-size
// styling without any layout changes at the call site.
(function(){
  'use strict';
  // A few shapes (handshake, flame, footprints, thumbs-up) are adapted from
  // Lucide (ISC License, https://lucide.dev).
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
    bellOff:      '<path d="M7 17h10M9 3.6A5 5 0 0 1 17 8v4.5l1.5 3H5.5L7 12.5V8c0-.9.2-1.7.6-2.4"/><path d="M10.5 20a1.5 1.5 0 0 0 3 0"/><path d="M3.5 3.5l17 17"/>',
    warning:      '<path d="M12 4.5L21 19H3z"/><path d="M12 10v4"/><circle cx="12" cy="16.6" r=".2" fill="currentColor" stroke="none"/>',
    bot:          '<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M12 3v3M9 13v1M15 13v1"/>',
    envelope:     '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/>',
    building:     '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    barChart:     '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    magnifier:    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M19.5 19.5L15 15"/>',
    scales:       '<path d="M12 3v17M7 20h10M5 7h14"/><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/>',
    lineChart:    '<path d="M3 20h18M4 16l5-6 4 3 6-8"/>',
    monitor:      '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
    calculator:   '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8"/><circle cx="8.5" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="15.5" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="8.5" cy="16" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r=".7" fill="currentColor" stroke="none"/><circle cx="15.5" cy="16" r=".7" fill="currentColor" stroke="none"/>',
    handshake:    '<path d="M11 17l2 2a1 1 0 1 0 3-3"/><path d="M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7.1-.9l.5.3a2 2 0 0 0 1.4.3L21 4"/><path d="M21 3l1 11h-2"/><path d="M3 3L2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    graduationCap:'<path d="M12 4L2 9l10 5 10-5-10-5z"/><path d="M6 11.5V16c0 1.1 2.7 2 6 2s6-.9 6-2v-4.5"/>',
    flame:        '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
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
    footprints:   '<path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0z"/><path d="M20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0z"/><path d="M16 17h4M4 13h4"/>',
    target:       '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    medalRibbon:  '<circle cx="12" cy="15" r="6"/><path d="M8.6 10.1L6 3h4l2 4.2L14 3h4l-2.6 7.1"/><path d="M11 13.5l1.3-1v5.5"/>',
    medal:        '<circle cx="12" cy="15" r="5.5"/><circle cx="12" cy="15" r="2.3" fill="currentColor" stroke="none"/><path d="M9 5l3 5 3-5"/>',
    bicep:        '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    bolt:         '<path d="M13 2L5 14h5l-1 8 8-12h-5z" fill="currentColor" stroke="none"/>',
    bulb:         '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2.1h5.2c0-.9.3-1.6.9-2.1A6 6 0 0 0 12 3z"/>',
    percent:      '<path d="M5 19L19 5"/><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/>',
    nut:          '<path d="M9 4h6l4 7-4 7H9l-4-7z"/><circle cx="12" cy="11" r="2.6"/>',
    mountain:     '<path d="M3 19h18L15 6l-3.5 5L9 8z"/><path d="M5.5 15.5l2-2.3 1.7 1.8"/>',
    roboticArm:   '<circle cx="12" cy="9" r="6"/><path d="M8.6 14l-1.6 8 5-3 5 3-1.6-8"/><path d="M12 6.5l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z"/>',
    calendarCheck:'<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8 3v3.5M16 3v3.5"/><path d="M9 14l2 2 4-4.5"/>',
    fist:         '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4.5L17 13H5"/>',
    calendarDays: '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8 3v3.5M16 3v3.5M8 13h2M14 13h2M8 17h2"/>',
    burst:        '<path d="M12 2l1.4 4.6L17 3.8l-.8 4.8L21 7l-2.6 4 3.6 2-4 1.3 2 3.9-4.3-.8.4 4.6-3.6-2.6-2 4-1.6-4L5 21l.4-4.6-4.3.8 2-3.9-4-1.3 3.6-2L0 7l4.8 1.6L4 3.8l3.6 2.8z" fill="currentColor" stroke="none"/>',
    crown:        '<path d="M4 18h16l-1.5-9-3.5 3-3-5-3 5-3.5-3z"/>',
    gem:          '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6"/>',
    rocket:       '<path d="M12 2c3 1.5 5 5 5 9 0 2.5-1 4.7-2.4 6.3L12 20l-2.6-2.7C8 15.7 7 13.5 7 11c0-4 2-7.5 5-9z"/><circle cx="12" cy="10" r="1.6" fill="currentColor" stroke="none"/><path d="M9 16.5l-3 3.5 4-1M15 16.5l3 3.5-4-1"/>',
    dice:         '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r=".9" fill="currentColor" stroke="none"/>',
    brain:        '<path d="M12 5a3 3 0 0 0-5.9-.6A3 3 0 0 0 4 9.5a3.5 3.5 0 0 0 1.5 6.3A3.2 3.2 0 0 0 12 18z"/><path d="M12 5a3 3 0 0 1 5.9-.6A3 3 0 0 1 20 9.5a3.5 3.5 0 0 1-1.5 6.3A3.2 3.2 0 0 1 12 18z"/><path d="M12 5v15M8.5 10.5c1 0 2 .7 2 2M15.5 10.5c-1 0-2 .7-2 2"/>',
    lotus:        '<path d="M12 20c-5-1-6-4.5-6-7 2 .5 4 2 6 5 2-3 4-4.5 6-5 0 2.5-1 6-6 7z"/><path d="M12 13c-3-1-4-4-4-7 2.5.5 4.5 2.5 4 7zM12 13c3-1 4-4 4-7-2.5.5-4.5 2.5-4 7z"/>',
    lion:         '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M7 10.5v3M11 10.5v3M15 10.5v3"/>',
    sun:          '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M3.5 12h3M17.5 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    owl:          '<path d="M6 4l2.5 2h7L18 4v10a6 6 0 0 1-12 0z"/><circle cx="9.5" cy="10.5" r="2"/><circle cx="14.5" cy="10.5" r="2"/><path d="M11.2 13.6l.8 1 .8-1"/>',
    peace:        '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 12l-5.5 6M12 12l5.5 6"/>',
    trident:      '<path d="M12 21V3M6 4v4a6 6 0 0 0 12 0V4M10 5l2-2 2 2M4.5 5.5L6 4l1.5 1.5M16.5 5.5L18 4l1.5 1.5"/>',
    trophy:       '<path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 5.5H4a3 3 0 0 0 3 5M17 5.5h3a3 3 0 0 1-3 5"/><path d="M12 15v3M8.5 21h7l-.8-3h-5.4z"/>',
    sparkles:     '<path d="M12 3l1.2 4L17 8.2l-3.8 1.2L12 13.4 10.8 9.4 7 8.2l3.8-1.2z" fill="currentColor" stroke="none"/><path d="M5 15l.7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7z" fill="currentColor" stroke="none"/>',
    stadium:      '<path d="M9 21V9h6v12M3 21v-7h6M15 21v-9h6v9M2 21h20"/><path d="M12 3.5l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z"/>',
    clap:         '<path d="M7 10v11"/><path d="M15 5.9L14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7a2 2 0 0 1-1.9 1.4H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3l3.5-7a2.6 2.6 0 0 1 4.5 2.9z"/>',
    megaphone:    '<path d="M3 10v4h3l9 4V6l-9 4z"/><path d="M19 9.5a4 4 0 0 1 0 5"/><path d="M8 14v4a2 2 0 0 0 4 0v-3"/>',
    trumpet:      '<path d="M3 11l10-4v8L3 13z"/><path d="M13 7l7-1.5v9L13 13"/><circle cx="5" cy="12" r=".9" fill="currentColor" stroke="none"/><path d="M3 11v2"/>',

    // ─ Added with the emoji replacement ─
    users:        '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3 2.6-5 6-5s6 2 6 5"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.3c2.1.7 3.5 2.4 3.5 4.7"/>',
    moon:         '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    coffee:       '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3v2.5M12.5 3v2.5"/>',
    gear:         '<circle cx="12" cy="12" r="2.8"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    bed:          '<path d="M3 18.5V6.5M3 14.5h18v4M21 14.5V13a3 3 0 0 0-3-3h-7v4.5"/><circle cx="7" cy="11" r="1.8"/>',
    plane:        '<path d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M21 3L10 13"/>',
    wave:         '<path d="M8 12.5V6a1.5 1.5 0 0 1 3 0v5M11 10.5v-6a1.5 1.5 0 0 1 3 0v6M14 10.5V6a1.5 1.5 0 0 1 3 0v8.5a5.5 5.5 0 0 1-5.5 5.5h-.8a5.5 5.5 0 0 1-4.4-2.2L4 14.5a1.5 1.5 0 0 1 2.4-1.8L8 14.5"/>',
    pin:          '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    timer:        '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 3h5M12 3v3"/>',
    alarm:        '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M4 6.5L7 4M20 6.5L17 4"/>',
    hourglass:    '<path d="M7 3h10M7 21h10M8 3v3.5c0 2 4 3.5 4 5.5s-4 3.5-4 5.5V21M16 3v3.5c0 2-4 3.5-4 5.5s4 3.5 4 5.5V21"/>',
    camera:       '<path d="M4 8h3.5L9 5.5h6L16.5 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.2" r="3.3"/>',
    globe:        '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
    cloud:        '<path d="M7 18.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6-1.2A4.6 4.6 0 0 1 17 18.5z"/>',
    phone:        '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M12 7v6.5M9.5 11l2.5 2.5 2.5-2.5M10.5 18h3"/>',
    compass:      '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    columns:      '<path d="M3 9.5L12 4l9 5.5zM4.5 20h15M6.5 10v7.5M10.2 10v7.5M13.8 10v7.5M17.5 10v7.5"/>',
    briefcase:    '<rect x="3" y="7.5" width="18" height="12" rx="1.5"/><path d="M9 7.5v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
    sprout:       '<path d="M12 21v-9"/><path d="M12 14c0-3.5-2.5-5.5-7-5.5 0 3.5 2.5 5.5 7 5.5zM12 11c0-3.5 2.5-5.5 7-5.5 0 3.5-2.5 5.5-7 5.5z"/>',
    sunrise:      '<path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 5v3M4.5 10.5l2 2M19.5 10.5l-2 2"/>',
    leaf:         '<path d="M5 19C5 10 10 5 20 5c0 10-5 15-15 14z"/><path d="M5 19c3-5 6-8 10-10"/>',
    trendDown:    '<path d="M3 4v16h18"/><path d="M6 8l5 5 3-3 6 6"/>',
    upload:       '<path d="M12 15V4M8 8l4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
    inbox:        '<path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5.5a3.5 3.5 0 0 0 7 0H21"/>',
    home:         '<path d="M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
    party:        '<path d="M4 20l4.5-12 7.5 7.5z"/><path d="M14 4v2.5M19.5 9.5H17M18.5 4.5L16 7M11.5 3.5c1 .8 1 2 .2 3M20.5 12.5c-.8-1-2-1-3-.2"/>',
    checkCircle:  '<circle cx="12" cy="12" r="9"/><path d="M7.8 12.4l3 3 5.4-6"/>',
    square:       '<rect x="4.5" y="4.5" width="15" height="15" rx="2.5"/>',
    faceGreat:    '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M7.5 13.5h9a4.5 4.5 0 0 1-9 0z"/>',
    faceGood:     '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/>',
    faceOkay:     '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M8.5 15.5h7"/>',
    faceRough:    '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M8.5 16.5c1-1.2 2.2-1.8 3.5-1.8s2.5.6 3.5 1.8"/><path d="M19.2 2.2c1 1.3 1.5 2.2 1.5 2.9a1.5 1.5 0 0 1-3 0c0-.7.5-1.6 1.5-2.9z" fill="currentColor" stroke="none"/>',
    faceBad:      '<circle cx="12" cy="12" r="9"/><path d="M7.3 10.6l2.7-1.2M16.7 10.6L14 9.4"/><path d="M8.5 17a3.5 3.5 0 0 1 7 0z"/>',
    faceGrit:     '<circle cx="12" cy="12" r="9"/><path d="M7 8l3.5 1.5M17 8l-3.5 1.5"/><circle cx="9" cy="11.3" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="11.3" r="1" fill="currentColor" stroke="none"/><path d="M9 16.5c1-.8 2-1.2 3-1.2s2 .4 3 1.2"/>',
    faceSweat:    '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M7.5 13.5h9a4.5 4.5 0 0 1-9 0z"/><path d="M19.2 2.2c1 1.3 1.5 2.2 1.5 2.9a1.5 1.5 0 0 1-3 0c0-.7.5-1.6 1.5-2.9z" fill="currentColor" stroke="none"/>',
    faceThink:    '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M13.5 7.3c1-.6 2-.6 3 0"/><path d="M9 16l5.5-1.2"/>',
    faceDizzy:    '<circle cx="12" cy="12" r="9"/><path d="M7.5 8.5l3 3M10.5 8.5l-3 3M13.5 8.5l3 3M16.5 8.5l-3 3"/><circle cx="12" cy="16" r="1.6"/>',
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


  // Emoji that older data and call sites still carry (club icons and session
  // moods are stored as emoji) → the drawn icon that replaces each on screen.
  const EMOJI = {
    '📚':'book',
    '📖':'book',
    '🔥':'flame',
    '⚡':'bolt',
    '📅':'calendar',
    '🗓':'calendarDays',
    '💯':'medalRibbon',
    '📊':'barChart',
    '🎯':'target',
    '🚀':'rocket',
    '🏆':'trophy',
    '✅':'checkCircle',
    '🎓':'graduationCap',
    '🧠':'brain',
    '🏔':'mountain',
    '💥':'burst',
    '👑':'crown',
    '🏢':'building',
    '🌙':'moon',
    '☕':'coffee',
    '⚖':'scales',
    '💪':'bicep',
    '🔍':'magnifier',
    '🧮':'calculator',
    '📝':'pencil',
    '🏛':'columns',
    '🏅':'medal',
    '🛡':'shield',
    '📤':'upload',
    '🤖':'bot',
    '🤝':'handshake',
    '🔒':'lock',
    '🔓':'unlock',
    '✨':'sparkles',
    '⭐':'starFilled',
    '🌟':'starFilled',
    '📧':'envelope',
    '✉':'envelope',
    '📬':'inbox',
    '📭':'inbox',
    '🎉':'party',
    '🔔':'bell',
    '💬':'chat',
    '⚙':'gear',
    '🧡':'heartFilled',
    '🤍':'heartOutline',
    '👋':'wave',
    '🌱':'sprout',
    '🌅':'sunrise',
    '😄':'faceGreat',
    '🙂':'faceGood',
    '😐':'faceOkay',
    '😓':'faceRough',
    '😩':'faceBad',
    '😤':'faceGrit',
    '😅':'faceSweat',
    '🤔':'faceThink',
    '😵':'faceDizzy',
    '📈':'lineChart',
    '📉':'trendDown',
    '⏰':'alarm',
    '⏱':'timer',
    '⏳':'hourglass',
    '👥':'users',
    '👤':'user',
    '📍':'pin',
    '📷':'camera',
    '🏚':'home',
    '📋':'clipboard',
    '🌐':'globe',
    '💎':'gem',
    '💼':'briefcase',
    '👏':'clap',
    '🟢':'chat',
    '💳':'creditCard',
    '🧭':'compass',
    '🧘':'lotus',
    '🔄':'refresh',
    '⬜':'square',
    '🌿':'leaf',
    '☁':'cloud',
    '📲':'phone',
    '✈':'plane',
    '🛌':'bed',
    '⚠':'warning'
  };
  // A few icons read better in their natural colour than in the text colour.
  const TINT = { checkCircle:'var(--grn)', flame:'#f97316', warning:'#f59e0b', starFilled:'#f59e0b', heartFilled:'var(--ora)', bolt:'#f59e0b' };
  const escText = (v) => String(v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ico('flame') or ico('🔥') → drawn icon. Anything else (a letter, an emoji
  // with no drawing) comes back as escaped text, so it is safe in innerHTML.
  // opts.plain keeps the surrounding text colour.
  function ico(x, opts){
    if(x == null || x === '') return '';
    const key = String(x);
    const name = Object.prototype.hasOwnProperty.call(ICONS, key) ? key : EMOJI[key.replace(/\uFE0F/g, '')];
    if(!name) return escText(key);
    opts = opts || {};
    if(TINT[name] && !opts.plain) opts = Object.assign({}, opts, { style: 'color:' + TINT[name] + ';' + (opts.style || '') });
    return svg(name, opts);
  }

  window.LedgerIcon = svg;
  window.ico = ico;
  window.LedgerIconNames = Object.keys(ICONS);
})();
