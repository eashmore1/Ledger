// ─────────────────────────────────────────────────────────────────────────────
// Ledger — Cancel Subscription  /api/cancel-subscription
// Cancels the user's Stripe subscription at period end (they keep access
// until the billing period is up, then auto-downgrade via webhook).
//
// Env vars required:
//   STRIPE_SECRET_KEY          — sk_live_...
//   FIREBASE_SERVICE_ACCOUNT   — Firebase service account JSON string
// ─────────────────────────────────────────────────────────────────────────────

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin  = require('firebase-admin');

if (!admin.apps.length) {
  let serviceAccount;
  try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'); } catch(e) {}
  if (serviceAccount?.project_id) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Authenticate: require Firebase ID token ──────────────────────────────
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (e) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  if (!db) return res.status(500).json({ error: 'Database not configured' });

  // ── Look up the user's subscription ID ───────────────────────────────────
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

  const sub = userDoc.data()?.sub || {};
  const subscriptionId = sub.stripeSubscriptionId;

  if (!subscriptionId) {
    return res.status(400).json({ error: 'No active subscription found' });
  }

  // ── Cancel at period end in Stripe ───────────────────────────────────────
  try {
    const cancelled = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Record cancellation intent in Firestore so the UI can show "cancels on X"
    await db.collection('users').doc(uid).update({
      'sub.cancelAtPeriodEnd': true,
      'sub.cancelAt': cancelled.cancel_at ? new Date(cancelled.cancel_at * 1000).toISOString() : null,
      'sub.updatedAt': Date.now(),
    });

    console.log(`🚫 Subscription ${subscriptionId} set to cancel at period end for user ${uid}`);
    return res.json({
      success: true,
      cancelAt: cancelled.cancel_at ? new Date(cancelled.cancel_at * 1000).toISOString() : null,
    });
  } catch (e) {
    console.error('Stripe cancel error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
