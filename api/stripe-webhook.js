// ─────────────────────────────────────────────────────────────────────────────
// Ledger — Stripe Webhook Handler
// Vercel serverless function: /api/stripe-webhook
//
// Env vars required (set in Vercel dashboard → Settings → Environment Variables):
//   STRIPE_SECRET_KEY          — from stripe.com/dashboard/apikeys (sk_live_...)
//   STRIPE_WEBHOOK_SECRET      — from stripe.com/dashboard/webhooks (whsec_...)
//   FIREBASE_SERVICE_ACCOUNT   — Firebase service account JSON (paste full JSON string)
// ─────────────────────────────────────────────────────────────────────────────

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin  = require('firebase-admin');

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message);
  }
  if (serviceAccount && serviceAccount.project_id) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

const db = admin.apps.length ? admin.firestore() : null;

// Map Stripe metadata plan keys → Ledger tier info
const PLAN_TO_TIER = {
  pro_monthly:   { tier: 'pro',   cycle: 'monthly'  },
  pro_annual:    { tier: 'pro',   cycle: 'annual'   },
  elite_monthly: { tier: 'elite', cycle: 'monthly'  },
  elite_annual:  { tier: 'elite', cycle: 'annual'   },
  cram_plan:     { tier: 'cram',  cycle: 'one_time' },
  student_pro:   { tier: 'pro',   cycle: 'monthly'  },
};

// Read raw body from request stream (required for Stripe signature verification)
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end',  ()    => resolve(Buffer.concat(chunks)));
    req.on('error', err  => reject(err));
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Verify Stripe signature ──────────────────────────────────────────────
  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('Failed to read body:', err.message);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (!db) {
    console.error('Firestore not initialized — check FIREBASE_SERVICE_ACCOUNT env var');
    return res.status(500).json({ error: 'Database not configured' });
  }

  // ── Handle Stripe events ─────────────────────────────────────────────────
  try {
    // ── Payment completed (new subscription or one-time) ──
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const uid     = session.client_reference_id;

      if (!uid) {
        console.warn('checkout.session.completed missing client_reference_id — cannot upgrade user');
        return res.json({ received: true });
      }

      // Determine tier from metadata (set in redirectToStripeCheckout)
      const planKey  = session.metadata?.plan || '';
      const tierInfo = PLAN_TO_TIER[planKey] || { tier: 'pro', cycle: 'monthly' };

      await db.collection('users').doc(uid).set({
        sub: {
          tier:                 tierInfo.tier,
          billingCycle:         tierInfo.cycle,
          startDate:            new Date().toISOString(),
          trialUsed:            true,
          studentVerified:      false,
          stripeCustomerId:     session.customer        || null,
          stripeSubscriptionId: session.subscription    || null,
          stripeSessionId:      session.id,
          updatedAt:            Date.now(),
        }
      }, { merge: true });

      console.log(`✅ Upgraded user ${uid} → ${tierInfo.tier} (${tierInfo.cycle})`);
    }

    // ── Subscription renewed / reactivated ──
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      if (sub.status === 'active' || sub.status === 'trialing') {
        const snapshot = await db.collection('users')
          .where('sub.stripeSubscriptionId', '==', sub.id)
          .limit(1).get();
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            'sub.updatedAt': Date.now(),
            'sub.stripeStatus': sub.status,
          });
          console.log(`♻️  Subscription updated for user ${snapshot.docs[0].id}`);
        }
      }
    }

    // ── Subscription cancelled / expired ──
    if (event.type === 'customer.subscription.deleted') {
      const sub      = event.data.object;
      const snapshot = await db.collection('users')
        .where('sub.stripeSubscriptionId', '==', sub.id)
        .limit(1).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          'sub.tier':                 'free',
          'sub.billingCycle':         'monthly',
          'sub.stripeSubscriptionId': null,
          'sub.updatedAt':            Date.now(),
        });
        console.log(`⬇️  Downgraded user ${snapshot.docs[0].id} → free`);
      }
    }

  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: err.message });
  }

  res.json({ received: true });
};
