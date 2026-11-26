"""Builds script-A/B/C.json (hook + shared body) for generate_voice.py."""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
body = json.load(open(os.path.join(here, "body.json")))
hooks = json.load(open(os.path.join(here, "hooks.json")))
for k, h in hooks.items():
    spec = {"engine": "kokoro", "voice": "af_heart", "rate": "+8%", "gap": 0.16,
            "lines": [{"id": "hook", "scene": "hook", "text": h["text"], "screen": h["screen"]}] + body}
    json.dump(spec, open(os.path.join(here, f"script-{k}.json"), "w"), indent=1)
print("wrote", ", ".join(f"script-{k}.json" for k in hooks))
