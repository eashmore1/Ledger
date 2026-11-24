/* Ledger service worker.
 *
 * Two jobs:
 *  1. Show push notifications while the app is closed, and open the right page
 *     when one is tapped.
 *  2. Let the app open with no connection. Pages are always fetched fresh when
 *     online (so a deploy is never hidden behind a stale copy); the cached copy
 *     is only a fallback. Sessions logged offline are kept by the app itself and
 *     sync when the connection returns.
 */
'use strict';
const VERSION = 'ledger-v15';
const SHELL = ['/', '/logo.svg', '/css/app.css?v=1cdbcdb3', '/icons.js?v=68639721', '/mascot.js?v=99334d09', '/calc.js?v=8c236bed', '/moderation.js?v=00756301', '/js/firebase.js?v=89e91a14', '/js/onboarding-tour.js?v=3cf3999e', '/js/core.js?v=d0bb19ec', '/js/subscription.js?v=bdc9c9e1', '/js/auth.js?v=41ee5432', '/js/onboarding.js?v=caa9c4c8', '/js/app-shell.js?v=9df03d49', '/js/today.js?v=c15d7741', '/js/rooms-and-push.js?v=e656e80b', '/js/feed.js?v=a2f9fa8a', '/js/dashboard.js?v=189a8ac4', '/js/profile-explore.js?v=30554473', '/js/sessions.js?v=01ec6ce1', '/js/social.js?v=a8c2299a', '/js/messages-clubs.js?v=c463cebe', '/js/misc.js?v=0ad17a93', '/js/settings.js?v=afa4793e', '/js/question-bank.js?v=322152c8', '/js/progress-report.js?v=bff75f61', '/js/ask-ledger.js?v=ed5ccc54', '/js/study-lab.js?v=472d5c3a', '/js/study-plan.js?v=31108201', '/js/engagement.js?v=b4696e9c', '/js/start.js?v=e60ee834', '/js/consent-and-keyboard.js?v=cd1dd4db', '/fonts/fonts.css', '/fonts/libre-franklin-latin-wght-normal.woff2', '/fonts/fraunces-latin-opsz-normal.woff2', '/fonts/fraunces-latin-opsz-italic.woff2', '/manifest.json', '/icons/icon-192.png'];
// Third-party scripts and fonts the app shell needs to boot offline.
const CDN_OK = /^https:\/\/(www\.gstatic\.com\/firebasejs\/|cdn\.jsdelivr\.net\/npm\/|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/'))) return;

  // Pages: network first, cached shell when offline. On a weak connection the
  // app used to sit on a blank screen until the whole page downloaded; now, if
  // the network hasn't answered in 3.5s and a cached copy exists, that copy is
  // shown and the download carries on in the background for next time.
  if (req.mode === 'navigate') {
    if (!sameOrigin) return;
    const net = fetch(req).then((res) => {
      if (res.ok && url.pathname === '/') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('/', copy)); }
      return res;
    });
    const cached = () => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('/'));
    event.waitUntil(net.catch(() => {}));
    event.respondWith(new Promise((resolve) => {
      let done = false;
      const fallback = () => cached().then((hit) => { if (!done && hit) { done = true; resolve(hit); } return hit; });
      const timer = setTimeout(fallback, 3500);
      net.then((res) => { clearTimeout(timer); if (!done) { done = true; resolve(res); } })
        .catch(() => { clearTimeout(timer); fallback().then((hit) => { if (!done) { done = true; resolve(hit || Response.error()); } }); });
    }));
    return;
  }

  // Static files and the pinned CDN scripts: answer from cache, refresh in the background.
  const cacheable = sameOrigin ? /\.(?:js|css|svg|png|jpg|jpeg|webp|ico|json|woff2?)$/.test(url.pathname) : CDN_OK.test(req.url);
  if (!cacheable) return;
  event.respondWith(
    caches.open(VERSION).then((cache) => cache.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || fresh;
    }))
  );
});

// ── Push ────────────────────────────────────────────────────────────────────
// Messages are sent data-only ({title, body, url, tag, type}) and shown here.
function readPush(event) {
  try {
    const j = event.data ? event.data.json() : {};
    const d = Object.assign({}, j.notification || {}, j.data || {});
    return { title: String(d.title || 'Ledger'), body: String(d.body || ''), url: String(d.url || '/'), tag: String(d.tag || d.type || 'ledger'), type: String(d.type || '') };
  } catch (e) {
    return { title: 'Ledger', body: '', url: '/', tag: 'ledger', type: '' };
  }
}

self.addEventListener('push', (event) => {
  const msg = readPush(event);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // If Ledger is open and in front, hand the message to the page instead of
      // raising a system notification on top of it.
      const front = list.find((c) => c.visibilityState === 'visible' && c.focused);
      if (front) { front.postMessage({ source: 'ledger-sw', kind: 'push', msg }); return; }
      return self.registration.showNotification(msg.title, {
        body: msg.body, tag: msg.tag, renotify: true,
        icon: '/icons/icon-192.png', badge: '/icons/badge-96.png',
        data: { url: msg.url, type: msg.type },
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.url) || '/';
  // Only ever open our own pages.
  let target;
  try { const u = new URL(raw, self.location.origin); target = u.origin === self.location.origin ? u.href : self.location.origin + '/'; }
  catch (e) { target = self.location.origin + '/'; }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.location.origin));
      if (open) { open.postMessage({ source: 'ledger-sw', kind: 'open', url: target }); return open.focus(); }
      return self.clients.openWindow(target);
    })
  );
});
