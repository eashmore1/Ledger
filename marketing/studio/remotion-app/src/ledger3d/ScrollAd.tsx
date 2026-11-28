// "One more video" ad: caught scrolling at 11:47 PM -> Sarah is studying -> hit start.
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { easeInOut, prog, rand } from "./anim";
import { Variant } from "./data";
import { useFonts } from "./LedgerAd";
import { Captions, EndCard, grainURL, Hook } from "./Overlay";
import { scrollTimeline } from "./scrollData";
import { scrollBeats, ScrollScene3D } from "./ScrollScene3D";

export type ScrollAdProps = { variant: Variant; withAudio?: boolean };

export const ScrollAd: React.FC<ScrollAdProps> = ({ variant, withAudio = true }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const t = frame / fps;
  const tl = useMemo(() => scrollTimeline(), [variant]);
  const B = scrollBeats(tl);
  const fonts = useFonts();
  const endK = easeInOut(prog(t, B.end - 0.05, 0.35));
  const gx = Math.floor(rand(frame) * 256), gy = Math.floor(rand(frame + 7) * 256);
  return (
    <AbsoluteFill style={{ background: "#0a0705" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 42%, #2a2440 0%, #120f1e 60%, #050409 100%)" }} />
      <AbsoluteFill style={{ opacity: endK, background: "radial-gradient(ellipse 90% 70% at 50% 45%, #ff7a3d 0%, #e2551c 45%, #a83000 100%)" }} />
      {fonts && (
        <ThreeCanvas width={W} height={H} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: 30, position: [0, 0, 10], near: 0.1, far: 100 }}>
          <ScrollScene3D t={t} tl={tl} aspect={W / H} />
        </ThreeCanvas>
      )}
      {fonts && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <Hook t={t} tl={tl} W={W} H={H} until={B.notif} />
          <Captions t={t} tl={tl} W={W} H={H} hide={(x) => x < B.ping - 0.05 || x >= B.end - 0.05}
            tint={(w) => (tl.L[w.line]?.who === "L" ? "#ffc9a8" : "#ffffff")} />
          <EndCard t={t} a={B.end} cta={B.cta} W={W} H={H} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
          <AbsoluteFill style={{ backgroundImage: `url(${grainURL})`, backgroundPosition: `${gx}px ${gy}px`, mixBlendMode: "overlay", opacity: 0.45 }} />
          {/* light film grade: lifted blacks, warm highlights, a touch of fade */}
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,110,.05), rgba(40,60,120,.06))", mixBlendMode: "soft-light" }} />
          <AbsoluteFill style={{ background: "rgba(24,16,40,.06)" }} />
        </AbsoluteFill>
      )}
      {withAudio && <Html5Audio src={staticFile(`ledger-scroll/mix-A.wav`)} />}
    </AbsoluteFill>
  );
};

export const scrollDuration = (variant: Variant, fps: number) => Math.ceil(scrollTimeline().duration * fps);
