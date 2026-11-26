// "hus hus hus" meme ad: it's 11:58 PM, the streak is about to die, and Ledger
// sprints the length of the desk (one "hus" per stride) to save it.
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { backOut, easeOut, expoOut, Key, lerp, noise, prog, rand, shake, track, V3 } from "./anim";
import { Mascot } from "./Mascot";
import { CameraRig, Confetti, Glow, Particles, Phone, useCanvasTex } from "./Scene3D";
import { screenStreakSave, spineFace, stickyFace } from "./screens";
import { Student } from "./Student";

export type HusTiming = {
  bpm: number; wake: number; runStart: number; runEnd: number; slap: number;
  huh: [number, number]; lines: Record<string, [number, number]>; hus: number[]; end: number; duration: number; hook: string;
  mouth?: { fps: number; [who: string]: number[] | number };
};

const DESK_Y = 0;
const RUN_FROM = -6.2, RUN_TO = -0.05; // z of Ledger along the desk
const PHONE_Z = 0.95;

const mouthAt = (T: HusTiming, who: string, t: number) => {
  const m = T.mouth, arr = m?.[who];
  if (!m || !Array.isArray(arr)) return 0;
  const x = t * m.fps, i = Math.floor(x), k = x - i;
  return (arr[i] ?? 0) + ((arr[i + 1] ?? 0) - (arr[i] ?? 0)) * k;
};

/** Ledger's z on the desk over time (accelerates, holds top speed, decelerates into the slide). */
export const ledgerZ = (T: HusTiming, t: number) => {
  if (t < T.runStart) return RUN_FROM;
  const k = prog(t, T.runStart, T.runEnd - T.runStart);
  const a = 0.1; // accelerate over the first 10% of the run, then top speed
  const ease = (k < a ? (k * k) / (2 * a) : k - a / 2) / (1 - a / 2);
  const run = lerp(RUN_FROM, RUN_TO, Math.min(1, ease));
  if (t <= T.runEnd) return run;
  // knee slide onto the phone
  return lerp(RUN_TO, PHONE_Z - 0.78, easeOut(prog(t, T.runEnd, T.slap - T.runEnd)));
};

const Sticky: React.FC<{ label: string; color: string; position: V3; rot: number }> = ({ label, color, position, rot }) => {
  const tex = useCanvasTex(200, 200, (c, w, h) => stickyFace(c, w, h, label, color), label);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rot]}>
      <planeGeometry args={[0.26, 0.26]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
};

const Book: React.FC<{ label: string; color: string; position: V3; rot: number; w?: number }> = ({ label, color, position, rot, w = 0.75 }) => {
  const tex = useCanvasTex(400, 80, (c, ww, h) => spineFace(c, ww, h, label, color), `b${label}`);
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <RoundedBox args={[w, 0.13, 0.5]} radius={0.02}>
        <meshPhysicalMaterial color={color} roughness={0.5} clearcoat={0.3} />
      </RoundedBox>
      <mesh position={[0, 0, 0.252]}>
        <planeGeometry args={[w - 0.02, 0.12]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** The long desk run: wood top, props on both sides, lamp pools of light, rain window at the far end. */
const DeskWorld: React.FC<{ t: number; saved: number }> = ({ t, saved }) => (
  <group>
    <mesh position={[0, DESK_Y - 0.05, -2.6]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.6, 9.5]} />
      <meshPhysicalMaterial color="#8a5a3c" roughness={0.5} clearcoat={0.35} />
    </mesh>
    {/* wood grain stripes */}
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[-1.15 + i * 0.29, DESK_Y - 0.049, -2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.008, 9.5]} />
        <meshBasicMaterial color="#6e4630" transparent opacity={0.5} />
      </mesh>
    ))}
    {/* back wall + window with rain far away */}
    <mesh position={[0, 1.5, -7.6]}>
      <planeGeometry args={[12, 6]} />
      <meshStandardMaterial color="#232842" roughness={0.95} />
    </mesh>
    <mesh position={[-0.6, 1.4, -7.55]}>
      <planeGeometry args={[1.6, 1.8]} />
      <meshBasicMaterial color="#1b2340" />
    </mesh>
    <Glow color="rgba(130,150,255,0.9)" size={3} opacity={0.25} position={[-0.6, 1.4, -7.3]} />
    {/* side props along the run */}
    <Book label="FAR" color="#c2410c" position={[0.0, DESK_Y + 0.065, -3.7]} rot={0.08} w={0.8} />
    <Book label="AUD" color="#3f4bb5" position={[0.03, DESK_Y + 0.195, -3.7]} rot={-0.06} w={0.78} />
    <Book label="REG" color="#0f766e" position={[0.9, DESK_Y + 0.065, -5.0]} rot={0.4} />
    <Book label="BAR" color="#7c3aed" position={[0.92, DESK_Y + 0.195, -5.0]} rot={0.3} />
    {/* mug */}
    <group position={[-0.62, DESK_Y, -2.2]}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.32, 24]} />
        <meshPhysicalMaterial color="#f2ece4" roughness={0.3} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.115, 24]} />
        <meshStandardMaterial color="#3b2416" />
      </mesh>
    </group>
    {/* pencils + highlighter */}
    {[[0.55, -1.4, 0.4, "#f5b73a"], [0.7, -1.2, -0.3, "#f5b73a"], [-0.7, -4.4, 0.9, "#22c55e"]].map(([x, z, r, c], i) => (
      <mesh key={i} position={[x as number, DESK_Y + 0.03, z as number]} rotation={[0, r as number, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
        <meshStandardMaterial color={c as string} />
      </mesh>
    ))}
    {/* calculator */}
    <RoundedBox args={[0.45, 0.05, 0.6]} radius={0.02} position={[-0.75, DESK_Y + 0.025, -3.3]} rotation={[0, 0.25, 0]}>
      <meshStandardMaterial color="#2b2a33" roughness={0.6} />
    </RoundedBox>
    <Sticky label="FAR|leases" color="#fde68a" position={[0.55, DESK_Y + 0.001, -2.8]} rot={0.2} />
    <Sticky label="DON'T|SKIP" color="#fbcfe8" position={[-0.5, DESK_Y + 0.001, -0.8]} rot={-0.3} />
    <Sticky label="75+" color="#bbf7d0" position={[0.6, DESK_Y + 0.001, -5.6]} rot={0.1} />
    {/* crumpled paper */}
    {[[-0.3, -1.7], [0.35, -4.4], [-0.45, -5.6]].map(([x, z], i) => (
      <mesh key={i} position={[x, DESK_Y + 0.07, z]} rotation={[i, i * 2, i]}>
        <icosahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.9} flatShading />
      </mesh>
    ))}
    {/* lamp pools */}
    <pointLight position={[-0.9, 1.4, -1.0]} intensity={4 + saved * 2} distance={5} color="#ffb56b" />
    <pointLight position={[0.8, 1.2, -4.2]} intensity={3} distance={5} color="#ffb56b" />
    <Glow color="rgba(255,190,110,0.9)" size={1.2} opacity={0.45} position={[-0.9, 1.35, -1.0]} />
    {/* lamp body */}
    <group position={[-0.95, DESK_Y, -1.0]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.05, 24]} />
        <meshStandardMaterial color="#2d2a33" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.05, 0.62, 0]} rotation={[0, 0, -0.12]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 10]} />
        <meshStandardMaterial color="#2d2a33" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.15, 1.3, 0]} rotation={[0, 0, -2.4]}>
        <coneGeometry args={[0.2, 0.3, 24, 1, true]} />
        <meshStandardMaterial color="#e0712f" side={THREE.DoubleSide} />
      </mesh>
    </group>
    {/* drifting dust in the lamp light */}
    <Particles t={t} color="#ffd7a0" count={30} opacity={0.22} />
  </group>
);

export const HusScene3D: React.FC<{ t: number; T: HusTiming; aspect: number }> = ({ t, T, aspect }) => {
  const wide = aspect > 1;
  const beat = 60 / T.bpm;
  const z = ledgerZ(T, t);
  const running = t >= T.runStart && t < T.runEnd;
  const strideT = Math.max(0, t - T.runStart);
  const runPhase = (strideT / beat) * Math.PI; // one stride per beat
  // hurdle the book stack at z = -3.7
  const hurdle = (() => {
    const d = z - -3.95;
    return d > -0.05 && d < 0.75 ? Math.sin(Math.PI * (d + 0.05) / 0.8) * 0.48 : 0;
  })();
  const stepBob = running ? Math.abs(Math.sin(runPhase)) * 0.04 : 0;
  const slideK = prog(t, T.runEnd, T.slap - T.runEnd);
  const sliding = t >= T.runEnd && t < T.slap + 0.2;
  const ledgerY = DESK_Y + hurdle + stepBob + (sliding ? -0.05 * Math.sin(Math.PI * slideK) : 0);
  const ledgerX = running ? Math.sin(runPhase * 0.5) * 0.04 + (z > -2.6 && z < -1.8 ? 0.18 : 0) * Math.sin(Math.PI * prog(z, -2.6, 0.8)) : 0;
  const saved = easeOut(prog(t, T.slap, 0.35));
  const blinkPh = (t * 1.1) % 2.9;
  const asleep = t < T.wake;
  const wakeK = prog(t, T.wake, 0.25);

  /* ---- camera ---- */
  const keysPos: Key[] = [
    { t: 0, v: [0.05, 1.85, PHONE_Z + 0.8] },
    { t: T.wake - 0.05, v: [0.05, 1.6, PHONE_Z + 0.7] },
    // snap to Ledger far down the desk
    { t: T.wake, v: [0.3, 0.5, RUN_FROM + 1.35] },
    { t: T.runStart, v: [0.2, 0.46, RUN_FROM + 1.15] },
  ];
  let camPos: V3, camLook: V3;
  if (t < T.wake) {
    camPos = track(keysPos, t);
    camLook = [0, DESK_Y, PHONE_Z + 0.05];
  } else if (t < T.runStart) {
    camPos = track(keysPos, t);
    camLook = [0, 0.28, RUN_FROM];
  } else if (t < T.runEnd + 0.2) {
    // tracking shot: camera runs backwards in front of him, low and slightly to the side, with handheld wobble
    const lead = lerp(1.15, 1.85, easeOut(prog(t, T.runStart, 1.2)));
    camPos = [0.3 + noise(t * 2, 1) * 0.05, 0.58 + noise(t * 2.3, 2) * 0.03 + Math.abs(Math.sin(runPhase)) * 0.015, Math.min(z + lead, PHONE_Z + 2.2)];
    camLook = [ledgerX * 0.5, 0.3 + hurdle * 0.5, z - 0.25];
  } else if (t < T.huh[0] - 0.05) {
    // slide + slap: overhead on the phone
    const k = easeOut(prog(t, T.runEnd + 0.2, 0.3));
    camPos = [lerp(0.3, 0.3, k), lerp(0.58, 1.45, k), lerp(PHONE_Z + 2.2, PHONE_Z + 1.0, k)];
    camLook = [0, DESK_Y + 0.1, PHONE_Z - 0.2];
  } else if (t < T.lines.noskip[0] - 0.05) {
    // wide: the student jolts awake behind
    const k = expoOut(prog(t, T.huh[0] - 0.05, 0.4));
    camPos = [lerp(0.3, 0.6, k), lerp(1.45, 0.9, k), lerp(PHONE_Z + 1.0, PHONE_Z + 2.9, k)];
    camLook = [0.55, 0.5, PHONE_Z - 0.8];
  } else {
    // Ledger to camera
    const k = expoOut(prog(t, T.lines.noskip[0] - 0.05, 0.4));
    camPos = [lerp(0.6, 0.15, k), lerp(0.9, 0.55, k), lerp(PHONE_Z + 2.9, PHONE_Z + 1.5, k)];
    camLook = [0, 0.3, PHONE_Z - 0.5];
  }
  const [sx, sy] = shake(t, [T.wake + 0.02, T.slap], 0.05);
  const runShake = running ? noise(t * 14, 5) * 0.012 : 0;
  const pos: V3 = [camPos[0] + sx + runShake, camPos[1] + sy, camPos[2]];

  /* ---- Ledger pose ---- */
  const pant = t > T.slap ? Math.max(0, Math.sin((t - T.slap) * 9)) * Math.exp(-(t - T.slap) * 0.6) * 0.06 : 0;
  const ledgerPose = {
    run: running ? Math.min(1, prog(t, T.runStart, 0.25)) : t < T.runEnd + 0.15 ? 1 - prog(t, T.runEnd, 0.15) : 0,
    runPhase,
    blink: asleep ? 0.85 : blinkPh > 2.75 ? Math.sin(((blinkPh - 2.75) / 0.15) * Math.PI) : 0,
    look: (asleep ? [0, -0.6] : [0, 0]) as [number, number],
    mouth: Math.max(mouthAt(T, "L", t), running ? 0.35 + 0.4 * Math.abs(Math.sin(runPhase)) : 0, t >= T.wake && t < T.runStart ? 0.9 * wakeK : 0),
    cheer: t > T.slap + 0.25 && t < T.lines.noskip[0] ? easeOut(prog(t, T.slap + 0.25, 0.25)) * 0.8 : 0,
    point: sliding ? Math.sin(Math.PI * prog(t, T.slap - 0.3, 0.5)) : 0,
    happy: t > T.slap + 0.25 && t < T.lines.saved[0] ? 1 : 0,
    squash: (t >= T.wake && t < T.wake + 0.4 ? Math.sin((t - T.wake) * 25) * Math.exp(-(t - T.wake) * 9) * 0.25 : 0) + (sliding ? 0.18 * Math.sin(Math.PI * slideK) : 0) + pant,
    wave: t > T.lines.cta[0] - 0.3 ? easeOut(prog(t, T.lines.cta[0] - 0.3, 0.25)) : 0,
    waveT: t,
  };
  const lean = running ? 0.16 : sliding ? 0.5 * Math.sin(Math.PI * slideK) : 0; // lean forward toward camera (+z)

  /* ---- student asleep behind the phone ---- */
  const wake = t >= T.huh[0] ? expoOut(prog(t, T.huh[0], 0.3)) : 0;
  const zzz = t < T.huh[0] ? 1 : 0;

  /* ---- phone screen ---- */
  const left = Math.max(0, 119 - t * (t < T.wake ? 1 : 6));
  const pulse = (Math.sin(t * 6) + 1) / 2;
  const savedK = t >= T.slap ? 0.5 + 0.5 * saved + 0.001 : Math.min(0.5, 0);
  const streak = t >= T.slap + 0.15 ? 48 : 47;
  const session = Math.max(0, t - T.slap);
  const screenKey = `${Math.floor(left)}-${pulse.toFixed(1)}-${savedK.toFixed(2)}-${streak}-${Math.floor(session)}`;

  const endWorld = t >= T.end;
  return (
    <>
      <CameraRig pos={endWorld ? [0, 0.1, 8.4] : pos} look={endWorld ? [0, -0.6, 0] : camLook} fov={wide ? 40 : t >= T.runStart && t < T.runEnd ? 50 : 44} />
      <ambientLight intensity={endWorld ? 0.6 : 0.32} color={endWorld ? "#ffffff" : "#8a92d0"} />
      <directionalLight position={[2, 4, 3]} intensity={endWorld ? 2.2 : 0.9} color="#ffe2c4" />
      <directionalLight position={[-3, 2, -4]} intensity={endWorld ? 1.6 : 1.4} color="#ff8a4c" />

      {!endWorld && (
        <>
          <DeskWorld t={t} saved={saved} />
          <Phone draw={(c, w, h) => screenStreakSave(c, w, h, { left, saved: savedK, streak, session, pulse })} drawKey={screenKey}
            position={[0, DESK_Y + 0.02, PHONE_Z]} rotation={[-Math.PI / 2, 0, 0]} scale={0.32} />
          <Glow color={saved > 0.1 ? "rgba(52,211,153,0.9)" : "rgba(239,68,68,0.9)"} size={1.4} opacity={(saved > 0.1 ? saved : 0.25 + 0.2 * pulse) * 0.6} position={[0, DESK_Y + 0.05, PHONE_Z]} />
          <Student slump={1 - wake} tired={1 - wake} blink={zzz ? 1 : 0} surprise={wake} talk={mouthAt(T, "S", t)}
            position={[1.2, DESK_Y + 0.05 - 0.25 * (1 - wake), PHONE_Z - 1.25]} scale={0.62} />
          {zzz > 0 && [0, 1, 2].map((i) => {
            const k = ((t * 0.6 + i / 3) % 1);
            return <Glow key={i} color="rgba(200,210,255,0.9)" size={0.09 + k * 0.08} opacity={(1 - k) * 0.7} position={[1.4 + k * 0.3, 0.75 + k * 0.5, PHONE_Z - 1.15]} />;
          })}
          <group position={[ledgerX, ledgerY, z]} rotation={[lean, Math.PI * 0 + (t < T.runStart ? -0.2 : 0), 0]}>
            <Mascot {...ledgerPose} scale={0.36} />
          </group>
          {/* dust kicked up behind him */}
          {running && Array.from({ length: 6 }, (_, i) => {
            const k = ((strideT / beat + i / 6) % 1);
            return <Glow key={i} color="rgba(255,230,200,0.9)" size={0.06 + k * 0.12} opacity={(1 - k) * 0.35} position={[(rand(i) - 0.5) * 0.2, 0.03 + k * 0.08, z - 0.15 - k * 0.5]} />;
          })}
          {saved > 0 && t < T.slap + 1.5 && <Confetti t={t} t0={T.slap} />}
          {saved > 0 && <Glow color="rgba(255,200,90,0.95)" size={1.6} opacity={Math.max(0, 1 - (t - T.slap) * 1.2)} position={[0, 0.2, PHONE_Z]} />}
        </>
      )}
      {endWorld && (
        <>
          <Mascot wave={easeOut(prog(t, T.lines.cta[0] - 0.3, 0.25))} waveT={t} cheer={t < T.lines.cta[0] - 0.3 ? easeOut(prog(t, T.end + 0.3, 0.25)) * (0.85 + Math.sin(t * 9) * 0.15) : 0}
            mouth={mouthAt(T, "L", t)} happy={t < T.lines.cta[0] - 0.3 ? 1 : 0}
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
