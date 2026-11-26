# Story Reel source

`ledger-reel-story.mp4` is built from these files:

1. `voice.py` voices the lines in `script.json` with Kokoro text-to-speech.
   - Student: a blend of the `am_michael` and `am_liam` voices.
   - Ledger: a blend of the `am_puck` and `af_heart` voices, pitched up with rubberband.
   - It also writes `timing.json` and a separate mouth-movement track for each character.
2. `mix.py` makes the rain, thunder, music and sound effects in code (no stock audio) and mixes them under the voices.
3. `render.js` draws every frame of `ad.html` with Playwright, at 30 fps.
4. ffmpeg joins the frames and `mix.wav`, normalized to -14 LUFS.
