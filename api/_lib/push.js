// ─────────────────────────────────────────────────────────────────────────────
// Ledger — push notification helpers (shared by /api/notify and /api/cron-reminders)
//
// Data model (Firestore):
//   notify/{uid}      Written by the user's own device. Their time zone, streak,
//                     last study day, this week's hours, upcoming exam dates,
//                     notification preferences and the push tokens of the devices
//                     they turned notifications on for.
//   notifyMeta/{uid}  Written only here (Admin SDK). Send counters and "already
//                     sent" markers, so a user can't reset their own limits.
//
// Files in api/_lib are not deployed as endpoints.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';
const admin = require('firebase-admin');

function initAdmin() {
  if (!admin.apps.length) {
    let serviceAccount;
    try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'); } catch (e) {}
    if (serviceAccount && serviceAccount.project_id) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  }
  return admin.apps.length > 0;
}

// Which Settings → Notifications switch governs each kind of push.
const PREF_FOR = {
  streak: 'streak_alerts',
  reminder: 'study_reminders',
  recap: 'study_reminders',
  exam: 'study_reminders',
  kudos: 'props_notifs',
  comment: 'props_notifs',
  follow: 'leaderboard',
  dm: 'messages',
  crew: 'crew_activity',
  nudge: 'nudges',
};
const DAILY_CAP = 8;  // pushes per person per day, all kinds together
const CREW_CAP = 3;   // of which "someone you follow studied / opened a room"

function prefOn(profile, type) {
  const key = PREF_FOR[type];
  if (!key) return true;
  const prefs = (profile && profile.prefs) || {};
  return prefs[key] !== false; // every kind defaults to on
}

// The calendar day, hour and weekday where the user is.
function localParts(tz, now) {
  const d = now instanceof Date ? now : new Date(now || Date.now());
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'America/Chicago', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', weekday: 'short',
    }).formatToParts(d);
  } catch (e) {
    return localParts('America/Chicago', d); // unknown zone string
  }
  const get = (t) => (parts.find((p) => p.type === t) || {}).value;
  const ymd = `${get('year')}-${get('month')}-${get('day')}`;
  return { ymd, hour: parseInt(get('hour'), 10), dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')) };
}
function addDays(ymd, n) {
  const d = new Date(ymd + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const hrs = (n) => { n = Math.round((Number(n) || 0) * 10) / 10; return (n % 1 === 0 ? String(n) : n.toFixed(1)) + 'h'; };
const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').slice(0, max || 80);

// The one evening message (if any) this person should get right now.
//   mode 'hourly' — the job runs every hour, so wait for 8pm local.
//   mode 'daily'  — the job runs once a day (01:00 UTC, evening in the US), so
//                   take anyone for whom it is currently late afternoon/evening.
function pickReminder(profile, now, mode) {
  const p = profile || {};
  const t = localParts(p.tz, now);
  const inWindow = mode === 'hourly' ? (t.hour >= 20 && t.hour <= 22) : (t.hour >= 16 && t.hour <= 23);
  if (!inWindow) return null;
  const tomorrow = addDays(t.ymd, 1), yesterday = addDays(t.ymd, -1);
  const last = p.lastStudyDate || '';
  const studiedToday = last === t.ymd;
  const streak = Number(p.streak) || 0;
  // Rest days and Streak Shields hold a streak: it is alive if every day
  // between the last study day and today is one of them.
  const rest = new Set(p.today && Array.isArray(p.today.rest) ? p.today.rest : []);
  let alive = !!last && last <= yesterday;
  for (let d = yesterday; alive && d > last; d = addDays(d, -1)) if (!rest.has(d)) alive = false;
  const restingToday = rest.has(t.ymd);
  const streakAtRisk = !studiedToday && !restingToday && streak > 0 && alive;
  const once = (kind) => kind + '-' + t.ymd;

  const examTomorrow = Object.keys(p.exams || {}).find((s) => p.exams[s] === tomorrow);
  if (examTomorrow) {
    const s = clean(examTomorrow, 6);
    return { type: 'exam', onceKey: once('exam'), tag: 'exam', url: '/',
      title: `${s} is tomorrow`, body: 'Light review tonight, then sleep. You have put in the work.' };
  }
  const scoreTomorrow = Object.keys(p.scoreDue || {}).find((s) => p.scoreDue[s] === tomorrow);
  if (scoreTomorrow) {
    const s = clean(scoreTomorrow, 6);
    return { type: 'exam', onceKey: once('score'), tag: 'exam', url: '/',
      title: `${s} scores are expected tomorrow`, body: 'Whatever the number, you will have a plan. Log it in Ledger when it lands.' };
  }

  const recentlyActive = !!last && last >= addDays(t.ymd, -14);
  if (t.dow === 0 && recentlyActive) { // Sunday: the week in review
    const weekStart = addDays(t.ymd, -6);
    const wk = p.week && p.week.key === weekStart ? p.week : { hrs: 0, days: 0, target: (p.week && p.week.target) || 0 };
    const target = Number(wk.target) || 0, done = Number(wk.hrs) || 0, days = Number(wk.days) || 0;
    let body = done <= 0 ? 'No sessions this week. Tomorrow is a clean start.'
      : target > 0 && done >= target ? `You hit your ${hrs(target)} goal. Same again next week.`
      : target > 0 ? `${hrs(target - done)} short of your ${hrs(target)} goal. New week tomorrow.`
      : 'New week tomorrow.';
    if (streakAtRisk) body += ` Your ${streak}-day streak ends at midnight.`;
    return { type: 'recap', onceKey: 'recap-' + weekStart, tag: 'recap', url: '/?action=recap',
      title: done > 0 ? `Your week: ${hrs(done)} over ${days} day${days === 1 ? '' : 's'}` : 'Your week in review', body };
  }

  if (streakAtRisk) {
    return { type: 'streak', onceKey: once('rem'), tag: 'reminder', url: '/?action=start',
      title: `Your ${streak}-day streak ends at midnight`, body: 'Even 25 minutes keeps it alive.' };
  }
  if (!studiedToday && !restingToday && last && last >= addDays(t.ymd, -7)) {
    const tgt = p.today && Number(p.today.hours) > 0 ? `Today's target is ${hrs(p.today.hours)}${p.today.section ? ' of ' + clean(p.today.section, 6) : ''}. ` : '';
    return { type: 'reminder', onceKey: once('rem'), tag: 'reminder', url: '/?action=start',
      title: "You haven't studied today", body: tgt + 'Even 25 minutes counts.' };
  }
  return null;
}

// Send one push to every device a user has turned notifications on for.
// Honors their preferences, a daily cap, and an optional "only once" key.
async function sendToUser(uid, msg, opts) {
  opts = opts || {};
  const db = admin.firestore();
  const ref = db.collection('notify').doc(uid);
  const snap = opts.snap || await ref.get();
  if (!snap.exists) return { sent: 0, reason: 'no-profile' };
  const profile = snap.data() || {};
  if (!prefOn(profile, msg.type)) return { sent: 0, reason: 'pref-off' };
  const entries = Object.entries(profile.tokens || {}).filter(([, t]) => t && typeof t.token === 'string' && t.token.length > 20);
  if (!entries.length) return { sent: 0, reason: 'no-devices' };

  const metaRef = db.collection('notifyMeta').doc(uid);
  const metaSnap = await metaRef.get();
  const meta = metaSnap.exists ? (metaSnap.data() || {}) : {};
  const day = new Date().toISOString().slice(0, 10);
  const sentToday = meta.day === day ? (meta.n || 0) : 0;
  const once = Object.assign({}, meta.once || {});
  if (msg.onceKey && once[msg.onceKey]) return { sent: 0, reason: 'already-sent' };
  if (sentToday >= DAILY_CAP) return { sent: 0, reason: 'daily-cap' };
  const crewToday = meta.day === day ? (meta.c || 0) : 0;
  if (msg.type === 'crew' && crewToday >= CREW_CAP) return { sent: 0, reason: 'daily-cap' };

  const data = {
    title: clean(msg.title, 90), body: clean(msg.body, 180),
    url: String(msg.url || '/').slice(0, 300), tag: clean(msg.tag || msg.type, 40), type: clean(msg.type, 20),
  };
  const web = entries.filter(([, t]) => (t.platform || 'web') === 'web');
  const native = entries.filter(([, t]) => (t.platform || 'web') !== 'web');
  const dead = [];
  let sent = 0;
  const tally = (list, res) => {
    (res.responses || []).forEach((r, i) => {
      if (r.success) { sent++; return; }
      const code = (r.error && r.error.code) || '';
      if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) dead.push(list[i][0]);
    });
  };
  // Web: data-only, shown by the service worker (so a click can open the right page).
  if (web.length) {
    tally(web, await admin.messaging().sendEachForMulticast({
      tokens: web.map(([, t]) => t.token), data,
      webpush: { headers: { Urgency: 'high', TTL: '43200' } },
    }));
  }
  // Native apps: the OS shows a notification payload itself while the app is closed.
  if (native.length) {
    tally(native, await admin.messaging().sendEachForMulticast({
      tokens: native.map(([, t]) => t.token), data,
      notification: { title: data.title, body: data.body },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    }));
  }

  if (dead.length) {
    const del = {};
    dead.forEach((k) => { del['tokens.' + k] = admin.firestore.FieldValue.delete(); });
    await ref.update(del).catch(() => {});
  }
  if (sent > 0 || msg.onceKey) {
    if (msg.onceKey) once[msg.onceKey] = Date.now();
    const cutoff = Date.now() - 10 * 86400000;
    Object.keys(once).forEach((k) => { if (once[k] < cutoff) delete once[k]; });
    // `once` is replaced whole (not merged) so pruned keys actually go away.
    await metaRef.set({ day, n: sentToday + (sent > 0 ? 1 : 0), c: crewToday + (sent > 0 && msg.type === 'crew' ? 1 : 0), once },
      { mergeFields: ['day', 'n', 'c', 'once'] }).catch(() => {});
  }
  return { sent, reason: sent ? 'ok' : 'send-failed' };
}

module.exports = { admin, initAdmin, sendToUser, pickReminder, localParts, addDays, prefOn, clean, hrs, PREF_FOR, DAILY_CAP };
