#!/usr/bin/env python3
"""Audio + timing for the Ledger "hus hus hus" meme ad (synthesized phonk, royalty-free).

  python ads/ledger-hus/mix.py

- Phonk beat at 140 BPM (808 cowbell riff, 808 bass, hard kick/clap, hats).
- One "HUS!" per running stride, on the beat. Uses the Chatterbox takes in
  assets/audio/chatterbox/ledger-hus/ when they exist, else a synthesized breath-chant.
- Places the spoken lines after the slap, then writes:
    remotion-app/public/ledger-hus/mix-{A,B,C}.wav   (same audio for each hook)
    remotion-app/public/ledger-hus/timing-{A,B,C}.json  (shared timing + per-hook text)
    remotion-app/public/ledger-hus/mouth.json       (lip-sync for Ledger + the student)
"""
import glob, json, os

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))
PUB = os.path.join(STUDIO, "remotion-app", "public", "ledger-hus")
CB = os.path.join(STUDIO, "assets", "audio", "chatterbox", "ledger-hus")
SR = 48000
rng = np.random.default_rng(5)
HOOKS = {
    "A": "POV: Ledger when you're about to lose your 47-day streak",
    "B": "In this town, you can't skip a study day.",
    "C": "Ledger at 11:58 PM when you haven't studied yet",
}

BPM = 140
beat = 60 / BPM
WAKE = 4 * beat * 1.5 + 0.0          # 2.57 s: drop lands on a bar line after the hook
RUN_START = WAKE + 2 * beat          # two beats of "wait what" before he bolts
RUN_BEATS = 17
RUN_END = RUN_START + RUN_BEATS * beat
SLAP = RUN_END + beat


def lowpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), len(x))


def highpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4), len(x))


def bandpass(x, lo, hi):
    return highpass(lowpass(x, hi), lo)


def load(path, speed=1.0):
    a, sr = sf.read(path, dtype="float32")
    if a.ndim > 1:
        a = a.mean(1)
    n = int(len(a) * SR / sr / speed)
    a = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a)
    # trim silence
    env = np.abs(a) > np.max(np.abs(a)) * 0.04
    idx = np.where(env)[0]
    if len(idx):
        a = a[max(0, idx[0] - 240): idx[-1] + 2400]
    return a / (np.sqrt(np.mean(a ** 2)) + 1e-9) * 0.1


def synth_hus(pitch=1.0):
    """Breathy shouted 'HUS': aspirated h, short 'uh' vowel, hiss."""
    n = int(0.36 * SR); tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    h = bandpass(noise, 600, 4000) * np.exp(-((tt - 0.03) / 0.03) ** 2) * 0.6
    f0 = 135 * pitch * (1 - 0.15 * tt / tt[-1])
    ph = np.cumsum(2 * np.pi * f0 / SR)
    saw = sum(np.sin(k * ph) / k for k in range(1, 30))
    vow = sum(bandpass(saw, fc * 0.85, fc * 1.15) * g for fc, g in [(640, 1.0), (1190, 0.6), (2390, 0.25)])
    venv = np.clip((tt - 0.03) / 0.02, 0, 1) * np.exp(-np.maximum(0, tt - 0.07) * 18)
    s = highpass(noise, 4500) * np.clip((tt - 0.1) / 0.02, 0, 1) * np.exp(-np.maximum(0, tt - 0.12) * 14) * 0.5
    out = h + vow * venv * 0.8 + s
    return out / (np.sqrt(np.mean(out ** 2)) + 1e-9) * 0.1


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf):
        buf[i:j] += sig[: j - i] * gain


def tone(f, dur, kind, vel=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    if kind == "cowbell":  # 808 cowbell: two square-ish partials, band-passed, fast decay
        sq = np.sign(np.sin(2 * np.pi * f * tt)) + np.sign(np.sin(2 * np.pi * f * 1.48 * tt))
        s = bandpass(sq, f * 0.8, f * 4) * (np.exp(-tt * 9) * 0.7 + np.exp(-tt * 40) * 0.3)
    elif kind == "808":
        fg = f * (1 + 0.6 * np.exp(-tt * 30))
        s = np.tanh(np.sin(np.cumsum(2 * np.pi * fg / SR)) * 2.2) * np.exp(-tt * 1.6)
    elif kind == "bell":
        s = (np.sin(2 * np.pi * f * tt) + 0.45 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt * 4)
    return s * vel


def kick():
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 45 + 140 * np.exp(-tt * 35)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 3) * np.exp(-tt * 9)


def clap():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    return bandpass(rng.standard_normal(n), 900, 7000) * (np.exp(-tt * 18) + 0.6 * (tt > 0.012) * np.exp(-(tt - 0.012) * 30)) * 0.8


def hat():
    n = int(0.05 * SR); tt = np.arange(n) / SR
    return highpass(rng.standard_normal(n), 7500) * np.exp(-tt * 80) * 0.4


def whoosh(dur, g):
    n = int(dur * SR); tt = np.arange(n) / SR
    return highpass(lowpass(rng.standard_normal(n), 3000), 250) * np.sin(np.pi * tt / dur) ** 2 * g


def impact(g=1.0):
    n = int(1.2 * SR); tt = np.arange(n) / SR
    k = np.zeros(n); kk = kick() * 1.4; k[: len(kk)] += kk
    return (k + lowpass(rng.standard_normal(n), 140) * np.exp(-tt * 4) * 0.5) * g


def main():
    have_cb = os.path.exists(os.path.join(CB, "saved.wav"))
    hus_files = sorted(glob.glob(os.path.join(CB, "hus-takes", "hus*.wav"))) or sorted(glob.glob(os.path.join(CB, "hus[0-9].wav")))
    print("chatterbox voices:", "yes" if have_cb else "no (synth fallback)", "| hus takes:", len(hus_files))

    # voice lines (after the slap)
    lines = {}
    def clip(name, fallback_len):
        p = os.path.join(CB, f"{name}.wav")
        return load(p) if os.path.exists(p) else np.zeros(int(fallback_len * SR))
    huh = clip("huh", 0.5)
    saved = clip("saved", 1.1)
    noskip = clip("noskip", 1.2)
    cta = clip("cta", 1.9)
    t_huh = SLAP + 0.45
    t_saved = t_huh + len(huh) / SR + 0.12
    t_noskip = t_saved + len(saved) / SR + 0.22
    END = t_noskip + len(noskip) / SR + 0.2
    t_cta = END + 0.35
    TOTAL = t_cta + len(cta) / SR + 1.3
    lines = {"saved": [t_saved, t_saved + len(saved) / SR], "noskip": [t_noskip, t_noskip + len(noskip) / SR], "cta": [t_cta, t_cta + len(cta) / SR]}

    N = int(TOTAL * SR)
    t = np.arange(N) / SR
    voiceL = np.zeros(N); voiceS = np.zeros(N); hus = np.zeros(N)
    place(voiceS, huh, t_huh)
    place(voiceL, saved, t_saved)
    place(voiceL, noskip, t_noskip)
    place(voiceL, cta, t_cta)

    # HUS on every stride
    hus_times = [RUN_START + i * beat for i in range(RUN_BEATS)]
    takes = [load(f) for f in hus_files] if hus_files else []
    for i, at in enumerate(hus_times):
        sp = 1 + (rng.random() - 0.5) * 0.06
        sig = load(hus_files[i % len(hus_files)], sp) if takes else synth_hus(sp)
        place(hus, sig, at - 0.02, 1.0 + 0.15 * (i % 4 == 0))
    # panting after the slap
    for i in range(4):
        place(hus, (synth_hus(0.9) * 0.35), SLAP + 0.2 + i * 0.28)

    # ---------------- music ----------------
    mus = np.zeros(N); sfx = np.zeros(N)
    # hook: clock ticks + phone buzz + low drone
    for i in range(int(WAKE / 0.5)):
        n = int(0.03 * SR); tt = np.arange(n) / SR
        place(sfx, np.sin(2 * np.pi * (3000 if i % 2 else 2400) * tt) * np.exp(-tt * 150) * 0.2, i * 0.5)
    for b in (0.3, 1.3):
        n = int(0.35 * SR); tt = np.arange(n) / SR
        place(sfx, np.sin(2 * np.pi * 160 * tt) * (np.sin(2 * np.pi * 30 * tt) > 0) * 0.12, b)
    n = int(WAKE * SR); tt = np.arange(n) / SR
    place(mus, np.sin(2 * np.pi * 55 * tt) * 0.15 * (tt / tt[-1]), 0)
    place(sfx, highpass(rng.standard_normal(n), 2500) * (tt / tt[-1]) ** 4 * 0.12, 0)
    # phonk from the wake drop to the end card
    riff = [0, 0, 3, 0, 5, 3, 0, -2, 0, 0, 3, 5, 7, 5, 3, 0]  # semitones, 16th notes
    root = 554.0  # cowbell pitch
    bass = [37, 37, 40, 35]  # MIDI per bar (C#, C#, E, B)
    bar = 4 * beat
    at = WAKE
    k = 0
    while at < END + 2 * bar:
        for s16 in range(16):
            st = riff[s16]
            if s16 % 2 == 0 or s16 in (11, 13):
                place(mus, tone(root * 2 ** (st / 12), 0.25, "cowbell", 0.22), at + s16 * beat / 4)
        place(mus, tone(440 * 2 ** ((bass[k % 4] - 69) / 12), bar * 0.9, "808", 0.5), at)
        place(mus, tone(440 * 2 ** ((bass[k % 4] - 69) / 12), beat, "808", 0.35), at + 2.5 * beat)
        for b in range(4):
            if b in (0, 2) or (b == 3 and k % 2):
                place(mus, kick(), at + b * beat, 0.9)
            if b in (1, 3):
                place(mus, clap(), at + b * beat, 0.7)
            for h in range(3 if b == 3 else 2):
                place(mus, hat(), at + b * beat + h * beat / (3 if b == 3 else 2), 0.5)
        at += bar
        k += 1
    mus *= (t >= WAKE - 0.01) * (1 - np.clip((t - END - 1.6) / 0.5, 0, 1)) + (t < WAKE)
    for mm in [61, 65, 68, 73]:  # end card chord
        place(mus, tone(440 * 2 ** ((mm - 69) / 12), 2.5, "bell", 0.08), END)

    # sfx
    place(sfx, impact(1.0), WAKE)
    place(sfx, whoosh(0.5, 0.5), WAKE - 0.45)
    place(sfx, whoosh(0.6, 0.4), RUN_START - 0.3)
    hurdle_t = RUN_START + 0.37 * (RUN_END - RUN_START)
    place(sfx, whoosh(0.5, 0.45), hurdle_t - 0.2)
    place(sfx, whoosh(0.5, 0.5), RUN_END - 0.1)  # slide
    place(sfx, impact(0.9), SLAP)
    for i, mm in enumerate([73, 77, 80, 85]):
        place(sfx, tone(440 * 2 ** ((mm - 69) / 12), 1.0, "bell", 0.12), SLAP + 0.05 + i * 0.05)
    place(sfx, impact(0.5), END)

    # ---------------- mix ----------------
    voice = voiceL + voiceS
    env = np.convolve(np.abs(voice), np.ones(1200) / 1200, "same")
    sp = np.clip(env / (np.percentile(env[env > 1e-4], 60) * 0.5 if np.any(env > 1e-4) else 1), 0, 1)
    hold = sp.copy()
    for kk in range(-int(0.2 * SR), int(0.15 * SR) + 1, int(0.01 * SR)):
        hold = np.maximum(hold, np.roll(sp, -kk))
    sp = np.convolve(hold, np.ones(2400) / 2400, "same")
    duck = 10 ** ((-20 + 8 * (1 - sp)) / 20)
    ref = 0.1
    music = mus / (np.sqrt(np.mean(mus[np.abs(mus) > 1e-4] ** 2)) + 1e-9) * ref
    mix = voice * 1.0 + hus * 1.1 + music * duck * 1.4 + sfx * 0.5 * 10 ** ((-8 * sp) / 20)
    mix = np.tanh(mix * 2.2) / 2.2
    stereo = np.stack([mix, mix], 1)
    stereo = stereo / np.abs(stereo).max() * 0.9
    os.makedirs(PUB, exist_ok=True)
    timing = {"bpm": BPM, "wake": WAKE, "runStart": RUN_START, "runEnd": RUN_END, "slap": SLAP,
              "huh": [t_huh, t_huh + max(0.4, len(huh) / SR)], "lines": lines, "hus": hus_times, "end": END, "duration": TOTAL}
    for v, hook in HOOKS.items():
        sf.write(os.path.join(PUB, f"mix-{v}.wav"), stereo.astype(np.float32), SR)
        json.dump({**timing, "hook": hook}, open(os.path.join(PUB, f"timing-{v}.json"), "w"), indent=1)
    # lip-sync: Ledger (lines + hus) and the student (huh)
    fps = 30
    def mouth(track):
        hop = SR // fps
        n = len(track) // hop + 2
        r = np.array([np.sqrt(np.mean(track[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(track) else 0 for i in range(n)])
        ref = np.percentile(r[r > 1e-5], 92) if np.any(r > 1e-5) else 1
        db = 20 * np.log10(np.maximum(r, 1e-9) / ref)
        m = np.clip((db + 26) / 24, 0, 1)
        return [round(float(x), 2) for x in m]
    json.dump({"fps": fps, "L": mouth(voiceL + hus), "S": mouth(voiceS)}, open(os.path.join(PUB, "mouth.json"), "w"))
    for ln, (a, b) in lines.items():
        i, j = int(a * SR), int(b * SR)
        if np.any(voice[i:j]):
            snr = 10 * np.log10(np.mean(voice[i:j] ** 2) / (np.mean((music * duck * 1.4 + sfx * 0.5)[i:j] ** 2) + 1e-12))
            print(f"  {ln:7s} voice/background {snr:5.1f} dB")
    print(f"total {TOTAL:.2f}s, {len(hus_times)} hus, wake {WAKE:.2f}, slap {SLAP:.2f}, end {END:.2f}")


if __name__ == "__main__":
    main()
