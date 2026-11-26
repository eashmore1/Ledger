#!/usr/bin/env python3
"""Generate a voiceover from a script, trimmed tight for short-form.

Two ways to call it:

  # one-off line
  python scripts/generate_voice.py --text "Hit start." --voice en-US-AndrewNeural

  # a full ad script (JSON), one clip per line, joined with short gaps
  python scripts/generate_voice.py --script ads/ledger-3d/script.json --out assets/audio/ledger-3d-A

Engines
  edge    Microsoft neural voices via edge-tts (free, needs internet and a
          WebSocket connection to speech.platform.bing.com).
  kokoro  Kokoro-82M running locally (free, offline). Model files live in
          ./models (see README for the download links).
  auto    edge if it is reachable, else kokoro. Default.

Outputs (for --out PREFIX, default assets/audio/voiceover)
  PREFIX.wav / PREFIX.mp3   the voiceover, silence trimmed, gaps <= --gap
  PREFIX.lines.json         per-line start/end in seconds (for scene timing)

Script JSON:
  {"engine": "kokoro", "voice": "af_heart", "rate": "+8%", "gap": 0.16,
   "lines": [{"id": "hook", "text": "Stop studying for the CPA alone.",
              "say": "Stop studying for the C.P.A. alone."}]}
  "say" (optional) is what the voice reads when spelling matters;
  "text" is what captions show.
"""
import argparse, asyncio, json, os, subprocess, sys, tempfile

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(HERE)
MODELS = os.path.join(STUDIO, "models")
SR = 24000

EDGE_DEFAULT = "en-US-AndrewNeural"
KOKORO_DEFAULT = "af_heart"


def rate_to_speed(rate):
    """'+8%' -> 1.08"""
    r = str(rate).strip().replace("%", "")
    return 1.0 + float(r) / 100.0


def edge_available():
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        return False
    try:
        import socket
        socket.create_connection(("speech.platform.bing.com", 443), timeout=4).close()
        return True
    except OSError:
        return False


def tts_edge(text, voice, rate):
    import edge_tts

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        path = f.name

    async def go():
        await edge_tts.Communicate(text, voice, rate=rate).save(path)

    asyncio.run(go())
    wav = path + ".wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), wav], check=True, stdin=subprocess.DEVNULL)
    audio, _ = sf.read(wav, dtype="float32")
    os.remove(path); os.remove(wav)
    return audio


_kokoro = None


def tts_kokoro(text, voice, rate):
    global _kokoro
    from kokoro_onnx import Kokoro

    if _kokoro is None:
        onnx, voices = os.path.join(MODELS, "kokoro.onnx"), os.path.join(MODELS, "voices.bin")
        if not os.path.exists(onnx):
            sys.exit("Kokoro model missing: put kokoro.onnx and voices.bin in " + MODELS + " (see README).")
        _kokoro = Kokoro(onnx, voices)
    audio, sr = _kokoro.create(text, voice=voice, speed=rate_to_speed(rate), lang="en-us")
    assert sr == SR
    return audio.astype(np.float32)


def trim(audio, thresh_db=-42.0, pad=0.03):
    """Cut dead air at both ends (keeps a few ms so consonants aren't clipped)."""
    win = int(0.01 * SR)
    n = len(audio) // win
    if n == 0:
        return audio
    rms = np.sqrt(np.mean(audio[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(rms) + 1e-9))
    on = np.where(db > thresh_db)[0]
    if len(on) == 0:
        return audio
    a = max(0, on[0] * win - int(pad * SR))
    b = min(len(audio), (on[-1] + 1) * win + int(pad * SR))
    return audio[a:b]


def squeeze_pauses(audio, max_gap=0.25, thresh_db=-40.0):
    """Shorten any internal silence longer than max_gap (short-form pacing)."""
    win = int(0.01 * SR)
    n = len(audio) // win
    rms = np.sqrt(np.mean(audio[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(rms) + 1e-9))
    silent = db < thresh_db
    keep, i, limit = [], 0, int(max_gap / 0.01)
    while i < n:
        j = i
        while j < n and silent[j] == silent[i]:
            j += 1
        if silent[i] and (j - i) > limit:
            # keep the start and end of the pause, drop the middle
            half = limit // 2
            keep.append((i * win, (i + half) * win))
            keep.append(((j - (limit - half)) * win, j * win))
        else:
            keep.append((i * win, j * win))
        i = j
    keep.append((n * win, len(audio)))
    return np.concatenate([audio[a:b] for a, b in keep if b > a])


def synth(engine, text, voice, rate):
    return tts_edge(text, voice, rate) if engine == "edge" else tts_kokoro(text, voice, rate)


def load_clip(path):
    """A pre-rendered line (e.g. from generate_voice_chatterbox.py), resampled to SR mono."""
    path = path if os.path.isabs(path) else os.path.join(STUDIO, path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        tmp = f.name
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), tmp], check=True, stdin=subprocess.DEVNULL)
    audio, _ = sf.read(tmp, dtype="float32")
    os.remove(tmp)
    return audio


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--text")
    ap.add_argument("--script")
    ap.add_argument("--voice")
    ap.add_argument("--engine", choices=["auto", "edge", "kokoro"])
    ap.add_argument("--rate", help="speaking rate, e.g. +8%%")
    ap.add_argument("--gap", type=float, help="seconds between lines (max 0.25)")
    ap.add_argument("--out", default=os.path.join(STUDIO, "assets", "audio", "voiceover"))
    a = ap.parse_args()

    if a.script:
        spec = json.load(open(a.script))
    elif a.text:
        spec = {"lines": [{"id": "line1", "text": a.text}]}
    else:
        ap.error("give --text or --script")

    engine = a.engine or spec.get("engine", "auto")
    if engine == "auto":
        engine = "files" if all(ln.get("file") for ln in spec["lines"]) else ("edge" if edge_available() else "kokoro")
    voice = a.voice or spec.get("voice") or (EDGE_DEFAULT if engine == "edge" else KOKORO_DEFAULT)
    if engine == "files":
        voice = spec.get("voice", "files")
    if engine == "kokoro" and voice and "Neural" in voice:
        print(f"edge voice {voice} not available offline; using Kokoro {KOKORO_DEFAULT}")
        voice = KOKORO_DEFAULT
    rate = a.rate or spec.get("rate", "+8%")
    gap = min(0.25, a.gap if a.gap is not None else spec.get("gap", 0.16))
    print(f"engine={engine} voice={voice} rate={rate} gap={gap}s")

    clips, lines, t = [], [], 0.0
    for ln in spec["lines"]:
        v = ln.get("voice", voice)
        raw = load_clip(ln["file"]) if ln.get("file") else synth(engine, ln.get("say", ln["text"]), v, ln.get("rate", rate))
        audio = squeeze_pauses(trim(raw), max_gap=ln.get("max_pause", 0.25))
        audio = audio / (np.sqrt(np.mean(audio ** 2)) + 1e-9) * 0.08  # even loudness line to line
        pre = ln.get("gap", gap) if clips else 0.0
        if pre:
            clips.append(np.zeros(int(pre * SR), np.float32)); t += pre
        clips.append(audio)
        dur = len(audio) / SR
        lines.append({**ln, "voice": v, "start": round(t, 3), "end": round(t + dur, 3)})
        t += dur
        print(f"  {lines[-1]['start']:6.2f}-{lines[-1]['end']:6.2f}  {ln['text']}")
    full = np.concatenate(clips)
    full = full / (np.max(np.abs(full)) + 1e-9) * 0.89

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    sf.write(a.out + ".wav", full, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a.out + ".wav", "-b:a", "192k", a.out + ".mp3"], check=True, stdin=subprocess.DEVNULL)
    json.dump({"engine": engine, "voice": voice, "total": round(t, 3), "lines": lines}, open(a.out + ".lines.json", "w"), indent=1)
    print(f"wrote {a.out}.mp3 ({t:.2f}s) and {a.out}.lines.json")


if __name__ == "__main__":
    main()
