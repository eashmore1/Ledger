#!/usr/bin/env python3
"""Per-line voiceover with ElevenLabs, written where the ad builds already look for it.

  python scripts/generate_voice_elevenlabs.py ads/ledger-hus/chatterbox_lines.json --out assets/audio/chatterbox/ledger-huss
  python scripts/generate_voice_elevenlabs.py ads/ledger-3d-story/chatterbox_lines.json --out assets/audio/chatterbox/ledger-3d-story

Reads the "say" text of every line, renders TAKES takes, keeps take 1 as <out>/<id>.wav and the
rest in <out>/takes/. The API key is added to requests by the sandbox proxy (header xi-api-key);
the script never reads or prints it. Stock voices only, no cloning.
"""
import argparse, json, os, re, subprocess, sys, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(HERE)
VOICES = {"S": "bIHbv24MWmeRgasZH58o",   # Will: relaxed, young, deadpan
          "L": "cgSgspJ2msm6clMCkdW9"}   # Jessica: playful, bright, warm
MODEL = "eleven_v3"
# eleven_v3 answers to spelling, not phoneme tags: "Hhuss" gets the short "oo" of "push".
RESPELL = [(re.compile(r"\bHuss\b"), "Hhuss"), (re.compile(r"\bhuss\b"), "hhuss")]


def respell(t):
    for rx, to in RESPELL:
        t = rx.sub(to, t)
    return t


def tts(voice, text, stability):
    body = json.dumps({"text": text, "model_id": MODEL, "voice_settings": {"stability": stability}}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128", data=body,
        headers={"xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "placeholder"), "Content-Type": "application/json"})
    try:
        return urllib.request.urlopen(req, timeout=120).read()
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs error {e.code}: {e.read()[:300]!r}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec"); ap.add_argument("--out", required=True)
    ap.add_argument("--takes", type=int, default=2)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--stability", type=float, default=0.5)
    a = ap.parse_args()
    spec = json.load(open(a.spec))
    out = a.out if os.path.isabs(a.out) else os.path.join(STUDIO, a.out)
    os.makedirs(os.path.join(out, "takes"), exist_ok=True)
    for ln in spec["lines"]:
        if a.only and ln["id"] not in a.only:
            continue
        text = respell(ln.get("say") or ln["text"])
        for t in range(1, a.takes + 1):
            mp3 = os.path.join(out, "takes", f"{ln['id']}-{t}.mp3")
            open(mp3, "wb").write(tts(VOICES[ln["who"]], text, a.stability))
            wav = os.path.join(out, "takes", f"{ln['id']}-{t}.wav")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", "44100", wav], check=True, stdin=subprocess.DEVNULL)
        subprocess.run(["cp", os.path.join(out, "takes", f"{ln['id']}-1.wav"), os.path.join(out, f"{ln['id']}.wav")], check=True)
        print("ok", ln["id"], "->", text, flush=True)


if __name__ == "__main__":
    main()
