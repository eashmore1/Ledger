// ─────────────────────────────────────────────────────────────────────────────
// Ledger — Review Submission  /api/review
// Accepts in-app review form data and emails it via Resend.
//
// Env vars (Vercel dashboard → Settings → Environment Variables):
//   RESEND_API_KEY  — from resend.com (free tier: 3,000 emails/month)
//   REVIEW_EMAIL    — where to send reviews (e.g. your personal email for now,
//                     change to support@ledgercpa.app at launch)
//
// Domain setup: verify ledgercpa.app in Resend dashboard so emails
// send from noreply@ledgercpa.app. Until then, Resend will use their sandbox.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // CORS
  const origin = req.headers.origin || '';
  const allowed = ['https://ledgercpa.app', 'http://localhost:3132', 'http://localhost:3000'];
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : 'https://ledgercpa.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { stars, text, name } = req.body || {};
  const trimmedText = (text || '').trim();

  if (!trimmedText) return res.status(400).json({ error: 'Review text is required' });

  const starCount = Math.min(5, Math.max(1, parseInt(stars) || 5));
  const starDisplay = '⭐'.repeat(starCount);
  const displayName = (name || '').trim() || 'Anonymous';

  const toEmail = process.env.REVIEW_EMAIL || 'support@ledgercpa.app';
  const fromEmail = 'Ledger Reviews <noreply@ledgercpa.app>';

  if (!process.env.RESEND_API_KEY) {
    // Log to console if Resend not configured yet (so you can see reviews during dev)
    console.log('=== NEW REVIEW (Resend not configured) ===');
    console.log('Stars:', starCount);
    console.log('Name:', displayName);
    console.log('Review:', trimmedText);
    console.log('==========================================');
    return res.json({ ok: true, note: 'logged to console — set RESEND_API_KEY to enable email' });
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `${starDisplay} New Ledger Review — ${displayName}`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <div style="background:#d44000;color:#fff;border-radius:14px 14px 0 0;padding:20px 24px">
    <div style="font-size:22px;font-weight:900;letter-spacing:-.03em">Ledger</div>
    <div style="font-size:13px;opacity:.8;margin-top:2px">New user review</div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 14px 14px;padding:24px">
    <div style="font-size:28px;margin-bottom:12px">${starDisplay}</div>
    <div style="font-size:14px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">${starCount} / 5 stars — ${displayName}</div>
    <blockquote style="margin:16px 0;padding:16px 20px;background:#f9fafb;border-left:4px solid #d44000;border-radius:0 10px 10px 0;font-size:15px;line-height:1.65;font-style:italic;color:#374151">
      "${trimmedText}"
    </blockquote>
    <div style="font-size:12px;color:#9ca3af;margin-top:16px">Submitted via Ledger app · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  </div>
</body>
</html>`,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error('Resend error:', resp.status, err);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('review.js error:', e.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};
