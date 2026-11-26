// Ledger x "huss huss huss / while they're out partying": the party is across the
// street, the student is locked in on FAR, panting "Huss" on every practice-question
// rep while Ledger spots him like a gym coach. Original parody lines.
import { backOut, easeOut, expoOut, Key, lerp, noise, prog, shake, track, V3 } from "./anim";
import { Mascot } from "./Mascot";
import { CameraRig, Card, Confetti, FacePlane, Flame, Glow, Particles, useCanvasTex } from "./Scene3D";
import { partyFace, repCard, streakCard } from "./screens";
import { Room } from "./StoryScene3D";
import { Student } from "./Student";

export type HussTiming = {
  lines: Record<string, [number, number]>;
  huss: number[]; // each "Huss" onset
  end: number;
  duration: number;
  hook: string;
  mouth?: { fps: number; [who: string]: number[] | number };
};

const mouthAt = (T: HussTiming, who: string, t: number) => {
  const m = T.mouth, arr = m?.[who];
  if (!m || !Array.isArray(arr)) return 0;
  const x = t * m.fps, i = Math.floor(x), k = x - i;
  return (arr[i] ?? 0) + ((arr[i + 1] ?? 0) - (arr[i] ?? 0)) * k;
};

const PartyWindow: React.FC<{ t: number }> = ({ t }) => {
  const tex = useCanvasTex(300, 380, (c, w, h) => partyFace(c, w, h, t), `p${Math.floor(t * 15)}`);
  return (
    <mesh position={[-0.75, 1.25, -2.165]}>
      <planeGeometry args={[1.2, 1.52]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
};

export const HussScene3D: React.FC<{ t: number; T: HussTiming; aspect: number }> = ({ t, T, aspect }) => {
  const wide = aspect > 1;
  const L = T.lines;
  const inRoom = t < T.end;
  // reps: each Huss is one practice question answered
  const repsDone = T.huss.filter((h) => t >= h + 0.08).length;
  const lastHuss = T.huss.filter((h) => t >= h).pop() ?? -9;
  const dip = Math.exp(-Math.max(0, t - lastHuss) * 7) * (t >= lastHuss ? 1 : 0);
  const partyCol = ["#ff2bd6", "#22e3ff", "#ffe600", "#7c5cff", "#ff6a1f"][Math.floor(t * 4.67) % 5];

  /* ---- camera ---- */
  const WIN: V3 = [-0.75, 1.25, -2.16];
  const FACE: V3 = [0, 0.62, -0.6];
  const pos: Key[] = [
    { t: 0, v: [-0.6, 1.2, 0.9] },
    { t: L.exceptme[0] - 0.08, v: [-0.68, 1.22, 0.1] },
    { t: L.exceptme[0] + 0.25, v: [0.05, 0.62, 3.5], ease: expoOut },
    { t: L.while[0], v: [0.05, 0.62, 3.3] },
    { t: L.huss1[0] - 0.05, v: [0.05, 0.62, 2.95] },
    { t: L.huss1[0] + 0.25, v: [0.42, 0.42, 4.7], ease: expoOut },
    { t: L.streak[0] - 0.05, v: [0.42, 0.42, 4.4] },
    { t: L.streak[0] + 0.3, v: [0, 0.75, 4.3], ease: expoOut },
    { t: L.huss2[0] - 0.05, v: [0, 0.72, 4.0] },
    { t: L.huss2[0] + 0.2, v: [0.32, 0.45, 3.9], ease: expoOut },
    { t: L.pass[0] - 0.05, v: [0.32, 0.45, 3.7] },
    { t: L.pass[0] + 0.3, v: [1.3, 0.2, 3.7], ease: expoOut },
    { t: T.end - 0.05, v: [1.25, 0.2, 3.45] },
    { t: T.end + 0.45, v: [0, 0.2, 9.2], ease: expoOut },
    { t: T.duration, v: [0, 0.1, 8.4] },
  ];
  const look: Key[] = [
    { t: 0, v: WIN },
    { t: L.exceptme[0] - 0.08, v: WIN },
    { t: L.exceptme[0] + 0.25, v: FACE, ease: expoOut },
    { t: L.huss1[0] - 0.05, v: FACE },
    { t: L.huss1[0] + 0.25, v: [0.36, 0.08, -0.1], ease: expoOut },
    { t: L.streak[0] - 0.05, v: [0.36, 0.08, -0.1] },
    { t: L.streak[0] + 0.3, v: [0, 0.75, -0.6], ease: expoOut },
    { t: L.huss2[0] - 0.05, v: [0, 0.75, -0.6] },
    { t: L.huss2[0] + 0.2, v: [0.3, 0.12, -0.1], ease: expoOut },
    { t: L.pass[0] - 0.05, v: [0.3, 0.12, -0.1] },
    { t: L.pass[0] + 0.3, v: [0.85, -0.12, 0.45], ease: expoOut },
    { t: T.end, v: [0.85, -0.12, 0.45] },
    { t: T.end + 0.45, v: [0, -0.6, 0], ease: expoOut },
  ];
  const [sx, sy] = shake(t, T.huss, 0.035, 0.25);
  const cp = track(pos, t);
  const camPos: V3 = [cp[0] + sx, cp[1] + sy, cp[2] * (wide ? 1.2 : 1)];

  /* ---- student: deadpan, then locked in ---- */
  const lockedIn = t >= (L.while[0] + (L.while[1] - L.while[0]) * 0.55);
  const blinkPh = (t * 0.8 + 0.3) % 3.6;
  const student = {
    slump: 0.12 + dip * 0.35 + (lockedIn ? 0.12 : 0),
    tired: 0.1,
    sad: lockedIn ? -0.7 : -0.15, // negative = brows down: determined
    smile: 0,
    talk: mouthAt(T, "S", t),
    blink: blinkPh > 3.45 ? Math.sin(((blinkPh - 3.45) / 0.15) * Math.PI) : 0,
    look: (lockedIn && !(t >= L.streak[0] && t < L.streak[1]) ? [0.1, -0.7] : [0, 0]) as [number, number],
    cheer: 0,
  };

  /* ---- Ledger, the spotter ---- */
  const coach = (t >= L.huss1[0] && t < L.huss1[1] + 0.3) || (t >= L.huss2[0] && t < L.huss2[1] + 0.3);
  const lBlink = (t * 1.1) % 2.9;
  const ledgerPose = {
    cheer: coach ? 0.55 + 0.45 * Math.abs(Math.sin(t * 9)) : 0,
    wave: t >= L.pass[0] && t < T.end ? easeOut(prog(t, L.pass[0], 0.25)) * 0.6 : 0,
    waveT: t,
    mouth: Math.max(mouthAt(T, "L", t), coach ? 0.5 + 0.5 * Math.abs(Math.sin(t * 9)) : 0),
    happy: coach ? 1 : 0,
    blink: lBlink > 2.75 ? Math.sin(((lBlink - 2.75) / 0.15) * Math.PI) : 0,
    look: (t >= L.pass[0] ? [0.4, 0] : [-0.8, 0.3]) as [number, number],
  };

  /* ---- rep card + streak flame ---- */
  const q = 36 + repsDone;
  const repS = Math.max(
    t >= L.huss1[0] - 0.1 && t < L.streak[0] + 0.1 ? backOut(prog(t, L.huss1[0] - 0.1, 0.3)) * (1 - prog(t, L.streak[0] - 0.1, 0.2)) : 0,
    t >= L.huss2[0] - 0.1 && t < L.pass[0] + 0.1 ? backOut(prog(t, L.huss2[0] - 0.1, 0.3)) * (1 - prog(t, L.pass[0] - 0.1, 0.2)) : 0,
  );
  const checks = Math.min(5, repsDone - (t >= L.huss2[0] - 0.1 ? 2 : 0));
  const flameS = t >= L.streak[0] && t < L.pass[0] + 0.1 ? backOut(prog(t, L.streak[0], 0.45)) * (1 - prog(t, L.pass[0] - 0.1, 0.2)) : 0;
  const nStreak = Math.round(1 + easeOut(prog(t, L.streak[0] + 0.1, 1.0)) * 46);
  const sweat = t > L.huss2[0] ? prog(t, L.huss2[0], 1.2) : -1;

  return (
    <>
      <CameraRig pos={inRoom ? camPos : [cp[0], cp[1], cp[2]]} look={track(look, t)} fov={wide ? 26 : 30} />
      <ambientLight intensity={inRoom ? 0.34 : 0.6} color={inRoom ? "#8a90d0" : "#ffffff"} />
      <directionalLight position={[-3, 3, 2]} intensity={inRoom ? 0.7 : 2.2} color={inRoom ? "#93a8ff" : "#ffc68a"} />
      <directionalLight position={[3, 2, 4]} intensity={inRoom ? 0.6 : 1.6} color="#fff1e0" />
      {inRoom && (
        <>
          <Room t={t} day={0} flash={0} bookGlow={0} bookShake={0} rain={false} />
          <PartyWindow t={t} />
          {/* party light spilling through the window */}
          <pointLight position={[-0.75, 1.2, -1.6]} intensity={2.2} distance={3.5} color={partyCol} />
          <Glow color={`rgba(${parseInt(partyCol.slice(1, 3), 16)},${parseInt(partyCol.slice(3, 5), 16)},${parseInt(partyCol.slice(5, 7), 16)},0.9)`} size={2.6} opacity={0.3} position={[-0.75, 1.25, -1.9]} />
          <Student {...student} position={[0, -0.15 - dip * 0.05, -0.6]} />
          <group position={[0.85, -0.8 + 0.07 + 2 * 0.14 + 0.065, 0.45]} rotation={[0, -0.45, 0]}>
            <Mascot {...ledgerPose} scale={0.42} />
          </group>
          <Card w={1.0} h={0.68} px={480} drawKey={`rep${q}-${checks}`} draw={(c, w, h) => repCard(c, w, h, q, 40, Math.max(0, checks))}
            position={[0.26, -0.3, 1.6]} rotation={[-0.1, 0.05, -0.03]} scale={repS * 0.5} />
          {repS > 0 && t - lastHuss < 0.35 && <Glow color="rgba(52,211,153,0.95)" size={0.6} opacity={(1 - (t - lastHuss) / 0.35) * 0.8} position={[0.26, -0.35, 1.65]} />}
          <Flame t={t} position={[-0.05, 1.6, -0.7]} scale={flameS * 0.36} />
          {flameS > 0 && <FacePlane w={1.4} h={0.7} drawKey={`hs${nStreak}`} draw={(c, w, h) => streakCard(c, w, h, nStreak)} position={[0.28, 1.42, -0.3]} scale={flameS * 0.52} />}
          {sweat >= 0 && sweat < 1 && <Glow color="rgba(170,220,255,0.95)" size={0.07} opacity={1 - sweat} position={[0.33, 0.95 - sweat * 0.35, -0.2]} />}
          <Particles t={t} color="#9fb0ff" count={30} opacity={0.2} />
        </>
      )}
      {!inRoom && (
        <>
          <Mascot wave={easeOut(prog(t, L.cta[0] - 0.3, 0.25))} waveT={t} cheer={t < L.cta[0] - 0.3 ? easeOut(prog(t, T.end + 0.3, 0.25)) * (0.85 + Math.sin(t * 9) * 0.15) : 0}
            mouth={mouthAt(T, "L", t)} happy={t < L.cta[0] - 0.3 ? 1 : 0}
            position={[0, lerp(-5, -2.05, backOut(prog(t, T.end, 0.6), 1.3)), 0.6]} rotation={[0, noise(t * 0.6, 4) * 0.15, 0]} scale={0.92}
            squash={(() => { const l = t - (T.end + 0.38); return l > 0 && l < 0.5 ? Math.sin(l * 22) * Math.exp(-l * 8) * 0.22 : 0; })()} />
          <Confetti t={t} t0={T.end + 0.3} />
          <Glow color="rgba(255,240,210,0.9)" size={6} opacity={0.35} position={[0, -0.4, -1]} />
          <Particles t={t} color="#fff1df" opacity={0.5} />
        </>
      )}
    </>
  );
};
