// Ledger x "huss huss huss / while they're out partying" (original parody).
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { backOut, clamp, easeIn, easeInOut, expoOut, prog, rand } from "./anim";
import { Variant } from "./data";
import { HussScene3D, HussTiming } from "./HussScene3D";
import { useFonts } from "./LedgerAd";
import { EndCard, grainURL } from "./Overlay";
import { SANS } from "./screens";
import TA from "../../public/ledger-huss/timing-A.json";
import TB from "../../public/ledger-huss/timing-B.json";
import TC from "../../public/ledger-huss/timing-C.json";
import MO from "../../public/ledger-huss/mouth.json";

export type HussAdProps = { variant: Variant; withAudio?: boolean };
const TIMING = { A: TA, B: TB, C: TC } as unknown as Record<Variant, HussTiming>;
export const hussTiming = (v: Variant): HussTiming => ({ ...TIMING[v], mouth: MO as HussTiming["mouth"] });
export const hussDuration = (v: Variant, fps: number) => Math.ceil(hussTiming(v).duration * fps);

const OUT = "#0b0710";
const stroke = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${OUT}`, paintOrder: "stroke fill",
  textShadow: `0 ${px * 0.9}px 0 ${OUT}, 0 ${px * 2.2}px ${px * 3}px rgba(0,0,0,.55)`,
});
const CAPS: Record<string, string> = {
  town: "In this town, everybody goes out partying.",
  exceptme: "Everybody. Except me.",
  while: "While they're out partying, I'm locked in on FAR.",
  streak: "47 days straight.",
  pass: "While they party, you pass.",
};

export const HussAd: React.FC<HussAdProps> = ({ variant, withAudio = true }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const t = frame / fps;
  const T = hussTiming(variant);
  const fonts = useFonts();
  const L = T.lines;
  const endK = easeInOut(prog(t, T.end - 0.05, 0.35));
  let hi = -1;
  for (let i = 0; i < T.huss.length; i++) if (t >= T.huss[i] - 0.02) hi = i;
  const hussOn = hi >= 0 && t < T.huss[hi] + 0.45 && t < T.end;
  const hk = hussOn ? backOut(prog(t, T.huss[hi] - 0.02, 0.12), 3) : 0;
  const cap = Object.entries(L).find(([id, [a, b]]) => CAPS[id] && t >= a - 0.08 && t < b + 0.3 && t < T.end - 0.05);
  const flash = Math.max(0, 1 - Math.abs(t - L.exceptme[0]) * 8) * 0.35 + (t >= T.end ? Math.max(0, 1 - (t - T.end) * 6) * 0.6 : 0);
  const hookOut = easeIn(prog(t, L.exceptme[0] - 0.15, 0.2));
  const gx = Math.floor(rand(frame) * 256), gy = Math.floor(rand(frame + 7) * 256);
  return (
    <AbsoluteFill style={{ background: "#0a0705" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 42%, #2a2440 0%, #120f1e 60%, #050409 100%)" }} />
      <AbsoluteFill style={{ opacity: endK, background: "radial-gradient(ellipse 90% 70% at 50% 45%, #ff7a3d 0%, #e2551c 45%, #a83000 100%)" }} />
      {fonts && (
        <ThreeCanvas width={W} height={H} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: 30, position: [0, 0, 10], near: 0.05, far: 100 }}>
          <HussScene3D t={t} T={T} aspect={W / H} />
        </ThreeCanvas>
      )}
      {fonts && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {/* hook text: the meme's setup */}
          {t < L.exceptme[0] + 0.05 && (
            <div style={{ position: "absolute", top: H * 0.1, left: W * 0.06, width: W * 0.79, textAlign: "center", fontFamily: SANS, fontWeight: 900,
              fontSize: 74, lineHeight: 1.05, color: "#fff", transform: `scale(${backOut(prog(t, -0.1, 0.3), 2) * (1 + hookOut * 0.2)})`, opacity: 1 - hookOut, ...stroke(6) }}>
              {T.hook}
            </div>
          )}
          {/* narration captions */}
          {cap && (
            <div style={{ position: "absolute", top: H * 0.69, left: W * 0.08, width: W * 0.77, textAlign: "center", fontFamily: SANS, fontWeight: 900,
              fontSize: 72, lineHeight: 1.08, textTransform: "uppercase", color: "#fff", transform: `scale(${backOut(prog(t, cap[1][0] - 0.08, 0.16), 2.2)})`, ...stroke(6) }}>
              {CAPS[cap[0]]}
            </div>
          )}
          {/* HUSS! */}
          {hussOn && (
            <div style={{ position: "absolute", top: H * 0.11, left: 0, width: W * 0.85, textAlign: "center", fontFamily: SANS, fontWeight: 900,
              fontSize: 170, color: hi % 2 ? "#FFE600" : "#ffffff", transform: `rotate(${(rand(hi * 3.1) - 0.5) * 14}deg) scale(${0.6 + 0.5 * hk})`,
              opacity: clamp(1 - (t - T.huss[hi] - 0.3) * 6), ...stroke(11) }}>
              HUSS
            </div>
          )}
          <EndCard t={t} a={T.end} cta={L.cta[0]} W={W} H={H} tagline="While they party, you pass." />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
          <AbsoluteFill style={{ backgroundImage: `url(${grainURL})`, backgroundPosition: `${gx}px ${gy}px`, mixBlendMode: "overlay", opacity: 0.6 }} />
          {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: Math.min(1, flash) * expoOut(1) }} />}
        </AbsoluteFill>
      )}
      {withAudio && <Html5Audio src={staticFile(`ledger-huss/mix-${variant}.wav`)} />}
    </AbsoluteFill>
  );
};
