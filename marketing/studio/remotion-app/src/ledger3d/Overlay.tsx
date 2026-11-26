// 2D layer on top of the 3D canvas: hook headline, word-by-word captions,
// feature chips, end card, cut flashes, vignette and film grain.
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { backOut, clamp, easeIn, easeOut, expoOut, prog, rand } from "./anim";
import { Timeline, Word } from "./data";
import { beats } from "./Scene3D";
import { COL, SANS, SERIF } from "./screens";

const ACTIVE = "#FFE600";
const OUTLINE = "#0b0710";

const stroke = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${OUTLINE}`,
  paintOrder: "stroke fill",
  textShadow: `0 ${px * 0.9}px 0 ${OUTLINE}, 0 ${px * 2.2}px ${px * 3}px rgba(0,0,0,.55)`,
});

/* ---------- captions ---------- */

type Chunk = { words: Word[]; start: number; end: number };
const chunkWords = (words: Word[]): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const push = () => {
    if (cur.length) out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  words.forEach((w, i) => {
    if (cur.length && cur[0].line !== w.line) push();
    cur.push(w);
    const chars = cur.map((x) => x.word).join(" ").length;
    const next = words[i + 1];
    if (/[.,?!]$/.test(w.word) || cur.length >= 3 || chars > 15 || (next && next.start - w.end > 0.2)) push();
  });
  push();
  return out;
};

const Captions: React.FC<{ t: number; tl: Timeline; W: number; H: number; hide: (t: number) => boolean }> = ({ t, tl, W, H, hide }) => {
  const chunks = useMemo(() => chunkWords(tl.words.filter((w) => w.line !== "hook" && w.line !== "brand" && w.line !== "cta")), [tl]);
  if (hide(t)) return null;
  const idx = chunks.findIndex((c, i) => t >= c.start - 0.04 && t < (chunks[i + 1] ? Math.min(chunks[i + 1].start - 0.04, c.end + 0.6) : c.end + 0.5));
  if (idx < 0) return null;
  const c = chunks[idx];
  const wide = W > H;
  const size = wide ? 64 : 82;
  const appear = backOut(prog(t, c.start - 0.04, 0.16), 2.2);
  return (
    <div
      style={{
        position: "absolute",
        left: wide ? W * 0.1 : W * 0.08,
        width: wide ? W * 0.8 : W * 0.77,
        top: wide ? H * 0.74 : H * 0.7,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.08,
        textTransform: "uppercase",
        letterSpacing: "-0.01em",
        transform: `scale(${0.82 + 0.18 * appear})`,
        opacity: clamp(appear * 2),
      }}
    >
      {c.words.map((w, i) => {
        const on = t >= w.start - 0.02;
        const active = on && (i === c.words.length - 1 || t < c.words[i + 1].start - 0.02);
        const pop = active ? backOut(prog(t, w.start - 0.02, 0.14), 2.6) : 1;
        return [
          <span
            key={i}
            style={{
              display: "inline-block",
              color: active ? ACTIVE : "#ffffff",
              transform: `scale(${active ? 1 + 0.12 * pop : 1}) translateY(${active ? -4 * pop : 0}px)`,
              ...stroke(size * 0.085),
            }}
          >
            {w.word.replace(/[,]$/, "")}
          </span>,
          i < c.words.length - 1 ? <span key={`s${i}`} style={{ display: "inline-block", width: "0.42em" }} /> : null,
        ];
      })}
    </div>
  );
};

/* ---------- hook headline ---------- */

const Hook: React.FC<{ t: number; tl: Timeline; W: number; H: number; until: number }> = ({ t, tl, W, H, until }) => {
  if (t > until + 0.2) return null;
  const out = easeIn(prog(t, until - 0.08, 0.22));
  const wide = W > H;
  const lines = tl.hookScreen;
  const size = wide ? 96 : 112;
  return (
    <div
      style={{
        position: "absolute",
        left: wide ? W * 0.06 : W * 0.06,
        width: wide ? W * 0.5 : W * 0.79,
        top: wide ? H * 0.2 : H * 0.135,
        fontFamily: SANS,
        fontWeight: 900,
        textTransform: "uppercase",
        textAlign: wide ? "left" : "center",
        lineHeight: 0.98,
        letterSpacing: "-0.02em",
        transform: `scale(${1 + out * 0.25})`,
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 10}px)` : undefined,
      }}
    >
      {lines.map((ln, i) => {
        const t0 = i * 0.2 - 0.12; // first line is already on screen at frame 0
        const k = backOut(prog(t, t0, 0.22), 2.4);
        const key = i === 1;
        return (
          <div
            key={i}
            style={{
              fontSize: key ? size * 1.28 : size * (ln.length > 14 ? 0.78 : 0.92),
              color: key ? ACTIVE : "#fff",
              transform: `scale(${k}) rotate(${key ? -2.5 : 0}deg)`,
              opacity: clamp(k * 3),
              margin: key ? "8px 0" : 0,
              ...stroke(size * 0.08),
            }}
          >
            {ln}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- feature chip ---------- */

const Chip: React.FC<{ t: number; a: number; b: number; label: string; W: number; H: number }> = ({ t, a, b, label, W, H }) => {
  if (t < a || t > b) return null;
  const k = backOut(prog(t, a + 0.05, 0.35), 2);
  const o = 1 - easeIn(prog(t, b - 0.18, 0.18));
  const wide = W > H;
  return (
    <div style={{ position: "absolute", top: wide ? H * 0.08 : H * 0.105, left: 0, width: wide ? W : W * 0.85, display: "flex", justifyContent: "center", opacity: Math.min(1, k) * o }}>
      <div
        style={{
          transform: `translateY(${(1 - k) * -30}px) scale(${0.9 + 0.1 * k})`,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 30px 16px 22px",
          borderRadius: 999,
          background: "rgba(255,253,249,.94)",
          boxShadow: "0 10px 30px rgba(0,0,0,.35)",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: wide ? 34 : 38,
          color: COL.navy,
          letterSpacing: "0.01em",
        }}
      >
        <span style={{ width: 18, height: 18, borderRadius: 9, background: COL.orange, boxShadow: `0 0 0 6px rgba(212,64,0,.18)` }} />
        {label}
      </div>
    </div>
  );
};

/* ---------- end card ---------- */

const EndCard: React.FC<{ t: number; a: number; cta: number; W: number; H: number }> = ({ t, a, cta, W, H }) => {
  if (t < a) return null;
  const wide = W > H;
  const k1 = backOut(prog(t, a + 0.15, 0.4), 1.8);
  const k2 = backOut(prog(t, a + 0.55, 0.4), 1.8);
  const k3 = backOut(prog(t, cta - 0.05, 0.4), 2.2);
  const pulse = t > cta + 0.5 ? 1 + Math.sin((t - cta) * 7) * 0.025 : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily: SERIF, color: "#fff" }}>
      <div style={{ position: "absolute", top: wide ? H * 0.12 : H * 0.12, width: wide ? W : W * 0.85, left: 0, textAlign: "center" }}>
        <div style={{ fontSize: wide ? 150 : 190, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, transform: `scale(${k1})`, opacity: clamp(k1 * 2), textShadow: "0 8px 30px rgba(120,30,0,.45)" }}>
          Ledger
        </div>
        <div style={{ fontSize: wide ? 56 : 66, fontStyle: "italic", fontWeight: 500, marginTop: 10, transform: `translateY(${(1 - k2) * 30}px)`, opacity: clamp(k2), color: "#fff3e8" }}>
          Study together. Pass together.
        </div>
      </div>
      <div style={{ position: "absolute", top: wide ? H * 0.72 : H * 0.69, width: wide ? W : W * 0.85, left: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div
          style={{
            transform: `scale(${k3 * pulse})`,
            opacity: clamp(k3 * 2),
            background: "#fff",
            color: COL.orange,
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: wide ? 50 : 58,
            padding: wide ? "22px 50px" : "26px 54px",
            borderRadius: 999,
            boxShadow: "0 16px 40px rgba(90,20,0,.45)",
            letterSpacing: "-0.01em",
          }}
        >
          Start free → ledgercpa.app
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: wide ? 30 : 34, color: "#ffe6d6", opacity: clamp((t - cta - 0.3) * 3) }}>
          Free forever · no card needed
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- grain ---------- */

const grainURL = (() => {
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.floor(rand(i * 0.731) * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 22;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
})();

/* ---------- all overlays ---------- */

export const Overlay: React.FC<{ t: number; tl: Timeline; W: number; H: number }> = ({ t, tl, W, H }) => {
  const B = beats(tl);
  const cuts = [0.55, B.meet, B.timer, B.post, B.live, B.room, B.same, B.streak, B.pass, B.end];
  let flash = 0;
  for (const c of cuts) {
    const k = (t - c) / 0.16;
    if (k >= 0 && k < 1) flash = Math.max(flash, (1 - k) * (c === B.end ? 0.75 : c === 0.55 ? 0.45 : 0.28));
  }
  const chips: [number, number, string][] = [
    [B.timer, B.post, "Session timer"],
    [B.post, B.live, "Post to your study feed"],
    [B.live, B.room, "Friends studying live"],
    [B.room, B.same, "Live study rooms"],
    [B.same, B.streak, "One shared focus clock"],
    [B.streak, B.pass, "Streaks · Badges · Goals"],
    [B.pass, B.end, "Show up daily. Pass."],
  ];
  const gx = Math.floor(rand(Math.floor(t * 30)) * 256), gy = Math.floor(rand(Math.floor(t * 30) + 7) * 256);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {chips.map(([a, b, l]) => (
        <Chip key={l} t={t} a={a} b={b} label={l} W={W} H={H} />
      ))}
      <Hook t={t} tl={tl} W={W} H={H} until={B.meet} />
      <Captions t={t} tl={tl} W={W} H={H} hide={(x) => x < B.meet - 0.05 || x >= B.end - 0.05} />
      <EndCard t={t} a={B.end} cta={B.cta} W={W} H={H} />
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      {/* grain */}
      <AbsoluteFill style={{ backgroundImage: `url(${grainURL})`, backgroundPosition: `${gx}px ${gy}px`, mixBlendMode: "overlay", opacity: 0.6 }} />
      {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash * expoOut(1) }} />}
      {/* subtle letterbox progress for retention: thin bar at very top */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 6, width: `${clamp(t / tl.duration) * 100}%`, background: ACTIVE, opacity: 0.9 * easeOut(clamp(t * 4)) }} />
    </AbsoluteFill>
  );
};
