"""Builds script-A/B/C.json (student hook + shared body) for generate_voice.py."""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
VOICE = {"S": "am_liam", "L": "am_fenrir"}  # student / Ledger: two clear, natural voices, no pitch tricks
body = json.load(open(os.path.join(here, "body.json")))
hooks = json.load(open(os.path.join(here, "hooks.json")))
for k, h in hooks.items():
    lines = [{"id": "hook", "who": "S", "scene": "hook", "text": h["text"], "screen": h["screen"]}] + body
    for ln in lines:
        ln["voice"] = VOICE[ln["who"]]
    spec = {"engine": "kokoro", "voice": VOICE["S"], "rate": "+5%", "gap": 0.16, "lines": lines}
    json.dump(spec, open(os.path.join(here, f"script-{k}.json"), "w"), indent=1)
print("wrote", ", ".join(f"script-{k}.json" for k in hooks))
