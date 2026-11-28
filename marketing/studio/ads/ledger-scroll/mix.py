#!/usr/bin/env python3
"""Music + sound design + voices for the "one more video" ad (all synthesized, royalty-free).

  python ads/ledger-scroll/mix.py A   -> remotion-app/public/ledger-scroll/mix-A.wav

Beat times mirror `scrollBeats()` in remotion-app/src/ledger3d/ScrollScene3D.tsx.
Late night: room tone, phone-scroll swipes, lo-fi keys. The notification: a real
phone "ding". Ledger: chime. "Hit start": the beat drops. Music ~-22 dB under speech.
"""
import json, os, re, sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))
SR = 48000
END_HOLD = 2.3

v = sys.argv[1] if len(sys.argv) > 1 else "A"
W = json.load(open(os.path.join(STUDIO, "assets", "captions", f"ledger-scroll-{v}.words.json")))
L = {l["id"]: l for l in W["lines"]}
words = [dict(w, s=w["start_ms"] / 1000) for w in W["words"]]


def word_at(line, rx, nth=0):
    ws = [w for w in words if w["line"] == line and re.match(rx, w["word"], re.I)]
    return (ws[nth] if len(ws) > nth else (ws[0] if ws else {"s": L[line]["start"]}))["s"]


B = dict(
    ping=L["ping"]["start"], notif=L["ping"]["start"] - 0.45, who=L["who"]["start"], see=L["see"]["start"],
    start=L["start"]["start"], press=word_at("start", r"^start"), room=L["room"]["start"],
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
vo, vsr = sf.read(os.path.join(STUDIO, "assets", "audio", f"ledger-scroll-{v}.wav"), dtype="float32")
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

# ---------------- late night: room tone, scrolling, lo-fi keys ----------------
amb += lowpass(rng.standard_normal(N), 300) * 0.03 * (1 - ramp(B["end"] - 0.2, B["end"]))
for at in (0.15, 1.15, 2.25):                      # thumb swipes on glass
    n = int(0.16 * SR); tt = np.arange(n) / SR
    place(sfx, bandpass(rng.standard_normal(n), 2000, 7000) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.12, at)
for at, mm in [(0.0, 57), (0.0, 64), (0.0, 67), (1.6, 55), (1.6, 62), (1.6, 65)]:
    if at < B["notif"]:
        place(mus, tone(hz(mm), 2.4, "keys", 0.1), at)
# the notification: two-tone phone ding, then everything stops for a beat
for i, mm in enumerate([88, 95]):
    place(sfx, tone(hz(mm), 0.9, "bell", 0.22), B["notif"] + i * 0.11)
place(sfx, lowpass(rng.standard_normal(int(0.25 * SR)), 180) * 0.25, B["notif"])  # buzz on the desk
# Ledger shows up
for i, mm in enumerate([84, 88, 91, 96]):
    place(sfx, tone(hz(mm), 1.0, "bell", 0.08), B["ping"] - 0.2 + i * 0.04)
pop(B["ping"] - 0.22, 420, 0.35)
whoosh(B["who"] + 0.06, 0.3, 0.25, up=False)
# tension pad under the "everyone can see" exchange
for mm in (45, 52, 57, 60):
    place(mus, tone(hz(mm + 12), B["start"] - B["who"] + 0.4, "pad", 0.05), B["who"] - 0.1)
# beat drops on "Hit start"
BPM = 122; beat = 60 / BPM; bar = 4 * beat
prog = [[45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]]
k, at = 0, B["press"] - 0.02
while at < TOTAL:
    ch = prog[k % 4]
    for mm in ch[1:]:
        place(mus, tone(hz(mm + 12), bar + 0.2, "pad", 0.05), at)
    for e in range(8):
        place(mus, tone(hz(ch[0] - 12 + (12 if e % 4 == 3 else 0)), beat / 2 * 0.95, "bass", 0.32), at + e * beat / 2)
        place(mus, tone(hz(ch[1 + [0, 1, 2, 3, 2, 1, 2, 3][e] % 3] + 24), 0.35, "pluck", 0.07), at + e * beat / 2)
    for b4 in range(4):
        place(drums, kick(), at + b4 * beat, 0.8)
        if b4 % 2 == 1:
            place(drums, clap(), at + b4 * beat, 0.5)
        place(drums, hat(), at + b4 * beat + beat / 2, 0.5)
    at += bar; k += 1
drums *= 1 - ramp(B["end"] + 1.8, B["end"] + 2.3)
for mm in [60, 64, 67, 72, 76]:
    place(mus, tone(hz(mm), 3.0, "keys", 0.035), B["end"] - 0.05)
music = (mus + drums) * (1 - ramp(TOTAL - 0.8, TOTAL))

# ---------------- sfx ----------------
impact(B["press"] - 0.04, 0.5)
pop(B["press"] + 0.02, 700, 0.4)
for i in range(10):
    tick(B["press"] + 0.25 + i * 0.14, 2200, 0.05)
for i in range(5):                                 # friends join the room
    place(sfx, tone(hz(79 + [0, 4, 7, 12, 16][i]), 0.4, "bell", 0.06), B["room"] - 0.3 + i * 0.2)
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
out = os.path.join(STUDIO, "remotion-app", "public", "ledger-scroll", f"mix-{v}.wav")
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
