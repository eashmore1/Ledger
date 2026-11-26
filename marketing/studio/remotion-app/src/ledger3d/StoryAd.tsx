// Ledger story ad: failed exam on a rainy night -> Ledger shows up -> study together -> pass.
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, easeIn, easeInOut, expoOut, prog, rand } from "./anim";
import { Variant } from "./data";
import { useFonts } from "./LedgerAd";
import { Captions, Chip, EndCard, grainURL, Hook } from "./Overlay";
import { storyTimeline } from "./storyData";
import { storyBeats, StoryScene3D } from "./StoryScene3D";

export type StoryAdProps = { variant: Variant; withAudio?: boolean };

export const StoryAd: React.FC<StoryAdProps> = ({ variant, withAudio = true }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const t = frame / fps;
  const tl = useMemo(() => storyTimeline(variant), [variant]);
  const B = storyBeats(tl);
  const fonts = useFonts();
  const endK = easeInOut(prog(t, B.end - 0.05, 0.35));
  const cuts = [B.alone, B.pop, B.talk, B.hit, B.room, B.streak, B.cando, B.passWord, B.end];
  let flash = 0;
  for (const c of cuts) {
    const k = (t - c) / 0.16;
    if (k >= 0 && k < 1) flash = Math.max(flash, (1 - k) * (c === B.end || c === B.pop ? 0.7 : 0.25));
  }
  const gx = Math.floor(rand(frame) * 256), gy = Math.floor(rand(frame + 7) * 256);
  return (
    <AbsoluteFill style={{ background: "#0a0705" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 42%, #2a2440 0%, #120f1e 60%, #050409 100%)" }} />
      <AbsoluteFill style={{ opacity: endK, background: "radial-gradient(ellipse 90% 70% at 50% 45%, #ff7a3d 0%, #e2551c 45%, #a83000 100%)" }} />
      {fonts && (
        <ThreeCanvas width={W} height={H} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: 30, position: [0, 0, 10], near: 0.1, far: 100 }}>
          <StoryScene3D t={t} tl={tl} aspect={W / H} />
        </ThreeCanvas>
      )}
      {fonts && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <Chip t={t} a={B.hit} b={B.room} label="Friends see you studying live" W={W} H={H} />
          <Chip t={t} a={B.room} b={B.streak} label="Live study rooms" W={W} H={H} />
          <Chip t={t} a={B.streak} b={B.passed} label="Streaks that keep you going" W={W} H={H} />
          <Hook t={t} tl={tl} W={W} H={H} until={B.alone} />
          <Captions t={t} tl={tl} W={W} H={H} hide={(x) => x < B.alone - 0.05 || x >= B.end - 0.05}
            tint={(w) => (tl.L[w.line]?.who === "L" ? "#ffc9a8" : "#ffffff")} />
          <EndCard t={t} a={B.end} cta={B.cta} W={W} H={H} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
          <AbsoluteFill style={{ backgroundImage: `url(${grainURL})`, backgroundPosition: `${gx}px ${gy}px`, mixBlendMode: "overlay", opacity: 0.6 }} />
          {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash * expoOut(1) }} />}
          <div style={{ position: "absolute", left: 0, top: 0, height: 6, width: `${clamp(t / tl.duration) * 100}%`, background: "#FFE600", opacity: 0.9 * (1 - easeIn(0)) }} />
        </AbsoluteFill>
      )}
      {withAudio && <Html5Audio src={staticFile(`ledger-3d-story/mix-${variant}.wav`)} />}
    </AbsoluteFill>
  );
};

export const storyDuration = (variant: Variant, fps: number) => Math.ceil(storyTimeline(variant).duration * fps);
