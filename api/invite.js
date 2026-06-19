// Serves cohort-specific link previews for invite URLs (/?join=...).
// Link-preview crawlers don't run JS, so the cohort OG tags must be served at
// request time. Humans are redirected straight to the real app; crawlers get a
// lightweight page with the "Study together. Pass together." cohort card —
// personalized with the inviter / firm name when present.

const CRAWLER = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|Discordbot|WhatsApp|TelegramBot|Pinterest|redditbot|Applebot|SkypeUriPreview|vkShare|bingbot|Googlebot|Embedly|Iframely|nuzzel|flipboard|qwantify|Bitrix|google-structured-data/i;

function first(v){ return Array.isArray(v) ? v[0] : v; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

export default function handler(req, res){
  const q = req.query || {};
  // Rebuild the human destination, preserving invite params, with h=1 so the
  // /?join= rewrite is bypassed and the static app is served (no redirect loop).
  const params = new URLSearchParams();
  ['join','from','uid','fn'].forEach(k => { const v = first(q[k]); if (v != null && v !== '') params.set(k, v); });
  params.set('h', '1');
  const humanUrl = '/?' + params.toString();

  const ua = req.headers['user-agent'] || '';
  if (!CRAWLER.test(ua)) {
    res.statusCode = 302;
    res.setHeader('Location', humanUrl);
    res.setHeader('Cache-Control', 'no-store');
    res.end();
    return;
  }

  const from = first(q.from) || '';
  const fn = first(q.fn) || '';
  const title = fn ? ('Join ' + fn + ' on Ledger') : 'Study together. Pass together.';
  const desc = (from ? from + ' invited you to study together on Ledger. ' : '')
    + 'The accountability layer for your CPA study group — log hours side by side, keep a group streak alive, and never grind alone.';
  const img = 'https://ledgercpa.app/og-cohort.png';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ledger">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="https://ledgercpa.app/">
<meta property="og:image" content="${img}">
<meta property="og:image:secure_url" content="${img}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Ledger — Study together. Pass together.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${img}">
</head><body style="font-family:system-ui;background:#0d0a18;color:#fff">
Redirecting to Ledger…
<script>location.replace(${JSON.stringify(humanUrl)});</script>
</body></html>`);
}
