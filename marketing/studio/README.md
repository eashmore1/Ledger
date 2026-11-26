# Ad studio (2D + 3D, zero paid APIs)

This is a self-contained workspace for short-form video ads (TikTok, Reels, Shorts). Everything is free and open source and runs locally. It isn't deployed: `/marketing` is in `.vercelignore`.

```
studio/
  VIRAL_PLAYBOOK.md        rules every ad follows
  remotion-app/            Remotion + Three.js (React Three Fiber) project
    src/Root.tsx           compositions: ViralVertical3D (1080x1920), WidescreenAd3D (1920x1080),
                           Ledger3D-A/B/C (hook test cuts)
    src/ledger3d/          the Ledger ad: Scene3D (3D world), Mascot (3D Ledger), screens (UI textures),
                           Overlay (hook, captions, chips, end card), LedgerAd (composition)
    .agents/skills         Remotion agent skills + HyperFrames skill (also linked at .claude/skills)
  scripts/
    generate_voice.py      script -> voiceover (edge-tts, or Kokoro offline) at +8%, trimmed, tight gaps
    transcribe_words.py    voiceover -> words.json (ms word timestamps) + pronunciation check
    render_blender_scene.py  headless Blender: 3-point light, transparent bg, orbit camera
  ads/ledger-3d/           script (body.json, hooks.json), mix.py (music + SFX), build.py (one command)
  assets/{raw,3d-renders,audio,captions}
  output/                  final .mp4s
```

## Setup (once per machine)

```bash
cd marketing/studio
python3 -m venv .venv && .venv/bin/pip install edge-tts faster-whisper yt-dlp Pillow numpy soundfile pocketsphinx kokoro-onnx
(cd remotion-app && npm install)
sudo apt install ffmpeg blender     # macOS: brew install ffmpeg && brew install --cask blender
```

You also need the Kokoro voice model, which is about 330 MB and gitignored. Put it in `models/`:

```bash
mkdir -p models && cd models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && mv kokoro-v1.0.onnx kokoro.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin && mv voices-v1.0.bin voices.bin
```

## Make the Ledger ad

```bash
.venv/bin/python ads/ledger-3d/build.py            # A, B and C -> output/ledger-3d-*.mp4
.venv/bin/python ads/ledger-3d/build.py A --skip-voice   # visuals or mix changed, keep the voice
cd remotion-app && npx remotion studio             # live preview while editing
```

## Voices

- **`edge-tts`** (Microsoft neural voices: AndrewNeural, AvaNeural, BrianNeural) needs a WebSocket connection to `speech.platform.bing.com`. Use it on a normal computer.
- **Locked-down networks:** the scripts fall back to **Kokoro**, which runs offline. `af_heart` is its best voice; others include `am_michael` and `bf_emma`.
- **Choosing an engine:** pass `"engine"` in the script JSON or `--engine` on the command line.

## Word timestamps and the pronunciation check

- **Whisper:** `transcribe_words.py` uses **faster-whisper** when it can download its model from huggingface.co. It then diffs what Whisper heard against the script.
- **Fallback:** where that host is blocked, it uses **PocketSphinx** forced alignment, which runs offline. It also prints how each line was heard.

## Rendering notes

- **Browser:** Remotion normally downloads its own headless Chrome from remotion.media. `remotion.config.ts` points at the preinstalled one when it exists, and renders WebGL with SwiftShader (`swangle`), so it works without a GPU.
- **Licensing:** Remotion is free for individuals and companies of up to 3 people. Larger companies need a license (see the `remotion-license` skill).
