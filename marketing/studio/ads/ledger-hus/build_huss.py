#!/usr/bin/env python3
"""One command for the Ledger "while they're out partying / HUSS HUSS HUSS" ad:
mix + timing -> 3D render -> -14 LUFS master.

  .venv/bin/python ads/ledger-hus/build_huss.py A B C [--concurrency=4]
"""
import argparse, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))
APP = os.path.join(STUDIO, "remotion-app")
PY = sys.executable


def run(cmd, **kw):
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True, stdin=subprocess.DEVNULL, **kw)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("variants", nargs="*", default=["A"])
    ap.add_argument("--concurrency", default="4")
    a = ap.parse_args()
    run([PY, os.path.join(HERE, "mix_huss.py")])
    for v in a.variants:
        raw = os.path.join(APP, "out", f"ledger-huss-{v}.raw.mp4")
        run(["npx", "remotion", "render", f"LedgerHuss-{v}", raw, f"--concurrency={a.concurrency}",
             "--codec=h264", "--crf=19", "--audio-codec=aac", "--audio-bitrate=256k"], cwd=APP)
        final = os.path.join(STUDIO, "output", f"ledger-huss-{v}.mp4")
        probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1:LRA=9:print_format=json",
                                "-f", "null", "-"], capture_output=True, text=True, stdin=subprocess.DEVNULL).stderr
        m = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
        af = (f"loudnorm=I=-14:TP=-1:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "256k",
             "-movflags", "+faststart", final])
        print("done:", final, flush=True)


if __name__ == "__main__":
    sys.exit(main())
