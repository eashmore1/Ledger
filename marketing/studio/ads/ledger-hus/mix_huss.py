#!/usr/bin/env python3
"""Audio + timing for the Ledger "while they're out partying / HUSS HUSS HUSS" meme ad.

  python ads/ledger-hus/mix_huss.py

- Muffled party music through the wall under the setup lines.
- Hard phonk beat (140 BPM) drops exactly on the first "Huss"; every HUSS onset is
  detected from the Chatterbox take and written to timing so the visuals hit it.
- Writes remotion-app/public/ledger-huss/{mix-X.wav, timing-X.json, mouth.json}.
"""
import json, os, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mix import SR, bandpass, clap, hat, highpass, impact, kick, load, lowpass, place, tone, whoosh  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))
PUB = os.path.join(STUDIO, "remotion-app", "public", "ledger-huss")
CB = os.path.join(STUDIO, "assets", "audio", "chatterbox", "ledger-huss")
rng = np.random.default_rng(11)
HOOKS = {
    "A": "POV: studying for the CPA on a Friday night",
    "B": "In this town, everybody goes out partying…",
    "C": "CPA candidates on a Friday night be like",
}
WHO = {"town": "S", "exceptme": "S", "while": "S", "huss1": "S", "streak": "S", "huss2": "S", "pass": "L", "cta": "L"}
# (line, gap before it)
ORDER = [("town", 0.3), ("exceptme", 0.22), ("while", 0.28), ("huss1", 0.3), ("streak", 0.22),
         ("huss2", 0.2), ("pass", 0.35)]
BPM = 140
beat = 60 / BPM


def onsets(sig):
    """Onset of each 'huss' in a take: rising edges of the smoothed envelope."""
    env = np.convolve(np.abs(sig), np.ones(int(0.025 * SR)) / int(0.025 * SR), "same")
    thr = env.max() * 0.3
    above = env > thr
    out, last = [], -1.0
    for i in np.where(above[1:] & ~above[:-1])[0]:
        s = i / SR
        if s - last > 0.22:
            out.append(s); last = s
    return out


def party(n):
    """Four-on-the-floor party track, heard through a wall (low-passed)."""
    x = np.zeros(n); b = 60 / 124
    at, k = 0.0, 0
    while at < n / SR:
        place(x, kick(), at, 0.9)
        if k % 2: place(x, clap(), at, 0.35)
        place(x, tone(440 * 2 ** (([45, 45, 48, 43][(k // 4) % 4] - 69) / 12), b * 0.9, "808", 0.3), at + b / 2)
        at += b; k += 1
    return lowpass(x, 380)


def main():
    clips = {k: load(os.path.join(CB, f"{k}.wav")) for k in WHO}
    lines, at = {}, 0.0
    for name, gap in ORDER:
        at += gap
        lines[name] = [at, at + len(clips[name]) / SR]
        at = lines[name][1]
    END = at + 0.3
    t_cta = END + 0.45
    lines["cta"] = [t_cta, t_cta + len(clips["cta"]) / SR]
    TOTAL = lines["cta"][1] + 1.2
    N = int(TOTAL * SR)
    t = np.arange(N) / SR

    vS, vL = np.zeros(N), np.zeros(N)
    for k, (a, _) in lines.items():
        place(vS if WHO[k] == "S" else vL, clips[k] * (1.5 if k.startswith("huss") else 1.0), a)
    huss = [lines[k][0] + o for k in ("huss1", "huss2") for o in onsets(clips[k])]

    # ---- music ----
    mus, sfx = np.zeros(N), np.zeros(N)
    DROP = lines["huss1"][0]
    pty = party(int(DROP * SR) + SR)
    place(mus, pty * 0.55 * np.clip(np.arange(len(pty)) / SR / 0.4, 0, 1), 0)
    mus *= 1 - np.clip((t - DROP + 0.05) / 0.05, 0, 1)
    # muffled crowd murmur
    n = int(DROP * SR)
    place(sfx, lowpass(rng.standard_normal(n), 500) * 0.05, 0)
    place(sfx, whoosh(0.6, 0.5), DROP - 0.55)
    # phonk from the drop to the end card
    riff = [0, 0, 3, 0, 5, 3, 0, -2, 0, 0, 3, 5, 7, 5, 3, 0]
    root, bass, bar = 554.0, [37, 37, 40, 35], 4 * beat
    ph = np.zeros(N); a2, k = DROP, 0
    while a2 < END + bar:
        for s16 in range(16):
            if s16 % 2 == 0 or s16 in (11, 13):
                place(ph, tone(root * 2 ** (riff[s16] / 12), 0.25, "cowbell", 0.22), a2 + s16 * beat / 4)
        f = 440 * 2 ** ((bass[k % 4] - 69) / 12)
        place(ph, tone(f, bar * 0.9, "808", 0.5), a2)
        place(ph, tone(f, beat, "808", 0.35), a2 + 2.5 * beat)
        for b in range(4):
            if b in (0, 2) or (b == 3 and k % 2): place(ph, kick(), a2 + b * beat, 0.9)
            if b in (1, 3): place(ph, clap(), a2 + b * beat, 0.7)
            for h in range(3 if b == 3 else 2):
                place(ph, hat(), a2 + b * beat + h * beat / (3 if b == 3 else 2), 0.5)
        a2 += bar; k += 1
    ph *= 1 - np.clip((t - END - 0.1) / 0.3, 0, 1)
    mus += ph
    for mm in [61, 65, 68, 73]:
        place(mus, tone(440 * 2 ** ((mm - 69) / 12), 2.6, "bell", 0.08), END)
    place(sfx, impact(0.55), DROP - 0.04)
    for h in huss:  # tiny "tick" of a correct answer on each rep
        place(sfx, tone(1568, 0.12, "bell", 0.18), h + 0.12)
    place(sfx, impact(0.6), END)

    # ---- mix (look-ahead ducking under speech) ----
    voice = vS + vL
    env = np.convolve(np.abs(voice), np.ones(1200) / 1200, "same")
    sp = np.clip(env / (np.percentile(env[env > 1e-4], 60) * 0.5), 0, 1)
    hold = sp.copy()
    for kk in range(-int(0.2 * SR), int(0.15 * SR) + 1, int(0.01 * SR)):
        hold = np.maximum(hold, np.roll(sp, -kk))
    sp = np.convolve(hold, np.ones(2400) / 2400, "same")
    # Huss reps sit IN the beat (meme style), so duck less there
    in_huss = np.zeros(N)
    for k2 in ("huss1", "huss2"):
        a, b = lines[k2]; in_huss[int(a * SR):int(b * SR)] = 1
    duck_db = -22 + 8 * (1 - sp) - 3 * in_huss * sp
    music = mus / (np.sqrt(np.mean(mus[np.abs(mus) > 1e-4] ** 2)) + 1e-9) * 0.1
    bg = music * 10 ** (duck_db / 20) * 1.4 + sfx * 0.5 * 10 ** ((-8 * sp) / 20)
    mix = np.tanh((voice + bg) * 2.2) / 2.2
    stereo = np.stack([mix, mix], 1); stereo = stereo / np.abs(stereo).max() * 0.9

    os.makedirs(PUB, exist_ok=True)
    import soundfile as sf
    timing = {"bpm": BPM, "lines": lines, "huss": huss, "end": END, "duration": TOTAL}
    for v, hook in HOOKS.items():
        sf.write(os.path.join(PUB, f"mix-{v}.wav"), stereo.astype(np.float32), SR)
        json.dump({**timing, "hook": hook}, open(os.path.join(PUB, f"timing-{v}.json"), "w"), indent=1)

    fps = 30
    def mouth(track):
        hop = SR // fps
        bp = bandpass(track, 200, 3000)
        r = np.array([np.sqrt(np.mean(bp[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(bp) else 0 for i in range(len(bp) // hop + 2)])
        ref = np.percentile(r[r > 1e-5], 92)
        m = np.clip((20 * np.log10(np.maximum(r, 1e-9) / ref) + 26) / 24, 0, 1)
        return [round(float(x), 2) for x in m]
    json.dump({"fps": fps, "S": mouth(vS), "L": mouth(vL)}, open(os.path.join(PUB, "mouth.json"), "w"))
    for ln, (a, b) in lines.items():
        i, j = int(a * SR), int(b * SR)
        snr = 10 * np.log10(np.mean(voice[i:j] ** 2) / (np.mean(bg[i:j] ** 2) + 1e-12))
        print(f"  {ln:8s} {a:6.2f}-{b:6.2f}  voice/background {snr:5.1f} dB")
    print(f"total {TOTAL:.2f}s, {len(huss)} huss at", [round(h, 2) for h in huss], f"end {END:.2f}")


if __name__ == "__main__":
    main()
