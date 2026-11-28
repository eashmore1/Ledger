"""Builds script-A/B/C.json (hook + shared body) for generate_voice.py.

The voice is ElevenLabs (narrator "Ryan"), made per line by
  python scripts/generate_voice_elevenlabs.py ads/ledger-3d/el_lines.json --out assets/audio/el/ledger-3d
and each line here points at that file.
"""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
EL = "assets/audio/el/ledger-3d"
body = json.load(open(os.path.join(here, "body.json")))
hooks = json.load(open(os.path.join(here, "hooks.json")))
for k, h in hooks.items():
    lines = [{"id": "hook", "scene": "hook", "text": h["text"], "screen": h["screen"], "file": f"{EL}/hook{k}.wav", "max_pause": 0.3}]
    lines += [{**b, "file": f"{EL}/{b['id']}.wav", "max_pause": 0.28} for b in body]
    spec = {"engine": "files", "voice": "elevenlabs-ryan", "gap": 0.16, "lines": lines}
    json.dump(spec, open(os.path.join(here, f"script-{k}.json"), "w"), indent=1)
print("wrote", ", ".join(f"script-{k}.json" for k in hooks))
