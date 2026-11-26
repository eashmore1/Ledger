// The Ledger 3D ad: background gradients, the Three.js world, 2D overlays and the mixed audio.
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useDelayRender, useVideoConfig } from "remotion";
import { easeInOut, prog } from "./anim";
import { timeline, Variant } from "./data";
import { Overlay } from "./Overlay";
import { beats, Scene3D } from "./Scene3D";
import { SANS, SERIF } from "./screens";

export type LedgerAdProps = { variant: Variant; withAudio?: boolean };

export const useFonts = () => {
  const { delayRender, continueRender } = useDelayRender();
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const faces = [
      new FontFace(SANS, `url(${staticFile("fonts/libre-franklin-latin-wght-normal.woff2")})`, { weight: "100 900" }),
      new FontFace(SERIF, `url(${staticFile("fonts/fraunces-latin-opsz-normal.woff2")})`, { weight: "100 900" }),
      new FontFace(SERIF, `url(${staticFile("fonts/fraunces-latin-opsz-italic.woff2")})`, { weight: "100 900", style: "italic" }),
    ];
    Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      setReady(true);
      continueRender(handle);
    });
  }, [continueRender, handle]);
  return ready;
};

export const LedgerAd: React.FC<LedgerAdProps> = ({ variant, withAudio = true }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const tl = useMemo(() => timeline(variant), [variant]);
  const B = beats(tl);
  const fonts = useFonts();
  const hookK = 1 - easeInOut(prog(t, B.meet - 0.1, 0.3));
  const endK = easeInOut(prog(t, B.end - 0.05, 0.35));
  return (
    <AbsoluteFill style={{ background: "#0a0705" }}>
      {/* warm studio backdrop, cool blue for the lonely hook, brand orange for the end */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 42%, #3a2216 0%, #1a100b 55%, #070504 100%)" }} />
      <AbsoluteFill style={{ opacity: hookK, background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1d2440 0%, #0c0f1c 55%, #040509 100%)" }} />
      <AbsoluteFill style={{ opacity: endK, background: "radial-gradient(ellipse 90% 70% at 50% 45%, #ff7a3d 0%, #e2551c 45%, #a83000 100%)" }} />
      {fonts && (
        <ThreeCanvas width={width} height={height} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: 30, position: [0, 0, 10], near: 0.1, far: 100 }}>
          <Scene3D t={t} tl={tl} aspect={width / height} />
        </ThreeCanvas>
      )}
      {fonts && <Overlay t={t} tl={tl} W={width} H={height} />}
      {withAudio && <Html5Audio src={staticFile(`ledger-3d/mix-${variant}.wav`)} />}
    </AbsoluteFill>
  );
};

export const adDuration = (variant: Variant, fps: number) => Math.ceil(timeline(variant).duration * fps);
