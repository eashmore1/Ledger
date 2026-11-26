import json, sys, subprocess, numpy as np, soundfile as sf, os
from kokoro_onnx import Kokoro
TTS, OUT = sys.argv[1], sys.argv[2]
k = Kokoro(TTS + '/kokoro.onnx', TTS + '/voices.bin')
V = np.load(TTS + '/voices.bin')
SR = 24000
# Student: a natural young-adult male voice. Ledger: bright cartoon voice, pitched up with formants kept.
student = V['am_michael'] * 0.7 + V['am_liam'] * 0.3
ledger = V['am_puck'] * 0.6 + V['af_heart'] * 0.4
lines = json.load(open(OUT + '/script.json'))
meta = []; t = 0.0; segs = []
for i, ln in enumerate(lines):
    style = student if ln['who'] == 'S' else ledger
    speed = ln.get('speed', 0.94 if ln['who'] == 'S' else 1.06)
    a, sr = k.create(ln['text'], voice=style, speed=speed, lang='en-us')
    raw = f'{OUT}/l{i}.wav'; sf.write(raw, a, SR)
    if ln['who'] == 'L':
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', 'rubberband=pitch=1.2:formant=preserved:pitchq=quality', '-ar', '24000', f'{OUT}/l{i}p.wav'], check=True)
        a, _ = sf.read(f'{OUT}/l{i}p.wav', dtype='float32')
    # trim silence at the ends
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 240): nz[-1] + 1200]
    t += ln['pre']
    meta.append({'who': ln['who'], 'start': round(t, 3), 'dur': round(len(a) / SR, 3), 'scene': ln['scene'], 'cap': ln.get('cap', ln['text'])})
    segs.append((t, ln['who'], a)); t += len(a) / SR
total = t + 2.6
N = int(total * SR)
tracks = {'S': np.zeros(N, np.float32), 'L': np.zeros(N, np.float32)}
for st, w, a in segs:
    i = int(st * SR); tracks[w][i:i + len(a)] += a
for w in tracks: sf.write(f'{OUT}/voice_{w}.wav', tracks[w], SR)
FPS = 30; hop = SR // FPS; n = int(total * FPS)
mouth = {}
for w, tr in tracks.items():
    rms = np.array([np.sqrt(np.mean(tr[i * hop:(i + 1) * hop] ** 2)) if i * hop < N else 0 for i in range(n)])
    ref = np.percentile(rms[rms > 0.01], 85)
    m = np.clip(rms / ref, 0, 1); m[rms < 0.012] = 0
    # light smoothing so the jaw doesn't jitter
    m = np.convolve(m, [0.25, 0.5, 0.25], 'same')
    mouth[w] = [round(float(x), 3) for x in m]
json.dump({'lines': meta, 'mouth': mouth, 'total': round(total, 3)}, open(OUT + '/timing.json', 'w'))
for m in meta: print(m['who'], m['start'], m['dur'], m['cap'][:40])
print('total', total)
