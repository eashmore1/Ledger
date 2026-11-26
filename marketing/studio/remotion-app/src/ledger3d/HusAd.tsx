// Ledger x "hus hus hus": Ledger sprints the desk to save your streak at 11:58 PM.
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { backOut, clamp, easeIn, easeInOut, expoOut, prog, rand } from "./anim";
import { Variant } from "./data";
import { HusScene3D, HusTiming } from "./HusScene3D";
import { useFonts } from "./LedgerAd";
import { EndCard, grainURL } from "./Overlay";
import { SANS } from "./screens";
import TA from "../../public/ledger-hus/timing-A.json";
import TB from "../../public/ledger-hus/timing-B.json";
import TC from "../../public/ledger-hus/timing-C.json";
import MA from "../../public/ledger-hus/mouth.json";

export type HusAdProps = { variant: Variant; withAudio?: boolean };
const TIMING = { A: TA, B: TB, C: TC } as unknown as Record<Variant, HusTiming>;
export const husTiming = (v: Variant): HusTiming => ({ ...TIMING[v], mouth: MA as HusTiming["mouth"] });
export const husDuration = (v: Variant, fps: number) => Math.ceil(husTiming(v).duration * fps);

const OUT = "#0b0710";
const stroke = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${OUT}`, paintOrder: "stroke fill",
  textShadow: `0 ${px * 0.9}px 0 ${OUT}, 0 ${px * 2.2}px ${px * 3}px rgba(0,0,0,.55)`,
});

const husTimes = (T: HusTiming) => {
  if (T.hus.length) return T.hus;
  const beat = 60 / T.bpm, out: number[] = [];
  for (let x = T.runStart; x < T.runEnd - 0.1; x += beat) out.push(x);
  return out;
};

export const HusAd: React.FC<HusAdProps> = ({ variant, withAudio = true }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const t = frame / fps;
  const T = husTiming(variant);
  const fonts = useFonts();
  const hus = husTimes(T);
  const running = t >= T.runStart && t < T.runEnd;
  const endK = easeInOut(prog(t, T.end - 0.05, 0.35));
  // current HUS word (latest chant that started)
  let hi = -1;
  for (let i = 0; i < hus.length; i++) if (t >= hus[i] - 0.02) hi = i;
  const husOn = hi >= 0 && t < hus[hi] + 0.42 && t < T.runEnd + 0.2;
  const hk = husOn ? backOut(prog(t, hus[hi] - 0.02, 0.12), 3) : 0;
  const flash = Math.max(0, 1 - Math.abs(t - T.wake) * 10) * 0.6 + Math.max(0, 1 - (t - T.slap) * 6) * (t >= T.slap ? 0.7 : 0) + Math.max(0, 1 - (t - T.end) * 6) * (t >= T.end ? 0.6 : 0);
  const capLine = Object.entries(T.lines).find(([id, [a, b]]) => id !== "cta" && t >= a - 0.05 && t < b + 0.35);
  const capText: Record<string, string> = { saved: "Streak. Saved.", noskip: "We don't skip days." };
  const gx = Math.floor(rand(frame) * 256), gy = Math.floor(rand(frame + 7) * 256);
  const hookOut = easeIn(prog(t, T.wake - 0.12, 0.2));
  return (
    <AbsoluteFill style={{ background: "#0a0705" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 42%, #2a2440 0%, #120f1e 60%, #050409 100%)" }} />
      <AbsoluteFill style={{ opacity: endK, background: "radial-gradient(ellipse 90% 70% at 50% 45%, #ff7a3d 0%, #e2551c 45%, #a83000 100%)" }} />
      {fonts && (
        <ThreeCanvas width={W} height={H} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: 44, position: [0, 1, 2], near: 0.02, far: 60 }}>
          <HusScene3D t={t} T={T} aspect={W / H} />
        </ThreeCanvas>
      )}
      {fonts && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {/* speed lines while sprinting */}
          {running && (
            <AbsoluteFill style={{ opacity: 0.55 * Math.min(1, (t - T.runStart) * 3),
              background: `repeating-conic-gradient(from ${(frame * 17) % 360}deg at 50% 55%, rgba(255,255,255,.0) 0deg 4deg, rgba(255,255,255,.22) 4.4deg 4.8deg, rgba(255,255,255,0) 5.2deg 11deg)`,
              WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 55%, transparent 55%, black 100%)", maskImage: "radial-gradient(ellipse 60% 55% at 50% 55%, transparent 55%, black 100%)" }} />
          )}
          {/* hook */}
          {t < T.wake + 0.1 && (
            <div style={{ position: "absolute", top: H * 0.12, left: W * 0.06, width: W * 0.79, textAlign: "center", fontFamily: SANS, fontWeight: 900,
              fontSize: W > H ? 64 : 76, lineHeight: 1.05, color: "#fff", transform: `scale(${backOut(prog(t, -0.1, 0.3), 2) * (1 + hookOut * 0.2)})`, opacity: 1 - hookOut, ...stroke(6) }}>
              {T.hook}
            </div>
          )}
          {/* 11:58 PM stamp */}
          {t > T.wake && t < T.runEnd && (
            <div style={{ position: "absolute", top: H * 0.085, left: 0, width: W * 0.85, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 34,
              color: "#ffd2c2", letterSpacing: "0.12em", opacity: t > T.wake ? 0.9 : 0, ...stroke(3) }}>
              11:58 PM · STREAK ENDS AT MIDNIGHT
            </div>
          )}
          {/* HUS! */}
          {husOn && (
            <div style={{ position: "absolute", top: H * 0.14, left: 0, width: W * 0.85, textAlign: "center", fontFamily: SANS, fontWeight: 900,
              fontSize: W > H ? 120 : 150, color: hi % 2 ? "#FFE600" : "#ffffff", letterSpacing: "0.02em",
              transform: `rotate(${(rand(hi * 3.1) - 0.5) * 14}deg) scale(${0.6 + 0.5 * hk})`, opacity: clamp(1 - (t - hus[hi] - 0.3) * 6), ...stroke(10) }}>
              HUS!
            </div>
          )}
          {/* spoken lines */}
          {capLine && t < T.end - 0.05 && (
            <div style={{ position: "absolute", top: H * 0.7, left: W * 0.08, width: W * 0.77, textAlign: "center", fontFamily: SANS, fontWeight: 900,
              fontSize: 84, textTransform: "uppercase", color: "#FFE600", transform: `scale(${backOut(prog(t, capLine[1][0] - 0.05, 0.16), 2.2)})`, ...stroke(7) }}>
              {capText[capLine[0]]}
            </div>
          )}
          {t >= T.huh[0] && t < T.huh[1] + 0.4 && (
            <div style={{ position: "absolute", top: H * 0.22, left: W * 0.42, fontFamily: SANS, fontWeight: 900, fontSize: 96, color: "#fff",
              transform: `rotate(8deg) scale(${backOut(prog(t, T.huh[0], 0.15), 2.5)})`, ...stroke(7) }}>
              HUH?!
            </div>
          )}
          <EndCard t={t} a={T.end} cta={T.lines.cta[0]} W={W} H={H} tagline="Don't break the streak." />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
          <AbsoluteFill style={{ backgroundImage: `url(${grainURL})`, backgroundPosition: `${gx}px ${gy}px`, mixBlendMode: "overlay", opacity: 0.6 }} />
          {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: Math.min(1, flash) * expoOut(1) }} />}
        </AbsoluteFill>
      )}
      {withAudio && <Html5Audio src={staticFile(`ledger-hus/mix-${variant}.wav`)} />}
    </AbsoluteFill>
  );
};
