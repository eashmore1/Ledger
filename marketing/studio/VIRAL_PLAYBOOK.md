# Viral Playbook: 2D + 3D short-form ads

These are the rules every ad from this studio follows. `ads/ledger-3d/` is the reference implementation, and each rule below names the part of it that enforces the rule.

## 1. The 3-second 3D hook

- **Frame 1 already moves in 3D.** An object flies toward the camera with a dynamic tilt and lands on an impact, followed by a push-in. In Ledger it's the phone, spinning in from z = -9 and landing at 0.55 s with a camera shake and a flash.
- **The hook text is on screen at frame 1, not after a fade.** It's bold, kinetic, and the key word is colored #FFE600.
- **Safe zones:** keep text out of the bottom 20% and the right 15% (the TikTok, Reels and Shorts UI covers them), and out of the top ~8%, where the "Reels" header sits.
  - In 1080×1920 that leaves x 60–918 and y 160–1536 for anything that has to be read.
- **Write the hook as a problem the viewer has or a pattern break, never a logo.** Good hooks name the viewer ("CPA candidates…"), call out a pain ("…alone is brutal"), or ask a "what if".
- **The music drops on the first word after the hook,** not before it. In Ledger the drop lands on "Meet Ledger".

## 2. A visual reset every 2–3 seconds

- Nothing stays static for more than 2.5 s. Rotate between:
  - 3D camera moves: whip, orbit, push-in, pull-back.
  - A new 3D object popping in (coin, card, ring, flame).
  - UI feature callouts (a chip at the top).
  - Particle depth layers, plus a short flash or whoosh on each cut.
- **One idea per voice line, one scene per line.** Scene cuts are keyed to line start times from `*.lines.json`. Hits inside a scene are keyed to individual words (for example, "start" presses the button and "friends" bursts the hearts).
- **Every motion is a pure function of time.** In Remotion, never use `useFrame()` or self-running animation. Drive everything from `useCurrentFrame()`.

## 3. High-retention captions

- Word-by-word, synced to `words.json`.
- **Typeface:** bold sans (Libre Franklin 900), uppercase, with a thick dark outline and a drop shadow.
- **Chunks:** at most 3 words or about 15 characters, split at punctuation and at pauses over 0.2 s.
- **Active word:** #FFE600 (or #00FF66) with a spring pop (scale 1.12) and a 4 px lift.
- **Placement:** centered in the safe zone at about 70% of the height. Hide captions while a full-screen headline or the end card carries the words.
- **Pronunciation check:**
  - Run `scripts/transcribe_words.py`.
  - With Whisper, it diffs the transcript against the script.
  - With PocketSphinx, it reports a per-line "heard as".
  - Before you generate voice, check acronyms phoneme by phoneme, e.g. write "CPA" and never "C P A", which Kokoro reads as "see pee uh".

## 4. Audio engineering

- **Voice:**
  - Fast but clear: +8% rate, no pitch shifting, and one narrator unless the story truly needs two.
  - No internal pause over 0.25 s. `generate_voice.py` squeezes longer pauses and joins lines with 0.08–0.22 s gaps.
- **Music:**
  - Ducked to **-22 dB under the voice** (about -14 dB between lines).
  - Ducking uses **look-ahead**: it dips 150 ms before each line and holds 200 ms after.
- **Sound effects:**
  - Every visual beat gets one: whoosh, pop, tick, chime or impact.
  - Effects step back 8 dB while the voice is talking.
  - Never put an impact on top of a word. Land it just before or just after.
- **Clarity gate:** `mix.py` prints the voice-to-background ratio for each line. **Every line must be at 15 dB or more.**
- **Master:** two-pass loudnorm to **-14 LUFS integrated, -1 dBTP**, AAC at 256 kbps, 48 kHz.

## 5. Modular hook testing

- **Every ad ships 3 hook variants** (`hooks.json`: A, B, C). The body is shared; only the first line and the on-screen headline change.
- **Post them as separate Reels or ads with the same caption and audience.** After 48–72 h, compare 3-second hold rate and average watch time. Keep the winner and write two new challengers against it.
- **Hook types to rotate:**
  - Pain: "Studying for the CPA alone is brutal."
  - What-if: "What if the CPA felt like a game?"
  - Command: "Stop studying for the CPA alone."
  - Number: "300 hours, zero study buddies?"
  - POV: "POV: your study group never skips."

## 6. Before export: checklist

- [ ] The hook text reads in under 1 s at phone size, and frame 1 isn't empty.
- [ ] No static stretch over 2.5 s (scrub through at 2× speed).
- [ ] Captions stay in the safe zone and never cover the hero object's key detail.
- [ ] Every voice line is at 15 dB or more above the background, and acronyms and URLs are said correctly.
- [ ] The end card holds 2 s or more, with the URL on screen while it's spoken.
- [ ] The claims match the product. No features, ratings or numbers the app doesn't have.
- [ ] 1080×1920, 30 fps, H.264, -14 LUFS, under 30 s for Reels ads.
