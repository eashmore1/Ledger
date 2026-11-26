// Story ad 3D world: a CPA candidate at 2 AM in a rainy room, a rain cloud over his
// head. Ledger bursts out of the book stack, shows him studying with friends,
// the sun comes up, the cloud becomes a streak flame, and he passes.
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { backOut, easeIn, easeInOut, easeOut, expoOut, Key, lerp, life, noise, prog, rand, shake, track, V3 } from "./anim";
import { Timeline, wordAt } from "./data";
import { Mascot } from "./Mascot";
import { CameraRig, Card, Coin, Confetti, FacePlane, Flame, Glow, Particles, Phone, Ring, useCanvasTex } from "./Scene3D";
import { avatarCoin, clockFace, PEOPLE, scoreCard, screenRoom, screenStart, skyFace, spineFace, streakCard } from "./screens";
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

const Room: React.FC<{ t: number; day: number; flash: number; bookGlow: number; bookShake: number }> = ({ t, day, flash, bookGlow, bookShake }) => {
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
        <Rain t={t} count={90} box={[-0.6, 0.6, -0.76, 0.76, 0.01]} speed={6} opacity={0.55 * (1 - day)} len={0.16} />
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

export const StoryScene3D: React.FC<{ t: number; tl: Timeline; aspect: number }> = ({ t, tl, aspect }) => {
  const B = storyBeats(tl);
  const wide = aspect > 1;
  const inRoom = t < B.end;
  // features cut-away window: from "Hit start" until the streak line
  const featureOn = t >= B.hit - 0.1 && t < B.streak - 0.05;
  const day = easeInOut(prog(t, B.streak - 0.15, 0.6));
  const flash = Math.max(0, 1 - Math.abs(t - 0.08) * 8) + Math.max(0, 1 - Math.abs(t - B.glow + 0.2) * 7) * 0.6;
  const bookGlow = t < B.pop ? easeIn(prog(t, B.glow, B.pop - B.glow)) : Math.max(0, 1 - (t - B.pop) * 2.5);
  const bookShake = t > B.glow && t < B.pop ? prog(t, B.glow, B.pop - B.glow) : 0;

  /* ---- camera ---- */
  const FACE: V3 = [0, 0.6, -0.6];
  const pos: Key[] = [
    { t: 0, v: [0.1, 0.62, 3.5] },
    { t: B.alone - 0.05, v: [0.05, 0.6, 3.0] },
    { t: B.alone + 0.35, v: [0, 0.55, 7.6], ease: expoOut },
    { t: B.glow, v: [-0.15, 0.45, 6.8] },
    { t: B.pop - 0.05, v: [0.35, 0.3, 5.8], ease: easeIn },
    { t: B.pop + 0.4, v: [0.55, 0.25, 5.6], ease: expoOut },
    { t: B.talk - 0.05, v: [0.5, 0.25, 5.2] },
    { t: B.talk + 0.3, v: [0.15, 0.7, 3.0], ease: expoOut },
    { t: B.start - 0.05, v: [0.1, 0.66, 2.8] },
    { t: B.start + 0.35, v: [0.55, 0.0, 3.6], ease: expoOut },
    { t: B.hit - 0.1, v: [0.6, -0.05, 3.3] },
    { t: B.hit + 0.3, v: [0, 0.15, 7.6], ease: expoOut },
    { t: B.room - 0.05, v: [0.3, 0.1, 7.2] },
    { t: B.room + 0.35, v: [-0.3, 0.2, 7.4], ease: expoOut },
    { t: B.same - 0.05, v: [0, 0.1, 7.0] },
    { t: B.same + 0.35, v: [0, 0.35, 7.6], ease: expoOut },
    { t: B.streak - 0.05, v: [0, 0.3, 7.0] },
    { t: B.streak + 0.4, v: [0, 0.75, 7.4], ease: expoOut },
    { t: B.cando - 0.05, v: [0, 0.7, 6.8] },
    { t: B.cando + 0.35, v: [0.35, 0.5, 4.6], ease: expoOut },
    { t: B.passed - 0.05, v: [0.3, 0.5, 4.3] },
    { t: B.passed + 0.3, v: [0, 0.55, 5.6], ease: expoOut },
    { t: B.end - 0.05, v: [0, 0.55, 5.0] },
    { t: B.end + 0.45, v: [0, 0.2, 9.2], ease: expoOut },
    { t: B.D, v: [0, 0.1, 8.4] },
  ];
  const look: Key[] = [
    { t: 0, v: [0, 0.42, -0.6] },
    { t: B.alone, v: [0, 0.45, -0.6] },
    { t: B.alone + 0.35, v: [0, 0.25, -0.6], ease: expoOut },
    { t: B.glow, v: [0, 0.25, -0.6] },
    { t: B.pop - 0.05, v: [0.6, -0.4, 0.2], ease: easeIn },
    { t: B.talk - 0.05, v: [0.45, -0.25, 0.1] },
    { t: B.talk + 0.3, v: FACE, ease: expoOut },
    { t: B.start, v: FACE },
    { t: B.start + 0.35, v: [0.7, -0.35, 0.4], ease: expoOut },
    { t: B.hit - 0.1, v: [0.7, -0.35, 0.4] },
    { t: B.hit + 0.3, v: [0, 0.1, 1.5], ease: expoOut },
    { t: B.streak - 0.05, v: [0, 0.1, 1.5] },
    { t: B.streak + 0.4, v: [0, 0.55, -0.6], ease: expoOut },
    { t: B.cando, v: [0, 0.55, -0.6] },
    { t: B.cando + 0.35, v: [0.3, 0.3, -0.3], ease: expoOut },
    { t: B.passed, v: [0.3, 0.3, -0.3] },
    { t: B.passed + 0.3, v: [0, 0.45, 0.2], ease: expoOut },
    { t: B.end, v: [0, 0.45, 0.2] },
    { t: B.end + 0.45, v: [0, -0.6, 0], ease: expoOut },
  ];
  const [sx, sy] = shake(t, [0.08, B.pop + 0.05, B.passWord + 0.1, B.end + 0.25], 0.06);
  const cp = track(pos, t), cl = track(look, t);
  const camPos: V3 = [cp[0] + sx, cp[1] + sy, cp[2] * (wide ? 1.25 : 1)];

  /* ---- student ---- */
  const blinkPh = (t * 0.9 + 0.4) % 3.4;
  const blink = blinkPh > 3.25 ? Math.sin(((blinkPh - 3.25) / 0.15) * Math.PI) : 0;
  const sad = 1 - easeOut(prog(t, B.talk, 0.4));
  const surprise = t > B.pop && t < B.start + 0.3 ? easeOut(prog(t, B.pop, 0.25)) * (1 - easeIn(prog(t, B.start, 0.3))) : 0;
  const smile = easeOut(prog(t, B.streak, 0.5));
  const cheer = t > B.passWord ? backOut(prog(t, B.passWord, 0.35)) : 0;
  const studentPose = {
    slump: t < B.pop ? 0.7 : lerp(0.7, 0, easeOut(prog(t, B.pop, 0.4))) * (1 - smile),
    tired: t < B.streak ? 0.8 * (1 - surprise) : 0,
    sad: sad * (1 - surprise),
    surprise,
    smile: Math.max(smile, t > B.start && t < B.streak ? 0.35 : 0),
    talk: mouthFor(tl, "S", t),
    cheer: Math.min(1, cheer),
    blink,
    look: (t > B.pop && t < B.start + 0.3 ? [0.9, -0.4] : t > B.cando - 0.1 && t < B.passed ? [0.6, -0.2] : [0, -0.15]) as [number, number],
    headTurn: t > B.pop && t < B.start + 0.3 ? 0.3 * easeOut(prog(t, B.pop, 0.3)) : 0,
  };
  const hop = t > B.passWord ? Math.abs(Math.sin((t - B.passWord) * 9)) * 0.1 * Math.exp(-(t - B.passWord) * 1.5) : 0;

  /* ---- Ledger on the desk ---- */
  const jump = prog(t, B.pop, 0.5);
  const ledgerOn = t >= B.pop && inRoom;
  // top of the book stack: desk (-0.8) + three 0.14 books -> feet stand at y = -0.385
  const STACK_TOP = -0.8 + 0.07 + 2 * 0.14 + 0.065;
  const lY = STACK_TOP + Math.sin(Math.PI * Math.min(1, jump)) * 0.75;
  const lX = 0.85;
  const land = t - (B.pop + 0.5);
  const squash = land > 0 && land < 0.5 ? Math.sin(land * 22) * Math.exp(-land * 8) * 0.22 : jump < 1 ? -0.15 : 0;
  const ledgerBlinkPh = (t * 1.1) % 2.9;
  const ledgerPose = {
    wave: (t > B.hey && t < B.talk) || (t > B.start && t < B.hit) ? easeOut(prog(t, t < B.talk ? B.hey : B.start, 0.25)) : 0,
    waveT: t,
    cheer: (t > B.cando && t < B.end) ? easeOut(prog(t, B.cando, 0.3)) * (0.85 + Math.sin(t * 9) * 0.15) : 0,
    mouth: mouthFor(tl, "L", t),
    happy: t > B.passWord ? 1 : 0,
    blink: ledgerBlinkPh > 2.75 ? Math.sin(((ledgerBlinkPh - 2.75) / 0.15) * Math.PI) : 0,
    look: [-0.8, 0.3] as [number, number],
    squash,
  };

  /* ---- features (cut-away in front of a dimmed room) ---- */
  const dim = featureOn ? Math.min(easeOut(prog(t, B.hit - 0.1, 0.3)), 1 - easeIn(prog(t, B.streak - 0.3, 0.25))) : 0;
  const phoneS = life(t, B.hit - 0.05, B.same + 0.15, 0.4, 0.18) * 0.58;
  const pressK = prog(t, B.press, 0.45);
  const running = t > B.press + 0.15;
  const el = running ? easeOut(prog(t, B.press + 0.15, B.room - B.press - 0.3)) * 3725 : 0;
  const inRoomScreen = t >= B.room - 0.1;
  const joined = 1 + Math.max(0, (t - B.room - 0.1) / 0.25);
  const left = 50 * 60 - (t - B.room);
  const pulse = (Math.sin(t * 8) + 1) / 2;
  const screenKey = inRoomScreen ? `r${joined.toFixed(1)}-${Math.floor(left)}-${pulse.toFixed(1)}` : `s${Math.floor(el)}-${pressK.toFixed(2)}`;
  const coins = PEOPLE.slice(0, 5).map((p, i) => {
    const s = Math.max(life(t, B.friends - 0.05 + i * 0.1, B.room - 0.08, 0.35, 0.12), life(t, B.room + 0.1 + i * 0.25, B.same + 0.12, 0.35, 0.15));
    const ang = [-2.5, -0.7, 2.45, 0.7, -1.57][i];
    return <Coin key={i} r={0.15} drawKey={`sc${i}`} draw={(c, w) => avatarCoin(c, w, p)} position={[Math.cos(ang) * 0.68, Math.sin(ang) * 0.95 + 0.1, 2.3]} rotation={[0, noise(t, i) * 0.4, 0]} scale={s} edge="#ffffff" />;
  });
  const ringS = life(t, B.same + 0.05, B.streak - 0.05, 0.45, 0.2);
  const orbit = PEOPLE.map((p, i) => {
    const a = (i / 6) * Math.PI * 2 + t * 0.9;
    const s = life(t, B.same + 0.25 + i * 0.05, B.streak - 0.05, 0.3, 0.2);
    return <Coin key={i} r={0.12} drawKey={`so${i}`} draw={(c, w) => avatarCoin(c, w, p)} position={[Math.cos(a) * 0.82, Math.sin(a) * 0.25 + 0.15, 2.0 + Math.sin(a) * 0.5]} scale={s} edge="#ffffff" />;
  });

  /* ---- cloud -> streak flame ---- */
  const cloudS = inRoom ? (t < B.streak ? 1 : Math.max(0, 1 - easeIn(prog(t, B.streak, 0.3)) * 1.0)) * (1 - 0.3 * easeOut(prog(t, B.pop, 1.5))) : 0;
  const flameS = life(t, B.streak + 0.2, B.end + 0.05, 0.5, 0.2);
  const nStreak = Math.round(1 + easeOut(prog(t, B.streak + 0.3, 1.2)) * 29);

  /* ---- score cards ---- */
  const failS = life(t, 0.0, B.alone + 0.25, 0.25, 0.2);
  const failStamp = easeOut(prog(t, 0.35, 0.25));
  const passS = life(t, B.passWord - 0.1, B.end + 0.05, 0.3, 0.18);
  const passK = expoOut(prog(t, B.passWord - 0.1, 0.35));
  const passStamp = easeOut(prog(t, B.passWord + 0.15, 0.25));

  const nightAmb = 1 - day;
  return (
    <>
      <CameraRig pos={camPos} look={cl} fov={wide ? 26 : 30} />
      <ambientLight intensity={inRoom ? lerp(0.32, 0.75, day) + flash * 1.5 : 0.6} color={inRoom ? (day > 0.5 ? "#ffe2c4" : "#8090d0") : "#ffffff"} />
      <directionalLight position={[-3, 3, 2]} intensity={inRoom ? lerp(0.6, 2.6, day) + flash * 3 : 2.2} color={day > 0.5 || !inRoom ? "#ffc68a" : "#93a8ff"} />
      <directionalLight position={[3, 2, 4]} intensity={inRoom ? 0.6 + day * 0.6 : 1.6} color="#fff1e0" />

      {inRoom && (
        <>
          <Room t={t} day={day} flash={flash} bookGlow={bookGlow} bookShake={bookShake} />
          <Student {...studentPose} position={[0, -0.15 + hop, -0.6]} />
          <Cloud t={t} position={[0, 1.55, -0.55]} scale={cloudS * 0.95} dark={nightAmb} />
          <Flame t={t} position={[-0.05, 1.6, -0.7]} scale={flameS * 0.36} />
          {flameS > 0 && <FacePlane w={1.4} h={0.7} drawKey={`st${nStreak}`} draw={(c, w, h) => streakCard(c, w, h, nStreak)} position={[0.62, 1.52, -0.3]} scale={flameS * 0.62} />}
          {ledgerOn && <Mascot {...ledgerPose} position={[lX, lY, 0.45]} rotation={[0, -0.45, 0]} scale={0.42} />}
          {ledgerOn && t < B.pop + 0.8 && <Glow color="rgba(255,200,120,0.95)" size={1.8} opacity={Math.max(0, 1 - (t - B.pop) * 1.4)} position={[0.75, -0.2, 0.7]} />}
          {/* sparkles around the pop */}
          {t > B.pop && t < B.pop + 1.2 &&
            Array.from({ length: 10 }, (_, i) => {
              const k = prog(t, B.pop + i * 0.02, 1.0);
              const a = rand(i * 4.1) * Math.PI * 2;
              return <Glow key={i} color="rgba(255,226,150,0.95)" size={0.18 * (1 - k)} opacity={1 - k} position={[0.8 + Math.cos(a) * k * 0.9, -0.2 + Math.sin(a) * k * 0.7 + k * 0.2, 0.7]} />;
            })}
          <Particles t={t} color={day > 0.5 ? "#ffe2b0" : "#9fb0ff"} count={40} opacity={0.25} />
        </>
      )}

      {/* hook: the score that didn't pass */}
      <Card w={1.1} h={0.97} px={500} drawKey={`fail${failStamp.toFixed(2)}`} draw={(c, w, h) => scoreCard(c, w, h, false, failStamp)}
        position={[0.08, 0.08, 0.9]} rotation={[-0.05, -0.2, 0.05]} scale={failS * 0.5} />

      {/* features cut-away */}
      {dim > 0 && (
        <mesh position={[0, 0, 1.2]}>
          <planeGeometry args={[30, 30]} />
          <meshBasicMaterial color="#120c08" transparent opacity={dim * 0.78} depthWrite={false} />
        </mesh>
      )}
      {dim > 0 && <Glow color="rgba(255,120,50,0.9)" size={4} opacity={dim * 0.35} position={[0, 0.1, 1.4]} />}
      <Phone
        draw={(c, w, h) => (inRoomScreen ? screenRoom(c, w, h, { joined, left, pulse }) : screenStart(c, w, h, { press: pressK, elapsed: el, running }))}
        drawKey={screenKey}
        position={[0, 0.05 + (1 - easeOut(prog(t, B.hit - 0.05, 0.4))) * -1.5, 2.0 - (t > B.same ? easeIn(prog(t, B.same, 0.2)) * 4 : 0)]}
        rotation={[-0.04, noise(t * 0.5, 2) * 0.15 + (inRoomScreen ? 0.12 : -0.12), 0.02]}
        scale={phoneS}
      />
      {dim > 0 && coins}
      {ringS > 0 && (
        <group position={[0, 0.15, 2.0]} scale={ringS * 0.55} rotation={[0.12, -0.2 + (t - B.same) * 0.12, 0]}>
          <Glow color="rgba(255,110,40,0.9)" size={4} opacity={0.45} position={[0, 0, -0.5]} />
          <Ring k={easeOut(prog(t, B.same + 0.05, 0.6)) * 0.84} r={1.12} tube={0.085} color="#ff6a1f" position={[0, 0, 0]} scale={1} />
          <FacePlane w={1.7} h={1.2} drawKey={`ck${Math.floor(left)}`} draw={(c, w, h) => clockFace(c, w, h, left)} position={[0, 0, 0.02]} />
        </group>
      )}
      {orbit}

      {/* payoff: passed */}
      <Card w={1.1} h={0.97} px={500} drawKey={`pass${passStamp.toFixed(2)}`} draw={(c, w, h) => scoreCard(c, w, h, true, passStamp)}
        position={[lerp(0.2, 0.05, passK), lerp(-2.5, 0.5, passK), lerp(3, 1.6, passK)]} rotation={[lerp(-1.1, -0.04, passK), lerp(0.6, 0.1, passK), lerp(-0.3, 0.03, passK)]} scale={passS * 0.68} />
      {passS > 0 && <Glow color="rgba(52,211,153,0.9)" size={3} opacity={0.4 * passStamp} position={[0, 0.2, 1.3]} />}
      {t > B.passWord && inRoom && <Confetti t={t} t0={B.passWord + 0.1} />}

      {/* end card world */}
      {!inRoom && (
        <>
          <Mascot wave={t > B.cta - 0.2 ? easeOut(prog(t, B.cta - 0.2, 0.25)) : 0} waveT={t} cheer={t < B.cta - 0.2 ? easeOut(prog(t, B.end + 0.3, 0.25)) * (0.85 + Math.sin(t * 9) * 0.15) : 0}
            mouth={mouthFor(tl, "L", t)} happy={t < B.cta - 0.2 ? 1 : 0}
            position={[0, lerp(-5, -2.05, backOut(prog(t, B.end, 0.6), 1.3)), 0.6]} rotation={[0, noise(t * 0.6, 4) * 0.15, 0]} scale={0.92}
            squash={(() => { const l = t - (B.end + 0.38); return l > 0 && l < 0.5 ? Math.sin(l * 22) * Math.exp(-l * 8) * 0.22 : 0; })()} />
          <Confetti t={t} t0={B.end + 0.3} />
          <Glow color="rgba(255,240,210,0.9)" size={6} opacity={0.35} position={[0, -0.4, -1]} />
          <Particles t={t} color="#fff1df" opacity={0.5} />
        </>
      )}
    </>
  );
};
