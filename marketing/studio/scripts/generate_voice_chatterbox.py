#!/usr/bin/env python3
"""Expressive, natural voices with Chatterbox (free, open source), with a Whisper check.

Needs network access to huggingface.co (model download) the first time.

  pip install chatterbox-tts faster-whisper soundfile
  python scripts/generate_voice_chatterbox.py ads/ledger-3d-story/chatterbox_lines.json \
      --out assets/audio/chatterbox/ledger-3d-story --takes 3

For every line it renders N takes (different seeds), transcribes each with Whisper,
scores it against the script, and keeps the best as <out>/<id>.wav. All takes and a
report.json (what Whisper heard per take) are saved next to it so a person can re-pick.
Voices clone the timbre of the reference clips in the JSON ("voices"); use synthetic
or licensed references only, never a real person's voice without their consent.
"""
import argparse, json, os, re, shutil, sys
from difflib import SequenceMatcher

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(HERE)


def norm(s):
    s = s.lower().replace("c p a", "cpa").replace("c.p.a.", "cpa").replace("ledgercpa", "ledger cpa")
    s = re.sub(r"\b2\b", "two", s).replace("a m", "am").replace("a.m.", "am")
    return re.sub(r"[^a-z0-9' ]", " ", s).split()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--out", required=True)
    ap.add_argument("--takes", type=int, default=3)
    ap.add_argument("--only", nargs="*")
    a = ap.parse_args()

    import torch, torchaudio as ta
    from chatterbox.tts import ChatterboxTTS
    from faster_whisper import WhisperModel

    spec = json.load(open(a.spec))
    out = os.path.join(STUDIO, a.out) if not os.path.isabs(a.out) else a.out
    os.makedirs(os.path.join(out, "takes"), exist_ok=True)
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    tts = ChatterboxTTS.from_pretrained(device=dev)
    asr = WhisperModel("small.en", device="cpu", compute_type="int8")
    report = {}
    for ln in spec["lines"]:
        if a.only and ln["id"] not in a.only:
            continue
        ref = os.path.join(STUDIO, spec["voices"][ln["who"]])
        want = norm(ln["say"])
        best = None
        report[ln["id"]] = []
        for k in range(a.takes):
            torch.manual_seed(1000 + k * 17)
            wav = tts.generate(ln["say"], audio_prompt_path=ref, exaggeration=ln.get("exaggeration", 0.5), cfg_weight=ln.get("cfg", 0.5))
            path = os.path.join(out, "takes", f"{ln['id']}-{k}.wav")
            ta.save(path, wav, tts.sr)
            segs, _ = asr.transcribe(path, language="en")
            heard = " ".join(s.text for s in segs).strip()
            score = SequenceMatcher(None, want, norm(heard)).ratio()
            dur = wav.shape[-1] / tts.sr
            report[ln["id"]].append({"take": k, "heard": heard, "score": round(score, 3), "dur": round(dur, 2)})
            print(f"{ln['id']} take {k}: {score:.2f} {dur:.2f}s  heard: {heard}", flush=True)
            # prefer accuracy, then the shorter (tighter) take
            key = (round(score, 2), -dur)
            if best is None or key > best[0]:
                best = (key, path)
        shutil.copy(best[1], os.path.join(out, f"{ln['id']}.wav"))
        report[ln["id"]].append({"picked": os.path.basename(best[1])})
    json.dump(report, open(os.path.join(out, "report.json"), "w"), indent=1)
    print("done ->", out)


if __name__ == "__main__":
    sys.exit(main())
