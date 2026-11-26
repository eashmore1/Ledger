#!/usr/bin/env python3
"""One command for the Ledger 3D story ad (rainy night -> Ledger -> pass): voice -> word timings -> mix -> 3D render -> -14 LUFS master.

  .venv/bin/python ads/ledger-3d-story/build.py            # all hook variants A B C
  .venv/bin/python ads/ledger-3d-story/build.py A --skip-voice   # re-render A with the existing voice

Edit body.json / hooks.json for copy, remotion-app/src/ledger3d/* for visuals,
mix.py for music and sound effects.
Output: output/ledger-3d-story-{A,B,C}.mp4 (1080x1920, 30 fps, H.264 + AAC 48 kHz).
"""
import argparse, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))
APP = os.path.join(STUDIO, "remotion-app")
PY = os.path.join(STUDIO, ".venv", "bin", "python")


def run(cmd, **kw):
    print("$", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True, **kw)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("variants", nargs="*", default=["A", "B", "C"])
    ap.add_argument("--skip-voice", action="store_true")
    ap.add_argument("--concurrency", default="4")
    a = ap.parse_args()

    run([PY, os.path.join(HERE, "make_scripts.py")])
    os.makedirs(os.path.join(APP, "public", "ledger-3d-story"), exist_ok=True)
    for v in a.variants:
        vo = os.path.join(STUDIO, "assets", "audio", f"ledger-3d-story-{v}")
        words = os.path.join(STUDIO, "assets", "captions", f"ledger-3d-story-{v}.words.json")
        if not a.skip_voice:
            run([PY, os.path.join(STUDIO, "scripts", "generate_voice.py"), "--script", os.path.join(HERE, f"script-{v}.json"), "--out", vo])
            run([PY, os.path.join(STUDIO, "scripts", "transcribe_words.py"), "--audio", vo + ".wav", "--out", words])
        shutil.copy(words, os.path.join(APP, "public", "ledger-3d-story"))
        run([PY, os.path.join(STUDIO, "scripts", "mouth_sync.py"), vo, "--out", os.path.join(APP, "public", "ledger-3d-story", f"mouth-{v}.json")])
        run([PY, os.path.join(HERE, "mix.py"), v], env={**os.environ, "REPORT": "1"})

        raw = os.path.join(APP, "out", f"ledger-3d-story-{v}.raw.mp4")
        run(["npx", "remotion", "render", f"LedgerStory3D-{v}", raw, f"--concurrency={a.concurrency}",
             "--codec=h264", "--crf=19", "--audio-codec=aac", "--audio-bitrate=256k"], cwd=APP)

        # Master: exact -14 LUFS / -1 dBTP (two-pass loudnorm), faststart for upload.
        final = os.path.join(STUDIO, "output", f"ledger-3d-story-{v}.mp4")
        probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1:LRA=9:print_format=json", "-f", "null", "-"],
                               capture_output=True, text=True).stderr
        j = probe[probe.rindex("{"):probe.rindex("}") + 1]
        import json
        m = json.loads(j)
        af = (f"loudnorm=I=-14:TP=-1:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "256k",
             "-movflags", "+faststart", final])
        print("done:", final)


if __name__ == "__main__":
    sys.exit(main())
