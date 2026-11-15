// ─────────────────────────────────────────────────────────────────────────────
// Ledger — /api/cron-reminders
// The evening pass. For every user with a notify/{uid} profile it decides
// whether tonight calls for one message — a streak about to end, a plain
// "you haven't studied today", an exam or score tomorrow, or (Sundays) the week
// in review — and sends it. Sundays it can also send the recap by email.
//
// Scheduling:
//   vercel.json runs this once a day at 01:00 UTC (evening across the US). In
//   that mode anyone for whom it is currently 4pm–11pm is considered.
//   If you call it every hour instead (Vercel Pro cron, or any scheduler hitting
//   /api/cron-reminders?mode=hourly), each person gets theirs at 8pm local.
//   Either way nobody is reminded twice in a day.
//
// Env vars:
//   CRON_SECRET              required — Vercel sends it as "Authorization: Bearer …"
//   FIREBASE_SERVICE_ACCOUNT required
//   RESEND_API_KEY           optional — turns on the Sunday recap email
//   RECAP_FROM               optional — From address, default "Ledger <hello@ledgercpa.app>"
// ─────────────────────────────────────────────────────────────────────────────
'use strict';
const { admin, initAdmin, sendToUser, pickReminder, localParts, addDays, clean, hrs } = require('./_lib/push');
const { unsubToken } = require('./notify');

const PAGE = 300, MAX_USERS = 6000;

function recapEmail(profile, uid, t) {
  const weekStart = addDays(t.ymd, -6);
  const wk = profile.week && profile.week.key === weekStart ? profile.week : { hrs: 0, days: 0, target: (profile.week && profile.week.target) || 0 };
  const done = Number(wk.hrs) || 0, days = Number(wk.days) || 0, target = Number(wk.target) || 0;
  const name = clean(profile.name || 'there', 40);
  const streak = Number(profile.streak) || 0;
  const line = done <= 0 ? 'No sessions logged this week. It happens — tomorrow is a clean start.'
    : target > 0 && done >= target ? `You hit your ${hrs(target)} goal. That is how sections get passed.`
    : target > 0 ? `That is ${hrs(target - done)} short of your ${hrs(target)} goal.`
    : 'Every hour counts.';
  const exam = Object.entries(profile.exams || {}).filter(([, d]) => d >= t.ymd).sort((a, b) => a[1].localeCompare(b[1]))[0];
  const examLine = exam ? `<p style="margin:0 0 14px">Next exam: <strong>${clean(exam[0], 6)}</strong> on ${clean(exam[1], 10)}.</p>` : '';
  const unsub = `https://ledgercpa.app/api/notify?unsub=${uid}.${unsubToken(uid)}`;
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;color:#18103a">
  <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#d44000">Ledger · your week</div>
  <h1 style="font-size:26px;line-height:1.2;margin:10px 0 14px">${done > 0 ? `${hrs(done)} over ${days} day${days === 1 ? '' : 's'}` : 'A quiet week'}, ${name}.</h1>
  <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${line}</p>
  ${streak > 0 ? `<p style="margin:0 0 14px">Current streak: <strong>${streak} day${streak === 1 ? '' : 's'}</strong>.</p>` : ''}
  ${examLine}
  <p style="margin:22px 0"><a href="https://ledgercpa.app/" style="background:#d44000;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;display:inline-block">Open Ledger</a></p>
  <p style="font-size:12px;color:#7a7385;line-height:1.6;margin-top:28px">You get this once a week because you study with Ledger. <a href="${unsub}" style="color:#7a7385">Unsubscribe from the weekly recap</a>.</p>
</div>`;
  return { subject: done > 0 ? `Your week: ${hrs(done)} over ${days} day${days === 1 ? '' : 's'}` : 'Your week on Ledger', html, unsub };
}

async function sendRecapEmail(db, uid, profile, t) {
  const weekStart = addDays(t.ymd, -6);
  const metaRef = db.collection('notifyMeta').doc(uid);
  const metaSnap = await metaRef.get();
  const meta = metaSnap.exists ? (metaSnap.data() || {}) : {};
  if (meta.emailOff || meta.emailWeek === weekStart) return false;
  let email = '';
  try { email = (await admin.auth().getUser(uid)).email || ''; } catch (e) { return false; }
  if (!email) return false;
  const m = recapEmail(profile, uid, t);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RECAP_FROM || 'Ledger <hello@ledgercpa.app>', to: [email], subject: m.subject, html: m.html,
      headers: { 'List-Unsubscribe': `<${m.unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  });
  if (!r.ok) return false;
  await metaRef.set({ emailWeek: weekStart }, { merge: true });
  return true;
}

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).json({ error: 'CRON_SECRET is not set' });
  if ((req.headers.authorization || '') !== 'Bearer ' + secret) return res.status(401).json({ error: 'Unauthorized' });
  if (!initAdmin()) return res.status(500).json({ error: 'Not configured' });

  const mode = req.query && req.query.mode === 'hourly' ? 'hourly' : 'daily';
  const now = new Date();
  const db = admin.firestore();
  const out = { mode, users: 0, pushes: 0, emails: 0, skipped: {} };
  let last = null;

  try {
    while (out.users < MAX_USERS) {
      let q = db.collection('notify').orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE);
      if (last) q = q.startAfter(last);
      const page = await q.get();
      if (page.empty) break;
      for (const doc of page.docs) {
        out.users++;
        const p = doc.data() || {};
        const msg = pickReminder(p, now, mode);
        if (!msg) continue;
        try {
          const r = await sendToUser(doc.id, msg, { snap: doc });
          if (r.sent) out.pushes++; else out.skipped[r.reason] = (out.skipped[r.reason] || 0) + 1;
          // The Sunday recap also goes out by email, to people who haven't turned it off.
          if (msg.type === 'recap' && process.env.RESEND_API_KEY && (p.prefs || {}).weekly_email !== false) {
            if (await sendRecapEmail(db, doc.id, p, localParts(p.tz, now))) out.emails++;
          }
        } catch (e) {
          out.skipped.error = (out.skipped.error || 0) + 1;
        }
      }
      last = page.docs[page.docs.length - 1];
      if (page.size < PAGE) break;
    }
    return res.status(200).json(out);
  } catch (e) {
    console.error('[cron-reminders]', e && e.message);
    return res.status(500).json({ error: 'Failed', partial: out });
  }
};
module.exports.recapEmail = recapEmail;
