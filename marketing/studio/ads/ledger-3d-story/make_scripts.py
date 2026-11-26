"""Builds script-A/B/C.json for generate_voice.py from the Chatterbox takes.

Voices come from scripts/generate_voice_chatterbox.py (natural, expressive, free) using
chatterbox_lines.json; each line here points at its picked take via "file".
"""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
CB = "assets/audio/chatterbox/ledger-3d-story"
spec = json.load(open(os.path.join(here, "chatterbox_lines.json")))
by_id = {ln["id"]: ln for ln in spec["lines"]}
hooks = json.load(open(os.path.join(here, "hooks.json")))
SCENE = {"alone": "rain", "hey": "pop", "talk": "talk", "start": "timer", "room": "room", "streak": "streak",
         "cando": "streak", "passed": "pass", "brand": "end", "cta": "end"}
GAP = {"hey": 0.3, "talk": 0.2, "passed": 0.28, "cta": 0.22}
body = []
for i in SCENE:
    ln = by_id[i]
    body.append({"id": i, "who": ln["who"], "scene": SCENE[i], "text": ln["text"], "file": f"{CB}/{i}.wav",
                 "gap": GAP.get(i, 0.18), "max_pause": 0.32})
for k, h in hooks.items():
    hk = by_id[f"hook{k}"]
    lines = [{"id": "hook", "who": "S", "scene": "hook", "text": hk["text"], "screen": h["screen"], "file": f"{CB}/hook{k}.wav", "max_pause": 0.35}] + body
    json.dump({"engine": "files", "voice": "chatterbox", "lines": lines}, open(os.path.join(here, f"script-{k}.json"), "w"), indent=1)
print("wrote", ", ".join(f"script-{k}.json" for k in hooks))
