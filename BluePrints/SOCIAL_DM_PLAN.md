# Ledger — Social + DM 10-Step Plan

Reconstructed 2026-06-14 after a context clear. Steps 1 and 10 shipped; 2–9 pending.
Persist any changes here so the plan survives future clears.

## Status
- [x] **Step 1** — Strengthen social: Study Crew onboarding card, partner check-in DM, unread dots, partner Elite→Pro. (commit 2c149ce)
- [x] **Step 2** — Readiness + burnout detection. `buildBurnoutCheckIn()` compares this week's hours/sessions/active-days vs a 3-week baseline; gentle "Just checking in" (pulling back) or "You've been going hard" (10+ day streak / overwork) card on the dashboard. Dismissible with 7-day back-off. Never alarm-styled. (pending commit)
- [ ] **Step 3** — Blocked days / adjustable study plan. "Life happens" — let users shift their plan without starting over. Big retention play.
- [ ] **Step 6** — Content depth via AI question generation. DECIDED design:
  - **Cached bank**: one-time AI generation, stored in Firestore, free to serve from cache.
  - **Elite**: full cached bank, unlimited.
  - **Pro**: 20 MCQs per section per 24 hours (rate-limited) + on-demand topic-specific generation ("give me 10 questions on ASC 842 lease modifications").
  - **Free**: no AI bank.
  - Reuses the working /api/ask Anthropic endpoint (or a sibling /api/generate-questions).
- [ ] **Step 7** — Section order recommendation at onboarding. Personalized ("Based on your background, start with REG"). High-trust 2-min build.
- [ ] **Step 5** — Cut the fat. (Reordered: do BEFORE landing page so we don't write copy around features we're about to cut.)
- [ ] **Step 8** — "Works with any course" positioning. Ledger is the layer on top of Becker/Ninja/Roger — the tracker, community, coach they lack. Removes the "I already have a study tool" objection. Feeds into the landing page.
- [ ] **Step 4** — Landing page. (Reordered: AFTER cut-the-fat and positioning. Don't sharpen the pitch until the product backs it up.)
- [ ] **Step 9** — UNKNOWN (lost to context clear; confirm with user).
- [x] **Step 10** — Full DM messaging center revamp + polish/send-fix. (commits bc4ace0, 174052f)

## Execution order (post-reorder)
2 → 3 → 6 → 7 → 5 → 8 → 4. (Step 9 TBD.)
