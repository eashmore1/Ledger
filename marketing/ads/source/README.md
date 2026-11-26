# Reel source

`ledger-reel-voice.mp4` is built from these files:

1. `voice.py` turns `script.json` into `voice.wav`, using the Kokoro text-to-speech model with the `am_puck` voice. It also writes `timing.json`, which holds when each line starts and how far the mouth opens on every frame.
   - Needs `pip install kokoro-onnx soundfile`.
   - Needs `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the kokoro-onnx GitHub releases.
2. `render.js` draws every frame of `ad.html` with Playwright, at 30 fps.
3. ffmpeg joins the frames and `voice.wav` into the MP4.
