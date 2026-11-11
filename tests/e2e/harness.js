// Emulator-backed harness for driving the signed-in app in a real browser.
//
// Requires the Firebase Auth + Firestore emulators to be running (see
// README "End-to-end tests"). The production index.html is served unchanged
// except for two injected lines that point the Firebase SDK at the local
// emulators; third-party CDN scripts are served from node_modules so the
// suite works offline.
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('../helpers/server');

const ROOT = path.resolve(__dirname, '..', '..');
const PROJECT = 'ledger-cpa';
const AUTH_EMU = process.env.AUTH_EMULATOR || 'http://127.0.0.1:9099';
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

const nm = (...p) => path.join(ROOT, 'node_modules', ...p);
const CDN = [
  [/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+\.js)/, (m) => nm('firebase', m[1])],
  [/canvas-confetti@[^/]+\/dist\/confetti\.browser\.min\.js/, () => nm('canvas-confetti', 'dist', 'confetti.browser.js')],
  [/otpauth@[^/]+\/dist\/otpauth\.umd\.min\.js/, () => nm('otpauth', 'dist', 'otpauth.umd.min.js')],
];

async function emulatorsUp() {
  try {
    const [a, f] = await Promise.all([fetch(AUTH_EMU + '/'), fetch('http://' + FS_HOST + '/')]);
    return a.ok && f.ok;
  } catch (e) { return false; }
}

// Load the repo's current firestore.rules into the running emulator, so the
// suite always tests the rules as committed (not whatever it booted with).
async function loadRules() {
  const content = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  const r = await fetch(`http://${FS_HOST}/emulator/v1/projects/${PROJECT}:securityRules`, {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content }] } }),
  });
  if (!r.ok) throw new Error('firestore.rules failed to compile: ' + (await r.text()));
}

async function resetEmulators() {
  await loadRules();
  await fetch(`${AUTH_EMU}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
  await fetch(`http://${FS_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
}

// Click the newest verification link for `email`, as the user would from their inbox.
async function verifyEmail(email) {
  const r = await fetch(`${AUTH_EMU}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes = [] } = await r.json();
  const code = oobCodes.filter((c) => c.email === email && c.requestType === 'VERIFY_EMAIL').pop();
  if (!code) throw new Error('no verification email was sent to ' + email);
  await fetch(code.oobLink, { redirect: 'manual' });
}

async function oobCodes() {
  const r = await fetch(`${AUTH_EMU}/emulator/v1/projects/${PROJECT}/oobCodes`);
  return (await r.json()).oobCodes || [];
}

function injectEmulators(html) {
  const [fh, fp] = FS_HOST.split(':');
  const out = html
    .replace('firebaseAuth = firebase.auth();',
      `firebaseAuth = firebase.auth(); firebaseAuth.useEmulator('${AUTH_EMU}',{disableWarnings:true});`)
    .replace('firebaseDb = firebase.firestore();',
      `firebaseDb = firebase.firestore(); firebaseDb.useEmulator('${fh}',${fp});`)
    // SRI hash is for the minified CDN build; we serve the npm build.
    .replace(/ integrity="sha384-[^"]+"/g, '');
  if (out === html) throw new Error('emulator injection points not found in index.html');
  return out;
}

async function launch() {
  const server = await startServer();
  // Page (127.0.0.1:<port>) -> emulator (127.0.0.1:9099) is a loopback fetch,
  // which newer Chromium gates behind a permission prompt.
  const browser = await chromium.launch({ args: ['--disable-features=LocalNetworkAccessChecks'] });
  return { server, browser, close: async () => { await browser.close(); await server.close(); } };
}

// A fresh browser profile (= one user's device). `api` maps '/api/x' -> handler(route, request).
async function newUser(env, { api = {}, viewport = { width: 1280, height: 900 } } = {}) {
  const context = await env.browser.newContext({ viewport });
  const errors = [];
  const isEmu = (url) => url.href.startsWith(AUTH_EMU) || url.host === FS_HOST;
  // Emulator traffic is left un-intercepted: routing it breaks CORS preflights.
  await context.route((url) => !isEmu(url), async (route) => {
    const req = route.request();
    const url = req.url();
    if (url.startsWith(env.server.url)) {
      const u = new URL(url);
      if (u.pathname.startsWith('/api/')) {
        const h = api[u.pathname];
        if (h) return h(route, req);
        return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"no mock"}' });
      }
      if (u.pathname.startsWith('/_vercel/')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
      if (req.resourceType() === 'document' && !/\.(html)$/.test(u.pathname.replace(/^\/index\.html$/, '')) &&
          !fs.existsSync(path.join(ROOT, u.pathname + '.html'))) {
        const res = await route.fetch();
        const body = await res.text();
        if (body.includes('FIREBASE_CONFIG')) return route.fulfill({ response: res, body: injectEmulators(body) });
        return route.fulfill({ response: res, body });
      }
      return route.continue();
    }
    for (const [re, file] of CDN) {
      const m = url.match(re);
      if (m) return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(file(m)) });
    }
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/ERR_FAILED|net::ERR|Failed to load resource/.test(t)) return; // blocked third-party beacons
    errors.push('console: ' + t.slice(0, 400));
  });
  page.on('dialog', (d) => d.accept().catch(() => {}));
  return { context, page, errors };
}

module.exports = { loadRules, launch, newUser, emulatorsUp, resetEmulators, verifyEmail, oobCodes, PROJECT, AUTH_EMU, FS_HOST };

// Full new-account path through the real UI: sign up, verify, sign in, onboard.
async function signUpAndOnboard(env, { name, email, password = 'Passw0rd!x', firm = '', url = '/' , api } = {}) {
  const u = await newUser(env, { api });
  const p = u.page;
  await p.goto(env.server.url + url, { waitUntil: 'load' });
  await p.waitForSelector('.auth-tab');
  await p.click('#cookie-banner button:has-text("Accept")');
  await p.click('.auth-tab:has-text("Create Account")');
  await p.fill('#auth-name', name);
  await p.fill('#auth-email', email);
  await p.fill('#auth-pass', password);
  await p.click('.auth-form-btn');
  await p.waitForSelector('text=Already verified? Sign in');
  await verifyEmail(email);
  await p.click('text=Already verified? Sign in');
  await p.fill('#auth-email', email);
  await p.fill('#auth-pass', password);
  await p.click('.auth-form-btn');
  await p.waitForSelector('#ob-name');
  await p.fill('#ob-name', name.split(' ')[0]);
  await p.selectOption('#ob-state', 'TX');
  await p.click('.ob-big-btn');               // profile -> plan preview
  await p.waitForSelector('.ob-btn-back');
  await p.click('.ob-big-btn');               // -> exam dates
  await p.waitForSelector('#date-FAR');
  await p.click('.ob-big-btn');               // -> cohort
  await p.waitForSelector('#ob-firm');
  if (firm) await p.fill('#ob-firm', firm);
  await p.click('.ob-big-btn');               // finish
  await p.waitForSelector('.nav-tab');
  u.uid = await p.evaluate(() => AUTH.uid);
  return u;
}
module.exports.signUpAndOnboard = signUpAndOnboard;

// Sign an existing, verified account in on a brand-new browser profile (= another device).
async function signIn(env, { email, password = 'Passw0rd!x', api } = {}) {
  const u = await newUser(env, { api });
  const p = u.page;
  await p.goto(env.server.url + '/', { waitUntil: 'load' });
  await p.waitForSelector('.auth-tab');
  await p.click('#cookie-banner button:has-text("Accept")');
  await p.fill('#auth-email', email);
  await p.fill('#auth-pass', password);
  await p.click('.auth-form-btn');
  return u;
}

// Dismiss first-run overlays (plan offer, guided tour, study nudge) so they don't intercept clicks.
async function clearFirstRun(p) {
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    try { onbSkipAll(); } catch (e) {}
    // The "leave a review" sheet opens 5s after milestone sessions and covers the page.
    window.showReviewPrompt = () => {};
    document.getElementById('post-ob-offer')?.remove();
    document.getElementById('study-nudge-banner')?.remove();
  });
}

// Log a study session through the real timer UI. The clock is advanced by
// back-dating the timer's start instead of actually waiting.
async function logSession(p, { material = 'Leases — ASC 842', minutes = 90 } = {}) {
  // The "leave a review" sheet appears a few seconds after milestone sessions.
  await p.evaluate(() => { document.getElementById('review-prompt-sheet')?.remove(); openSessionModal(); });
  await p.waitForSelector('#ss-mat');
  await p.fill('#ss-mat', material);
  await p.click('.sess-start-btn');
  await p.evaluate((s) => { TS.startTime = Date.now() - s * 1000; }, minutes * 60);
  await p.click('.sess-ctrl-end');
  await p.waitForSelector('.sess-save-btn');
  await p.click('.sess-save-btn');
  await p.waitForSelector('#session-logged-modal');
  await p.evaluate(() => { S.reviewLeft = true; closeSessionLoggedModal(); });
}

// Wait for the debounced cloud sync (3s) to land.
const settle = (p, ms = 4500) => p.waitForTimeout(ms);

// App-level problems only (ignores blocked analytics beacons).
const appErrors = (u) => u.errors.filter((e) => !/analytics|measurement/i.test(e));

Object.assign(module.exports, { signIn, clearFirstRun, logSession, settle, appErrors });
