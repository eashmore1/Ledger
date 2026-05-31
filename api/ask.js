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
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  let uid = null;

  if (token && admin.apps.length) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
    } catch (e) {
      // Token invalid — still allow (unauthenticated fallback for dev/testing)
      console.warn('Token verification failed:', e.message);
    }
  }

  // ── Rate limit (only for authenticated users) ─────────────────────────────────
  if (uid && !checkRateLimit(uid)) {
    return res.status(429).json({ error: 'Rate limit reached — you can ask 30 questions per hour.' });
  }

  // ── Validate body ─────────────────────────────────────────────────────────────
  const { messages, system, maxTokens } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
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
