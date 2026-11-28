"""Builds script-A.json for generate_voice.py from the ElevenLabs takes in lines.json."""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
EL = "assets/audio/el/ledger-scroll"
spec = json.load(open(os.path.join(here, "lines.json")))
SCENE = {"hook": "hook", "ping": "ping", "who": "who", "see": "see", "start": "timer", "room": "room", "brand": "end", "cta": "end"}
GAP = {"ping": 0.35, "who": 0.2, "see": 0.18, "start": 0.2, "room": 0.22, "brand": 0.3, "cta": 0.22}
lines = []
for ln in spec["lines"]:
    x = {"id": ln["id"], "who": ln["who"], "scene": SCENE[ln["id"]], "text": ln["text"], "file": f"{EL}/{ln['id']}.wav", "max_pause": 0.32}
    if "screen" in ln: x["screen"] = ln["screen"]
    if ln["id"] in GAP: x["gap"] = GAP[ln["id"]]
    lines.append(x)
json.dump({"engine": "files", "voice": "elevenlabs", "lines": lines}, open(os.path.join(here, "script-A.json"), "w"), indent=1)
print("wrote script-A.json")
