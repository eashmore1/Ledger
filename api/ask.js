// ─────────────────────────────────────────────────────────────────────────────
// Ledger — AI Proxy  /api/ask
// Vercel serverless function that proxies Anthropic requests server-side.
// Users never touch an API key — you own the key, you control the cost.
//
// Env vars (Vercel dashboard → Settings → Environment Variables):
//   ANTHROPIC_API_KEY        — from console.anthropic.com
//   FIREBASE_SERVICE_ACCOUNT — Firebase service account JSON string
//
// Rate limit: 30 AI requests per user per hour (in-memory, resets per instance).
// For production scale, swap _rateLimiter for Vercel KV (Redis).
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');

// ── Firebase Admin (reuse across warm invocations) ────────────────────────────
if (!admin.apps.length) {
  let serviceAccount;
  try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'); } catch (e) {}
  if (serviceAccount && serviceAccount.project_id) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

// ── In-memory rate limiter (30 req / user / hour) ─────────────────────────────
const _rateLimiter = new Map();
function checkRateLimit(uid, max = 30) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const entry = _rateLimiter.get(uid) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  _rateLimiter.set(uid, entry);
  return entry.count <= max;
}

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  // CORS — allow ledgercpa.app and localhost for dev
  const origin = req.headers.origin || '';
  const allowed = ['https://ledgercpa.app', 'http://localhost:3132', 'http://localhost:3000'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : 'https://ledgercpa.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth — verify Firebase ID token ──────────────────────────────────────────
  // A valid token is required: this endpoint proxies a paid Anthropic API key,
  // so an unauthenticated path would let anyone run up the bill with no cap.
  if (!admin.apps.length) {
    console.error('Firebase Admin not initialized — check FIREBASE_SERVICE_ACCOUNT');
    return res.status(500).json({ error: 'Auth service not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Sign in to use Ask Ledger' });
  }

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
  } catch (e) {
    console.warn('Token verification failed:', e.message);
    return res.status(401).json({ error: 'Your session expired — sign in again' });
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  if (!checkRateLimit(uid)) {
    return res.status(429).json({ error: 'Rate limit reached — you can ask 30 questions per hour.' });
  }

  // ── Plan + monthly quota, enforced HERE ──────────────────────────────────
  // The app hides AI features from free accounts, but that is only UI: without
  // this check any signed-in user could call this endpoint directly and spend
  // the Anthropic budget. The tier comes from users/{uid}.sub, which only the
  // Stripe webhook can write (Firestore rules block client writes to `sub`).
  // Usage is counted in aiUsage/{uid}, a collection no client can read or write.
  // An abuse backstop, deliberately far above what the app allows through its
  // own UI (100 Ask Ledger answers/month; generators are advertised as
  // unlimited), so a normal paying user never meets it.
  const MONTHLY_LIMIT = { pro: 2000, elite: 2000, cram: 2000 };
  try {
    const db = admin.firestore();
    const userSnap = await db.collection('users').doc(uid).get();
    const tier = (userSnap.exists && userSnap.data().sub && userSnap.data().sub.tier) || 'free';
    const limit = MONTHLY_LIMIT[tier];
    if (!limit) {
      return res.status(403).json({ error: 'AI features are part of Ledger Pro and Elite. Upgrade to use them.' });
    }
    const month = new Date().toISOString().slice(0, 7);
    const usageRef = db.collection('aiUsage').doc(uid);
    const allowedNow = await db.runTransaction(async (tx) => {
      const snap = await tx.get(usageRef);
      const cur = snap.exists && snap.data().month === month ? (snap.data().count || 0) : 0;
      if (cur >= limit) return false;
      tx.set(usageRef, { month, count: cur + 1, updatedAt: Date.now() });
      return true;
    });
    if (!allowedNow) {
      return res.status(429).json({ error: 'You have reached this month\'s AI limit for your plan. It resets on the 1st.' });
    }
  } catch (e) {
    console.error('ask.js plan check failed:', e.message);
    return res.status(500).json({ error: 'Could not verify your plan — please try again.' });
  }

  // ── Validate body ─────────────────────────────────────────────────────────────
  const { messages, system, maxTokens } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  // Bound the request so one call can't be made arbitrarily expensive.
  const size = JSON.stringify(messages).length + String(system || '').length;
  if (messages.length > 60 || size > 200000) {
    return res.status(413).json({ error: 'That request is too long — try a shorter question or less source text.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  // ── Proxy to Anthropic ────────────────────────────────────────────────────────
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: Math.min(maxTokens || 600, 4096), // cap at 4096
        system: system || 'You are Ledger, an expert CPA exam tutor.',
        messages,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error('Anthropic error:', resp.status, err);
      return res.status(502).json({ error: err?.error?.message || 'AI service error' });
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text || '';
    return res.json({ text });

  } catch (e) {
    console.error('ask.js error:', e.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};
