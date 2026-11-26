import json, numpy as np, soundfile as sf
SR = 48000
T = json.load(open('timing.json')); L = T['lines']
st = lambda i: L[i]['start']; en = lambda i: L[i]['start'] + L[i]['dur']
A = dict(bolt=en(1)+0.35, glowOn=en(1)+1.05, pop=en(1)+1.55, plan=st(4)+2.3, dawn0=en(4)+0.15, dawn1=st(5)-0.05,
         check=st(6)+1.05, lib=st(7)-0.55, end=st(9)-0.55)
N = int(T['total'] * SR); rng = np.random.default_rng(7)
t = np.arange(N) / SR
def fft_conv(a, b):
    n = len(a) + len(b) - 1; m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(a, m) * np.fft.rfft(b, m), m)[:n]
def lowpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / np.sqrt(1 + (f / fc) ** 4); return np.fft.irfft(X, len(x))
def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= (1 / np.sqrt(1 + (f / hi) ** 4)) * (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)); return np.fft.irfft(X, len(x))
def ramp(x0, x1):
    return np.clip((t - x0) / max(1e-3, x1 - x0), 0, 1)
def place(buf, sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N: buf[i:j] += sig[:j - i] * gain
def reverb(sec, decay):
    n = int(sec * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / decay); ir[0] = 0; return ir / np.sqrt((ir ** 2).sum())
def note(f, dur, kind='piano', vel=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    if kind == 'piano':
        s = sum(np.sin(2 * np.pi * f * k * tt) * (0.6 ** (k - 1)) * np.exp(-tt * (1.6 + k * 0.9)) for k in range(1, 6))
        s *= np.minimum(1, tt / 0.004)
    elif kind == 'pluck':
        s = sum(np.sin(2 * np.pi * f * k * tt) * (0.5 ** (k - 1)) for k in range(1, 4)) * np.exp(-tt * 6) * np.minimum(1, tt / 0.003)
    elif kind == 'pad':
        s = sum(np.sin(2 * np.pi * f * d * tt + k) for k, d in enumerate([1, 1.003, 0.997, 2.0])) * 0.3
        env = np.minimum(1, tt / 0.6) * np.minimum(1, (dur - tt) / 0.8); s *= env
    elif kind == 'bell':
        s = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) + 0.2 * np.sin(2 * np.pi * f * 5.4 * tt)) * np.exp(-tt * 3.5) * np.minimum(1, tt / 0.002)
    return s * vel
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# --- voices ---
vS, _ = sf.read('voice_S.wav', dtype='float32'); vL, _ = sf.read('voice_L.wav', dtype='float32')
up = lambda v: np.interp(np.arange(N) / SR, np.arange(len(v)) / 24000, v)
vS, vL = up(vS), up(vL)
vS = vS + 0.10 * fft_conv(vS, reverb(0.6, 0.12))[:N]       # small bedroom
vL = vL + 0.06 * fft_conv(vL, reverb(0.8, 0.18))[:N]
voice = vS + vL
env = np.abs(voice); env = np.convolve(env, np.ones(2400) / 2400, 'same')
duck = 1 - 0.6 * np.clip(env / (env.max() * 0.25), 0, 1)
duck = np.convolve(duck, np.ones(4800) / 4800, 'same')

# --- ambience ---
amb = np.zeros(N)
rainmask = 1 - ramp(A['dawn0'], A['dawn1'] + 0.6)
rain = bandpass(rng.standard_normal(N), 400, 5000) * 0.05 + lowpass(rng.standard_normal(N), 900) * 0.05
drops = np.zeros(N); idx = rng.integers(0, N, int(T['total'] * 60)); drops[idx] = rng.uniform(.2, 1, len(idx))
drops = fft_conv(drops, np.exp(-np.arange(400) / 60) * np.sin(np.arange(400) * 0.9))[:N] * 0.05
amb += (rain + drops) * rainmask * (0.8 + 0.4 * ramp(0, 0.6)) * (1 - 0.45 * (t > A['pop']))
# thunder
n = int(3.5 * SR); tt = np.arange(n) / SR
thunder = lowpass(rng.standard_normal(n), 140) * np.minimum(1, tt / 0.08) * np.exp(-tt * 1.3) * 3.2
thunder += bandpass(rng.standard_normal(n), 800, 6000) * np.exp(-tt * 12) * 0.6
place(amb, thunder, A['bolt'] + 0.1)
# morning birds after dawn
for k in range(7):
    at = A['dawn1'] + 0.4 + k * 0.7 + rng.uniform(0, .3)
    if at > A['lib'] - 0.3: break
    n = int(0.12 * SR); tt = np.arange(n) / SR
    f = 3200 + 900 * np.sin(tt * 60)
    place(amb, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / tt[-1]) * 0.05, at)
# library room tone
amb += lowpass(rng.standard_normal(N), 500) * 0.02 * ramp(A['lib'], A['lib'] + 0.3) * (1 - ramp(A['end'], A['end'] + 0.3))

# --- sfx ---
sfx = np.zeros(N)
n = int((A['pop'] - A['glowOn']) * SR); tt = np.arange(n) / SR       # magic riser
f = 400 + 1400 * (tt / tt[-1]) ** 2
riser = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 1.5, 2)) * (tt / tt[-1]) ** 1.5 * 0.12
place(sfx, riser, A['glowOn'])
for k, m in enumerate([84, 88, 91, 96, 100]):                          # pop chime
    place(sfx, note(hz(m), 1.4, 'bell', 0.16), A['pop'] + k * 0.045)
n = int(0.12 * SR); tt = np.arange(n) / SR
pop = np.sin(2 * np.pi * (300 + 500 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 30) * 0.35
place(sfx, pop, A['pop'])
def whoosh(at, dur=0.6, g=0.5):
    n = int(dur * SR); tt = np.arange(n) / SR
    w = bandpass(rng.standard_normal(n), 300, 3000) * np.sin(np.pi * tt / dur) ** 2 * g
    place(sfx, w, at - dur / 2)
whoosh(A['dawn0'] + 0.3, 1.0, 0.25); whoosh(A['lib'], 0.5, 0.35); whoosh(A['end'], 0.5, 0.35)
for at in [A['plan'], st(5) - 0.1, A['lib'] + 0.25, st(7) + 1.1, st(7) + 2.0]:
    n = int(0.09 * SR); tt = np.arange(n) / SR
    place(sfx, np.sin(2 * np.pi * (900 - 2500 * tt) * tt) * np.exp(-tt * 45) * 0.18, at)
for i in range(28):                                                    # plan cells ticking in
    place(sfx, note(hz(96 + (i % 5)), 0.08, 'pluck', 0.025), A['plan'] + 0.25 + i * 0.045)
place(sfx, note(hz(88), 0.9, 'bell', 0.22), A['check']); place(sfx, note(hz(95), 1.1, 'bell', 0.2), A['check'] + 0.09)
for i in range(12):                                                    # streak counter
    place(sfx, note(hz(84 + i), 0.08, 'pluck', 0.04), A['lib'] + 0.4 + i * 0.11)
n = int(0.5 * SR); tt = np.arange(n) / SR                              # cloud poof
place(sfx, bandpass(rng.standard_normal(n), 1500, 7000) * np.exp(-tt * 9) * 0.25, A['dawn0'] + 0.8)

# --- music ---
mus = np.zeros(N)
# sad piano in scene 1 (A minor, sparse)
for at, m in [(0.05, 57), (0.05, 64), (1.3, 60), (2.5, 64), (3.6, 53), (3.6, 60), (5.0, 64), (6.2, 52), (6.2, 59)]:
    place(mus, note(hz(m), 3.0, 'piano', 0.10), at)
# after Ledger: gentle hopeful pads + plucks; brighter after dawn
bpm = 100; beat = 60 / bpm
prog1 = [[57, 60, 64], [53, 57, 60], [48, 55, 60, 64], [55, 59, 62]]       # Am F C G
prog2 = [[48, 55, 64, 67], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]]  # C G Am F
t0 = A['pop'] + 0.6; bar = 4 * beat; k = 0; at = t0
while at < T['total']:
    bright = at >= A['dawn1'] - 0.2
    ch = (prog2 if bright else prog1)[k % 4]
    for m in ch: place(mus, note(hz(m), bar + 0.8, 'pad', 0.035 if not bright else 0.04), at)
    place(mus, note(hz(ch[0] - 12), bar, 'piano', 0.09), at)
    if bright:
        pat = [0, 2, 1, 2, 3 % len(ch), 2, 1, 2]
        for e in range(8): place(mus, note(hz(ch[pat[e] % len(ch)] + 12), 0.4, 'pluck', 0.05), at + e * beat / 2)
    else:
        for e in (0, 2): place(mus, note(hz(ch[-1] + 12), 1.2, 'piano', 0.05), at + e * beat)
    at += bar; k += 1
# final sting
for m in [60, 64, 67, 72, 76]: place(mus, note(hz(m), 2.5, 'piano', 0.08), A['end'])
mus *= 1 - 0.8 * (t < A['bolt']) * 0  # keep piano in scene 1
fade = 1 - ramp(T['total'] - 1.2, T['total'])
mix = voice * 1.0 + (mus * duck * 1.5 + amb * 0.9 + sfx * 0.8) * fade
mix = np.tanh(mix * 1.1) / 1.1
stereo = np.stack([mix + 0.004 * np.roll(amb, 240), mix + 0.004 * np.roll(amb, -240)], 1)
sf.write('mix.wav', stereo.astype(np.float32), SR)
print('peak', np.abs(stereo).max())
