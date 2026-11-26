#!/usr/bin/env python3
"""Lip-sync data from a voiceover: per-frame mouth openness for each speaker.

  python scripts/mouth_sync.py assets/audio/ledger-3d-story-A --fps 30 --out remotion-app/public/ledger-3d-story/mouth-A.json

Reads PREFIX.wav + PREFIX.lines.json (from generate_voice.py; each line has "who").
Each speaker's mouth follows the loudness of the speech band (200-3000 Hz) in
their own lines only, so the listener's mouth stays shut. Values are 0..1,
smoothed a little so the jaw moves like a jaw, not a strobe.
"""
import argparse, json

import numpy as np
import soundfile as sf


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("prefix")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    audio, sr = sf.read(a.prefix + ".wav", dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(1)
    meta = json.load(open(a.prefix + ".lines.json"))
    # speech band
    X = np.fft.rfft(audio)
    f = np.fft.rfftfreq(len(audio), 1 / sr)
    X[(f < 200) | (f > 3000)] = 0
    band = np.fft.irfft(X, len(audio))
    hop = sr / a.fps
    n = int(np.ceil(len(audio) / hop)) + 1
    win = int(sr * 0.045)
    rms = np.zeros(n)
    for i in range(n):
        c = int(i * hop)
        seg = band[max(0, c - win // 2): c + win // 2]
        rms[i] = np.sqrt(np.mean(seg ** 2)) if len(seg) else 0
    out = {"fps": a.fps}
    for who in sorted({ln.get("who", "S") for ln in meta["lines"]}):
        m = np.zeros(n)
        mask = np.zeros(n, bool)
        for ln in meta["lines"]:
            if ln.get("who", "S") == who:
                mask[int(ln["start"] * a.fps): int(np.ceil(ln["end"] * a.fps)) + 1] = True
        vals = rms[mask]
        if len(vals):
            ref = np.percentile(vals, 92) + 1e-9
            db = 20 * np.log10(np.maximum(rms, 1e-9) / ref)
            m = np.clip((db + 26) / 24, 0, 1) * mask
            # attack fast, release a touch slower
            sm = np.zeros(n)
            for i in range(n):
                prev = sm[i - 1] if i else 0
                sm[i] = prev + (m[i] - prev) * (0.85 if m[i] > prev else 0.55)
            m = sm
        out[who] = [round(float(x), 2) for x in m]
    json.dump(out, open(a.out, "w"))
    print(f"mouth data {a.out}: {n} frames, speakers {[k for k in out if k != 'fps']}")


if __name__ == "__main__":
    main()
