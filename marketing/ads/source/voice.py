import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
T = sys.argv[1]; voice = sys.argv[2] if len(sys.argv) > 2 else 'am_puck'
k = Kokoro(T + '/kokoro.onnx', T + '/voices.bin')
lines = json.load(open(sys.argv[3]))
SR = 24000; FPS = 30
out = []; meta = []; t = 0.0
for ln in lines:
    pad = np.zeros(int(SR * ln.get('pre', 0.25)), dtype=np.float32)
    a, sr = k.create(ln['text'], voice=voice, speed=ln.get('speed', 1.0), lang='en-us')
    t += len(pad) / SR
    meta.append({'start': t, 'dur': len(a) / SR})
    out += [pad, a.astype(np.float32)]; t += len(a) / SR
out.append(np.zeros(int(SR * 1.2), dtype=np.float32))
audio = np.concatenate(out); sf.write(sys.argv[4] + '/voice.wav', audio, SR)
# mouth openness per video frame from loudness
hop = SR // FPS; n = len(audio) // hop
rms = np.array([np.sqrt(np.mean(audio[i*hop:(i+1)*hop] ** 2)) for i in range(n)])
m = np.clip(rms / (np.percentile(rms[rms > 0.005], 90) if (rms > 0.005).any() else 1), 0, 1)
m[rms < 0.01] = 0
json.dump({'lines': meta, 'mouth': [round(float(x), 3) for x in m], 'total': len(audio) / SR}, open(sys.argv[4] + '/timing.json', 'w'))
print(json.dumps(meta), len(audio) / SR)
