# Ledger — Social + DM 10-Step Plan

Reconstructed 2026-06-14 after a context clear. Steps 1 and 10 shipped; 2–9 pending.
Persist any changes here so the plan survives future clears.

## Status
- [x] **Step 1** — Strengthen social: Study Crew onboarding card, partner check-in DM, unread dots, partner Elite→Pro. (commit 2c149ce)
- [x] **Step 2** — Readiness + burnout detection. `buildBurnoutCheckIn()` compares this week's hours/sessions/active-days vs a 3-week baseline; gentle "Just checking in" (pulling back) or "You've been going hard" (10+ day streak / overwork) card on the dashboard. Dismissible with 7-day back-off. Never alarm-styled. (pending commit)
- [x] **Step 3** — Blocked days / adjustable study plan. In the Elite AI Study Plan: tap any upcoming day → "Can't study this day"; `rebalanceStudyPlan()` redistributes those hours across remaining study days (weighted by each day's `baseHours`, capped 8h) so the user never falls behind. Blocked days render ✈️ "Off", reopenable. Header shows "✈️ N days off". Works on pre-existing plans via baseHours/isStudyBase fallbacks. (pending commit)
- [x] **Step 6** — Content depth via AI question generation. SHIPPED (core/6a). `generateAIQuestions(section,topic)` builds a prompt → existing `/api/ask` (Haiku) → `_fcParseJSON` → `_normAIQ` validation → feeds the existing quiz engine via `_launchAIQuiz`. Tiers via `_aiQbQuota`: Free=gate, Pro=20/section/24h (`S.aiQbUsage`), Elite=unlimited. Per-user cache in `S.aiQbCache` (free retries/replays). UI = ✦ card + optional topic input in the section modal. Verified live: API returns valid parseable question JSON. NOTE: shared Firestore "cached bank" deferred (6b) — per-user cache is fine at current scale + Haiku cost; revisit if usage grows. Server-side quota enforcement also deferred (client-side + ask.js 30/hr limiter for now). DECIDED design was:
  - **Cached bank**: one-time AI generation, stored in Firestore, free to serve from cache.
  - **Elite**: full cached bank, unlimited.
  - **Pro**: 20 MCQs per section per 24 hours (rate-limited) + on-demand topic-specific generation ("give me 10 questions on ASC 842 lease modifications").
  - **Free**: no AI bank.
  - Reuses the working /api/ask Anthropic endpoint (or a sibling /api/generate-questions).
- [x] **Step 7** — Section order recommendation at onboarding. SHIPPED. `recommendSectionOrder(disc,classYear,hoursPerWeek)` returns a personalized order + rationale (e.g. TCP + low time/working → REG first for momentum; BAR→FAR pairing; ISC→AUD pairing). Surfaced as a ✦ card at the top of onboarding Step 2 (exam-date step), with date inputs laid out in the recommended order. (pending commit)
- [ ] **Step 5** — Cut the fat. (Reordered: do BEFORE landing page so we don't write copy around features we're about to cut.)
- [ ] **Step 8** — "Works with any course" positioning. Ledger is the layer on top of Becker/Ninja/Roger — the tracker, community, coach they lack. Removes the "I already have a study tool" objection. Feeds into the landing page.
- [ ] **Step 4** — Landing page. (Reordered: AFTER cut-the-fat and positioning. Don't sharpen the pitch until the product backs it up.)
- [ ] **Step 9** — UNKNOWN (lost to context clear; confirm with user).
- [x] **Step 10** — Full DM messaging center revamp + polish/send-fix. (commits bc4ace0, 174052f)

- [x] **Step 3.5** — Personalized calendar blocking. SHIPPED. `plan.timeOff=[{id,start,end,label}]` labeled ranges alongside single-day `blockedDates`; `_planBlockedSet()` unions them and feeds `rebalanceStudyPlan()`. "✈️ Add time off" button in plan header → `openTimeOffModal()` (label + from/to date pickers + list of existing ranges with × to remove). Calendar cells show the label under ✈️; day-detail shows the label + "Remove this time off". `_planDayLabel()` resolves the covering range. (pending commit)

## Execution order (post-reorder)
2 → 3 → 6 → 3.5 → 7 → 5 → 8 → 4. (Step 9 TBD.)
