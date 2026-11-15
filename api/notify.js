// ─────────────────────────────────────────────────────────────────────────────
// Ledger — /api/notify
// Turns something a signed-in user just did into a push notification for the
// people it concerns: props, a comment, a follow, a direct message, a logged
// session, or a study room opening.
//
// The caller only says WHAT happened and to which record. Who gets notified and
// what the notification says are worked out here from Firestore, so this can't
// be used to push arbitrary text at arbitrary people.
//
// Also serves the one-click unsubscribe link in the weekly recap email
// (GET /api/notify?unsub=<uid>.<signature>).
//
// Env vars: FIREBASE_SERVICE_ACCOUNT (already used by /api/ask),
//           CRON_SECRET (signs unsubscribe links).
// ─────────────────────────────────────────────────────────────────────────────
'use strict';
const crypto = require('crypto');
const { admin, initAdmin, sendToUser, clean, hrs } = require('./_lib/push');

const HOURLY_LIMIT = 60;      // events one person may raise per hour
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

function unsubToken(uid) {
  return crypto.createHmac('sha256', process.env.CRON_SECRET || '').update('unsub:' + uid).digest('hex').slice(0, 32);
}

async function handleUnsubscribe(req, res) {
  const raw = String((req.query && req.query.unsub) || '');
  const dot = raw.lastIndexOf('.');
  const uid = raw.slice(0, dot), sig = raw.slice(dot + 1);
  const page = (msg) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).end(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ledger</title>` +
      `<body style="font-family:system-ui,sans-serif;background:#f2ede6;color:#18103a;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">` +
      `<div style="max-width:420px;padding:32px;text-align:center"><h1 style="font-size:22px">${msg}</h1><p><a href="https://ledgercpa.app" style="color:#d44000">Back to Ledger</a></p></div>`);
  };
  if (!process.env.CRON_SECRET || dot < 1 || !SAFE_ID.test(uid) || sig.length !== 32 ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(unsubToken(uid)))) {
    return page('That unsubscribe link is not valid.');
  }
  await admin.firestore().collection('notifyMeta').doc(uid).set({ emailOff: true }, { merge: true });
  return page('You will not get the weekly recap email any more.');
}

async function overHourlyLimit(db, uid) {
  const ref = db.collection('notifyMeta').doc(uid);
  const hour = new Date().toISOString().slice(0, 13);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const m = snap.exists ? (snap.data() || {}) : {};
    const n = m.hour === hour ? (m.hn || 0) : 0;
    if (n >= HOURLY_LIMIT) return true;
    tx.set(ref, { hour, hn: n + 1 }, { merge: true });
    return false;
  });
}

// People who asked to hear when `uid` studies: their partner, and followers
// who switched "crew activity" on. Each keeps that list in their own notify doc.
async function watchersOf(db, uid) {
  const snap = await db.collection('notify').where('watch', 'array-contains', uid).limit(50).get();
  return snap.docs.filter((d) => d.id !== uid);
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  const allowed = ['https://ledgercpa.app', 'http://localhost:3132', 'http://localhost:3000', 'capacitor://localhost', 'https://localhost'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : 'https://ledgercpa.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!initAdmin()) return res.status(500).json({ error: 'Not configured' });
  if (req.method === 'GET' && req.query && req.query.unsub) return handleUnsubscribe(req, res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Sign in first' });
  let uid;
  try { uid = (await admin.auth().verifyIdToken(token)).uid; }
  catch (e) { return res.status(401).json({ error: 'Invalid session' }); }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const type = String(body.type || '');
  const id = (k) => { const v = String(body[k] || ''); return SAFE_ID.test(v) ? v : ''; };
  const db = admin.firestore();

  try {
    if (await overHourlyLimit(db, uid)) return res.status(429).json({ error: 'Too many notifications' });

    const meSnap = await db.collection('users').doc(uid).get();
    const me = meSnap.exists ? (meSnap.data() || {}) : {};
    const name = clean(me.displayName || 'Someone', 40);
    const first = name.split(' ')[0] || name;
    const results = [];
    const send = async (toUid, msg) => { if (toUid && toUid !== uid) results.push(await sendToUser(toUid, msg)); };

    if (type === 'follow') {
      const to = id('toUid');
      const edge = to && await db.collection('users').doc(to).collection('followers').doc(uid).get();
      if (!edge || !edge.exists) return res.status(400).json({ error: 'Nothing to notify' });
      await send(to, { type: 'follow', onceKey: 'follow-' + uid, tag: 'follow-' + uid, url: '/user/' + uid,
        title: `${name} started following you`, body: 'They will see your sessions in their feed.' });

    } else if (type === 'kudos') {
      const to = id('toUid'), act = id('activityId');
      const prop = to && act && await db.collection('users').doc(to).collection('props').doc(act + '__' + uid).get();
      if (!prop || !prop.exists || prop.data().reactor !== uid) return res.status(400).json({ error: 'Nothing to notify' });
      await send(to, { type: 'kudos', onceKey: 'kudos-' + act + '-' + uid, tag: 'kudos-' + act, url: '/#feed',
        title: `${name} gave you props`, body: 'Your study session got noticed.' });

    } else if (type === 'comment') {
      const to = id('toUid'), act = id('activityId');
      const q = to && act && await db.collection('users').doc(to).collection('comments')
        .where('from', '==', uid).where('activityId', '==', act).limit(5).get();
      if (!q || q.empty) return res.status(400).json({ error: 'Nothing to notify' });
      const text = clean(q.docs[q.docs.length - 1].data().text, 120);
      await send(to, { type: 'comment', tag: 'comment-' + act, url: '/#feed',
        title: `${name} commented on your session`, body: text || 'Open Ledger to read it.' });

    } else if (type === 'dm') {
      const conv = String(body.convId || '');
      const parts = conv.split('__dm__');
      if (parts.length !== 2 || !parts.every((p) => SAFE_ID.test(p)) || !parts.includes(uid)) return res.status(400).json({ error: 'Nothing to notify' });
      const c = await db.collection('conversations').doc(conv).get();
      if (!c.exists || !(c.data().participants || []).includes(uid) || c.data().lastFrom !== uid) return res.status(400).json({ error: 'Nothing to notify' });
      const to = parts.find((p) => p !== uid);
      // Message text stays out of the notification: it would sit on a lock screen.
      await send(to, { type: 'dm', tag: 'dm-' + uid, url: '/messages',
        title: `New message from ${name}`, body: 'Open Ledger to read it.' });

    } else if (type === 'session_logged') {
      // Only what the person already shares publicly is used here.
      const acts = (me.recentActivities || []).filter((a) => a && (!a.type || a.type === 'session'));
      const last = acts[acts.length - 1];
      if (!last) return res.status(200).json({ ok: true, sent: 0 });
      const watchers = await watchersOf(db, uid);
      const title = `${first} just logged ${hrs(last.hours)}${last.section ? ' of ' + clean(last.section, 6) : ''}`;
      const day = new Date().toISOString().slice(0, 10);
      for (const w of watchers) {
        // At most one "X studied" push per person per day, however many sessions they log.
        results.push(await sendToUser(w.id, { type: 'crew', onceKey: 'sess-' + uid + '-' + day, tag: 'crew-' + uid, url: '/#feed',
          title, body: 'Your turn?' }, { snap: w }));
      }

    } else if (type === 'room_started') {
      const roomId = id('roomId');
      const room = roomId && await db.collection('rooms').doc(roomId).get(); // public rooms only
      if (!room || !room.exists || room.data().hostUid !== uid) return res.status(400).json({ error: 'Nothing to notify' });
      const watchers = await watchersOf(db, uid);
      for (const w of watchers) {
        results.push(await sendToUser(w.id, { type: 'crew', onceKey: 'room-' + roomId, tag: 'room-' + uid, url: '/?room=' + roomId,
          title: `${first} opened a study room`, body: `"${clean(room.data().name, 60)}" — join and study on the same clock.` }, { snap: w }));
      }

    } else {
      return res.status(400).json({ error: 'Unknown event' });
    }

    return res.status(200).json({ ok: true, sent: results.reduce((n, r) => n + (r.sent || 0), 0) });
  } catch (e) {
    console.error('[notify]', type, e && e.message);
    return res.status(500).json({ error: 'Could not send' });
  }
};
module.exports.unsubToken = unsubToken;
