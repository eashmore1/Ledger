# Ledger — CPA Study Tracker

A social study tracker for CPA candidates: log study hours, track pacing across
all four exam sections, quiz yourself against a built-in question bank, and
stay accountable with a firm/study-group cohort. Vanilla HTML/CSS/JS — no
framework, no build step, no bundler.

## Quick start

```bash
npm install          # pulls Playwright (for tests) and Capacitor (mobile shells)
npm start             # serves the site at http://localhost:3132
```

Open `http://localhost:3132` in a browser. This is a **static file server
only** — it serves the HTML/CSS/JS exactly as committed. It does **not**
provide Firebase, Stripe, or AI functionality; those require real credentials
(see [Environment & third-party setup](#environment--third-party-setup)
below). Without them the app still loads and the signed-out auth screen
renders correctly, but sign-up/sign-in, payments, and Ask Ledger will fail —
that's expected locally, not a bug.

## Project structure

```
index.html          The entire logged-in app (one file, ~17k lines). All
                     screens are rendered by swapping innerHTML — there's
                     no router or framework; see TODOS.md for the
                     deferred plan to split this up once it's warranted.
landing.html         Marketing homepage (first-touch acquisition page)
pricing.html         Pricing page
faq.html             FAQ (with search/filter)
about.html           About page
contact.html         Contact form (mailto:-based — see note below)
privacy.html         Privacy policy
terms.html           Terms of service
404.html             Not-found page
manifest.json        PWA manifest
firebase.json        Firebase hosting/project config
firestore.rules       Firestore security rules — see deploy:rules below
firestore.indexes.json
vercel.json           Vercel routing (rewrites /login, /signup -> index.html)
api/                  Vercel serverless functions
  ask.js               Proxies Ask Ledger AI requests to Anthropic (auth required)
  billing-portal.js     Opens a Stripe customer billing portal session
  cancel-subscription.js
  reactivate-subscription.js
  review.js             Emails in-app review submissions via Resend
  stripe-webhook.js     Handles Stripe subscription lifecycle events
tests/                 Automated test suite — see Testing below
ios/ android/          Capacitor-wrapped native shells
TODOS.md               Prioritized backlog from the last engineering review
```

### Why one giant `index.html`?

This is a deliberate "ship fast, no tooling" choice, not an oversight — see
the note in `TODOS.md`. It works functionally (every page loads fast, no
render-blocking issues found in the pre-launch audit), but it does mean no
minification, no code-splitting, and the file is genuinely large to navigate.
Modularization is tracked in `TODOS.md` with an explicit trigger condition —
don't take this on casually, it's a real engineering project of its own.

## Testing

```bash
npm test
```

Runs the automated suite in a real headless Chromium browser (via
[Playwright](https://playwright.dev), driven by Node's built-in `node:test`
runner — no extra test framework needed beyond `npm install`).

**What's covered:**
- Every page loads without console errors or broken same-origin requests,
  has a real `<title>`, and exactly one `<h1>`.
- Every marketing-page nav link resolves to a real route.
- Cookie consent banner: shows once, Accept/Decline both dismiss it and
  persist across reload.
- FAQ search/filter: narrows results, shows an empty state for no matches,
  restores everything when cleared.
- Pricing page: monthly/annual toggle updates both plan prices, FAQ
  accordion expands/collapses.
- Contact form: locks in the fix for a real bug found in the pre-launch
  audit — the form must never claim "message sent" (a `mailto:` link can't
  confirm delivery from JavaScript) and must always show a direct fallback
  email address.
- `index.html` loads without unhandled JS errors and renders a working
  sign-in/sign-up screen for a signed-out visitor.

- `/api/ask` (the AI endpoint) rejects signed-out and free-plan callers,
  counts usage, and enforces the monthly limit — run with its dependencies
  stubbed, so no real API call is made.

### End-to-end tests (signed-in app)

```bash
npm run test:e2e      # needs Java 11+ for the Firebase emulators
```

This boots the **Firebase Auth and Firestore emulators** with this repo's real
`firestore.rules`, serves the production `index.html` (only change: two
injected lines pointing the SDK at the emulators), and drives real accounts
through the UI in headless Chromium. Third-party CDN scripts are served from
`node_modules`, so it runs offline. `npm run test:all` runs both suites.

| File | What it proves |
|---|---|
| `tests/e2e/core.e2e.js` | Sign-up → email verification → onboarding; live-timer and past-session logging; streaks; timer survives reload; exam results; practice quiz; password change and reset |
| `tests/e2e/sync.e2e.js` | Signing in on a second device restores data; two devices merge instead of overwriting each other; deletions stay deleted |
| `tests/e2e/social.e2e.js` | Invite links, feed, kudos, comments, real-time DMs, cohort chat, public and user-created clubs — plus negative checks that the security rules block an outsider |
| `tests/e2e/notifications.e2e.js` | Follow requests to private accounts; notifications for followers, kudos, comments |
| `tests/e2e/privacy.e2e.js` | Privacy switches control what is published; cookie Decline keeps analytics off; account deletion removes the data |
| `tests/e2e/security.e2e.js` | Hostile text in every user-writable field never executes in another user's browser |

Because these run against the actual rules file, **a rules change that breaks
a feature fails a test** — run them before `npm run deploy:rules`.

**Still not covered:** Stripe checkout and webhooks (need a Stripe test-mode
account), Google sign-in (needs a real OAuth popup), and live AI responses.

If a test fails after a change, that's the suite doing its job — don't
delete the assertion to make it pass; figure out whether the change or the
test is wrong.

## Deployment

The site deploys to **Vercel** as a static site plus serverless functions
(`npm run deploy`, or push to the connected Git branch for an automatic
deploy). `vercel.json` handles client-side routing for `/login` and
`/signup` (both rewrite to `index.html`).

### Environment & third-party setup

Set these in the Vercel dashboard → Settings → Environment Variables. None
of this is committed to the repo (correctly — don't add real values to any
file here).

| Variable | Used by | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `api/ask.js` | Powers Ask Ledger (AI tutor). Get from console.anthropic.com |
| `FIREBASE_SERVICE_ACCOUNT` | all `api/*` except `invite.js`, `review.js` | Service-account JSON string: verifies user auth tokens, reads the caller's plan, and stores AI usage counts (`aiUsage/{uid}`) |
| `RESEND_API_KEY` | `api/review.js` | Sends in-app review submissions by email. Free tier: 3,000 emails/month |
| `REVIEW_EMAIL` | `api/review.js` | Where review emails are sent |
| `STRIPE_SECRET_KEY` | `api/billing-portal.js`, `api/cancel-subscription.js`, `api/reactivate-subscription.js`, `api/stripe-webhook.js` | Stripe API access for subscription billing |
| `STRIPE_WEBHOOK_SECRET` | `api/stripe-webhook.js` | Verifies incoming Stripe webhook signatures |

Firebase client config (the `apiKey` etc. visible in `index.html`) is
expected to be public for a Firebase web app — that's normal and not a
leak; real access control is enforced by `firestore.rules`.

### Notifications (push, reminders, weekly recap)

The code is in place; it needs these one-time settings to go live.

| What | Where | Needed for |
| --- | --- | --- |
| `CRON_SECRET` (any long random string) | Vercel → Settings → Environment Variables | The evening reminder job refuses to run without it. Vercel sends it automatically with the scheduled call. |
| `FIREBASE_SERVICE_ACCOUNT` | already set for `/api/ask` | Sending pushes |
| Cloud Messaging API enabled | Firebase console → Project settings → Cloud Messaging | Sending pushes |
| Web Push certificate key (optional) | same page → *Web Push certificates* → paste the public key into `FCM_VAPID_KEY` in `index.html` | Recommended; without it the Firebase SDK uses its default key |
| `RESEND_API_KEY`, `RECAP_FROM` (optional) | Vercel env vars; a verified sending domain at resend.com | The Sunday recap **email**. Without the key no email is ever sent. |
| Deploy the rules | `npm run deploy:rules` | `notify/{uid}` (private profile + device tokens) and study rooms |

How it fits together:

- `sw.js` — service worker. Shows pushes while the app is closed, opens the right page on tap, and lets the app load offline.
- `notify/{uid}` — written by the user's device: time zone, streak, last study day, this week, exam dates, preferences, device tokens. Owner-only.
- `api/notify.js` — the app reports an event (props, comment, follow, message, session, room). The server checks the record exists and writes the notification text itself.
- `api/cron-reminders.js` — runs daily at 01:00 UTC (`vercel.json`), which is evening across the US. One message per person per evening at most: streak about to end, "haven't studied today", exam or score tomorrow, or the Sunday recap. For exact 8pm-local delivery in every time zone, call `/api/cron-reminders?mode=hourly` every hour instead (Vercel Pro cron or any scheduler, with `Authorization: Bearer $CRON_SECRET`).
- Limits: 8 pushes per person per day, 3 of them "someone you follow studied".

Not done yet: push in the native iOS/Android apps (needs Firebase set up inside the Xcode/Android Studio projects) and a home-screen widget (native code). The native apps do get a local 8pm reminder through `@capacitor/local-notifications` after `npm run cap:sync`.

### Report & block (moderation)

- **Block** (profile ⋯, post ⋯, comment ⋯, chat ⋯): stored in `users/{me}/blocks/{them}`. The rules then refuse new comments, props, follows, follow requests and direct messages from the blocked person, and `/api/notify` sends no pushes between the two. Both people are hidden from each other's feed, search, comments, chats and study rooms. Unblock in Settings → Privacy → Blocked accounts.
- **Report** (same menus): written to the `reports` collection (create-only; nobody can read them from the app). Review them in the Firebase console → Firestore → `reports`. Each has who reported, who was reported, the reason, a copy of the content and where it was posted.
- **Email alerts**: with `RESEND_API_KEY` set, each report is also emailed to `REPORTS_TO` (Vercel env var; defaults to support@ledgercpa.app).
- **Language filter** (`moderation.js`): comments with cuss words, slurs or abusive phrases can't be posted, and older ones are masked when shown. `firestore.rules` (`cleanText`) refuses the worst words server-side too, so the filter can't be skipped by writing to the database directly.
- Requires `npm run deploy:rules` (new rules plus a collection-group index on `blocks.blocked`).

### Deploying Firestore rules

```bash
npm run deploy:rules
```

Deploys `firestore.rules` and `firestore.indexes.json` to your Firebase
project. The rules are part of the app, not just a safety net: direct messages,
user-created clubs, follow requests and the lock on the subscription field all
depend on the version in this repo being the one that is live. **Do this whenever `firestore.rules` changes** — the rules file in
this repo is the intended security policy, but it only takes effect once
deployed. If messaging/clubs/follows start throwing "permission-denied"
errors in production, this is almost always the reason.

### Mobile (Capacitor)

```bash
npm run cap:sync      # sync web build into native shells
npm run cap:ios        # open the iOS project in Xcode
npm run cap:android    # open the Android project in Android Studio
```

## Browser support notes

- Uses `backdrop-filter` (modal/overlay blur) with `-webkit-` fallbacks for
  Safari.
- Uses `dvh` viewport units for mobile layout sizing — supported in all
  current evergreen browsers; very old browsers will fall back to normal
  block sizing, not break.
