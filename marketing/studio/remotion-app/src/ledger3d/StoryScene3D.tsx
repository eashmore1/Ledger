// Story ad 3D world: a CPA candidate at 2 AM in a rainy room, a rain cloud over his
// head. Ledger bursts out of the book stack, shows him studying with friends,
// the sun comes up, the cloud becomes a streak flame, and he passes.
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { backOut, clamp, easeIn, easeInOut, easeOut, lerp, life, noise, prog, rand, V3 } from "./anim";
import { Timeline, wordAt } from "./data";
import { Mascot } from "./Mascot";
import { CameraRig, Confetti, Flame, Glow, Phone, useCanvasTex } from "./Scene3D";
import { screenRoom, screenScore, screenStart, screenStreak, skyFace, spineFace } from "./screens";
import { Student } from "./Student";

export const storyBeats = (tl: Timeline) => {
  const L = tl.L;
  return {
    alone: L.alone.start,
    glow: L.alone.end - 0.55,
    pop: L.hey.start - 0.38,
    hey: L.hey.start,
    talk: L.talk.start,
    start: L.start.start,
    hit: wordAt(tl, "start", /^Hit/i),
    press: wordAt(tl, "start", /^start/i),
    friends: wordAt(tl, "start", /^friends/i),
    room: L.room.start,
    same: wordAt(tl, "room", /^Same/i),
    nobody: wordAt(tl, "room", /^Nobody/i),
    streak: L.streak.start,
    cando: L.cando.start,
    passed: L.passed.start,
    passWord: wordAt(tl, "passed", /^passed/i),
    end: L.brand.start,
    cta: L.cta.start,
    D: tl.duration,
  };
};

/** Mouth openness for a speaker, from the voice track's loudness (scripts/mouth_sync.py). */
export const mouthFor = (tl: Timeline, who: string, t: number) => {
  const m = tl.mouth;
  const arr = m?.[who];
  if (!m || !Array.isArray(arr)) return 0;
  const x = t * m.fps, i = Math.floor(x), k = x - i;
  const a = arr[i] ?? 0, b = arr[i + 1] ?? 0;
  return a + (b - a) * k;
};

const Rain: React.FC<{ t: number; count: number; box: [number, number, number, number, number]; speed: number; opacity: number; len: number }> = ({ t, count, box, speed, opacity, len }) => {
  const [x0, x1, y0, y1, z] = box;
  const mesh = useMemo(() => new THREE.InstancedMesh(new THREE.PlaneGeometry(0.008, 1), new THREE.MeshBasicMaterial({ color: "#c8d6ff", transparent: true, depthWrite: false }), count), [count]);
  (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12));
  const h = y1 - y0;
  for (let i = 0; i < count; i++) {
    const x = x0 + rand(i * 3.3) * (x1 - x0);
    const y = y1 - ((rand(i * 7.1) * h + t * speed * (0.8 + rand(i) * 0.4)) % h);
    m.compose(new THREE.Vector3(x, y, z + rand(i * 1.7) * 0.05), q, new THREE.Vector3(1, len, 1));
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return opacity > 0 ? <primitive object={mesh} /> : null;
};

const Cloud: React.FC<{ t: number; position: V3; scale: number; dark: number }> = ({ t, position, scale, dark }) => {
  if (scale <= 0.001) return null;
  const col = new THREE.Color("#8d93a6").lerp(new THREE.Color("#4b5063"), dark);
  const puffs: [number, number, number, number][] = [[-0.32, 0, 0, 0.26], [-0.08, 0.1, 0.02, 0.32], [0.2, 0.04, 0, 0.28], [0.42, -0.04, -0.02, 0.2], [0.02, -0.08, 0.1, 0.24], [-0.5, -0.06, -0.02, 0.18]];
  return (
    <group position={[position[0] + noise(t * 0.7, 3) * 0.03, position[1] + Math.sin(t * 1.8) * 0.02, position[2]]} scale={scale}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 24, 16]} />
          <meshStandardMaterial color={col} roughness={0.95} />
        </mesh>
      ))}
      <Rain t={t} count={40} box={[-0.5, 0.45, -0.55, -0.12, 0.05]} speed={1.6} opacity={0.7} len={0.09} />
    </group>
  );
};

export const Room: React.FC<{ t: number; day: number; flash: number; bookGlow: number; bookShake: number; rain?: boolean }> = ({ t, day, flash, bookGlow, bookShake, rain = true }) => {
  const sky = useCanvasTex(300, 380, (c, w, h) => skyFace(c, w, h, day, flash), `${day.toFixed(2)}-${flash.toFixed(2)}`);
  const spines = [
    useCanvasTex(400, 80, (c, w, h) => spineFace(c, w, h, "FAR", "#c2410c"), "far"),
    useCanvasTex(400, 80, (c, w, h) => spineFace(c, w, h, "AUD", "#3f4bb5"), "aud"),
    useCanvasTex(400, 80, (c, w, h) => spineFace(c, w, h, "REG", "#0f766e"), "reg"),
  ];
  const wall = new THREE.Color("#262b45").lerp(new THREE.Color("#d9b79c"), day);
  const deskTop = -0.8;
  const sh = bookShake * Math.sin(t * 70) * 0.02;
  return (
    <group>
      {/* back wall + floor glow */}
      <mesh position={[0, 0.5, -2.2]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      {/* window */}
      <group position={[-0.75, 1.25, -2.16]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.2, 1.52]} />
          <meshBasicMaterial map={sky} toneMapped={false} />
        </mesh>
        <Rain t={t} count={130} box={[-0.6, 0.6, -0.76, 0.76, 0.01]} speed={5.2} opacity={rain ? 0.32 * (1 - day) : 0} len={0.13} />
        {[[0, 0.79, 1.36, 0.08], [0, -0.79, 1.36, 0.08], [-0.64, 0, 0.08, 1.66], [0.64, 0, 0.08, 1.66], [0, 0, 0.04, 1.6], [0, 0, 1.3, 0.04]].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.03]}>
            <boxGeometry args={[w, h, 0.06]} />
            <meshStandardMaterial color={new THREE.Color("#3a3550").lerp(new THREE.Color("#f3e6d6"), day)} roughness={0.6} />
          </mesh>
        ))}
        <Glow color={day > 0.5 ? "rgba(255,200,130,0.9)" : "rgba(130,150,255,0.9)"} size={3.2} opacity={0.18 + day * 0.35 + flash * 0.6} position={[0, 0, 0.3]} />
      </group>
      {/* shelf with plant */}
      <mesh position={[1.05, 1.35, -2.1]}>
        <boxGeometry args={[0.9, 0.05, 0.22]} />
        <meshStandardMaterial color="#6b4a33" />
      </mesh>
      <mesh position={[0.8, 1.5, -2.08]}>
        <cylinderGeometry args={[0.08, 0.065, 0.16, 16]} />
        <meshStandardMaterial color="#d7c3a8" />
      </mesh>
      {[-0.4, 0, 0.4].map((r, i) => (
        <mesh key={i} position={[0.8 + r * 0.12, 1.66, -2.08]} rotation={[0, 0, r]} scale={[0.05, 0.13, 0.03]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#3f8f5a" />
        </mesh>
      ))}
      {/* desk */}
      <RoundedBox args={[3.6, 0.1, 1.5]} radius={0.04} position={[0, deskTop - 0.05, 0.15]}>
        <meshPhysicalMaterial color="#8a5a3c" roughness={0.55} clearcoat={0.3} />
      </RoundedBox>
      <mesh position={[0, deskTop - 0.75, 0.88]}>
        <boxGeometry args={[3.6, 1.4, 0.06]} />
        <meshStandardMaterial color="#5e3c27" roughness={0.7} />
      </mesh>
      {/* laptop (we see its back) */}
      <group position={[-0.05, deskTop, 0.28]}>
        <RoundedBox args={[0.95, 0.035, 0.62]} radius={0.015} position={[0, 0.02, 0]}>
          <meshStandardMaterial color="#9aa0aa" metalness={0.7} roughness={0.35} />
        </RoundedBox>
        <group position={[0, 0.03, -0.3]} rotation={[-0.25, 0, 0]}>
          <RoundedBox args={[0.95, 0.62, 0.025]} radius={0.015} position={[0, 0.31, 0]}>
            <meshStandardMaterial color="#9aa0aa" metalness={0.7} roughness={0.35} />
          </RoundedBox>
          <mesh position={[0, 0.33, 0.014]}>
            <circleGeometry args={[0.05, 20]} />
            <meshBasicMaterial color="#f4f1ea" />
          </mesh>
        </group>
        {/* screen light on his face */}
        <pointLight position={[0, 0.45, -0.55]} intensity={(1 - day) * 2.2} distance={2} color="#9fb6ff" />
      </group>
      {/* book stack (Ledger hides on top) */}
      <group position={[0.85 + sh, deskTop, 0.45]} rotation={[0, -0.25, bookShake * Math.sin(t * 50) * 0.04]}>
        {spines.map((tex, i) => (
          <group key={i} position={[(i % 2) * 0.04 - 0.02, 0.07 + i * 0.14, 0]} rotation={[0, i * 0.12 - 0.1, 0]}>
            <RoundedBox args={[0.7, 0.13, 0.5]} radius={0.02}>
              <meshPhysicalMaterial color={["#c2410c", "#3f4bb5", "#0f766e"][i]} roughness={0.5} clearcoat={0.3} />
            </RoundedBox>
            <mesh position={[0, 0, 0.252]}>
              <planeGeometry args={[0.68, 0.12]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <Glow color="rgba(255,150,60,0.95)" size={2.2} opacity={bookGlow} position={[0, 0.5, 0.2]} />
        {bookGlow > 0.05 && <pointLight position={[0, 0.6, 0.4]} intensity={bookGlow * 6} distance={3} color="#ff8a3c" />}
      </group>
      {/* lamp */}
      <group position={[-1.0, deskTop, 0.2]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.05, 24]} />
          <meshStandardMaterial color="#2d2a33" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.06, 0.4, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.018, 0.018, 0.75, 10]} />
          <meshStandardMaterial color="#2d2a33" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.22, 0.78, 0.02]} rotation={[0, 0, -0.9]}>
          <coneGeometry args={[0.17, 0.26, 24, 1, true]} />
          <meshStandardMaterial color="#e0712f" side={THREE.DoubleSide} roughness={0.5} />
        </mesh>
        <pointLight position={[0.32, 0.62, 0.15]} intensity={lerp(5, 1.5, day)} distance={4} color="#ffb56b" />
        <Glow color="rgba(255,190,110,0.9)" size={1.2} opacity={0.5 * (1 - day * 0.6)} position={[0.32, 0.65, 0.12]} />
      </group>
      {/* mug */}
      <group position={[-0.55, deskTop, 0.6]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.08, 0.075, 0.2, 20]} />
          <meshPhysicalMaterial color="#f2ece4" roughness={0.3} clearcoat={0.6} />
        </mesh>
        <mesh position={[0.09, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.045, 0.014, 8, 16]} />
          <meshPhysicalMaterial color="#f2ece4" roughness={0.3} />
        </mesh>
      </group>
      {/* crumpled notes */}
      {[[0.35, 0.72], [-0.35, 0.85], [0.55, 0.95]].map(([x, z], i) => (
        <mesh key={i} position={[x, deskTop + 0.05, z]} rotation={[i, i * 2, i * 3]}>
          <icosahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial color="#f4efe6" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
};

/* ---- cinematography ----
   Real cuts between a handful of camera setups, each with a slow push and a
   little handheld drift, instead of a whip-zoom on every line. */
export type Shot = { at: number; p0: V3; p1: V3; l0: V3; l1: V3; fov?: number };
export const shotAt = (shots: Shot[], t: number) => {
  let i = 0;
  while (i + 1 < shots.length && t >= shots[i + 1].at) i++;
  const s = shots[i], end = shots[i + 1]?.at ?? s.at + 4;
  const k = easeInOut(clamp((t - s.at) / Math.max(0.5, end - s.at)));
  const mix = (a: V3, b: V3): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  // handheld: two slow noise octaves, a few millimetres, never a shake
  const hx = noise(t * 0.45, 31) * 0.012 + noise(t * 1.3, 37) * 0.004;
  const hy = noise(t * 0.4, 41) * 0.01 + noise(t * 1.1, 43) * 0.003;
  const p = mix(s.p0, s.p1), l = mix(s.l0, s.l1);
  return { pos: [p[0] + hx, p[1] + hy, p[2]] as V3, look: [l[0] + hx * 0.6, l[1] + hy * 0.6, l[2]] as V3, fov: s.fov ?? 30, index: i };
};

/** Blinks at irregular, human intervals (deterministic). */
export const blinkAt = (t: number, seed: number) => {
  let at = 0.6 + rand(seed) * 1.5, n = 0;
  while (at < t + 1) {
    const d = t - at;
    if (d >= 0 && d < 0.16) return Math.sin((d / 0.16) * Math.PI);
    at += 1.8 + rand(seed + ++n * 3.7) * 3.2 + (rand(seed + n * 5.1) > 0.85 ? -1.5 : 0);
  }
  return 0;
};

// The phone stands on the desk, propped against a little stand, facing camera.
const PHONE_POS: V3 = [0.3, -0.62, 0.76];
const PHONE_ROT: V3 = [-0.28, -0.12, 0];
const PHONE_S = 0.11;

export const StoryScene3D: React.FC<{ t: number; tl: Timeline; aspect: number }> = ({ t, tl, aspect }) => {
  const B = storyBeats(tl);
  const wide = aspect > 1;
  const inRoom = t < B.end;
  const day = easeInOut(prog(t, B.streak - 0.15, 1.4));
  const flash = Math.max(0, 1 - Math.abs(t - 0.35) * 6) * 0.5; // one distant lightning flicker
  const bookGlow = t < B.pop ? easeIn(prog(t, B.glow, B.pop - B.glow)) * 0.6 : Math.max(0, 0.6 - (t - B.pop) * 1.5);
  const bookShake = t > B.glow && t < B.pop ? prog(t, B.glow, B.pop - B.glow) * 0.7 : 0;

  /* ---- shots ---- */
  const PH: V3 = [PHONE_POS[0], PHONE_POS[1] + 0.02, PHONE_POS[2]];
  const FACE: V3 = [0, 0.55, -0.6];
  const shots: Shot[] = [
    // the score on his phone, slow push
    { at: 0, p0: [0.33, -0.5, 1.98], p1: [0.32, -0.53, 1.74], l0: PH, l1: PH },
    // medium on him, rain on the window behind
    { at: B.alone, p0: [0.12, 0.5, 3.75], p1: [0.04, 0.5, 3.35], l0: [0, 0.38, -0.6], l1: [0, 0.4, -0.6] },
    // wider three-quarter: the book stack starts to rattle, Ledger pops out
    { at: B.glow - 0.35, p0: [-0.75, 0.3, 4.4], p1: [-0.6, 0.28, 4.05], l0: [0.35, -0.12, -0.05], l1: [0.4, -0.15, 0] },
    // his reaction, close
    { at: B.talk, p0: [0.32, 0.64, 3.05], p1: [0.28, 0.62, 2.85], l0: FACE, l1: FACE },
    // two-shot: him and Ledger
    { at: B.start, p0: [0.55, 0.22, 3.9], p1: [0.5, 0.2, 3.6], l0: [0.38, -0.05, -0.05], l1: [0.4, -0.08, 0] },
    // insert: the phone, live session
    { at: B.hit, p0: [0.33, -0.5, 1.92], p1: [0.32, -0.53, 1.72], l0: PH, l1: PH },
    // insert from a new angle: the study room
    { at: B.room, p0: [0.16, -0.48, 1.88], p1: [0.2, -0.5, 1.72], l0: PH, l1: PH },
    // wide: the sun comes up
    { at: B.streak, p0: [0, 0.72, 6.4], p1: [0, 0.66, 5.6], l0: [0, 0.48, -0.6], l1: [0, 0.46, -0.6] },
    // close: he believes it
    { at: B.cando, p0: [-0.25, 0.56, 3.45], p1: [-0.18, 0.54, 3.15], l0: FACE, l1: FACE },
    // insert: the result
    { at: B.passed - 0.05, p0: [0.33, -0.5, 1.92], p1: [0.32, -0.53, 1.76], l0: PH, l1: PH },
    // he jumps, Ledger too; camera eases back
    { at: B.passWord + 0.35, p0: [0.25, 0.38, 4.0], p1: [0.2, 0.4, 4.6], l0: [0.15, 0.2, -0.3], l1: [0.15, 0.22, -0.3] },
    // end card
    { at: B.end, p0: [0, 0.2, 9.0], p1: [0, 0.15, 8.4], l0: [0, -0.6, 0], l1: [0, -0.6, 0] },
  ];
  const cam = shotAt(shots, t);
  const camPos: V3 = [cam.pos[0], cam.pos[1], cam.pos[2] * (wide ? 1.25 : 1)];

  /* ---- student ---- */
  const sad = 1 - easeOut(prog(t, B.talk, 0.5));
  const surprise = t > B.pop && t < B.start + 0.3 ? easeOut(prog(t, B.pop + 0.08, 0.3)) * (1 - easeInOut(prog(t, B.start, 0.5))) : 0;
  const smile = easeOut(prog(t, B.streak, 0.8));
  const cheer = t > B.passWord ? easeOut(prog(t, B.passWord + 0.1, 0.45)) : 0;
  const sway = noise(t * 0.35, 7) * 0.06;
  const studentPose = {
    slump: (t < B.pop ? 0.62 + noise(t * 0.3, 3) * 0.06 : lerp(0.62, 0, easeOut(prog(t, B.pop, 0.6))) * (1 - smile)) + (1 - smile) * 0.04,
    tired: t < B.streak ? 0.75 * (1 - surprise) : 0,
    sad: sad * (1 - surprise),
    surprise,
    smile: Math.max(smile, t > B.start && t < B.streak ? 0.3 : 0),
    talk: mouthFor(tl, "S", t),
    cheer: Math.min(1, cheer),
    blink: Math.max(blinkAt(t, 11), surprise > 0.05 && surprise < 0.2 ? 0.6 : 0),
    look: (t > B.pop && t < B.start + 0.3 ? [0.9, -0.4] : t >= B.hit && t < B.streak ? [0.5, -0.8] : t > B.passed - 0.1 && t < B.passWord + 0.3 ? [0.5, -0.8] : [noise(t * 0.5, 5) * 0.25, -0.15 + noise(t * 0.4, 9) * 0.1]) as [number, number],
    headTurn: (t > B.pop && t < B.start + 0.3 ? 0.3 * easeOut(prog(t, B.pop, 0.4)) : 0) + sway,
  };
  const hop = t > B.passWord ? Math.abs(Math.sin((t - B.passWord - 0.1) * 8)) * 0.07 * Math.exp(-(t - B.passWord) * 1.6) : 0;
  const breath = 1 + Math.sin(t * 2.3) * 0.008;

  /* ---- Ledger on the desk ---- */
  const crouch = t > B.pop - 0.12 && t < B.pop ? Math.sin(prog(t, B.pop - 0.12, 0.12) * Math.PI) * 0.25 : 0;
  const jump = prog(t, B.pop, 0.55);
  const ledgerOn = t >= B.pop - 0.12 && inRoom;
  const STACK_TOP = -0.8 + 0.07 + 2 * 0.14 + 0.065;
  const lY = STACK_TOP + Math.sin(Math.PI * Math.min(1, jump)) * 0.55;
  const land = t - (B.pop + 0.55);
  const squash = crouch > 0 ? -crouch : land > 0 && land < 0.6 ? Math.sin(land * 18) * Math.exp(-land * 7) * 0.16 : 0;
  const ledgerPose = {
    wave: (t > B.hey && t < B.talk) || (t > B.start && t < B.hit) ? easeOut(prog(t, t < B.talk ? B.hey : B.start, 0.3)) : 0,
    waveT: t,
    cheer: (t > B.passWord && t < B.end) ? easeOut(prog(t, B.passWord + 0.15, 0.4)) * (0.85 + Math.sin(t * 7) * 0.15) : 0,
    mouth: mouthFor(tl, "L", t),
    happy: t > B.passWord ? 1 : 0,
    blink: blinkAt(t, 23),
    look: (t >= B.hit && t < B.streak ? [-0.6, -0.6] : [-0.8, 0.3]) as [number, number],
    squash,
  };

  /* ---- what the phone shows ---- */
  const pressK = prog(t, B.press, 0.45);
  const running = t > B.press + 0.15;
  const el = running ? easeOut(prog(t, B.press + 0.15, B.room - B.press - 0.3)) * 3725 : 0;
  const joined = 1 + Math.max(0, (t - B.room - 0.1) / 0.3);
  const left = 50 * 60 - (t - B.room);
  const pulse = (Math.sin(t * 6) + 1) / 2;
  const nStreak = Math.round(1 + easeOut(prog(t, B.streak + 0.3, 1.6)) * 29);
  const failStamp = easeOut(prog(t, 0.9, 0.3));
  const passStamp = easeOut(prog(t, B.passWord - 0.05, 0.3));
  let screen: { draw: (c: CanvasRenderingContext2D, w: number, h: number) => void; key: string };
  if (t < B.hit - 0.05) screen = { draw: (c, w, h) => screenScore(c, w, h, false, failStamp), key: `f${failStamp.toFixed(2)}` };
  else if (t < B.room - 0.05) screen = { draw: (c, w, h) => screenStart(c, w, h, { press: pressK, elapsed: el, running }), key: `s${Math.floor(el)}-${pressK.toFixed(2)}` };
  else if (t < B.streak) screen = { draw: (c, w, h) => screenRoom(c, w, h, { joined, left, pulse }), key: `r${joined.toFixed(1)}-${Math.floor(left)}-${pulse.toFixed(1)}` };
  else if (t < B.passed - 0.05) screen = { draw: (c, w, h) => screenStreak(c, w, h, nStreak), key: `k${nStreak}` };
  else screen = { draw: (c, w, h) => screenScore(c, w, h, true, passStamp), key: `p${passStamp.toFixed(2)}` };
  // the phone lights up when it's being used, dims to a glow otherwise
  const screenBright = cam.index === 0 || cam.index === 5 || cam.index === 6 || cam.index === 9 ? 1 : 0.85;

  /* ---- cloud -> streak flame ---- */
  const cloudS = inRoom ? (t < B.streak ? 1 : Math.max(0, 1 - easeIn(prog(t, B.streak, 0.5)))) * (1 - 0.25 * easeOut(prog(t, B.pop, 1.5))) : 0;
  const flameS = life(t, B.streak + 0.4, B.passed - 0.1, 0.7, 0.3);

  const nightAmb = 1 - day;
  const laptopFlicker = 1 + noise(t * 6, 2) * 0.06;
  return (
    <>
      <CameraRig pos={camPos} look={cam.look} fov={wide ? 26 : cam.fov} />
      {inRoom && <fog attach="fog" args={[day > 0.5 ? "#3a2618" : "#0d0c16", 6, 16]} />}
      <hemisphereLight args={[inRoom ? (day > 0.5 ? "#ffe3c8" : "#5a68a8") : "#ffffff", "#1a120c", inRoom ? lerp(0.35, 0.8, day) + flash * 0.8 : 0.7]} />
      {/* window light: cold moon at night, warm low sun in the morning */}
      <directionalLight position={[-3, 2.5, -1]} intensity={inRoom ? lerp(0.9, 2.8, day) + flash * 2.5 : 2.0} color={day > 0.5 || !inRoom ? "#ffbf80" : "#8ea2ff"} />
      <directionalLight position={[3, 2, 4]} intensity={inRoom ? 0.35 + day * 0.5 : 1.4} color="#fff1e0" />

      {inRoom && (
        <>
          <Room t={t} day={day} flash={flash} bookGlow={bookGlow} bookShake={bookShake} />
          <pointLight position={[0, 0.25, 0]} intensity={(1 - day) * 1.4 * laptopFlicker} distance={1.8} color="#a9bcff" />
          <group position={[0, -0.15 + hop, -0.6]} scale={[1, breath, 1]}>
            <Student {...studentPose} />
          </group>
          <Cloud t={t} position={[0, 1.55, -0.55]} scale={cloudS * 0.95} dark={nightAmb} />
          <Flame t={t} position={[-0.05, 1.6, -0.7]} scale={flameS * 0.3} />
          {ledgerOn && <Mascot {...ledgerPose} position={[0.85, lY, 0.45]} rotation={[0, -0.45 + noise(t * 0.4, 13) * 0.08, 0]} scale={0.42} />}
          {/* phone on its stand */}
          <group>
            <mesh position={[PHONE_POS[0], -0.78, PHONE_POS[2] - 0.05]} rotation={[-0.5, -0.12, 0]}>
              <boxGeometry args={[0.12, 0.05, 0.14]} />
              <meshStandardMaterial color="#2d2a33" roughness={0.5} />
            </mesh>
            <Phone draw={screen.draw} drawKey={`${screen.key}-${screenBright}`} position={PHONE_POS} rotation={PHONE_ROT} scale={PHONE_S} />
            <pointLight position={[PHONE_POS[0], PHONE_POS[1] + 0.05, PHONE_POS[2] + 0.2]} intensity={0.35 * screenBright} distance={0.8} color="#fff3e6" />
          </group>
          {t > B.passWord && <Confetti t={t} t0={B.passWord + 0.45} />}
        </>
      )}

      {/* end card world */}
      {!inRoom && (
        <>
          <Mascot wave={t > B.cta - 0.2 ? easeOut(prog(t, B.cta - 0.2, 0.3)) : 0} waveT={t} cheer={t < B.cta - 0.2 ? easeOut(prog(t, B.end + 0.3, 0.3)) * (0.85 + Math.sin(t * 7) * 0.15) : 0}
            mouth={mouthFor(tl, "L", t)} happy={t < B.cta - 0.2 ? 1 : 0} blink={blinkAt(t, 29)}
            position={[0, lerp(-5, -2.05, backOut(prog(t, B.end, 0.7), 1.2)), 0.6]} rotation={[0, noise(t * 0.6, 4) * 0.12, 0]} scale={0.92}
            squash={(() => { const l = t - (B.end + 0.45); return l > 0 && l < 0.6 ? Math.sin(l * 18) * Math.exp(-l * 7) * 0.16 : 0; })()} />
          <Glow color="rgba(255,240,210,0.9)" size={6} opacity={0.25} position={[0, -0.4, -1]} />
        </>
      )}
    </>
  );
};
