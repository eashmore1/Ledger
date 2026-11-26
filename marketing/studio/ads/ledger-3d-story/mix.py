#!/usr/bin/env python3
"""Music + sound design + voices for the Ledger story ad (all synthesized, royalty-free).

  python ads/ledger-3d-story/mix.py A   -> remotion-app/public/ledger-3d-story/mix-A.wav

Beat times mirror `storyBeats()` in remotion-app/src/ledger3d/StoryScene3D.tsx.
Night: rain, thunder, sad piano. Ledger pops out: riser + chime. Features: upbeat loop.
Sunrise: birds. "I passed?": big hit. Music ~-22 dB under speech.
"""
import json, os, re, sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))
SR = 48000
END_HOLD = 2.3

v = sys.argv[1] if len(sys.argv) > 1 else "A"
W = json.load(open(os.path.join(STUDIO, "assets", "captions", f"ledger-3d-story-{v}.words.json")))
L = {l["id"]: l for l in W["lines"]}
words = [dict(w, s=w["start_ms"] / 1000) for w in W["words"]]


def word_at(line, rx, nth=0):
    ws = [w for w in words if w["line"] == line and re.match(rx, w["word"], re.I)]
    return (ws[nth] if len(ws) > nth else (ws[0] if ws else {"s": L[line]["start"]}))["s"]


B = dict(
    alone=L["alone"]["start"], glow=L["alone"]["end"] - 0.55, pop=L["hey"]["start"] - 0.38, hey=L["hey"]["start"],
    talk=L["talk"]["start"], start=L["start"]["start"], hit=word_at("start", r"^hit"), press=word_at("start", r"^start"),
    friends=word_at("start", r"^friends"), room=L["room"]["start"], same=word_at("room", r"^same"),
    streak=L["streak"]["start"], cando=L["cando"]["start"], passWord=word_at("passed", r"^passed"),
    end=L["brand"]["start"], cta=L["cta"]["start"],
)
TOTAL = W["total_ms"] / 1000 + END_HOLD
N = int(TOTAL * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)


def lowpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), len(x))


def highpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4), len(x))


def bandpass(x, lo, hi):
    return highpass(lowpass(x, hi), lo)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i] * gain


def ramp(a, b):
    return np.clip((t - a) / max(1e-3, b - a), 0, 1)


hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def tone(f, dur, kind, vel=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    if kind == "pluck":
        s = sum(np.sin(2 * np.pi * f * k * tt) * 0.55 ** (k - 1) for k in range(1, 5)) * np.exp(-tt * 7)
        s *= np.minimum(1, tt / 0.003)
    elif kind == "keys":
        s = sum(np.sin(2 * np.pi * f * k * tt) * 0.5 ** (k - 1) * np.exp(-tt * (2 + k)) for k in range(1, 6))
        s *= np.minimum(1, tt / 0.004)
    elif kind == "pad":
        s = sum(np.sin(2 * np.pi * f * d * tt + k) for k, d in enumerate([1, 1.004, 0.996, 2.002])) * 0.25
        s *= np.minimum(1, tt / 0.25) * np.minimum(1, np.maximum(0, dur - tt) / 0.3)
    elif kind == "bass":
        ph = 2 * np.pi * f * tt
        s = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * np.minimum(1, tt / 0.005) * np.exp(-tt * 2.2)
    elif kind == "bell":
        s = (np.sin(2 * np.pi * f * tt) + 0.45 * np.sin(2 * np.pi * f * 2.76 * tt) + 0.2 * np.sin(2 * np.pi * f * 5.4 * tt)) * np.exp(-tt * 4) * np.minimum(1, tt / 0.002)
    return s * vel


def kick():
    n = int(0.45 * SR); tt = np.arange(n) / SR
    f = 48 + 110 * np.exp(-tt * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7) * 1.0 + np.exp(-tt * 300) * rng.standard_normal(n) * 0.08


def clap():
    n = int(0.3 * SR); tt = np.arange(n) / SR
    env = sum(np.exp(-np.maximum(0, tt - d) * 60) * (tt >= d) for d in (0, 0.01, 0.022)) / 3 + np.exp(-tt * 14) * 0.6
    return bandpass(rng.standard_normal(n), 900, 6000) * env * 0.7


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR); tt = np.arange(n) / SR
    return highpass(rng.standard_normal(n), 7000) * np.exp(-tt * (14 if open_ else 70)) * 0.35


def whoosh(at, dur=0.5, g=0.5, up=True):
    n = int(dur * SR); tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    lo = lowpass(noise, 2500) if up else lowpass(noise, 1500)
    env = (tt / dur) ** 2 if up else np.sin(np.pi * tt / dur) ** 2
    place(sfx, highpass(lo, 300) * env * g, at - (dur if up else dur / 2))


def pop(at, f=520, g=0.35):
    n = int(0.12 * SR); tt = np.arange(n) / SR
    place(sfx, np.sin(2 * np.pi * (f * 0.6 + f * np.exp(-tt * 40)) * tt) * np.exp(-tt * 28) * g, at)


def tick(at, f=1800, g=0.12):
    n = int(0.05 * SR); tt = np.arange(n) / SR
    place(sfx, np.sin(2 * np.pi * f * tt) * np.exp(-tt * 90) * g, at)


def impact(at, g=0.9):
    place(sfx, kick() * 1.2, at, g)
    n = int(1.4 * SR); tt = np.arange(n) / SR
    place(sfx, lowpass(rng.standard_normal(n), 120) * np.exp(-tt * 6) * 0.35, at, g)


# ---------------- voices ----------------
vo, vsr = sf.read(os.path.join(STUDIO, "assets", "audio", f"ledger-3d-story-{v}.wav"), dtype="float32")
voice = np.interp(t, np.arange(len(vo)) / vsr, vo, right=0)
voice = voice + 0.12 * highpass(voice, 3500)
n = int(0.35 * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.06); ir[0] = 0; ir /= np.sqrt((ir ** 2).sum())
m = 1 << (N + n).bit_length()
voice = voice + 0.05 * np.fft.irfft(np.fft.rfft(voice, m) * np.fft.rfft(ir, m), m)[:N]

env = np.convolve(np.abs(voice), np.ones(1200) / 1200, "same")
speaking = np.clip(env / (np.percentile(env[env > 1e-4], 60) * 0.5), 0, 1)
hold = speaking.copy()
for k in range(-int(0.20 * SR), int(0.15 * SR) + 1, int(0.01 * SR)):
    hold = np.maximum(hold, np.roll(speaking, -k))
speaking = np.convolve(hold, np.ones(2400) / 2400, "same")
duck = 10 ** ((-22 + 8 * (1 - speaking)) / 20)

mus = np.zeros(N); drums = np.zeros(N); sfx = np.zeros(N); amb = np.zeros(N)

# ---------------- night: rain, thunder, sad piano ----------------
rainmask = 1 - ramp(B["streak"] - 0.2, B["streak"] + 0.8)
rain = bandpass(rng.standard_normal(N), 500, 6000) * 0.06 + lowpass(rng.standard_normal(N), 900) * 0.05
amb += rain * rainmask * (1 - 0.5 * ramp(B["hit"] - 0.1, B["hit"] + 0.3) * (1 - ramp(B["streak"] - 0.3, B["streak"])))
n = int(3.0 * SR); tt = np.arange(n) / SR
thunder = lowpass(rng.standard_normal(n), 140) * np.minimum(1, tt / 0.05) * np.exp(-tt * 1.6) * 2.2
place(amb, thunder * 0.45, 0.0)
place(amb, thunder * 0.6, B["glow"] - 0.3)
for at, mm in [(0.0, 57), (0.0, 64), (0.9, 60), (1.9, 64), (2.8, 53), (2.8, 60), (3.7, 64)]:
    if at < B["pop"] - 0.2:
        place(mus, tone(hz(mm), 2.6, "keys", 0.16), at)
# birds after sunrise
for k in range(8):
    at = B["streak"] + 0.4 + k * 0.45 + rng.uniform(0, 0.2)
    if at > B["end"] - 0.2:
        break
    n = int(0.12 * SR); tt = np.arange(n) / SR
    f = 3200 + 900 * np.sin(tt * 60)
    place(amb, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / tt[-1]) * 0.04, at)

# ---------------- Ledger pops out ----------------
n = int((B["pop"] - B["glow"]) * SR); tt = np.arange(n) / SR
f = 400 + 1400 * (tt / tt[-1]) ** 2
place(sfx, sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 1.5, 2)) * (tt / tt[-1]) ** 1.5 * 0.1, B["glow"])
for i, mm in enumerate([84, 88, 91, 96, 100]):
    place(sfx, tone(hz(mm), 1.2, "bell", 0.12), B["pop"] + i * 0.045)
pop(B["pop"], 420, 0.45)

# ---------------- hopeful pad from the pop, beat drops on "Hit start" ----------------
BPM = 120; beat = 60 / BPM; bar = 4 * beat
prog = [[48, 55, 60, 64], [43, 55, 59, 62], [45, 57, 60, 64], [41, 53, 57, 60]]
at = B["pop"] + 0.3; k = 0
while at < B["hit"] - 0.05:
    for mm in prog[k % 4][1:]:
        place(mus, tone(hz(mm + 12), bar + 0.3, "pad", 0.05), at)
    at += bar / 2; k += 1
k, at = 0, B["hit"] - 0.05
while at < TOTAL:
    ch = prog[k % 4]
    for mm in ch[1:]:
        place(mus, tone(hz(mm + 12), bar + 0.2, "pad", 0.05), at)
    for e in range(8):
        place(mus, tone(hz(ch[0] - 12 + (12 if e % 4 == 3 else 0)), beat / 2 * 0.95, "bass", 0.32), at + e * beat / 2)
        place(mus, tone(hz(ch[1 + [0, 1, 2, 3, 2, 1, 2, 3][e] % 3] + 24), 0.35, "pluck", 0.07), at + e * beat / 2)
    for b in range(4):
        place(drums, kick(), at + b * beat, 0.8)
        if b % 2 == 1:
            place(drums, clap(), at + b * beat, 0.5)
        place(drums, hat(), at + b * beat + beat / 2, 0.5)
    at += bar; k += 1
drums *= 1 - ramp(B["end"] + 1.8, B["end"] + 2.3)
for mm in [60, 64, 67, 72, 76]:
    place(mus, tone(hz(mm), 3.0, "keys", 0.035), B["end"] - 0.05)
music = (mus + drums) * (1 - ramp(TOTAL - 0.8, TOTAL))

# ---------------- sfx ----------------
impact(B["hit"] - 0.08, 0.5)
pop(B["press"] + 0.02, 700, 0.4)
for i in range(12):
    tick(B["press"] + 0.25 + i * 0.14, 2200, 0.05)
for i in range(5):
    pop(B["friends"] - 0.05 + i * 0.1, 480 + i * 60, 0.2)
for i in range(5):
    place(sfx, tone(hz(79 + [0, 4, 7, 12, 16][i]), 0.4, "bell", 0.07), B["room"] + 0.1 + i * 0.25)
place(sfx, tone(hz(81), 1.2, "bell", 0.1), B["same"] + 0.05)
for c in [B["alone"], B["talk"], B["room"], B["cando"]]:
    whoosh(c + 0.08, 0.35, 0.3, up=False)
n = int(0.8 * SR); tt = np.arange(n) / SR
place(sfx, lowpass(rng.standard_normal(n), 1800) * np.exp(-tt * 3) * np.minimum(1, tt / 0.05) * 0.18, B["streak"] + 0.2)  # cloud -> flame
for i in range(14):
    tick(B["streak"] + 0.35 + i * 0.08, 1500 + i * 60, 0.06)
pw_end = max([w for w in words if w["line"] == "passed"][-1]["end_ms"] / 1000, L["passed"]["end"])
impact(pw_end + 0.02, 0.8)
for i, mm in enumerate([72, 76, 79, 84]):
    place(sfx, tone(hz(mm), 1.2, "bell", 0.09), pw_end + 0.04 + i * 0.05)
# (no separate end-card hit: the PASSED hit lands in the 0.16 s gap and carries into the end card)
pop(B["cta"], 600, 0.35)

# ---------------- mix ----------------
def rms(x):
    return np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2) + 1e-12)


music = music / rms(music) * rms(voice)
sfx_duck = 10 ** ((-8 * speaking) / 20)
amb_duck = 10 ** ((-14 * speaking) / 20)
bg = music * duck + sfx * 0.45 * sfx_duck + amb * 0.8 * amb_duck
mix = np.tanh((voice + bg) * 0.9) / 0.9
stereo = np.stack([mix + 0.004 * np.roll(amb, 240), mix + 0.004 * np.roll(amb, -240)], 1)
out = os.path.join(STUDIO, "remotion-app", "public", "ledger-3d-story", f"mix-{v}.wav")
sf.write(out, (stereo / np.abs(stereo).max() * 0.9).astype(np.float32), SR)
print(f"{v}: {TOTAL:.2f}s -> {out}")
worst = 99
for ln in W["lines"]:
    a, b = int(ln["start"] * SR), int(ln["end"] * SR)
    snr = 10 * np.log10(np.mean(voice[a:b] ** 2) / (np.mean(bg[a:b] ** 2) + 1e-12))
    worst = min(worst, snr)
    if os.environ.get("REPORT"):
        print(f"  {ln['id']:7s} voice/background {snr:5.1f} dB")
print(f"  worst line voice/background: {worst:.1f} dB")
