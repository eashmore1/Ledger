#!/usr/bin/env python3
"""Word-level timestamps (milliseconds) for a voiceover, plus a pronunciation check.

  python scripts/transcribe_words.py                       # assets/audio/voiceover.mp3
  python scripts/transcribe_words.py --audio X.wav --lines X.lines.json --out words.json

Engines
  whisper   faster-whisper (base.en) transcribes the audio with word timestamps.
            The transcript is compared to the script so a misread word is caught.
            Needs the model from huggingface.co on first run.
  sphinx    PocketSphinx forced alignment against the known script (offline,
            model ships with the pip package). Also runs a free decode per line
            and reports how much of the script it heard, as a clarity check.
  auto      whisper if the model can be loaded, else sphinx. Default.

Output JSON: {"engine":..., "words":[{"word":"Hit","start_ms":3140,"end_ms":3290,"line":"start"}...],
              "check":{"heard":0.93, "lines":[...]}}
"""
import argparse, json, os, re, subprocess, sys, tempfile
from difflib import SequenceMatcher

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(HERE)


def load16k(path):
    with tempfile.NamedTemporaryFile(suffix=".raw", delete=False) as f:
        raw = f.name
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", raw], check=True)
    data = np.fromfile(raw, dtype=np.int16)
    os.remove(raw)
    return data


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


# CPA sections candidates say as words, not letters
SAID_AS_WORD = {"FAR", "BAR", "REG"}


def spoken_tokens(word):
    """Display word -> the words a speaker actually says ('ledgercpa.app' -> ledger c p a dot app)."""
    w = word.strip()
    if re.search(r"\.[a-z]{2,4}$", w.lower()):  # a domain
        name, tld = w.lower().rsplit(".", 1)
        out = []
        for part in re.findall(r"cpa|[a-z]+", name):
            out += list(part) if part == "cpa" else [part]
        return out + ["dot", tld]
    core = re.sub(r"[^A-Za-z0-9']", "", w)
    if core in SAID_AS_WORD:
        return [core.lower()]
    if core == "2":
        return ["two"]
    if len(core) >= 2 and core.isupper():
        return list(core.lower())
    if core.isdigit():
        return [core]
    return [norm(core)] if norm(core) else []


def script_words(lines):
    out = []
    for ln in lines:
        for w in ln["text"].split():
            out.append({"word": w, "line": ln["id"], "tok": spoken_tokens(w), "seg": (ln["start"], ln["end"])})
    return out


# ---------- sphinx ----------
def sphinx(audio, lines):
    from pocketsphinx import Decoder

    dec = Decoder(samprate=16000, loglevel="FATAL")
    dict_ok = lambda t: dec.lookup_word(t) is not None
    words, checks = [], []
    for ln in lines:
        a, b = int(ln["start"] * 16000), int(ln["end"] * 16000)
        seg = audio[max(0, a - 800): b + 800]
        off = max(0, a - 800) / 16000
        sw = script_words([ln])
        toks = [t for w in sw for t in w["tok"]]
        # free decode: how much of the line does a recognizer hear?
        dec.start_utt(); dec.process_raw(seg.tobytes(), full_utt=True); dec.end_utt()
        hyp = dec.hyp().hypstr.split() if dec.hyp() else []
        heard = SequenceMatcher(None, toks, hyp).ratio() if toks else 1
        checks.append({"line": ln["id"], "script": " ".join(toks), "heard_as": " ".join(hyp), "match": round(heard, 2)})
        # forced alignment
        usable = [t for t in toks if dict_ok(t)]
        times = {}
        try:
            dec.set_align_text(" ".join(usable))
            dec.start_utt(); dec.process_raw(seg.tobytes(), full_utt=True); dec.end_utt()
            dec.set_alignment()
            dec.start_utt(); dec.process_raw(seg.tobytes(), full_utt=True); dec.end_utt()
            al = [(x.name, x.start / 100 + off, (x.start + x.duration) / 100 + off)
                  for x in dec.get_alignment() if x.name not in ("<s>", "</s>", "<sil>")]
            al = [(re.sub(r"\(\d+\)$", "", n), s, e) for n, s, e in al]
            if len(al) == len(usable):
                for i, (n, s, e) in enumerate(al):
                    times[i] = (s, e)
        except Exception as ex:  # fall back to proportional timing below
            print("  align failed on", ln["id"], ex)
        dec = Decoder(samprate=16000, loglevel="FATAL")  # reset search mode
        # map aligned tokens back to display words
        k, tok_i = 0, 0
        for w in sw:
            ts = []
            for t in w["tok"]:
                if dict_ok(t):
                    if k in times:
                        ts.append(times[k])
                    k += 1
            w["t"] = (ts[0][0], ts[-1][1]) if ts else None
        fill_gaps(sw, ln["start"], ln["end"])
        words += sw
    return words, checks


def fill_gaps(sw, start, end):
    """Words without an alignment get times spread by syllable-ish length."""
    if all(w.get("t") for w in sw):
        return
    weights = [max(1, len("".join(w["tok"])) / 3) for w in sw]
    total, t = sum(weights), start
    for w, wt in zip(sw, weights):
        d = (end - start) * wt / total
        if not w.get("t"):
            w["t"] = (t, t + d)
        t += d


# ---------- whisper ----------
def whisper(path, lines):
    from faster_whisper import WhisperModel

    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(path, word_timestamps=True, language="en")
    heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    sw = script_words(lines)
    a = [t for w in sw for t in w["tok"]]
    owner = [i for i, w in enumerate(sw) for _ in w["tok"]]
    b_tokens, b_times = [], []
    for word, s, e in heard:
        toks = spoken_tokens(word) or [norm(word)]
        for t in toks:
            b_tokens.append(t); b_times.append((s, e))
    sm = SequenceMatcher(None, a, b_tokens, autojunk=False)
    for blk in sm.get_matching_blocks():
        for j in range(blk.size):
            w = sw[owner[blk.a + j]]
            s, e = b_times[blk.b + j]
            w["t"] = (min(w["t"][0], s), max(w["t"][1], e)) if w.get("t") else (s, e)
    for ln in lines:
        fill_gaps([w for w in sw if w["line"] == ln["id"]], ln["start"], ln["end"])
    misses = [op for op in sm.get_opcodes() if op[0] != "equal"]
    checks = [{"script": " ".join(a[i1:i2]), "heard_as": " ".join(b_tokens[j1:j2]), "op": tag} for tag, i1, i2, j1, j2 in misses]
    return sw, checks, round(sm.ratio(), 3)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--audio", default=os.path.join(STUDIO, "assets", "audio", "voiceover.mp3"))
    ap.add_argument("--lines", help="PREFIX.lines.json from generate_voice.py (default: next to audio)")
    ap.add_argument("--out", default=os.path.join(STUDIO, "assets", "captions", "words.json"))
    ap.add_argument("--engine", default="auto", choices=["auto", "whisper", "sphinx"])
    a = ap.parse_args()

    lines_path = a.lines or re.sub(r"\.(mp3|wav)$", "", a.audio) + ".lines.json"
    meta = json.load(open(lines_path))
    lines = meta["lines"]

    engine, result = a.engine, None
    if engine in ("auto", "whisper"):
        try:
            sw, checks, score = whisper(a.audio, lines)
            engine, result = "whisper", {"words": sw, "check": {"match": score, "diffs": checks}}
        except Exception as ex:
            if engine == "whisper":
                sys.exit(f"whisper unavailable: {ex}")
            print(f"whisper unavailable ({type(ex).__name__}); using PocketSphinx alignment")
    if result is None:
        engine = "sphinx"
        sw, checks = sphinx(load16k(a.audio), lines)
        tot = sum(len(c["script"].split()) for c in checks)
        heard = sum(c["match"] * len(c["script"].split()) for c in checks) / max(1, tot)
        result = {"words": sw, "check": {"match": round(heard, 3), "lines": checks}}

    words = [{"word": w["word"], "start_ms": int(round(w["t"][0] * 1000)), "end_ms": int(round(w["t"][1] * 1000)), "line": w["line"]}
             for w in result["words"]]
    out = {"engine": engine, "audio": os.path.basename(a.audio), "total_ms": int(meta["total"] * 1000),
           "lines": [{k: ln[k] for k in ln if k not in ("say",)} for ln in lines], "words": words, "check": result["check"]}
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    json.dump(out, open(a.out, "w"), indent=1)
    print(f"{engine}: {len(words)} words -> {a.out}; recognizer match {result['check']['match']:.0%}")
    for c in result["check"].get("lines", result["check"].get("diffs", [])):
        print("  ", c)


if __name__ == "__main__":
    main()
