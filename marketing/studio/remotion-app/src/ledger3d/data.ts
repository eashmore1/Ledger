// Timeline data for the Ledger 3D ad: voice lines + word timestamps per hook variant.
// Produced by scripts/generate_voice.py + scripts/transcribe_words.py (see ads/ledger-3d/build.py).
import A from "../../public/ledger-3d/ledger-3d-A.words.json";
import B from "../../public/ledger-3d/ledger-3d-B.words.json";
import C from "../../public/ledger-3d/ledger-3d-C.words.json";

export type Variant = "A" | "B" | "C";
export type Word = { word: string; start: number; end: number; line: string };
export type Line = { id: string; scene: string; text: string; start: number; end: number; screen?: string; who?: string };
export type Timeline = {
  variant: Variant;
  lines: Line[];
  words: Word[];
  L: Record<string, Line>;
  voiceEnd: number;
  duration: number; // seconds, including the end-card hold
  hookScreen: string[];
  mouth?: { fps: number; [who: string]: number[] | number };
};

export type Raw = {
  total_ms: number;
  lines: { id: string; scene: string; text: string; start: number; end: number; screen?: string; who?: string }[];
  words: { word: string; start_ms: number; end_ms: number; line: string }[];
};

const RAW: Record<Variant, Raw> = { A: A as Raw, B: B as Raw, C: C as Raw };
export const END_HOLD = 2.3;
export const FPS = 30;

export const timeline = (v: Variant): Timeline => buildTimeline(RAW[v], v);

export const buildTimeline = (r: Raw, v: Variant): Timeline => {
  const lines = r.lines.map((l) => ({ ...l }));
  const L: Record<string, Line> = {};
  lines.forEach((l) => (L[l.id] = l));
  const words = r.words.map((w) => ({ word: w.word, start: w.start_ms / 1000, end: w.end_ms / 1000, line: w.line }));
  const voiceEnd = r.total_ms / 1000;
  return {
    variant: v,
    lines,
    words,
    L,
    voiceEnd,
    duration: voiceEnd + END_HOLD,
    hookScreen: (L.hook.screen || L.hook.text).split("|"),
  };
};

/** Start time of the first word in line `id` matching `re` (fallback: line start). */
export const wordAt = (tl: Timeline, id: string, re: RegExp, nth = 0) => {
  const ws = tl.words.filter((w) => w.line === id && re.test(w.word));
  return (ws[nth] || ws[0])?.start ?? tl.L[id].start;
};
