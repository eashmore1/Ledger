#!/usr/bin/env python3
"""Music + sound design + voice for the Ledger 3D ad (all synthesized, royalty-free).

  python ads/ledger-3d/mix.py A      -> remotion-app/public/ledger-3d/mix-A.wav

Beat times mirror `beats()` in remotion-app/src/ledger3d/Scene3D.tsx.
Music sits ~-22 dB under the voice while it talks, comes up between lines,
and drops on "Meet Ledger" after a filtered build under the hook.
"""
import json, os, re, sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))
SR = 48000
END_HOLD = 2.3

v = sys.argv[1] if len(sys.argv) > 1 else "A"
W = json.load(open(os.path.join(STUDIO, "assets", "captions", f"ledger-3d-{v}.words.json")))
L = {l["id"]: l for l in W["lines"]}
words = [dict(w, s=w["start_ms"] / 1000) for w in W["words"]]


def word_at(line, rx, nth=0):
    ws = [w for w in words if w["line"] == line and re.match(rx, w["word"], re.I)]
    return (ws[nth] if len(ws) > nth else (ws[0] if ws else {"s": L[line]["start"]}))["s"]


B = dict(
    meet=L["meet"]["start"], timer=L["start"]["start"], press=word_at("start", r"^start"),
    post=L["post"]["start"], friends=word_at("post", r"^friends"), live=L["live"]["start"], room=L["room"]["start"],
    same=L["same"]["start"], focus=word_at("same", r"^same", 1), nobody=word_at("same", r"^nobody"),
    streak=L["streak"]["start"], badges=word_at("streak", r"^unlock"), goal=word_at("streak", r"^crush"),
    pass_=L["pass"]["start"], passWord=word_at("pass", r"^pass"), end=L["brand"]["start"], cta=L["cta"]["start"],
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


# ---------------- voice ----------------
vo, vsr = sf.read(os.path.join(STUDIO, "assets", "audio", f"ledger-3d-{v}.wav"), dtype="float32")
voice = np.interp(t, np.arange(len(vo)) / vsr, vo, right=0)
# light presence + tiny room so it doesn't sound dry/boxy
voice = voice + 0.12 * highpass(voice, 3500)
n = int(0.35 * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.06); ir[0] = 0; ir /= np.sqrt((ir ** 2).sum())
m = 1 << (N + n).bit_length()
voice = voice + 0.05 * np.fft.irfft(np.fft.rfft(voice, m) * np.fft.rfft(ir, m), m)[:N]

# speech envelope for ducking
env = np.convolve(np.abs(voice), np.ones(1200) / 1200, "same")
speaking = np.clip(env / (np.percentile(env[env > 1e-4], 60) * 0.5), 0, 1)
# look-ahead: duck 150 ms before a word starts and hold 200 ms after it ends
hold = speaking.copy()
for k in range(-int(0.20 * SR), int(0.15 * SR) + 1, int(0.01 * SR)):
    hold = np.maximum(hold, np.roll(speaking, -k))
speaking = np.convolve(hold, np.ones(2400) / 2400, "same")
duck_db = -22 + 8 * (1 - speaking)  # -22 dB under speech, -14 dB between lines
duck = 10 ** (duck_db / 20)

# ---------------- music ----------------
BPM = 120
beat = 60 / BPM
drop = B["meet"]
mus = np.zeros(N)
drums = np.zeros(N)
sfx = np.zeros(N)
# hook: low drone + filtered pulse + riser into the drop
place(mus, tone(hz(45), drop + 0.2, "pad", 0.32), 0)
place(mus, tone(hz(57), drop + 0.2, "pad", 0.14), 0)
for k in range(int(drop / beat) + 1):  # muffled pulse, as if through a wall
    place(drums, lowpass(kick(), 400), k * beat, 0.35)
n = int(drop * SR); tt = np.arange(n) / SR
riser = highpass(rng.standard_normal(n), 3000) * (tt / tt[-1]) ** 4 * 0.07
place(sfx, riser, 0)
# after the drop: C G Am F pop loop with four-on-the-floor
prog = [[48, 55, 60, 64], [43, 55, 59, 62], [45, 57, 60, 64], [41, 53, 57, 60]]
bar = 4 * beat
k, at = 0, drop
while at < TOTAL:
    ch = prog[k % 4]
    for mm in ch[1:]:
        place(mus, tone(hz(mm + 12), bar + 0.2, "pad", 0.05), at)
    for e in range(8):  # bass on eighths
        place(mus, tone(hz(ch[0] - 12 + (12 if e % 4 == 3 else 0)), beat / 2 * 0.95, "bass", 0.32), at + e * beat / 2)
    arp = [0, 1, 2, 3, 2, 1, 2, 3]
    for e in range(8):
        place(mus, tone(hz(ch[1 + arp[e] % 3] + 24), 0.35, "pluck", 0.07), at + e * beat / 2)
    for b in range(4):
        place(drums, kick(), at + b * beat, 0.8)
        if b % 2 == 1:
            place(drums, clap(), at + b * beat, 0.5)
        place(drums, hat(), at + b * beat + beat / 2, 0.5)
        place(drums, hat(), at + b * beat, 0.25)
    place(drums, hat(True), at + 3.5 * beat, 0.3)
    at += bar
    k += 1
# end card: big chord + no drums after the last bar
endmask = 1 - ramp(B["end"] + 1.8, B["end"] + 2.3)
drums *= endmask
for mm in [60, 64, 67, 72, 76]:
    place(mus, tone(hz(mm), 3.0, "keys", 0.06), B["end"] - 0.1)
music = (mus + drums) * (1 - ramp(TOTAL - 0.8, TOTAL))

# ---------------- sfx ----------------
whoosh(0.55, 0.5, 0.6)                  # phone flies in
impact(0.55, 0.5)
impact(drop - 0.06, 0.55)               # the drop: Ledger jumps in (hit lands just before the word)
for i, mm in enumerate([84, 88, 91, 96]):
    place(sfx, tone(hz(mm), 1.0, "bell", 0.07), L["meet"]["end"] + 0.02 + i * 0.04)
for c in [B["timer"], B["post"], B["live"], B["room"], B["same"], B["streak"], B["pass_"]]:
    whoosh(c + 0.08, 0.35, 0.35, up=False)
pop(B["press"] + 0.02, 700, 0.4)        # Start Session tap
for i in range(16):                     # clock time-lapse ticks
    tick(B["press"] + 0.25 + i * 0.13, 2200, 0.05)
pop(B["post"] + 0.12, 650, 0.35)        # Log Session tap
for i in range(9):                      # hearts / props
    pop(B["friends"] + i * 0.07, 500 + i * 60, 0.18)
for i in range(4):                      # live cards
    pop(B["live"] + 0.1 + i * 0.16, 420 + i * 70, 0.22)
for i in range(5):                      # friends joining the room
    place(sfx, tone(hz(79 + [0, 4, 7, 12, 16][i]), 0.4, "bell", 0.07), B["room"] + 0.15 + i * 0.28)
place(sfx, tone(hz(81), 1.2, "bell", 0.12), B["same"] + 0.05)   # focus chime (the app's room chime)
place(sfx, tone(hz(88), 1.2, "bell", 0.1), B["same"] + 0.1)
for i in range(14):                     # streak counter
    tick(B["streak"] + 0.12 + i * 0.07, 1500 + i * 60, 0.07)
n = int(0.8 * SR); tt = np.arange(n) / SR
place(sfx, lowpass(rng.standard_normal(n), 1800) * np.exp(-tt * 3) * np.minimum(1, tt / 0.05) * 0.18, B["streak"])  # flame whoosh
for i in range(3):                      # badge coins
    place(sfx, tone(hz(91 + i * 3), 0.6, "bell", 0.1), B["badges"] + i * 0.12)
n = int(1.0 * SR); tt = np.arange(n) / SR
place(sfx, np.sin(2 * np.pi * np.cumsum(300 + 500 * tt) / SR) * tt * np.exp(-tt * 1.5) * 0.15, B["goal"] + 0.1)  # goal ring fill
for i in range(12):                     # heatmap tiles
    tick(B["pass_"] + 0.05 + i * 0.07, 900 + i * 50, 0.06)
impact(L["pass"]["end"] + 0.02, 0.8)    # PASSED stamp, right after the word
for i, mm in enumerate([72, 76, 79, 84]):
    place(sfx, tone(hz(mm), 1.2, "bell", 0.09), L["pass"]["end"] + 0.04 + i * 0.05)
impact(B["end"] - 0.12, 0.45)           # end card
pop(B["cta"], 600, 0.35)

# ---------------- mix ----------------
def rms(x):
    return np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2) + 1e-12)


voice_rms = rms(voice)
music = music / rms(music) * voice_rms  # music at voice level before ducking
MUS_G = float(os.environ.get("MUS_G", 1)); SFX_G = float(os.environ.get("SFX_G", 1))
sfx_duck = 10 ** ((-8 * speaking) / 20)  # effects step back 8 dB while she talks
mix = voice + music * duck * MUS_G + sfx * 0.45 * sfx_duck * SFX_G
mix = np.tanh(mix * 0.9) / 0.9
stereo = np.stack([mix + 0.003 * np.roll(music, 300), mix + 0.003 * np.roll(music, -300)], 1)
out = os.path.join(STUDIO, "remotion-app", "public", "ledger-3d", f"mix-{v}.wav")
sf.write(out, (stereo / np.abs(stereo).max() * 0.9).astype(np.float32), SR)
print(f"{v}: {TOTAL:.2f}s -> {out}")

# ---------------- clarity report: voice vs everything else, per line ----------------
bg = music * duck * MUS_G + sfx * 0.45 * sfx_duck * SFX_G
worst = 99
for ln in W["lines"]:
    a, b = int(ln["start"] * SR), int(ln["end"] * SR)
    snr = 10 * np.log10(np.mean(voice[a:b] ** 2) / (np.mean(bg[a:b] ** 2) + 1e-12))
    worst = min(worst, snr)
    if os.environ.get("REPORT"):
        print(f"  {ln['id']:7s} voice/background {snr:5.1f} dB")
print(f"  worst line voice/background: {worst:.1f} dB")
